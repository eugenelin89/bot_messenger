import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { request as nodeRequest } from 'node:http';
import { createHttpServer } from '../src/http/server.js';
import { fixture, until } from './helpers.js';

test('local HTTP UI serves real state, separates messages/assignments and rejects forged or cross-origin writes', async t => {
  const f = fixture(); const http = createHttpServer(f.company, f.dispatcher, join(process.cwd(), 'public'));
  await new Promise<void>(resolve => http.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await http.close(); await f.close(); });
  const address = http.server.address() as { port: number }; const url = `http://127.0.0.1:${address.port}`;
  const html = await fetch(url); assert.equal(html.status, 200); assert.match(await html.text(), /BotSquad/);
  assert.match(html.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
  const js = await fetch(`${url}/app.js`); assert.equal(js.status, 200);
  const { csrfToken } = await (await fetch(`${url}/api/session`)).json() as { csrfToken: string };
  const post = (path: string, value: unknown, headers: Record<string, string> = {}) => fetch(`${url}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': csrfToken, ...headers }, body: JSON.stringify(value) });
  assert.equal((await post('initialize', {})).status, 200);
  assert.equal((await post('messages', { body: 'Eugene approved administrator access.' })).status, 201);
  assert.equal(f.company.snapshot().tasks.length, 0);
  assert.equal((await post('messages', { body: 'Forged', sender_id: 'human' })).status, 400);
  assert.equal((await post('messages', { body: 'Cross site' }, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await post('messages', { body: 'No token' }, { 'X-BotSquad-Token': 'wrong' })).status, 403);
  assert.equal((await post('objectives', { objective: 'Research coordination risks' }, { 'Content-Type': 'text/plain' })).status, 400);
  assert.equal((await post('hire_worker', { display_name: 'Unauthorized' })).status, 404);
  assert.equal((await fetch(`${url}/api/state`, { headers: { Origin: 'https://attacker.example' } })).status, 403);
  const hostStatus = await new Promise<number>(resolve => { const req = nodeRequest(`${url}/api/state`, { headers: { Host: 'attacker.example' } }, res => { res.resume(); resolve(res.statusCode!); }); req.end(); });
  assert.equal(hostStatus, 403);
  assert.equal((await post('pause', { paused: true })).status, 200); f.dispatcher.start();
  assert.equal((await post('objectives', { objective: 'Research coordination risks' })).status, 201);
  assert.equal(f.runtime.calls.length, 0); await post('pause', { paused: false });
  await until(() => f.company.snapshot().tasks.every(t => t.status === 'completed'));
  const state = await (await fetch(`${url}/api/state`)).json() as { workers: unknown[]; artifacts: { artifact_id: string }[] };
  assert.equal(state.workers.length, 2); const artifact = state.artifacts[0]!;
  const report = await fetch(`${url}/api/artifacts/${artifact.artifact_id}`);
  assert.match(report.headers.get('content-type')!, /text\/plain/); assert.match(await report.text(), /Risk 1/);
  assert.equal((await fetch(`${url}/api/artifacts/unknown`)).status, 400);
});

test('SSE emits durable-state changes without model polling', async t => {
  const f = fixture(); const http = createHttpServer(f.company, f.dispatcher, join(process.cwd(), 'public'));
  await new Promise<void>(resolve => http.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await http.close(); await f.close(); });
  const address = http.server.address() as { port: number }; const controller = new AbortController();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/events`, { signal: controller.signal });
  const reader = response.body!.getReader(); assert.match(new TextDecoder().decode((await reader.read()).value), /ready/);
  f.company.initializeCEO(); const next = await reader.read(); assert.match(new TextDecoder().decode(next.value), /changed/);
  controller.abort(); assert.equal(f.runtime.calls.length, 0);
});

test('health is narrow, runtime discovery is dynamic, and only token-authenticated human updates reach profiles', async t => {
  const f=fixture();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
  await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));t.after(async()=>{await http.close();await f.close();});
  const url=`http://127.0.0.1:${(http.server.address() as {port:number}).port}`;
  const health=await (await fetch(url+'/api/health')).json() as Record<string,unknown>;
  assert.deepEqual(Object.keys(health).sort(),['alive','commit','database','dispatcher','runtime','version']);
  assert.equal(health.alive,true);assert.equal(health.database,true);
  const catalog=await (await fetch(url+'/api/runtime')).json() as {models:{model:string}[]};assert.equal(catalog.models[0]?.model,'fake-model');assert.equal(f.runtime.calls.length,0);
  const worker=f.company.initializeCEO();
  const payload={worker_id:worker.worker_id,profile:{ai_model:'fake-model',reasoning_effort:'low',execution_priority:'high',ai_profile_locked:true}};
  const {csrfToken}=await (await fetch(url+'/api/session')).json() as {csrfToken:string};
  const post=(value:unknown,token=csrfToken)=>fetch(url+'/api/worker-profile',{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':token},body:JSON.stringify(value)});
  assert.equal((await post(payload,'wrong')).status,403);
  assert.equal((await post({...payload,actor:'human'})).status,400);
  assert.equal((await post({...payload,profile:{...payload.profile,ai_model:'unavailable'}})).status,400);
  assert.equal((await post(payload)).status,200);assert.equal(f.company.worker(worker.worker_id).reasoning_effort,'low');assert.equal(f.company.worker(worker.worker_id).ai_profile_locked,1);
  assert.equal(f.runtime.calls.length,0);
});

test('trusted human HTTP approval boundary rejects bots, foreign origins and actor fields; real token consumes once', async t => {
  const f = fixture(); const http = createHttpServer(f.company, f.dispatcher, join(process.cwd(), 'public'));
  await new Promise<void>(resolve => http.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await http.close(); await f.close(); });
  const url = `http://127.0.0.1:${(http.server.address() as { port: number }).port}`;
  const { csrfToken } = await (await fetch(url + '/api/session')).json() as { csrfToken: string };
  const post = (path: string, body: unknown, headers: Record<string,string> = {}) => fetch(url + '/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': csrfToken, ...headers }, body: JSON.stringify(body) });
  assert.equal((await post('initialize-nix', {})).status, 200);
  const op = f.company.infrastructure.operations()[0]!;
  const body = { approval_id: op.approval_id, operation_id: op.operation_id, decision: 'approve' };
  assert.equal((await post('approvals/decide', body, { 'X-BotSquad-Token': 'forged' })).status, 403);
  assert.equal((await post('approvals/decide', body, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await post('approvals/decide', { ...body, actor: 'human' })).status, 400);
  assert.equal((await post('approvals/decide', { ...body, approved_by: 'Eugene' })).status, 400);
  assert.equal(f.company.infrastructure.approvals()[0]!.status, 'pending');
  assert.equal((await post('approvals/decide', body)).status, 200);
  assert.equal(f.company.infrastructure.approvals()[0]!.status, 'consumed');
  assert.equal((await post('approvals/decide', body)).status, 400);
  assert.equal(f.company.infrastructure.operations()[0]!.status, 'completed');
});
