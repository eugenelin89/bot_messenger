import { ensure } from '../investment/arithmetic.js';
import { canonical, date, exact, hash, time } from '../investment/identity.js';
import { calendarSession } from './calendar.js';
import { bytesHash, immutableIdentity } from './validation.js';
import type { CalendarEvidence, InstrumentIdentity, SourcePolicy } from './types.js';
import { FINANCIAL_SCHEMA, fundamentalFields, PYTHON_VERSION, YAHOO_ADAPTER, YFINANCE_VERSION, yahooSettings,
  type FinancialIssue, type FinancialObservation, type FinancialRecord, type FinancialRequest, type YahooAdapterOutput } from './financial.js';

/** Decimal representation of the library's binary64 value; no invented precision or rounding. */
export function financialDecimal(value: unknown, issues: FinancialIssue[]): string | null {
  if (value === null) { issues.push('missing'); return null; }
  if (value === 'NaN') { issues.push('nan'); return null; }
  ensure(typeof value === 'string' && value.length <= 80, 'financial_numeric_schema');
  const match = /^(-?)(\d{1,30})(?:\.(\d{1,30}))?(?:[eE]([+-]?\d{1,2}))?$/.exec(value);
  ensure(match, 'financial_numeric_schema');
  const exponent = Number(match[4] ?? 0); ensure(Math.abs(exponent) <= 20, 'financial_numeric_range');
  const digits = match[2]! + (match[3] ?? ''), position = match[2]!.length + exponent;
  let result = position <= 0 ? `0.${'0'.repeat(-position)}${digits}` : position >= digits.length ? digits + '0'.repeat(position - digits.length) : `${digits.slice(0,position)}.${digits.slice(position)}`;
  result = result.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  ensure(result.length <= 60, 'financial_numeric_range');
  return `${match[1] === '-' && /[1-9]/.test(result) ? '-' : ''}${result}`;
}
function scaled(value: string): bigint { const [whole, fraction = ''] = value.split('.'); ensure(fraction.length <= 30, 'financial_numeric_precision'); return BigInt(`${whole}${fraction.padEnd(30,'0')}`); }
function text(value: unknown, max = 200): string { ensure(typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f]/.test(value), 'financial_text_schema'); return value; }
function object(value: unknown): Record<string,unknown> { ensure(value !== null && typeof value === 'object' && !Array.isArray(value), 'financial_object_schema'); return value as Record<string,unknown>; }
function list(value: unknown, max: number): unknown[] { ensure(Array.isArray(value) && value.length <= max, 'financial_rows'); return value; }
function event(value: unknown, timezone: string): { at: string; session: string } {
  const original = text(value, 40); ensure(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?[+-]\d\d:\d\d$/.test(original), 'financial_timezone');
  const millis = Date.parse(original); ensure(Number.isFinite(millis), 'financial_timestamp');
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(millis));
  const get = (name:string) => parts.find(p=>p.type===name)!.value;
  const session = `${get('year')}-${get('month')}-${get('day')}`;
  ensure(`${session}T${get('hour')}:${get('minute')}:${get('second')}` === original.slice(0,19), 'financial_timezone_offset');
  date(session); return {at:new Date(millis).toISOString(),session};
}
export interface NormalizeFinancialInput {
  body: string; request: FinancialRequest; requestKey: string; policy: SourcePolicy; instrument: InstrumentIdentity;
  symbol: string; calendar: CalendarEvidence; retrievedAt: string; normalizedAt: string;
  rawResponses: FinancialObservation['rawResponses']; previous: FinancialObservation | null;
}
export function normalizeFinancial(x: NormalizeFinancialInput): FinancialObservation {
  const { request:r, policy:p, instrument:i, calendar:c } = x;
  const a = JSON.parse(x.body) as YahooAdapterOutput;
  exact(a,['protocol','versions','symbol','dataClass','currency','timezone','exchange','data','settings']);
  exact(a.versions,['python','yfinance']);
  ensure(a.protocol === YAHOO_ADAPTER && a.versions.python === PYTHON_VERSION && a.versions.yfinance === YFINANCE_VERSION, 'financial_version_mismatch');
  ensure(a.symbol === x.symbol && a.dataClass === r.dataClass, 'financial_identity_mismatch');
  ensure(hash(a.settings) === hash(yahooSettings), 'financial_adjustment_mismatch');
  ensure(a.currency === i.currency, 'financial_currency_mismatch');
  ensure(a.timezone === 'America/New_York', 'financial_timezone');
  ensure((i.venue === 'XNAS' ? ['NMS','NGM','NCM','NASDAQ'] : i.venue === 'ARCX' ? ['PCX','NYSEArca','NYSE ARCA'] : ['NYQ','NYSE']).includes(a.exchange!), 'financial_venue_mismatch');
  time(x.retrievedAt); ensure(time(x.normalizedAt) >= time(x.retrievedAt), 'financial_clock_reversal');
  const records: FinancialRecord[] = [], issues: FinancialIssue[] = ['unknown_availability'];
  const missingSessions:string[]=[];
  if (r.dataClass === 'ohlcv' || r.dataClass === 'actions') {
    ensure(r.start!>=c.validFrom&&new Date(time(`${r.end}T00:00:00Z`)-86400000).toISOString().slice(0,10)<=c.validThrough,'financial_calendar_coverage');
    const data = object(a.data); exact(data,['columns','rows']);
    const expected = ['Open','High','Low','Close','Adj Close','Volume','Dividends','Stock Splits'];
    ensure(hash(data.columns) === hash(expected), 'financial_columns_changed');
    const seen = new Set<string>();
    for (const raw of list(data.rows, 366)) {
      const row = object(raw); exact(row,['index','providerTimestamp','dividend','split','values']);
      const { session } = event(row.index,a.timezone); const at=text(row.providerTimestamp,30);time(at);
      ensure(new Intl.DateTimeFormat('en-CA',{timeZone:a.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))===session,'financial_event_session'); ensure(!seen.has(session), 'financial_duplicate_bar'); seen.add(session);
      ensure(session >= r.start! && session < r.end!, 'financial_bar_outside_request');
      const sessionInfo = calendarSession(c,session); ensure(sessionInfo?.status === 'open', 'financial_calendar_mismatch');
      const values = list(row.values,expected.length); ensure(values.length === expected.length, 'financial_columns_changed');
      const rowIssues: FinancialIssue[] = [];
      const numbers = values.map(v=>financialDecimal(v,rowIssues));
      const [open,high,low,close,adjustedClose,volume,dividend,split] = numbers as (string|null)[];
      for (const n of [open,high,low,close,adjustedClose]) if(n!==null) ensure(scaled(n!)>0n,'financial_nonpositive_price');
      if(high!==null&&low!==null) ensure(scaled(high!)>=scaled(low!),'financial_ohlc_order');
      for(const n of [open,close]) if(n!==null&&low!==null&&high!==null) ensure(scaled(n!)>=scaled(low!)&&scaled(n!)<=scaled(high!),'financial_ohlc_order');
      if(volume!==null) ensure(/^\d+$/.test(volume!),'financial_volume');
      for(const n of [dividend,split]) if(n!==null) ensure(scaled(n!)>=0n,'financial_action_value');
      const complete = time(x.retrievedAt) >= time(sessionInfo.close) && [open,high,low,close,volume].every(v=>v!==null);
      if(!complete) rowIssues.push('partial');
      if(r.dataClass === 'ohlcv') {
        rowIssues.push('unqualified_adjustment');
        records.push({kind:'ohlcv',session,providerEventAt:at,sessionCloseAt:sessionInfo.close,open:open!,high:high!,low:low!,close:close!,adjustedClose:adjustedClose!,volume:volume!,volumeUnit:'shares',complete,issues:[...new Set(rowIssues)]});
      } else {
        const actionTime=(metadata:unknown,kind:'dividend'|'split')=>{
          const v=object(metadata);exact(v,kind==='dividend'?['timestamp','currency']:['timestamp']);const stamp=text(v.timestamp,30);time(stamp);
          ensure(new Intl.DateTimeFormat('en-CA',{timeZone:a.timezone!,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(stamp))===session,'financial_action_session');return {v,stamp};
        };
        // Zero means this adapter row reports no action, never complete corporate-action coverage.
        if(dividend !== null && dividend !== '0'){
          const {v,stamp}=actionTime(row.dividend,'dividend');ensure(v.currency===null||typeof v.currency==='string'&&/^[A-Z]{3}$/.test(v.currency),'financial_action_currency');
          records.push({kind:'dividend',effectiveDate:session,providerEventAt:stamp,ratio:null,amount:dividend!,currency:v.currency as string|null,declarationDate:null,recordDate:null,paymentDate:null,paymentAt:null,issues:['incomplete_actions',...rowIssues,...(v.currency===null?['unknown_unit' as const]:[])]});
        }else ensure(row.dividend===null,'financial_action_mismatch');
        if(split !== null && split !== '0'){const {stamp}=actionTime(row.split,'split');records.push({kind:'split',effectiveDate:session,providerEventAt:stamp,ratio:split!,amount:null,currency:null,declarationDate:null,recordDate:null,paymentDate:null,paymentAt:null,issues:['incomplete_actions',...rowIssues]});}
        else ensure(row.split===null,'financial_action_mismatch');
        issues.push(...rowIssues,'incomplete_actions');
      }
    }
    for(const session of c.calendar.sessions)if(session.status==='open'&&session.date>=r.start!&&session.date<r.end!&&time(session.close)<=time(x.retrievedAt)&&!seen.has(session.date))missingSessions.push(session.date);
    if(missingSessions.length)issues.push('missing','partial');
    if(r.dataClass==='ohlcv') issues.push('unqualified_adjustment');
    else issues.push('incomplete_actions');
  } else if (r.dataClass === 'fundamentals') {
    const metadata=object(a.data);exact(metadata,['values','quoteCurrency','reportingCurrency']);
    const data=object(metadata.values);exact(data,r.fields);
    const currency=(value:unknown):string|null=>{if(value===null)return null;ensure(typeof value==='string'&&/^[A-Z]{3}$/.test(value),'financial_currency_schema');return value;};
    const quoteCurrency=currency(metadata.quoteCurrency),reportingCurrency=currency(metadata.reportingCurrency);
    ensure(quoteCurrency===null||quoteCurrency===i.currency,'financial_quote_currency_mismatch');
    for (const field of r.fields) {
      const rowIssues: FinancialIssue[] = [], unit = fundamentalFields[field as keyof typeof fundamentalFields];
      let value:string|null;
      if(unit==='text') { value = data[field] === null ? null : text(data[field],1000); if(value === null) rowIssues.push('missing'); }
      else value = financialDecimal(data[field],rowIssues);
      const qualifiedUnit=unit==='quote_currency'?quoteCurrency:unit==='reporting_currency'?reportingCurrency:unit;
      if(qualifiedUnit===null)rowIssues.push('unknown_unit');
      records.push({kind:'fundamental',field,value,unit:qualifiedUnit??'unqualified',reportingPeriodEnd:null,providerEventAt:null,issues:rowIssues});
    }
  } else {
    const data = object(a.data); exact(data,['columns','rows']);
    const columns = list(data.columns, r.frequency==='annual'?4:5).map(v=>{const d=text(v,10);date(d);ensure(d<=x.retrievedAt.slice(0,10),'financial_future_period');return d;});
    ensure(new Set(columns).size===columns.length,'financial_duplicate_period');
    const labels = new Set<string>();
    for (const raw of list(data.rows,300)) {
      const row=object(raw);exact(row,['label','values']); const field=text(row.label,100);ensure(!labels.has(field),'financial_duplicate_metric');labels.add(field);
      const values=list(row.values,columns.length);ensure(values.length===columns.length,'financial_columns_changed');
      columns.forEach((period,index)=>{const rowIssues:FinancialIssue[]=['unknown_unit'];const value=financialDecimal(values[index],rowIssues);
        records.push({kind:'statement',statement:r.statement!,frequency:r.frequency!,reportingPeriodEnd:period,field,value,unit:'unqualified',releaseAt:null,filingAt:null,issues:rowIssues});});
    }
    issues.push('unknown_unit');
  }
  if(records.length===0) issues.push('missing');
  issues.push(...records.flatMap(r=>r.issues));
  // Content excludes retrieval times and credentials. Changed snapshots append a new local revision.
  const contentHash=hash({adapterOutput:x.body,rawResponses:x.rawResponses.map(v=>({endpoint:v.endpoint,parameters:v.parameters,sha256:v.sha256}))});
  if(x.previous?.contentHash===contentHash) return x.previous;
  const revision=(x.previous?.localRevision??0)+1;
  return {id:immutableIdentity('financial',[x.requestKey,revision,contentHash]),schemaVersion:FINANCIAL_SCHEMA,adapter:YAHOO_ADAPTER,mode:p.mode,provider:'yahoo',feed:'yfinance',
    policyId:p.id,policyHash:hash(p),instrumentId:i.id,instrumentHash:hash(i),calendarId:c.id,calendarHash:hash(c),request:structuredClone(r),requestKey:x.requestKey,
    symbol:x.symbol,venue:i.venue,currency:i.currency,timezone:a.timezone,providerId:null,providerVersion:null,localRevision:revision,predecessorId:x.previous?.id??null,
    firstRetrievedAt:x.retrievedAt,normalizedAt:x.normalizedAt,providerAvailableAt:null,knownAt:x.retrievedAt,contentHash,adapterOutput:x.body,adapterOutputHash:bytesHash(x.body),
    rawResponses:structuredClone(x.rawResponses),rawEvidence:'bounded_transport_bodies_and_processed_adapter_output',numericSemantics:'library_binary64_decimal_strings',
    adjustment:'provider_split_basis_unqualified',executionQualified:false,audience:'private_research',versions:a.versions,records,issues:[...new Set(issues)],missingSessions,rights:structuredClone(p.rights)};
}
/** Validate persisted originals before any use; hashes are integrity checks, not upstream authenticity. */
export function verifyFinancialObservation(e: FinancialObservation): void {
  ensure(e.schemaVersion===FINANCIAL_SCHEMA&&e.adapter===YAHOO_ADAPTER&&e.executionQualified===false&&e.audience==='private_research','financial_record_type');
  ensure(e.knownAt===e.firstRetrievedAt&&e.providerAvailableAt===null&&bytesHash(e.adapterOutput)===e.adapterOutputHash,'financial_provenance');
  ensure(e.rawResponses.every(r=>bytesHash(r.body)===r.sha256&&time(r.retrievedAt)<=time(e.firstRetrievedAt)),'financial_raw_integrity');
  canonical(e);
}
