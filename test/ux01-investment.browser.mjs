/** Scenario H: real disposable setup plus clearly authored READ DTOs, no live investment evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {finiteFixture} from '../dist/test/fixtures/finite-hq/support.js';
import {Dispatcher} from '../dist/src/control/dispatcher.js';
import {createHttpServer} from '../dist/src/http/server.js';
for(const width of [390,1440])test(`Investment distinguishes six record types with labelled authored evidence (${width}px)`,async t=>{
 const f=finiteFixture();f.clock.set('2026-10-12T21:00:00.000Z');const c=f.company,{start,...base}=f.input,{notice,...defaults}=c.observedInvestment.defaults();
 const input={...base,...defaults,runId:null,evidenceMode:'synthetic_fixture',mandate:'Synthetic UI fixture — investment record distinctions',sessions:['2026-10-13','2026-10-15','2026-10-19'],policy:{...f.policy,maxRun:16,maxCycle:6,maxDay:6,maxWorker:12},aiProfile:{...base.aiProfile,serviceTier:'default',cliVersion:'0.157.0'},retainUntil:'2030-12-31T23:59:59.000Z',collectionApproved:true,modelProcessingApproved:true,persistentRetentionApproved:true};
 const preview=c.observedInvestment.preview(input),result=c.observedInvestment.consent({previewId:preview.previewId,digest:preview.digest,receiptId:randomUUID()});
 const before=c.observedInvestment.history(result.runId).ledger.hash;
 const d=new Dispatcher(c,f.runtime),http=createHttpServer(c,d,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width,height:1000}}),errors=[],writes=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
 t.after(async()=>{await browser.close();await http.close();await d.stop();await f.close();assert.deepEqual(errors,[]);});
 await page.route('**/api/investment-run/observed',async route=>{
  const response=await route.fetch(),body=await response.json(),r=body.runs[0];
  r.decisions=[{fixture:'Research proposal only; never a formal decision'}];r.reviews=[{fixture:'Independent review only'}];
  r.ledger.decisions=Object.fromEntries(['approved','rejected','pending'].map((id,n)=>[id,{decisionId:id,revision:1,hash:id+'-exact',action:'HOLD',committedAt:'2026-10-12T20:00:00.000Z',rationale:'Authored fixture: '+id+' decision'}]));
  r.ledger.reviews={a:{decisionId:'approved',revision:1,proposalHash:'approved-exact',disposition:'approve'},b:{decisionId:'rejected',revision:1,proposalHash:'rejected-exact',disposition:'reject'},stale:{decisionId:'pending',revision:2,proposalHash:'wrong-hash',disposition:'approve'}};
  r.ledger.orders=Object.fromEntries(['filled','pending','cancelled'].map(status=>[status,{instrumentId:'FIXTURE',side:'BUY',quantity:'2',status,targetSession:'2026-10-13',reason:status==='cancelled'?'Authored fixture: owner cancelled':null}]));
  r.ledger.blocked={FIXTURE:'Authored fixture: required observation unavailable'};
  r.ledger.valuations=[{snapshot:{asOf:'2026-10-12T20:00:00.000Z',session:'2026-10-12',quality:'complete',equity:'100000.000000',reasons:[]}},{snapshot:{asOf:'2026-10-13T20:00:00.000Z',session:'2026-10-13',quality:'blocked',equity:null,reasons:['Authored fixture: missing closing observation']}}];
  await route.fulfill({json:body});
 });
 await page.route('**/api/investment-run',async route=>{const response=await route.fetch(),body=await response.json();body.loops[0].state='active';await route.fulfill({json:body});});
 await page.goto(`http://127.0.0.1:${http.server.address().port}/investment-run`);await page.getByRole('heading',{name:'Formal decisions',exact:true}).waitFor();await page.getByRole('heading',{name:'Research and discussion',exact:true}).waitFor();
 const outcomes=page.locator('.investment-outcomes');assert.match(await outcomes.innerText(),/HOLD.*Approved review recorded.*Authored fixture: approved/s);assert.match(await outcomes.innerText(),/Rejected review recorded/);assert.match(await outcomes.innerText(),/No matching review recorded/);assert.match(await outcomes.innerText(),/filled/);assert.match(await outcomes.innerText(),/pending/);assert.match(await outcomes.innerText(),/Paper orders.*FIXTURE.*cancelled.*owner cancelled/s);assert.match(await outcomes.innerText(),/Operations held.*required observation unavailable/s);assert.match(await outcomes.innerText(),/1 retained research proposals and 1 independent review records/);
 assert.match(await page.locator('#observed-investment').innerText(),/Last valuation: 2026-10-13T20:00:00.000Z · quality: blocked/);assert.match(await page.locator('#runs').innerText(),/Schedule state: active.*not an employee activity status/s);assert.match(await page.locator('#runs').innerText(),/Future schedule.*Next eligible session: 2026-10-13/s);assert.match(await page.locator('#runs').innerText(),/Research and discussion.*Formal committed decisions and paper orders are separate records/s);
 assert.match(await page.locator('#observed-investment').innerText(),/2026-10-12.*100000.000000.*complete/s);assert.equal(c.snapshot().executions.filter(e=>e.status==='running').length,0);assert.equal(c.observedInvestment.history(result.runId).ledger.hash,before);assert.equal(f.runtime.calls.length,0);assert.deepEqual(writes,[]);assert.equal(f.store.all('SELECT * FROM investment_finite_reservations').length,0);assert.equal(f.store.all('SELECT * FROM investment_public_channels').length,0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
