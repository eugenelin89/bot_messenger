import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pilotFixture} from './fixtures/credit-pilot.js';
import {supervisePilot} from '../scripts/credit-pilot/supervise.js';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {CodexRuntime,DISABLED_FEATURES} from '../src/runtime/codex.js';
import {AppServerRpc} from '../src/runtime/rpc.js';
import {CREDIT_CONFIG,CREDIT_DISABLED_FEATURES,creditEnvironment,privateContext,rejectGlobalInstructions,validateCreditRequirements} from '../src/runtime/credit-policy.js';
function transport(mode:string,existing?:ReturnType<typeof pilotFixture>){
 const f=existing??pilotFixture(),c=existing?undefined:f.claim(),input=c?f.input(c):undefined,command=join(f.root,'fake-codex.mjs'),trace=join(f.root,'transport.jsonl');
 const config:Record<string,unknown>={features:Object.fromEntries([...DISABLED_FEATURES,...CREDIT_DISABLED_FEATURES].map(k=>[k,false])),mcp_servers:{inherited:{}}};
 for(const [key,value] of Object.entries(CREDIT_CONFIG)){const parts=key.split('.');let target=config;for(const part of parts.slice(0,-1))target=(target[part]??={}) as Record<string,unknown>;target[parts.at(-1)!]=value;}
 writeFileSync(command,`#!${process.execPath}
import {createInterface} from 'node:readline';import {appendFileSync} from 'node:fs';
if(process.argv.includes('--version')){console.log('codex-cli 0.157.0');process.exit(0)}
const mode=${JSON.stringify(mode)},cfg=${JSON.stringify(config)},trace=${JSON.stringify(trace)},cwd=process.cwd();
if(!process.argv.includes('--strict-config')||!process.argv.includes('model_provider="openai"')||process.env.OPENAI_API_KEY||process.env.HTTPS_PROXY||process.env.NODE_OPTIONS)throw Error('Unsafe child launch');
const send=x=>console.log(JSON.stringify(x)),log=m=>appendFileSync(trace,JSON.stringify({method:m.method,id:m.id})+'\\n');let active=false,created=false,reads=0,requirementsReads=0,notified=false;
const notify=()=>send({method:'account/updated',params:{authMode:'chatgpt',planType:'pro'}});
const thread={id:'pilot-thread',cwd,name:'Owned fixture thread',status:{type:'notLoaded'}},account={account:{type:mode==='api-key'?'apiKey':'chatgpt',planType:'pro',email:mode==='missing-account-id'?null:'fixture@example.invalid'},requiresOpenaiAuth:true,workspaceRouting:{chatgptAccountId:mode==='missing-account-id'?null:'fixture-account',backendOrigin:mode==='foreign-backend'?'https://untrusted.invalid':'https://chatgpt.com',accountRoutingOverride:'NO_CONSTRAINT'}};
createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line),p=m.params??{};log(m);
if(m.method==='initialize')send({id:m.id,result:{}});
else if(m.method==='initialized'){if(mode==='startup-snapshot')notify();}
else if(m.method==='config/read'){if(p.cwd!==cwd)throw Error('Missing exact cwd');if(mode==='unsafe-config')cfg.agents.enabled=true;if(mode==='unsafe-mcp')cfg.mcp_servers={'unsafe.name':{}};send({id:m.id,result:{config:cfg}});}
else if(m.method==='skills/list'){if(p.cwds?.[0]!==cwd||p.forceReload!==true)throw Error('Wrong skill scope');send({id:m.id,result:{data:[{cwd,skills:[{path:'/fixture/secret-skill/SKILL.md',enabled:mode==='unsafe-skills'||!process.argv.some(a=>a.startsWith('skills.config='))}],errors:[]}]}});}
else if(m.method==='account/read'){
 reads++;
 if(mode==='lookup-failure'){send({id:m.id,error:{code:-32000,message:'SECRET_ACCOUNT fixture@example.invalid'}});return;}
 if(mode==='lookup-timeout'&&created)return;
 if(mode==='routing-discovery'&&reads===1){setTimeout(()=>{notify();send({id:m.id,result:account});},20);return;}
 if((['before-account-read','multiple-identical','recheck-inflight'].includes(mode)&&reads===1)||(mode==='recheck-inflight'&&reads===2)||mode==='notification-storm'){notify();if(mode==='multiple-identical'){notify();notify();}}
 if(mode==='stale-verification'&&created&&!notified){notified=true;const old=structuredClone(account);account.account.email='changed@example.invalid';notify();send({id:m.id,result:old});return;}
 if(mode==='closing-auth-change'&&created&&reads%2===0)account.requiresOpenaiAuth=false;
 send({id:m.id,result:account});
}
else if(m.method==='configRequirements/read'){
 requirementsReads++;let requirements={modelProvider:'openai',allowedLoginMethods:['chatgpt'],chatgptBaseUrl:null};
 if(mode==='requirements-failure'){send({id:m.id,error:{code:-32000,message:'SECRET_REQUIREMENTS'}});return;}
 if(mode==='requirements-missing'){send({id:m.id,result:{}});return;}
 if(mode==='requirements-malformed'){send({id:m.id,result:{requirements:[]}});return;}
 if(mode==='requirements-api')requirements.allowedLoginMethods=['api'];
 if(mode==='requirements-provider')requirements.modelProvider='metered';
 if(mode==='requirements-backend'||mode==='required-backend-change'&&created)requirements.chatgptBaseUrl='https://untrusted.invalid/backend-api/';
 if(mode==='required-workspace-change'&&created)cfg.forced_chatgpt_workspace_id='another-workspace';
 if(mode==='recheck-inflight'&&requirementsReads===1)notify();
 send({id:m.id,result:{requirements:mode==='requirements-null'?null:requirements}});
}
else if(m.method==='account/rateLimits/read'){
 if(mode==='account-admission-change'&&created&&!notified){notified=true;account.account.email='changed@example.invalid';notify();}
 if(mode==='before-admission'&&created&&!notified){notified=true;notify();}
 send({id:m.id,result:mode==='unknown-eligibility'?{}:{ordinaryUsageAllowed:false,rateLimits:{planType:'pro',credits:{hasCredits:mode!=='no-credits',unlimited:false},spendControlReached:false}}});
 if(mode==='after-verification'&&created&&!notified){notified=true;notify();}
}
else if(m.method==='model/list')send({id:m.id,result:{data:[{id:'test-model',model:'test-model',isDefault:true,defaultReasoningEffort:'low',supportedReasoningEfforts:[{reasoningEffort:'low'}]}]}});
else if(m.method==='thread/read')send({id:m.id,result:{thread:{...thread,status:{type:mode==='active-thread'?'active':'notLoaded'},cwd:mode==='foreign-thread'?'/foreign':cwd}}});
else if(m.method==='thread/start'||m.method==='thread/resume'){
 created=true;
 if(mode==='identity-change')account.account.email='changed@example.invalid';
 if(mode==='api-key-change')account.account.type='apiKey';
 if(mode==='logout')account.account=null;
 if(mode==='backend-change')account.workspaceRouting.backendOrigin='https://untrusted.invalid';
 if(mode==='routing-change')account.workspaceRouting.accountRoutingOverride='us';
 if(mode==='provider-config-change')cfg.model_provider='metered';
 if(['thread-snapshot','identity-change','api-key-change','logout','backend-change','routing-change','provider-config-change'].includes(mode))notify();
 if(p.modelProvider!=='openai'||p.serviceTier!=='default'||p.allowProviderModelFallback!==false||p.environments?.length>0||p.config['mcp_servers.inherited.enabled']!==false||p.config['skills.config']?.[0]?.enabled!==false)throw Error('Wrong thread confinement');
 send({id:m.id,result:{thread,model:mode==='wrong-model'?'other':'test-model',modelProvider:mode==='wrong-provider'?'metered':'openai',serviceTier:'default',approvalPolicy:'never',sandbox:{type:'readOnly',networkAccess:false}}});}
else if(m.method==='thread/name/set')send({id:m.id,result:{}});
else if(m.method==='turn/start'){
 if(mode==='during-turn-start')notify();
 active=true;send({id:m.id,result:{turn:{id:'pilot-turn'}}});send({method:'turn/started',params:{threadId:thread.id,turn:{id:'pilot-turn'}}});
 if(mode==='during-turn-start')return;
 if(mode==='notification-no-settlement'){notify();return;}
 if(['hang','no-settlement','timeout','completed-after-timeout'].includes(mode))return;
 const usage={inputTokens:100,cachedInputTokens:20,cacheWriteInputTokens:0,outputTokens:10,reasoningOutputTokens:5,totalTokens:110};
 if(mode==='cumulative-only')send({method:'thread/tokenUsage/updated',params:{threadId:thread.id,turnId:'pilot-turn',tokenUsage:{total:usage,last:usage}}});
 else for(let n=0;n<2;n++)send({method:'rawResponse/completed',params:{threadId:thread.id,turnId:'pilot-turn',responseId:'response-1',usage:mode==='missing-usage'?null:mode==='conflicting'&&n===1?{...usage,inputTokens:101,totalTokens:111}:usage}});
 if(mode==='retry')send({method:'error',params:{threadId:thread.id,turnId:'pilot-turn',willRetry:true,error:{message:'ignored provider text'}}});
 if(mode==='exit')process.exit(2);
 if(mode==='account-change'||mode==='active-same-snapshot'){if(mode==='account-change')account.account.email='changed@example.invalid';notify();return;}
 if(mode==='rerouted'){send({method:'model/rerouted',params:{threadId:thread.id,turnId:'pilot-turn'}});return;}
 if(mode==='native'){send({method:'item/started',params:{threadId:thread.id,turnId:'pilot-turn',item:{type:'commandExecution'}}});return;}
 if(mode==='approval'){send({id:'approval',method:'item/commandExecution/requestApproval',params:{threadId:thread.id,turnId:'pilot-turn'}});return;}
 if(mode==='tool'){send({id:'bad',method:'item/tool/call',params:{threadId:thread.id,turnId:'pilot-turn',namespace:null,tool:'research_search',callId:'bad',arguments:{query:'denied'}}});return;}
 send({id:'contribution',method:'item/tool/call',params:{threadId:thread.id,turnId:'pilot-turn',namespace:null,tool:'submit_contribution',callId:'fixture-contribution',arguments:{body:'Deterministic transport contribution, not real dialogue.',contribution_ids:[],evidence_ids:[],questions:[],answers:[]}}});
 send({method:'item/completed',params:{threadId:thread.id,turnId:'pilot-turn',item:{type:'agentMessage',phase:'final_answer',text:'Deterministic transport response'}}});
 send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'pilot-turn',status:mode==='provider-error'?'failed':'completed'}}});
 if(mode==='notification-tool-drain')setTimeout(notify,10);
}else if(m.method==='turn/interrupt'){send({id:m.id,result:{}});if(!['no-settlement','notification-no-settlement'].includes(mode)&&active)send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'pilot-turn',status:mode==='completed-after-timeout'?'completed':'interrupted'}}});notify();}
});`,{mode:0o700});
 const runtime=new CodexRuntime({command,creditPilot:{pilotId:f.policy.pilotId,disposableRoot:f.root,model:'test-model'}});
 return {...f,c:c!,input:input!,runtime,trace,methods:()=>{try{return readFileSync(trace,'utf8').trim().split('\n').map(l=>JSON.parse(l).method);}catch{return [];}}};
}
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
 const f=transport('no-settlement');t.after(f.close);f.input.localDeadline=new Date(Date.now()+2000).toISOString();const started=Date.now();const result=await f.runtime.runSubscriptionInvestment!(f.input,new AbortController().signal,f.policy);assert.equal(result.status,'interrupted');assert.notEqual(result.settled,true);assert.ok(Date.now()-started<9500);assert.ok(f.methods().includes('turn/interrupt'));f.company.finish(f.c.execution.execution_id,result);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.investmentActivity.counts(f.manifest.runId).active,1);
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
