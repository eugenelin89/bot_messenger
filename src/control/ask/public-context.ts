/** Read-only projection of receipted publication bodies and explicitly approved public text. */
import type {AskQuestion,ContextRef,Event,EventBatch,PublicationReceipt,Source,RecordRef} from '../../../contracts/investment/v1/types.js';
import {canonicalHash as hash,canonicalJson as json,checkPublicStrings,parseJson,requireContract as need,sha256,validate} from '../../../scripts/investment-contracts/schema.js';
import {publicRecords,recordKeys} from '../../../scripts/investment-contracts/publication.js';
import type {Channel,Job} from '../../domain/publication/types.js';
import type {AskPublicContext,AskPublicEvidence,AskDocumentDependency} from '../../domain/ask/execution.js';
import type {Store} from '../../persistence/store.js';
export interface ApprovedAskDocument {source:Source;text:string;digest:string;enabled:boolean}
export interface AskPublicProjectionOptions {
 channelIds:readonly string[];
 /** Trusted deployment registry; edits/withdrawals take effect at every access. */
 documents():readonly ApprovedAskDocument[];
 /** Real publisher health includes the in-memory restart fence and reconciled generation. */
 assertChannelCurrent(channelId:string):void;
}
export class AskPublicProjection {
 constructor(private readonly db:Store,private readonly options:AskPublicProjectionOptions){}
 private published():{events:Event[];notices:Event[]} {
  need(this.options.channelIds.length<=8&&new Set(this.options.channelIds).size===this.options.channelIds.length,'FORBIDDEN');
  const events:Event[]=[],notices:Event[]=[];
  for(const id of this.options.channelIds){
   this.options.assertChannelCurrent(id);
   const c=this.db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',id);need(c&&c.reconciled_generation===c.generation,'OUTCOME_UNKNOWN');
   const jobs=this.db.all<Job>("SELECT * FROM investment_public_jobs WHERE channel_id=? AND kind='batch' ORDER BY position",id);need(jobs.length<=10000,'TOO_LARGE');
   for(const job of jobs){
    need(sha256(job.body)===job.digest,'CONFLICT');const batch=validate<EventBatch>('EventBatch',parseJson(job.body));
    need(batch.experimentId===c.experiment_id&&batch.runId===c.run_id&&batch.batchId===job.id,'CONFLICT');
    // A locally committed withdrawal hides affected records even before publication succeeds.
    notices.push(...batch.events.filter(e=>e.type==='publication.notice'));
    if(job.state!=='delivered')continue;
    need(job.receipt&&!job.needs_receipt,'OUTCOME_UNKNOWN');const receipt=validate<PublicationReceipt>('PublicationReceipt',JSON.parse(job.receipt));
    need(receipt.batchId===job.id&&receipt.bodyDigest===job.digest&&receipt.experimentId===c.experiment_id&&receipt.runId===c.run_id,'CONFLICT');
    const ids=[...receipt.acceptedIds,...receipt.duplicateIds];need(new Set(ids).size===ids.length&&hash([...ids].sort())===hash(batch.events.map(e=>e.eventId).sort()),'CONFLICT');
    need(receipt.watermark.sourceSequence!==null&&BigInt(receipt.watermark.sourceSequence)>=BigInt(batch.events.at(-1)!.sourceSequence),'CONFLICT');
    events.push(...batch.events);
   }
  }
  need(events.length<=100000,'TOO_LARGE');return{events,notices};
 }
 private record(reference:ContextRef,history:ReturnType<AskPublicProjection['published']>):AskPublicEvidence {
  validate('ContextRef',reference);need(['transaction','decision','artifact','order'].includes(reference.record.kind),'FORBIDDEN');
  const events=history.events.filter(e=>e.experimentId===reference.experimentId&&e.runId===reference.runId),records=publicRecords(events),visited=new Set<string>(),graph=new Map<string,Event>();
  const lookup=(kind:string,id:string,version:number):Event=>{
   const key=`${kind}:${id}:${version}`;need(visited.size<1000,'TOO_LARGE');
   const event=records.get(key);need(event,'NOT_FOUND');
   need(!history.notices.some(e=>e.experimentId===reference.experimentId&&e.runId===reference.runId&&e.type==='publication.notice'&&['withdrawal','rights'].includes(e.payload.kind)&&e.payload.affected.some(r=>recordKeys(event).includes(`${r.kind}:${r.id}:${r.version}`))),'WITHDRAWN');
   if(!visited.has(key)){
    visited.add(key);graph.set(event.eventId,event);
    const embedded=(value:unknown):void=>{if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach(embedded);return;}
     const item=value as Record<string,unknown>;if('kind' in item&&'id' in item&&'version' in item&&'relation' in item){const r=validate<RecordRef>('RecordRef',item);lookup(r.kind,r.id,r.version);return;}Object.values(item).forEach(embedded);};
    embedded(event.references);embedded(event.payload);
    if(event.type==='paper.order'){lookup('decision',event.payload.decisionId,event.payload.decisionRevision);if(event.payload.previousEventId)lookup('event',event.payload.previousEventId,1);}
    if(event.type==='paper.ledger_transaction'&&event.payload.fill){const fill=event.payload.fill;lookup('order',fill.orderId,fill.orderRevision);lookup('decision',fill.decisionId,fill.decisionRevision);}
   }
   return event;
  };
  const e=lookup(reference.record.kind,reference.record.id,reference.record.version);checkPublicStrings(e);
  const authors:string[]=[];
  for(const item of graph.values()){
   if(item.actor.kind==='worker')authors.push(item.actor.workerId);
   if(item.type==='decision.published')authors.push(item.payload.review.reviewerId);
   if((item.type==='artifact.published'||item.type==='artifact.registered')&&item.payload.author.kind==='worker')authors.push(item.payload.author.workerId);
  }
  const text=json({selected:e,dependencies:[...graph.values()].filter(item=>item.eventId!==e.eventId)});need(Buffer.byteLength(text)<=20000,'TOO_LARGE');
  return{reference:structuredClone(reference),authorWorkerIds:[...new Set(authors)],text,knowledgeAsOf:e.occurredAt};
 }
 private documents(){const docs=this.options.documents().filter(d=>d.enabled);need(docs.length<=20,'TOO_LARGE');return docs.map(d=>{validate('Source',d.source);checkPublicStrings(d);need(d.source.rights==='owner_authored'&&d.digest===hash({source:d.source,text:d.text})&&Buffer.byteLength(d.text)<=20000,'FORBIDDEN');return{source:structuredClone(d.source),text:d.text};});}
 context(question:AskQuestion):AskPublicContext {return{records:question.input.context?[this.record(question.input.context,this.published())]:[],documents:this.documents()};}
 visible(context:AskPublicContext):boolean {try{const history=this.published();return context.records.every(r=>hash(this.record(r.reference,history))===hash(r))&&context.documents.every(d=>this.documents().some(current=>hash(current)===hash(d)));}catch{return false;}}
 visibleReferences(references:ContextRef[],sources:Source[],documents:AskDocumentDependency[]):boolean {try{const history=this.published();for(const r of references)this.record(r,history);const docs=this.documents();return sources.every(s=>docs.some(d=>hash(d.source)===hash(s)))&&documents.every(version=>docs.some(d=>hash(d.source)===hash(version.source)&&hash(d)===version.contentDigest));}catch{return false;}}
}
