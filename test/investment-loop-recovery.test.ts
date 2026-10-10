import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loopFixture} from './fixtures/investment-loop/support.js';
import {Dispatcher} from '../src/control/dispatcher.js';
import {until} from './helpers.js';

test('SIGKILL between queued requests and occurrence commit recovers without duplicate dispatch',t=>{
 const f=loopFixture();t.after(f.close);const p=f.start(),o=f.occurrences(p.loopId).find(o=>o.stage==='research')!;f.at(o);
 const script=`import {Store} from ${JSON.stringify(pathToFileURL(join(process.cwd(),'dist/src/persistence/store.js')).href)};import {Company} from ${JSON.stringify(pathToFileURL(join(process.cwd(),'dist/src/control/company.js')).href)};const db=new Store(process.argv[1]),c=new Company(db,process.argv[2],process.cwd(),'fake');c.mandates.clock={now:()=>Date.parse(process.argv[3])};c.investmentTeam.runtime={type:'fake',runBoundedInvestment:async()=>{throw Error('No model allowed in crash fixture')}};c.investmentLoop.fault=p=>{if(p==='enqueue_before_occurrence_commit')process.kill(process.pid,'SIGKILL')};c.investmentLoop.tick();process.exit(99);`;
 const killed=spawnSync(process.execPath,['--input-type=module','-e',script,join(f.dir,'company.sqlite'),f.dir,f.clock.now()],{encoding:'utf8'});assert.equal(killed.signal,'SIGKILL',killed.stderr);assert.equal(f.store.all('SELECT * FROM investment_loop_requests').length,0);assert.equal(f.occurrences(p.loopId).find(n=>n.occurrence_id===o.occurrence_id)!.state,'pending');f.loop.tick();f.company.recover();f.loop.tick();assert.equal(f.store.all('SELECT * FROM investment_loop_requests').length,2);assert.equal(f.company.discussions.group(f.group.group_id).turns_used,2);assert.equal(f.runtime.calls.length,0);
});

test('existing dispatcher elapsed cutoff aborts two bounded fixture turns and fences late binding/configuration',async t=>{
 const f=loopFixture(),p=f.start(),o=f.occurrences(p.loopId).find(o=>o.stage==='research')!,start=Date.now(),offset=Date.parse(o.expires_at)-1200-start;f.company.mandates.clock={now:()=>Date.now()+offset};const signals:AbortSignal[]=[],lateErrors:string[]=[];
 f.runtime.gate=async(input,signal)=>{signals.push(signal);await new Promise<void>(r=>signal.addEventListener('abort',()=>r(),{once:true}));for(const callback of [()=>input.configured({model:'fake-model',reasoning_effort:'none',runtime_version:'fixture',runtime_adapter:'fake',execution_priority:input.execution.execution_priority!}),()=>input.bind({worker_id:input.worker.worker_id,runtime_type:'fake',runtime_reference:'late-fixture',workspace_path:input.worker.workspace_path,created_at:new Date().toISOString()})]){try{callback();}catch(e){lateErrors.push(String(e));}}return {status:'interrupted',settled:true,investmentUsage:{inputTokens:0,outputTokens:0,costMicros:0}};};
 const dispatcher=new Dispatcher(f.company,f.bounded);t.after(async()=>{await dispatcher.stop();await f.close();});dispatcher.start();await until(()=>signals.length===2);assert.equal(dispatcher.activeCount,2);await until(()=>signals.every(s=>s.aborted));await until(()=>dispatcher.activeCount===0);assert.ok(Date.now()-start>=900);assert.equal(lateErrors.length,4);assert.equal(f.store.all('SELECT * FROM investment_loop_executions').length,2);assert.equal(f.runtime.calls.length,2);await until(()=>f.occurrences(p.loopId).find(n=>n.occurrence_id===o.occurrence_id)!.state==='missed');assert.equal(f.occurrences(p.loopId).find(n=>n.occurrence_id===o.occurrence_id)!.state,'missed');
});
