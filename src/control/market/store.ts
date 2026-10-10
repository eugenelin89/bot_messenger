import { Store } from '../../persistence/store.js';
import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, id, time } from '../../domain/investment/identity.js';
import { validateCalendar } from '../../domain/market/calendar.js';
import { validateInstrument, validatePolicy } from '../../domain/market/validation.js';
import type { CalendarEvidence, CollectionResult, InstrumentIdentity, PriceEvidence, SourcePolicy } from '../../domain/market/types.js';
export interface Attempt { request_id:string; request_hash:string; cache_key:string; policy_id:string; attempted_at:string; network:number }
export class MarketStore {
  constructor(readonly db:Store) {}
  register(value:SourcePolicy|CalendarEvidence|InstrumentIdentity,kind:'policy'|'calendar'|'instrument',at:string):void {
    if(kind==='policy')validatePolicy(value as SourcePolicy);
    if(kind==='calendar')validateCalendar(value as CalendarEvidence);
    if(kind==='instrument')validateInstrument(value as InstrumentIdentity);
    this.db.transaction(()=>this.put(value.id,kind,value,at));
  }
  put(key:string,kind:'policy'|'calendar'|'instrument'|'price'|'action',value:unknown,at:string):void {
    id(key);time(at);const payload=canonical(value);ensure(Buffer.byteLength(payload)<=524288,'market_record_size');
    const prior=this.db.get<{hash:string;kind:string}>('SELECT hash,kind FROM investment_market_records WHERE id=?',key);
    if(prior){ensure(prior.hash===hash(value)&&prior.kind===kind,'market_identity_conflict');return;}
    ensure(this.db.get<{n:number}>('SELECT count(*) n FROM investment_market_records')!.n<100000,'market_storage_budget');
    this.db.run('INSERT INTO investment_market_records VALUES (?,?,?,?,?)',key,kind,hash(value),payload,at);
  }
  get<T>(key:string,kind:string):T {
    const row=this.db.get<{kind:string;hash:string;payload:string}>('SELECT * FROM investment_market_records WHERE id=?',key);
    ensure(row&&row.kind===kind,'market_record_missing');const value=JSON.parse(row.payload) as T;ensure(hash(value)===row.hash,'market_record_corrupt');return value;
  }
  prices():PriceEvidence[]{return this.db.all<{id:string}>("SELECT id FROM investment_market_records WHERE kind='price' ORDER BY rowid").map(r=>this.get<PriceEvidence>(r.id,'price'));}
  result(key:string):CollectionResult|null {
    const row=this.db.get<{hash:string;payload:string}>('SELECT * FROM investment_market_results WHERE request_id=?',key);
    if(!row)return null;const result=JSON.parse(row.payload) as CollectionResult;ensure(hash(result)===row.hash&&result.requestId===key,'market_result_corrupt');
    if(result.evidence)ensure(hash(this.get(result.evidence.id,'price'))===hash(result.evidence),'market_evidence_mismatch');return result;
  }
  finish(result:CollectionResult,at:string):CollectionResult {
    return this.db.transaction(()=>{
      const prior=this.result(result.requestId);if(prior){ensure(hash(prior)===hash(result),'market_result_conflict');return prior;}
      if(result.evidence)this.put(result.evidence.id,'price',result.evidence,at);
      this.db.run('INSERT INTO investment_market_results VALUES (?,?,?,?)',result.requestId,hash(result),canonical(result),at);return result;
    });
  }
}
