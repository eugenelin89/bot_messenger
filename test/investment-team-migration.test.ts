import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../src/persistence/store.js';
import {publicationFixture} from './fixtures/publication/support.js';
import {removeEmptyTeamMigration} from './fixtures/investment/schema.js';
test('populated schema17 ledger, market, grant and publication queue survive18 with zero new employee authority',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();const p=f.service.preview(f.envelope);f.service.consent({previewId:p.id,digest:p.digest});removeEmptyTeamMigration(f.store);const tables=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name),before=Object.fromEntries(tables.map(name=>[name,f.store.all(`SELECT rowid original_rowid,* FROM ${name} ORDER BY rowid`)]));for(let i=0;i<3;i++){const upgraded=new Store(f.path);try{for(const name of tables)assert.deepEqual(upgraded.all(`SELECT rowid original_rowid,* FROM ${name}${name==='schema_migrations'?' WHERE version<=17':''} ORDER BY rowid`),before[name],name);for(const {name} of upgraded.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'investment_team_%'"))assert.equal(upgraded.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);assert.deepEqual(upgraded.all('PRAGMA foreign_key_check'),[]);}finally{upgraded.close();}}
});
