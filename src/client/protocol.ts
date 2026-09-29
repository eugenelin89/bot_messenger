import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const SCOPES = ['state:read', 'projects:read', 'artifacts:read', 'messages:send', 'objectives:create', 'dispatch:control', 'executions:interrupt', 'profiles:update'] as const;
export type Scope = typeof SCOPES[number];
export const LIMITS = Object.freeze({ pairingMs: 600_000, challengeMs: 60_000, tokenMs: 600_000,
  retryMs: 7 * 24 * 60 * 60_000, futureSkewMs: 120_000, devices: 16, retainedDevices: 128,
  pairings: 8, challengesPerDevice: 4, tokensPerDevice: 4, receipts: 10_000,
  receiptsPerDevice: 2_000, events: 10_000, streamsPerDevice: 2, bodyBytes: 32_768 });
export class ClientError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}
export function check(condition: unknown, status = 400, code = 'invalid_request', message = 'Request does not match the client API contract.'): asserts condition {
  if (!condition) throw new ClientError(status, code, message);
}
export function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  const result = value as Record<string, unknown>;
  check(Object.keys(result).every(key => fields.includes(key)) && fields.every(key => Object.hasOwn(result, key)));
  return result;
}
export function text(value: unknown, max = 8000): string {
  check(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !value.includes('\0'));
  return value;
}
export function identifier(value: unknown, prefix: string): string {
  check(typeof value === 'string' && new RegExp(`^${prefix}_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).test(value));
  return value;
}
export const newId = (prefix: string) => `${prefix}_${randomUUID()}`;
export const secret = () => randomBytes(32).toString('base64url');
export const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
export function secretEquals(value: string, digest: string) {
  const a = Buffer.from(hash(value), 'hex'); const b = Buffer.from(digest, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
export function base64url(value: unknown, bytes: number): string {
  check(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value) && value.length === Math.ceil(bytes * 4 / 3));
  const decoded = Buffer.from(value, 'base64url'); check(decoded.length === bytes && decoded.toString('base64url') === value);
  return value;
}
// Reject noncanonical encodings and the finite set of low-order public keys.
// Node/OpenSSL accepts the identity key and its forged identity signature.
// These encoding constants are the ge25519_has_small_order values published in
// libsodium 1.0.18; signature mathematics remain entirely in Node crypto.
export function ed25519PublicEncoding(value: unknown): string {
  const encoded = base64url(value, 32); const y = Buffer.from(encoded, 'base64url');
  y[31] = y[31]! & 0x7f;
  const hex = y.toString('hex');
  const lowOrder = ['00'.repeat(32), `01${'00'.repeat(31)}`,
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
    `ec${'ff'.repeat(30)}7f`];
  check(!lowOrder.includes(hex) && Buffer.compare(Buffer.from(y).reverse(), Buffer.from(`7f${'ff'.repeat(30)}ed`, 'hex')) < 0,
    400, 'invalid_public_key', 'Public key encoding is not permitted.');
  return encoded;
}
export function scopes(value: unknown): Scope[] {
  check(Array.isArray(value) && value.length > 0 && value.length <= SCOPES.length);
  check(value.every(v => SCOPES.includes(v)) && new Set(value).size === value.length);
  return [...value].sort() as Scope[];
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export interface Challenge { challenge_id: string; hq_id: string; device_id: string; nonce: string; expires_at: string }
export function signingBytes(c: Challenge): Buffer {
  return Buffer.from(['botsquad-device-auth-v1', c.hq_id, c.device_id, c.challenge_id, c.nonce, c.expires_at].join('\n'), 'utf8');
}
export function requestKey(value: unknown, now: number): string {
  check(typeof value === 'string' && /^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value), 400, 'invalid_idempotency_key', 'A timestamp.UUIDv4 Idempotency-Key is required.');
  const timestamp = Number(value.split('.')[0]);
  check(timestamp <= now + LIMITS.futureSkewMs && timestamp > now - LIMITS.retryMs, 409, 'idempotency_key_expired', 'Request key is outside the seven-day retry window; inspect current state.');
  return value;
}

// Only known device IDs receive buckets; unknown callers share a fixed global bucket.
export class RateLimits {
  private buckets = new Map<string, { start: number; count: number }>();
  take(key: string, max: number, now: number) {
    for (const [k, bucket] of this.buckets) if (now - bucket.start >= 60_000) this.buckets.delete(k);
    let bucket = this.buckets.get(key);
    if (!bucket) { check(this.buckets.size < 256, 429, 'rate_limited', 'Try again later.'); bucket = { start: now, count: 0 }; this.buckets.set(key, bucket); }
    check(++bucket.count <= max, 429, 'rate_limited', 'Try again later.');
  }
}
