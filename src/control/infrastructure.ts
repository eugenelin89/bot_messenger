import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { requireThat, strictObject, textField, type Task, type Worker, type Execution } from '../domain/model.js';
import { canonical, hash, identityName, parseDecision, type Approval, type OSIdentity, type ProjectBinding, type ProtectedOperation, type ProtectedType } from '../domain/infrastructure.js';
import { defaultHost, verifyIdentity, type HostClient } from '../infrastructure/client.js';
import type { Company } from './company.js';
import type { Allocation } from '../domain/engineering.js';

const now = () => new Date().toISOString();
const id = (kind: string) => `${kind}_${randomUUID()}`;
type Actor = { worker: Worker; task: Task; execution: Execution };
interface InfraTask { task_id: string; target_worker_id: string; operation_type: ProtectedType; allocation_id: string | null }
export const INFRASTRUCTURE_TOOLS = ['inspect_worker_identity','inspect_host_health','request_create_worker_identity','request_disable_worker_identity','request_project_access','request_project_revocation'] as const;
export class Infrastructure {
  constructor(readonly company: Company, readonly host: HostClient = defaultHost()) {}
  private get store() { return this.company.store; }
  get linux() { return this.host.backend === 'linux'; }
  identity(workerId: string): OSIdentity {
    this.company.worker(workerId);
    return this.store.get<OSIdentity>('SELECT * FROM worker_os_identities WHERE worker_id=?', workerId) ?? {
      worker_id: workerId, backend: this.host.backend, state: 'unprovisioned', unix_username: null, uid: null, gid: null,
      home_path: null, created_at: null, disabled_at: null, provision_operation_id: null,
    };
  }
  project(allocationId: string) { return this.store.get<ProjectBinding>('SELECT * FROM worker_project_bindings WHERE allocation_id=?', allocationId); }
  clonePath(workerId: string, allocationId: string) { return join('/var/lib/botsquad-workers', identityName(workerId), 'projects', allocationId); }
  operations() { return this.store.all<ProtectedOperation>('SELECT * FROM protected_operations ORDER BY requested_at,rowid'); }
  approvals() { this.expire(); return this.store.all<Approval>('SELECT * FROM approvals ORDER BY requested_at,rowid'); }
  operation(operationId: string) { const op = this.store.get<ProtectedOperation>('SELECT * FROM protected_operations WHERE operation_id=?', operationId); requireThat(op, 'Protected operation not found'); return op; }
  private event(type: string, op: ProtectedOperation, extra: object = {}, actor = op.requester_principal_id) {
    this.company.audit(type, actor, { operation_id: op.operation_id, approval_id: op.approval_id, operation_type: op.operation_type, ...extra }, op.target_worker_id, op.task_id, op.requesting_execution_id);
  }
  private envelope(op: ProtectedOperation) {
    return canonical({ operation_id: op.operation_id, approval_id: op.approval_id, operation_type: op.operation_type, target_worker_id: op.target_worker_id,
      requester_principal_id: op.requester_principal_id, requester_worker_id: op.requester_worker_id, requesting_execution_id: op.requesting_execution_id,
      task_id: op.task_id, parameters: op.parameters, parameter_hash: op.parameter_hash, preconditions: op.preconditions, reason: op.reason, requested_at: op.requested_at });
  }
  private assertRetirable(workerId: string) {
    const worker = this.company.worker(workerId);
    requireThat(!['ceo','cto','devops'].includes(worker.role), 'Manager or Nix retirement is outside the bounded retirement workflow');
    requireThat(!this.store.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'", workerId), 'Active worker execution prevents retirement');
    requireThat(!this.store.get("SELECT 1 FROM tasks WHERE assignee_worker_id=? AND status NOT IN ('completed','failed','cancelled')", workerId), 'Resolve outstanding worker tasks before retirement');
    requireThat(!this.store.get("SELECT 1 FROM allocations WHERE worker_id=? AND status!='integrated'", workerId), 'Unintegrated engineering work prevents retirement');
    requireThat(!this.company.workers().some(w => w.manager_worker_id === workerId && w.enabled), 'Active subordinates prevent retirement');
  }
  private preconditions(type: ProtectedType, workerId: string, allocationId?: string) {
    const worker = this.company.worker(workerId); const identity = this.identity(workerId);
    requireThat(worker.enabled, 'Target worker is retired or disabled');
    if (type === 'create_worker_identity') requireThat(identity.state === 'unprovisioned', 'Worker identity is already bound');
    else requireThat(identity.state === 'ready' && identity.backend === this.host.backend, 'Worker identity must be ready on this backend');
    if (type === 'disable_worker_identity') this.assertRetirable(workerId);
    let allocation;
    if (type === 'prepare_worker_project_clone' || type === 'revoke_worker_project_access') {
      allocation = this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=? AND worker_id=?', allocationId ?? '', workerId);
      requireThat(allocation, 'Project target allocation mismatch');
      if (type === 'prepare_worker_project_clone') requireThat(allocation.status === 'pending_infrastructure' && this.project(allocation.allocation_id)?.state === 'pending', 'Project is not awaiting provisioning');
      else { this.assertRetirable(workerId); requireThat(this.project(allocation.allocation_id)?.state === 'ready', 'Project access is not ready'); }
    }
    return canonical({ worker_id: worker.worker_id, principal_id: worker.principal_id, enabled: worker.enabled, role: worker.role, lifecycle: worker.lifecycle,
      identity, allocation: allocation ?? null, project: allocation ? this.project(allocation.allocation_id) : null });
  }
  request(type: ProtectedType, workerId: string, reason: string, actor?: Actor, allocationId?: string) {
    requireThat(reason.trim().length > 0 && reason.length <= 2000, 'Invalid infrastructure reason');
    if (actor) {
      requireThat(actor.worker.role === 'devops' && actor.task.kind === 'infrastructure' && actor.worker.enabled, 'Only Nix infrastructure tasks may request protected operations');
      requireThat(this.identity(actor.worker.worker_id).state === 'ready', 'Nix requires a ready identity');
      const task = this.store.get<InfraTask>('SELECT * FROM infrastructure_tasks WHERE task_id=?', actor.task.task_id);
      requireThat(task && task.target_worker_id === workerId && task.operation_type === type && (task.allocation_id ?? undefined) === allocationId, 'Infrastructure request differs from trusted task scope');
    } else requireThat(type === 'create_worker_identity' && this.company.worker(workerId).role === 'devops', 'Only initial Nix bootstrap may bypass Nix coordination');
    const existing = this.operations().find(op => op.target_worker_id === workerId && op.operation_type === type && ['pending','running'].includes(op.status) && (JSON.parse(op.parameters).allocation_id ?? undefined) === allocationId);
    if (existing) { requireThat(existing.task_id === (actor?.task.task_id ?? null), 'Another scoped request is already pending'); return existing; }
    const preconditions = this.preconditions(type, workerId, allocationId);
    const parameters = canonical({ worker_id: workerId, ...(allocationId ? this.company.engineering.projectProvisionParameters(allocationId, type === 'prepare_worker_project_clone') : {}) });
    const operationId = id('operation'); const approvalId = id('approval'); const requested = now();
    const op: ProtectedOperation = { operation_id: operationId, approval_id: approvalId, operation_type: type, target_worker_id: workerId,
      requester_principal_id: actor?.worker.principal_id ?? 'human', requester_worker_id: actor?.worker.worker_id ?? null,
      requesting_execution_id: actor?.execution.execution_id ?? null, task_id: actor?.task.task_id ?? null,
      parameters, parameter_hash: hash(parameters), preconditions, reason, status: 'pending', requested_at: requested, result: null, error: null };
    this.store.transaction(() => {
      this.store.run('INSERT INTO protected_operations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ...Object.values(op));
      this.store.run("INSERT INTO approvals VALUES (?,?,?,'pending',?,?,NULL,NULL,NULL)", approvalId, operationId, hash(this.envelope(op)), requested, new Date(Date.now() + 60 * 60 * 1000).toISOString());
      this.event('approval_requested', op); this.event('worker_identity_requested', op);
    });
    return op;
  }
  initializeNixRequest(worker: Worker) {
    if (this.identity(worker.worker_id).state === 'unprovisioned') return this.request('create_worker_identity', worker.worker_id, 'Explicit one-time trusted human initialization of Nix; no worker credentials are copied.');
    return { worker_id: worker.worker_id, identity: this.identity(worker.worker_id) };
  }
  enqueue(workerId: string, type: ProtectedType = 'create_worker_identity', allocationId?: string) {
    const target = this.company.worker(workerId); requireThat(target.enabled, 'Worker is disabled');
    const nix = this.company.workers().find(w => w.role === 'devops' && w.enabled);
    requireThat(nix && this.identity(nix.worker_id).state === 'ready', 'Initialize and approve Nix before requesting infrastructure');
    if (type === 'create_worker_identity' && this.identity(workerId).state !== 'unprovisioned') return;
    if (type === 'disable_worker_identity') this.assertRetirable(workerId);
    const existing = this.store.get<{ task_id: string }>("SELECT i.task_id FROM infrastructure_tasks i JOIN tasks t USING(task_id) WHERE i.target_worker_id=? AND i.operation_type=? AND i.allocation_id IS ? AND t.status NOT IN ('completed','failed','cancelled')", workerId, type, allocationId ?? null);
    if (existing) return this.company.task(existing.task_id);
    const task = this.company.createTask('system', nix, { objective: `Coordinate ${type} for ${target.display_name} (${workerId}). Inspect trusted infrastructure context, request the exact typed operation with a reason, and end the turn while human approval is pending. On resumption inspect the receipt and report.`, acceptance_criteria: 'Exact scoped request, trusted human decision, durable host receipt and correct final binding.', constraints: 'No shell, no root, no direct socket, no credentials; messages are not approval.' }, null, 'infrastructure');
    this.store.run('INSERT INTO infrastructure_tasks VALUES (?,?,?,?)', task.task_id, workerId, type, allocationId ?? null);
    this.company.audit('infrastructure_task_created', 'system', { operation_type: type, allocation_id: allocationId ?? null }, workerId, task.task_id);
    return task;
  }
  onWorkerCreated(worker: Worker) {
    if (this.linux && worker.role !== 'devops' && this.company.workers().some(w => w.role === 'devops' && this.identity(w.worker_id).state === 'ready')) this.enqueue(worker.worker_id);
  }
  eligible(task: Task) {
    if (this.identity(task.assignee_worker_id).state === 'disabled') return false;
    if (task.kind === 'infrastructure') {
      if (this.identity(task.assignee_worker_id).state !== 'ready') return false;
      const infra = this.store.get<InfraTask>('SELECT * FROM infrastructure_tasks WHERE task_id=?', task.task_id);
      if (!infra) return false;
      if (infra.operation_type === 'prepare_worker_project_clone' && this.identity(infra.target_worker_id).state !== 'ready') return false;
    }
    if (!this.linux) return true;
    if (['engineering','review'].includes(task.kind) && this.identity(task.assignee_worker_id).state !== 'ready') {
      this.store.run("UPDATE tasks SET blocking_reason='Waiting for approved Linux identity' WHERE task_id=? AND status='queued'", task.task_id); return false;
    }
    if (task.kind === 'engineering') {
      const allocation = this.store.get<Allocation>('SELECT * FROM allocations WHERE task_id=?', task.task_id);
      return !!allocation && this.project(allocation.allocation_id)?.state === 'ready' && this.company.engineering.allocations().filter(a => a.repository_id === allocation.repository_id).every(a => this.project(a.allocation_id)?.state === 'ready' && this.identity(a.worker_id).state === 'ready');
    }
    return true;
  }
  context(task: Task) {
    const infra = this.store.get<InfraTask>('SELECT * FROM infrastructure_tasks WHERE task_id=?', task.task_id);
    return infra ? { ...infra, target: this.company.worker(infra.target_worker_id), identity: this.identity(infra.target_worker_id), operations: this.operations().filter(op => op.task_id === task.task_id).map(op => ({ ...op, parameters: JSON.parse(op.parameters) })) } : undefined;
  }
  execute(name: string, input: unknown, actor: Actor): unknown {
    requireThat(actor.worker.role === 'devops' && actor.task.kind === 'infrastructure' && this.identity(actor.worker.worker_id).state === 'ready', 'Only ready Nix may use infrastructure tools');
    if (name === 'inspect_host_health') { strictObject(input, []); requireThat(actor.worker.capability_profile.includes('inspect_host_health'), 'Missing DevOps capability'); return this.host.request({ type: 'inspect_host_health' }); }
    const a = strictObject(input, name === 'inspect_worker_identity' ? [] : ['reason']);
    const infra = this.store.get<InfraTask>('SELECT * FROM infrastructure_tasks WHERE task_id=?', actor.task.task_id); requireThat(infra, 'Infrastructure scope missing');
    if (name === 'inspect_worker_identity') return this.context(actor.task);
    const type = ({ request_create_worker_identity: 'create_worker_identity', request_disable_worker_identity: 'disable_worker_identity', request_project_access: 'prepare_worker_project_clone', request_project_revocation: 'revoke_worker_project_access' } as Record<string, ProtectedType>)[name];
    requireThat(type && type === infra.operation_type, 'Tool operation differs from assigned infrastructure task');
    requireThat(actor.worker.capability_profile.includes(infra.allocation_id ? 'request_project_access' : 'request_worker_identity'), 'Missing DevOps request capability');
    return this.request(type, infra.target_worker_id, textField(a, 'reason', 2000), actor, infra.allocation_id ?? undefined);
  }
  private validate(op: ProtectedOperation, approval: Approval) {
    requireThat(approval.operation_id === op.operation_id && op.approval_id === approval.approval_id && approval.envelope_hash === hash(this.envelope(op)) && op.parameter_hash === hash(op.parameters), 'Approval envelope or payload mismatch');
    const parameters = JSON.parse(op.parameters); requireThat(parameters.worker_id === op.target_worker_id, 'Approval target mismatch');
    requireThat(op.preconditions === this.preconditions(op.operation_type, op.target_worker_id, parameters.allocation_id), 'Operation preconditions changed; request a new approval');
    if (op.requester_worker_id) {
      const requester = this.company.worker(op.requester_worker_id); const execution = this.company.execution(op.requesting_execution_id!); const task = this.company.task(op.task_id!);
      requireThat(requester.enabled && requester.role === 'devops' && requester.principal_id === op.requester_principal_id && this.identity(requester.worker_id).state === 'ready', 'Requester is no longer authorized');
      requireThat(execution.worker_id === requester.worker_id && execution.task_id === task.task_id && task.assignee_worker_id === requester.worker_id && execution.status === 'completed' && task.status === 'awaiting_approval', 'Wait for Nix to finish requesting, or inspect changed task/execution');
      requireThat(!this.store.get('SELECT 1 FROM executions WHERE task_id=? AND rowid>(SELECT rowid FROM executions WHERE execution_id=?)', task.task_id, execution.execution_id), 'Requesting execution is stale');
      const infra = this.store.get<InfraTask>('SELECT * FROM infrastructure_tasks WHERE task_id=?', task.task_id);
      requireThat(infra?.target_worker_id === op.target_worker_id && infra.operation_type === op.operation_type && (infra.allocation_id ?? null) === (parameters.allocation_id ?? null), 'Task scope changed');
    }
  }
  decide(value: unknown) {
    const args = parseDecision(value); this.expire();
    const op = this.operation(args.operation_id); const approval = this.store.get<Approval>('SELECT * FROM approvals WHERE approval_id=?', args.approval_id);
    requireThat(approval && approval.operation_id === op.operation_id && op.approval_id === approval.approval_id, 'Approval does not belong to operation');
    this.store.transaction(() => {
      requireThat(approval.status === 'pending' && op.status === 'pending', 'Approval already decided, expired or consumed');
      requireThat(approval.expires_at > now(), 'Approval expired');
      if (args.decision === 'deny') {
        this.store.run("UPDATE approvals SET status='denied',decided_at=?,decided_by='human' WHERE approval_id=?", now(), approval.approval_id);
        this.store.run("UPDATE protected_operations SET status='denied',error='Human denied request' WHERE operation_id=?", op.operation_id);
        this.event('approval_denied', op, {}, 'human'); this.resolveTask(op, false); return;
      }
      this.validate(op, approval);
      this.store.run("UPDATE approvals SET status='approved',decided_at=?,decided_by='human' WHERE approval_id=?", now(), approval.approval_id);
      this.event('approval_approved', op, {}, 'human');
      this.store.run("UPDATE approvals SET status='consumed',consumed_at=? WHERE approval_id=?", now(), approval.approval_id);
      this.store.run("UPDATE protected_operations SET status='running' WHERE operation_id=?", op.operation_id);
      if (op.operation_type === 'disable_worker_identity') this.store.run('UPDATE workers SET enabled=0 WHERE worker_id=?', op.target_worker_id);
      this.event('protected_operation_started', op, {}, 'human');
    });
    if (args.decision === 'approve') this.apply(op.operation_id);
    return this.operation(op.operation_id);
  }
  private apply(operationId: string) {
    const op = this.operation(operationId);
    const approval = this.store.get<Approval>('SELECT * FROM approvals WHERE operation_id=?', operationId);
    requireThat(op.status === 'running' && approval?.status === 'consumed' && approval.envelope_hash === hash(this.envelope(op)) && op.parameter_hash === hash(op.parameters), 'Only exact consumed intent may reconcile');
    try {
      const result = this.host.request({ type: op.operation_type, operation_id: operationId, ...JSON.parse(op.parameters) });
      this.store.transaction(() => {
        if (op.operation_type === 'create_worker_identity') {
          const binding = verifyIdentity(result, op.target_worker_id, this.host.backend); requireThat(binding.state === 'ready', 'Expected ready Unix identity');
          this.store.run("INSERT INTO worker_os_identities VALUES (?,?,'ready',?,?,?,?,?,NULL,?)", op.target_worker_id, this.host.backend, binding.unix_username, binding.uid, binding.gid, binding.home_path, now(), operationId);
          this.event('worker_identity_ready', op, { uid: binding.uid, unix_username: binding.unix_username });
        } else if (op.operation_type === 'disable_worker_identity') {
          const binding = verifyIdentity(result, op.target_worker_id, this.host.backend); const existing = this.identity(op.target_worker_id);
          requireThat(binding.state === 'disabled' && binding.uid === existing.uid && binding.gid === existing.gid, 'Disable result identity mismatch');
          this.store.run("UPDATE worker_os_identities SET state='disabled',disabled_at=? WHERE worker_id=?", now(), op.target_worker_id);
          this.store.run("UPDATE worker_project_bindings SET state='revoked' WHERE worker_id=?", op.target_worker_id);
          this.event('worker_identity_disabled', op); this.event('worker_retired', op, { home_preserved: true });
        } else {
          const params = JSON.parse(op.parameters); const project = this.project(params.allocation_id);
          requireThat(project && result.worker_id === op.target_worker_id && result.allocation_id === project.allocation_id && result.path === project.path, 'Project receipt mismatch');
          const state = op.operation_type === 'prepare_worker_project_clone' ? 'ready' : 'revoked';
          this.store.run('UPDATE worker_project_bindings SET state=?,operation_id=? WHERE allocation_id=?', state, operationId, project.allocation_id);
          if (state === 'ready') this.store.run("UPDATE allocations SET status='active',updated_at=? WHERE allocation_id=? AND status='pending_infrastructure'", now(), project.allocation_id);
          this.event(state === 'ready' ? 'worker_project_access_granted' : 'worker_project_access_revoked', op);
        }
        this.store.run('INSERT INTO host_operation_receipts VALUES (?,?,?,?)', operationId, op.parameter_hash, canonical(result), now());
        this.store.run("UPDATE protected_operations SET status='completed',result=?,error=NULL WHERE operation_id=?", canonical(result), operationId);
        this.event('protected_operation_completed', op); this.resolveTask(op, true);
      });
    } catch {
      this.store.run("UPDATE protected_operations SET error='Host operation needs reconciliation; exact consumed intent retained' WHERE operation_id=? AND status='running'", operationId);
      this.event('protected_operation_failed', op, { recoverable: true });
    }
  }
  private resolveTask(op: ProtectedOperation, success: boolean) {
    if (!op.task_id) return;
    this.store.run("UPDATE tasks SET status=?,blocking_reason=?,dispatch_reason='infrastructure_result',updated_at=? WHERE task_id=? AND status='awaiting_approval'", success ? 'queued' : 'blocked', success ? null : 'Infrastructure request denied or expired; worker remains unprovisioned/blocked', now(), op.task_id);
  }
  finishTask(task: Task, execution: Execution): boolean {
    if (task.kind !== 'infrastructure') return false;
    const operations = this.operations().filter(op => op.task_id === task.task_id);
    requireThat(operations.length, 'Nix finished without a protected-operation request');
    const pending = operations.some(op => op.status === 'pending' || op.status === 'running');
    requireThat(pending || operations.some(op => op.status === 'completed'), 'Infrastructure operation did not succeed');
    if (pending) this.store.run("UPDATE tasks SET status='awaiting_approval',blocking_reason='Waiting for trusted human infrastructure approval/result',updated_at=? WHERE task_id=?", now(), task.task_id);
    else this.store.run("UPDATE tasks SET status='completed',blocking_reason=NULL,updated_at=? WHERE task_id=?", now(), task.task_id);
    this.company.audit('infrastructure_task_waiting_or_completed', 'system', { waiting: pending }, execution.worker_id, task.task_id, execution.execution_id);
    return true;
  }
  expire() {
    for (const a of this.store.all<Approval>("SELECT * FROM approvals WHERE status IN ('pending','approved') AND expires_at<=?", now())) this.store.transaction(() => {
      const op = this.operation(a.operation_id);
      this.store.run("UPDATE approvals SET status='expired' WHERE approval_id=?", a.approval_id);
      this.store.run("UPDATE protected_operations SET status='expired',error='Approval expired' WHERE operation_id=?", op.operation_id);
      this.event('approval_expired', op); this.resolveTask(op, false);
    });
  }
  reconcile() {
    this.expire(); this.processRevocations();
    for (const op of this.operations().filter(op => op.status === 'running')) { this.apply(op.operation_id); this.event('provisioner_reconciled', op); }
  }
  temporaryRetirement(worker: Worker) {
    if (this.identity(worker.worker_id).state !== 'ready') return;
    this.store.run("INSERT OR IGNORE INTO retirement_revocations VALUES (?,?,'pending',NULL,?)", id('operation'), worker.worker_id, now());
    this.company.audit('temporary_retirement_revocation_queued', 'system', { policy: 'authority_reduction_only', home_preserved: true }, worker.worker_id);
  }
  processRevocations() {
    for (const revocation of this.store.all<{ operation_id: string; worker_id: string }>("SELECT * FROM retirement_revocations WHERE state='pending'")) {
      const worker = this.company.worker(revocation.worker_id);
      if (worker.enabled || this.store.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'", worker.worker_id) || this.store.get("SELECT 1 FROM allocations WHERE worker_id=? AND status!='integrated'", worker.worker_id)) continue;
      try {
        const result = this.host.request({ type: 'disable_worker_identity', operation_id: revocation.operation_id, worker_id: worker.worker_id });
        const binding = verifyIdentity(result, worker.worker_id, this.host.backend);
        requireThat(binding.state === 'disabled' && binding.uid === this.identity(worker.worker_id).uid, 'Retirement receipt mismatch');
        this.store.transaction(() => {
          this.store.run("UPDATE worker_os_identities SET state='disabled',disabled_at=? WHERE worker_id=?", now(), worker.worker_id);
          this.store.run("UPDATE worker_project_bindings SET state='revoked' WHERE worker_id=?", worker.worker_id);
          this.store.run("UPDATE retirement_revocations SET state='completed',result=? WHERE operation_id=?", canonical(result), revocation.operation_id);
          this.company.audit('worker_identity_disabled', 'system', { operation_id: revocation.operation_id, policy: 'temporary_terminal_authority_reduction', home_preserved: true }, worker.worker_id);
        });
      } catch { /* Retained pending revocation blocks new work and reconciles on restart/operator request. */ }
    }
  }
  snapshot() {
    return { backend: this.host.backend, isolated: this.linux, identities: this.company.workers().map(w => this.identity(w.worker_id)), approvals: this.approvals(), operations: this.operations(),
      retirements: this.store.all('SELECT * FROM retirement_revocations'), projects: this.store.all<ProjectBinding>('SELECT * FROM worker_project_bindings'), tasks: this.store.all<InfraTask>('SELECT * FROM infrastructure_tasks') };
  }
}
