import {lstatSync,readdirSync,realpathSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import type {AskAnswer, AskClaim, AskRoute, AskWorkerEligibility,ContextRef,Source} from '../../../contracts/investment/v1/types.js';
import {ContractError,canonicalHash,canonicalJson,requireContract as need,validate} from '../../../scripts/investment-contracts/schema.js';
import {contextKey} from '../../../scripts/investment-contracts/ask.js';
import {configuration,type AskGrant,type AskGrantConfiguration,type AskReservation} from '../../domain/ask/authority.js';
import type {AskDispatchRow,AskPreparedTurn,AskPublicContext,AskRuntimeInput,AskDocumentDependency,AskEvidenceDependencies} from '../../domain/ask/execution.js';
import type {AskExecution} from '../../domain/model.js';
import type {AskRuntimeResult,AskRuntimeAdapter} from '../../runtime/adapter.js';
import {checkApiUsage,askSubmitTool} from '../../domain/ask/api-policy.js';
import type {Company} from '../company.js';
import {AskAuthorityJournal} from './authority-journal.js';
import {AskControlJournal} from './control-journal.js';
import {AskPrivateContent} from './private-content.js';

export interface AskServiceOptions {
 current():AskGrantConfiguration;
 /** Composition supplies the current signed receiver freshness gate. */
 assertReady?(purpose:'admission'|'execution'|'delivery'):void;
 grantId:string; authority:AskAuthorityJournal; controls:AskControlJournal; content:AskPrivateContent;
 /** Owner-controlled public-to-HQ identity map, never derived from visitor text. */
 workers:ReadonlyArray<{publicId:string;workerId:string;workspace:string;eligibility:AskWorkerEligibility}>;
 /** Trusted read projection of currently published records and explicitly approved product text. */
 publicContext(question:AskClaim['question']):AskPublicContext;
 visible(context:AskPublicContext):boolean;
 visibleReferences(references:ContextRef[],sources:Source[],documents:AskDocumentDependency[]):boolean;
 now?():string;
}
const submit=askSubmitTool();

/** One coordinator for existing employees; raw text never enters Company records. */
export class AskService {
 private readonly claims=new Map<string,AskClaim>();
 private readonly active=new Map<string,{turn:AskPreparedTurn;answer?:AskAnswer}>();
 private closed=false;
 private now(){return this.options.now?.()??new Date(this.company.mandates.clock.now()).toISOString();}
 get ownerPaused():boolean{return this.options.authority.isPaused(this.options.current().scope.serviceId);}
 pauseOwner(paused:boolean):void {
  this.company.conversations.human();need(typeof paused==='boolean','INVALID_SCHEMA');
  this.options.authority.ownerPause(this.options.current().scope.serviceId,paused,this.now());
  if(paused)for(const id of this.active.keys())this.company.emit('ask_interrupt',id);
  this.company.changed();
 }
 inspect(){return{installed:true,serviceId:this.options.current().scope.serviceId,paused:this.ownerPaused,closed:this.closed,
  active:this.active.size,grantId:this.options.grantId};}
 assertOperational(purpose:'admission'|'execution'|'delivery'):void {need(!this.closed,'UNAVAILABLE');this.config(purpose);}
 constructor(readonly company:Company,private readonly options:AskServiceOptions){
  need(!company.ask,'CONFLICT');validate('AskServiceScope',options.current().scope);
  this.closed=!!company.store.get('SELECT 1 FROM ask_service_holds WHERE service_id=?',options.current().scope.serviceId);company.ask=this;
 }
 private config(purpose:'admission'|'execution'|'delivery'='execution'):{config:AskGrantConfiguration;grant:AskGrant}{
  this.options.assertReady?.(purpose);
  const config=structuredClone(this.options.current()),grant=this.options.authority.assertCurrent(this.options.grantId,this.now());
  configuration(grant,config);
  need(this.options.workers.length>0&&this.options.workers.length<=8,'FORBIDDEN');
  need(new Set(this.options.workers.map(w=>w.publicId)).size===this.options.workers.length
   &&new Set(this.options.workers.map(w=>w.workerId)).size===this.options.workers.length,'CONFLICT');
  for(const w of this.options.workers){
   validate('AskWorkerEligibility',w.eligibility);need(w.publicId===w.eligibility.workerId,'CONFLICT');
   const publicWorker=config.roster.workers.find(r=>r.worker.workerId===w.publicId);
   need(publicWorker&&!publicWorker.researchAvailable&&!w.eligibility.researchEnabled
    &&canonicalHash(publicWorker.topics)===canonicalHash(w.eligibility.topics),'FORBIDDEN');
  }
  return {config,grant};
 }
 importClaim(value:AskClaim):void {
  const {config}=this.config();need(value.serviceId===config.scope.serviceId,'FORBIDDEN');
  need(this.claims.has(value.question.questionId)||this.claims.size<config.limits.queueCapacity,'BUDGET_EXHAUSTED');
  this.options.content.importQuestion(value);this.claims.set(value.question.questionId,structuredClone(value));this.company.changed();
 }
 private row(id:string){const row=this.company.store.get<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE execution_id=?',id);need(row,'NOT_FOUND');return row;}
 private eligible(publicId:string){
  const entry=this.options.workers.find(w=>w.publicId===publicId);if(!entry||!entry.eligibility.enabled)return undefined;
  if(!this.options.current().roster.workers.some(w=>w.worker.workerId===publicId&&w.worker.status==='available'))return undefined;
  const w=this.company.worker(entry.workerId);
  if(!w.enabled||this.company.providerUnresolved(w.worker_id)||this.company.business.reserved(w.worker_id)
   ||this.company.store.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'",w.worker_id))return undefined;
  return entry;
 }
 private route(q:AskClaim['question'],history:AskPreparedTurn['history'],evidence:AskPublicContext,grant:AskGrant):AskRoute|null {
  const previous=history.at(-1)?.answer.workerId??null;
  const permitted=(id:string)=>grant.workerIds.includes(id)&&!!this.eligible(id);
  let selected:string|undefined,reason:AskRoute['reason']='generalist';
  if(q.input.context){const record=evidence.records.find(r=>contextKey(r.reference)===contextKey(q.input.context!));need(record,'NOT_FOUND');selected=record.authorWorkerIds.find(permitted);if(selected)reason='record_provenance';}
  const text=q.input.text.toLocaleLowerCase('en-US');
  const topical=this.options.workers.filter(w=>permitted(w.publicId)&&w.eligibility.topics.some(topic=>topic!=='general'&&text.includes(topic.toLocaleLowerCase('en-US'))));
  if(!selected&&previous&&permitted(previous)&&(!topical.length||topical.some(w=>w.publicId===previous))){selected=previous;reason='follow_up';}
  if(!selected&&topical.length){selected=topical[0]!.publicId;reason='topic';}
  if(!selected){selected=[...this.options.workers].sort((a,b)=>a.eligibility.fallbackOrder-b.eligibility.fallbackOrder)
   .find(w=>permitted(w.publicId)&&w.eligibility.topics.includes('general'))?.publicId;reason=previous||q.input.context?'fallback':'generalist';}
  return selected?{workerId:selected,reason,routingPolicyVersion:'ask-router-v1',previousWorkerId:previous,
   explanation:{record_provenance:'The employee authored the selected public record.',follow_up:'Continuing with the previous eligible employee.',topic:'Selected from the approved topic roster.',generalist:'Selected approved generalist.',fallback:'An approved generalist is answering while the preferred employee is unavailable.'}[reason]}:null;
 }
 /** Called only after ordinary Company work has had first admission opportunity. */
 claimNext(maxActive:number):AskPreparedTurn|undefined {
  if(this.closed||this.company.paused||this.active.size)return;
  const db=this.company.store;
  if(db.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n>=maxActive
   ||db.get("SELECT 1 FROM ask_dispatches WHERE unresolved=1"))return;
  const {config,grant}=this.config('admission'),now=this.now();
  // Conservatively reserve a whole maximum-duration duty period, even for shorter turns.
  const last=db.get<{duty_until:string}>("SELECT duty_until FROM ask_dispatches ORDER BY duty_until DESC LIMIT 1");
  if(last&&now<last.duty_until)return;
  const near=this.company.mandates.nextWake();
  if(near&&Date.parse(near)<=Date.parse(now)+grant.maxDurationMs)return;
  this.maintenance();
  for(const claim of this.claims.values()){
   const q=claim.question;
   if(Date.parse(claim.leaseExpiresAt)<=Date.parse(now)||Date.parse(q.expiresAt)<=Date.parse(now)||db.get('SELECT 1 FROM ask_dispatches WHERE service_id=? AND question_id=?',q.serviceId,q.questionId))continue;
   const question=this.options.content.question({sessionId:q.sessionId,conversationId:q.conversationId,questionId:q.questionId});
   const history=this.options.content.history(q.questionId),evidence=structuredClone(this.options.publicContext(question));
   need(evidence.records.length<=20&&evidence.documents.length<=30&&this.options.visible(evidence),'WITHDRAWN');
   for(const record of evidence.records){validate('ContextRef',record.reference);need(record.text.length<=20000,'TOO_LARGE');}
   for(const doc of evidence.documents){validate('Source',doc.source);need(doc.text.length<=20000,'TOO_LARGE');}
   need(this.historyVisible(history.turns),'WITHDRAWN');
   const route=this.route(question,history.turns,evidence,grant);if(!route)continue;
   const entry=this.eligible(route.workerId)!;
   const workspace=lstatSync(entry.workspace),ordinary=this.company.worker(entry.workerId).workspace_path;
   need(workspace.isDirectory()&&!workspace.isSymbolicLink()&&workspace.uid===process.getuid?.()
    &&(workspace.mode&0o077)===0&&realpathSync(entry.workspace)===entry.workspace
    &&entry.workspace!==ordinary&&!entry.workspace.startsWith(ordinary+'/')
    &&readdirSync(entry.workspace).length===0,'FORBIDDEN');
   const publicWorker=config.roster.workers.find(w=>w.worker.workerId===route.workerId)!.worker;
   const context={worker:publicWorker,question:question.input,history:history.turns.map(t=>({question:t.question.input,answer:t.answer})),
    omissions:history.omitted,evidence,route,limits:{answerCharacters:config.limits.answerCharacters,research:false,actions:false}};
   need(Buffer.byteLength(canonicalJson(context))<=131072,'TOO_LARGE');
   const inherited=history.turns.map(t=>JSON.parse(db.get<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE execution_id=?',t.answer.answerId)!.evidence_refs) as AskEvidenceDependencies);
   const unique=<T>(values:T[]):T[]=>[...new Map(values.map(v=>[canonicalHash(v),v])).values()];
   const dependencies={references:unique([...evidence.records.map(r=>r.reference),...(question.input.context?[question.input.context]:[]),...inherited.flatMap(d=>d.references)]),sources:unique([...evidence.documents.map(d=>d.source),...inherited.flatMap(d=>d.sources)]),documents:unique([...evidence.documents.map(d=>({source:d.source,contentDigest:canonicalHash(d)})),...inherited.flatMap(d=>d.documents??[])])};
   need(Buffer.byteLength(canonicalJson(dependencies))<=131072,'TOO_LARGE');
   need(this.options.visibleReferences(dependencies.references,dependencies.sources,dependencies.documents),'WITHDRAWN');
   const id=randomUUID(),deadline=new Date(Math.min(Date.parse(now)+grant.maxDurationMs,Date.parse(q.expiresAt),Date.parse(claim.leaseExpiresAt),Date.parse(grant.expiresAt))).toISOString();
   const reservation:AskReservation={id,grantId:grant.id,serviceId:q.serviceId,generation:config.scope.consumerGeneration,
    questionId:q.questionId,questionHash:q.questionHash,conversationId:q.conversationId,workerId:route.workerId,
    workerSessionId:randomUUID(),providerGeneration:1,contextDigest:canonicalHash(context),claimDigest:canonicalHash(claim),requestDigest:canonicalHash(q),
    reservedAt:now,deadline,questionExpiresAt:q.expiresAt};
   // External custody commits first. A failure in the following Company transaction never refunds it.
   this.options.authority.reserve(reservation,now);
   db.transaction(()=>{
    need(!this.company.paused&&!!this.eligible(route.workerId)&&db.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n<maxActive,'CONFLICT');
    db.run("INSERT INTO ask_dispatches VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'reserved',1)",id,q.serviceId,q.questionId,entry.workerId,route.workerId,grant.id,canonicalHash(reservation),canonicalHash(context),canonicalJson(route),canonicalJson(dependencies),config.scope.consumerGeneration,now,deadline,new Date(Date.parse(now)+Math.ceil(grant.maxDurationMs*10000/config.limits.dutyCycleBps)).toISOString());
    db.run("INSERT INTO executions(execution_id,worker_id,origin,status,started_at,execution_priority,provenance_status) VALUES(?,?,'public_question','running',?,'low','unresolved')",id,entry.workerId,now);
    db.run("UPDATE ask_dispatches SET state='running' WHERE execution_id=?",id);
    this.company.aiUsage.ensure(id,id,'public_question');this.company.refreshWorker(entry.workerId);
   });
   let candidate:AskPreparedTurn;
   const runtime:AskRuntimeInput={mode:'public_question',worker:{...this.company.worker(entry.workerId),workspace_path:entry.workspace,
     display_name:publicWorker.name,title:publicWorker.role,mission:'Answer this visitor using only the supplied public context.',
     capability_profile:[],delegatable_capabilities:[],ai_model:grant.model,execution_priority:'low'},
    execution:this.company.execution(id) as AskExecution,grant,reservation,context,tools:[submit],localDeadline:deadline,
    authorize:()=>this.authorize(id),
    admit:proof=>{this.authorize(id);this.options.authority.admit(id,proof,this.now());},
    beforeTransmit:proof=>{this.authorize(id);this.options.authority.beforeModelTransmit(id,proof,this.now());},
    configured:c=>{this.authorize(id);need(c.model===grant.model,'FORBIDDEN');db.run("UPDATE executions SET model=?,reasoning_effort=?,runtime_version=?,runtime_adapter=?,provenance_status='recorded' WHERE execution_id=?",c.model,c.reasoning_effort,c.runtime_version,c.runtime_adapter,id);},
    bind:session=>{this.authorize(id);validate('Id',session);need(!['executions','runtime_bindings','conversation_sessions','research_task_sessions','research_operations','mandate_task_sessions','computer_contexts'].some(table=>db.get(`SELECT 1 FROM ${table} WHERE runtime_reference=?`,session)),'CONFLICT');db.run('UPDATE executions SET runtime_reference=? WHERE execution_id=?',session,id);},
    usage:observation=>this.company.aiUsage.observe(id,observation),
    event:(type,_detail)=>{if(type==='runtime_turn_starting'){this.authorize(id);db.run('INSERT INTO execution_runtime_attempts VALUES(?,1)',id);}},
    callTool:(_callId,name,args)=>{
     this.authorize(id);need(name===submit.name&&args!==null&&typeof args==='object'&&!Array.isArray(args),'FORBIDDEN');
     const v=args as Record<string,unknown>;need(Object.keys(v).sort().join(',')==='evidence,interpretation,limitations,publicSources,text','INVALID_SCHEMA');
     const indices=(value:unknown,n:number)=>{need(Array.isArray(value)&&value.length<=20&&new Set(value).size===value.length&&value.every(i=>Number.isSafeInteger(i)&&i>=0&&i<n),'INVALID_SCHEMA');return value as number[];};
     const answer:AskAnswer={schemaVersion:'1.0',serviceId:q.serviceId,answerId:id,conversationId:q.conversationId,questionId:q.questionId,questionRevision:1,
      questionHash:q.questionHash,workerId:route.workerId,routingPolicyVersion:route.routingPolicyVersion,generatedAt:this.now(),text:v.text as string,
      evidence:indices(v.evidence,evidence.records.length).map(i=>evidence.records[i]!.reference),
      publicSources:indices(v.publicSources,evidence.documents.length).map(i=>evidence.documents[i]!.source),knowledgeAsOf:null,
      limitations:v.limitations as string[],interpretation:v.interpretation as AskAnswer['interpretation']};
     validate('AskAnswer',answer);need([...answer.text].length<=config.limits.answerCharacters,'TOO_LARGE');
     const current=this.active.get(id)!;if(current.answer)need(canonicalHash({...answer,generatedAt:current.answer.generatedAt})===canonicalHash(current.answer),'CONFLICT');
     else current.answer=answer;return {accepted:true};
    }};
   candidate={question,history:history.turns,evidence,route,context,runtime};this.active.set(id,{turn:candidate});return candidate;
  }
  return undefined;
 }
 private historyVisible(history:AskPreparedTurn['history']):boolean {
  return history.every(t=>{
   const row=this.company.store.get<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE service_id=? AND question_id=?',t.question.serviceId,t.question.questionId);
   if(!row||row.state!=='completed'||row.execution_id!==t.answer.answerId)return false;
   const supplied=JSON.parse(row.evidence_refs) as AskEvidenceDependencies;
   return this.options.visibleReferences([...supplied.references,...(t.question.input.context?[t.question.input.context]:[]),...t.answer.evidence],[...supplied.sources,...t.answer.publicSources],supplied.documents);
  });
 }
 private authorize(id:string):void {
  const row=this.row(id),entry=this.options.workers.find(w=>w.publicId===row.public_worker_id),active=this.active.get(id),now=this.now();
  const {config,grant}=this.config();
  need(!this.closed&&!this.company.paused&&row.state==='running'&&this.company.execution(id).status==='running'
   &&entry?.workerId===row.worker_id&&entry.eligibility.enabled&&this.company.worker(row.worker_id).enabled
   &&grant.id===row.grant_id&&config.scope.consumerGeneration===row.generation&&now<row.deadline&&active,'FORBIDDEN');
  const barrier=this.options.controls.barrier();need(barrier&&now<barrier.validUntil,'FORBIDDEN');
  this.options.content.question({sessionId:active.turn.question.sessionId,conversationId:active.turn.question.conversationId,questionId:row.question_id});
  const claim=this.claims.get(row.question_id);need(claim&&Date.parse(now)<Date.parse(claim.leaseExpiresAt),'EXPIRED');
  const fresh=this.options.content.history(row.question_id);
  need(canonicalHash(fresh.turns)===canonicalHash(active.turn.history),'WITHDRAWN');
  need(this.historyVisible(fresh.turns),'WITHDRAWN');
  need(this.options.visible(active.turn.evidence),'WITHDRAWN');
  const dependencies=JSON.parse(row.evidence_refs) as AskEvidenceDependencies;
  need(this.options.visibleReferences(dependencies.references,dependencies.sources,dependencies.documents),'WITHDRAWN');
  need(canonicalHash(active.turn.context)===row.context_digest,'CONFLICT');
 }
 async run(turn:AskPreparedTurn,adapter:AskRuntimeAdapter,signal:AbortSignal):Promise<void>{
  const id=turn.runtime.execution.execution_id;let result:AskRuntimeResult={status:'failed',settled:false};
  try{need(adapter.runAsk,'UNAVAILABLE');this.authorize(id);result=await adapter.runAsk(turn.runtime,signal);}
  catch{/* Errors may contain private input; retain only the trusted outcome below. */}
  this.finish(id,result);
 }
 private finish(id:string,result:AskRuntimeResult):void {
  const db=this.company.store,row=this.row(id),active=this.active.get(id)!;
  try{
   if(result.apiUsage){checkApiUsage(result.apiUsage);const observed=this.company.aiUsage.records({executionId:id})[0]!;
    need(observed.model===result.apiUsage.model&&observed.turn_id===result.apiUsage.responseId
     &&canonicalHash(observed.tokens)===canonicalHash(result.apiUsage.tokens),'CONFLICT');}
   this.company.aiUsage.finish(id,result.status,result.settled===true,id,result.providerTurnCompleted===true,!!result.apiUsage);
   const model=this.options.authority.inspect().models.find(m=>m.binding.id===id)!;
   const usage=this.company.aiUsage.records({executionId:id})[0]!;
   if(model.state==='reserved'||model.state==='admitted')this.options.authority.notSent(id,this.now());
   else if(model.state==='transmitted'&&(result.providerTurnCompleted===true||!!result.apiUsage)&&result.settled===true&&usage.completeness==='complete'&&usage.tokens&&model.proof){
    this.options.authority.settle(id,{providerSessionId:model.proof.providerSessionId,responseDigest:canonicalHash(active.answer??null),
     usageDigest:canonicalHash({tokens:usage.tokens,turn:usage.turn_id,...(result.apiUsage?{api:result.apiUsage}:{})}),inputTokens:usage.tokens.inputTokens,outputTokens:usage.tokens.outputTokens,chargeMicros:result.apiUsage?.chargeMicros??null,complete:true,...(result.apiUsage?{api:result.apiUsage}:{})},this.now());
   }else this.options.authority.unknown(id,this.now());
   const settled=this.options.authority.inspect().models.find(m=>m.binding.id===id)!;
   let state:AskDispatchRow['state']='failed';
   if(settled.state==='settled'&&settled.receipt&&result.status==='completed'&&active.answer){
    let authorized=false;
    try{this.authorize(id);authorized=true;}catch(error){
     state='suppressed';if(!(error instanceof ContractError)||!['FORBIDDEN','WITHDRAWN','EXPIRED'].includes(error.code)&&!(error.code==='UNAVAILABLE'&&this.ownerPaused)){this.hold('content_reconciliation',false);state='failed';}
    }
    if(authorized)try{this.options.content.commitAnswer(row.question_id,active.answer);state='completed';}catch{this.hold('content_reconciliation',false);state='failed';}
   }else if(settled.state!=='settled'&&settled.state!=='settled_over_limit')state='unknown';
   db.transaction(()=>{
    db.run('UPDATE ask_dispatches SET state=?,unresolved=? WHERE execution_id=?',state,Number(state==='unknown'),id);
    db.run("UPDATE executions SET status=?,finished_at=?,error=? WHERE execution_id=?",state==='completed'?'completed':'failed',this.now(),state==='completed'?null:'Public question held or unavailable',id);
    if(state!=='unknown')db.run('UPDATE execution_runtime_attempts SET unresolved=0 WHERE execution_id=?',id);
   });
  }catch{
   let known=false;try{known=['settled','settled_over_limit'].includes(this.options.authority.inspect().models.find(m=>m.binding.id===id)?.state??'');}catch{/* Independent custody remains uncertain. */}
   if(known)this.hold('content_reconciliation',false);
   db.transaction(()=>{db.run('UPDATE ask_dispatches SET state=?,unresolved=? WHERE execution_id=?',known?'failed':'unknown',Number(!known),id);db.run("UPDATE executions SET status='failed',finished_at=?,error='Public question reconciliation required' WHERE execution_id=?",this.now(),id);if(known)db.run('UPDATE execution_runtime_attempts SET unresolved=0 WHERE execution_id=?',id);});
  }finally{this.active.delete(id);this.claims.delete(row.question_id);this.company.refreshWorker(row.worker_id);this.company.changed();}
 }
 /** A service hold cannot pause unrelated investment/owner dispatch. */
 private hold(reason:'custody_mismatch'|'content_reconciliation',unresolved:boolean):void {
  const serviceId=this.options.current().scope.serviceId;
  this.company.store.run('INSERT INTO ask_service_holds VALUES(?,?,?,?,?) ON CONFLICT(service_id) DO UPDATE SET unresolved=max(unresolved,excluded.unresolved)',serviceId,reason,canonicalJson(this.options.workers.map(w=>w.workerId)),Number(unresolved),this.now());
  this.close();
 }
 recover():void {
  const db=this.company.store;
  try{
   const models=this.options.authority.inspect().models;
   const rows=db.all<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE service_id=?',this.options.current().scope.serviceId);
   const scoped=models.filter(m=>m.binding.serviceId===this.options.current().scope.serviceId);
   need(rows.length===scoped.length,'OUTCOME_UNKNOWN');
   for(const model of scoped){
    const row=rows.find(r=>r.execution_id===model.binding.id),entry=this.options.workers.find(w=>w.publicId===model.binding.workerId);
    need(row&&entry&&row.worker_id===entry.workerId&&row.reservation_digest===canonicalHash(model.binding)
     &&row.context_digest===model.binding.contextDigest&&row.public_worker_id===model.binding.workerId
     &&row.generation===model.binding.generation&&row.grant_id===model.binding.grantId,'OUTCOME_UNKNOWN');
    const execution=this.company.execution(row.execution_id);
    need(execution.origin==='public_question'&&execution.worker_id===row.worker_id
     &&(!model.proof||execution.runtime_reference===model.proof.providerSessionId),'OUTCOME_UNKNOWN');
   }
   let contentSound=true;try{this.options.content.reconcile();}catch{contentSound=false;this.hold('content_reconciliation',false);}
   for(const model of scoped){
    const row=rows.find(r=>r.execution_id===model.binding.id)!;
    if(['settled','settled_over_limit'].includes(model.state)){
     // Content expiry/deletion must never rewrite an already terminal execution outcome.
     if(this.company.execution(row.execution_id).status!=='running'){need(!row.unresolved&&!['reserved','running','unknown'].includes(row.state),'OUTCOME_UNKNOWN');continue;}
     // Provider certainty survives a crash before either private outbox or Company completion.
     const metadata=db.get<{state:string;answer_id:string;answer_digest:string}>('SELECT state,answer_id,answer_digest FROM ask_imports WHERE service_id=? AND question_id=?',row.service_id,row.question_id);
     const completed=model.state==='settled'&&contentSound&&metadata&&['answer_staged','delivered'].includes(metadata.state)
      &&metadata.answer_id===row.execution_id&&metadata.answer_digest===model.receipt?.responseDigest;
     const state=completed?'completed':'failed';
     this.company.aiUsage.finish(row.execution_id,state,true,row.execution_id,!!model.receipt);
     db.transaction(()=>{
      db.run('UPDATE ask_dispatches SET state=?,unresolved=0 WHERE execution_id=?',state,row.execution_id);
      db.run('UPDATE executions SET status=?,finished_at=coalesce(finished_at,?),error=? WHERE execution_id=?',state,this.now(),completed?null:'Public question settled; answer unavailable',row.execution_id);
      db.run('UPDATE execution_runtime_attempts SET unresolved=0 WHERE execution_id=?',row.execution_id);
     });
    }else{
     if(model.state!=='unknown')this.options.authority.unknown(model.binding.id,this.now());
     db.run("UPDATE ask_dispatches SET state='unknown',unresolved=1 WHERE execution_id=?",model.binding.id);
    }
   }
  }catch{this.hold('custody_mismatch',true);}
 }
 /** Delivery rechecks the completed execution and every retained public dependency. */
 assertDelivery(questionId:string):void {
  const {config,grant}=this.config('delivery'),row=this.company.store.get<AskDispatchRow>('SELECT * FROM ask_dispatches WHERE service_id=? AND question_id=?',config.scope.serviceId,questionId);
  need(!this.closed&&row&&row.state==='completed'&&!row.unresolved&&row.grant_id===grant.id&&row.generation===config.scope.consumerGeneration,'FORBIDDEN');
  const entry=this.options.workers.find(w=>w.publicId===row.public_worker_id);
  need(entry?.eligibility.enabled&&this.company.worker(row.worker_id).enabled&&grant.workerIds.includes(row.public_worker_id),'FORBIDDEN');
  need(this.options.controls.barrier(),'UNAVAILABLE');need(this.options.content.pendingAnswer(questionId),'OUTCOME_UNKNOWN');
  const dependencies=JSON.parse(row.evidence_refs) as AskEvidenceDependencies;
  need(this.options.visibleReferences(dependencies.references,dependencies.sources,dependencies.documents),'WITHDRAWN');
 }
 nextWake():string|null {
  const now=Date.parse(this.now()),times:number[]=[];
  if(this.claims.size||this.active.size||this.company.store.get("SELECT 1 FROM ask_imports WHERE service_id=? AND (retain_until>? OR state NOT IN ('suppressed','expired','held'))",this.options.current().scope.serviceId,this.now()))times.push(now+15000);
  for(const claim of this.claims.values())times.push(Date.parse(claim.leaseExpiresAt));
  const last=this.company.store.get<{duty_until:string}>("SELECT duty_until FROM ask_dispatches ORDER BY duty_until DESC LIMIT 1");
  if(last&&this.claims.size&&Date.parse(last.duty_until)>now)times.push(Date.parse(last.duty_until));
  return times.length?new Date(Math.max(now+1,Math.min(...times))).toISOString():null;
 }
 maintenance():void {
  try{
   this.options.content.maintenance();
   for(const [id,claim] of this.claims){
    let suppressed=this.closed||Date.parse(this.now())>=Date.parse(claim.leaseExpiresAt);
    const row=this.options.content.metadata(id);suppressed ||= ['suppressed','expired','held','delivered'].includes(row.state);
    if(suppressed){this.claims.delete(id);for(const [executionId,value] of this.active)if(value.turn.question.questionId===id)this.company.emit('ask_interrupt',executionId);}
   }
   for(const id of this.active.keys())try{this.authorize(id);}catch{this.company.emit('ask_interrupt',id);}
  }catch{this.hold('content_reconciliation',false);}
 }
 close():void{this.closed=true;this.claims.clear();for(const id of this.active.keys())this.company.emit('ask_interrupt',id);}
}
