import {tmpdir} from 'node:os';
import {PilotLineage,type Successor} from '../src/control/usage/pilot-lineage.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pilotFixture} from './fixtures/credit-pilot.js';
import {supervisePilot} from '../scripts/credit-pilot/supervise.js';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {transport} from './fixtures/credit-transport.js';
import {AppServerRpc} from '../src/runtime/rpc.js';
import {creditEnvironment,privateContext,rejectGlobalInstructions,validateCreditRequirements} from '../src/runtime/credit-policy.js';
test('credit child environment excludes inherited API keys, proxy, CA and executable injection settings',()=>{
 assert.deepEqual(creditEnvironment({HOME:'/existing',PATH:'/bin',CODEX_HOME:'/existing/auth',TMPDIR:'/tmp',OPENAI_API_KEY:'secret',HTTPS_PROXY:'evil',NODE_OPTIONS:'evil',SSL_CERT_FILE:'evil',DYLD_INSERT_LIBRARIES:'evil',CODEX_RESPONSES_API_PROXY_URL:'evil'}),{HOME:'/existing',PATH:'/bin',CODEX_HOME:'/existing/auth',TMPDIR:'/tmp'});
});
for(const mode of ['success','retry','missing-usage','conflicting','cumulative-only','provider-error'])test('credit transport '+mode+' retains one turn and deduplicated telemetry',async t=>{
 const f=transport(mode);t.after(f.close);const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.equal(result.status,mode==='provider-error'?'failed':'completed');assert.equal(result.settled,true);assert.equal(f.methods().filter(x=>x==='turn/start').length,1);assert.equal(f.company.creditPilot.count(),1);assert.equal(f.store.all('SELECT * FROM ai_usage_responses').length,mode==='cumulative-only'?0:1);if(mode!=='missing-usage')assert.equal(f.company.aiUsage.records()[0]!.tokens!.inputTokens,100);
 f.company.finish(f.c.execution.execution_id,result);if(mode==='provider-error')assert.equal(f.company.creditPilot.get()!.state,'stopped');else {assert.equal(f.company.aiUsage.records()[0]!.status,'completed');assert.equal(f.company.creditPilot.get()!.state,'held');if(['missing-usage','conflicting','cumulative-only'].includes(mode))assert.throws(()=>f.release(),/usage\/identity\/settlement/);else f.release();}if(mode==='retry'){const u=f.company.aiUsage.records()[0]!;assert.equal(u.completeness,'incomplete');assert.ok(u.reasons.some(r=>r.includes('failed-attempt')));}
});
for(const mode of ['api-key','missing-account-id','foreign-backend','unsafe-skills','unsafe-config','unsafe-mcp','unknown-eligibility','no-credits','wrong-model','wrong-provider','active-thread','foreign-thread'])test('credit transport denies '+mode+' before provider turn',async t=>{
 const f=transport(mode);t.after(f.close);if(mode.endsWith('thread'))f.input.binding={worker_id:f.input.worker.worker_id,runtime_type:'codex-app-server',runtime_reference:'pilot-thread',workspace_path:f.input.worker.workspace_path,created_at:new Date().toISOString(),thread_name:'Owned fixture thread'};
 await assert.rejects(()=>f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy));assert.equal(f.methods().includes('turn/start'),false);assert.equal(f.company.creditPilot.count(),1);
});
for(const mode of ['account-change','rerouted','native','approval','tool','exit'])test('credit transport stops on '+mode+' without replacement turn',async t=>{
 const f=transport(mode);t.after(f.close);const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.notEqual(result.status,'completed');assert.equal(f.methods().filter(x=>x==='turn/start').length,1);f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);
});
test('credit deadline requests interruption and missing acknowledgement terminates with uncertainty',async t=>{
 const f=transport('no-settlement');t.after(f.close);
 const realSetTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout,realNow=Date.now;
 const watchdog=async<T>(pending:Promise<T>)=>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([pending,new Promise<never>((_,reject)=>{timer=realSetTimeout(()=>reject(Error('Fake runtime did not reach the expected deadline phase')),10000);})]);}finally{if(timer)realClearTimeout(timer);}};
 let started!:()=>void;const ready=new Promise<void>(resolve=>started=resolve),event=f.input.event;
 f.input.event=(type,detail)=>{event(type,detail);if(type==='runtime_turn_started')started();};
 // Startup speed is not the deadline assertion. Advance the actual runtime timer
 // only after its fake provider has started a turn; retain a separate real watchdog.
 t.mock.timers.enable({apis:['Date','setTimeout'],now:Date.now()});f.input.localDeadline=new Date(Date.now()+300000).toISOString();
 const controller=new AbortController(),running=f.runtime.runSubscriptionInvestment!(f.input,controller.signal,f.policy);
 try{
  await watchdog(Promise.race([ready,running.then(()=>{throw Error('Fake runtime finished before starting a turn');})]));
  assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.equal(f.methods().includes('turn/interrupt'),false);
  t.mock.timers.tick(299999);await new Promise(resolve=>realSetTimeout(resolve,5));assert.equal(f.methods().includes('turn/interrupt'),false);t.mock.timers.tick(1);
  const interruptWait=realNow();while(!f.methods().includes('turn/interrupt')&&realNow()-interruptWait<10000)await new Promise(resolve=>realSetTimeout(resolve,5));
  assert.ok(f.methods().includes('turn/interrupt'));t.mock.timers.tick(6000);
  const result=await watchdog(running);assert.equal(result.status,'interrupted');assert.notEqual(result.settled,true);
  f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.investmentActivity.counts(f.manifest.runId).active,1);assert.equal(f.company.claimWorkNext(),undefined);
 }finally{controller.abort();t.mock.timers.tick(6000);await watchdog(running.catch(()=>undefined));t.mock.timers.tick(1000);}
});
test('credit resumed thread reuses exact identity and starts exactly one newly reserved turn',async t=>{
 const f=transport('success');t.after(f.close);f.input.binding={worker_id:f.input.worker.worker_id,runtime_type:'codex-app-server',runtime_reference:'pilot-thread',workspace_path:f.input.worker.workspace_path,created_at:new Date().toISOString(),thread_name:'Owned fixture thread'};
 assert.equal((await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy)).status,'completed');assert.equal(f.methods().filter(x=>x==='thread/resume').length,1);assert.equal(f.methods().filter(x=>x==='turn/start').length,1);
});

test('account notification while awaiting eligibility blocks transmission before turn/start',async t=>{
 const f=transport('account-admission-change');t.after(f.close);await assert.rejects(()=>f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy),/identity or routing/);assert.equal(f.methods().includes('turn/start'),false);f.company.finish(f.c.execution.execution_id,{status:'failed',settled:false});assert.equal(f.company.creditPilot.get()!.state,'stopped');
});

for(const mode of ['startup-snapshot','before-account-read','routing-discovery','thread-snapshot','before-admission','after-verification','multiple-identical','recheck-inflight','requirements-null'])test('unchanged authoritative startup account succeeds after '+mode,async t=>{
 const f=transport(mode);t.after(f.close);const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);
 assert.equal(result.status,'completed');assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.equal(f.company.creditPilot.count(),1);
 const methods=f.methods(),start=methods.indexOf('turn/start');assert.deepEqual(methods.slice(start-5,start),['account/read','configRequirements/read','config/read','account/rateLimits/read','account/read']);
 const events=f.store.all<{type:string;detail:string}>('SELECT type,detail FROM audit_events');assert.ok(events.some(e=>e.type==='conversation_runtime_account_reverified'));assert.ok(!events.some(e=>e.type==='conversation_runtime_account_changed'));assert.ok(!JSON.stringify(events).includes('fixture@example.invalid'));assert.ok(!JSON.stringify(events).includes('fixture-account'));
});
for(const mode of ['stale-verification','closing-auth-change','identity-change','api-key-change','logout','backend-change','routing-change','provider-config-change','required-backend-change','required-workspace-change','requirements-provider','requirements-api','requirements-backend','requirements-failure','requirements-missing','requirements-malformed','lookup-failure','notification-storm'])test('authoritative account verification denies '+mode+' without inference or replay',async t=>{
 const f=transport(mode);t.after(f.close);let error:unknown;try{await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);}catch(e){error=e;}assert.ok(error instanceof Error);assert.ok(!String(error).includes('SECRET_'));assert.ok(!String(error).includes('@'));
 assert.equal(f.methods().includes('turn/start'),false);assert.equal(f.company.creditPilot.count(),1);f.company.finish(f.c.execution.execution_id,{status:'failed',settled:false});assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.aiUsage.records()[0]!.tokens,null);
});
test('account invalidation interrupts despite revoked audit authority and preserves unknown settlement on reopen',async t=>{
 const f=transport('notification-no-settlement');t.after(f.close);const audit=f.input.event;
 // The final pre-admission audit remains valid; revoke only once the fake provider starts.
 const request=AppServerRpc.prototype.request;let active=false;
 AppServerRpc.prototype.request=function<T>(method:string,params:Record<string,unknown>,timeout?:number){if(method==='turn/start')active=true;return request.call(this,method,params,timeout) as Promise<T>;};t.after(()=>{AppServerRpc.prototype.request=request;});
 f.input.event=(type,detail)=>{if(active&&type.startsWith('runtime_account_'))throw Error('Fixture audit authority revoked');audit(type,detail);};
 const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.notEqual(result.status,'completed');assert.notEqual(result.settled,true);assert.ok(f.methods().includes('turn/interrupt'));assert.equal(f.methods().filter(m=>m==='turn/start').length,1);
 f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.count(),1);assert.equal(f.company.investmentActivity.counts(f.manifest.runId).active,1);
 const reopened=new Store(join(f.root,'company.sqlite'));try{const company=new Company(reopened,f.root,process.cwd());company.recover();assert.equal(company.creditPilot.get()!.state,'stopped');assert.equal(company.creditPilot.count(),1);assert.equal(company.investmentActivity.counts(f.manifest.runId).active,1);assert.equal(company.claimWorkNext(),undefined);assert.throws(()=>company.creditPilot.release('replacement',f.c.execution.execution_id));}finally{reopened.close();}
});

test('pinned requirements preserve confinement, workspace constraints and independent residency semantics',()=>{
 const account={workspaceRouting:{chatgptAccountId:'fixture-workspace',backendOrigin:'https://chatgpt.com',accountRoutingOverride:'NO_CONSTRAINT'}},config={features:{skill_search:false},forced_chatgpt_workspace_id:['another-workspace','fixture-workspace']};
 const allowed={allowedApprovalPolicies:['never'],allowedSandboxModes:['read-only'],allowedWebSearchModes:['disabled'],enforceResidency:'us',featureRequirements:{skill_search:false}};
 const result=validateCreditRequirements({requirements:allowed},account,config);assert.equal(result.residency,'us');assert.equal(result.routingOverride,'NO_CONSTRAINT');assert.deepEqual(result.workspaces,['another-workspace','fixture-workspace']);
 for(const denied of [{allowedApprovalPolicies:['on-request']},{allowedSandboxModes:['workspace-write']},{allowedWebSearchModes:['live']},{allowedLoginMethods:[]},{modelProviders:{other:{base_url:'https://untrusted.invalid'}}},{models:{newThread:{model:'other'}}},{modelCatalogJson:'private-file'},{additionalDeveloperInstructions:'private instructions'},{featureRequirements:{skill_search:true}},{featureRequirements:{skill_search:'false'}},{enforceResidency:'unknown'},{chatgptBaseUrl:'https://user:password@chatgpt.com/'}])assert.throws(()=>validateCreditRequirements({requirements:denied},account,config));
 for(const override of ['unexpected',null,{}])assert.throws(()=>validateCreditRequirements({requirements:null},{workspaceRouting:{...account.workspaceRouting,accountRoutingOverride:override}},config));
 for(const forced of [[],['other'],42])assert.throws(()=>validateCreditRequirements({requirements:null},account,{...config,forced_chatgpt_workspace_id:forced}));
});
for(const mode of ['during-turn-start','active-same-snapshot','notification-tool-drain'])test('account snapshot interrupts '+mode+' and cannot reopen on late completion',async t=>{
 const f=transport(mode);t.after(f.close);if(mode==='notification-tool-drain')f.input.callTool=async()=>{await new Promise(r=>setTimeout(r,100));return {};};
 const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.notEqual(result.status,'completed');assert.ok(f.methods().includes('turn/interrupt'));assert.equal(f.methods().filter(m=>m==='turn/start').length,1);f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);
});
test('synchronous notification inside durable admission cannot pass the final generation check',async t=>{
 const f=transport('success');t.after(f.close);const request=AppServerRpc.prototype.request;let rpc:AppServerRpc|undefined;
 AppServerRpc.prototype.request=function<T>(method:string,params:Record<string,unknown>,timeout?:number){if(method==='thread/start')rpc=this;return request.call(this,method,params,timeout) as Promise<T>;};t.after(()=>{AppServerRpc.prototype.request=request;});
 const admit=f.input.admitSubscription!;f.input.admitSubscription=i=>{admit(i);rpc!.emit('notification',{method:'account/updated',params:{}});};
 await assert.rejects(()=>f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy),/invalidated during admission/);assert.equal(f.methods().includes('turn/start'),false);assert.equal(f.company.creditPilot.count(),1);f.company.finish(f.c.execution.execution_id,{status:'failed',settled:false});assert.equal(f.company.investmentActivity.counts(f.manifest.runId).active,1);assert.equal(f.company.claimWorkNext(),undefined);
});
test('account lookup timeout stops within the absolute deadline and retains consumed reservation',async t=>{
 const f=transport('lookup-timeout');t.after(f.close);f.input.localDeadline=new Date(Date.now()+2000).toISOString();const start=Date.now();let result;try{result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);}catch{result={status:'failed' as const,settled:false};}assert.notEqual(result.status,'completed');assert.ok(Date.now()-start<9500);assert.equal(f.methods().includes('turn/start'),false);f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.count(),1);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);
});

for(const control of ['stop','revoke-member'])test('durable '+control+' from another connection interrupts a silent provider',async t=>{
 const fixture=pilotFixture(),f=transport('hang',fixture);t.after(f.close);const work=supervisePilot(f.company,f.runtime,f.group.group_id,'first',null);
 const until=Date.now()+5000;while(!f.methods().includes('turn/start')&&Date.now()<until)await new Promise(r=>setTimeout(r,25));assert.ok(f.methods().includes('turn/start'));
 const other=new Store(join(f.root,'company.sqlite'));try{const c2=new Company(other,f.root,process.cwd());if(control==='stop')c2.creditPilot.stop();else c2.discussions.revokeMember({group_id:f.group.group_id,worker_id:f.roster[0]!.worker_id});}finally{other.close();}
 const stoppedAt=Date.now();await work;assert.ok(Date.now()-stoppedAt<8000);assert.ok(f.methods().includes('turn/interrupt'));assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.creditPilot.count(),1);assert.equal(f.company.claimWorkNext(),undefined);
});

test('private context removes skill sigils without changing supplied JSON content',()=>{
 const value={body:'Synthetic $50 and $private-skill plus [$secret](/private/SKILL.md)'};const text=privateContext(value);assert.equal(text.includes('$'),false);assert.deepEqual(JSON.parse(text),value);
});
test('nonempty global instructions block without reading contents or starting a provider',t=>{
 const f=pilotFixture();t.after(f.close);writeFileSync(join(f.root,'AGENTS.md'),'private fixture instructions');assert.throws(()=>rejectGlobalInstructions({CODEX_HOME:f.root}),/Global Codex instructions/);
});
test('provider completion during local-stop grace preserves settlement but cannot reopen the pilot',async t=>{
 const f=transport('completed-after-timeout');t.after(f.close);f.input.localDeadline=new Date(Date.now()+2000).toISOString();const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.equal(result.status,'interrupted');assert.equal(result.settled,true);f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.throws(()=>f.release());assert.equal(f.methods().filter(m=>m==='turn/start').length,1);
});

for(const mode of ['success','notification-no-settlement'])test('durable lineage with fake transport '+mode+' admits exactly once and stops',async t=>{
 const base=pilotFixture(),f=transport(mode,base),dir=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-transport-lineage-')));
 const ledger=PilotLineage.create(join(dir,'lineage.sqlite'),{pilotId:'original-fake',scopeId:'revoked-fake',executionId:'failed-fake',model:'test-model',archive:dir,archiveDigest:'f'.repeat(64),rosterHash:'e'.repeat(64),workerId:base.roster[0]!.worker_id,source:'1'.repeat(40),files:{}},new Date().toISOString());
 t.after(()=>{ledger.close();base.close();rmSync(dir,{recursive:true,force:true});});
 const s:Successor={pilotId:base.manifest.pilotId,root:base.root,scopeId:base.manifest.scopeId,groupId:base.manifest.groupId,runId:base.manifest.runId,workerId:base.roster[0]!.worker_id,model:'test-model',source:'1'.repeat(40),expiresAt:base.envelope.expiresAt};
 ledger.prepare(s);ledger.bindAccount(s,await f.runtime.creditPreflight(join(s.root,'workspaces',s.workerId)));base.company.creditPilot.attach(ledger,s);
 f.runtime.authorizeWith=(input,account)=>{assert.equal(f.methods().includes('turn/start'),false);if(account)ledger.admit(s,input,account);else ledger.check(s,input);};
 const c=base.claim(),input=base.input(c);assert.equal(ledger.row().consumed,2);
 const result=await f.runtime.runSubscriptionInvestment!(input,new AbortController().signal,base.policy);base.company.finish(c.execution.execution_id,result);
 assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.equal(ledger.receipts().filter(r=>r.kind==='admission_consumed').length,1);assert.equal(ledger.row().state,'stopped');assert.equal(ledger.row().consumed,2);assert.equal(ledger.row().uncertain,mode==='success'?0:1);
 f.runtime.authorizeWith=(input,account)=>{if(account)ledger.admit(s,input,account);else ledger.check(s,input);};
 await assert.rejects(f.runtime.runSubscriptionInvestment!(input,new AbortController().signal,base.policy),/stopped/);assert.equal(f.methods().filter(m=>m==='turn/start').length,1);assert.equal(base.company.claimWorkNext(),undefined);
});

test('credit notification audit rejection requests interruption before closing transport',async t=>{
 const f=transport('hang');t.after(f.close);const event=f.input.event;
 f.input.event=(type,detail)=>{if(type==='runtime_turn_started')throw Error('Fixture revocation at notification');event(type,detail);};
 const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.equal(result.status,'interrupted');assert.equal(result.settled,true);assert.ok(f.methods().includes('turn/interrupt'));assert.equal(f.methods().filter(m=>m==='turn/start').length,1);
});
