/** Disposable owner setup with a running scheduler; no provider or financial authority. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {Dispatcher} from '../src/control/dispatcher.js';
import {canonical} from '../src/domain/investment/identity.js';
import {FiniteJournal} from '../src/control/usage/finite-journal.js';
import type {ObservedInput} from '../src/control/investment-team/observed-investment.js';
import type {RuntimeAdapter} from '../src/runtime/adapter.js';
import {finiteFixture} from './fixtures/finite-hq/support.js';
import {processFixturePolicy} from './fixtures/investment-process.js';

test('process setup Save stays inert across due sessions and dispatcher restart without independent approval',async t=>{
 const f=finiteFixture(t),c=f.company;
 f.clock.set('2026-10-12T21:00:00.000Z');
 const custody=join(c.dataDir,'inert-custody'),authority=join(c.dataDir,'inert-authority');
 mkdirSync(custody,{mode:0o700});mkdirSync(authority,{mode:0o700});
 const checkpoint=join(custody,'checkpoint.json');
 const journal=FiniteJournal.createFixture(join(authority,'authority.sqlite'),checkpoint,f.clock.now());
 c.finiteHQ.attach(journal);
 let modelCalls=0,marketCalls=0,pageCalls=0;
 const deniedModel=async()=>{modelCalls++;throw Error('Inert setup must never call a model');};
 const deniedMarket=async()=>{marketCalls++;throw Error('Inert setup must never collect market data');};
 const runtime:RuntimeAdapter={type:'fake',supportsInterrupt:true,finiteHQPolicySupported:()=>true,run:deniedModel,runFiniteHQInvestment:deniedModel};
 c.observedInvestment.fixture={adapter:{kind:'yahoo-yfinance-v1',read:deniedMarket},transport:{kind:'authored_yahoo_fixture',exchange:deniedMarket}};
 c.observedInvestment.process.fixturePage=async()=>{pageCalls++;throw Error('Inert setup must never collect a primary page');};
 const ticks=t.mock.method(c.investmentLoop,'tick');
 let dispatcher=new Dispatcher(c,runtime);
 t.after(async()=>{await dispatcher.stop();journal.close();f.close();});
 const flush=async()=>{dispatcher.kick();await new Promise<void>(r=>setImmediate(r));await new Promise<void>(r=>setImmediate(r));};
 dispatcher.start();await flush();assert.equal(c.paused,false);
 const {start,...base}=f.input,{notice,...defaults}=c.observedInvestment.defaults();
 const input:ObservedInput={...base,...defaults,aiProfile:{...base.aiProfile,serviceTier:'default',cliVersion:'0.157.0'},runId:null,evidenceMode:'synthetic_fixture',sessions:['2026-10-13'],processPolicy:processFixturePolicy(),retainUntil:'2030-12-31T23:59:59.000Z',collectionApproved:true,modelProcessingApproved:true,persistentRetentionApproved:true};
 const protectedTables=['executions','ai_usage','investment_journal','investment_finite_reservations','investment_loop_executions','investment_team_executions','financial_requests','financial_attempts','financial_results','observed_financial_evidence','investment_process_evidence','investment_evidence_requests','investment_strategy_reviews','investment_public_channels','investment_public_grants','investment_public_jobs','investment_public_attempts'];
 const snapshot=(tables=protectedTables)=>Object.fromEntries(tables.map(name=>[name,f.store.all(`SELECT rowid,* FROM ${name} ORDER BY rowid`)]));
 // Save deliberately initializes a new paper book, but cannot grant runtime authority
 // or create any source/model/publication activity even synchronously.
 const activityTables=protectedTables.filter(name=>name!=='investment_journal');
 const beforeSave=snapshot(activityTables),custodyBefore=readFileSync(checkpoint,'utf8');
 const preview=c.observedInvestment.preview(input);
 assert.equal(f.store.all('SELECT * FROM observed_investment_runs').length,0);
 const receipt={previewId:preview.previewId,digest:preview.digest,receiptId:randomUUID()};
 const saved=c.observedInvestment.consent(receipt);
 assert.equal(canonical(c.observedInvestment.consent(receipt)),canonical(saved),'duplicate Save uses its original receipt');
 assert.equal(f.store.all('SELECT * FROM observed_investment_runs').length,1);
 assert.deepEqual(snapshot(activityTables),beforeSave);
 assert.equal(readFileSync(checkpoint,'utf8'),custodyBefore);
 assert.equal(saved.runtimeAuthority,'unapproved');
 assert.equal(c.finiteHQ.inspect(saved.scope.scopeId)?.approved,false);
 const startLoop=()=>c.investmentLoop.control({loopId:saved.loop.loopId,action:'start',digest:saved.loop.digest,receiptId:randomUUID(),orderId:null});
 assert.throws(startLoop,/authority|approval|approved/i);
 const baseline=snapshot();
 const occurrences=c.investmentLoop.occurrences(c.investmentLoop.get(saved.loop.loopId));
 const assertInert=()=>{
  assert.equal(c.paused,false,'an unrelated dispatcher failure must not explain inactivity');
  assert.equal(c.investmentLoop.get(saved.loop.loopId).state,'draft');
  assert.equal(c.discussions.group(saved.scope.envelope.groupId).state,'draft');
  assert.equal(c.finiteHQ.inspect(saved.scope.scopeId)?.approved,false);
  assert.deepEqual(snapshot(),baseline);
  assert.equal(readFileSync(checkpoint,'utf8'),custodyBefore);
  assert.deepEqual(c.investmentLoop.occurrences(c.investmentLoop.get(saved.loop.loopId)),occurrences);
  assert.deepEqual({modelCalls,marketCalls,pageCalls},{modelCalls:0,marketCalls:0,pageCalls:0});
 };
 for(const at of [...new Set(occurrences.map(o=>o.due_at))].sort()){
  const before=ticks.mock.callCount();f.clock.set(at);await flush();await flush();
  assert.ok(ticks.mock.callCount()>before,'the real dispatcher must tick at each due stage');
  assertInert();
 }
 await dispatcher.stop();dispatcher=new Dispatcher(c,runtime);dispatcher.start();await flush();assertInert();
 assert.throws(startLoop,/authority|approval|approved|expired/i);
});
