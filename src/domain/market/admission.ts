import { ensure, positive } from '../investment/arithmetic.js';
import { exact, hash, id, integer, time } from '../investment/identity.js';
import { validateObservation } from '../investment/policy.js';
import type { Configuration, CorporateAction } from '../investment/types.js';
import { calendarSession } from './calendar.js';
import type { ActionEvidence, CalendarEvidence, DataUse, PriceEvidence, SimulatorAdmission, SourcePolicy } from './types.js';
import { immutableIdentity, requireUses, sourceReference } from './validation.js';
/** Explicit use-time rights gate for later public projections. No inferred derived-data exemption. */
export function evidenceRights(e:Pick<PriceEvidence,'policyId'|'policyHash'|'rights'>,p:SourcePolicy,uses:DataUse[],at:string):void {
  ensure(e.policyId===p.id&&e.policyHash===hash(p)&&hash(e.rights)===hash(p.rights),'source_policy_mismatch');requireUses(p,uses,at);
}
export function admitFixturePrice(e:PriceEvidence,p:SourcePolicy,c:CalendarEvidence,configuration:Configuration,at:string):SimulatorAdmission {
  evidenceRights(e,p,['automation','internal_calculation','retention'],at);
  ensure(p.id===configuration.marketPolicy.id,'frozen_source_policy_mismatch');
  ensure(e.mode==='synthetic_fixture'&&p.mode==='synthetic_fixture'&&configuration.evidenceMode==='synthetic_fixture','evidence_mode_mismatch');
  ensure(['verified','corrected'].includes(e.quality)&&e.conflictsWith.length===0&&e.value!==null&&e.marketAt!==null,'market_evidence_not_verified');
  ensure(e.adjustment==='raw'&&e.calendarId===c.id&&e.calendarVersion===configuration.calendar.version&&e.calendarVersion===c.calendar.version,'market_policy_mismatch');
  ensure(e.knownAt===(e.sourceAvailableAt??e.retrievedAt),'market_knowledge_mismatch');
  const s=calendarSession(c,e.session),f=configuration.calendar.sessions.find(s=>s.date===e.session);ensure(s&&f&&hash(s)===hash(f),'calendar_mismatch');
  const observation={id:e.id,instrumentId:e.instrumentId,venue:e.venue,currency:e.currency,provider:e.provider,feed:e.feed,field:e.field,value:e.value,adjustment:'raw' as const,
    marketAt:e.marketAt,availableAt:e.knownAt,retrievedAt:e.retrievedAt,session:e.session,calendarVersion:e.calendarVersion,sourceId:e.sourceId,sourceVersion:e.sourceVersion,quality:'verified' as const,correctionOf:e.correctionOf};
  validateObservation(configuration,observation,at);
  return {observation,evidenceId:e.id,knowledgeBasis:e.sourceAvailableAt===null?'first_retrieval':'source_availability'};
}
export function normalizeAction(action:CorporateAction,p:SourcePolicy,retrievedAt:string,source:string,options:{sourceAvailableAt:string|null;recordDate:string|null;declarationDate:string|null;correctionOf:string|null},prior:ActionEvidence[]=[]):ActionEvidence {
  requireUses(p,['automation','internal_calculation','retention'],retrievedAt);sourceReference(source);
  exact(action,['id','providerActionId','provider','instrumentId','sourceVersion','effectiveAt','availableAt','adjustment','quality','kind','numerator','denominator','cashPerShare','paymentAt','newSymbol']);
  [action.id,action.providerActionId,action.instrumentId].forEach(id);integer(action.sourceVersion,1,1000000);
  ensure(action.provider===p.provider&&action.adjustment==='raw'&&action.quality==='verified','action_source_mismatch');
  ensure(['split','dividend','ticker_change','unsupported'].includes(action.kind),'unsupported_action');time(action.effectiveAt);time(retrievedAt);
  ensure(action.availableAt===(options.sourceAvailableAt??retrievedAt)&&time(action.availableAt)<=time(retrievedAt),'action_availability_mismatch');
  for(const date of [options.recordDate,options.declarationDate])if(date!==null)time(date);
  if(action.kind==='split'){ensure(typeof action.numerator==='string'&&/^[1-9]\d{0,11}$/.test(action.numerator)&&typeof action.denominator==='string'&&/^[1-9]\d{0,11}$/.test(action.denominator),'invalid_split');}
  else ensure(action.numerator===null&&action.denominator===null,'unexpected_split');
  if(action.kind==='dividend'){positive(action.cashPerShare!);if(action.paymentAt!==null)ensure(time(action.paymentAt)>=time(action.effectiveAt),'invalid_payment_date');}
  else ensure(action.cashPerShare===null&&action.paymentAt===null,'unexpected_dividend');
  if(action.kind==='ticker_change')ensure(typeof action.newSymbol==='string'&&/^[A-Z][A-Z0-9.-]{0,19}$/.test(action.newSymbol),'invalid_symbol');
  else ensure(action.newSymbol===null,'unexpected_symbol');
  if(options.correctionOf!==null){const old=prior.find(a=>a.id===options.correctionOf);ensure(old&&old.policyId===p.id&&old.action.instrumentId===action.instrumentId&&old.action.providerActionId===action.providerActionId&&old.action.sourceVersion<action.sourceVersion,'action_correction_mismatch');}
  const fields={mode:p.mode,policyId:p.id,policyHash:hash(p),action:structuredClone(action),retrievedAt,...options,source,rights:structuredClone(p.rights)};
  return {id:immutableIdentity('marketaction',fields),...fields};
}
export function admitFixtureAction(e:ActionEvidence,p:SourcePolicy,at:string):CorporateAction {
  evidenceRights(e,p,['automation','internal_calculation','retention'],at);ensure(e.mode==='synthetic_fixture'&&p.mode==='synthetic_fixture','evidence_mode_mismatch');
  ensure(e.correctionOf===null,'action_correction_requires_reconciliation');ensure(time(e.retrievedAt)<=time(at),'future_action');return structuredClone(e.action);
}
