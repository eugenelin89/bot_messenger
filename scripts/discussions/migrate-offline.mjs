// Operator-only offline migration check. No Company, server, runtime or credentials.
import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {Store} from '../../dist/src/persistence/store.js';
const path=resolve(process.argv[2]??'');
assert.ok(path.startsWith('/var/backups/botsquad/prompt08-')&&path.endsWith('/offline/company.sqlite'),'Protected offline copy required');
const before=new DatabaseSync(path,{readOnly:true});
const tables=before.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
const saved=Object.fromEntries(tables.map(table=>[table,{columns:before.prepare(`PRAGMA table_info(${table})`).all().map(r=>r.name),rows:before.prepare(`SELECT rowid AS original_rowid,* FROM ${table} ORDER BY rowid`).all()}]));
const previous=before.prepare('SELECT max(version) n FROM schema_migrations').get().n;before.close();
for(let pass=0;pass<2;pass++){
  const migrated=new Store(path);
  for(const table of tables){
    const old=saved[table];const actual=migrated.all(`SELECT rowid AS original_rowid,${old.columns.join(',')} FROM ${table} ORDER BY rowid`);
    if(table==='schema_migrations')assert.deepEqual(actual.slice(0,old.rows.length),old.rows);
    else assert.deepEqual(actual,old.rows,`Original row/rowid/field changed: ${table}`);
  }
  assert.deepEqual(migrated.all('PRAGMA foreign_key_check'),[]);assert.equal(migrated.get('PRAGMA integrity_check').integrity_check,'ok');
  assert.equal(migrated.get('SELECT max(version) n FROM schema_migrations').n,10);assert.equal(migrated.get('SELECT count(*) n FROM working_groups').n,0);migrated.close();
}
console.log(JSON.stringify({offline:true,previous_schema:previous,schema:10,repeat_open_preserved:true,tables:tables.length,original_rows:Object.values(saved).reduce((n,t)=>n+t.rows.length,0),rowids_and_every_original_field_preserved:true,foreign_keys:'ok',integrity:'ok'}));
