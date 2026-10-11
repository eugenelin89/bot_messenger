import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import type {VerifiedCreditAccount} from '../../src/runtime/credit-account.js';
import {CodexRuntime as RealCodexRuntime,DISABLED_FEATURES} from '../../src/runtime/codex.js';
import {CREDIT_CONFIG,CREDIT_DISABLED_FEATURES} from '../../src/runtime/credit-policy.js';
import {pilotFixture} from './credit-pilot.js';
// This subclass is test code only and permits only our generated local fake transport.
export class CodexRuntime extends RealCodexRuntime {
 authorizeWith?:(input:RuntimeInput,account?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>)=>void;
 protected override authorizeCredit(input:RuntimeInput,account?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){assert.ok(this.command.endsWith('/fake-codex.mjs'));assert.ok(readFileSync(this.command,'utf8').includes("from 'node:readline'"));this.authorizeWith?.(input,account);}
}
export function transport<T extends Pick<ReturnType<typeof pilotFixture>,'root'|'policy'> = ReturnType<typeof pilotFixture>>(mode:string,existing?:T,evidence:{record_id:string;content:string;source_id:string}[]=[]){
 const base=existing?undefined:pilotFixture(),f=(existing??base!) as T,c=base?.claim(),input=c?base!.input(c):undefined,command=join(f.root,'fake-codex.mjs'),trace=join(f.root,'transport.jsonl');
 const config:Record<string,unknown>={features:Object.fromEntries([...DISABLED_FEATURES,...CREDIT_DISABLED_FEATURES].map(k=>[k,false])),mcp_servers:{inherited:{}}};
 for(const [key,value] of Object.entries(CREDIT_CONFIG)){const parts=key.split('.');let target=config;for(const part of parts.slice(0,-1))target=(target[part]??={}) as Record<string,unknown>;target[parts.at(-1)!]=value;}
 writeFileSync(command,`#!${process.execPath}
import {createInterface} from 'node:readline';import {appendFileSync} from 'node:fs';
if(process.argv.includes('--version')){console.log('codex-cli 0.157.0');process.exit(0)}
const expectedEvidence=${JSON.stringify(evidence)};let mayaReads=0;
const mode=${JSON.stringify(mode)},cfg=${JSON.stringify(config)},trace=${JSON.stringify(trace)},cwd=process.cwd();
if(!process.argv.includes('--strict-config')||!process.argv.includes('model_provider="openai"')||process.env.OPENAI_API_KEY||process.env.HTTPS_PROXY||process.env.NODE_OPTIONS)throw Error('Unsafe child launch');
const send=x=>console.log(JSON.stringify(x)),log=m=>appendFileSync(trace,JSON.stringify({method:m.method,id:m.id})+'\\n');let active=false,created=false,reads=0,requirementsReads=0,notified=false;
const notify=()=>send({method:'account/updated',params:{authMode:'chatgpt',planType:'pro'}});
const thread={id:'pilot-thread',cwd,name:'Owned fixture thread',status:{type:'notLoaded'}},account={account:{type:mode==='api-key'?'apiKey':'chatgpt',planType:'pro',email:mode==='missing-account-id'?null:'fixture@example.invalid'},requiresOpenaiAuth:true,workspaceRouting:{chatgptAccountId:mode==='missing-account-id'?null:'fixture-account',backendOrigin:mode==='foreign-backend'?'https://untrusted.invalid':'https://chatgpt.com',accountRoutingOverride:'NO_CONSTRAINT'}};
createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line),p=m.params??{};log(m);
if(mode==='maya-review'&&typeof m.id==='string'&&m.id.startsWith('maya-read-')){
 const i=Number(m.id.slice(10)),v=JSON.parse(m.result?.contentItems?.[0]?.text??'null'),e=expectedEvidence[i];
 if(m.result?.success!==true||v.content!==e.content||v.next_offset!==null||v.metadata.source_id!==e.source_id)throw Error('Incomplete or unauthenticated historical tool delivery');
 mayaReads++;if(mayaReads===2)send({id:'maya-submit',method:'item/tool/call',params:{threadId:thread.id,turnId:'pilot-turn',tool:'submit_contribution',callId:'fixture-maya-submit',arguments:{body:'Deterministic fake Maya review of both complete historical records. Not genuine employee speech.',contribution_ids:[],evidence_ids:expectedEvidence.map(e=>e.record_id),questions:[],answers:[]}}});return;
}
if(mode==='maya-review'&&m.id==='maya-submit'){
 if(m.result?.success!==true)throw Error('Fixture contribution rejected');
 send({method:'item/completed',params:{threadId:thread.id,turnId:'pilot-turn',item:{type:'agentMessage',phase:'final_answer',text:'Deterministic fake Maya transport only'}}});
 send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'pilot-turn',status:'completed'}}});return;
}
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
 if(mode==='maya-review'){
  const context=JSON.parse(p.input[0].text.slice(p.input[0].text.indexOf('\\n')+1));
  if(context.shared_evidence.length!==2||context.owner_interjections.length!==0)throw Error('Wrong Maya context');
  for(const [i,e] of expectedEvidence.entries()){if(!context.shared_evidence.some(c=>c.evidence_id===e.record_id))throw Error('Historical evidence absent from actual provider input');send({id:'maya-read-'+i,method:'item/tool/call',params:{threadId:thread.id,turnId:'pilot-turn',tool:'read_group_record',callId:'fixture-maya-read-'+i,arguments:{record_id:e.record_id,offset:0}}});}return;
 }
 send({id:'contribution',method:'item/tool/call',params:{threadId:thread.id,turnId:'pilot-turn',namespace:null,tool:'submit_contribution',callId:'fixture-contribution',arguments:{body:'Deterministic transport contribution, not real dialogue.',contribution_ids:[],evidence_ids:[],questions:[],answers:[]}}});
 send({method:'item/completed',params:{threadId:thread.id,turnId:'pilot-turn',item:{type:'agentMessage',phase:'final_answer',text:'Deterministic transport response'}}});
 send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'pilot-turn',status:mode==='provider-error'?'failed':'completed'}}});
 if(mode==='notification-tool-drain')setTimeout(notify,10);
}else if(m.method==='turn/interrupt'){send({id:m.id,result:{}});if(!['no-settlement','notification-no-settlement'].includes(mode)&&active)send({method:'turn/completed',params:{threadId:thread.id,turn:{id:'pilot-turn',status:mode==='completed-after-timeout'?'completed':'interrupted'}}});notify();}
});`,{mode:0o700});
 const runtime=new CodexRuntime({command,creditPilot:{pilotId:f.policy.pilotId,disposableRoot:f.root,model:'test-model'}});
 return {...f,c:c!,input:input!,runtime,trace,methods:()=>{try{return readFileSync(trace,'utf8').trim().split('\n').map(l=>JSON.parse(l).method);}catch{return [];}}};
}
