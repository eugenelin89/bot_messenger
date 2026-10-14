/** Owner-selected recovery of one completed turn's missing usage. Never repairs that receipt. */
import {randomUUID} from 'node:crypto';
import type {Company} from '../company.js';
import {requireThat,strictObject,textField} from '../../domain/model.js';
import {canonical,hash,time} from '../../domain/investment/identity.js';
import {FixtureSimulator} from '../investment.js';
import type {Saved} from './observed-investment.js';
import type {TelemetryRecovery} from '../usage/finite-journal.js';
import type {LateCloseAmendment} from '../../domain/investment/types.js';
export interface RetainedText {id:string;kind:string;workerId:string|null;executionId:string|null;createdAt:string;content:string;contentHash:string}
export interface ObservedRecovery extends TelemetryRecovery {
 oldScopeId:string;oldGroupId:string;researchAt:string;amendment:Omit<LateCloseAmendment,'recordedAt'>;exports:RetainedText[];
}
export function recoveryExport(x:RetainedText,oldGroupId:string){
 const historicalSource={id:x.id,groupId:oldGroupId,kind:x.kind,workerId:x.workerId,executionId:x.executionId,createdAt:x.createdAt,contentHash:x.contentHash};
 if(x.kind==='retained_gateway'){const packet=JSON.parse(x.content);requireThat(canonical(packet)===x.content,'Retained gateway must preserve exact canonical bytes');return {historicalSource,contentEncoding:'canonical_json',content:packet};}
 return {historicalSource,content:x.content};
}
const iso=(n:number)=>new Date(n).toISOString();
function sim(c:Company,runId:string){return new FixtureSimulator(c.store,{now:()=>c.observedInvestment.now()},c.observedInvestment.configuration(runId).configuration.authorization.fixtureOperator);}
function retained(c:Company,scopeId:string,session:string):RetainedText[]{
 const s=c.investmentTeam.scope(scopeId),db=c.store;
 const e=db.get<{evidence_id:string;content:string;sha256:string;created_at:string}>('SELECT evidence_id,content,sha256,created_at FROM group_evidence WHERE group_id=? AND title=?',s.group_id,'Gateway evidence for '+session);
 requireThat(e&&hash(e.content)===e.sha256,'Exact retained gateway packet required');
 const parsed=JSON.parse(e.content);requireThat(parsed.session===session&&Array.isArray(parsed.evidence),'Retained session packet required');
 for(const item of parsed.evidence){const original=db.get<{content:string;content_hash:string;retrieved_at:string}>('SELECT content,content_hash,retrieved_at FROM observed_financial_evidence WHERE run_id=? AND evidence_id=?',s.run_id,item.id);requireThat(original&&hash(original.content)===original.content_hash&&original.content_hash===item.hash&&original.retrieved_at===item.retrievedAt,'Retained source record changed');}
 const rows=db.all<{message_id:string;worker_id:string;execution_id:string;created_at:string;body:string;kind:string}>('SELECT m.message_id,m.worker_id,m.execution_id,m.created_at,m.body,d.kind FROM conversation_messages m JOIN discussion_contributions d USING(message_id) WHERE d.group_id=? AND m.execution_id IS NOT NULL ORDER BY d.revision',s.group_id);
 requireThat(rows.length===4,'Exact four original contributions required');
 for(const r of rows){const x=c.execution(r.execution_id);requireThat(x.status==='completed'&&x.worker_id===r.worker_id&&!db.get('SELECT 1 FROM execution_runtime_attempts WHERE execution_id=? AND unresolved=1',r.execution_id),'Original provider execution is not settled');}
 return [{id:e.evidence_id,kind:'retained_gateway',workerId:null,executionId:null,createdAt:e.created_at,content:e.content,contentHash:e.sha256},...rows.map(r=>({id:r.message_id,kind:r.kind,workerId:r.worker_id,executionId:r.execution_id,createdAt:r.created_at,content:r.body,contentHash:hash(r.body)}))];
}
export function assertRecoveryRetained(c:Company,r:ObservedRecovery){
 requireThat(hash(c.store.get('SELECT * FROM ai_usage WHERE execution_id=?',r.executionId))===r.localUsageHash,'Historical usage gap changed');
 const actual=retained(c,r.oldScopeId,r.amendment.session);requireThat(hash(actual)===r.retainedEvidenceHash&&canonical(actual)===canonical(r.exports),'Retained research or employee contributions changed');
}
export function previewObservedRecovery(c:Company,input:unknown){
 c.conversations.human();const a=strictObject(input,['scopeId','executionId','researchAt','ownerReceiptHash']),scopeId=textField(a,'scopeId',100),executionId=textField(a,'executionId',100),researchAt=textField(a,'researchAt',40),ownerReceiptHash=textField(a,'ownerReceiptHash',64),at=c.observedInvestment.now(),s=c.investmentTeam.scope(scopeId),old=c.observedInvestment.scopeConfiguration(scopeId),l=c.investmentLoop.forScope(scopeId),state=sim(c,s.run_id).inspect(s.run_id);
 requireThat(l&&l.state==='blocked'&&!old.recovery&&s.state==='active'&&state.lifecycle==='paused'&&state.version==='3'&&!Object.keys(state.decisions).length&&!Object.keys(state.orders).length,'Untouched blocked initial book required');
 const session=old.input.sessions[0]!,day=old.configuration.calendar.sessions.find(d=>d.date===session)!,cutoffAt=iso(time(day.close)-old.configuration.cutoffMinutes*60000),expiresAt=iso(time(day.open)+old.configuration.maxOpeningWaitSeconds*1000);
 requireThat(session==='2026-10-14'&&time(at)>time(day.open)&&time(researchAt)>time(at)&&time(researchAt)<=time(at)+2*3600000&&time(researchAt)<time(cutoffAt)&&/^[a-f0-9]{64}$/.test(ownerReceiptHash),'New future research window before closing cutoff required');
 const external=c.finiteHQ.telemetryRecoveryPreview(scopeId,executionId),exports=retained(c,scopeId,session),usage=c.store.get<{settled:number;completeness:string;status:string}>('SELECT * FROM ai_usage WHERE execution_id=?',executionId);
 requireThat(usage?.settled===1&&usage.completeness==='incomplete'&&usage.status==='completed','Exact locally settled missing usage required');
 const recovery:ObservedRecovery={oldAuthorityId:external.oldAuthorityId,executionId,reservationHash:external.reservationHash,checkpointDigest:external.checkpointDigest,localUsageHash:hash(usage),retainedEvidenceHash:hash(exports),portfolioHead:state.hash!,maxAdditional:7,oldScopeId:scopeId,oldGroupId:s.group_id,researchAt,amendment:{id:'late_close_'+randomUUID(),session,cutoffAt,expiresAt,ownerReceiptHash},exports};
 const consumed=new Set((c.finiteHQ.inspect(scopeId) as {collections:{requestHash:string}[]}).collections.map(r=>r.requestHash));
 const saved:Saved={...old,recovery,input:{...old.input,runId:s.run_id,policy:{...old.input.policy,authorityId:'observed_recovery_'+randomUUID(),maxRun:old.input.policy.maxRun}},source:{...old.source,requests:old.source.requests.filter(r=>!consumed.has(hash(r)))}};
 requireThat(saved.source.requests.length>0&&saved.source.requests.every(r=>!old.source.instruments.some(i=>hash(r)===hash(c.observedInvestment.request(i.id,session,false)))),'Spent research requests cannot transfer');
 const previewId=randomUUID(),digest=hash(saved),expires=iso(Math.min(time(at)+600000,time(researchAt)));c.store.run('INSERT INTO observed_investment_previews VALUES(?,?,?,?,?)',previewId,digest,canonical(saved),at,expires);
 return {previewId,digest,saved,expiresAt:expires,notice:'New decision and prospective close only; historical telemetry gap and spent allowances retained. No runtime authority yet.'};
}
export function consentObservedRecovery(c:Company,input:unknown){
 c.conversations.human();const a=strictObject(input,['previewId','digest','receiptId']),previewId=textField(a,'previewId',100),receiptId=textField(a,'receiptId',100),requestHash=hash(a),db=c.store,at=c.observedInvestment.now();
 return db.transaction(()=>{
  const prior=db.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);if(prior){requireThat(prior.request_hash===requestHash,'Recovery receipt conflict');return JSON.parse(prior.result);}
  const row=db.get<{input:string;digest:string;expires_at:string}>('SELECT * FROM observed_investment_previews WHERE preview_id=?',previewId);requireThat(row&&row.digest===a.digest&&hash(JSON.parse(row.input))===row.digest&&at<row.expires_at,'Recovery preview stale or changed');const saved=JSON.parse(row.input) as Saved,r=saved.recovery;requireThat(r,'Recovery preview required');const p=saved.input,old=c.investmentTeam.scope(r.oldScopeId),l=c.investmentLoop.forScope(r.oldScopeId),book=sim(c,old.run_id);
  assertRecoveryRetained(c,r);const current=c.finiteHQ.telemetryRecoveryPreview(r.oldScopeId,r.executionId);requireThat(current.checkpointDigest===r.checkpointDigest&&current.reservationHash===r.reservationHash&&book.inspect(old.run_id).hash===r.portfolioHead&&l?.state==='blocked'&&old.state==='active','Recovery head, custody or scope changed');
  // Local draft preparation grants no runtime capability. External approval later atomically
  // retires the old authority. A pre-approval restart changes custody and leaves this
  // exact draft held; only an explicit verified inactive-draft revision may renew its window.
  c.investmentLoop.retireForTelemetryRecovery(r.oldScopeId,r.checkpointDigest);
  db.run("UPDATE investment_team_scopes SET state='revoked' WHERE scope_id=?",r.oldScopeId);
  const adopted=book.execute(old.run_id,{type:'late_close_adopt',amendment:r.amendment,expectedHead:r.portfolioHead},'late_close_adopt_'+receiptId);requireThat(adopted.outcome.status==='accepted','Late close amendment rejected');
  const g=c.discussions.create({topic:p.mandate.slice(0,300),desired_output:p.desiredOutput,constraints:p.constraints+'\nOwner-requested new decision using retained research. Today uses a prospective regular CLOSE, with proposal, independent review and order before '+r.amendment.cutoffAt+'. No backdated opening. Original missing usage and four attempts retained. HOLD is valid. No fresh research collection.',participant_ids:p.participants.map(x=>x.workerId),facilitator_id:p.facilitatorId,synthesizer_id:p.synthesizerId,organize_with_atlas:false,allow_incomplete:true,allow_research:false,receipt_key:'observed_recovery_'+previewId});
  const share=(title:string,content:string,key:string)=>c.discussions.share({group_id:g.group_id,kind:'owner_material',title,content,source_id:null,document_path:null,receipt_key:key,audience_confirmed:true,audience_scope_version:g.scope_version,audience_worker_ids:p.participants.map(x=>x.workerId)});
  share('Prospective close recovery mandate',canonical({method:'inv-real-close-recovery-v1',amendment:r.amendment,originalFourAttemptsRetained:true,usageGap:{executionId:r.executionId,complete:false,cost:'unavailable'},maxAdditional:7,maxAdditionalToday:4,notice:'Read all exported evidence before deciding. Begin from the earlier discussion, but author a new decision now. Use paper_propose, request independent peer review of the exact proposal, then paper_submit if approved. Rejection or HOLD is valid. Never treat historical contributions as newly generated.'}),'recovery_mandate_'+previewId);
  for(const x of r.exports){const content=canonical(recoveryExport(x,r.oldGroupId));requireThat(content.length<=6000,'Retained export exceeds bounded evidence');share('Retained '+x.kind+' '+x.id,content,'recovery_export_'+hash([previewId,x.id]));}
  const zero={inputTokens:0,outputTokens:0,maxCostMicros:0},scope=c.investmentTeam.preview({executionPolicy:p.policy,aiProfile:p.aiProfile,runId:old.run_id,groupId:g.group_id,audience:'private_paper',participants:p.participants,proposers:p.proposers,reviewers:p.reviewers,submitters:p.submitters,expiresAt:saved.expiresAt,maxExecutions:p.policy.maxRun,maxResearch:0,maxProposals:p.maxProposals,maxOrders:p.maxOrders,turnLimits:zero,publicationChannelId:''});
  db.run('INSERT INTO observed_investment_scopes VALUES(?,?,?,?,?,?)',scope.scopeId,old.run_id,previewId,canonical(saved),hash(saved),at);c.investmentTeam.consent({scopeId:scope.scopeId,digest:scope.digest});
  const loop=c.investmentLoop.preview({scopeId:scope.scopeId,sessions:p.sessions,researchMinutes:p.researchMinutes,maxCycleExecutions:p.policy.maxCycle,maxDailyExecutions:p.policy.maxDay,maxRunExecutions:p.policy.maxRun,dailyLimits:zero,runLimits:zero,maxStageAttempts:3,retrySeconds:60});
  const result={runId:old.run_id,scope,loop,recovery:r,runtimeAuthority:'unapproved',preparedHead:book.inspect(old.run_id).hash};db.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(result),at);c.changed();return result;
 });
}
/** Immutable original records plus an explicit append-only chain of inactive draft revisions. */
function preparationChain(c:Company,scopeId:string){
 const base=c.store.get<{result:string}>("SELECT result FROM observed_investment_receipts WHERE json_extract(result,'$.scope.scopeId')=? ORDER BY rowid LIMIT 1",scopeId);
 requireThat(base,'Exact prepared recovery receipt required');let prepared=JSON.parse(base.result);
 const row=c.store.get<{input:string;digest:string}>('SELECT input,digest FROM observed_investment_scopes WHERE scope_id=?',scopeId);requireThat(row&&hash(JSON.parse(row.input))===row.digest,'Original recovery configuration changed');let saved=JSON.parse(row.input) as Saved;
 for(const entry of c.store.all<{result:string}>("SELECT result FROM observed_investment_receipts WHERE json_extract(result,'$.kind')='observed_recovery_draft_revision_v1' AND json_extract(result,'$.scopeId')=? ORDER BY rowid",scopeId)){
  const revision=JSON.parse(entry.result),{digest,...body}=revision;
  requireThat(hash(body)===digest&&revision.priorPreparationDigest===hash(prepared)&&revision.priorSavedDigest===hash(saved),'Recovery preparation revision chain changed');
  const next=revision.saved as Saved;requireThat(next.recovery&&saved.recovery&&canonical({...next,recovery:{...next.recovery,researchAt:saved.recovery.researchAt,checkpointDigest:saved.recovery.checkpointDigest}})===canonical(saved),'Recovery revision changed retained scope');
  requireThat(revision.prepared.scope.scopeId===scopeId&&revision.prepared.preparedHead===prepared.preparedHead&&revision.prepared.loop.loopId===prepared.loop.loopId,'Recovery revision changed identity');
  prepared=revision.prepared;saved=next;
 }
 return {prepared,saved};
}
export function effectiveRecoverySaved(c:Company,scopeId:string,saved:Saved){return saved.recovery&&c.store.get("SELECT 1 FROM observed_investment_receipts WHERE json_extract(result,'$.kind')='observed_recovery_draft_revision_v1' AND json_extract(result,'$.scopeId')=?",scopeId)?preparationChain(c,scopeId).saved:saved;}
export function assertPreparedRecovery(c:Company,scopeId:string){const {prepared}=preparationChain(c,scopeId),state=sim(c,prepared.runId).inspect(prepared.runId);requireThat(state.hash===prepared.preparedHead&&c.investmentLoop.forScope(scopeId)?.state==='draft','Prepared recovery portfolio head changed');return prepared;}
export function reviseObservedRecovery(c:Company,input:unknown){
 c.conversations.human();const a=strictObject(input,['scopeId','preparedHead','preparationDigest','researchAt','ownerReceiptHash','receiptId']),scopeId=textField(a,'scopeId',100),receiptId=textField(a,'receiptId',100),requestHash=hash(a),at=c.observedInvestment.now(),researchAt=textField(a,'researchAt',40);
 return c.store.transaction(()=>{
  const duplicate=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);if(duplicate){requireThat(duplicate.request_hash===requestHash,'Recovery draft revision receipt conflict');return JSON.parse(duplicate.result).prepared;}
  const prepared=assertPreparedRecovery(c,scopeId),{saved}=preparationChain(c,scopeId),r=saved.recovery!,scope=c.investmentTeam.scope(scopeId),g=c.discussions.group(scope.group_id),book=sim(c,scope.run_id).inspect(scope.run_id);
  requireThat(a.preparedHead===prepared.preparedHead&&a.preparationDigest===hash(prepared),'Exact current recovery preparation required');
  requireThat(a.ownerReceiptHash===r.amendment.ownerReceiptHash&&time(researchAt)>time(at)&&time(researchAt)<=time(at)+2*3600000&&time(researchAt)<time(r.amendment.cutoffAt),'Exact owner scope and future research before cutoff required');
  requireThat(scope.state==='active'&&g.state==='draft'&&g.turns_used===0&&book.lifecycle==='paused'&&book.lateClose?.id===r.amendment.id&&!Object.keys(book.decisions).length&&!Object.keys(book.orders).length&&!c.finiteHQ.approved(scopeId),'Only an inactive unapproved recovery draft can be revised');
  for(const table of ['conversation_requests','conversation_sessions'])requireThat(!c.store.get('SELECT 1 FROM '+table+' WHERE conversation_id=?',g.conversation_id),'Recovery draft already has provider work');
  for(const table of ['investment_team_executions','investment_team_proposals','observed_collection_results'])requireThat(!c.store.get('SELECT 1 FROM '+table+' WHERE scope_id=?',scopeId),'Recovery draft already used');
  requireThat(!c.store.get("SELECT 1 FROM executions WHERE status='running'")&&!c.store.get('SELECT 1 FROM execution_runtime_attempts WHERE unresolved=1')&&!c.store.all<{worker_id:string}>('SELECT worker_id FROM workers').some(w=>c.providerUnresolved(w.worker_id)),'Provider work is active or unresolved');
  assertRecoveryRetained(c,r);const custody=c.finiteHQ.recoveryDraftCheckpoint(r.oldScopeId,r.executionId,r.checkpointDigest);requireThat(custody.reservationHash===r.reservationHash&&custody.oldAttempts===4,'Retained consumption changed');
  const plan=c.investmentLoop.reviseRecoveryDraft(scopeId,researchAt),next:Saved={...saved,recovery:{...r,researchAt,checkpointDigest:custody.checkpointDigest}},updated={...prepared,recovery:next.recovery,loop:{...prepared.loop,plan:prepared.loop.plan.map((p:{session:string;research:string;collect_research:string})=>p.session===r.amendment.session?{...p,research:researchAt,collect_research:iso(time(researchAt)-15*60000)}:p)}};
  const body={kind:'observed_recovery_draft_revision_v1',scopeId,priorPreparationDigest:hash(prepared),priorSavedDigest:hash(saved),saved:next,prepared:updated,custody,plan,at};
  c.investmentLoop.fault?.('recovery_draft_revision_before_commit');
  c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical({...body,digest:hash(body)}),at);c.changed();return updated;
 });
}
export function activateObservedRecovery(c:Company,scopeId:string,receiptId:string){c.conversations.human();return c.store.transaction(()=>{
 const saved=c.observedInvestment.scopeConfiguration(scopeId),r=saved.recovery,l=c.investmentLoop.forScope(scopeId);requireThat(r&&l&&l.state==='draft','Exact prepared recovery required');requireThat(c.investmentTeam.runtimeAvailable(scopeId),'Recovery runtime selector unavailable');assertPreparedRecovery(c,scopeId);assertRecoveryRetained(c,r);c.finiteHQ.assert(scopeId);requireThat(c.observedInvestment.now()<r.researchAt,'Recovery research window already elapsed');
 const book=sim(c,saved.configuration.runId),state=book.inspect(saved.configuration.runId);requireThat(state.lateClose?.id===r.amendment.id&&state.lifecycle==='paused'&&!Object.keys(state.decisions).length&&!Object.keys(state.orders).length,'Recovery book changed');const result=book.execute(saved.configuration.runId,{type:'control',state:'active'},'recovery_activate_'+receiptId);requireThat(result.outcome.status==='active','Recovery activation rejected');return c.investmentLoop.startPreparedRecovery(l.loop_id,l.digest,receiptId);
 });}
