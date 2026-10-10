import assert from 'node:assert/strict';
import {Store} from '../../../src/persistence/store.js';
import {migration10} from '../../../src/persistence/discussions-migration.js';
export function removeUsageMigration(store:Store){
 // Disposable downgrade fixture only: erase the derived v20 reporting tables to recreate v19.
 for(const name of ['investment_credit_pilot','investment_activity_clock','investment_activity_invocations','ai_usage_responses','ai_usage_observations','ai_usage'])store.db.exec(`DROP TABLE IF EXISTS ${name}`);
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
