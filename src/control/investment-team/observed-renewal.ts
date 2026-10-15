import type {Company} from '../company.js';
import type {ObservedRenewal} from '../usage/finite-journal.js';
import {requireThat} from '../../domain/model.js';
import {hash,time} from '../../domain/investment/identity.js';
import {FixtureSimulator} from '../investment.js';

export function assertRenewalRetained(c:Company,r:ObservedRenewal){
 for(const x of r.exceptions){const u=c.store.get<{settled:number;completeness:string}>('SELECT * FROM ai_usage WHERE execution_id=?',x.executionId);requireThat(u&&u.settled===1&&u.completeness==='incomplete'&&hash(u)===x.localUsageHash&&c.execution(x.executionId).status===x.status,'Retained renewal usage or status changed');}
}
export function assertRenewalQuiescent(c:Company){
 requireThat(!c.store.get("SELECT 1 FROM executions WHERE status='running'")&&!c.store.get('SELECT 1 FROM execution_runtime_attempts WHERE unresolved=1')&&!c.store.get("SELECT 1 FROM investment_activity_invocations WHERE state IN ('reserved','active','unknown')")&&c.workers().every(w=>!c.providerUnresolved(w.worker_id)),'Provider activity must be settled before renewal');
}
export function assertPreparedRenewal(c:Company,scopeId:string){
 const saved=c.observedInvestment.scopeConfiguration(scopeId),r=saved.renewal,l=c.investmentLoop.forScope(scopeId);requireThat(r&&l?.state==='draft','Exact untouched renewal draft required');assertRenewalRetained(c,r);assertRenewalQuiescent(c);
 const state=c.observedInvestment.history(saved.configuration.runId).ledger,g=c.discussions.group(c.investmentTeam.scope(scopeId).group_id);
 requireThat(state.hash===r.portfolioHead&&state.lifecycle==='paused'&&!Object.values(state.orders).some(x=>x.status==='pending')&&g.state==='draft'&&g.turns_used===0&&!c.store.get('SELECT 1 FROM investment_team_executions WHERE scope_id=?',scopeId)&&c.investmentLoop.occurrences(l).every(o=>o.state==='pending'&&o.attempts===0&&o.due_at>c.observedInvestment.now()),'Renewal book, draft or future schedule changed');
 return {saved,r,l};
}
export function activateObservedRenewal(c:Company,scopeId:string,receiptId:string){c.conversations.human();return c.store.transaction(()=>{
 const duplicate=c.store.get<{request_hash:string;result:string}>('SELECT * FROM observed_investment_receipts WHERE receipt_id=?',receiptId),requestHash=hash({scopeId,action:'activate_renewal'});if(duplicate){requireThat(duplicate.request_hash===requestHash,'Renewal activation receipt conflict');return JSON.parse(duplicate.result);}
 const {saved,r,l}=assertPreparedRenewal(c,scopeId);requireThat(c.investmentTeam.runtimeAvailable(scopeId),'Renewal runtime selector unavailable');c.finiteHQ.assert(scopeId);requireThat(time(c.observedInvestment.now())<time(r.collectAt),'Renewal collection window elapsed');
 const book=new FixtureSimulator(c.store,{now:()=>c.observedInvestment.now()},saved.configuration.authorization.fixtureOperator),result=book.execute(saved.configuration.runId,{type:'control',state:'active'},'renewal_activate_'+receiptId);requireThat(result.outcome.status==='active','Renewal activation rejected');
 const started=c.investmentLoop.startPreparedRecovery(l.loop_id,l.digest,receiptId);c.store.run('INSERT INTO observed_investment_receipts VALUES(?,?,?,?)',receiptId,requestHash,JSON.stringify(started),c.observedInvestment.now());return started;
});}
