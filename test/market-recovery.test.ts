import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Store } from '../src/persistence/store.js';
import { FixtureClock } from '../src/control/investment.js';
import { MarketStore } from '../src/control/market/store.js';
import { MarketCollector } from '../src/control/market/collector.js';
import { scheduledCalendar2026 } from '../src/domain/market/calendar.js';
import { uses,type SourcePolicy } from '../src/domain/market/types.js';
test('actual process kill after durable network admission preserves consumed attempt and suppresses replay',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'botsquad-market-kill-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'hq.sqlite');
 const at='2026-03-06T14:31:00.000Z',p:SourcePolicy={id:'kill-policy',version:1,provider:'synthetic-provider',feed:'invented-feed',mode:'synthetic_fixture',incrementalCost:'0',reviewedAt:'2026-01-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',rights:Object.fromEntries(uses.map(u=>[u,{status:'allowed',evidence:['synthetic:kill-test'],note:'Fixture only'}])) as SourcePolicy['rights'],attribution:'Fixture',maxObservationAgeMs:86400000,maxRequests:1,minIntervalMs:1000,cacheMs:0,timeoutMs:10000,maxBytes:4096};
 const db=new Store(path),store=new MarketStore(db),c=scheduledCalendar2026();store.register(p,'policy',at);store.register(c,'calendar',at);store.register({id:'ACME',venue:'XNYS',currency:'USD',source:'synthetic:instrument',symbols:[{symbol:'ACME',from:'2026-01-01',until:null}]},'instrument',at);db.close();
 const moduleUrl=(file:string)=>new URL(`../src/${file}.js`,import.meta.url).href;
 const script=`import {Store} from ${JSON.stringify(moduleUrl('persistence/store'))};import {MarketStore} from ${JSON.stringify(moduleUrl('control/market/store'))};import {MarketCollector} from ${JSON.stringify(moduleUrl('control/market/collector'))};import {FixtureClock} from ${JSON.stringify(moduleUrl('control/investment'))};const db=new Store(process.argv[1]);const c=new MarketCollector(new MarketStore(db),new FixtureClock('${at}'),{kind:'synthetic-json-v1',read:()=>{process.stdout.write('ADMITTED\\n');return new Promise(()=>{});}});await c.collect('kill-policy','${c.id}',{instrumentId:'ACME',session:'2026-03-06',field:'regular_open'},'crashed');`;
 const child=spawn(process.execPath,['--input-type=module','-e',script,path],{stdio:['ignore','pipe','pipe']});t.after(()=>{if(child.exitCode===null)child.kill('SIGKILL');});
 await Promise.race([new Promise<void>((resolve,reject)=>{child.stdout.on('data',data=>{if(String(data).includes('ADMITTED'))resolve();});child.once('error',reject);child.once('exit',code=>reject(new Error(`premature child exit ${code}`)));}),new Promise<never>((_,reject)=>{const timer=setTimeout(()=>reject(new Error('admission timeout')),5000);timer.unref();})]);
 const exited=once(child,'exit');child.kill('SIGKILL');await exited;
 const reopened=new Store(path);try{let calls=0;const clock=new FixtureClock('2026-03-06T14:32:00.000Z'),collector=new MarketCollector(new MarketStore(reopened),clock,{kind:'synthetic-json-v1',async read(){calls++;throw new Error('must not run');}}),request={instrumentId:'ACME',session:'2026-03-06',field:'regular_open' as const};
  assert.equal((await collector.collect(p.id,c.id,request,'crashed')).reason,'interrupted_attempt_requires_new_request');assert.equal((await collector.collect(p.id,c.id,request,'new')).reason,'finite_source_budget_exhausted');assert.equal(calls,0);
  assert.equal(reopened.get<{n:number}>('SELECT count(*) n FROM investment_market_attempts WHERE network=1')!.n,1);assert.equal(reopened.get<{n:number}>("SELECT count(*) n FROM investment_market_records WHERE kind='price'")!.n,0);
 }finally{reopened.close();}
});
