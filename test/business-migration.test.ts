import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {join} from 'node:path';
import {readdirSync} from 'node:fs';
import {Store,migration1,migration2,migration3,migration4} from '../src/persistence/store.js';
import {migrateProjects} from '../src/persistence/projects-migration.js';
import {migration6} from '../src/persistence/client-migration.js';
import {migrateConversations,migration8} from '../src/persistence/conversations-migration.js';
import {migration9} from '../src/persistence/research-migration.js';
import {migration10} from '../src/persistence/discussions-migration.js';
import {migrateMandates,migration12} from '../src/persistence/mandates-migration.js';
import {migration13} from '../src/persistence/computer-migration.js';
import {fixture,objective} from './helpers.js';

test('populated v13 migrates repeatedly preserving every original rowid/field and creating zero authority',async t=>{
  const f=fixture();t.after(()=>f.close());const atlas=f.company.initializeCEO();f.company.initializeNix();
  f.company.createTask('human',atlas,objective,null,'product');
  const m=f.company.mandates.create({title:'Retained operating mandate',objective:'Retained objective',success_criteria:'Retained evidence',stop_criteria:'No authority',constraints:'Private',resources:'Unknown cost',coordinator_id:atlas.worker_id,envelope:{}});
  f.company.mandates.admitObservation({mandate_id:m.mandate_id,cycle_id:null,initiative_id:null,mode:'owner_provided',name:'Retained observation',value:null,unit:null,observed_at:null,period:null,source:'owner:retained',provenance:'Original owner entry',limitations:'Unknown',missingness:'No measured result',body:'Private retained source'});
  const path=join(f.dir,'populated-v13.sqlite'),old=new DatabaseSync(path);
  old.exec('PRAGMA foreign_keys=OFF;CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const [i,migration] of [migration1,migration2,migration3,migration4,migrateProjects,migration6,migrateConversations,migration8,migration9,migration10,migrateMandates,migration12,migration13].entries()){
    if(typeof migration==='string')old.exec(migration);else migration(old);old.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(i+1,'retained-v13');
  }
  const tables=(old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'schema_migrations' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
  const triggers=old.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all() as {name:string;sql:string}[];
  for(const trigger of triggers)old.exec(`DROP TRIGGER ${trigger.name}`);
  for(const table of tables){const columns=(old.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(r=>r.name);old.exec(`DELETE FROM ${table}`);
    for(const row of f.store.all<Record<string,SQLInputValue>>(`SELECT rowid AS original_rowid,${columns.join(',')} FROM ${table} ORDER BY rowid`))old.prepare(`INSERT INTO ${table}(rowid,${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')},?)`).run(row.original_rowid!,...columns.map(c=>row[c]!));
  }
  for(const trigger of triggers)old.exec(trigger.sql);
  assert.deepEqual(old.prepare('PRAGMA foreign_key_check').all(),[]);assert.equal(old.prepare('SELECT max(version) n FROM schema_migrations').get()!.n,13);
  const originals=Object.fromEntries([...tables,'schema_migrations'].map(table=>[table,old.prepare(`SELECT rowid AS original_rowid,* FROM ${table} ORDER BY rowid`).all()]));old.close();
  const files=()=>readdirSync(f.dir,{recursive:true}).filter(x=>!String(x).startsWith('populated-v13.sqlite')).sort(),paths=files();
  for(let pass=0;pass<3;pass++){const store=new Store(path);try{
    for(const table of tables)assert.deepEqual(store.all(`SELECT rowid AS original_rowid,* FROM ${table} ORDER BY rowid`),originals[table],table);
    assert.deepEqual(store.all('SELECT rowid AS original_rowid,* FROM schema_migrations WHERE version<=13 ORDER BY rowid'),originals.schema_migrations);
    assert.equal(store.get<{n:number}>('SELECT max(version) n FROM schema_migrations')!.n,16);
    for(const table of ['business_grants','business_evidence','external_actions','business_approvals','business_attempts','business_receipts','business_controls','business_reads'])assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0,table);
    assert.deepEqual(store.all('PRAGMA foreign_key_check'),[]);assert.equal(store.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.deepEqual(files(),paths);
  }finally{store.close();}}
});
