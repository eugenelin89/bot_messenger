import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { Store, migration1, migration2, migration3, migration4 } from '../src/persistence/store.js';
import { migrateProjects } from '../src/persistence/projects-migration.js';
import { fixture } from './helpers.js';
import { approve, call, done, readyReview } from './engineering-helpers.js';
import type { Integration } from '../src/domain/engineering.js';

test('migration 6 preserves every original Prompt 05 row/field and performs no domain or filesystem operations', async t => {
  const f = fixture(); t.after(() => f.close()); const e = readyReview(f); const { review, integrator } = approve(f, e);
  const integration = call<Integration>(f, integrator, 'integrate_repository', { repository_id: e.repo.repository_id, review_id: review.review_id });
  assert.equal(integration.status, 'completed'); done(f, integrator); done(f, f.company.claimNext()!);
  const nix = f.company.initializeNix(); const op = f.company.infrastructure.operations().find(o => o.target_worker_id === nix.worker.worker_id)!;
  f.company.infrastructure.decide({ approval_id: op.approval_id, operation_id: op.operation_id, decision: 'approve' });
  for (const w of f.company.workers()) f.store.run('INSERT OR IGNORE INTO runtime_bindings (worker_id,runtime_type,runtime_reference,workspace_path,created_at,thread_name) VALUES (?,?,?,?,?,?)', w.worker_id, 'fake', 'preserved-'+w.worker_id, w.workspace_path, w.created_at, 'Preserved '+w.display_name);
  f.company.pause(true);
  const path = join(f.dir, 'original-v5.sqlite'); const old = new DatabaseSync(path);
  old.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  for (const [i, migration] of [migration1, migration2, migration3, migration4].entries()) { old.exec(migration); old.prepare('INSERT INTO schema_migrations VALUES (?,?)').run(i+1, 'original'); }
  migrateProjects(old); old.prepare('INSERT INTO schema_migrations VALUES (5,?)').run('original');
  const tables = (old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name!='schema_migrations' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(t=>t.name);
  old.exec('PRAGMA foreign_keys=OFF; DELETE FROM settings');
  const before: Record<string, unknown[]> = {}; const originalColumns: Record<string,string[]> = {};
  for (const table of tables) {
    const columns = (old.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c=>c.name);
    originalColumns[table]=columns;
    const rows = f.store.all<Record<string,string|number|null>>(`SELECT ${columns.join(',')} FROM ${table} ORDER BY 1`);
    for (const row of rows) old.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(c=>row[c]!));
    before[table] = old.prepare(`SELECT * FROM ${table} ORDER BY 1`).all();
  }
  assert.equal(old.prepare('PRAGMA foreign_key_check').all().length,0);old.close();
  const tree = () => readdirSync(f.dir,{recursive:true}).filter(p=>!String(p).startsWith('original-v5.sqlite')).sort(); const paths=tree();
  const migrated=new Store(path); t.after(()=>migrated.close());
  for (const table of tables) assert.deepEqual(migrated.all(`SELECT ${originalColumns[table]!.join(',')} FROM ${table} ORDER BY 1`),before[table],table);
  assert.deepEqual(tree(),paths);assert.equal(migrated.all('PRAGMA foreign_key_check').length,0);
  for(const table of ['client_hq','remote_devices','client_pairings','client_challenges','client_tokens','client_receipts','client_events'])assert.equal(migrated.all(`SELECT * FROM ${table}`).length,0,table);
  assert.equal(migrated.get<{n:number}>('SELECT max(version) n FROM schema_migrations')!.n,15);
});
