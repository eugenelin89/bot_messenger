import { execFileSync } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Company, DEFAULT_OBJECTIVE } from '../control/company.js';
import { Dispatcher } from '../control/dispatcher.js';
import { DomainError, requireThat, strictObject, textField } from '../domain/model.js';
import {DEFAULT_POLICY,HARD_BOUNDS} from '../domain/projects.js';
import { ClientAPI } from './client-api.js';
import { ClientError } from '../client/protocol.js';

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
};
async function readBody(req: IncomingMessage, limit=64000): Promise<unknown> {
  requireThat(req.headers['content-type']?.split(';')[0] === 'application/json', 'JSON body required');
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of req) {
    length += (chunk as Buffer).length; requireThat(length <= limit, 'Request is too large'); chunks.push(chunk as Buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new DomainError('Malformed JSON'); }
}
export function createHttpServer(company: Company, dispatcher: Dispatcher, publicDir: string) {
  let deployedCommit = process.env.BOT_DEPLOYED_SHA ?? 'unknown';
  if (deployedCommit === 'unknown') { try { deployedCommit = execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: join(publicDir, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 1000 }).trim(); } catch {} }
  const clientAPI = new ClientAPI(company, dispatcher, deployedCommit);
  const token = randomBytes(32).toString('hex'); const clients = new Set<ServerResponse>();
  let changedTimer: NodeJS.Timeout | undefined;
  const changed = () => {
    if (changedTimer) return;
    changedTimer = setTimeout(() => { changedTimer = undefined; for (const res of clients) res.write('event: changed\ndata: {}\n\n'); }, 60);
  };
  company.on('changed', changed);
  const server = createServer(async (req, res) => {
    if (/^\/api\/v[^/]*(?:\/|$)/.test(req.url ?? '')) { await clientAPI.handle(req, res); return; }
    const json = (status: number, value: unknown) => { res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    try {
      const address = server.address(); requireThat(address && typeof address !== 'string', 'Server unavailable');
      const hosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
      if (!req.headers.host || !hosts.includes(req.headers.host)) { json(403, { error: 'Untrusted Host' }); return; }
      const expectedOrigin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== expectedOrigin) { json(403, { error: 'Cross-origin request denied' }); return; }
      if (req.headers['sec-fetch-site'] === 'cross-site') { json(403, { error: 'Cross-site request denied' }); return; }
      const path = new URL(req.url ?? '/', expectedOrigin).pathname;
      if (path.startsWith('/api/') && req.headers.authorization) { json(403, { error: 'Device authorization is not a local browser session' }); return; }
      if (req.method === 'GET') {
        if (path === '/api/health') { json(200, { alive: true, database: !!company.store.get('SELECT 1'), dispatcher: dispatcher.initialized, runtime: dispatcher.runtimeState, version: '0.1.0', commit: deployedCommit }); return; }
        if (path === '/api/runtime') { json(200, await dispatcher.runtimeCatalog()); return; }
        if (path === '/api/projects/defaults') {json(200,{policy:DEFAULT_POLICY,hard_bounds:HARD_BOUNDS,supported_runtime:'Node test runner; explicit files; isolated temporary build area'});return;}
        if (path === '/api/session') { json(200, { csrfToken: token, defaultObjective: DEFAULT_OBJECTIVE }); return; }
        if (path === '/api/devices') { json(200, clientAPI.trust.adminState()); return; }
        if (path === '/api/state') { json(200, { ...company.snapshot(), supportsInterrupt: dispatcher.adapter.supportsInterrupt }); return; }
        if (path.startsWith('/api/research/workers/')) {json(200,company.research.status(decodeURIComponent(path.slice('/api/research/workers/'.length))));return;}
        if (path.startsWith('/api/research/operations/')) {json(200,company.research.inspect(decodeURIComponent(path.slice('/api/research/operations/'.length))));return;}
        if(path==='/api/mandates'){json(200,company.mandates.list());return;}
        if(path==='/api/computers'){json(200,company.computers.inspect());return;}
        if(path.startsWith('/api/computer-evidence/')){const bytes=company.computers.evidence(decodeURIComponent(path.slice('/api/computer-evidence/'.length)));res.writeHead(200,{...securityHeaders,'Content-Type':'image/png','Content-Length':bytes.length});res.end(bytes);return;}
        if(path.startsWith('/api/computers/')){json(200,company.computers.inspect(decodeURIComponent(path.slice('/api/computers/'.length))));return;}
        if(path.startsWith('/api/mandates/')){json(200,company.mandates.inspect(decodeURIComponent(path.slice('/api/mandates/'.length))));return;}
        if(path==='/api/groups') {const q=new URL(req.url!,expectedOrigin).searchParams;requireThat([...q.keys()].every(k=>k==='before'),'Invalid group query');json(200,company.discussions.list(q.has('before')?Number(q.get('before')):undefined));return;}
        if(path.startsWith('/api/groups/')) {const q=new URL(req.url!,expectedOrigin).searchParams;requireThat([...q.keys()].every(k=>k==='before'),'Invalid group history query');json(200,company.discussions.inspect(decodeURIComponent(path.slice('/api/groups/'.length)),q.has('before')?Number(q.get('before')):undefined));return;}
        if(path.startsWith('/api/group-syntheses/')) {json(200,company.discussions.synthesis(decodeURIComponent(path.slice('/api/group-syntheses/'.length))));return;}
        if(path.startsWith('/api/group-assignment-preview/')) {json(200,company.discussions.assignmentPreview(decodeURIComponent(path.slice('/api/group-assignment-preview/'.length))));return;}
        if (path === '/api/conversations') {
          const q = new URL(req.url!,expectedOrigin).searchParams;
          requireThat([...q.keys()].every(k=>['worker_id','before'].includes(k)), 'Invalid conversation query');
          json(200,company.conversations.list(q.get('worker_id')??undefined,q.has('before')?Number(q.get('before')):undefined));return;
        }
        if (path.startsWith('/api/conversations/')) {
          const q = new URL(req.url!,expectedOrigin).searchParams;
          requireThat([...q.keys()].every(k=>k==='before'),'Invalid history query');
          json(200,company.conversations.inspect(decodeURIComponent(path.slice('/api/conversations/'.length)),q.has('before')?Number(q.get('before')):undefined));return;
        }
        if (path === '/api/events') {
          res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
          res.write('event: ready\ndata: {}\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return;
        }
        if (path.startsWith('/api/artifacts/')) {
          const content = company.artifactContent(decodeURIComponent(path.slice('/api/artifacts/'.length)));
          res.writeHead(200, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' }); res.end(content); return;
        }
        const staticFiles: Record<string, [string, string]> = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/groups.js':['groups.js','text/javascript'], '/mandates.js':['mandates.js','text/javascript'], '/computers.js':['computers.js','text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
        const file = staticFiles[path];
        if (file) { res.writeHead(200, { ...securityHeaders, 'Content-Type': `${file[1]}; charset=utf-8` }); res.end(readFileSync(join(publicDir, file[0]))); return; }
        json(404, { error: 'Not found' }); return;
      }
      if (req.method !== 'POST') { json(405, { error: 'Method not allowed' }); return; }
      const supplied = req.headers['x-botsquad-token'];
      if (typeof supplied !== 'string' || supplied.length !== token.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) { json(403, { error: 'Missing local session token' }); return; }
      const body = await readBody(req,path==='/api/projects/repositories/import'?Math.ceil(HARD_BOUNDS.bundle_bytes*4/3)+2048:64000);
      if (path === '/api/devices/pairings') { json(201, clientAPI.trust.createPairing(body)); }
      else if(path==='/api/research/grant'){json(201,company.research.grant(body));}
      else if(path==='/api/research/revoke'){json(200,company.research.revoke(body));}
      else if(path==='/api/computers/operator'){json(201,company.initializeComputerOperator(body));}
      else if(path==='/api/computers/request'){json(201,company.computers.request(body));}
      else if(path==='/api/computers/authorize'){json(200,company.computers.authorize(body));}
      else if(path==='/api/computers/decide'){json(200,company.computers.decide(body));}
      else if(path==='/api/computers/control'){json(200,await company.computers.control(body));}
      else if(path==='/api/mandates/create'){json(201,company.mandates.create(body));}
      else if(path==='/api/mandates/control'){json(200,company.mandates.control(body));}
      else if(path==='/api/mandates/observations'){json(201,company.mandates.admitObservation(body));}
      else if(path==='/api/mandates/withdraw-observation'){json(200,company.mandates.withdrawObservation(body));}
      else if(path==='/api/mandates/schedules'){json(201,company.mandates.saveOwnerSchedule(body));}
      else if(path==='/api/mandates/schedule-control'){json(200,company.mandates.controlSchedule(body));}
      else if(path==='/api/groups/create'){json(201,company.discussions.create(body));}
      else if(path==='/api/groups/note'){json(201,company.discussions.note(body));}
      else if(path==='/api/groups/share'){json(201,company.discussions.share(body));}
      else if(path==='/api/groups/control'){json(200,company.discussions.control(body));}
      else if(path==='/api/groups/revoke-member'){json(200,company.discussions.revokeMember(body));}
      else if(path==='/api/groups/withdraw-evidence'){json(200,company.discussions.withdrawEvidence(body));}
      else if(path==='/api/groups/assignment'){json(201,company.discussions.submitAssignment(body));}
      else if(path==='/api/groups/interrupt'){const a=strictObject(body,['group_id']);const active=company.discussions.activeExecutions(textField(a,'group_id',100));for(const e of active)dispatcher.interrupt(e.execution_id);json(200,{requested:active.length,notice:'Cancellation requested; inspect each execution for confirmation or uncertainty.'});}
      else if(path==='/api/groups/rollover'){const a=strictObject(body,['group_id','worker_id']);const g=company.discussions.group(textField(a,'group_id',100));company.conversations.requestRollover(g.conversation_id,textField(a,'worker_id',100));json(200,{requested:true});}
      else if (path === '/api/conversations/open') { json(201,company.conversations.open(body)); }
      else if (path === '/api/conversations/send') { json(201,company.conversations.send(body)); }
      else if (path === '/api/conversations/control') {
        const a=strictObject(body,['conversation_id','state']);requireThat(a.state==='active'||a.state==='muted'||a.state==='archived','Invalid conversation state');
        company.conversations.control(textField(a,'conversation_id',100),a.state);json(200,{state:a.state});
      }
      else if (path === '/api/conversations/cancel') {const a=strictObject(body,['request_id']);company.conversations.cancel(textField(a,'request_id',100));json(200,{cancelled:true});}
      else if (path === '/api/conversations/rollover') {const a=strictObject(body,['conversation_id','worker_id']);company.conversations.requestRollover(textField(a,'conversation_id',100),textField(a,'worker_id',100));json(200,{requested:true});}
      else if (path === '/api/conversations/participation') {const a=strictObject(body,['conversation_id','principal_id','active']);requireThat(typeof a.active==='boolean','Invalid participation');company.conversations.participation(textField(a,'conversation_id',100),textField(a,'principal_id',100),a.active);json(200,{updated:true});}
      else if (path === '/api/devices/decide') { json(200, clientAPI.trust.decide(body)); }
      else if (path === '/api/devices/revoke') { json(200, clientAPI.trust.revoke(body)); }
      else if (path === '/api/initialize') { strictObject(body, []); json(200, company.initializeCEO()); }
      else if (path === '/api/initialize-nix') { strictObject(body, []); json(200, company.initializeNix()); }
      else if(path==='/api/projects/create'){json(201,company.projects.create(body));}
      else if(path==='/api/projects/update'){const a=strictObject(body,['project_id','instructions','policy']);json(200,company.projects.update(textField(a,'project_id',100),{instructions:a.instructions,policy:a.policy}));}
      else if(path==='/api/projects/archive'){const a=strictObject(body,['project_id']);json(200,company.projects.archive(textField(a,'project_id',100)));}
      else if(path==='/api/projects/release'){const a=strictObject(body,['allocation_id']);company.projects.release(textField(a,'allocation_id',100));json(200,{released:true});}
      else if(path==='/api/projects/repositories/local'||path==='/api/projects/repositories/import'||path==='/api/projects/repositories/remote'){
        const kind=path.split('/').at(-1)!;const a=strictObject(body,['project_id','repository']);const projectId=textField(a,'project_id',100);
        json(201,kind==='local'?company.projects.local(projectId,a.repository):kind==='import'?company.projects.import(projectId,a.repository):company.remote.register(projectId,a.repository));
      }
      else if(path==='/api/projects/objective'){
        const a=strictObject(body,['project_id','repository_id','objective','acceptance_criteria','constraints']);json(201,company.assignProjectObjective(textField(a,'project_id',100),textField(a,'repository_id',100),{objective:textField(a,'objective'),acceptance_criteria:textField(a,'acceptance_criteria'),constraints:textField(a,'constraints')}));
      }
      else if(path==='/api/projects/remote/configure'){const a=strictObject(body,['repository_id','url','policy']);json(200,company.remote.attach(textField(a,'repository_id',100),{url:a.url,policy:a.policy}));}
      else if(path==='/api/projects/remote/fetch'){const a=strictObject(body,['repository_id']);json(200,company.remote.fetch(textField(a,'repository_id',100)));}
      else if(path==='/api/projects/remote/request-push'){const a=strictObject(body,['repository_id','integration_id','reason']);json(201,company.remote.requestPush(textField(a,'repository_id',100),{integration_id:a.integration_id,reason:a.reason}));}
      else if(path==='/api/projects/approvals/decide'){const a=strictObject(body,['approval_id','approved']);const operation=company.remote.decide(textField(a,'approval_id',100),{approved:a.approved});json(200,a.approved?company.remote.execute(operation.operation_id):operation);}
      else if(path==='/api/projects/remote/retry'){const a=strictObject(body,['operation_id']);json(200,company.remote.execute(textField(a,'operation_id',100)));}
      else if (path === '/api/approvals/decide') { json(200, company.infrastructure.decide(body)); }
      else if (path === '/api/infrastructure/request') {
        const a = strictObject(body, ['worker_id','operation_type','allocation_id']);
        requireThat(['create_worker_identity','disable_worker_identity','revoke_worker_project_access'].includes(a.operation_type as string), 'Unsupported human infrastructure request');
        requireThat(a.allocation_id === null || typeof a.allocation_id === 'string', 'Invalid allocation ID');
        json(200, company.infrastructure.enqueue(textField(a, 'worker_id', 100), a.operation_type as 'create_worker_identity' | 'disable_worker_identity' | 'revoke_worker_project_access', a.allocation_id as string | undefined ?? undefined) ?? { already_bound: true });
      }
      else if (path === '/api/infrastructure/reconcile') { strictObject(body, []); company.infrastructure.reconcile(); json(200, { reconciled: true }); }
      else if (path === '/api/infrastructure/health') { strictObject(body, []); json(200, company.infrastructure.host.request({ type: 'inspect_host_health' })); }
      else if (path === '/api/worker-profile') {
        const a = strictObject(body, ['worker_id', 'profile']);
        json(200, company.updateWorkerAIProfile(textField(a, 'worker_id', 100), a.profile, await dispatcher.runtimeCatalog()));
      }
      else if (path === '/api/messages') { const a = strictObject(body, ['body']); json(201, company.sendHumanMessage(textField(a, 'body'))); }
      else if (path === '/api/objectives') {
        const a = strictObject(body, ['objective']);
        json(201, company.assignObjective({ objective: textField(a, 'objective'),
          acceptance_criteria: 'Evaluate the evidence and report concrete recommendations to the Human. If delegating research, require a saved report and review it before your final conclusion.',
          constraints: 'Use approved tools only, including public research when a current owner standing grant permits it. Research: one subordinate. SquadStatus: Product Manager then CTO with two engineers and one reviewer. No spending, external accounts, outreach, publishing, Computer Use or arbitrary shell/network.' }));
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
      json(error instanceof ClientError ? error.status : error instanceof DomainError ? 400 : 500, { error: error instanceof DomainError || error instanceof ClientError ? error.message : 'Operation failed. Inspect task and execution history.' });
    }
  });
  server.maxHeadersCount = 64;
  server.maxConnections = 64;
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.on('close', () => { clientAPI.close(); company.off('changed', changed); if (changedTimer) clearTimeout(changedTimer); });
  return { server, clientAPI, close: async () => { clientAPI.close(); for (const c of clients) c.end(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); } };
}
