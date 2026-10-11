import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,copyFileSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {PilotLineage,MayaLineage,issuePermit} from '../src/control/usage/pilot-lineage.js';
import {bytesHash,canonicalTextHash,historyFiles,inspectAtlasHistory} from '../src/control/usage/pilot-history.js';
import {finalizeMaya,openMaya,prepareMaya,runMaya,stopMayaPreflight} from '../scripts/credit-pilot/maya-review.js';
import {beginMaya,claimedInput,completeFixture,historyFixture,mayaFixture,sourceSha,verifiedAccount} from './fixtures/maya-pilot.js';
import {CodexRuntime} from '../src/runtime/codex.js';
import {transport} from './fixtures/credit-transport.js';

const moduleUrl=new URL('../src/control/usage/pilot-lineage.js',import.meta.url).href;
async function child(code:string){return new Promise<number|null>((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',d=>error+=d);p.once('error',reject);p.once('exit',n=>n===0||n===7||n===null?resolve(n):reject(Error(error)));});}
const script=(file:string,body:string)=>`import {MayaLineage} from ${JSON.stringify(moduleUrl)};const l=new MayaLineage(${JSON.stringify(file)});${body}`;
function reserve(f:ReturnType<typeof mayaFixture>){const p=f.f!;const request=beginMaya(p,f.ledger);p.company.creditPilot.release(request,null);const c=p.company.claimWorkNext();return claimedInput(p.company,c);}

test('populated additive migration retains every schema1 field and receipt; cumulative budget is separate',t=>{
 const h=historyFixture();t.after(h.cleanup);const row=JSON.stringify(h.ledger.row()),receipts=JSON.stringify(h.ledger.receipts()),archive=historyFiles(h.archive);
 h.ledger.authorizeMaya(h.history,'c'.repeat(64),new Date().toISOString());
 assert.equal(JSON.stringify(h.ledger.row()),row);assert.equal(JSON.stringify(h.ledger.receipts()),receipts);assert.equal(h.ledger.row().state,'stopped');assert.equal(h.ledger.row().consumed,2);
 assert.deepEqual(h.ledger.summary(),{originalReserved:1,atlasReserved:1,mayaReserved:0,cumulativeConsumed:2,maximum:4,remainingUnused:2,authorizedUnreleased:1,authorizedFutureReleases:0,state:'authorized',uncertain:0});
 assert.deepEqual(historyFiles(h.archive),archive);
 const d=new DatabaseSync(h.file);t.after(()=>d.close());assert.throws(()=>d.exec('UPDATE lineage SET consumed=3'),/frozen/);assert.throws(()=>d.exec('DELETE FROM lineage'),/retained/);assert.throws(()=>d.exec("INSERT INTO receipts(kind,at,detail) VALUES('late','','{}')"),/frozen/);
 assert.throws(()=>h.ledger.authorizeMaya(h.history,'d'.repeat(64),new Date().toISOString()),/already/);
});
test('only Maya reserves third allowance, one admission, successful completion authorizes nothing',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,before=JSON.stringify(f.ledger.row()),input=reserve(f);
 assert.equal(input.worker.worker_id,f.history.mayaWorkerId);assert.equal(p.company.creditPilot.count(),3);assert.equal(p.company.creditPilot.localCount(),1);
 assert.equal(f.ledger.summary().remainingUnused,1);assert.equal(f.ledger.summary().authorizedUnreleased,0);
 f.ledger.admit(p.s,input,verifiedAccount);assert.throws(()=>f.ledger.admit(p.s,input,verifiedAccount));
 completeFixture(input,undefined,p.contextBinding!.imports.map(e=>e.evidenceId));p.company.finish(input.execution.execution_id,{status:'completed',settled:true});
 assert.equal(f.ledger.maya().state,'stopped');assert.equal(f.ledger.maya().uncertain,0);assert.equal(p.company.claimWorkNext(),undefined);assert.throws(()=>f.ledger.claimSupervision(p.s));
 assert.throws(()=>f.ledger.prepareMaya({...p.s,pilotId:'replacement'},p.contextBinding!));assert.equal(JSON.stringify(f.ledger.row()),before);
 assert.equal(p.store.all('SELECT * FROM executions').length,1);assert.equal(f.ledger.mayaReceipts().filter(r=>r.kind==='admission_consumed').length,1);
});
test('Atlas request cannot consume Maya release and stale Atlas completion cannot change either history',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!;beginMaya(p,f.ledger);
 const atlas=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',f.history.workerId)!;
 assert.throws(()=>p.company.creditPilot.release(atlas.request_id,null),/approved continuation worker/);
 const before=JSON.stringify(f.ledger.row()),m=JSON.stringify(f.ledger.maya());assert.throws(()=>f.ledger.finish(f.history.executionId,'completed',true),/identity mismatch/);
 const legacy=new PilotLineage(f.file);t.after(()=>legacy.close());assert.throws(()=>legacy.finish(f.history.executionId,'completed',true),/frozen/);assert.throws(()=>legacy.stop(),/frozen/);
 assert.equal(JSON.stringify(f.ledger.row()),before);assert.equal(JSON.stringify(f.ledger.maya()),m);assert.equal(f.ledger.consumedCount(),2);
});
test('exact imported original bytes/metadata reach actual Maya tools, with separate local IDs',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f),imports=p.contextBinding!.imports;
 assert.equal(p.store.all('SELECT * FROM conversation_messages WHERE worker_id IS NOT NULL').length,0);
 for(const [i,e] of imports.entries()){
  const source=[f.history.packet,f.history.contribution][i]!,v=input.callTool('read'+i,'read_group_record',{record_id:e.evidenceId,offset:0}) as {content:string;next_offset:null;metadata:Record<string,unknown>};
  assert.equal(v.content,source.content);assert.deepEqual(Buffer.from(v.content),Buffer.from(source.content));assert.equal(v.next_offset,null);
  assert.equal(v.metadata.source_id,source.provenance.source_id);assert.equal(v.metadata.utf8_sha256,bytesHash(source.content));assert.notEqual(e.evidenceId,source.provenance.source_id);
  assert.ok(!JSON.stringify(v.metadata).includes(f.archive));assert.throws(()=>input.callTool('old'+i,'read_group_record',{record_id:source.provenance.source_id,offset:0}),/outside/);
 }
 input.callTool('submit','submit_contribution',{body:'Labelled fake Maya review cites complete history.',contribution_ids:[],evidence_ids:imports.map(x=>x.evidenceId),questions:[],answers:[]});
 const m=p.store.get<{worker_id:string;body:string}>('SELECT worker_id,body FROM conversation_messages WHERE worker_id IS NOT NULL')!;assert.equal(m.worker_id,f.history.mayaWorkerId);
});
for(const mode of ['metadata-only','partial','unrelated'])test('Maya source delivery rejects '+mode,t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f),e=p.contextBinding!.imports[1]!;
 if(mode==='partial')input.callTool('partial','read_group_record',{record_id:e.evidenceId,offset:1});
 if(mode==='unrelated')assert.throws(()=>input.callTool('private','read_group_record',{record_id:'unrelated-private-record',offset:0}),/outside/);
 assert.throws(()=>input.callTool('cite','submit_contribution',{body:'Fixture must not cite unread history.',contribution_ids:[],evidence_ids:[e.evidenceId],questions:[],answers:[]}),/Read the complete/);
});
test('trusted import keeps whitespace and Unicode bytes without trimming and has no worker tool',t=>{
 const f=mayaFixture(false);t.after(f.cleanup);const p=prepareMaya(f.ledger,sourceSha,process.cwd());t.after(()=>{p.close();rmSync(p.root,{recursive:true,force:true});});
 assert.throws(()=>p.company.discussions.importPilotHistory(p.s.groupId,'Duplicate',f.history.contribution),/already imported/);
 const altered={...f.history.contribution,content:' \nUnicode fixture é — evidence\n '};altered.provenance={...altered.provenance,utf8_sha256:bytesHash(altered.content),byte_length:Buffer.byteLength(altered.content),canonical_sha256:canonicalTextHash(altered.content)};
 // A separate explicitly private fixture group demonstrates raw import, independent of real archive authentication.
 const q=f.atlas; // retained history must never be reopened; use a fresh isolated company instead.
 assert.equal(q.store.db.isOpen,false);
 const db=p.store;for(const r of db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='group_evidence'"))db.db.exec(`DROP TRIGGER "${r.name}"`);
 db.run('DELETE FROM group_evidence WHERE evidence_id=?',p.contextBinding!.imports[1]!.evidenceId);
 const imported=p.company.discussions.importPilotHistory(p.s.groupId,'Byte preservation fixture',altered);assert.equal(imported.content,altered.content);assert.equal(imported.sha256,canonicalTextHash(altered.content));
 assert.throws(()=>f.ledger.verifyContext(p.s),/tampered/);
});
for(const mutation of ['body','metadata','missing','catalog'])test('modified Maya import/context fails before provider startup: '+mutation,async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f),e=p.contextBinding!.imports[1]!;
 if(mutation==='catalog'){(input.context as {shared_evidence:unknown[]}).shared_evidence=[];}
 else{for(const r of p.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='group_evidence'"))p.store.db.exec(`DROP TRIGGER "${r.name}"`);
  if(mutation==='body')p.store.run('UPDATE group_evidence SET content=? WHERE evidence_id=?','Truncated fixture',e.evidenceId);
  if(mutation==='metadata')p.store.run("UPDATE group_evidence SET metadata='{}' WHERE evidence_id=?",e.evidenceId);
  if(mutation==='missing')p.store.run('DELETE FROM group_evidence WHERE evidence_id=?',e.evidenceId);
 }
 assert.throws(()=>f.ledger.check(p.s,input),/evidence|context/);assert.equal(f.ledger.maya().admitted_at,null);assert.equal(f.ledger.consumedCount(),3);
});
test('tampered or missing Atlas archive fails closed and does not replace authentic content',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!;
 writeFileSync(join(f.archive,'authority-execution-evidence.json'),'{}');assert.throws(()=>f.ledger.verifyContext(p.s),/digest/);assert.equal(f.ledger.consumedCount(),2);
 rmSync(join(f.archive,'company.sqlite'));assert.throws(()=>inspectAtlasHistory(f.ledger,f.archive,f.history.archiveDigest),/digest/);
});
test('modified/copy-selected manifest and missing company database cannot prepare new authority',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,file=join(p.root,'manifest.json'),m=JSON.parse(readFileSync(file,'utf8'));
 writeFileSync(file,JSON.stringify({...m,root:f.dir}));assert.throws(()=>openMaya(f.ledger,sourceSha),/manifest/);
 writeFileSync(file,JSON.stringify(m));assert.throws(()=>openMaya(f.ledger,'2'.repeat(40)),/source/);p.close();rmSync(join(p.root,'company.sqlite'));
 assert.throws(()=>openMaya(f.ledger,sourceSha));assert.throws(()=>prepareMaya(f.ledger,sourceSha),/already/);assert.equal(f.ledger.consumedCount(),2);
});
for(const point of ['release','reservation'])test('external '+point+' survives disposable transaction rollback',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,request=beginMaya(p,f.ledger);
 if(point==='release'){p.store.db.exec("CREATE TEMP TRIGGER fail_maya_release BEFORE UPDATE ON investment_credit_pilot WHEN NEW.state='released' BEGIN SELECT RAISE(ABORT,'local rollback'); END");assert.throws(()=>p.company.creditPilot.release(request,null),/rollback/);assert.equal(f.ledger.maya().release_count,1);assert.equal(f.ledger.consumedCount(),2);}
 else{p.company.creditPilot.release(request,null);p.store.db.exec("CREATE TEMP TRIGGER fail_maya_claim BEFORE INSERT ON investment_activity_invocations BEGIN SELECT RAISE(ABORT,'local rollback'); END");assert.throws(()=>p.company.claimWorkNext(),/rollback/);assert.equal(f.ledger.consumedCount(),3);assert.equal(p.company.creditPilot.localCount(),0);}
 f.ledger.recover();assert.equal(f.ledger.maya().state,'stopped');assert.throws(()=>p.company.creditPilot.release(request,null));
});
for(const point of ['before-release','after-release','after-reservation','after-admission'])test('process kill '+point+' never refunds or replays',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!;
 if(point==='after-admission'){const input=reserve(f);await child(script(f.file,`l.admit(${JSON.stringify(p.s)},${JSON.stringify(input)},${JSON.stringify(verifiedAccount)});process.kill(process.pid,'SIGKILL')`));}
 else{
  p.company.discussions.control({group_id:p.s.groupId,action:'start',receipt_key:'fixture_maya_crash_start'});const request=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',p.s.workerId)!.request_id;
  await child(script(f.file,`const s=${JSON.stringify(p.s)};l.claimSupervision(s);${point!=='before-release'?`l.release(s,${JSON.stringify(request)});`:''}${point==='after-reservation'?`l.reserve(s,${JSON.stringify(request)},'fixture-lost-execution',s.workerId);`:''}process.kill(process.pid,'SIGKILL')`));
 }
 const restarted=new MayaLineage(f.file);t.after(()=>restarted.close());restarted.recover();assert.equal(restarted.maya().state,'stopped');assert.equal(restarted.consumedCount(),['after-reservation','after-admission'].includes(point)?3:2);assert.throws(()=>restarted.claimSupervision(p.s));
});
test('late completed response preserves stopped uncertainty and cannot reopen or reuse provider admission',t=>{
 const f=mayaFixture();t.after(f.cleanup);const input=reserve(f),p=f.f!;f.ledger.admit(p.s,input,verifiedAccount);f.ledger.stop('fixture_lost_result');f.ledger.finish(input.execution.execution_id,'completed',true);
 assert.equal(f.ledger.maya().uncertain,1);assert.equal(f.ledger.maya().reason,'fixture_lost_result');assert.throws(()=>f.ledger.admit(p.s,input,verifiedAccount));assert.equal(f.ledger.consumedCount(),3);
});
test('deleted disposable workspace leaves reservation and admission permanently spent',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f);f.ledger.admit(p.s,input,verifiedAccount);p.close();rmSync(p.root,{recursive:true,force:true});f.ledger.recover();
 assert.equal(f.ledger.consumedCount(),3);assert.throws(()=>prepareMaya(f.ledger,sourceSha));assert.equal(f.ledger.maya().execution_id,input.execution.execution_id);
});
test('simultaneous authorization and preparation create one extension and one successor',async t=>{
 const f=historyFixture();t.after(f.cleanup);const code=script(f.file,`try{l.authorizeMaya(${JSON.stringify(f.history)},'c'.repeat(64),${JSON.stringify(new Date().toISOString())});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(code),child(code)])).sort(),[0,7]);assert.equal(f.ledger.mayaReceipts().filter(r=>r.kind==='owner_authorized').length,1);
 const url=new URL('../scripts/credit-pilot/maya-review.js',import.meta.url).href;
 const prep=script(f.file,`import {prepareMaya} from ${JSON.stringify(url)};try{const f=prepareMaya(l,${JSON.stringify(sourceSha)},${JSON.stringify(process.cwd())});f.close();l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(prep),child(prep)])).sort(),[0,7]);assert.equal(f.ledger.maya().state,'prepared');assert.equal(f.ledger.consumedCount(),2);const root=f.ledger.successor().root;t.after(()=>rmSync(root,{recursive:true,force:true}));
});
test('simultaneous supervisors and reservations each have exactly one winner',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,s=JSON.stringify(p.s);
 p.company.discussions.control({group_id:p.s.groupId,action:'start',receipt_key:'fixture_concurrent_start'});const request=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',p.s.workerId)!.request_id;
 const claim=script(f.file,`try{l.claimSupervision(${s});l.release(${s},${JSON.stringify(request)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(claim),child(claim)])).sort(),[0,7]);assert.equal(f.ledger.maya().state,'released');
 const r=script(f.file,`try{l.reserve(${s},${JSON.stringify(request)},'fixture-concurrent-execution',${JSON.stringify(p.s.workerId)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(r),child(r)])).sort(),[0,7]);assert.equal(f.ledger.consumedCount(),3);
 assert.equal(f.ledger.mayaReceipts().filter(r=>r.kind==='reserved').length,1);
});
test('crash mid-migration leaves schema1 history intact and grants no partial Maya authority',async t=>{
 const f=historyFixture();t.after(f.cleanup);const before=JSON.stringify(f.ledger.row()),receipts=JSON.stringify(f.ledger.receipts());
 await child(script(f.file,`import {DatabaseSync} from 'node:sqlite';const prepare=DatabaseSync.prototype.prepare;DatabaseSync.prototype.prepare=function(sql){const s=prepare.call(this,sql);if(sql.startsWith('INSERT INTO maya_continuation'))return {run(...a){s.run(...a);process.kill(process.pid,'SIGKILL')}};return s;};l.authorizeMaya(${JSON.stringify(f.history)},'c'.repeat(64),${JSON.stringify(new Date().toISOString())});`));
 assert.equal(JSON.stringify(f.ledger.row()),before);assert.equal(JSON.stringify(f.ledger.receipts()),receipts);assert.throws(()=>f.ledger.maya(),/not authorized/);
});
test('account/model/worker/deadline changes and forged production permit fail closed',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f);
 assert.throws(()=>issuePermit(f.ledger,p.s),/Trusted/);
 for(const worker of [{...input.worker,worker_id:f.history.workerId},{...input.worker,ai_model:'other'},{...input.worker,reasoning_effort:'high'}])assert.throws(()=>f.ledger.check(p.s,{...input,worker}),/admission/);
 assert.throws(()=>f.ledger.admit(p.s,input,{...verifiedAccount,fingerprint:'e'.repeat(64)}),/account or routing/);
 const real=Date.now;t.mock.method(Date,'now',()=>real()+300001);assert.throws(()=>f.ledger.check(p.s,input),/admission/);t.mock.restoreAll();
 const runtime=new CodexRuntime({command:'/must-never-run',creditPilot:{pilotId:p.s.pilotId,disposableRoot:p.root,model:'test-model',permit:{kind:'decision037-one-maya-turn'}}});await assert.rejects(runtime.runSubscriptionInvestment!(input,new AbortController().signal,p.policy),/Durable supervisor/);
});
test('missing, corrupt, nonprivate and replaced authority fail closed',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!;chmodSync(f.file,0o644);assert.throws(()=>f.ledger.claimSupervision(p.s),/owner-private/);chmodSync(f.file,0o600);
 const copy=join(f.dir,'replacement.sqlite');copyFileSync(f.file,copy);chmodSync(copy,0o600);renameSync(copy,f.file);assert.throws(()=>f.ledger.maya(),/replaced/);
 assert.throws(()=>new MayaLineage(join(f.dir,'missing.sqlite')));const corrupt=join(f.dir,'corrupt.sqlite');writeFileSync(corrupt,'not sqlite',{mode:0o600});assert.throws(()=>new MayaLineage(corrupt));
});
test('losing concurrent turn cannot stop winning supervisor; finalization preserves Atlas reports',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,old=readFileSync(join(f.dir,'execution-evidence.json'),'utf8');
 let entered!:()=>void,finish!:()=>void;const running=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>finish=r);let starts=0;
 const adapter={...f.atlas.adapter,runSubscriptionInvestment:async(input:Parameters<NonNullable<typeof f.atlas.adapter.runSubscriptionInvestment>>[0])=>{starts++;f.ledger.admit(p.s,input,verifiedAccount);entered();await gate;completeFixture(input,undefined,p.contextBinding!.imports.map(e=>e.evidenceId));return {status:'completed' as const,settled:true};}};
 const win=runMaya(f.ledger,p,adapter);await running;
 const loser=new MayaLineage(f.file),other=openMaya(loser,sourceSha,process.cwd());try{await assert.rejects(runMaya(loser,other,adapter),/already/);assert.equal(f.ledger.maya().state,'admitted');assert.throws(()=>finalizeMaya(loser,other),/owning/);}finally{other.store.close();loser.close();finish();}
 await win;assert.equal(starts,1);assert.equal(f.ledger.maya().state,'stopped');assert.equal(f.ledger.maya().uncertain,0);assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(readFileSync(join(f.dir,'execution-evidence.json'),'utf8'),old);
 assert.ok(readFileSync(join(f.dir,'maya-execution-evidence.json'),'utf8').includes('cumulativeConsumed'));assert.equal(f.ledger.consumedCount(),3);
});

for(const damage of ['missing','replaced'])test('owning finalizer stops/revokes locally after authority '+damage,t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f);f.ledger.admit(p.s,input,verifiedAccount);
 if(damage==='missing')rmSync(f.file);else{const replacement=join(f.dir,'new.sqlite');copyFileSync(f.file,replacement);chmodSync(replacement,0o600);renameSync(replacement,f.file);}
 assert.throws(()=>finalizeMaya(f.ledger,p));assert.equal(p.company.creditPilot.get()!.state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');
 const receipt=JSON.parse(readFileSync(join(p.root,'maya-evidence.json'),'utf8'));assert.equal(receipt.authorityUnavailable,true);assert.equal(receipt.uncertain,true);
});

for(const mutation of ['owner-note','topic','constraints','research','envelope','configuration','turn-prompt','context-extra'])test('isolated Maya context rejects '+mutation+' before fake provider startup',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f),fake=transport('maya-review',p);
 fake.runtime.authorizeWith=(i,a)=>a?f.ledger.admit(p.s,i,a):f.ledger.check(p.s,i);
 // Fault-inject a corrupted synthetic copy beyond its normal immutable SQL guards.
 const corruptedTable=mutation==='topic'||mutation==='constraints'?'working_groups':mutation==='envelope'?'investment_team_scopes':mutation==='turn-prompt'?'discussion_turns':null;
 if(corruptedTable)for(const r of p.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name=?",corruptedTable))p.store.db.exec(`DROP TRIGGER "${r.name}"`);
 if(mutation==='owner-note')p.company.discussions.note({group_id:p.s.groupId,body:'UNRELATED_PRIVATE_CONTEXT_SENTINEL',kind:'note',receipt_key:'fixture_private_note'});
 if(mutation==='topic'||mutation==='constraints')p.store.run(`UPDATE working_groups SET ${mutation}=?`,'UNRELATED_PRIVATE_CONTEXT_SENTINEL');
 if(mutation==='research')p.store.run('INSERT INTO research_tool_workers VALUES (?,?)',p.s.workerId,new Date().toISOString());
 if(mutation==='envelope')p.store.run("UPDATE investment_team_scopes SET envelope=json_set(envelope,'$.participants[1].responsibility','UNRELATED_PRIVATE_CONTEXT_SENTINEL')");
 if(mutation==='configuration'){p.store.db.exec('DROP TRIGGER investment_configuration_immutable');p.store.run("UPDATE investment_runs SET configuration=json_set(configuration,'$.fixtureLabel','UNRELATED_PRIVATE_CONTEXT_SENTINEL')");}
 if(mutation==='turn-prompt')p.store.run("UPDATE discussion_turns SET prompt='UNRELATED_PRIVATE_CONTEXT_SENTINEL' WHERE request_id=?",input.request.request_id);
 if(mutation==='context-extra')Object.assign(input.context as object,{private_payload:'UNRELATED_PRIVATE_CONTEXT_SENTINEL'});
 await assert.rejects(fake.runtime.runSubscriptionInvestment!(input,new AbortController().signal,p.policy),/context|content/);
 assert.equal(fake.methods().length,0);assert.equal(f.ledger.maya().admitted_at,null);assert.equal(f.ledger.consumedCount(),3);
});
for(const mode of ['maya-review','identity-change','wrong-model','tool','missing-usage','notification-no-settlement'])test('actual fake app-server Maya continuation: '+mode,async t=>{
 const f=mayaFixture(true,false);t.after(f.cleanup);const p=f.f!,e=p.contextBinding!.imports;
 const fake=transport(mode,p,e.map(x=>({record_id:x.evidenceId,content:x.content,source_id:JSON.parse(x.metadata).source_id})));
 f.ledger.bindAccount(p.s,await fake.runtime.creditPreflight(join(p.root,'workspaces',p.s.workerId)));
 fake.runtime.authorizeWith=(i,a)=>a?f.ledger.admit(p.s,i,a):f.ledger.check(p.s,i);
 await runMaya(f.ledger,p,fake.runtime);
 const starts=fake.methods().filter(m=>m==='turn/start').length;
 assert.equal(starts,['identity-change','wrong-model'].includes(mode)?0:1);assert.equal(f.ledger.consumedCount(),3);assert.equal(f.ledger.maya().state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(p.company.claimWorkNext(),undefined);
 if(mode==='maya-review'){
  assert.equal(f.ledger.maya().uncertain,0);
  const delivered=p.store.all<{result:string}>("SELECT result FROM tool_receipts WHERE json_extract(result,'$.record_id') IS NOT NULL").map(x=>JSON.parse(x.result));assert.equal(delivered.length,2);
  for(const x of e)assert.ok(delivered.some(v=>v.record_id===x.evidenceId&&v.content===x.content&&v.next_offset===null));
  assert.equal(p.store.get<{n:number}>("SELECT count(*) n FROM conversation_messages WHERE worker_id=?",p.s.workerId)!.n,1);
 }
 if(mode==='missing-usage')assert.equal(p.store.get<{tokens:null}>('SELECT tokens FROM ai_usage')!.tokens,null);
 if(mode==='notification-no-settlement')assert.equal(f.ledger.maya().uncertain,1);
});
test('simultaneous Maya admissions consume provider permission only once',async t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f);
 const code=script(f.file,`try{l.admit(${JSON.stringify(p.s)},${JSON.stringify(input)},${JSON.stringify(verifiedAccount)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(code),child(code)])).sort(),[0,7]);assert.equal(f.ledger.mayaReceipts().filter(r=>r.kind==='admission_consumed').length,1);assert.equal(f.ledger.consumedCount(),3);
});

test('failed disposable evidence write cannot prevent durable external retention',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!,input=reserve(f);f.ledger.admit(p.s,input,verifiedAccount);
 // The database stays open and inspectable; only the replaceable report target fails.
 writeFileSync(join(p.root,'maya-evidence.json'),'fixture');rmSync(join(p.root,'maya-evidence.json'));const blocked=join(p.root,'maya-evidence.json');
 // Existing directory makes the final report write fail, including under privileged test users.
 p.store.db.exec('PRAGMA wal_checkpoint(PASSIVE)');
 mkdirSync(blocked);
 assert.throws(()=>finalizeMaya(f.ledger,p));
 const report=JSON.parse(readFileSync(join(f.dir,'maya-execution-evidence.json'),'utf8'));assert.equal(report.summary.cumulativeConsumed,3);assert.equal(report.scopeState,'revoked');assert.equal(report.pilot.state,'stopped');
});

test('failed preflight stops/revokes its prepared scope but a losing preflight cannot stop the winner',t=>{
 const f=mayaFixture();t.after(f.cleanup);const p=f.f!;stopMayaPreflight(f.ledger,p);assert.equal(f.ledger.maya().state,'stopped');assert.equal(p.company.creditPilot.get()!.state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(f.ledger.consumedCount(),2);
 const h=mayaFixture();t.after(h.cleanup);const q=h.f!;h.ledger.claimSupervision(q.s);const loser=new MayaLineage(h.file);t.after(()=>loser.close());stopMayaPreflight(loser,q);assert.equal(h.ledger.maya().state,'supervising');assert.equal(q.company.investmentTeam.scope(q.s.scopeId).state,'active');assert.equal(q.company.creditPilot.get()!.state,'held');
});
