import type { Store } from '../persistence/store.js';
import { requireThat } from '../domain/model.js';

export const ATTENTION_LIMIT = 200;
export const ATTENTION_CATEGORIES = ['uncertain', 'approval', 'blocked', 'failed', 'identity'] as const;
type Category = typeof ATTENTION_CATEGORIES[number];
type Destination = 'approvals'|'infrastructure'|'products'|'tasks'|'direct'|'groups'|'mandates'|'computers'|'devices'|'executions'|'research';
export interface AttentionItem {
  attention_id: string; kind: string; category: Category; source_type: string; source_id: string;
  title: string; summary: string; owner_action: string; created_at: string; updated_at: string;
  destination: Destination; destination_record_id: string; detail_record_id: string;
}
interface Identity { id: string; created: string; updated: string }

/** Local-owner read projection. SELECT only: domain inspectors may expire/clean up
 * records, so deliberately do not call them. No prose/payload is copied from storage.
 * Synchronous reads share one event-loop turn; this class owns no workflow authority. */
export function ownerAttention(db: Store, time = new Date().toISOString()) {
  requireThat(db.get("SELECT 1 FROM principals WHERE principal_id='human' AND enabled=1"), 'Human owner is disabled');
  const items = new Map<string, AttentionItem>();
  const coveredTasks = new Set<string>();
  // A coordinator fence in its current mandate-owned group also blocks the parent cycle.
  // Specialist child uncertainty must not hide an independently blocked parent.
  const coveredMandates = new Set<string>();
  const add = (row: Identity, source: string, category: Category, kind: string, title: string, summary: string,
    action: string, destination: Destination, record = row.id, detail = row.id) => {
    const key = `${source}:${row.id}`, previous = items.get(key);
    if (previous && ATTENTION_CATEGORIES.indexOf(previous.category) <= ATTENTION_CATEGORIES.indexOf(category)) return;
    items.set(key, {attention_id: key, kind, category, source_type: source, source_id: row.id, title, summary,
      owner_action: action, created_at: row.created, updated_at: row.updated, destination,
      destination_record_id: record, detail_record_id: detail});
  };

  // Effect/session state owns Computer Tasks, including retained unknown intents after cancellation.
  for (const s of db.all<Identity & {task_id:string; state:string; shutdown_confirmed:number; approval:number; unknown:number; expired:number}>(`
    SELECT s.session_id id,s.task_id,s.state,s.shutdown_confirmed,s.created_at created,
      coalesce(s.stopped_at,s.last_action_at,s.created_at) updated,
      (s.state='requested' AND json_extract(s.policy,'$.expiresAt')>?) OR
        (s.state='awaiting_approval' AND EXISTS(SELECT 1 FROM computer_intents i WHERE i.session_id=s.session_id AND i.state='pending' AND i.expires_at>?)) approval,
      json_extract(s.policy,'$.expiresAt')<=? expired,
      s.state='unknown' OR EXISTS(SELECT 1 FROM computer_intents i WHERE i.session_id=s.session_id AND i.state='unknown') unknown
    FROM computer_sessions s`, time, time, time)) {
    coveredTasks.add(s.task_id);
    if (s.unknown) add(s,'computer_session','uncertain','computer_unknown','Computer outcome uncertain',
      'A retained browser outcome requires inspection. Protected effects must not be replayed.', 'Inspect Computer Session','computers');
    else if (s.approval) add(s,'computer_session','approval','computer_approval','Computer approval required',
      'Review the exact session policy or protected request in its existing control surface.', 'Review Computer approval','computers');
    else if(s.expired && ['requested','ready'].includes(s.state))
      add(s,'computer_session','blocked','computer_authorization_expired','Computer authorization expired',
        'This unstarted session can no longer run. Inspect and cancel the Task or interrupt the ready session.', s.state==='requested'?'Inspect Task':'Inspect Computer Session',s.state==='requested'?'tasks':'computers',s.state==='requested'?s.task_id:s.id);
    else if (!s.shutdown_confirmed && !['ready','provisioning','active','awaiting_approval'].includes(s.state))
      add(s,'computer_session','blocked','computer_cleanup','Browser cleanup needs inspection',
        'Browser shutdown is unconfirmed and the reservation remains held.', 'Inspect browser cleanup','computers');
  }

  for (const a of db.all<Identity & {mandate_id:string; status:string; pending:number}>(`
    SELECT a.action_id id,a.mandate_id,a.status,a.created_at created,a.updated_at updated,
      a.status='awaiting_approval' AND a.expires_at>? AND g.revoked_at IS NULL AND g.expires_at>?
      AND m.status='active' AND m.version=a.mandate_version AND m.current_cycle_id=a.cycle_id
      AND c.state IN ('active','waiting') AND c.deadline>?
      AND NOT EXISTS(SELECT 1 FROM business_controls bc WHERE bc.action_id=a.action_id)
      AND NOT EXISTS(SELECT 1 FROM business_evidence be WHERE be.evidence_id=a.baseline_id AND be.withdrawn_at IS NOT NULL)
      AND NOT EXISTS(SELECT 1 FROM mandate_observations mo WHERE mo.mandate_id=a.mandate_id AND mo.withdrawn_at>=a.created_at)
      AND NOT EXISTS(SELECT 1 FROM business_evidence be WHERE be.mandate_id=a.mandate_id AND be.withdrawn_at>=a.created_at)
      AND EXISTS(SELECT 1 FROM executions e JOIN mandate_turns mt USING(request_id) WHERE e.execution_id=a.execution_id
        AND (e.status='running' OR (e.status='completed' AND json_extract(mt.output,'$.action_id')=a.action_id))) pending
    FROM external_actions a JOIN business_grants g USING(grant_id) JOIN mandates m ON m.mandate_id=a.mandate_id
      JOIN operating_cycles c ON c.cycle_id=a.cycle_id
    WHERE a.status IN ('awaiting_approval','outcome_unknown')`,time,time,time)) {
    if (a.status==='outcome_unknown') add(a,'external_action','uncertain','business_unknown','Business outcome uncertain',
      'A transmitted effect has no confirmed outcome. Its target remains fenced, including after stop or revocation.',
      'Inspect and reconcile','mandates',a.mandate_id);
    else if (a.pending) add(a,'external_action','approval','business_approval','Business approval required',
      'An exact proposed document action is waiting for the owner’s decision.', 'Review exact action','mandates',a.mandate_id);
  }

  for (const a of db.all<Identity & {operation_id:string; task_id:string|null}>(`
    SELECT a.approval_id id,a.operation_id,o.task_id,a.requested_at created,a.requested_at updated
    FROM approvals a JOIN protected_operations o USING(operation_id)
    WHERE a.status='pending' AND o.status='pending' AND a.expires_at>?`,time)) {
    if(a.task_id) coveredTasks.add(a.task_id);
    add(a,'infrastructure_approval','approval','infrastructure_approval','Infrastructure approval required',
      'A protected host operation is waiting for an exact owner decision.', 'Review exact approval','approvals');
  }
  for (const o of db.all<Identity & {task_id:string|null}>(`
    SELECT operation_id id,task_id,requested_at created,requested_at updated FROM protected_operations
    WHERE status='running' AND error IS NOT NULL`)) {
    if(o.task_id) coveredTasks.add(o.task_id);
    add(o,'infrastructure_operation','uncertain','infrastructure_reconciliation','Host operation needs reconciliation',
      'A consumed operation has no settled result. Inspect its retained evidence before reconciliation.',
      'Inspect infrastructure','infrastructure');
  }
  for (const a of db.all<Identity>(`
    SELECT a.approval_id id,a.requested_at created,a.requested_at updated FROM project_approvals a
    JOIN project_operations o USING(operation_id) WHERE a.status='pending' AND o.status='pending' AND a.expires_at>?`,time))
    add(a,'project_approval','approval','project_approval','Publication approval required',
      'Review the exact repository, branch and commit publication in Approvals.', 'Review exact publication','approvals');
  for (const o of db.all<Identity & {approval_id:string}>(`
    SELECT operation_id id,approval_id,requested_at created,requested_at updated FROM project_operations WHERE status='running' AND error IS NOT NULL`))
    add(o,'project_operation','uncertain','project_reconciliation','Publication outcome needs inspection',
      'The consumed publication requires inspection and reconciliation of the same operation.', 'Inspect publication','approvals',o.approval_id);
  for (const r of db.all<Identity & {project_id:string}>(`
    SELECT r.repository_id id,r.project_id,r.created_at created,r.updated_at updated FROM repositories r
    JOIN projects p USING(project_id) WHERE r.remote_state='blocked' AND p.status='active'
    AND NOT EXISTS(SELECT 1 FROM project_operations o WHERE o.repository_id=r.repository_id AND o.status IN ('pending','running'))`))
    add(r,'repository','blocked','repository_blocked','Repository remote is blocked',
      'Inspect the current remote state through the existing Project controls.', 'Inspect repository','products',r.project_id);

  // Retained provider intent is normal while a model is running. Once stopped, the
  // fence belongs to its current actionable workflow, or its original execution.
  for (const e of db.all<Identity & {task_id:string|null; conversation_id:string|null; group_id:string|null; mandate_id:string|null; parent_mandate_id:string|null; workflow_open:number}>(`
    SELECT e.execution_id id,e.started_at created,coalesce(e.finished_at,e.started_at) updated,e.task_id,
      r.conversation_id,g.group_id,m.mandate_id,pm.mandate_id parent_mandate_id,
      CASE WHEN t.status IN ('blocked','failed','awaiting_approval') THEN 1
        WHEN g.state='blocked' THEN 1 WHEN m.status IN ('active','blocked') AND c.state='blocked' THEN 1
        WHEN g.group_id IS NULL AND m.mandate_id IS NULL AND cv.state!='archived' THEN 1 ELSE 0 END workflow_open
    FROM executions e LEFT JOIN tasks t USING(task_id) LEFT JOIN conversation_requests r USING(request_id)
    LEFT JOIN conversations cv USING(conversation_id) LEFT JOIN working_groups g USING(conversation_id)
    LEFT JOIN mandate_conversations mc USING(conversation_id) LEFT JOIN mandates m USING(mandate_id)
    LEFT JOIN operating_cycles c ON c.cycle_id=m.current_cycle_id
    LEFT JOIN mandate_internal_work mw ON mw.group_id=g.group_id
    LEFT JOIN mandates pm ON pm.mandate_id=mw.mandate_id AND pm.current_cycle_id=mw.cycle_id AND pm.coordinator_id=e.worker_id
    WHERE e.status!='running' AND (EXISTS(SELECT 1 FROM execution_runtime_attempts a WHERE a.execution_id=e.execution_id AND a.unresolved=1)
      OR EXISTS(SELECT 1 FROM conversation_sessions s WHERE s.session_id=e.session_id AND s.unresolved=1
        AND NOT EXISTS(SELECT 1 FROM executions live WHERE live.session_id=s.session_id AND live.status='running')
        AND e.rowid=(SELECT max(last.rowid) FROM executions last WHERE last.session_id=s.session_id)))
    AND NOT EXISTS(SELECT 1 FROM research_operations ro WHERE ro.execution_id=e.execution_id AND ro.unresolved=1)`)) {
    if(e.task_id) coveredTasks.add(e.task_id);
    if(e.parent_mandate_id) coveredMandates.add(e.parent_mandate_id);
    const source=e.workflow_open?(e.task_id?'task':e.group_id?'working_group':e.mandate_id?'mandate':'conversation'):'execution';
    const destination:Destination=source==='task'?'tasks':source==='working_group'?'groups':source==='mandate'?'mandates':source==='conversation'?'direct':'executions';
    const id=e.workflow_open?(e.task_id??e.group_id??e.mandate_id??e.conversation_id!):e.id;
    add({...e,id},source,'uncertain','provider_unknown','Worker outcome uncertain',
      'A stopped provider attempt remains unresolved. Inspect evidence; cancellation does not clear the fence.', 'Inspect retained outcome',destination,id,e.id);
  }
  const researchGroups=new Set<string>(),researchMandates=new Set<string>(),researchConversations=new Set<string>();
  for (const r of db.all<Identity & {task_id:string|null;group_id:string|null;mandate_id:string|null;parent_mandate_id:string|null;conversation_id:string|null}>(`
    SELECT ro.operation_id id,ro.created_at created,coalesce(ro.finished_at,ro.created_at) updated,e.task_id,g.group_id,mc.mandate_id,pm.mandate_id parent_mandate_id,cr.conversation_id
    FROM research_operations ro JOIN executions e USING(execution_id)
    LEFT JOIN conversation_requests cr USING(request_id) LEFT JOIN working_groups g USING(conversation_id)
    LEFT JOIN mandate_conversations mc USING(conversation_id)
    LEFT JOIN mandate_internal_work mw ON mw.group_id=g.group_id
    LEFT JOIN mandates pm ON pm.mandate_id=mw.mandate_id AND pm.current_cycle_id=mw.cycle_id AND pm.coordinator_id=ro.worker_id
    WHERE ro.unresolved=1 AND ro.state='unknown'`)) {
    if(r.task_id) coveredTasks.add(r.task_id);
    if(r.group_id) researchGroups.add(r.group_id);
    if(r.mandate_id) researchMandates.add(r.mandate_id);
    if(r.parent_mandate_id) coveredMandates.add(r.parent_mandate_id);
    if(r.conversation_id) researchConversations.add(r.conversation_id);
    add(r,'research_operation','uncertain','research_unknown','Research outcome uncertain',
      'A retained research provider outcome fences further worker execution.', 'Inspect research outcome','research');
  }

  for (const g of db.all<Identity>("SELECT group_id id,created_at created,updated_at updated FROM working_groups WHERE state='blocked'"))
    if(!researchGroups.has(g.id)) add(g,'working_group','blocked','group_blocked','Working group is blocked',
      'Inspect the discussion and available finish or stop controls. Continuation depends on retained bounds and fences.', 'Inspect working group','groups');
  for (const m of db.all<Identity>(`
    SELECT m.mandate_id id,m.created_at created,m.updated_at updated FROM mandates m
    LEFT JOIN operating_cycles c ON c.cycle_id=m.current_cycle_id
    WHERE m.status IN ('active','blocked') AND (m.status='blocked' OR c.state='blocked')`))
    if(!researchMandates.has(m.id)&&!coveredMandates.has(m.id)) add(m,'mandate','blocked','mandate_blocked','Company cycle is blocked',
      'The current operating loop requires inspection. Use existing mandate controls; no automatic retry is implied.', 'Inspect mandate','mandates');

  for(const o of db.all<Identity & {mandate_id:string}>(`
    SELECT o.occurrence_id id,o.mandate_id,o.created_at created,o.created_at updated
    FROM review_occurrences o JOIN review_schedules s USING(schedule_id) JOIN mandates m ON m.mandate_id=o.mandate_id
    WHERE o.state='blocked' AND o.cycle_id IS NULL AND o.schedule_version=s.version
      AND s.status IN ('active','exhausted') AND m.status IN ('active','blocked')
      AND NOT EXISTS(SELECT 1 FROM operating_cycles c WHERE c.mandate_id=m.mandate_id AND c.created_at>o.created_at)`)) {
    if(!items.has(`mandate:${o.mandate_id}`)&&!researchMandates.has(o.mandate_id)&&!coveredMandates.has(o.mandate_id))
      add({...o,id:o.mandate_id},'mandate','blocked','review_blocked','Scheduled review is blocked',
        'The current scheduled occurrence could not start a cycle. Inspect its reason and existing mandate or schedule controls.',
        'Inspect blocked review','mandates',o.mandate_id,o.id);
  }

  // A direct conversation retains explicit failed obligations until cancellation.
  // New unrelated successful replies do not resolve an older request.
  for (const r of db.all<Identity & {blocked:number}>(`
    SELECT c.conversation_id id,min(r.created_at) created,max(r.updated_at) updated,
      max(r.status='blocked') blocked FROM conversations c JOIN conversation_requests r USING(conversation_id)
    WHERE c.state!='archived' AND r.status IN ('blocked','failed','interrupted')
      AND NOT EXISTS(SELECT 1 FROM working_groups g WHERE g.conversation_id=c.conversation_id)
      AND NOT EXISTS(SELECT 1 FROM mandate_conversations m WHERE m.conversation_id=c.conversation_id)
    GROUP BY c.conversation_id`))
    if(!researchConversations.has(r.id)) add(r,'conversation',r.blocked?'blocked':'failed','conversation_reply','Conversation needs inspection',
      'One or more reply requests remain unresolved. Inspect or cancel them in the conversation.', 'Inspect conversation','direct');

  for (const t of db.all<Identity & {kind:string; status:string}>(`
    SELECT t.task_id id,t.created_at created,t.updated_at updated,t.kind,t.status FROM tasks t JOIN workers w ON w.worker_id=t.assignee_worker_id
    LEFT JOIN tasks p ON p.task_id=t.parent_task_id
    WHERE t.status IN ('blocked','failed','awaiting_approval') AND w.enabled=1
      AND coalesce(t.blocking_reason,'')!='waiting_children' AND t.kind!='computer'
      AND NOT EXISTS(SELECT 1 FROM mandate_internal_work mw WHERE mw.task_id=t.task_id)
      AND (p.task_id IS NULL OR (p.status NOT IN ('completed','failed','cancelled') AND (p.dispatch_reason!='child_results' OR p.blocking_reason='waiting_children')))
      AND NOT EXISTS(SELECT 1 FROM tasks child WHERE child.parent_task_id=t.task_id AND child.status NOT IN ('completed','failed','cancelled'))
      AND NOT (coalesce(t.blocking_reason,'')='waiting_integration' AND EXISTS(SELECT 1 FROM integrations i WHERE i.delivery_task_id=t.task_id AND i.status IN ('queued','running','preparing')))`)) {
    if(coveredTasks.has(t.id)) continue;
    if(t.kind==='infrastructure') {
      const unresolved=db.get(`SELECT 1 FROM infrastructure_tasks it LEFT JOIN worker_os_identities wi ON wi.worker_id=it.target_worker_id
        LEFT JOIN worker_project_bindings pb ON pb.allocation_id=it.allocation_id JOIN workers target ON target.worker_id=it.target_worker_id
        WHERE it.task_id=? AND target.enabled=1 AND NOT EXISTS(SELECT 1 FROM protected_operations o WHERE o.task_id=it.task_id AND o.status IN ('pending','running'))
        AND CASE it.operation_type WHEN 'create_worker_identity' THEN coalesce(wi.state,'unprovisioned')='unprovisioned'
          WHEN 'disable_worker_identity' THEN wi.state='ready' WHEN 'prepare_worker_project_clone' THEN pb.state='pending'
          WHEN 'revoke_worker_project_access' THEN pb.state='ready' ELSE 0 END`,t.id);
      if(!unresolved) continue;
    }
    add(t,'task',t.status==='failed'?'failed':'blocked',t.kind==='infrastructure'?'infrastructure_task':'task',
      t.kind==='infrastructure'?'Infrastructure coordination is blocked':t.status==='failed'?'Task failed':'Task needs inspection',
      t.kind==='infrastructure'?'The requested binding remains unresolved. Inspect or cancel this coordination Task; generic retry cannot grant authority.':
        'Inspect prior attempts and child work before using the existing recovery or cancellation controls.', 'Inspect Task','tasks');
  }
  for (const d of db.all<Identity>(`
    SELECT d.device_id id,d.created_at created,d.created_at updated FROM remote_devices d JOIN client_pairings p USING(device_id)
    WHERE d.state='pending' AND p.state='claimed' AND p.expires_at>?`,time))
    add(d,'device','identity','device_confirmation','Device identity needs confirmation',
      'A claimed device is waiting for fingerprint confirmation or denial.', 'Review device identity','devices');

  const sorted=[...items.values()].sort((a,b)=>ATTENTION_CATEGORIES.indexOf(a.category)-ATTENTION_CATEGORIES.indexOf(b.category)
    || a.created_at.localeCompare(b.created_at) || a.attention_id.localeCompare(b.attention_id));
  const counts=Object.fromEntries(ATTENTION_CATEGORIES.map(c=>[c,sorted.filter(i=>i.category===c).length])) as Record<Category,number>;
  return {items:sorted.slice(0,ATTENTION_LIMIT),total:sorted.length,counts,limit:ATTENTION_LIMIT,truncated:sorted.length>ATTENTION_LIMIT,as_of:time};
}
