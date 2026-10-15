import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {runningFiniteFixture} from './fixtures/finite-hq/support.js';
import {Store} from '../src/persistence/store.js';

test('schema30 is inert and preserves all populated schema29 rows across repeated opens',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);f.session(0);const x=f.claim();f.contribute(x);f.finish(x);
 const path=join(f.company.dataDir,'retained-schema29.sqlite');f.store.db.exec(`VACUUM INTO '${path.replaceAll("'","''")}'`);const old=new DatabaseSync(path);assert.equal(old.prepare('SELECT count(*) n FROM observed_source_continuations').get()!.n,0);old.exec('DROP TABLE observed_model_continuations;DELETE FROM schema_migrations WHERE version=31;DROP TABLE observed_source_continuations;DELETE FROM schema_migrations WHERE version=30');
 const names=(old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name),before=Object.fromEntries(names.map(n=>[n,old.prepare('SELECT rowid original_rowid,* FROM '+n+' ORDER BY rowid').all()]));old.close();
 for(let pass=0;pass<2;pass++){const db=new Store(path);try{for(const n of names)assert.deepEqual(db.all('SELECT rowid original_rowid,* FROM '+n+(n==='schema_migrations'?' WHERE version<=29':'')+' ORDER BY rowid'),before[n],n);assert.equal(db.get<{n:number}>('SELECT count(*) n FROM observed_source_continuations')!.n,0);assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);assert.equal(db.get<{n:number}>('SELECT max(version) n FROM schema_migrations')!.n,31);}finally{db.close();}}
 const future=new DatabaseSync(path);future.prepare('INSERT INTO schema_migrations VALUES(32,?)').run('future');future.close();assert.throws(()=>new Store(path),/Unsupported future HQ schema/);
});
