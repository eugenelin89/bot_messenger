import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {rmSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture,objective} from '../dist/test/helpers.js';
import {task,computer,device,group,mandate,infrastructure,publication} from '../dist/test/attention-helpers.js';
import {setup as business} from '../dist/test/business-helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';
const wide={width:1440,height:1100},narrow={width:390,height:844};
async function setup(t,{viewport=wide,seed=()=>{},realEvents=false,expectedWrites=[],given}={}) {
 const f=given??fixture();await seed(f);f.company.pause(true);
 const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BOTSQUAD_BROWSER_CHANNEL??'chrome',headless:true}),page=await browser.newPage({viewport});page.setDefaultTimeout(10000);
 const errors=[],writes=[],releases=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(`${r.method()} ${new URL(r.url()).pathname}`);});
 if(!realEvents)await page.addInitScript(()=>{window.hqEvents=[];window.EventSource=class extends EventTarget{constructor(){super();window.hqEvents.push(this);}emit(type){this.dispatchEvent(new Event(type));if(type==='error')this.onerror?.(new Event(type));}};});
 const signal=type=>page.evaluate(type=>window.hqEvents[0].emit(type),type);
 const hold=async path=>{const entered=Promise.withResolvers(),release=Promise.withResolvers();releases.push(release);await page.route(`**/api/${path}`,async r=>{const response=await r.fetch();entered.resolve();await release.promise;if(!r.request().failure()&&!page.isClosed())await r.fulfill({response});},{times:1});return {entered:entered.promise,release:()=>release.resolve()};};
 const counts=()=>['executions','computer_sessions','external_actions','business_attempts'].map(name=>f.store.get(`SELECT count(*) n FROM ${name}`).n);const before=counts();
 t.after(async()=>{for(const r of releases)r.resolve();await page.close();await browser.close();await http.close();assert.deepEqual(counts(),before,'navigation creates no work');assert.equal(f.runtime.calls.length,0);await f.close();rmSync(f.dir,{recursive:true,force:true});assert.deepEqual(errors,[]);assert.deepEqual(writes,expectedWrites);});
 const open=()=>page.goto(`http://127.0.0.1:${http.server.address().port}`,{waitUntil:'domcontentloaded'});
 const attention=async()=>{await page.locator('[data-tab=attention]').click();};
 const loaded=async count=>{await page.waitForFunction(n=>document.querySelector('#attention-count').textContent===String(n),count);};
 return {f,page,open,attention,loaded,hold,signal};
}
for(const viewport of [wide,narrow])test(`Attention during held company and attention boot loads (${viewport.width}px)`,async t=>{
 const {page,open,attention,loaded,hold}=await setup(t,{viewport});const company=await hold('state'),read=await hold('attention');await open();await company.entered;await attention();assert.match(await page.locator('#view').textContent(),/Loading owner attention/);assert.equal(await page.locator('#attention-count').textContent(),'…');
 company.release();await read.entered;assert.match(await page.locator('#view').textContent(),/Loading owner attention/);assert.equal(await page.locator('#attention-count').textContent(),'…');read.release();await loaded(0);await page.getByText('Nothing needs your attention right now.',{exact:true}).waitFor();
 if(process.env.BOTSQUAD_ATTENTION_SCREENSHOTS){mkdirSync(process.env.BOTSQUAD_ATTENTION_SCREENSHOTS,{recursive:true});await page.screenshot({path:join(process.env.BOTSQUAD_ATTENTION_SCREENSHOTS,`empty-${viewport.width}.png`)});}
});
test('real SSE startup resolves verified zero',async t=>{const {page,open,attention,loaded}=await setup(t,{realEvents:true});await open();await attention();await loaded(0);await page.getByText('Connected to headquarters',{exact:true}).waitFor();await page.getByText('Nothing needs your attention right now.',{exact:true}).waitFor();});
for(const viewport of [wide,narrow])test(`mixed categories, stable order and exact Task navigation (${viewport.width}px)`,async t=>{
 let target;const {page,open,attention,loaded}=await setup(t,{viewport,seed:f=>{target=task(f);task(f,'failed');f.company.initializeNix();device(f);const s=computer(f);f.store.run("UPDATE computer_sessions SET state='unknown' WHERE session_id=?",s.session_id);}});
 await open();await loaded(5);await attention();const titles=await page.locator('.attention-item h3').allTextContents();assert.deepEqual(titles,['Computer outcome uncertain','Infrastructure approval required','Task needs inspection','Task failed','Device identity needs confirmation']);assert.match(await page.locator('.attention-categories').textContent(),/1 Uncertain outcomes1 Approvals1 Blocked work1 Failed work1 Device identities/);
 await page.locator(`[data-attention="task:${target.task_id}"]`).click();await page.locator('#inspect[open]').waitFor();assert.match(await page.locator('#inspect-content').textContent(),new RegExp(target.task_id));assert.equal(await page.locator('[data-tab=tasks]').getAttribute('aria-current'),'page');await page.locator('#close-inspect').click();await attention();await page.locator('.attention-item').first().waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(process.env.BOTSQUAD_ATTENTION_SCREENSHOTS)await page.screenshot({path:join(process.env.BOTSQUAD_ATTENTION_SCREENSHOTS,`mixed-${viewport.width}.png`),fullPage:true});
});
test('exact infrastructure approval navigation, owner denial and Attention source resolution',async t=>{
 const {page,open,attention,loaded}=await setup(t,{seed:f=>f.company.initializeNix(),expectedWrites:['POST /api/approvals/decide']});await open();await loaded(1);await attention();await page.getByRole('button',{name:'Review exact approval',exact:true}).click();assert.equal(await page.locator('[data-tab=approvals]').getAttribute('aria-current'),'page');assert.equal(await page.locator('[data-attention-source]').evaluate(e=>e===document.activeElement),true);await page.locator('[data-decision=deny]').click();await loaded(0);await attention();await page.getByText('Nothing needs your attention right now.',{exact:true}).waitFor();
});
test('historical failed execution under completed Task stays out of browser Attention',async t=>{
 const {page,open,attention,loaded}=await setup(t,{seed:f=>{const a=f.company.assignObjective(objective),r=f.company.claimNext();f.company.finish(r.execution.execution_id,{status:'failed',settled:true,error:'Retained failure'});f.company.retry(a.task_id,true);const retry=f.company.claimNext();f.company.finish(retry.execution.execution_id,{status:'completed',settled:true,summary:'Recovered'});}});await open();await attention();await loaded(0);assert.equal(await page.locator('.attention-item').count(),0);
});
test('auxiliary Attention error preserves company state and recovers without false zero',async t=>{
 const {page,open,attention,loaded,hold}=await setup(t,{seed:f=>task(f)});const boot=await hold('state');let failing=true;await page.route('**/api/attention',r=>failing?r.fulfill({status:503,json:{error:'Fixture outage'}}):r.continue());await open();await boot.entered;await attention();boot.release();await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='?');await page.locator('#load-status[role=alert]').waitFor();assert.match(await page.locator('#view').textContent(),/Owner attention unavailable/);assert.match(await page.locator('#workers').textContent(),/Atlas/);failing=false;await page.locator('#retry-load').click();await loaded(1);await page.locator('.attention-item').waitFor();
});
test('reconnect retains last Attention, aborts stale read and preserves final navigation',async t=>{
 const {f,page,open,attention,loaded,hold,signal}=await setup(t,{seed:f=>task(f)});await open();await loaded(1);await attention();await page.locator('.attention-item').waitFor();const old=await hold('attention');await signal('changed');await old.entered;const cancelled=page.waitForEvent('requestfailed',r=>new URL(r.url()).pathname==='/api/attention');await signal('error');await cancelled;assert.equal(await page.locator('#attention-count').textContent(),'1*');assert.equal(await page.locator('.attention-item').count(),1);assert.match(await page.locator('#view').textContent(),/last loaded attention/);const id=f.store.get("SELECT task_id FROM tasks WHERE status='blocked'").task_id;f.company.cancel(id);await signal('ready');await loaded(0);old.release();await page.locator('[data-tab=tasks]').click();await attention();await page.locator('[data-tab=mandates]').click();await page.locator('#new-mandate').waitFor();assert.equal(await page.locator('[data-tab=mandates]').getAttribute('aria-current'),'page');
});
test('Computer, group, mandate, publication and device items select existing source surfaces',async t=>{
 let s,g,m,d,p;const {page,open,attention,loaded}=await setup(t,{seed:f=>{s=computer(f);g=group(f);m=mandate(f);d=device(f);p=publication(f);f.store.run("UPDATE working_groups SET state='blocked' WHERE group_id=?",g.group_id);f.store.run("UPDATE mandates SET status='blocked' WHERE mandate_id=?",m.mandate_id);}});await open();await loaded(5);await attention();
 await page.getByRole('button',{name:'Review Computer approval'}).click();await page.locator(`[data-computer-detail="${s.session_id}"]`).waitFor();await attention();
 await page.getByRole('button',{name:'Inspect working group'}).click();await page.locator(`[data-selected-group="${g.group_id}"]`).waitFor();assert.equal(await page.locator('[data-tab=groups]').getAttribute('aria-current'),'page');await attention();
 await page.getByRole('button',{name:'Inspect mandate',exact:true}).click();await page.locator(`[data-mandate-detail="${m.mandate_id}"]`).waitFor();await attention();
 await page.getByRole('button',{name:'Review exact publication'}).click();assert.equal(await page.locator(`[data-attention-source="${p.approval}"]`).evaluate(e=>e===document.activeElement),true);await attention();
 await page.getByRole('button',{name:'Review device identity'}).click();await page.locator(`[data-device="${d.d.device_id}"]`).waitFor();assert.equal(await page.locator(`[data-device="${d.d.device_id}"]`).evaluate(e=>e===document.activeElement),true);
});
test('business item opens exact existing action inspector, late load cannot steal navigation',async t=>{
 const f=await business(),a=f.propose();f.wait(a);const {page,open,attention,loaded,hold}=await setup(t,{given:f});await open();await loaded(1);await attention();const wait=await hold(`mandates/${f.m.mandate_id}`);await page.getByRole('button',{name:'Review exact action'}).click();await wait.entered;await page.locator('[data-tab=tasks]').click();wait.release();await page.locator('[data-tab=attention]').click();await page.getByRole('button',{name:'Review exact action'}).click();await page.getByText('Review exact external action',{exact:true}).waitFor();assert.match(await page.locator('#inspect-content').textContent(),new RegExp(a.mandate_id));
});


test('cached zero remains unverified after reconnect until the Attention read succeeds',async t=>{
 const {page,open,attention,loaded,hold,signal}=await setup(t);await open();await loaded(0);await attention();await signal('error');assert.equal(await page.locator('#attention-count').textContent(),'0*');
 const read=await hold('attention');await signal('ready');await read.entered;assert.equal(await page.locator('#attention-count').textContent(),'0*');assert.match(await page.locator('#view').textContent(),/current count is unverified/);read.release();await loaded(0);
});
