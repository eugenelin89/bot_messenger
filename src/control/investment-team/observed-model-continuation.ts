import {randomUUID} from 'node:crypto';
import type {Company} from '../company.js';
import type {Occurrence} from '../../domain/investment-loop/types.js';
import type {ModelContinuation} from '../../domain/investment-loop/model-continuation.js';
import {requireThat,strictObject,textField} from '../../domain/model.js';
import {canonical,hash,time} from '../../domain/investment/identity.js';
import {FixtureSimulator} from '../investment.js';
import {assertRenewalQuiescent} from './observed-renewal.js';
import {occurrenceIdentity,continuationOccurrences} from './observed-source-continuation.js';

export function localModelContinuation(c:Company,scopeId:string){
 const row=c.store.get<{input:string;digest:string}>('SELECT input,digest FROM observed_model_continuations WHERE scope_id=?',scopeId);
 if(!row)return undefined;const p=JSON.parse(row.input) as ModelContinuation;requireThat(hash(p)===row.digest&&p.scopeId===scopeId,'Model continuation custody changed');return p;
}
function retained(c:Company,p:Pick<ModelContinuation,'scopeId'|'executionIds'|'replacement'>){
 const scope=c.investmentTeam.scope(p.scopeId),at=p.replacement.created_at;
 return {executions:p.executionIds.map(id=>({execution:c.execution(id),request:c.execution(id).request_id?c.store.get('SELECT * FROM conversation_requests WHERE request_id=?',c.execution(id).request_id!):null,turn:(()=>{const row=c.store.get<Record<string,unknown>>('SELECT * FROM discussion_turns WHERE request_id=?',c.execution(id).request_id!);if(!row)return null;const {advanced,...retained}=row;return retained;})(),usage:c.store.get('SELECT * FROM ai_usage WHERE execution_id=?',id),attempt:c.store.get('SELECT * FROM execution_runtime_attempts WHERE execution_id=?',id),activity:c.store.get('SELECT * FROM investment_activity_invocations WHERE execution_id=?',id),receipts:c.store.all('SELECT * FROM tool_receipts WHERE execution_id=? ORDER BY call_id',id),rejections:c.store.all("SELECT * FROM audit_events WHERE execution_id=? AND type='conversation_tool_rejected' ORDER BY event_id",id),proposals:c.store.all('SELECT * FROM investment_team_proposals WHERE execution_id=? ORDER BY proposal_id',id),reviews:c.store.all('SELECT * FROM investment_team_reviews WHERE execution_id=? ORDER BY review_id',id),publicReviews:c.store.all('SELECT p.* FROM observed_public_reviews p JOIN investment_team_reviews r USING(review_id) WHERE r.execution_id=? ORDER BY p.review_id',id)})),
  collection:c.store.all('SELECT * FROM observed_collection_results WHERE scope_id=? AND created_at<=? ORDER BY reservation_id',p.scopeId,at),
  evidence:c.store.all('SELECT * FROM group_evidence WHERE group_id=? AND created_at<=? ORDER BY evidence_id',scope.group_id,at)};
}
export function modelContinuationOccurrences(c:Company,p:ModelContinuation,base:Occurrence[]){
 requireThat(hash(base.map(occurrenceIdentity))===p.baseOccurrencesHash,'Retained model schedule changed');
 const r=c.store.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',p.replacement.occurrence_id);
 requireThat(r&&r.loop_id===p.loopId&&canonical(occurrenceIdentity(r))===canonical(occurrenceIdentity(p.replacement))&&r.plan_digest===c.investmentLoop.get(p.loopId).digest,'Model continuation occurrence changed');
 return [...base.filter(o=>o.occurrence_id!==p.replacedId),r].sort((a,b)=>a.due_at.localeCompare(b.due_at)||a.stage.localeCompare(b.stage));
}
export function assertModelContinuationRetained(c:Company,p:ModelContinuation){
 requireThat(hash(retained(c,p))===p.retainedHash,'Retained model failure, receipts or research changed');
 const x=c.execution(p.failed.executionId),u=c.store.get<{settled:number;completeness:string}>('SELECT * FROM ai_usage WHERE execution_id=?',x.execution_id);
 requireThat(x.status==='failed'&&x.error==='Runtime tool callback rejected: Invalid bounded identifier list'&&u?.settled===1&&u.completeness==='incomplete'&&c.store.get<{unresolved:number}>('SELECT unresolved FROM execution_runtime_attempts WHERE execution_id=?',x.execution_id)?.unresolved===0,'Only the exact settled input-validation failure may continue');
 requireThat(c.store.get("SELECT 1 FROM audit_events WHERE execution_id=? AND type='conversation_tool_rejected' AND json_extract(detail,'$.reason')='Invalid bounded identifier list'",x.execution_id),'Trusted input-validation rejection required');
 const source=c.finiteHQ.sourceContinuation(p.scopeId);requireThat(source&&hash(source)===p.sourceDigest,'Approved retained source continuation required');
 modelContinuationOccurrences(c,p,continuationOccurrences(c,source));
}
export function assertModelContinuationPrepared(c:Company,p:ModelContinuation){
 assertModelContinuationRetained(c,p);assertRenewalQuiescent(c);
 const l=c.investmentLoop.get(p.loopId),s=c.investmentTeam.scope(p.scopeId),g=c.discussions.group(s.group_id),book=c.observedInvestment.history(s.run_id).ledger;
 requireThat(l.state==='blocked'&&l.generation+1===p.generation&&s.state==='active'&&hash(g)===p.groupHash&&hash(c.store.all('SELECT * FROM discussion_turns WHERE group_id=? ORDER BY turn_id',g.group_id))===p.turnsHash&&book.hash===p.portfolioHead&&book.lifecycle==='paused'&&!Object.values(book.orders).some(o=>o.status==='pending'),'Untouched held model continuation required');
 requireThat(c.store.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',p.replacedId)?.state==='blocked','Original failed research changed');
 const next=c.store.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',p.replacement.occurrence_id);
 requireThat(next?.state==='pending'&&next.attempts===0&&next.due_at>c.observedInvestment.now(),'Model continuation start elapsed or already used');
 requireThat(c.store.get<{n:number}>('SELECT count(*) n FROM investment_team_executions WHERE scope_id=?',p.scopeId)!.n===p.executionIds.length&&!c.store.get('SELECT 1 FROM investment_team_submissions WHERE scope_id=?',p.scopeId),'Model work changed after preparation');
}
export function prepareModelContinuation(c:Company,value:unknown){c.conversations.human();return c.store.transaction(()=>{
 const a=strictObject(value,['scopeId','executionId','researchAt','ownerReceiptHash','receiptId']),scopeId=textField(a,'scopeId',100),receiptId=textField(a,'receiptId',100),requestHash=hash(a),old=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);
 if(old){requireThat(old.request_hash===requestHash,'Model preparation receipt conflict');return JSON.parse(old.result) as {scopeId:string;digest:string;input:ModelContinuation};}
 requireThat(!localModelContinuation(c,scopeId),'Model continuation already prepared');assertRenewalQuiescent(c);
 const source=c.finiteHQ.sourceContinuation(scopeId),l=c.investmentLoop.forScope(scopeId),s=c.investmentTeam.scope(scopeId),g=c.discussions.group(s.group_id),at=c.observedInvestment.now(),researchAt=textField(a,'researchAt',40),ownerReceiptHash=textField(a,'ownerReceiptHash',64),executionId=textField(a,'executionId',100);
 requireThat(source&&l?.state==='blocked'&&g.state==='paused'&&/^[a-f0-9]{64}$/.test(ownerReceiptHash),'Held observed source continuation and owner receipt required');
 const current=c.finiteHQ.modelContinuationPreview(scopeId,executionId),base=continuationOccurrences(c,source),failed=base.find(o=>o.stage==='research'&&o.state==='blocked'),cutoff=base.find(o=>o.stage==='cutoff'&&o.session===source.session);
 requireThat(failed&&cutoff&&base.some(o=>o.stage==='collect_research'&&o.session===source.session&&o.state==='complete')&&!c.store.get("SELECT 1 FROM group_syntheses WHERE group_id=? AND state='final'",g.group_id),'Completed collection and unfinished failed research required');
 requireThat(time(researchAt)>time(at)&&time(researchAt)<=time(at)+7200000&&time(researchAt)+3600000<time(cutoff.due_at),'Future one-hour research window before unchanged cutoff required');
 const replacement:Occurrence={...failed,occurrence_id:'model_continuation_'+randomUUID(),plan_revision:Math.max(...base.map(o=>o.plan_revision))+1,due_at:researchAt,expires_at:new Date(time(researchAt)+3600000).toISOString(),state:'pending',generation:l.generation+1,attempts:0,retry_at:null,reason:null,result:null,created_at:at,updated_at:at};
 const executionIds=c.store.all<{execution_id:string}>('SELECT execution_id FROM investment_team_executions WHERE scope_id=? ORDER BY execution_id',scopeId).map(x=>x.execution_id),turns=c.store.all<{turn_id:string;advanced:number}>('SELECT * FROM discussion_turns WHERE group_id=? ORDER BY turn_id',g.group_id);
 const p:ModelContinuation={authorityId:current.envelope.authorityId,scopeId,loopId:l.loop_id,session:source.session,sourceDigest:hash(source),envelopeHash:hash(current.envelope),checkpointDigest:current.checkpointDigest,controlRevision:current.controlRevision,portfolioHead:c.observedInvestment.history(s.run_id).ledger.hash!,ownerReceiptHash,baseOccurrencesHash:hash(base.map(occurrenceIdentity)),generation:replacement.generation,replacedId:failed.occurrence_id,replacement,additional:8,failed:{executionId,reservationHash:current.reservationHash},executionIds,retainedHash:hash(retained(c,{scopeId,executionIds,replacement})),groupHash:hash(g),turnsHash:hash(turns),supersededTurns:turns.map(t=>({turnId:t.turn_id,advanced:t.advanced}))};
 c.store.run('INSERT INTO observed_model_continuations VALUES(?,?,?,?,?,?)',scopeId,l.loop_id,p.authorityId,hash(p),canonical(p),at);
 const o=replacement;c.store.run('INSERT INTO investment_loop_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',o.occurrence_id,o.loop_id,o.plan_digest,o.plan_revision,o.session,o.stage,o.due_at,o.expires_at,o.state,o.generation,o.attempts,o.retry_at,o.reason,o.result,o.created_at,o.updated_at);
 assertModelContinuationPrepared(c,p);const result={scopeId,digest:hash(p),input:p};c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(result),at);c.changed();return result;
});}
export function activateModelContinuation(c:Company,scopeId:string,receiptId:string){c.conversations.human();return c.store.transaction(()=>{
 const requestHash=hash({scopeId,action:'activate_model_continuation'}),old=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);if(old){requireThat(old.request_hash===requestHash,'Model activation receipt conflict');return JSON.parse(old.result);}
 const p=c.finiteHQ.modelContinuation(scopeId);requireThat(p,'Independently approved model continuation required');assertModelContinuationPrepared(c,p);c.finiteHQ.assert(scopeId);requireThat(c.investmentTeam.runtimeAvailable(scopeId),'Current finite runtime selector required');
 const saved=c.observedInvestment.scopeConfiguration(scopeId),book=new FixtureSimulator(c.store,{now:()=>c.observedInvestment.now()},saved.configuration.authorization.fixtureOperator),result=book.execute(saved.configuration.runId,{type:'control',state:'active'},'model_continue_'+receiptId);requireThat(result.outcome.status==='active','Model continuation activation rejected');
 c.store.run("UPDATE investment_loops SET state='active',generation=?,reason=NULL,updated_at=? WHERE loop_id=?",p.generation,c.observedInvestment.now(),p.loopId);c.investmentLoop.fault?.('model_continuation_activation');
 const answer={loop:c.investmentLoop.get(p.loopId),notice:'Original failed attempt retained; eight additional attempts authorized without refund; fresh successful proposal and review required'};c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(answer),c.observedInvestment.now());c.changed();return answer;
});}
