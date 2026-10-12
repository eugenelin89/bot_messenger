import { ensure, SimulationError } from '../../domain/investment/arithmetic.js';
import { canonical, hash, id, time } from '../../domain/investment/identity.js';
import { FINANCIAL_SCHEMA, PYTHON_VERSION, YFINANCE_VERSION, YAHOO_ADAPTER, validateFinancialRequest, type FinancialObservation, type FinancialRequest, type FinancialResult, type YahooAdapter, type YahooQuery, type YahooResponse, type YahooTransport } from '../../domain/market/financial.js';
import { normalizeFinancial } from '../../domain/market/financial-normalize.js';
import { bytesHash, immutableIdentity, requireUses, symbolAt } from '../../domain/market/validation.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import type { CalendarEvidence, InstrumentIdentity, SourcePolicy } from '../../domain/market/types.js';
import type { SimulationClock } from '../investment.js';
import { FinancialStore } from './financial-store.js';

const errorCode=(error:unknown)=>error instanceof SimulationError?error.code:error instanceof Error&&/^[a-z][a-z0-9_]{0,100}$/.test(error.message)?error.message:'financial_adapter_failure';
const classTtl={ohlcv:86400000,actions:86400000,fundamentals:86400000,statement:7*86400000};
export function retryInstant(value:string|null,at:string):string {
  if(value===null)return new Date(time(at)+60000).toISOString();
  let n:number;
  if(/^\d+$/.test(value)) { const seconds=Number(value); ensure(Number.isSafeInteger(seconds)&&seconds<=315360000,'yahoo_invalid_retry_after');n=time(at)+seconds*1000; }
  else {n=Date.parse(value);ensure(Number.isFinite(n),'yahoo_invalid_retry_after');}
  // Never shorten an advertised delay. A past HTTP date still has a one-second floor.
  return new Date(Math.max(time(at)+1000,n)).toISOString();
}
function wait(ms:number,signal:AbortSignal):Promise<void>{return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(new Error('financial_cancelled'));return;}
  const abort=()=>{clearTimeout(timer);reject(new Error('financial_cancelled'));};
  const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);signal.addEventListener('abort',abort,{once:true});
});}

/** One-shot gateway; default inactive. A fixture transport is the only admitted capability in v1. */
export class FinancialDataGateway {
  constructor(readonly store:FinancialStore,private readonly clock:SimulationClock,private readonly adapter:YahooAdapter,private readonly transport:YahooTransport){}
  async collect(policyId:string,request:FinancialRequest,requestId:string,signal?:AbortSignal):Promise<FinancialResult> {
    id(requestId);id(policyId);id(request.instrumentId);validateFinancialRequest(request);
    request=structuredClone(request);
    const started=this.clock.now();time(started);
    const denied=(reason:string):FinancialResult=>({requestId,status:'blocked',reason,observationId:null,completedAt:this.clock.now(),retryAt:null,cached:false});
    let scope;
    try {scope=this.store.current(started);}catch(e){return denied(errorCode(e));}
    ensure(this.adapter.kind===YAHOO_ADAPTER&&this.transport.kind==='authored_yahoo_fixture','live_yahoo_not_authorized');
    const p=this.store.market.get<SourcePolicy>(policyId,'policy'),i=this.store.market.get<InstrumentIdentity>(request.instrumentId,'instrument'),c=this.store.market.get<CalendarEvidence>(scope.calendarId,'calendar');
    const snapshotDate=request.start??started.slice(0,10),symbol=symbolAt(i,snapshotDate);
    if(request.end)ensure(symbolAt(i,new Date(time(`${request.end}T00:00:00Z`)-86400000).toISOString().slice(0,10))===symbol,'financial_symbol_changed_in_range');
    const key=hash({request,policy:p,instrument:i,calendar:c,adapter:YAHOO_ADAPTER,python:PYTHON_VERSION,yfinance:YFINANCE_VERSION,schema:FINANCIAL_SCHEMA});
    const requestHash=hash({scopeId:scope.id,policyId,request,key});
    const check=()=>{
      const current=this.store.current(this.clock.now());ensure(current.id===scope.id,'financial_scope_changed');
      ensure(current.policyIds.includes(p.id)&&current.instrumentIds.includes(i.id),'financial_scope_mismatch');
      ensure(p.provider==='yahoo'&&p.feed==='yfinance'&&p.mode==='synthetic_fixture','live_yahoo_not_authorized');
      ensure(hash(this.store.market.get(p.id,'policy'))===hash(p),'financial_policy_changed');
      requireUses(p,['automation','internal_calculation','retention'],this.clock.now());
      ensure(time(this.clock.now())>=time(started),'financial_clock_reversal');
      ensure(!signal?.aborted,'financial_cancelled');
    };
    const previous=this.store.db.transaction(()=>{
      const old=this.store.db.get<{request_hash:string}>('SELECT request_hash FROM financial_requests WHERE request_id=?',requestId);
      if(old){ensure(old.request_hash===requestHash,'financial_request_conflict');return this.store.result(requestId)??{...denied('financial_request_unsettled'),status:'unknown' as const};}
      this.store.storageCheck();
      this.store.db.run('INSERT INTO financial_requests VALUES (?,?,?,?,?,?,?)',requestId,scope.id,p.id,key,requestHash,canonical(request),started);
      try {
        check();
        ensure(!this.store.db.get(`SELECT 1 FROM financial_requests r LEFT JOIN financial_results z USING(request_id) WHERE r.request_id<>? AND (z.request_id IS NULL OR json_extract(z.payload,'$.status')='unknown')`,requestId),'financial_provider_uncertain_or_busy');
        const last=this.store.db.get<{started_at:string}>('SELECT started_at FROM financial_attempts ORDER BY rowid DESC LIMIT 1');
        ensure(!last||time(started)>=time(last.started_at),'financial_clock_reversal');
        const latest=this.store.latest(key);
        if(latest&&time(started)-time(latest.firstRetrievedAt)<Math.min(p.cacheMs,classTtl[request.dataClass])&&!latest.issues.includes('partial')&&!latest.issues.includes('missing')&&!latest.issues.includes('nan')) {
          return this.store.finish({requestId,status:'ok',reason:'cached_original_vintage',observationId:latest.id,completedAt:started,retryAt:null,cached:true});
        }
      }catch(e){return this.store.finish(denied(errorCode(e)));}
      return null;
    });
    if(previous)return previous;
    // The scope bounds the complete library operation; policy.timeoutMs bounds EACH wire attempt.
    // Cookie + crumb + data require separate rate-spaced calls and cannot share one socket deadline.
    const timeoutMs=scope.timeoutMs;
    const controller=new AbortController(),deadline=Date.now()+timeoutMs;
    const externalAbort=()=>controller.abort();signal?.addEventListener('abort',externalAbort,{once:true});
    let terminal:string|null=null,retryAt:string|null=null,ordinal=0,busy=false;
    const rawResponses:FinancialObservation['rawResponses']=[];
    let transportBytes=0;
    const budgetCheck=()=>{
      check();ensure(!controller.signal.aborted,'financial_cancelled');ensure(Date.now()<deadline,'financial_timeout');
      ensure(!this.store.db.get(`SELECT 1 FROM financial_attempts a LEFT JOIN financial_attempt_results r USING(attempt_id) WHERE r.attempt_id IS NULL`),'financial_transport_uncertain');
      const totals=this.store.db.get<{n:number;bytes:number}>('SELECT count(*) n,coalesce(sum(r.bytes),0) bytes FROM financial_attempts a LEFT JOIN financial_attempt_results r USING(attempt_id)')!;
      ensure(totals.n<Math.min(scope.maxRequests,p.maxRequests),'financial_request_limit');
      // Reserve a full response allowance before each attempt, even if the previous outcome is unknown.
      ensure(totals.bytes+scope.maxResponseBytes<=scope.maxTotalBytes,'financial_byte_limit');
      const backoff=this.store.db.get<{retry_at:string}>(`SELECT retry_at FROM financial_attempt_results WHERE retry_at IS NOT NULL ORDER BY julianday(retry_at) DESC LIMIT 1`);
      if(backoff&&time(backoff.retry_at)>time(this.clock.now())) {retryAt=backoff.retry_at;throw new Error('financial_provider_circuit');}
    };
    const exchange=async(query:YahooQuery):Promise<YahooResponse>=>{
      ensure(!busy&&!terminal,'financial_parallel_or_terminal_request');busy=true;
      try {
        const qualified=qualifyYahooQuery(query,request,symbol);
        for(let retry=0;;retry++){
          check();ensure(!controller.signal.aborted,'financial_cancelled');
          const last=this.store.db.get<{started_at:string}>('SELECT started_at FROM financial_attempts ORDER BY rowid DESC LIMIT 1');
          const delay=last?Math.max(0,time(last.started_at)+Math.max(scope.minIntervalMs,p.minIntervalMs)-time(this.clock.now())):0;
          if(delay){ensure(Date.now()+delay<deadline,'financial_deadline_before_interval');await wait(delay,controller.signal);}
          const attemptId=immutableIdentity('financialattempt',[requestId,++ordinal]);
          this.store.db.transaction(()=>{
            budgetCheck();const latest=this.store.db.get<{started_at:string}>('SELECT started_at FROM financial_attempts ORDER BY rowid DESC LIMIT 1');
            ensure(!latest||time(this.clock.now())-time(latest.started_at)>=Math.max(scope.minIntervalMs,p.minIntervalMs),'financial_rate_limit');
            this.store.db.run('INSERT INTO financial_attempts VALUES (?,?,?,?,?,?)',attemptId,requestId,ordinal,qualified.endpoint,hash(qualified.params),this.clock.now());
          });
          let response:YahooResponse;
          const attemptController=new AbortController();
          const attemptSignal=AbortSignal.any([controller.signal,attemptController.signal]);
          let attemptTimer:ReturnType<typeof setTimeout>|undefined;
          let attemptAbort:()=>void=()=>{};
          try {
            response=await Promise.race([this.transport.exchange(structuredClone(query),attemptSignal,Math.min(scope.maxResponseBytes,p.maxBytes)),new Promise<never>((_,reject)=>{
              attemptTimer=setTimeout(()=>{attemptController.abort();reject(new Error('financial_transport_timeout'));},Math.min(p.timeoutMs,Math.max(1,deadline-Date.now())));
            }),new Promise<never>((_,reject)=>{attemptAbort=()=>reject(new Error('financial_cancelled'));controller.signal.addEventListener('abort',attemptAbort,{once:true});})]);
            check();ensure(!controller.signal.aborted,'financial_cancelled');
            ensure(Number.isInteger(response.status)&&response.status>=100&&response.status<=599&&typeof response.body==='string'&&typeof response.contentType==='string','yahoo_response_schema');
            ensure(Buffer.byteLength(response.body)<=Math.min(scope.maxResponseBytes,p.maxBytes),'yahoo_response_size');
          }catch(e){
            // An ambiguous or aborted actual transport is never refunded or retried.
            this.store.db.run('INSERT OR IGNORE INTO financial_attempt_results VALUES (?,?,?,?,?,?,?)',attemptId,0,scope.maxResponseBytes,null,'transport_unknown',this.clock.now(),null);
            terminal='financial_transport_unknown';throw e;
          }finally{if(attemptTimer)clearTimeout(attemptTimer);controller.signal.removeEventListener('abort',attemptAbort);attemptController.abort();}
          const bytes=Buffer.byteLength(response.body);transportBytes+=bytes;
          let reason='response';let backoff:string|null=null;
          if(response.status===429){reason='yahoo_rate_limited';backoff=retryInstant(response.retryAfter,this.clock.now());}
          else if(response.status===403){reason='yahoo_access_blocked';backoff=scope.expiresAt;}
          else if([502,503,504].includes(response.status)){reason='yahoo_transient';if(response.retryAfter!==null)backoff=retryInstant(response.retryAfter,this.clock.now());else if(retry>=scope.maxRetries)backoff=new Date(time(this.clock.now())+60000).toISOString();}
          else if(response.status>=300){reason='yahoo_http_or_redirect_denied';backoff=new Date(time(this.clock.now())+60000).toISOString();}
          this.store.db.run('INSERT INTO financial_attempt_results VALUES (?,?,?,?,?,?,?)',attemptId,response.status,bytes,bytesHash(response.body),reason,this.clock.now(),backoff);
          if(backoff)retryAt=backoff;
          ensure(transportBytes<=scope.maxTotalBytes,'financial_byte_limit');
          if(response.status===200){
            const bootstrap=qualified.endpoint.endsWith(':cookie')||qualified.endpoint.endsWith(':crumb');
            if(!bootstrap){ensure(response.contentType.split(';')[0]?.trim()==='application/json','yahoo_content_type');const raw={attemptId,endpoint:qualified.endpoint,parameters:qualified.params,body:response.body,sha256:bytesHash(response.body),retrievedAt:this.clock.now()};
              this.store.db.transaction(()=>{check();this.store.storageCheck(bytes);this.store.db.run('INSERT INTO financial_payloads VALUES (?,?,?,?,?,?,?)',attemptId,qualified.endpoint,canonical(qualified.params),response.contentType,response.body,raw.sha256,raw.retrievedAt);});rawResponses.push(raw);}
            return response;
          }
          if([502,503,504].includes(response.status)&&retry<scope.maxRetries&&!backoff)continue;
          terminal=reason;throw new Error(reason);
        }
      }catch(e){terminal??=errorCode(e);throw e;}finally{busy=false;}
    };
    let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      const body=await Promise.race([this.adapter.read({request,symbol},exchange,controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{terminal='financial_timeout';controller.abort();reject(new Error('financial_timeout'));},timeoutMs);}),new Promise<never>((_,reject)=>{controller.signal.addEventListener('abort',()=>reject(new Error('financial_cancelled')),{once:true});})]);
      ensure(!terminal&&!busy,'financial_adapter_ignored_transport_failure');check();
      ensure(rawResponses.length>0,'financial_original_response_missing');ensure(Buffer.byteLength(body)<=524288,'financial_adapter_size');
      return this.store.db.transaction(()=>{
        check();const at=this.clock.now();
        const e=normalizeFinancial({body,request,requestKey:key,policy:p,instrument:i,calendar:c,symbol,retrievedAt:at,normalizedAt:this.clock.now(),rawResponses,previous:this.store.latest(key)});
        return this.store.finish({requestId,status:e.records.length?'ok':'missing',reason:'private_research_only',observationId:e.id,completedAt:at,retryAt:null,cached:false},e);
      });
    } catch(error) {
      const reason=terminal??errorCode(error);
      const unsettled=this.store.db.get('SELECT 1 FROM financial_attempts a LEFT JOIN financial_attempt_results r USING(attempt_id) WHERE a.request_id=? AND (r.attempt_id IS NULL OR r.status=0)',requestId);
      const result:FinancialResult={requestId,status:unsettled?'unknown':reason.includes('cancel')?'cancelled':reason.includes('rate')||reason.includes('circuit')||reason.includes('limit')?'rate_limited':reason.startsWith('financial_')&&reason.includes('schema')||reason==='invalid_fields'||reason.includes('columns')?'schema_changed':'unavailable',reason,observationId:null,completedAt:this.clock.now(),retryAt,cached:false};
      return this.store.finish(result);
    } finally { if(timer)clearTimeout(timer);signal?.removeEventListener('abort',externalAbort);controller.abort(); }
  }
}
