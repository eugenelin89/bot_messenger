import {ensure,divideEven,format,SCALE} from '../investment/arithmetic.js';
import {hash,time} from '../investment/identity.js';
import type {Configuration,CorporateAction} from '../investment/types.js';
import type {FinancialObservation,ResearchBar} from './financial.js';
import {verifyFinancialObservation,financialDecimal} from './financial-normalize.js';
import type {PriceEvidence,SourcePolicy} from './types.js';

export const marketDay=(at:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
/** Explicit half-even conversion of the provider/parser decimal, never binary arithmetic in books. */
export function paperDecimal(value:string){
 ensure(/^\d{1,12}(\.\d{1,30})?$/.test(value),'observed_decimal_invalid');
 const [whole,fraction='']=value.split('.');
 return format(divideEven(BigInt(whole!+fraction)*SCALE,10n**BigInt(fraction.length)));
}
export interface ObservedQualification {methodology:'inv-real-open-v1';session:string;qualified:boolean;reasons:string[];prices:PriceEvidence[];actions:CorporateAction[];providerEventAt:string|null;basis:string;responseHash:string|null}

/** Historical Yahoo bars stay research-only. This prospective method admits only an immutable
 * same-session capture of quote OHLC after regular close, with a matching provider period.
 * It models a daily OPEN reference, not an executable quote or independent exchange verification. */
export function qualifyObservedPaper(e:FinancialObservation,c:Configuration,p:SourcePolicy,session:string,prior:PriceEvidence[]):ObservedQualification {
 verifyFinancialObservation(e);
 ensure(c.methodology==='inv-real-open-v1'&&e.policyId===p.id&&e.policyHash===hash(p)&&e.mode===c.evidenceMode,'observed_source_mismatch');
 const result:ObservedQualification={methodology:'inv-real-open-v1',session,qualified:false,reasons:[],prices:[],actions:[],providerEventAt:null,basis:'contemporaneous regular-session quote OHLC; retain this vintage before any later split adjustment',responseHash:e.rawResponses[0]?.sha256??null};
 const fail=(reason:string)=>{result.reasons.push(reason);return result;};
 const s=c.calendar.sessions.find(s=>s.date===session&&s.status==='open');
 if(!s)return fail('session_outside_frozen_calendar');
 const bar=e.records.find((r):r is ResearchBar=>r.kind==='ohlcv'&&r.session===session);
 if(!bar)return fail('missing_session');
 result.providerEventAt=bar.providerEventAt;
 if(marketDay(e.firstRetrievedAt)!==session||time(e.firstRetrievedAt)<time(s.close))return fail('historical_or_incomplete_session_basis_unqualified');
 if(!bar.complete||e.missingSessions.length||bar.issues.some(i=>!['unknown_availability','unqualified_adjustment'].includes(i)))return fail('incomplete_source_coverage');
 if(!bar.providerEventAt||time(bar.providerEventAt)!==time(s.open))return fail('provider_event_does_not_match_regular_open');
 if(e.rawResponses.length!==1)return fail('direct_original_required');
 const raw=JSON.parse(e.rawResponses[0]!.body) as {chart?:{error?:unknown;result?:Array<{meta?:Record<string,any>;timestamp?:number[];indicators?:{quote?:Array<Record<string,unknown[]>>};events?:Record<string,Record<string,any>>}>}};
 const chart=raw.chart?.result?.[0],meta=chart?.meta,period=meta?.currentTradingPeriod?.regular;
 if(raw.chart?.error||raw.chart?.result?.length!==1||meta?.symbol!==e.symbol||meta?.currency!=='USD'||meta?.exchangeTimezoneName!=='America/New_York'||!['EQUITY','ETF'].includes(meta?.instrumentType)||period?.start*1000!==time(s.open)||period?.end*1000!==time(s.close))return fail('current_provider_regular_period_unqualified');
 const index=chart?.timestamp?.indexOf(time(s.open)/1000)??-1,quote=chart?.indicators?.quote?.[0];
 if(index<0||!quote)return fail('original_quote_missing');
 for(const field of ['open','high','low','close','volume'] as const){const v=quote[field]?.[index];if(typeof v!=='number'||!Number.isFinite(v)||financialDecimal(String(v),[])!==bar[field])return fail('original_quote_parser_mismatch');}
 const events=chart?.events??{};
 if(Object.keys(events).some(k=>!['splits','dividends'].includes(k)&&Object.keys(events[k]??{}).length))return fail('unsupported_corporate_action');
 for(const kind of ['splits','dividends'] as const)for(const [key,a] of Object.entries(events[kind]??{})){
  if(!Number.isSafeInteger(a.date))return fail('invalid_action_time');
  const effectiveDate=marketDay(new Date(a.date*1000).toISOString()),as=c.calendar.sessions.find(s=>s.date===effectiveDate);
  if(!as||time(as.open)<time(c.startsAt))continue;
  if(effectiveDate>session)return fail('future_action_basis_unqualified');
  if(kind==='splits'&&(!Number.isSafeInteger(a.numerator)||!Number.isSafeInteger(a.denominator)||a.numerator<1||a.denominator<1))return fail('split_ratio_unqualified');
  if(kind==='dividends'&&(typeof a.amount!=='number'||!Number.isFinite(a.amount)||a.amount<=0))return fail('dividend_amount_unqualified');
  const providerActionId=`yahoo_${e.instrumentId}_${kind}_${key}`;
  result.actions.push({id:'action_'+hash([providerActionId,a]),providerActionId,provider:'yahoo',instrumentId:e.instrumentId,sourceVersion:1,effectiveAt:as.open,availableAt:e.firstRetrievedAt,adjustment:'raw',quality:'verified',kind:kind==='splits'?'split':'dividend',numerator:kind==='splits'?String(a.numerator):null,denominator:kind==='splits'?String(a.denominator):null,cashPerShare:kind==='dividends'?paperDecimal(financialDecimal(String(a.amount),[])!):null,paymentAt:null,newSymbol:null});
 }
 for(const field of ['regular_open','regular_close'] as const){
  const value=paperDecimal((field==='regular_open'?bar.open:bar.close)!);
  const old=prior.filter(p=>p.instrumentId===e.instrumentId&&p.session===session&&p.field===field&&p.policyId===e.policyId).at(-1);
  if(old?.value===value){result.prices.push(old);continue;}
  const fields={mode:e.mode,policyId:p.id,policyHash:hash(p),instrumentId:e.instrumentId,symbol:e.symbol,venue:e.venue,currency:'USD' as const,provider:'yahoo',feed:'yfinance',field,value,adjustment:'raw' as const,session,calendarId:e.calendarId,calendarVersion:c.calendar.version,marketAt:field==='regular_open'?s.open:s.close,sourceAvailableAt:null,retrievedAt:e.firstRetrievedAt,knownAt:e.firstRetrievedAt,sourceId:old?.sourceId??('yahoo_'+hash([p.id,e.instrumentId,session,field])),sourceVersion:(old?.sourceVersion??0)+1,responseHash:e.rawResponses[0]!.sha256,quality:old?'corrected' as const:'verified' as const,correctionOf:old?.id??null,conflictsWith:[],rights:p.rights};
  result.prices.push({id:'observedprice_'+hash(fields),...fields});
 }
 result.qualified=true;return result;
}
