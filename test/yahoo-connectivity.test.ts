import test from 'node:test';
import assert from 'node:assert/strict';
import fs, { mkdtempSync, realpathSync, rmSync, readFileSync, readdirSync, writeFileSync, unlinkSync, cpSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import childProcess, { fork } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { request as httpsRequest, type RequestOptions } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { LookupAddress } from 'node:dns';
import { prepareConnectivityFixture, runConnectivityFixture, runOwnerConnectivity, recoverConnectivity } from '../src/control/market/yahoo-connectivity.js';
import type { YahooWire } from '../src/control/market/yahoo-https.js';
import { superviseConnectivityChild } from '../scripts/yahoo-connectivity.js';

const source = { commit: 'a'.repeat(40), sourceHash: 'b'.repeat(64) };
const canary = 'PRIVATE_PAYLOAD_COOKIE_IP_CERTIFICATE_EXCEPTION';
function fixture(t: { after(fn: () => void): void }) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'connectivity-fixture-'))), root = join(parent, 'anchor');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const manifest = prepareConnectivityFixture(root, source);
  return { parent, root, manifest, stages: () => readFileSync(join(root, 'stages.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line)),
    all: () => readdirSync(root).map(name => readFileSync(join(root, name), 'utf8')).join('\n') };
}
type Point = 'dns' | 'create' | 'socket' | 'tcp' | 'tls' | 'write' | 'headers';
function driver(hook: (point: Point) => void = () => {}, status = 200, headers: IncomingMessage['headers'] = {}) {
  const req = new EventEmitter() as ClientRequest, socket = new EventEmitter(), res = new PassThrough() as unknown as IncomingMessage;
  res.statusCode = status; res.headers = { 'set-cookie': [canary], date: canary, ...headers };
  res.rawHeaders = ['Set-Cookie', canary]; res.trailers = {}; res.rawTrailers = [];
  let callback: (res: IncomingMessage) => void, dns = 0, requests = 0, destroyed = 0, ended = 0;
  req.destroy = (() => { destroyed++; return req; }) as ClientRequest['destroy'];
  req.end = (() => {
    ended++; queueMicrotask(() => {
      try {
        req.emit('socket', socket); hook('socket'); socket.emit('connect'); hook('tcp');
        socket.emit('secureConnect'); hook('tls'); req.emit('finish'); hook('write');
        callback(res); hook('headers');
      } catch (error) { req.emit('error', error); }
    }); return req;
  }) as ClientRequest['end'];
  const wire: YahooWire = {
    lookup: (async (host: string, options: unknown) => { dns++; assert.equal(host, 'fc.yahoo.com'); assert.deepEqual(options, { all: true, verbatim: true }); hook('dns'); return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as YahooWire['lookup'],
    request: ((url: URL, opts: RequestOptions & { autoSelectFamily: boolean }, cb: typeof callback) => {
      requests++; assert.equal(url.href, 'https://fc.yahoo.com/');
      assert.equal(opts.method, 'GET'); assert.equal(opts.rejectUnauthorized, true); assert.equal(opts.servername, 'fc.yahoo.com');
      assert.equal(opts.agent, false); assert.equal(opts.autoSelectFamily, false); assert.equal(opts.family, 4); assert.equal(opts.maxHeaderSize, 16384);
      assert.deepEqual(opts.headers, { 'User-Agent': 'BotSquad/0.1 private personal research', Accept: 'application/json, text/plain', 'Accept-Encoding': 'identity' });
      opts.lookup!('fc.yahoo.com', { all: true }, (error, addresses) => { assert.equal(error, null); assert.deepEqual(addresses, [{ address: '1.1.1.1', family: 4 }]); });
      hook('create'); callback = cb; return req;
    }) as YahooWire['request'],
  };
  return { req, socket, res, wire, late: () => callback(res), get dns() { return dns; }, get requests() { return requests; }, get destroyed() { return destroyed; }, get ended() { return ended; } };
}
for (const [status, category] of [[200, 'response'], [204, 'response'], [302, 'http_redirect_denied'], [403, 'http_refused'], [404, 'http_refused'], [429, 'http_rate_limited'], [503, 'http_transient']] as const)
  test(`HTTP ${status}: one request, headers-only, immediate disposal, permanently spent`, async t => {
    const f = fixture(t), d = driver(undefined, status);
    const receipt = await runConnectivityFixture(f.root, source, d.wire);
    assert.equal(receipt.status, status); assert.equal(receipt.diagnostic.category, category);
    assert.equal(receipt.diagnostic.transmission, 'http_response'); assert.equal(receipt.diagnostic.lastConfirmed.stage, 'response_headers');
    assert.equal(receipt.consumedBodyBytes, 0); assert.equal(receipt.bodyInspected, false); assert.equal(receipt.responseBodyComplete, false);
    assert.equal(d.dns, 1); assert.equal(d.requests, 1); assert.equal(d.ended, 1); assert.ok(d.destroyed >= 1); assert.ok(d.res.destroyed);
    assert.deepEqual(d.res.headers, {}); assert.deepEqual(d.res.rawHeaders, []); assert.equal(d.res.listenerCount('data'), 0); assert.equal(d.res.listenerCount('readable'), 0);
    assert.ok(!f.all().includes(canary)); assert.equal(f.stages().filter(row => row.stage === 'request_reserved').length, 1);
    assert.deepEqual(receipt.diagnostic.lastConfirmed, (({ stage, at, elapsedMs }) => ({ stage, at, elapsedMs }))(f.stages().at(-1)));
    await assert.rejects(runConnectivityFixture(f.root, source, d.wire)); assert.equal(d.dns, 1); assert.equal(d.requests, 1);
    assert.throws(() => prepareConnectivityFixture(f.root, source));
    const before = f.all(); d.req.emit('error', new Error(canary)); d.socket.emit('connect'); d.late(); assert.equal(f.all(), before);
  });
for (const [point, code, category, last] of [
  ['dns', 'ENOTFOUND', 'dns_failure', 'dns_started'], ['create', 'EPERM', 'local_permission', 'wire_intent'],
  ['socket', 'ECONNREFUSED', 'tcp_failure', 'socket_assigned'], ['tcp', 'CERT_HAS_EXPIRED', 'tls_failure', 'tcp_connected'],
  ['tls', 'EPIPE', 'request_write_failure', 'tls_established'], ['write', 'ECONNRESET', 'connection_reset', 'request_finished'],
  ['write', canary, 'indeterminate', 'request_finished'],
] as const) test(`${point}/${code} is sanitized, terminal and consumed`, async t => {
  const f = fixture(t), d = driver(at => { if (at === point) throw Object.assign(new Error(canary), { code }); });
  const receipt = await runConnectivityFixture(f.root, source, d.wire);
  assert.equal(receipt.diagnostic.category, category); assert.equal(receipt.diagnostic.lastConfirmed.stage, last);
  assert.ok(!f.all().includes(canary)); await assert.rejects(runConnectivityFixture(f.root, source, d.wire));
});
for (const answers of [[], [{ address: '127.0.0.1', family: 4 }], [{ address: '1.1.1.1', family: 6 }],
  [{ address: '1.1.1.1', family: 4 }, { address: '10.0.0.1', family: 4 }]]) test('all DNS answers must be valid public addresses; no fallback', async t => {
  const f = fixture(t), d = driver(); d.wire.lookup = (async () => answers) as unknown as YahooWire['lookup'];
  const receipt = await runConnectivityFixture(f.root, source, d.wire);
  assert.equal(receipt.diagnostic.category, 'destination_denied'); assert.equal(d.requests, 0);
});
for (const headers of [{ 'content-encoding': 'gzip' }, { 'content-length': '4097' }, { 'content-length': 'nonsense' }])
  test('compressed, oversized or malformed response is closed without consuming any body', async t => {
    const f = fixture(t), d = driver(undefined, 200, headers);
    const receipt = await runConnectivityFixture(f.root, source, d.wire);
    assert.equal(receipt.diagnostic.category, 'response_invalid'); assert.equal(receipt.consumedBodyBytes, 0); assert.ok(d.res.destroyed);
  });
test('exact 4096-byte declared body is never read; headers are the terminal observation', async t => {
  const f = fixture(t), d = driver(undefined, 200, { 'content-length': '4096' });
  const receipt = await runConnectivityFixture(f.root, source, d.wire); assert.equal(receipt.consumedBodyBytes, 0); assert.ok(d.res.destroyed);
});
test('preabort consumes reservation without DNS; built-in drivers and unsupervised owner denied', async t => {
  const f = fixture(t), d = driver(), abort = new AbortController(); abort.abort(canary);
  const receipt = await runConnectivityFixture(f.root, source, d.wire, abort.signal);
  assert.equal(receipt.diagnostic.category, 'cancelled'); assert.equal(d.dns, 0); assert.equal(d.requests, 0);
  await assert.rejects(runConnectivityFixture(f.root, source, { lookup, request: httpsRequest }), /requires_fakes/);
  await assert.rejects(runOwnerConnectivity(abort.signal), /supervisor_required/);
});
test('late DNS after cancellation cannot open socket or alter receipts', async t => {
  const f = fixture(t), d = driver(), abort = new AbortController(); let resolve!: (value: LookupAddress[]) => void;
  d.wire.lookup = (() => new Promise(r => { resolve = r; })) as YahooWire['lookup'];
  const pending = runConnectivityFixture(f.root, source, d.wire, abort.signal); abort.abort();
  await pending; const before = f.all(); resolve([{ address: '1.1.1.1', family: 4 }]); await new Promise(r => setImmediate(r));
  assert.equal(d.requests, 0); assert.equal(f.all(), before);
});
for (const point of ['dns', 'socket', 'tcp', 'tls', 'write'] as const) test(`deadline at ${point} stops without retry`, async t => {
  const f = fixture(t), deadline = new AbortController();
  t.mock.method(AbortSignal, 'timeout', () => deadline.signal);
  const d = driver(at => { if (at === point) deadline.abort(); });
  const receipt = await runConnectivityFixture(f.root, source, d.wire);
  assert.ok(receipt.diagnostic.category.endsWith('_timeout')); assert.equal(d.requests, point === 'dns' ? 0 : 1);
});
test('changed source, expired approval, copied root and deleted spent with retained accounting deny', async t => {
  const f = fixture(t), d = driver();
  await assert.rejects(runConnectivityFixture(f.root, { ...source, sourceHash: 'c'.repeat(64) }, d.wire), /source_changed/);
  const copy = join(f.parent, 'copy'); cpSync(f.root, copy, { recursive: true }); fs.chmodSync(copy, 0o700); fs.chmodSync(join(copy, 'approval.json'), 0o600);
  await assert.rejects(runConnectivityFixture(copy, source, d.wire), /approval_identity/);
  await runConnectivityFixture(f.root, source, d.wire); unlinkSync(join(f.root, 'spent.json'));
  await assert.rejects(runConnectivityFixture(f.root, source, d.wire), /already_consumed/);
  const old = join(f.parent, 'expired'); prepareConnectivityFixture(old, source, Date.now() - 60001);
  await assert.rejects(runConnectivityFixture(old, source, d.wire), /expired/); assert.equal(d.dns, 1);
});
test('lost accounting during DNS permanently stops even if restored before late events', async t => {
  const f = fixture(t), d = driver(); let old = '';
  d.wire.lookup = (async () => { old = readFileSync(join(f.root, 'stages.jsonl'), 'utf8'); writeFileSync(join(f.root, 'stages.jsonl'), 'corrupt'); return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as YahooWire['lookup'];
  const receipt = await runConnectivityFixture(f.root, source, d.wire);
  assert.equal(receipt.diagnostic.category, 'settlement_unknown'); assert.equal(d.requests, 0);
  writeFileSync(join(f.root, 'stages.jsonl'), old); await assert.rejects(runConnectivityFixture(f.root, source, d.wire));
});
test('short writes fully settle; zero progress burns a partial spent marker', async t => {
  const f = fixture(t), original = fs.writeSync;
  fs.writeSync = ((fd: number, buffer: Buffer, offset: number, length: number) => original(fd, buffer, offset, Math.max(1, Math.floor(length / 2)))) as typeof fs.writeSync;
  syncBuiltinESMExports();
  try { await runConnectivityFixture(f.root, source, driver().wire); } finally { fs.writeSync = original; syncBuiltinESMExports(); }
  const g = fixture(t); fs.writeSync = (() => 0) as typeof fs.writeSync; syncBuiltinESMExports();
  try { await assert.rejects(runConnectivityFixture(g.root, source, driver().wire), /short_write/); }
  finally { fs.writeSync = original; syncBuiltinESMExports(); }
  await assert.rejects(runConnectivityFixture(g.root, source, driver().wire), /already_consumed/);
});
for (const file of ['spent.json', 'stages.jsonl', 'accounting.json', 'cleanup.json']) test(`${file} fsync failure never refunds the reservation`, async t => {
  const f = fixture(t), originalOpen = fs.openSync, originalSync = fs.fsyncSync, descriptors = new Map<number, string>(); let triggered = false;
  fs.openSync = ((path: fs.PathLike, ...args: unknown[]) => { const fd = (originalOpen as (...args: unknown[]) => number)(path, ...args); descriptors.set(fd, String(path)); return fd; }) as typeof fs.openSync;
  fs.fsyncSync = ((fd: number) => { if (!triggered && descriptors.get(fd)?.endsWith('/' + file)) { triggered = true; throw new Error(canary); } originalSync(fd); }) as typeof fs.fsyncSync;
  syncBuiltinESMExports(); const d = driver();
  try { await assert.rejects(runConnectivityFixture(f.root, source, d.wire)); }
  finally { fs.openSync = originalOpen; fs.fsyncSync = originalSync; syncBuiltinESMExports(); }
  assert.ok(triggered); assert.ok(!f.all().includes(canary)); await assert.rejects(runConnectivityFixture(f.root, source, d.wire));
  if (['spent.json', 'stages.jsonl'].includes(file)) assert.equal(d.dns, 0);
});
test('callback stage fsync fault freezes at last actually durable milestone', async t => {
  const f = fixture(t), original = fs.fsyncSync; let fail = false;
  const d = driver(at => { if (at === 'socket') fail = true; });
  fs.fsyncSync = ((fd: number) => { if (fail) { fail = false; throw new Error(canary); } original(fd); }) as typeof fs.fsyncSync; syncBuiltinESMExports();
  try {
    const receipt = await runConnectivityFixture(f.root, source, d.wire);
    assert.equal(receipt.diagnostic.category, 'settlement_unknown'); assert.equal(receipt.diagnostic.lastConfirmed.stage, 'socket_assigned');
    assert.ok(d.destroyed); assert.ok(!f.all().includes(canary));
  } finally { fs.fsyncSync = original; syncBuiltinESMExports(); }
});

const modulePath = fileURLToPath(new URL('../src/control/market/yahoo-connectivity.js', import.meta.url));
function childFile(parent: string) {
  const file = join(parent, 'child.mjs');
  writeFileSync(file, `import {runConnectivityFixture} from ${JSON.stringify(modulePath)};
const [root, mode] = process.argv.slice(2);
process.send({ready:true});
process.once('message', async () => {
 try { await runConnectivityFixture(root, ${JSON.stringify(source)}, {
 lookup: async () => { process.send({admitted:true}); if(mode==='hang') while(true){}; await new Promise(()=>{}); },
 request: () => {throw new Error('never');}
 }); } catch { process.send({denied:true}); process.disconnect(); }
});`);
  return file;
}
test('two real processes race for one reservation; SIGKILL after durable DNS stage never replays', async t => {
  const f = fixture(t), file = childFile(f.parent), a = fork(file, [f.root, 'wait'], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] }), b = fork(file, [f.root, 'wait'], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  t.after(() => { a.kill('SIGKILL'); b.kill('SIGKILL'); });
  const events = (child: typeof a) => new Promise<string>(resolve => child.on('message', value => {
    const row = value as { ready?: boolean; admitted?: boolean; denied?: boolean };
    if (row.ready) child.send({ command: 'consume' });
    if (row.admitted) resolve('admitted'); if (row.denied) resolve('denied');
  }));
  assert.deepEqual((await Promise.all([events(a), events(b)])).sort(), ['admitted', 'denied']);
  await Promise.all([a, b].map(child => new Promise<void>(resolve => { if (child.exitCode !== null) resolve(); else { child.once('exit', () => resolve()); child.kill('SIGKILL'); } })));
  assert.equal(f.stages().at(-1).stage, 'dns_started'); assert.equal(JSON.parse(readFileSync(join(f.root, 'spent.json'), 'utf8')).reservation, 1);
  await assert.rejects(runConnectivityFixture(f.root, source, driver().wire));
});
test('independent supervisor kills and joins a blocked child event loop; consumed anchor survives', async t => {
  const f = fixture(t), file = childFile(f.parent);
  const result = await superviseConnectivityChild(file, [f.root, 'hang'], 300);
  assert.equal(result.killed, true); assert.equal(result.code, null); assert.equal(f.stages().at(-1).stage, 'dns_started');
  await assert.rejects(runConnectivityFixture(f.root, source, driver().wire));
});

for (const target of ['dns_started', 'wire_intent', 'request_created'] as const) test(`synchronous fsync overrun at ${target} stops before next network boundary`, async t => {
  const f = fixture(t), d = driver(), originalSync = fs.fsyncSync;
  let elapsed = 0;
  t.mock.method(performance, 'now', () => elapsed);
  fs.fsyncSync = ((fd: number) => {
    originalSync(fd);
    if (fs.existsSync(join(f.root, 'stages.jsonl')) && readFileSync(join(f.root, 'stages.jsonl'), 'utf8').includes(`"stage":"${target}"`)) elapsed = 10001;
  }) as typeof fs.fsyncSync; syncBuiltinESMExports();
  try {
    const receipt = await runConnectivityFixture(f.root, source, d.wire);
    assert.ok(receipt.diagnostic.category.endsWith('_timeout'));
    assert.equal(receipt.diagnostic.lastConfirmed.stage, target);
    assert.equal(d.dns, target === 'dns_started' ? 0 : 1);
    assert.equal(d.requests, target === 'request_created' ? 1 : 0); assert.equal(d.ended, 0);
  } finally { fs.fsyncSync = originalSync; syncBuiltinESMExports(); }
});
test('supervisor operational error kills and joins its spawned child before resolving', async t => {
  const f = fixture(t), file = childFile(f.parent), original = childProcess.fork;
  childProcess.fork = ((...args: Parameters<typeof fork>) => {
    const child = original(...args);
    child.once('message', () => queueMicrotask(() => child.emit('error', new Error(canary))));
    return child;
  }) as typeof fork; syncBuiltinESMExports();
  try { const result = await superviseConnectivityChild(file, [f.root, 'hang'], 1000); assert.ok(result.killed); assert.notEqual(result.code, 0); }
  finally { childProcess.fork = original; syncBuiltinESMExports(); }
});
test('recovery denies active PID and creates one non-data receipt only after child exit', async t => {
  const f = fixture(t), file = childFile(f.parent), child = fork(file, [f.root, 'wait'], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  t.after(() => child.kill('SIGKILL'));
  await new Promise<void>(resolve => child.on('message', value => {
    const row = value as { ready?: boolean; admitted?: boolean };
    if (row.ready) child.send({ command: 'consume' }); if (row.admitted) resolve();
  }));
  const spent = readFileSync(join(f.root, 'spent.json'), 'utf8');
  assert.throws(() => recoverConnectivity(f.root), /process_active/);
  await new Promise<void>(resolve => { child.once('exit', () => resolve()); child.kill('SIGKILL'); });
  recoverConnectivity(f.root);
  assert.equal(JSON.parse(readFileSync(join(f.root, 'recovery-cleanup.json'), 'utf8')).processExited, true);
  assert.throws(() => recoverConnectivity(f.root), /EEXIST/);
  writeFileSync(join(f.root, 'recovery-cleanup.json'), '{');
  assert.throws(() => recoverConnectivity(f.root), /EEXIST/);
  assert.equal(readFileSync(join(f.root, 'spent.json'), 'utf8'), spent);
  await assert.rejects(runConnectivityFixture(f.root, source, driver().wire));
});

test('normal 30-second supervisor ceiling independently kills a blocked consumption at 10 seconds', async t => {
  const f = fixture(t), file = childFile(f.parent), start = performance.now();
  const result = await superviseConnectivityChild(file, [f.root, 'hang']);
  const elapsed = performance.now() - start;
  assert.ok(result.killed); assert.equal(result.code, null); assert.ok(elapsed >= 9900 && elapsed < 15000, `elapsed=${elapsed}`);
  const spent = readFileSync(join(f.root, 'spent.json'), 'utf8');
  assert.equal(f.stages().at(-1).stage, 'dns_started');
  recoverConnectivity(f.root); assert.equal(readFileSync(join(f.root, 'spent.json'), 'utf8'), spent);
  await assert.rejects(runConnectivityFixture(f.root, source, driver().wire));
});


test('near-expiry admission is refused so the independent 10-second bound cannot outlive the manifest', async t => {
  const f = fixture(t), root = join(f.parent, 'late'), d = driver();
  prepareConnectivityFixture(root, source, Date.now() - 51000);
  await assert.rejects(runConnectivityFixture(root, source, d.wire), /expired/);
  assert.equal(d.dns, 0); assert.equal(d.requests, 0); assert.throws(() => prepareConnectivityFixture(root, source));
});
test('a synchronous filesystem check crossing absolute expiry cannot start DNS', async t => {
  const f = fixture(t), d = driver(), originalRead = fs.readFileSync; let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  fs.readFileSync = ((...args: Parameters<typeof readFileSync>) => {
    const value = originalRead(...args);
    if (String(args[0]).endsWith('/stages.jsonl')) now = Date.parse(f.manifest.expiresAt) + 1;
    return value;
  }) as typeof fs.readFileSync; syncBuiltinESMExports();
  try {
    const receipt = await runConnectivityFixture(f.root, source, d.wire);
    assert.equal(receipt.diagnostic.category, 'settlement_unknown'); assert.equal(d.dns, 0); assert.equal(d.requests, 0);
  } finally { fs.readFileSync = originalRead; syncBuiltinESMExports(); }
});
