/** Yahoo research protocol. Deliberately not a simulator Observation or Action. */
import { ensure } from '../investment/arithmetic.js';
import { date, exact, integer, time } from '../investment/identity.js';
import type { SourcePolicy } from './types.js';
export const FINANCIAL_SCHEMA = 'financial-research-v1' as const;
export const YAHOO_ADAPTER = 'yahoo-yfinance-v1' as const;
export const PYTHON_VERSION = '3.12.12';
export const YFINANCE_VERSION = '1.7.0';
export const financialClasses = ['ohlcv', 'fundamentals', 'statement', 'actions'] as const;
export type FinancialClass = typeof financialClasses[number];
export const fundamentalFields = {
  shortName: 'text', longName: 'text', sector: 'text', industry: 'text', country: 'text',
  marketCap: 'quote_currency', totalRevenue: 'reporting_currency', totalDebt: 'reporting_currency', totalCash: 'reporting_currency',
  trailingPE: 'ratio', forwardPE: 'ratio', priceToBook: 'ratio', sharesOutstanding: 'shares',
  profitMargins: 'ratio', revenueGrowth: 'ratio', returnOnEquity: 'ratio',
} as const;
export interface FinancialRequest {
  schemaVersion: typeof FINANCIAL_SCHEMA; instrumentId: string; dataClass: FinancialClass;
  start: string | null; end: string | null; interval: '1d' | null;
  statement: 'income' | 'balance_sheet' | 'cash_flow' | null;
  frequency: 'annual' | 'quarterly' | null; fields: string[];
  adjustment: 'yahoo_unrepaired';
}
export interface FinancialScope {
  id: string; mode: 'synthetic_fixture'; policyIds: string[]; instrumentIds: string[]; calendarId: string;
  approvedAt: string; expiresAt: string; maxRequests: number; minIntervalMs: number;
  maxResponseBytes: number; maxTotalBytes: number; timeoutMs: number; maxRetries: number;
}
export interface YahooQuery { method: 'GET'; url: string; params: Record<string, string | number | boolean>; }
export interface YahooResponse { status: number; body: string; contentType: string; retryAfter: string | null; }
/** Only authored fixture transport can be admitted. The HTTPS implementation remains behind a hard live gate. */
export interface YahooTransport {
  readonly kind: 'authored_yahoo_fixture';
  exchange(query: YahooQuery, signal: AbortSignal, maxBytes: number): Promise<YahooResponse>;
}
export interface YahooAdapterInput { request: FinancialRequest; symbol: string; }
export interface YahooAdapterOutput {
  protocol: typeof YAHOO_ADAPTER;
  versions: { python: string; yfinance: string };
  symbol: string; dataClass: FinancialClass; currency: string | null;
  timezone: string | null; exchange: string | null;
  data: unknown;
  settings: { auto_adjust: false; back_adjust: false; repair: false; rounding: false; actions: true; keepna: true; prepost: false; interval: '1d' };
}
export interface YahooAdapter {
  readonly kind: typeof YAHOO_ADAPTER;
  read(input: YahooAdapterInput, exchange: (query: YahooQuery) => Promise<YahooResponse>, signal: AbortSignal): Promise<string>;
}
export const yahooSettings = { auto_adjust: false, back_adjust: false, repair: false, rounding: false, actions: true, keepna: true, prepost: false, interval: '1d' } as const;
export type FinancialIssue = 'missing' | 'nan' | 'partial' | 'stale' | 'unknown_availability' | 'unqualified_adjustment' | 'incomplete_actions' | 'unknown_unit' | 'unavailable';
export interface ResearchBar {
  kind: 'ohlcv'; session: string; providerEventAt: string; sessionCloseAt: string;
  open: string | null; high: string | null; low: string | null; close: string | null;
  adjustedClose: string | null; volume: string | null; volumeUnit: 'shares';
  complete: boolean; issues: FinancialIssue[];
}
export interface ResearchMetric {
  kind: 'fundamental'; field: string; value: string | null; unit: string;
  reportingPeriodEnd: null; providerEventAt: null; issues: FinancialIssue[];
}
export interface ResearchStatement {
  kind: 'statement'; statement: NonNullable<FinancialRequest['statement']>; frequency: NonNullable<FinancialRequest['frequency']>;
  reportingPeriodEnd: string; field: string; value: string | null; unit: 'unqualified';
  releaseAt: null; filingAt: null; issues: FinancialIssue[];
}
export interface ResearchAction {
  kind: 'split' | 'dividend'; effectiveDate: string; providerEventAt: string;
  ratio: string | null; amount: string | null; currency: string | null;
  declarationDate: null; recordDate: null; paymentDate: null; paymentAt: null;
  issues: FinancialIssue[];
}
export type FinancialRecord = ResearchBar | ResearchMetric | ResearchStatement | ResearchAction;
export interface FinancialObservation {
  id: string; schemaVersion: typeof FINANCIAL_SCHEMA; adapter: typeof YAHOO_ADAPTER;
  mode: SourcePolicy['mode']; provider: 'yahoo'; feed: 'yfinance';
  policyId: string; policyHash: string; instrumentId: string; instrumentHash: string;
  calendarId: string; calendarHash: string; request: FinancialRequest; requestKey: string;
  symbol: string; venue: string; currency: string; timezone: string | null;
  providerId: null; providerVersion: null; localRevision: number; predecessorId: string | null;
  firstRetrievedAt: string; normalizedAt: string; providerAvailableAt: null; knownAt: string;
  contentHash: string; adapterOutput: string; adapterOutputHash: string;
  rawResponses: { attemptId: string; endpoint: string; parameters: Record<string,string>; body: string; sha256: string; retrievedAt: string }[];
  rawEvidence: 'bounded_transport_bodies_and_processed_adapter_output';
  numericSemantics: 'library_binary64_decimal_strings';
  adjustment: 'provider_split_basis_unqualified'; executionQualified: false; audience: 'private_research';
  versions: YahooAdapterOutput['versions']; records: FinancialRecord[]; issues: FinancialIssue[]; missingSessions: string[];
  rights: SourcePolicy['rights'];
}
export type FinancialResultStatus = 'ok' | 'missing' | 'blocked' | 'schema_changed' | 'rate_limited' | 'unavailable' | 'cancelled' | 'unknown';
export interface FinancialResult {
  requestId: string; status: FinancialResultStatus; reason: string; observationId: string | null;
  completedAt: string; retryAt: string | null; cached: boolean;
}
export function validateFinancialRequest(r: FinancialRequest): void {
  exact(r, ['schemaVersion','instrumentId','dataClass','start','end','interval','statement','frequency','fields','adjustment']);
  ensure(r.schemaVersion === FINANCIAL_SCHEMA && financialClasses.includes(r.dataClass) && r.adjustment === 'yahoo_unrepaired', 'financial_protocol');
  ensure(Array.isArray(r.fields) && r.fields.length <= 16 && new Set(r.fields).size === r.fields.length, 'financial_fields');
  if (r.dataClass === 'ohlcv' || r.dataClass === 'actions') {
    ensure(r.start !== null && r.end !== null && r.interval === '1d', 'financial_history_range'); date(r.start); date(r.end);
    const days = (time(`${r.end}T00:00:00Z`) - time(`${r.start}T00:00:00Z`)) / 86400000;
    integer(days, 1, 366); ensure(r.statement === null && r.frequency === null && r.fields.length === 0, 'financial_fields');
  } else {
    ensure(r.start === null && r.end === null && r.interval === null, 'financial_snapshot_range');
    if (r.dataClass === 'statement') ensure(['income','balance_sheet','cash_flow'].includes(r.statement!) && ['annual','quarterly'].includes(r.frequency!) && r.fields.length === 0, 'financial_statement');
    else ensure(r.statement === null && r.frequency === null && r.fields.length > 0 && r.fields.every(f => Object.hasOwn(fundamentalFields, f)), 'financial_fields');
  }
}
