import {randomUUID} from 'node:crypto';
import type {Company} from '../company.js';
import type {Occurrence} from '../../domain/investment-loop/types.js';
import type {SourceContinuation} from '../../domain/investment-loop/source-continuation.js';
import {requireThat,strictObject,textField} from '../../domain/model.js';
import {canonical,hash,time} from '../../domain/investment/identity.js';
import {FixtureSimulator} from '../investment.js';
import {assertRenewalQuiescent} from './observed-renewal.js';

export const occurrenceIdentity=(o:Occurrence)=>({id:o.occurrence_id,revision:o.plan_revision,session:o.session,stage:o.stage,due:o.due_at,expires:o.expires_at});
const ordered=(rows:Occurrence[])=>[...rows].sort((a,b)=>a.due_at.localeCompare(b.due_at)||a.stage.localeCompare(b.stage));
export function localSourceContinuation(c:Company,scopeId:string){
 const row=c.store.get<{input:string;digest:string}>('SELECT input,digest FROM observed_source_continuations WHERE scope_id=?',scopeId);
 if(!row)return undefined;const p=JSON.parse(row.input) as SourceContinuation;requireThat(hash(p)===row.digest&&p.scopeId===scopeId,'Source continuation custody changed');return p;
}
export function continuationOccurrences(c:Company,p:SourceContinuation){
 const l=c.investmentLoop.get(p.loopId),base=c.investmentLoop.baseOccurrences(l);
 requireThat(hash(base.map(occurrenceIdentity))===p.baseOccurrencesHash,'Original source schedule changed');
 const additions=p.replacements.map(expected=>{
  const row=c.store.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',expected.occurrence_id);
  requireThat(row&&canonical(occurrenceIdentity(row))===canonical(occurrenceIdentity(expected))&&row.loop_id===p.loopId&&row.plan_digest===l.digest,'Source continuation occurrence changed');return row;
 });
 const rows=ordered([...base.filter(o=>!p.replacedIds.includes(o.occurrence_id)),...additions]);
 requireThat(rows.length===base.length&&hash(rows.map(occurrenceIdentity))===p.effectiveOccurrencesHash,'Effective source schedule changed');return rows;
}
export function assertSourceContinuationRetained(c:Company,p:SourceContinuation){
 const saved=c.observedInvestment.scopeConfiguration(p.scopeId),l=c.investmentLoop.forScope(p.scopeId);
 requireThat(saved.renewal&&l?.loop_id===p.loopId&&saved.renewal.session===p.session,'Source continuation scope changed');
 const failed=c.store.get<{result:string;request_hash:string}>('SELECT * FROM observed_collection_results WHERE reservation_id=? AND scope_id=?',p.failed.reservationId,p.scopeId);
 requireThat(failed&&hash(failed)===p.failed.resultHash&&failed.request_hash===p.failed.requestHash,'Retained source failure changed');
 const result=JSON.parse(failed.result);requireThat(result.status==='unavailable'&&result.reason==='financial_ohlc_order'&&result.evidenceId===null,'Only known OHLC research failure may be acknowledged');
 for(const r of p.retained){const e=c.store.get<{content:string;content_hash:string;request_hash:string;instrument_id:string}>('SELECT * FROM observed_financial_evidence WHERE evidence_id=? AND run_id=?',r.evidenceId,saved.configuration.runId);requireThat(e&&hash(e)===r.evidenceHash&&e.content_hash===r.contentHash&&hash(e.content)===r.contentHash&&e.request_hash===r.requestHash&&e.instrument_id===r.instrumentId,'Retained research evidence changed');}
 continuationOccurrences(c,p);
}
export function assertSourceContinuationPrepared(c:Company,p:SourceContinuation){
 assertSourceContinuationRetained(c,p);assertRenewalQuiescent(c);
 const l=c.investmentLoop.get(p.loopId),scope=c.investmentTeam.scope(p.scopeId),g=c.discussions.group(scope.group_id),book=c.observedInvestment.history(scope.run_id).ledger;
 requireThat(l.state==='blocked'&&l.generation+1===p.generation&&g.state==='draft'&&g.turns_used===0&&scope.state==='active'&&!c.store.get('SELECT 1 FROM investment_team_executions WHERE scope_id=?',p.scopeId)&&book.hash===p.portfolioHead&&['active','paused'].includes(book.lifecycle)&&!Object.values(book.orders).some(o=>o.status==='pending'),'Untouched held source continuation required');
 requireThat(p.replacements.every(o=>{const r=c.store.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',o.occurrence_id);return r?.state==='pending'&&r.attempts===0&&r.due_at>c.observedInvestment.now();}),'Continuation start elapsed or already used');
 const old=c.investmentLoop.baseOccurrences(l).filter(o=>p.replacedIds.includes(o.occurrence_id));requireThat(old.length===2&&old.find(o=>o.stage==='collect_research')?.state==='blocked'&&old.find(o=>o.stage==='research')?.state==='pending','Original source failure or research changed');
}
export function prepareSourceContinuation(c:Company,value:unknown){c.conversations.human();return c.store.transaction(()=>{
 const a=strictObject(value,['scopeId','collectAt','researchAt','ownerReceiptHash','receiptId']),scopeId=textField(a,'scopeId',100),receiptId=textField(a,'receiptId',100),requestHash=hash(a),old=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);
 if(old){requireThat(old.request_hash===requestHash,'Source preparation receipt conflict');return JSON.parse(old.result) as {scopeId:string;digest:string;input:SourceContinuation};}
 requireThat(!localSourceContinuation(c,scopeId),'Source continuation already prepared');
 const collectAt=textField(a,'collectAt',40),researchAt=textField(a,'researchAt',40),ownerReceiptHash=textField(a,'ownerReceiptHash',64),at=c.observedInvestment.now(),saved=c.observedInvestment.scopeConfiguration(scopeId),l=c.investmentLoop.forScope(scopeId),scope=c.investmentTeam.scope(scopeId);
 requireThat(saved.renewal&&l?.state==='blocked'&&/^[a-f0-9]{64}$/.test(ownerReceiptHash),'Held observed renewal and owner receipt required');assertRenewalQuiescent(c);
 const current=c.finiteHQ.sourceContinuationPreview(scopeId),base=c.investmentLoop.baseOccurrences(l),session=saved.renewal.session,collect=base.find(o=>o.session===session&&o.stage==='collect_research'),research=base.find(o=>o.session===session&&o.stage==='research');
 requireThat(collect?.state==='blocked'&&research?.state==='pending'&&collect.attempts===1&&research.attempts===0,'One failed source stage before model work required');
 requireThat(time(collectAt)>time(at)&&time(collectAt)<=time(at)+7200000&&time(researchAt)>=time(collectAt)+120000&&time(researchAt)<=time(collectAt)+900000&&researchAt<research.expires_at,'Future bounded source continuation required');
 const results=c.store.all<{reservation_id:string;request_hash:string;result:string}>('SELECT * FROM observed_collection_results WHERE scope_id=? ORDER BY rowid',scopeId),failedRows=results.filter(r=>JSON.parse(r.result).status!=='ok');
 requireThat(failedRows.length===1,'Exactly one retained source failure required');const failure=failedRows[0]!,failedResult=JSON.parse(failure.result);
 requireThat(failedResult.status==='unavailable'&&failedResult.reason==='financial_ohlc_order'&&failedResult.evidenceId===null,'Only known OHLC research failure may be acknowledged');
 const requests=saved.source.instruments.map(i=>({instrumentId:i.id,requestHash:hash(c.observedInvestment.request(i.id,session,false))})),failedRequest=requests.find(r=>r.requestHash===failure.request_hash);requireThat(failedRequest,'Failed request is outside research');
 const reservationHash=(id:string)=>{const r=current.collections.find(x=>x.reservationId===id);requireThat(r,'Source reservation missing');const {reservationId:_,...state}=r;return hash(state);};
 const retained=results.filter(r=>JSON.parse(r.result).status==='ok').map(r=>{
  const result=JSON.parse(r.result),e=c.store.get<{evidence_id:string;instrument_id:string;content_hash:string;request_hash:string}>('SELECT * FROM observed_financial_evidence WHERE evidence_id=? AND run_id=?',result.evidenceId,scope.run_id);requireThat(e&&e.request_hash===r.request_hash&&requests.some(q=>q.requestHash===r.request_hash&&q.instrumentId===e.instrument_id),'Exact current research evidence required');
  return {instrumentId:e.instrument_id,requestHash:r.request_hash,reservationId:r.reservation_id,reservationHash:reservationHash(r.reservation_id),evidenceId:e.evidence_id,evidenceHash:hash(e),contentHash:e.content_hash};
 });
 const remaining=requests.filter(r=>!results.some(x=>x.request_hash===r.requestHash));requireThat(retained.length>=1&&remaining.length>=1&&retained.length+remaining.length+1===requests.length,'Incomplete source set cannot continue');
 const generation=l.generation+1,revision=Math.max(...base.map(o=>o.plan_revision))+1;
 const replacement=(o:Occurrence,due:string,expires:string):Occurrence=>({...o,occurrence_id:'source_continuation_'+randomUUID(),plan_revision:revision,due_at:due,expires_at:expires,state:'pending',generation,attempts:0,retry_at:null,reason:null,result:null,created_at:at,updated_at:at});
 const replacements=[replacement(collect,collectAt,researchAt),replacement(research,researchAt,research.expires_at)],replacedIds=[collect.occurrence_id,research.occurrence_id];
 const p:SourceContinuation={authorityId:current.envelope.authorityId,scopeId,loopId:l.loop_id,session,envelopeHash:hash(current.envelope),checkpointDigest:current.checkpointDigest,controlRevision:current.controlRevision,portfolioHead:c.observedInvestment.history(scope.run_id).ledger.hash!,ownerReceiptHash,baseOccurrencesHash:hash(base.map(occurrenceIdentity)),effectiveOccurrencesHash:hash(ordered([...base.filter(o=>!replacedIds.includes(o.occurrence_id)),...replacements]).map(occurrenceIdentity)),generation,failed:{...failedRequest,reservationId:failure.reservation_id,reservationHash:reservationHash(failure.reservation_id),resultHash:hash(failure),reason:'financial_ohlc_order'},retained,remaining,replacedIds,replacements};
 c.store.run('INSERT INTO observed_source_continuations VALUES(?,?,?,?,?,?)',scopeId,l.loop_id,p.authorityId,hash(p),canonical(p),at);
 for(const o of replacements)c.store.run('INSERT INTO investment_loop_occurrences VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',o.occurrence_id,o.loop_id,o.plan_digest,o.plan_revision,o.session,o.stage,o.due_at,o.expires_at,o.state,o.generation,o.attempts,o.retry_at,o.reason,o.result,o.created_at,o.updated_at);
 assertSourceContinuationPrepared(c,p);const result={scopeId,digest:hash(p),input:p};c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(result),at);c.changed();return result;
});}
export function activateSourceContinuation(c:Company,scopeId:string,receiptId:string){c.conversations.human();return c.store.transaction(()=>{
 const requestHash=hash({scopeId,action:'activate_source_continuation'}),old=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);if(old){requireThat(old.request_hash===requestHash,'Source activation receipt conflict');return JSON.parse(old.result);}
 const p=c.finiteHQ.sourceContinuation(scopeId);requireThat(p,'Independently approved source continuation required');assertSourceContinuationPrepared(c,p);c.finiteHQ.assert(scopeId);requireThat(c.investmentTeam.runtimeAvailable(scopeId),'Current finite runtime selector required');
 const saved=c.observedInvestment.scopeConfiguration(scopeId),book=new FixtureSimulator(c.store,{now:()=>c.observedInvestment.now()},saved.configuration.authorization.fixtureOperator);
 const result=book.execute(saved.configuration.runId,{type:'control',state:'active'},'source_continue_'+receiptId);requireThat(result.outcome.status==='active','Source continuation activation rejected');
 c.store.run("UPDATE investment_loop_occurrences SET state='cancelled',reason='Replaced by exact owner source continuation',updated_at=? WHERE occurrence_id=? AND state='pending'",c.observedInvestment.now(),p.replacedIds[1]!);
 c.store.run("UPDATE investment_loops SET state='active',generation=?,reason=NULL,updated_at=? WHERE loop_id=?",p.generation,c.observedInvestment.now(),p.loopId);c.investmentLoop.fault?.('source_continuation_activation');
 const answer={loop:c.investmentLoop.get(p.loopId),notice:'Original source failure retained; only unspent requests may run; model allowance unchanged'};c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(answer),c.observedInvestment.now());c.changed();return answer;
});}
