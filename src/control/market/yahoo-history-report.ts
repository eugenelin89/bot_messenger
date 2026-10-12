import type { FinancialObservation } from '../../domain/market/financial.js';
import type { YahooHistoryManifest } from './yahoo-history-manifest.js';
import { inspectYahooObservation } from './yahoo-probe-report.js';
/** Closed non-data quality projection. Originals and values remain only in encrypted custody/memory. */
export function inspectHistory(e: FinancialObservation, m: YahooHistoryManifest) {
  const bars = e.records.filter(r => r.kind === 'ohlcv');
  const expected = m.calendar.calendar.sessions.filter(s => s.status === 'open' && s.date >= '2026-09-01' && s.date < '2026-10-01');
  const fields = ['open', 'high', 'low', 'close', 'adjustedClose', 'volume'] as const;
  const raw = e.rawResponses.find(r => r.parameters.period1 === '1788235200');
  const chart = raw ? JSON.parse(raw.body)?.chart?.result?.[0] : null;
  const actions = chart?.events;
  const actionSummary = (kind: 'dividends' | 'splits') => {
    const entries: unknown[] = actions?.[kind] && typeof actions[kind] === 'object' && !Array.isArray(actions[kind]) ? Object.values(actions[kind]) : [];
    return { supplied: Boolean(actions && Object.hasOwn(actions, kind)), count: entries.length,
      validEventTimes: entries.filter(v => v && typeof v === 'object' && 'date' in v && Number.isSafeInteger(v.date)).length,
      currencyKnown: kind === 'dividends' ? entries.filter(v => v && typeof v === 'object' && 'currency' in v && typeof v.currency === 'string' && /^[A-Z]{3}$/.test(v.currency)).length : null,
      completeness: 'unproven', publicationAndPaymentTimes: 'unknown' };
  };
  const dividends = actionSummary('dividends'), splits = actionSummary('splits');
  const identity = { symbolMatches: chart?.meta?.symbol === 'AAPL', currencyMatches: chart?.meta?.currency === 'USD',
    listingMatches: ['NMS', 'NGM', 'NCM', 'NASDAQ'].includes(chart?.meta?.exchangeName), commonEquityType: chart?.meta?.instrumentType === 'EQUITY' };
  const regularTimes = bars.filter(b => { const s = expected.find(s => s.date === b.session); return s && Date.parse(b.providerEventAt) >= Date.parse(s.open) && Date.parse(b.providerEventAt) <= Date.parse(s.close); }).length;
  const complete = bars.length === expected.length && !e.missingSessions.length && bars.every(b => b.complete && fields.every(f => b[f] !== null));
  const metadataSufficient = Object.values(identity).every(Boolean) && e.timezone === 'America/New_York' && regularTimes === bars.length && bars.length > 0;
  return { ...inspectYahooObservation(e), actionCount: dividends.count + splits.count, expectedSessions: expected.map(s => s.date), returnedSessions: bars.map(b => b.session).sort(),
    missingSessions: e.missingSessions, fields: Object.fromEntries(fields.map(field => [field, {
      present: bars.filter(b => b[field] !== null).length, missingOrNaN: bars.filter(b => b[field] === null).length,
      missingSessionValues: e.missingSessions.length,
      status: bars.some(b => b[field] === null) || e.missingSessions.length ? 'incomplete' : 'present_in_returned_sample',
    }])),
    identity, regularSessionEventTimes: regularTimes,
    providerEventTimeIsAvailability: false, libraryDailyIndex: 'exchange_midnight_not_provider_publication',
    settings: m.settings, adjustedCloseMeaning: 'provider_adjusted_series_basis_not_independently_verified',
    rawOhlcvMeaning: 'auto_and_back_adjust_disabled_provider_split_basis_still_unqualified',
    actions: { dividends, splits },
    privateHistoricalResearch: metadataSufficient ? (complete ? 'descriptive_sample_with_adjustment_and_availability_limits' : 'incomplete_sample_field_specific_use_only') : 'metadata_unqualified',
    freshness: 'historical_requested_range_not_a_current_quote_or_original_decision_vintage',
    sourceMetadata: 'private_current_retrieval_sample_only_not_historical_decision_evidence',
    calendarLimit: 'scheduled_reference_unexpected_closures_and_halts_unproven',
  };
}
