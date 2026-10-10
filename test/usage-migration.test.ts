import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {fixture,objective} from './helpers.js';
import {Store} from '../src/persistence/store.js';
import {removeUsageMigration} from './fixtures/investment/schema.js';
test('populated schema19 upgrades repeatedly without rewriting history or fabricating usage',async t=>{
 const f=fixture();t.after(()=>f.close());f.company.assignObjective(objective);const c=f.company.claimNext()!;f.company.finish(c.execution.execution_id,{status:'failed',settled:true,error:'Pre-migration fixture'});removeUsageMigration(f.store);
 const tables=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name);
 const before=Object.fromEntries(tables.map(name=>[name,f.store.all(`SELECT rowid original_rowid,* FROM ${name} ORDER BY rowid`)]));
 for(let i=0;i<3;i++){const upgraded=new Store(join(f.dir,'company.sqlite'));try{for(const name of tables)assert.deepEqual(upgraded.all(`SELECT rowid original_rowid,* FROM ${name}${name==='schema_migrations'?' WHERE version<=19':''} ORDER BY rowid`),before[name],name);assert.equal(upgraded.get<{n:number}>('SELECT max(version) n FROM schema_migrations')!.n,20);const row=upgraded.get<{tokens:null;price:null;status:string;reasons:string}>('SELECT * FROM ai_usage WHERE execution_id=?',c.execution.execution_id)!;assert.equal(row.tokens,null);assert.equal(row.price,null);assert.equal(row.status,'failed');assert.match(row.reasons,/predates/);assert.deepEqual(upgraded.all('PRAGMA foreign_key_check'),[]);}finally{upgraded.close();}}
});
import {loopFixture} from './fixtures/investment-loop/support.js';
test('schema19 populated investment execution keeps exact run/worker/cycle attribution after backfill',async t=>{
 const f=loopFixture();t.after(f.close);const plan=f.start(),o=f.occurrences(plan.loopId).find(o=>o.stage==='research')!;f.at(o);f.loop.tick();const c=f.claim();f.contribute(c);f.measured(c);const original=f.store.get('SELECT * FROM investment_loop_executions WHERE execution_id=?',c.execution.execution_id);removeUsageMigration(f.store);
 for(let n=0;n<2;n++){const db=new Store(join(f.dir,'company.sqlite'));try{assert.deepEqual(db.get('SELECT * FROM investment_loop_executions WHERE execution_id=?',c.execution.execution_id),original);const usage=db.get<{run_id:string;scope_id:string;cycle_id:string;worker_id:string;tokens:null}>('SELECT * FROM ai_usage WHERE execution_id=?',c.execution.execution_id)!;assert.equal(usage.run_id,f.config.runId);assert.equal(usage.scope_id,f.scope.scopeId);assert.equal(usage.cycle_id,o.occurrence_id);assert.equal(usage.worker_id,c.worker.worker_id);assert.equal(usage.tokens,null);assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);}finally{db.close();}}
});
