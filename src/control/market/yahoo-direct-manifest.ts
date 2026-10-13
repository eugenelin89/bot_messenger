import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash } from '../../domain/investment/identity.js';
import type { FinancialRequest, YahooQuery } from '../../domain/market/financial.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import { historyManifest, historyLimits, type YahooHistoryManifest } from './yahoo-history-manifest.js';

export const DIRECT_ID = 'HQ-READY-03H';
export const directLimits = Object.freeze({ ...historyLimits, requests: 1, totalBytes: 262144 });
export function directManifest(preparedAt: string, sourceHash: string, approvalId?: string): YahooHistoryManifest {
  const m: YahooHistoryManifest = historyManifest(preparedAt, sourceHash, approvalId);
  m.id = m.scope.id = DIRECT_ID;
  m.policy.id = 'yahoo-hq-ready-03h'; m.scope.policyIds = [m.policy.id];
  m.calendar.id = m.calendar.calendar.version = m.scope.calendarId = 'us-equities-2026-hq-ready-03h';
  m.adapterProfile = 'hq-ready-03h-direct-chart';
  m.limits = directLimits;
  m.policy.maxRequests = m.scope.maxRequests = 1; m.scope.maxTotalBytes = 262144;
  m.sequence = [m.sequence[5]!];
  for (const right of Object.values(m.policy.rights)) {
    right.evidence = ['https://github.com/eugenelin89/bot_messenger/blob/main/docs/decisions/decision_044_one_shot_direct_yahoo_chart.md'];
    right.note = 'Owner-authorized HQ-READY-03H single direct anonymous chart GET and immediate private destruction. Yahoo verbal personal-use permission is owner-reported, not independently verified. No employee/public rights.';
  }
  m.policy.attribution = 'Yahoo Finance via pinned yfinance1.7.0 captured-chart parsing; one private AAPL qualification';
  return m;
}
export function verifyDirectManifest(m: YahooHistoryManifest): void {
  ensure(canonical(m) === canonical(directManifest(m.preparedAt, m.sourceHash, m.approvalId)), 'probe_manifest_mismatch');
}
export function qualifyDirectQuery(m: YahooHistoryManifest, request: FinancialRequest, query: YahooQuery, ordinal: number) {
  ensure(ordinal === 1 && hash(request) === hash(m.reads[0]), 'probe_logical_scope');
  const qualified = qualifyYahooQuery(query, request, 'AAPL');
  ensure(hash(qualified) === hash(qualifyYahooQuery(m.sequence[0]!, request, 'AAPL')), 'probe_direct_sequence');
  ensure(!new URL(query.url).searchParams.has('crumb') && !Object.hasOwn(query.params, 'crumb'), 'probe_direct_credentials');
  return qualified;
}
