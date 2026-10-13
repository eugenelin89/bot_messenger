/** Verified reads use authored ledger records only, never operational authority. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './fixtures/investment/support.js';
import {FixtureSimulator} from '../src/control/investment.js';
import {finiteFixture} from './fixtures/finite-hq/support.js';
import {hash} from '../src/domain/investment/identity.js';
import {MarketStore} from '../src/control/market/store.js';
import {MarketFixtureSimulator} from '../src/control/market/admission.js';

test('coherent snapshots are fresh after returned mutations, committed writes and rollback',t=>{
 const f=setup();t.after(f.close);
 const first=f.sim.readSnapshot(f.config.runId);
 assert.deepEqual(first,{configuration:f.sim.configuration(f.config.runId),state:f.sim.inspect(f.config.runId)});
 first.configuration.initialCapital='999999';first.configuration.calendar.sessions[0]!.open='invalid';
 first.state.portfolio.cash='999999.000000';first.state.lifecycle='paused';
 const next=f.sim.readSnapshot(f.config.runId);
 assert.equal(next.configuration.initialCapital,'1000');assert.equal(next.state.portfolio.cash,'1000.000000');
 assert.equal(next.state.lifecycle,'active');assert.equal(next.configuration.calendar.sessions[0]!.open,f.config.calendar.sessions[0]!.open);
 assert.throws(()=>f.store.transaction(()=>{
  f.call({type:'control',state:'paused'},'rolled-back');
  assert.equal(f.sim.readSnapshot(f.config.runId).state.lifecycle,'paused');throw Error('rollback fixture');
 }),/rollback fixture/);
 assert.equal(f.sim.readSnapshot(f.config.runId).state.lifecycle,'active');
 f.call({type:'control',state:'paused'},'committed');assert.equal(f.sim.readSnapshot(f.config.runId).state.lifecycle,'paused');
 const other=new FixtureSimulator(f.store,f.clock,'different-owner');assert.throws(()=>other.readSnapshot(f.config.runId),/fixture_operator_required/);
});

for(const [name,sql,expected] of [
 ['checkpoint',"DROP TRIGGER investment_head_guard;UPDATE investment_runs SET checkpoint_hash='corrupt'",/truncated_or_corrupt_history/],
 ['configuration',"DROP TRIGGER investment_configuration_immutable;UPDATE investment_runs SET configuration=json_set(configuration,'$.initialCapital','2000')",/configuration_corrupt/],
 ['outbox projection',"DROP TRIGGER investment_outbox_immutable;UPDATE investment_outbox SET projection='{}'",/outbox_mismatch/],
 ['receipt alias',"DROP TRIGGER investment_receipts_immutable;UPDATE investment_receipts SET journal_version=2 WHERE request_id='initial-alias'",/receipt_identity_mismatch/],
] as const)test(`snapshot revalidates ${name} after a successful read without a head change`,t=>{
 const f=setup();t.after(f.close);f.sim.execute(f.config.runId,{type:'initialize'},'initial-alias');
 f.call({type:'control',state:'paused'},'pause');f.sim.readSnapshot(f.config.runId);
 const head=f.store.get('SELECT head_version,head_hash FROM investment_runs')!;
 f.store.db.exec(sql);assert.deepEqual(f.store.get('SELECT head_version,head_hash FROM investment_runs'),head);
 assert.throws(()=>f.sim.readSnapshot(f.config.runId),expected);
});

test('batched verification remains run scoped with overlapping request identities',t=>{
 const f=setup();t.after(f.close);const second={...structuredClone(f.config),runId:'second-run',initialCapital:'2000'};
 f.sim.create(second);f.sim.execute(second.runId,{type:'initialize'},'shared-alias');
 f.sim.execute(f.config.runId,{type:'initialize'},'shared-alias');
 f.sim.execute(second.runId,{type:'control',state:'paused'},'same-request');
 f.sim.execute(f.config.runId,{type:'control',state:'active'},'same-request');
 const one=f.sim.readSnapshot(f.config.runId),two=f.sim.readSnapshot(second.runId);
 assert.equal(one.state.portfolio.cash,'1000.000000');assert.equal(one.state.lifecycle,'active');
 assert.equal(two.state.portfolio.cash,'2000.000000');assert.equal(two.state.lifecycle,'paused');
});

test('combined private health read still rejects a changed frozen scope',t=>{
 const f=finiteFixture(t);t.after(f.close);const result=f.consent(),scope=f.company.investmentTeam.scope(result.scope.scopeId);
 f.company.investmentTeam.privateHealth(scope);
 const changed={...scope,configuration_hash:hash('different frozen configuration')};
 changed.digest=hash({envelope:JSON.parse(changed.envelope),configuration:changed.configuration_hash,groupScope:changed.group_scope,context:changed.context_hash});
 assert.throws(()=>f.company.investmentTeam.privateHealth(changed),/Frozen configuration changed/);
});

test('market execution replays a pause committed by its risk callback after the snapshot',t=>{
 const f=setup();t.after(f.close);const order=f.order('before-pause','BUY','2','2026-03-06','110');
 assert.equal(order.receipt.outcome.status,'pending');let calls=0;
 const market=new MarketFixtureSimulator(new MarketStore(f.store),f.clock,'fixture-owner',()=>{
  calls++;f.call({type:'control',state:'paused'},'risk-callback-pause');
 });
 f.clock.set('2026-03-06T14:30:00.000Z');
 const result=market.execute(f.config.runId,{type:'fill',orderId:order.id},'after-pause');
 assert.equal(calls,1);assert.equal(result.outcome.status,'cancelled');assert.equal(result.outcome.reason,'already_terminal');
 assert.deepEqual(result.outcome.fills,[]);const snapshot=f.sim.readSnapshot(f.config.runId);
 assert.equal(snapshot.state.lifecycle,'paused');assert.equal(snapshot.state.portfolio.cash,'1000.000000');
 assert.equal(snapshot.state.orders[order.id]!.status,'cancelled');
});
