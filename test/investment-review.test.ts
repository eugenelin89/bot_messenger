import test from 'node:test';
import assert from 'node:assert/strict';
import { action, buyTwo, setup, configuration, observationFor } from './fixtures/investment/support.js';
import { mark } from '../src/domain/investment/policy.js';
import { latestValuations } from '../src/domain/investment/valuation.js';
import { hash } from '../src/domain/investment/identity.js';

test('late dividend appends ex-date and payment revisions without moving later cash into earlier books',t=>{
  const f=setup();t.after(f.close);buyTwo(f);
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','99');
  const original=f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()}).outcome.valuation!;
  assert.equal(original.equity,'998.000000');
  f.clock.set('2026-03-10T20:00:00.000Z');f.observe('ACME','2026-03-10','regular_close','99');f.call({type:'value',session:'2026-03-10',asOf:f.clock.now()});
  f.call({type:'action',action:action('ACME','dividend','late-dividend','2026-03-09T13:30:00.000Z',{cashPerShare:'1',paymentAt:'2026-03-10T12:00:00.000Z'})});
  assert.equal(latestValuations(f.state())[0]!.snapshot.receivables,'2.000000');
  f.call({type:'dividend_payment',actionId:'late-dividend'});
  const v=latestValuations(f.state()).map(v=>v.snapshot);
  assert.equal(v[0]!.cash,'800.000000');assert.equal(v[0]!.receivables,'2.000000');assert.equal(v[0]!.equity,'1000.000000');
  assert.equal(v[1]!.cash,'802.000000');assert.equal(v[1]!.receivables,'0.000000');assert.equal(v[1]!.dailyReturn,'0.000000');
  assert.equal(v[1]!.ledgerVersion,f.state().ledgerVersion);assert.equal(v[1]!.ledgerHash,hash(f.state().accountingHistory));
  assert.equal(v[0]!.ledgerHash,hash(f.state().accountingHistory.slice(0,Number(v[0]!.ledgerVersion))));
  assert.deepEqual(f.state().valuations[0]!.snapshot,original);
});
test('global corporate-action IDs cannot mix distinct dividend entitlements',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');
  const a=action('ACME','dividend','shared',f.clock.now(),{cashPerShare:'1',paymentAt:'2026-03-10T12:00:00.000Z'});f.call({type:'action',action:a});
  assert.equal(f.call({type:'action',action:{...a,instrumentId:'BETA',providerActionId:'other',paymentAt:f.clock.now()}}).outcome.reason,'action_id_conflict');
  assert.equal(f.call({type:'dividend_payment',actionId:'shared'}).outcome.reason,'payment_not_due');assert.equal(f.state().portfolio.cash,'800.000000');
});
test('unverified correction supersedes original mark, and close never substitutes open',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-06T21:00:00.000Z');
  assert.equal(f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!.equity,null);
  f.observe('ACME','2026-03-06','regular_close','100');
  f.observe('ACME','2026-03-06','regular_close','110',{id:'correction',quality:'unverified',sourceVersion:2,correctionOf:'price-ACME-2026-03-06-regular_close'});
  assert.equal(f.call({type:'revise_valuations',correctionId:'correction'}).outcome.valuation!.equity,null);
});
test('decision evidence must resolve trusted original source times',t=>{
  const f=setup();t.after(f.close);
  const result=f.call({type:'decision',proposal:{decisionId:'fabricated',revision:1,author:'author',action:'HOLD',evidenceCutoff:f.clock.now(),evidence:[{id:'invented',availableAt:f.clock.now()}],rationale:'Synthetic',orders:[]}});
  assert.equal(result.outcome.reason,'missing_evidence_reference');assert.equal(Object.keys(f.state().decisions).length,0);
});
test('new historical snapshot fails closed when current inventory has later fills',t=>{
  const f=setup();t.after(f.close);buyTwo(f);
  assert.equal(f.call({type:'value',session:'2026-03-06',asOf:f.config.startsAt}).outcome.reason,'historical_book_unavailable');
});
test('deterministic invalid sale economics terminates order and releases shares',t=>{
  const f=setup({commission:'5'});t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');const o=f.order('fee-sale','SELL','1','2026-03-09','1');
  f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ACME','2026-03-09','regular_open','1');
  assert.equal(f.call({type:'fill',orderId:o.id}).outcome.status,'rejected');assert.equal(f.state().portfolio.positions.ACME!.reserved,'0.000000');assert.equal(f.state().portfolio.positions.ACME!.quantity,'2.000000');
});
test('delayed benchmark fill cannot cross a known later corporate action',t=>{
  const f=setup();t.after(f.close);f.clock.set('2026-03-06T15:00:00.000Z');
  f.call({type:'action',action:action('ETF','split','benchmark-split',f.clock.now(),{numerator:'2',denominator:'1'})});
  f.observe('ETF','2026-03-06','regular_open','100');
  assert.equal(f.call({type:'benchmark_open',session:'2026-03-06'}).outcome.reason,'out_of_order_benchmark_fill');assert.equal(f.state().benchmark.cash,'1000.000000');
});
test('late benchmark payment retains actual payment next-open eligibility',t=>{
  const f=setup();t.after(f.close);f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ETF','2026-03-06','regular_open','100');f.call({type:'benchmark_open',session:'2026-03-06'});
  f.clock.set('2026-03-09T20:00:00.000Z');f.call({type:'action',action:action('ETF','dividend','benchmark-dividend','2026-03-09T10:00:00.000Z',{cashPerShare:'1',paymentAt:'2026-03-09T12:00:00.000Z'})});f.call({type:'dividend_payment',actionId:'benchmark-dividend'});
  assert.equal(f.state().benchmarkNextOpen,'2026-03-09');f.observe('ETF','2026-03-09','regular_open','100');
  assert.equal(f.call({type:'benchmark_open',session:'2026-03-09'}).outcome.status,'accepted');assert.equal(f.state().benchmark.positions.ETF!.quantity,'10.100000');
});
test('late original opening fill revises an already recorded close and its reservations',t=>{
  const f=setup();t.after(f.close);const o=f.order('late-fill','BUY','2','2026-03-06','100');
  f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','110');const before=f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()}).outcome.valuation!;
  assert.equal(before.equity,'1000.000000');assert.equal(before.reservedCash,'200.000000');
  f.clock.set('2026-03-06T22:00:00.000Z');f.observe('ACME','2026-03-06','regular_open','100');f.call({type:'fill',orderId:o.id});
  const latest=latestValuations(f.state())[0]!.snapshot;assert.equal(latest.equity,'1020.000000');assert.equal(latest.reservedCash,'0.000000');assert.equal(latest.revision,2);assert.deepEqual(f.state().valuations[0]!.snapshot,before);
});
test('historical corrections exclude later uncertainty and later pending exposure',t=>{
  const f=setup({positionLimitBps:6000});t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');f.call({type:'action',action:action('ACME','ticker_change','rename',f.clock.now(),{newSymbol:'NEW'})});
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ACME','2026-03-09','regular_close','100');f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()});
  f.clock.set('2026-03-10T12:00:00.000Z');f.order('future','BUY','3','2026-03-10','100');f.call({type:'action',action:action('ACME','unsupported','unsupported',f.clock.now())});
  f.observe('ACME','2026-03-09','regular_close','101',{id:'historical-correction',sourceVersion:2,correctionOf:'price-ACME-2026-03-09-regular_close'});f.call({type:'revise_valuations',correctionId:'historical-correction'});
  const v=latestValuations(f.state())[0]!.snapshot;assert.equal(v.equity,'1002.000000');assert.equal(v.reservedCash,'0.000000');assert.deepEqual(v.observedBreaches,[]);
});
test('nonposting changes fence first-time historical valuation',t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-10T12:00:00.000Z');f.call({type:'action',action:action('ACME','unsupported','late-block',f.clock.now())});
  f.observe('ACME','2026-03-09','regular_close','100');assert.equal(f.call({type:'value',session:'2026-03-09',asOf:'2026-03-09T20:00:00.000Z'}).outcome.reason,'historical_book_unavailable');
});
for(const slippageBps of [0,100]) test(`posttrade risk includes ${slippageBps?'slippage':'commission'} loss on existing holdings`,t=>{
  const f=setup({commission:slippageBps?'0':'1',slippageBps,positionLimitBps:5000});t.after(f.close);
  const first=f.order('risk-first','BUY','4','2026-03-06','101');f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ACME','2026-03-06','regular_open','100');f.call({type:'fill',orderId:first.id});
  f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close',slippageBps?'149':'149.75');
  f.clock.set('2026-03-09T12:00:00.000Z');const next=f.order('risk-second','BUY','1','2026-03-09','101','BETA');
  if(!slippageBps) {assert.equal(next.receipt.outcome.reason,'ACME:position_limit');return;}
  f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ACME','2026-03-09','regular_open','149');f.observe('BETA','2026-03-09','regular_open','100');
  assert.equal(f.call({type:'fill',orderId:next.id}).outcome.reason,'ACME:position_limit');assert.equal(f.state().portfolio.cash,'596.000000');assert.equal(f.state().portfolio.reservedCash,'0.000000');
});
test('cutoff-adjacent initial benchmark selection remains consistent after revision',t=>{
  const f=setup({startsAt:'2026-03-06T14:10:00.000Z'});t.after(f.close);assert.equal(f.state().benchmarkNextOpen,'2026-03-09');
  f.clock.set('2026-03-09T13:30:00.000Z');f.observe('ETF','2026-03-09','regular_open','100');f.call({type:'benchmark_open',session:'2026-03-09'});
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ETF','2026-03-09','regular_close','100');f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()});
  f.observe('ETF','2026-03-09','regular_close','101',{id:'etf-correct',sourceVersion:2,correctionOf:'price-ETF-2026-03-09-regular_close'});
  assert.equal(f.call({type:'revise_valuations',correctionId:'etf-correct'}).outcome.valuation!.benchmarkEquity,'1010.000000');
});
test('tiny reinvestment stays residual cash when fractional quantity rounds to zero',t=>{
  const f=setup();t.after(f.close);f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ETF','2026-03-06','regular_open','100');f.call({type:'benchmark_open',session:'2026-03-06'});
  f.clock.set('2026-03-09T12:00:00.000Z');f.call({type:'action',action:action('ETF','dividend','tiny',f.clock.now(),{cashPerShare:'0.000001',paymentAt:f.clock.now()})});
  f.clock.set('2026-03-09T13:30:00.000Z');const payment=f.call({type:'dividend_payment',actionId:'tiny'});assert.equal(payment.effectiveAt,'2026-03-09T12:00:00.000Z');assert.equal(payment.recordedAt,f.clock.now());
  f.observe('ETF','2026-03-09','regular_open','100');assert.equal(f.call({type:'benchmark_open',session:'2026-03-09'}).outcome.fills.length,0);
  f.clock.set('2026-03-09T20:00:00.000Z');f.observe('ETF','2026-03-09','regular_close','100');f.call({type:'value',session:'2026-03-09',asOf:f.clock.now()});f.observe('ETF','2026-03-09','regular_close','100',{id:'tiny-correction',sourceVersion:2,correctionOf:'price-ETF-2026-03-09-regular_close'});
  assert.equal(f.call({type:'revise_valuations',correctionId:'tiny-correction'}).outcome.valuation!.benchmarkEquity,'1000.000010');
});
test('sector ceiling includes another instrument pending in the same sector',t=>{
  const config=configuration({sectorLimitBps:3000});config.instruments[1]!.sector='Technology';const f=setup(config);t.after(f.close);
  assert.equal(f.order('sector-a','BUY','2','2026-03-06','100').receipt.outcome.status,'pending');assert.equal(f.order('sector-b','BUY','2','2026-03-06','100','BETA').receipt.outcome.reason,'Technology:sector_limit');
});
test('drawdown attention blocks new buys while allowing an explicit reducing sale',t=>{
  const f=setup({drawdownAttentionBps:1000});t.after(f.close);buyTwo(f);f.clock.set('2026-03-06T21:00:00.000Z');f.observe('ACME','2026-03-06','regular_close','50');f.call({type:'value',session:'2026-03-06',asOf:f.clock.now()});
  f.clock.set('2026-03-09T12:00:00.000Z');assert.equal(f.order('drawdown','BUY','1','2026-03-09','50','BETA').receipt.outcome.reason,'drawdown_attention');assert.equal(f.order('reduce','SELL','1','2026-03-09','40').receipt.outcome.status,'pending');
});
test('freshness accepts exact frozen boundary and rejects one millisecond later',()=>{
  const c=configuration({maxMarkAgeSeconds:60}),o=observationFor(c,'ACME','2026-03-06','regular_open','100');
  assert.equal(mark(c,[o],'ACME','2026-03-06T14:31:00.000Z','2026-03-06T14:31:00.000Z')?.id,o.id);assert.equal(mark(c,[o],'ACME','2026-03-06T14:31:00.001Z','2026-03-06T14:31:00.001Z'),null);
});
for(const splitFirst of [true,false]) test(`simultaneous split/dividend units stay blocked (${splitFirst?'split':'dividend'} first)`,t=>{
  const f=setup();t.after(f.close);buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');
  const split=action('ACME','split','simultaneous-split',f.clock.now(),{numerator:'2',denominator:'1'}),dividend=action('ACME','dividend','simultaneous-dividend',f.clock.now(),{cashPerShare:'1',paymentAt:f.clock.now()});
  f.call({type:'action',action:splitFirst?split:dividend});assert.equal(f.call({type:'action',action:splitFirst?dividend:split}).outcome.reason,'simultaneous_action_units_unknown');assert.equal(f.call({type:'dividend_payment',actionId:dividend.id}).outcome.reason,'instrument_blocked');assert.equal(f.state().portfolio.cash,'800.000000');
});
test('late fill cannot price another holding after its later split at a pre-split opening',t=>{
  const f=setup({commission:'50',positionLimitBps:5800});t.after(f.close);
  const a=f.order('delayed-acme','BUY','5','2026-03-06','100'),b=f.order('early-beta','BUY','1','2026-03-06','100','BETA');
  f.clock.set('2026-03-06T14:30:00.000Z');f.observe('BETA','2026-03-06','regular_open','100');f.call({type:'fill',orderId:b.id});
  f.clock.set('2026-03-06T15:00:00.000Z');f.call({type:'action',action:action('BETA','split','later-beta-split',f.clock.now(),{numerator:'2',denominator:'1'})});f.observe('ACME','2026-03-06','regular_open','100');
  assert.equal(f.call({type:'fill',orderId:a.id}).outcome.reason,'out_of_order_portfolio_fill');assert.equal(f.state().portfolio.cash,'850.000000');assert.equal(f.state().portfolio.reservedCash,'0.000000');
});
