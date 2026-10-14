/** Fake pinned-protocol transport only. No public eligibility or genuine inference is established. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {CodexRuntime} from '../src/runtime/codex.js';
import {tool,type RuntimeInput} from '../src/runtime/adapter.js';
import type {AskRuntimeInput} from '../src/domain/ask/execution.js';
import type {AskGrant,AskAdmissionProof} from '../src/domain/ask/authority.js';
import {canonicalHash as h} from '../scripts/investment-contracts/schema.js';
import {transport} from './fixtures/credit-transport.js';
class FixtureAskRuntime extends CodexRuntime {
 protected override authorizeAsk(input:AskRuntimeInput):string {
  assert.ok(this.command.endsWith('/fake-codex.mjs'));
  assert.ok(readFileSync(this.command,'utf8').includes("from 'node:readline'"));
  return input.grant.eligibilityDigest;
 }
}
function fixture(mode='success'){
 const f=transport(mode),workspace=join(f.root,'ask-empty');mkdirSync(workspace,{mode:0o700});
 let source=readFileSync(f.runtime.command,'utf8');
 source=source.replace("const thread={id:'pilot-thread',",`const thread={id:'pilot-thread',ephemeral:${mode!=='persistent'},path:${mode==='disk-path'?JSON.stringify('/forbidden/rollout.jsonl'):'null'},forkedFromId:${mode==='fork'?'"prior-thread"':'null'},parentThreadId:null,`);
 source=source.replace(" created=true;", " if(m.method!=='thread/start'||p.ephemeral!==true||p.dynamicTools.length!==1||p.dynamicTools[0].name!=='ask_submit_answer'||!p.baseInstructions.includes('this visitor question')||!p.config.compact_prompt.includes('this visitor question'))throw Error('Invalid Ask confinement');\n created=true;");
 source=source.replace("else if(m.method==='thread/name/set')send({id:m.id,result:{}});", "else if(m.method==='thread/name/set'||m.method==='thread/resume')throw Error('Ask persistence forbidden');");
 source=source.replace("tool:'submit_contribution',callId:'fixture-contribution',arguments:{body:'Deterministic transport contribution, not real dialogue.',contribution_ids:[],evidence_ids:[],questions:[],answers:[]}","tool:'ask_submit_answer',callId:'fixture-answer',arguments:{text:'Authored test answer',interpretation:'general_answer',evidence:[],publicSources:[],limitations:[]}");
 source=source.replace(" active=true;send({id:m.id", " if(!p.input[0].text.includes('private-ask-runtime-canary')||p.input[0].text.includes('unexpected-replacement'))throw Error('Wrong immutable Ask payload');\n active=true;send({id:m.id");
 writeFileSync(f.runtime.command,source,{mode:0o700});
 const at=new Date().toISOString(),deadline=new Date(Date.now()+60000).toISOString();
 const g:AskGrant={id:'fake-ask-grant',hqId:'fake-hq',serviceId:'fake-service',generation:'1',scopeDigest:h('scope'),limitsDigest:h('limits'),rosterDigest:h('roster'),workerIds:['public-worker'],adapterId:'codex-app-server',model:'test-model',profileDigest:h({model:'test-model',reasoningEffort:'low',serviceTier:'default'}),accountDigest:h('synthetic-account'),routingDigest:h('synthetic-route'),eligibilityDigest:h('authored-eligibility-only'),costPolicyDigest:h('cost'),contextPolicyDigest:h('context'),toolPolicyDigest:h('tools'),approvalDigest:h('approval'),approvedAt:at,expiresAt:deadline,maxExecutions:1,dailyExecutions:1,maxInputTokens:1000,maxOutputTokens:1000,totalTokens:2000,dailyTokens:2000,maxDurationMs:60000,maxChargeMicros:null,totalChargeMicros:null,dailyChargeMicros:null,monetaryMode:'activity_capped_subscription',subscriptionActivityPolicy:{version:'1',tokenLimits:'monitored_thresholds',actualCost:'unavailable',overshoot:'possible',internalRetries:'possible',onMissingUsage:'hold',onThresholdViolation:'hold'},routerExecutions:0,researchCalls:0};
 const context={question:'private-ask-runtime-canary',worker:{workerId:'public-worker'},history:[]},calls:string[]=[],proofs:AskAdmissionProof[]=[];
 const input:AskRuntimeInput={mode:'public_question',worker:{...f.input.worker,workspace_path:workspace,ai_model:'test-model',reasoning_effort:'low'},execution:{...f.input.execution,execution_id:'fake-ask-execution',origin:'public_question',task_id:null,request_id:null,session_id:null,generation:null},grant:g,
  reservation:{id:'fake-ask-execution',grantId:g.id,serviceId:g.serviceId,generation:'1',questionId:'question',questionHash:h('q'),conversationId:'visitor-conversation',workerId:'public-worker',workerSessionId:'fresh-worker-session',providerGeneration:1,contextDigest:h(context),claimDigest:h('claim'),requestDigest:h('request'),reservedAt:at,deadline,questionExpiresAt:deadline},
  context,tools:[tool('ask_submit_answer','Submit one private answer',{text:{type:'string'}})],localDeadline:deadline,authorize:()=>{calls.push('authorize');},bind:()=>{calls.push('bind');},configured:()=>{},usage:()=>{},event:()=>{},admit:p=>{proofs.push(p);calls.push('admit');},beforeTransmit:p=>{assert.equal(h(p),h(proofs[0]));calls.push('transmit');},callTool:()=>{calls.push('answer');return{accepted:true};}};
 return{...f,input,calls,proofs,runtime:new FixtureAskRuntime({command:f.runtime.command})};
}
test('concrete production runtime refuses Ask before any RPC and ordinary run cannot bypass it',async t=>{
 const f=fixture();t.after(f.close);const runtime=new CodexRuntime({command:f.runtime.command});
 await assert.rejects(()=>runtime.runAsk(f.input,new AbortController().signal),/ASK_PUBLIC_SERVICE_ELIGIBILITY_UNVERIFIED/);
 await assert.rejects(()=>runtime.run(f.input as unknown as RuntimeInput,new AbortController().signal),/separate Ask capability/);
 assert.deepEqual(f.methods(),[]);assert.deepEqual(f.calls,[]);
});
test('shared supervisor uses one fresh ephemeral Ask thread and adapter-built exact proof',async t=>{
 const f=fixture();t.after(f.close);const result=await f.runtime.runAsk(f.input,new AbortController().signal);
 assert.equal(result.status,'completed');assert.equal(result.providerTurnCompleted,true);assert.equal(result.summary,undefined);
 assert.equal(f.methods().filter(m=>m==='thread/start').length,1);assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.ok(!f.methods().includes('thread/name/set'));assert.ok(!f.methods().includes('thread/resume'));
 const p=f.proofs[0]!;assert.equal(p.providerSessionId,'pilot-thread');assert.equal(p.reservationDigest,h(f.input.reservation));assert.equal(p.toolPolicyDigest,h(f.input.tools));assert.equal(p.profileDigest,f.input.grant.profileDigest);assert.notEqual(p.accountDigest,f.input.grant.accountDigest);assert.equal(p.inputBoundEnforced,false);assert.equal(p.maxChargeMicros,null);
 assert.deepEqual(f.calls.filter(c=>['admit','transmit','answer'].includes(c)),['admit','transmit','answer']);
});
for(const mode of ['persistent','disk-path','fork','wrong-model','wrong-provider'])test('Ask rejects '+mode+' before model transmission',async t=>{
 const f=fixture(mode);t.after(f.close);await assert.rejects(()=>f.runtime.runAsk(f.input,new AbortController().signal));assert.ok(!f.methods().includes('turn/start'));assert.equal(f.proofs.length,0);
});
for(const field of ['binding','investment','prepareBinding','admitSubscription','task','request'])test('Ask rejects runtime-forged private field '+field,async t=>{
 const f=fixture();t.after(f.close);Object.assign(f.input,{[field]:field.includes('Binding')||field==='admitSubscription'?()=>{throw Error('must not run');}: {}});
 await assert.rejects(()=>f.runtime.runAsk(f.input,new AbortController().signal),/Invalid public Ask runtime input/);assert.deepEqual(f.methods(),[]);
});
test('Ask context and tools are snapshotted before awaited setup, and mismatched context never spawns',async t=>{
 const f=fixture();t.after(f.close);const original=h(f.input.tools);
 f.input.configured=()=>{f.input.context={question:'unexpected-replacement'};f.input.tools.push(tool('forbidden','forbidden',{}));};
 const result=await f.runtime.runAsk(f.input,new AbortController().signal);assert.equal(result.status,'completed');assert.equal(f.proofs[0]?.toolPolicyDigest,original);
 const bad=fixture();t.after(bad.close);bad.input.context={question:'wrong'};await assert.rejects(()=>bad.runtime.runAsk(bad.input,new AbortController().signal),/reserved content/);assert.deepEqual(bad.methods(),[]);
});
for(const mode of ['account-change','native','tool','approval','rerouted','exit'])test('Ask stops on '+mode+' with no replacement turn',async t=>{
 const f=fixture(mode);t.after(f.close);const result=await f.runtime.runAsk(f.input,new AbortController().signal);assert.notEqual(result.status,'completed');assert.equal(f.methods().filter(m=>m==='turn/start').length,1);
});
test('pre-wire revocation cannot transmit and uncooperative callbacks have bounded cleanup',async t=>{
 const f=fixture();t.after(f.close);f.input.beforeTransmit=()=>{throw Error('revoked');};await assert.rejects(()=>f.runtime.runAsk(f.input,new AbortController().signal),/revoked/);assert.ok(!f.methods().includes('turn/start'));
 const stuck=fixture();t.after(stuck.close);const controller=new AbortController();stuck.input.callTool=()=>{controller.abort();return new Promise(()=>{});};
 const start=Date.now();await assert.rejects(()=>stuck.runtime.runAsk(stuck.input,controller.signal),/cleanup unconfirmed/);assert.ok(Date.now()-start<18000);assert.equal(stuck.methods().filter(m=>m==='turn/start').length,1);
});
