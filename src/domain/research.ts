import type {UsageObservation} from './usage/tokens.js';
export const RESEARCH_POLICY = 'public-research-v1';
export const RESEARCH_LIMITS = Object.freeze({
  callsPerWork: 32, callsPerDay: 120, callsPerMinute: 12, searchesPerWork: 8,
  searchTimeoutMs: 90000, fetchTimeoutMs: 15000, queryChars: 500,
  resultChars: 16000, sourceChars: 24000, sliceChars: 6000, documentChars: 10000,
  bytes: 1048576, redirects: 3, sourcesPerSearch: 12, outputPerWork: 160000,
});
export type ResearchCapability = 'public_research' | 'company_knowledge';
export type ResearchMode = 'task' | 'conversation' | 'discussion';
export interface StandingGrant {
  grant_id: string; worker_id: string; capability: ResearchCapability; granted_by: string;
  operation: string; policy_version: string; modes: string; resources: string; limits: string;
  delegation: number; created_at: string; expires_at: string | null; revoked_at: string | null;
}
export interface PublicSource {
  url: string; title: string; content: string; kind: 'search_snippet' | 'retrieved_page';
  retrieved_at: string; published_at: string | null; observed_at: string | null;
  freshness: 'live_response' | 'unknown'; omissions: string;
}
export interface ResearchResult {
  provider: string; sources: PublicSource[]; summary?: string; usage?: unknown;
  runtime_reference?: string; outcome: 'succeeded' | 'unavailable'; error?: string;
}
export interface SearchHooks {
  model?: string;
  usage?(event:UsageObservation):void;
  prepared(reference: string): void;
  invoking(): void;
  settled(): void;
}
export interface ResearchProvider {
  readonly name: string;
  search(query: string, signal: AbortSignal, hooks: SearchHooks): Promise<ResearchResult>;
}
export class ResearchFailure extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
export const RESEARCH_TOOLS = ['research_search','research_open','research_read','research_sources','read_company_document'] as const;
