import { Infrastructure, INFRASTRUCTURE_TOOLS } from './infrastructure.js';
import type { HostClient } from '../infrastructure/client.js';
import { parseAIProfile, resolveAIProfile, type RuntimeCatalog, type EffectiveAIConfig } from '../domain/ai-profile.js';
import { EventEmitter } from 'node:events';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { Engineering, ENGINEERING_TOOLS } from './engineering.js';
import { Store } from '../persistence/store.js';
import {
  COMPANY_CEILING, CEO_CAPABILITIES, DEVOPS_CAPABILITIES, CTO_DELEGATABLE, PROFILES, type Profile, assertCapabilities, assertTransition, requireThat, strictObject, textField,
  type Artifact, type AuditEvent, type Capability, type Execution, type Message, type Principal,
  type RuntimeBinding, type Task, type TaskStatus, type Worker,
} from '../domain/model.js';

export const REFERENCE_DOCUMENTS = [
  'README.md', 'docs/product/PROJECT_VISION.md', 'docs/product/AI_ORGANIZATION_MODEL.md',
  'docs/architecture/SYSTEM_ARCHITECTURE.md', 'docs/decisions/decision_004_delegated_worker_creation.md',
] as const;
export const DEFAULT_OBJECTIVE = 'Assess the three largest risks to building a reliable BotSquad multi-agent coordination system. Arrange bounded local research of the product and architecture documentation, then evaluate the evidence and report your recommendations to me. No spending, external accounts, outreach, or publishing.';
const now = () => new Date().toISOString();
const id = (kind: string) => `${kind}_${randomUUID()}`;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const terminal = (status: TaskStatus) => ['completed', 'failed', 'cancelled'].includes(status);

export interface ExecutionContext { readonly executionId: string; readonly workerId: string; readonly workspacePath: string }
export interface TaskInput { objective: string; acceptance_criteria: string; constraints: string }
interface HireInput {
  display_name: string; title: string; role: string; mission: string; capabilities: Capability[];
  delegatable_capabilities: Capability[]; lifecycle: 'persistent' | 'temporary'; justification: string;
}

export class Company extends EventEmitter {
  readonly dataDir: string;
  readonly engineering: Engineering;
  readonly infrastructure: Infrastructure;
  readonly referenceDocs: ReadonlyMap<string, string>;
  constructor(readonly store: Store, dataDir: string, repoRoot: string, readonly runtimeType = 'codex-app-server', host?: HostClient) {
    super();
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.dataDir = realpathSync(dataDir);
    mkdirSync(join(this.dataDir, 'workspaces'), { recursive: true, mode: 0o700 });
    mkdirSync(join(this.dataDir, 'artifacts'), { recursive: true, mode: 0o700 });
    this.infrastructure = new Infrastructure(this, host);
    this.engineering = new Engineering(this, realpathSync(repoRoot));
    this.referenceDocs = new Map(REFERENCE_DOCUMENTS.map(path => [path, readFileSync(join(repoRoot, path), 'utf8').slice(0, 40000)]));
    this.store.transaction(() => {
      for (const [principal, type, name] of [['human', 'human', 'Human'], ['system', 'system', 'System']]) {
        this.store.run('INSERT OR IGNORE INTO principals VALUES (?,?,?,1,?)', principal!, type!, name!, now());
      }
      if (!this.store.get("SELECT 1 FROM settings WHERE key='prompt02_profiles'")) {
        this.store.run("UPDATE workers SET capability_profile=?,delegatable_capabilities=? WHERE role='ceo'", JSON.stringify(CEO_CAPABILITIES), JSON.stringify(COMPANY_CEILING));
        this.store.run("INSERT INTO settings VALUES ('prompt02_profiles','1')");
      }
      if (!this.store.get("SELECT 1 FROM settings WHERE key='prompt04_profiles'")) {
        this.store.run("UPDATE workers SET delegatable_capabilities=? WHERE role='ceo'", JSON.stringify(COMPANY_CEILING));
        this.store.run("INSERT INTO settings VALUES ('prompt04_profiles','1')");
      }
      this.store.run("INSERT OR IGNORE INTO channels VALUES ('executive','executive','Company objectives, results and decisions')");
    });
  }
  private changed() { queueMicrotask(() => this.emit('changed')); }
  worker(workerId: string): Worker {
    const raw = this.store.get<Worker & { capability_profile: string; delegatable_capabilities: string }>('SELECT * FROM workers WHERE worker_id=?', workerId);
    requireThat(raw, 'Worker not found');
    return { ...raw, capability_profile: JSON.parse(raw.capability_profile), delegatable_capabilities: JSON.parse(raw.delegatable_capabilities) };
  }
  workers(): Worker[] { return this.store.all<{ worker_id: string }>('SELECT worker_id FROM workers ORDER BY created_at,worker_id').map(w => this.worker(w.worker_id)); }
  task(taskId: string): Task { const t = this.store.get<Task>('SELECT * FROM tasks WHERE task_id=?', taskId); requireThat(t, 'Task not found'); return t; }
  execution(executionId: string): Execution { const e = this.store.get<Execution>('SELECT * FROM executions WHERE execution_id=?', executionId); requireThat(e, 'Execution not found'); return e; }
  binding(workerId: string): RuntimeBinding | undefined { return this.store.get('SELECT * FROM runtime_bindings WHERE worker_id=?', workerId); }
  get paused(): boolean { return this.store.get<{ value: string }>("SELECT value FROM settings WHERE key='paused'")?.value === 'true'; }
  audit(type: string, actor: string, detail: object, workerId: string | null = null, taskId: string | null = null, executionId: string | null = null) {
    this.store.run('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?)', id('event'), type, actor, workerId, taskId, executionId, JSON.stringify(detail), now());
    this.changed();
  }
  initializeCEO(): Worker {
    return this.store.transaction(() => {
      const existing = this.workers().find(w => w.role === 'ceo');
      if (existing) return existing;
      const atlas = this.provision({ display_name: 'Atlas', title: 'CEO', role: 'ceo',
        mission: 'Build and coordinate useful software/product work through bounded subordinate workers. Create specialists when needed. Assign and evaluate work. Report important outcomes and blockers to the human owner.',
        capabilities: [...CEO_CAPABILITIES], delegatable_capabilities: [...COMPANY_CEILING], lifecycle: 'persistent', justification: 'Human initialized CEO' }, null);
      this.audit('ceo_initialized', 'human', { name: 'Atlas' }, atlas.worker_id);
      return atlas;
    });
  }
  initializeNix() {
    const nix = this.store.transaction(() => {
      const atlas = this.initializeCEO();
      const existing = this.workers().find(w => w.role === 'devops');
      if (existing) return existing;
      requireThat(this.workers().filter(w => w.manager_worker_id === atlas.worker_id).length < 4, 'CEO child limit reached');
      const worker = this.provision({ display_name: 'Nix', title: 'DevOps', role: 'devops', mission: 'Coordinate exact scoped worker infrastructure through trusted human approvals. No root or arbitrary shell.', capabilities: [...DEVOPS_CAPABILITIES], delegatable_capabilities: [], lifecycle: 'persistent', justification: 'Trusted human initialized Nix bootstrap' }, atlas);
      this.audit('nix_initialized', 'human', { bootstrap_exception: true }, worker.worker_id);
      return worker;
    });
    return { worker: nix, request: this.infrastructure.initializeNixRequest(nix) };
  }
  private provision(input: HireInput, manager: Worker | null): Worker {
    requireThat(this.workers().length < 8, 'Company worker limit reached');
    const workerId = id('worker'); const principalId = id('principal'); const timestamp = now();
    const workspace = join(this.dataDir, 'workspaces', workerId);
    mkdirSync(workspace, { recursive: false, mode: 0o700 });
    this.store.run('INSERT INTO principals VALUES (?,?,?,1,?)', principalId, 'bot', input.display_name, timestamp);
    this.store.run(`INSERT INTO workers (worker_id,principal_id,display_name,title,role,mission,manager_worker_id,runtime_type,workspace_path,lifecycle,status,capability_profile,delegatable_capabilities,enabled,created_by_worker_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
      workerId, principalId, input.display_name, input.title, input.role, input.mission, manager?.worker_id ?? null,
      this.runtimeType, realpathSync(workspace), input.lifecycle, 'idle', JSON.stringify(input.capabilities),
      JSON.stringify(input.delegatable_capabilities), manager?.worker_id ?? null, timestamp, timestamp);
    this.audit('worker_provisioned', manager?.principal_id ?? 'human', { justification: input.justification, capabilities: input.capabilities, lifecycle: input.lifecycle }, workerId);
    const worker = this.worker(workerId); this.infrastructure.onWorkerCreated(worker); return worker;
  }
  verifyWorkspace(worker: Worker, path = worker.workspace_path): void {
    requireThat(path === worker.workspace_path, 'Workspace identity mismatch');
    const expected = join(this.dataDir, 'workspaces', worker.worker_id);
    requireThat(path === expected && realpathSync(path) === expected, 'Workspace identity mismatch or symlink');
  }
  private verifyContext(context: ExecutionContext): { worker: Worker; execution: Execution; task: Task } {
    const execution = this.execution(context.executionId); const worker = this.worker(context.workerId); const task = this.task(execution.task_id);
    requireThat(execution.worker_id === worker.worker_id && task.assignee_worker_id === worker.worker_id, 'Execution identity mismatch');
    requireThat(execution.status === 'running' && task.status === 'working' && worker.enabled, 'Execution is not authorized to act');
    this.verifyWorkspace(worker, context.workspacePath);
    return { worker, execution, task };
  }
  private capability(worker: Worker, capability: Capability) { requireThat(worker.capability_profile.includes(capability), `Missing capability: ${capability}`); }
  setBinding(context: ExecutionContext, binding: RuntimeBinding) {
    const { worker } = this.verifyContext(context);
    requireThat(binding.worker_id === worker.worker_id && binding.runtime_type === worker.runtime_type, 'Runtime binding identity mismatch');
    this.verifyWorkspace(worker, binding.workspace_path);
    const old = this.binding(worker.worker_id);
    requireThat(!old || (old.runtime_reference === binding.runtime_reference && old.workspace_path === binding.workspace_path && old.runtime_type === binding.runtime_type && (old.thread_name ?? null) === (binding.thread_name ?? null)), 'Cannot replace an existing runtime binding implicitly');
    this.store.transaction(() => {
      this.store.run('INSERT OR IGNORE INTO runtime_bindings (worker_id,runtime_type,runtime_reference,workspace_path,created_at,thread_name) VALUES (?,?,?,?,?,?)', binding.worker_id, binding.runtime_type, binding.runtime_reference, binding.workspace_path, binding.created_at, binding.thread_name ?? null);
      requireThat(this.binding(worker.worker_id)?.runtime_reference === binding.runtime_reference, 'Runtime reference already belongs to another worker');
      this.store.run('UPDATE executions SET runtime_reference=? WHERE execution_id=?', binding.runtime_reference, context.executionId);
    });
  }
  // Only trusted operator entrypoints call this. No bot tool or actor supplied by a payload.
  updateWorkerAIProfile(workerId: string, value: unknown, catalog: RuntimeCatalog): Worker {
    const profile = parseAIProfile(value); resolveAIProfile(profile, catalog);
    return this.store.transaction(() => {
      this.worker(workerId);
      this.store.run('UPDATE workers SET ai_model=?,reasoning_effort=?,execution_priority=?,ai_profile_locked=?,updated_at=? WHERE worker_id=?',
        profile.ai_model, profile.reasoning_effort, profile.execution_priority, profile.ai_profile_locked, now(), workerId);
      this.audit('worker_ai_profile_updated', 'human', profile, workerId);
      return this.worker(workerId);
    });
  }
  recordRuntimeConfig(context: ExecutionContext, config: EffectiveAIConfig) {
    const { execution } = this.verifyContext(context);
    requireThat(execution.provenance_status === 'unresolved', 'Execution provenance already recorded');
    requireThat(config.execution_priority === execution.execution_priority, 'Execution priority changed after claim');
    for (const value of [config.model, config.reasoning_effort, config.runtime_version, config.runtime_adapter]) requireThat(typeof value === 'string' && value.length > 0 && value.length <= 150, 'Invalid runtime provenance');
    this.store.run("UPDATE executions SET model=?,reasoning_effort=?,runtime_version=?,runtime_adapter=?,provenance_status='recorded' WHERE execution_id=?", config.model, config.reasoning_effort, config.runtime_version, config.runtime_adapter, execution.execution_id);
    this.audit('runtime_configuration', 'system', config, context.workerId, execution.task_id, execution.execution_id);
  }
  sendHumanMessage(body: string): Message {
    requireThat(typeof body === 'string' && body.trim().length > 0 && body.length <= 8000, 'Invalid message');
    return this.message('human', body, null, null, null);
  }
  private message(sender: string, body: string, taskId: string | null, executionId: string | null, recipient: string | null): Message {
    const messageId = id('message');
    this.store.run("INSERT INTO messages VALUES (?,'executive',?,?,?,NULL,?,?,?)", messageId, sender, recipient, body, taskId, executionId, now());
    this.changed();
    return this.store.get<Message>('SELECT * FROM messages WHERE message_id=?', messageId)!;
  }
  assignObjective(input: TaskInput): Task {
    return this.store.transaction(() => {
      const atlas = this.initializeCEO();
      const task = this.createTask('human', atlas, input, null, /\bSquadStatus\b/i.test(input.objective) ? 'product' : 'research');
      this.message('human', input.objective, task.task_id, null, atlas.worker_id);
      return task;
    });
  }
  createTask(requester: string, worker: Worker, input: TaskInput, parent: string | null, kind: Task['kind'] = 'research', createdExecution: string | null = null): Task {
    requireThat(worker.enabled, 'Worker is disabled');
    requireThat(worker.lifecycle !== 'temporary' || !this.store.get('SELECT task_id FROM tasks WHERE assignee_worker_id=?', worker.worker_id), 'Temporary workers accept one lifetime assignment; use a persistent worker for a queue');
    const validated = strictObject(input, ['objective', 'acceptance_criteria', 'constraints']);
    const taskId = id('task'); const timestamp = now();
    this.store.run("INSERT INTO tasks (task_id,requester,assignee_worker_id,objective,acceptance_criteria,constraints,parent_task_id,status,blocking_reason,result_summary,dispatch_reason,created_at,updated_at,kind,created_execution_id) VALUES (?,?,?,?,?,?,?,'queued',NULL,NULL,'assignment',?,?,?,?)", taskId, requester, worker.worker_id,
      textField(validated, 'objective'), textField(validated, 'acceptance_criteria'), textField(validated, 'constraints'), parent, timestamp, timestamp, kind, createdExecution);
    this.audit('task_created', requester, {}, worker.worker_id, taskId);
    this.audit('task_assigned', requester, { parent_task_id: parent }, worker.worker_id, taskId);
    this.refreshWorker(worker.worker_id); this.changed();
    return this.task(taskId);
  }
  private transition(task: Task, to: TaskStatus, reason: string | null = null) {
    assertTransition(task.status, to);
    this.store.run('UPDATE tasks SET status=?,blocking_reason=?,updated_at=? WHERE task_id=? AND status=?', to, reason, now(), task.task_id, task.status);
    this.audit('task_transition', 'system', { from: task.status, to, reason }, task.assignee_worker_id, task.task_id);
  }
  private refreshWorker(workerId: string) {
    const active = this.store.get('SELECT execution_id FROM executions WHERE worker_id=? AND status=\'running\'', workerId);
    const queued = this.store.get("SELECT task_id FROM tasks WHERE assignee_worker_id=? AND status='queued'", workerId);
    this.store.run('UPDATE workers SET status=?,updated_at=? WHERE worker_id=?', active ? 'working' : queued ? 'queued' : 'idle', now(), workerId);
  }
  pause(paused: boolean) {
    this.store.transaction(() => {
      this.store.run("UPDATE settings SET value=? WHERE key='paused'", String(paused));
      this.audit(paused ? 'dispatch_paused' : 'dispatch_resumed', 'human', {});
    }); this.changed();
  }
  claimNext(maxActive = 2): { task: Task; worker: Worker; execution: Execution; context: ExecutionContext } | undefined {
    return this.store.transaction(() => {
      if (this.paused) return;
      if (this.store.get<{ n: number }>("SELECT count(*) n FROM executions WHERE status='running'")!.n >= maxActive) return;
      const task = this.store.all<Task>(`SELECT t.* FROM tasks t JOIN workers w ON w.worker_id=t.assignee_worker_id
        WHERE t.status='queued' AND w.enabled=1
        AND (t.kind!='engineering' OR (EXISTS (SELECT 1 FROM allocations a WHERE a.task_id=t.task_id AND a.status IN ('active','submitted')) AND NOT EXISTS (SELECT 1 FROM executions pe WHERE pe.task_id=t.parent_task_id AND pe.status='running'))) AND NOT EXISTS
        (SELECT 1 FROM executions e WHERE e.worker_id=w.worker_id AND e.status='running') ORDER BY CASE w.execution_priority WHEN 'critical' THEN 3 WHEN 'high' THEN 2 WHEN 'normal' THEN 1 ELSE 0 END DESC,t.created_at,t.rowid`).find(candidate => this.infrastructure.eligible(candidate));
      if (!task) return;
      const worker = this.worker(task.assignee_worker_id);
      this.transition(task, 'working');
      const executionId = id('execution');
      this.store.run("INSERT INTO executions (execution_id,task_id,worker_id,runtime_reference,status,started_at,finished_at,error,interruption_reason,execution_priority,provenance_status) VALUES (?,?,?,NULL,'running',?,NULL,NULL,NULL,?,'unresolved')", executionId, task.task_id, worker.worker_id, now(), worker.execution_priority);
      this.audit('task_claimed', 'system', { dispatch_reason: task.dispatch_reason }, worker.worker_id, task.task_id, executionId);
      this.audit('execution_started', 'system', {}, worker.worker_id, task.task_id, executionId);
      this.refreshWorker(worker.worker_id);
      return { task: this.task(task.task_id), worker: this.worker(worker.worker_id), execution: this.execution(executionId),
        context: Object.freeze({ executionId, workerId: worker.worker_id, workspacePath: worker.workspace_path }) };
    });
  }
  finish(executionId: string, outcome: { status: 'completed' | 'failed' | 'interrupted' | 'awaiting_approval'; summary?: string; error?: string }) {
    this.store.transaction(() => {
      const execution = this.execution(executionId);
      if (execution.status !== 'running') return;
      const task = this.task(execution.task_id); const worker = this.worker(execution.worker_id);
      const summary = (outcome.summary ?? '').slice(0, 20000);
      this.store.run('UPDATE executions SET status=?,finished_at=?,error=?,interruption_reason=? WHERE execution_id=?',
        outcome.status, now(), outcome.error ?? null, outcome.status === 'interrupted' ? outcome.error ?? 'Human interruption' : null, executionId);
      const children = this.children(task.task_id);
      if (outcome.status === 'completed') {
        requireThat(summary.trim(), 'Runtime returned no final result');
        // An objective that delegated work remains open until a later execution evaluates it.
        const waiting = children.some(c => c.created_execution_id === executionId) || (task.kind === 'research' && children.length > 0 && task.dispatch_reason !== 'child_results');
        if (!waiting) this.engineering.assertDeliverable(task);
        if (!this.infrastructure.finishTask(task, execution)) this.transition(task, waiting ? 'blocked' : 'completed', waiting ? 'waiting_children' : null);
        this.store.run('UPDATE tasks SET result_summary=? WHERE task_id=?', summary, task.task_id);
        this.message(worker.principal_id, summary, task.task_id, executionId, worker.manager_worker_id);
      } else {
        this.transition(task, outcome.status === 'awaiting_approval' ? 'awaiting_approval' : outcome.status === 'interrupted' ? 'blocked' : 'failed', outcome.error ?? 'Runtime stopped');
        this.message('system', `${worker.display_name}: ${outcome.error ?? outcome.status}`, task.task_id, executionId, null);
      }
      this.audit(`execution_${outcome.status}`, 'system', { error: outcome.error ?? null }, worker.worker_id, task.task_id, executionId);
      if (outcome.status === 'failed') this.audit('worker_failed', 'system', {}, worker.worker_id, task.task_id, executionId);
      if (terminal(this.task(task.task_id).status)) this.recordWake(this.task(task.task_id));
      this.settleParents(); this.refreshWorker(worker.worker_id);
      if (terminal(this.task(task.task_id).status)) this.retireTemporary(worker, task.task_id);
    }); this.changed();
  }
  private children(taskId: string): Task[] { return this.store.all('SELECT * FROM tasks WHERE parent_task_id=? ORDER BY created_at', taskId); }
  private retireTemporary(worker: Worker, taskId: string) {
    if (worker.lifecycle !== 'temporary') return;
    this.store.run('UPDATE workers SET enabled=0,updated_at=? WHERE worker_id=?', now(), worker.worker_id);
    this.infrastructure.temporaryRetirement(worker);
    this.audit('worker_retired', 'system', { reason: 'temporary_assignment_terminal' }, worker.worker_id, taskId);
  }
  private recordWake(task: Task) {
    if (!task.parent_task_id) return;
    const inserted = this.store.run('INSERT OR IGNORE INTO wake_events VALUES (?,?,?)', task.task_id, task.parent_task_id, now());
    if (inserted.changes) this.audit('child_result_received', 'system', { parent_task_id: task.parent_task_id }, task.assignee_worker_id, task.task_id);
  }
  private settleParents() {
    for (const parent of this.store.all<Task>("SELECT * FROM tasks WHERE status='blocked' AND blocking_reason='waiting_children'")) {
      const children = this.children(parent.task_id);
      if (!children.length || !children.every(c => terminal(c.status))) continue;
      this.transition(parent, 'queued');
      this.store.run("UPDATE tasks SET dispatch_reason='child_results' WHERE task_id=?", parent.task_id);
      this.audit('manager_followup_queued', 'system', { children: children.map(c => c.task_id) }, parent.assignee_worker_id, parent.task_id);
      this.refreshWorker(parent.assignee_worker_id);
    }
  }
  recover() {
    this.infrastructure.reconcile();
    this.store.transaction(() => {
      for (const e of this.store.all<Execution>("SELECT * FROM executions WHERE status='running'")) {
        this.store.run("UPDATE executions SET status='interrupted',finished_at=?,interruption_reason='application_restart' WHERE execution_id=?", now(), e.execution_id);
        const task = this.task(e.task_id);
        if (task.status === 'working') this.transition(task, 'blocked', 'Interrupted by restart. Inspect existing executions, artifacts and child tasks before retry.');
        this.audit('execution_recovered', 'system', { action: 'blocked_for_inspection', artifacts: this.artifacts(task.task_id).map(a => a.artifact_id) }, e.worker_id, e.task_id, e.execution_id);
      }
      this.engineering.recover();
      this.settleParents();
      for (const w of this.workers()) this.refreshWorker(w.worker_id);
    });
  }
  retry(taskId: string, inspected: boolean) {
    requireThat(inspected === true, 'Inspect prior attempts and artifacts before retry');
    this.store.transaction(() => {
      const task = this.task(taskId);
      requireThat(task.kind !== 'infrastructure', 'Infrastructure tasks require exact operation reconciliation, not runtime retry');
      requireThat(['blocked', 'failed', 'awaiting_approval'].includes(task.status) && task.blocking_reason !== 'waiting_children', 'Task cannot be retried');
      requireThat(!this.store.get("SELECT 1 FROM allocations WHERE task_id=? AND status='blocked'", taskId), 'Allocation requires Git inspection; automatic reactivation is unavailable');
      requireThat(this.worker(task.assignee_worker_id).enabled, 'Worker is retired; create a new objective with an enabled worker');
      if (task.parent_task_id) {
        const parent = this.task(task.parent_task_id);
        requireThat(parent.dispatch_reason !== 'child_results' && !terminal(parent.status), 'Child result has been handed back to the manager; create a new objective for further work');
      }
      requireThat(!this.children(taskId).some(t => !terminal(t.status)), 'Child work is still unresolved');
      this.transition(task, 'queued');
      if (this.children(taskId).length) this.store.run("UPDATE tasks SET dispatch_reason='child_results' WHERE task_id=?", taskId);
      this.audit('retry_requested', 'human', { inspected: true, artifacts: this.artifacts(taskId).map(a => a.artifact_id) }, task.assignee_worker_id, taskId);
      this.refreshWorker(task.assignee_worker_id);
    }); this.changed();
  }
  cancel(taskId: string) {
    this.store.transaction(() => {
      const task = this.task(taskId); requireThat(task.status !== 'working', 'Interrupt active work first');
      requireThat(!this.children(taskId).some(t => !terminal(t.status)), 'Resolve child tasks before cancelling parent');
      this.transition(task, 'cancelled'); this.recordWake(this.task(taskId)); this.settleParents(); this.refreshWorker(task.assignee_worker_id);
      this.retireTemporary(this.worker(task.assignee_worker_id), taskId);
    }); this.changed();
  }
  artifacts(taskId: string): Artifact[] { return this.store.all('SELECT * FROM artifacts WHERE task_id=? ORDER BY created_at', taskId); }
  artifactContent(artifactId: string): string {
    const artifact = this.store.get<Artifact>('SELECT * FROM artifacts WHERE artifact_id=?', artifactId);
    requireThat(artifact, 'Artifact not found');
    const expected = join(this.dataDir, 'artifacts', `${artifact.artifact_id}.md`);
    requireThat(resolve(artifact.path_or_reference) === expected && realpathSync(expected) === expected, 'Artifact path mismatch');
    const content = readFileSync(expected, 'utf8'); requireThat(digest(content) === artifact.sha256, 'Artifact integrity mismatch');
    return content;
  }
  context(context: ExecutionContext) {
    const { worker, task } = this.verifyContext(context);
    requireThat(task.kind === 'research' || !this.store.get('SELECT 1 FROM legacy_runtime_bindings WHERE worker_id=?', worker.worker_id), 'Retained Prompt 01 runtime binding has a research-only tool schema. Use a fresh BOT_DATA_DIR for engineering; implicit thread replacement is forbidden.');
    return { infrastructure: this.infrastructure.context(task), engineering: this.engineering.context(task), worker: { worker_id: worker.worker_id, display_name: worker.display_name, role: worker.role, mission: worker.mission,
      capability_profile: worker.capability_profile, delegatable_capabilities: worker.delegatable_capabilities }, task,
      children: this.children(task.task_id).map(t => ({ ...t, artifacts: this.artifacts(t.task_id).map(a => ({ ...a, content: this.artifactContent(a.artifact_id).slice(0, 20000) })) })),
      prior_artifacts: this.artifacts(task.task_id),
      messages: this.store.all<Message>('SELECT * FROM messages WHERE related_task_id=? ORDER BY created_at DESC LIMIT 8', task.task_id).reverse(),
      reference_documents: [...this.referenceDocs.keys()] };
  }
  callTool(context: ExecutionContext, callId: string, name: string, input: unknown): unknown {
    requireThat(typeof callId === 'string' && callId.length > 0 && callId.length <= 256, 'Invalid tool call ID');
    const hash = digest(JSON.stringify([name, input]));
    const perform = () => {
      const { worker, task, execution } = this.verifyContext(context);
      const receipt = this.store.get<{ request_hash: string; result: string }>('SELECT * FROM tool_receipts WHERE execution_id=? AND call_id=?', context.executionId, callId);
      if (receipt) { requireThat(receipt.request_hash === hash, 'Tool replay payload mismatch'); return JSON.parse(receipt.result); }
      const count = this.store.get<{ n: number }>('SELECT count(*) n FROM tool_receipts WHERE execution_id=?', execution.execution_id)!.n;
      requireThat(count < (task.kind === 'research' ? 32 : 64), 'Execution tool budget exceeded');
      let result: unknown;
      switch (name) {
        case 'hire_worker': {
          this.capability(worker, 'create_worker');
          const a = strictObject(input, ['display_name', 'title', 'mission', 'capabilities', 'lifecycle', 'justification', 'profile']);
          requireThat(Array.isArray(a.capabilities) && a.capabilities.every(c => typeof c === 'string'), 'Invalid capabilities');
          const capabilities = a.capabilities as Capability[];
          assertCapabilities(worker.delegatable_capabilities, COMPANY_CEILING); assertCapabilities(capabilities, worker.delegatable_capabilities);
          const profile = (a.profile ?? 'researcher') as Profile;
          requireThat(Object.hasOwn(PROFILES, profile), 'Unknown role profile');
          const allowed = worker.role === 'ceo' ? (task.kind === 'product' ? ['product_manager', 'cto'] : ['researcher']) : worker.role === 'cto' && task.kind === 'delivery' ? ['engineer', 'reviewer'] : [];
          requireThat(allowed.includes(profile), 'Disallowed role creation');
          assertCapabilities(capabilities, PROFILES[profile]);
          if (profile !== 'researcher') requireThat(PROFILES[profile].every(c => capabilities.includes(c)), 'Profile requires its complete explicit capability set');
          let depth = 0; let ancestor: Worker | undefined = worker;
          while (ancestor?.manager_worker_id) { depth++; requireThat(depth < 2, 'Hierarchy depth limit exceeded'); ancestor = this.worker(ancestor.manager_worker_id); }
          const direct = this.workers().filter(w => w.manager_worker_id === worker.worker_id);
          requireThat(direct.filter(w => w.role !== 'devops').length < 3 && direct.length < (worker.role === 'ceo' ? 4 : 3), 'Manager child limit exceeded');
          if (profile !== 'researcher') requireThat(direct.filter(w => w.role === profile).length < (profile === 'engineer' ? 2 : 1), 'Role profile count limit reached');
          const delegatable = profile === 'cto' ? [...CTO_DELEGATABLE] : [];
          assertCapabilities(delegatable, worker.delegatable_capabilities);
          requireThat(a.lifecycle === 'persistent' || a.lifecycle === 'temporary', 'Invalid lifecycle');
          const displayName = textField(a, 'display_name', 60);
          requireThat(!['human', 'system', 'atlas', 'nix'].includes(displayName.toLowerCase()), 'Reserved worker name');
          this.audit('worker_creation_requested', worker.principal_id, { name: displayName, capabilities }, worker.worker_id, task.task_id, execution.execution_id);
          result = this.provision({ display_name: displayName, title: textField(a, 'title', 100), role: profile, mission: textField(a, 'mission', 2000),
            capabilities, delegatable_capabilities: delegatable, lifecycle: a.lifecycle, justification: textField(a, 'justification', 2000) }, worker);
          break;
        }
        case 'assign_task': {
          this.capability(worker, 'create_task');
          const a = strictObject(input, ['worker_id', 'objective', 'acceptance_criteria', 'constraints']);
          const child = this.worker(textField(a, 'worker_id', 100));
          requireThat(child.manager_worker_id === worker.worker_id, 'Can only assign a direct subordinate');
          let kind: Task['kind'] = 'research';
          if (task.kind === 'product' && worker.role === 'ceo') {
            const children = this.children(task.task_id);
            requireThat(children.every(c => c.status === 'completed'), 'Complete previous product stage first');
            requireThat(!children.some(c => c.assignee_worker_id === child.worker_id), 'Product stage already assigned');
            if (child.role === 'product_manager') { requireThat(children.length === 0, 'Product specification must be first'); kind = 'spec'; }
            else { requireThat(child.role === 'cto' && children.length === 1 && children[0]?.kind === 'spec' && this.artifacts(children[0].task_id).length > 0, 'Completed product spec required before CTO assignment'); kind = 'delivery'; }
          } else {
            requireThat(task.kind === 'research' && !task.parent_task_id && task.dispatch_reason !== 'child_results', 'Prompt 01 delegation depth/review limit reached');
            requireThat(child.role === 'researcher' && this.children(task.task_id).length < 1, 'Prompt 01 permits one research assignment per objective');
          }
          result = this.createTask(worker.principal_id, child, { objective: textField(a, 'objective'), acceptance_criteria: textField(a, 'acceptance_criteria'), constraints: textField(a, 'constraints') }, task.task_id, kind, execution.execution_id);
          break;
        }
        case 'message_worker': {
          this.capability(worker, 'internal_message');
          const a = strictObject(input, ['recipient_worker_id', 'body']);
          requireThat(a.recipient_worker_id === null || typeof a.recipient_worker_id === 'string', 'Invalid recipient');
          if (a.recipient_worker_id) this.worker(a.recipient_worker_id as string);
          result = this.message(worker.principal_id, textField(a, 'body'), task.task_id, execution.execution_id, a.recipient_worker_id as string | null);
          break;
        }
        case 'list_company_status': {
          strictObject(input, []);
          result = { workers: this.workers().map(w => ({ worker_id: w.worker_id, display_name: w.display_name, title: w.title, manager_worker_id: w.manager_worker_id, status: w.status, enabled: w.enabled })),
            current_task: task, child_tasks: this.children(task.task_id), paused: this.paused };
          break;
        }
        case 'read_document': {
          this.capability(worker, 'read_workspace');
          const a = strictObject(input, ['path']); const path = textField(a, 'path', 200);
          requireThat(this.referenceDocs.has(path), 'Document is outside approved reference scope');
          result = { path, content: this.referenceDocs.get(path) }; break;
        }
        case 'submit_artifact': {
          this.capability(worker, 'write_workspace');
          const a = strictObject(input, ['description', 'content']); const content = textField(a, 'content', 20000);
          result = this.saveArtifact({ worker, task, execution }, textField(a, 'description', 500), content, task.kind === 'spec' ? 'specification' : 'report'); break;
        }
        default:
          if ((INFRASTRUCTURE_TOOLS as readonly string[]).includes(name)) { result = this.infrastructure.execute(name, input, { worker, task, execution }); break; }
          requireThat(Object.hasOwn(ENGINEERING_TOOLS, name), 'Unknown or unavailable company tool');
          result = this.engineering.execute(name as keyof typeof ENGINEERING_TOOLS, input, { worker, task, execution });
      }
      this.store.run('INSERT INTO tool_receipts VALUES (?,?,?,?)', execution.execution_id, callId, hash, JSON.stringify(result));
      this.audit('tool_completed', worker.principal_id, { tool: name, call_id: callId }, worker.worker_id, task.task_id, execution.execution_id);
      return result;
    };
    // Git/filesystem operations have durable intent rows before side effects. Never wrap
    // them in the outer receipt transaction, which could erase crash evidence.
    try { return Object.hasOwn(ENGINEERING_TOOLS, name) || (INFRASTRUCTURE_TOOLS as readonly string[]).includes(name) ? perform() : this.store.transaction(perform); }
    catch (error) {
      if (name === 'read_source' || name === 'write_source') {
        // Attribute valid sessions only; never retain rejected source content or raw paths.
        try { this.engineering.recordAccessDenied(this.verifyContext(context), name, input); } catch {}
      }
      throw error;
    }
  }
  saveArtifact(actor: { worker: Worker; task: Task; execution: Execution }, description: string, content: string, type = 'report'): Artifact {
    const { worker, task, execution } = actor;
    requireThat(content.length <= 20000 && this.artifacts(task.task_id).length < 4, 'Task artifact limit reached');
    const artifactId = id('artifact'); const path = join(this.dataDir, 'artifacts', `${artifactId}.md`);
    requireThat(realpathSync(dirname(path)) === join(this.dataDir, 'artifacts'), 'Artifact directory mismatch');
    writeFileSync(path, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    this.store.run('INSERT INTO artifacts VALUES (?,?,?,?,?,?,?,?)', artifactId, task.task_id, execution.execution_id, type, path, description, digest(content), now());
    this.audit('artifact_submitted', worker.principal_id, { artifact_id: artifactId }, worker.worker_id, task.task_id, execution.execution_id);
    return this.store.get<Artifact>('SELECT * FROM artifacts WHERE artifact_id=?', artifactId)!;
  }
  snapshot() {
    return { infrastructure: this.infrastructure.snapshot(), wake_events: this.store.all<{ source_task_id: string; parent_task_id: string; created_at: string }>('SELECT * FROM wake_events ORDER BY created_at,source_task_id'), repositories: this.engineering.repositories(), allocations: this.engineering.allocations(), submissions: this.engineering.submissions(), reviews: this.engineering.reviews(), integrations: this.engineering.integrations(), paused: this.paused, runtime_type: this.runtimeType, workers: this.workers(),
      principals: this.store.all<Principal>('SELECT * FROM principals'),
      channels: this.store.all('SELECT * FROM channels'),
      messages: this.store.all<Message>('SELECT * FROM messages ORDER BY created_at,rowid'),
      tasks: this.store.all<Task>('SELECT * FROM tasks ORDER BY created_at,rowid'),
      executions: this.store.all<Execution>('SELECT * FROM executions ORDER BY started_at,rowid'),
      artifacts: this.store.all<Artifact>('SELECT * FROM artifacts ORDER BY created_at,rowid'),
      audit: this.store.all<AuditEvent>('SELECT * FROM audit_events ORDER BY created_at,rowid'),
      bindings: this.store.all<RuntimeBinding>('SELECT * FROM runtime_bindings') };
  }
}
