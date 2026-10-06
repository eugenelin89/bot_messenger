import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { join } from 'node:path';
import { request as nodeRequest } from 'node:http';
import { fixture, until, objective } from './helpers.js';
import { createHttpServer } from '../src/http/server.js';
import { RemoteClients } from '../src/control/remote-clients.js';
import { ClientError, ed25519PublicEncoding, LIMITS, SCOPES, signingBytes, type Challenge, type Scope } from '../src/client/protocol.js';
import { Store } from '../src/persistence/store.js';
import { Company } from '../src/control/company.js';
import { Dispatcher } from '../src/control/dispatcher.js';

const keyId = () => `${Date.now()}.${randomUUID()}`;
const keys = () => generateKeyPairSync('ed25519');
const errorCode = (code: string) => (error: unknown) => error instanceof ClientError && error.code === code;
const claimBody = (p: ReturnType<RemoteClients['createPairing']>, key: ReturnType<typeof keys>) => ({ pairing_id: p.pairing_id, hq_id: p.hq_id, pairing_secret: p.pairing_secret, public_key: key.publicKey.export({ format: 'jwk' }), display_name: 'Reference client', platform: 'test', app_version: '1' });
function enroll(trust: RemoteClients, capabilities: readonly Scope[] = SCOPES) {
  const key = keys(); const p = trust.createPairing({ capabilities }); const value = claimBody(p, key); const claimed = trust.claim(value);
  trust.decide({ device_id: claimed.device.device_id, decision: 'confirm' });
  const authenticate = () => {
    const c = trust.challenge({ device_id: claimed.device.device_id });
    const proof = { device_id: claimed.device.device_id, challenge_id: c.challenge_id, signature: sign(null, signingBytes(c), key.privateKey).toString('base64url') };
    return { c, proof, token: trust.token(proof) };
  };
  return { key, p, value, device: claimed.device, authenticate };
}
async function httpFixture(t: TestContext) {
  const f = fixture(); f.company.initializeCEO(); f.company.pause(true);
  const http = createHttpServer(f.company, f.dispatcher, join(process.cwd(), 'public'));
  await new Promise<void>(r => http.server.listen(0, '127.0.0.1', r));
  t.after(async () => { await http.close(); await f.close(); });
  const base = `http://127.0.0.1:${(http.server.address() as { port: number }).port}`;
  const session = await (await fetch(base + '/api/session')).json() as { csrfToken: string };
  const admin = (path: string, body: unknown) => fetch(base + '/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': session.csrfToken }, body: JSON.stringify(body) });
  const request = (path: string, token?: string, body?: unknown, key?: string, extra: Record<string, string> = {}) => fetch(base + '/api/v1' + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const pair = async (capabilities: readonly Scope[] = SCOPES) => {
    const pairingResponse = await admin('devices/pairings', { capabilities }); assert.equal(pairingResponse.status, 201);
    const p = await pairingResponse.json() as ReturnType<RemoteClients['createPairing']>; const key = keys();
    const c = await request('/pairings/claim', undefined, claimBody(p, key)); assert.equal(c.status, 201);
    const claimed = await c.json() as { data: ReturnType<RemoteClients['claim']> };
    const deviceId = claimed.data.device.device_id;
    assert.equal((await request('/auth/challenge', undefined, { device_id: deviceId })).status, 403);
    assert.equal((await admin('devices/decide', { device_id: deviceId, decision: 'confirm' })).status, 200);
    const challenge = await (await request('/auth/challenge', undefined, { device_id: deviceId })).json() as { data: Challenge };
    // Independent wire encoder, not a call to the server's signing helper.
    const raw = ['botsquad-device-auth-v1', p.hq_id, deviceId, challenge.data.challenge_id, challenge.data.nonce, challenge.data.expires_at].join('\n');
    const proof = { device_id: deviceId, challenge_id: challenge.data.challenge_id, signature: sign(null, Buffer.from(raw), key.privateKey).toString('base64url') };
    const tokenResponse = await request('/auth/token', undefined, proof); assert.equal(tokenResponse.status, 200);
    const result = await tokenResponse.json() as { data: ReturnType<RemoteClients['token']> };
    return { token: result.data.access_token, deviceId, p, key, proof };
  };
  return { ...f, http, base, admin, request, pair, session };
}

test('Ed25519 canonical wire bytes and low-order/noncanonical public keys fail closed', () => {
  const challenge = { hq_id: 'hq', device_id: 'device', challenge_id: 'challenge', nonce: 'nonce', expires_at: '2026-09-29T00:00:00.000Z' };
  assert.equal(signingBytes(challenge).toString(), 'botsquad-device-auth-v1\nhq\ndevice\nchallenge\nnonce\n2026-09-29T00:00:00.000Z');
  const invalid = ['00'.repeat(32), `01${'00'.repeat(31)}`, '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05', 'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a', ...['ec','ed','ee','ff'].map(x => `${x}${'ff'.repeat(30)}7f`)];
  for (const hex of invalid) for (const signBit of [0, 128]) {
    const raw = Buffer.from(hex, 'hex'); raw[31] = raw[31]! | signBit;
    assert.throws(() => ed25519PublicEncoding(raw.toString('base64url')), errorCode('invalid_public_key'));
  }
  ed25519PublicEncoding(keys().publicKey.export({ format: 'jwk' }).x);
});

test('one-time pairing, confirmation, proof, expiry, reauthentication and terminal revocation', async t => {
  const f = fixture(); t.after(() => f.close()); let clock = Date.now(); const trust = new RemoteClients(f.company, () => clock);
  const e = enroll(trust); assert.throws(() => trust.claim(e.value), errorCode('pairing_unavailable'));
  const first = e.authenticate(); assert.equal(trust.authenticate(`Bearer ${first.token.access_token}`, 'state:read').device.device_id, e.device.device_id);
  const liveRows = ['client_pairings','client_tokens','client_challenges','remote_devices','audit_events'].map(table => f.store.all(`SELECT * FROM ${table}`));
  const liveDump = JSON.stringify(liveRows);
  assert.equal(f.store.all('SELECT * FROM client_tokens').length, 1);
  for (const value of [e.p.pairing_secret, first.token.access_token, first.proof.signature, String(e.key.privateKey.export({ format: 'pem', type: 'pkcs8' })), e.key.privateKey.export({ format: 'jwk' }).d!]) assert.equal(liveDump.includes(value), false);
  assert.throws(() => trust.token(first.proof), errorCode('challenge_invalid'));
  const bad = trust.challenge({ device_id: e.device.device_id });
  assert.throws(() => trust.token({ device_id: e.device.device_id, challenge_id: bad.challenge_id, signature: sign(null, signingBytes(bad), keys().privateKey).toString('base64url') }), errorCode('signature_invalid'));
  assert.throws(() => trust.token({ device_id: e.device.device_id, challenge_id: bad.challenge_id, signature: sign(null, signingBytes(bad), e.key.privateKey).toString('base64url') }), errorCode('challenge_invalid'));
  const expires = trust.challenge({ device_id: e.device.device_id }); clock += LIMITS.challengeMs + 1;
  assert.throws(() => trust.token({ device_id: e.device.device_id, challenge_id: expires.challenge_id, signature: sign(null, signingBytes(expires), e.key.privateKey).toString('base64url') }), errorCode('challenge_invalid'));
  clock += LIMITS.tokenMs; assert.throws(() => trust.authenticate(`Bearer ${first.token.access_token}`), errorCode('unauthenticated'));
  const fresh = e.authenticate(); trust.revoke({ device_id: e.device.device_id });
  assert.throws(() => trust.authenticate(`Bearer ${fresh.token.access_token}`), errorCode('unauthenticated'));
  assert.throws(() => trust.challenge({ device_id: e.device.device_id }), errorCode('device_unavailable'));
  assert.throws(() => trust.decide({ device_id: e.device.device_id, decision: 'confirm' }), errorCode('pairing_unavailable'));
  const dbDump = JSON.stringify(f.store.all('SELECT * FROM client_pairings')) + JSON.stringify(f.store.all('SELECT * FROM client_tokens')) + JSON.stringify(f.store.all('SELECT * FROM remote_devices')) + JSON.stringify(f.store.all('SELECT * FROM audit_events'));
  for (const s of [e.p.pairing_secret, first.token.access_token, fresh.token.access_token, String(e.key.privateKey.export({ format: 'pem', type: 'pkcs8' }))]) assert.equal(dbDump.includes(s), false);
  assert.equal(f.store.all('PRAGMA foreign_key_check').length, 0);
});

test('pairing expiry/denial/wrong secrets and private JWK or capability smuggling cannot enroll', async t => {
  const f = fixture(); t.after(() => f.close()); let clock = Date.now(); const trust = new RemoteClients(f.company, () => clock);
  const key = keys(); const p = trust.createPairing({ capabilities: ['state:read'] }); const claim = claimBody(p, key);
  assert.throws(() => trust.claim({ ...claim, pairing_secret: 'a'.repeat(43) }));
  assert.throws(() => trust.claim({ ...claim, capabilities: ['profiles:update'] }));
  assert.throws(() => trust.claim({ ...claim, public_key: key.privateKey.export({ format: 'jwk' }) }));
  const c = trust.claim(claim); trust.decide({ device_id: c.device.device_id, decision: 'deny' });
  assert.throws(() => trust.decide({ device_id: c.device.device_id, decision: 'confirm' }));
  assert.throws(() => trust.challenge({ device_id: c.device.device_id }));
  clock += 60_001; const pending = trust.createPairing({ capabilities: ['state:read'] }); const pendingClaim = trust.claim(claimBody(pending, keys()));
  clock += LIMITS.pairingMs; trust.cleanup(); assert.equal(trust.device(pendingClaim.device.device_id).state, 'denied');
  assert.throws(() => trust.decide({ device_id: pendingClaim.device.device_id, decision: 'confirm' }));
  const expired = trust.createPairing({ capabilities: ['state:read'] }); clock += LIMITS.pairingMs;
  assert.throws(() => trust.claim(claimBody(expired, keys())), errorCode('pairing_unavailable'));
  assert.throws(() => trust.createPairing({ capabilities: ['approve'] }));
});

test('HTTP pairing and strict scoped DTO contract keep browser and remote authority separate', async t => {
  const f = await httpFixture(t); const device = await f.pair();
  assert.equal((await f.request('/auth/token', undefined, device.proof)).status, 401);
  const discovery = await (await f.request('/discovery')).json() as { data: Record<string, unknown> };
  assert.deepEqual(Object.keys(discovery.data).sort(), ['api_versions','authentication','commit','hq_id','server_version']);
  for (const path of ['/overview','/workers','/tasks','/executions','/projects','/repositories','/messages','/artifacts','/capabilities','/runtime']) {
    const response = await f.request(path, device.token); assert.equal(response.status, 200, path);
    const output = JSON.stringify(await response.json()); assert.doesNotMatch(output, /workspace_path|canonical_root|path_or_reference|runtime_reference|secret_hash|token_hash|CODEX_HOME|\/var\/lib|\/Users\//);
    assert.equal(response.headers.has('access-control-allow-origin'), false);
  }
  for (const path of ['/overview?token=hidden','/workers?limit=101','/workers?limit=1&limit=2','/workers?cursor=garbage','/workers/not-an-id']) assert.equal((await f.request(path, device.token)).status, 400, path);
  assert.equal((await f.request('/overview', f.session.csrfToken)).status, 401);
  assert.equal((await f.request('/overview', device.token, undefined, undefined, { Origin: 'http://127.0.0.1' })).status, 403);
  assert.equal((await f.request('/overview', undefined, undefined, undefined, { Cookie: `token=${device.token}` })).status, 403);
  const cross = await fetch(f.base + '/api/devices/decide', { method: 'POST', headers: { Authorization: `Bearer ${device.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: device.deviceId, decision: 'confirm' }) }); assert.equal(cross.status, 403);
  assert.equal((await f.request('/approvals/decide', device.token, {}, keyId())).status, 404);
  assert.equal((await fetch(f.base + '/api/v2/overview')).status, 404);
  // Native protocol does not depend on the browser's loopback Host port.
  const nativeStatus = await new Promise<number>(resolve => { const req = nodeRequest(f.base + '/api/v1/overview', { headers: { Host: 'private-forwarder:9000', Authorization: `Bearer ${device.token}` } }, res => { res.resume(); resolve(res.statusCode!); }); req.end(); }); assert.equal(nativeStatus, 200);
  const readOnly = await f.pair(['state:read']);
  assert.equal((await f.request('/messages', readOnly.token, { body: 'not allowed' }, keyId())).status, 403);
  assert.equal((await f.request('/projects', readOnly.token)).status, 403);
  f.store.run("UPDATE principals SET enabled=0 WHERE principal_id='human'");
  assert.equal((await f.request('/overview', device.token)).status, 403);
});

test('HTTP mutations are atomic, device-bound and replay original responses without duplicate work', async t => {
  const f = await httpFixture(t); const { token, deviceId } = await f.pair();
  const before = f.company.snapshot().tasks.length; const messageKey = keyId();
  const first = await f.request('/messages', token, { body: 'communication only' }, messageKey); assert.equal(first.status, 201); const original = await first.json();
  const replay = await f.request('/messages', token, { body: 'communication only' }, messageKey); assert.deepEqual(await replay.json(), original);
  assert.equal(f.company.snapshot().tasks.length, before); assert.equal(f.store.get<{ n: number }>('SELECT count(*) n FROM messages')!.n, 1);
  assert.equal((await f.request('/messages', token, { body: 'different' }, messageKey)).status, 409);
  assert.equal((await f.request('/objectives', token, objective, messageKey)).status, 409);
  assert.equal((await f.request('/messages', token, { body: 'missing key' })).status, 400);
  const objectiveKey = keyId(); const response = await f.request('/objectives', token, objective, objectiveKey); assert.equal(response.status, 201); const task = await response.json();
  assert.deepEqual(await (await f.request('/objectives', token, objective, objectiveKey)).json(), task); assert.equal(f.company.snapshot().tasks.length, before + 1);
  const pausedKey = keyId(); const pauseBody = { paused: true, expected_paused: true };
  const pause = await (await f.request('/dispatch', token, pauseBody, pausedKey)).json();
  assert.deepEqual(await (await f.request('/dispatch', token, pauseBody, pausedKey)).json(), pause);
  assert.equal((await f.request('/dispatch', token, { paused: false, expected_paused: false }, keyId())).status, 409);
  const worker = f.company.workers()[0]!; const prior = { ai_model: worker.ai_model, reasoning_effort: worker.reasoning_effort, execution_priority: worker.execution_priority, ai_profile_locked: !!worker.ai_profile_locked };
  const profile = { ai_model: 'fake-model', reasoning_effort: 'low', execution_priority: 'high', ai_profile_locked: true }; const profileKey = keyId();
  const update = await f.request(`/workers/${worker.worker_id}/profile`, token, { profile, expected_profile: prior }, profileKey); assert.equal(update.status, 200); const updated = await update.json();
  assert.deepEqual(await (await f.request(`/workers/${worker.worker_id}/profile`, token, { profile, expected_profile: prior }, profileKey)).json(), updated);
  assert.equal((await f.request(`/workers/${worker.worker_id}/profile`, token, { profile, expected_profile: prior }, keyId())).status, 409);
  const audit = f.store.all<{ actor_principal_id: string; detail: string }>("SELECT * FROM audit_events WHERE type='remote_mutation_accepted'");
  assert.equal(audit.length, 4); assert.ok(audit.every(a => a.actor_principal_id === 'human' && JSON.parse(a.detail).device_id === deviceId));
  // Failure to persist the receipt must roll the domain side effect back too.
  f.store.db.exec("CREATE TRIGGER receipt_failure BEFORE INSERT ON client_receipts BEGIN SELECT RAISE(ABORT,'test failure /private/path'); END;");
  const messageCount = f.store.get<{ n: number }>('SELECT count(*) n FROM messages')!.n;
  const fail = await f.request('/messages', token, { body: 'must roll back' }, keyId()); assert.equal(fail.status, 500); assert.doesNotMatch(await fail.text(), /private\/path|SQLITE|test failure/);
  assert.equal(f.store.get<{ n: number }>('SELECT count(*) n FROM messages')!.n, messageCount);
});

test('persisted authentication, HQ identity, receipt and notification history survive reopening SQLite', async t => {
  const f = fixture(); f.company.initializeCEO(); f.company.pause(true); const trust = new RemoteClients(f.company); const e = enroll(trust); const auth = e.authenticate();
  const http = createHttpServer(f.company, f.dispatcher, join(process.cwd(), 'public')); await new Promise<void>(r => http.server.listen(0,'127.0.0.1',r));
  const url = `http://127.0.0.1:${(http.server.address() as {port:number}).port}/api/v1/messages`; const key = keyId();
  const options = { method:'POST', headers:{ Authorization:`Bearer ${auth.token.access_token}`, 'Content-Type':'application/json', 'Idempotency-Key':key }, body:JSON.stringify({body:'lost response'}) };
  const first = await fetch(url, options); assert.equal(first.status,201); const original = await first.text();
  await http.close(); await f.close();
  const store = new Store(join(f.dir,'company.sqlite')); const company = new Company(store,f.dir,process.cwd(),'fake'); const dispatcher = new Dispatcher(company,f.runtime);
  const second = createHttpServer(company,dispatcher,join(process.cwd(),'public')); await new Promise<void>(r=>second.server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await second.close();await dispatcher.stop();store.close();});
  assert.equal(second.clientAPI.trust.hq.hq_id,trust.hq.hq_id); assert.equal(second.clientAPI.trust.device(e.device.device_id).public_key,JSON.stringify({crv:'Ed25519',kty:'OKP',x:e.key.publicKey.export({format:'jwk'}).x}));
  const retry = await fetch(`http://127.0.0.1:${(second.server.address() as {port:number}).port}/api/v1/messages`,options); assert.equal(await retry.text(),original);
  assert.equal(store.get<{n:number}>('SELECT count(*) n FROM messages')!.n,1); assert.ok(store.get<{n:number}>('SELECT count(*) n FROM client_events')!.n>0);
  const challenge=second.clientAPI.trust.challenge({device_id:e.device.device_id});second.clientAPI.trust.token({device_id:e.device.device_id,challenge_id:challenge.challenge_id,signature:sign(null,signingBytes(challenge),e.key.privateKey).toString('base64url')});
});

test('SSE reconnect replays durable notifications and revocation/expiry close authorization', async t => {
  const f=await httpFixture(t); const d=await f.pair();
  const connect=async(cursor?:string)=>{const abort=new AbortController();const r=await fetch(f.base+'/api/v1/events',{headers:{Authorization:`Bearer ${d.token}`,...(cursor?{'Last-Event-ID':cursor}:{})},signal:abort.signal});return {abort,r,reader:r.body!.getReader()};};
  const a=await connect();assert.equal(a.r.status,200);const ready=new TextDecoder().decode((await a.reader.read()).value);const cursor=JSON.parse(ready.split('data: ')[1]!.split('\n')[0]!).cursor as string;a.abort.abort();
  f.company.sendHumanMessage('missed during disconnect'); f.company.pause(true);
  const b=await connect(cursor); const replay=new TextDecoder().decode((await b.reader.read()).value);assert.match(replay,/message.created/);assert.match(replay,/id: hq_/);
  await f.admin('devices/revoke',{device_id:d.deviceId}); let end='';for(;;){const next=await b.reader.read();if(next.done)break;end+=new TextDecoder().decode(next.value);}assert.match(end,/authorization_expired/);
  assert.equal((await f.request('/overview',d.token)).status,401);
  const other=await f.pair();const exp=await fetch(f.base+'/api/v1/events',{headers:{Authorization:`Bearer ${other.token}`}});const reader=exp.body!.getReader();await reader.read();
  f.store.run("UPDATE client_tokens SET expires_at='2000-01-01T00:00:00.000Z'");f.company.pause(true);let expired='';for(;;){const next=await reader.read();if(next.done)break;expired+=new TextDecoder().decode(next.value);}assert.match(expired,/authorization_expired/);
});

test('pagination, event retention reset, adversarial bodies and rate/resource bounds', async t => {
  const f=await httpFixture(t);const d=await f.pair();for(let i=0;i<4;i++)f.company.sendHumanMessage(`message ${i}`);
  const first=await(await f.request('/messages?limit=2',d.token)).json() as {data:{items:{message_id:string}[];next_cursor:string}};
  f.company.sendHumanMessage('new after page');
  const second=await(await f.request('/messages?limit=2&cursor='+first.data.next_cursor,d.token)).json() as {data:{items:{message_id:string}[];next_cursor:string|null}};
  assert.equal(second.data.items.length,2);assert.equal(second.data.next_cursor,null);assert.equal(new Set([...first.data.items,...second.data.items].map(x=>x.message_id)).size,4);
  const old=`${f.http.clientAPI.trust.hq.hq_id}:0`;
  f.store.transaction(()=>{for(let i=0;i<10001;i++)f.store.run("INSERT INTO client_events(type,created_at) VALUES ('state.changed','2026-01-01')");});
  const events=await f.request('/events',d.token,undefined,undefined,{'Last-Event-ID':old});assert.equal(events.status,409);assert.equal((await events.json() as {error:{code:string}}).error.code,'reset_required');
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM client_events')!.n,LIMITS.events);
  for(const body of [null,[],{},'wrong',{body:1},{body:'x',actor:'human'},{body:'x',capabilities:SCOPES}])assert.equal((await f.request('/messages',d.token,body,keyId())).status,400);
  assert.equal((await f.request('/messages',d.token,{body:'x'.repeat(40000)},keyId())).status,413);
  assert.equal((await f.request('/messages',d.token,{body:'x'},keyId(),{'Content-Type':'text/plain'})).status,415);
  const stale=`${Date.now()-LIMITS.retryMs-1000}.${randomUUID()}`;assert.equal((await f.request('/messages',d.token,{body:'stale'},stale)).status,409);
  for(let i=0;i<LIMITS.challengesPerDevice-1;i++)assert.equal((await f.request('/auth/challenge',undefined,{device_id:d.deviceId})).status,200);
  assert.equal((await f.request('/auth/challenge',undefined,{device_id:d.deviceId})).status,429);
});

test('interrupt records exact durable intent once and retries do not repeat the runtime action',async t=>{
  const f=await httpFixture(t);const d=await f.pair();
  f.runtime.gate=async(_input,signal)=>{await new Promise<void>(r=>signal.addEventListener('abort',()=>r(),{once:true}));return {status:'interrupted',error:'Human requested interruption'};};
  f.company.assignObjective(objective);f.company.pause(false);f.dispatcher.start();await until(()=>f.dispatcher.activeCount===1);
  const execution=f.company.snapshot().executions.find(e=>e.status==='running')!;const key=keyId();
  const first=await f.request(`/executions/${execution.execution_id}/interrupt`,d.token,{},key);assert.equal(first.status,200);const accepted=await first.json();
  await until(()=>f.company.execution(execution.execution_id).status==='interrupted');
  assert.deepEqual(await(await f.request(`/executions/${execution.execution_id}/interrupt`,d.token,{},key)).json(),accepted);
  assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM audit_events WHERE type='interrupt_requested'")!.n,1);
});

test('Project objectives bind exact Project/repository IDs and cannot use prose to cross Projects',async t=>{
  const f=await httpFixture(t);const d=await f.pair();
  const {policy}=await import('./projects-helpers.js');
  const a=f.company.projects.create({name:'API Project A',description:'Scope test',instructions:'Use trusted recipes',policy});
  const b=f.company.projects.create({name:'API Project B',description:'Scope test',instructions:'Use trusted recipes',policy});
  const repo=f.company.projects.local(a.project_id,{name:'client-contract',default_branch:'trunk'});
  const wrong=await f.request(`/projects/${b.project_id}/repositories/${repo.repository_id}/objectives`,d.token,objective,keyId());assert.equal(wrong.status,409);
  assert.equal(f.company.snapshot().tasks.length,0);
  const key=keyId();const path=`/projects/${a.project_id}/repositories/${repo.repository_id}/objectives`;
  const first=await f.request(path,d.token,objective,key);assert.equal(first.status,201);const response=await first.json();
  assert.deepEqual(await(await f.request(path,d.token,objective,key)).json(),response);
  assert.equal(f.company.snapshot().tasks.length,1);assert.equal(f.store.get<{repository_id:string}>('SELECT repository_id FROM task_scopes')!.repository_id,repo.repository_id);
  const repositories=await(await f.request(`/projects/${a.project_id}/repositories`,d.token)).json() as {data:{items:{default_branch:string}[]}};assert.equal(repositories.data.items[0]!.default_branch,'trunk');
});

test('outstanding pairings, tokens, active devices and retained identities have finite ceilings',async t=>{
  const f=fixture();t.after(()=>f.close());let clock=Date.now();const trust=new RemoteClients(f.company,()=>clock);
  for(let i=0;i<LIMITS.pairings;i++)trust.createPairing({capabilities:['state:read']});
  assert.throws(()=>trust.createPairing({capabilities:['state:read']}),errorCode('pairing_limit'));
  clock+=LIMITS.pairingMs+1;trust.cleanup();
  const e=enroll(trust,['state:read']);
  for(let i=0;i<LIMITS.tokensPerDevice;i++){clock+=60_001;e.authenticate();}
  clock+=60_001;assert.throws(()=>e.authenticate(),errorCode('token_limit'));
  for(let i=1;i<LIMITS.devices;i++){clock+=60_001;enroll(trust,['state:read']);}
  assert.throws(()=>trust.createPairing({capabilities:['state:read']}),errorCode('device_limit'));
  for(const d of trust.adminState().devices)trust.revoke({device_id:d.device_id});
  for(let i=LIMITS.devices;i<LIMITS.retainedDevices;i++){
    clock+=60_001;const p=trust.createPairing({capabilities:['state:read']});const d=trust.claim(claimBody(p,keys()));trust.decide({device_id:d.device.device_id,decision:'deny'});
  }
  assert.throws(()=>trust.createPairing({capabilities:['state:read']}),errorCode('device_limit'));
  assert.throws(()=>f.store.run('DELETE FROM remote_devices'));
});

test('malformed cryptographic inputs, signatures, JSON, duplicate headers and unsupported locations fail safely',async t=>{
  const f=await httpFixture(t);const d=await f.pair();
  const malformed=[null,[],{}, {device_id:d.deviceId,unknown:true},{device_id:7},{device_id:'device_'+ 'a'.repeat(200)}];
  for(const body of malformed)assert.equal((await f.request('/auth/challenge',undefined,body)).status,400);
  for(const signature of ['', '*'.repeat(86),'a'.repeat(85),'a'.repeat(87),Buffer.alloc(64).toString('base64')])assert.equal((await f.request('/auth/token',undefined,{device_id:d.deviceId,challenge_id:d.proof.challenge_id,signature})).status,400);
  const c=await(await f.request('/auth/challenge',undefined,{device_id:d.deviceId})).json() as {data:Challenge};
  const wrongContext={...c.data,hq_id:'hq_'+randomUUID()};
  assert.equal((await f.request('/auth/token',undefined,{device_id:d.deviceId,challenge_id:c.data.challenge_id,signature:sign(null,signingBytes(wrongContext),d.key.privateKey).toString('base64url')})).status,401);
  const invalidJSON=await fetch(f.base+'/api/v1/messages',{method:'POST',headers:{Authorization:`Bearer ${d.token}`,'Idempotency-Key':keyId(),'Content-Type':'application/json'},body:'{"body":'});assert.equal(invalidJSON.status,400);assert.doesNotMatch(await invalidJSON.text(),/SyntaxError|JSON.parse|\/Users/);
  for(const key of ['invalid','a'.repeat(600),`${Date.now()+LIMITS.futureSkewMs+10000}.${randomUUID()}`])assert.ok([400,409].includes((await f.request('/messages',d.token,{body:'invalid key'},key)).status));
  const duplicated=await new Promise<number>(resolve=>{const r=nodeRequest(f.base+'/api/v1/overview',{headers:{Authorization:[`Bearer ${d.token}`,`Bearer ${d.token}`]}},response=>{response.resume();resolve(response.statusCode!);});r.end();});assert.equal(duplicated,400);
  assert.equal((await f.request('/overview',undefined,undefined,undefined,{Authorization:`bearer ${d.token}`})).status,401);
  assert.equal((await f.request('/messages',undefined,{body:'token in body',access_token:d.token},keyId())).status,401);
  const controller1=new AbortController(),controller2=new AbortController();
  const connect=(signal:AbortSignal)=>fetch(f.base+'/api/v1/events',{headers:{Authorization:`Bearer ${d.token}`},signal});
  await connect(controller1.signal);await connect(controller2.signal);assert.equal((await f.request('/events',d.token)).status,429);controller1.abort();controller2.abort();
});

test('research authority and private activity add no device capability, route, DTO field or event',async t=>{
  const f=await httpFixture(t);const device=await f.pair();const atlas=f.company.workers()[0]!;
  const before=f.store.get<{n:number}>('SELECT count(*) n FROM client_events')!.n;
  f.company.research.grant({worker_id:atlas.worker_id,preset:'public_research',expires_at:null,document_paths:[]});
  f.company.audit('research_reserved','system',{query:'PRIVATE_RESEARCH_SENTINEL'},atlas.worker_id,null,null);
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM client_events')!.n,before);
  for(const path of ['/research/grant','/research/revoke'])assert.equal((await f.request(path,device.token,{},keyId())).status,404);
  for(const path of [`/research/workers/${atlas.worker_id}`,'/research/operations/example'])assert.equal((await f.request(path,device.token)).status,404);
  for(const path of ['/overview','/workers','/capabilities']){
    const response=await f.request(path,device.token);assert.equal(response.status,200);assert.doesNotMatch(JSON.stringify(await response.json()),/standing_grants|research_operations|PRIVATE_RESEARCH_SENTINEL|public_research|company_knowledge/);
  }
});

test('paired device cannot inspect or control Computer Use through hidden IDs or local owner routes', async t => {
  const f=await httpFixture(t);const device=await f.pair();
  const created=await f.admin('computers/operator',{display_name:'Private browser operator'});assert.equal(created.status,201);const worker=await created.json() as {worker_id:string};
  const request={worker_id:worker.worker_id,...objective,policy:{origins:['https://example.com'],expiresAt:new Date(Date.now()+600000).toISOString()}};
  const response=await f.admin('computers/request',request);assert.equal(response.status,201);const session=await response.json() as {session_id:string;task_id:string;policy_hash:string};
  assert.equal((await f.admin('computers/authorize',{session_id:session.session_id,policy_hash:session.policy_hash,decision:'approve'})).status,200);
  f.company.pause(false);const claim=f.company.claimNext()!;assert.ok(claim);f.company.computers.prepare(claim.context);f.company.pause(true);
  f.company.callTool(claim.context,'computer-private-report','submit_artifact',{content:'OWNER_PRIVATE_BROWSER_SENTINEL',description:'Private computer report'});
  f.company.callTool(claim.context,'computer-private-message','message_worker',{recipient_worker_id:null,body:'OWNER_PRIVATE_BROWSER_SENTINEL'});
  for(const collection of ['/tasks','/executions','/artifacts','/messages']){
    const v=await f.request(collection,device.token);assert.equal(v.status,200);const text=await v.text();assert.ok(!text.includes(session.task_id)&&!text.includes(claim.execution.execution_id)&&!text.includes('OWNER_PRIVATE_BROWSER_SENTINEL'));
  }
  for(const resource of ['/tasks/'+session.task_id,'/executions/'+claim.execution.execution_id])assert.equal((await f.request(resource,device.token)).status,404);
  const interrupt=await f.request('/executions/'+claim.execution.execution_id+'/interrupt',device.token,{},keyId());assert.equal(interrupt.status,404);
  for(const path of ['computers','computers/'+session.session_id,'computer-evidence/computerevidence_00000000-0000-0000-0000-000000000000'])assert.equal((await fetch(f.base+'/api/'+path,{headers:{Authorization:'Bearer '+device.token}})).status,403);
  for(const path of ['/computers/authorize','/computers/decide','/computers/control'])assert.equal((await f.request(path,device.token,{},keyId())).status,404);
  assert.equal((await fetch(f.base+'/api/computers/operator',{method:'POST',headers:{'content-type':'application/json','x-botsquad-token':'forged'},body:'{"display_name":"Forged"}'})).status,403);
  assert.equal((await fetch(f.base+'/api/computers',{headers:{Origin:'https://untrusted.example'}})).status,403);
  assert.equal(f.company.execution(claim.execution.execution_id).status,'running');assert.equal(f.company.computers.session(session.session_id).actions,0);
  await f.company.computers.control({session_id:session.session_id,action:'revoke'});f.company.finish(claim.execution.execution_id,{status:'interrupted',settled:true,error:'HTTP boundary test ended'});
});
