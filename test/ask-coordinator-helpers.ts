/** Authored integration fixtures: no genuine employee, account entitlement or public service. */
import {chmodSync,copyFileSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {Dispatcher} from '../src/control/dispatcher.js';
import {AskService} from '../src/control/ask/service.js';
import {AskControlJournal} from '../src/control/ask/control-journal.js';
import {AskPrivateContent} from '../src/control/ask/private-content.js';
import {AskAuthorityJournal} from '../src/control/ask/authority-journal.js';
import {canonicalHash} from '../scripts/investment-contracts/schema.js';
import {questionHash} from '../scripts/investment-contracts/ask.js';
import type {AskGrant,AskGrantConfiguration,AskAdmissionProof} from '../src/domain/ask/authority.js';
import type {AskRuntimeInput,AskPublicContext} from '../src/domain/ask/execution.js';
import type {RuntimeAdapter,RuntimeResult} from '../src/runtime/adapter.js';
import type {AskClaim,AskControlReceipt} from '../contracts/investment/v1/types.js';
const ex=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const h=(value:unknown)=>canonicalHash(value),canary='private-visitor-canary-6f00bc40';
export function fixture(twoWorkers=false,options?:{config:AskGrantConfiguration;now:()=>string;skipDrain:true}){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'ask-service-')));
 const hq=join(root,'hq'),raw=join(root,'content'),authority=join(root,'authority'),checkpoint=join(root,'checkpoint'),workspace=join(root,'public-workspace');
 for(const dir of [hq,raw,authority,checkpoint,workspace])mkdirSync(dir,{mode:0o700});
 let db=new Store(join(hq,'company.sqlite')),company=new Company(db,hq,process.cwd(),'fake');const worker=company.initializeCEO(),other=twoWorkers?company.initializeNix().worker:undefined;
 const otherWorkspace=join(root,'second-public-workspace');if(other)mkdirSync(otherWorkspace,{mode:0o700});
 let at=options?.now()??'2026-01-05T21:32:00.000Z',visible=true;const now=()=>options?.now()??at;let readiness:((purpose:'admission'|'execution'|'delivery')=>void)|undefined;const hidden=new Set<string>();
 company.mandates.clock={now:()=>Date.parse(now())};
 const config:AskGrantConfiguration=options?structuredClone(options.config):{scope:structuredClone(ex.AskServiceScope),limits:structuredClone(ex.AskLimits),roster:structuredClone(ex.AskRoster)};
 config.limits={...config.limits,monetaryEnforcement:'activity_capped_subscription',dailyBudgetUsd:null,maxRouterExecutions:0,maxResearchCalls:0,
  subscriptionActivityPolicy:{version:'1',tokenLimits:'monitored_thresholds',actualCost:'unavailable',overshoot:'possible',internalRetries:'possible',onMissingUsage:'hold',onThresholdViolation:'hold'}};
 if(other)config.roster.workers.push({...structuredClone(config.roster.workers[0]!),worker:{...structuredClone(config.roster.workers[0]!.worker),workerId:'fixture-specialist',name:'Nix'},topics:['risk']});
 const g:AskGrant={id:'fixture-grant',hqId:'fixture-hq',serviceId:config.scope.serviceId,generation:config.scope.consumerGeneration,
  scopeDigest:h(config.scope),limitsDigest:h(config.limits),rosterDigest:h(config.roster),workerIds:config.roster.workers.map(w=>w.worker.workerId),adapterId:'fake',model:'fake-model',profileDigest:h('profile'),accountDigest:h('account'),routingDigest:h('routing'),eligibilityDigest:h('eligibility'),costPolicyDigest:h('cost'),contextPolicyDigest:h('context'),toolPolicyDigest:h('tools'),approvalDigest:h('approval'),approvedAt:at,expiresAt:options?config.scope.expiresAt:'2026-01-05T23:32:00.000Z',maxExecutions:4,dailyExecutions:4,maxInputTokens:100,maxOutputTokens:50,totalTokens:600,dailyTokens:600,maxDurationMs:60000,maxChargeMicros:null,totalChargeMicros:null,dailyChargeMicros:null,monetaryMode:'activity_capped_subscription',subscriptionActivityPolicy:config.limits.subscriptionActivityPolicy,routerExecutions:0,researchCalls:0};
 let journal=AskAuthorityJournal.createFixture(authority,checkpoint,g.hqId,[hq],at);journal.approve(g,config,at);
 const ctx=()=>({scope:config.scope,limits:config.limits,now:now()});let controls=new AskControlJournal(db,ctx);
 function drain(values:AskControlReceipt[]=[]){for(const list of values.length?[values,[]]:[[]]){const x=controls.prepareSync();controls.acceptPage(x.operation.input.syncId,{schemaVersion:'1.0',syncId:x.operation.input.syncId,controls:list,nextCursor:null,checkedAt:now(),validUntil:new Date(Date.parse(now())+60000).toISOString()});}}
 if(!options?.skipDrain)drain();let content=new AskPrivateContent(db,raw,[hq],ctx,controls);
 let evidence:AskPublicContext={records:[],documents:[]};
 const compose=()=>new AskService(company,{current:()=>config,assertReady:p=>readiness?.(p),get grantId(){return g.id;},authority:journal,controls,content,
  workers:[{publicId:'fixture-author',workerId:worker.worker_id,workspace,eligibility:{workerId:'fixture-author',topics:['general','synthetic'],publicKnowledge:[],researchEnabled:false,fallbackOrder:0,enabled:true}},...(other?[{publicId:'fixture-specialist',workerId:other.worker_id,workspace:otherWorkspace,eligibility:{workerId:'fixture-specialist',topics:['risk'] as [string],publicKnowledge:[],researchEnabled:false,fallbackOrder:1,enabled:true}}]:[])],
  publicContext:()=>evidence,visible:e=>visible&&e.records.every(r=>!hidden.has(h(r.reference))),visibleReferences:refs=>visible&&refs.every(r=>!hidden.has(h(r))),now});
 let service=compose();
 function claim(n='a',prior:string[]=[],session='visitor-a',conversation='conversation-a'):AskClaim {
  const c=structuredClone(ex.AskClaim) as AskClaim;
  c.question={...c.question,questionId:'question-'+n,sessionId:session,conversationId:conversation,priorOwnedQuestionIds:prior,receivedAt:now(),expiresAt:new Date(Date.parse(now())+300000).toISOString(),input:{...c.question.input,text:canary,context:null,priorQuestionId:prior.at(-1)??null}};
  c.question.questionHash=questionHash(c.question);c.leaseExpiresAt=new Date(Date.parse(now())+60000).toISOString();c.claimId='claim-'+n;return c;
 }
 function advance(ms:number){at=new Date(Date.parse(now())+ms).toISOString();drain();}
 const proof=(i:AskRuntimeInput):AskAdmissionProof=>({adapterId:g.adapterId,model:g.model,profileDigest:g.profileDigest,accountDigest:g.accountDigest,routingDigest:g.routingDigest,eligibilityDigest:g.eligibilityDigest,costPolicyDigest:g.costPolicyDigest,contextPolicyDigest:g.contextPolicyDigest,toolPolicyDigest:g.toolPolicyDigest,scopeDigest:g.scopeDigest,limitsDigest:g.limitsDigest,rosterDigest:g.rosterDigest,checkedAt:now(),expiresAt:new Date(Date.parse(now())+60000).toISOString(),providerSessionId:'provider-'+i.execution.execution_id,reservationDigest:h(i.reservation),publicServiceAllowed:true,inputBoundEnforced:false,outputBoundEnforced:false,monitoredUsage:true,subscriptionActivityPolicy:g.subscriptionActivityPolicy,monetaryMode:g.monetaryMode,maxChargeMicros:null});
 const calls:AskRuntimeInput[]=[];let action:((i:AskRuntimeInput,signal:AbortSignal)=>Promise<RuntimeResult>)|undefined;
 const runtime:RuntimeAdapter={type:'fake',supportsInterrupt:true,assertAskAvailable:()=>{},run:async()=>({status:'completed',settled:true,summary:'Authored ordinary task result'}),runAsk:async(i,signal)=>{
  calls.push(i);if(action)return action(i,signal);return answer(i);
 }};
 function start(i:AskRuntimeInput){const p=proof(i);i.bind(p.providerSessionId);i.configured({model:g.model,reasoning_effort:'low',execution_priority:'low',runtime_version:'authored-fixture',runtime_adapter:'fake'});i.admit(p);i.beforeTransmit(p);i.event('runtime_turn_starting',{});i.usage({kind:'start',identity:{threadId:p.providerSessionId,model:g.model,provider:'openai',serviceTier:'standard',freshThread:true}});i.usage({kind:'turn',threadId:p.providerSessionId,turnId:'turn'});return p;}
 function answer(i:AskRuntimeInput,output=5):RuntimeResult {const p=start(i);i.callTool('answer','ask_submit_answer',{text:'Authored private answer',interpretation:'general_answer',evidence:[],publicSources:[],limitations:['Synthetic integration test']});i.usage({kind:'response',threadId:p.providerSessionId,turnId:'turn',responseId:'response',usage:{inputTokens:10,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:output,reasoningOutputTokens:0,totalTokens:10+output}});return{status:'completed',settled:true,providerTurnCompleted:true};}
 let dispatcher=new Dispatcher(company,runtime);
 return{root,worker,other,config,g,runtime,calls,claim,advance,drain,start,answer,ctx,gate(fn:typeof readiness){readiness=fn;},
  get db(){return db;},get company(){return company;},get journal(){return journal;},get controls(){return controls;},get content(){return content;},get service(){return service;},get dispatcher(){return dispatcher;},
  setTime(value:string){at=value;},hide(reference:unknown){hidden.add(h(reference));},
  snapshot(tag:string){
   const companySnapshot=join(root,tag+'-company.sqlite'),contentSnapshot=join(root,tag+'-content.sqlite');
   db.db.exec(`VACUUM INTO '${companySnapshot}'`);const other=new DatabaseSync(join(raw,'content.sqlite'));try{other.exec(`VACUUM INTO '${contentSnapshot}'`);}finally{other.close();}
   chmodSync(companySnapshot,0o600);chmodSync(contentSnapshot,0o600);
   const authoritySnapshot=join(root,tag+'-authority.sqlite'),checkpointSnapshot=join(root,tag+'-checkpoint.json');copyFileSync(journal.path,authoritySnapshot);copyFileSync(journal.checkpointPath,checkpointSnapshot);return{companySnapshot,contentSnapshot,authoritySnapshot,checkpointSnapshot};
  },
  async reopen(snapshot?:{companySnapshot?:string;contentSnapshot?:string;authoritySnapshot?:string;checkpointSnapshot?:string},drainControls=true){
   await dispatcher.stop();content.close();journal.close();db.close();
   for(const [from,to] of [[snapshot?.companySnapshot,join(hq,'company.sqlite')],[snapshot?.contentSnapshot,join(raw,'content.sqlite')],[snapshot?.authoritySnapshot,join(authority,'authority.sqlite')],[snapshot?.checkpointSnapshot,join(checkpoint,'checkpoint.json')]])if(from)copyFileSync(from,to!);
   db=new Store(join(hq,'company.sqlite'));company=new Company(db,hq,process.cwd(),'fake');company.mandates.clock={now:()=>Date.parse(now())};
   journal=new AskAuthorityJournal(authority,checkpoint,g.hqId,[hq]);controls=new AskControlJournal(db,ctx);if(drainControls)drain();content=new AskPrivateContent(db,raw,[hq],ctx,controls);service=compose();dispatcher=new Dispatcher(company,runtime);service.recover();
  },
  setAction(fn:typeof action){action=fn;},setVisible(value:boolean){visible=value;},setEvidence(value:AskPublicContext){evidence=value;},
  async close(){await dispatcher.stop();content.close();journal.close();db.close();rmSync(root,{recursive:true,force:true});}};
}
