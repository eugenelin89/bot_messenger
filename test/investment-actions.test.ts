import test from 'node:test';
import assert from 'node:assert/strict';
import { action, buyTwo, setup } from './fixtures/investment/support.js';
import { decimal } from '../src/domain/investment/arithmetic.js';

test('split preserves basis, adjusts quantity and cancels locked orders',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const pending=f.order('pending','BUY','1','2026-03-09','100');
  const a=action('ACME','split','split-two','2026-03-09T12:00:00.000Z',{numerator:'2',denominator:'1'});const j=f.call({type:'action',action:a});assert.equal(j.outcome.status,'accepted');
  assert.equal(f.state().portfolio.positions.ACME!.quantity,'4.000000');assert.equal(f.state().portfolio.positions.ACME!.basis,'200.000000');assert.equal(f.state().orders[pending.id]!.status,'cancelled');
  assert.deepEqual(f.call({type:'action',action:a},'retry-split'),j);assert.throws(()=>f.call({type:'action',action:{...a,numerator:'3'}},'bad-split'),/semantic_identity_conflict/);
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','50');const v=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(v.equity,'1000.000000');assert.equal(v.holdings[0]!.averageCost,'50.000000');
});
test('reverse split retains exact unresolved fractional shares and unknown valuation',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');f.call({type:'action',action:action('ACME','split','reverse','2026-03-09T12:00:00.000Z',{numerator:'1',denominator:'3'})});
  assert.equal(f.state().portfolio.positions.ACME!.quantity,'0.666666');assert.equal(f.state().portfolio.positions.ACME!.basis,'200.000000');
  assert.deepEqual(f.state().entitlements.find(e=>e.book==='portfolio')!.fraction,{numerator:'1',denominator:'1500000'});
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','300');const v=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(v.equity,null);assert.equal(v.unrealized,null);assert.equal(v.quality,'partial');assert.equal(f.state().portfolio.cash,'800.000000');
});
test('weighted-average partial/full sales release all split-created basis residue',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');f.call({type:'action',action:action('ACME','split','three-for-two',f.clock.now(),{numerator:'3',denominator:'2'})});
  // Post-split raw mark is required before order admission.
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','100');
  f.clock.set('2026-03-10T12:00:00.000Z');const first=f.order('one','SELL','1','2026-03-10','100');f.clock.set('2026-03-10T13:30:00.000Z');f.observe('ACME','2026-03-10','regular_open','100');const j=f.call({type:'fill',orderId:first.id});assert.equal(j.outcome.fills[0]!.releasedBasis,'66.666667');assert.equal(f.state().portfolio.positions.ACME!.basis,'133.333333');
  f.clock.set('2026-03-11T12:00:00.000Z');const rest=f.order('rest','SELL','2','2026-03-11','100');f.clock.set('2026-03-11T13:30:00.000Z');f.observe('ACME','2026-03-11','regular_open','100');f.call({type:'fill',orderId:rest.id});assert.equal(f.state().portfolio.positions.ACME!.basis,'0.000000');assert.equal(f.state().portfolio.realized,'100.000000');
});
test('cash dividend accrues at ex boundary and settles once without double-counting equity',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const a=action('ACME','dividend','dividend',f.clock.now(),{cashPerShare:'1.25',paymentAt:'2026-03-10T12:00:00.000Z'});
  const accrual=f.call({type:'action',action:a});assert.equal(f.state().portfolio.receivables,'2.500000');assert.equal(f.state().portfolio.income,'2.500000');assert.equal(f.state().portfolio.cash,'800.000000');assert.deepEqual(f.call({type:'action',action:a},'repeat-dividend'),accrual);
  assert.equal(f.call({type:'dividend_payment',actionId:a.id}).outcome.reason,'payment_not_due');f.clock.set('2026-03-10T12:00:00.000Z');f.call({type:'dividend_payment',actionId:a.id});f.call({type:'dividend_payment',actionId:a.id});
  assert.equal(f.state().portfolio.cash,'802.500000');assert.equal(f.state().portfolio.receivables,'0.000000');assert.equal(f.state().portfolio.income,'2.500000');
});
test('delayed dividend uses pre-ex holdings even after a complete sale',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const sell=f.order('exit','SELL','2','2026-03-09','100');f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ACME','2026-03-09','regular_open','100');f.call({type:'fill',orderId:sell.id});
  f.clock.set('2026-03-09T20:00:00.000Z');f.call({type:'action',action:action('ACME','dividend','delayed','2026-03-09T13:30:00.000Z',{availableAt:f.clock.now(),cashPerShare:'2',paymentAt:'2026-03-10T12:00:00Z'})});assert.equal(f.state().portfolio.receivables,'4.000000');assert.equal(f.state().entitlements.find(e=>e.book==='portfolio')!.quantity,'2.000000');
});
test('ticker changes keep stable identity and original snapshots; unsupported merger blocks valuation',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','100');const before=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;
  f.clock.set('2026-03-09T12:00:00.000Z');f.call({type:'action',action:action('ACME','ticker_change','rename',f.clock.now(),{newSymbol:'NEW'})});f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','100');const after=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(before.holdings[0]!.symbol,'ACME');assert.equal(after.holdings[0]!.symbol,'NEW');
  f.clock.set('2026-03-10T12:00:00.000Z');f.call({type:'action',action:action('ACME','unsupported','merger',f.clock.now())});assert.equal(f.order('blocked','BUY','1','2026-03-10','100').receipt.outcome.reason,'instrument_blocked');
  f.clock.set('2026-03-10T20:00:00.000Z');f.observe('ACME','2026-03-10','regular_close','100');const v=f.call({type:'value',session:'2026-03-10',asOf:f.clock.now()}).outcome.valuation!;assert.equal(v.equity,null);assert.equal(v.quality,'blocked');assert.equal(f.state().lastGood!.asOf,after.asOf);
});
test('out-of-order split is retained as an uncertainty fence without corrupting quantity',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const result=f.call({type:'action',action:action('ACME','split','late-split','2026-03-06T13:00:00Z',{numerator:'2',denominator:'1',availableAt:f.clock.now()})});assert.equal(result.outcome.status,'blocked');assert.equal(f.state().portfolio.positions.ACME!.quantity,'2.000000');assert.ok(f.state().blocked.ACME);
});
test('benchmark fractional units retain residual cash and match portfolio valuation sessions',t=>{
  const f=setup();t.after(f.close);f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()});buyTwo(f);f.observe('ETF','2026-03-06','regular_open','300');const j=f.call({type:'benchmark_open',session:'2026-03-06'});assert.equal(j.outcome.status,'accepted');assert.equal(f.state().benchmark.positions.ETF!.quantity,'3.333333');assert.equal(f.state().benchmark.cash,'0.000100');
  f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','110');f.observe('ETF','2026-03-06','regular_close','330');const v=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;
  assert.equal(v.equity,'1020.000000');assert.equal(v.benchmarkEquity,'1099.999990');assert.equal(v.benchmarkReturn,'0.100000');assert.equal(v.excessPercentagePoints,'-8.000000');
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','110');const gap=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(gap.benchmarkEquity,null);assert.equal(gap.excessPercentagePoints,null);
});
test('benchmark dividends settle as cash and reinvest only at next eligible opening',t=>{
  const f=setup();t.after(f.close);f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ETF','2026-03-06','regular_open','100');f.call({type:'benchmark_open',session:'2026-03-06'});
  f.clock.set('2026-03-09T12:00:00.000Z');const a=action('ETF','dividend','etf-dividend',f.clock.now(),{cashPerShare:'1',paymentAt:'2026-03-09T14:00:00.000Z'});f.call({type:'action',action:a});assert.equal(f.state().benchmark.receivables,'10.000000');
  f.clock.set('2026-03-09T14:00:00.000Z');f.call({type:'dividend_payment',actionId:a.id});assert.equal(f.state().benchmarkNextOpen,'2026-03-10');assert.equal(f.state().benchmark.cash,'10.000000');
  f.clock.set('2026-03-10T13:30:00.000Z');f.observe('ETF','2026-03-10','regular_open','100');f.call({type:'benchmark_open',session:'2026-03-10'});assert.equal(f.state().benchmark.positions.ETF!.quantity,'10.100000');assert.equal(f.state().benchmark.cash,'0.000000');
  assert.equal(f.state().benchmark.income,'10.000000');assert.equal(f.state().portfolio.cash,'1000.000000');
});
test('historical correction appends revisions and recomputes later return and drawdown',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','150');const first=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','100');const second=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(second.drawdown,'-0.090909');
  const correction={id:'old-close-correction',sourceVersion:2,correctionOf:'price-ACME-2026-03-06-regular_close',availableAt:f.clock.now()};f.observe('ACME','2026-03-06','regular_close','120',correction);f.call({type:'revise_valuations',correctionId:correction.id});
  const history=f.state().valuations;assert.equal(history.length,4);assert.deepEqual(history[0]!.snapshot,first);assert.deepEqual(history[1]!.snapshot,second);assert.equal(history[2]!.snapshot.equity,'1040.000000');assert.equal(history[3]!.snapshot.drawdown,'-0.038462');assert.equal(history[3]!.snapshot.dailyReturn,'-0.038462');assert.equal(f.state().lastGood!.sequence,second.sequence);assert.equal(f.state().lastGood!.revision,2);
  assert.equal(f.state().portfolio.positions.ACME!.basis,'200.000000');assert.equal(f.state().portfolio.cash,'800.000000');
});
test('missing marks retain last-good timestamp and never turn unknown into zero',t=>{
  const f=setup();t.after(f.close);const initial=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;assert.equal(initial.equity,'1000.000000');assert.equal(initial.totalReturn,'0.000000');buyTwo(f);
  f.clock.set('2026-03-06T21:00:00.000Z'); // A same-session opening cannot substitute for this scheduled closing mark.
  f.observe('ACME','2026-03-06','regular_close','100');f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()});
  f.clock.set('2026-03-09T20:00:00.000Z');const missing=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;assert.equal(missing.equity,null);assert.equal(missing.totalReturn,null);assert.equal(missing.quality,'partial');assert.equal(f.state().lastGood!.asOf,'2026-03-06T21:00:00.000Z');assert.ok(decimal(f.state().portfolio.cash)>=0n);
});
