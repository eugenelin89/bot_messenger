/** Bounded signed control/claim/outbox coordination; this component never runs a model. */
import {randomUUID} from 'node:crypto';
import type {AskAnswerReceipt,AskClaim,AskClaimPage,AskControlSync,AskServiceConfiguration,AskStatus} from '../../../contracts/investment/v1/types.js';
import {canonicalHash as hash,canonicalJson as json,requireContract as need,validate} from '../../../scripts/investment-contracts/schema.js';
import {checkAskConfiguration} from '../../../scripts/investment-contracts/ask.js';
import {prepareAskRequest,reconstructAskRequest,type AskOperation,type AskBoundaryContext,type AskKind,type PreparedAskRequest} from '../../domain/ask/contract.js';
import type {AskGrantConfiguration} from '../../domain/ask/authority.js';
import type {AskDispatchRow} from '../../domain/ask/execution.js';
import type {Store} from '../../persistence/store.js';
import {AskAuthorityJournal} from './authority-journal.js';
import {AskControlJournal} from './control-journal.js';
import {AskPrivateContent} from './private-content.js';
import type {AskService} from './service.js';
import {createAskHttpsClient,type AskClient,type AskSigningKeys,type AskTransportOptions,type AskWireProof} from './transport.js';
interface Coordination {service_id:string;generation:string;instance:string;configuration_revision:string|null;configuration_hash:string|null;configuration:string|null;observed_at:string;next_poll:string;next_claim:string;hold_reason:string|null;max_attempts:number;expires_at:string}
interface Operation {id:string;service_id:string;generation:string;kind:AskKind;descriptor:string;intent_digest:string;created_at:string;retry_at:string;state:'pending'|'applied'|'held';attempts:number;response_digest:string|null;last_problem:string|null}
interface ClaimRow {service_id:string;question_id:string;claim_id:string;generation:string;lease_expires_at:string;claim_digest:string;question_digest:string;updated_at:string;last_status:string|null;last_status_digest:string|null}
interface Attempt {id:string;operation_id:string;created_at:string;proof:string|null;state:string;response_digest:string|null}
type Descriptor={operation?:AskOperation;questionId?:string;requestId?:string;claimId?:string;leaseExpiresAt?:string;lastControlSyncId?:string;status?:AskStatus};
export interface AskCoordinatorOptions {
 current():AskBoundaryContext;
 approved:AskGrantConfiguration;
 authority:AskAuthorityJournal;controls:AskControlJournal;content:AskPrivateContent;
 service:AskService;keys:AskSigningKeys;
 /** Must check the actual runtime before claiming; public eligibility is separately enforced at dispatch. */
 assertRuntimeAvailable():void;
 bodyOperationsReady?():boolean;
 maxAttempts:number;expiresAt:string;privacyNoticeVersion:string;
}
export class AskCoordinator {
 private readonly instance=randomUUID();private readonly client:AskClient;private readonly serviceId:string;
 private active?:Promise<void>;private stopped=false;private controller?:AbortController;
 private sending?:{operation:Operation;attemptId:string;prepared:PreparedAskRequest};
 constructor(private readonly db:Store,private readonly options:AskCoordinatorOptions,fixtureClient?:{create(options:AskTransportOptions):AskClient;offline:true}){
  const ctx=options.current();this.serviceId=ctx.scope.serviceId;validate('AskServiceScope',ctx.scope);validate('Time',options.expiresAt);
  need(hash({scope:ctx.scope,limits:ctx.limits})===hash({scope:options.approved.scope,limits:options.approved.limits}),'CONFLICT');
  need(Number.isSafeInteger(options.maxAttempts)&&options.maxAttempts>=1&&options.maxAttempts<=2000&&Date.parse(options.expiresAt)>Date.parse(ctx.now)&&Date.parse(options.expiresAt)<=Date.parse(ctx.scope.expiresAt),'FORBIDDEN');
  const prior=db.get<Coordination>('SELECT * FROM ask_coordination WHERE service_id=?',this.serviceId);
  if(prior){need(prior.generation===ctx.scope.consumerGeneration&&prior.max_attempts===options.maxAttempts&&prior.expires_at===options.expiresAt&&ctx.now>=prior.observed_at,'CONFLICT');db.run('UPDATE ask_coordination SET instance=?,next_poll=? WHERE service_id=?',this.instance,ctx.now,this.serviceId);}
  else db.run('INSERT INTO ask_coordination VALUES(?,?,?,NULL,NULL,NULL,?,?,?,NULL,?,?)',this.serviceId,ctx.scope.consumerGeneration,this.instance,ctx.now,ctx.now,ctx.now,options.maxAttempts,options.expiresAt);
  const transport:AskTransportOptions={keys:options.keys,current:()=>this.context(),beforeTransmit:proof=>this.beforeWire(proof)};
  this.client=fixtureClient?fixtureClient.create(transport):createAskHttpsClient(transport);
  this.recover();
 }
 private row():Coordination {const r=this.db.get<Coordination>('SELECT * FROM ask_coordination WHERE service_id=?',this.serviceId);need(r&&r.instance===this.instance,'CONFLICT');return r;}
 private context():AskBoundaryContext {
  const c=structuredClone(this.options.current()),r=this.row();need(c.scope.serviceId===r.service_id&&c.scope.consumerGeneration===r.generation&&Date.parse(c.now)>=Date.parse(r.observed_at),'CONFLICT');
  need(hash({scope:c.scope,limits:c.limits})===hash({scope:this.options.approved.scope,limits:this.options.approved.limits}),'CONFLICT');return c;
 }
 /** Freshness gate for service.assertReady(); never a model permission. */
 configuration(purpose:'admission'|'execution'|'delivery'='execution'):AskGrantConfiguration {
  const r=this.row(),ctx=this.context();need(!r.hold_reason&&Date.parse(ctx.now)<Date.parse(r.expires_at)&&r.configuration,'UNAVAILABLE');
  const c=checkAskConfiguration(JSON.parse(r.configuration),ctx.scope,ctx.now);
  need(c.configurationHash===r.configuration_hash&&c.configurationRevision===r.configuration_revision&&!c.held,'UNAVAILABLE');
  need(purpose!=='admission'||c.claimsEnabled,'UNAVAILABLE');need(purpose!=='delivery'||c.deliveryEnabled,'UNAVAILABLE');
  need(hash({scope:c.scope,limits:c.limits,roster:c.roster})===hash(this.options.approved),'CONFLICT');return structuredClone(this.options.approved);
 }
 private hold(reason:string):void {this.db.run('UPDATE ask_coordination SET hold_reason=coalesce(hold_reason,?) WHERE service_id=?',reason,this.serviceId);this.options.service.close();}
 private recover():void {
  try{
   const r=this.row(),state=this.options.authority.inspect(),checkpoint=state.configurations.find(c=>c.serviceId===this.serviceId&&c.generation===r.generation&&c.keyId===this.context().scope.keyId);
   need((!checkpoint&&!r.configuration_hash)||(checkpoint?.hash===r.configuration_hash&&checkpoint.revision===r.configuration_revision),'OUTCOME_UNKNOWN');
   const own=state.wires.filter(w=>w.proof.serviceId===this.serviceId&&w.proof.generation===r.generation);
   for(const wire of own){const a=this.db.get<Attempt>('SELECT * FROM ask_wire_attempts WHERE id=?',wire.attemptId),op=a&&this.db.get<Operation>('SELECT * FROM ask_wire_operations WHERE id=?',a.operation_id);
    need(a&&op&&op.intent_digest===wire.proof.intentDigest&&op.kind===wire.proof.kind,'OUTCOME_UNKNOWN');
    need(wire.state!=='reconciled'||op.state==='applied','OUTCOME_UNKNOWN');
    if(a.proof)need(a.proof===json(wire.proof),'OUTCOME_UNKNOWN');else this.db.run("UPDATE ask_wire_attempts SET proof=?,state='unknown' WHERE id=?",json(wire.proof),a.id);
   }
   for(const a of this.db.all<Attempt>('SELECT a.* FROM ask_wire_attempts a JOIN ask_wire_operations o ON o.id=a.operation_id WHERE o.service_id=?',this.serviceId)){
    const wire=own.find(w=>w.attemptId===a.id);need(!a.proof||wire,'OUTCOME_UNKNOWN');
    if(a.state==='prepared'&&!wire)this.db.run("UPDATE ask_wire_attempts SET state='not_sent' WHERE id=?",a.id);
   }
   for(const op of this.db.all<Operation>("SELECT * FROM ask_wire_operations WHERE service_id=? AND state='applied'",this.serviceId)){
    const attempts=this.db.all<Attempt>('SELECT * FROM ask_wire_attempts WHERE operation_id=?',op.id),wires=own.filter(w=>attempts.some(a=>a.id===w.attemptId));
    need(wires.length>0&&wires.every(w=>w.state==='reconciled'),'OUTCOME_UNKNOWN');
   }
   for(const effect of state.effects.claims.filter(e=>e.serviceId===this.serviceId))need(this.db.get<ClaimRow>('SELECT * FROM ask_claim_custody WHERE service_id=? AND question_id=?',this.serviceId,effect.questionId)?.claim_digest===effect.claimDigest,'OUTCOME_UNKNOWN');
   for(const effect of state.effects.statuses.filter(e=>e.serviceId===this.serviceId)){
    const status=this.db.get<ClaimRow>('SELECT * FROM ask_claim_custody WHERE service_id=? AND question_id=?',this.serviceId,effect.questionId)?.last_status_digest;
    need(status===effect.statusDigest,'OUTCOME_UNKNOWN');
   }
   const applied=state.effects.controls.find(e=>e.serviceId===this.serviceId);if(applied)need(hash(this.options.controls.custody(this.db))===applied.applicationDigest,'OUTCOME_UNKNOWN');
   this.options.content.reconcile();
  }catch{this.hold('custody_reconciliation');}
 }
 private beforeWire(proof:Readonly<AskWireProof>):void {
  const sending=this.sending;need(sending&&proof.intentDigest===sending.operation.intent_digest&&proof.kind===sending.operation.kind,'CONFLICT');
  this.authorize(sending.operation.kind,sending.operation);
  this.options.authority.beforeWire(sending.attemptId,proof,this.context().now);
  this.db.run("UPDATE ask_wire_attempts SET proof=?,state='transmitted' WHERE id=?",json(proof),sending.attemptId);
 }
 private authorize(kind:AskKind,op?:Operation):void {
  const c=this.context();need(!this.stopped&&Date.parse(c.now)<Date.parse(this.row().expires_at),'EXPIRED');
  if(['configuration','control_sync','receipt'].includes(kind))return;
  this.options.service.assertOperational(kind==='claim'||kind==='renew'?'admission':kind==='answer'?'delivery':'execution');
  this.configuration(kind==='claim'||kind==='renew'?'admission':kind==='answer'?'delivery':'execution');need(this.options.controls.barrier(),'UNAVAILABLE');this.options.content.maintenance();
  if(kind==='claim')this.options.assertRuntimeAvailable();
  if(op&&(kind==='answer'||kind==='renew'||kind==='status')){
   const d=JSON.parse(op.descriptor) as Descriptor,claim=this.claim(d.questionId!);need(Date.parse(c.now)<Date.parse(claim.leaseExpiresAt),'EXPIRED');
   if(kind==='answer')this.options.service.assertDelivery(d.questionId!);
  }
 }
 private claim(id:string):AskClaim {
  const row=this.db.get<ClaimRow>('SELECT * FROM ask_claim_custody WHERE service_id=? AND question_id=?',this.serviceId,id);need(row,'NOT_FOUND');
  const m=this.options.content.metadata(id),q=this.options.content.question({sessionId:m.session_id,conversationId:m.conversation_id,questionId:id});
  const claim:AskClaim={schemaVersion:'1.0',serviceId:this.serviceId,consumerGeneration:row.generation,claimId:row.claim_id,leaseExpiresAt:row.lease_expires_at,question:q};
  need(hash(q)===row.question_digest&&hash(claim)===row.claim_digest,'CONFLICT');return claim;
 }
 private operation(kind:AskKind,d:Descriptor):AskOperation {
  if(d.operation){need(['claim','control_sync','configuration','receipt'].includes(kind)&&d.operation.kind===kind,'CONFLICT');return structuredClone(d.operation);}
  const current=this.claim(d.questionId!),claim={...current,claimId:d.claimId!,leaseExpiresAt:d.leaseExpiresAt!};
  const base={requestId:d.requestId!,claim};
  if(kind==='renew')return{kind,...base,input:{schemaVersion:'1.0',serviceId:this.serviceId,consumerGeneration:claim.consumerGeneration,questionId:claim.question.questionId,questionHash:claim.question.questionHash}};
  if(kind==='status')return{kind,...base,input:{schemaVersion:'1.0',claimId:claim.claimId,consumerGeneration:claim.consumerGeneration,lastControlSyncId:d.lastControlSyncId!,status:d.status!}};
  need(kind==='answer','INVALID_REQUEST');const answer=this.options.content.pendingAnswer(d.questionId!)?.answer;need(answer,'OUTCOME_UNKNOWN');
  return{kind,...base,input:{schemaVersion:'1.0',claimId:claim.claimId,consumerGeneration:claim.consumerGeneration,lastControlSyncId:d.lastControlSyncId!,answer}};
 }
 private create(kind:AskKind,d:Descriptor):Operation {
  const ctx=this.context(),operation=this.operation(kind,d),prepared=prepareAskRequest(operation,ctx),id=randomUUID();
  need(this.db.get<{n:number}>('SELECT count(*) n FROM ask_wire_operations')!.n<10000,'BUDGET_EXHAUSTED');
  // Descriptors contain only canonical control inputs, IDs, safe status and claim leases.
  // Exact bodies/context remain private; only the complete prepared intent's hash is retained.
  this.db.run("INSERT INTO ask_wire_operations VALUES(?,?,?,?,?,?,?,?,'pending',0,NULL,NULL)",id,this.serviceId,ctx.scope.consumerGeneration,kind,json(d),hash(prepared),ctx.now,ctx.now);
  return this.db.get<Operation>('SELECT * FROM ask_wire_operations WHERE id=?',id)!;
 }
 private attempts(op:Operation):string[] {const own=new Set(this.db.all<{id:string}>('SELECT id FROM ask_wire_attempts WHERE operation_id=?',op.id).map(a=>a.id));const ids=this.options.authority.inspect().wires.filter(w=>own.has(w.attemptId)&&w.proof.intentDigest===op.intent_digest&&w.proof.serviceId===this.serviceId&&w.proof.kind===op.kind).map(w=>w.attemptId);need(ids.length>0&&ids.length<=100,'BUDGET_EXHAUSTED');return ids;}
 private saveClaim(value:AskClaim):void {
  this.options.content.importQuestion(value);const q=value.question,old=this.db.get<ClaimRow>('SELECT * FROM ask_claim_custody WHERE service_id=? AND question_id=?',this.serviceId,q.questionId);
  if(old)need(old.question_digest===hash(q)&&old.generation===value.consumerGeneration&&Date.parse(value.leaseExpiresAt)>=Date.parse(old.lease_expires_at),'CONFLICT');
  this.db.transaction(()=>{
   const epoch=this.db.get<ClaimRow>('SELECT * FROM ask_claim_epochs WHERE service_id=? AND claim_id=?',this.serviceId,value.claimId);
   if(epoch)need(epoch.question_id===q.questionId&&epoch.question_digest===hash(q)&&epoch.generation===value.consumerGeneration,'CONFLICT');
   this.db.run('INSERT INTO ask_claim_epochs VALUES(?,?,?,?,?,?,?) ON CONFLICT(service_id,claim_id) DO UPDATE SET lease_expires_at=excluded.lease_expires_at,claim_digest=excluded.claim_digest',this.serviceId,q.questionId,value.claimId,value.consumerGeneration,value.leaseExpiresAt,hash(value),hash(q));
   this.db.run('INSERT INTO ask_claim_custody VALUES(?,?,?,?,?,?,?,?,NULL,NULL) ON CONFLICT(service_id,question_id) DO UPDATE SET claim_id=excluded.claim_id,lease_expires_at=excluded.lease_expires_at,claim_digest=excluded.claim_digest,updated_at=excluded.updated_at',this.serviceId,q.questionId,value.claimId,value.consumerGeneration,value.leaseExpiresAt,hash(value),hash(q),this.context().now);
  });
 }
 private accept(op:Operation,source:string,value:unknown):void {
  const at=this.context().now,ids=this.attempts(op),a=this.options.authority;
  switch(op.kind){
   case 'configuration':{
    const c=checkAskConfiguration(value,this.context().scope,at),r=this.row();
    need(!r.configuration_revision||BigInt(c.configurationRevision)>=BigInt(r.configuration_revision),'CONFLICT');
    if(c.configurationRevision===r.configuration_revision)need(c.configurationHash===r.configuration_hash,'CONFLICT');
    const same=hash({scope:c.scope,limits:c.limits,roster:c.roster})===hash(this.options.approved)&&c.privacyNoticeVersion===this.options.privacyNoticeVersion;
    if(!same){this.hold('configuration_changed');return;}
    // Independent high-water commits first. A partial Company write holds after restart.
    const reads=a.inspect().wires.filter(w=>w.proof.kind==='configuration'&&w.proof.serviceId===this.serviceId&&w.proof.generation===c.consumerGeneration&&w.proof.intentDigest===op.intent_digest&&w.state==='unknown').map(w=>w.attemptId);
    a.observeConfiguration(reads,source,c,at);
    this.db.run('UPDATE ask_coordination SET configuration_revision=?,configuration_hash=?,configuration=?,observed_at=? WHERE service_id=?',c.configurationRevision,c.configurationHash,json(c),at,this.serviceId);
    break;
   }
   case 'claim':{const page=validate<AskClaimPage>('AskClaimPage',value);if(page.claim)this.saveClaim(page.claim);a.appliedClaim(ids,source,page,at);if(page.claim)this.options.service.importClaim(page.claim);this.db.run('UPDATE ask_coordination SET next_claim=? WHERE service_id=?',new Date(Date.parse(at)+Math.max(15,page.retryAfterSeconds)*1000).toISOString(),this.serviceId);break;}
   case 'renew':{const claim=validate<AskClaim>('AskClaim',value);this.saveClaim(claim);a.appliedRenew(ids,source,claim,at);this.options.service.importClaim(claim);break;}
   case 'status':{
    const status=validate<AskStatus>('AskStatus',value),sent=(JSON.parse(op.descriptor) as Descriptor).status!;
    if(status.route)need(status.route.workerId===sent.route?.workerId&&status.route.routingPolicyVersion===sent.route?.routingPolicyVersion,'CONFLICT');
    // Receiver prose is never copied into Company. Retain its digest and only our trusted route.
    const metadata={...status,route:status.route?sent.route:null,safeReason:null};
    this.db.run('UPDATE ask_claim_custody SET last_status=?,last_status_digest=?,updated_at=? WHERE service_id=? AND question_id=?',json(metadata),hash(status),at,this.serviceId,status.questionId);a.appliedStatus(ids,source,status,at);break;
   }
   case 'control_sync':{
    const page=validate<AskControlSync>('AskControlSync',value);this.options.controls.acceptPage(page.syncId,page);this.options.content.maintenance();
    const applied=hash(this.options.controls.custody(this.db));a.appliedControls(ids,source,page,applied,at);
    if(this.options.controls.barrier()?.syncId===page.syncId){
     const resolved=this.db.all<{sync_id:string}>("SELECT sync_id FROM ask_control_requests WHERE service_id=? AND state='reconciled' AND resolved_by=?",this.serviceId,page.syncId).map(r=>r.sync_id);
     const old=a.inspect().wires.filter(w=>w.state==='unknown'&&w.proof.kind==='control_sync'&&w.proof.serviceId===this.serviceId&&w.proof.generation===op.generation&&resolved.includes(w.proof.requestId!));
     for(let i=0;i<old.length;i+=100)a.reconcileControlDrain(old.slice(i,i+100).map(w=>w.attemptId),source,page,applied,at);
     for(const sync of resolved)this.db.run("UPDATE ask_wire_operations SET state='applied',response_digest=? WHERE service_id=? AND kind='control_sync' AND state='pending' AND json_extract(descriptor,'$.operation.input.syncId')=?",hash(page),this.serviceId,sync);
    }break;
   }
   case 'answer':case 'receipt':{
    const receipt=validate<AskAnswerReceipt>('AskAnswerReceipt',value);this.options.content.recordReceipt(receipt);
    const related=a.inspect().wires.filter(w=>w.proof.answerIdentity?.answerId===receipt.answerId&&w.proof.serviceId===this.serviceId&&w.proof.generation===op.generation&&w.state==='unknown').map(w=>w.attemptId);
    for(let i=0;i<related.length;i+=100)a.reconcileAnswer(related.slice(i,i+100),source,receipt,at);
    for(const id of related)this.db.run("UPDATE ask_wire_operations SET state='applied',response_digest=? WHERE state='pending' AND id=(SELECT operation_id FROM ask_wire_attempts WHERE id=?)",hash(receipt),id);break;
   }
  }
  this.db.run("UPDATE ask_wire_operations SET state='applied',response_digest=? WHERE id=?",hash(value),op.id);
 }
 private async exchange(op:Operation,signal:AbortSignal):Promise<void> {
  this.authorize(op.kind,op);const at=this.context().now;
  if(op.attempts>=3){this.db.run('UPDATE ask_coordination SET next_poll=expires_at WHERE service_id=?',this.serviceId);this.hold('wire_retry_exhausted');return;}
  const total=this.db.get<{n:number}>('SELECT count(*) n FROM ask_wire_attempts a JOIN ask_wire_operations o ON o.id=a.operation_id WHERE o.service_id=?',this.serviceId)!.n;
  if(total>=this.row().max_attempts){this.db.run('UPDATE ask_coordination SET next_poll=expires_at WHERE service_id=?',this.serviceId);this.hold('wire_budget_exhausted');return;}
  const operation=this.operation(op.kind,JSON.parse(op.descriptor)),prepared=prepareAskRequest(operation,this.context());need(hash(prepared)===op.intent_digest,'CONFLICT');
  reconstructAskRequest(operation,prepared,this.context());const attemptId=randomUUID();
  this.db.transaction(()=>{this.db.run("INSERT INTO ask_wire_attempts VALUES(?,?,?,NULL,'prepared',NULL)",attemptId,op.id,at);this.db.run('UPDATE ask_wire_operations SET attempts=attempts+1,retry_at=? WHERE id=?',new Date(Date.parse(at)+15000*Math.max(1,op.attempts+1)).toISOString(),op.id);});
  if(op.kind==='answer')this.db.run("UPDATE ask_wire_operations SET last_problem=NULL WHERE service_id=? AND kind='receipt' AND state='pending'",this.serviceId);
  this.sending={operation:op,attemptId,prepared};
  try{
   const result=await this.client.exchange(operation,prepared,signal),attempt=this.db.get<Attempt>('SELECT * FROM ask_wire_attempts WHERE id=?',attemptId)!;
   if(result.kind!=='response'){
    // Any independent pre-wire marker preserves uncertainty, even if the client reports no send.
    const marked=!!attempt.proof||this.options.authority.inspect().wires.some(w=>w.attemptId===attemptId);
    this.db.run('UPDATE ask_wire_attempts SET state=? WHERE id=?',result.kind==='not_sent'&&!marked?'not_sent':'unknown',attemptId);return;
   }
   need(attempt.proof,'OUTCOME_UNKNOWN');const response=result.response,digest=hash(response.kind==='data'?response.value:response);
   this.options.authority.wireResult(attemptId,JSON.parse(attempt.proof),{kind:response.kind,status:response.kind==='data'?200:response.status,responseDigest:digest},this.context().now);
   this.db.run("UPDATE ask_wire_attempts SET state='response',response_digest=? WHERE id=?",digest,attemptId);
   if(response.kind==='data')this.accept(op,attemptId,response.value);
   else{
    this.db.run('UPDATE ask_wire_operations SET last_problem=? WHERE id=?',response.code,op.id);
    if(response.retryAfterSeconds!==null)this.db.run('UPDATE ask_wire_operations SET retry_at=max(retry_at,?) WHERE id=?',new Date(Date.parse(this.context().now)+response.retryAfterSeconds*1000).toISOString(),op.id);
   }
   // A problem never establishes whether a previous mutation happened. Reconcile or hold.
  }finally{this.sending=undefined;}
 }
 private pending(kind:AskKind):Operation|undefined {return this.db.get<Operation>("SELECT * FROM ask_wire_operations WHERE service_id=? AND kind=? AND state='pending' ORDER BY rowid LIMIT 1",this.serviceId,kind);}
 private descriptor(q:AskClaim):Descriptor {return{questionId:q.question.questionId,requestId:randomUUID(),claimId:q.claimId,leaseExpiresAt:q.leaseExpiresAt,lastControlSyncId:this.options.controls.barrier()!.syncId};}
 private choose():Operation|undefined {
  const c=this.context(),r=this.row(),now=Date.parse(c.now),saved=r.configuration?JSON.parse(r.configuration) as AskServiceConfiguration:null;
  if(!saved||now>=Date.parse(saved.validUntil)-15000)return this.pending('configuration')??this.create('configuration',{operation:{kind:'configuration'}});
  const barrier=this.options.controls.barrier();
  if(!barrier||now>=Date.parse(barrier.validUntil)-15000){const sync=this.options.controls.prepareSync();return this.db.get<Operation>("SELECT * FROM ask_wire_operations WHERE service_id=? AND kind='control_sync' AND state='pending' AND json_extract(descriptor,'$.operation.input.syncId')=?",this.serviceId,sync.operation.input.syncId)??this.create('control_sync',{operation:sync.operation});}
  const uncertain=this.options.authority.inspect().wires.find(w=>w.state==='unknown'&&w.proof.kind==='answer'&&w.proof.serviceId===this.serviceId&&w.proof.generation===r.generation);
  if(uncertain){
   const receipt=this.pending('receipt');
   // NOT_FOUND is not proof of no effect. Same-answer idempotency permits a bounded
   // retry of the frozen, still-authorized wrapper without another model execution.
   if(receipt?.last_problem==='NOT_FOUND'&&!r.hold_reason&&saved.deliveryEnabled&&!this.options.service.ownerPaused&&this.options.bodyOperationsReady?.()!==false){
    const answer=this.db.all<Operation>("SELECT * FROM ask_wire_operations WHERE service_id=? AND kind='answer' AND state='pending' ORDER BY rowid DESC",this.serviceId).find(op=>op.attempts<3);
    if(answer){const d=JSON.parse(answer.descriptor) as Descriptor;
     if(d.questionId===uncertain.proof.answerIdentity?.questionId&&now<Date.parse(d.leaseExpiresAt!))return answer;
    }
   }
   return receipt??this.create('receipt',{operation:{kind:'receipt',identity:uncertain.proof.answerIdentity!}});
  }
  if(r.hold_reason||saved.held||this.options.service.ownerPaused||this.options.bodyOperationsReady?.()===false)return;
  this.options.content.maintenance();
  this.configuration();
  const pending=this.db.all<Operation>("SELECT * FROM ask_wire_operations WHERE service_id=? AND state='pending' AND kind IN ('claim','renew','status','answer') ORDER BY rowid",this.serviceId).find(op=>!(['claim','renew'].includes(op.kind)&&!saved.claimsEnabled||op.kind==='answer'&&!saved.deliveryEnabled));
  if(pending)return pending;
  for(const row of this.db.all<ClaimRow>('SELECT * FROM ask_claim_custody WHERE service_id=? ORDER BY rowid',this.serviceId)){
   const metadata=this.options.content.metadata(row.question_id);
   if(['suppressed','expired','held','delivered'].includes(metadata.state)||now>=Date.parse(row.lease_expires_at))continue;
   const claim=this.claim(row.question_id),dispatch=this.db.get<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE service_id=? AND question_id=?',this.serviceId,row.question_id);
   if(metadata.state==='answer_staged'&&saved.deliveryEnabled){
    this.options.service.assertDelivery(row.question_id);need(dispatch?.state==='completed','OUTCOME_UNKNOWN');
    const status=row.last_status?JSON.parse(row.last_status) as AskStatus:null;
    if(status&&['cancelled','expired','declined','failed'].includes(status.state))continue;
    if(!status||!['answering','outcome_unknown'].includes(status.state))return this.create('status',{...this.descriptor(claim),status:{schemaVersion:'1.0',questionId:row.question_id,questionHash:claim.question.questionHash,state:'answering',route:JSON.parse(dispatch.route),updatedAt:c.now,safeReason:null}});
    need(status.route?.workerId===dispatch.public_worker_id&&status.route.routingPolicyVersion===JSON.parse(dispatch.route).routingPolicyVersion,'CONFLICT');
    return this.create('answer',this.descriptor(claim));
   }
   if(dispatch){
    const state=dispatch.state==='running'?'answering':dispatch.state==='unknown'?'outcome_unknown':dispatch.state==='suppressed'?'cancelled':dispatch.state==='failed'?'failed':null;
    if(state&&(!row.last_status||JSON.parse(row.last_status).state!==state))return this.create('status',{...this.descriptor(claim),status:{schemaVersion:'1.0',questionId:row.question_id,questionHash:claim.question.questionHash,state,route:JSON.parse(dispatch.route),updatedAt:c.now,safeReason:null}});
    if(dispatch.state!=='running')continue;
   }
   if(saved.claimsEnabled&&now+30000>=Date.parse(claim.leaseExpiresAt))return this.create('renew',this.descriptor(claim));
   if(!dispatch)this.options.service.importClaim(claim);
  }
  if(!saved.claimsEnabled||now<Date.parse(r.next_claim))return;
  this.options.assertRuntimeAvailable();
  const active=this.db.get<{n:number}>("SELECT count(*) n FROM ask_imports i JOIN ask_claim_custody c ON c.service_id=i.service_id AND c.question_id=i.question_id WHERE i.service_id=? AND c.lease_expires_at>? AND state IN ('content_pending','available','answer_reserved','answer_staged')",this.serviceId,c.now)!.n;
  if(active>=c.limits.queueCapacity)return;
  return this.create('claim',{operation:{kind:'claim',input:{schemaVersion:'1.0',serviceId:this.serviceId,consumerGeneration:r.generation,claimRequestId:randomUUID(),capacity:1}}});
 }
 progress(wake:()=>void):Promise<void>|undefined {
  if(this.stopped||this.active)return;
  try{const now=this.context().now;if(Date.parse(now)<Date.parse(this.row().next_poll)||Date.parse(now)>=Date.parse(this.row().expires_at))return;}
  catch{this.options.service.close();this.stopped=true;return;}
  this.controller=new AbortController();
  this.active=(async()=>{try{
   const op=this.choose();if(op&&Date.parse(op.retry_at)<=Date.parse(this.context().now))await this.exchange(op,this.controller!.signal);
  }catch{this.hold('coordination_reconciliation');}
  finally{this.db.run('UPDATE ask_coordination SET observed_at=?,next_poll=max(next_poll,?) WHERE service_id=?',this.options.current().now,new Date(Date.parse(this.options.current().now)+5000).toISOString(),this.serviceId);}})().finally(()=>{this.active=undefined;this.controller=undefined;wake();});
  void this.active.catch(()=>{this.options.service.close();this.stopped=true;});return this.active;
 }
 nextWake():string|null {try{return this.active||this.stopped||Date.parse(this.row().next_poll)>=Date.parse(this.row().expires_at)?null:this.row().next_poll;}catch{this.options.service.close();this.stopped=true;return null;}}
 async stop():Promise<void>{this.stopped=true;this.controller?.abort();await this.active;}
}
