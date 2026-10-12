import type { FinancialObservation, FinancialResult } from '../../domain/market/financial.js';

/** Zero reported actions over complete validated daily coverage is a result, not permission
 * to fabricate actions or claim complete corporate-action coverage. Other missing results stop. */
export function probeMayContinue(result: FinancialResult, e: FinancialObservation | null): boolean {
  if(result.status==='ok')return true;
  return result.status==='missing'&&e!==null&&e.request.dataClass==='actions'&&e.records.length===0&&e.missingSessions.length===0&&
    e.issues.every(issue=>['unknown_availability','incomplete_actions','missing'].includes(issue));
}

/** Data-quality inspection only; never returns prices, metric values or raw provider prose. */
export function inspectYahooObservation(observation: FinancialObservation) {
  const e = observation;
  const records = e.records;
  const statements = records.filter(r => r.kind === 'statement');
  const bars = records.filter(r => r.kind === 'ohlcv');
  const periods = [...new Set(statements.map(r => r.reportingPeriodEnd))].sort();
  const rawCurrencies = new Set<string>(); let providerTimestampFields = 0;
  function inspect(value: unknown, depth = 0): void {
    if(depth > 20 || value === null || typeof value !== 'object')return;
    if(Array.isArray(value)){for(const entry of value)inspect(entry,depth+1);return;}
    for(const [key,entry] of Object.entries(value)){
      if(['timestamp','regularMarketTime','firstTradeDate','asOfDate'].includes(key))providerTimestampFields++;
      if(['currency','currencyCode','financialCurrency'].includes(key)&&typeof entry==='string'&&/^[A-Z]{3}$/.test(entry))rawCurrencies.add(entry);
      inspect(entry,depth+1);
    }
  }
  for(const raw of e.rawResponses)inspect(JSON.parse(raw.body));
  return {
    dataClass: e.request.dataClass, statement: e.request.statement, frequency: e.request.frequency,
    records: records.length, rawResponses: e.rawResponses.length,
    missingSessionCount: e.missingSessions.length, issues: e.issues, currency: e.currency, venue: e.venue,
    timezone: e.timezone, adjustment: e.adjustment, executionQualified: e.executionQualified,
    firstRetrievedAt: e.firstRetrievedAt, normalizedAt: e.normalizedAt, providerAvailableAt: e.providerAvailableAt,
    rawRetrievedAt: e.rawResponses.map(r => r.retrievedAt),
    sessionCoverage: { count: bars.length, first: bars.at(0)?.session??null, last: bars.at(-1)?.session??null },
    providerTimestampFields, rawReportedCurrencies:[...rawCurrencies],
    incompleteBars: bars.filter(r => !r.complete).length,
    fiscalPeriodCoverage:{count:periods.length,first:periods.at(0)??null,last:periods.at(-1)??null},
    fieldCount: new Set(records.flatMap(r => r.kind === 'statement' || r.kind === 'fundamental' ? [r.field] : [])).size,
    missingValues: records.reduce((n, r) => n + (r.kind === 'statement' || r.kind === 'fundamental' ? Number(r.value === null || r.value === 'NaN') :
      r.kind === 'ohlcv' ? [r.open, r.high, r.low, r.close, r.adjustedClose, r.volume].filter(v => v === null || v === 'NaN').length : 0), 0),
    units: [...new Set(records.flatMap(r => r.kind === 'statement' || r.kind === 'fundamental' ? [r.unit] : r.kind === 'ohlcv' ? [r.volumeUnit] : []))],
    actionCount: records.filter(r=>r.kind==='dividend'||r.kind==='split').length,
    actionReleaseAndPaymentTimes:'unknown',
    privateResearch: 'owner_inspection_only_no_employee_delivery', historicalSimulation: 'blocked_no_original_point_in_time_availability',
    observedFills: 'blocked_unqualified_adjustment_and_unapproved_method', publicDisplay: 'blocked_no_rights',
  };
}
