import type {Store} from '../../persistence/store.js';
import type {Saved} from './observed-investment.js';
import {FINANCIAL_SCHEMA} from '../../domain/market/financial.js';
import {hash} from '../../domain/investment/identity.js';
import {requireThat} from '../../domain/model.js';
/** Fixed trusted disclosure from this cycle's durable rejected research packets. No source prose. */
export function omittedResearchLimitation(db:Store,scopeId:string,session:string,knownAt:string){
 const row=db.get<{input:string;digest:string}>('SELECT input,digest FROM observed_investment_scopes WHERE scope_id=?',scopeId);if(!row)return '';
 const saved=JSON.parse(row.input) as Saved;requireThat(hash(saved)===row.digest,'Observed scope changed');if(saved.renewal?.version!=='bounded_successor_v1')return '';
 const symbols=saved.source.requests.filter(r=>hash(r)===hash({schemaVersion:FINANCIAL_SCHEMA,instrumentId:r.instrumentId,dataClass:'ohlcv',start:new Date(Date.parse(session+'T00:00:00Z')-10*86400000).toISOString().slice(0,10),end:session,interval:'1d',statement:null,frequency:null,fields:[],adjustment:'yahoo_unrepaired'})).filter(r=>{
  const result=db.get<{result:string}>("SELECT result FROM observed_collection_results WHERE scope_id=? AND request_hash=? AND created_at<=?",scopeId,hash(r),knownAt);if(!result)return false;const x=JSON.parse(result.result);return x.status==='unavailable'&&x.reason==='financial_ohlc_order'&&x.evidenceId===null;
 }).map(r=>r.instrumentId);
 return symbols.length?' Unavailable validated research: '+symbols.join(', ')+'. Invalid OHLC packets were excluded; affected instruments cannot be ordered this cycle. No substitute prices were used.':'';
}
export function proposalSourceLimitation(db:Store,scopeId:string,executionId:string,knownAt:string){
 const cycle=db.get<{session:string}>('SELECT o.session FROM investment_loop_executions e JOIN investment_loop_occurrences o USING(occurrence_id) WHERE e.execution_id=?',executionId);
 return cycle?omittedResearchLimitation(db,scopeId,cycle.session,knownAt):'';
}
