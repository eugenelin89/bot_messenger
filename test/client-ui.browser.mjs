// Actual browser pairing controls; test client uses HTTP only. No private key enters browser/server.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {mkdtempSync,realpathSync,statSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';
import {fixture} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';
import {ClientV1,generatePrivateKey,newRequestKey} from '../dist/scripts/client-v1/client.js';

test('real Devices UI creates, fingerprints, confirms, denies and revokes an independent reference client',async t=>{
  const f=fixture();f.company.initializeCEO();f.company.pause(true);
  const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${http.server.address().port}`;
  const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext();
  const dir=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-client-key-')));
  t.after(async()=>{await context.close();await browser.close();await http.close();await f.close();for(const file of ['device.pem','identity.json'])try{unlinkSync(join(dir,file));}catch{}rmdirSync(dir);});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('[data-tab=devices]').click();
  await page.locator('#create-pairing').waitFor();assert.equal(await page.locator('[data-device-scope="state:read"]').isChecked(),true);
  assert.equal(await page.locator('[data-device-scope="objectives:create"]').isChecked(),false);
  await page.locator('[data-device-scope="messages:send"]').check();
  const publicKey=generatePrivateKey(dir);assert.equal(statSync(join(dir,'device.pem')).mode&0o777,0o600);
  await page.locator('#create-pairing').click();const uri=await page.locator('#pairing-payload').inputValue();
  const client=new ClientV1(base,dir);const claim=await client.claim(uri);assert.equal(claim.fingerprint,publicKey.fingerprint);
  await page.locator('#dismiss-pairing').click();
  const card=page.locator(`[data-device="${claim.device_id}"]`);await card.waitFor();assert.match(await card.textContent(),new RegExp(publicKey.fingerprint.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  await assert.rejects(client.get('/overview'),e=>e.status===403);
  await card.locator('[data-device-confirm]').click();await page.locator('#confirm-device').click();await page.locator('#inspect').waitFor({state:'hidden'});
  const overview=await client.get('/overview');assert.equal(overview.data.paused,true);
  const before=f.company.snapshot().tasks.length;const key=newRequestKey();const message=await client.post('/messages',{body:'Reference client browser acceptance'},key);
  assert.deepEqual(await client.post('/messages',{body:'Reference client browser acceptance'},key),message);assert.equal(f.company.snapshot().tasks.length,before);
  await assert.rejects(client.post('/objectives',{objective:'No authority',acceptance_criteria:'Denied',constraints:'None'},newRequestKey()),e=>e.status===403);
  await card.locator('[data-device-revoke]').click();await page.waitForFunction(id=>document.querySelector(`[data-device="${id}"] .status`)?.textContent==='revoked',claim.device_id);
  await assert.rejects(client.get('/overview'),e=>e.status===401);await assert.rejects(client.authenticate(),e=>e.status===403);
  // Denial uses a second genuinely generated key and the same visible pairing path.
  const denyDir=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-client-denied-')));generatePrivateKey(denyDir);
  try{
    await page.locator('#create-pairing').click();const deniedClient=new ClientV1(base,denyDir);const pending=await deniedClient.claim(await page.locator('#pairing-payload').inputValue(),'Denied client');await page.locator('#dismiss-pairing').click();
    await page.locator(`[data-device-deny="${pending.device_id}"]`).click();await page.waitForFunction(id=>document.querySelector(`[data-device="${id}"] .status`)?.textContent==='denied',pending.device_id);
    await assert.rejects(deniedClient.authenticate(),e=>e.status===403);
  }finally{for(const file of ['device.pem','identity.json'])try{unlinkSync(join(denyDir,file));}catch{}rmdirSync(denyDir);}
  assert.deepEqual(errors,[]);
});
