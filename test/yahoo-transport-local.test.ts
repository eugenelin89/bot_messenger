import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpsRequest, type RequestOptions } from 'node:https';
import type { IncomingMessage } from 'node:http';
import type { LookupFunction } from 'node:net';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { yahooPinnedLookup, yahooOfflineWire, type YahooWire } from '../src/control/market/yahoo-https.js';
import { YahooTransportError } from '../src/control/market/yahoo-diagnostics.js';
import { request } from './fixtures/yahoo/support.js';

// Every request below is pinned to a literal loopback address. No system DNS or external socket.
// The old scalar callback is kept only as an authored regression fixture.
test('Node24 reproduces the old all:true lookup defect without external DNS or sockets', async () => {
  let all: boolean | undefined;
  await new Promise<void>((resolve, reject) => {
    const req = httpsRequest('https://fixture.invalid/', { agent: false, ...{ autoSelectFamily: true },
      lookup: (_host, options, cb) => { all = options.all; cb(null, '127.0.0.1', 4); } }, () => reject(new Error('unexpected_response')));
    req.once('error', error => { try { assert.equal((error as NodeJS.ErrnoException).code, 'ERR_INVALID_IP_ADDRESS'); resolve(); } catch (e) { reject(e); } }); req.end();
  });
  assert.equal(all, true);
});
test('pin supports scalar, all:true and IPv6 shapes with exactly one approved address', () => {
  for (const selected of [{ address: '1.1.1.1', family: 4 }, { address: '2606:4700:4700::1111', family: 6 }]) {
    yahooPinnedLookup(selected)('ignored.invalid', { all: true }, (error, addresses, family) => {
      assert.equal(error, null); assert.deepEqual(addresses, [selected]); assert.equal(family, undefined);
    });
    yahooPinnedLookup(selected)('ignored.invalid', {}, (error, address, family) => {
      assert.equal(error, null); assert.equal(address, selected.address); assert.equal(family, selected.family);
    });
  }
});
test('real Node HTTPS completes on an authored local TLS server using the production pin callback', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'yahoo-local-tls-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  execFileSync('/usr/bin/openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'key.pem'),
    '-out', join(dir, 'cert.pem'), '-days', '1', '-subj', '/CN=query2.finance.yahoo.com', '-addext',
    'subjectAltName=DNS:query2.finance.yahoo.com'], { stdio: 'ignore', timeout: 10000 });
  const cert = readFileSync(join(dir, 'cert.pem')); let calls = 0, trust = true, forceAll = false, callbackAll: boolean | undefined;
  const server = createServer({ key: readFileSync(join(dir, 'key.pem')), cert }, (_req, res) => { calls++; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const port = (server.address() as { port: number }).port;
  const wire: YahooWire = {
    lookup: (async () => [{ address: '1.1.1.1', family: 4 }]) as unknown as YahooWire['lookup'],
    request: ((url: URL, options: RequestOptions, callback: (res: IncomingMessage) => void) => {
      assert.equal(options.rejectUnauthorized, true); assert.equal(options.servername, 'query2.finance.yahoo.com');
      assert.equal(options.family, 4); assert.equal((options as RequestOptions & { autoSelectFamily?: boolean }).autoSelectFamily, false);
      const pin = options.lookup!;
      const lookup: LookupFunction = (host, opts, cb) => {
        callbackAll = opts.all;
        // Assert the production callback shape BEFORE substituting loopback for this fixture.
        pin(host, opts, (error, address, family) => {
          assert.equal(error, null);
          if (opts.all) { assert.deepEqual(address, [{ address: '1.1.1.1', family: 4 }]); cb(null, [{ address: '127.0.0.1', family: 4 }]); }
          else { assert.equal(address, '1.1.1.1'); assert.equal(family, 4); cb(null, '127.0.0.1', 4); }
        });
      };
      // First exercise unchanged production options; separately force Node24's all:true path.
      return httpsRequest(url, { ...options, port, lookup, ...(forceAll ? { family: 0, autoSelectFamily: true } : {}), ...(trust ? { ca: cert } : {}) }, callback);
    }) as typeof httpsRequest,
  };
  const transport = yahooOfflineWire(request(), 'ACME', wire);
  const query = { method: 'GET' as const, url: 'https://query2.finance.yahoo.com/v8/finance/chart/ACME', params: { range: '1d', interval: '1d' } };
  assert.equal((await transport.exchange(query, new AbortController().signal, 1024)).status, 200);
  assert.notEqual(callbackAll, true); assert.equal(calls, 1);
  forceAll = true;
  assert.equal((await transport.exchange(query, new AbortController().signal, 1024)).status, 200);
  assert.equal(callbackAll, true); assert.equal(calls, 2);
  forceAll = false; trust = false;
  await assert.rejects(transport.exchange(query, new AbortController().signal, 1024), (error: unknown) => {
    assert.ok(error instanceof YahooTransportError); assert.equal(error.diagnostic.category, 'tls_failure');
    assert.equal(error.diagnostic.lastConfirmed.stage, 'tcp_connected'); return true;
  });
  assert.equal(calls, 2);
});
