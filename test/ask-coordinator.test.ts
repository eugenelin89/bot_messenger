/** Authored cross-boundary fixtures only; no network/provider entitlement or live answers. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {canonicalHash as hash,canonicalJson as json} from '../scripts/investment-contracts/schema.js';
import {askConfigurationHash} from '../scripts/investment-contracts/ask.js';
import {decodeAskResponse,type AskOperation,type AskKind} from '../src/domain/ask/contract.js';
import {AskCoordinator} from '../src/control/ask/coordinator.js';
import type {AskClient} from '../src/control/ask/transport.js';
import type {AskServiceConfiguration,AskAnswerReceipt,AskControlReceipt} from '../contracts/investment/v1/types.js';
import {fixture} from './ask-coordinator-helpers.js';
function setup(maxAttempts=100){
 const f=fixture();let backendReady=true;let flags={admissionEnabled:true,claimsEnabled:true,deliveryEnabled:true,held:false},revision=1;
 let queue=[f.claim()],controls:AskControlReceipt[]=[],lose:AskKind|undefined,missing=false,hostile=false,configHostile=false;
 queue[0]!.leaseExpiresAt=new Date(Date.parse(f.ctx().now)+90000).toISOString();const original=structuredClone(queue[0]!);let known:AskAnswerReceipt|undefined;const calls:AskOperation[]=[],seen=new Map<string,unknown>();
 function snapshot(){const c:AskServiceConfiguration={schemaVersion:'1.0',serviceId:f.config.scope.serviceId,consumerGeneration:f.config.scope.consumerGeneration,configurationRevision:String(revision),configurationHash:'0'.repeat(64),scope:structuredClone(f.config.scope),limits:structuredClone(f.config.limits),roster:structuredClone(f.config.roster),privacyNoticeVersion:'fixture-privacy',checkedAt:f.ctx().now,validUntil:new Date(Date.parse(f.ctx().now)+60000).toISOString(),...flags};if(configHostile)c.roster.workers[0]!.worker.name='private-visitor-canary-6f00bc40';c.configurationHash=askConfigurationHash(c);return c;}
 const client:{offline:true;create:(o:any)=>AskClient}={offline:true,create:options=>({exchange:async(raw,intent)=>{
  const operation=raw as AskOperation;
  const b=intent.binding;options.beforeTransmit({kind:intent.kind,serviceId:b.serviceId,generation:b.generation,requestId:intent.requestId,intentDigest:hash(intent),signedWireDigest:hash(randomUUID()),answerIdentity:intent.kind==='answer'||intent.kind==='receipt'?{serviceId:b.serviceId,answerId:b.answerId!,questionId:b.questionId!,questionHash:b.questionHash!,answerDigest:b.answerDigest!,generatedAt:b.answerGeneratedAt!}:null});
  calls.push(structuredClone(operation));let value:unknown,status=200;
  const key=intent.requestId?intent.kind+'/'+intent.requestId:null;
  if(key&&seen.has(key))value=seen.get(key);
  else switch(operation.kind){
   case 'configuration':value=snapshot();break;
   case 'control_sync':value={schemaVersion:'1.0',syncId:operation.input.syncId,controls, nextCursor:null,checkedAt:f.ctx().now,validUntil:new Date(Date.parse(f.ctx().now)+60000).toISOString()};controls=[];break;
   case 'claim':value={schemaVersion:'1.0',claimRequestId:operation.input.claimRequestId,claim:queue.shift()??null,retryAfterSeconds:15};break;
   case 'renew':value={...operation.claim,leaseExpiresAt:new Date(Date.parse(f.ctx().now)+90000).toISOString()};break;
   case 'status':value=structuredClone(operation.input.status);if(hostile){(value as any).safeReason='private-visitor-canary-6f00bc40';if((value as any).route)(value as any).route.explanation='private-visitor-canary-6f00bc40';}break;
   case 'answer':if(!missing)known={schemaVersion:'1.0',receiptId:'receipt-fixture',answerId:operation.input.answer.answerId,questionId:operation.input.answer.questionId,questionHash:operation.input.answer.questionHash,answerDigest:hash(operation.input.answer),receivedAt:f.ctx().now,disposition:'accepted'};value=known;break;
   case 'receipt':if(known)value=known;else{status=404;value={schemaVersion:'1.0',code:'NOT_FOUND',status:404,retryable:false,detail:'Resource is unavailable.',requestId:'fixture-request',retryAfterSeconds:null,resync:null};}break;
  }
  if(key&&value&&status===200)seen.set(key,value);
  if(lose===operation.kind){lose=undefined;return{kind:'unknown',code:'network',status:null};}
  const response=decodeAskResponse(intent,{status,contentType:status===200?'application/json':'application/problem+json',cacheControl:'private, no-store',bytes:Buffer.from(json(value))},options.current());return{kind:'response',response} as any;
 }})};
 let coordinator:AskCoordinator;
 function compose(){coordinator=new AskCoordinator(f.db,{current:f.ctx,approved:f.config,authority:f.journal,controls:f.controls,content:f.content,service:f.service,keys:{has:()=>true,sign:()=>Buffer.alloc(64)},assertRuntimeAvailable:()=>{assert.ok(backendReady);},bodyOperationsReady:()=>backendReady&&!f.service.ownerPaused,maxAttempts,expiresAt:f.g.expiresAt,privacyNoticeVersion:'fixture-privacy'},client);f.company.askCoordinator=coordinator;f.gate(p=>coordinator.configuration(p));}
 compose();
 async function tick(ms=5000){f.setTime(new Date(Date.parse(f.ctx().now)+ms).toISOString());await coordinator.progress(()=>{});}
 async function ready(){await tick(0);await tick();assert.equal(calls[0]!.kind,'configuration');assert.ok(calls.some(c=>c.kind==='claim'));}
 async function answer(){const run=f.service.claimNext(2)!;assert.ok(run);await f.service.run(run,f.runtime,new AbortController().signal);}
 return{...f,original,get db(){return f.db;},get company(){return f.company;},get journal(){return f.journal;},get content(){return f.content;},get controls(){return f.controls;},calls,tick,ready,answer,get coordinator(){return coordinator;},configurationSnapshot:snapshot,
  disableBackend(){backendReady=false;},flags(next:Partial<typeof flags>){flags={...flags,...next};revision++;},lose(kind:AskKind){lose=kind;},missing(v:boolean){missing=v;},hostile(){hostile=true;},hostileConfig(){configHostile=true;},enqueue(q:typeof queue[number]){queue.push(q);},control(c:AskControlReceipt){controls.push(c);},
  async restart(snapshot?:Parameters<typeof f.reopen>[0]){await coordinator.stop();await f.reopen(snapshot,false);compose();},async close(){await coordinator.stop();await f.close();}};
}
function noCanary(f:ReturnType<typeof setup>){for(const {name} of f.db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))assert.equal(json(f.db.all(`SELECT * FROM "${name}"`)).includes('private-visitor-canary-6f00bc40'),false,name);}
test('signed-boundary coordination imports, runs existing employee, statuses and delivers once',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();await f.tick();await f.tick();assert.equal(f.content.metadata('question-a').state,'delivered');assert.equal(f.calls.filter(c=>c.kind==='answer').length,1);assert.equal(f.calls.filter(c=>c.kind==='status').length,1);assert.equal(f.journal.inspect().models.length,1);assert.ok(f.journal.inspect().wires.every(w=>w.state==='reconciled'));noCanary(f);});
test('lost accepted answer response reconciles actual receipt without another send or inference',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();await f.tick();f.lose('answer');await f.tick();assert.equal(f.content.metadata('question-a').state,'answer_staged');await f.tick();assert.equal(f.content.metadata('question-a').state,'delivered');assert.equal(f.calls.filter(c=>c.kind==='answer').length,1);assert.equal(f.journal.inspect().models.length,1);});
test('missing receipt permits bounded identical-answer resend, preserving canonical answer identity',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();await f.tick();f.missing(true);f.lose('answer');await f.tick();await f.tick();f.missing(false);await f.tick(10000);assert.equal(f.content.metadata('question-a').state,'delivered');const sent=f.calls.filter(c=>c.kind==='answer');assert.equal(sent.length,2);assert.deepEqual(sent[0],sent[1]);assert.equal(f.journal.inspect().models.length,1);});
test('receiver status prose never enters ordinary Company or independent authority metadata',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();f.hostile();await f.tick();noCanary(f);assert.equal(json(f.journal.inspect()).includes('private-visitor-canary-6f00bc40'),false);await f.tick();assert.equal(f.content.metadata('question-a').state,'delivered');});
test('unapproved receiver configuration holds without retaining receiver prose',async t=>{const f=setup();t.after(f.close);f.hostileConfig();await f.tick(0);noCanary(f);assert.equal(f.db.get<any>('SELECT hold_reason FROM ask_coordination')!.hold_reason,'configuration_changed');assert.equal(f.journal.inspect().configurations.length,0);assert.equal(f.calls.length,1);});
test('claims can pause while known outbox delivery remains enabled',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();f.flags({admissionEnabled:false,claimsEnabled:false});await f.tick(40000);await f.tick();await f.tick();await f.tick();assert.equal(f.content.metadata('question-a').state,'delivered');assert.equal(f.journal.inspect().models.length,1);});
test('fresh lease epoch delivers the existing answer without a second employee execution',async t=>{const f=setup();t.after(f.close);await f.ready();await f.answer();const q=structuredClone(f.original);q.claimId='claim-replacement';q.leaseExpiresAt='2026-01-05T21:35:00.000Z';f.enqueue(q);await f.tick(95000);for(let i=0;i<6;i++)await f.tick();assert.equal(f.content.metadata('question-a').state,'delivered');assert.equal(f.db.get<any>('SELECT count(*) n FROM ask_claim_epochs')!.n,2);assert.equal(f.journal.inspect().models.length,1);});
test('old Company snapshot cannot erase an independently applied claim',async t=>{const f=setup();t.after(f.close);await f.tick(0);const old=f.snapshot('before-claim');await f.tick();await f.restart({companySnapshot:old.companySnapshot,contentSnapshot:old.contentSnapshot});assert.equal(f.db.get<any>('SELECT hold_reason FROM ask_coordination')!.hold_reason,'custody_reconciliation');assert.throws(()=>f.coordinator.configuration());});
test('clock rollback stops only Ask coordination without pausing Company',async t=>{const f=setup();t.after(f.close);await f.ready();f.setTime('2026-01-05T21:31:00.000Z');await f.coordinator.progress(()=>{});assert.equal(f.coordinator.nextWake(),null);assert.equal(f.company.paused,false);});

test('reopened lost control traversal drains and reconciles only control metadata',async t=>{const f=setup();t.after(f.close);await f.ready();await f.tick(40000);f.lose('control_sync');await f.tick();assert.ok(f.journal.inspect().wires.some(w=>w.proof.kind==='control_sync'&&w.state==='unknown'));await f.restart();for(let i=0;i<3;i++)await f.tick();assert.equal(f.db.get<any>('SELECT hold_reason FROM ask_coordination')!.hold_reason,null);assert.equal(f.journal.inspect().wires.filter(w=>w.proof.kind==='control_sync'&&w.state==='unknown').length,0);assert.equal(f.journal.inspect().models.length,0);});
test('persistent private maintenance failure does not prevent fresh signed control read',async t=>{const f=setup();t.after(f.close);await f.ready();f.content.maintenance=()=>{throw Error('Synthetic private custody failure');};await f.tick();await f.tick(40000);await f.tick();assert.ok(f.calls.some(c=>c.kind==='control_sync'));assert.equal(f.company.paused,false);assert.equal(f.journal.inspect().models.length,0);});
test('Company snapshot from before deletion application cannot resurrect content',async t=>{const f=setup();t.after(f.close);await f.ready();const original=f.controls.acceptPage.bind(f.controls);let snapshot:ReturnType<typeof f.snapshot>|undefined;
 f.controls.acceptPage=(id,value)=>{if((value as any).controls.length)snapshot=f.snapshot('before-delete-application');original(id,value);};
 f.control({schemaVersion:'1.0',controlId:'delete-control',conversationId:'conversation-a',questionId:null,action:'delete',effectiveAt:f.ctx().now,purgeBy:new Date(Date.parse(f.ctx().now)+60000).toISOString(),suppressionUntil:new Date(Date.parse(f.ctx().now)+2592000000).toISOString()});
 await f.tick(40000);await f.tick();await f.tick();assert.ok(snapshot);assert.equal(f.content.metadata('question-a').state,'suppressed');await f.restart({companySnapshot:snapshot.companySnapshot,contentSnapshot:snapshot.contentSnapshot});assert.equal(f.db.get<any>('SELECT hold_reason FROM ask_coordination')!.hold_reason,'custody_reconciliation');assert.equal(f.company.paused,false);assert.throws(()=>f.coordinator.configuration());});

test('more than100 successful configuration refreshes do not exhaust an operation retry set',async t=>{const f=setup(400);t.after(f.close);f.flags({admissionEnabled:false,claimsEnabled:false});for(let i=0;i<101;i++)await f.tick(i?45000:0);assert.equal(f.calls.filter(c=>c.kind==='configuration').length,101);assert.equal(f.db.get<any>('SELECT hold_reason FROM ask_coordination')!.hold_reason,null);assert.equal(f.journal.inspect().models.length,0);});

test('disabled backend continues control suppression without claim/status/answer or model traffic',async t=>{
 const f=setup();t.after(f.close);await f.ready();f.disableBackend();const prior=f.calls.length;
 f.control({schemaVersion:'1.0',controlId:'delete-disabled',conversationId:'conversation-a',questionId:null,action:'delete',effectiveAt:f.ctx().now,purgeBy:f.ctx().now,suppressionUntil:'2026-02-04T21:32:00.000Z'});
 await f.tick(40000);await f.tick();await f.tick();assert.ok(f.calls.slice(prior).some(x=>x.kind==='control_sync'));assert.ok(f.calls.slice(prior).every(x=>['configuration','control_sync','receipt'].includes(x.kind)));
 assert.equal(f.content.metadata('question-a').state,'suppressed');assert.equal(f.journal.inspect().models.length,0);assert.equal(f.company.paused,false);
});
test('disabled backend reconciles a known answer receipt without retransmitting its body',async t=>{
 const f=setup();t.after(f.close);await f.ready();await f.answer();await f.tick();f.lose('answer');await f.tick();const prior=f.calls.length;f.disableBackend();await f.tick();
 assert.equal(f.content.metadata('question-a').state,'delivered');assert.deepEqual(f.calls.slice(prior).map(x=>x.kind),['receipt']);assert.equal(f.journal.inspect().models.length,1);
});
