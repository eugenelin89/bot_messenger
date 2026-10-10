/** Trusted market evidence. These records are not worker-authored price assertions. */
import type { Calendar, CorporateAction, Observation } from '../investment/types.js';
export const uses = ['automation','internal_calculation','retention','public_display','derived_portfolio','benchmark','exports','permanent_archive'] as const;
export type DataUse = typeof uses[number];
export interface Permission { status: 'allowed' | 'denied' | 'unknown'; evidence: string[]; note: string }
export interface SourcePolicy {
  id: string; version: number; provider: string; feed: string; mode: 'synthetic_fixture' | 'observed';
  incrementalCost: '0'; reviewedAt: string; expiresAt: string;
  rights: Record<DataUse, Permission>; attribution: string;
  maxObservationAgeMs: number; maxRequests: number; minIntervalMs: number; cacheMs: number; timeoutMs: number; maxBytes: number;
}
export interface InstrumentIdentity {
  id: string; venue: 'XNYS' | 'XNAS'; currency: 'USD'; source: string;
  symbols: { symbol: string; from: string; until: string | null }[];
}
export interface CalendarEvidence {
  id: string; calendar: Calendar; validFrom: string; validThrough: string; reviewedAt: string;
  sources: string[]; mode: 'scheduled_reference' | 'synthetic_fixture';
  exceptions: { date: string; reason: string; source: string }[];
}
export const qualities = ['verified','missing','stale','halted','rate_limited','unavailable','wrong_field','unsupported_adjustment','conflicting_sources','invalid_timestamp','schema_changed','corrected','unknown_rights','wrong_instrument','invalid_price','calendar_mismatch'] as const;
export type Quality = typeof qualities[number];
export interface PriceRequest { instrumentId: string; session: string; field: 'regular_open' | 'regular_close' }
export interface PriceEvidence {
  id: string; mode: SourcePolicy['mode']; policyId: string; policyHash: string;
  instrumentId: string; symbol: string; venue: string; currency: 'USD'; provider: string; feed: string;
  field: PriceRequest['field']; value: string | null; adjustment: 'raw' | 'adjusted';
  session: string; calendarId: string; calendarVersion: string; marketAt: string | null;
  sourceAvailableAt: string | null; retrievedAt: string; knownAt: string;
  sourceId: string; sourceVersion: number; responseHash: string | null; quality: Quality;
  correctionOf: string | null; conflictsWith: string[]; rights: SourcePolicy['rights'];
}
export interface ActionEvidence {
  id: string; mode: SourcePolicy['mode']; policyId: string; policyHash: string;
  action: CorporateAction; retrievedAt: string; sourceAvailableAt: string | null;
  recordDate: string | null; declarationDate: string | null; correctionOf: string | null;
  source: string; rights: SourcePolicy['rights'];
}
export interface CollectionResult { id: string; requestId: string; quality: Quality; evidence: PriceEvidence | null; retryAfter: string | null; reason: string }
export interface MarketTransportResponse { status: number; contentType: string; body: string; retryAfterSeconds: number | null }
export interface PriceAdapter {
  readonly kind: 'synthetic-json-v1';
  read(request: PriceRequest, signal: AbortSignal, maxBytes: number): Promise<MarketTransportResponse>;
}
export interface SimulatorAdmission { observation: Observation; evidenceId: string; knowledgeBasis: 'source_availability' | 'first_retrieval' }
