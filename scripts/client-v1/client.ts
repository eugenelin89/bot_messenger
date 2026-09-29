// Independent wire consumer. No server/control-plane/database imports.
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomUUID, sign, type KeyObject } from 'node:crypto';
import { constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export class APIError extends Error {
  constructor(readonly status: number, readonly code: string, readonly requestId: string | null) { super(`Client API ${status}: ${code}`); }
}
export interface Identity { hq_id: string; device_id: string; fingerprint: string }
export interface Envelope<T = Record<string, unknown>> { data: T; request_id: string }
export const newRequestKey = () => `${Date.now()}.${randomUUID()}`;
function privateDirectory(path: string) {
  const dir = resolve(path);
  try { mkdirSync(dir, { mode: 0o700 }); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
  const stat = lstatSync(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(dir) !== dir || (stat.mode & 0o077) || stat.uid !== process.getuid?.()) throw new Error('Use an owned canonical private directory with mode 0700.');
  return dir;
}
export function generatePrivateKey(directory: string) {
  const dir = privateDirectory(directory); const path = join(dir, 'device.pem');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  writeFileSync(path, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600, flag: 'wx' });
  const jwk = publicKey.export({ format: 'jwk' });
  return { fingerprint: `SHA256:${createHash('sha256').update(Buffer.from(jwk.x!, 'base64url')).digest('base64url')}`, public_key: jwk };
}
function privateRead(path: string) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || (stat.mode & 0o077) || stat.uid !== process.getuid?.() || stat.size > 4096) throw new Error('Client identity file must be a private owned regular file.');
    return readFileSync(fd, 'utf8');
  } finally { closeSync(fd); }
}
export class ClientV1 {
  private readonly origin: string;
  private readonly directory: string;
  private readonly privateKey: KeyObject;
  private identity?: Identity;
  private access?: { token: string; expires: number };
  constructor(base: string, directory: string) {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new Error('Use HTTPS or a loopback SSH-tunnel URL without credentials.');
    this.origin = url.origin; this.directory = privateDirectory(directory); this.privateKey = createPrivateKey(privateRead(join(this.directory, 'device.pem')));
    if (this.privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Client key must be Ed25519.');
    try { this.identity = JSON.parse(privateRead(join(this.directory, 'identity.json'))) as Identity; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  get publicIdentity() { return this.identity ? { ...this.identity } : null; }
  private async wire<T>(path: string, method: 'GET' | 'POST', body?: unknown, token?: string, requestKey?: string): Promise<Envelope<T>> {
    if (!/^\/[a-z]/.test(path) || path.includes('#') || path.includes('://')) throw new Error('Use a client API relative path.');
    const r = await fetch(`${this.origin}/api/v1${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(requestKey ? { 'Idempotency-Key': requestKey } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await r.json() as Envelope<T> & { error?: { code: string } };
    if (!r.ok) throw new APIError(r.status, result.error?.code ?? 'invalid_response', result.request_id ?? null);
    return result;
  }
  async claim(pairingUri: string, displayName = 'BotSquad reference client') {
    if (this.identity) throw new Error('This client already has a device identity. Use a fresh private directory to pair again.');
    const uri = new URL(pairingUri.trim()); const allowed = ['v', 'hq_id', 'pairing_id', 'secret'];
    if (uri.protocol !== 'botsquad:' || uri.hostname !== 'pair' || uri.pathname || uri.hash || uri.username || uri.password || uri.searchParams.get('v') !== '1' || [...uri.searchParams.keys()].length !== allowed.length || !allowed.every(k => uri.searchParams.getAll(k).length === 1)) throw new Error('Invalid pairing payload.');
    const discovery = await this.wire<{ hq_id: string }>('/discovery', 'GET');
    if (discovery.data.hq_id !== uri.searchParams.get('hq_id')) throw new Error('Pairing payload belongs to another HQ.');
    const publicKey = createPublicKey(this.privateKey).export({ format: 'jwk' });
    const response = await this.wire<{ hq_id: string; device: { device_id: string; fingerprint: string } }>('/pairings/claim', 'POST', { hq_id: discovery.data.hq_id, pairing_id: uri.searchParams.get('pairing_id'), pairing_secret: uri.searchParams.get('secret'), public_key: publicKey, display_name: displayName, platform: process.platform, app_version: 'client-v1-1' });
    const fingerprint = `SHA256:${createHash('sha256').update(Buffer.from(publicKey.x!, 'base64url')).digest('base64url')}`;
    if (response.data.device.fingerprint !== fingerprint) throw new Error('Device fingerprint mismatch.');
    this.identity = { hq_id: response.data.hq_id, device_id: response.data.device.device_id, fingerprint };
    writeFileSync(join(this.directory, 'identity.json'), JSON.stringify(this.identity), { mode: 0o600, flag: 'wx' });
    return { ...this.identity, state: 'pending', next: 'Compare the fingerprint and confirm through the local Web UI.' };
  }
  async authenticate() {
    if (!this.identity) throw new Error('Claim and confirm a pairing first.');
    const c = await this.wire<{ hq_id: string; device_id: string; challenge_id: string; nonce: string; expires_at: string; signing_context: string }>('/auth/challenge', 'POST', { device_id: this.identity.device_id });
    if (c.data.hq_id !== this.identity.hq_id || c.data.device_id !== this.identity.device_id || c.data.signing_context !== 'botsquad-device-auth-v1') throw new Error('Authentication context mismatch.');
    const bytes = Buffer.from(['botsquad-device-auth-v1', c.data.hq_id, c.data.device_id, c.data.challenge_id, c.data.nonce, c.data.expires_at].join('\n'), 'utf8');
    const r = await this.wire<{ access_token: string; expires_at: string; hq_id: string; device_id: string }>('/auth/token', 'POST', { device_id: this.identity.device_id, challenge_id: c.data.challenge_id, signature: sign(null, bytes, this.privateKey).toString('base64url') });
    if (r.data.hq_id !== this.identity.hq_id || r.data.device_id !== this.identity.device_id) throw new Error('Token identity mismatch.');
    this.access = { token: r.data.access_token, expires: Date.parse(r.data.expires_at) };
    return { ...this.identity, expires_at: r.data.expires_at };
  }
  private async authorization(renewExpired = true) { if (!this.access || (renewExpired && this.access.expires <= Date.now() + 2000)) await this.authenticate(); return this.access!.token; }
  async get<T = Record<string, unknown>>(path: string, renewExpired = true) { return this.wire<T>(path, 'GET', undefined, await this.authorization(renewExpired)); }
  async post<T = Record<string, unknown>>(path: string, body: unknown, requestKey: string) { return this.wire<T>(path, 'POST', body, await this.authorization(), requestKey); }
  async *events(cursor?: string, signal?: AbortSignal): AsyncGenerator<{ event: string; id?: string; data: Record<string, unknown> }> {
    const token = await this.authorization();
    const r = await fetch(this.origin + '/api/v1/events', { headers: { Authorization: `Bearer ${token}`, ...(cursor ? { 'Last-Event-ID': cursor } : {}) }, redirect: 'error', signal });
    if (!r.ok) { const failure = await r.json() as { error: { code: string }; request_id: string }; throw new APIError(r.status, failure.error.code, failure.request_id); }
    const reader = r.body!.getReader(); const decoder = new TextDecoder(); let pending = '';
    try { for (;;) {
      const chunk = await reader.read(); if (chunk.done) return; pending += decoder.decode(chunk.value, { stream: true });
      if (pending.length > 262_144) throw new Error('Event frame exceeds client limit.');
      let boundary: number;
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const block = pending.slice(0, boundary); pending = pending.slice(boundary + 2);
        const lines = block.split('\n'); const event = lines.find(l => l.startsWith('event: '))?.slice(7); const data = lines.find(l => l.startsWith('data: '))?.slice(6);
        if (event && data) yield { event, id: lines.find(l => l.startsWith('id: '))?.slice(4), data: JSON.parse(data) as Record<string, unknown> };
      }
    } } finally { await reader.cancel().catch(() => {}); }
  }
}
