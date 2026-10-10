import { createHash } from 'node:crypto';
import { ensure, format, positive } from '../investment/arithmetic.js';
import { canonical, date, exact, hash, id, integer, time } from '../investment/identity.js';
import { uses, type DataUse, type InstrumentIdentity, type SourcePolicy } from './types.js';
export const bytesHash = (body: string): string => createHash('sha256').update(body).digest('hex');
export function boundedText(value: unknown, max = 1000): asserts value is string {
  ensure(typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f]/.test(value), 'invalid_market_text');
}
export function sourceReference(value: string): void {
  boundedText(value, 2048);
  ensure(value.startsWith('synthetic:') || /^https:\/\/[^\s]+$/.test(value), 'invalid_source_reference');
}
export function validatePolicy(p: SourcePolicy): void {
  exact(p,['id','version','provider','feed','mode','incrementalCost','reviewedAt','expiresAt','rights','attribution','maxObservationAgeMs','maxRequests','minIntervalMs','cacheMs','timeoutMs','maxBytes']);
  [p.id,p.provider,p.feed].forEach(id); integer(p.version,1,1000000);
  ensure(['synthetic_fixture','observed'].includes(p.mode) && p.incrementalCost === '0','market_cost_or_mode');
  ensure(time(p.expiresAt)>time(p.reviewedAt),'invalid_policy_window'); boundedText(p.attribution);
  exact(p.rights,[...uses]);
  for(const use of uses) {
    const right=p.rights[use]; exact(right,['status','evidence','note']);
    ensure(['allowed','denied','unknown'].includes(right.status),'invalid_right'); boundedText(right.note);
    ensure(Array.isArray(right.evidence) && right.evidence.length<=10 && (right.status!=='allowed' || right.evidence.length>0),'missing_rights_evidence');
    right.evidence.forEach(sourceReference);
    if(p.mode==='observed') ensure(right.evidence.every(e=>e.startsWith('https:')),'synthetic_permission_for_observed_source');
  }
  integer(p.maxObservationAgeMs,1,604800000); integer(p.maxRequests,1,1000); integer(p.minIntervalMs,1,86400000); integer(p.cacheMs,0,86400000);
  integer(p.timeoutMs,1,10000); integer(p.maxBytes,1,262144); canonical(p);
}
export function permitted(p:SourcePolicy, use:DataUse, at:string):boolean {
  validatePolicy(p); return time(at)>=time(p.reviewedAt) && time(at)<time(p.expiresAt) && p.rights[use].status==='allowed';
}
export function requireUses(p:SourcePolicy, requested:DataUse[], at:string):void {
  ensure(requested.every(use=>permitted(p,use,at)),'source_permission_missing');
}
export function validateInstrument(i:InstrumentIdentity):void {
  exact(i,['id','venue','currency','source','symbols']); id(i.id); sourceReference(i.source);
  ensure(['XNYS','XNAS'].includes(i.venue) && i.currency==='USD','unsupported_market');
  ensure(Array.isArray(i.symbols) && i.symbols.length>0 && i.symbols.length<=100,'invalid_symbol_history');
  let end:number|null=-Infinity;
  for(const s of i.symbols) {
    exact(s,['symbol','from','until']); ensure(/^[A-Z][A-Z0-9.-]{0,19}$/.test(s.symbol),'invalid_symbol'); date(s.from);
    if(s.until!==null) date(s.until);
    const from=time(`${s.from}T00:00:00Z`),until=s.until===null?null:time(`${s.until}T00:00:00Z`);
    ensure(end!==null && from>=end && (until===null || until>from),'overlapping_symbol_history'); end=until;
  }
}
export function symbolAt(i:InstrumentIdentity, session:string):string {
  validateInstrument(i); date(session);
  const s=i.symbols.find(s=>s.from<=session && (s.until===null || session<s.until)); ensure(s,'unknown_symbol_for_session'); return s.symbol;
}
export function price(value:unknown):string {
  ensure(typeof value==='string','invalid_price'); return format(positive(value));
}
export function immutableIdentity(kind:string, value:unknown):string {return `${kind}_${hash(value).slice(0,40)}`;}
