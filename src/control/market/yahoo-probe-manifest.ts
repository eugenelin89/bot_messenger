import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, time } from '../../domain/investment/identity.js';
import { scheduledCalendar2026 } from '../../domain/market/calendar.js';
import { FINANCIAL_SCHEMA, fundamentalFields, type FinancialRequest, type FinancialScope, type YahooQuery } from '../../domain/market/financial.js';
import { uses, type InstrumentIdentity, type SourcePolicy } from '../../domain/market/types.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import { yahooStatementFields } from '../../domain/market/yahoo-statement-fields.js';

export const PROBE_ID = 'HQ-READY-03B';
export function probeManifest(preparedAt: string, sourceHash: string) {
  const start = time(preparedAt), expiresAt = new Date(start + 600000).toISOString();
  ensure(/^[a-f0-9]{64}$/.test(sourceHash), 'probe_source_identity');
  const day = Math.floor(start / 86400000) * 86400;
  const calendar = scheduledCalendar2026();
  calendar.id = calendar.calendar.version = 'us-equities-2026-hq-ready-03b';
  calendar.reviewedAt = preparedAt;
  const instrument: InstrumentIdentity = { id: 'AAPL-XNAS-USD', venue: 'XNAS', currency: 'USD',
    source: 'https://investor.apple.com/faq/default.aspx', symbols: [{ symbol: 'AAPL', from: '2026-09-01', until: null }] };
  const policy: SourcePolicy = { id: 'yahoo-hq-ready-03b', version: 1, provider: 'yahoo', feed: 'yfinance', mode: 'observed',
    incrementalCost: '0', reviewedAt: preparedAt, expiresAt,
    rights: Object.fromEntries(uses.map(use => [use, {
      status: ['automation', 'internal_calculation', 'retention'].includes(use) ? 'allowed' : 'denied',
      evidence: ['https://github.com/eugenelin89/bot_messenger/blob/main/docs/operations/YAHOO_FINANCIAL_GATEWAY.md'],
      note: 'Owner-authorized HQ-READY-03B personal non-commercial test based on owner-reported Yahoo verbal personal-use permission; not independent verification. Immediate private cleanup; no public rights.',
    }])) as SourcePolicy['rights'], attribution: 'Yahoo Finance via yfinance1.7.0; private bounded qualification only',
    maxObservationAgeMs: 86400000, maxRequests: 50, minIntervalMs: 5000, cacheMs: 0, timeoutMs: 10000, maxBytes: 262144 };
  const scope: FinancialScope = { id: PROBE_ID, mode: 'observed', policyIds: [policy.id], instrumentIds: [instrument.id], calendarId: calendar.id,
    approvedAt: preparedAt, expiresAt, maxRequests: 50, minIntervalMs: 5000, maxResponseBytes: 262144, maxTotalBytes: 8388608, timeoutMs: 120000, maxRetries: 2 };
  const base: FinancialRequest = { schemaVersion: FINANCIAL_SCHEMA, instrumentId: instrument.id, dataClass: 'ohlcv',
    start: null, end: null, interval: null, statement: null, frequency: null, fields: [], adjustment: 'yahoo_unrepaired' };
  const reads: FinancialRequest[] = ['ohlcv', 'actions'].map(dataClass => ({ ...base, dataClass: dataClass as 'ohlcv' | 'actions',
    start: '2026-09-01', end: '2026-10-01', interval: '1d' }));
  reads.push({ ...base, dataClass: 'fundamentals', fields: Object.keys(fundamentalFields) });
  for (const statement of ['income', 'balance_sheet', 'cash_flow'] as const)
    for (const frequency of ['annual', 'quarterly'] as const) reads.push({ ...base, dataClass: 'statement', statement, frequency });
  return { id: PROBE_ID, version: 1, preparedAt, expiresAt, sourceHash,
    permission: 'owner_reported_verbal_personal_use_exact_bounded_test_not_independently_verified',
    retention: 'immediate_crypto_erasure_and_capsule_deletion', policy, instrument, calendar, scope, reads,
    wire: { qualifier: 'yahoo-transport-v1-with-probe-intersection', statementFields: yahooStatementFields,
      historyPeriod1: 1788235200, historyPeriod2: 1790827200,
      statementPeriod1: 1483142400, period2: day + 86400, helperPeriod1: day - 182 * 86400 } };
}
export type YahooProbeManifest = ReturnType<typeof probeManifest>;
export function verifyProbeManifest(manifest: YahooProbeManifest): void {
  ensure(canonical(manifest) === canonical(probeManifest(manifest.preparedAt, manifest.sourceHash)), 'probe_manifest_mismatch');
}
export function qualifyProbeQuery(manifest: YahooProbeManifest, request: FinancialRequest, query: YahooQuery) {
  ensure(manifest.reads.some(read => hash(read) === hash(request)), 'probe_logical_scope');
  const qualified = qualifyYahooQuery(query, request, 'AAPL'), p = qualified.params;
  if (qualified.endpoint.endsWith(':chart') && p.range === undefined)
    ensure(p.period1 === String(manifest.wire.historyPeriod1) && p.period2 === String(manifest.wire.historyPeriod2), 'probe_history_epochs');
  if (qualified.endpoint.endsWith(':timeseries')) {
    ensure(p.period2 === String(manifest.wire.period2), 'probe_statement_epochs');
    if (request.dataClass === 'fundamentals') ensure(p.period1 === String(manifest.wire.helperPeriod1) && p.type === 'trailingPegRatio', 'probe_helper_epochs');
    else {
      ensure(p.period1 === String(manifest.wire.statementPeriod1), 'probe_statement_epochs');
      const prefix = request.frequency!, fields = manifest.wire.statementFields[request.statement!];
      const all = fields.map(field => prefix + field);
      // Only the audited full family or the pinned library's 60-field chunks, in original order.
      const sets = [all]; for (let n = 0; n < all.length; n += 60) sets.push(all.slice(n, n + 60));
      ensure(sets.some(set => set.join(',') === p.type), 'probe_statement_fields');
    }
  }
  return qualified;
}
