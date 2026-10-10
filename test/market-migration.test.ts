import {removeEmptyTeamMigration} from './fixtures/investment/schema.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/persistence/store.js';
import { setup,buyTwo } from './fixtures/investment/support.js';
test('populated schema15 ledger survives additive16 and repeated reopen byte-for-field; no authority is seeded',t=>{
 const f=setup();t.after(f.close);buyTwo(f);removeEmptyTeamMigration(f.store);
 for(const row of f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'investment_public_%' ORDER BY rowid DESC")){assert.equal(f.store.get<{n:number}>(`SELECT count(*) n FROM ${row.name}`)!.n,0);f.store.db.exec(`DROP TABLE ${row.name}`);}
 f.store.db.exec('DROP TRIGGER investment_public_capture');f.store.run('DELETE FROM schema_migrations WHERE version=17');
 const added=['investment_market_records','investment_market_attempts','investment_market_results'];
 for(const table of added){assert.equal(f.store.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0);}
 // Remove only freshly-created, empty16 tables to reconstruct the identical15 schema.
 for(const table of [...added].reverse())f.store.db.exec(`DROP TABLE ${table}`);
 f.store.run('DELETE FROM schema_migrations WHERE version=16');
 const tables=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name);
 const before=Object.fromEntries(tables.map(table=>[table,f.store.all(`SELECT rowid original_rowid,* FROM ${table} ORDER BY rowid`)]));
 for(let i=0;i<3;i++){const upgraded=new Store(f.path);try{
  for(const table of tables)assert.deepEqual(upgraded.all(`SELECT rowid original_rowid,* FROM ${table}${table==='schema_migrations'?' WHERE version<=15':''} ORDER BY rowid`),before[table],table);
  for(const table of added)assert.equal(upgraded.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0,table);
  assert.equal(upgraded.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.deepEqual(upgraded.all('PRAGMA foreign_key_check'),[]);
 }finally{upgraded.close();}}
});
