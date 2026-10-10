import type { Rational } from './arithmetic.js';
export type Decimal = string;
export interface Instrument { id: string; symbol: string; venue: string; currency: 'USD'; sector: string | null; classificationSource: string }
export interface Session { date: string; open: string; close: string; status: 'open' | 'closed'; earlyClose: boolean }
export interface Calendar { version: string; timezone: 'America/New_York'; sessions: Session[]; holidays: string[] }
export interface Configuration {
  runId: string; version: string; methodology: 'inv05-v1'; evidenceMode: 'synthetic_fixture';
  initialCapital: Decimal; currency: 'USD'; universeVersion: string; instruments: Instrument[];
  allowedDirections: ['BUY', 'SELL']; longOnly: true; leverage: false;
  positionLimitBps: number; sectorLimitBps: number; drawdownAttentionBps: number;
  commission: Decimal; slippageBps: number; execution: 'next_regular_open'; cutoffMinutes: number;
  maxOpeningWaitSeconds: number; maxMarkAgeSeconds: number; calendar: Calendar;
  marketPolicy: { id: string; provider: string; feed: string; acquisitionCost: '0'; adjustment: 'raw' };
  benchmark: { instrument: Instrument; convention: 'raw_prices_explicit_dividends_next_open_reinvestment' };
  startsAt: string; endsAt: string; publicationPolicy: string;
  authorization: { fixtureOperator: string; authors: string[]; reviewers: string[]; expiresAt: string; maxOrders: number };
}
export interface Proposal {
  decisionId: string; revision: number; author: string; action: 'BUY' | 'SELL' | 'HOLD';
  evidenceCutoff: string; evidence: { id: string; availableAt: string }[]; rationale: string;
  orders: { instrumentId: string; side: 'BUY' | 'SELL'; quantity: Decimal; priceGuard: Decimal; targetSession: string }[];
}
export interface Decision extends Proposal { committedAt: string; hash: string }
export interface Review { id: string; decisionId: string; revision: number; proposalHash: string; reviewer: string; disposition: 'approve' | 'reject'; reviewedAt: string }
export interface Observation {
  id: string; instrumentId: string; venue: string; currency: 'USD'; provider: string; feed: string;
  field: 'regular_open' | 'regular_close'; value: Decimal; adjustment: 'raw';
  marketAt: string; availableAt: string; retrievedAt: string; session: string; calendarVersion: string;
  sourceId: string; sourceVersion: number; quality: 'verified' | 'halted' | 'unverified'; correctionOf: string | null;
}
export interface CorporateAction {
  id: string; providerActionId: string; provider: string; instrumentId: string; sourceVersion: number;
  effectiveAt: string; availableAt: string; adjustment: 'raw'; quality: 'verified';
  kind: 'split' | 'dividend' | 'ticker_change' | 'unsupported';
  numerator: string | null; denominator: string | null; cashPerShare: Decimal | null;
  paymentAt: string | null; newSymbol: string | null;
}
export type OrderStatus = 'proposed' | 'validated' | 'pending' | 'filled' | 'rejected' | 'expired' | 'cancelled';
export interface Transition { status: OrderStatus; at: string; reason: string | null }
export interface Order {
  id: string; decisionId: string; decisionRevision: number; orderIndex: number; proposalHash: string;
  instrumentId: string; side: 'BUY' | 'SELL'; quantity: Decimal; priceGuard: Decimal; targetSession: string;
  committedAt: string; deadline: string; expiresAt: string; expectedVersion: string;
  reservedCash: Decimal; reservedShares: Decimal; status: OrderStatus; reason: string | null; transitions: Transition[];
}
export interface Position { quantity: Decimal; basis: Decimal; reserved: Decimal }
export interface Book { cash: Decimal; reservedCash: Decimal; realized: Decimal; fees: Decimal; income: Decimal; receivables: Decimal; liabilities: Decimal; positions: Record<string, Position> }
export interface Entitlement { actionId: string; book: 'portfolio' | 'benchmark'; instrumentId: string; quantity: Decimal; amount: Decimal; paymentAt: string | null; paid: boolean; fraction: Rational | null }
export interface Posting { book: 'portfolio' | 'benchmark'; account: 'cash' | 'basis' | 'quantity' | 'realized' | 'fees' | 'income' | 'receivables' | 'liabilities' | 'capital'; instrumentId: string | null; amount: Decimal }
export interface Fill {
  orderId: string | null; book: 'portfolio' | 'benchmark'; observationId: string; instrumentId: string; side: 'BUY' | 'SELL';
  quantity: Decimal; price: Decimal; fee: Decimal; releasedBasis: Decimal; effectiveAt: string;
  priceResidual: Rational; notionalResidual: Rational; basisResidual: Rational;
}
export interface Valuation {
  id: string; sequence: string; revision: number; supersedes: string | null; session: string; asOf: string; recordedAt: string;
  journalVersion: string; journalHash: string; ledgerVersion: string; ledgerHash: string; configurationHash: string; observationIds: string[];
  cash: Decimal; reservedCash: Decimal; availableCash: Decimal; holdingsValue: Decimal | null;
  receivables: Decimal; liabilities: Decimal; equity: Decimal | null; realized: Decimal; unrealized: Decimal | null;
  totalReturn: Decimal | null; dailyReturn: Decimal | null; peak: Decimal | null; drawdown: Decimal | null; maxDrawdown: Decimal | null;
  benchmarkEquity: Decimal | null; benchmarkReturn: Decimal | null; excessPercentagePoints: Decimal | null;
  quality: 'complete' | 'partial' | 'blocked'; reasons: string[]; observedBreaches: string[];
  holdings: { instrumentId: string; symbol: string; quantity: Decimal; basis: Decimal; averageCost: Decimal | null; value: Decimal | null; markId: string | null }[];
}
export interface ValuationRecord { snapshot: Valuation; portfolio: Book; benchmark: Book; entitlements: Entitlement[]; blocked: Record<string, string>; symbols: State['symbols']; orders: State['orders'] }
export interface State {
  version: string; ledgerVersion: string; hash: string | null; configurationHash: string; economicAsOf: string; lifecycle: 'active' | 'paused' | 'ended';
  portfolio: Book; benchmark: Book; benchmarkNextOpen: string | null; benchmarkFunding: { amount: Decimal; session: string | null; used: boolean }[]; ordersUsed: number;
  decisions: Record<string, Decision>; reviews: Record<string, Review>; observations: Observation[];
  orders: Record<string, Order>; actions: CorporateAction[]; entitlements: Entitlement[]; blocked: Record<string, string>;
  blockEvents: { instrumentId: string; reason: string; effectiveAt: string }[];
  benchmarkExecutions: { session: string; effectiveAt: string }[];
  symbols: Record<string, { symbol: string; effectiveAt: string }[]>;
  inventoryHistory: { at: string; book: 'portfolio' | 'benchmark'; instrumentId: string; quantity: Decimal }[];
  accountingHistory: { effectiveAt: string; entries: Posting[]; settledOrders: string[] }[];
  payments: { actionId: string; effectiveAt: string }[];
  financialTimes: { instrumentId: string; at: string; kind: 'fill' | 'split' }[];
  valuations: ValuationRecord[]; lastGood: Valuation | null;
}
export type Command =
  | { type: 'initialize' }
  | { type: 'decision'; proposal: Proposal }
  | { type: 'review'; review: Review }
  | { type: 'observe'; observation: Observation }
  | { type: 'submit'; decisionId: string; revision: number; orderIndex: number; expectedVersion: string; reviewId: string }
  | { type: 'fill'; orderId: string }
  | { type: 'cancel'; orderId: string }
  | { type: 'expire'; orderId: string }
  | { type: 'control'; state: 'active' | 'paused' | 'ended' }
  | { type: 'action'; action: CorporateAction }
  | { type: 'dividend_payment'; actionId: string }
  | { type: 'benchmark_open'; session: string }
  | { type: 'value'; session: string; asOf: string }
  | { type: 'revise_valuations'; correctionId: string };
export interface Outcome { status: string; reason: string | null; orderId: string | null; valuation: Valuation | null; fills: Fill[] }
export interface Journal {
  transactionId: string; runId: string; version: string; previousHash: string | null; hash: string;
  configurationHash: string; ledgerVersion: string; previousLedgerVersion: string; operationId: string; originalRequestId: string; requestHash: string; eventAt: string; effectiveAt: string; recordedAt: string;
  command: Command; entries: Posting[]; outcome: Outcome; checkpointHash: string;
}
