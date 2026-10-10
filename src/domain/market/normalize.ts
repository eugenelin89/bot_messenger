import { parseTree, type ParseError } from 'jsonc-parser';
import { ensure, SimulationError } from '../investment/arithmetic.js';
import { exact, hash, id, integer, time } from '../investment/identity.js';
import { calendarSession } from './calendar.js';
import type { CalendarEvidence, InstrumentIdentity, PriceEvidence, PriceRequest, SourcePolicy } from './types.js';
import { bytesHash, immutableIdentity, price, symbolAt } from './validation.js';
/** Strict fixture schema; duplicate JSON keys, comments and schema drift fail closed. */
export function strictJson(body:string):unknown {
  const errors:ParseError[]=[];const tree=parseTree(body,errors,{allowTrailingComma:false,disallowComments:true});ensure(tree&&errors.length===0,'schema_changed');
  function check(n:NonNullable<typeof tree>,depth:number):void {
    ensure(depth<=12,'schema_changed');if(n.type==='object'){const keys=n.children?.map(p=>p.children![0]!.value as string)??[];ensure(new Set(keys).size===keys.length,'schema_changed');}
    n.children?.forEach(c=>check(c,depth+1));
  }
  check(tree,0);return JSON.parse(body) as unknown;
}
export function strictObject(body:string):Record<string,unknown> {
  const value=strictJson(body);ensure(value!==null&&!Array.isArray(value)&&typeof value==='object','schema_changed');return value as Record<string,unknown>;
}
export function normalizePrice(body:string,request:PriceRequest,p:SourcePolicy,i:InstrumentIdentity,c:CalendarEvidence,retrievedAt:string,prior:PriceEvidence[]):PriceEvidence {
  const raw=strictObject(body);exact(raw,['schema','symbol','venue','currency','field','value','adjustment','session','marketAt','availableAt','sourceId','sourceVersion','status','correctionOf']);
  ensure(raw.schema==='synthetic-price-v1','schema_changed');
  ensure(raw.symbol===symbolAt(i,request.session)&&raw.venue===i.venue&&raw.currency===i.currency,'wrong_instrument');
  ensure(raw.field===request.field,'wrong_field');ensure(raw.adjustment==='raw','unsupported_adjustment');ensure(raw.session===request.session,'calendar_mismatch');
  const s=calendarSession(c,request.session);ensure(s&&s.status==='open','calendar_mismatch');
  ensure(raw.status==='verified'||raw.status==='missing'||raw.status==='halted','schema_changed');
  const marketAt=raw.marketAt as string|null,availableAt=raw.availableAt as string|null;
  if(raw.status==='verified')ensure(marketAt===(request.field==='regular_open'?s.open:s.close),'invalid_timestamp');
  try{if(marketAt!==null)ensure(time(marketAt)<=time(retrievedAt),'invalid_timestamp');if(availableAt!==null)ensure(marketAt!==null&&time(availableAt)>=time(marketAt)&&time(availableAt)<=time(retrievedAt),'invalid_timestamp');}
  catch{throw new SimulationError('invalid_timestamp');}
  ensure(raw.status!=='verified'||typeof raw.value==='string','invalid_price');
  let value:string|null=null;
  if(raw.value!==null){try{value=price(raw.value);}catch{throw new SimulationError('invalid_price');}}
  ensure(raw.status==='verified'||value===null,'schema_changed');id(raw.sourceId as string);integer(raw.sourceVersion as number,1,1000000);
  if(raw.correctionOf!==null)id(raw.correctionOf as string);
  const same=prior.filter(o=>o.policyId===p.id&&o.instrumentId===i.id&&o.session===request.session&&o.field===request.field);
  const repeated=same.find(o=>o.sourceId===raw.sourceId&&o.sourceVersion===raw.sourceVersion&&o.correctionOf===raw.correctionOf&&o.value===value&&o.marketAt===marketAt&&o.sourceAvailableAt===availableAt&&((raw.status==='verified'&&['verified','corrected','stale'].includes(o.quality))||o.quality===raw.status));
  if(repeated)return structuredClone(repeated);
  if(raw.correctionOf!==null){const old=same.find(o=>o.id===raw.correctionOf);ensure(old&&old.sourceId===raw.sourceId&&Number(raw.sourceVersion)===old.sourceVersion+1&&time(retrievedAt)>=time(old.retrievedAt)&&!same.some(o=>o.correctionOf===old.id),'correction_mismatch');}
  else ensure(!same.some(o=>o.sourceId===raw.sourceId&&o.sourceVersion!==raw.sourceVersion),'correction_reference_required');
  const fields={mode:p.mode,policyId:p.id,policyHash:hash(p),instrumentId:i.id,symbol:raw.symbol as string,venue:i.venue,currency:i.currency,provider:p.provider,feed:p.feed,
    field:request.field,value,adjustment:'raw' as const,session:request.session,calendarId:c.id,calendarVersion:c.calendar.version,marketAt,sourceAvailableAt:availableAt,
    retrievedAt,knownAt:availableAt??retrievedAt,sourceId:raw.sourceId as string,sourceVersion:raw.sourceVersion as number,responseHash:bytesHash(body),
    quality:(raw.correctionOf!==null&&raw.status==='verified'?'corrected':raw.status) as PriceEvidence['quality'],correctionOf:raw.correctionOf as string|null,conflictsWith:[] as string[],rights:structuredClone(p.rights)};
  const conflicts=same.filter(o=>o.correctionOf===null&&raw.correctionOf===null&&o.value!==null&&fields.value!==null&&o.value!==fields.value);
  if(conflicts.length){fields.quality='conflicting_sources';fields.conflictsWith=conflicts.map(o=>o.id);}
  else if(fields.quality==='verified'&&marketAt!==null&&time(retrievedAt)-time(marketAt)>p.maxObservationAgeMs)fields.quality='stale';
  return {id:immutableIdentity('market',fields),...fields};
}
