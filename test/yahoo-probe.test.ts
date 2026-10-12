import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { mkdtempSync, realpathSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, copyFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { YahooProbeCustody, assertProbeCapability, ownerProbeRoot } from '../src/control/market/yahoo-probe-custody.js';
import { probeManifest, verifyProbeManifest, qualifyProbeQuery, type YahooProbeManifest } from '../src/control/market/yahoo-probe-manifest.js';
import { yahooProbeTransport, type YahooWire } from '../src/control/market/yahoo-https.js';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { FINANCIAL_SCHEMA, YAHOO_ADAPTER, yahooSettings, type YahooAdapter, type YahooQuery } from '../src/domain/market/financial.js';
import { FinancialAdmission } from '../src/control/market/financial-admission.js';
import { inspectYahooObservation, probeMayContinue } from '../src/control/market/yahoo-probe-report.js';
import { chart, responseFor } from './fixtures/yahoo/support.js';

const sourceHash = 'a'.repeat(64);
const metadata: YahooQuery = { method: 'GET', url: 'https://query2.finance.yahoo.com/v8/finance/chart/AAPL', params: { range: '1d', interval: '1d' } };
function makeFixture() {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-probe-test-'))), root = join(parent, 'anchor');
  let now = Date.now(), mono = 0;
  const clock = { wall: () => now, monotonic: () => mono };
  const manifest = probeManifest(new Date(now).toISOString(), sourceHash);
  const custody = YahooProbeCustody.offline(root, manifest, clock);
  const db = new Store(':memory:'), market = new MarketStore(db), store = new FinancialStore(market, custody);
  for (const [kind, value] of [['policy', manifest.policy], ['instrument', manifest.instrument], ['calendar', manifest.calendar]] as const) market.register(value, kind, manifest.preparedAt);
  store.initialize(manifest.scope);
  return { parent, root, manifest, custody, db, store, clock,
    tick(ms = 5000) { now += ms; mono += Math.max(0, ms); },
    accounting() { return readFileSync(join(root, 'accounting.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)); },
    close() { custody.destroy(); db.close(); rmSync(parent, { recursive: true, force: true }); } };
}
type Fixture = ReturnType<typeof makeFixture>;
function fakeWire(f: Fixture, options: { status?: number; body?: Buffer | string; headers?: IncomingMessage['headers']; dnsDelay?: number; realClock?: boolean; pending?: boolean } = {}) {
  let sockets = 0, dns = 0;
  const starts: number[] = [];
  const wire: YahooWire = {
    lookup: (async () => { dns++; if (options.dnsDelay) await new Promise(r => setTimeout(r, options.dnsDelay)); if (!options.realClock) f.tick(); return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as typeof lookup,
    request: ((_url: URL, opts: RequestOptions, callback: (res: IncomingMessage) => void) => {
      sockets++; starts.push(performance.now());
      const req = new EventEmitter() as ClientRequest;
      req.destroy = (() => req) as ClientRequest['destroy'];
      opts.signal?.addEventListener('abort', () => req.emit('error', new Error('fixture_abort')), { once: true });
      req.end = (() => {
        queueMicrotask(() => {
          const res = new PassThrough() as unknown as IncomingMessage;
          res.statusCode = options.status ?? 200;
          res.headers = options.headers ?? { 'content-type': 'application/json', date: 'Sun, 11 Oct 2026 20:00:00 GMT' };
          callback(res); if (!options.pending) (res as unknown as PassThrough).end(options.body ?? '{}');
        }); return req;
      }) as ClientRequest['end']; return req;
    }) as typeof httpsRequest,
  };
  return { wire, starts, get sockets() { return sockets; }, get dns() { return dns; } };
}
test('transient retries are capped across different exchanges in the same logical read', async t => {
  const f=makeFixture();t.after(f.close);const options={status:503,body:'fixture transient'};
  const wire=fakeWire(f,options),transport=begin(f,wire.wire);
  await transport.exchange(metadata,new AbortController().signal,262144);
  options.status=200;await transport.exchange(metadata,new AbortController().signal,262144);
  const cookie:YahooQuery={method:'GET',url:'https://fc.yahoo.com/',params:{}};
  options.status=503;await transport.exchange(cookie,new AbortController().signal,262144);
  options.status=200;await transport.exchange(cookie,new AbortController().signal,262144);
  options.status=503;await transport.exchange(metadata,new AbortController().signal,262144);
  await assert.rejects(()=>transport.exchange(metadata,new AbortController().signal,262144),/retry_limit/);
  assert.equal(wire.sockets,5);assert.equal(f.accounting().filter(r=>r.type==='reserved').at(-1).logicalRetryCount,2);
});
function begin(f: Fixture, wire: YahooWire) {
  const transport = yahooProbeTransport(f.custody, wire); f.custody.begin(f.store, transport, f.manifest.reads[0]!); return transport;
}

test('manifest freezes exact nine reads, UTC epochs, source identity, all private rights and bounds', () => {
  const m = probeManifest('2026-10-12T04:00:00.000Z', sourceHash); verifyProbeManifest(m);
  assert.equal(m.reads.length, 9); assert.equal(m.scope.maxRequests, 50); assert.equal(m.scope.maxTotalBytes, 8388608);
  assert.equal(new Date(m.wire.historyPeriod1 * 1000).toISOString(), '2026-09-01T04:00:00.000Z');
  assert.equal(new Date(m.wire.historyPeriod2 * 1000).toISOString(), '2026-10-01T04:00:00.000Z');
  assert.equal(new Date(m.wire.statementPeriod1 * 1000).toISOString(), '2016-12-31T00:00:00.000Z');
  assert.equal(m.policy.rights.public_display.status, 'denied'); assert.equal(m.policy.rights.permanent_archive.status, 'denied');
  for (const change of [(v: typeof m) => v.scope.maxRequests++, (v: typeof m) => v.reads.reverse(), (v: typeof m) => { v.instrument.currency = 'CAD' as never; }, (v: typeof m) => v.calendar.calendar.sessions.pop()]) {
    const changed = structuredClone(m); change(changed); assert.throws(() => verifyProbeManifest(changed), /manifest_mismatch/);
  }
});
test('exact live intersection rejects broad statement names, chunks, epochs and symbol/range expansion', () => {
  const m = probeManifest(new Date().toISOString(), sourceHash), request = m.reads[3]!;
  const query: YahooQuery = { method: 'GET', url: 'https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL', params: {
    symbol: 'AAPL', type: m.wire.statementFields.income.map(s => 'annual' + s).join(','), period1: m.wire.statementPeriod1, period2: m.wire.period2 } };
  qualifyProbeQuery(m, request, query);
  for (const params of [{ ...query.params, type: 'annualUnreviewedMetric' }, { ...query.params, type: 'annualTotalRevenue' },
    { ...query.params, period1: m.wire.statementPeriod1 - 1 }, { ...query.params, period2: m.wire.period2 + 1 }, { ...query.params, symbol: 'MSFT' }])
    assert.throws(() => qualifyProbeQuery(m, request, { ...query, params }));
  assert.throws(() => qualifyProbeQuery(m, m.reads[0]!, { ...metadata, params: { interval: '1d', period1: m.wire.historyPeriod1 + 1, period2: m.wire.historyPeriod2 } }), /epochs/);
});
test('forged/serialized authority and fixture real-wire promotion fail closed', t => {
  const f = makeFixture(); t.after(f.close);
  for (const forged of [{}, JSON.parse(JSON.stringify(f.custody)), Object.create(YahooProbeCustody.prototype)]) assert.throws(() => assertProbeCapability(forged), /forged/);
  assert.throws(() => yahooProbeTransport(f.custody), /fake_wire/);
  assert.throws(() => yahooProbeTransport(f.custody, { lookup, request: httpsRequest }), /fake_wire/);
  Object.defineProperty(f.custody, 'live', { value: true });
  assert.equal(f.custody.live, true);
  assert.throws(() => yahooProbeTransport(f.custody), /fake_wire/);
  assert.throws(() => yahooProbeTransport(f.custody, { lookup, request: httpsRequest }), /fake_wire/);
  assert.equal(yahooProbeTransport(f.custody, fakeWire(f).wire).kind, 'authored_yahoo_fixture');
  assert.throws(() => new FinancialStore(new MarketStore(f.db), {} as YahooProbeCustody), /forged/);
  assert.throws(() => new FinancialStore(new MarketStore(f.db)).initialize(f.manifest.scope), /not_authorized/);
});
test('environment HOME cannot move the OS-account singleton anchor', () => {
  const before = ownerProbeRoot(), original = process.env.HOME;
  try { process.env.HOME = '/private/tmp/not-the-owner'; assert.equal(ownerProbeRoot(), before); }
  finally { if(original===undefined)delete process.env.HOME;else process.env.HOME=original; }
});
test('independent concurrent processes cannot consume one approved anchor twice', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-race-'))), root = join(parent, 'anchor');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  YahooProbeCustody.prepareOffline(root, probeManifest(new Date().toISOString(), sourceHash));
  const url = new URL('../src/control/market/yahoo-probe-custody.js', import.meta.url).href;
  const script = `import {YahooProbeCustody} from ${JSON.stringify(url)};try{const c=YahooProbeCustody.reopenOffline(process.argv[1],process.argv[2]);c.destroy();console.log('WIN');}catch{console.log('DENIED');}`;
  const run = () => new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script, root, sourceHash], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', b => { output += String(b); }); child.once('error', reject); child.once('exit', () => resolve(output.trim()));
  });
  assert.deepEqual((await Promise.all([run(), run()])).sort(), ['DENIED', 'WIN']);
  assert.equal(readFileSync(join(root, 'accounting.jsonl'), 'utf8').includes('wire_started'), false);
});
test('short filesystem writes complete fully before DNS and failed fsync prevents all I/O', async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f), transport = begin(f, wire.wire);
  const original = fs.writeSync; let writes = 0;
  const mock = t.mock.method(fs, 'writeSync', ((fd: number, buffer: Buffer, offset: number, length: number) => {
    writes++; return original(fd, buffer, offset, Math.min(length, 7));
  }) as typeof fs.writeSync); syncBuiltinESMExports();
  try { await transport.exchange(metadata, new AbortController().signal, 262144); }
  finally { mock.mock.restore(); syncBuiltinESMExports(); }
  assert.ok(writes > 10); assert.equal(wire.sockets, 1); assert.doesNotThrow(() => f.custody.check());
  const syncMock = t.mock.method(fs, 'fsyncSync', () => { throw new Error('fixture_fsync_failure'); }); syncBuiltinESMExports();
  try { await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144), /yahoo_settlement_unknown/); }
  finally { syncMock.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(wire.sockets, 1); assert.equal(wire.dns, 1);
  await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144), /uncertain|busy/);
});
test('scope/reference/store/transport identity is bound, logical reads cannot reorder or repeat', t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f), transport = yahooProbeTransport(f.custody, wire.wire);
  assert.throws(() => f.custody.begin(f.store, transport, f.manifest.reads[1]!), /order/);
  assert.throws(() => f.custody.begin(f.store, { kind: 'yahoo-https-v1', exchange: transport.exchange }, f.manifest.reads[0]!), /busy/);
  assert.throws(() => f.store.initialize({ ...f.manifest.scope, maxRequests: 49 }), /scope_mismatch/);
  const other = new Store(':memory:'); t.after(() => other.close()); assert.throws(() => new FinancialStore(new MarketStore(other), f.custody), /rebound/);
  f.custody.begin(f.store, transport, f.manifest.reads[0]!); assert.throws(() => f.custody.begin(f.store, transport, f.manifest.reads[0]!), /busy/);
  assert.equal(wire.dns, 0);
});
test('capsule copying/removal/restoration cannot refill spent authority; source mismatch and missing anchor deny', t => {
  const f = makeFixture(); t.after(f.close); const copy = join(f.parent, 'ciphertext-copy');
  copyFileSync(join(f.custody.capsulePath, 'evidence.aes256gcm'), copy);
  f.custody.destroy(); assert.equal(existsSync(f.custody.capsulePath), false);
  assert.throws(() => YahooProbeCustody.reopenOffline(f.root, sourceHash), /EEXIST/);
  assert.throws(() => YahooProbeCustody.reopenOffline(f.root, 'b'.repeat(64)), /source_changed/);
  assert.throws(() => YahooProbeCustody.reopenOffline(join(f.parent, 'missing'), sourceHash), /ENOENT/);
  assert.throws(() => YahooProbeCustody.offline(f.root, f.manifest), /EEXIST/);
  assert.equal(readFileSync(copy).includes(Buffer.from('owner_reported')), false);
});
for (const kind of ['spent', 'approval', 'accounting', 'permissions', 'clock', 'expiry'] as const)
  test(`changed ${kind} fences before DNS`, async t => {
    const f = makeFixture(); t.after(f.close); const wire = fakeWire(f), transport = begin(f, wire.wire);
    if (kind === 'spent') rmSync(join(f.root, 'spent.json'));
    if (kind === 'approval') writeFileSync(join(f.root, 'approval.json'), '{}');
    if (kind === 'accounting') writeFileSync(join(f.root, 'accounting.jsonl'), '');
    if (kind === 'permissions') chmodSync(join(f.root, 'spent.json'), 0o644);
    if (kind === 'clock') f.tick(-1);
    if (kind === 'expiry') f.tick(600000);
    await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144)); assert.equal(wire.dns, 0);
  });
for (const status of [401, 403, 404, 429, 302]) test(`HTTP ${status} is counted exactly once and blocks all further requests`, async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f, { status, body: 'blocked', headers: { 'content-type': 'text/plain', 'retry-after': '120', date: 'Sun, 11 Oct 2026 20:00:00 GMT' } });
  const transport = begin(f, wire.wire); const response = await transport.exchange(metadata, new AbortController().signal, 262144); assert.equal(response.status, status);
  await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144), /denied/);
  const received = f.accounting().find(r => r.type === 'received'); assert.equal(received.status, status); assert.equal(received.receivedBytes, 7); assert.equal(received.retryAfter, '120');
  assert.equal(received.httpDate, 'Sun, 11 Oct 2026 20:00:00 GMT'); assert.equal(wire.sockets, 1);
});
for (const body of ['<html>consent</html>', 'Sign in to continue', 'a b', '<token>']) test(`bootstrap barriers stop without fallback: ${body}`, async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f, { body, headers: { 'content-type': 'text/plain' } });
  const transport = begin(f, wire.wire), q: YahooQuery = { method: 'GET', url: 'https://query1.finance.yahoo.com/v1/test/getcrumb', params: {} };
  await assert.rejects(() => transport.exchange(q, new AbortController().signal, 262144), /barrier|schema/);
  assert.equal(wire.sockets, 1); assert.equal(f.accounting().at(-1).complete, false);
  assert.equal(readFileSync(join(f.custody.capsulePath, 'evidence.aes256gcm')).includes(Buffer.from(body)), false);
});
test('strict UTF-8, known status and bounded partial body accounting survive transport rejection', async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f, { body: Buffer.from([0xc3, 0x28]) }), transport = begin(f, wire.wire);
  await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144));
  const receipt = f.accounting().at(-1); assert.equal(receipt.status, 200); assert.equal(receipt.receivedBytes, 2); assert.equal(receipt.complete, false);
  assert.equal(f.accounting().filter(r => r.type === 'reserved').length, 1);
});
test('body overflow never consumes beyond caller cap; encrypted evidence contains no plaintext and cleanup keeps only nondata', async t => {
  const f = makeFixture(); t.after(f.close); const sentinel = 'private-fixture-sentinel-'.repeat(100), wire = fakeWire(f, { body: sentinel }), transport = begin(f, wire.wire);
  await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 1024), /size/);
  assert.equal(f.accounting().at(-1).receivedBytes, 1024); assert.equal(f.accounting().at(-1).complete, false);
  for (const path of [join(f.root, 'accounting.jsonl'), join(f.custody.capsulePath, 'evidence.aes256gcm')]) assert.equal(readFileSync(path).includes(Buffer.from('private-fixture-sentinel')), false);
  const cleanup = f.custody.destroy(); assert.equal(cleanup.capsuleRemoved, true); assert.equal(cleanup.keyDestroyed, true);
  assert.deepEqual(readdirSync(f.root).sort(), ['accounting.jsonl', 'approval.json', 'cleanup.json', 'spent.json']);
});
test('50-attempt ceiling and 8MiB charged reservation remain global across wire calls', async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f), transport = begin(f, wire.wire);
  for (let n = 0; n < 50; n++) await transport.exchange(metadata, new AbortController().signal, 262144);
  await assert.rejects(() => transport.exchange(metadata, new AbortController().signal, 262144), /budget/);
  assert.equal(wire.sockets, 50);
  const g = makeFixture(); t.after(g.close); const full = fakeWire(g, { body: 'x'.repeat(262144) }), second = begin(g, full.wire);
  for (let n = 0; n < 32; n++) await second.exchange(metadata, new AbortController().signal, 262144);
  await assert.rejects(() => second.exchange(metadata, new AbortController().signal, 262144), /budget/);
  assert.equal(g.accounting().filter(r => r.type === 'received').reduce((n, r) => n + r.receivedBytes, 0), 8388608);
});

test('actual-wire spacing stays five seconds when first DNS is slow and second DNS is fast', async t => {
  const f = makeFixture(); t.after(f.close);
  // Real clock custody, no synthetic time acceleration, and deliberately different DNS delays.
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-spacing-'))), root = join(parent, 'anchor');
  const m = probeManifest(new Date().toISOString(), sourceHash), custody = YahooProbeCustody.offline(root, m);
  const db = new Store(':memory:'), market = new MarketStore(db), store = new FinancialStore(market, custody);
  t.after(() => { custody.destroy(); db.close(); rmSync(parent, { recursive: true, force: true }); });
  for (const [kind, value] of [['policy', m.policy], ['instrument', m.instrument], ['calendar', m.calendar]] as const) market.register(value, kind, m.preparedAt);
  store.initialize(m.scope);
  const wire = fakeWire(f, { realClock: true }); let calls = 0; const original = wire.wire.lookup;
  wire.wire.lookup = (async (...args: unknown[]) => { if (calls++ === 0) await new Promise(r => setTimeout(r, 1000)); return (original as (...args: unknown[]) => Promise<unknown>)(...args); }) as typeof lookup;
  const transport = yahooProbeTransport(custody, wire.wire); custody.begin(store, transport, m.reads[0]!);
  await transport.exchange(metadata, new AbortController().signal, 262144);
  await transport.exchange(metadata, new AbortController().signal, 262144);
  assert.ok(wire.starts[1]! - wire.starts[0]! >= 5000, String(wire.starts));
});

test('gateway live fixture retains observed provenance but employee admission stays denied', async t => {
  const f = makeFixture(); t.after(f.close); const wire = fakeWire(f), transport = yahooProbeTransport(f.custody, wire.wire);
  const adapter: YahooAdapter = { kind: YAHOO_ADAPTER, async read({ request }, exchange) {
    await exchange(metadata);
    return JSON.stringify({ protocol: YAHOO_ADAPTER, versions: { python: '3.12.12', yfinance: '1.7.0' }, symbol: 'AAPL', dataClass: request.dataClass,
      currency: 'USD', timezone: 'America/New_York', exchange: 'NMS', settings: yahooSettings,
      data: { columns: ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume', 'Dividends', 'Stock Splits'], rows: [{ index: '2026-09-01T00:00:00-04:00', providerTimestamp: '2026-09-01T13:30:00Z', dividend: null, split: null, values: ['10', '12', '9', '11', '11', '100', '0', '0'] }] } });
  } };
  const clock = { now: () => new Date(f.clock.wall()).toISOString() };
  const result = await new FinancialDataGateway(f.store, clock, adapter, transport).collect(f.manifest.policy.id, f.manifest.reads[0]!, 'fixture-observed', f.custody.signal);
  assert.equal(result.status, 'ok', result.reason); const observation = f.store.observation(result.observationId!);
  assert.equal(observation.mode, 'observed'); assert.equal(observation.providerAvailableAt, null); assert.equal(observation.executionQualified, false);
  assert.throws(() => new FinancialAdmission(f.store, clock).deliver(observation.id, 'worker', 'delivery'), /denied/);
  const report = inspectYahooObservation(observation); assert.equal(report.missingSessionCount, 20); assert.equal(report.records, 1);
  f.custody.finish(result, observation);
});

for (const phase of ['consumed', 'reserved', 'wire_started', 'tcp_connected', 'received'] as const) test(`SIGKILL after ${phase} keeps spent admission and encrypted custody, with no resume`, async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-crash-'))), root = join(parent, 'anchor');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const custodyUrl = new URL('../src/control/market/yahoo-probe-custody.js', import.meta.url).href;
  const manifestUrl = new URL('../src/control/market/yahoo-probe-manifest.js', import.meta.url).href;
  const storeUrl = new URL('../src/persistence/store.js', import.meta.url).href, marketUrl = new URL('../src/control/market/store.js', import.meta.url).href, financialUrl = new URL('../src/control/market/financial-store.js', import.meta.url).href;
  const script = `import {YahooProbeCustody} from ${JSON.stringify(custodyUrl)};import {probeManifest} from ${JSON.stringify(manifestUrl)};
    import {Store} from ${JSON.stringify(storeUrl)};import {MarketStore} from ${JSON.stringify(marketUrl)};import {FinancialStore} from ${JSON.stringify(financialUrl)};
    const m=probeManifest(new Date().toISOString(),${JSON.stringify(sourceHash)}),c=YahooProbeCustody.offline(process.argv[1],m);
    const db=new Store(':memory:'),market=new MarketStore(db),store=new FinancialStore(market,c);
    for(const [kind,v] of [['policy',m.policy],['instrument',m.instrument],['calendar',m.calendar]])market.register(v,kind,m.preparedAt);
    store.initialize(m.scope);const transport={kind:'authored_yahoo_fixture',exchange:async()=>{throw Error('fixture_only')}};c.bindTransport(transport);c.begin(store,transport,m.reads[0]);
    if(process.argv[2]!=='consumed')c.reserve(${JSON.stringify(metadata)},262144);
    if(['wire_started','tcp_connected','received'].includes(process.argv[2]))await c.beforeWire(new AbortController().signal);
    if(process.argv[2]==='tcp_connected')c.confirmTransportStage({stage:'tcp_connected',at:new Date().toISOString(),elapsedMs:7});
    if(process.argv[2]==='received')c.received({status:200,receivedBytes:23,complete:true,httpDate:null,retryAfter:null,reason:'response',completedAt:new Date().toISOString()},Buffer.from('private-fixture-payload'));
    process.stdout.write('READY\\n');setInterval(()=>{},1000);`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, root, phase], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill('SIGKILL'));
  await Promise.race([new Promise<void>((resolve, reject) => { child.stdout.on('data', b => { if (String(b).includes('READY')) resolve(); }); child.once('exit', () => reject(new Error('child_early_exit'))); }), new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error('deadline')), 5000); timer.unref(); })]);
  const closed = once(child, 'exit'); child.kill('SIGKILL'); await closed;
  assert.throws(() => YahooProbeCustody.reopenOffline(root, sourceHash), /EEXIST/);
  const receipt = readFileSync(join(root, 'accounting.jsonl'), 'utf8'); assert.ok(receipt.includes(phase));
  const ciphertext = readFileSync(join(root, 'capsule', 'evidence.aes256gcm'));
  assert.equal(ciphertext.includes(Buffer.from('private-fixture-payload')), false);
  assert.deepEqual(readdirSync(join(root, 'capsule')), ['evidence.aes256gcm']);
});

test('actual pinned Python leaves no provider-data cache files during a delegated exchange or cancellation', async t => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-no-cache-'))); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const adapter = new PythonYahooAdapter(directory), abort = new AbortController(); let reads = 0;
  const request = { ...probeManifest(new Date().toISOString(), sourceHash).reads[0]!, schemaVersion: FINANCIAL_SCHEMA };
  const result = adapter.read({ symbol: 'AAPL', request }, async query => {
    reads++; const original = responseFor({ ...query, url: query.url.replaceAll('AAPL', 'ACME') });
    assert.ok(readdirSync(directory).every(folder => readdirSync(join(directory, folder)).length === 0));
    if (reads > 2) { abort.abort(); throw new Error('fixture_stop'); }
    return { ...original, body: original.body.replaceAll('ACME', 'AAPL') };
  }, abort.signal);
  await assert.rejects(result); assert.ok(reads >= 3); assert.deepEqual(readdirSync(directory), []);
});

test('pinned Python September history uses exact manifest parameters with fictitious bodies only', async t => {
  const f = makeFixture(); t.after(f.close); const queries: YahooQuery[] = [];
  const adapter = new PythonYahooAdapter();
  const result = await adapter.read({ symbol: 'AAPL', request: f.manifest.reads[0]! }, async query => {
    qualifyProbeQuery(f.manifest, f.manifest.reads[0]!, query); queries.push(query);
    const response = responseFor({ ...query, url: query.url.replaceAll('AAPL', 'ACME') });
    if (query.url.includes('/chart/')) {
      const data = chart(); data.chart.result[0]!.meta.symbol = 'AAPL'; data.chart.result[0]!.meta.exchangeName = 'NMS';
      data.chart.result[0]!.timestamp = [Date.parse('2026-09-01T13:30:00Z') / 1000, Date.parse('2026-09-02T13:30:00Z') / 1000];
      data.chart.result[0]!.events = { dividends: {}, splits: {} } as never;
      response.body = JSON.stringify(data);
    } else response.body = response.body.replaceAll('ACME', 'AAPL');
    return response;
  }, new AbortController().signal);
  assert.equal(JSON.parse(result).symbol, 'AAPL'); assert.ok(queries.some(q => q.params.period1 === f.manifest.wire.historyPeriod1));
});

function probeFixtureResponse(manifest:YahooProbeManifest,query:YahooQuery){
  const response=responseFor({...query,url:query.url.replaceAll('AAPL','ACME')});
  response.body=response.body.replaceAll('ACME','AAPL');
  if(new URL(query.url).pathname.includes('/chart/')){
    const data=chart(),row=data.chart.result[0]!;row.meta.symbol='AAPL';row.meta.exchangeName='NMS';
    const sessions=manifest.calendar.calendar.sessions.filter(s=>s.status==='open'&&s.date>='2026-09-01'&&s.date<'2026-10-01');
    row.timestamp=sessions.map(s=>Date.parse(s.open)/1000);
    row.indicators.quote=[{open:sessions.map(()=>10),high:sessions.map(()=>12),low:sessions.map(()=>9),close:sessions.map(()=>11),volume:sessions.map(()=>100)}];
    row.indicators.adjclose=[{adjclose:sessions.map(()=>11)}];row.events={dividends:{},splits:{}} as never;
    response.body=JSON.stringify(data);
  }
  return response;
}
test('strict gateway sequence includes valid empty actions, then stops at50 actual fixture requests',async t=>{
  const f=makeFixture();t.after(f.close);let sockets=0;
  const wire:YahooWire={
    lookup:(async()=>{f.tick();return [{address:'1.1.1.1',family:4}];}) as unknown as typeof lookup,
    request:((url:URL,_opts:RequestOptions,callback:(res:IncomingMessage)=>void)=>{
      sockets++;const req=new EventEmitter() as ClientRequest;req.destroy=(()=>req) as ClientRequest['destroy'];
      req.end=(()=>{queueMicrotask(()=>{
        const query:YahooQuery={method:'GET',url:url.href,params:{}};
        const response=probeFixtureResponse(f.manifest,query);
        const res=new PassThrough() as unknown as IncomingMessage;res.statusCode=200;res.headers={'content-type':response.contentType};
        callback(res);(res as unknown as PassThrough).end(response.body);
      });return req;}) as ClientRequest['end'];return req;
    }) as typeof httpsRequest,
  };
  const transport=yahooProbeTransport(f.custody,wire),clock={now:()=>new Date(f.clock.wall()).toISOString()};
  const gateway=new FinancialDataGateway(f.store,clock,new PythonYahooAdapter(f.custody.capsulePath),transport);
  const results=[];
  for(const [n,request] of f.manifest.reads.entries()){
    const result=await gateway.collect(f.manifest.policy.id,request,`nine-${n}`,f.custody.signal);
    const observation=result.observationId?f.store.observation(result.observationId):null;
    if(!probeMayContinue(result,observation)){
      assert.equal(result.reason,'financial_request_limit');assert.equal(sockets,50);f.custody.finish(result,observation);results.push(result);break;
    }
    if(n===1){assert.equal(result.status,'missing');assert.equal(observation!.records.length,0);assert.equal(observation!.missingSessions.length,0);}
    f.custody.finish(result,observation);results.push(result);
  }
  assert.ok(results.length>2&&results.length<9);assert.equal(sockets,50);assert.equal(sockets,f.accounting().filter(r=>r.type==='wire_started').length);
  assert.ok(f.accounting().filter(r=>r.type==='received').reduce((n,r)=>n+r.receivedBytes,0)<8388608);
  assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_observations')!.n,results.length-1);
  assert.throws(()=>f.custody.check(),/inactive/);
});

test('each of all nine pinned-Python operations qualifies its exact manifest epochs and fields offline',async()=>{
  const manifest=probeManifest(new Date().toISOString(),sourceHash);let calls=0,completed=0;
  for(const request of manifest.reads){
    const result=await new PythonYahooAdapter().read({symbol:'AAPL',request},async query=>{
      calls++;qualifyProbeQuery(manifest,request,query);return probeFixtureResponse(manifest,query);
    },new AbortController().signal);
    const output=JSON.parse(result);assert.equal(output.dataClass,request.dataClass);assert.equal(output.symbol,'AAPL');completed++;
  }
  assert.equal(completed,9);assert.ok(calls>50,'separate operation fixtures do not claim one live probe can complete nine within50');
});
