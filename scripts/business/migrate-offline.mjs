// Operator-only protected consistent copy; imports persistence, never Company/runtime.
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../../dist/src/persistence/store.js';
const path=resolve(process.argv[2]??'');assert.ok(/^\/var\/backups\/botsquad\/prompt11-[a-zA-Z0-9-]+\/offline\/company\.sqlite$/.test(path),'Protected offline copy required');
const old=new DatabaseSync(path,{readOnly:true});const tables=old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
const saved=Object.fromEntries(tables.map(t=>[t,{columns:old.prepare(`PRAGMA table_info(${t})`).all().map(c=>c.name),rows:old.prepare(`SELECT rowid AS original_rowid,* FROM ${t} ORDER BY rowid`).all()}]));const previous=old.prepare('SELECT max(version) n FROM schema_migrations').get().n;assert.equal(previous,13);old.close();
for(let pass=0;pass<3;pass++){const store=new Store(path);try{
  for(const table of tables){const s=saved[table],actual=store.all(`SELECT rowid AS original_rowid,${s.columns.join(',')} FROM ${table} ORDER BY rowid`);assert.deepEqual(table==='schema_migrations'?actual.slice(0,s.rows.length):actual,s.rows,table);}
  assert.equal(store.get('SELECT max(version) n FROM schema_migrations').n,14);assert.deepEqual(store.all('PRAGMA foreign_key_check'),[]);assert.equal(store.get('PRAGMA integrity_check').integrity_check,'ok');
  for(const table of ['business_grants','business_evidence','business_snapshots','external_actions','business_approvals','business_attempts','business_receipts','business_reads','business_controls','business_reconciliations'])assert.equal(store.get(`SELECT count(*) n FROM ${table}`).n,0);
}finally{store.close();}}
console.log(JSON.stringify({offline:true,previous_schema:previous,schema:14,repeated_opens:3,tables:tables.length,original_rows:Object.values(saved).reduce((n,t)=>n+t.rows.length,0),every_original_rowid_and_field_preserved:true,zero_new_business_authority:true,integrity:'ok',foreign_keys:'ok',runtime_invoked:false}));
