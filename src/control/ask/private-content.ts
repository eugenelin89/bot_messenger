/** Dormant two-database coordinator. No caller, execution, transmission or grant is installed. */
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { realpathSync } from 'node:fs';
import type { AskAnswer, AskAnswerReceipt, AskClaim, AskQuestion } from '../../../contracts/investment/v1/types.js';
import { canonicalHash, canonicalJson, checkPublicStrings, requireContract as need, validate } from '../../../scripts/investment-contracts/schema.js';
import { questionHash } from '../../../scripts/investment-contracts/ask.js';
import { prepareAskRequest, type AskBoundaryContext, type AskReceiptIdentity } from '../../domain/ask/contract.js';
import { ASK_CONTENT_ROWS, AskContentStore, privateContentError } from '../../persistence/ask-content-store.js';
import { Store } from '../../persistence/store.js';
import { AskControlJournal } from './control-journal.js';

const APPLICATION='private-content-v1';
const terminal=(state:string)=>['suppressed','expired','held'].includes(state);
function time(value:string){validate('Time',value);return Date.parse(value);}
const until=(at:string,seconds:number)=>new Date(time(at)+seconds*1000).toISOString();
interface Service {service_id:string;store_id:string;generation:string;instance:string;observed_at:string;custody_held:number}
export interface AskImportMetadata {
 service_id:string;question_id:string;session_id:string;conversation_id:string;question_hash:string;
 question_digest:string;content_ref:string;received_at:string;expires_at:string;retain_until:string;metadata_until:string;
 state:'content_pending'|'available'|'answer_reserved'|'answer_staged'|'delivered'|'suppressed'|'expired'|'held';
 answer_id:string|null;answer_digest:string|null;answer_generated_at:string|null;
 receipt:string|null;receipt_hash:string|null;updated_at:string;
}
interface AppliedControl {control_id:string;control_hash:string;store_id:string;application_version:string;state:string;suppression_until:string}

/**
 * Raw directory must be outside the actual Company directory AND all configured ordinary
 * backup roots. The operator still must verify backup exclusion before wiring this component.
 * The caller owns the service data lock. A new instance fences previous callbacks. Pair identity
 * cannot detect both stores restored together: restorationVerified always remains false.
 */
export class AskPrivateContent {
 private readonly instance=randomUUID();
 private readonly serviceId:string;
 private readonly content:AskContentStore;
 private observedClock=-Infinity;
 constructor(private readonly db:Store,root:string,excludedBackupRoots:readonly string[],
  private readonly current:()=>AskBoundaryContext,private readonly journal:AskControlJournal){
  const opened=privateContentError(()=>{
   need(!db.transactionActive,'CONFLICT');need(excludedBackupRoots.length>0,'FORBIDDEN');const ctx=this.context();
   const identity=journal.custody(db);need(identity.serviceId===ctx.scope.serviceId&&identity.generation===ctx.scope.consumerGeneration,'CONFLICT');
   const prior=db.get<Service>('SELECT * FROM ask_content_services WHERE service_id=?',ctx.scope.serviceId);
   const file=db.get<{file:string}>("SELECT file FROM pragma_database_list WHERE name='main'")!.file;
   need(file,'FORBIDDEN');const content=new AskContentStore(root,ctx.scope.serviceId,[realpathSync(dirname(file)),...excludedBackupRoots],!!prior);
   try{
    db.transaction(()=>{
     if(prior){need(prior.store_id===content.id&&prior.generation===ctx.scope.consumerGeneration&&time(ctx.now)>=time(prior.observed_at),'CONFLICT');
      db.run('UPDATE ask_content_services SET instance=?,observed_at=? WHERE service_id=?',this.instance,ctx.now,ctx.scope.serviceId);
     }else{
      need(content.empty(),'OUTCOME_UNKNOWN');need(db.get<{n:number}>('SELECT count(*) n FROM ask_content_services')!.n<8,'BUDGET_EXHAUSTED');
      db.run('INSERT INTO ask_content_services(service_id,store_id,generation,instance,observed_at) VALUES(?,?,?,?,?)',ctx.scope.serviceId,content.id,ctx.scope.consumerGeneration,this.instance,ctx.now);
     }
    });return {content,serviceId:ctx.scope.serviceId};
   }catch(error){content.close();throw error;}
  });
  this.content=opened.content;this.serviceId=opened.serviceId;
 }
 private transaction<T>(fn:()=>T):T{need(!this.db.transactionActive,'CONFLICT');return this.db.transaction(fn);}
 private context():AskBoundaryContext{
  const ctx=structuredClone(this.current());validate('AskServiceScope',ctx.scope);validate('AskLimits',ctx.limits);
  const now=time(ctx.now);need(now>=this.observedClock,'CONFLICT');this.observedClock=now;return ctx;
 }
 private check(ctx:AskBoundaryContext):void{
  need(!this.db.transactionActive,'CONFLICT');this.content.assertCustody();
  const row=this.db.get<Service>('SELECT * FROM ask_content_services WHERE service_id=?',this.serviceId);
  need(row&&row.store_id===this.content.id&&row.generation===ctx.scope.consumerGeneration&&row.instance===this.instance
   &&row.service_id===ctx.scope.serviceId&&time(ctx.now)>=time(row.observed_at),'CONFLICT');
  const identity=this.journal.custody(this.db);need(identity.serviceId===this.serviceId&&identity.generation===ctx.scope.consumerGeneration,'CONFLICT');
 }
 private rows(){return this.db.all<AskImportMetadata>('SELECT * FROM ask_imports WHERE service_id=? ORDER BY rowid',this.serviceId);}
 private row(id:string){validate('Id',id);const row=this.db.get<AskImportMetadata>('SELECT * FROM ask_imports WHERE service_id=? AND question_id=?',this.serviceId,id);need(row,'NOT_FOUND');return row;}
 private state(row:AskImportMetadata,state:AskImportMetadata['state'],now:string){this.transaction(()=>this.db.run('UPDATE ask_imports SET state=?,updated_at=? WHERE service_id=? AND question_id=?',state,now,this.serviceId,row.question_id));}
 private verifyQuestion(row:AskImportMetadata,q:AskQuestion):void{
  validate('AskQuestion',q);
  need(questionHash(q)===q.questionHash&&canonicalHash(q)===row.question_digest&&q.serviceId===row.service_id&&q.questionId===row.question_id
   &&q.sessionId===row.session_id&&q.conversationId===row.conversation_id&&q.questionHash===row.question_hash
   &&q.receivedAt===row.received_at&&q.expiresAt===row.expires_at,'CONFLICT');
 }
 private verified(row:AskImportMetadata){
  const stored=this.content.question(row.content_ref);if(stored){this.verifyQuestion(row,stored.question);
   // A crash after Company shortens the deadline is repaired by the next local cleanup.
   // A shorter private deadline is not extended to match a possibly rolled-back Company.
   need(time(stored.retainUntil)>=time(row.retain_until),'CONFLICT');}
  return stored;
 }
 /** Apply every retained control, including ones ACKed by suppression-journal-v1. */
 private clean():AskBoundaryContext{
  const ctx=this.context();this.check(ctx);
  let newlyHeld=false;
  // Do not let expiry or a control erase evidence of a partial restore. Check committed
  // projections first, then purge the bytes even when their identity must remain held.
  for(const row of this.rows())if(!terminal(row.state)&&!this.consistent(row)){
   this.state(row,'held',ctx.now);newlyHeld=true;
  }
  // Missing Company reservations indicate mismatched custody. Persist the fence, but still
  // apply privacy controls and retention to raw rows before reporting that uncertainty.
  for(const ref of this.content.references())if(ref.service_id!==this.serviceId||!this.db.get('SELECT 1 FROM ask_imports WHERE service_id=? AND question_id=? AND content_ref=?',this.serviceId,ref.question_id,ref.ref))
   this.transaction(()=>this.db.run('UPDATE ask_content_services SET custody_held=1 WHERE service_id=?',this.serviceId));
  for(const c of this.journal.custody(this.db).controls){
   const digest=canonicalHash(c),prior=this.db.get<AppliedControl>('SELECT * FROM ask_content_controls WHERE service_id=? AND control_id=?',this.serviceId,c.controlId);
   if(prior)need(prior.control_hash===digest&&prior.store_id===this.content.id&&prior.application_version===APPLICATION,'CONFLICT');
   this.transaction(()=>{
    if(!prior){need(this.db.get<{n:number}>('SELECT count(*) n FROM ask_content_controls')!.n<100000,'BUDGET_EXHAUSTED');
     this.db.run("INSERT INTO ask_content_controls VALUES(?,?,?,?,?,'pending',?)",this.serviceId,c.controlId,digest,this.content.id,APPLICATION,c.suppressionUntil);
    }
    this.db.run("UPDATE ask_imports SET state=CASE WHEN state IN ('held','answer_reserved') THEN 'held' ELSE 'suppressed' END,updated_at=? WHERE service_id=? AND conversation_id=? AND (? IS NULL OR question_id=?)",ctx.now,this.serviceId,c.conversationId,c.questionId,c.questionId);
   });
   this.content.control(c);
   this.transaction(()=>this.db.run("UPDATE ask_content_controls SET state='applied' WHERE service_id=? AND control_id=?",this.serviceId,c.controlId));
  }
  for(const row of this.rows()){
   const receipt=terminal(row.state)?null:this.receipt(row);
   if(receipt&&receipt.disposition!=='accepted'&&row.state!=='held'){
    const state=receipt.disposition==='discarded_expired'?'expired':'suppressed';this.state(row,state,ctx.now);row.state=state;
   }
   const tightened=until(row.received_at,ctx.limits.rawRetentionSeconds),retain=time(tightened)<time(row.retain_until)?tightened:row.retain_until;
   if(retain!==row.retain_until){this.transaction(()=>this.db.run('UPDATE ask_imports SET retain_until=?,updated_at=? WHERE service_id=? AND question_id=?',retain,ctx.now,this.serviceId,row.question_id));row.retain_until=retain;}
   this.content.shorten(row.content_ref,row.retain_until);
   if(!terminal(row.state)&&(time(ctx.now)>=time(row.retain_until)||(!row.receipt&&time(ctx.now)>=time(row.expires_at)))){const state=row.state==='answer_reserved'?'held':'expired';this.state(row,state,ctx.now);row.state=state;}
   if(terminal(row.state))this.content.remove(row.content_ref);
  }
  this.content.sweep(ctx.now);
  this.transaction(()=>this.db.run('UPDATE ask_content_services SET observed_at=? WHERE service_id=?',ctx.now,this.serviceId));
  need(!newlyHeld&&!this.db.get<Service>('SELECT * FROM ask_content_services WHERE service_id=?',this.serviceId)!.custody_held,'OUTCOME_UNKNOWN');return ctx;
 }
 private access(permission:'claim'|'answer'):AskBoundaryContext{
  const ctx=this.clean();need(ctx.scope.enabled&&ctx.scope.permissions.includes(permission)&&time(ctx.now)<time(ctx.scope.expiresAt),'FORBIDDEN');
  need(this.journal.identity(this.db).bindingHash===canonicalHash({scope:ctx.scope,limits:ctx.limits}),'CONFLICT');
  // Narrow freshness only, never a model grant or full content/restore attestation.
  const barrier=this.journal.barrier();need(barrier&&time(barrier.checkedAt)<=time(ctx.now)&&time(ctx.now)<time(barrier.validUntil)
   &&time(ctx.now)-time(barrier.checkedAt)<=ctx.limits.controlFreshnessSeconds*1000,'FORBIDDEN');return ctx;
 }
 private live(id:string):AskImportMetadata{
  const row=this.row(id);need(!terminal(row.state),'WITHDRAWN');return row;
 }
 private hold(row:AskImportMetadata,now:string):never{this.state(row,'held',now);need(false,'OUTCOME_UNKNOWN');}
 private receipt(row:AskImportMetadata):AskAnswerReceipt|null{
  if(!row.receipt)return null;
  const receipt=validate<AskAnswerReceipt>('AskAnswerReceipt',JSON.parse(row.receipt));
  need(canonicalHash(receipt)===row.receipt_hash&&receipt.answerId===row.answer_id&&receipt.answerDigest===row.answer_digest
   &&receipt.questionId===row.question_id&&receipt.questionHash===row.question_hash&&time(receipt.receivedAt)>=time(row.answer_generated_at!),'CONFLICT');return receipt;
 }
 private consistent(row:AskImportMetadata):boolean{
  try{
   const q=this.verified(row),a=this.content.answer(row.content_ref),receipt=this.receipt(row);
   if(!q)return row.state==='content_pending'&&!row.answer_id&&!a;
   if(a){
    validate('AskAnswer',a.answer);const answer=a.answer;
    return row.answer_id===answer.answerId&&row.answer_digest===a.digest&&row.answer_generated_at===answer.generatedAt
     &&answer.serviceId===row.service_id&&answer.questionId===row.question_id&&answer.questionHash===row.question_hash
     &&answer.conversationId===row.conversation_id&&(a.state!=='receipted'||!!receipt);
   }
   return row.answer_id?row.state==='answer_reserved':row.state==='content_pending'||row.state==='available';
  }catch{return false;}
 }
 private reconcileRow(row:AskImportMetadata,now:string):AskImportMetadata{
  if(terminal(row.state)){this.content.remove(row.content_ref);return row;}
  const receipt=this.receipt(row);
  if(receipt&&receipt.disposition!=='accepted'){
   if(row.state!=='held')this.state(row,receipt.disposition==='discarded_expired'?'expired':'suppressed',now);
   this.content.remove(row.content_ref);return this.row(row.question_id);
  }
  let q:ReturnType<AskContentStore['question']>,a:ReturnType<AskContentStore['answer']>;
  try{q=this.verified(row);a=this.content.answer(row.content_ref);}catch{return this.hold(row,now);}
  if(!q){if(row.state!=='content_pending')return this.hold(row,now);return row;}
  if(a){
   if(!row.answer_id||row.answer_id!==a.answer.answerId||row.answer_digest!==a.digest||row.answer_generated_at!==a.answer.generatedAt)return this.hold(row,now);
   const answer=a.answer;validate('AskAnswer',answer);
   if(answer.serviceId!==row.service_id||answer.questionId!==row.question_id||answer.questionHash!==row.question_hash||answer.conversationId!==row.conversation_id)return this.hold(row,now);
   if(a.state==='receipted'&&!receipt)return this.hold(row,now);
   if(receipt){this.content.receipted(row.content_ref);this.state(row,'delivered',now);}
   else this.state(row,'answer_staged',now);
  }else if(row.answer_id){
   if(row.state!=='answer_reserved')return this.hold(row,now);
   // A reservation alone cannot reconstruct a lost generated answer or start another model.
  }else{if(row.state!=='content_pending'&&row.state!=='available')return this.hold(row,now);this.state(row,'available',now);}
  return this.row(row.question_id);
 }
 importQuestion(value:AskClaim):AskImportMetadata{return privateContentError(()=>{
  const ctx=this.access('claim'),claim=structuredClone(value),q=claim.question;
  prepareAskRequest({kind:'renew',requestId:randomUUID(),claim,input:{schemaVersion:'1.0',serviceId:ctx.scope.serviceId,consumerGeneration:ctx.scope.consumerGeneration,questionId:q.questionId,questionHash:q.questionHash}},ctx);
  need(!this.journal.suppressed(q.conversationId,q.questionId),'WITHDRAWN');
  need(!this.db.get('SELECT 1 FROM ask_imports WHERE service_id=? AND conversation_id=? AND session_id<>?',this.serviceId,q.conversationId,q.sessionId),'CONFLICT');
  // Claimed history is only a list of IDs. Every ID must already belong to this exact owner.
  for(const id of q.priorOwnedQuestionIds){const prior=this.row(id);need(prior.session_id===q.sessionId&&prior.conversation_id===q.conversationId,'NOT_FOUND');}
  let row=this.db.get<AskImportMetadata>('SELECT * FROM ask_imports WHERE service_id=? AND question_id=?',this.serviceId,q.questionId);
  if(row){this.verifyQuestion(row,q);need(!terminal(row.state),'WITHDRAWN');}
  else{
   this.transaction(()=>{
    need(this.db.get<{n:number}>('SELECT count(*) n FROM ask_imports')!.n<10000,'BUDGET_EXHAUSTED');
    need(this.db.get<{n:number}>("SELECT count(*) n FROM ask_imports WHERE service_id=? AND state NOT IN ('suppressed','expired','held')",this.serviceId)!.n<ASK_CONTENT_ROWS,'BUDGET_EXHAUSTED');
    this.db.run(`INSERT INTO ask_imports(service_id,question_id,session_id,conversation_id,question_hash,question_digest,content_ref,received_at,expires_at,retain_until,metadata_until,state,updated_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,'content_pending',?)`,this.serviceId,q.questionId,q.sessionId,q.conversationId,q.questionHash,canonicalHash(q),randomUUID(),q.receivedAt,q.expiresAt,until(q.receivedAt,ctx.limits.rawRetentionSeconds),until(q.receivedAt,ctx.limits.suppressionRetentionSeconds),ctx.now);
   });row=this.row(q.questionId);
  }
  this.access('claim');row=this.live(q.questionId);
  if(row.state==='content_pending')this.content.insertQuestion(row.content_ref,q,row.retain_until);
  this.access('claim');return this.reconcileRow(this.live(q.questionId),this.context().now);
 });}
 /** Trusted owned access, not a visitor endpoint. Ownership IDs are checked against stored data. */
 question(owner:{sessionId:string;conversationId:string;questionId:string}):AskQuestion{return privateContentError(()=>{
  const ctx=this.access('claim');validate('Id',owner.sessionId);validate('Id',owner.conversationId);
  let row=this.live(owner.questionId);need(row.session_id===owner.sessionId&&row.conversation_id===owner.conversationId,'NOT_FOUND');row=this.reconcileRow(row,ctx.now);
  need(row.state!=='content_pending','OUTCOME_UNKNOWN');const q=this.verified(row);need(q,'OUTCOME_UNKNOWN');return q.question;
 });}
 history(questionId:string):{turns:{question:AskQuestion;answer:AskAnswer}[];omitted:string[]}{return privateContentError(()=>{
  const ctx=this.access('claim'),row=this.reconcileRow(this.live(questionId),ctx.now),q=this.verified(row);need(q,'OUTCOME_UNKNOWN');
  need(q.question.priorOwnedQuestionIds.length<ctx.limits.historyTurns,'BUDGET_EXHAUSTED');
  const turns:{question:AskQuestion;answer:AskAnswer}[]=[],omitted:string[]=[];
  for(const id of q.question.priorOwnedQuestionIds){
   let prior=this.row(id);need(prior.session_id===row.session_id&&prior.conversation_id===row.conversation_id,'NOT_FOUND');
   if(terminal(prior.state)){omitted.push(id);continue;}prior=this.reconcileRow(prior,ctx.now);
   const question=this.verified(prior),answer=this.content.answer(prior.content_ref);
   need(prior.state==='delivered'&&prior.receipt&&JSON.parse(prior.receipt).disposition==='accepted'&&question&&answer,'OUTCOME_UNKNOWN');
   turns.push({question:question.question,answer:answer.answer});
  }
  need(Buffer.byteLength(canonicalJson(turns))<=131072,'TOO_LARGE');return {turns,omitted};
 });}
 /** Stores a supplied answer only; it neither verifies employee execution nor authorizes delivery. */
 commitAnswer(questionId:string,value:AskAnswer):AskImportMetadata{return privateContentError(()=>{
  const ctx=this.access('answer'),answer=structuredClone(validate<AskAnswer>('AskAnswer',value));checkPublicStrings(answer);
  let row=this.live(questionId);row=this.reconcileRow(row,ctx.now);const q=this.verified(row);need(q,'OUTCOME_UNKNOWN');
  need(time(ctx.now)<time(row.expires_at)&&time(answer.generatedAt)>=time(row.received_at)&&time(answer.generatedAt)<=time(ctx.now),'EXPIRED');
  need(answer.serviceId===this.serviceId&&answer.questionId===row.question_id&&answer.questionHash===row.question_hash&&answer.conversationId===row.conversation_id,'CONFLICT');
  need(answer.knowledgeAsOf===null||time(answer.knowledgeAsOf)<=time(answer.generatedAt),'INVALID_REQUEST');need([...answer.text].length<=ctx.limits.answerCharacters,'TOO_LARGE');
  const digest=canonicalHash(answer);
  if(row.answer_id)need(row.answer_id===answer.answerId&&row.answer_digest===digest&&row.answer_generated_at===answer.generatedAt,'CONFLICT');
  else this.transaction(()=>this.db.run("UPDATE ask_imports SET answer_id=?,answer_digest=?,answer_generated_at=?,state='answer_reserved',updated_at=? WHERE service_id=? AND question_id=?",answer.answerId,digest,answer.generatedAt,ctx.now,this.serviceId,questionId));
  this.access('answer');row=this.live(questionId);this.content.insertAnswer(row.content_ref,q.question,answer);
  this.access('answer');return this.reconcileRow(this.live(questionId),this.context().now);
 });}
 pendingAnswer(questionId:string):{answer:AskAnswer;state:'pending_authority'}|null{return privateContentError(()=>{
  const ctx=this.access('answer');const row=this.reconcileRow(this.live(questionId),ctx.now);
  if(row.receipt)return null;need(time(ctx.now)<time(row.expires_at),'EXPIRED');
  const value=this.content.answer(row.content_ref);need(row.state==='answer_staged'&&value,'OUTCOME_UNKNOWN');return {answer:value.answer,state:'pending_authority'};
 });}
 receiptIdentity(questionId:string):AskReceiptIdentity|null{return privateContentError(()=>{
  this.clean();const row=this.row(questionId);if(!row.answer_id)return null;
  return {serviceId:this.serviceId,answerId:row.answer_id,questionId:row.question_id,questionHash:row.question_hash,answerDigest:row.answer_digest!,generatedAt:row.answer_generated_at!};
 });}
 recordReceipt(value:AskAnswerReceipt):void{privateContentError(()=>{
  const ctx=this.clean(),receipt=structuredClone(validate<AskAnswerReceipt>('AskAnswerReceipt',value)),row=this.row(receipt.questionId);
  need(row.answer_id===receipt.answerId&&row.answer_digest===receipt.answerDigest&&row.question_hash===receipt.questionHash,'CONFLICT');
  need(time(receipt.receivedAt)>=time(row.answer_generated_at!)&&time(receipt.receivedAt)<=time(ctx.now),'INVALID_REQUEST');
  const digest=canonicalHash(receipt);if(row.receipt){need(row.receipt_hash===digest,'CONFLICT');if(!terminal(row.state))this.reconcileRow(row,ctx.now);return;}
  this.transaction(()=>this.db.run('UPDATE ask_imports SET receipt=?,receipt_hash=?,updated_at=? WHERE service_id=? AND question_id=?',canonicalJson(receipt),digest,ctx.now,this.serviceId,row.question_id));
  if(!terminal(row.state))this.reconcileRow(this.row(row.question_id),ctx.now);
 });}
 /** No fresh content, grants, network or model calls; incomplete reservations stay explicit. */
 reconcile():AskImportMetadata[]{return privateContentError(()=>{const ctx=this.clean();return this.rows().map(row=>this.reconcileRow(row,ctx.now));});}
 metadata(questionId:string):AskImportMetadata{return privateContentError(()=>{const ctx=this.context();this.check(ctx);return this.row(questionId);});}
 maintenance():{contentPurgeVerified:false;restorationVerified:false}{return privateContentError(()=>{
  this.clean();return {contentPurgeVerified:false,restorationVerified:false};
 });}
 /** Expired uncertain identities stay held; their disappearance must never imply fresh work. */
 pruneMetadata():{imports:number;controls:number}{return privateContentError(()=>{
  const ctx=this.clean();this.journal.prune();
  const retained=new Set(this.journal.controls().map(c=>c.controlId));
  const rows=this.rows().filter(row=>time(row.metadata_until)<=time(ctx.now));
  need(rows.every(row=>['suppressed','expired'].includes(row.state)),'OUTCOME_UNKNOWN');
  const controls=this.db.all<AppliedControl>('SELECT * FROM ask_content_controls WHERE service_id=?',this.serviceId).filter(c=>time(c.suppression_until)<=time(ctx.now)&&!retained.has(c.control_id));
  need(controls.every(c=>c.state==='applied'),'OUTCOME_UNKNOWN');
  for(const row of rows)this.content.remove(row.content_ref);
  for(const c of controls)this.content.retireControl(c.control_id);
  this.transaction(()=>{
   for(const row of rows)this.db.run('DELETE FROM ask_imports WHERE service_id=? AND question_id=?',this.serviceId,row.question_id);
   for(const c of controls)this.db.run('DELETE FROM ask_content_controls WHERE service_id=? AND control_id=?',this.serviceId,c.control_id);
  });return {imports:rows.length,controls:controls.length};
 });}
 close():void{this.content.close();}
}
