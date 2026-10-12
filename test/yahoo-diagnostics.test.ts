import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import fs, { mkdtempSync, realpathSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions, request as HttpsRequest } from 'node:https';
import type { LookupAddress } from 'node:dns';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { YahooProbeCustody } from '../src/control/market/yahoo-probe-custody.js';
import { probeManifest } from '../src/control/market/yahoo-probe-manifest.js';
import { yahooProbeTransport, type YahooWire } from '../src/control/market/yahoo-https.js';
import { YahooTransportError } from '../src/control/market/yahoo-diagnostics.js';
import { YAHOO_ADAPTER, type YahooQuery, type YahooAdapter } from '../src/domain/market/financial.js';

const query: YahooQuery = { method: 'GET', url: 'https://fc.yahoo.com/', params: {} };
const secret = 'secret_cookie_private_address_raw_exception';
const fault = (code: string) => Object.assign(new Error(secret), { code });
function fixture() {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'yahoo-diagnostic-'))), root = join(parent, 'anchor');
  const manifest = probeManifest(new Date().toISOString(), 'a'.repeat(64));
  const custody = YahooProbeCustody.offline(root, manifest);
  const db = new Store(':memory:'), market = new MarketStore(db), store = new FinancialStore(market, custody);
  for (const [kind, value] of [['policy', manifest.policy], ['instrument', manifest.instrument], ['calendar', manifest.calendar]] as const) market.register(value, kind, manifest.preparedAt);
  store.initialize(manifest.scope);
  return { root, custody, manifest, db, store,
    rows: () => readFileSync(join(root, 'accounting.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)),
    close: () => { custody.destroy(); db.close(); rmSync(parent, { recursive: true, force: true }); } };
}
type Point = 'dns' | 'create' | 'socket' | 'tcp' | 'tls' | 'write' | 'headers';
function driver(hook: (at: Point, req: ClientRequest) => boolean = () => false, status = 200) {
  let dns = 0, calls = 0, destroyed = 0;
  const req = new EventEmitter() as ClientRequest, socket = new EventEmitter();
  const res = new PassThrough() as unknown as IncomingMessage;
  res.statusCode = status; res.headers = { 'content-type': 'text/plain' };
  req.destroy = (() => { destroyed++; return req; }) as ClientRequest['destroy'];
  req.end = (() => { queueMicrotask(() => {
    req.emit('socket', socket); if (hook('socket', req)) return;
    socket.emit('connect'); if (hook('tcp', req)) return;
    socket.emit('secureConnect'); if (hook('tls', req)) return;
    req.emit('finish'); if (hook('write', req)) return;
    callback!(res); if (hook('headers', req)) return;
    (res as unknown as PassThrough).end('{}');
  }); return req; }) as ClientRequest['end'];
  let callback: ((res: IncomingMessage) => void) | undefined;
  const wire: YahooWire = {
    lookup: (async () => { dns++; hook('dns', req); return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as YahooWire['lookup'],
    request: ((_url: URL, opts: RequestOptions, cb: (res: IncomingMessage) => void) => {
      calls++; hook('create', req); callback = cb;
      assert.equal(opts.rejectUnauthorized, true); assert.equal(opts.agent, false);
      assert.equal(opts.servername, 'fc.yahoo.com'); assert.equal(opts.maxHeaderSize, 16384);
      return req;
    }) as typeof HttpsRequest,
  };
  return { wire, req, socket, res, lateResponse: () => callback!(res), get dns() { return dns; }, get calls() { return calls; }, get destroyed() { return destroyed; } };
}
function begin(f: ReturnType<typeof fixture>, wire: YahooWire) {
  const transport = yahooProbeTransport(f.custody, wire); f.custody.begin(f.store, transport, f.manifest.reads[0]!); return transport;
}
const cases: [Point, string, string, string][] = [
  ['dns', 'ENOTFOUND', 'dns_failure', 'dns_started'], ['dns', 'EAI_AGAIN', 'dns_failure', 'dns_started'],
  ['create', 'ERR_INVALID_IP_ADDRESS', 'local_configuration', 'wire_intent'],
  ['create', 'EPERM', 'local_permission', 'wire_intent'],
  ['socket', 'ECONNREFUSED', 'tcp_failure', 'socket_assigned'],
  ['socket', 'ENETUNREACH', 'tcp_failure', 'socket_assigned'],
  ['tcp', 'CERT_HAS_EXPIRED', 'tls_failure', 'tcp_connected'],
  ['tcp', 'ERR_TLS_CERT_ALTNAME_INVALID', 'tls_failure', 'tcp_connected'],
  ['tcp', 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE', 'tls_failure', 'tcp_connected'],
  ['tls', 'EPIPE', 'request_write_failure', 'tls_established'],
  ['write', 'ECONNRESET', 'connection_reset', 'request_finished'],
  ['headers', 'ECONNRESET', 'connection_reset', 'response_headers'],
  ['write', secret, 'indeterminate', 'request_finished'],
];
for (const [point, code, category, stage] of cases) test(`non-data ${point}/${code} remains consumed and cannot replay`, async t => {
  const f = fixture(); t.after(f.close);
  const d = driver((at, req) => { if (at !== point) return false; if (at === 'dns' || at === 'create') throw fault(code); req.emit('error', fault(code)); return true; });
  const transport = begin(f, d.wire);
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), (e: unknown) => {
    assert.ok(e instanceof YahooTransportError); assert.equal(e.diagnostic.category, category);
    assert.equal(e.diagnostic.lastConfirmed.stage, stage); assert.ok(!JSON.stringify(e.diagnostic).includes(secret)); return true;
  });
  const rows = f.rows(), receipt = rows.find(r => r.type === 'received');
  assert.equal(rows.filter(r => r.type === 'reserved').length, 1); assert.equal(receipt.complete, false);
  assert.equal(receipt.diagnostic.lastConfirmed.stage, stage);
  assert.deepEqual(receipt.diagnostic.lastConfirmed, (({ stage, at, elapsedMs }) => ({ stage, at, elapsedMs }))(rows.filter(r => r.type === 'transport_stage').at(-1)));
  assert.ok(Number.isFinite(Date.parse(receipt.diagnostic.lastConfirmed.at)));
  assert.ok(!JSON.stringify(rows).includes(secret));
  const calls = d.calls, dns = d.dns;
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), /denied/);
  assert.equal(d.calls, calls); assert.equal(d.dns, dns);
  f.custody.destroy(); assert.equal(existsSync(f.custody.capsulePath), false); assert.equal(JSON.parse(readFileSync(join(f.root, 'spent.json'), 'utf8')).noResume, true);
});
for (const [point, category, stage] of [['dns', 'dns_timeout', 'dns_started'], ['socket', 'tcp_timeout', 'socket_assigned'],
  ['tcp', 'tls_timeout', 'tcp_connected'], ['tls', 'request_write_timeout', 'tls_established'], ['write', 'response_timeout', 'request_finished'], ['headers', 'response_timeout', 'response_headers']] as const)
  test(`deadline during ${point} has exact last stage`, async t => {
    const f = fixture(); t.after(f.close); const timeout = new AbortController();
    t.mock.method(AbortSignal, 'timeout', () => timeout.signal);
    const d = driver(at => { if (at !== point) return false; timeout.abort(new DOMException(secret, 'TimeoutError')); return true; });
    await assert.rejects(begin(f, d.wire).exchange(query, new AbortController().signal, 1024), (e: unknown) => {
      assert.ok(e instanceof YahooTransportError); assert.equal(e.diagnostic.category, category); assert.equal(e.diagnostic.lastConfirmed.stage, stage); return true;
    });
    assert.equal(f.rows().filter(r => r.type === 'received').length, 1);
  });
for (const addresses of [[], [{ address: '127.0.0.1', family: 4 }], [{ address: '1.1.1.1', family: 6 }],
  [{ address: '1.1.1.1', family: 4 }, { address: '10.0.0.1', family: 4 }]])
  test(`unapproved DNS answer fails before request creation: ${JSON.stringify(addresses)}`, async t => {
    const f = fixture(); t.after(f.close); const d = driver(); d.wire.lookup = (async () => addresses) as unknown as YahooWire['lookup'];
    await assert.rejects(begin(f, d.wire).exchange(query, new AbortController().signal, 1024), (e: unknown) => {
      assert.ok(e instanceof YahooTransportError); assert.equal(e.diagnostic.category, 'destination_denied'); assert.equal(e.diagnostic.lastConfirmed.stage, 'dns_resolved'); return true;
    }); assert.equal(d.calls, 0); assert.equal(f.rows().filter(r => r.type === 'reserved').length, 1);
  });
for (const [status, category] of [[200, 'response'], [403, 'http_refused'], [429, 'http_rate_limited'], [302, 'http_redirect_denied'], [503, 'http_transient']] as const)
  test(`HTTP ${status} is confirmed evidence distinct from transport failure`, async t => {
    const f = fixture(); t.after(f.close); const d = driver(undefined, status);
    assert.equal((await begin(f, d.wire).exchange(query, new AbortController().signal, 1024)).status, status);
    const receipt = f.rows().find(r => r.type === 'received');
    assert.equal(receipt.diagnostic.category, category); assert.equal(receipt.diagnostic.transmission, 'http_response');
    assert.equal(receipt.diagnostic.lastConfirmed.stage, 'response_complete'); assert.equal(receipt.complete, true);
  });
test('late DNS completion after cancellation cannot construct a request', async t => {
  const f = fixture(); t.after(f.close); const d = driver(), abort = new AbortController();
  let resolve!: (addresses: LookupAddress[]) => void;
  d.wire.lookup = (() => new Promise<LookupAddress[]>(r => { resolve = r; })) as unknown as YahooWire['lookup'];
  const transport = begin(f, d.wire), pending = transport.exchange(query, abort.signal, 1024);
  abort.abort(secret); await assert.rejects(pending, /cancelled/); const before = JSON.stringify(f.rows());
  resolve([{ address: '1.1.1.1', family: 4 }]); await new Promise(r => setImmediate(r));
  assert.equal(d.calls, 0); assert.equal(JSON.stringify(f.rows()), before);
});
for (const cancellation of [false, true]) test(`late body/socket events cannot alter ${cancellation ? 'cancelled' : 'failed'} receipt`, async t => {
  const f = fixture(); t.after(f.close); const abort = new AbortController();
  const d = driver(at => { if (at !== 'headers') return false; (d.res as unknown as PassThrough).write('part'); return true; });
  const transport = begin(f, d.wire), pending = transport.exchange(query, abort.signal, 1024);
  await new Promise(r => setImmediate(r));
  if (cancellation) abort.abort(secret); else d.req.emit('error', fault('ECONNRESET'));
  await assert.rejects(pending); const before = JSON.stringify(f.rows());
  d.req.emit('finish'); d.socket.emit('connect'); d.socket.emit('secureConnect');
  d.res.emit('readable'); d.res.emit('end'); d.lateResponse(); d.req.emit('error', fault(secret));
  await new Promise(r => setImmediate(r)); assert.equal(JSON.stringify(f.rows()), before);
  const receipt = f.rows().find(r => r.type === 'received'); assert.equal(receipt.receivedBytes, 4); assert.equal(receipt.complete, false);
  assert.ok(d.destroyed > 0);
});
test('durable stage fsync failure inside socket callback is caught, stops wire and cannot replay', async t => {
  const f = fixture(); t.after(f.close); let restore: (() => void) | undefined;
  const d = driver(at => { if (at === 'socket') {
    const mock = t.mock.method(fs, 'fsyncSync', () => { throw new Error(secret); }); syncBuiltinESMExports();
    restore = () => { mock.mock.restore(); syncBuiltinESMExports(); };
  } return false; });
  const transport = begin(f, d.wire);
  try { await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), /settlement_unknown/); }
  finally { restore?.(); }
  assert.ok(d.destroyed > 0); const calls = d.calls;
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024)); assert.equal(d.calls, calls);
  assert.equal(JSON.stringify(f.rows()).includes(secret), false);
});
test('custody destruction aborts a pending transport independently of the caller signal', async t => {
  const f = fixture(); t.after(f.close); const d = driver(at => at === 'headers');
  const transport = begin(f, d.wire), pending = transport.exchange(query, new AbortController().signal, 1024);
  await new Promise(r => setImmediate(r)); f.custody.destroy();
  await assert.rejects(pending, /settlement_unknown/); const before = JSON.stringify(f.rows());
  d.res.emit('end'); d.req.emit('finish'); d.socket.emit('secureConnect');
  await new Promise(r => setImmediate(r)); assert.equal(JSON.stringify(f.rows()), before);
  assert.equal(existsSync(f.custody.capsulePath), false); assert.equal(f.rows().filter(r => r.type === 'reserved').length, 1);
  assert.throws(() => YahooProbeCustody.reopenOffline(f.root, f.manifest.sourceHash), /EEXIST/);
});
test('gateway still conservatively charges a diagnosed local pre-HTTP failure and fences future work', async t => {
  const f = fixture(); t.after(f.close); const d = driver(at => { if (at === 'create') throw fault('ERR_INVALID_IP_ADDRESS'); return false; });
  const transport = yahooProbeTransport(f.custody, d.wire);
  const adapter: YahooAdapter = { kind: YAHOO_ADAPTER, async read(_input, exchange) { await exchange(query); return '{}'; } };
  const gateway = new FinancialDataGateway(f.store, { now: () => new Date().toISOString() }, adapter, transport);
  const first = await gateway.collect(f.manifest.policy.id, f.manifest.reads[0]!, 'diagnostic-first');
  assert.equal(first.reason, 'financial_transport_unknown'); assert.equal(first.status, 'unknown');
  assert.deepEqual(await gateway.collect(f.manifest.policy.id, f.manifest.reads[0]!, 'diagnostic-first'), first);
  const second = await gateway.collect(f.manifest.policy.id, f.manifest.reads[0]!, 'diagnostic-second');
  assert.equal(second.reason, 'financial_provider_uncertain_or_busy'); assert.equal(d.calls, 1);
  const result = f.db.get<{ bytes: number; status: number }>('SELECT bytes,status FROM financial_attempt_results')!;
  assert.equal(result.bytes, 262144); assert.equal(result.status, 0);
});

test('receipt fsync failure cannot turn a completed HTTP response into settled success', async t => {
  const f = fixture(); t.after(f.close); const d = driver(), transport = begin(f, d.wire);
  const received = f.custody.received.bind(f.custody);
  t.mock.method(f.custody, 'received', (...args: Parameters<typeof received>) => {
    const mock = t.mock.method(fs, 'fsyncSync', () => { throw new Error(secret); }); syncBuiltinESMExports();
    try { received(...args); } finally { mock.mock.restore(); syncBuiltinESMExports(); }
  });
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), (error: unknown) => {
    assert.ok(error instanceof YahooTransportError); assert.equal(error.diagnostic.category, 'settlement_unknown');
    assert.equal(error.diagnostic.lastConfirmed.stage, 'response_complete'); assert.equal(error.diagnostic.transmission, 'http_response'); return true;
  });
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024)); assert.equal(d.calls, 1);
});
test('pre-aborted request still consumes reservation but never enters DNS', async t => {
  const f = fixture(); t.after(f.close); const d = driver(), abort = new AbortController(); abort.abort(secret);
  await assert.rejects(begin(f, d.wire).exchange(query, abort.signal, 1024), /yahoo_cancelled/);
  assert.equal(d.dns, 0); assert.equal(d.calls, 0); assert.equal(f.rows().filter(r => r.type === 'reserved').length, 1);
});
test('gateway deadline reason survives forwarding as a timeout rather than owner cancellation', async t => {
  const f = fixture(); t.after(f.close); const abort = new AbortController();
  const d = driver(at => { if (at !== 'write') return false; abort.abort(new Error('financial_transport_timeout')); return true; });
  await assert.rejects(begin(f, d.wire).exchange(query, abort.signal, 1024), (error: unknown) => {
    assert.ok(error instanceof YahooTransportError); assert.equal(error.diagnostic.category, 'response_timeout'); return true;
  });
});

test('encrypted header receipt failure is local settlement uncertainty, never a successful response', async t => {
  const f = fixture(); t.after(f.close); const d = driver(), transport = begin(f, d.wire);
  const seal = f.custody.seal.bind(f.custody);
  t.mock.method(f.custody, 'seal', (value: unknown) => {
    if ((value as { type: string }).type === 'response_headers') throw new Error(secret);
    seal(value);
  });
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), (error: unknown) => {
    assert.ok(error instanceof YahooTransportError); assert.equal(error.diagnostic.category, 'settlement_unknown');
    assert.equal(error.diagnostic.lastConfirmed.stage, 'response_headers'); return true;
  });
  assert.equal(f.rows().find(r => r.type === 'received').complete, false);
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), /denied/); assert.equal(d.calls, 1);
});
