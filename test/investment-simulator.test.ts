import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureClock, FixtureSimulator } from '../src/control/investment.js';
import { Store } from '../src/persistence/store.js';
import { hash } from '../src/domain/investment/identity.js';
import { buyTwo, configuration, observationFor, setup } from './fixtures/investment/support.js';
import type { Observation, Proposal } from '../src/domain/investment/types.js';

test('reference accounting: BUY, mark, partial SELL, full SELL, exact restart and disabled outbox',t=>{
  const f=setup();t.after(f.close);
  assert.equal(buyTwo(f).outcome.status,'filled');assert.equal(f.state().portfolio.cash,'800.000000');
  f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','110');
  const v=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;
  assert.equal(v.equity,'1020.000000');assert.equal(v.unrealized,'20.000000');assert.equal(v.totalReturn,'0.020000');assert.equal(v.benchmarkEquity,null);
  f.clock.set('2026-03-09T12:00:00.000Z');const sell=f.order('sell-one','SELL','1','2026-03-09','110');assert.equal(sell.receipt.outcome.status,'pending');
  f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ACME','2026-03-09','regular_open','110');const fill=f.call({type:'fill',orderId:sell.id});assert.equal(fill.outcome.status,'filled');
  assert.equal(f.state().portfolio.cash,'910.000000');assert.equal(f.state().portfolio.realized,'10.000000');assert.equal(f.state().portfolio.positions.ACME!.basis,'100.000000');
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','110');
  const v2=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(v2.unrealized,'10.000000');assert.equal(v2.equity,'1020.000000');assert.equal(v2.dailyReturn,'0.000000');
  f.clock.set('2026-03-10T12:00:00.000Z');const exit=f.order('sell-rest','SELL','1','2026-03-10','110');f.clock.set('2026-03-10T13:30:00.000Z');f.observe('ACME','2026-03-10','regular_open','110');f.call({type:'fill',orderId:exit.id});
  assert.equal(f.state().portfolio.cash,'1020.000000');assert.deepEqual(f.state().portfolio.positions.ACME,{quantity:'0.000000',basis:'0.000000',reserved:'0.000000'});
  assert.equal(f.state().portfolio.realized,'20.000000');
  const restoredStore=new Store(f.path);try{const restored=new FixtureSimulator(restoredStore,f.clock,'fixture-owner');assert.deepEqual(restored.inspect(f.config.runId),f.state());assert.equal(restored.outbox(f.config.runId).length,restored.journal(f.config.runId).length);}finally{restoredStore.close();}
});
test('BUY and SELL charge fees once and embed adverse slippage once',t=>{
  const f=setup({commission:'1',slippageBps:10});t.after(f.close);const o=f.order('buy','BUY','2','2026-03-06','101');
  assert.equal(f.state().portfolio.reservedCash,'203.000000');f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ACME','2026-03-06','regular_open','100');const buy=f.call({type:'fill',orderId:o.id});
  assert.equal(buy.outcome.fills[0]!.price,'100.100000');assert.equal(f.state().portfolio.cash,'798.800000');assert.equal(f.state().portfolio.positions.ACME!.basis,'201.200000');
  f.clock.set('2026-03-09T12:00:00.000Z');const s=f.order('sell','SELL','1','2026-03-09','99');f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ACME','2026-03-09','regular_open','110');const sell=f.call({type:'fill',orderId:s.id});
  assert.equal(sell.outcome.fills[0]!.price,'109.890000');assert.equal(f.state().portfolio.cash,'907.690000');assert.equal(f.state().portfolio.realized,'8.290000');assert.equal(f.state().portfolio.fees,'2.000000');
});
test('semantic order identity converges across random request IDs; conflicts are explicit',t=>{
  const f=setup();t.after(f.close);const o=f.order('semantic','BUY','2','2026-03-06','100');const command=o.receipt.command;
  assert.deepEqual(f.call(command,'different-request'),o.receipt);assert.equal(Object.keys(f.state().orders).length,1);assert.equal(f.state().portfolio.reservedCash,'200.000000');
  assert.throws(()=>f.call({...command,type:'submit',decisionId:'semantic',revision:1,orderIndex:0,expectedVersion:'999',reviewId:'review-semantic'},'conflict'),/semantic_identity_conflict/);
  assert.throws(()=>f.call({type:'control',state:'paused'},'different-request'),/request_identity_conflict/);
});
test('competing buys reserve guarded cash and sells cannot fund unfilled buys',t=>{
  const f=setup();t.after(f.close);assert.equal(f.order('buy-eight','BUY','8','2026-03-06','100').receipt.outcome.status,'pending');
  assert.equal(f.order('buy-three','BUY','3','2026-03-06','100').receipt.outcome.reason,'insufficient_cash');assert.equal(f.state().portfolio.reservedCash,'800.000000');
  assert.equal(f.order('oversell','SELL','1','2026-03-06','100').receipt.outcome.reason,'insufficient_shares');
});
test('competing sells reserve shares and terminal cancellation releases exactly once',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const sell=f.order('sell-two','SELL','2','2026-03-09','100');
  assert.equal(f.order('sell-extra','SELL','1','2026-03-09','100').receipt.outcome.reason,'insufficient_shares');
  f.call({type:'cancel',orderId:sell.id});f.call({type:'cancel',orderId:sell.id});assert.equal(f.state().portfolio.positions.ACME!.reserved,'0.000000');
  assert.equal(f.call({type:'fill',orderId:sell.id}).outcome.status,'cancelled');
});
test('HOLD records an attributable decision and creates no order or financial effect',t=>{
  const f=setup();t.after(f.close);const p:Proposal={decisionId:'hold',revision:1,author:'author',action:'HOLD',evidenceCutoff:f.clock.now(),evidence:[],rationale:'Missing fixture evidence',orders:[]};
  assert.equal(f.call({type:'decision',proposal:p}).outcome.status,'hold');assert.equal(f.state().ledgerVersion,'1');assert.deepEqual(f.state().orders,{});
});
test('missing review, wrong revision and self-review fail closed with retained rejection',t=>{
  const f=setup();t.after(f.close);const p:Proposal={decisionId:'unreviewed',revision:1,author:'author',action:'BUY',evidenceCutoff:f.clock.now(),evidence:[],rationale:'Synthetic',orders:[{instrumentId:'ACME',side:'BUY',quantity:'1',priceGuard:'100',targetSession:'2026-03-06'}]};
  f.call({type:'decision',proposal:p});const invalid=f.call({type:'review',review:{id:'self',decisionId:p.decisionId,revision:1,proposalHash:hash(p),reviewer:'author',reviewedAt:f.clock.now(),disposition:'approve'}});assert.equal(invalid.outcome.reason,'independent_reviewer_required');
  assert.equal(f.call({type:'submit',decisionId:p.decisionId,revision:1,orderIndex:0,expectedVersion:'1',reviewId:'missing'}).outcome.reason,'review_required');
  assert.equal(f.call({type:'submit',decisionId:p.decisionId,revision:2,orderIndex:0,expectedVersion:'1',reviewId:'missing'}).outcome.reason,'missing_decision');assert.equal(f.state().portfolio.reservedCash,'0.000000');
});
test('late commitment cannot use earlier open, even with backdated evidence',t=>{
  const f=setup();t.after(f.close);const o=f.order('timely','BUY','1','2026-03-06','100');
  f.clock.set('2026-03-06T14:00:00.000Z');const p={...o.proposal,decisionId:'late'};assert.equal(f.call({type:'decision',proposal:p}).outcome.reason,'ineligible_target_session');
  const bad={...o.proposal,decisionId:'future-evidence',evidenceCutoff:'2026-03-09T12:00:00Z'};assert.equal(f.call({type:'decision',proposal:bad}).outcome.reason,'invalid_evidence_cutoff');
});
test('gap beyond guard rejects all quantity and releases cash; missing opening expires',t=>{
  const f=setup();t.after(f.close);const guarded=f.order('guard','BUY','1','2026-03-06','100'),missing=f.order('missing','BUY','1','2026-03-06','100','BETA');
  f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ACME','2026-03-06','regular_open','101');assert.equal(f.call({type:'fill',orderId:guarded.id}).outcome.reason,'price_guard');assert.equal(f.call({type:'fill',orderId:missing.id}).outcome.status,'data_blocked');
  f.clock.set('2026-03-07T14:30:00.000Z');assert.equal(f.call({type:'fill',orderId:missing.id}).outcome.status,'expired');assert.equal(f.state().portfolio.reservedCash,'0.000000');assert.equal(f.state().portfolio.cash,'1000.000000');
});
test('late data records original market time and actual processing time',t=>{
  const f=setup();t.after(f.close);const o=f.order('delayed','BUY','1','2026-03-06','100');f.clock.set('2026-03-06T20:00:00.000Z');
  f.observe('ACME','2026-03-06','regular_open','100',{availableAt:'2026-03-06T19:59:00.000Z'});const fill=f.call({type:'fill',orderId:o.id});assert.equal(fill.outcome.status,'filled');assert.equal(fill.effectiveAt,'2026-03-06T14:30:00.000Z');assert.equal(fill.recordedAt,'2026-03-06T20:00:00.000Z');
});
for(const [name,patch] of Object.entries({adjusted:{adjustment:'adjusted'},wrongFeed:{feed:'other'},wrongCurrency:{currency:'CAD'},article:{field:'article_quote'},future:{retrievedAt:'2026-03-09T20:00:00Z'},wrongTime:{marketAt:'2026-03-06T14:31:00Z'}})) test(`observation rejects ${name}`,t=>{
  const f=setup();t.after(f.close);f.clock.set('2026-03-06T14:30:00.000Z');const o=observationFor(f.config,'ACME','2026-03-06','regular_open','100',patch as Partial<Observation>);assert.equal(f.call({type:'observe',observation:o}).outcome.status,'rejected');assert.equal(f.state().observations.length,0);
});
test('halted opening, close and corrected opening never substitute for a verified original open',t=>{
  const f=setup();t.after(f.close);const o=f.order('halt','BUY','1','2026-03-06','100');f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ACME','2026-03-06','regular_open','100',{quality:'halted'});assert.equal(f.call({type:'fill',orderId:o.id}).outcome.status,'data_blocked');
  f.observe('ACME','2026-03-06','regular_open','99',{id:'corrected',sourceVersion:2,correctionOf:'price-ACME-2026-03-06-regular_open'});assert.equal(f.call({type:'fill',orderId:o.id}).outcome.status,'data_blocked');
});
test('position/sector ceilings include pending buys; unknown sectors fail closed',t=>{
  const f=setup({positionLimitBps:1500,sectorLimitBps:3000});t.after(f.close);assert.equal(f.order('one','BUY','1','2026-03-06','100').receipt.outcome.status,'pending');assert.match(f.order('two','BUY','1','2026-03-06','100').receipt.outcome.reason!,/position_limit/);
  const c=configuration();c.instruments[0]!.sector=null;const unknown=setup(c);t.after(unknown.close);assert.equal(unknown.order('unknown','BUY','1','2026-03-06','100').receipt.outcome.reason,'unknown_sector');
});
test('risk is rechecked with contemporaneous marks at execution',t=>{
  const f=setup({positionLimitBps:3000});t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const buy=f.order('other','BUY','1','2026-03-09','100','BETA');assert.equal(buy.receipt.outcome.status,'pending');
  f.clock.set('2026-03-09T13:30:00.000Z');f.observe('BETA','2026-03-09','regular_open','100');assert.equal(f.call({type:'fill',orderId:buy.id}).outcome.reason,'risk_marks_unavailable');assert.equal(f.state().portfolio.cash,'800.000000');
});
test('owner pause cancels pending orders; ended run cannot resume; budget is finite',t=>{
  const c=configuration();c.authorization.maxOrders=1;const f=setup(c);t.after(f.close);const o=f.order('first','BUY','1','2026-03-06','100');assert.equal(f.order('second','BUY','1','2026-03-06','100').receipt.outcome.reason,'operation_budget_exhausted');
  f.call({type:'control',state:'paused'});assert.equal(f.state().orders[o.id]!.status,'cancelled');assert.equal(f.state().portfolio.reservedCash,'0.000000');f.call({type:'control',state:'ended'});assert.equal(f.call({type:'control',state:'active'}).outcome.reason,'run_ended');
});
test('configuration is frozen, mutations and foreign operators are rejected',t=>{
  const f=setup();t.after(f.close);assert.throws(()=>f.sim.create({...f.config,initialCapital:'2000'}),/frozen_configuration_conflict/);
  assert.throws(()=>f.store.run("UPDATE investment_runs SET configuration='{}'"),/frozen/);assert.throws(()=>new FixtureSimulator(f.store,new FixtureClock(f.clock.now()),'other').inspect(f.config.runId),/fixture_operator_required/);
});
