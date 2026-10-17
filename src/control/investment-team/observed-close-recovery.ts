/** Model-free, append-only recovery of missed valuations for a settled cash portfolio. */
import type {Company} from '../company.js';
import {requireThat,strictObject,textField} from '../../domain/model.js';
import {hash,canonical,time} from '../../domain/investment/identity.js';
import {FixtureSimulator} from '../investment.js';
import {MarketStore} from '../market/store.js';
import {MarketFixtureSimulator} from '../market/admission.js';
import {assertRenewalQuiescent} from './observed-renewal.js';
import type {CorporateAction} from '../../domain/investment/types.js';

export function closeRecoveryPreview(c:Company,scopeId:string){
 c.conversations.human();assertRenewalQuiescent(c);
 const scope=c.investmentTeam.scope(scopeId),saved=c.observedInvestment.scopeConfiguration(scopeId),loop=c.investmentLoop.forScope(scopeId),at=c.observedInvestment.now(),config=saved.configuration;
 const sim=new FixtureSimulator(c.store,{now:()=>at},config.authorization.fixtureOperator),state=sim.inspect(scope.run_id),last=state.valuations.at(-1)?.snapshot.asOf??config.startsAt;
 requireThat(loop&&['blocked','finished','stopped'].includes(loop.state)&&state.lifecycle!=='ended'&&Object.values(state.portfolio.positions).every(p=>p.quantity==='0.000000')&&!Object.values(state.orders).some(o=>o.status==='pending')&&!state.benchmarkNextOpen,'Recovery requires a settled cash portfolio and allocated benchmark');
 const sessions=config.calendar.sessions.filter(s=>s.status==='open'&&s.close>last&&s.close<at&&s.close>=state.economicAsOf);
 requireThat(sessions.length>0&&sessions.length<=8&&time(at)-time(sessions[0]!.close)<14*86400000,'One to eight recent missed closing valuations required');
 const source=c.finiteHQ.successorPreview(scopeId),market=new MarketStore(c.store),prices=market.prices().filter(p=>sessions.some(s=>s.date===p.session)&&p.field==='regular_close'&&!market.prices().some(n=>n.correctionOf===p.id));
 const evidence=c.store.all('SELECT * FROM observed_financial_evidence WHERE run_id=? ORDER BY rowid',scope.run_id),results=c.store.all('SELECT r.* FROM observed_collection_results r JOIN investment_team_scopes s USING(scope_id) WHERE s.run_id=? ORDER BY r.rowid',scope.run_id);
 // No backdated economic reconstruction: an unapplied corporate action requires a separate review.
 for(const row of c.store.all<{id:string}>("SELECT DISTINCT json_extract(a.value,'$.id') id FROM observed_financial_evidence e,json_each(e.qualification,'$.actions') a WHERE e.run_id=? AND json_extract(e.qualification,'$.qualified')=1",scope.run_id)){
  const action=market.get<CorporateAction>(row.id,'action');requireThat(action.effectiveAt>sessions.at(-1)!.close||state.actions.some(a=>a.id===action.id),'Unapplied corporate action blocks cash close recovery');
 }
 const binding={scopeId,runId:scope.run_id,portfolioHead:state.hash,checkpointDigest:source.checkpointDigest,sourceHistoryHash:hash({evidence,results,prices}),occurrencesHash:hash(c.investmentLoop.occurrences(loop)),sessions:sessions.map(s=>({session:s.date,asOf:s.close})),priceIds:prices.map(p=>p.id)};
 return {...binding,digest:hash(binding),notice:'Append valuations at the actual recovery time using retained qualified prices only. Missing benchmark marks remain null. No source retry, model call, order or fill.'};
}
export function recoverObservedCloses(c:Company,value:unknown){
 c.conversations.human();const a=strictObject(value,['scopeId','digest','receiptId','ownerReceiptHash']),scopeId=textField(a,'scopeId',100),receiptId=textField(a,'receiptId',100),requestHash=hash(a);requireThat(/^[a-f0-9]{64}$/.test(textField(a,'ownerReceiptHash',64)),'Exact owner receipt required');
 return c.store.transaction(()=>{
  const old=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId);if(old){requireThat(old.request_hash===requestHash,'Close recovery receipt conflict');return JSON.parse(old.result);}
  const p=closeRecoveryPreview(c,scopeId);requireThat(p.digest===textField(a,'digest',64),'Close recovery preview changed');
  const saved=c.observedInvestment.scopeConfiguration(scopeId),at=c.observedInvestment.now(),market=new MarketFixtureSimulator(new MarketStore(c.store),{now:()=>at},saved.configuration.authorization.fixtureOperator),valuations=[];
  const paused=market.execute(p.runId,{type:'control',state:'paused'},'close_recovery_pause_'+receiptId);requireThat(paused.outcome.status==='paused','Recovery pause rejected');
  for(const day of p.sessions){for(const id of p.priceIds){const price=new MarketStore(c.store).prices().find(x=>x.id===id)!;if(price.session===day.session)for(const j of market.observe(p.runId,id))requireThat(j.outcome.status!=='rejected','Retained close admission rejected');}
   const j=market.execute(p.runId,{type:'value',session:day.session,asOf:day.asOf},'close_recovery_'+receiptId+'_'+day.session);requireThat(j.outcome.valuation&&j.outcome.status!=='rejected','Recovery valuation rejected');valuations.push(j.outcome.valuation);
  }
  const result={kind:'observed_close_recovery_v1',...p,ownerReceiptHash:a.ownerReceiptHash,recordedAt:at,valuations};c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,canonical(result),at);c.changed();return result;
 });
}
