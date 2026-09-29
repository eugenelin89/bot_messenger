import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixture, objective, hire, until } from './helpers.js';
import { conversationTools } from '../src/runtime/adapter.js';
import type { Worker } from '../src/domain/model.js';
import type { ConversationMessage } from '../src/domain/conversations.js';
import { Store } from '../src/persistence/store.js';
import { join } from 'node:path';
import { ClientDTOs } from '../src/client/dto.js';

type Fixture = ReturnType<typeof fixture>;
function setup(f:Fixture) {
  const task=f.company.assignObjective(objective);const claim=f.company.claimNext()!;
  const scout=f.company.callTool(claim.context,'hire','hire_worker',hire) as Worker;
  f.company.finish(claim.execution.execution_id,{status:'completed',summary:'Roster setup only; no assignment delegated.'});
  return {atlas:claim.worker,scout,task};
}
function open(f:Fixture,w:Worker,purpose='Technical discussion') {return f.company.conversations.open({worker_id:w.worker_id,purpose});}
function send(f:Fixture,c:string,body='Explain the design tradeoffs.',reply=true,key=randomUUID()) {return f.company.conversations.send({conversation_id:c,body,request_reply:reply,receipt_key:key});}
function claim(f:Fixture) {const c=f.company.claimWorkNext();assert.ok(c&&c.origin==='conversation');return c;}
function bind(f:Fixture,c:ReturnType<typeof claim>,reference=randomUUID()) {
  f.company.conversations.prepareBinding(c.context,{worker_id:c.worker.worker_id,runtime_type:c.worker.runtime_type,workspace_path:c.worker.workspace_path,runtime_reference:reference,created_at:new Date().toISOString(),thread_name:`Conversation ${c.execution.session_id}`});
  f.company.conversations.activateBinding(c.context);return reference;
}
function finish(f:Fixture,c:ReturnType<typeof claim>,summary='A substantive bounded answer.') {f.company.finish(c.execution.execution_id,{status:'completed',summary});}

test('passive messages never create tasks, requests or model work; explicit requests correlate and deduplicate',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);const before=f.company.snapshot();
  send(f,c.conversation_id,'Passive context',false);assert.equal(f.company.claimWorkNext(),undefined);
  const key=randomUUID();const input=send(f,c.conversation_id,'Question',true,key);assert.deepEqual(send(f,c.conversation_id,'Question',true,key),JSON.parse(JSON.stringify(input)));
  assert.throws(()=>send(f,c.conversation_id,'Changed',true,key),/payload/);
  const run=claim(f);bind(f,run);const response=f.company.conversations.callTool(run.context,'reply','submit_reply',{body:'Answer with evidence limits.'}) as ConversationMessage;
  assert.equal(response.response_to,input.request!.request_id);assert.equal(response.sender_principal_id,scout.principal_id);
  assert.deepEqual(f.company.conversations.callTool(run.context,'reply','submit_reply',{body:'Answer with evidence limits.'}),JSON.parse(JSON.stringify(response)));
  assert.throws(()=>f.company.conversations.callTool(run.context,'reply','submit_reply',{body:'Changed'}),/payload/);
  finish(f,run,'Final acknowledgement differs from committed reply');
  assert.equal(f.company.conversations.inspect(c.conversation_id).history.items.filter(m=>m.response_to).length,1);
  assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.snapshot().tasks.length,before.tasks.length);assert.equal(f.company.snapshot().artifacts.length,0);
});

test('conversation tools and task tools stay separate even for CEO; active scopes deny unrelated sources',async t=>{
  const f=fixture();t.after(()=>f.close());const {atlas}=setup(f);const a=open(f,atlas);const b=open(f,atlas);
  send(f,b.conversation_id,'UNRELATED_PRIVATE_SENTINEL',false);send(f,a.conversation_id);const run=claim(f);bind(f,run);
  assert.equal(JSON.stringify(f.company.conversations.context(run.context)).includes('UNRELATED_PRIVATE_SENTINEL'),false);
  for(const name of ['hire_worker','assign_task','submit_artifact','read_document','write_source','run_repo_tests','request_create_worker_identity'])assert.throws(()=>f.company.conversations.callTool(run.context,name,name,{}),/authority/);
  assert.throws(()=>f.company.callTool(run.context,'assign','assign_task',{}),/Task execution/);
  assert.throws(()=>f.company.conversations.callTool(run.context,'other','read_conversation',{conversation_id:b.conversation_id,before:null}),/scope/);
  assert.deepEqual(conversationTools().map(t=>t.name),['read_conversation','read_message','remember_context','ask_peer','submit_reply']);
  finish(f,run);assert.equal(f.company.snapshot().wake_events.length,0);
});

test('shared dispatcher respects busy workers, capacity, pause, FIFO and task binding preservation',async t=>{
  const f=fixture();t.after(()=>f.close());const {atlas,scout}=setup(f);const a=open(f,atlas);const b=open(f,scout);
  const task=f.company.createTask('human',scout,objective,null);const taskRun=f.company.claimNext()!;
  const legacy={worker_id:scout.worker_id,runtime_type:'fake',workspace_path:scout.workspace_path,runtime_reference:'legacy-task',created_at:'legacy',thread_name:'Retained legacy'};
  f.company.setBinding(taskRun.context,legacy);send(f,b.conversation_id);send(f,a.conversation_id);
  f.company.pause(true);assert.equal(f.company.claimWorkNext(),undefined);f.company.pause(false);
  const chat=claim(f);assert.equal(chat.worker.worker_id,atlas.worker_id);bind(f,chat);assert.equal(f.company.claimWorkNext(),undefined);
  assert.equal(f.company.task(task.task_id).status,'working');finish(f,chat);assert.equal(f.company.claimWorkNext(),undefined);
  f.company.finish(taskRun.execution.execution_id,{status:'completed',summary:'Task result'});const second=claim(f);assert.equal(second.worker.worker_id,scout.worker_id);bind(f,second);finish(f,second);
  assert.deepEqual({...f.company.binding(scout.worker_id)},legacy);assert.equal(f.company.task(task.task_id).status,'completed');
});

test('peer exchange reserves a bounded continuation and cannot recurse across conversations',async t=>{
  const f=fixture();t.after(()=>f.close());const {atlas,scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const first=claim(f);bind(f,first);
  const peer=f.company.conversations.callTool(first.context,'peer','ask_peer',{worker_id:atlas.worker_id,question:'What failure modes should this design consider?'}) as {conversation_id:string;request_id:string};
  assert.throws(()=>f.company.conversations.callTool(first.context,'again','ask_peer',{worker_id:atlas.worker_id,question:'Again?'}),/one peer/i);
  finish(f,first);const answer=claim(f);assert.equal(answer.worker.worker_id,atlas.worker_id);bind(f,answer);
  assert.throws(()=>f.company.conversations.callTool(answer.context,'loop','ask_peer',{worker_id:scout.worker_id,question:'Loop?'}),/budget/);
  finish(f,answer,'Consider idempotency and concurrency.');const continuation=claim(f);bind(f,continuation);assert.equal(continuation.worker.worker_id,scout.worker_id);assert.equal(continuation.request.kind,'continuation');
  assert.match(JSON.stringify(f.company.conversations.context(continuation.context)),/idempotency and concurrency/);
  finish(f,continuation);assert.equal(f.company.claimWorkNext(),undefined);
  assert.equal(f.company.conversations.inspect(peer.conversation_id).history.items.length,3);assert.equal(f.company.snapshot().tasks.length,1);
  assert.equal(f.store.get<{consumed:number}>('SELECT consumed FROM conversation_chains')!.consumed,3);
});

test('rollover preserves scoped original sources and pending work, fences stale callbacks and retains lineage',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);const firstRequest=send(f,c.conversation_id,'Agreed fact: use a monotonic sequence. Question: how to handle a gap?');
  const first=claim(f);const old=bind(f,first);finish(f,first,'Keep the gap question open until we choose a retention policy.');
  f.company.conversations.requestRollover(c.conversation_id,scout.worker_id);const pending=send(f,c.conversation_id,'Continue with the outstanding gap question.');
  const second=claim(f);assert.equal(second.execution.generation,2);const context=f.company.conversations.context(second.context);
  assert.match(JSON.stringify(context),/monotonic sequence/);assert.match(JSON.stringify(context),new RegExp(pending.request!.request_id));
  const fresh=bind(f,second);assert.notEqual(old,fresh);
  assert.throws(()=>f.company.conversations.callTool(first.context,'late','submit_reply',{body:'Stale'}),/authorized/);
  assert.throws(()=>f.company.conversations.event(first.context,'late',{}),/authorized/);
  assert.throws(()=>f.company.conversations.activateBinding(first.context),/authorized/);
  assert.equal(f.company.conversations.request(firstRequest.request!.request_id).status,'completed');finish(f,second);
  const sessions=f.company.conversations.inspect(c.conversation_id).sessions as {state:string;generation:number}[];
  assert.equal(sessions.find(s=>s.generation===1)!.state,'superseded');assert.equal(sessions.find(s=>s.generation===2)!.state,'active');
});

for(const boundary of ['creating','prepared','active','reply_committed'] as const)test(`restart at ${boundary} retains evidence, blocks ambiguity and never duplicates replies`,async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const run=claim(f);
  if(boundary!=='creating')f.company.conversations.prepareBinding(run.context,{worker_id:scout.worker_id,runtime_type:'fake',workspace_path:scout.workspace_path,runtime_reference:randomUUID(),created_at:'now',thread_name:'Crash boundary'});
  if(['active','reply_committed'].includes(boundary))f.company.conversations.activateBinding(run.context);
  if(boundary==='reply_committed')f.company.conversations.callTool(run.context,'reply','submit_reply',{body:'Committed before lost acknowledgement'});
  f.company.recover();f.company.recover();
  assert.equal(f.company.conversations.request(run.request.request_id).status,boundary==='reply_committed'?'completed':'blocked');
  assert.equal(f.company.claimWorkNext(),undefined);assert.throws(()=>f.company.conversations.callTool(run.context,'late','submit_reply',{body:'Late'}),/authorized/);
  f.company.finish(run.execution.execution_id,{status:'completed',summary:'Duplicate callback'});
  assert.equal(f.company.conversations.inspect(c.conversation_id).history.items.filter(m=>m.response_to).length,boundary==='reply_committed'?1:0);
});

test('mute/archive/cancel, participant revocation and retired workers recheck delayed work and callbacks',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);const queued=send(f,c.conversation_id);
  f.company.conversations.control(c.conversation_id,'muted');assert.equal(f.company.claimWorkNext(),undefined);assert.throws(()=>send(f,c.conversation_id),/muted/);send(f,c.conversation_id,'Passive while muted',false);
  f.company.conversations.control(c.conversation_id,'archived');assert.throws(()=>send(f,c.conversation_id,'Passive',false),/archived/);
  f.company.conversations.control(c.conversation_id,'active');f.company.conversations.cancel(queued.request!.request_id);assert.equal(f.company.claimWorkNext(),undefined);
  send(f,c.conversation_id);const run=claim(f);bind(f,run);f.company.conversations.participation(c.conversation_id,scout.principal_id,false);
  assert.throws(()=>f.company.conversations.context(run.context),/scope changed/);finish(f,run);assert.equal(f.company.conversations.request(run.request.request_id).status,'blocked');
  f.company.conversations.participation(c.conversation_id,scout.principal_id,true);send(f,c.conversation_id);f.store.run('UPDATE workers SET enabled=0 WHERE worker_id=?',scout.worker_id);assert.equal(f.company.claimWorkNext(),undefined);
});

test('Client API projections and event hints exclude private conversation executions and do not gain interrupt scope',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);const events=f.store.all('SELECT * FROM client_events');
  send(f,c.conversation_id,'PRIVATE_CHAT_SENTINEL');const run=claim(f);bind(f,run);
  const dto=new ClientDTOs(f.company,'test-hq');assert.throws(()=>dto.one('executions',run.execution.execution_id),/not found/i);
  const page=dto.page('executions',new URLSearchParams());assert.equal(JSON.stringify(page).includes(run.execution.execution_id),false);
  assert.deepEqual(f.store.all('SELECT * FROM client_events'),events);finish(f,run);assert.deepEqual(f.store.all('SELECT * FROM client_events'),events);
});

test('SQL rejects fake task ownership and mismatched conversation generations',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const run=claim(f);
  assert.throws(()=>f.store.run('UPDATE executions SET task_id=? WHERE execution_id=?','fake',run.execution.execution_id),/ownership/);
  assert.throws(()=>f.store.run("INSERT INTO executions(execution_id,worker_id,origin,status,started_at) VALUES ('invalid',?,'conversation','running','now')",scout.worker_id));
  assert.throws(()=>f.store.run('UPDATE conversation_sessions SET handoff=? WHERE session_id=?','tampered',run.execution.session_id),/provenance/);
  assert.equal(f.store.all('PRAGMA foreign_key_check').length,0);
});

test('idle interval has no runtime calls and shared dispatcher delivers a narrow conversation reply',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);f.dispatcher.start();await new Promise(r=>setTimeout(r,50));assert.equal(f.runtime.calls.length,0);
  const c=open(f,scout);send(f,c.conversation_id);await until(()=>f.company.conversations.inspect(c.conversation_id).requests[0]!.status==='completed');
  assert.equal(f.runtime.calls.length,1);assert.deepEqual(f.runtime.calls[0]!.tools,conversationTools());
  await new Promise(r=>setTimeout(r,50));assert.equal(f.runtime.calls.length,1);assert.equal(f.company.snapshot().artifacts.length,0);
});

test('source bookmarks and full original retrieval survive a history window and reject fabricated or cross-scope quotes',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);const other=open(f,scout);
  const original=send(f,c.conversation_id,'Background. '.repeat(420)+'DECISION_AT_TAIL: keep a 48-hour replay window.');
  const foreign=send(f,other.conversation_id,'PRIVATE_SOURCE',false);const first=claim(f);bind(f,first);
  assert.throws(()=>f.company.conversations.callTool(first.context,'forged','remember_context',{source_message_id:original.message.message_id,kind:'decision',quote:'A made up decision'}),/exactly/);
  assert.throws(()=>f.company.conversations.callTool(first.context,'foreign','remember_context',{source_message_id:foreign.message.message_id,kind:'fact',quote:'PRIVATE_SOURCE'}),/authorized/);
  f.company.conversations.callTool(first.context,'note','remember_context',{source_message_id:original.message.message_id,kind:'decision',quote:'DECISION_AT_TAIL: keep a 48-hour replay window.'});finish(f,first);
  for(let i=0;i<15;i++)send(f,c.conversation_id,`Later harmless discussion ${i}`,false);
  f.company.conversations.requestRollover(c.conversation_id,scout.worker_id);send(f,c.conversation_id,'Use the durable decision without inventing missing evidence.');const fresh=claim(f);bind(f,fresh);
  assert.match(JSON.stringify(f.company.conversations.context(fresh.context)),/48-hour replay window/);
  const source=f.company.conversations.callTool(fresh.context,'source','read_message',{message_id:original.message.message_id}) as ConversationMessage;
  assert.equal(source.body,original.message.body);assert.throws(()=>f.company.conversations.callTool(fresh.context,'foreign','read_message',{message_id:foreign.message.message_id}),/scope/);
});

test('peer continuation reserves queue capacity, pending metadata survives parent rollover, and revocation settles reservation',async t=>{
  const f=fixture();t.after(()=>f.close());const {atlas,scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const first=claim(f);bind(f,first);
  const peer=f.company.conversations.callTool(first.context,'peer','ask_peer',{worker_id:atlas.worker_id,question:'Review this bounded technical question.'}) as {conversation_id:string;request_id:string};
  finish(f,first);f.company.pause(true);f.company.conversations.requestRollover(c.conversation_id,scout.worker_id);send(f,c.conversation_id,'Continue while the peer question is outstanding.');
  // Hold the peer conversation, so the initiating conversation can establish its next checkpoint.
  f.company.conversations.control(peer.conversation_id,'muted');f.company.pause(false);const fresh=claim(f);bind(f,fresh);
  assert.match(JSON.stringify(f.company.conversations.context(fresh.context)),new RegExp(peer.request_id));finish(f,fresh);
  f.company.conversations.control(peer.conversation_id,'active');f.company.conversations.participation(peer.conversation_id,atlas.principal_id,false);
  assert.equal(f.company.claimWorkNext(),undefined);
  assert.equal(f.store.get<{status:string}>("SELECT status FROM conversation_requests WHERE parent_request_id=? AND kind='continuation'",peer.request_id)!.status,'blocked');
});

test('unknown provider activity blocks replacement and task dispatch instead of bypassing the shared worker boundary',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const first=claim(f);bind(f,first);
  f.company.conversations.event(first.context,'runtime_turn_starting',{context_chars:1000});f.company.recover();
  assert.throws(()=>f.company.conversations.requestRollover(c.conversation_id,scout.worker_id),/unresolved/);
  send(f,c.conversation_id,'Another explicit request');const task=f.company.createTask('human',scout,objective,null);
  assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.claimNext(),undefined);assert.equal(f.company.task(task.task_id).status,'queued');
  assert.equal(f.company.conversations.session(first.execution.session_id).unresolved,1);
});

test('queue, rate, tool and retrieval bounds remain finite without resetting consumed causal budget',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);
  for(let i=0;i<8;i++)send(f,c.conversation_id,`Question ${i}`);
  assert.throws(()=>send(f,c.conversation_id,'Overflow'),/queue is full/);const first=claim(f);bind(f,first);
  for(let i=0;i<12;i++)f.company.conversations.callTool(first.context,`read-${i}`,'read_conversation',{conversation_id:c.conversation_id,before:null});
  assert.throws(()=>f.company.conversations.callTool(first.context,'overflow','read_conversation',{conversation_id:c.conversation_id,before:null}),/tool budget/);
  const budgets=f.store.all('SELECT * FROM conversation_chains');f.company.recover();assert.deepEqual(f.store.all('SELECT * FROM conversation_chains'),budgets);
});

test('an unknown task provider attempt blocks cross-mode chat and later task dispatch after restart',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);
  const task=f.company.createTask('human',scout,objective,null);const run=f.company.claimNext()!;
  f.company.recordRuntimeEvent(run.context,'runtime_turn_starting',{runtime_reference:'task-unknown',context_chars:100});
  f.company.recover();const c=open(f,scout);const r=send(f,c.conversation_id);
  assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.conversations.request(r.request!.request_id).status,'blocked');
  assert.equal(f.company.worker(scout.worker_id).status,'blocked');assert.equal(f.company.task(task.task_id).status,'blocked');
  assert.equal(f.company.providerUnresolved(scout.worker_id),true);
});

test('confirmed empty provider completion is a visible failure, preserves effects, and never invents a reply',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);const c=open(f,scout);send(f,c.conversation_id);const run=claim(f);bind(f,run);
  f.company.conversations.event(run.context,'runtime_turn_starting',{context_chars:100});
  f.company.finish(run.execution.execution_id,{status:'completed',summary:'',settled:true});
  const r=f.company.conversations.request(run.request.request_id);assert.equal(r.status,'failed');assert.equal(r.response_message_id,null);assert.match(r.error!,/without a committed reply/);
  assert.equal(f.company.providerUnresolved(scout.worker_id),false);assert.equal(f.company.conversations.inspect(c.conversation_id).history.items.length,1);assert.equal(f.company.claimWorkNext(),undefined);
});

test('task result validation failure preserves confirmed provider settlement and permits explicit chat',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);
  f.runtime.gate=async input=>{input.event('runtime_turn_starting',{context_chars:100});return {status:'completed',settled:true,summary:'Provider finished, but this researcher did not save an artifact.'};};
  const task=f.company.createTask('human',scout,objective,null);f.dispatcher.start();
  await until(()=>f.company.task(task.task_id).status==='failed');assert.equal(f.company.providerUnresolved(scout.worker_id),false);
  const c=open(f,scout);const request=send(f,c.conversation_id);await until(()=>f.company.conversations.request(request.request!.request_id).status==='completed');
  assert.equal(f.company.snapshot().tasks.length,2);assert.equal(f.runtime.calls.length,2);
});


test('migration of a pre-intent running task preserves its record and recovery fences the bound provider',async t=>{
  const f=fixture();t.after(()=>f.close());const {scout}=setup(f);f.company.createTask('human',scout,objective,null);const run=f.company.claimNext()!;
  f.company.setBinding(run.context,{worker_id:scout.worker_id,runtime_type:'fake',runtime_reference:'retained-task-provider',workspace_path:scout.workspace_path,created_at:'original'});
  const original=f.company.execution(run.execution.execution_id);
  f.store.db.exec('DROP TABLE execution_runtime_attempts; DELETE FROM schema_migrations WHERE version=8');
  const upgraded=new Store(join(f.dir,'company.sqlite'));assert.deepEqual(upgraded.get('SELECT * FROM executions WHERE execution_id=?',original.execution_id),original);
  assert.equal(upgraded.all('SELECT * FROM execution_runtime_attempts').length,0,'Migration must not invent historical intent');upgraded.close();
  f.company.recover();assert.equal(f.company.providerUnresolved(scout.worker_id),true);
  const c=open(f,scout);send(f,c.conversation_id);assert.equal(f.company.claimWorkNext(),undefined);
  assert.equal(f.company.binding(scout.worker_id)!.runtime_reference,'retained-task-provider');
});
