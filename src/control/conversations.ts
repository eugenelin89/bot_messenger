import { MANDATE_SCHEMA } from '../domain/mandates.js';
import { createHash, randomUUID } from 'node:crypto';
import type { Company, ExecutionContext } from './company.js';
import { requireThat, strictObject, textField, type ConversationExecution, type Principal, type RuntimeBinding } from '../domain/model.js';
import { CONVERSATION_LIMITS as LIMIT, CONVERSATION_SCHEMA, type Conversation, type ConversationMessage, type ConversationSession, type ReplyRequest } from '../domain/conversations.js';
import { DISCUSSION_SCHEMA, DISCUSSION_LIMITS } from '../domain/discussions.js';
import { conversationTools } from '../runtime/adapter.js';

const now = () => new Date().toISOString();
const id = (kind: string) => `${kind}_${randomUUID()}`;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const terminal = (r: ReplyRequest) => ['completed','cancelled'].includes(r.status);
export class Conversations {
  constructor(readonly company: Company) {}
  get db() { return this.company.store; }
  private audit(type: string, detail: object, worker: string | null = null, execution: string | null = null, actor = 'human') {
    this.company.audit(`conversation_${type}`, actor, detail, worker, null, execution);
  }
  human() { requireThat(this.db.get<Principal>("SELECT * FROM principals WHERE principal_id='human'")?.enabled, 'Human owner is disabled'); }
  conversation(conversationId: string): Conversation {
    const row = this.db.get<Conversation>('SELECT * FROM conversations WHERE conversation_id=?', conversationId);
    requireThat(row, 'Conversation not found'); return row;
  }
  request(requestId: string): ReplyRequest {
    const row = this.db.get<ReplyRequest>('SELECT * FROM conversation_requests WHERE request_id=?', requestId);
    requireThat(row, 'Reply request not found'); return row;
  }
  session(sessionId: string): ConversationSession {
    const row = this.db.get<ConversationSession>('SELECT * FROM conversation_sessions WHERE session_id=?', sessionId);
    requireThat(row, 'Conversation session not found'); return row;
  }
  private member(conversationId: string, principalId: string) {
    const p = this.db.get<{ worker_id: string | null }>(`SELECT p.worker_id FROM conversation_participants p JOIN principals i USING(principal_id)
      WHERE conversation_id=? AND principal_id=? AND active=1 AND i.enabled=1`, conversationId, principalId);
    requireThat(p, 'Conversation access denied');
    if (p.worker_id) {
      const worker = this.company.worker(p.worker_id);
      requireThat(worker.enabled && worker.capability_profile.includes('internal_message'), 'Participant is disabled or communication permission revoked');
    }
    return p;
  }
  private authorized(request: ReplyRequest,claimTime?:number) {
    const c = this.conversation(request.conversation_id);
    requireThat(c.state === 'active' && c.scope_version === request.scope_version, 'Conversation is held or its participant scope changed');
    this.company.discussions.authorize(request);
    this.company.investmentTeam.authorize(request);
    this.company.mandates.authorize(request,claimTime);
    this.member(c.conversation_id, request.requester_principal_id);
    this.member(c.conversation_id, this.company.worker(request.target_worker_id).principal_id);
    return c;
  }
  private create(purpose: string, principals: string[], actor: string) {
    requireThat(new Set(principals).size === 2, 'Direct conversations require two distinct participants');
    requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM conversations')!.n < 1000, 'Conversation capacity reached');
    const c = id('conversation'); const time = now();
    this.db.run("INSERT INTO conversations VALUES (?,?,'active',1,?,?,?)", c, purpose, actor, time, time);
    for (const principal of principals) {
      requireThat(this.db.get<Principal>('SELECT * FROM principals WHERE principal_id=?', principal)?.enabled, 'Participant unavailable');
      const worker = this.company.workers().find(w => w.principal_id === principal);
      requireThat(principal === 'human' || (worker?.enabled && worker.capability_profile.includes('internal_message')), 'Participant cannot communicate');
      this.db.run('INSERT INTO conversation_participants VALUES (?,?,?,1)', c, principal, worker?.worker_id ?? null);
    }
    this.audit('created', { conversation_id: c }, null, null, actor); return this.conversation(c);
  }
  open(input: unknown) {
    this.human(); const a = strictObject(input, ['worker_id','purpose']);
    return this.db.transaction(() => this.create(textField(a,'purpose',300), ['human',this.company.worker(textField(a,'worker_id',100)).principal_id], 'human'));
  }
  private message(c: string, actor: string, body: string, worker: string | null = null, execution: string | null = null, request: string | null = null, response: string | null = null) {
    const messageId = id('cmessage');
    this.db.run('INSERT INTO conversation_messages VALUES (?,?,?,?,?,?,?,?,?)', messageId,c,actor,worker,execution,body,request,response,now());
    this.audit('message', { conversation_id: c, message_id: messageId }, worker, execution, actor);
    return this.db.get<ConversationMessage>('SELECT * FROM conversation_messages WHERE message_id=?',messageId)!;
  }
  private queue(c: Conversation, message: string, target: string, actor: string, chain: string, hop: number, kind: ReplyRequest['kind'], parent: string | null = null, returnWorker: string | null = null, waitingPeer = false, discussion = false) {
    requireThat(hop <= LIMIT.chainHops, 'Causal hop budget exhausted');
    requireThat(this.db.get<{n:number}>("SELECT count(*) n FROM conversation_requests WHERE status IN ('queued','waiting_peer','replying')")!.n < LIMIT.queuedGlobal, 'Reply queue is full');
    requireThat(this.db.get<{n:number}>("SELECT count(*) n FROM conversation_requests WHERE target_worker_id=? AND status IN ('queued','waiting_peer','replying')",target)!.n < LIMIT.queuedWorker, 'Worker reply queue is full');
    const count = this.db.get<{n:number}>("SELECT count(*) n FROM conversation_requests WHERE target_worker_id=? AND created_at>?",target,new Date(Date.now()-60000).toISOString())!.n;
    requireThat(count < LIMIT.requestsPerMinute, 'Worker reply request rate exceeded');
    const requestId = id('reply'); const time = now();
    this.db.run("INSERT INTO conversation_requests VALUES (?,?,?,?,?,?,?,?,?,?,?, ?,NULL,NULL,?,?)", requestId,c.conversation_id,message,target,actor,chain,hop,kind,parent,returnWorker,waitingPeer?'waiting_peer':'queued',c.scope_version,time,time);
    if (!discussion) this.authorized(this.request(requestId));
    this.company.refreshWorker(target); this.audit('queued', { conversation_id: c.conversation_id, request_id: requestId }, target, null, actor);
    return this.request(requestId);
  }
  queueDiscussion(conversationId:string,workerId:string,_prompt:string) {
    const c=this.conversation(conversationId);requireThat(this.company.discussions.forConversation(conversationId),'Discussion conversation required');
    const message=this.db.get<{message_id:string}>('SELECT message_id FROM conversation_messages WHERE conversation_id=? ORDER BY rowid LIMIT 1',conversationId);
    requireThat(message,'Discussion charter message required');const chain=id('chain');this.db.run('INSERT INTO conversation_chains VALUES (?,1,?)',chain,now());
    return this.queue(c,message.message_id,workerId,'human',chain,0,'reply',null,null,false,true);
  }
  queueMandate(conversationId:string,workerId:string) {
    const c=this.conversation(conversationId);requireThat(this.company.mandates.forConversation(conversationId),'Mandate conversation required');
    const message=this.db.get<{message_id:string}>('SELECT message_id FROM conversation_messages WHERE conversation_id=? ORDER BY rowid LIMIT 1',conversationId)!;
    const chain=id('chain');this.db.run('INSERT INTO conversation_chains VALUES (?,1,?)',chain,now());
    return this.queue(c,message.message_id,workerId,'human',chain,0,'reply',null,null,false,true);
  }
  private direct(c:string){requireThat(!this.company.mandates.forConversation(c),'Use dedicated mandate controls');requireThat(!this.company.discussions.forConversation(c),'Use the dedicated working-group controls');}
  send(input: unknown) {
    this.human(); const a = strictObject(input,['conversation_id','body','request_reply','receipt_key']);
    const c = this.conversation(textField(a,'conversation_id',100));
    this.direct(c.conversation_id);this.member(c.conversation_id,'human');
    requireThat(c.state !== 'archived', 'Resume the archived conversation before sending');
    requireThat(typeof a.request_reply === 'boolean', 'Choose passive message or reply request');
    requireThat(!a.request_reply || c.state === 'active', 'Resume the muted conversation before requesting a reply');
    const body = textField(a,'body',LIMIT.messageChars); const key = textField(a,'receipt_key',100);
    requireThat(/^[a-zA-Z0-9_-]{16,100}$/.test(key), 'Invalid receipt key');
    return this.db.transaction(() => {
      const existing = this.db.get<{request_hash:string;result:string}>('SELECT * FROM conversation_receipts WHERE principal_id=? AND receipt_key=?','human',key);
      if (existing) { requireThat(existing.request_hash === hash(a), 'Receipt payload mismatch'); return JSON.parse(existing.result) as {message:ConversationMessage;request:ReplyRequest|null}; }
      requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM conversation_receipts')!.n<50000,'Conversation receipt capacity reached');
      requireThat(this.db.get<{n:number}>("SELECT count(*) n FROM conversation_messages WHERE sender_principal_id='human' AND created_at>?",new Date(Date.now()-60000).toISOString())!.n < LIMIT.messagesPerMinute,'Message rate exceeded');
      const message = this.message(c.conversation_id,'human',body);
      let request: ReplyRequest | null = null;
      if (a.request_reply) {
        const target = this.db.get<{worker_id:string}>('SELECT worker_id FROM conversation_participants WHERE conversation_id=? AND worker_id IS NOT NULL AND active=1',c.conversation_id);
        requireThat(target,'No eligible worker participant'); const chain = id('chain');
        this.db.run('INSERT INTO conversation_chains VALUES (?,1,?)',chain,now());
        request = this.queue(c,message.message_id,target.worker_id,'human',chain,0,'reply');
      }
      const result = {message,request}; this.db.run('INSERT INTO conversation_receipts VALUES (?,?,?,?)','human',key,hash(a),JSON.stringify(result)); return result;
    });
  }
  list(workerId?: string, before = Number.MAX_SAFE_INTEGER) {
    this.human(); requireThat(Number.isSafeInteger(before) && before>0,'Invalid conversation cursor');
    if (workerId) this.company.worker(workerId);
    const items = this.db.all<Conversation & {cursor:number}>(`SELECT c.rowid cursor,c.* FROM conversations c WHERE NOT EXISTS(SELECT 1 FROM working_groups g WHERE g.conversation_id=c.conversation_id) AND NOT EXISTS(SELECT 1 FROM mandate_conversations mc WHERE mc.conversation_id=c.conversation_id) AND c.rowid<? ${workerId ? 'AND EXISTS (SELECT 1 FROM conversation_participants p WHERE p.conversation_id=c.conversation_id AND p.worker_id=?)' : ''} ORDER BY c.rowid DESC LIMIT 31`,before,...(workerId?[workerId]:[]));
    return {items:items.slice(0,30).map(c=>({...c,participants:this.participants(c.conversation_id)})),next_cursor:items.length>30?items[29]!.cursor:null};
  }
  participants(c: string) { return this.db.all<{principal_id:string;worker_id:string|null;display_name:string;active:number}>('SELECT p.principal_id,p.worker_id,i.display_name,p.active FROM conversation_participants p JOIN principals i USING(principal_id) WHERE conversation_id=? ORDER BY p.principal_id',c); }
  history(c: string, before = Number.MAX_SAFE_INTEGER, limit: number = LIMIT.pageSize) {
    requireThat(Number.isSafeInteger(before)&&before>0&&Number.isInteger(limit)&&limit>0&&limit<=LIMIT.pageSize,'Invalid history page');
    const messages = this.db.all<ConversationMessage & {cursor:number}>('SELECT rowid cursor,* FROM conversation_messages WHERE conversation_id=? AND rowid<? ORDER BY rowid DESC LIMIT ?',c,before,limit+1);
    return {items:messages.slice(0,limit).reverse(),next_cursor:messages.length>limit?messages[limit-1]!.cursor:null};
  }
  inspect(c: string, before?: number) {
    this.human(); this.direct(c); const conversation = this.conversation(c);
    return {conversation,participants:this.participants(c),history:this.history(c,before),paused:this.company.paused,
      requests:this.db.all<ReplyRequest>('SELECT * FROM conversation_requests WHERE conversation_id=? ORDER BY rowid DESC LIMIT 50',c),
      executions:this.db.all('SELECT e.* FROM executions e JOIN conversation_requests r USING(request_id) WHERE r.conversation_id=? ORDER BY e.rowid DESC LIMIT 50',c),
      sessions:this.db.all('SELECT session_id,worker_id,generation,previous_session_id,state,reason,completed_turns,created_at,activated_at FROM conversation_sessions WHERE conversation_id=? ORDER BY rowid DESC LIMIT 20',c)};
  }
  control(c: string, state: Conversation['state']) {
    this.human(); this.direct(c); requireThat(['active','muted','archived'].includes(state),'Invalid conversation state');
    this.db.transaction(()=>{
      this.conversation(c); requireThat(!this.db.get("SELECT 1 FROM executions e JOIN conversation_requests r USING(request_id) WHERE r.conversation_id=? AND e.status='running'",c),'Interrupt active conversation work first');
      this.db.run('UPDATE conversations SET state=?,updated_at=? WHERE conversation_id=?',state,now(),c);
      this.audit('state',{conversation_id:c,state});
    });
  }
  participation(c: string, principal: string, active: boolean) {
    this.human(); this.direct(c); this.conversation(c); requireThat(typeof active==='boolean','Invalid participant state');
    this.db.transaction(()=>{
      requireThat(this.db.run('UPDATE conversation_participants SET active=? WHERE conversation_id=? AND principal_id=?',Number(active),c,principal).changes===1,'Participant not found');
      this.db.run('UPDATE conversations SET scope_version=scope_version+1,updated_at=? WHERE conversation_id=?',now(),c);
      this.audit('scope_changed',{conversation_id:c,principal_id:principal,active});
    });
  }
  cancel(requestId: string) {
    this.human(); const r=this.request(requestId); this.direct(r.conversation_id); requireThat(!terminal(r)&&r.status!=='replying','Interrupt active work first; completed replies cannot be cancelled');
    this.db.transaction(()=>{ this.db.run("UPDATE conversation_requests SET status='cancelled',updated_at=? WHERE request_id=?",now(),requestId); this.blockDelivery(requestId,'Peer request cancelled');this.company.refreshWorker(r.target_worker_id);this.audit('cancelled',{request_id:requestId},r.target_worker_id); });
  }
  requestRollover(c: string, workerId: string) {
    this.human(); this.member(c,this.company.worker(workerId).principal_id);
    requireThat(!this.db.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'",workerId),'Rollover requires an idle ownership boundary');
    requireThat(!this.company.providerUnresolved(workerId),'Prior provider outcome is unresolved; rollover is blocked for inspection');
    const session = this.db.get<ConversationSession>("SELECT * FROM conversation_sessions WHERE conversation_id=? AND worker_id=? AND state='active'",c,workerId);
    requireThat(session,'No active conversation context');
    this.db.run('UPDATE conversation_sessions SET rollover_requested=1 WHERE session_id=?',session.session_id);
    this.audit('rollover_requested',{conversation_id:c,session_id:session.session_id},workerId);
  }
  candidate() {
    for (const r of this.db.all<ReplyRequest>(`SELECT r.* FROM conversation_requests r JOIN workers w ON w.worker_id=r.target_worker_id JOIN conversations c USING(conversation_id)
      WHERE r.status='queued' AND c.state='active' AND NOT EXISTS(SELECT 1 FROM working_groups g WHERE g.conversation_id=c.conversation_id AND g.state!='active') AND NOT EXISTS(SELECT 1 FROM executions e WHERE e.worker_id=w.worker_id AND e.status='running')
      ORDER BY CASE w.execution_priority WHEN 'critical' THEN 3 WHEN 'high' THEN 2 WHEN 'normal' THEN 1 ELSE 0 END DESC,r.created_at,r.rowid`)) {
      if(this.company.mandates.held(r.conversation_id)||this.company.investmentActivity.held(r))continue;
      if(this.company.business.reserved(r.target_worker_id))continue;
      try {
        requireThat(!this.company.providerUnresolved(r.target_worker_id),'Prior provider outcome is unresolved; worker blocked for inspection');
        this.authorized(r);return r;
      } catch(error) {
        this.db.run("UPDATE conversation_requests SET status='blocked',error=?,updated_at=? WHERE request_id=?",String(error),now(),r.request_id);
        this.blockDelivery(r.request_id,'Peer participant authorization changed before dispatch');
        this.company.refreshWorker(r.target_worker_id); this.audit('blocked',{request_id:r.request_id},r.target_worker_id);
      }
    }
    return undefined;
  }
  private scope(c: string) {
    return hash(this.participants(c).map(p=>({principal:p.principal_id,active:p.active,enabled:this.db.get<Principal>('SELECT * FROM principals WHERE principal_id=?',p.principal_id)!.enabled,
      worker:p.worker_id?{enabled:this.company.worker(p.worker_id).enabled,capabilities:this.company.worker(p.worker_id).capability_profile}:null})));
  }
  private sources(r: ReplyRequest) {
    this.authorized(r);
    const recent=this.history(r.conversation_id,undefined,12).items;
    let budget=6000;
    const messages=recent.reverse().map(m=>{const body=m.body.slice(0,Math.max(0,Math.min(4000,budget)));budget-=body.length;return {message_id:m.message_id,sender_principal_id:m.sender_principal_id,body,omitted_characters:m.body.length-body.length};}).filter(m=>m.body).reverse();
    const obligations=this.db.all<ReplyRequest>("SELECT * FROM conversation_requests WHERE conversation_id=? AND status NOT IN ('completed','cancelled') ORDER BY rowid LIMIT 32",r.conversation_id).map(q=>({request_id:q.request_id,message_id:q.message_id,target_worker_id:q.target_worker_id,status:q.status,kind:q.kind,parent_request_id:q.parent_request_id}));
    const peer_deliveries=this.db.all(`SELECT d.*, continuation.status continuation_status FROM conversation_deliveries d JOIN conversation_requests continuation ON continuation.request_id=d.continuation_request_id JOIN conversation_requests peer ON peer.request_id=d.peer_request_id
      LEFT JOIN conversation_requests parent ON parent.request_id=peer.parent_request_id
      WHERE (peer.conversation_id=? OR (parent.conversation_id=? AND d.return_worker_id=?))
      AND continuation.status NOT IN ('completed','cancelled') ORDER BY d.created_at LIMIT 16`,r.conversation_id,r.conversation_id,r.target_worker_id);
    const bookmarks=this.db.all<{source_message_id:string;quote:string;kind:string}>(`SELECT n.source_message_id,n.quote,n.kind FROM conversation_notes n JOIN conversation_messages m ON m.message_id=n.source_message_id
      WHERE n.conversation_id=? AND m.conversation_id=n.conversation_id ORDER BY n.rowid LIMIT 8`,r.conversation_id);
    const original_range=this.db.get<{first_cursor:number;last_cursor:number;count:number}>('SELECT min(rowid) first_cursor,max(rowid) last_cursor,count(*) count FROM conversation_messages WHERE conversation_id=?',r.conversation_id);
    return {messages,obligations,peer_deliveries,bookmarks,original_range,source_range:{first:messages[0]?.message_id??null,last:messages.at(-1)?.message_id??null},
      omissions:'Only bounded original messages in this conversation are included. Other conversations, task histories, repository data, artifacts and approvals are omitted. Retrieve earlier messages in this conversation if needed; do not invent missing facts.'};
  }
  claim(r: ReplyRequest) {
    const claimTime=this.company.mandates.clock.now();
    const c=this.authorized(r,claimTime); this.company.discussions.beforeClaim(r); const worker=this.company.worker(r.target_worker_id);
    requireThat(r.status==='queued','Reply is not queued');
    requireThat(!this.db.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'",worker.worker_id),'Worker already active');
    requireThat(!this.company.providerUnresolved(worker.worker_id),'Prior provider outcome is unresolved');
    requireThat(!this.company.business.reserved(worker.worker_id),'Worker reserved by bounded business executor');
    let session=this.db.get<ConversationSession>("SELECT * FROM conversation_sessions WHERE worker_id=? AND conversation_id=? AND state='active'",worker.worker_id,c.conversation_id);
    const group=this.company.discussions.forConversation(c.conversation_id);
    const mandate=this.company.mandates.forConversation(c.conversation_id);
    const toolHash=hash(mandate?this.company.mandates.tools():group?this.company.discussions.toolsFor(r):conversationTools(this.company.research.enabled(worker.worker_id))); const scope=this.scope(c.conversation_id);
    const old=session;
    // Each strategic turn receives a fresh bounded checkpoint. Original observations,
    // decisions and results are retrieved from trusted mandate records, rather than
    // replaying a provider's previous tools or treating old delivery as current proof.
    const strategicCheckpoint=!!mandate&&!!session&&session.completed_turns>0;
    if (!session||strategicCheckpoint||session.rollover_requested||session.completed_turns>=LIMIT.turnsPerSession||session.input_chars>=LIMIT.inputCharsPerSession||session.scope_version!==c.scope_version||session.tool_hash!==toolHash||JSON.parse(session.handoff).scope_hash!==scope) {
      requireThat(!this.db.get("SELECT 1 FROM conversation_sessions WHERE worker_id=? AND conversation_id=? AND state IN ('creating','prepared')",worker.worker_id,c.conversation_id),'Pending handoff requires inspection');
      const generation=this.db.get<{n:number}>('SELECT coalesce(max(generation),0)+1 n FROM conversation_sessions WHERE worker_id=? AND conversation_id=?',worker.worker_id,c.conversation_id)!.n;
      const handoff={version:1,scope_hash:scope,worker:this.company.investmentTeam.identity(c.conversation_id,worker)??{worker_id:worker.worker_id,display_name:worker.display_name,role:worker.role,mission:worker.mission},conversation_id:c.conversation_id,purpose:c.purpose,
        summary:'Extractive handoff from immutable original messages; conclusions are attributed claims, not verified facts or authority. Structured requests remain authoritative.',...this.sources(r),
        disposition:'No in-flight execution at checkpoint. Pending requests retain ownership and consumed causal budgets.',constraints:'Conversation only; no assignment, filesystem, repository, infrastructure, approval or external authority.'};
      const sessionId=id('session');
      this.db.run(`INSERT INTO conversation_sessions (session_id,worker_id,conversation_id,generation,scope_version,mode,tool_schema,tool_hash,previous_session_id,state,reason,handoff,handoff_hash,handoff_version,created_at)
        VALUES (?,?,?,?,?,'conversation',?,?,?,'creating',?,?,?,1,?)`,sessionId,worker.worker_id,c.conversation_id,generation,c.scope_version,mandate?MANDATE_SCHEMA:group?(this.company.investmentTeam.schema(c.conversation_id)??DISCUSSION_SCHEMA):CONVERSATION_SCHEMA,toolHash,old?.session_id??null,
        !old?'initial_context':old.rollover_requested?'operator_requested':old.scope_version!==c.scope_version||JSON.parse(old.handoff).scope_hash!==scope?'scope_changed':strategicCheckpoint?'strategic_turn_checkpoint':'conservative_context_limit',JSON.stringify(handoff),hash(handoff),now());
      session=this.session(sessionId); this.audit('handoff_checkpoint',{session_id:sessionId,previous_session_id:old?.session_id??null,generation,source_range:handoff.source_range},worker.worker_id);
    }
    const executionId=id('execution');
    this.db.run(`INSERT INTO executions (execution_id,task_id,worker_id,status,started_at,execution_priority,provenance_status,origin,request_id,session_id,generation)
      VALUES (?,NULL,?,'running',?,?,'unresolved','conversation',?,?,?)`,executionId,worker.worker_id,now(),worker.execution_priority,r.request_id,session.session_id,session.generation);
    this.db.run("UPDATE conversation_requests SET status='replying',updated_at=? WHERE request_id=?",now(),r.request_id);
    this.company.mandates.recordScheduleDispatch(r,executionId,claimTime);
    this.company.investmentTeam.reserve(r,executionId);
    this.company.aiUsage.ensure(executionId);
    this.company.refreshWorker(worker.worker_id);this.audit('execution_started',{request_id:r.request_id,session_id:session.session_id},worker.worker_id,executionId);
    const execution=this.company.execution(executionId);requireThat(execution.origin==='conversation','Wrong execution origin');
    return {origin:'conversation' as const,request:this.request(r.request_id),worker,execution,context:Object.freeze({executionId,workerId:worker.worker_id,workspacePath:worker.workspace_path})};
  }
  verify(context: ExecutionContext) {
    const execution=this.company.execution(context.executionId);requireThat(execution.origin==='conversation','Conversation execution required');
    const worker=this.company.worker(context.workerId); const r=this.request(execution.request_id);const session=this.session(execution.session_id);
    requireThat(execution.status==='running'&&execution.worker_id===worker.worker_id&&r.target_worker_id===worker.worker_id,'Conversation execution is not authorized');
    requireThat(session.worker_id===worker.worker_id&&session.conversation_id===r.conversation_id&&session.generation===execution.generation&&['creating','prepared','active'].includes(session.state),'Superseded runtime generation');
    requireThat(!['cancelled','blocked','failed','interrupted'].includes(r.status),'Reply is no longer authorized');
    this.authorized(r);this.company.verifyWorkspace(worker,context.workspacePath);
    const group=this.company.discussions.forConversation(r.conversation_id);
    const mandate=this.company.mandates.forConversation(r.conversation_id);
    requireThat((mandate?session.tool_schema===MANDATE_SCHEMA&&session.tool_hash===hash(this.company.mandates.tools()):group?session.tool_schema===(this.company.investmentTeam.schema(r.conversation_id)??DISCUSSION_SCHEMA)&&session.tool_hash===hash(this.company.discussions.toolsFor(r)):session.tool_schema===CONVERSATION_SCHEMA&&[hash(conversationTools()),hash(conversationTools(true))].includes(session.tool_hash))&&session.scope_version===r.scope_version,'Runtime mode/schema/scope mismatch');
    const handoff=JSON.parse(session.handoff);requireThat(hash(handoff)===session.handoff_hash&&handoff.scope_hash===this.scope(r.conversation_id),'Handoff integrity or source authorization changed');
    return {execution,worker,request:r,session};
  }
  context(context: ExecutionContext) {
    const {worker,request:r,session}=this.verify(context);
    if(this.company.mandates.forConversation(r.conversation_id))return this.company.mandates.context(context);
    if(this.company.discussions.forConversation(r.conversation_id))return this.company.discussions.context(context);
    const source=this.db.get<ConversationMessage>('SELECT * FROM conversation_messages WHERE message_id=? AND conversation_id=?',r.message_id,r.conversation_id);
    requireThat(source,'Request source is unavailable');
    const result={mode:'conversation',worker:{worker_id:worker.worker_id,display_name:worker.display_name,role:worker.role,mission:worker.mission},conversation:this.conversation(r.conversation_id),participants:this.participants(r.conversation_id),
      request:r,request_message:source,causal_budget:this.db.get('SELECT consumed FROM conversation_chains WHERE chain_id=?',r.chain_id),
      handoff:session.completed_turns===0?JSON.parse(session.handoff):undefined,...(session.completed_turns===0?{}:this.sources(r)),
      peers:this.company.workers().filter(w=>w.enabled&&w.worker_id!==worker.worker_id&&w.capability_profile.includes('internal_message')).map(w=>({worker_id:w.worker_id,display_name:w.display_name,role:w.role})),
      research_authority:this.company.research.context(context),
      constraints:'Reply only. A completed reply does not request another reply. Ask at most one peer question, then finish without waiting. A bounded continuation in the peer conversation delivers its answer. Never poll.'};
    requireThat(JSON.stringify(result).length<=LIMIT.contextChars,'Authorized context exceeds bounded handoff budget');return result;
  }
  binding(context: ExecutionContext): RuntimeBinding | undefined {
    const {worker,session}=this.verify(context);if(session.state!=='active'||!session.runtime_reference)return;
    return {worker_id:worker.worker_id,runtime_type:worker.runtime_type,runtime_reference:session.runtime_reference,workspace_path:worker.workspace_path,created_at:session.created_at,thread_name:session.thread_name};
  }
  tools(context: ExecutionContext) {const {session,request}=this.verify(context);return this.company.mandates.forConversation(request.conversation_id)?this.company.mandates.tools():this.company.discussions.forConversation(request.conversation_id)?this.company.discussions.toolsFor(request):conversationTools(session.tool_hash===hash(conversationTools(true)));}
  prepareBinding(context: ExecutionContext,binding: RuntimeBinding) {
    const {worker,session}=this.verify(context);
    requireThat(binding.worker_id===worker.worker_id&&binding.runtime_type===worker.runtime_type,'Runtime owner mismatch');this.company.verifyWorkspace(worker,binding.workspace_path);
    requireThat(!this.db.get('SELECT 1 FROM runtime_bindings WHERE runtime_reference=?',binding.runtime_reference),'Conversation cannot reuse a task context');
    requireThat(!this.db.get('SELECT 1 FROM computer_contexts WHERE runtime_reference=?',binding.runtime_reference),'Conversation cannot reuse a computer context');
    requireThat(!this.db.get('SELECT 1 FROM mandate_task_sessions WHERE runtime_reference=?',binding.runtime_reference),'Conversation cannot reuse a private mandate context');
    requireThat(!this.db.get('SELECT 1 FROM research_task_sessions WHERE runtime_reference=?',binding.runtime_reference)&&!this.db.get('SELECT 1 FROM research_operations WHERE runtime_reference=?',binding.runtime_reference),'Conversation cannot reuse a research context');
    if(session.state==='active'){requireThat(session.runtime_reference===binding.runtime_reference&&session.thread_name===(binding.thread_name??null),'Cannot implicitly replace active context');return;}
    requireThat(!session.runtime_reference||session.runtime_reference===binding.runtime_reference,'Replacement context changed');
    this.db.run("UPDATE conversation_sessions SET runtime_reference=?,thread_name=?,state='prepared' WHERE session_id=?",binding.runtime_reference,binding.thread_name??null,session.session_id);
    this.audit('replacement_prepared',{session_id:session.session_id,runtime_reference:binding.runtime_reference},worker.worker_id,context.executionId);
  }
  activateBinding(context: ExecutionContext) {
    this.db.transaction(()=>{
      const {execution,worker,session}=this.verify(context);requireThat(session.runtime_reference&&['prepared','active'].includes(session.state),'Replacement is not prepared');
      if(session.state==='prepared'){
        if(session.previous_session_id)this.db.run("UPDATE conversation_sessions SET state='superseded' WHERE session_id=? AND state='active'",session.previous_session_id);
        this.db.run("UPDATE conversation_sessions SET state='active',activated_at=? WHERE session_id=?",now(),session.session_id);
        this.audit('generation_activated',{session_id:session.session_id,generation:session.generation},worker.worker_id,execution.execution_id);
      }
      this.db.run('UPDATE executions SET runtime_reference=? WHERE execution_id=?',session.runtime_reference,execution.execution_id);
    });
  }
  event(context: ExecutionContext,type: string,detail: Record<string,unknown>) {
    const {execution,session}=this.verify(context);
    if(type==='runtime_turn_starting') {
      const conversationId=this.request(execution.request_id).conversation_id;const limit=this.company.mandates.forConversation(conversationId)||this.company.discussions.forConversation(conversationId)?DISCUSSION_LIMITS.contextChars:LIMIT.contextChars;
      requireThat(Number.isSafeInteger(detail.context_chars)&&Number(detail.context_chars)>=0&&Number(detail.context_chars)<=limit,'Invalid context accounting');
      this.db.run('INSERT INTO execution_runtime_attempts VALUES (?,1)',execution.execution_id);
      this.db.run('UPDATE conversation_sessions SET input_chars=input_chars+?,unresolved=1 WHERE session_id=?',Number(detail.context_chars),session.session_id);
    }
    if(type==='runtime_usage'&&typeof detail.input_tokens==='number'&&typeof detail.context_window==='number'&&detail.context_window>0&&detail.input_tokens/detail.context_window>=0.65)
      this.db.run('UPDATE conversation_sessions SET rollover_requested=1 WHERE session_id=?',session.session_id);
    this.audit(type,detail,context.workerId,execution.execution_id,'system');
  }
  private reply(context: ExecutionContext,body: string) {
    const {execution,worker,request:r}=this.verify(context);
    this.direct(r.conversation_id);
    requireThat(body.trim().length>0,'Provider completed without a committed reply or final answer; inspect evidence and submit a new explicit request if needed');
    requireThat(body.length<=LIMIT.replyChars,'Reply output bound exceeded');
    if(r.response_message_id){const old=this.db.get<ConversationMessage>('SELECT * FROM conversation_messages WHERE message_id=?',r.response_message_id)!;requireThat(old.body===body,'Reply already committed with different content');return old;}
    const message=this.message(r.conversation_id,worker.principal_id,body,worker.worker_id,execution.execution_id,r.request_id,r.request_id);
    this.db.run("UPDATE conversation_requests SET status='completed',response_message_id=?,updated_at=? WHERE request_id=?",message.message_id,now(),r.request_id);
    if(r.kind==='peer'&&r.return_worker_id) {
      // Reserved at peer creation; continuation consumes no unreserved budget and can never ask another peer.
      const delivery=this.db.get<{continuation_request_id:string}>('SELECT continuation_request_id FROM conversation_deliveries WHERE peer_request_id=?',r.request_id);
      requireThat(delivery,'Reserved peer delivery missing');
      const continuation=this.request(delivery.continuation_request_id);
      if(continuation.status==='waiting_peer') {
        this.db.run("UPDATE conversation_requests SET status='queued',updated_at=? WHERE request_id=?",now(),continuation.request_id);
        this.db.run("UPDATE conversation_deliveries SET state='queued' WHERE peer_request_id=?",r.request_id);
        this.audit('continuation_queued',{request_id:continuation.request_id,peer_request_id:r.request_id},r.return_worker_id);
      }

    }
    return message;
  }
  private peer(context: ExecutionContext,input: unknown) {
    const {worker,request:r,execution}=this.verify(context);
    requireThat(r.kind==='reply'&&r.hop===0&&!r.response_message_id,'Peer follow-up budget exhausted');
    requireThat(!this.db.get('SELECT 1 FROM conversation_requests WHERE parent_request_id=?',r.request_id),'Only one peer question per request');
    const a=strictObject(input,['worker_id','question']);const target=this.company.worker(textField(a,'worker_id',100));requireThat(target.worker_id!==worker.worker_id,'Cannot request own reply');
    const chain=this.db.get<{consumed:number}>('SELECT consumed FROM conversation_chains WHERE chain_id=?',r.chain_id)!;
    requireThat(chain.consumed+2<=LIMIT.chainRequests,'Causal request budget exhausted');
    const question=textField(a,'question',4000);const c=this.create(`Peer question: ${worker.display_name} and ${target.display_name}`,[worker.principal_id,target.principal_id],worker.principal_id);
    const message=this.message(c.conversation_id,worker.principal_id,question,worker.worker_id,execution.execution_id);
    this.db.run('UPDATE conversation_chains SET consumed=consumed+2 WHERE chain_id=?',r.chain_id);
    const request=this.queue(c,message.message_id,target.worker_id,worker.principal_id,r.chain_id,1,'peer',r.request_id,worker.worker_id);
    const continuation=this.queue(c,message.message_id,worker.worker_id,target.principal_id,r.chain_id,2,'continuation',request.request_id,null,true);
    this.db.run("INSERT INTO conversation_deliveries VALUES (?,?,?,'waiting',NULL,?)",request.request_id,worker.worker_id,continuation.request_id,now());
    return {conversation_id:c.conversation_id,request_id:request.request_id,status:request.status,delivery:'One reserved continuation delivers the answer in the peer conversation. Now submit_reply with your own brief explanation of the question you asked and any initial reasoning, then end this turn. Do not wait or poll, and do not claim the peer has answered yet.'};
  }
  callTool(context: ExecutionContext,callId: string,name: string,input: unknown,signal?:AbortSignal) {
    const {request}=this.verify(context);if(this.company.mandates.forConversation(request.conversation_id))return this.company.mandates.callTool(context,callId,name,input,signal);if(this.company.discussions.forConversation(request.conversation_id))return this.company.discussions.callTool(context,callId,name,input);
    requireThat(!this.company.research.hasPending(context.executionId),'Await pending research before replying or using another tool.');
    requireThat(typeof callId==='string'&&callId.length>0&&callId.length<=256,'Invalid tool call ID');
    return this.db.transaction(()=>{
      this.verify(context);requireThat(conversationTools().some(t=>t.name===name),'Tool is outside conversation authority');
      requireThat(!this.db.get('SELECT 1 FROM research_operations WHERE execution_id=? AND call_id=?',context.executionId,callId),'Tool replay payload mismatch');
      const digest=hash([name,input]);const receipt=this.db.get<{request_hash:string;result:string}>('SELECT * FROM tool_receipts WHERE execution_id=? AND call_id=?',context.executionId,callId);
      if(receipt){requireThat(receipt.request_hash===digest,'Tool replay payload mismatch');return JSON.parse(receipt.result);}
      requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM tool_receipts WHERE execution_id=?',context.executionId)!.n<LIMIT.toolCalls,'Conversation tool budget exhausted');
      let result: unknown;
      if(name==='submit_reply'){const a=strictObject(input,['body']);result=this.reply(context,textField(a,'body',LIMIT.replyChars));}
      else if(name==='ask_peer')result=this.peer(context,input);
      else if(name==='read_message') {
        const a=strictObject(input,['message_id']);const {request:r}=this.verify(context);
        const message=this.db.get<ConversationMessage>('SELECT * FROM conversation_messages WHERE message_id=? AND conversation_id=?',textField(a,'message_id',100),r.conversation_id);
        requireThat(message,'Source outside active conversation scope');result=message;
      }
      else if(name==='remember_context') {
        const a=strictObject(input,['source_message_id','kind','quote']);const {request:r}=this.verify(context);
        requireThat(['fact','decision','question'].includes(String(a.kind)),'Invalid bookmark kind');
        const source=this.db.get<ConversationMessage>('SELECT * FROM conversation_messages WHERE message_id=? AND conversation_id=?',textField(a,'source_message_id',100),r.conversation_id);
        const quote=textField(a,'quote',1200);requireThat(source&&source.body.includes(quote),'Bookmark must quote an authorized original message exactly');
        const existing=this.db.get<{note_id:string}>('SELECT note_id FROM conversation_notes WHERE conversation_id=? AND source_message_id=? AND quote=?',r.conversation_id,source.message_id,quote);
        if(existing)result=existing;
        else {
          requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM conversation_notes WHERE conversation_id=?',r.conversation_id)!.n<8,'Source bookmark budget exhausted');
          const noteId=id('note');this.db.run('INSERT INTO conversation_notes VALUES (?,?,?,?,?,?,?)',noteId,r.conversation_id,source.message_id,String(a.kind),quote,context.executionId,now());result={note_id:noteId,source_message_id:source.message_id};
        }
      }
      else {
        const a=strictObject(input,['conversation_id','before']);const {request:r}=this.verify(context);
        requireThat(textField(a,'conversation_id',100)===r.conversation_id,'Source outside active conversation scope');
        requireThat(a.before===null||Number.isSafeInteger(a.before),'Invalid history cursor');
        result=this.history(r.conversation_id,a.before===null?undefined:a.before as number,1);
      }
      if(name==='read_message'||name==='read_conversation') {
        const prior=this.db.get<{n:number}>('SELECT coalesce(sum(length(result)),0) n FROM tool_receipts WHERE execution_id=?',context.executionId)!.n;
        requireThat(prior+JSON.stringify(result).length<=24000,'Conversation retrieval budget exhausted');
      }
      this.db.run('INSERT INTO tool_receipts VALUES (?,?,?,?)',context.executionId,callId,digest,JSON.stringify(result));return result;
    });
  }
  finish(execution: ConversationExecution,outcome: {status:'completed'|'failed'|'interrupted'|'awaiting_approval';summary?:string;error?:string;settled?:boolean}) {
    if(execution.status!=='running')return;
    const context={executionId:execution.execution_id,workerId:execution.worker_id,workspacePath:this.company.worker(execution.worker_id).workspace_path};
    this.db.transaction(()=>{
      let status=outcome.status;let error=outcome.error;
      try {this.verify(context);if(status==='completed'&&!this.request(execution.request_id).response_message_id)this.reply(context,outcome.summary??'');}
      catch(e){status='failed';error=String(e);}
      const r=this.request(execution.request_id);
      this.db.run('UPDATE executions SET status=?,finished_at=?,error=?,interruption_reason=? WHERE execution_id=?',status,now(),error??null,status==='interrupted'?error??'Interrupted':null,execution.execution_id);
      if(!r.response_message_id)this.db.run('UPDATE conversation_requests SET status=?,error=?,updated_at=? WHERE request_id=?',status==='interrupted'?'interrupted':outcome.settled?'failed':'blocked',error??'Provider outcome is unresolved. Inspect evidence; automatic replay is disabled.',now(),r.request_id);
      if(!r.response_message_id)this.blockDelivery(r.request_id,'Peer outcome unresolved; inspect evidence.');
      const session=this.session(execution.session_id);
      if(outcome.settled || outcome.status==='completed')this.db.run('UPDATE conversation_sessions SET unresolved=0 WHERE session_id=?',session.session_id);
      if(session.state==='active')this.db.run('UPDATE conversation_sessions SET completed_turns=completed_turns+1,input_chars=input_chars+? WHERE session_id=?',outcome.summary?.length??0,session.session_id);
      else if(['creating','prepared'].includes(session.state))this.db.run("UPDATE conversation_sessions SET state='blocked' WHERE session_id=?",session.session_id);
      this.audit('execution_finished',{request_id:r.request_id,status,error:error??null,committed_reply:!!r.response_message_id},execution.worker_id,execution.execution_id,'system');
      this.company.refreshWorker(execution.worker_id);
    });
  }
  private blockDelivery(requestId: string, reason: string) {
    const delivery=this.db.get<{continuation_request_id:string}>("SELECT continuation_request_id FROM conversation_deliveries WHERE peer_request_id=? AND state='waiting'",requestId);
    if(!delivery)return;
    this.db.run("UPDATE conversation_requests SET status='blocked',error=?,updated_at=? WHERE request_id=? AND status='waiting_peer'",reason,now(),delivery.continuation_request_id);
    this.db.run("UPDATE conversation_deliveries SET state='blocked',error=? WHERE peer_request_id=?",reason,requestId);
  }
  recover(execution: ConversationExecution) {
    this.db.run("UPDATE executions SET status='interrupted',finished_at=?,interruption_reason='application_restart' WHERE execution_id=?",now(),execution.execution_id);
    const r=this.request(execution.request_id);
    if(!r.response_message_id)this.db.run("UPDATE conversation_requests SET status='blocked',error='Provider outcome unknown after restart; inspect retained evidence. No automatic replay.',updated_at=? WHERE request_id=?",now(),r.request_id);
    if(!r.response_message_id)this.blockDelivery(r.request_id,'Peer outcome unknown after restart; no replay.');
    const session=this.session(execution.session_id);
    if(['creating','prepared'].includes(session.state)||session.unresolved)this.db.run("UPDATE conversation_sessions SET state='blocked' WHERE session_id=?",session.session_id);
    this.audit('recovered',{request_id:r.request_id,session_id:session.session_id,committed_reply:!!r.response_message_id},execution.worker_id,execution.execution_id,'system');
  }
}
