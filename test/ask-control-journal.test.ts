/** Authored offline privacy controls. No website, model or provider deletion is exercised. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AskControlReceipt, AskControlSync } from '../contracts/investment/v1/types.js';
import type { AskBoundaryContext } from '../src/domain/ask/contract.js';
import { Store } from '../src/persistence/store.js';
import { AskControlJournal, ASK_CONTROL_APPLICATION } from '../src/control/ask/control-journal.js';
import { ContractError } from '../scripts/investment-contracts/schema.js';
import { removeEmptyAskMigration } from './fixtures/investment/schema.js';
import { runningFiniteFixture } from './fixtures/finite-hq/support.js';

const examples=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'botsquad-ask-journal-')),path=join(dir,'company.sqlite'),db=new Store(path);
 const ctx:AskBoundaryContext={scope:structuredClone(examples.AskServiceScope),limits:structuredClone(examples.AskLimits),now:'2026-01-05T21:32:00Z'};
 const journal=new AskControlJournal(db,()=>ctx);
 return {dir,path,db,ctx,journal,close(){db.close();rmSync(dir,{recursive:true,force:true});}};
}
function control(id='control-a',conversationId='conversation-a',questionId:string|null='question-a'):AskControlReceipt {
 return {schemaVersion:'1.0',controlId:id,conversationId,questionId,action:questionId?'cancel':'delete',effectiveAt:'2026-01-05T21:31:00Z',purgeBy:'2026-01-05T21:31:00Z',suppressionUntil:'2026-02-04T21:31:00Z'};
}
function page(syncId:string,controls:AskControlReceipt[]=[],nextCursor:string|null=null):AskControlSync {
 return {schemaVersion:'1.0',syncId,controls,nextCursor,checkedAt:'2026-01-05T21:32:00Z',validUntil:'2026-01-05T21:33:00Z'};
}
function reject(fn:()=>unknown,code?:string){assert.throws(fn,e=>e instanceof ContractError&&(!code||e.code===code));}
function deliver(f:ReturnType<typeof fixture>,controls:AskControlReceipt[]=[],cursor:string|null=null){const i=f.journal.prepareSync();f.journal.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId,controls,cursor));return i;}

test('empty journal drain is narrow metadata evidence, not restore/purge/model authority',t=>{
 const f=fixture();t.after(f.close);assert.equal(f.journal.barrier(),null);deliver(f);
 assert.deepEqual(f.journal.barrier(),{syncId:f.db.get<{barrier_id:string}>('SELECT barrier_id FROM ask_control_services')!.barrier_id,checkedAt:f.ctx.now,validUntil:'2026-01-05T21:33:00Z',applicationVersion:ASK_CONTROL_APPLICATION,contentPurgeVerified:false,restorationVerified:false});
 assert.equal('controlsDrained' in f.journal.barrier()!,false);assert.equal(f.db.all('SELECT * FROM executions').length,0);
 assert.equal(f.db.all('SELECT * FROM investment_public_grants').length,0);assert.equal(f.db.all('SELECT * FROM investment_finite_reservations').length,0);
});
test('multipage application precedes derived cursor/ACK; nonempty terminal requires another exchange',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()],'cursor-1');assert.equal(f.journal.barrier(),null);
 const second=f.journal.prepareSync();assert.equal(second.operation.input.after,'cursor-1');assert.deepEqual(second.operation.input.acknowledgedControlIds,['control-a']);
 f.journal.acceptPage(second.operation.input.syncId,page(second.operation.input.syncId,[control('control-b','conversation-b',null)]));assert.equal(f.journal.barrier(),null);
 const final=f.journal.prepareSync();assert.equal(final.operation.input.after,null);assert.deepEqual(final.operation.input.acknowledgedControlIds,['control-b']);
 f.journal.acceptPage(final.operation.input.syncId,page(final.operation.input.syncId));assert.ok(f.journal.barrier());
 assert.equal(f.db.all('SELECT * FROM ask_privacy_controls WHERE acknowledged_at IS NOT NULL').length,2);
});
test('lost response freezes exact sync bytes and receiver-independent suppression is durable',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);const next=f.journal.prepareSync();
 next.operation.input.acknowledgedControlIds.push('forged');next.operation.input.after='skipped';
 const stored=f.journal.prepareSync();assert.deepEqual(stored.operation.input.acknowledgedControlIds,['control-a']);assert.equal(stored.operation.input.after,null);
 assert.deepEqual(f.journal.prepareSync(),stored);assert.ok(f.journal.suppressed('conversation-a','question-a'));
 f.journal.acceptPage(stored.operation.input.syncId,page(stored.operation.input.syncId));assert.ok(f.journal.barrier());
});
test('question suppression requires both identities; conversation deletion covers all its questions only',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);assert.equal(f.journal.suppressed('other','question-a'),false);assert.equal(f.journal.suppressed('conversation-a','other'),false);
 deliver(f,[control('delete','conversation-a',null)]);assert.equal(f.journal.suppressed('conversation-a','other'),true);assert.equal(f.journal.suppressed('other','other'),false);
 reject(()=>f.journal.suppressed('../x','q'),'INVALID_SCHEMA');
});
test('two services with identical opaque IDs keep suppressions, ACKs, requests and retention isolated',t=>{
 const f=fixture();t.after(f.close);const ctx=structuredClone(f.ctx);ctx.scope.serviceId='service-b';const other=new AskControlJournal(f.db,()=>ctx);
 deliver(f,[control()]);const b=other.prepareSync();other.acceptPage(b.operation.input.syncId,page(b.operation.input.syncId,[control('control-a','conversation-a',null)]));
 assert.equal(f.journal.suppressed('conversation-a','other-question'),false);assert.equal(other.suppressed('conversation-a','other-question'),true);
 const aAck=f.journal.prepareSync(),bAck=other.prepareSync();assert.deepEqual(aAck.operation.input.acknowledgedControlIds,['control-a']);assert.deepEqual(bAck.operation.input.acknowledgedControlIds,['control-a']);
 reject(()=>f.journal.acceptPage(bAck.operation.input.syncId,page(bAck.operation.input.syncId)),'CONFLICT');f.journal.acceptPage(aAck.operation.input.syncId,page(aAck.operation.input.syncId));
 assert.ok(f.journal.barrier());assert.equal(other.barrier(),null);assert.deepEqual(other.prepareSync(),bAck);
 f.ctx.now=ctx.now='2026-02-04T21:33:00Z';assert.deepEqual(f.journal.prune(),{controls:1,requests:2});reject(()=>other.prune(),'CONFLICT');assert.equal(other.controls().length,1);
});
test('conflicting control rolls back all new suppressions, ACKs, response and cursor changes',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()],'old-cursor');const next=f.journal.prepareSync(),old=f.db.all('SELECT * FROM ask_control_services');
 reject(()=>f.journal.acceptPage(next.operation.input.syncId,page(next.operation.input.syncId,[control('new'),{...control(),action:'expire'}],'changed-cursor')),'CONFLICT');
 assert.equal(f.journal.controls().length,1);assert.deepEqual(f.db.all('SELECT * FROM ask_control_services'),old);assert.equal(f.db.get<{acknowledged_at:null}>('SELECT acknowledged_at FROM ask_privacy_controls')!.acknowledged_at,null);
 assert.deepEqual(f.journal.prepareSync(),next);
});
test('injected local application failure rolls back suppression, receipt and cursor together',t=>{
 const f=fixture();t.after(f.close);const intent=f.journal.prepareSync();
 f.db.db.exec("CREATE TEMP TRIGGER fail_application BEFORE INSERT ON ask_privacy_controls WHEN NEW.control_id='fail' BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 assert.throws(()=>f.journal.acceptPage(intent.operation.input.syncId,page(intent.operation.input.syncId,[control(),control('fail')],'next')),/authored fault/);
 assert.equal(f.journal.controls().length,0);assert.deepEqual(f.journal.prepareSync(),intent);assert.equal(f.journal.barrier(),null);
 f.db.db.exec('DROP TRIGGER fail_application');f.journal.acceptPage(intent.operation.input.syncId,page(intent.operation.input.syncId,[control()]));assert.equal(f.journal.controls().length,1);
});
test('failure after ACK but before response commit rolls back acknowledgment',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);const intent=f.journal.prepareSync();
 f.db.db.exec("CREATE TEMP TRIGGER fail_response BEFORE UPDATE ON ask_control_requests WHEN NEW.state='complete' BEGIN SELECT RAISE(ABORT,'after ack fault'); END");
 assert.throws(()=>f.journal.acceptPage(intent.operation.input.syncId,page(intent.operation.input.syncId)),/after ack fault/);
 assert.equal(f.db.get<{acknowledged_at:null}>('SELECT acknowledged_at FROM ask_privacy_controls')!.acknowledged_at,null);assert.equal(f.journal.barrier(),null);
});
test('exact duplicate response is idempotent and cannot refresh expired freshness; changed duplicate conflicts',t=>{
 const f=fixture();t.after(f.close);const intent=deliver(f);const p=page(intent.operation.input.syncId);f.journal.acceptPage(p.syncId,p);
 reject(()=>f.journal.acceptPage(p.syncId,{...p,nextCursor:'different'}),'CONFLICT');f.ctx.now='2026-01-05T21:33:00Z';f.journal.acceptPage(p.syncId,p);assert.equal(f.journal.barrier(),null);
});
for(const kind of ['fresh','pending','applied'] as const)test(`restart from ${kind} invalidates barrier, retains suppressions and fences old callbacks`,t=>{
 const f=fixture();t.after(f.close);const previous=deliver(f,kind==='applied'?[control()]:[]);const pending=kind==='pending'||kind==='applied'?f.journal.prepareSync():previous;
 const reopened=new Store(f.path);t.after(()=>reopened.close());const current=new AskControlJournal(reopened,()=>f.ctx);
 assert.equal(current.barrier(),null);reject(()=>f.journal.acceptPage(pending.operation.input.syncId,page(pending.operation.input.syncId)),'CONFLICT');reject(()=>f.journal.prepareSync(),'CONFLICT');
 const next=current.prepareSync();assert.notEqual(next.operation.input.syncId,pending.operation.input.syncId);assert.equal(next.operation.input.after,null);
 assert.deepEqual(next.operation.input.acknowledgedControlIds,kind==='applied'?['control-a']:[]);
 current.acceptPage(next.operation.input.syncId,page(next.operation.input.syncId));assert.equal(current.barrier()!.restorationVerified,false);
 if(kind==='applied')assert.equal(current.suppressed('conversation-a','question-a'),true);
});
test('restored older snapshot cannot infer newer deletion custody from an empty response',t=>{
 const f=fixture();t.after(f.close);const path=join(f.dir,'older.sqlite');f.db.db.exec(`VACUUM INTO '${path.replaceAll("'","''")}'`);
 deliver(f,[control()]);deliver(f);const older=new Store(path);t.after(()=>older.close());const j=new AskControlJournal(older,()=>f.ctx),i=j.prepareSync();j.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId));
 assert.equal(j.controls().length,0);assert.equal(j.barrier()!.restorationVerified,false);assert.equal(j.barrier()!.contentPurgeVerified,false);
});
for(const field of ['generation','scope','limits','clock'] as const)test(`changed ${field} cannot advance a pending journal`,t=>{
 const f=fixture();t.after(f.close);const i=f.journal.prepareSync();
 if(field==='generation')f.ctx.scope.consumerGeneration='2';if(field==='scope')f.ctx.scope.keyId='rotated';if(field==='limits')f.ctx.limits.controlFreshnessSeconds=30;if(field==='clock')f.ctx.now='2026-01-05T21:31:59Z';
 reject(()=>f.journal.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId)),'CONFLICT');assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_control_requests')!.state,'pending');
});
test('constructor never advances or lowers consumer generation',t=>{const f=fixture();t.after(f.close);f.ctx.scope.consumerGeneration='2';reject(()=>new AskControlJournal(f.db,()=>f.ctx),'CONFLICT');assert.equal(f.db.get<{generation:string}>('SELECT generation FROM ask_control_services')!.generation,'1');});
test('local tighter freshness expires candidate and clock rollback cannot revive it',t=>{
 const f=fixture();t.after(f.close);f.ctx.limits.controlFreshnessSeconds=30;const j=new AskControlJournal(f.db,()=>f.ctx),i=j.prepareSync();j.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId));f.ctx.now='2026-01-05T21:32:31Z';assert.equal(j.barrier(),null);f.ctx.now='2026-01-05T21:32:01Z';reject(()=>j.barrier(),'CONFLICT');
});
for(const mutation of ['id','future','unknown','cancel','duplicate'] as const)test(`invalid ${mutation} page leaves request pending and controls untouched`,t=>{
 const f=fixture();t.after(f.close);const i=f.journal.prepareSync(),p=page(i.operation.input.syncId,[control()]);
 if(mutation==='id')p.syncId='unknown';if(mutation==='future')p.checkedAt='2026-01-05T21:32:01Z';if(mutation==='unknown')Object.assign(p,{purged:true});if(mutation==='cancel')p.controls[0]!.questionId=null;if(mutation==='duplicate')p.controls.push(control());
 reject(()=>f.journal.acceptPage(i.operation.input.syncId,p));assert.equal(f.journal.controls().length,0);assert.deepEqual(f.journal.prepareSync(),i);
});
test('unrecognized sync ID and outer transactions cannot commit any partial transition',t=>{const f=fixture();t.after(f.close);reject(()=>f.journal.acceptPage('unknown',page('unknown')));f.db.transaction(()=>{reject(()=>f.journal.prepareSync(),'CONFLICT');reject(()=>new AskControlJournal(f.db,()=>f.ctx),'CONFLICT');});assert.equal(f.db.all('SELECT * FROM ask_control_requests').length,0);});
test('page capacity exhaustion keeps exact pending evidence and creates no new work',t=>{
 const f=fixture();t.after(f.close);f.db.run('UPDATE ask_control_services SET pages=1000');reject(()=>f.journal.prepareSync(),'BUDGET_EXHAUSTED');assert.equal(f.db.all('SELECT * FROM ask_control_requests').length,0);
});
test('settled expired metadata prunes; pending/abandoned horizon holds without erasing uncertainty',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);deliver(f);f.ctx.now='2026-02-04T21:33:00Z';assert.deepEqual(f.journal.prune(),{controls:1,requests:2});assert.equal(f.journal.barrier(),null);assert.equal(f.journal.controls().length,0);
 const g=fixture();t.after(g.close);g.journal.prepareSync();const restarted=new AskControlJournal(g.db,()=>g.ctx);g.ctx.now='2026-02-04T21:33:00Z';reject(()=>restarted.prune(),'OUTCOME_UNKNOWN');assert.equal(g.db.all('SELECT * FROM ask_control_requests').length,1);
});
test('late empty reply cannot bypass unresolved retention by avoiding prune',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);const i=f.journal.prepareSync();f.ctx.now='2026-02-04T21:33:00Z';
 reject(()=>f.journal.prepareSync(),'OUTCOME_UNKNOWN');reject(()=>f.journal.acceptPage(i.operation.input.syncId,{...page(i.operation.input.syncId),checkedAt:f.ctx.now,validUntil:'2026-02-04T21:34:00Z'}),'OUTCOME_UNKNOWN');reject(()=>f.journal.barrier(),'OUTCOME_UNKNOWN');
 assert.equal(f.db.get<{acknowledged_at:null}>('SELECT acknowledged_at FROM ask_privacy_controls')!.acknowledged_at,null);
});
test('fresh drain resolves abandoned sync metadata before expiry without claiming restore safety',t=>{
 const f=fixture();t.after(f.close);const old=f.journal.prepareSync();const current=new AskControlJournal(f.db,()=>f.ctx),i=current.prepareSync();current.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId));
 assert.deepEqual({...f.db.get<{state:string;resolved_by:string}>('SELECT state,resolved_by FROM ask_control_requests WHERE sync_id=?',old.operation.input.syncId)},{state:'reconciled',resolved_by:i.operation.input.syncId});assert.equal(current.barrier()!.restorationVerified,false);
 f.ctx.now='2026-02-04T21:33:00Z';assert.deepEqual(current.prune(),{controls:0,requests:2});
});
test('tightened retention keeps resolver evidence while an older record still references it',t=>{
 const f=fixture();t.after(f.close);f.journal.prepareSync();f.ctx.limits.suppressionRetentionSeconds=604800;
 const j=new AskControlJournal(f.db,()=>f.ctx),i=j.prepareSync();j.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId));f.ctx.now='2026-01-12T21:33:00Z';
 assert.deepEqual(j.prune(),{controls:0,requests:0});assert.equal(f.db.all('SELECT * FROM ask_control_requests').length,2);assert.deepEqual(f.db.all('PRAGMA foreign_key_check'),[]);
 f.ctx.now='2026-02-04T21:33:00Z';assert.deepEqual(j.prune(),{controls:0,requests:2});
});
test('stale empty page records response but cannot reconcile abandoned sync metadata',t=>{
 const f=fixture();t.after(f.close);const old=f.journal.prepareSync(),j=new AskControlJournal(f.db,()=>f.ctx),i=j.prepareSync();f.ctx.now='2026-01-05T21:33:00Z';j.acceptPage(i.operation.input.syncId,page(i.operation.input.syncId));
 assert.equal(j.barrier(),null);assert.equal(f.db.get<{state:string}>('SELECT state FROM ask_control_requests WHERE sync_id=?',old.operation.input.syncId)!.state,'abandoned');
});
test('SQL guards preserve frozen requests and suppression evidence',t=>{
 const f=fixture();t.after(f.close);deliver(f,[control()]);assert.throws(()=>f.db.run("UPDATE ask_privacy_controls SET conversation_id='other'"),/immutable/);assert.throws(()=>f.db.run("UPDATE ask_control_requests SET request='{}'"),/immutable/);
 deliver(f);assert.throws(()=>f.db.run('UPDATE ask_privacy_controls SET acknowledged_at=NULL'),/immutable/);assert.deepEqual(f.db.all('PRAGMA foreign_key_check'),[]);
 const id=f.journal.prepareSync().operation.input.syncId;
 assert.throws(()=>f.db.run("UPDATE ask_control_requests SET state='reconciled',resolved_by='forged' WHERE sync_id=?",id),/immutable/);
 assert.throws(()=>f.db.run("UPDATE ask_control_requests SET resolved_by='forged' WHERE state='complete'"),/immutable/);
});
test('schema25 migration preserves populated company, portfolio, rowids and spent independent authority',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);f.session(0);const x=f.claim();f.contribute(x);f.finish(x);const spent=f.authority.journal.counts(f.policy.authorityId,f.clock.now());
 const path=join(f.dir,'retained25.sqlite');f.store.db.exec(`VACUUM INTO '${path.replaceAll("'","''")}'`);const legacy=new DatabaseSync(path);removeEmptyAskMigration(legacy);
 const tables=(legacy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
 const before=Object.fromEntries(tables.map(n=>[n,legacy.prepare(`SELECT rowid,* FROM ${n} ORDER BY rowid`).all()]));legacy.close();
 for(let pass=0;pass<2;pass++){const db=new Store(path);try{
  for(const n of tables)assert.deepEqual(db.all(`SELECT rowid,* FROM ${n}${n==='schema_migrations'?' WHERE version<=25':''} ORDER BY rowid`),before[n],n);
  for(const n of ['ask_control_services','ask_control_requests','ask_privacy_controls'])assert.equal(db.all(`SELECT * FROM ${n}`).length,0);
  assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);assert.equal(db.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.throws(()=>db.run("UPDATE investment_journal SET journal_hash='tampered'"),/immutable/);
 }finally{db.close();}}
 assert.deepEqual(f.authority.journal.counts(f.policy.authorityId,f.clock.now()),spent);
});
