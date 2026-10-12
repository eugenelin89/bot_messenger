import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawn, fork } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import type { YahooStageConfirmation } from '../src/control/market/yahoo-diagnostics.js';
import fs, { mkdtempSync, realpathSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync, mkdirSync, cpSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
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
import { FinancialAdmission } from '../src/control/market/financial-admission.js';
import { YahooHistoryCustody, ownerHistoryRoot, isHistoryCustody, removeOwnedHistoryCapsule } from '../src/control/market/yahoo-history-custody.js';
import { historyManifest, verifyHistoryManifest, qualifyHistoryQuery, historyLimits } from '../src/control/market/yahoo-history-manifest.js';
import { probeManifest } from '../src/control/market/yahoo-probe-manifest.js';
import { YahooProbeCustody } from '../src/control/market/yahoo-probe-custody.js';
import { assertFinancialCustody } from '../src/control/market/financial-custody.js';
import { yahooProbeTransport, type YahooWire } from '../src/control/market/yahoo-https.js';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { inspectHistory } from '../src/control/market/yahoo-history-report.js';
import { qualifyYahooQuery } from '../src/domain/market/yahoo-transport.js';
import { yahooSettings, type YahooQuery, type YahooResponse } from '../src/domain/market/financial.js';
import { chart } from './fixtures/yahoo/support.js';
import { superviseHistory } from '../scripts/yahoo-history.js';

const sourceHash = 'a'.repeat(64);
function fixture(realClock = false) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-history-'))), root = join(parent, 'anchor');
  let wall = Date.now(), mono = 0;
  const clock = { wall: () => realClock ? Date.now() : wall, monotonic: () => realClock ? performance.now() : mono };
  const m = historyManifest(new Date(wall).toISOString(), sourceHash);
  const custody = YahooHistoryCustody.offline(root, m, clock), db = new Store(':memory:'), market = new MarketStore(db), store = new FinancialStore(market, custody);
  for (const [kind, value] of [['policy', m.policy], ['instrument', m.instrument], ['calendar', m.calendar]] as const) market.register(value, kind, m.preparedAt);
  store.initialize(m.scope);
  return { parent, root, m, custody, db, store, clock,
    tick(ms = 5000) { wall += ms; mono += Math.max(0, ms); },
    accounting() { return readFileSync(join(root, 'accounting.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)); },
    close() { custody.destroy(); db.close(); rmSync(parent, { recursive: true, force: true }); } };
}
type Fixture = ReturnType<typeof fixture>;
function authored(f: Fixture) {
  const data = chart(), row = data.chart.result[0]!;
  row.meta.symbol = 'AAPL'; row.meta.exchangeName = 'NMS';
  const sessions = f.m.calendar.calendar.sessions.filter(s => s.status === 'open' && s.date >= '2026-09-01' && s.date < '2026-10-01');
  row.timestamp = sessions.map(s => Date.parse(s.open) / 1000);
  row.indicators.quote = [{ open: sessions.map(() => 10), high: sessions.map(() => 12), low: sessions.map(() => 9), close: sessions.map(() => 11), volume: sessions.map(() => 100) }];
  row.indicators.adjclose = [{ adjclose: sessions.map(() => 11) }]; row.events = { dividends: {}, splits: {} } as never;
  return data;
}
function response(f: Fixture, query: YahooQuery): YahooResponse {
  if (query.url.includes('/chart/')) return { status: 200, body: JSON.stringify(authored(f)), contentType: 'application/json', retryAfter: null };
  return { status: 200, body: query.url.includes('getcrumb') ? 'fixture-crumb' : 'fixture-cookie', contentType: 'text/plain', retryAfter: null };
}
function wire(f: Fixture, change?: (r: YahooResponse, q: YahooQuery, ordinal: number) => void) {
  let dns = 0, sockets = 0; const starts: number[] = []; const queries: YahooQuery[] = [];
  return { get dns() { return dns; }, get sockets() { return sockets; }, queries, starts,
    driver: { lookup: (async () => { dns++; f.tick(); return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as typeof lookup,
      request: ((url: URL, opts: RequestOptions, cb: (res: IncomingMessage) => void) => {
        sockets++; starts.push(performance.now()); assert.equal(opts.rejectUnauthorized, true); assert.equal(opts.family, 4); assert.equal((opts as RequestOptions & { autoSelectFamily: boolean }).autoSelectFamily, false);
        const q: YahooQuery = { method: 'GET', url: url.origin + url.pathname, params: Object.fromEntries(url.searchParams) }; queries.push(q);
        const r = response(f, q); change?.(r, q, sockets);
        const req = new EventEmitter() as ClientRequest; req.destroy = (() => req) as ClientRequest['destroy'];
        req.end = (() => { queueMicrotask(() => { const res = new PassThrough() as unknown as IncomingMessage;
          res.statusCode = r.status; res.headers = { 'content-type': r.contentType }; cb(res); (res as unknown as PassThrough).end(r.body); }); return req; }) as ClientRequest['end']; return req;
      }) as typeof httpsRequest } satisfies YahooWire };
}
function collect(f: Fixture, w: ReturnType<typeof wire>) {
  const gateway = new FinancialDataGateway(f.store, { now: () => new Date(f.clock.wall()).toISOString() }, new PythonYahooAdapter(f.custody.capsulePath, 'hq-ready-03e-query1-only'), yahooProbeTransport(f.custody, w.driver));
  return gateway.collect(f.m.policy.id, f.m.reads[0]!, 'history-test', f.custody.signal);
}
const withCrumb = (q: YahooQuery, n: number) => ({ ...q, params: { ...q.params, ...([4, 6].includes(n) ? { crumb: 'fixture-crumb' } : {}) } });

test('03E fixed identity, exact bounds, reference, settings and single read cannot be expanded', () => {
  const m = historyManifest('2026-10-12T08:00:00.000Z', sourceHash); verifyHistoryManifest(m);
  assert.equal(m.reads.length, 1); assert.equal(m.sequence.length, 6); assert.equal(m.scope.maxRetries, 0);
  assert.equal(m.scope.maxTotalBytes, 1048576); assert.equal(m.limits.processMs, 180000);
  assert.deepEqual(m.settings, yahooSettings); assert.equal(m.policy.rights.public_display.status, 'denied');
  for (const modify of [(v: typeof m) => v.scope.maxRetries++, (v: typeof m) => v.scope.maxRequests++, (v: typeof m) => v.sequence.reverse(), (v: typeof m) => { v.sequence[3]!.url = v.sequence[3]!.url.replace('query1', 'query2'); }, (v: typeof m) => v.calendar.calendar.sessions.pop()]) {
    const changed = structuredClone(m); modify(changed); assert.throws(() => verifyHistoryManifest(changed));
  }
  assert.throws(() => verifyHistoryManifest(probeManifest(m.preparedAt, sourceHash) as never));
});
test('exact ordered host/path/parameters and transient crumb location reject every widening before DNS', t => {
  const f = fixture(); t.after(f.close);
  for (const [i, q] of f.m.sequence.entries()) {
    qualifyHistoryQuery(f.m, f.m.reads[0]!, withCrumb(q, i + 1), i + 1);
    for (const wrong of [{ ...q, url: q.url.replace('query1', 'query2').replace('fc.yahoo', 'consent.yahoo') }, { ...q, params: { ...q.params, extra: 'x' } }])
      assert.throws(() => qualifyHistoryQuery(f.m, f.m.reads[0]!, withCrumb(wrong, i + 1), i + 1));
  }
  assert.throws(() => qualifyHistoryQuery(f.m, f.m.reads[0]!, f.m.sequence[0]!, 7));
  const w = wire(f), transport = yahooProbeTransport(f.custody, w.driver); f.custody.begin(f.store, transport, f.m.reads[0]!);
  assert.throws(() => f.custody.reserve(withCrumb(f.m.sequence[5]!, 6), 262144), /sequence/); assert.equal(w.dns, 0);
});
test('actual pinned Python completes precisely six approved requests with 21 authored bars; no price leaks into quality/ledger', async t => {
  assert.ok(existsSync('adapters/yahoo/.venv/bin/python'), 'pinned environment required; no skipped acceptance');
  const f = fixture(); t.after(f.close); const w = wire(f), result = await collect(f, w);
  assert.equal(result.status, 'ok', result.reason); assert.equal(w.sockets, 6); assert.equal(w.dns, 6);
  assert.deepEqual(w.queries.map(q => qualifyYahooQuery(q, f.m.reads[0]!, 'AAPL')), f.m.sequence.map(q => qualifyYahooQuery(q, f.m.reads[0]!, 'AAPL')));
  const e = f.store.observation(result.observationId!), report = inspectHistory(e, f.m);
  assert.equal(report.sessionCoverage.count, 21); assert.equal(report.missingSessions.length, 0); assert.equal(report.regularSessionEventTimes, 21);
  assert.equal(report.providerAvailableAt, null); assert.equal(report.executionQualified, false); assert.equal(report.fields.open!.present, 21);
  assert.deepEqual(report.identity, { symbolMatches: true, currencyMatches: true, listingMatches: true, commonEquityType: true });
  assert.ok(e.issues.includes('unqualified_adjustment')); assert.equal(e.rawResponses.length, 2);
  assert.throws(() => new FinancialAdmission(f.store, { now: () => new Date(f.clock.wall()).toISOString() }).deliver(e.id, 'worker', 'delivery'), /use_denied/);
  f.custody.finish(result, e); assert.throws(() => f.custody.begin(f.store, {} as never, f.m.reads[0]!));
  const ciphertext = readFileSync(join(f.custody.capsulePath, 'evidence.aes256gcm'));
  assert.equal(ciphertext.includes(Buffer.from('fixture-crumb')), false); assert.equal(ciphertext.includes(Buffer.from('"open":')), false);
  assert.ok(!readFileSync(join(f.root, 'accounting.jsonl'), 'utf8').includes('fixture-crumb'));
  assert.ok(readdirSync(f.custody.capsulePath).every(name => name === 'evidence.aes256gcm'));
});
for (const [ordinal, status] of [[1, 404], [2, 403], [3, 429], [4, 302], [5, 503], [6, 504]] as const)
  test(`pinned Python stops at ordinal ${ordinal} HTTP${status}, without retry, metadata fallback or further DNS`, async t => {
    const f = fixture(); t.after(f.close); const w = wire(f, (r, _q, n) => { if (n === ordinal) { r.status = status; r.body = 'fixture-denied'; } });
    const result = await collect(f, w); assert.notEqual(result.status, 'ok'); assert.equal(w.sockets, ordinal); assert.equal(w.dns, ordinal);
    assert.equal(f.accounting().filter(r => r.type === 'reserved').length, ordinal); assert.doesNotThrow(() => f.custody.check()); assert.notEqual(result.status, 'unknown');
  });
for (const problem of ['missing', 'currency', 'schema', 'adjustment', 'provider_error', 'bootstrap'] as const)
  test(`pinned authored quality handling: ${problem}`, async t => {
    const f = fixture(); t.after(f.close); const w = wire(f, (r, _q, n) => {
      if (problem === 'bootstrap' && n === 1) { r.body = '<html>consent</html>'; r.contentType = 'text/html'; }
      if (n !== 6) return;
      const value = JSON.parse(r.body), row = value.chart.result[0];
      if (problem === 'missing') { row.timestamp.splice(1, 1); for (const a of Object.values(row.indicators.quote[0]) as unknown[][]) a.splice(1, 1); row.indicators.adjclose[0].adjclose.splice(1, 1); row.indicators.quote[0].volume[0] = null; row.indicators.quote[0].open[2] = null; }
      if (problem === 'currency') row.meta.currency = 'CAD';
      if (problem === 'schema') delete row.indicators.quote[0].high;
      if (problem === 'adjustment') delete row.indicators.adjclose;
      if (problem === 'provider_error') value.chart.error = { code: 'fixture_denied' };
      r.body = JSON.stringify(value);
    });
    const result = await collect(f, w);
    if (problem === 'missing') { assert.equal(result.status, 'ok', result.reason); const e = f.store.observation(result.observationId!), q = inspectHistory(e, f.m);
      assert.equal(q.missingSessions.length, 1); assert.equal(q.fields.volume!.missingOrNaN, 1); assert.equal(q.fields.open!.missingOrNaN, 1); assert.equal(q.fields.close!.status, 'incomplete'); assert.ok(e.issues.includes('partial')); }
    else assert.notEqual(result.status, 'ok');
    assert.equal(w.sockets, problem === 'bootstrap' ? 1 : 6);
  });
test('aggregate 1MiB cap counts cookie bootstrap; full reservation denies before excess request', async t => {
  const f = fixture(); t.after(f.close); const w = wire(f, (r, _q, n) => { if (n !== 3) r.body = r.body.padEnd(262144, ' '); });
  const result = await collect(f, w); assert.notEqual(result.status, 'ok'); assert.equal(w.sockets, 4);
  assert.ok(f.accounting().filter(r => r.type === 'received').reduce((n, r) => n + r.receivedBytes, 0) <= 1048576);
});
test('262144-byte response cap stops oversize bootstrap without continuation', async t => {
  const f = fixture(); t.after(f.close); const w = wire(f, r => { r.body = 'x'.repeat(262145); });
  assert.equal((await collect(f, w)).status, 'unknown'); assert.equal(w.sockets, 1);
  assert.equal(f.accounting().find(r => r.type === 'received').receivedBytes, 262144);
});
test('issuer/root/source/store and spent identity reject forged, copied, restored and expired authority', t => {
  const f = fixture(); t.after(f.close);
  for (const fake of [{}, Object.create(YahooHistoryCustody.prototype), JSON.parse(JSON.stringify(f.custody))]) assert.throws(() => assertFinancialCustody(fake));
  assert.equal(isHistoryCustody({}), false); assert.throws(() => yahooProbeTransport(f.custody));
  assert.throws(() => YahooProbeCustody.reopenOffline(f.root, sourceHash));
  assert.throws(() => YahooHistoryCustody.reopenOffline(f.root, sourceHash));
  assert.throws(() => YahooHistoryCustody.reopenOffline(f.root, 'b'.repeat(64)));
  const copy = join(f.parent, 'copy'); cpSync(f.root, copy, { recursive: true }); fs.chmodSync(copy, 0o700); for (const name of readdirSync(copy)) if (fs.statSync(join(copy, name)).isFile()) fs.chmodSync(join(copy, name), 0o600); assert.throws(() => YahooHistoryCustody.reopenOffline(copy, sourceHash), /identity/);
  const capsule = f.custody.capsulePath; assert.ok(existsSync(capsule));
  f.tick(120000); assert.throws(() => f.custody.check(), /expired/); f.custody.destroy(); assert.equal(existsSync(capsule), false);
  assert.throws(() => YahooHistoryCustody.reopenOffline(f.root, sourceHash));
  const before = ownerHistoryRoot(), original = process.env.HOME; process.env.HOME = f.parent; assert.equal(ownerHistoryRoot(), before); process.env.HOME = original;
});
test('preexisting capsule is untouched and blocks ambiguous admission', t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-existing-'))), root = join(parent, 'anchor'); t.after(() => rmSync(parent, { recursive: true, force: true }));
  const m = historyManifest(new Date().toISOString(), sourceHash); YahooHistoryCustody.prepareOffline(root, m);
  mkdirSync(join(root, 'capsule'), { mode: 0o700 }); writeFileSync(join(root, 'capsule', 'canary'), 'untouched');
  // Nonempty anchor is rejected before consumption; cannot infer permission from leftovers.
  assert.throws(() => YahooHistoryCustody.reopenOffline(root, sourceHash), /uncertain/);
  assert.equal(readFileSync(join(root, 'capsule', 'canary'), 'utf8'), 'untouched');
});
test('short writes complete; fsync failure irreversibly stops before DNS and cleanup still removes ciphertext', async t => {
  const f = fixture(); t.after(f.close); const w = wire(f), transport = yahooProbeTransport(f.custody, w.driver); f.custody.begin(f.store, transport, f.m.reads[0]!);
  const original = fs.writeSync, short = t.mock.method(fs, 'writeSync', ((fd: number, buffer: Buffer, offset: number, length: number) => original(fd, buffer, offset, Math.min(7, length))) as typeof fs.writeSync); syncBuiltinESMExports();
  await transport.exchange(f.m.sequence[0]!, new AbortController().signal, 262144); short.mock.restore(); syncBuiltinESMExports();
  const broken = t.mock.method(fs, 'fsyncSync', () => { throw new Error('private-canary'); }); syncBuiltinESMExports();
  await assert.rejects(() => transport.exchange(f.m.sequence[1]!, new AbortController().signal, 262144)); broken.mock.restore(); syncBuiltinESMExports();
  assert.equal(w.dns, 1); assert.throws(() => f.custody.check()); assert.ok(!readFileSync(join(f.root, 'accounting.jsonl'), 'utf8').includes('private-canary'));
});
async function child(script: string, args: string[] = []) {
  return new Promise<string>((resolve, reject) => { const p = spawn(process.execPath, ['--input-type=module', '-e', script, ...args], { stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; p.stdout.on('data', b => out += String(b)); p.once('error', reject); p.once('exit', () => resolve(out.trim())); });
}
test('two processes race one anchor; loser cannot remove winner capsule', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-race-'))), root = join(parent, 'anchor'); t.after(() => rmSync(parent, { recursive: true, force: true }));
  YahooHistoryCustody.prepareOffline(root, historyManifest(new Date().toISOString(), sourceHash));
  const module = new URL('../src/control/market/yahoo-history-custody.js', import.meta.url).href;
  const script = `import {YahooHistoryCustody} from ${JSON.stringify(module)}; import {existsSync} from 'node:fs';try{const c=YahooHistoryCustody.reopenOffline(process.argv[1],process.argv[2]);await new Promise(r=>setTimeout(r,150));console.log(existsSync(c.capsulePath)?'WIN':'DELETED');c.destroy();}catch{console.log('DENIED');}`;
  assert.deepEqual((await Promise.all([child(script, [root, sourceHash]), child(script, [root, sourceHash])])).sort(), ['DENIED', 'WIN']);
});
test('SIGKILL after durable consumption and sealing preserves spent state; no replay or plaintext on disk', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-kill-'))), root = join(parent, 'anchor'); t.after(() => rmSync(parent, { recursive: true, force: true }));
  YahooHistoryCustody.prepareOffline(root, historyManifest(new Date().toISOString(), sourceHash));
  const module = new URL('../src/control/market/yahoo-history-custody.js', import.meta.url).href;
  await child(`import {YahooHistoryCustody} from ${JSON.stringify(module)};const c=YahooHistoryCustody.reopenOffline(process.argv[1],process.argv[2]);c.seal({original:'FICTIONAL_PRIVATE_CANARY'});process.kill(process.pid,'SIGKILL');`, [root, sourceHash]);
  assert.equal(JSON.parse(readFileSync(join(root, 'spent.json'), 'utf8')).noResume, true); assert.throws(() => YahooHistoryCustody.reopenOffline(root, sourceHash));
  assert.ok(!readFileSync(join(root, 'capsule', 'evidence.aes256gcm')).includes(Buffer.from('FICTIONAL_PRIVATE_CANARY')));
});
test('independent supervisor kills blocked Node and Python descendant before recovery', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-supervisor-'))); t.after(() => rmSync(parent, { recursive: true, force: true }));
  const file = join(parent, 'child.mjs'), pidFile = join(parent, 'python.pid');
  writeFileSync(file, `import {spawn} from 'node:child_process';import {writeFileSync,readFileSync} from 'node:fs';if(process.argv[2]==='cleanup'){const pid=Number(readFileSync(${JSON.stringify(pidFile)},'utf8'));let gone=false;try{process.kill(pid,0)}catch(e){gone=e.code==='ESRCH'}process.exit(gone?0:1)}process.on('message',m=>{if(m.command==='consume'){const p=spawn('/usr/bin/python3',['-c','import time; time.sleep(60)']);writeFileSync(${JSON.stringify(pidFile)},String(p.pid));process.send({wireBegin:1})}if(m.wirePermit===1){while(true){}}});process.send({ready:true});`);
  const result = await superviseHistory(file, ['data'], ['cleanup'], { wireMs: 500, operationMs: 5000, processMs: 10000 });
  assert.equal(result.killed, true); assert.equal(result.cleanupVerified, true); assert.equal(result.supervisedWirePermits, 1); assert.ok(result.elapsedMs < 8000);
  assert.deepEqual(historyLimits, { requests: 6, responseBytes: 262144, totalBytes: 1048576, intervalMs: 5000, wireMs: 10000, operationMs: 120000, processMs: 180000, approvalMs: 600000 });
});

test('action-bearing OHLCV keeps original events and reports counts without exposing amounts or prices', async t => {
  const f = fixture(); t.after(f.close); const w = wire(f, (r, _q, n) => {
    if (n !== 6) return;
    const value = JSON.parse(r.body), row = value.chart.result[0], stamp = row.timestamp[0];
    row.events = { dividends: { [stamp]: { date: stamp, amount: 0.125, currency: 'CAD' } }, splits: { [stamp]: { date: stamp, numerator: 2, denominator: 1, splitRatio: '2:1' } } };
    r.body = JSON.stringify(value);
  });
  const result = await collect(f, w); assert.equal(result.status, 'ok', result.reason);
  const e = f.store.observation(result.observationId!), q = inspectHistory(e, f.m);
  assert.equal(q.actionCount, 2); assert.equal(q.actions.dividends.count, 1); assert.equal(q.actions.splits.count, 1);
  assert.equal(q.actions.dividends.currencyKnown, 1); assert.equal(q.actions.dividends.publicationAndPaymentTimes, 'unknown');
  assert.ok(e.rawResponses.some(r => r.body.includes('0.125'))); assert.ok(!JSON.stringify(q).includes('0.125'));
  assert.equal(q.privateHistoricalResearch, 'descriptive_sample_with_adjustment_and_availability_limits');
});
for (const stage of ['dns_started', 'wire_intent', 'request_created'] as const)
  test(`filesystem stall at ${stage} cannot cross the 10-second limit into next I/O`, async t => {
    const f = fixture(); t.after(f.close); const w = wire(f), transport = yahooProbeTransport(f.custody, w.driver); f.custody.begin(f.store, transport, f.m.reads[0]!);
    let elapsed = 0; t.mock.method(performance, 'now', () => elapsed);
    const original = f.custody.confirmTransportStage.bind(f.custody);
    t.mock.method(f.custody, 'confirmTransportStage', (value: YahooStageConfirmation) => { original(value); if (value.stage === stage) elapsed = 10001; });
    await assert.rejects(() => transport.exchange(f.m.sequence[0]!, new AbortController().signal, 262144), /timeout/);
    assert.equal(w.dns, stage === 'dns_started' ? 0 : 1); assert.equal(w.sockets, stage === 'request_created' ? 1 : 0);
    const receipt = f.accounting().find(r => r.type === 'received'); assert.equal(receipt.complete, false);
  });
test('failed stage fsync never claims that milestone confirmed', async t => {
  const f = fixture(); t.after(f.close); const w = wire(f), transport = yahooProbeTransport(f.custody, w.driver); f.custody.begin(f.store, transport, f.m.reads[0]!);
  const original = f.custody.confirmTransportStage.bind(f.custody);
  t.mock.method(f.custody, 'confirmTransportStage', (value: YahooStageConfirmation) => { if (value.stage === 'dns_started') throw new Error('private-canary'); original(value); });
  await assert.rejects(() => transport.exchange(f.m.sequence[0]!, new AbortController().signal, 262144), /settlement_unknown/);
  assert.equal(w.dns, 0); assert.equal(f.accounting().find(r => r.type === 'received').diagnostic.lastConfirmed.stage, 'request_reserved');
});
test('constructor failure after capsule creation removes only its own ciphertext and retains spent', t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-constructor-'))), root = join(parent, 'anchor'); t.after(() => rmSync(parent, { recursive: true, force: true }));
  YahooHistoryCustody.prepareOffline(root, historyManifest(new Date().toISOString(), sourceHash));
  const open = fs.openSync, mock = t.mock.method(fs, 'openSync', ((path: fs.PathLike, ...args: unknown[]) => {
    if (String(path).endsWith('evidence.aes256gcm')) throw new Error('fixture_open_failure'); return (open as Function)(path, ...args);
  }) as typeof fs.openSync); syncBuiltinESMExports();
  try { assert.throws(() => YahooHistoryCustody.reopenOffline(root, sourceHash), /fixture_open_failure/); }
  finally { mock.mock.restore(); syncBuiltinESMExports(); }
  assert.ok(existsSync(join(root, 'spent.json'))); assert.equal(existsSync(join(root, 'capsule')), false);
  assert.throws(() => YahooHistoryCustody.reopenOffline(root, sourceHash));
});
test('loss of supervisor kills the isolated child and its Python descendant', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-parent-loss-'))); t.after(() => rmSync(parent, { recursive: true, force: true }));
  const module = new URL('../scripts/yahoo-history.js', import.meta.url).href, file = join(parent, 'child.mjs');
  writeFileSync(file, `import {watchHistorySupervisor} from ${JSON.stringify(module)};import {spawn} from 'node:child_process';watchHistorySupervisor();const p=spawn('/usr/bin/python3',['-c','import time;time.sleep(60)']);process.send({pid:p.pid});setInterval(()=>{},1000);`);
  const p = fork(file, [], { detached: true, execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  t.after(() => { try { process.kill(-p.pid!, 'SIGKILL'); } catch {} });
  const grandchild = await new Promise<number>(resolve => p.once('message', v => resolve((v as { pid: number }).pid)));
  const exited = new Promise(resolve => p.once('exit', resolve)); p.disconnect(); await exited;
  let gone = false; for (let i = 0; i < 100; i++) { try { process.kill(grandchild, 0); } catch (e) { gone = (e as NodeJS.ErrnoException).code === 'ESRCH'; } if (gone) break; await new Promise(r => setTimeout(r, 10)); }
  assert.equal(gone, true);
});
for (const kind of ['operation', 'cleanup'] as const) test(`independent ${kind} ceiling terminates stalled process`, async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-ceiling-'))); t.after(() => rmSync(parent, { recursive: true, force: true }));
  const file = join(parent, 'child.mjs');
  writeFileSync(file, `if(process.argv[2]==='cleanup'){${kind === 'cleanup' ? 'while(true){}' : 'process.exit(0)'}}process.on('message',m=>{if(m.command==='consume'){${kind === 'operation' ? 'while(true){}' : 'process.disconnect();process.exit(0)'}}});process.send({ready:true});`);
  const pending = superviseHistory(file, ['data'], ['cleanup'], { wireMs: 500, operationMs: 300, processMs: 1000 });
  if (kind === 'operation') assert.equal((await pending).killed, true); else await assert.rejects(pending, /cleanup_incomplete/);
});

test('03E enforces five seconds after completed response before the next actual wire', async t => {
  const f = fixture(true); t.after(f.close); const w = wire(f), transport = yahooProbeTransport(f.custody, w.driver); f.custody.begin(f.store, transport, f.m.reads[0]!);
  await transport.exchange(f.m.sequence[0]!, new AbortController().signal, 262144); const completed = performance.now();
  await transport.exchange(f.m.sequence[1]!, new AbortController().signal, 262144);
  assert.ok(w.starts[1]! - completed >= 4990); assert.equal(w.sockets, 2);
});

test('live-layout sibling capsule preexistence blocks before spending and recovery preserves unrelated content', t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-sibling-'))), root = join(parent, 'anchor'), capsule = join(parent, 'capsule');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  YahooHistoryCustody.prepareOffline(root, historyManifest(new Date().toISOString(), sourceHash)); mkdirSync(capsule, { mode: 0o700 }); writeFileSync(join(capsule, 'canary'), 'untouched');
  assert.throws(() => YahooHistoryCustody.reopenOfflineAt(root, capsule, sourceHash), /preexists/); assert.equal(existsSync(join(root, 'spent.json')), false);
  assert.throws(() => removeOwnedHistoryCapsule(root, capsule)); assert.equal(readFileSync(join(capsule, 'canary'), 'utf8'), 'untouched');
});
test('replacement of a formerly owned capsule fences recovery deletion by inode identity', t => {
  const f = fixture(); t.after(() => { f.db.close(); rmSync(f.parent, { recursive: true, force: true }); });
  const capsule = f.custody.capsulePath; fs.renameSync(capsule, capsule + '-retained'); mkdirSync(capsule, { mode: 0o700 }); writeFileSync(join(capsule, 'canary'), 'untouched');
  assert.throws(() => removeOwnedHistoryCapsule(f.root, capsule), /identity/); assert.throws(() => f.custody.destroy(), /incomplete/);
  assert.equal(readFileSync(join(capsule, 'canary'), 'utf8'), 'untouched');
});
test('native watchdog survives actual JS supervisor death while data Node loop is blocked and runs recovery', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'history-native-'))); t.after(() => rmSync(parent, { recursive: true, force: true }));
  const pidFile = join(parent, 'pid'), ready = join(parent, 'ready'), recovered = join(parent, 'recovered'), childFile = join(parent, 'data.mjs'), supervisorFile = join(parent, 'parent.mjs');
  writeFileSync(childFile, `import {writeFileSync} from 'node:fs';import {spawn} from 'node:child_process';if(process.argv[2]==='cleanup'){writeFileSync(${JSON.stringify(recovered)},'done');process.exit(0)}process.on('message',m=>{if(m.command==='consume'){const python=spawn('/usr/bin/python3',['-c','import time;time.sleep(60)']);writeFileSync(${JSON.stringify(pidFile)},JSON.stringify({node:process.pid,python:python.pid}));process.send({wireBegin:1})}if(m.wirePermit===1){writeFileSync(${JSON.stringify(ready)},'ready');while(true){}}});process.send({ready:true});`);
  const module = new URL('../scripts/yahoo-history.js', import.meta.url).href;
  writeFileSync(supervisorFile, `import {superviseHistory} from ${JSON.stringify(module)};await superviseHistory(${JSON.stringify(childFile)},['data'],['cleanup'],{wireMs:5000,operationMs:10000,processMs:15000});`);
  const p = spawn(process.execPath, [supervisorFile], { stdio: 'ignore' }); t.after(() => p.kill('SIGKILL'));
  for (let i = 0; i < 300 && !existsSync(ready); i++) await new Promise(r => setTimeout(r, 10)); assert.ok(existsSync(ready));
  const pids = JSON.parse(readFileSync(pidFile, 'utf8')) as { node: number; python: number }; const exited = new Promise(resolve => p.once('exit', resolve)); p.kill('SIGKILL'); await exited;
  for (let i = 0; i < 500 && !existsSync(recovered); i++) await new Promise(r => setTimeout(r, 10));
  assert.ok(existsSync(recovered)); for (const pid of [pids.node, pids.python]) assert.throws(() => process.kill(pid, 0), (e: unknown) => (e as NodeJS.ErrnoException).code === 'ESRCH');
});
