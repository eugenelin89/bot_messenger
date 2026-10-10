import type { Event, ContentType } from '../../../contracts/investment/v1/types.js';
import type { SimulationClock } from '../../control/investment.js';
export type { SimulationClock };
export interface Origin { kind: string; id: string; version: string; hash: string }
export interface PublicContent { origin: Origin; contentType: ContentType; bytes: Buffer }
export interface Material {
  sourceHash: string;
  events: { event: Event; origin: Origin }[];
  contents: PublicContent[];
}
export interface ProjectionContext {
  experimentId: string; runId: string; policyVersion: string;
  identity(kind: string, privateId: string): string;
  sequence(key: string): string;
}
/** Implemented by trusted source readers, never by a worker HTTP request. */
export interface PublicationSource {
  id: string; title: string; mode: 'synthetic_fixture'; participants: string[]; privateRunId?: string;
  project(context: ProjectionContext): Material;
  checkRights(material: Material, at: string): void;
}
export interface Destination {
  id: string; title: string; origin: string; publisherId: string;
  keyId: string; generation: string; fixtureLoopback?: boolean;
}
export interface Envelope {
  sourceId: string; destinationId: string; audience: 'public';
  futureFinancial:boolean; participants: string[]; eventTypes: Event['type'][]; contentTypes: ContentType[];
  expiresAt: string; maxAttempts: number; maxBytes: number; maxQueueBytes: number;
  maxAgeSeconds: number; writesPerMinute: number;
}
export interface Preview {
  id: string; channelId: string; digest: string; createdAt: string;
  envelope: Envelope; destination: { id: string; origin: string; generation: string; keyId: string };
  sourceHash: string; baseHash: string; material: MaterialJSON;
}
export interface MaterialJSON {
  sourceHash: string; events: Material['events'];
  contents: { origin: Origin; contentType: ContentType; base64: string; sha256: string }[];
}
export interface Channel {
  id: string; source_id: string; source_run_id: string | null; destination_id: string; experiment_id: string;
  run_id: string; policy_version: string; generation: string; key_id: string; reconciled_generation:string|null; publisher_instance:string;
}
export interface Job {
  id: string; channel_id: string; grant_id: string; position: number;
  kind: 'batch' | 'content' | 'heartbeat'; body: Uint8Array; digest: string;
  path: string; content_type: ContentType; state: 'queued' | 'sending' | 'uncertain' | 'delivered' | 'blocked';
  attempted_at: string | null; retry_at: string | null; lease: string | null;
  created_at: string; receipt: string | null; needs_receipt: number;
}
export interface Grant { id: string; channel_id: string; preview_id: string; envelope: string; state: 'active' | 'paused' | 'revoked'; created_at: string }
