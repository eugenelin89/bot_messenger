import { createHash, createPublicKey, verify } from 'node:crypto';
import type { Company } from './company.js';
import { base64url, canonical, check, ed25519PublicEncoding, hash, identifier, LIMITS, newId, object, RateLimits, SCOPES, scopes, secret, secretEquals, signingBytes, text, type Challenge, type Scope } from '../client/protocol.js';

export interface Device {
  device_id: string; owner_principal_id: string; public_key: string; key_algorithm: string; fingerprint: string;
  display_name: string; platform: string; app_version: string; state: 'pending' | 'active' | 'denied' | 'revoked';
  capabilities: string; created_at: string; confirmed_at: string | null; last_seen_at: string | null; revoked_at: string | null;
}
interface Pairing {
  pairing_id: string; hq_id: string; owner_principal_id: string; secret_hash: string; capabilities: string;
  state: string; device_id: string | null; created_at: string; expires_at: string;
}
export interface Authentication { device: Device; expires_at: string; token_hash: string }
export interface Receipt { status: number; response: string; request_hash: string; method: string; path: string; interrupt_execution_id: string | null }

export class RemoteClients {
  readonly hq: { hq_id: string; created_at: string };
  readonly rates = new RateLimits();
  private lastFailureAudit = -Infinity;
  constructor(readonly company: Company, readonly clock = Date.now) {
    company.store.run('INSERT OR IGNORE INTO client_hq VALUES (1,?,?)', newId('hq'), this.now());
    this.hq = company.store.get('SELECT hq_id,created_at FROM client_hq WHERE singleton=1')!;
    this.cleanup();
  }
  now() { return new Date(this.clock()).toISOString(); }
  private count(sql: string, ...args: string[]) { return this.company.store.get<{ n: number }>(sql, ...args)!.n; }
  private human() {
    check(this.company.store.get("SELECT 1 FROM principals WHERE principal_id='human' AND type='human' AND enabled=1"), 403, 'principal_disabled', 'Human principal is disabled.');
  }
  private audit(type: string, detail: object) { this.company.audit(`remote_${type}`, 'human', detail); }
  failure(code: string) {
    // Bound unauthenticated audit amplification; never retain supplied request values.
    if (this.clock() - this.lastFailureAudit >= 30_000) {
      this.lastFailureAudit = this.clock(); this.company.audit('remote_request_denied', 'system', { code });
    }
  }
  cleanup() {
    const store = this.company.store; const now = this.now();
    store.transaction(() => {
      for (const pairing of store.all<Pairing>("SELECT * FROM client_pairings WHERE state IN ('open','claimed') AND expires_at<=?", now)) {
        store.run("UPDATE client_pairings SET state='expired' WHERE pairing_id=?", pairing.pairing_id);
        if (pairing.device_id) store.run("UPDATE remote_devices SET state='denied' WHERE device_id=? AND state='pending'", pairing.device_id);
        this.audit('pairing_expired', { pairing_id: pairing.pairing_id, device_id: pairing.device_id });
      }
      store.run('DELETE FROM client_challenges WHERE expires_at<=?', now);
      store.run('DELETE FROM client_tokens WHERE expires_at<=?', now);
      store.run('DELETE FROM client_receipts WHERE expires_at<=?', now);
      store.run("DELETE FROM client_pairings WHERE state IN ('confirmed','denied','expired') AND expires_at<?", new Date(this.clock() - 86_400_000).toISOString());
    });
  }
  device(id: string): Device {
    const device = this.company.store.get<Device>('SELECT * FROM remote_devices WHERE device_id=?', id);
    check(device, 403, 'device_unavailable', 'Device is not authorized.'); return device;
  }
  private active(id: string): Device {
    const device = this.device(id);
    check(device.state === 'active', 403, 'device_unavailable', 'Device is not authorized.');
    check(this.company.store.get("SELECT 1 FROM principals WHERE principal_id=? AND type='human' AND enabled=1", device.owner_principal_id), 403, 'principal_disabled', 'Human principal is disabled.');
    return device;
  }
  publicDevice(d: Device) {
    return { device_id: d.device_id, owner_principal_id: d.owner_principal_id, key_algorithm: d.key_algorithm,
      fingerprint: d.fingerprint, display_name: d.display_name, platform: d.platform, app_version: d.app_version,
      state: d.state, capabilities: JSON.parse(d.capabilities) as Scope[], created_at: d.created_at,
      confirmed_at: d.confirmed_at, last_seen_at: d.last_seen_at, revoked_at: d.revoked_at };
  }
  adminState() {
    this.human(); this.cleanup();
    return { ...this.hq, scope_allowlist: SCOPES, devices: this.company.store.all<Device>('SELECT * FROM remote_devices ORDER BY created_at,device_id').map(d => this.publicDevice(d)),
      pairings: this.company.store.all<Pick<Pairing, 'pairing_id' | 'device_id' | 'state' | 'created_at' | 'expires_at'>>('SELECT pairing_id,device_id,state,created_at,expires_at FROM client_pairings ORDER BY created_at') };
  }
  createPairing(value: unknown) {
    this.human(); const a = object(value, ['capabilities']); const ceiling = scopes(a.capabilities); this.cleanup();
    this.rates.take('admin_pairing', 10, this.clock());
    return this.company.store.transaction(() => {
      check(this.count("SELECT count(*) n FROM remote_devices WHERE state IN ('pending','active')") < LIMITS.devices && this.count('SELECT count(*) n FROM remote_devices') < LIMITS.retainedDevices,
        429, 'device_limit', 'Device limit reached.');
      check(this.count("SELECT count(*) n FROM client_pairings WHERE state IN ('open','claimed')") < LIMITS.pairings, 429, 'pairing_limit', 'Pending pairing limit reached.');
      const pairing_id = newId('pairing'); const pairing_secret = secret(); const expires_at = new Date(this.clock() + LIMITS.pairingMs).toISOString();
      this.company.store.run("INSERT INTO client_pairings VALUES (?,?, 'human',?,?,'open',NULL,?,?)", pairing_id, this.hq.hq_id, hash(pairing_secret), JSON.stringify(ceiling), this.now(), expires_at);
      this.audit('pairing_created', { pairing_id, hq_id: this.hq.hq_id, capabilities: ceiling, expires_at });
      const params = new URLSearchParams({ v: '1', hq_id: this.hq.hq_id, pairing_id, secret: pairing_secret });
      return { pairing_id, hq_id: this.hq.hq_id, capabilities: ceiling, expires_at, pairing_uri: `botsquad://pair?${params}`, pairing_secret };
    });
  }
  claim(value: unknown) {
    this.rates.take('claim', 20, this.clock()); this.cleanup();
    const a = object(value, ['pairing_id', 'pairing_secret', 'hq_id', 'public_key', 'display_name', 'platform', 'app_version']);
    const pairingId = identifier(a.pairing_id, 'pairing'); const providedSecret = base64url(a.pairing_secret, 32);
    check(a.hq_id === this.hq.hq_id, 403, 'pairing_invalid', 'Pairing is not authorized.');
    const jwk = object(a.public_key, ['kty', 'crv', 'x']); check(jwk.kty === 'OKP' && jwk.crv === 'Ed25519'); ed25519PublicEncoding(jwk.x);
    const public_key = canonical(jwk); const key = createPublicKey({ key: JSON.parse(public_key), format: 'jwk' });
    check(key.asymmetricKeyType === 'ed25519');
    const fingerprint = `SHA256:${createHash('sha256').update(Buffer.from(jwk.x as string, 'base64url')).digest('base64url')}`;
    const displayName = text(a.display_name, 80); const platform = text(a.platform, 40); const appVersion = text(a.app_version, 40);
    return this.company.store.transaction(() => {
      this.human();
      const p = this.company.store.get<Pairing>('SELECT * FROM client_pairings WHERE pairing_id=?', pairingId);
      check(p && secretEquals(providedSecret, p.secret_hash), 403, 'pairing_invalid', 'Pairing is not authorized.');
      check(p.state === 'open' && p.expires_at > this.now(), 410, 'pairing_unavailable', 'Pairing is expired or already used.');
      check(this.count("SELECT count(*) n FROM remote_devices WHERE state IN ('pending','active')") < LIMITS.devices && this.count('SELECT count(*) n FROM remote_devices') < LIMITS.retainedDevices,
        429, 'device_limit', 'Device limit reached.');
      check(!this.company.store.get("SELECT 1 FROM remote_devices WHERE fingerprint=? AND state IN ('pending','active')", fingerprint), 409, 'key_already_paired', 'Key already belongs to a pending or active device.');
      const deviceId = newId('device');
      this.company.store.run("INSERT INTO remote_devices VALUES (?, ?, ?, 'Ed25519', ?, ?, ?, ?, 'pending', ?, ?, NULL, NULL, NULL)", deviceId, p.owner_principal_id, public_key, fingerprint, displayName, platform, appVersion, p.capabilities, this.now());
      this.company.store.run("UPDATE client_pairings SET state='claimed',device_id=? WHERE pairing_id=?", deviceId, pairingId);
      this.audit('pairing_claimed', { pairing_id: pairingId, device_id: deviceId, fingerprint });
      return { hq_id: this.hq.hq_id, pairing_id: pairingId, device: this.publicDevice(this.device(deviceId)) };
    });
  }
  decide(value: unknown) {
    this.human(); this.cleanup(); const a = object(value, ['device_id', 'decision']);
    const deviceId = identifier(a.device_id, 'device'); check(a.decision === 'confirm' || a.decision === 'deny');
    return this.company.store.transaction(() => {
      const d = this.device(deviceId); const p = this.company.store.get<Pairing>('SELECT * FROM client_pairings WHERE device_id=?', deviceId);
      check(d.state === 'pending' && p?.state === 'claimed' && p.expires_at > this.now(), 409, 'pairing_unavailable', 'Pairing is no longer pending.');
      const confirmed = a.decision === 'confirm';
      this.company.store.run('UPDATE remote_devices SET state=?,confirmed_at=? WHERE device_id=?', confirmed ? 'active' : 'denied', confirmed ? this.now() : null, deviceId);
      this.company.store.run('UPDATE client_pairings SET state=? WHERE pairing_id=?', confirmed ? 'confirmed' : 'denied', p.pairing_id);
      this.audit(confirmed ? 'pairing_confirmed' : 'pairing_denied', { pairing_id: p.pairing_id, device_id: deviceId, fingerprint: d.fingerprint, capabilities: JSON.parse(d.capabilities) });
      return this.publicDevice(this.device(deviceId));
    });
  }
  revoke(value: unknown) {
    this.human(); const a = object(value, ['device_id']); const deviceId = identifier(a.device_id, 'device');
    return this.company.store.transaction(() => {
      const d = this.device(deviceId);
      if (d.state === 'revoked') return this.publicDevice(d);
      check(d.state === 'active', 409, 'invalid_state', 'Only active devices can be revoked.');
      this.company.store.run("UPDATE remote_devices SET state='revoked',revoked_at=? WHERE device_id=?", this.now(), deviceId);
      this.company.store.run('DELETE FROM client_tokens WHERE device_id=?', deviceId);
      this.company.store.run('DELETE FROM client_challenges WHERE device_id=?', deviceId);
      this.audit('device_revoked', { device_id: deviceId }); return this.publicDevice(this.device(deviceId));
    });
  }
  challenge(value: unknown) {
    this.rates.take('challenge', 60, this.clock()); this.cleanup();
    const a = object(value, ['device_id']); const deviceId = identifier(a.device_id, 'device'); this.active(deviceId);
    this.rates.take(`challenge:${deviceId}`, 12, this.clock());
    check(this.count('SELECT count(*) n FROM client_challenges WHERE device_id=?', deviceId) < LIMITS.challengesPerDevice, 429, 'challenge_limit', 'Outstanding challenge limit reached.');
    const challenge: Challenge = { challenge_id: newId('challenge'), hq_id: this.hq.hq_id, device_id: deviceId, nonce: secret(), expires_at: new Date(this.clock() + LIMITS.challengeMs).toISOString() };
    this.company.store.run('INSERT INTO client_challenges VALUES (?,?,?,?,NULL)', challenge.challenge_id, deviceId, challenge.nonce, challenge.expires_at);
    return { ...challenge, signing_context: 'botsquad-device-auth-v1' };
  }
  token(value: unknown) {
    this.rates.take('token', 60, this.clock()); this.cleanup();
    const a = object(value, ['device_id', 'challenge_id', 'signature']);
    const deviceId = identifier(a.device_id, 'device'); const challengeId = identifier(a.challenge_id, 'challenge'); const signature = base64url(a.signature, 64);
    const d = this.active(deviceId); this.rates.take(`token:${deviceId}`, 12, this.clock());
    const c = this.company.store.get<Challenge & { consumed_at: string | null }>('SELECT * FROM client_challenges WHERE challenge_id=? AND device_id=?', challengeId, deviceId);
    check(c && !c.consumed_at && c.expires_at > this.now(), 401, 'challenge_invalid', 'Challenge is invalid or expired.');
    // A failed signature also burns this challenge. Do not roll this consumption back.
    this.company.store.run('UPDATE client_challenges SET consumed_at=? WHERE challenge_id=? AND consumed_at IS NULL', this.now(), challengeId);
    const key = createPublicKey({ key: JSON.parse(d.public_key), format: 'jwk' });
    check(verify(null, signingBytes({ ...c, hq_id: this.hq.hq_id }), key, Buffer.from(signature, 'base64url')), 401, 'signature_invalid', 'Device proof was rejected.');
    check(this.count('SELECT count(*) n FROM client_tokens WHERE device_id=?', deviceId) < LIMITS.tokensPerDevice, 429, 'token_limit', 'Unexpired token limit reached.');
    return this.company.store.transaction(() => {
      this.active(deviceId); const access_token = secret(); const expires_at = new Date(this.clock() + LIMITS.tokenMs).toISOString();
      this.company.store.run('INSERT INTO client_tokens VALUES (?,?,?,?)', hash(access_token), deviceId, this.now(), expires_at);
      this.audit('authentication_succeeded', { device_id: deviceId, expires_at });
      return { access_token, token_type: 'Bearer', expires_at, hq_id: this.hq.hq_id, device_id: deviceId, capabilities: JSON.parse(d.capabilities) as Scope[] };
    });
  }
  authenticate(authorization: unknown, scope?: Scope): Authentication {
    check(typeof authorization === 'string' && /^Bearer [A-Za-z0-9_-]{43}$/.test(authorization), 401, 'unauthenticated', 'Valid device authentication is required.');
    const raw = authorization.slice(7); const digest = hash(raw);
    const token = this.company.store.get<{ token_hash: string; device_id: string; expires_at: string }>('SELECT * FROM client_tokens WHERE token_hash=?', digest);
    check(token && secretEquals(raw, token.token_hash) && token.expires_at > this.now(), 401, 'unauthenticated', 'Valid device authentication is required.');
    const device = this.active(token.device_id);
    check(!scope || (JSON.parse(device.capabilities) as Scope[]).includes(scope), 403, 'capability_denied', 'Device does not have the required capability.');
    if (!device.last_seen_at || this.clock() - Date.parse(device.last_seen_at) >= 60_000) this.company.store.run('UPDATE remote_devices SET last_seen_at=? WHERE device_id=?', this.now(), device.device_id);
    return { device, expires_at: token.expires_at, token_hash: digest };
  }
}
