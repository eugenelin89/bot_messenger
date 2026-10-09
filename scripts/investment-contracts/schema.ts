/** Offline INV-01 conformance helpers. Not wired to HTTP, HQ, persistence or dispatch. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import canonicalizeModule from 'canonicalize';
import { parseTree, type Node, type ParseError } from 'jsonc-parser';
import type { ErrorCode, Problem } from '../../contracts/investment/v1/types.js';

const addFormats = addFormatsModule as unknown as typeof import('ajv-formats').default;
const canonicalize = canonicalizeModule as unknown as (value: unknown) => string | undefined;
export const schema = JSON.parse(readFileSync('contracts/investment/v1/schema.json', 'utf8'));
const ajv = new Ajv2020({ strict: true, allErrors: false, validateFormats: true });
addFormats(ajv);
ajv.addSchema(schema);
export class ContractError extends Error {
  constructor(public readonly code: ErrorCode) { super(code); }
}
export function requireContract(condition: unknown, code: ErrorCode = 'INVALID_REQUEST'): asserts condition {
  if (!condition) throw new ContractError(code);
}
export function validate<T>(name: string, value: unknown): T {
  const validator = ajv.getSchema(`${schema.$id}#/$defs/${name}`);
  if (!validator) throw new Error(`Unknown contract definition: ${name}`);
  requireContract(validator(value), 'INVALID_SCHEMA');
  return value as T;
}
export function validUnicode(s: string): boolean {
  for (let n = 0; n < s.length; n++) {
    const c = s.charCodeAt(n);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = s.charCodeAt(++n);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (c >= 0xdc00 && c <= 0xdfff) return false;
  }
  return true;
}
export function parseJson(bytes: Uint8Array, maxBytes = 1048576): unknown {
  requireContract(bytes.byteLength <= maxBytes, 'TOO_LARGE');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new ContractError('INVALID_REQUEST'); }
  // Bound nesting before the recursive parser allocates a tree.
  let nesting = 0, quoted = false, escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') requireContract(++nesting <= 16);
    else if (char === '}' || char === ']') nesting--;
  }
  const errors: ParseError[] = [];
  const tree = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false });
  requireContract(tree && errors.length === 0);
  function check(node: Node, depth: number): void {
    requireContract(depth <= 16);
    if (node.type === 'string') requireContract(validUnicode(node.value));
    if (node.type === 'number') requireContract(Number.isFinite(node.value) && (!Number.isInteger(node.value) || Number.isSafeInteger(node.value)));
    if (node.type === 'object') {
      const keys = (node.children ?? []).map(p => p.children![0]!.value);
      requireContract(new Set(keys).size === keys.length);
    }
    for (const child of node.children ?? []) check(child, depth + (node.type === 'property' ? 0 : 1));
  }
  check(tree, 0);
  return JSON.parse(text);
}
export const sha256 = (bytes: string | Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
export function canonicalJson(value: unknown): string {
  // Reject values JSON.stringify would silently erase or coerce.
  const seen = new Set<object>();
  function check(v: unknown, depth = 0): void {
    requireContract(depth <= 16);
    if (v === null || typeof v === 'boolean') return;
    if (typeof v === 'string') { requireContract(validUnicode(v)); return; }
    if (typeof v === 'number') { requireContract(Number.isFinite(v) && (!Number.isInteger(v) || Number.isSafeInteger(v))); return; }
    requireContract(typeof v === 'object' && !seen.has(v)); seen.add(v);
    requireContract(Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
    if (Array.isArray(v)) for (let i = 0; i < v.length; i++) check(v[i], depth + 1);
    else for (const [k, item] of Object.entries(v)) { requireContract(validUnicode(k)); check(item, depth + 1); }
    seen.delete(v);
  }
  check(value);
  const json = JSON.stringify(value);
  requireContract(typeof json === 'string');
  parseJson(Buffer.from(json));
  const result = canonicalize(value);
  requireContract(result !== undefined);
  return result;
}
export const canonicalHash = (value: unknown): string => sha256(canonicalJson(value));
export const fixed = (value: string): bigint => {
  requireContract(/^-?(0|[1-9][0-9]{0,11})(\.[0-9]{1,6})?$/.test(value), 'INVALID_SCHEMA');
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  return (negative ? -1n : 1n) * (BigInt(whole!) * 1000000n + BigInt(fraction.padEnd(6, '0')));
};
export function divideEven(n: bigint, d: bigint): bigint {
  requireContract(d > 0n);
  const sign = n < 0n ? -1n : 1n;
  const a = n < 0n ? -n : n;
  const q = a / d, r = a % d;
  return sign * (q + (r * 2n > d || (r * 2n === d && q % 2n !== 0n) ? 1n : 0n));
}
export const product = (a: string, b: string): bigint => divideEven(fixed(a) * fixed(b), 1000000n);
export function safeUrl(value: string): void {
  let url: URL;
  try { url = new URL(value); } catch { throw new ContractError('INVALID_REQUEST'); }
  requireContract(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash);
  requireContract(!/[\u0000-\u0020\\]/.test(value));
}
export function safeText(value: string): void {
  requireContract(validUnicode(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value));
  // Deliberately conservative plain-text/Markdown subset. A renderer must still escape text.
  requireContract(!/<[^>]*>|!\[|javascript\s*:|data\s*:|file\s*:/i.test(value), 'UNSUPPORTED_MEDIA');
  requireContract(!value.includes(']:') && !/&#(?:[0-9]+|x[0-9a-f]+);|&(?:colon|sol|Tab|NewLine);/i.test(value), 'UNSUPPORTED_MEDIA');
  for (const match of value.matchAll(/\]\(([^)]*)\)/g)) safeUrl(match[1]!);
}
export function checkPublicStrings(value: unknown, key = ''): void {
  if (typeof value === 'string') {
    safeText(value);
    if (key === 'url') safeUrl(value);
  } else if (Array.isArray(value)) value.forEach(v => checkPublicStrings(v));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) checkPublicStrings(v, k);
}
const details: Record<ErrorCode, [number, boolean, string]> = {
  INVALID_REQUEST: [400, false, 'The request is invalid.'], UNSUPPORTED_VERSION: [422, false, 'Unsupported contract version.'],
  UNAUTHENTICATED: [401, false, 'Authentication failed.'], FORBIDDEN: [403, false, 'Operation is not permitted.'],
  NOT_FOUND: [404, false, 'Resource is unavailable.'], CONFLICT: [409, false, 'Immutable identity conflicts.'],
  DEPENDENCY_NOT_READY: [409, true, 'A prerequisite is not ready.'], SEQUENCE_GAP: [409, true, 'A financial predecessor is missing.'],
  REPLAY: [409, false, 'Request freshness proof was already used.'], TOO_LARGE: [413, false, 'Request exceeds the size limit.'],
  UNSUPPORTED_MEDIA: [415, false, 'Unsupported public content.'], INVALID_SCHEMA: [422, false, 'Payload does not match the contract.'],
  RATE_LIMITED: [429, true, 'Capacity is temporarily unavailable.'], UNAVAILABLE: [503, true, 'Service is temporarily unavailable.'],
  OUTCOME_UNKNOWN: [409, false, 'Prior work requires reconciliation.'], CURSOR_RESET: [409, true, 'Refetch status, snapshot and a bounded page.'],
  EXPIRED: [410, false, 'Request has expired.'], CANCELLED: [409, false, 'Request was cancelled.'],
  WITHDRAWN: [410, false, 'Referenced evidence is unavailable.'], BUDGET_EXHAUSTED: [429, false, 'The configured work limit is reached.'],
};
export function problem(code: ErrorCode, requestId: string): Problem {
  validate('Id', requestId);
  const [status, retryable, detail] = details[code];
  return validate('Problem', { schemaVersion: '1.0', code, requestId, status, retryable, detail,
    retryAfterSeconds: retryable && code !== 'CURSOR_RESET' ? 30 : null, resync: code === 'CURSOR_RESET' ? 'status_snapshot_page' : null });
}
