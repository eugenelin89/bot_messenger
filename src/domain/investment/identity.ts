import { createHash } from 'node:crypto';
import canonicalizeModule from 'canonicalize';
import { ensure } from './arithmetic.js';
const jcs = canonicalizeModule as unknown as (v: unknown) => string | undefined;
export function canonical(value: unknown): string {
  const seen = new Set<object>();
  function check(v: unknown, depth: number): void {
    ensure(depth <= 40, 'object_too_deep');
    if (v === null || typeof v === 'boolean') return;
    if (typeof v === 'string') { ensure(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(v), 'invalid_unicode'); return; }
    if (typeof v === 'number') { ensure(Number.isSafeInteger(v), 'invalid_integer'); return; }
    ensure(typeof v === 'object' && !seen.has(v), 'invalid_json_value');
    ensure(Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null, 'invalid_object');
    seen.add(v);
    if (Array.isArray(v)) for (const item of v) check(item, depth + 1);
    else for (const [key, item] of Object.entries(v)) { check(key, depth + 1); check(item, depth + 1); }
    seen.delete(v);
  }
  check(value, 0); const result = jcs(value); ensure(result !== undefined, 'invalid_json'); return result;
}
export const hash = (value: unknown): string => createHash('sha256').update(canonical(value)).digest('hex');
export const identity = (kind: string, ...parts: unknown[]): string => `${kind}_${hash(parts).slice(0, 40)}`;
export function id(value: string): void { ensure(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value) && !Object.hasOwn(Object.prototype,value), 'invalid_id'); }
export function integer(value: number, min: number, max: number): void { ensure(Number.isSafeInteger(value) && value >= min && value <= max, 'invalid_integer'); }
export function time(value: string): number {
  ensure(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value), 'invalid_time');
  const n = Date.parse(value); ensure(Number.isFinite(n) && new Date(n).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z'), 'invalid_time'); return n;
}
export function date(value: string): void { ensure(/^\d{4}-\d\d-\d\d$/.test(value), 'invalid_date'); time(`${value}T00:00:00Z`); }
export function exact(value: object, keys: string[]): void { ensure(value !== null && typeof value === 'object' && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k)), 'invalid_fields'); }
