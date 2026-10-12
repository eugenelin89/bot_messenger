// Child-process fault fixture. No provider, network transport or real authority is ever created.
import {writeFileSync} from 'node:fs';
import {finiteTransport} from './transport.js';
import {runningFiniteFixture} from './support.js';
const phase=process.argv[2]!,report=process.argv[3]!;
if(phase==='stdio_transmission'){
 const f=finiteTransport('hang'),j=f.authority.journal;Date.now=()=>Date.parse(f.clock.now());
 writeFileSync(report,JSON.stringify({root:f.company.dataDir,journal:j.path,custody:j.custodyPath,authorityId:f.policy.authorityId,scopeId:f.result.scope.scopeId,loopId:f.result.loop.loopId,at:f.clock.now()}));
 void f.runtime.runFiniteHQInvestment!(f.input,new AbortController().signal,f.policy).catch(()=>{});
 for(let i=0;i<200&&!f.methods().includes('turn/start');i++)await new Promise(r=>setTimeout(r,20));
 if(!f.methods().includes('turn/start'))throw Error('Fake transmission not reached');process.kill(process.pid,'SIGKILL');
 await new Promise(()=>{});
}
const f=runningFiniteFixture();f.session(0);
const journal=f.authority.journal;
f.store.db.exec(`VACUUM INTO '${f.company.dataDir.replaceAll("'","''")}/before.sqlite'`);
writeFileSync(report,JSON.stringify({root:f.company.dataDir,journal:journal.path,custody:journal.custodyPath,authorityId:f.policy.authorityId,scopeId:f.result.scope.scopeId,loopId:f.result.loop.loopId,at:f.clock.now()}));
const kill=()=>{process.kill(process.pid,'SIGKILL');throw Error('SIGKILL failed');};
if(phase==='reserve_db'){const original=journal.reserve.bind(journal);journal.reserve=(...args)=>{(journal as unknown as {custody:()=>void}).custody=kill;return original(...args);};}
if(phase==='reserve'){const original=journal.reserve.bind(journal);journal.reserve=(...args)=>{original(...args);kill();};}
if(phase==='claim'){f.company.claimWorkNext();kill();}
if(phase==='admission'){const original=journal.admit.bind(journal);journal.admit=(...args)=>{original(...args);kill();};}
const x=f.claim();if(phase==='transmission')kill();
f.contribute(x);
if(phase==='local_settlement')f.company.finiteHQ.finish=kill;
if(phase==='external_settlement'){const original=journal.settle.bind(journal);journal.settle=(...args)=>{original(...args);kill();};}
f.finish(x);throw Error('Crash boundary was not reached');
