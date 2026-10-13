import assert from 'node:assert/strict';
import {Store} from '../../../src/persistence/store.js';
import {migration10} from '../../../src/persistence/discussions-migration.js';
export function removeEmptyFinancialMigration(store:Store){
 removeEmptyResearchMigration(store.db);
 // Disposable downgrade only; never drop populated financial evidence.
 for(const name of ['financial_deliveries','financial_results','financial_observations','financial_payloads','financial_attempt_results','financial_attempts','financial_requests','financial_revocations','financial_scopes']){assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);store.db.exec(`DROP TABLE ${name}`);}
 store.run('DELETE FROM schema_migrations WHERE version=23');
}
export function removeEmptyFiniteMigration(store:Store){
 removeEmptyFinancialMigration(store);
 // Disposable synthetic downgrade only: preserve every pre-v22 row and require inert additions.
 for(const name of ['investment_finite_controls','investment_finite_reservations','investment_private_runs','investment_setup_receipts','investment_setup_previews']){assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);store.db.exec(`DROP TABLE ${name}`);}
 store.run('DELETE FROM schema_migrations WHERE version=22');
}
export function removeUsageMigration(store:Store){
 removeEmptyFinancialMigration(store);
 // Disposable downgrade fixture only: erase the derived v20 reporting tables to recreate v19.
 for(const name of ['investment_finite_controls','investment_finite_reservations','investment_private_runs','investment_setup_receipts','investment_setup_previews','investment_credit_pilot','investment_activity_clock','investment_activity_invocations','ai_usage_responses','ai_usage_observations','ai_usage'])store.db.exec(`DROP TABLE IF EXISTS ${name}`);
 store.run('DELETE FROM schema_migrations WHERE version>=20');
}
export function removeEmptyLoopMigration(store:Store){
 removeUsageMigration(store);
 const tables=store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'investment_loop_%' OR name='investment_loops') ORDER BY rowid DESC");
 for(const {name} of tables){assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);store.db.exec(`DROP TABLE ${name}`);}
 store.run('DELETE FROM schema_migrations WHERE version=19');
}
export function removeEmptyTeamMigration(store:Store){
 removeEmptyLoopMigration(store);
 const tables=store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'investment_team_%' ORDER BY rowid DESC");
 for(const {name} of tables){assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);store.db.exec(`DROP TABLE ${name}`);}
 store.db.exec('DROP TRIGGER discussion_execution_owner');store.db.exec(migration10.slice(migration10.indexOf('CREATE TRIGGER discussion_execution_owner'),migration10.indexOf('CREATE TRIGGER discussion_transcript_revision')));store.run('DELETE FROM schema_migrations WHERE version=18');
}
/** Fixture-only inverse of v24; no research content may exist. Restores the v23 FK target. */
export function removeEmptyResearchMigration(db:import('node:sqlite').DatabaseSync){
 db.exec('PRAGMA foreign_keys=OFF');
 const triggers=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all() as {name:string;sql:string}[];
 for(const t of triggers)db.exec(`DROP TRIGGER "${t.name}"`);
 for(const name of ['investment_team_scopes','investment_activity_invocations','ai_usage']){
  const sql=(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name) as {sql:string}).sql,indices=db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(name) as {sql:string}[];
  db.exec(sql.replace(new RegExp(`CREATE TABLE ["']?${name}["']?`),`CREATE TABLE ${name}_legacy`).replaceAll('REFERENCES investment_run_identities','REFERENCES investment_runs'));
  const columns=(db.prepare(`PRAGMA table_info(${name})`).all() as {name:string}[]).map(c=>c.name).join(',');
  db.exec(`INSERT INTO ${name}_legacy(rowid,${columns}) SELECT rowid,* FROM ${name};DROP TABLE ${name};ALTER TABLE ${name}_legacy RENAME TO ${name};`);for(const i of indices)db.exec(i.sql);
 }
 for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'private_research_%' ORDER BY rowid DESC").all() as {name:string}[]){assert.equal(db.prepare('SELECT count(*) n FROM '+name).get()!.n,0);db.exec('DROP TABLE '+name);}
 db.exec('DROP TABLE investment_run_identities;DELETE FROM schema_migrations WHERE version=24');
 for(const t of triggers){if(t.name.startsWith('private_research_')||t.name.startsWith('investment_run_identity'))continue;let sql=t.sql;if(sql.includes('research_retention_active')){const begin=sql.indexOf('BEGIN'),head=sql.slice(0,begin),when=head.indexOf(' WHEN '),old=head.slice(when+6).match(/^([\s\S]*) AND\s+NOT \(research_retention_active/);sql=head.slice(0,when)+(old?' WHEN '+old[1]:'')+' BEGIN '+sql.slice(begin+5);}db.exec(sql);}
 db.exec('PRAGMA foreign_keys=ON');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
}
