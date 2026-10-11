import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,writeFileSync,readFileSync,rmSync,chmodSync,copyFileSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {authorityDirectory,PilotLineage,issuePermit,inspectOriginal,type OriginalPilot,type Successor} from '../src/control/usage/pilot-lineage.js';
import {pilotFixture} from './fixtures/credit-pilot.js';
import {supervisePilot} from '../scripts/credit-pilot/supervise.js';
import {stopSuccessor,finalizeContinuation} from '../scripts/credit-pilot/continuation.js';
import {CodexRuntime} from '../src/runtime/codex.js';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
const sha='1'.repeat(40),verified={fingerprint:'a'.repeat(64),routingFingerprint:'b'.repeat(64)};
function fixture(prepared=true){
 const f=pilotFixture(),dir=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-lineage-test-'))),file=join(dir,'lineage.sqlite');
 const original:OriginalPilot={pilotId:'original-fixture',scopeId:'original-revoked',executionId:'original-failed',model:'test-model',archive:join(dir,'original-archive'),archiveDigest:'f'.repeat(64),rosterHash:'e'.repeat(64),workerId:f.roster[0]!.worker_id,source:sha,files:{}};
 const ledger=PilotLineage.create(file,original,new Date().toISOString());
 const s:Successor={pilotId:f.manifest.pilotId,root:f.root,scopeId:f.manifest.scopeId,groupId:f.manifest.groupId,runId:f.manifest.runId,workerId:original.workerId,model:original.model,source:sha,expiresAt:f.envelope.expiresAt};
 if(prepared){ledger.prepare(s);ledger.bindAccount(s,verified);f.company.creditPilot.attach(ledger,s);}
 return {...f,ledger,s,file,dir,original,cleanup(){ledger.close();if(f.store.db.isOpen)f.close();rmSync(dir,{recursive:true,force:true});}};
}
async function child(code:string){return await new Promise<number|null>((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','ignore','pipe']});let err='';p.stderr.on('data',d=>err+=d);p.once('error',reject);p.once('exit',n=>n===null||n===0||n===7?resolve(n):reject(Error(err)));});}
const moduleUrl=new URL('../src/control/usage/pilot-lineage.js',import.meta.url).href;
function script(f:ReturnType<typeof fixture>,body:string){return `import {PilotLineage} from ${JSON.stringify(moduleUrl)};const l=new PilotLineage(${JSON.stringify(f.file)}),s=${JSON.stringify(f.s)};${body}`;}

test('inherited original reservation leaves three, one successor consumes two and success releases nothing further',t=>{
 const f=fixture();t.after(f.cleanup);assert.equal(f.company.creditPilot.count(),1);assert.equal(f.company.creditPilot.localCount(),0);assert.equal(4-f.ledger.row().consumed,3);
 const c=f.claim();assert.equal(f.ledger.row().consumed,2);assert.equal(f.company.creditPilot.localCount(),1);assert.equal(f.company.claimWorkNext(),undefined);
 f.ledger.admit(f.s,f.input(c),verified);f.complete(c);
 assert.equal(f.ledger.row().state,'stopped');assert.equal(f.ledger.row().uncertain,0);assert.equal(f.company.creditPilot.count(),2);assert.equal(4-f.ledger.row().consumed,2);
 assert.throws(()=>f.release());assert.throws(()=>f.ledger.release(f.s,c.request.request_id));assert.throws(()=>f.ledger.prepare({...f.s,pilotId:'another'}));assert.equal(f.company.claimWorkNext(),undefined);
 assert.equal(f.ledger.original().executionId,'original-failed');assert.equal(f.ledger.original().scopeId,'original-revoked');assert.equal(f.ledger.row().release_count,1);
});
test('duplicate releases and mismatched worker/request/source/root never acquire another authority',t=>{
 const f=fixture();t.after(f.cleanup);const r=f.release();assert.throws(()=>f.release());
 for(const s of [{...f.s,source:'2'.repeat(40)},{...f.s,root:f.dir},{...f.s,pilotId:'copied'}])assert.throws(()=>f.ledger.reserve(s,r.request_id,'execution','wrong'));
 assert.throws(()=>f.ledger.reserve(f.s,'wrong','execution',f.s.workerId));assert.throws(()=>f.ledger.reserve(f.s,r.request_id,'execution',f.roster[1]!.worker_id));assert.equal(f.ledger.row().consumed,1);
});
test('external reservation survives local claim rollback and restart without refund',t=>{
 const f=fixture();t.after(f.cleanup);f.release();f.store.db.exec("CREATE TEMP TRIGGER fail_continuation BEFORE INSERT ON investment_activity_invocations BEGIN SELECT RAISE(ABORT,'crash after external reservation'); END");
 assert.throws(()=>f.company.claimWorkNext(),/crash after/);assert.equal(f.ledger.row().consumed,2);assert.equal(f.ledger.row().uncertain,1);assert.equal(f.company.creditPilot.localCount(),0);assert.equal(f.store.all('SELECT * FROM executions').length,0);
 f.company.recover();assert.equal(f.ledger.row().state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);assert.throws(()=>f.release());
 const reopened=new PilotLineage(f.file);try{assert.equal(reopened.row().consumed,2);assert.equal(reopened.row().uncertain,1);}finally{reopened.close();}
});
for(const point of ['before-reserve','after-reserve','after-admit'])test('process kill '+point+' never replays',async t=>{
 const f=fixture();t.after(f.cleanup);
 if(point==='before-reserve'){const request=f.queued()[0]!.request_id;await child(script(f,`l.release(s,${JSON.stringify(request)});process.kill(process.pid,'SIGKILL')`));f.ledger.recover();assert.equal(f.ledger.row().consumed,1);assert.equal(f.ledger.row().release_count,1);assert.equal(f.ledger.row().state,'stopped');assert.throws(()=>f.ledger.reserve(f.s,request,'after-crash',f.s.workerId));return;}
 const r=f.release();
 if(point==='after-reserve')await child(script(f,`l.reserve(s,${JSON.stringify(r.request_id)},'lost-execution',s.workerId);process.kill(process.pid,'SIGKILL')`));
 else {const c=f.company.claimWorkNext();assert.ok(c?.origin==='conversation');await child(script(f,`l.admit(s,${JSON.stringify(f.input(c))},${JSON.stringify(verified)});process.kill(process.pid,'SIGKILL')`));}
 f.ledger.recover();assert.equal(f.ledger.row().consumed,2);assert.equal(f.ledger.row().state,'stopped');assert.equal(f.ledger.row().uncertain,1);assert.throws(()=>f.ledger.release(f.s,r.request_id));
});
test('restart after unused release clears authority without restoring a release',t=>{
 const f=fixture();t.after(f.cleanup);f.release();f.company.recover();assert.equal(f.ledger.row().consumed,1);assert.equal(f.ledger.row().release_count,1);assert.equal(f.ledger.row().state,'stopped');assert.throws(()=>f.release());
});
test('two processes preparing different successors serialize to one',async t=>{
 const f=fixture(false);t.after(f.cleanup);const otherRoot=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-inert-')));t.after(()=>rmSync(otherRoot,{recursive:true,force:true}));
 const a=script(f,"try{l.prepare(s);l.close();}catch{process.exit(7)}"),b=script(f,`s.root=${JSON.stringify(otherRoot)};s.pilotId='competitor';try{l.prepare(s);l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(a),child(b)])).sort(),[0,7]);assert.equal(f.ledger.row().consumed,1);assert.equal(f.ledger.receipts().filter(r=>r.kind==='successor_prepared').length,1);
});
test('two processes reserving and admitting copied execution state consume once each',async t=>{
 const f=fixture();t.after(f.cleanup);const r=f.release();const reserve=script(f,`try{l.reserve(s,${JSON.stringify(r.request_id)},'competing-execution',s.workerId);l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(reserve),child(reserve)])).sort(),[0,7]);assert.equal(f.ledger.row().consumed,2);
 const input={mode:'conversation',execution:{execution_id:'competing-execution'},request:{request_id:r.request_id},worker:{worker_id:f.s.workerId,ai_model:f.s.model,workspace_path:join(f.root,'workspaces',f.s.workerId)}};
 const admit=script(f,`try{l.admit(s,${JSON.stringify(input)},${JSON.stringify(verified)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(admit),child(admit)])).sort(),[0,7]);assert.equal(f.ledger.receipts().filter(r=>r.kind==='admission_consumed').length,1);
});
test('lost response, copied company database and late completion preserve uncertainty and no replay',t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim();f.ledger.admit(f.s,f.input(c),verified);f.ledger.recover();
 const db=new Store(join(f.root,'company.sqlite'));try{const company=new Company(db,f.root,process.cwd());company.creditPilot.attach(f.ledger,f.s);company.recover();assert.equal(company.claimWorkNext(),undefined);assert.equal(company.creditPilot.count(),2);}finally{db.close();}
 f.ledger.finish(c.execution.execution_id,'completed',true);assert.equal(f.ledger.row().state,'stopped');assert.equal(f.ledger.row().uncertain,1);assert.throws(()=>f.ledger.admit(f.s,f.input(c),verified));
});
test('deleted disposable workspace retains consumed identity and prevents replacement',t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim();f.close();rmSync(f.root,{recursive:true,force:true});assert.equal(f.ledger.row().consumed,2);assert.equal(f.ledger.row().execution_id,c.execution.execution_id);f.ledger.recover();assert.throws(()=>f.ledger.prepare({...f.s,root:f.dir,pilotId:'replacement'}));
});
test('fifth cumulative reservation is rejected by persistent schema and reservation gate',t=>{
 const f=fixture();t.after(f.cleanup);f.release();f.ledger.close();
 // Fault fixture models an already-consumed absolute ceiling, never production reset authority.
 execFileSync(process.execPath,['--input-type=module','-e',`import{DatabaseSync}from'node:sqlite';const d=new DatabaseSync(${JSON.stringify(f.file)});d.exec('UPDATE lineage SET consumed=4');try{d.exec('UPDATE lineage SET consumed=5');process.exit(9)}catch{}d.close()`]);
 const l=new PilotLineage(f.file);t.after(()=>l.close());assert.throws(()=>l.reserve(f.s,f.queued()[0]!.request_id,'fifth',f.s.workerId));assert.equal(l.row().consumed,4);
});
test('account/routing change and five-minute local deadline fail admission',t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim();
 for(const v of [{...verified,fingerprint:'c'.repeat(64)},{...verified,routingFingerprint:'c'.repeat(64)}])assert.throws(()=>f.ledger.admit(f.s,f.input(c),v),/account or routing/);
 const real=Date.now;t.mock.method(Date,'now',()=>real()+300001);assert.throws(()=>f.ledger.admit(f.s,f.input(c),verified),/admission/);assert.equal(f.ledger.row().consumed,2);
});
test('expired/stopped lineage and stale billing cannot release from new directories',t=>{
 const f=fixture();t.after(f.cleanup);const request=f.queued()[0]!.request_id,real=Date.now;t.mock.method(Date,'now',()=>real()+86400001);assert.throws(()=>f.ledger.release(f.s,request),/expired|stale/);assert.throws(()=>f.ledger.prepare({...f.s,root:f.dir}));assert.equal(f.ledger.row().consumed,1);
});
test('runtime refuses fixtures, forged permit and no-op callbacks before provider startup',async t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim(),input={...f.input(c),admitSubscription:()=>{}};
 assert.throws(()=>issuePermit(f.ledger,f.s),/Trusted/);
 for(const permit of [undefined,{kind:'decision037-one-atlas-turn' as const}]){const runtime=new CodexRuntime({command:'/must-never-execute',creditPilot:{pilotId:f.s.pilotId,disposableRoot:f.root,model:'test-model',permit}});await assert.rejects(runtime.runSubscriptionInvestment!(input,new AbortController().signal,f.policy),/Durable supervisor/);}
});
test('missing, replaced or non-private authority fails closed; ordinary reopen preserves receipts',t=>{
 const f=fixture();t.after(f.cleanup);const receipts=f.ledger.receipts();const l=new PilotLineage(f.file);assert.deepEqual(l.receipts(),receipts);l.close();
 chmodSync(f.file,0o644);assert.throws(()=>new PilotLineage(f.file),/owner-private/);chmodSync(f.file,0o600);
 const copy=join(f.dir,'copy.sqlite');copyFileSync(f.file,copy);chmodSync(copy,0o600);renameSync(copy,f.file);assert.throws(()=>f.ledger.row(),/replaced/);
 assert.throws(()=>new PilotLineage(join(f.dir,'missing.sqlite')));
});
test('retained stopped archive inspection preserves all original bytes and revoked history',t=>{
 const f=pilotFixture();t.after(()=>{if(f.store.db.isOpen)f.close();});const c=f.claim();f.company.finish(c.execution.execution_id,{status:'awaiting_approval',settled:false,error:'fixture startup failure'});f.company.creditPilot.stop();f.company.investmentTeam.control({scopeId:f.manifest.scopeId,action:'revoke'});
 const roster=f.roster.map((w,i)=>({...w,display_name:i===0?'Atlas':'Maya'}));const hash=createHash('sha256').update(JSON.stringify(roster)).digest('hex');
 writeFileSync(join(f.root,'roster.json'),JSON.stringify(roster));writeFileSync(join(f.root,'manifest.json'),JSON.stringify({...f.manifest,rosterHash:hash}));writeFileSync(join(f.root,'accepted-source.json'),JSON.stringify({sha}));writeFileSync(join(f.root,'final-inspection.json'),JSON.stringify({pilot:f.company.creditPilot.get(),reserved:1}));f.close();writeFileSync(join(f.root,'company.sqlite-wal'),'');
 const before=readFileSync(join(f.root,'company.sqlite')),o=inspectOriginal(f.root);assert.equal(o.executionId,c.execution.execution_id);assert.deepEqual(readFileSync(join(f.root,'company.sqlite')),before);assert.equal(inspectOriginal(f.root,o.archiveDigest).archiveDigest,o.archiveDigest);assert.throws(()=>inspectOriginal(f.root,'f'.repeat(64)),/digest/);
});


test('HOME and CODEX_HOME cannot select a fresh production authority',t=>{
 const f=fixture();t.after(f.cleanup);
 const result=execFileSync(process.execPath,['--input-type=module','-e',`import {authorityDirectory} from ${JSON.stringify(moduleUrl)};console.log(authorityDirectory)`],{env:{...process.env,HOME:f.dir,CODEX_HOME:f.dir},encoding:'utf8'}).trim();assert.equal(result,authorityDirectory);
});
for(const action of ['stop','replace'])test('active supervisor interrupts on external authority '+action,async t=>{
 const f=fixture();t.after(f.cleanup);let starts=0,interrupted=false;
 const adapter={...f.adapter,runSubscriptionInvestment:async(input:Parameters<NonNullable<typeof f.adapter.runSubscriptionInvestment>>[0],signal:AbortSignal)=>{
  starts++;f.ledger.admit(f.s,input,verified);
  return await new Promise<{status:'interrupted';settled:false}>(resolve=>{
   signal.addEventListener('abort',()=>{interrupted=true;resolve({status:'interrupted',settled:false});},{once:true});
   setTimeout(()=>{if(action==='stop'){const other=new PilotLineage(f.file);other.stop();other.close();}else{const copy=join(f.dir,'replacement.sqlite');copyFileSync(f.file,copy);chmodSync(copy,0o600);renameSync(copy,f.file);}},20);
  });
 }};
 await supervisePilot(f.company,adapter,f.s.groupId,'first',null);
 assert.equal(starts,1);assert.equal(interrupted,true);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.creditPilot.localCount(),1);
});

test('external release survives local release transaction rollback',t=>{
 const f=fixture();t.after(f.cleanup);f.store.db.exec("CREATE TEMP TRIGGER fail_release BEFORE UPDATE ON investment_credit_pilot WHEN NEW.state='released' BEGIN SELECT RAISE(ABORT,'local release rollback'); END");
 assert.throws(()=>f.release(),/local release rollback/);assert.equal(f.company.creditPilot.get()!.state,'held');assert.equal(f.ledger.row().release_count,1);assert.equal(f.ledger.row().consumed,1);f.company.recover();assert.equal(f.ledger.row().state,'stopped');assert.throws(()=>f.release());
});

test('competing supervisor preparations leave their winner authorized',async t=>{
 const f=fixture(false);t.after(f.cleanup);
 const setup=new URL('../scripts/credit-pilot/setup.js',import.meta.url).href;
 const code=script(f,`import {preparePilot,bindPreparedSuccessor} from ${JSON.stringify(setup)};const f=preparePilot(${JSON.stringify(f.roster)},'test-model',${JSON.stringify(process.cwd())});try{f.company.creditPilot.approve(f.manifest.scopeId,'test-model',new Date().toISOString());bindPreparedSuccessor(l,f,${JSON.stringify(sha)});f.close();l.close();}catch{f.close();l.close();process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(code),child(code)])).sort(),[0,7]);assert.equal(f.ledger.row().state,'prepared');assert.equal(f.ledger.row().consumed,1);assert.equal(f.ledger.receipts().filter(r=>r.kind==='successor_prepared').length,1);
});

test('crash during authority initialization leaves no usable seed or missing-receipt authority',async t=>{
 const f=fixture();t.after(f.cleanup);const file=join(f.dir,'incomplete.sqlite');
 await child(`import {DatabaseSync} from 'node:sqlite';import {PilotLineage} from ${JSON.stringify(moduleUrl)};const prepare=DatabaseSync.prototype.prepare;DatabaseSync.prototype.prepare=function(sql){const statement=prepare.call(this,sql);if(sql.startsWith('INSERT INTO lineage'))return {run(...args){statement.run(...args);process.kill(process.pid,'SIGKILL')}};return statement;};PilotLineage.create(${JSON.stringify(file)},${JSON.stringify(f.original)},new Date().toISOString());`);
 assert.throws(()=>new PilotLineage(file),/schema/);assert.throws(()=>PilotLineage.create(file,f.original,new Date().toISOString()),/EEXIST/);
});

test('backward local clock cannot extend reserved admission',t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim(),reserved=Date.parse(f.ledger.row().reserved_at!);t.mock.method(Date,'now',()=>reserved-1);assert.throws(()=>f.ledger.admit(f.s,f.input(c),verified),/stopped|expired|stale/);assert.equal(f.ledger.row().consumed,2);
});

test('finalization after owner stop and revoked scope retains evidence and uncertainty',t=>{
 const f=fixture();t.after(f.cleanup);const c=f.claim();f.ledger.admit(f.s,f.input(c),verified);
 stopSuccessor(f);const stopped=f.ledger.row();assert.equal(stopped.uncertain,1);
 assert.equal(f.company.investmentTeam.scope(f.s.scopeId).state,'revoked');
 for(let i=0;i<2;i++){
  const evidence=finalizeContinuation(f.ledger,f);
  assert.equal(evidence.lineage.state,'stopped');assert.equal(evidence.lineage.uncertain,1);assert.equal(evidence.lineage.reason,stopped.reason);assert.equal(evidence.cumulativeReserved,2);
  for(const file of [join(f.dir,'execution-evidence.json'),join(f.root,'continuation-evidence.json')])assert.equal(readFileSync(file,'utf8'),JSON.stringify(evidence,null,2));
 }
 assert.equal(f.store.all("SELECT * FROM investment_team_controls WHERE scope_id=? AND action='revoke'",f.s.scopeId).length,1);
});
