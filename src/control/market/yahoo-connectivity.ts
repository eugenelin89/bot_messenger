import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { isIP } from 'node:net';
import { createHash, randomUUID } from 'node:crypto';
import { constants, openSync, closeSync, writeSync, fsyncSync, readFileSync, lstatSync, fstatSync,
  mkdirSync, existsSync, realpathSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { performance } from 'node:perf_hooks';
import { ensure } from '../../domain/investment/arithmetic.js';
import { publicAddress } from '../../research/public-fetch.js';
import { yahooPinnedLookup, type YahooWire } from './yahoo-https.js';
import { yahooDiagnostic, type YahooStage, type YahooStageConfirmation, type YahooTransportDiagnostic } from './yahoo-diagnostics.js';
import { verifyOwnerProbeHost, probeSourceIdentity, excludeProbePath, assertProbeExcluded } from './yahoo-probe-host.js';

// Independent of HQ-READY-03B. No configurable URL, method, root, budget or live driver.
export const CONNECTIVITY_ID = 'HQ-READY-03D';
export const ownerConnectivityRoot = () => join(userInfo().homedir, 'Library', 'Application Support', 'BotSquad-Yahoo-HQ-READY-03D');
const endpoint = 'https://fc.yahoo.com/';
const scope = Object.freeze({ id: CONNECTIVITY_ID, endpointId: 'yahoo-connectivity-root-v1', method: 'GET', url: endpoint,
  attempts: 1, dnsInvocations: 1, selectedAddresses: 1, connections: 1, requests: 1, redirects: 0, retries: 0,
  lifetimeMs: 60000, transportMs: 10000, processMs: 30000, maxHeaderBytes: 16384, maxBodyBytes: 4096,
  consumeBody: false, retention: 'non-data-receipts-only', noResume: true } as const);
interface Source { commit: string; sourceHash: string; }
interface Manifest { scope: typeof scope; approvalId: string; preparedAt: string; expiresAt: string; source: Source;
  permission: 'owner-reported-verbal-personal-use-connectivity-and-non-data-retention'; }
interface Approval { kind: 'live' | 'fixture'; uid: number; root: string; dev: number; ino: number; manifest: Manifest; manifestHash: string; }
export interface ConnectivityReceipt {
  id: typeof CONNECTIVITY_ID; approvalId: string; endpointId: typeof scope.endpointId; reservation: 1;
  status: number | null; consumedBodyBytes: 0; bodyInspected: false; responseBodyComplete: false;
  diagnostic: YahooTransportDiagnostic; completedAt: string; noResume: true;
}
const json = (value: unknown) => JSON.stringify(value);
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const exclusive = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW;
function privatePath(path: string, directory = false) {
  const stat = lstatSync(path);
  ensure(!stat.isSymbolicLink() && (directory ? stat.isDirectory() : stat.isFile()) && stat.uid === process.getuid!()
    && (stat.mode & 0o077) === 0 && (directory || stat.nlink === 1), 'connectivity_private_path');
  return stat;
}
function syncDirectory(path: string): void {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}
function writeAll(fd: number, text: string): void {
  const bytes = Buffer.from(text); let offset = 0;
  while (offset < bytes.length) { const count = writeSync(fd, bytes, offset, bytes.length - offset); ensure(count > 0, 'connectivity_short_write'); offset += count; }
}
function writeNew(root: string, name: string, value: unknown): string {
  const text = json(value), fd = openSync(join(root, name), exclusive, 0o600);
  try { writeAll(fd, text); fsyncSync(fd); } finally { closeSync(fd); }
  syncDirectory(root); return text;
}
function readPrivate(root: string, name: string): string {
  const path = join(root, name), stat = privatePath(path);
  ensure(stat.size <= 32768, 'connectivity_receipt_size');
  return readFileSync(path, 'utf8');
}
function manifest(source: Source, at = Date.now(), approvalId: string = randomUUID()): Manifest {
  return { scope, approvalId, preparedAt: new Date(at).toISOString(), expiresAt: new Date(at + scope.lifetimeMs).toISOString(),
    source, permission: 'owner-reported-verbal-personal-use-connectivity-and-non-data-retention' };
}
function validateManifest(value: Manifest): void {
  ensure(value && /^[a-f0-9-]{36}$/.test(value.approvalId) && /^[a-f0-9]{40}$/.test(value.source?.commit)
    && /^[a-f0-9]{64}$/.test(value.source?.sourceHash), 'connectivity_manifest');
  ensure(json(value) === json(manifest(value.source, Date.parse(value.preparedAt), value.approvalId)), 'connectivity_manifest');
}
function prepare(root: string, source: Source, kind: Approval['kind'], at: number): Manifest {
  ensure(resolve(root) === root && realpathSync(dirname(root)) === dirname(root), 'connectivity_canonical_parent');
  // Existing/partial/expired/spent anchors are never repaired or replaced.
  mkdirSync(root, { mode: 0o700 }); syncDirectory(dirname(root));
  const stat = privatePath(root, true);
  if (kind === 'live') excludeProbePath(root);
  const value = manifest(source, at); validateManifest(value);
  writeNew(root, 'approval.json', { kind, uid: process.getuid!(), root, dev: stat.dev, ino: stat.ino,
    manifest: value, manifestHash: digest(json(value)) } satisfies Approval);
  return value;
}
export function prepareOwnerConnectivity(): Manifest {
  verifyOwnerProbeHost(); const source = probeSourceIdentity();
  return prepare(ownerConnectivityRoot(), source, 'live', Date.now());
}
export function prepareConnectivityFixture(root: string, source: Source, at = Date.now()): Manifest {
  return prepare(root, source, 'fixture', at);
}

class Custody {
  readonly abort = new AbortController();
  readonly approval: Approval;
  readonly start = performance.now();
  readonly expiry: ReturnType<typeof setTimeout>;
  #root: string; #approvalText: string; #spentText: string;
  #stageFd: number; #stageText = ''; #ordinal = 0; #stopped = false; #closed = false; #wall = Date.now();
  last: YahooStageConfirmation = { stage: 'exchange_started', at: new Date().toISOString(), elapsedMs: 0 };
  constructor(root: string, source: Source, kind: Approval['kind']) {
    this.#root = root;
    const stat = privatePath(root, true), text = readPrivate(root, 'approval.json');
    const approval = JSON.parse(text) as Approval; validateManifest(approval.manifest);
    ensure(approval.kind === kind && approval.uid === process.getuid!() && approval.root === root && approval.dev === stat.dev
      && approval.ino === stat.ino && approval.manifestHash === digest(json(approval.manifest)), 'connectivity_approval_identity');
    ensure(json(approval.manifest.source) === json(source), 'connectivity_source_changed');
    ensure(this.#wall >= Date.parse(approval.manifest.preparedAt) && this.#wall < Date.parse(approval.manifest.expiresAt), 'connectivity_expired');
    ensure(readdirSync(root).length === 1, 'connectivity_already_consumed_or_uncertain');
    this.#wall = Date.now();
    // The independent supervisor permits <=10s from its earlier consume command.
    // Refuse late admission so that this ceiling also ends before absolute expiry.
    ensure(this.#wall >= Date.parse(approval.manifest.preparedAt)
      && Date.parse(approval.manifest.expiresAt) - this.#wall >= scope.transportMs, 'connectivity_expired');
    this.approval = approval; this.#approvalText = text;
    // The reservation IS the exclusive spent marker: fsync before stages, DNS or wire.
    this.#spentText = writeNew(root, 'spent.json', { id: CONNECTIVITY_ID, approvalId: approval.manifest.approvalId,
      manifestHash: approval.manifestHash, source, reservation: 1, startedAt: new Date(this.#wall).toISOString(), pid: process.pid, noResume: true });
    this.#stageFd = openSync(join(root, 'stages.jsonl'), exclusive, 0o600);
    try { fsyncSync(this.#stageFd); syncDirectory(root); } catch (error) { closeSync(this.#stageFd); throw error; }
    this.expiry = setTimeout(() => this.abort.abort(new Error('connectivity_expired')), Math.max(1, Date.parse(approval.manifest.expiresAt) - Date.now()));
  }
  check(): void {
    try {
      ensure(!this.#stopped && !this.#closed && !this.abort.signal.aborted, 'connectivity_inactive');
      const now = Date.now();
      ensure(now >= this.#wall && now < Date.parse(this.approval.manifest.expiresAt)
        && performance.now() - this.start < scope.processMs, 'connectivity_expired'); this.#wall = now;
      const root = privatePath(this.#root, true), fd = fstatSync(this.#stageFd), file = privatePath(join(this.#root, 'stages.jsonl'));
      ensure(root.dev === this.approval.dev && root.ino === this.approval.ino
        && readPrivate(this.#root, 'approval.json') === this.#approvalText && readPrivate(this.#root, 'spent.json') === this.#spentText
        && file.dev === fd.dev && file.ino === fd.ino && readPrivate(this.#root, 'stages.jsonl') === this.#stageText, 'connectivity_accounting_uncertain');
      // No I/O follows this final time check: filesystem stalls cannot hide expiry.
      const finalNow = Date.now();
      ensure(finalNow >= this.#wall && finalNow < Date.parse(this.approval.manifest.expiresAt)
        && performance.now() - this.start < scope.processMs, 'connectivity_expired'); this.#wall = finalNow;
    } catch (error) { this.#stopped = true; throw error; }
  }
  stage(stage: YahooStage): void {
    try {
      this.check();
      const value = { stage, at: new Date().toISOString(), elapsedMs: Math.floor(performance.now() - this.start) };
      const line = json({ ordinal: this.#ordinal + 1, reservation: 1, ...value }) + '\n';
      ensure(Buffer.byteLength(this.#stageText + line) < 16384, 'connectivity_stage_limit');
      writeAll(this.#stageFd, line); fsyncSync(this.#stageFd);
      this.#stageText += line; this.#ordinal++; this.last = value; // Never claim a failed fsync as confirmed.
    } catch (error) { this.#stopped = true; throw error; }
  }
  finish(receipt: ConnectivityReceipt): void {
    this.#stopped = true; clearTimeout(this.expiry);
    const root = privatePath(this.#root, true);
    ensure(root.dev === this.approval.dev && root.ino === this.approval.ino
      && readPrivate(this.#root, 'approval.json') === this.#approvalText && readPrivate(this.#root, 'spent.json') === this.#spentText, 'connectivity_anchor_changed');
    try { writeNew(this.#root, 'accounting.json', receipt); }
    finally {
      this.#closed = true; closeSync(this.#stageFd);
      // This confirms memory-only handling and requested socket closure; process exit is
      // separately observed by the supervisor. It does not claim remote settlement.
      writeNew(this.#root, 'cleanup.json', { id: CONNECTIVITY_ID, approvalId: this.approval.manifest.approvalId,
        at: new Date().toISOString(), noRawDataPersisted: true, bodyConsumedBytes: 0, socketDestroyRequested: true,
        spentRetained: true, noResume: true });
    }
  }
}

async function exchange(custody: Custody, wire: YahooWire, signal: AbortSignal): Promise<ConnectivityReceipt> {
  const started = performance.now();
  const deadline = AbortSignal.timeout(scope.transportMs);
  let timedOut = false;
  const combined = AbortSignal.any([signal, deadline, custody.abort.signal]);
  let frozen = false, wireIntent = false, settlementFailed = false, status: number | null = null;
  let req: ClientRequest | undefined, res: IncomingMessage | undefined;
  const confirmed = new Set<YahooStage>();
  const checkTime = () => {
    if (performance.now() - started >= scope.transportMs) timedOut = true;
    ensure(!timedOut && !combined.aborted, 'yahoo_cancelled');
  };
  const stage = (value: YahooStage) => {
    if (frozen || confirmed.has(value)) return;
    checkTime();
    try { custody.stage(value); confirmed.add(value); } catch (error) { settlementFailed = true; throw error; }
    checkTime();
    try { custody.check(); } catch (error) { settlementFailed = true; throw error; }
    checkTime();
  };
  const check = () => {
    checkTime();
    try { custody.check(); } catch (error) { settlementFailed = true; throw error; }
    checkTime();
  };
  const discard = (incoming?: IncomingMessage) => {
    if (!incoming) return;
    incoming.destroy(); incoming.headers = {}; incoming.rawHeaders.length = 0;
    incoming.trailers = {}; incoming.rawTrailers.length = 0;
  };
  const close = () => { discard(res); req?.destroy(); };
  const diagnostic = (error: unknown) => yahooDiagnostic(custody.last, error, status, wireIntent,
    timedOut || deadline.aborted ? 'timeout' : combined.aborted ? 'cancelled' : null, settlementFailed);
  let result: YahooTransportDiagnostic;
  try {
    stage('request_reserved'); check(); stage('dns_started');
    const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
      let done = false;
      const finish = (error: unknown, value?: LookupAddress[]) => {
        if (done) return; done = true; combined.removeEventListener('abort', abort);
        if (error) reject(error); else resolve(value!);
      };
      const abort = () => finish(new Error('yahoo_cancelled'));
      combined.addEventListener('abort', abort, { once: true });
      if (combined.aborted) { abort(); return; }
      try { check(); void wire.lookup('fc.yahoo.com', { all: true, verbatim: true }).then(value => finish(null, value), error => finish(error)); }
      catch (error) { finish(error); }
    });
    check(); stage('dns_resolved');
    ensure(Array.isArray(addresses) && addresses.length > 0 && addresses.length <= 32 && addresses.every(a =>
      a && typeof a.address === 'string' && [4, 6].includes(a.family) && isIP(a.address) === a.family && publicAddress(a.address)), 'yahoo_protected_address');
    const selected = addresses[0]!; stage('destination_validated'); check(); stage('wire_intent'); wireIntent = true;
    result = await new Promise<YahooTransportDiagnostic>(resolve => {
      const finish = (error: unknown) => {
        if (frozen) return;
        frozen = true; combined.removeEventListener('abort', abort);
        const value = diagnostic(error); close(); resolve(value);
      };
      const abort = () => finish(new Error('yahoo_cancelled'));
      const guarded = (action: () => void) => {
        if (frozen) return;
        try { check(); action(); } catch (error) { finish(error); }
      };
      combined.addEventListener('abort', abort, { once: true });
      if (combined.aborted) { abort(); return; }
      try {
        check(); req = wire.request(new URL(endpoint), { method: 'GET', agent: false, signal: combined,
          rejectUnauthorized: true, servername: 'fc.yahoo.com', family: selected.family, ...{ autoSelectFamily: false },
          lookup: yahooPinnedLookup(selected), maxHeaderSize: scope.maxHeaderBytes,
          headers: { 'User-Agent': 'BotSquad/0.1 private personal research', Accept: 'application/json, text/plain', 'Accept-Encoding': 'identity' } }, incoming => {
          incoming.on('error', error => finish(error));
          if (frozen) { discard(incoming); return; }
          res = incoming;
          guarded(() => {
            status = Number.isInteger(incoming.statusCode) && incoming.statusCode! >= 100 && incoming.statusCode! <= 599 ? incoming.statusCode! : null;
            stage('response_headers'); ensure(status !== null, 'yahoo_response_schema');
            ensure(!incoming.headers['content-encoding'] || incoming.headers['content-encoding'] === 'identity', 'yahoo_compressed_response');
            const length = incoming.headers['content-length'];
            ensure(length === undefined || typeof length === 'string' && /^\d{1,10}$/.test(length) && Number(length) <= scope.maxBodyBytes, 'yahoo_response_size');
            // No read/data listener, decoding, cookie jar, header capture or response body.
            // Every status is terminal, including success, redirects, refusal and rate limits.
            finish(null);
          });
        });
        req.on('error', error => finish(error));
        req.once('close', () => { if (!frozen) finish(new Error('yahoo_response_incomplete')); });
        req.once('socket', socket => guarded(() => {
          stage('socket_assigned');
          socket.once('connect', () => guarded(() => stage('tcp_connected')));
          socket.once('secureConnect', () => guarded(() => stage('tls_established')));
        }));
        req.once('finish', () => guarded(() => stage('request_finished')));
        // Interim headers also constitute a response and terminate this one request.
        req.once('information', info => guarded(() => {
          status = Number.isInteger(info.statusCode) && info.statusCode >= 100 && info.statusCode <= 199 ? info.statusCode : null;
          stage('response_headers'); ensure(status !== null, 'yahoo_response_schema'); finish(null);
        }));
        req.once('upgrade', (incoming, socket) => {
          socket.destroy(); incoming.on('error', () => {});
          if (frozen) { discard(incoming); return; }
          res = incoming; guarded(() => { status = incoming.statusCode === 101 ? 101 : null; stage('response_headers'); finish(new Error('yahoo_response_schema')); });
        });
        if (frozen) { req.destroy(); return; }
        stage('request_created'); check(); req.end();
      } catch (error) { finish(error); }
    });
  } catch (error) { frozen = true; result = diagnostic(error); }
  finally { frozen = true; close(); }
  const receipt: ConnectivityReceipt = { id: CONNECTIVITY_ID, approvalId: custody.approval.manifest.approvalId,
    endpointId: scope.endpointId, reservation: 1, status, consumedBodyBytes: 0, bodyInspected: false,
    responseBodyComplete: false, diagnostic: result, completedAt: new Date().toISOString(), noResume: true };
  custody.finish(receipt); return receipt;
}
/** Only the dedicated owner supervisor calls this. No caller-supplied drivers or endpoint. */
export async function runOwnerConnectivity(signal: AbortSignal): Promise<ConnectivityReceipt> {
  ensure(typeof process.send === 'function' && process.connected, 'connectivity_supervisor_required');
  verifyOwnerProbeHost(); assertProbeExcluded(ownerConnectivityRoot()); const source = probeSourceIdentity();
  return exchange(new Custody(ownerConnectivityRoot(), source, 'live'), { lookup, request: httpsRequest }, signal);
}
/** Authored fixtures cannot be admitted as live owner authority or select built-in drivers. */
export async function runConnectivityFixture(root: string, source: Source, wire: YahooWire,
  signal: AbortSignal = new AbortController().signal): Promise<ConnectivityReceipt> {
  ensure(wire.lookup !== lookup && wire.request !== httpsRequest, 'connectivity_fixture_requires_fakes');
  return exchange(new Custody(root, source, 'fixture'), wire, signal);
}
export function connectivityStatus(): { prepared: boolean; spent: boolean; accounting: boolean; cleanup: boolean } {
  const root = ownerConnectivityRoot();
  return { prepared: existsSync(join(root, 'approval.json')), spent: existsSync(join(root, 'spent.json')),
    accounting: existsSync(join(root, 'accounting.json')), cleanup: existsSync(join(root, 'cleanup.json')) };
}
/** No deletion/reset. A dead original process can only gain a non-data recovery receipt. */
export function recoverConnectivity(root = ownerConnectivityRoot()): void {
  privatePath(root, true);
  const spent = JSON.parse(readPrivate(root, 'spent.json')) as { id: string; pid: number; noResume: boolean; approvalId: string; reservation: number };
  ensure(spent.id === CONNECTIVITY_ID && spent.noResume === true && spent.reservation === 1
    && Number.isSafeInteger(spent.pid) && spent.pid > 0, 'connectivity_spent_corrupt');
  let active = true; try { process.kill(spent.pid, 0); } catch (error) { active = (error as NodeJS.ErrnoException).code !== 'ESRCH'; }
  ensure(!active, 'connectivity_process_active');
  writeNew(root, 'recovery-cleanup.json', { id: CONNECTIVITY_ID, approvalId: spent.approvalId,
    at: new Date().toISOString(), processExited: true, noRawDataPersisted: true, spentRetained: true, noResume: true });
}
