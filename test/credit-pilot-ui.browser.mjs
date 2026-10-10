import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {pilotFixture} from '../dist/test/fixtures/credit-pilot.js';
import {Dispatcher} from '../dist/src/control/dispatcher.js';
import {createHttpServer} from '../dist/src/http/server.js';
for(const width of [390,1440])test(`private credit pilot counters and retained usage (${width}px)`,async t=>{
 const f=pilotFixture(),c=f.claim();f.complete(c);const dispatcher=new Dispatcher(f.company,f.adapter),http=createHttpServer(f.company,dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${http.server.address().port}`;
 const browser=await chromium.launch({channel:process.env.BOTSQUAD_BROWSER_CHANNEL??'chrome',headless:true}),page=await browser.newPage({viewport:{width,height:1000}}),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
 t.after(async()=>{await browser.close();await http.close();await dispatcher.stop();f.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);});
 await page.goto(origin+'/investment-team');await page.getByText('Private credit-approved pilot',{exact:true}).waitFor();assert.match(await page.locator('body').innerText(),/Pilot: 1 of 4 turns · held/);assert.match(await page.locator('body').innerText(),/Deadline 5 minutes locally/);assert.match(await page.locator('.ai-usage').innerText(),/Estimate unavailable/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const summary=page.getByText('Pricing methodology and incomplete executions',{exact:true});await summary.focus();await page.keyboard.press('Enter');assert.equal(await summary.evaluate(e=>e.parentElement.open),true);
 f.company.pause(true);await page.reload();await page.getByText('Private credit-approved pilot',{exact:true}).waitFor();assert.match(await page.locator('body').innerText(),/Pilot: 1 of 4 turns · stopped/);assert.equal(f.company.creditPilot.count(),1);assert.equal(f.store.all('SELECT * FROM investment_loops').length,0);assert.equal(f.store.all('SELECT * FROM investment_public_attempts').length,0);
 mkdirSync('/private/tmp/botsquad-credit-browser',{recursive:true});await page.screenshot({path:`/private/tmp/botsquad-credit-browser/team-${width}.png`,fullPage:true});
});
