import { randomUUID } from 'node:crypto';
import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, time } from '../../domain/investment/identity.js';
import { scheduledCalendar2026 } from '../../domain/market/calendar.js';
import { FINANCIAL_SCHEMA, yahooSettings, type FinancialRequest, type FinancialScope, type YahooQuery } from '../../domain/market/financial.js';
import { uses, type InstrumentIdentity, type SourcePolicy } from '../../domain/market/types.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';

export const HISTORY_ID = 'HQ-READY-03E';
export const historyLimits = Object.freeze({ requests: 6, responseBytes: 262144, totalBytes: 1048576,
  intervalMs: 5000, wireMs: 10000, operationMs: 120000, processMs: 180000, approvalMs: 600000 });
export function historyManifest(preparedAt: string, sourceHash: string, approvalId: string = randomUUID()) {
  ensure(/^[a-f0-9]{64}$/.test(sourceHash) && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(approvalId), 'probe_manifest_identity');
  const expiresAt = new Date(time(preparedAt) + historyLimits.approvalMs).toISOString();
  const calendar = scheduledCalendar2026();
  calendar.id = calendar.calendar.version = 'us-equities-2026-hq-ready-03e'; calendar.reviewedAt = preparedAt;
  const instrument: InstrumentIdentity = { id: 'AAPL-XNAS-USD', venue: 'XNAS', currency: 'USD',
    source: 'https://investor.apple.com/faq/default.aspx', symbols: [{ symbol: 'AAPL', from: '2026-09-01', until: null }] };
  const policy: SourcePolicy = { id: 'yahoo-hq-ready-03e', version: 1, provider: 'yahoo', feed: 'yfinance', mode: 'observed',
    incrementalCost: '0', reviewedAt: preparedAt, expiresAt,
    rights: Object.fromEntries(uses.map(use => [use, {
      status: ['automation', 'internal_calculation', 'retention'].includes(use) ? 'allowed' : 'denied',
      evidence: ['https://github.com/eugenelin89/bot_messenger/blob/main/docs/decisions/decision_041_one_shot_aapl_history.md'],
      note: 'Owner-authorized HQ-READY-03E bounded personal non-commercial test; owner-reported Yahoo verbal permission, not independently verified. Immediate private destruction; no employee or public rights.',
    }])) as SourcePolicy['rights'], attribution: 'Yahoo Finance via pinned yfinance1.7.0; one private AAPL history qualification',
    maxObservationAgeMs: 86400000, maxRequests: 6, minIntervalMs: 5000, cacheMs: 0, timeoutMs: 10000, maxBytes: 262144 };
  const scope: FinancialScope = { id: HISTORY_ID, mode: 'observed', policyIds: [policy.id], instrumentIds: [instrument.id], calendarId: calendar.id,
    approvedAt: preparedAt, expiresAt, maxRequests: 6, minIntervalMs: 5000, maxResponseBytes: 262144, maxTotalBytes: 1048576, timeoutMs: 120000, maxRetries: 0 };
  const read: FinancialRequest = { schemaVersion: FINANCIAL_SCHEMA, instrumentId: instrument.id, dataClass: 'ohlcv',
    start: '2026-09-01', end: '2026-10-01', interval: '1d', statement: null, frequency: null, fields: [], adjustment: 'yahoo_unrepaired' };
  const cookie: YahooQuery = { method: 'GET', url: 'https://fc.yahoo.com/', params: {} };
  // Audited pinned library sequence. Bootstrap repetitions follow successful responses only;
  // no failed request is retried. Crumb values are transient, never part of this manifest.
  const sequence: YahooQuery[] = [cookie, structuredClone(cookie),
    { method: 'GET', url: 'https://query1.finance.yahoo.com/v1/test/getcrumb', params: {} },
    { method: 'GET', url: 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL', params: { range: '1d', interval: '1d' } },
    structuredClone(cookie),
    { method: 'GET', url: 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL', params: {
      period1: 1788235200, period2: 1790827200, interval: '1d', includePrePost: false, events: 'div,splits,capitalGains' } }];
  return { id: HISTORY_ID, version: 1, approvalId, preparedAt, expiresAt, sourceHash,
    permission: 'owner_reported_verbal_personal_use_exact_bounded_test_not_independently_verified',
    retention: 'immediate_crypto_erasure_and_capsule_deletion', limits: historyLimits,
    adapterProfile: 'hq-ready-03e-query1-only', settings: yahooSettings, policy, instrument, calendar, scope, reads: [read], sequence };
}
export type YahooHistoryManifest = Omit<ReturnType<typeof historyManifest>, 'limits'> & { limits: Readonly<{ [K in keyof typeof historyLimits]: number }> };
export function verifyHistoryManifest(m: YahooHistoryManifest): void {
  ensure(canonical(m) === canonical(historyManifest(m.preparedAt, m.sourceHash, m.approvalId)), 'probe_manifest_mismatch');
}
export function qualifyHistoryQuery(m: YahooHistoryManifest, request: FinancialRequest, query: YahooQuery, ordinal: number) {
  ensure(hash(request) === hash(m.reads[0]) && Number.isSafeInteger(ordinal) && ordinal >= 1 && ordinal <= 6, 'probe_logical_scope');
  const qualified = qualifyYahooQuery(query, request, 'AAPL');
  const expected = qualifyYahooQuery(m.sequence[ordinal - 1]!, request, 'AAPL');
  ensure(hash(qualified) === hash(expected), 'probe_history_sequence');
  // The generic qualifier redacts credentials. Only the two chart requests may carry a crumb.
  const url = new URL(query.url), crumbs = [...url.searchParams.keys()].filter(k => k === 'crumb').length + Number(Object.hasOwn(query.params, 'crumb'));
  ensure(crumbs === ([4, 6].includes(ordinal) ? 1 : 0), 'probe_history_crumb');
  return qualified;
}
