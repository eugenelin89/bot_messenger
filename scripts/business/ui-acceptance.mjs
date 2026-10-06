// Explicit operator fixture: real local UI/backend, SIMULATED provider, no real effect.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {setup} from '../../dist/test/business-helpers.js';
import {createHttpServer} from '../../dist/src/http/server.js';
const dir=resolve('.validation/prompt11/ui');mkdirSync(dir,{recursive:true,mode:0o700});
const f=await setup(),a=f.propose();f.wait(a);
const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
const address=http.server.address();assert.ok(address&&typeof address!=='string');
const browser=await chromium.launch({headless:true,...(process.env.BOT_UI_CHROME?{executablePath:process.env.BOT_UI_CHROME}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(`http://127.0.0.1:${address.port}`);await page.locator('[data-tab="mandates"]').click();await page.locator(`[data-mandate="${f.m.mandate_id}"]`).click();
  await page.locator(`[data-business-inspect="${a.action_id}"]`).click();await page.locator('#business-reviewed').waitFor();
  assert.equal(await page.locator('#business-approve').isDisabled(),true);assert.match(await page.locator('#inspect').innerText(),/SIMULATED|fixture/i);
  assert.ok((await page.locator('#inspect').innerText()).includes(a.intent_hash));assert.ok((await page.locator('#inspect').innerText()).includes(a.expected_blob));
  await page.screenshot({path:join(dir,'exact-action-desktop.png'),fullPage:true});
  await page.setViewportSize({width:420,height:900});await page.screenshot({path:join(dir,'exact-action-mobile.png'),fullPage:true});
  await page.locator('#business-reviewed').check();await page.locator('#business-approve').click();
  assert.equal(f.company.business.action(a.action_id).status,'approved');assert.equal(f.adapter.puts,0);
  f.company.business.progress();const deadline=Date.now()+4000;while(f.company.business.action(a.action_id).status!=='succeeded'&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
  assert.equal(f.adapter.puts,1);assert.equal(f.company.business.action(a.action_id).status,'succeeded');
  await page.reload();await page.locator('[data-tab="mandates"]').click();await page.locator(`[data-mandate="${f.m.mandate_id}"]`).click();await page.locator(`[data-business-inspect="${a.action_id}"]`).click();
  await page.locator('#business-compensate').waitFor();assert.match(await page.locator('#inspect').innerText(),/fixture-only/);
  await page.locator('#business-compensate').click();assert.equal(f.store.get("SELECT count(*) n FROM business_controls WHERE operation='request_compensation'").n,1);assert.equal(f.adapter.puts,1);
  assert.deepEqual(errors,[]);writeFileSync(join(dir,'result.json'),JSON.stringify({mode:'simulated_fixture',real_browser:true,exact_review:true,approval_hash_bound:true,one_fixture_effect:true,passive_compensation_request:true,viewports:[1440,420],page_errors:errors},null,2));
  console.log(JSON.stringify({passed:true,evidence:dir,mode:'simulated_fixture'}));
}finally{await browser.close();await http.close();await f.close();}
