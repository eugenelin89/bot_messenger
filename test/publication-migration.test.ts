import {removeEmptyTeamMigration} from './fixtures/investment/schema.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/persistence/store.js';
import { publicationFixture } from './fixtures/publication/support.js';
test('populated v16 including ledger and market evidence survives additive v17 with zero publication authority',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();removeEmptyTeamMigration(f.store);
 const added=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'investment_public_%' ORDER BY rowid DESC").map(r=>r.name);
 for(const name of added){assert.equal(f.store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);f.store.db.exec(`DROP TABLE ${name}`);}f.store.db.exec('DROP TRIGGER investment_public_capture');f.store.run('DELETE FROM schema_migrations WHERE version=17');
 const tables=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name),before=Object.fromEntries(tables.map(name=>[name,f.store.all(`SELECT rowid original_rowid,* FROM ${name} ORDER BY rowid`)]));
 for(let pass=0;pass<3;pass++){const upgraded=new Store(f.path);try{for(const name of tables)assert.deepEqual(upgraded.all(`SELECT rowid original_rowid,* FROM ${name}${name==='schema_migrations'?' WHERE version<=16':''} ORDER BY rowid`),before[name],name);for(const name of added)assert.equal(upgraded.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0,name);assert.equal(upgraded.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.deepEqual(upgraded.all('PRAGMA foreign_key_check'),[]);}finally{upgraded.close();}}
});
test('private accounting and public capture intents commit or roll back together without activating private outbox',t=>{
 const f=publicationFixture();t.after(f.cleanup);const p=f.service.preview(f.envelope);const before=f.sim.journal(f.config.runId).length;assert.throws(()=>f.store.transaction(()=>{f.order();throw new Error('rollback');}),/rollback/);
 assert.equal(f.sim.journal(f.config.runId).length,before);assert.equal(f.store.all('SELECT * FROM investment_public_intents WHERE channel_id=?',p.channelId).length,before);
 f.order('accepted');assert.equal(f.store.all('SELECT * FROM investment_public_intents WHERE channel_id=?',p.channelId).length,f.sim.journal(f.config.runId).length);assert.equal(f.store.all('SELECT * FROM investment_public_jobs').length,0);assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM investment_outbox WHERE state<>'disabled'")!.n,0);
});
