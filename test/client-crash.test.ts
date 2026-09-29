import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { join } from 'node:path';
import { once } from 'node:events';
import { fixture } from './helpers.js';
import { Store } from '../src/persistence/store.js';
import { RemoteClients } from '../src/control/remote-clients.js';
import { signingBytes } from '../src/client/protocol.js';

// Fault injection exists only in this spawned test process, never an HTTP switch.
const serverSource = `
import {Store} from './dist/src/persistence/store.js';
import {Company} from './dist/src/control/company.js';
import {Dispatcher} from './dist/src/control/dispatcher.js';
import {createHttpServer} from './dist/src/http/server.js';
import {FakeRuntime} from './dist/test/helpers.js';
import {join} from 'node:path';
const [directory,mode]=process.argv.slice(1);
const store=new Store(join(directory,'company.sqlite'));
const company=new Company(store,directory,process.cwd(),'fake');
const dispatcher=new Dispatcher(company,new FakeRuntime());
const http=createHttpServer(company,dispatcher,join(process.cwd(),'public'));
const originalRun=store.run.bind(store), originalTransaction=store.transaction.bind(store);
if(mode==='before')store.run=(sql,...args)=>{if(sql.startsWith('INSERT INTO client_receipts'))process.exit(23);return originalRun(sql,...args);};
if(mode==='after')store.transaction=fn=>{const result=originalTransaction(fn);if(store.get('SELECT 1 FROM client_receipts LIMIT 1'))process.exit(23);return result;};
http.server.listen(0,'127.0.0.1',()=>console.log(http.server.address().port));
process.on('SIGTERM',async()=>{await http.close();store.close();});
`;
async function launch(directory: string, mode: string) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', serverSource, directory, mode], { cwd: process.cwd(), stdio: ['ignore','pipe','ignore'] });
  const exit = once(child,'exit');
  const data = await Promise.race([once(child.stdout!, 'data'), exit.then(()=>{throw new Error('Test child exited before listening');})]);
  const port = Number(String(data[0]).trim()); assert.ok(port > 0);
  return { child, exit, url: `http://127.0.0.1:${port}/api/v1/messages` };
}
for (const mode of ['before','after']) test(`real process crash ${mode} receipt commit recovers without duplicate mutation`, async t => {
  const f=fixture(); f.company.initializeCEO(); f.company.pause(true); const trust=new RemoteClients(f.company);
  const key=generateKeyPairSync('ed25519');const p=trust.createPairing({capabilities:['state:read','messages:send']});
  const claim=trust.claim({pairing_id:p.pairing_id,pairing_secret:p.pairing_secret,hq_id:p.hq_id,public_key:key.publicKey.export({format:'jwk'}),display_name:'Crash test',platform:'test',app_version:'1'});
  trust.decide({device_id:claim.device.device_id,decision:'confirm'});const c=trust.challenge({device_id:claim.device.device_id});
  const token=trust.token({device_id:claim.device.device_id,challenge_id:c.challenge_id,signature:sign(null,signingBytes(c),key.privateKey).toString('base64url')});
  await f.close();
  const id=`${Date.now()}.${randomUUID()}`;const options={method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({body:'Crash-safe message'})};
  const crash=await launch(f.dir,mode);t.after(()=>crash.child.kill());
  await assert.rejects(fetch(crash.url,options));assert.equal((await crash.exit)[0],23);
  const inspect=new Store(join(f.dir,'company.sqlite'));
  assert.equal(inspect.get<{n:number}>('SELECT count(*) n FROM messages')!.n,mode==='before'?0:1);
  assert.equal(inspect.get<{n:number}>('SELECT count(*) n FROM client_receipts')!.n,mode==='before'?0:1);inspect.close();
  const recovered=await launch(f.dir,'normal');t.after(async()=>{recovered.child.kill();await recovered.exit;});
  const response=await fetch(recovered.url,options);assert.equal(response.status,201);const original=await response.json();
  assert.deepEqual(await(await fetch(recovered.url,options)).json(),original);
  const final=new Store(join(f.dir,'company.sqlite'));t.after(()=>final.close());
  assert.equal(final.get<{n:number}>('SELECT count(*) n FROM messages')!.n,1);assert.equal(final.get<{n:number}>('SELECT count(*) n FROM client_receipts')!.n,1);
  assert.equal(final.get<{n:number}>("SELECT count(*) n FROM audit_events WHERE type='remote_mutation_accepted'")!.n,1);
});
