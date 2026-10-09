/** Narrow RFC 9421/9530 conformance profile, not an HTTP server or credential store. */
import { createHash, verify, type KeyObject } from 'node:crypto';
import { requireContract, validate } from './schema.js';
export interface SignedMessage {
  method: 'GET' | 'POST' | 'PUT';
  authority: string;
  path: string;
  headers: [string, string][];
  body: Uint8Array;
}
export interface SignatureParameters { created: number; expires: number; keyId: string; nonce: string }
export interface VerificationPolicy {
  authority: string; generation: string; keyId: string; publicKey: KeyObject; enabled: boolean;
  notBefore: number; notAfter: number; now: number; usedNonces: ReadonlySet<string>;
  /** Exact authorized method/path pairs. The publisher/Ask scope is checked separately. */
  targets: ReadonlySet<string>;
}
export const contentDigest = (body: Uint8Array): string => `sha-256=:${createHash('sha256').update(body).digest('base64')}:`;
function headers(message: SignedMessage): Map<string, string> {
  const result = new Map<string, string>();
  for (const [rawName, value] of message.headers) {
    const name = rawName.toLowerCase();
    requireContract(/^[a-z-]+$/.test(name) && !result.has(name) && !/[\r\n]/.test(value), 'UNAUTHENTICATED');
    requireContract(value === value.trim(), 'UNAUTHENTICATED');
    result.set(name, value);
  }
  return result;
}
const getComponents = ['@method', '@authority', '@path', 'botsquad-generation'];
const writeComponents = [...getComponents, 'content-type', 'content-digest', 'idempotency-key'];
export function signatureInput(method: SignedMessage['method'], p: SignatureParameters): string {
  validate('Id', p.keyId);
  requireContract(Number.isSafeInteger(p.created) && Number.isSafeInteger(p.expires) && p.created >= 0 && p.expires >= 0, 'UNAUTHENTICATED');
  requireContract(/^[A-Za-z0-9_-]{22,64}$/.test(p.nonce), 'UNAUTHENTICATED');
  const components = method === 'GET' ? getComponents : writeComponents;
  return `sig1=(${components.map(c => `"${c}"`).join(' ')});created=${p.created};expires=${p.expires};keyid="${p.keyId}";nonce="${p.nonce}";alg="ed25519"`;
}
export function signatureBase(message: SignedMessage, input: string): string {
  requireContract(['GET', 'POST', 'PUT'].includes(message.method), 'UNAUTHENTICATED');
  requireContract(/^[a-z0-9.-]+(?::[0-9]{1,5})?$/.test(message.authority), 'UNAUTHENTICATED');
  requireContract(/^\/api\/(experiments|ask)\/v1\/[A-Za-z0-9_/-]+$/.test(message.path) && !message.path.includes('//'), 'UNAUTHENTICATED');
  const h = headers(message);
  const values: Record<string, string> = { '@method': message.method, '@authority': message.authority, '@path': message.path };
  const generation = h.get('botsquad-generation');
  validate('Sequence', generation); values['botsquad-generation'] = generation!;
  if (message.method === 'GET') {
    requireContract(message.body.length === 0 && !h.has('content-type') && !h.has('content-digest') && !h.has('idempotency-key'), 'UNAUTHENTICATED');
  } else {
    for (const c of writeComponents.slice(4)) {
      const value = h.get(c);
      requireContract(value, 'UNAUTHENTICATED'); values[c] = value;
    }
    validate('Id', values['idempotency-key']);
    requireContract(values['content-digest'] === contentDigest(message.body), 'UNAUTHENTICATED');
  }
  const components = message.method === 'GET' ? getComponents : writeComponents;
  // RFC 9421 section 2.5: quoted component identifiers, colon-SP, LF; no trailing LF.
  return [...components.map(c => `"${c}": ${values[c]}`), `"@signature-params": ${input.slice('sig1='.length)}`].join('\n');
}
export function verifySignedRequest(message: SignedMessage, policy: VerificationPolicy): { nonceKey: string; retainUntil: number } {
  requireContract(policy.enabled && policy.now >= policy.notBefore && policy.now < policy.notAfter, 'FORBIDDEN');
  requireContract(message.authority === policy.authority && policy.targets.has(`${message.method} ${message.path}`), 'FORBIDDEN');
  requireContract(policy.publicKey.asymmetricKeyType === 'ed25519', 'UNAUTHENTICATED');
  const h = headers(message), input = h.get('signature-input'), signature = h.get('signature');
  requireContract(input && signature, 'UNAUTHENTICATED');
  requireContract(h.get('botsquad-generation') === policy.generation, 'CONFLICT');
  const match = /^sig1=\(("@method" "@authority" "@path" "botsquad-generation"(?: "content-type" "content-digest" "idempotency-key")?)\);created=(0|[1-9][0-9]{0,11});expires=(0|[1-9][0-9]{0,11});keyid="([A-Za-z0-9][A-Za-z0-9_-]{0,63})";nonce="([A-Za-z0-9_-]{22,64})";alg="ed25519"$/.exec(input);
  requireContract(match, 'UNAUTHENTICATED');
  const created = Number(match[2]), expires = Number(match[3]), keyId = match[4]!, nonce = match[5]!;
  requireContract(input === signatureInput(message.method, { created, expires, keyId, nonce }), 'UNAUTHENTICATED');
  requireContract(keyId === policy.keyId && created >= policy.notBefore && created < policy.notAfter, 'FORBIDDEN');
  requireContract(expires > created && expires - created <= 300 && created <= policy.now + 60 && policy.now <= expires + 60, 'UNAUTHENTICATED');
  const nonceKey = `${keyId}:${nonce}`;
  requireContract(!policy.usedNonces.has(nonceKey), 'REPLAY');
  const encoded = /^sig1=:([A-Za-z0-9+/]{86}==):$/.exec(signature)?.[1];
  requireContract(encoded, 'UNAUTHENTICATED');
  const bytes = Buffer.from(encoded, 'base64');
  requireContract(bytes.length === 64 && bytes.toString('base64') === encoded, 'UNAUTHENTICATED');
  requireContract(verify(null, Buffer.from(signatureBase(message, input)), policy.publicKey, bytes), 'UNAUTHENTICATED');
  return { nonceKey, retainUntil: expires + 60 };
}
