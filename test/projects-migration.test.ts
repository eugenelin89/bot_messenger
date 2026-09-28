import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {readdirSync} from 'node:fs';
import {Store,migration1,migration2,migration3,migration4} from '../src/persistence/store.js';
import type {Integration} from '../src/domain/engineering.js';
import {fixture} from './helpers.js';
import {approve,call,done,readyReview} from './engineering-helpers.js';

test('retained Prompt 04 database migrates every original table and field without replay or filesystem changes',async t=>{
  const f=fixture();t.after(()=>f.close());const e=readyReview(f);const {review,integrator}=approve(f,e);
  const integration=call<Integration>(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});assert.equal(integration.status,'completed');done(f,integrator);done(f,f.company.claimNext()!);
  const nix=f.company.initializeNix();const op=f.company.infrastructure.operations().find(o=>o.target_worker_id===nix.worker.worker_id)!;
  f.company.infrastructure.decide({approval_id:op.approval_id,operation_id:op.operation_id,decision:'approve'});
  for(const w of f.company.workers())f.store.run('INSERT OR IGNORE INTO runtime_bindings (worker_id,runtime_type,runtime_reference,workspace_path,created_at,thread_name) VALUES (?,?,?,?,?,?)',w.worker_id,'fake','retained-'+w.worker_id,w.workspace_path,w.created_at,'Retained '+w.display_name);
  f.store.run("UPDATE workers SET ai_model='retained-model',reasoning_effort='high',execution_priority='high' WHERE worker_id=?",e.linus.worker_id);
  const path=join(f.dir,'retained-v4.sqlite');const old=new DatabaseSync(path);old.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const [i,migration] of [migration1,migration2,migration3,migration4].entries()){old.exec(migration);old.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(i+1,'retained');}
  const tables=(old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name!='schema_migrations' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(t=>t.name);
  old.exec('PRAGMA foreign_keys=OFF');
  old.exec('DELETE FROM settings');
  const before:Record<string,unknown[]>={};
  for(const table of tables){
    const columns=(old.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);
    const rows=f.store.all<Record<string,string|number|null>>(`SELECT ${columns.join(',')} FROM ${table} ORDER BY 1`);
    for(const row of rows)old.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(c=>row[c]!));
    before[table]=old.prepare(`SELECT * FROM ${table} ORDER BY 1`).all();
  }
  assert.ok(before.repositories!.length&&before.submissions!.length&&before.reviews!.length&&before.integrations!.length);
  assert.ok(before.approvals!.length&&before.protected_operations!.length&&before.host_operation_receipts!.length&&before.worker_os_identities!.length&&before.runtime_bindings!.length);
  assert.equal(old.prepare('PRAGMA foreign_key_check').all().length,0);old.close();
  const paths=readdirSync(f.company.dataDir,{recursive:true}).filter(p=>!String(p).startsWith('retained-v4.sqlite')).sort();
  const migrated=new Store(path);t.after(()=>migrated.close());
  for(const table of tables){
    const rows=migrated.all<Record<string,unknown>>(`SELECT * FROM ${table} ORDER BY 1`);assert.equal(rows.length,before[table]!.length,table);
    for(const [i,row] of (before[table] as Record<string,unknown>[]).entries())for(const [key,value] of Object.entries(row))assert.deepEqual(rows[i]![key],value,`${table}.${key}`);
  }
  assert.deepEqual(readdirSync(f.company.dataDir,{recursive:true}).filter(p=>!String(p).startsWith('retained-v4.sqlite')).sort(),paths);
  assert.equal(migrated.all('SELECT * FROM projects').length,1);assert.equal(migrated.get<{source_kind:string}>('SELECT * FROM repositories')!.source_kind,'legacy_squadstatus');
  assert.equal(migrated.get<{commit_list:string|null}>('SELECT * FROM submissions')!.commit_list,null);assert.equal(migrated.all('SELECT * FROM review_rounds').length,0);
  assert.equal(migrated.get<{manifest_hash:string}>('SELECT * FROM allocations')!.manifest_hash,'legacy-unrecorded');assert.equal(migrated.all('PRAGMA foreign_key_check').length,0);
});
