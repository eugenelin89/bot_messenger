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

test('Project HTTP controls preserve the trusted-human boundary and render generalized persisted state',async t=>{
  const f=fixture();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
  await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));t.after(async()=>{await http.close();await f.close();});
  const base=`http://127.0.0.1:${(http.server.address() as {port:number}).port}`;
  const {csrfToken}=await(await fetch(base+'/api/session')).json() as {csrfToken:string};
  const defaults=await(await fetch(base+'/api/projects/defaults')).json() as {policy:unknown};
  const post=(path:string,body:unknown,token=csrfToken)=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':token},body:JSON.stringify(body)});
  const creation={name:'Human Project',description:'Software repository',instructions:'Bounded engineering',policy:defaults.policy};
  assert.equal((await post('projects/create',creation,'forged')).status,403);
  assert.equal((await post('projects/create',{...creation,created_by:'human'})).status,400);
  const project=await(await post('projects/create',creation)).json() as {project_id:string};
  const response=await post('projects/repositories/local',{project_id:project.project_id,repository:{name:'service',default_branch:'trunk'}});assert.equal(response.status,201);const repo=await response.json() as {repository_id:string};
  assert.equal((await post('projects/remote/configure',{repository_id:repo.repository_id,url:'https://credential@github.com/o/r.git',policy:'approved_push'})).status,400);
  assert.equal((await post('projects/approvals/decide',{approval_id:'not-real',approved:true,actor:'human'})).status,400);
  assert.equal((await post('projects/archive',{project_id:project.project_id})).status,200);
  assert.equal((await post('projects/repositories/local',{project_id:project.project_id,repository:{name:'late',default_branch:'trunk'}})).status,400);
  const state=await(await fetch(base+'/api/state')).json() as {projects:{status:string}[];review_rounds:unknown[];project_operations:unknown[]};assert.equal(state.projects[0]!.status,'archived');assert.deepEqual(state.review_rounds,[]);assert.deepEqual(state.project_operations,[]);
  assert.equal(f.runtime.calls.length,0);
});

test('standing permissions require browser owner authority and do not extend device routes or state',async t=>{
  const f=fixture();const atlas=f.company.initializeCEO();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
  await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));t.after(async()=>{await http.close();await f.close();});
  const base=`http://127.0.0.1:${(http.server.address() as {port:number}).port}`;
  const {csrfToken}=await(await fetch(base+'/api/session')).json() as {csrfToken:string};
  const post=(path:string,body:unknown,headers:Record<string,string>={})=>fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':csrfToken,...headers},body:JSON.stringify(body)});
  const body={worker_id:atlas.worker_id,preset:'public_research',expires_at:null,document_paths:[]};
  assert.equal((await post('research/grant',body,{'X-BotSquad-Token':'forged'})).status,403);
  assert.equal((await post('research/grant',body,{Origin:'https://attacker.example'})).status,403);
  assert.equal((await post('research/grant',body,{Authorization:'Bearer device'})).status,403);
  assert.equal((await post('research/grant',{...body,granted_by:'human'})).status,400);
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM standing_grants')!.n,0);
  const granted=await post('research/grant',body);assert.equal(granted.status,201);const g=await granted.json() as {grant_id:string};
  assert.equal((await fetch(base+`/api/research/workers/${atlas.worker_id}`,{headers:{Authorization:'Bearer device'}})).status,403);
  assert.equal((await post('v1/research/grant',body)).status,403);
  const state=await(await fetch(base+'/api/state')).json() as Record<string,unknown>;assert.equal(state.standing_grants,undefined);assert.equal(state.research_operations,undefined);
  const revoked=await post('research/revoke',{grant_id:g.grant_id});assert.equal(revoked.status,200);
  const status=await(await fetch(base+`/api/research/workers/${atlas.worker_id}`)).json() as {configured:boolean;grants:{status:string}[]};assert.equal(status.configured,false);assert.equal(status.grants[0]!.status,'revoked');
});
