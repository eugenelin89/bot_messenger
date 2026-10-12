import { createCipheriv, randomBytes } from 'node:crypto';
import { constants, openSync, closeSync, fsyncSync, readFileSync, lstatSync, fstatSync, mkdirSync, rmSync,
  existsSync, realpathSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { performance } from 'node:perf_hooks';
import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, time } from '../../domain/investment/identity.js';
import type { FinancialRequest, FinancialScope, YahooQuery, YahooTransport, FinancialResult, FinancialObservation } from '../../domain/market/financial.js';
import type { FinancialStore } from './financial-store.js';
import { historyManifest, verifyHistoryManifest, qualifyHistoryQuery, HISTORY_ID, historyLimits, type YahooHistoryManifest } from './yahoo-history-manifest.js';
import { verifyOwnerProbeHost, probeSourceIdentity, excludeProbePath, assertProbeExcluded } from './yahoo-probe-host.js';
import { writeProbeBytes, type WireReceipt } from './yahoo-probe-custody.js';
import type { YahooStageConfirmation } from './yahoo-diagnostics.js';

export const ownerHistoryRoot = () => join(userInfo().homedir, 'Library', 'Application Support', 'BotSquad-Yahoo-HQ-READY-03E');
export const ownerHistoryCapsule = () => '/private/tmp/botsquad-yahoo-HQ-READY-03E';
const mint = Symbol('03e-custody'), issued = new WeakSet<object>(), owners = new WeakSet<object>();
const exclusive = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW;
function syncDirectory(path: string): void { const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(fd); } finally { closeSync(fd); } }
function privatePath(path: string, directory = false) {
  const s = lstatSync(path);
  ensure(!s.isSymbolicLink() && (directory ? s.isDirectory() : s.isFile()) && s.uid === process.getuid!()
    && (s.mode & 0o077) === 0 && (directory || s.nlink === 1), 'probe_private_path'); return s;
}
function writeNew(root: string, name: string, value: unknown): string {
  const text = canonical(value), fd = openSync(join(root, name), exclusive, 0o600);
  try { writeProbeBytes(fd, text); fsyncSync(fd); } finally { closeSync(fd); } syncDirectory(root); return text;
}
function readPrivate(root: string, name: string): string {
  ensure(privatePath(join(root, name)).size <= 262144, 'probe_accounting_size'); return readFileSync(join(root, name), 'utf8');
}
interface Approval { kind: 'live' | 'fixture'; uid: number; root: string; dev: number; ino: number; manifest: YahooHistoryManifest; manifestHash: string; }
interface Clock { wall(): number; monotonic(): number; }
const systemClock: Clock = { wall: Date.now, monotonic: () => performance.now() };
function prepare(root: string, manifest: YahooHistoryManifest, kind: Approval['kind']): void {
  verifyHistoryManifest(manifest);
  ensure(resolve(root) === root && realpathSync(dirname(root)) === dirname(root), 'probe_canonical_parent');
  mkdirSync(root, { mode: 0o700 }); syncDirectory(dirname(root)); const stat = privatePath(root, true);
  if (kind === 'live') excludeProbePath(root);
  writeNew(root, 'approval.json', { kind, uid: process.getuid!(), root, dev: stat.dev, ino: stat.ino,
    manifest, manifestHash: hash(manifest) } satisfies Approval);
}
export function prepareOwnerHistory(): YahooHistoryManifest {
  verifyOwnerProbeHost(); const source = probeSourceIdentity();
  const manifest = historyManifest(new Date().toISOString(), source.sourceHash);
  prepare(ownerHistoryRoot(), manifest, 'live'); return manifest;
}
export function historyStatus() { return { id: HISTORY_ID, prepared: existsSync(join(ownerHistoryRoot(), 'approval.json')),
  spent: existsSync(join(ownerHistoryRoot(), 'spent.json')), capsulePresent: existsSync(ownerHistoryCapsule()),
  cleanup: existsSync(join(ownerHistoryRoot(), 'cleanup.json')), recoveryCleanup: existsSync(join(ownerHistoryRoot(), 'recovery-cleanup.json')), noResume: true }; }
/** Only after the supervisor has killed/joined the isolated data process group. Never resets an anchor. */
export function removeOwnedHistoryCapsule(root: string, capsule: string): void {
  if (existsSync(capsule)) {
    const owner = JSON.parse(readPrivate(root, 'capsule.json')) as { path: string; dev: number; ino: number; approvalId: string };
    const approval = JSON.parse(readPrivate(root, 'approval.json')) as Approval;
    const stat = privatePath(capsule, true);
    ensure(owner.path === capsule && owner.dev === stat.dev && owner.ino === stat.ino
      && owner.approvalId === approval.manifest.approvalId, 'probe_capsule_identity');
    rmSync(capsule, { recursive: true });
  }
  syncDirectory(dirname(capsule)); ensure(!existsSync(capsule), 'probe_cleanup_incomplete');
}
export function cleanupOwnerHistory(): void {
  const root = ownerHistoryRoot(); privatePath(root, true);
  const spent = JSON.parse(readPrivate(root, 'spent.json')) as { id: string; pid: number; noResume: boolean };
  ensure(spent.id === HISTORY_ID && spent.noResume === true && Number.isSafeInteger(spent.pid) && spent.pid > 1, 'probe_spent_corrupt');
  for (const pid of [spent.pid, -spent.pid]) {
    let gone = false; try { process.kill(pid, 0); } catch (e) { gone = (e as NodeJS.ErrnoException).code === 'ESRCH'; }
    ensure(gone, 'probe_cleanup_active_process');
  }
  removeOwnedHistoryCapsule(root, ownerHistoryCapsule());
  ensure(!existsSync(ownerHistoryCapsule()), 'probe_cleanup_incomplete');
  if (!existsSync(join(root, 'recovery-cleanup.json'))) writeNew(root, 'recovery-cleanup.json', { id: HISTORY_ID,
    at: new Date().toISOString(), originalProcessGroupGone: true, capsuleRemoved: true, spentRetained: true, noResume: true });
}

/** Separate issuer from the permanently spent 03B and 03D authorities. Fixtures never issue live wire. */
export class YahooHistoryCustody {
  #approval: Approval; #approvalText: string; #spentText = ''; #root: string; #capsule: string;
  #key = randomBytes(32); #ledger: number | undefined; #encrypted: number | undefined; #ledgerText = '';
  #store: FinancialStore | null = null; #transport: YahooTransport | null = null; #request: FinancialRequest | null = null;
  #logical = false; #attempts = 0; #bytes = 0; #pending = false; #wire = false;
  #closed = false; #stopped = false; #wireDenied = false; #lastResponse = -Infinity; #start: number; #wall: number;
  #clock: Clock; #timer: ReturnType<typeof setTimeout> | undefined; #encryptedBytes = 0;
  readonly abort = new AbortController();
  private constructor(secret: symbol, root: string, capsule: string, sourceHash: string, live: boolean, clock: Clock) {
    ensure(secret === mint, 'probe_capability_forged');
    this.#root = root; this.#capsule = capsule; this.#clock = clock; this.#start = clock.monotonic(); this.#wall = clock.wall();
    const stat = privatePath(root, true), approvalText = readPrivate(root, 'approval.json');
    const approval = JSON.parse(approvalText) as Approval; verifyHistoryManifest(approval.manifest);
    ensure(approval.kind === (live ? 'live' : 'fixture') && approval.uid === process.getuid!() && approval.root === root
      && approval.dev === stat.dev && approval.ino === stat.ino && approval.manifestHash === hash(approval.manifest), 'probe_approval_identity');
    ensure(approval.manifest.sourceHash === sourceHash, 'probe_source_changed');
    ensure(readdirSync(root).length === 1, 'probe_already_consumed_or_uncertain');
    this.#approval = approval; this.#approvalText = approvalText;
    this.checkTime();
    ensure(time(approval.manifest.expiresAt) - clock.wall() >= historyLimits.processMs, 'probe_expired_or_clock_reversal');
    ensure(!existsSync(capsule), 'probe_capsule_preexists');
    let createdCapsule = false;
    try {
      this.#spentText = writeNew(root, 'spent.json', { id: HISTORY_ID, approvalId: approval.manifest.approvalId,
        manifestHash: approval.manifestHash, sourceHash, uid: approval.uid, pid: process.pid,
        startedAt: new Date(clock.wall()).toISOString(), noResume: true });
      mkdirSync(capsule, { mode: 0o700 }); createdCapsule = true; syncDirectory(dirname(capsule)); privatePath(capsule, true);
      const capsuleStat = privatePath(capsule, true);
      writeNew(root, 'capsule.json', { path: capsule, dev: capsuleStat.dev, ino: capsuleStat.ino, approvalId: approval.manifest.approvalId });
      if (live) excludeProbePath(capsule);
      this.#ledger = openSync(join(root, 'accounting.jsonl'), exclusive, 0o600);
      this.#encrypted = openSync(join(capsule, 'evidence.aes256gcm'), exclusive, 0o600);
      fsyncSync(this.#ledger); fsyncSync(this.#encrypted); syncDirectory(root); syncDirectory(capsule);
      issued.add(this);
      this.#timer = setTimeout(() => this.abort.abort(new Error('financial_timeout')), historyLimits.operationMs);
      this.record({ type: 'consumed', id: HISTORY_ID, manifestHash: approval.manifestHash, at: new Date(clock.wall()).toISOString() });
      this.seal({ type: 'manifest', manifest: approval.manifest }); this.check();
      if (live) owners.add(this);
    } catch (e) {
      this.#stopped = true; this.#key.fill(0); clearTimeout(this.#timer);
      for (const fd of [this.#encrypted, this.#ledger]) if (fd !== undefined) try { closeSync(fd); } catch { /* outer supervised recovery retains the failure */ }
      try { if (createdCapsule) { rmSync(capsule, { recursive: true, force: true }); syncDirectory(dirname(capsule)); } } catch { /* outer recovery */ }
      throw e;
    }
  }
  static consumeOwner(): YahooHistoryCustody {
    ensure(typeof process.send === 'function' && process.connected && process.execArgv.length === 0
      && !process.env.NODE_OPTIONS && !process.env.NODE_EXTRA_CA_CERTS && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0', 'probe_supervisor_required');
    verifyOwnerProbeHost(); assertProbeExcluded(ownerHistoryRoot());
    return new YahooHistoryCustody(mint, ownerHistoryRoot(), ownerHistoryCapsule(), probeSourceIdentity().sourceHash, true, systemClock);
  }
  static prepareOffline(root: string, m: YahooHistoryManifest): void { prepare(root, m, 'fixture'); }
  static reopenOffline(root: string, sourceHash: string, clock: Clock = systemClock): YahooHistoryCustody {
    return new YahooHistoryCustody(mint, root, join(root, 'capsule'), sourceHash, false, clock);
  }
  static reopenOfflineAt(root: string, capsule: string, sourceHash: string, clock: Clock = systemClock): YahooHistoryCustody {
    return new YahooHistoryCustody(mint, root, capsule, sourceHash, false, clock);
  }
  static offline(root: string, m: YahooHistoryManifest, clock: Clock = systemClock): YahooHistoryCustody {
    this.prepareOffline(root, m); return this.reopenOffline(root, m.sourceHash, clock);
  }
  get manifest(): YahooHistoryManifest { return structuredClone(this.#approval.manifest); }
  get request(): FinancialRequest { ensure(this.#request, 'probe_no_logical_request'); return structuredClone(this.#request); }
  get signal(): AbortSignal { return this.abort.signal; }
  get capsulePath(): string { return this.#capsule; }
  private checkTime(): void {
    const now = this.#clock.wall();
    ensure(now >= this.#wall && now >= time(this.#approval.manifest.preparedAt) && now < time(this.#approval.manifest.expiresAt)
      && this.#clock.monotonic() - this.#start < historyLimits.operationMs, 'probe_expired_or_clock_reversal'); this.#wall = now;
  }
  check(): void {
    try {
      ensure(issued.has(this) && !this.#closed && !this.#stopped && !this.signal.aborted, 'probe_inactive'); this.checkTime();
      const root = privatePath(this.#root, true), fd = fstatSync(this.#ledger!), file = privatePath(join(this.#root, 'accounting.jsonl'));
      privatePath(this.#capsule, true);
      ensure(root.dev === this.#approval.dev && root.ino === this.#approval.ino
        && readPrivate(this.#root, 'approval.json') === this.#approvalText && readPrivate(this.#root, 'spent.json') === this.#spentText
        && file.ino === fd.ino && file.dev === fd.dev && readPrivate(this.#root, 'accounting.jsonl') === this.#ledgerText, 'probe_accounting_uncertain');
      this.checkTime(); // Filesystem stalls cannot conceal expiry.
    } catch (e) { this.#stopped = true; throw e; }
  }
  bind(store: FinancialStore): void {
    this.check(); ensure(!this.#store || this.#store === store, 'probe_store_rebound');
    ensure(store.db.all<{ file: string }>('PRAGMA database_list').every(row => row.file === ''), 'probe_requires_memory_store');
    store.db.db.exec('PRAGMA temp_store=MEMORY'); this.#store = store;
  }
  assertStore(store: FinancialStore, scope: FinancialScope): void { this.check(); ensure(store === this.#store && hash(scope) === hash(this.#approval.manifest.scope), 'probe_scope_mismatch'); }
  bindTransport(transport: YahooTransport): void { this.check(); ensure(!this.#transport, 'probe_transport_rebound'); this.#transport = transport; }
  begin(store: FinancialStore, transport: YahooTransport, request: FinancialRequest): void {
    this.assertStore(store, this.#approval.manifest.scope);
    ensure(!this.#logical && !this.#pending && this.#transport === transport, 'probe_logical_busy_or_exhausted');
    const m = this.#approval.manifest; ensure(hash(request) === hash(m.reads[0]), 'probe_logical_scope');
    for (const [kind, value] of [['policy', m.policy], ['instrument', m.instrument], ['calendar', m.calendar]] as const)
      ensure(hash(store.market.get(value.id, kind)) === hash(value), 'probe_reference_changed');
    this.#logical = true; this.#request = structuredClone(request);
    this.record({ type: 'logical', ordinal: 1, requestHash: hash(request), at: new Date(this.#clock.wall()).toISOString() });
  }
  reserve(query: YahooQuery, maxBytes: number): void {
    this.check(); ensure(this.#request && !this.#pending && !this.#wireDenied, 'probe_wire_busy_or_denied');
    ensure(this.#attempts < 6 && maxBytes > 0 && maxBytes <= 262144 && this.#bytes + 262144 <= 1048576, 'probe_budget_exhausted');
    const q = qualifyHistoryQuery(this.#approval.manifest, this.#request, query, this.#attempts + 1);
    this.#pending = true; this.#wire = false; this.#attempts++;
    this.record({ type: 'reserved', ordinal: this.#attempts, endpoint: q.endpoint, parameterHash: hash(q.params),
      reservedBytes: 262144, logicalRetryCount: 0, at: new Date(this.#clock.wall()).toISOString() });
    this.seal({ type: 'parameters', ordinal: this.#attempts, parameters: q.params });
  }
  /** Independent parent arms its ten-second timer BEFORE it acknowledges DNS permission. */
  async beforeDns(signal: AbortSignal): Promise<void> {
    this.check(); ensure(this.#pending, 'probe_wire_without_reservation');
    if (!owners.has(this)) return;
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => { process.removeListener('message', message); signal.removeEventListener('abort', abort); error ? reject(error) : resolve(); };
      const abort = () => finish(new Error('probe_inactive'));
      const message = (value: unknown) => { if (value && typeof value === 'object' && 'wirePermit' in value && value.wirePermit === this.#attempts) finish(); };
      process.on('message', message); signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) { abort(); return; }
      process.send!({ wireBegin: this.#attempts }, error => { if (error) finish(new Error('probe_inactive')); });
    });
    this.check();
  }
  async beforeWire(signal: AbortSignal): Promise<void> {
    this.check(); ensure(this.#pending && !this.#wire, 'probe_wire_without_reservation');
    const delay = Math.max(0, 5000 - (this.#clock.monotonic() - this.#lastResponse));
    if (delay) await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new Error('probe_inactive')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, Math.ceil(delay));
      signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    });
    this.check(); ensure(!signal.aborted && this.#clock.monotonic() - this.#lastResponse >= 5000, 'probe_wire_interval');
    this.record({ type: 'wire_started', ordinal: this.#attempts, at: new Date(this.#clock.wall()).toISOString() });
    this.check(); this.#wire = true;
  }
  confirmTransportStage(stage: YahooStageConfirmation): void { this.check(); ensure(this.#pending, 'probe_stage_without_reservation'); this.record({ type: 'transport_stage', ordinal: this.#attempts, ...stage }); }
  received(receipt: WireReceipt, body: Buffer): void {
    ensure(!this.#closed && this.#pending, 'probe_receipt_without_reservation');
    this.#bytes += receipt.receivedBytes;
    try {
      this.record({ type: 'received', ordinal: this.#attempts, ...receipt });
      if (body.length) this.seal({ type: 'body', ordinal: this.#attempts, ...receipt, bodyBase64: body.toString('base64') });
      this.#lastResponse = this.#clock.monotonic(); this.#pending = false;
      if (owners.has(this)) process.send!({ wireSettled: this.#attempts }, error => { if (error) { this.#stopped = true; this.abort.abort(); } });
    } finally { if (!receipt.complete || receipt.status !== 200 || this.#bytes > 1048576) this.#wireDenied = true; }
  }
  finish(result: FinancialResult, observation: FinancialObservation | null): void {
    try { this.seal({ type: 'logical_result', result, observation }); this.record({ type: 'logical_result', ordinal: 1, status: result.status, reason: result.reason, at: result.completedAt }); }
    finally { this.#request = null; this.#stopped = true; }
  }
  record(value: unknown): void {
    try { const line = canonical(value) + '\n'; ensure(Buffer.byteLength(this.#ledgerText + line) <= 262144, 'probe_accounting_size');
      writeProbeBytes(this.#ledger!, line); fsyncSync(this.#ledger!); this.#ledgerText += line;
    } catch (e) { this.#stopped = true; throw e; }
  }
  seal(value: unknown): void {
    try {
      ensure(!this.#closed, 'probe_inactive');
      const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.#key, nonce); cipher.setAAD(Buffer.from(this.#approval.manifestHash));
      const plaintext = Buffer.from(canonical(value)); let ciphertext: Buffer;
      try { ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]); } finally { plaintext.fill(0); }
      const packet = Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]); const size = Buffer.alloc(4); size.writeUInt32BE(packet.length);
      ensure(this.#encryptedBytes + packet.length + 4 <= 8 * 1048576, 'probe_capsule_size');
      writeProbeBytes(this.#encrypted!, size); writeProbeBytes(this.#encrypted!, packet); fsyncSync(this.#encrypted!); this.#encryptedBytes += packet.length + 4;
    } catch (e) { this.#stopped = true; throw e; }
  }
  destroy() {
    this.#closed = true; this.#stopped = true; this.#key.fill(0); this.abort.abort(); clearTimeout(this.#timer);
    let closed = true;
    for (const fd of [this.#encrypted, this.#ledger]) if (fd !== undefined) try { closeSync(fd); } catch { closed = false; }
    this.#encrypted = this.#ledger = undefined;
    try { removeOwnedHistoryCapsule(this.#root, this.#capsule); } catch { closed = false; }
    const evidence = { id: HISTORY_ID, keyDestroyed: true, capsuleRemoved: !existsSync(this.#capsule), descriptorsClosed: closed, spentRetained: true, noResume: true };
    if (!existsSync(join(this.#root, 'cleanup.json'))) writeNew(this.#root, 'cleanup.json', { ...evidence, at: new Date().toISOString() });
    ensure(closed && evidence.capsuleRemoved, 'probe_cleanup_incomplete'); return evidence;
  }
}
export function isHistoryCustody(value: unknown): value is YahooHistoryCustody { return typeof value === 'object' && value !== null && issued.has(value); }
export function isOwnerHistory(value: YahooHistoryCustody): boolean { return owners.has(value); }
