/** Durable suppression metadata only. Not a grant, restore attestation or dispatch capability. */
import { randomUUID } from 'node:crypto';
import type { AskControlReceipt, AskControlSync, AskControlSyncInput } from '../../../contracts/investment/v1/types.js';
import { canonicalHash, canonicalJson, requireContract as need, validate } from '../../../scripts/investment-contracts/schema.js';
import { decodeAskResponse, prepareAskRequest, reconstructAskRequest, type AskBoundaryContext, type PreparedAskRequest } from '../../domain/ask/contract.js';
import { Store } from '../../persistence/store.js';

export const ASK_CONTROL_APPLICATION = 'suppression-journal-v1' as const;
const MAX_SERVICES = 8, MAX_CONTROLS = 100000, MAX_REQUESTS = 100000, MAX_PAGES = 1000;
type SyncOperation = {kind:'control_sync'; input:AskControlSyncInput};
interface Service {
 service_id:string; generation:string; instance:string; binding_hash:string; next_cursor:string|null;
 pending_id:string|null; barrier_id:string|null; pages:number; observed_at:string;
}
interface Request {
 service_id:string; sync_id:string; generation:string; instance:string; request:string; request_hash:string;
 created_at:string; retain_until:string; state:'pending'|'complete'|'abandoned'|'reconciled'; response:string|null; response_hash:string|null; resolved_by:string|null;
}
interface Control {control_id:string; control_hash:string; payload:string; application_version:string; application_hash:string; acknowledged_at:string|null}
export interface AskSyncIntent { operation:SyncOperation; prepared:PreparedAskRequest<'control_sync'> }
export interface AskJournalBarrier {
 syncId:string; checkedAt:string; validUntil:string; applicationVersion:typeof ASK_CONTROL_APPLICATION;
 /** Future integration must separately apply cancellation/purge and verify restore custody. */
 contentPurgeVerified:false; restorationVerified:false;
}
function time(value:string):number { validate('Time',value);return Date.parse(value); }
const binding = (ctx:AskBoundaryContext) => canonicalHash({scope:ctx.scope,limits:ctx.limits});
const application = (serviceId:string,controlHash:string) => canonicalHash({serviceId,controlHash,version:ASK_CONTROL_APPLICATION});

/**
 * Dormant trusted component; no application/network/model caller. It owns only non-content
 * suppression records. Acknowledgment records that narrow effect, never raw/provider purge.
 * Before wiring Ask, the actual import/execution adapter must atomically reapply all retained
 * controls with its own application version. This journal's barrier cannot authorize work.
 * The caller must already own the service data lock. A new instance invalidates old callbacks.
 */
export class AskControlJournal {
 private readonly instance = randomUUID();
 private observedClock = -Infinity;
 private readonly serviceId:string;
 constructor(private readonly db:Store,private readonly current:()=>AskBoundaryContext) {
  const ctx=this.context();this.serviceId=ctx.scope.serviceId;
  this.transaction(()=>{
   const prior=db.get<Service>('SELECT * FROM ask_control_services WHERE service_id=?',this.serviceId);
   if(prior){
    // Generation repair belongs to independent restore coordination, not a sync response.
    need(prior.generation===ctx.scope.consumerGeneration,'CONFLICT');need(time(ctx.now)>=time(prior.observed_at),'CONFLICT');
    db.run("UPDATE ask_control_requests SET state='abandoned' WHERE service_id=? AND state='pending'",this.serviceId);
    db.run('UPDATE ask_control_services SET instance=?,binding_hash=?,next_cursor=NULL,pending_id=NULL,barrier_id=NULL,pages=0,observed_at=? WHERE service_id=?',this.instance,binding(ctx),ctx.now,this.serviceId);
   }else{
    need(db.get<{n:number}>('SELECT count(*) n FROM ask_control_services')!.n<MAX_SERVICES,'BUDGET_EXHAUSTED');
    db.run('INSERT INTO ask_control_services(service_id,generation,instance,binding_hash,observed_at) VALUES (?,?,?,?,?)',this.serviceId,ctx.scope.consumerGeneration,this.instance,binding(ctx),ctx.now);
   }
  });
 }
 private transaction<T>(fn:()=>T):T {
  // Nested Store transactions are not savepoints. Own the commit/rollback of each transition.
  need(!this.db.transactionActive,'CONFLICT');return this.db.transaction(fn);
 }
 private context():AskBoundaryContext {
  const ctx=structuredClone(this.current());validate('AskServiceScope',ctx.scope);validate('AskLimits',ctx.limits);
  const now=time(ctx.now);need(now>=this.observedClock,'CONFLICT');this.observedClock=now;return ctx;
 }
 private service(ctx:AskBoundaryContext):Service {
  const s=this.db.get<Service>('SELECT * FROM ask_control_services WHERE service_id=?',this.serviceId);
  need(s&&s.instance===this.instance&&s.service_id===ctx.scope.serviceId&&s.generation===ctx.scope.consumerGeneration&&s.binding_hash===binding(ctx),'CONFLICT');
  need(time(ctx.now)>=time(s.observed_at),'CONFLICT');return s;
 }
 private horizon(ctx:AskBoundaryContext):void {
  const pending=this.db.all<Request>("SELECT * FROM ask_control_requests WHERE service_id=? AND state IN ('pending','abandoned')",this.serviceId);
  need(pending.every(r=>time(r.retain_until)>time(ctx.now)),'OUTCOME_UNKNOWN');
  const controls=this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? AND acknowledged_at IS NULL',this.serviceId);
  need(controls.every(r=>time(this.applied(r).suppressionUntil)>time(ctx.now)),'OUTCOME_UNKNOWN');
 }
 private request(id:string):Request {
  validate('Id',id);const r=this.db.get<Request>('SELECT * FROM ask_control_requests WHERE service_id=? AND sync_id=?',this.serviceId,id);
  need(r&&r.instance===this.instance,'CONFLICT');need(canonicalHash(JSON.parse(r.request))===r.request_hash,'CONFLICT');return r;
 }
 private intent(r:Request):AskSyncIntent {
  const prepared=JSON.parse(r.request) as PreparedAskRequest<'control_sync'>;
  const input=validate<AskControlSyncInput>('AskControlSyncInput',JSON.parse(prepared.body));
  need(input.syncId===r.sync_id&&input.serviceId===this.serviceId&&input.consumerGeneration===r.generation,'CONFLICT');
  return {operation:{kind:'control_sync',input},prepared};
 }
 private applied(row:Control):AskControlReceipt {
  const value=validate<AskControlReceipt>('AskControlReceipt',JSON.parse(row.payload));
  need(value.controlId===row.control_id&&canonicalHash(value)===row.control_hash&&row.application_version===ASK_CONTROL_APPLICATION&&row.application_hash===application(this.serviceId,row.control_hash),'CONFLICT');return value;
 }
 /** Derive cursor/ACKs internally; unknown/lost responses return the exact same frozen intent. */
 prepareSync():AskSyncIntent {
  const ctx=this.context();return this.transaction(()=>{
   const s=this.service(ctx);this.horizon(ctx);
   if(s.pending_id){const r=this.request(s.pending_id);need(r.state==='pending','CONFLICT');const intent=this.intent(r);reconstructAskRequest(intent.operation,intent.prepared,ctx);return intent;}
   need(s.pages<MAX_PAGES&&this.db.get<{n:number}>('SELECT count(*) n FROM ask_control_requests')!.n<MAX_REQUESTS,'BUDGET_EXHAUSTED');
   const controls=this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? AND acknowledged_at IS NULL ORDER BY rowid LIMIT 100',this.serviceId);
   const acknowledgedControlIds=controls.map(row=>this.applied(row).controlId);
   const operation:SyncOperation={kind:'control_sync',input:{schemaVersion:'1.0',serviceId:this.serviceId,consumerGeneration:s.generation,syncId:randomUUID(),acknowledgedControlIds,after:s.next_cursor}};
   const prepared=prepareAskRequest(operation,ctx),retainUntil=new Date(time(ctx.now)+ctx.limits.suppressionRetentionSeconds*1000).toISOString();
   this.db.run('INSERT INTO ask_control_requests(service_id,sync_id,generation,instance,request,request_hash,created_at,retain_until,state) VALUES (?,?,?,?,?,?,?,?,?)',this.serviceId,operation.input.syncId,s.generation,this.instance,canonicalJson(prepared),canonicalHash(prepared),ctx.now,retainUntil,'pending');
   this.db.run('UPDATE ask_control_services SET pending_id=?,barrier_id=NULL,observed_at=? WHERE service_id=?',operation.input.syncId,ctx.now,this.serviceId);
   return {operation,prepared};
  });
 }
 /** Revalidate a decoded transport value against persisted identity; no caller-supplied page proof. */
 acceptPage(syncId:string,value:unknown):void {
  const ctx=this.context();this.transaction(()=>{
   const s=this.service(ctx);this.horizon(ctx);const r=this.request(syncId),intent=this.intent(r);
   const decoded=decodeAskResponse(intent.prepared,{status:200,contentType:'application/json',cacheControl:'private, no-store',bytes:Buffer.from(canonicalJson(value))},ctx);
   need(decoded.kind==='data','INVALID_SCHEMA');const page=decoded.value,digest=canonicalHash(page);
   if(r.state==='complete'){need(r.response_hash===digest,'CONFLICT');return;}
   need(r.state==='pending'&&s.pending_id===syncId&&intent.operation.input.after===s.next_cursor,'CONFLICT');
   const total=this.db.get<{n:number}>('SELECT count(*) n FROM ask_privacy_controls')!.n;
   const added=page.controls.filter(c=>!this.db.get('SELECT 1 FROM ask_privacy_controls WHERE service_id=? AND control_id=?',this.serviceId,c.controlId)).length;
   need(total+added<=MAX_CONTROLS,'BUDGET_EXHAUSTED');
   // Suppression index and its exact application receipt are one real, atomic local effect.
   for(const c of page.controls){
    const hash=canonicalHash(c),old=this.db.get<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? AND control_id=?',this.serviceId,c.controlId);
    if(old){this.applied(old);need(old.control_hash===hash,'CONFLICT');continue;}
    this.db.run('INSERT INTO ask_privacy_controls(service_id,control_id,control_hash,payload,conversation_id,question_id,action,effective_at,purge_by,suppression_until,application_version,application_hash,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',this.serviceId,c.controlId,hash,canonicalJson(c),c.conversationId,c.questionId,c.action,c.effectiveAt,c.purgeBy,c.suppressionUntil,ASK_CONTROL_APPLICATION,application(this.serviceId,hash),ctx.now);
   }
   for(const id of intent.operation.input.acknowledgedControlIds){
    const row=this.db.get<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? AND control_id=?',this.serviceId,id);need(row,'CONFLICT');this.applied(row);
    if(row.acknowledged_at===null)this.db.run('UPDATE ask_privacy_controls SET acknowledged_at=? WHERE service_id=? AND control_id=?',ctx.now,this.serviceId,id);
   }
   const unacked=this.db.get<{n:number}>('SELECT count(*) n FROM ask_privacy_controls WHERE service_id=? AND acknowledged_at IS NULL',this.serviceId)!.n;
   const drained=page.controls.length===0&&page.nextCursor===null&&unacked===0;
   this.db.run("UPDATE ask_control_requests SET state='complete',response=?,response_hash=? WHERE service_id=? AND sync_id=?",canonicalJson(page),digest,this.serviceId,syncId);
   // A new complete traversal reconciles only abandoned sync metadata. It cannot settle
   // provider work or recover a restored backup's missing suppression/authority records.
   const fresh=time(ctx.now)<time(page.validUntil)&&time(ctx.now)-time(page.checkedAt)<=ctx.limits.controlFreshnessSeconds*1000;
   if(drained&&fresh)this.db.run("UPDATE ask_control_requests SET state='reconciled',resolved_by=? WHERE service_id=? AND state='abandoned'",syncId,this.serviceId);
   this.db.run('UPDATE ask_control_services SET next_cursor=?,pending_id=NULL,barrier_id=?,pages=?,observed_at=? WHERE service_id=?',page.nextCursor,drained?syncId:null,drained?0:s.pages+1,ctx.now,this.serviceId);
  });
 }
 /** Freshness for suppression-journal-v1 only. Never clears the independent restore hold. */
 barrier():AskJournalBarrier|null {
  const ctx=this.context(),s=this.service(ctx);this.horizon(ctx);if(!s.barrier_id||s.pending_id)return null;
  const r=this.request(s.barrier_id);need(r.state==='complete'&&r.response!==null,'CONFLICT');
  const page=validate<AskControlSync>('AskControlSync',JSON.parse(r.response));need(canonicalHash(page)===r.response_hash,'CONFLICT');
  if(!ctx.scope.enabled||time(ctx.now)>=time(ctx.scope.expiresAt)||!ctx.scope.permissions.includes('control_sync')||page.controls.length||page.nextCursor!==null||time(ctx.now)>=time(page.validUntil)||time(ctx.now)-time(page.checkedAt)>ctx.limits.controlFreshnessSeconds*1000)return null;
  if(this.db.get<{n:number}>('SELECT count(*) n FROM ask_privacy_controls WHERE service_id=? AND acknowledged_at IS NULL',this.serviceId)!.n)return null;
  return {syncId:page.syncId,checkedAt:page.checkedAt,validUntil:page.validUntil,applicationVersion:ASK_CONTROL_APPLICATION,contentPurgeVerified:false,restorationVerified:false};
 }
 /** Non-content obligations for the later import/execution adapter; no purge completion flag. */
 controls():AskControlReceipt[] {
  const ctx=this.context();this.service(ctx);return this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? ORDER BY rowid',this.serviceId).map(row=>this.applied(row));
 }
 /** Cleanup remains possible after admission settings change; never supplies freshness. */
 custody(db:Store):{serviceId:string;generation:string;controls:AskControlReceipt[]}{
  need(db===this.db,'CONFLICT');const ctx=this.context();
  const s=this.db.get<Service>('SELECT * FROM ask_control_services WHERE service_id=?',this.serviceId);
  need(s&&s.instance===this.instance&&s.service_id===ctx.scope.serviceId&&s.generation===ctx.scope.consumerGeneration
   &&time(ctx.now)>=time(s.observed_at),'CONFLICT');
  return {serviceId:this.serviceId,generation:s.generation,controls:this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? ORDER BY rowid',this.serviceId).map(row=>this.applied(row))};
 }
 /** Exact admission binding for dormant storage adapters; not an authority token. */
 identity(db:Store):{serviceId:string;generation:string;bindingHash:string}{need(db===this.db,'CONFLICT');const ctx=this.context();this.service(ctx);return {serviceId:this.serviceId,generation:ctx.scope.consumerGeneration,bindingHash:binding(ctx)};}
 suppressed(conversationId:string,questionId:string):boolean {
  validate('Id',conversationId);validate('Id',questionId);const ctx=this.context();this.service(ctx);
  return this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=? AND conversation_id=? AND (question_id IS NULL OR question_id=?)',this.serviceId,conversationId,questionId)
   .some(row=>time(this.applied(row).suppressionUntil)>time(ctx.now));
 }
 /** Retire only acknowledged, expired metadata. Unresolved expiry holds for operator recovery. */
 prune():{controls:number;requests:number} {
  const ctx=this.context();return this.transaction(()=>{
   const s=this.service(ctx);need(!s.pending_id,'CONFLICT');
   const expired=this.db.all<Control>('SELECT * FROM ask_privacy_controls WHERE service_id=?',this.serviceId).filter(row=>time(this.applied(row).suppressionUntil)<=time(ctx.now));
   need(expired.every(row=>row.acknowledged_at!==null),'OUTCOME_UNKNOWN');
   const retained=this.db.all<Request>('SELECT * FROM ask_control_requests WHERE service_id=?',this.serviceId);
   const needed=new Set(retained.filter(r=>time(r.retain_until)>time(ctx.now)&&r.resolved_by!==null).map(r=>r.resolved_by));
   const requests=retained.filter(r=>time(r.retain_until)<=time(ctx.now)&&!needed.has(r.sync_id));
   need(requests.every(r=>r.state==='complete'||r.state==='reconciled'),'OUTCOME_UNKNOWN');
   for(const c of expired)this.db.run('DELETE FROM ask_privacy_controls WHERE service_id=? AND control_id=?',this.serviceId,c.control_id);
   for(const r of requests)this.db.run('DELETE FROM ask_control_requests WHERE service_id=? AND sync_id=?',this.serviceId,r.sync_id);
   this.db.run('UPDATE ask_control_services SET next_cursor=NULL,barrier_id=NULL,pages=0,observed_at=? WHERE service_id=?',ctx.now,this.serviceId);
   return {controls:expired.length,requests:requests.length};
  });
 }
}
