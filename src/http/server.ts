import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Company, DEFAULT_OBJECTIVE } from '../control/company.js';
import { Dispatcher } from '../control/dispatcher.js';
import { DomainError, requireThat, strictObject, textField } from '../domain/model.js';

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
};
async function readBody(req: IncomingMessage): Promise<unknown> {
  requireThat(req.headers['content-type']?.split(';')[0] === 'application/json', 'JSON body required');
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of req) {
    length += (chunk as Buffer).length; requireThat(length <= 64000, 'Request is too large'); chunks.push(chunk as Buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new DomainError('Malformed JSON'); }
}
export function createHttpServer(company: Company, dispatcher: Dispatcher, publicDir: string) {
  const token = randomBytes(32).toString('hex'); const clients = new Set<ServerResponse>();
  let changedTimer: NodeJS.Timeout | undefined;
  const changed = () => {
    if (changedTimer) return;
    changedTimer = setTimeout(() => { changedTimer = undefined; for (const res of clients) res.write('event: changed\ndata: {}\n\n'); }, 60);
  };
  company.on('changed', changed);
  const server = createServer(async (req, res) => {
    const json = (status: number, value: unknown) => { res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    try {
      const address = server.address(); requireThat(address && typeof address !== 'string', 'Server unavailable');
      const hosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
      if (!req.headers.host || !hosts.includes(req.headers.host)) { json(403, { error: 'Untrusted Host' }); return; }
      const expectedOrigin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== expectedOrigin) { json(403, { error: 'Cross-origin request denied' }); return; }
      if (req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Cross-site request denied' }); return; }
      const path = new URL(req.url ?? '/', expectedOrigin).pathname;
      if (req.method === 'GET') {
        if (path === '/api/session') { json(200, { csrfToken: token, defaultObjective: DEFAULT_OBJECTIVE }); return; }
        if (path === '/api/state') { json(200, { ...company.snapshot(), supportsInterrupt: dispatcher.adapter.supportsInterrupt }); return; }
        if (path === '/api/events') {
          res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
          res.write('event: ready\ndata: {}\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
        }
        if (path.startsWith('/api/artifacts/')) {
          const content = company.artifactContent(decodeURIComponent(path.slice('/api/artifacts/'.length)));
          res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' }); res.end(content); return;
        }
        const staticFiles: Record<string, [string, string]> = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
        const file = staticFiles[path];
        if (file) { res.writeHead(200, { ...securityHeaders, 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(readFileSync(join(publicDir, file[0]))); return; }
        json(404, { error: 'Not found' }); return;
      }
      if (req.method !== 'POST') { json(405, { error: 'Method not allowed' }); return; }
      const supplied = req.headers['x-botsquad-token'];
      if (typeof supplied !== 'string' || supplied.length !== token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) { json(403, { error: 'Missing local session token' }); return; }
      const body = await readBody(req);
      if (path === '/api/initialize') { strictObject(body, []); json(200, company.initializeCEO()); }
      else if (path === '/api/messages') { const a = strictObject(body, ['body']); json(201, company.sendHumanMessage(textField(a, 'body'))); }
      else if (path === '/api/objectives') {
        const a = strictObject(body, ['objective']);
        json(201, company.assignObjective({ objective: textField(a, 'objective'),
          acceptance_criteria: 'Evaluate the evidence and report concrete recommendations to the Human. If delegating research, require a saved report and review it before your final conclusion.',
          constraints: 'Local approved documents only. No spending, external accounts, outreach or publishing. One bounded research assignment; no recursive delegation.' }));
      } else if (path === '/api/pause') {
        const a = strictObject(body, ['paused']); requireThat(typeof a.paused === 'boolean', 'Invalid pause value'); company.pause(a.paused); json(200, { paused: company.paused });
      } else if (path === '/api/interrupt') {
        const a = strictObject(body, ['execution_id']); dispatcher.interrupt(textField(a, 'execution_id', 100)); json(200, { requested: true });
      } else if (path === '/api/retry') {
        const a = strictObject(body, ['task_id', 'inspected']); company.retry(textField(a, 'task_id', 100), a.inspected === true); json(200, { queued: true });
      } else if (path === '/api/cancel') {
        const a = strictObject(body, ['task_id']); company.cancel(textField(a, 'task_id', 100)); json(200, { cancelled: true });
      } else json(404, { error: 'Not found' });
    } catch (error) {
      json(error instanceof DomainError ? 400 : 500, { error: error instanceof DomainError ? error.message : 'Operation failed. Inspect task and execution history.' });
    }
  });
  server.on('close', () => { company.off('changed', changed); if (changedTimer) clearTimeout(changedTimer); });
  return { server, close: async () => { for (const c of clients) c.end(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); } };
}
