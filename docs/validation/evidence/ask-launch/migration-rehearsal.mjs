// Protected copy only. No Company, Dispatcher, credentials, model or network client.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {Store} from '/var/tmp/botsquad-ask-launch-20261014-hq/dist/src/persistence/store.js';
const [path,out]=process.argv.slice(2);
if(!path.startsWith('/var/tmp/botsquad-ask-migration-20261014/'))throw Error('Only isolated migration copy allowed');
const encode=v=>v instanceof Uint8Array?{binary:Buffer.from(v).toString('base64')}:Array.isArray(v)?v.map(encode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)])):v;
const digest=rows=>createHash('sha256').update(JSON.stringify(encode(rows))).digest('hex');
let db=new DatabaseSync(path,{readOnly:true});db.exec('PRAGMA query_only=ON; BEGIN;');
const oldVersion=db.prepare('SELECT max(version) n FROM schema_migrations').get().n;if(oldVersion!==25)throw Error('Expected schema25 copy');
const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='schema_migrations' ORDER BY name").all().map(r=>r.name);
const before=Object.fromEntries(tables.map(name=>{const rows=db.prepare(`SELECT rowid AS _rowid_,* FROM "${name}" ORDER BY rowid`).all();return[name,{rows:rows.length,digest:digest(rows)}]}));db.close();
for(let n=0;n<3;n++){const store=new Store(path);if(store.db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||store.db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Integrity failed');store.close();}
db=new DatabaseSync(path,{readOnly:true});db.exec('PRAGMA query_only=ON; BEGIN;');
for(const name of tables){const rows=db.prepare(`SELECT rowid AS _rowid_,* FROM "${name}" ORDER BY rowid`).all();if(rows.length!==before[name].rows||digest(rows)!==before[name].digest)throw Error('Retained table changed: '+name);}
const added=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ask_%' ORDER BY name").all().map(r=>({table:r.name,rows:db.prepare(`SELECT count(*) n FROM "${r.name}"`).get().n}));
if(added.some(r=>r.rows!==0))throw Error('Ask migration created operational state');
const result={checkedAt:new Date().toISOString(),oldVersion,newVersion:db.prepare('SELECT max(version) n FROM schema_migrations').get().n,reopens:3,retainedTables:before,added,integrity:'ok',foreignKeyErrors:0,productionModified:false,modelOrNetworkCalls:0};
writeFileSync(out,JSON.stringify(result,null,2),{mode:0o600});db.close();console.log(JSON.stringify({oldVersion:25,newVersion:result.newVersion,retainedTables:tables.length,addedEmpty:added.length,reopens:3,integrity:'ok'}));
