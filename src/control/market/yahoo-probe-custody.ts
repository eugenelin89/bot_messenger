import { createCipheriv, randomBytes, createHash } from 'node:crypto';
import { constants, openSync, closeSync, writeSync, fsyncSync, readFileSync, lstatSync, fstatSync, mkdirSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, time } from '../../domain/investment/identity.js';
import type { FinancialRequest, FinancialScope, YahooQuery, YahooTransport, FinancialResult, FinancialObservation } from '../../domain/market/financial.js';
import type { FinancialStore } from './financial-store.js';
import { PROBE_ID, verifyProbeManifest, qualifyProbeQuery, type YahooProbeManifest } from './yahoo-probe-manifest.js';
import { ownerProbeRoot, ownerCapsuleRoot, verifyOwnerProbeHost, probeSourceIdentity, excludeProbePath, assertProbeExcluded } from './yahoo-probe-host.js';
import { probeMayContinue } from './yahoo-probe-report.js';
import type { YahooStageConfirmation, YahooTransportDiagnostic } from './yahoo-diagnostics.js';
export { ownerProbeRoot, ownerCapsuleRoot } from './yahoo-probe-host.js';

// Fixed, nonvolatile host anchor, separate from disposable data. No run ID/path override in owner CLI.
const mint = Symbol('trusted-probe-custody'), issued = new WeakSet<object>(), ownerIssued = new WeakSet<object>();
const digest = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');
const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW;
/** Short writes are retried before fsync; zero progress or any failure denies I/O. */
export function writeProbeBytes(fd: number, body: Buffer | string): void {
  const bytes = typeof body === 'string' ? Buffer.from(body) : body;
  let offset = 0;
  while (offset < bytes.length) { const n = writeSync(fd, bytes, offset, bytes.length - offset); ensure(n > 0, 'probe_short_write'); offset += n; }
}
function syncDirectory(path: string): void { const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(fd); } finally { closeSync(fd); } }
function privatePath(path: string, directory: boolean): void {
  const stat = lstatSync(path);
  ensure(!stat.isSymbolicLink() && (directory ? stat.isDirectory() : stat.isFile()) && stat.uid === process.getuid!() && (stat.mode & 0o077) === 0, 'probe_private_path');
  if (!directory) ensure(stat.nlink === 1, 'probe_hardlink');
}
function writeNew(path: string, body: string): void {
  const fd = openSync(path, flags, 0o600);
  try { writeProbeBytes(fd, body); fsyncSync(fd); } finally { closeSync(fd); }
  syncDirectory(dirname(path));
}
/** Owner provisioning is deliberately separate from run/cleanup. An existing directory is never reset. */
export function prepareOwnerProbe(manifest: YahooProbeManifest): void {
  verifyOwnerProbeHost(); ensure(probeSourceIdentity().sourceHash === manifest.sourceHash, 'probe_source_changed');
  prepare(ownerProbeRoot(), manifest, 'live');
  excludeProbePath(ownerProbeRoot());
}
/** Recovery removes only ciphertext. It never deletes or reissues the spent authorization. */
export function cleanupOwnerProbe(): { capsuleRemoved: boolean; spentRetained: true; noResume: true } {
  const root = ownerProbeRoot(); privatePath(root, true); privatePath(join(root, 'spent.json'), false);
  const spent = JSON.parse(readFileSync(join(root, 'spent.json'), 'utf8')) as {pid:number};
  ensure(Number.isSafeInteger(spent.pid) && spent.pid > 0, 'probe_spent_corrupt');
  let active = true; try { process.kill(spent.pid, 0); } catch (e) { active = (e as NodeJS.ErrnoException).code !== 'ESRCH'; }
  ensure(!active, 'probe_cleanup_active_process'); // PID reuse conservatively requires owner inspection.
  rmSync(ownerCapsuleRoot(), { recursive: true, force: true }); syncDirectory(dirname(ownerCapsuleRoot()));
  const evidence = { capsuleRemoved: !existsSync(ownerCapsuleRoot()), spentRetained: true as const, noResume: true as const };
  if (!existsSync(join(root, 'recovery-cleanup.json'))) writeNew(join(root, 'recovery-cleanup.json'), canonical({ ...evidence, at: new Date().toISOString() }));
  return evidence;
}
function prepare(root: string, manifest: YahooProbeManifest, kind: 'live' | 'fixture'): void {
  verifyProbeManifest(manifest);
  ensure(resolve(root) === root && realpathSync(dirname(root)) === dirname(root), 'probe_canonical_parent');
  mkdirSync(root, { mode: 0o700 }); syncDirectory(dirname(root)); privatePath(root, true);
  writeNew(join(root, 'approval.json'), canonical({ kind, uid: process.getuid!(), manifest, manifestHash: hash(manifest) }));
}
export interface WireReceipt {
  status: number | null; receivedBytes: number; complete: boolean; httpDate: string | null;
  retryAfter: string | null; reason: string; completedAt: string;
  diagnostic?: YahooTransportDiagnostic;
  /** Trusted completed-response classification; never rewrites the original HTTP status. */
  bootstrapDisposition?: 'accepted_cookie_404' | 'rejected_bootstrap';
  bodyHash?: string;
}
interface Clock { wall(): number; monotonic(): number; }
const systemClock: Clock = { wall: Date.now, monotonic: () => performance.now() };

/** Opaque, non-serializable authority for exactly one already-consumed owner manifest.
 * No application route, employee tool, resume, rearm or authority from a database exists.
 */
export class YahooProbeCustody {
  #manifest: YahooProbeManifest;
  #live: boolean;
  #root: string;
  #capsule: string;
  #key = randomBytes(32);
  #ledger: number;
  #encrypted: number;
  #ledgerText = '';
  #spent: string;
  #approval: string;
  #store: FinancialStore | null = null;
  #transport: YahooTransport | null = null;
  #request: FinancialRequest | null = null;
  #logical = 0;
  #attempts = 0;
  #bytes = 0;
  #pending = false;
  #wire = false;
  #closed = false;
  #stopped = false;
  #wireDenied = false;
  #retryRequired = false;
  #retryCount = 0;
  #lastQueryHash: string | null = null;
  #lastWire = -Infinity;
  #highWall: number;
  #startMono: number;
  #clock: Clock;
  #encryptedBytes = 0;
  #timer: ReturnType<typeof setTimeout>;
  readonly abort = new AbortController();

  private constructor(secret: symbol, root: string, capsule: string, sourceHash: string, live: boolean, clock: Clock) {
    ensure(secret === mint, 'probe_capability_forged');
    privatePath(root, true); privatePath(join(root, 'approval.json'), false);
    const approval = readFileSync(join(root, 'approval.json'), 'utf8');
    ensure(Buffer.byteLength(approval) < 100000, 'probe_approval_size');
    const parsed = JSON.parse(approval) as {kind: string; uid: number; manifest: YahooProbeManifest; manifestHash: string};
    verifyProbeManifest(parsed.manifest);
    ensure(parsed.kind === (live ? 'live' : 'fixture') && parsed.uid === process.getuid!() && parsed.manifestHash === hash(parsed.manifest), 'probe_approval_identity');
    ensure(parsed.manifest.sourceHash === sourceHash, 'probe_source_changed');
    ensure(clock.wall() >= time(parsed.manifest.preparedAt) && clock.wall() < time(parsed.manifest.expiresAt), 'probe_expired');
    this.#root = root; this.#capsule = capsule; this.#live = live; this.#clock = clock;
    this.#manifest = structuredClone(parsed.manifest); this.#approval = approval;
    this.#highWall = clock.wall(); this.#startMono = clock.monotonic();
    this.#spent = canonical({ id: PROBE_ID, manifestHash: parsed.manifestHash, sourceHash, uid: parsed.uid, startedAt: new Date(clock.wall()).toISOString(), pid: process.pid, noResume: true });
    // The create-only spent marker is fsynced before any capability, capsule or transport exists.
    writeNew(join(root, 'spent.json'), this.#spent);
    mkdirSync(capsule, { mode: 0o700 }); syncDirectory(dirname(capsule)); privatePath(capsule, true);
    if (live) excludeProbePath(capsule);
    this.#ledger = openSync(join(root, 'accounting.jsonl'), flags, 0o600);
    this.#encrypted = openSync(join(capsule, 'evidence.aes256gcm'), flags, 0o600);
    syncDirectory(root); syncDirectory(capsule);
    issued.add(this);
    this.#timer = setTimeout(() => { this.abort.abort(); this.destroy(); }, Math.max(1, time(this.#manifest.expiresAt) - clock.wall()));
    this.record({ type: 'consumed', at: new Date(clock.wall()).toISOString(), manifestHash: parsed.manifestHash });
    this.seal({ type: 'manifest', manifest: this.#manifest });
    if (live) ownerIssued.add(this);
  }
  static consumeOwner(): YahooProbeCustody {
    verifyOwnerProbeHost(); assertProbeExcluded(ownerProbeRoot());
    return new YahooProbeCustody(mint, ownerProbeRoot(), ownerCapsuleRoot(), probeSourceIdentity().sourceHash, true, systemClock);
  }
  /** Offline custody fixture can never construct a real-wire transport. */
  static offline(root: string, manifest: YahooProbeManifest, clock: Clock = systemClock): YahooProbeCustody {
    prepare(root, manifest, 'fixture');
    return YahooProbeCustody.reopenOffline(root, manifest.sourceHash, clock);
  }
  static prepareOffline(root: string, manifest: YahooProbeManifest): void { prepare(root, manifest, 'fixture'); }
  static reopenOffline(root: string, sourceHash: string, clock: Clock = systemClock): YahooProbeCustody {
    return new YahooProbeCustody(mint, root, join(root, 'capsule'), sourceHash, false, clock);
  }
  get live(): boolean { return this.#live; }
  get manifest(): YahooProbeManifest { return structuredClone(this.#manifest); }
  get capsulePath(): string { return this.#capsule; }
  get request(): FinancialRequest { ensure(this.#request, 'probe_no_logical_request'); return structuredClone(this.#request); }
  get signal(): AbortSignal { return this.abort.signal; }
  check(): void {
    ensure(issued.has(this) && !this.#closed && !this.#stopped && !this.signal.aborted, 'probe_inactive');
    const now = this.#clock.wall();
    ensure(now >= this.#highWall && now < time(this.#manifest.expiresAt) && this.#clock.monotonic() - this.#startMono < 600000, 'probe_expired_or_clock_reversal');
    this.#highWall = now;
    for (const name of ['approval.json', 'spent.json', 'accounting.jsonl']) privatePath(join(this.#root, name), false);
    privatePath(this.#root, true); privatePath(this.#capsule, true);
    ensure(readFileSync(join(this.#root, 'approval.json'), 'utf8') === this.#approval && readFileSync(join(this.#root, 'spent.json'), 'utf8') === this.#spent, 'probe_anchor_changed');
    const ledger = lstatSync(join(this.#root, 'accounting.jsonl')), fd = fstatSync(this.#ledger);
    ensure(ledger.ino === fd.ino && ledger.dev === fd.dev && readFileSync(join(this.#root, 'accounting.jsonl'), 'utf8') === this.#ledgerText, 'probe_accounting_uncertain');
  }
  bind(store: FinancialStore): void {
    this.check(); ensure(this.#store === null || this.#store === store, 'probe_store_rebound');
    ensure(store.db.all<{file: string}>('PRAGMA database_list').every(row => row.file === ''), 'probe_requires_memory_store');
    store.db.db.exec('PRAGMA temp_store=MEMORY'); this.#store = store;
  }
  assertStore(store: FinancialStore, scope: FinancialScope): void {
    this.check(); ensure(this.#store === store && hash(scope) === hash(this.#manifest.scope), 'probe_scope_mismatch');
  }
  bindTransport(transport: YahooTransport): void { this.check(); ensure(this.#transport === null, 'probe_transport_rebound'); this.#transport = transport; }
  begin(store: FinancialStore, transport: YahooTransport, request: FinancialRequest): void {
    this.assertStore(store, this.#manifest.scope);
    ensure(this.#transport === transport && !this.#request && !this.#pending && this.#logical < 9, 'probe_logical_busy_or_exhausted');
    const m = this.#manifest;
    ensure(hash(request) === hash(m.reads[this.#logical]), 'probe_logical_order');
    for (const [kind, value] of [['policy', m.policy], ['instrument', m.instrument], ['calendar', m.calendar]] as const)
      ensure(hash(store.market.get(value.id, kind)) === hash(value), 'probe_reference_changed');
    this.#logical++; this.#request = structuredClone(request);
    this.#retryCount = 0; this.#retryRequired = false; this.#lastQueryHash = null;
    this.record({ type: 'logical', ordinal: this.#logical, requestHash: hash(request), at: new Date(this.#clock.wall()).toISOString() });
  }
  reserve(query: YahooQuery, maxBytes: number): void {
    this.check(); ensure(!this.#pending && this.#request && !this.#wireDenied, 'probe_wire_busy_or_denied');
    const qualified = qualifyProbeQuery(this.#manifest, this.#request, query);
    if (this.#retryRequired) {
      ensure(hash(qualified) === this.#lastQueryHash && this.#retryCount < 2, 'probe_transient_retry_limit');
      this.#retryCount++;
    }
    this.#retryRequired = false; this.#lastQueryHash = hash(qualified);
    ensure(this.#attempts < 50 && maxBytes > 0 && maxBytes <= 262144 && this.#bytes + 262144 <= 8388608, 'probe_budget_exhausted');
    this.#pending = true; this.#wire = false; this.#attempts++;
    const reservation = { type: 'reserved', ordinal: this.#attempts, logical: this.#logical, endpoint: qualified.endpoint,
      parameterHash: hash(qualified.params), reservedBytes: 262144, logicalRetryCount: this.#retryCount, at: new Date(this.#clock.wall()).toISOString() };
    // Both durable records precede DNS. Losing either write burns this run, never refunds it.
    this.record(reservation); this.seal({ ...reservation, parameters: qualified.params, request: this.#request });
  }
  async beforeWire(signal: AbortSignal): Promise<void> {
    this.check(); ensure(this.#pending && !this.#wire, 'probe_wire_without_reservation');
    const delay = Math.max(0, 5000 - (this.#clock.monotonic() - this.#lastWire));
    if (delay) await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new Error('probe_cancelled')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, Math.ceil(delay));
      signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    });
    this.check(); ensure(!signal.aborted && this.#clock.monotonic() - this.#lastWire >= 5000, 'probe_wire_interval');
    this.#wire = true; this.#lastWire = this.#clock.monotonic();
    this.record({ type: 'wire_started', ordinal: this.#attempts, at: new Date(this.#clock.wall()).toISOString(), elapsedMs: Math.floor(this.#lastWire - this.#startMono) });
  }
  confirmTransportStage(stage: YahooStageConfirmation): void {
    this.check(); ensure(this.#pending, 'probe_stage_without_reservation');
    // A crash or immediate custody cleanup can preclude the terminal receipt. Keep the
    // last durably confirmed non-data stage without inferring a response or replay right.
    this.record({ type: 'transport_stage', ordinal: this.#attempts, stage: stage.stage, at: stage.at, elapsedMs: stage.elapsedMs });
  }
  received(receipt: WireReceipt, body: Buffer): void {
    ensure(!this.#closed && this.#pending, 'probe_receipt_without_reservation');
    this.#bytes += receipt.receivedBytes;
    this.record({ type: 'received', ordinal: this.#attempts, ...receipt });
    // Stronger than start-to-start spacing: all DNS, TLS, response and receipt-fsync latency
    // completes before the next five-second interval starts.
    this.#lastWire = this.#clock.monotonic();
    const bootstrap = this.#request && body.length > 0;
    // Caller omits cookie/crumb bodies; only transport-safe evidence enters the capsule.
    if (bootstrap) this.seal({ type: 'body', ordinal: this.#attempts, ...receipt, sha256: digest(body), bodyBase64: body.toString('base64') });
    this.#pending = false;
    this.#retryRequired = receipt.complete && [502, 503, 504].includes(receipt.status ?? 0);
    if (!receipt.complete || receipt.status !== 200 && ![502, 503, 504].includes(receipt.status ?? 0)) this.#wireDenied = true;
    if (this.#bytes > 8388608) this.#wireDenied = true;
  }
  finish(result: FinancialResult, observation: FinancialObservation | null): void {
    ensure(!this.#closed, 'probe_inactive');
    this.seal({ type: 'logical_result', result, observation });
    this.record({ type: 'logical_result', ordinal: this.#logical, status: result.status, reason: result.reason, at: result.completedAt });
    this.#request = null;
    if (!probeMayContinue(result, observation)) this.#stopped = true;
  }
  record(value: unknown): void {
    const line = canonical(value) + '\n'; ensure(Buffer.byteLength(this.#ledgerText) + Buffer.byteLength(line) <= 262144, 'probe_accounting_size');
    writeProbeBytes(this.#ledger, line); fsyncSync(this.#ledger); this.#ledgerText += line;
  }
  seal(value: unknown): void {
    ensure(!this.#closed, 'probe_inactive');
    const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.#key, nonce);
    cipher.setAAD(Buffer.from(hash(this.#manifest)));
    const plaintext = Buffer.from(canonical(value));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]); plaintext.fill(0);
    const packet = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]);
    const size = Buffer.alloc(4); size.writeUInt32BE(packet.length);
    ensure(this.#encryptedBytes + packet.length + 4 <= 64 * 1024 * 1024, 'probe_capsule_size');
    writeProbeBytes(this.#encrypted, size); writeProbeBytes(this.#encrypted, packet); fsyncSync(this.#encrypted);
    this.#encryptedBytes += packet.length + 4;
  }
  destroy(): { keyDestroyed: true; capsuleRemoved: boolean; capsulePath: string; retained: string[] } {
    if (!this.#closed) {
      this.#closed = true; this.#key.fill(0); this.abort.abort(); clearTimeout(this.#timer);
      closeSync(this.#encrypted); closeSync(this.#ledger);
    }
    rmSync(this.#capsule, { recursive: true, force: true }); syncDirectory(dirname(this.#capsule));
    const evidence = { keyDestroyed: true as const, capsuleRemoved: !existsSync(this.#capsule), capsulePath: this.#capsule,
      retained: ['approval.json', 'spent.json', 'accounting.jsonl'] };
    if (!existsSync(join(this.#root, 'cleanup.json'))) writeNew(join(this.#root, 'cleanup.json'), canonical({ ...evidence, at: new Date().toISOString() }));
    return evidence;
  }
}
export function assertProbeCapability(value: unknown): asserts value is YahooProbeCustody {
  ensure(typeof value === 'object' && value !== null && issued.has(value), 'probe_capability_forged');
}
/** Authority checks use module-private issuance, never an overridable instance property. */
export function isOwnerProbe(value: YahooProbeCustody): boolean { return ownerIssued.has(value); }
