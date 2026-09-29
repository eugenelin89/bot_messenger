// Workstation-only real acceptance. Browser administration uses visible controls;
// native operations use the independent ClientV1 consumer over the SSH tunnel.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { APIError, ClientV1, generatePrivateKey, newRequestKey } from './client.js';

const [base, expectedSHA, outputPath, privatePath] = process.argv.slice(2);
if (!base || !expectedSHA || !/^[0-9a-f]{40}$/.test(expectedSHA) || !outputPath || !privatePath || new URL(base).hostname !== '127.0.0.1') throw new Error('Usage: acceptance.js LOOPBACK_URL EXPECTED_SHA NEW_OUTPUT_DIRECTORY PRIVATE_KEY_DIRECTORY');
mkdirSync(outputPath, {mode:0o700}); const output = realpathSync(outputPath);
const evidence: Record<string,unknown> = { started_at:new Date().toISOString(), feature_sha:expectedSHA, transport:'workstation HTTP through SSH to Ubuntu loopback:4311', status:'active', stage:'preflight' };
const save = () => writeFileSync(join(output,'evidence.json'),JSON.stringify(evidence,null,2)+'\n',{mode:0o600});
const stage = (name:string) => {evidence.stage=name;save();console.log(JSON.stringify({stage:name}));};
const delay = (ms:number) => new Promise<void>(resolve=>setTimeout(resolve,ms));
async function readLocal<T>(path:string):Promise<T>{const r=await fetch(base+'/api/'+path,{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);return await r.json() as T;}
interface State { paused:boolean; workers:{worker_id:string;role:string}[]; tasks:{task_id:string;status:string}[]; messages:{message_id:string}[]; executions:{execution_id:string;status:string}[] }
async function gate(name:string){
  stage(name+'_ready');const path=join(output,'continue-'+name);const deadline=Date.now()+60*60_000;
  while(!existsSync(path)){if(Date.now()>deadline)throw new Error('Operator checkpoint timed out');await delay(1000);}
  // Gate contains only an operator checkpoint, never a credential or client authority.
  assert.equal(readFileSync(path,'utf8').trim(),'continue');
}
async function eventually<T>(read:()=>Promise<T>,accept:(value:T)=>boolean,timeout=60_000):Promise<T>{
  const deadline=Date.now()+timeout;for(;;){const value=await read();if(accept(value))return value;if(Date.now()>deadline)throw new Error('Acceptance state timed out');await delay(250);}
}
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1500,height:1050},acceptDownloads:false,serviceWorkers:'block'});
await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
const page=await context.newPage();page.setDefaultTimeout(15000);
let client:ClientV1|undefined;
try {
  const health=await readLocal<{commit:string;runtime:string}>('health');assert.equal(health.commit,expectedSHA);
  const initial=await readLocal<State>('state');assert.equal(initial.workers.length,0,'Real acceptance requires a fresh validation company');assert.equal(initial.tasks.length,0);
  await page.goto(base);if(!initial.paused)await page.locator('#pause').click();await eventually(()=>readLocal<State>('state'),s=>s.paused);
  await page.locator('#initialize').click();await eventually(()=>readLocal<State>('state'),s=>s.workers.length===1);
  await page.locator('[data-tab=devices]').click();await page.locator('#create-pairing').waitFor();
  for(const checkbox of await page.locator('[data-device-scope]').all())await checkbox.check();
  const publicKey=generatePrivateKey(privatePath);client=new ClientV1(base,privatePath);
  const pairingStarted=performance.now();
  await page.locator('#create-pairing').click();const uri=await page.locator('#pairing-payload').inputValue();
  const pairingID=new URL(uri).searchParams.get('pairing_id');const claimed=await client.claim(uri,'Prompt 06 Ubuntu validation client');
  assert.equal(claimed.fingerprint,publicKey.fingerprint);
  evidence.pairing_claim_ms=Math.round(performance.now()-pairingStarted);
  await assert.rejects(client.authenticate(),e=>e instanceof APIError&&e.status===403);
  const payload=new URL(uri);const replay=await fetch(base+'/api/v1/pairings/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hq_id:claimed.hq_id,pairing_id:pairingID,pairing_secret:payload.searchParams.get('secret'),public_key:publicKey.public_key,display_name:'Replay',platform:'node',app_version:'1'})});assert.equal(replay.status,410);evidence.pairing_replay_denied=true;
  await page.locator('#dismiss-pairing').click();
  const card=page.locator(`[data-device="${claimed.device_id}"]`);await card.locator('[data-device-confirm]').waitFor();
  await card.locator('[data-device-confirm]').click();assert.ok((await page.locator('#inspect').textContent())!.includes(publicKey.fingerprint));
  await page.screenshot({path:join(output,'01-fingerprint-confirmation.png')});
  await page.locator('#confirm-device').click();await page.locator('#inspect').waitFor({state:'hidden'});
  const tokenStarted=performance.now();const session=await client.authenticate();evidence.token_round_trip_ms=Math.round(performance.now()-tokenStarted);evidence.identity={...client.publicIdentity,pairing_id:pairingID,owner_principal_id:'human',states:['open','pending','active']};evidence.initial_session_expires_at=session.expires_at;
  const capabilities=await client.get('/capabilities');evidence.capabilities=capabilities.data.capabilities;
  for(const path of ['/overview','/workers','/tasks','/projects'])await client.get(path);
  const before=await readLocal<State>('state');const messageKey=newRequestKey();
  const message=await client.post('/messages',{body:'Prompt 06 remote-client acceptance: communication only.'},messageKey);
  assert.deepEqual(await client.post('/messages',{body:'Prompt 06 remote-client acceptance: communication only.'},messageKey),message);
  const after=await readLocal<State>('state');assert.equal(after.messages.length,before.messages.length+1);assert.equal(after.tasks.length,before.tasks.length);
  evidence.message={key:messageKey,message_id:message.data.message_id,request_id:message.request_id,tasks_unchanged:true};
  const runtime=await client.get<{models:{model:string;reasoning_efforts:string[]}[];default_model:string}>('/runtime');
  const workers=await client.get<{items:{worker_id:string;configured_profile:Record<string,unknown>}[]}>('/workers');const atlas=workers.data.items[0]!;
  const model=runtime.data.models.find(m=>m.model==='gpt-6-sol')??runtime.data.models.find(m=>m.model===runtime.data.default_model)!;assert.ok(model);
  const profile={ai_model:model.model,reasoning_effort:model.reasoning_efforts.includes('low')?'low':model.reasoning_efforts[0],execution_priority:'high',ai_profile_locked:true};const profileKey=newRequestKey();
  const update=await client.post(`/workers/${atlas.worker_id}/profile`,{profile,expected_profile:atlas.configured_profile},profileKey);
  assert.deepEqual(await client.post(`/workers/${atlas.worker_id}/profile`,{profile,expected_profile:atlas.configured_profile},profileKey),update);
  evidence.profile={key:profileKey,worker_id:atlas.worker_id,profile,request_id:update.request_id};
  const objective={objective:'Prompt 06 protocol acceptance. Read the product vision and architecture documents yourself and summarize the distinction between messages, tasks and trusted authority in a short report. Do not hire or delegate to other workers. This bounded validation execution may be interrupted by the operator.',acceptance_criteria:'One concise report grounded in the two local documents; no external action or delegation.',constraints:'Use only existing read_document/submit_artifact and internal communication. No hiring, Project work, network, shell, infrastructure, approval or publication.'};
  const objectiveKey=newRequestKey();
  // Intentionally discard the mutation result. The independent read verifies the
  // committed domain effect; the original status/result is recovered only by retry.
  await client.post('/objectives',objective,objectiveKey);
  const queued=await readLocal<State>('state');assert.equal(queued.tasks.length,1);
  const taskID=queued.tasks[0]!.task_id;
  const overview=await client.get<{event_cursor:string}>('/overview');const disconnectCursor=overview.data.event_cursor;
  evidence.objective={key:objectiveKey,task_id:taskID,lost_response:true};evidence.disconnect_cursor=disconnectCursor;save();
  await gate('restart');
  const restarted=await client.get<{hq_id:string;paused:boolean}>('/overview',false);assert.equal(restarted.data.hq_id,claimed.hq_id);assert.equal(restarted.data.paused,true);
  const retry=await client.post('/objectives',objective,objectiveKey);assert.equal(retry.data.task_id,taskID);assert.equal((await readLocal<State>('state')).tasks.length,1);
  evidence.objective={key:objectiveKey,task_id:taskID,request_id:retry.request_id,lost_response:true,restart_retry_same_task:true};
  const renewed=await client.authenticate();evidence.restart={hq_id_unchanged:true,device_still_active:true,new_session_expires_at:renewed.expires_at};
  await client.post('/messages',{body:'State change while the event client was disconnected.'},newRequestKey());
  const abort=new AbortController();const stream=client.events(disconnectCursor,abort.signal);const eventIDs:string[]=[];
  for(let i=0;i<30;i++){const next=await stream.next();assert.equal(next.done,false);if(next.value.id)eventIDs.push(next.value.id);if(next.value.event==='message.created')break;}
  abort.abort();await stream.return(undefined).catch(()=>{});assert.ok(eventIDs.length>0);evidence.reconnect={from:disconnectCursor,replayed:eventIDs};
  const resumeKey=newRequestKey();const resume=await client.post('/dispatch',{paused:false,expected_paused:true},resumeKey);assert.deepEqual(await client.post('/dispatch',{paused:false,expected_paused:true},resumeKey),resume);
  const execution=await eventually(()=>client!.get<{items:{execution_id:string;status:string}[]}>('/executions'),r=>r.data.items.some(e=>e.status==='running'),60_000);
  const active=execution.data.items.find(e=>e.status==='running')!;await delay(1200);
  const interruptKey=newRequestKey();const interrupted=await client.post(`/executions/${active.execution_id}/interrupt`,{},interruptKey);
  assert.deepEqual(await client.post(`/executions/${active.execution_id}/interrupt`,{},interruptKey),interrupted);
  await eventually(()=>client!.get<{status:string}>(`/executions/${active.execution_id}`),r=>r.data.status!=='running');
  const pauseKey=newRequestKey();const paused=await client.post('/dispatch',{paused:true,expected_paused:false},pauseKey);assert.deepEqual(await client.post('/dispatch',{paused:true,expected_paused:false},pauseKey),paused);
  evidence.dispatch={resume_key:resumeKey,pause_key:pauseKey,final_paused:true};evidence.interrupt={key:interruptKey,execution_id:active.execution_id,request_id:interrupted.request_id};
  // A separately confirmed conservative device proves capability denial on Ubuntu.
  for(const checkbox of await page.locator('[data-device-scope]').all())await checkbox.uncheck();
  await page.locator('[data-device-scope="state:read"]').check();
  const readPath=privatePath+'-readonly';generatePrivateKey(readPath);const readClient=new ClientV1(base,readPath);
  await page.locator('#create-pairing').click();const readIdentity=await readClient.claim(await page.locator('#pairing-payload').inputValue(),'Prompt 06 read-only denial probe');await page.locator('#dismiss-pairing').click();
  await page.locator(`[data-device-confirm="${readIdentity.device_id}"]`).click();await page.locator('#confirm-device').click();await page.locator('#inspect').waitFor({state:'hidden'});
  await readClient.get('/overview');
  for(const [path,body] of [['/objectives',objective],['/messages',{body:'Must be denied'}],['/dispatch',{paused:false,expected_paused:true}],[`/workers/${atlas.worker_id}/profile`,{profile,expected_profile:profile}],[`/executions/${active.execution_id}/interrupt`,{}]] as const)
    await assert.rejects(readClient.post(path,body,newRequestKey()),e=>e instanceof APIError&&e.status===403&&e.code==='capability_denied');
  await page.locator(`[data-device-revoke="${readIdentity.device_id}"]`).click();await assert.rejects(readClient.get('/overview'),e=>e instanceof APIError&&e.status===401);
  for(const file of ['device.pem','identity.json'])unlinkSync(join(readPath,file));rmdirSync(readPath);
  evidence.capability_denial={device_id:readIdentity.device_id,scopes:['state:read'],mutations_denied:5,revoked:true,private_key_deleted:true};
  const expiryAbort=new AbortController();const expiringEvents=client.events(undefined,expiryAbort.signal);await expiringEvents.next();
  const expiryClosed=(async()=>{for await(const event of expiringEvents)if(event.event==='authorization_expired')return true;return false;})();
  // Retain a real token in memory until its actual ten-minute lifetime has elapsed.
  // All other work can proceed while this process waits; there is no model polling.
  stage('waiting_for_real_token_expiry');
  while(Date.now()<=Date.parse(renewed.expires_at)+1500)await delay(Math.min(1000,Math.max(1,Date.parse(renewed.expires_at)+1501-Date.now())));
  await assert.rejects(client.get('/overview',false),e=>e instanceof APIError&&e.status===401);assert.equal(await expiryClosed,true);expiryAbort.abort();evidence.real_token_expiry_denied=true;evidence.real_stream_expiry_closed=true;
  await gate('reboot');
  await assert.rejects(client.get('/overview',false),e=>e instanceof APIError&&e.status===401);
  const afterReboot=await client.authenticate();assert.equal(afterReboot.hq_id,claimed.hq_id);assert.equal(afterReboot.device_id,claimed.device_id);
  const sameTask=await client.post('/objectives',objective,objectiveKey);assert.equal(sameTask.data.task_id,taskID);
  const finalOverview=await client.get<{paused:boolean;event_cursor:string}>('/overview');assert.equal(finalOverview.data.paused,true);
  const rebootAbort=new AbortController();const rebootEvents=client.events(disconnectCursor,rebootAbort.signal);const rebootReady=await rebootEvents.next();assert.equal(rebootReady.value?.event,'ready');rebootAbort.abort();await rebootEvents.return(undefined).catch(()=>{});
  evidence.reboot={hq_id_unchanged:true,device_unchanged:true,old_expired_token_denied:true,fresh_authentication:true,idempotency_preserved:true,event_cursor:finalOverview.data.event_cursor,reconnect_preserved:true};
  await page.reload();await page.locator('[data-tab=devices]').click();await page.locator(`[data-device-revoke="${claimed.device_id}"]`).waitFor();
  const revokeAbort=new AbortController();const live=client.events(undefined,revokeAbort.signal);await live.next();
  await page.locator(`[data-device-revoke="${claimed.device_id}"]`).click();let closed=false;
  for(let i=0;i<20;i++){const next=await live.next();if(next.done)break;if(next.value.event==='authorization_expired'){closed=true;break;}}
  revokeAbort.abort();await live.return(undefined).catch(()=>{});assert.equal(closed,true);
  await assert.rejects(client.get('/overview',false),e=>e instanceof APIError&&e.status===401);await assert.rejects(client.post('/messages',{body:'Revoked device must not mutate'},newRequestKey()),e=>e instanceof APIError&&e.status===401);await assert.rejects(client.authenticate(),e=>e instanceof APIError&&e.status===403);
  await eventually(()=>readLocal<{devices:{device_id:string;state:string}[]}>('devices'),s=>s.devices.some(d=>d.device_id===claimed.device_id&&d.state==='revoked'));
  await page.screenshot({path:join(output,'02-revoked-device.png')});evidence.revocation={state:'revoked',existing_token_denied:true,mutation_denied:true,new_authentication_denied:true,stream_closed:true};
  const state=await readLocal<State>('state');assert.equal(state.paused,true);assert.equal(state.executions.filter(e=>e.status==='running').length,0);
  for(const file of ['device.pem','identity.json'])unlinkSync(join(privatePath,file));rmdirSync(privatePath);evidence.private_key_deleted=true;
  evidence.status='passed';evidence.completed_at=new Date().toISOString();stage('complete');
} catch(error) {
  evidence.status='failed';evidence.failure=error instanceof APIError?{status:error.status,code:error.code,request_id:error.requestId}:{name:error instanceof Error?error.name:'UnknownError'};save();
  // Preserve failed validation evidence/key for inspection, but try to reduce device authority through the UI.
  if(client?.publicIdentity)try{await page.reload();await page.locator('[data-tab=devices]').click();await page.locator(`[data-device-revoke="${client.publicIdentity.device_id}"]`).click({timeout:3000});}catch{}
  console.error(JSON.stringify({acceptance:'failed',stage:evidence.stage,failure:evidence.failure}));process.exitCode=1;
} finally {await context.close();await browser.close();}
