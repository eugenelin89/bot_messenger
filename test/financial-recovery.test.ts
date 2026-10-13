import {removeEmptyResearchMigration} from './fixtures/investment/schema.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { fixture,request } from './fixtures/yahoo/support.js';
import { setup,buyTwo } from './fixtures/investment/support.js';

const tables=['financial_deliveries','financial_results','financial_observations','financial_payloads','financial_attempt_results','financial_attempts','financial_requests','financial_revocations','financial_scopes'];
test('populated schema22 repeatedly migrates inert23 preserving all old rows/rowids, ledger and files',t=>{
 const f=setup();t.after(f.close);buyTwo(f);const path=join(f.dir,'before23.sqlite');f.store.db.exec(`VACUUM INTO '${path.replaceAll("'","''")}'`);
 const legacy=new DatabaseSync(path);removeEmptyResearchMigration(legacy);for(const table of tables){assert.equal(legacy.prepare(`SELECT count(*) n FROM ${table}`).get()!.n,0);legacy.exec(`DROP TABLE ${table}`);}legacy.exec('DELETE FROM schema_migrations WHERE version=23');
 const oldTables=(legacy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
 const before=Object.fromEntries(oldTables.map(table=>[table,legacy.prepare(`SELECT rowid,* FROM ${table} ORDER BY rowid`).all()]));legacy.close();const files=readdirSync(f.dir).sort();
 for(let pass=0;pass<3;pass++){const db=new Store(path);try{for(const table of oldTables)assert.deepEqual(db.all(`SELECT rowid,* FROM ${table}${table==='schema_migrations'?' WHERE version<=22':''} ORDER BY rowid`),before[table],table);
  for(const table of tables)assert.equal(db.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0);assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);assert.equal(db.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');
 }finally{db.close();}}
 assert.deepEqual(readdirSync(f.dir).sort(),files);
});

test('SIGKILL after durable underlying request reservation preserves allowance and global uncertainty fence',async t=>{
 const f=fixture();t.after(f.close);const moduleUrl=(p:string)=>new URL(`../src/${p}.js`,import.meta.url).href;
 const script=`import {Store} from ${JSON.stringify(moduleUrl('persistence/store'))};import {MarketStore} from ${JSON.stringify(moduleUrl('control/market/store'))};import {FinancialStore} from ${JSON.stringify(moduleUrl('control/market/financial-store'))};import {FinancialDataGateway} from ${JSON.stringify(moduleUrl('control/market/financial-gateway'))};import {FixtureClock} from ${JSON.stringify(moduleUrl('control/investment'))};
 const store=new FinancialStore(new MarketStore(new Store(process.argv[1])));const adapter={kind:'yahoo-yfinance-v1',read:async(input,exchange)=>{await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});return '{}';}};const transport={kind:'authored_yahoo_fixture',exchange:()=>{process.stdout.write('RESERVED\\n');return new Promise(()=>{});}};
 await new FinancialDataGateway(store,new FixtureClock('2026-03-09T21:00:00.000Z'),adapter,transport).collect('yahoo-fixture',${JSON.stringify(request())},'crash');`;
 const child=spawn(process.execPath,['--input-type=module','-e',script,f.path],{stdio:['ignore','pipe','pipe']});t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
 await Promise.race([new Promise<void>((resolve,reject)=>{child.stdout.on('data',data=>{if(String(data).includes('RESERVED'))resolve();});child.once('error',reject);child.once('exit',()=>reject(new Error('early_child_exit')));}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(new Error('child_deadline')),5000);timer.unref();})]);
 const closed=once(child,'exit');child.kill('SIGKILL');await closed;
 const db=new Store(f.path);try{const store=new FinancialStore(new MarketStore(db)),gateway=new FinancialDataGateway(store,f.clock,f.adapter,f.transport);
  assert.equal((await gateway.collect(f.policy.id,request(),'crash')).status,'unknown');assert.equal((await gateway.collect(f.policy.id,request('actions'),'new')).reason,'financial_provider_uncertain_or_busy');
  assert.equal(f.queries.length,0);assert.equal(db.get<{n:number}>('SELECT count(*) n FROM financial_attempts')!.n,1);assert.equal(db.get<{n:number}>('SELECT count(*) n FROM financial_attempt_results')!.n,0);assert.equal(store.result('crash'),null);
 }finally{db.close();}
});
