import { ensure, SimulationError } from '../../domain/investment/arithmetic.js';
import { exact, hash, id, time } from '../../domain/investment/identity.js';
import { calendarSession } from '../../domain/market/calendar.js';
import { normalizePrice } from '../../domain/market/normalize.js';
import { immutableIdentity, permitted, symbolAt } from '../../domain/market/validation.js';
import { qualities, type CalendarEvidence, type CollectionResult, type InstrumentIdentity, type PriceAdapter, type PriceRequest, type Quality, type SourcePolicy } from '../../domain/market/types.js';
import type { SimulationClock } from '../investment.js';
import { MarketStore, type Attempt } from './store.js';
/** One-shot trusted collection. It owns no timer and cannot submit/fill an order. */
export class MarketCollector {
  constructor(private readonly store:MarketStore,private readonly clock:SimulationClock,private readonly adapter:PriceAdapter) {}
  async collect(policyId:string,calendarId:string,request:PriceRequest,requestId:string):Promise<CollectionResult> {
    id(requestId);exact(request,['instrumentId','session','field']);id(request.instrumentId);
    ensure(['regular_open','regular_close'].includes(request.field),'unsupported_price_field');
    request=Object.freeze({...request});
    const p=this.store.get<SourcePolicy>(policyId,'policy'),c=this.store.get<CalendarEvidence>(calendarId,'calendar'),i=this.store.get<InstrumentIdentity>(request.instrumentId,'instrument');
    symbolAt(i,request.session);const s=calendarSession(c,request.session);
    const key=hash({policy:p,calendar:c,instrument:i,request,adapter:this.adapter.kind}),at=this.clock.now();time(at);
    const outcome=(quality:Quality,reason:string,retryAfter:string|null=null):CollectionResult=>({id:immutableIdentity('collection',[requestId,key]),requestId,quality,evidence:null,retryAfter,reason});
    const admitted=this.store.db.transaction(()=>{
      const previous=this.store.db.get<Attempt>('SELECT * FROM investment_market_attempts WHERE request_id=?',requestId);
      if(previous){ensure(previous.request_hash===key,'market_request_conflict');return {result:this.store.result(requestId)??outcome('unavailable','interrupted_attempt_requires_new_request'),network:false};}
      ensure(this.store.db.get<{n:number}>('SELECT count(*) n FROM investment_market_attempts')!.n<100000,'market_attempt_budget');
      const attempts=this.store.db.all<Attempt>('SELECT * FROM investment_market_attempts WHERE policy_id=? ORDER BY rowid',p.id),last=attempts.at(-1);
      ensure(!last||time(at)>=time(last.attempted_at),'market_clock_reversal');
      let result:CollectionResult|null=null;
      if(!['automation','internal_calculation','retention'].every(use=>permitted(p,use as 'automation'|'internal_calculation'|'retention',at)))result=outcome('unknown_rights','source_permission_missing');
      else if(p.mode!=='synthetic_fixture'||this.adapter.kind!=='synthetic-json-v1')result=outcome('unavailable','live_price_adapter_not_verified');
      else if(!s||s.status!=='open')result=outcome('calendar_mismatch','session_closed');
      else if(time(at)<time(request.field==='regular_open'?s.open:s.close))result=outcome('unavailable','event_not_available');
      if(!result) {
        const latest=attempts.filter(a=>a.cache_key===key).at(-1);
        const prior=latest?this.store.result(latest.request_id):null;
        if(prior?.evidence&&['verified','corrected'].includes(prior.quality)&&time(at)-time(prior.evidence.retrievedAt)<=p.cacheMs)result={...outcome(prior.quality,'cached_original_retrieval'),evidence:prior.evidence};
      }
      if(!result) {
        const network=attempts.filter(a=>a.network===1),lastNetwork=network.at(-1);
        const backoff=attempts.map(a=>this.store.result(a.request_id)?.retryAfter).filter((v):v is string=>!!v).sort().at(-1);
        if(network.length>=p.maxRequests)result=outcome('rate_limited','finite_source_budget_exhausted');
        else if(backoff&&time(backoff)>time(at))result=outcome('rate_limited','provider_backoff',backoff);
        else if(lastNetwork&&time(at)-time(lastNetwork.attempted_at)<p.minIntervalMs)result=outcome('rate_limited','source_interval',new Date(time(lastNetwork.attempted_at)+p.minIntervalMs).toISOString());
      }
      this.store.db.run('INSERT INTO investment_market_attempts VALUES (?,?,?,?,?,?)',requestId,key,key,p.id,at,result?0:1);
      return {result,network:!result};
    });
    if(admitted.result) {
      // An in-flight duplicate must never settle the original network request.
      if(admitted.result.reason==='interrupted_attempt_requires_new_request')return admitted.result;
      return this.store.result(requestId)??this.store.finish(admitted.result,at);
    }
    let result:CollectionResult;let pendingBody:string|null=null;let retrievedAt=at;
    const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      const response=await Promise.race([this.adapter.read(request,abort.signal,p.maxBytes),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new Error('market_timeout'));},p.timeoutMs);})]);
      retrievedAt=this.clock.now();ensure(time(retrievedAt)>=time(at),'market_clock_reversal');
      ensure(Buffer.byteLength(response.body)<=p.maxBytes,'market_response_size');
      if(response.status===429){const seconds=response.retryAfterSeconds??60;ensure(Number.isSafeInteger(seconds)&&seconds>=0,'invalid_retry_after');result=outcome('rate_limited','provider_rate_limit',new Date(time(retrievedAt)+Math.max(1000,Math.min(seconds,86400)*1000)).toISOString());}
      else if(response.status!==200)result=outcome('unavailable','provider_http_failure',new Date(time(retrievedAt)+60000).toISOString());
      else if(response.contentType.split(';')[0]?.trim()!=='application/json')result=outcome('schema_changed','unexpected_content_type');
      else {
        pendingBody=response.body;result=outcome('unavailable','normalization_pending');
      }
    }catch(error){const code=error instanceof SimulationError?error.code:'provider_failure';result=outcome(qualities.includes(code as Quality)?code as Quality:'unavailable',code,new Date(time(this.clock.now())+60000).toISOString());}
    finally{if(timer)clearTimeout(timer);abort.abort();}
    return this.store.db.transaction(()=>{
      // Semantic identity and correction lineage are checked under the committing write lock.
      if(pendingBody!==null){try{const evidence=normalizePrice(pendingBody,request,p,i,c,retrievedAt,this.store.prices());result={...outcome(evidence.quality,'structured_observation'),evidence};}
      catch(error){const code=error instanceof SimulationError&&error.code!=='invalid_fields'?error.code:'schema_changed';result=outcome(qualities.includes(code as Quality)?code as Quality:'unavailable',code);}}
      // Expiry during network I/O denies delivery and retention, even for a technically valid response.
      if(!['automation','internal_calculation','retention'].every(use=>permitted(p,use as 'automation'|'internal_calculation'|'retention',this.clock.now())))result=outcome('unknown_rights','source_permission_expired_during_request');
      return this.store.finish(result,this.clock.now());
    });
  }
}
