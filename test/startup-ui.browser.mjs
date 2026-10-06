import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {mkdirSync,rmSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';

const viewports = [{width:1440,height:1100}, {width:390,height:844}];
const tabs = ['conversation','direct','computers','mandates','groups','organization','products','tasks','executions','approvals','infrastructure','devices','audit'];
const deferred = () => Promise.withResolvers();
async function setup(t, {viewport=viewports[0], realEvents=false, empty=false, expectedWrites=[]}={}) {
  const f=fixture();
  if(!empty) f.company.initializeCEO();
  // Trusted fixture setup only: no model dispatch or browser/business authority.
  f.company.pause(true);f.dispatcher.start();
  const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
  await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:process.env.BOTSQUAD_BROWSER_CHANNEL??'chrome',headless:true});
  const page=await browser.newPage({viewport});page.setDefaultTimeout(10000);
  const errors=[],mutations=[],gates=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET')mutations.push(`${r.method()} ${new URL(r.url()).pathname}`);});
  if(!realEvents)await page.addInitScript(()=>{
    window.hqEvents=[];
    window.EventSource=class extends EventTarget {
      constructor(){super();window.hqEvents.push(this);}
      emit(type){const e=new Event(type);this.dispatchEvent(e);if(type==='error')this.onerror?.(e);}
    };
  });
  const signal=type=>page.evaluate(type=>window.hqEvents[0].emit(type),type);
  const hold=async path=>{
    const entered=deferred(),release=deferred();gates.push(release);
    await page.route(`**/api/${path}`,async route=>{
      entered.resolve();await release.promise;
      // AbortController may already have cancelled this deliberately held request.
      if(!route.request().failure()&&!page.isClosed())await route.continue();
    },{times:1});
    return {entered:entered.promise,release:()=>release.resolve()};
  };
  t.after(async()=>{
    for(const gate of gates)gate.resolve();
    await page.close();await browser.close();await http.close();
    const counts={models:f.runtime.calls.length,executions:f.company.snapshot().executions.length,
      computers:f.store.get('SELECT count(*) n FROM computer_sessions').n,
      actions:f.store.get('SELECT count(*) n FROM external_actions').n};
    await f.close();rmSync(f.dir,{recursive:true,force:true});
    assert.deepEqual(errors,[],'unexpected pageerror');assert.deepEqual(mutations,expectedWrites,'no unintended writes');
    assert.deepEqual(counts,{models:0,executions:0,computers:0,actions:0});
  });
  const open=()=>page.goto(`http://127.0.0.1:${http.server.address().port}`,{waitUntil:'domcontentloaded'});
  const selected=async tab=>{
    assert.equal(await page.locator(`[data-tab=${tab}]`).evaluate(e=>e.classList.contains('selected')),true);
    assert.equal(await page.locator('[data-tab].selected').count(),1);
  };
  return {f,page,open,hold,signal,selected,errors,mutations};
}

for(const viewport of viewports)test(`historical undefined-state race: all early tabs preserve intent (${viewport.width}px)`,async t=>{
  const {page,open,hold,signal,selected,errors}=await setup(t,{viewport});
  const state=await hold('state');await open();await state.entered;
  // The old renderer throws on the first state.workers access here.
  for(const tab of tabs){
    await page.locator(`[data-tab=${tab}]`).click();
    assert.deepEqual(errors,[]);
    await selected(tab);
    assert.match(await page.locator('#view').textContent(),/Loading company state/);
    assert.equal(await page.locator('#pause').isDisabled(),true);
    assert.equal(await page.locator('#initialize').isDisabled(),true);
  }
  await page.locator('[data-tab=mandates]').click();
  if(process.env.BOTSQUAD_STARTUP_SCREENSHOTS){
    mkdirSync(process.env.BOTSQUAD_STARTUP_SCREENSHOTS,{recursive:true});
    await page.screenshot({path:join(process.env.BOTSQUAD_STARTUP_SCREENSHOTS,`loading-${viewport.width}.png`)});
  }
  // Finish the held boot before renewing the session. Cancellation before release
  // is exercised by the dedicated reconnect regression below.
  state.release();await page.locator('#new-mandate').waitFor();await selected('mandates');
  await signal('ready');await page.waitForFunction(()=>document.querySelector('#connection').textContent==='Connected to headquarters');
  await page.locator('#new-mandate').waitFor();await selected('mandates');
  assert.equal(await page.locator('#connection').textContent(),'Connected to headquarters');
});

for(const path of ['session','state'])for(const recovery of ['ready','retry'])test(`initial ${path} failure recovers through ${recovery}`,async t=>{
  const narrow=path==='state'&&recovery==='retry';
  const {page,open,signal,selected}=await setup(t,{viewport:narrow?viewports[1]:viewports[0]});
  await page.route(`**/api/${path}`,route=>route.fulfill({status:503,json:{error:'Controlled startup outage'}}),{times:1});
  await open();await page.locator('#load-status[role=alert]').waitFor();
  assert.match(await page.locator('#view').textContent(),/Company state unavailable/);
  assert.match(await page.locator('#load-message').textContent(),/Controlled startup outage/);
  if(narrow&&process.env.BOTSQUAD_STARTUP_SCREENSHOTS)await page.screenshot({path:join(process.env.BOTSQUAD_STARTUP_SCREENSHOTS,'error-390.png')});
  await page.locator('[data-tab=organization]').click();await selected('organization');
  if(recovery==='ready')await signal('ready');else await page.locator('#retry-load').click();
  await page.locator('.org-node').first().waitFor();await selected('organization');
  assert.equal(await page.locator('#load-status').isHidden(),true);
  assert.equal(await page.locator('#pause').isEnabled(),true);
  if(recovery==='ready')assert.equal(await page.evaluate(()=>window.hqEvents.length),1);
});

test('boot controls cannot send writes while session or state is unavailable',async t=>{
  const {page,open,hold,signal}=await setup(t,{empty:true});
  const session=await hold('session'),state=await hold('state');await open();await session.entered;
  const attempt=async()=>{
    assert.equal(await page.locator('#initialize').isDisabled(),true);
    assert.equal(await page.locator('#pause').isDisabled(),true);
    // Exercise handlers as well as native disabled behavior; the request gate must agree.
    await page.locator('#initialize').dispatchEvent('click');await page.locator('#pause').dispatchEvent('click');
    assert.equal(await page.locator('#compose').count(),0);
  };
  await attempt();session.release();await state.entered;await attempt();
  // Finish this boot-control check before exercising session renewal. The reconnect
  // case below separately requires cancellation and recovery before releasing its read.
  state.release();await page.locator('#compose').waitFor();
  await signal('ready');await page.getByText('Connected to headquarters',{exact:true}).waitFor();
  assert.equal(await page.locator('#initialize').isEnabled(),true);
  assert.match(await page.locator('#workers').textContent(),/Initialize Atlas/);
});

test('normal startup uses real SSE and loaded empty state is distinct from boot',async t=>{
  const {page,open,selected}=await setup(t,{realEvents:true,empty:true});
  await open();await page.getByText('Connected to headquarters',{exact:true}).waitFor();
  assert.equal(await page.locator('#initialize').isEnabled(),true);
  await page.locator('[data-tab=tasks]').click();await selected('tasks');
  assert.match(await page.locator('#view').textContent(),/No assignments yet/);
  assert.equal(await page.locator('#view').getAttribute('aria-busy'),'false');
});

test('reconnect retains state, tab and draft; a stale response cannot declare readiness',async t=>{
  const {page,open,hold,signal,selected,f}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.locator('#objective').fill('Retained owner draft');
  await page.locator('[data-tab=organization]').click();
  const old=await hold('state');await signal('changed');await old.entered;
  const cancelled=page.waitForEvent('requestfailed',r=>new URL(r.url()).pathname==='/api/state');
  await signal('error');await cancelled;await selected('organization');
  assert.match(await page.locator('#view').textContent(),/Atlas/);
  assert.equal(await page.locator('#pause').isDisabled(),true);
  assert.equal(await page.locator('#connection').textContent(),'Reconnecting to headquarters…');
  await page.locator('#pause').dispatchEvent('click');
  const renewed=await hold('session');await signal('ready');await renewed.entered;
  assert.equal(await page.locator('#pause').isDisabled(),true);
  // A trusted fixture change provides observable fresh data without UI mutation.
  f.store.run("UPDATE workers SET title='Freshly fetched CEO' WHERE role='ceo'");
  renewed.release();await page.getByText('Atlas — Freshly fetched CEO',{exact:true}).waitFor();await selected('organization');
  old.release(); // The obsolete request must not hold recovery hostage or overwrite it.
  await page.locator('[data-tab=conversation]').click();
  assert.equal(await page.locator('#objective').inputValue(),'Retained owner draft');
});

test('failed refresh retains prior state and disables writes until retry succeeds',async t=>{
  const {page,open,signal,selected}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.locator('[data-tab=organization]').click();
  await page.route('**/api/state',r=>r.fulfill({status:503,json:{error:'Controlled refetch outage'}}),{times:1});
  await signal('changed');await page.locator('#load-status[role=alert]').waitFor();
  assert.match(await page.locator('#view').textContent(),/Atlas/);await selected('organization');
  assert.equal(await page.locator('#pause').isDisabled(),true);
  await page.locator('#retry-load').click();await page.locator('#load-status').waitFor({state:'hidden'});
  assert.equal(await page.locator('#pause').isEnabled(),true);await selected('organization');
});

for(const [tab,path,marker] of [['direct','conversations','#conversation-worker'],['groups','groups','#new-group'],['mandates','mandates','#new-mandate'],['computers','computers','#computer-operator'],['devices','devices','#create-pairing']])test(`first ${tab} auxiliary load is explicit and recovers independently`,async t=>{
  const {page,open,hold,signal,selected}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  const auxiliary=await hold(path);await page.locator(`[data-tab=${tab}]`).click();await auxiliary.entered;
  assert.match(await page.locator('#view').textContent(),/Loading/);
  if(tab==='groups')assert.equal(await page.locator(marker).isDisabled(),true);
  else assert.equal(await page.locator(marker).count(),0);
  // Switch away while this view is still pending; no late response may change intent.
  await page.locator('[data-tab=tasks]').click();auxiliary.release();
  await page.locator('[data-tab=audit]').click();await selected('audit');
  await page.locator(`[data-tab=${tab}]`).click();await page.locator(marker).waitFor();await selected(tab);
});

test('auxiliary failure remains visible without converting company state to empty',async t=>{
  const {page,open,signal,selected}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.route('**/api/computers',r=>r.fulfill({status:503,json:{error:'Controlled section outage'}}),{times:1});
  await page.locator('[data-tab=computers]').click();await page.locator('#load-status[role=alert]').waitFor();
  assert.match(await page.locator('#view').textContent(),/Computer Sessions unavailable/);
  assert.match(await page.locator('#workers').textContent(),/Atlas/);
  await page.locator('#retry-load').click();await page.locator('#computer-operator').waitFor();
  assert.match(await page.locator('#view').textContent(),/No ComputerSessions/);await selected('computers');
});

test('changed events and rapid tab switches coalesce state requests',async t=>{
  const {page,open,hold,signal,selected}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  let stateRequests=0;page.on('request',r=>{if(new URL(r.url()).pathname==='/api/state')stateRequests++;});
  const state=await hold('state');await signal('changed');await state.entered;
  for(const tab of ['devices','direct','groups','computers','mandates']){
    await page.locator(`[data-tab=${tab}]`).click();await signal('changed');
  }
  assert.equal(stateRequests,1,'only one snapshot request may be in flight');
  state.release();await page.locator('#new-mandate').waitFor();await selected('mandates');
  // Wait on the second pass response, never a sleep or a larger acceptance delay.
  await page.waitForFunction(()=>document.querySelector('#view').getAttribute('aria-busy')==='false');
  assert.ok(stateRequests<=2,'at most one follow-up pass for the burst');
});

test('closed worker inspector cannot be reopened by late discovery',async t=>{
  const {page,open,hold,signal}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  const runtime=await hold('runtime');await page.locator('#workers [data-worker]').click();await runtime.entered;
  await page.locator('#close-inspect').click();
  const response=page.waitForResponse('**/api/runtime');runtime.release();await response;
  // Use another DOM interaction as a browser event-loop barrier.
  await page.locator('[data-tab=tasks]').click();
  assert.equal(await page.locator('#inspect').evaluate(d=>d.open),false);
});

test('inspector draft and submit recover after an intercepted write fails during disconnect',async t=>{
  const {page,open,signal}=await setup(t,{expectedWrites:['POST /api/worker-profile']});
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.locator('#workers [data-worker]').click();await page.locator('#ai-profile').waitFor();
  await page.locator('#ai-priority').selectOption('low');
  const entered=deferred(),release=deferred();
  // This test intentionally creates a browser request, but never transmits it to HQ.
  await page.route('**/api/worker-profile',async route=>{entered.resolve();await release.promise;await route.abort('connectionfailed');});
  t.after(()=>release.resolve());
  await page.locator('#ai-profile button').click();await entered.promise;
  await signal('error');release.resolve();
  await page.waitForFunction(()=>document.querySelector('#profile-error').textContent.length>0);
  assert.equal(await page.locator('#ai-profile button').isDisabled(),true);
  await page.locator('#ai-profile').dispatchEvent('submit'); // Forced stale form still cannot transmit.
  // A degraded rerender must not store a transient per-request disabled state.
  await signal('error');await signal('ready');
  await page.waitForFunction(()=>!document.querySelector('#ai-profile button').matches(':disabled'));
  assert.equal(await page.locator('#ai-priority').inputValue(),'low');
  assert.equal(await page.locator('#inspect').evaluate(d=>d.open),true);
});

test('late failed worker discovery cannot replace a newer inspector',async t=>{
  const {page,open,signal}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  const entered=deferred(),release=deferred();
  await page.route('**/api/runtime',async route=>{entered.resolve();await release.promise;await route.fulfill({status:503,json:{error:'Old inspector failure'}});},{times:1});
  t.after(()=>release.resolve());
  await page.locator('#workers [data-worker]').click();await entered.promise;
  await page.locator('#close-inspect').click();
  await page.locator('#workers [data-worker]').click();await page.locator('#ai-profile').waitFor();
  await page.locator('#ai-priority').selectOption('low');
  const response=page.waitForResponse(r=>r.url().endsWith('/api/runtime')&&r.status()===503);
  release.resolve();await response;
  await page.locator('#ai-lock').check();
  assert.equal(await page.locator('#ai-priority').inputValue(),'low');
  assert.equal(await page.locator('#inspect-content').getByText('Old inspector failure').count(),0);
});

test('late conversation index cannot overwrite a changed worker filter',async t=>{
  const {page,open,signal,f}=await setup(t);
  const worker=f.company.snapshot().workers[0];
  f.company.conversations.open({worker_id:worker.worker_id,purpose:'Current filtered conversation'});
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.locator('[data-tab=direct]').click();await page.locator('#conversation-worker').waitFor();
  const entered=deferred(),release=deferred();
  await page.route('**/api/conversations',async route=>{
    const response=await route.fetch();entered.resolve();await release.promise;
    const body=await response.json();body.items[0].purpose='STALE old filter index';
    await route.fulfill({json:body});
  },{times:1});t.after(()=>release.resolve());
  await signal('changed');await entered.promise;
  await page.locator('#conversation-worker').selectOption(worker.worker_id);
  assert.match(await page.locator('#view').textContent(),/Loading conversations/);
  release.resolve();await page.getByText('Current filtered conversation',{exact:true}).waitFor();
  assert.equal(await page.getByText('STALE old filter index',{exact:true}).count(),0);
  assert.equal(await page.locator('#conversation-worker').inputValue(),worker.worker_id);
});

test('stream interruption reports reconnecting even when a state request failed first',async t=>{
  const {page,open,signal,selected}=await setup(t);
  await open();await signal('ready');await page.locator('#compose').waitFor();
  await page.locator('[data-tab=organization]').click();
  await page.route('**/api/state',route=>route.abort('connectionfailed'),{times:1});
  await signal('changed');await page.locator('#load-status[role=alert]').waitFor();
  assert.equal(await page.locator('#connection').textContent(),'Could not refresh headquarters');
  await signal('error');
  assert.equal(await page.locator('#connection').textContent(),'Reconnecting to headquarters…');
  assert.equal(await page.locator('#pause').isDisabled(),true);
  assert.match(await page.locator('#view').textContent(),/Atlas/);await selected('organization');
  await signal('ready');await page.getByText('Connected to headquarters',{exact:true}).waitFor();
  assert.equal(await page.locator('#load-status').isHidden(),true);await selected('organization');
});
