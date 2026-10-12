import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, exact, hash, id, integer, time } from '../../domain/investment/identity.js';
import { verifyFinancialObservation } from '../../domain/market/financial-normalize.js';
import type { FinancialObservation, FinancialResult, FinancialScope } from '../../domain/market/financial.js';
import { MarketStore } from './store.js';
export class FinancialStore {
  readonly db;
  constructor(readonly market: MarketStore) { this.db=market.db; }
  /** Explicit fixture-only setup, never invoked by migration/import/startup or employee tools. */
  initialize(scope: FinancialScope): void {
    exact(scope,['id','mode','policyIds','instrumentIds','calendarId','approvedAt','expiresAt','maxRequests','minIntervalMs','maxResponseBytes','maxTotalBytes','timeoutMs','maxRetries']);
    id(scope.id);id(scope.calendarId);ensure(scope.mode==='synthetic_fixture','live_yahoo_not_authorized');
    ensure(Array.isArray(scope.policyIds)&&scope.policyIds.length>0&&scope.policyIds.length<=4&&new Set(scope.policyIds).size===scope.policyIds.length,'financial_scope');
    ensure(Array.isArray(scope.instrumentIds)&&scope.instrumentIds.length>0&&scope.instrumentIds.length<=3&&new Set(scope.instrumentIds).size===scope.instrumentIds.length,'financial_scope');
    scope.policyIds.forEach(id);scope.instrumentIds.forEach(id);
    ensure(time(scope.expiresAt)>time(scope.approvedAt)&&time(scope.expiresAt)-time(scope.approvedAt)<=7*86400000,'financial_scope_window');
    integer(scope.maxRequests,1,100);integer(scope.minIntervalMs,5000,86400000);integer(scope.maxResponseBytes,1,262144);
    integer(scope.maxTotalBytes,scope.maxResponseBytes,8*1024*1024);integer(scope.timeoutMs,1,120000);integer(scope.maxRetries,0,2);
    this.db.transaction(()=>{
      const old=this.db.get<{hash:string}>('SELECT hash FROM financial_scopes WHERE provider=?','yahoo');
      if(old){ensure(old.hash===hash(scope),'financial_scope_cannot_refill');return;}
      this.db.run('INSERT INTO financial_scopes VALUES (?,?,?,?,?)','yahoo',scope.id,hash(scope),canonical(scope),scope.approvedAt);
    });
  }
  scope(): FinancialScope | null {
    const row=this.db.get<{hash:string;payload:string}>('SELECT hash,payload FROM financial_scopes WHERE provider=?','yahoo');
    if(!row)return null;const scope=JSON.parse(row.payload) as FinancialScope;ensure(hash(scope)===row.hash,'financial_scope_corrupt');return scope;
  }
  assertClock(at:string):void {
    const high=this.db.get<{at:string|null}>(`SELECT value at FROM (
      SELECT created_at value FROM financial_requests UNION ALL SELECT started_at FROM financial_attempts
      UNION ALL SELECT completed_at FROM financial_attempt_results UNION ALL SELECT completed_at FROM financial_results
      UNION ALL SELECT first_retrieved_at FROM financial_observations UNION ALL SELECT json_extract(payload,'$.normalizedAt') FROM financial_observations
      UNION ALL SELECT delivered_at FROM financial_deliveries UNION ALL SELECT revoked_at FROM financial_revocations
    ) ORDER BY julianday(value) DESC LIMIT 1`);
    ensure(!high?.at||time(at)>=time(high.at),'financial_clock_reversal');
  }
  current(at:string): FinancialScope {
    this.assertClock(at);
    const scope=this.scope();ensure(scope,'financial_gateway_inactive');
    ensure(scope.mode==='synthetic_fixture','live_yahoo_not_authorized');
    ensure(time(at)>=time(scope.approvedAt)&&time(at)<time(scope.expiresAt),'financial_scope_expired');
    ensure(!this.db.get('SELECT 1 FROM financial_revocations WHERE scope_id=?',scope.id),'financial_scope_revoked');return scope;
  }
  revoke(at:string):void {
    time(at);const scope=this.scope();ensure(scope,'financial_gateway_inactive');
    this.db.run('INSERT OR IGNORE INTO financial_revocations VALUES (?,?)',scope.id,at);
  }
  storageCheck(extraBytes=0):void {
    const rows=this.db.get<{n:number;bytes:number}>(`SELECT count(*) n,coalesce(sum(length(CAST(payload AS BLOB))),0) bytes FROM financial_observations`)!;
    const rawBytes=this.db.get<{bytes:number}>('SELECT coalesce(sum(length(CAST(body AS BLOB))),0) bytes FROM financial_payloads')!.bytes;
    ensure(rows.n<10000&&rows.bytes+rawBytes+extraBytes<=32*1024*1024,'financial_storage_budget');
    ensure(this.db.get<{n:number}>('SELECT count(*) n FROM financial_requests')!.n<10000,'financial_request_budget');
    ensure(this.db.get<{n:number}>('SELECT count(*) n FROM financial_deliveries')!.n<10000,'financial_delivery_budget');
  }
  observation(key:string):FinancialObservation {
    id(key);const row=this.db.get<{hash:string;payload:string}>('SELECT hash,payload FROM financial_observations WHERE observation_id=?',key);ensure(row,'financial_observation_missing');
    const e=JSON.parse(row.payload) as FinancialObservation;ensure(e.id===key&&hash(e)===row.hash,'financial_observation_corrupt');verifyFinancialObservation(e);return e;
  }
  latest(key:string,cutoff?:string):FinancialObservation|null {
    if(cutoff)time(cutoff);
    const row=this.db.get<{observation_id:string}>('SELECT observation_id FROM financial_observations WHERE request_key=? AND julianday(first_retrieved_at)<=julianday(?) ORDER BY revision DESC LIMIT 1',key,cutoff??'9999-12-31T23:59:59Z');
    return row?this.observation(row.observation_id):null;
  }
  put(e:FinancialObservation):void {
    verifyFinancialObservation(e);const old=this.db.get<{hash:string}>('SELECT hash FROM financial_observations WHERE observation_id=?',e.id);
    if(old){ensure(old.hash===hash(e),'financial_observation_conflict');return;}
    this.storageCheck(Buffer.byteLength(canonical(e)));
    const previous=this.latest(e.requestKey);ensure((previous?.id??null)===e.predecessorId&&e.localRevision===(previous?.localRevision??0)+1,'financial_revision_conflict');
    this.db.run('INSERT INTO financial_observations VALUES (?,?,?,?,?,?,?,?,?,?)',e.id,e.requestKey,e.contentHash,e.localRevision,e.predecessorId,e.policyId,e.instrumentId,hash(e),canonical(e),e.firstRetrievedAt);
  }
  result(requestId:string):FinancialResult|null {
    const row=this.db.get<{hash:string;payload:string}>('SELECT hash,payload FROM financial_results WHERE request_id=?',requestId);if(!row)return null;
    const value=JSON.parse(row.payload) as FinancialResult;ensure(value.requestId===requestId&&hash(value)===row.hash,'financial_result_corrupt');return value;
  }
  finish(result:FinancialResult,e:FinancialObservation|null=null):FinancialResult {
    return this.db.transaction(()=>{
      const old=this.result(result.requestId);if(old){ensure(hash(old)===hash(result),'financial_result_conflict');return old;}
      if(e)this.put(e);
      this.db.run('INSERT INTO financial_results VALUES (?,?,?,?,?)',result.requestId,result.observationId,hash(result),canonical(result),result.completedAt);return result;
    });
  }
}
