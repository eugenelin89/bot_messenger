import assert from 'node:assert/strict';
import {Store} from '../../../src/persistence/store.js';
import {migration10} from '../../../src/persistence/discussions-migration.js';
export function removeEmptyTeamMigration(store:Store){
 const tables=store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'investment_team_%' ORDER BY rowid DESC");
 for(const {name} of tables){assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);store.db.exec(`DROP TABLE ${name}`);}
 store.db.exec('DROP TRIGGER discussion_execution_owner');store.db.exec(migration10.slice(migration10.indexOf('CREATE TRIGGER discussion_execution_owner'),migration10.indexOf('CREATE TRIGGER discussion_transcript_revision')));store.run('DELETE FROM schema_migrations WHERE version=18');
}
