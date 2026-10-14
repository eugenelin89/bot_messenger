/** Authored integration fixtures: no genuine employee, account entitlement or public service. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,copyFileSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {createHttpServer} from '../src/http/server.js';
import {Dispatcher} from '../src/control/dispatcher.js';
import {AskService} from '../src/control/ask/service.js';
import {AskControlJournal} from '../src/control/ask/control-journal.js';
import {AskPrivateContent} from '../src/control/ask/private-content.js';
import {AskAuthorityJournal} from '../src/control/ask/authority-journal.js';
import {canonicalHash} from '../scripts/investment-contracts/schema.js';
import {questionHash} from '../scripts/investment-contracts/ask.js';
import type {AskGrant,AskGrantConfiguration,AskAdmissionProof} from '../src/domain/ask/authority.js';
import type {AskRuntimeInput,AskPublicContext} from '../src/domain/ask/execution.js';
import type {RuntimeAdapter,RuntimeResult,AskRuntimeResult} from '../src/runtime/adapter.js';
import {ASK_API_POLICY,ASK_API_DIGESTS,apiCharge,type AskApiUsage} from '../src/domain/ask/api-policy.js';
import type {AskClaim,AskControlReceipt} from '../contracts/investment/v1/types.js';
import {until,objective} from './helpers.js';
const ex=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const h=(value:unknown)=>canonicalHash(value),canary='private-visitor-canary-6f00bc40';
function fixture(twoWorkers=false,api=false){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'ask-service-')));
 const hq=join(root,'hq'),raw=join(root,'content'),authority=join(root,'authority'),checkpoint=join(root,'checkpoint'),workspace=join(root,'public-workspace');
 for(const dir of [hq,raw,authority,checkpoint,workspace])mkdirSync(dir,{mode:0o700});
 let db=new Store(join(hq,'company.sqlite')),company=new Company(db,hq,process.cwd(),'fake');const worker=company.initializeCEO(),other=twoWorkers?company.initializeNix().worker:undefined;
 const otherWorkspace=join(root,'second-public-workspace');if(other)mkdirSync(otherWorkspace,{mode:0o700});
 let at='2026-01-05T21:32:00.000Z',visible=true;const hidden=new Set<string>();
 company.mandates.clock={now:()=>Date.parse(at)};
 const config:AskGrantConfiguration={scope:structuredClone(ex.AskServiceScope),limits:structuredClone(ex.AskLimits),roster:structuredClone(ex.AskRoster)};
 config.limits={...config.limits,monetaryEnforcement:'activity_capped_subscription',dailyBudgetUsd:null,maxRouterExecutions:0,maxResearchCalls:0,
  subscriptionActivityPolicy:{version:'1',tokenLimits:'monitored_thresholds',actualCost:'unavailable',overshoot:'possible',internalRetries:'possible',onMissingUsage:'hold',onThresholdViolation:'hold'}};
 if(other)config.roster.workers.push({...structuredClone(config.roster.workers[0]!),worker:{...structuredClone(config.roster.workers[0]!.worker),workerId:'fixture-specialist',name:'Nix'},topics:['risk']});
 const g:AskGrant={id:'fixture-grant',hqId:'fixture-hq',serviceId:config.scope.serviceId,generation:config.scope.consumerGeneration,
  scopeDigest:h(config.scope),limitsDigest:h(config.limits),rosterDigest:h(config.roster),workerIds:config.roster.workers.map(w=>w.worker.workerId),adapterId:'fake',model:'fake-model',profileDigest:h('profile'),accountDigest:h('account'),routingDigest:h('routing'),eligibilityDigest:h('eligibility'),costPolicyDigest:h('cost'),contextPolicyDigest:h('context'),toolPolicyDigest:h('tools'),approvalDigest:h('approval'),approvedAt:at,expiresAt:'2026-01-05T23:32:00.000Z',maxExecutions:4,dailyExecutions:4,maxInputTokens:100,maxOutputTokens:50,totalTokens:600,dailyTokens:600,maxDurationMs:60000,maxChargeMicros:null,totalChargeMicros:null,dailyChargeMicros:null,monetaryMode:'activity_capped_subscription',subscriptionActivityPolicy:config.limits.subscriptionActivityPolicy,routerExecutions:0,researchCalls:0};
 if(api){
  config.limits={...config.limits,monetaryEnforcement:'verified_cap',dailyBudgetUsd:'5',maxInputTokens:400000,maxOutputTokens:3072,dailyTokens:1612288};delete config.limits.subscriptionActivityPolicy;
  Object.assign(g,{...ASK_API_DIGESTS,id:'api-grant',adapterId:ASK_API_POLICY.adapterId,model:ASK_API_POLICY.model,limitsDigest:h(config.limits),monetaryMode:'verified_cap',maxInputTokens:400000,maxOutputTokens:3072,totalTokens:1612288,dailyTokens:1612288,maxChargeMicros:'314000',totalChargeMicros:'5000000',dailyChargeMicros:'5000000'});delete g.subscriptionActivityPolicy;
 }
 let journal=AskAuthorityJournal.createFixture(authority,checkpoint,g.hqId,[hq],at);journal.approve(g,config,at);
 const ctx=()=>({scope:config.scope,limits:config.limits,now:at});let controls=new AskControlJournal(db,ctx);
 function drain(values:AskControlReceipt[]=[]){for(const list of values.length?[values,[]]:[[]]){const x=controls.prepareSync();controls.acceptPage(x.operation.input.syncId,{schemaVersion:'1.0',syncId:x.operation.input.syncId,controls:list,nextCursor:null,checkedAt:at,validUntil:new Date(Date.parse(at)+60000).toISOString()});}}
 drain();let content=new AskPrivateContent(db,raw,[hq],ctx,controls);
 let evidence:AskPublicContext={records:[],documents:[]};
 const compose=()=>new AskService(company,{current:()=>config,get grantId(){return g.id;},authority:journal,controls,content,
  workers:[{publicId:'fixture-author',workerId:worker.worker_id,workspace,eligibility:{workerId:'fixture-author',topics:['general','synthetic'],publicKnowledge:[],researchEnabled:false,fallbackOrder:0,enabled:true}},...(other?[{publicId:'fixture-specialist',workerId:other.worker_id,workspace:otherWorkspace,eligibility:{workerId:'fixture-specialist',topics:['risk'] as [string],publicKnowledge:[],researchEnabled:false,fallbackOrder:1,enabled:true}}]:[])],
  publicContext:()=>evidence,visible:e=>visible&&e.records.every(r=>!hidden.has(h(r.reference))),visibleReferences:refs=>visible&&refs.every(r=>!hidden.has(h(r))),now:()=>at});
 let service=compose();
 function claim(n='a',prior:string[]=[],session='visitor-a',conversation='conversation-a'):AskClaim {
  const c=structuredClone(ex.AskClaim) as AskClaim;
  c.question={...c.question,questionId:'question-'+n,sessionId:session,conversationId:conversation,priorOwnedQuestionIds:prior,receivedAt:at,expiresAt:new Date(Date.parse(at)+300000).toISOString(),input:{...c.question.input,text:canary,context:null,priorQuestionId:prior.at(-1)??null}};
  c.question.questionHash=questionHash(c.question);c.leaseExpiresAt=new Date(Date.parse(at)+60000).toISOString();c.claimId='claim-'+n;return c;
 }
 function advance(ms:number){at=new Date(Date.parse(at)+ms).toISOString();drain();}
 const proof=(i:AskRuntimeInput):AskAdmissionProof=>({adapterId:g.adapterId,model:g.model,profileDigest:g.profileDigest,accountDigest:g.accountDigest,routingDigest:g.routingDigest,eligibilityDigest:g.eligibilityDigest,costPolicyDigest:g.costPolicyDigest,contextPolicyDigest:g.contextPolicyDigest,toolPolicyDigest:g.toolPolicyDigest,scopeDigest:g.scopeDigest,limitsDigest:g.limitsDigest,rosterDigest:g.rosterDigest,checkedAt:at,expiresAt:new Date(Date.parse(at)+60000).toISOString(),providerSessionId:'provider-'+i.execution.execution_id,reservationDigest:h(i.reservation),publicServiceAllowed:true,inputBoundEnforced:false,outputBoundEnforced:false,monitoredUsage:true,subscriptionActivityPolicy:g.subscriptionActivityPolicy,monetaryMode:g.monetaryMode,maxChargeMicros:null});
 const calls:AskRuntimeInput[]=[];let action:((i:AskRuntimeInput,signal:AbortSignal)=>Promise<RuntimeResult>)|undefined;
 const runtime:RuntimeAdapter={type:'fake',supportsInterrupt:true,assertAskAvailable:()=>{},run:async()=>({status:'completed',settled:true,summary:'Authored ordinary task result'}),runAsk:async(i,signal)=>{
  calls.push(i);if(action)return action(i,signal);return answer(i);
 }};
 function start(i:AskRuntimeInput){const p=proof(i);i.bind(p.providerSessionId);i.configured({model:g.model,reasoning_effort:'low',execution_priority:'low',runtime_version:'authored-fixture',runtime_adapter:'fake'});i.admit(p);i.beforeTransmit(p);i.event('runtime_turn_starting',{});i.usage({kind:'start',identity:{threadId:p.providerSessionId,model:g.model,provider:'openai',serviceTier:'standard',freshThread:true}});i.usage({kind:'turn',threadId:p.providerSessionId,turnId:'turn'});return p;}
 function answer(i:AskRuntimeInput,output=5):RuntimeResult {const p=start(i);i.callTool('answer','ask_submit_answer',{text:'Authored private answer',interpretation:'general_answer',evidence:[],publicSources:[],limitations:['Synthetic integration test']});i.usage({kind:'response',threadId:p.providerSessionId,turnId:'turn',responseId:'response',usage:{inputTokens:10,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:output,reasoningOutputTokens:0,totalTokens:10+output}});return{status:'completed',settled:true,providerTurnCompleted:true};}
 let dispatcher=new Dispatcher(company,runtime);
 return{root,worker,other,config,g,runtime,calls,claim,advance,drain,start,answer,
  get db(){return db;},get company(){return company;},get journal(){return journal;},get controls(){return controls;},get content(){return content;},get service(){return service;},get dispatcher(){return dispatcher;},
  setTime(value:string){at=value;},hide(reference:unknown){hidden.add(h(reference));},
  snapshot(tag:string){
   const companySnapshot=join(root,tag+'-company.sqlite'),contentSnapshot=join(root,tag+'-content.sqlite');
   db.db.exec(`VACUUM INTO '${companySnapshot}'`);const other=new DatabaseSync(join(raw,'content.sqlite'));try{other.exec(`VACUUM INTO '${contentSnapshot}'`);}finally{other.close();}
   chmodSync(companySnapshot,0o600);chmodSync(contentSnapshot,0o600);
   const authoritySnapshot=join(root,tag+'-authority.sqlite'),checkpointSnapshot=join(root,tag+'-checkpoint.json');copyFileSync(journal.path,authoritySnapshot);copyFileSync(journal.checkpointPath,checkpointSnapshot);return{companySnapshot,contentSnapshot,authoritySnapshot,checkpointSnapshot};
  },
  async reopen(snapshot?:{companySnapshot?:string;contentSnapshot?:string;authoritySnapshot?:string;checkpointSnapshot?:string}){
   await dispatcher.stop();content.close();journal.close();db.close();
   for(const [from,to] of [[snapshot?.companySnapshot,join(hq,'company.sqlite')],[snapshot?.contentSnapshot,join(raw,'content.sqlite')],[snapshot?.authoritySnapshot,join(authority,'authority.sqlite')],[snapshot?.checkpointSnapshot,join(checkpoint,'checkpoint.json')]])if(from)copyFileSync(from,to!);
   db=new Store(join(hq,'company.sqlite'));company=new Company(db,hq,process.cwd(),'fake');company.mandates.clock={now:()=>Date.parse(at)};
   journal=new AskAuthorityJournal(authority,checkpoint,g.hqId,[hq]);controls=new AskControlJournal(db,ctx);drain();content=new AskPrivateContent(db,raw,[hq],ctx,controls);service=compose();dispatcher=new Dispatcher(company,runtime);service.recover();
  },
  setAction(fn:typeof action){action=fn;},setVisible(value:boolean){visible=value;},setEvidence(value:AskPublicContext){evidence=value;},
  async close(){await dispatcher.stop();content.close();journal.close();db.close();rmSync(root,{recursive:true,force:true});}};
}

test('shared Dispatcher routes an existing worker through distinct Ask origin and private outbox only',async t=>{
 const f=fixture();t.after(f.close);const q=f.claim();f.service.importClaim(q);f.dispatcher.start();await until(()=>f.content.metadata(q.question.questionId).state==='answer_staged');
 assert.equal(f.calls.length,1);const i=f.calls[0]!;assert.equal(i.mode,'public_question');assert.equal(i.worker.worker_id,f.worker.worker_id);assert.equal(i.execution.origin,'public_question');assert.equal(i.execution.task_id,null);assert.equal(i.execution.request_id,null);assert.equal(i.binding,undefined);
 assert.deepEqual(i.tools.map(t=>t.name),['ask_submit_answer']);assert.equal(f.company.binding(f.worker.worker_id),undefined);
 for(const table of ['tasks','conversation_messages','worker_messages','artifacts'])if(f.db.get('SELECT 1 FROM sqlite_master WHERE type=\'table\' AND name=?',table))assert.equal(JSON.stringify(f.db.all(`SELECT * FROM ${table}`)).includes(canary),false);
 for(const {name} of f.db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))assert.equal(JSON.stringify(f.db.all(`SELECT * FROM "${name}"`)).includes(canary),false,name);
 assert.equal(f.journal.inspect().models[0]?.state,'settled');assert.equal(f.company.aiUsage.records()[0]?.completeness,'complete');assert.equal(f.company.aiUsage.records()[0]?.actualSubscriptionCharges,'unavailable');
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
});
test('ordinary owner work is admitted first and busy employees consume no Ask reservation',async t=>{
 const f=fixture();t.after(f.close);const task=f.company.createTask('human',f.worker,objective,null),owner=f.company.claimNext()!;
 f.service.importClaim(f.claim());assert.equal(f.service.claimNext(2),undefined);assert.equal(f.journal.inspect().models.length,0);
 f.company.finish(owner.execution.execution_id,{status:'completed',summary:'Private task result'});assert.equal(f.company.task(task.task_id).status,'completed');
 const turn=f.service.claimNext(2)!;assert.ok(turn);assert.equal(JSON.stringify(turn.context).includes('Private task result'),false);
 assert.throws(()=>turn.runtime.callTool('trade','paper_propose',{}));assert.throws(()=>turn.runtime.callTool('owner','hire_worker',{}));
 await f.service.run(turn,f.runtime,new AbortController().signal);
});
test('duplicate immutable imports and one Ask slot cannot duplicate inference',async t=>{
 const f=fixture();t.after(f.close);const q=f.claim();f.service.importClaim(q);f.service.importClaim(q);const turn=f.service.claimNext(2)!;assert.ok(turn);assert.equal(f.service.claimNext(2),undefined);
 await f.service.run(turn,f.runtime,new AbortController().signal);f.service.importClaim(q);assert.equal(f.service.claimNext(2),undefined);assert.equal(f.calls.length,1);
});
test('record provenance outranks general routing and withdrawn evidence suppresses pending output',async t=>{
 const f=fixture();t.after(f.close);const q=f.claim();q.question.input.context=structuredClone(ex.AskQuestion.input.context);assert.ok(q.question.input.context);q.question.questionHash=questionHash(q.question);
 f.setEvidence({records:[{reference:q.question.input.context!,authorWorkerIds:['fixture-author'],text:'Synthetic public decision',knowledgeAsOf:null}],documents:[]});
 f.service.importClaim(q);const turn=f.service.claimNext(2)!;assert.equal(turn.route.reason,'record_provenance');
 f.setAction(async i=>{const result=f.answer(i);f.setVisible(false);return result;});await f.service.run(turn,f.runtime,new AbortController().signal);
 assert.equal(f.content.metadata(q.question.questionId).answer_id,null);assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_dispatches')?.state,'suppressed');assert.equal(f.company.providerUnresolved(f.worker.worker_id),false);
});
test('confirmed private answer supplies only the same visitor follow-up history',async t=>{
 const f=fixture();t.after(f.close);const q=f.claim();f.service.importClaim(q);await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 const a=f.content.pendingAnswer(q.question.questionId)!.answer;f.content.recordReceipt({schemaVersion:'1.0',answerId:a.answerId,questionId:a.questionId,questionHash:a.questionHash,answerDigest:h(a),receiptId:'receipt-a',receivedAt:a.generatedAt,disposition:'accepted'});
 f.advance(240000);const follow=f.claim('b',[q.question.questionId]);f.service.importClaim(follow);const turn=f.service.claimNext(2)!;assert.equal(turn.history.length,1);assert.equal(turn.route.reason,'follow_up');await f.service.run(turn,f.runtime,new AbortController().signal);
 f.advance(240000);const crossed=f.claim('c',[q.question.questionId],'visitor-b','conversation-b');assert.throws(()=>f.service.importClaim(crossed));assert.equal(f.calls.length,2);
});
test('uncertain execution blocks replacement inference and shared worker work after recovery',async t=>{
 const f=fixture();t.after(f.close);f.setAction(async i=>{f.start(i);return{status:'failed',settled:false};});f.service.importClaim(f.claim());await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 assert.equal(f.journal.inspect().models[0]?.state,'unknown');assert.equal(f.company.providerUnresolved(f.worker.worker_id),true);f.company.createTask('human',f.worker,objective,null);assert.equal(f.company.claimNext(),undefined);f.service.recover();assert.equal(f.service.claimNext(2),undefined);
});
test('complete usage over the monitored threshold is retained and permanently holds new Ask work',async t=>{
 const f=fixture();t.after(f.close);f.setAction(async i=>f.answer(i,51));f.service.importClaim(f.claim());await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 assert.equal(f.journal.inspect().models[0]?.state,'settled_over_limit');assert.equal(f.journal.inspect().models[0]?.receipt?.outputTokens,51);assert.equal(f.content.metadata('question-a').answer_id,null);assert.throws(()=>f.journal.assertCurrent(f.g.id,f.g.approvedAt));
});
test('cancel/delete controls suppress a late confirmed answer without poisoning known provider settlement',async t=>{
 const f=fixture();t.after(f.close);const q=f.claim();f.service.importClaim(q);const turn=f.service.claimNext(2)!;
 f.setAction(async i=>{const result=f.answer(i);f.drain([{schemaVersion:'1.0',controlId:'delete-a',conversationId:q.question.conversationId,questionId:null,action:'delete',effectiveAt:q.question.receivedAt,purgeBy:q.question.receivedAt,suppressionUntil:'2026-01-12T21:32:00.000Z'}]);f.service.maintenance();return result;});
 await f.service.run(turn,f.runtime,new AbortController().signal);assert.equal(f.content.metadata(q.question.questionId).state,'suppressed');assert.equal(f.journal.inspect().models[0]?.state,'settled');assert.equal(f.company.providerUnresolved(f.worker.worker_id),false);assert.throws(()=>turn.runtime.callTool('late','ask_submit_answer',{}));
});
test('foreign and mixed execution ownership is rejected by the migrated database',async t=>{
 const f=fixture();t.after(f.close);
 assert.throws(()=>f.db.run("INSERT INTO executions(execution_id,worker_id,origin,status,started_at) VALUES('orphan',?,'public_question','running',?)",f.worker.worker_id,f.g.approvedAt));
 f.service.importClaim(f.claim());const turn=f.service.claimNext(2)!;assert.throws(()=>f.db.run("UPDATE executions SET origin='task' WHERE execution_id=?",turn.runtime.execution.execution_id));
 assert.throws(()=>f.db.run('UPDATE ask_dispatches SET generation=?','2'));assert.deepEqual(f.db.all('PRAGMA foreign_key_check'),[]);await f.service.run(turn,f.runtime,new AbortController().signal);
});
async function delivered(f:ReturnType<typeof fixture>){
 const q=f.claim();f.service.importClaim(q);await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 const a=f.content.pendingAnswer(q.question.questionId)!.answer;f.content.recordReceipt({schemaVersion:'1.0',answerId:a.answerId,questionId:a.questionId,questionHash:a.questionHash,answerDigest:h(a),receiptId:'receipt-initial',receivedAt:a.generatedAt,disposition:'accepted'});return q;
}
test('prior-turn cancellation between reservation and transmission removes cached visitor history',async t=>{
 const f=fixture();t.after(f.close);const first=await delivered(f);f.advance(240000);const q=f.claim('follow',[first.question.questionId]);f.service.importClaim(q);const turn=f.service.claimNext(2)!;
 f.drain([{schemaVersion:'1.0',controlId:'cancel-prior',conversationId:first.question.conversationId,questionId:first.question.questionId,action:'cancel',effectiveAt:q.question.receivedAt,purgeBy:q.question.receivedAt,suppressionUntil:'2026-01-12T21:36:00.000Z'}]);
 await f.service.run(turn,f.runtime,new AbortController().signal);assert.equal(f.calls.length,1);assert.equal(f.journal.inspect().models[1]?.state,'settled');assert.equal(f.journal.inspect().models[1]?.proof,null);
});
test('withdrawal of uncited supplied evidence blocks reuse of the historical answer',async t=>{
 const f=fixture();t.after(f.close);const a=structuredClone(ex.AskQuestion.input.context),b=structuredClone(a);b.record.id='uncited-b';
 f.setEvidence({records:[a,b].map(reference=>({reference,authorWorkerIds:['fixture-author'],text:'Synthetic public evidence',knowledgeAsOf:null})),documents:[]});const first=await delivered(f);
 f.setEvidence({records:[],documents:[]});f.advance(240000);f.hide(b);const q=f.claim('follow',[first.question.questionId]);f.service.importClaim(q);assert.throws(()=>f.service.claimNext(2));assert.equal(f.journal.inspect().models.length,1);
});
test('Ask content custody failure holds only Ask and does not pause unrelated owner dispatch',async t=>{
 const f=fixture();t.after(f.close);const nix=f.company.initializeNix().worker,task=f.company.createTask('human',nix,objective,null);f.content.maintenance=()=>{throw Error('synthetic private custody unavailable');};
 f.dispatcher.start();await until(()=>f.company.task(task.task_id).status==='completed');assert.equal(f.company.paused,false);assert.equal(f.journal.inspect().models.length,0);assert.equal(f.db.get<{unresolved:number}>('SELECT unresolved FROM ask_service_holds')?.unresolved,0);
});
for(const stage of ['after-settlement','after-answer'] as const)test('reopened stores preserve provider certainty at '+stage+' crash window',async t=>{
 const f=fixture();t.after(f.close);f.service.importClaim(f.claim());const original=f.content.commitAnswer.bind(f.content);let snapshot:ReturnType<typeof f.snapshot>|undefined;
 f.content.commitAnswer=(id,answer)=>{if(stage==='after-settlement')snapshot=f.snapshot(stage);const result=original(id,answer);if(stage==='after-answer')snapshot=f.snapshot(stage);return result;};
 await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);assert.ok(snapshot);await f.reopen(snapshot);
 assert.equal(f.journal.inspect().models[0]?.state,'settled');assert.equal(f.company.providerUnresolved(f.worker.worker_id),false);assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_dispatches')?.state,stage==='after-answer'?'completed':'failed');assert.equal(f.service.claimNext(2),undefined);assert.equal(f.calls.length,1);
});
test('older mutually consistent authority files cannot erase newer Company consumption',async t=>{
 const f=fixture();t.after(f.close);const before=f.snapshot('before');await delivered(f);await f.reopen({authoritySnapshot:before.authoritySnapshot,checkpointSnapshot:before.checkpointSnapshot});
 assert.equal(f.db.get<{unresolved:number}>('SELECT unresolved FROM ask_service_holds')?.unresolved,1);assert.equal(f.company.providerUnresolved(f.worker.worker_id),true);assert.equal(f.company.paused,false);assert.equal(f.service.claimNext(2),undefined);
});
test('answer storage failure retains known provider settlement behind an Ask reconciliation hold',async t=>{
 const f=fixture();t.after(f.close);const original=f.content.commitAnswer.bind(f.content);f.content.commitAnswer=(id,answer)=>{original(id,answer);throw Error('synthetic crash after private commit');};
 f.service.importClaim(f.claim());await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 assert.equal(f.journal.inspect().models[0]?.state,'settled');assert.equal(f.company.providerUnresolved(f.worker.worker_id),false);assert.equal(f.db.get<{reason:string}>('SELECT reason FROM ask_service_holds')?.reason,'content_reconciliation');assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_dispatches')?.state,'failed');
});
test('lifecycle wakeups cover duty cooldown and executed content metadata can retire independently',async t=>{
 const f=fixture();t.after(f.close);await delivered(f);const q=f.claim('queued');q.leaseExpiresAt=q.question.expiresAt;f.service.importClaim(q);assert.equal(f.service.claimNext(2),undefined);assert.ok(f.service.nextWake());
 f.advance(240000);const turn=f.service.claimNext(2)!;assert.ok(turn);await f.service.run(turn,f.runtime,new AbortController().signal);
 f.setTime('2026-02-06T00:00:00.000Z');f.content.maintenance();const pruned=f.content.pruneMetadata();assert.equal(pruned.imports,2);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM ask_dispatches')?.n,2);assert.equal(f.journal.inspect().models.length,2);f.service.recover();assert.ok(f.db.all<{status:string}>("SELECT status FROM executions WHERE origin='public_question'").every(e=>e.status==='completed'));assert.deepEqual(f.db.all('PRAGMA foreign_key_check'),[]);
});
test('Ask and a different ordinary employee share two database execution slots',async t=>{
 const f=fixture();t.after(f.close);const nix=f.company.initializeNix().worker;f.service.importClaim(f.claim());const ask=f.service.claimNext(2)!;f.company.createTask('human',nix,objective,null);const ordinary=f.company.claimWorkNext(2)!;assert.ok(ordinary);
 assert.equal(f.db.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")?.n,2);assert.equal(f.company.claimWorkNext(2),undefined);assert.equal(f.service.claimNext(2),undefined);
 f.company.finish(ordinary.execution.execution_id,{status:'completed',summary:'Synthetic ordinary work'});await f.service.run(ask,f.runtime,new AbortController().signal);assert.equal(f.journal.inspect().models.length,1);
});
test('transitive public dependencies survive omission of an earlier visitor turn',async t=>{
 const f=fixture();t.after(f.close);const reference=structuredClone(ex.AskQuestion.input.context);
 f.setEvidence({records:[{reference,authorWorkerIds:['fixture-author'],text:'Uncited public dependency of the first answer',knowledgeAsOf:null}],documents:[]});const first=await delivered(f);
 f.advance(240000);f.setEvidence({records:[],documents:[]});const second=f.claim('second',[first.question.questionId]);f.service.importClaim(second);await f.service.run(f.service.claimNext(2)!,f.runtime,new AbortController().signal);
 const answer=f.content.pendingAnswer(second.question.questionId)!.answer;f.content.recordReceipt({schemaVersion:'1.0',answerId:answer.answerId,questionId:answer.questionId,questionHash:answer.questionHash,answerDigest:h(answer),receiptId:'receipt-second',receivedAt:answer.generatedAt,disposition:'accepted'});
 f.advance(240000);f.hide(reference);const third=f.claim('third',[second.question.questionId]);f.service.importClaim(third);assert.throws(()=>f.service.claimNext(2));assert.equal(f.calls.length,2);
});
test('a returned Ask provider identity cannot alias an existing private binding',async t=>{
 const f=fixture();t.after(f.close);f.company.createTask('human',f.worker,objective,null);const ordinary=f.company.claimNext()!;
 f.company.setBinding(ordinary.context,{worker_id:f.worker.worker_id,runtime_type:'fake',runtime_reference:'private-provider-thread',workspace_path:f.worker.workspace_path,created_at:f.g.approvedAt,thread_name:'Private worker'});
 f.company.finish(ordinary.execution.execution_id,{status:'completed',summary:'Authored private result'});
 f.service.importClaim(f.claim());const turn=f.service.claimNext(2)!;assert.throws(()=>turn.runtime.bind('private-provider-thread'));assert.equal(f.journal.inspect().models[0]?.state,'reserved');
});
test('unavailable public runtime consumes no finite reservation while ordinary work completes',async t=>{
 const f=fixture();t.after(f.close);f.runtime.assertAskAvailable=()=>{throw Error('Public eligibility unavailable');};f.service.importClaim(f.claim());
 const nix=f.company.initializeNix().worker,task=f.company.createTask('human',nix,objective,null);f.dispatcher.start();await until(()=>f.company.task(task.task_id).status==='completed');
 assert.equal(f.calls.length,0);assert.equal(f.journal.inspect().models.length,0);assert.equal(f.content.metadata('question-a').state,'available');assert.equal(f.company.paused,false);
});
test('a follow-up with a new approved topic hands off to the relevant existing employee',async t=>{
 const f=fixture(true);t.after(f.close);const first=await delivered(f);f.advance(240000);const q=f.claim('risk-follow-up',[first.question.questionId]);q.question.input.text='What risk was identified?';q.question.questionHash=questionHash(q.question);f.service.importClaim(q);
 const turn=f.service.claimNext(2)!;assert.equal(turn.route.reason,'topic');assert.equal(turn.route.previousWorkerId,'fixture-author');assert.equal(turn.route.workerId,'fixture-specialist');assert.equal(turn.runtime.worker.worker_id,f.other!.worker_id);await f.service.run(turn,f.runtime,new AbortController().signal);
});
test('shorter replacement authority cannot shorten a previously incurred duty cooldown',async t=>{
 const f=fixture();t.after(f.close);await delivered(f);f.advance(30000);f.g.id='shorter-grant';f.g.maxDurationMs=10000;f.g.approvedAt='2026-01-05T21:32:30.000Z';f.journal.approve(f.g,f.config,f.g.approvedAt);
 f.service.importClaim(f.claim('second'));f.advance(40000);assert.equal(f.service.claimNext(2),undefined);assert.equal(f.journal.inspect().models.length,1);
 assert.equal(f.db.get<{duty_until:string}>('SELECT duty_until FROM ask_dispatches')?.duty_until,'2026-01-05T21:36:00.000Z');
});

for(const outcome of ['completed','incomplete','paused-after-answer'] as const)test(`strict API ${outcome} retains priced settlement across restart without investment authority`,async t=>{
 const f=fixture(false,true);t.after(f.close);
 const tokens={inputTokens:10,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:5,reasoningOutputTokens:0,totalTokens:15};
 const api:AskApiUsage={version:'ask-responses-v1',responseId:'resp_authored',requestId:'req_authored',model:f.g.model,serviceTier:'default',status:outcome==='incomplete'?'incomplete':'completed',bodyDigest:h('authored response only'),tokens,chargeMicros:apiCharge(tokens)};
 f.setAction(async(i):Promise<AskRuntimeResult>=>{
  const g=f.g,p:AskAdmissionProof={...ASK_API_DIGESTS,adapterId:g.adapterId,model:g.model,accountDigest:g.accountDigest,scopeDigest:g.scopeDigest,limitsDigest:g.limitsDigest,rosterDigest:g.rosterDigest,checkedAt:g.approvedAt,expiresAt:i.localDeadline,providerSessionId:'public-api-session',reservationDigest:h(i.reservation),publicServiceAllowed:true,inputBoundEnforced:true,outputBoundEnforced:true,monetaryMode:'verified_cap',maxChargeMicros:g.maxChargeMicros};
  i.bind(p.providerSessionId);i.configured({model:g.model,reasoning_effort:'none',execution_priority:'low',runtime_adapter:g.adapterId,runtime_version:'ask-responses-v1'});i.admit(p);i.event('runtime_turn_starting',{});i.beforeTransmit(p);
  i.usage({kind:'start',identity:{threadId:p.providerSessionId,model:g.model,provider:'openai',serviceTier:'default',freshThread:true}});i.usage({kind:'turn',threadId:p.providerSessionId,turnId:api.responseId});i.usage({kind:'response',threadId:p.providerSessionId,turnId:api.responseId,responseId:api.responseId,usage:tokens});
  if(outcome!=='incomplete')i.callTool('answer','ask_submit_answer',{text:'Authored API fixture answer',interpretation:'general_answer',evidence:[],publicSources:[],limitations:['Not genuine inference']});
  if(outcome==='paused-after-answer')f.service.pauseOwner(true);
  return{status:outcome==='incomplete'?'failed':'completed',settled:true,providerTurnCompleted:outcome!=='incomplete',apiUsage:api};
 });
 const q=f.claim();f.service.importClaim(q);const turn=f.service.claimNext(2)!;await f.service.run(turn,f.runtime,new AbortController().signal);
 const model=f.journal.inspect().models[0]!;assert.equal(model.state,'settled');assert.equal(model.receipt?.chargeMicros,'30');assert.equal(model.receipt?.api?.responseId,'resp_authored');
 assert.equal(f.company.aiUsage.records()[0]?.completeness,'complete');assert.equal(f.company.aiUsage.records()[0]?.estimate?.usd,'0.000030000000');
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
 assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_dispatches')!.state,outcome==='completed'?'completed':outcome==='incomplete'?'failed':'suppressed');
 if(outcome==='paused-after-answer'){assert.equal(f.company.paused,false);assert.equal(f.service.inspect().closed,false);f.service.pauseOwner(false);assert.equal(f.service.ownerPaused,false);}
 await f.reopen();assert.equal(f.journal.inspect().models[0]?.receipt?.chargeMicros,'30');assert.equal(f.company.aiUsage.records()[0]?.completeness,'complete');
});

test('owner HTTP pause requires local Origin/CSRF, persists independently and does not pause investing',async t=>{
 const f=fixture();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));t.after(async()=>{await http.close();await f.close();});
 const base='http://127.0.0.1:'+(http.server.address() as {port:number}).port,{csrfToken}=await(await fetch(base+'/api/session')).json() as {csrfToken:string};
 const post=(body:unknown,headers:Record<string,string>={})=>fetch(base+'/api/ask/pause',{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':csrfToken,...headers},body:JSON.stringify(body)});
 assert.equal((await post({paused:true},{Origin:'https://foreign.invalid'})).status,403);assert.equal((await post({paused:true},{'X-BotSquad-Token':'wrong'})).status,403);
 assert.equal((await post({paused:true,actor:'human'})).status,400);assert.equal(f.service.ownerPaused,false);
 assert.equal((await post({paused:true})).status,200);assert.equal(f.service.ownerPaused,true);assert.equal(f.company.paused,false);assert.equal(f.journal.inspect().models.length,0);
 assert.equal((await post({paused:false})).status,200);assert.equal(f.service.ownerPaused,false);assert.equal(f.company.paused,false);
});
