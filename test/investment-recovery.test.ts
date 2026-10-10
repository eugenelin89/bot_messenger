import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setup, observationFor, buyTwo } from './fixtures/investment/support.js';
import { Store } from '../src/persistence/store.js';
import { FixtureSimulator, type Command } from '../src/control/investment.js';
import { hash } from '../src/domain/investment/identity.js';

// Real independent Node processes and SQLite connections; IPC only synchronizes the start.
function processCommand(path:string, at:string, command:Command, request:string, fault:string|null=null) {
  const source=`import {Store} from ${JSON.stringify(new URL('../src/persistence/store.js',import.meta.url).href)};
import {FixtureSimulator,FixtureClock} from ${JSON.stringify(new URL('../src/control/investment.js',import.meta.url).href)};
const [path,at,command,request,fault]=JSON.parse(process.argv[1]);
const store=new Store(path),sim=new FixtureSimulator(store,new FixtureClock(at),'fixture-owner',phase=>{if(phase===fault)process.kill(process.pid,'SIGKILL');});
process.send('ready');process.once('message',()=>{try{const j=sim.execute('synthetic-run',command,request);process.send({journal:j});store.close();process.disconnect();}catch(e){process.send({error:String(e)});store.close();process.disconnect();process.exitCode=1;}});`;
  const child=spawn(process.execPath,['--input-type=module','-e',source,JSON.stringify([path,at,command,request,fault])],{stdio:['ignore','ignore','pipe','ipc']});
  let stderr='',result:unknown;child.stderr!.on('data',x=>stderr+=x);
  const ready=new Promise<void>((resolve,reject)=>{child.on('message',m=>{if(m==='ready')resolve();else result=m;});child.on('error',reject);child.on('exit',code=>{if(code)reject(new Error(stderr));});});
  const done=new Promise<{code:number|null;signal:string|null;result:unknown}>(resolve=>child.on('exit',(code,signal)=>resolve({code,signal,result})));
  return {ready,go:()=>child.send('go'),done};
}
for(const phase of ['before_commit','after_commit'] as const) test(`SIGKILL ${phase}: journal, reservations, financial postings and disabled outbox recover atomically`,async t=>{
  const f=setup();t.after(f.close);const o=f.order('crash-buy','BUY','2','2026-03-06','100');f.clock.set('2026-03-06T14:30:00.000Z');f.observe('ACME','2026-03-06','regular_open','100');
  const before=f.state(),count=f.sim.outbox(f.config.runId).length;
  const child=processCommand(f.path,f.clock.now(),{type:'fill',orderId:o.id},'uncertain-fill',phase);await child.ready;child.go();const result=await child.done;assert.equal(result.signal,'SIGKILL');
  const reopened=new Store(f.path);t.after(()=>reopened.close());const sim=new FixtureSimulator(reopened,f.clock,'fixture-owner');
  assert.equal(sim.inspect(f.config.runId).portfolio.cash,phase==='before_commit'?'1000.000000':'800.000000');
  assert.equal(sim.outbox(f.config.runId).length,count+(phase==='before_commit'?0:1));
  const receipt=sim.execute(f.config.runId,{type:'fill',orderId:o.id},'uncertain-fill');
  assert.equal(receipt.outcome.status,'filled');assert.equal(sim.inspect(f.config.runId).portfolio.cash,'800.000000');assert.equal(sim.inspect(f.config.runId).portfolio.reservedCash,'0.000000');
  assert.equal(sim.inspect(f.config.runId).portfolio.positions.ACME!.quantity,'2.000000');assert.equal(sim.inspect(f.config.runId).ledgerVersion,String(BigInt(before.ledgerVersion)+1n));
  assert.deepEqual(sim.execute(f.config.runId,{type:'fill',orderId:o.id},'uncertain-fill'),receipt);assert.throws(()=>sim.execute(f.config.runId,{type:'cancel',orderId:o.id},'uncertain-fill'),/request_identity_conflict/);
  assert.equal(sim.outbox(f.config.runId).length,count+1);
});
test('initialization and reservation restart replay retain exact identities and frozen configuration retry',t=>{
  const f=setup();t.after(f.close);const initial=f.sim.journal(f.config.runId)[0]!;const o=f.order('reserved','BUY','2','2026-03-06','100'),before=f.state();
  f.clock.set('2026-03-06T13:00:00.000Z');const store=new Store(f.path);t.after(()=>store.close());const sim=new FixtureSimulator(store,f.clock,'fixture-owner');
  assert.deepEqual(sim.create(f.config),initial);assert.deepEqual(sim.inspect(f.config.runId),before);assert.equal(sim.inspect(f.config.runId).orders[o.id]!.status,'pending');
  assert.equal(hash(sim.journal(f.config.runId)),hash(f.sim.journal(f.config.runId)));assert.equal(hash(sim.outbox(f.config.runId)),hash(f.sim.outbox(f.config.runId)));
});
for(const side of ['BUY','SELL'] as const) test(`two processes serialize competing ${side} reservations against the same financial version`,async t=>{
  const f=setup();t.after(f.close);const commands:Command[]=[];
  if(side==='SELL') {buyTwo(f);f.clock.set('2026-03-09T12:00:00.000Z');}
  for(const decisionId of ['compete-a','compete-b']) {
    const proposal={decisionId,revision:1,author:'author',action:side,evidenceCutoff:f.clock.now(),evidence:[],rationale:'Concurrent synthetic proposal',orders:[{instrumentId:'ACME',side,quantity:side==='BUY'?'6':'2',priceGuard:'100',targetSession:side==='BUY'?'2026-03-06':'2026-03-09'}]};
    f.call({type:'decision',proposal});f.call({type:'review',review:{id:decisionId,decisionId,revision:1,proposalHash:hash(proposal),reviewer:'reviewer',disposition:'approve',reviewedAt:f.clock.now()}});
    commands.push({type:'submit',decisionId,revision:1,orderIndex:0,expectedVersion:f.state().ledgerVersion,reviewId:decisionId});
  }
  const children=commands.map((c,i)=>processCommand(f.path,f.clock.now(),c,`concurrent-${i}`));await Promise.all(children.map(c=>c.ready));children.forEach(c=>c.go());const results=await Promise.all(children.map(c=>c.done));results.forEach(r=>assert.equal(r.code,0));
  assert.deepEqual(Object.values(f.state().orders).filter(o=>o.side===side).map(o=>o.status).sort(),['pending','rejected']);assert.equal(f.state().portfolio.reservedCash,side==='BUY'?'600.000000':'0.000000');assert.equal(f.state().portfolio.cash,side==='BUY'?'1000.000000':'800.000000');if(side==='SELL')assert.equal(f.state().portfolio.positions.ACME!.reserved,'2.000000');
});
for(const rival of ['cancel','expire','pause'] as const) test(`concurrent fill/${rival} has one coherent terminal outcome`,async t=>{
  const f=setup();t.after(f.close);const o=f.order(`race-${rival}`,'BUY','2','2026-03-06','100');f.clock.set('2026-03-06T14:30:00.000Z');f.call({type:'observe',observation:observationFor(f.config,'ACME','2026-03-06','regular_open','100')});
  if(rival==='expire') f.clock.set(f.state().orders[o.id]!.expiresAt);
  const command:Command=rival==='pause'?{type:'control',state:'paused'}:{type:rival,orderId:o.id};
  const children=[processCommand(f.path,f.clock.now(),{type:'fill',orderId:o.id},'race-fill'),processCommand(f.path,f.clock.now(),command,'race-rival')];await Promise.all(children.map(c=>c.ready));children.forEach(c=>c.go());(await Promise.all(children.map(c=>c.done))).forEach(r=>assert.equal(r.code,0));
  const state=f.state(),status=state.orders[o.id]!.status;assert.ok(['filled','cancelled','expired'].includes(status));if(rival==='expire')assert.equal(status,'expired');
  assert.equal(state.portfolio.reservedCash,'0.000000');assert.equal(state.portfolio.cash,status==='filled'?'800.000000':'1000.000000');assert.equal(f.sim.outbox(f.config.runId).length,f.sim.journal(f.config.runId).length);
});
for(const [name,sql,expected] of [
  ['predecessor',"DROP TRIGGER investment_journal_immutable;UPDATE investment_journal SET previous_hash='bad' WHERE version=1",/invalid_predecessor/],
  ['journal payload',"DROP TRIGGER investment_journal_immutable;UPDATE investment_journal SET payload=json_set(payload,'$.entries[0].amount','2000.000000') WHERE version=1",/journal_hash_mismatch/],
  ['missing outbox',"DROP TRIGGER investment_outbox_retained;DELETE FROM investment_outbox WHERE journal_version=1",/outbox_mismatch/],
  ['truncation',"DROP TRIGGER investment_receipts_retained;DELETE FROM investment_receipts;DROP TRIGGER investment_outbox_retained;DELETE FROM investment_outbox;DROP TRIGGER investment_journal_retained;DELETE FROM investment_journal",/truncated_or_corrupt_history/],
  ['receipt hash',"DROP TRIGGER investment_receipts_immutable;UPDATE investment_receipts SET request_hash='bad'",/receipt_hash_mismatch/],
  ['missing receipt',"DROP TRIGGER investment_receipts_retained;DELETE FROM investment_receipts",/receipt_identity_mismatch/],
] as const) test(`disposable tampered ${name} fails closed`,t=>{
  const f=setup();t.after(f.close);f.store.db.exec(sql);assert.throws(()=>f.state(),expected);
});
test('missing reference, future schema and corrupt file fail closed',t=>{
  const f=setup();t.after(f.close);
  f.store.db.exec("PRAGMA foreign_keys=OFF;DROP TRIGGER investment_receipts_immutable;UPDATE investment_receipts SET journal_version=999;PRAGMA foreign_keys=ON");
  assert.throws(()=>new FixtureSimulator(f.store,f.clock,'fixture-owner'),/missing_reference/);
  f.store.run('INSERT INTO schema_migrations VALUES (?,?)',17,'future');assert.throws(()=>new Store(f.path),/newer|Unsupported|schema/i);
  const path=join(f.dir,'corrupt.sqlite');writeFileSync(path,'This is not a SQLite database.');assert.throws(()=>new Store(path),/database/);
});
test('same-command receipt corruption cannot exchange blocked and successful outcomes',t=>{
  const f=setup();t.after(f.close);const o=f.order('receipt','BUY','2','2026-03-06','100');f.clock.set('2026-03-06T14:30:00.000Z');
  const blocked=f.call({type:'fill',orderId:o.id},'first-attempt');f.observe('ACME','2026-03-06','regular_open','100');const filled=f.call({type:'fill',orderId:o.id},'second-attempt');
  assert.equal(blocked.outcome.status,'data_blocked');assert.equal(filled.outcome.status,'filled');
  f.store.db.exec('DROP TRIGGER investment_receipts_immutable');f.store.run('UPDATE investment_receipts SET journal_version=? WHERE request_id=?',Number(filled.version),'first-attempt');
  assert.throws(()=>f.state(),/receipt_identity_mismatch/);
});
