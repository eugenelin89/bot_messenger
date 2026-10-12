import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpsRequest, type RequestOptions } from 'node:https';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { LookupFunction } from 'node:net';
import { prepareConnectivityFixture, runConnectivityFixture } from '../src/control/market/yahoo-connectivity.js';
import type { YahooWire } from '../src/control/market/yahoo-https.js';

// Real Node24 TLS/parser tests. Injected resolver and literal loopback sockets only.
test('one-shot connectivity on real local TLS: pin, certificate verification, header cap, interim and upgrade stop', async t => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'connectivity-local-')));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  execFileSync('/usr/bin/openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(parent, 'key.pem'),
    '-out', join(parent, 'cert.pem'), '-days', '1', '-subj', '/CN=fc.yahoo.com', '-addext', 'subjectAltName=DNS:fc.yahoo.com'], { stdio: 'ignore', timeout: 10000 });
  const cert = readFileSync(join(parent, 'cert.pem'));
  let mode = 'ok', requests = 0, connections = 0;
  const server = createServer({ key: readFileSync(join(parent, 'key.pem')), cert }, (_req, res) => {
    requests++;
    if (mode === 'interim') { res.writeEarlyHints({ link: '</not-followed>; rel=preload' }); return; }
    if (mode === 'upgrade') { res.writeHead(101, { Connection: 'upgrade', Upgrade: 'fixture' }); res.flushHeaders(); return; }
    res.writeHead(mode === 'refusal' ? 429 : 200, { 'Set-Cookie': 'PRIVATE_COOKIE', 'Content-Type': 'text/plain',
      ...(mode === 'oversize' ? { 'X-Authored': 'x'.repeat(17000) } : {}) });
    res.end('PRIVATE_BODY_NOT_CONSUMED');
  });
  server.on('secureConnection', () => connections++);
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const port = (server.address() as { port: number }).port;
  for (const variant of ['ok', 'refusal', 'oversize', 'interim', 'upgrade', 'untrusted']) {
    mode = variant; let dns = 0, wireRequests = 0;
    const source = { commit: 'a'.repeat(40), sourceHash: 'b'.repeat(64) }, root = join(parent, variant);
    prepareConnectivityFixture(root, source);
    const wire: YahooWire = {
      lookup: (async () => { dns++; return [{ address: '1.1.1.1', family: 4 }]; }) as unknown as YahooWire['lookup'],
      request: ((url: URL, options: RequestOptions & { autoSelectFamily: boolean }, callback: (res: IncomingMessage) => void) => {
        wireRequests++; assert.equal(options.autoSelectFamily, false); assert.equal(options.family, 4);
        assert.equal(options.rejectUnauthorized, true); assert.equal(options.servername, 'fc.yahoo.com');
        const pin = options.lookup!;
        const lookup: LookupFunction = (host, opts, cb) => pin(host, opts, (error, address, family) => {
          assert.equal(error, null); assert.equal(opts.all, undefined); assert.equal(address, '1.1.1.1'); assert.equal(family, 4); cb(null, '127.0.0.1', 4);
        });
        return httpsRequest(url, { ...options, port, lookup, ...(variant === 'untrusted' ? {} : { ca: cert }) }, callback);
      }) as YahooWire['request'],
    };
    const before = requests, priorConnections = connections;
    const receipt = await runConnectivityFixture(root, source, wire);
    assert.equal(dns, 1); assert.equal(wireRequests, 1); assert.equal(receipt.consumedBodyBytes, 0);
    assert.ok(!JSON.stringify(receipt).includes('PRIVATE'));
    if (variant === 'untrusted') {
      assert.equal(receipt.diagnostic.category, 'tls_failure'); assert.equal(receipt.status, null); assert.equal(requests, before);
    } else {
      assert.equal(requests, before + 1); assert.equal(connections, priorConnections + 1);
      if (variant === 'oversize') { assert.equal(receipt.status, null); assert.notEqual(receipt.diagnostic.category, 'response'); }
      else {
        assert.equal(receipt.status, variant === 'refusal' ? 429 : variant === 'interim' ? 103 : variant === 'upgrade' ? 101 : 200);
        assert.equal(receipt.diagnostic.lastConfirmed.stage, 'response_headers');
      }
    }
    await assert.rejects(runConnectivityFixture(root, source, wire)); assert.equal(wireRequests, 1);
  }
});
