import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CodexRuntime, DISABLED_FEATURES } from '../src/runtime/codex.js';
import { companyTools, type RuntimeInput } from '../src/runtime/adapter.js';
import { fixture, objective } from './helpers.js';

function protocolFixture(mode: string) {
  const f = fixture(); f.company.assignObjective(objective); const claim = f.company.claimNext()!;
  const command = join(f.dir, 'mock-codex.mjs');
  writeFileSync(command, `#!${process.execPath}
import {createInterface} from 'node:readline';
if(process.argv.includes('--version')){console.log('codex-cli 0.142.4');process.exit(0)}
const mode=${JSON.stringify(mode)}, cwd=process.cwd(), features=${JSON.stringify(Object.fromEntries(DISABLED_FEATURES.map(f => [f, false])))};
const send=x=>console.log(JSON.stringify(x));let turnActive=false;
const thread={id:'thread-owned',cwd,name:(mode==='legacy-name'?'Bot Messenger: ':'BotSquad: ')+'${claim.worker.worker_id}',status:{type:'notLoaded'}};
createInterface({input:process.stdin}).on('line',line=>{
 const m=JSON.parse(line), p=m.params??{};
 if(m.method==='initialize')send({id:m.id,result:{}});
 else if(m.method==='account/read')send({id:m.id,result:{account:{type:'chatgpt'},requiresOpenaiAuth:true}});
 else if(m.method==='model/list')send({id:m.id,result:{data:[{id:'test-model',model:'test-model',isDefault:true}]}});
 else if(m.method==='config/read')send({id:m.id,result:{config:{features:mode==='unsafe-config'?{}:features,mcp_servers:{inherited:{}}}}});
 else if(m.method==='thread/read')send({id:m.id,result:{thread:{...thread,cwd:mode==='wrong-workspace'?'/tmp/wrong':cwd}}});
 else if(m.method==='thread/start'||m.method==='thread/resume'){
  if(p.config['mcp_servers.inherited.enabled']!==false)throw new Error('MCP not disabled');
  if(p.sandbox!=='read-only'||p.approvalPolicy!=='never')throw new Error('Unsafe settings');
  send({id:m.id,result:{thread,model:'test-model',approvalPolicy:'never',sandbox:{type:'readOnly',networkAccess:false}}});
 } else if(m.method==='thread/name/set')send({id:m.id,result:{}});
 else if(m.method==='turn/start'){
  if(p.environments.length!==0)throw new Error('Environment enabled');
  turnActive=true;send({method:'turn/started',params:{threadId:thread.id,turn:{id:'turn-1'}}});
  send({id:m.id,result:{turn:{id:'turn-1'}}});
  if(mode==='interrupt'||mode==='timeout')return;
  if(mode==='exit'){process.exit(2)}
  if(mode==='approval'){send({id:'approval-1',method:'item/commandExecution/requestApproval',params:{threadId:thread.id,turnId:'turn-1'}});return;}
  send({id:'tool-1',method:'item/tool/call',params:{threadId:mode==='forged-thread'?'other-thread':thread.id,turnId:'turn-1',callId:'call-1',namespace:null,tool:'list_company_status',arguments:{}}});
 } else if(m.id==='tool-1'){
  send({method:'item/completed',params:{threadId:thread.id,turnId:'turn-1',item:{type:'agentMessage',phase:'final_answer',text:'Protocol result'}}});
  send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'turn-1',status:'completed'}}});
 } else if(m.method==='turn/interrupt'){
  send({id:m.id,result:{}});if(turnActive)send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'turn-1',status:'interrupted'}}});
 }
});`, { mode: 0o700 });
  let calls = 0; const events: string[] = [];
  const input: RuntimeInput = { ...claim, worker: { ...claim.worker, runtime_type: 'codex-app-server' }, context: f.company.context(claim.context), tools: companyTools(claim.worker),
    bind: () => {}, callTool: () => { calls++; return { ok: true }; }, event: type => events.push(type) };
  return { ...f, input, command, events, callCount: () => calls };
}

test('App Server transport routes trusted tools, streams completion and resumes only its named workspace', async t => {
  const f = protocolFixture('success'); t.after(() => f.close());
  const adapter = new CodexRuntime({ command: f.command });
  const result = await adapter.run(f.input, new AbortController().signal);
  assert.equal(result.status, 'completed'); assert.equal(result.summary, 'Protocol result'); assert.equal(f.callCount(), 1);
  assert.ok(f.events.includes('runtime_started'));
  f.input.binding = { worker_id: f.input.worker.worker_id, runtime_type: 'codex-app-server', workspace_path: f.input.worker.workspace_path, runtime_reference: 'thread-owned', created_at: 'now' };
  assert.equal((await adapter.run(f.input, new AbortController().signal)).status, 'completed'); assert.ok(f.events.includes('worker_resumed'));
});
test('App Server rejects cross-thread tool identity before invoking the control plane', async t => {
  const f = protocolFixture('forged-thread'); t.after(() => f.close());
  await new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal);
  assert.equal(f.callCount(), 0); assert.ok(f.events.includes('tool_rejected'));
});
test('App Server preserves exact worker bindings created before the product rename', async t => {
  const f = protocolFixture('legacy-name'); t.after(() => f.close());
  f.input.binding = { worker_id: f.input.worker.worker_id, runtime_type: 'codex-app-server', workspace_path: f.input.worker.workspace_path, runtime_reference: 'thread-owned', created_at: 'now' };
  assert.equal((await new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal)).status, 'completed');
  assert.ok(f.events.includes('worker_resumed'));
});
test('App Server refuses a stored thread from a different workspace', async t => {
  const f = protocolFixture('wrong-workspace'); t.after(() => f.close());
  f.input.binding = { worker_id: f.input.worker.worker_id, runtime_type: 'codex-app-server', workspace_path: f.input.worker.workspace_path, runtime_reference: 'thread-owned', created_at: 'now' };
  await assert.rejects(() => new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal), /workspace mismatch/);
  assert.equal(f.callCount(), 0);
});
test('App Server fails closed if confinement flags do not take effect', async t => {
  const f = protocolFixture('unsafe-config'); t.after(() => f.close());
  await assert.rejects(() => new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal), /confinement/);
});
test('App Server denies approval and preserves awaiting_approval outcome', async t => {
  const f = protocolFixture('approval'); t.after(() => f.close());
  const result = await new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal);
  assert.equal(result.status, 'awaiting_approval'); assert.ok(f.events.includes('runtime_approval_required'));
});
test('App Server turn interruption is acknowledged distinctly from pause', async t => {
  const f = protocolFixture('interrupt'); t.after(() => f.close()); const controller = new AbortController();
  f.input.event = type => { if (type === 'runtime_turn_started') controller.abort(); };
  const result = await new CodexRuntime({ command: f.command }).run(f.input, controller.signal);
  assert.equal(result.status, 'interrupted'); assert.match(result.error!, /confirmed/);
});
test('App Server unexpected exit and execution deadline terminate without hanging', async t => {
  const f = protocolFixture('exit'); t.after(() => f.close());
  assert.equal((await new CodexRuntime({ command: f.command }).run(f.input, new AbortController().signal)).status, 'failed');
  const timeout = protocolFixture('timeout'); t.after(() => timeout.close());
  const result = await new CodexRuntime({ command: timeout.command, timeoutMs: 300 }).run(timeout.input, new AbortController().signal);
  assert.equal(result.status, 'failed'); assert.match(result.error!, /deadline/);
});
