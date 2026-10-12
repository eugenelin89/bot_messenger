import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,copyFileSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {PilotLineage,MayaLineage,FinalAtlasLineage,issuePermit} from '../src/control/usage/pilot-lineage.js';
import {bytesHash,historyFiles} from '../src/control/usage/pilot-history.js';
import {inspectMayaHistory} from '../src/control/usage/pilot-final-history.js';
import {finalizeFinalAtlas,openFinalAtlas,prepareFinalAtlas,runFinalAtlas,stopFinalAtlasPreflight} from '../scripts/credit-pilot/final-atlas.js';
import {completeFixture,sourceSha,verifiedAccount} from './fixtures/maya-pilot.js';
import {beginFinal,finalFixture,finalHistoryFixture,reserveFinal} from './fixtures/final-atlas-pilot.js';
import {CodexRuntime} from '../src/runtime/codex.js';
import {transport} from './fixtures/credit-transport.js';
const moduleUrl=new URL('../src/control/usage/pilot-lineage.js',import.meta.url).href;
async function child(code:string){return new Promise<number|null>((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',d=>error+=d);p.once('error',reject);p.once('exit',n=>n===0||n===7||n===null?resolve(n):reject(Error(error)));});}
const script=(file:string,body:string)=>`import {FinalAtlasLineage} from ${JSON.stringify(moduleUrl)};const l=new FinalAtlasLineage(${JSON.stringify(file)});${body}`;
const historical=(l:FinalAtlasLineage)=>JSON.stringify([l.row(),l.receipts(),l.maya(),l.mayaReceipts()]);

for(const point of ['release','reservation'])test('external '+point+' survives disposable transaction rollback',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,request=beginFinal(p,f.ledger);
 if(point==='release'){p.store.db.exec("CREATE TEMP TRIGGER fail_maya_release BEFORE UPDATE ON investment_credit_pilot WHEN NEW.state='released' BEGIN SELECT RAISE(ABORT,'local rollback'); END");assert.throws(()=>p.company.creditPilot.release(request,null),/rollback/);assert.equal(f.ledger.finalRow().release_count,1);assert.equal(f.ledger.consumedCount(),3);}
 else{p.company.creditPilot.release(request,null);p.store.db.exec("CREATE TEMP TRIGGER fail_maya_claim BEFORE INSERT ON investment_activity_invocations BEGIN SELECT RAISE(ABORT,'local rollback'); END");assert.throws(()=>p.company.claimWorkNext(),/rollback/);assert.equal(f.ledger.consumedCount(),4);assert.equal(p.company.creditPilot.localCount(),0);}
 f.ledger.recover();assert.equal(f.ledger.finalRow().state,'stopped');assert.throws(()=>p.company.creditPilot.release(request,null));
});
for(const point of ['before-release','after-release','after-reservation','after-admission'])test('process kill '+point+' never refunds or replays',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!;
 if(point==='after-admission'){const input=reserveFinal(f);await child(script(f.file,`l.admit(${JSON.stringify(p.s)},${JSON.stringify(input)},${JSON.stringify(verifiedAccount)});process.kill(process.pid,'SIGKILL')`));}
 else{
  p.company.discussions.control({group_id:p.s.groupId,action:'start',receipt_key:'fixture_maya_crash_start'});const request=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',p.s.workerId)!.request_id;
  await child(script(f.file,`const s=${JSON.stringify(p.s)};l.claimSupervision(s);${point!=='before-release'?`l.release(s,${JSON.stringify(request)});`:''}${point==='after-reservation'?`l.reserve(s,${JSON.stringify(request)},'fixture-lost-execution',s.workerId);`:''}process.kill(process.pid,'SIGKILL')`));
 }
 const restarted=new FinalAtlasLineage(f.file);t.after(()=>restarted.close());restarted.recover();assert.equal(restarted.finalRow().state,'stopped');assert.equal(restarted.consumedCount(),['after-reservation','after-admission'].includes(point)?4:3);assert.throws(()=>restarted.claimSupervision(p.s));
});
test('late completed response preserves stopped uncertainty and cannot reopen or reuse provider admission',t=>{
 const f=finalFixture();t.after(f.cleanup);const input=reserveFinal(f),p=f.f!;f.ledger.admit(p.s,input,verifiedAccount);f.ledger.stop('fixture_lost_result');f.ledger.finish(input.execution.execution_id,'completed',true);
 assert.equal(f.ledger.finalRow().uncertain,1);assert.equal(f.ledger.finalRow().reason,'fixture_lost_result');assert.throws(()=>f.ledger.admit(p.s,input,verifiedAccount));assert.equal(f.ledger.consumedCount(),4);
});
test('deleted disposable workspace leaves reservation and admission permanently spent',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f);f.ledger.admit(p.s,input,verifiedAccount);p.close();rmSync(p.root,{recursive:true,force:true});f.ledger.recover();
 assert.equal(f.ledger.consumedCount(),4);assert.throws(()=>prepareFinalAtlas(f.ledger,sourceSha));assert.equal(f.ledger.finalRow().execution_id,input.execution.execution_id);
});
test('simultaneous authorization and preparation create one extension and one successor',async t=>{
 const f=finalHistoryFixture();t.after(f.cleanup);const code=script(f.file,`try{l.authorizeFinal(${JSON.stringify(f.history)},'c'.repeat(64),${JSON.stringify(new Date().toISOString())},'e'.repeat(64));l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(code),child(code)])).sort(),[0,7]);assert.equal(f.ledger.finalReceipts().filter(r=>r.kind==='owner_authorized').length,1);
 const url=new URL('../scripts/credit-pilot/final-atlas.js',import.meta.url).href;
 const prep=script(f.file,`import {prepareFinalAtlas} from ${JSON.stringify(url)};try{const f=prepareFinalAtlas(l,${JSON.stringify(sourceSha)},${JSON.stringify(process.cwd())});f.close();l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(prep),child(prep)])).sort(),[0,7]);assert.equal(f.ledger.finalRow().state,'prepared');assert.equal(f.ledger.consumedCount(),3);const root=f.ledger.successor().root;t.after(()=>rmSync(root,{recursive:true,force:true}));
});
test('simultaneous supervisors and reservations each have exactly one winner',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,s=JSON.stringify(p.s);
 p.company.discussions.control({group_id:p.s.groupId,action:'start',receipt_key:'fixture_concurrent_start'});const request=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',p.s.workerId)!.request_id;
 const claim=script(f.file,`try{l.claimSupervision(${s});l.release(${s},${JSON.stringify(request)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(claim),child(claim)])).sort(),[0,7]);assert.equal(f.ledger.finalRow().state,'released');
 const r=script(f.file,`try{l.reserve(${s},${JSON.stringify(request)},'fixture-concurrent-execution',${JSON.stringify(p.s.workerId)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(r),child(r)])).sort(),[0,7]);assert.equal(f.ledger.consumedCount(),4);
 assert.equal(f.ledger.finalReceipts().filter(r=>r.kind==='reserved').length,1);
});
test('crash mid-migration preserves schema2 and grants no partial final authority',async t=>{
 const f=finalHistoryFixture();t.after(f.cleanup);const before=historical(f.ledger);
 await child(script(f.file,`import {DatabaseSync} from 'node:sqlite';const prepare=DatabaseSync.prototype.prepare;DatabaseSync.prototype.prepare=function(sql){const s=prepare.call(this,sql);if(sql.startsWith('INSERT INTO final_atlas_continuation'))return {run(...a){s.run(...a);process.kill(process.pid,'SIGKILL')}};return s;};l.authorizeFinal(${JSON.stringify(f.history)},'c'.repeat(64),${JSON.stringify(new Date().toISOString())},'e'.repeat(64));`));
 assert.equal(historical(f.ledger),before);assert.throws(()=>f.ledger.finalRow(),/not authorized/);
});
test('account/model/worker/deadline changes and forged production permit fail closed',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f);
 assert.throws(()=>issuePermit(f.ledger,p.s),/Trusted/);
 for(const worker of [{...input.worker,worker_id:f.history.atlas.mayaWorkerId},{...input.worker,ai_model:'other'},{...input.worker,reasoning_effort:'high'}])assert.throws(()=>f.ledger.check(p.s,{...input,worker}),/admission/);
 assert.throws(()=>f.ledger.admit(p.s,input,{...verifiedAccount,fingerprint:'e'.repeat(64)}),/account or routing/);
 const real=Date.now;t.mock.method(Date,'now',()=>real()+300001);assert.throws(()=>f.ledger.check(p.s,input),/admission/);t.mock.restoreAll();
 const runtime=new CodexRuntime({command:'/must-never-run',creditPilot:{pilotId:p.s.pilotId,disposableRoot:p.root,model:'test-model',permit:{kind:'decision037-final-atlas-turn'}}});await assert.rejects(runtime.runSubscriptionInvestment!(input,new AbortController().signal,p.policy),/Durable supervisor/);
});
test('missing, corrupt, nonprivate and replaced authority fail closed',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!;chmodSync(f.file,0o644);assert.throws(()=>f.ledger.claimSupervision(p.s),/owner-private/);chmodSync(f.file,0o600);
 const copy=join(f.dir,'replacement.sqlite');copyFileSync(f.file,copy);chmodSync(copy,0o600);renameSync(copy,f.file);assert.throws(()=>f.ledger.finalRow(),/replaced/);
 assert.throws(()=>new FinalAtlasLineage(join(f.dir,'missing.sqlite')));const corrupt=join(f.dir,'corrupt.sqlite');writeFileSync(corrupt,'not sqlite',{mode:0o600});assert.throws(()=>new FinalAtlasLineage(corrupt));
});
test('losing concurrent turn cannot stop winning supervisor; finalization preserves Atlas reports',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,old=readFileSync(join(f.dir,'execution-evidence.json'),'utf8');
 let entered!:()=>void,finish!:()=>void;const running=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>finish=r);let starts=0;
 const adapter={...f.atlas.adapter,runSubscriptionInvestment:async(input:Parameters<NonNullable<typeof f.atlas.adapter.runSubscriptionInvestment>>[0])=>{starts++;f.ledger.admit(p.s,input,verifiedAccount);entered();await gate;completeFixture(input,undefined,p.contextBinding!.imports.map(e=>e.evidenceId));return {status:'completed' as const,settled:true};}};
 const win=runFinalAtlas(f.ledger,p,adapter);await running;
 const loser=new FinalAtlasLineage(f.file),other=openFinalAtlas(loser,sourceSha,process.cwd());try{await assert.rejects(runFinalAtlas(loser,other,adapter),/already/);assert.equal(f.ledger.finalRow().state,'admitted');assert.throws(()=>finalizeFinalAtlas(loser,other),/owning/);}finally{other.store.close();loser.close();finish();}
 await win;assert.equal(starts,1);assert.equal(f.ledger.finalRow().state,'stopped');assert.equal(f.ledger.finalRow().uncertain,0);assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(readFileSync(join(f.dir,'execution-evidence.json'),'utf8'),old);
 assert.ok(readFileSync(join(f.dir,'final-atlas-execution-evidence.json'),'utf8').includes('cumulativeConsumed'));assert.equal(f.ledger.consumedCount(),4);
});

for(const damage of ['missing','replaced'])test('owning finalizer stops/revokes locally after authority '+damage,t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f);f.ledger.admit(p.s,input,verifiedAccount);
 if(damage==='missing')rmSync(f.file);else{const replacement=join(f.dir,'new.sqlite');copyFileSync(f.file,replacement);chmodSync(replacement,0o600);renameSync(replacement,f.file);}
 assert.throws(()=>finalizeFinalAtlas(f.ledger,p));assert.equal(p.company.creditPilot.get()!.state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');
 const receipt=JSON.parse(readFileSync(join(p.root,'final-atlas-evidence.json'),'utf8'));assert.equal(receipt.authorityUnavailable,true);assert.equal(receipt.uncertain,true);
});

for(const mutation of ['owner-note','topic','constraints','research','envelope','configuration','turn-prompt','context-extra'])test('isolated final context rejects '+mutation+' before fake provider startup',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f),fake=transport('final-atlas-review',p);
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
 assert.equal(fake.methods().length,0);assert.equal(f.ledger.finalRow().admitted_at,null);assert.equal(f.ledger.consumedCount(),4);
});
for(const mode of ['final-atlas-review','identity-change','wrong-model','tool','missing-usage','notification-no-settlement'])test('actual fake app-server final Atlas continuation: '+mode,async t=>{
 const f=finalFixture(true,false);t.after(f.cleanup);const p=f.f!,e=p.contextBinding!.imports;
 const fake=transport(mode,p,e.map(x=>({record_id:x.evidenceId,content:x.content,source_id:JSON.parse(x.metadata).source_id})));
 f.ledger.bindAccount(p.s,await fake.runtime.creditPreflight(join(p.root,'workspaces',p.s.workerId)));
 fake.runtime.authorizeWith=(i,a)=>a?f.ledger.admit(p.s,i,a):f.ledger.check(p.s,i);
 await runFinalAtlas(f.ledger,p,fake.runtime);
 const starts=fake.methods().filter(m=>m==='turn/start').length;
 assert.equal(starts,['identity-change','wrong-model'].includes(mode)?0:1);assert.equal(f.ledger.consumedCount(),4);assert.equal(f.ledger.finalRow().state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(p.company.claimWorkNext(),undefined);
 if(mode==='final-atlas-review'){
  assert.equal(f.ledger.finalRow().uncertain,0);
  const delivered=p.store.all<{result:string}>("SELECT result FROM tool_receipts WHERE json_extract(result,'$.record_id') IS NOT NULL").map(x=>JSON.parse(x.result));assert.equal(delivered.length,3);
  for(const x of e)assert.ok(delivered.some(v=>v.record_id===x.evidenceId&&v.content===x.content&&v.next_offset===null));
  assert.equal(p.store.get<{n:number}>("SELECT count(*) n FROM conversation_messages WHERE worker_id=?",p.s.workerId)!.n,1);
 }
 if(mode==='missing-usage')assert.equal(p.store.get<{tokens:null}>('SELECT tokens FROM ai_usage')!.tokens,null);
 if(mode==='notification-no-settlement')assert.equal(f.ledger.finalRow().uncertain,1);
});
test('simultaneous final admissions consume provider permission only once',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f);
 const code=script(f.file,`try{l.admit(${JSON.stringify(p.s)},${JSON.stringify(input)},${JSON.stringify(verifiedAccount)});l.close();}catch{process.exit(7)}`);
 assert.deepEqual((await Promise.all([child(code),child(code)])).sort(),[0,7]);assert.equal(f.ledger.finalReceipts().filter(r=>r.kind==='admission_consumed').length,1);assert.equal(f.ledger.consumedCount(),4);
});

test('failed disposable evidence write cannot prevent durable external retention',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f);f.ledger.admit(p.s,input,verifiedAccount);
 // The database stays open and inspectable; only the replaceable report target fails.
 writeFileSync(join(p.root,'final-atlas-evidence.json'),'fixture');rmSync(join(p.root,'final-atlas-evidence.json'));const blocked=join(p.root,'final-atlas-evidence.json');
 // Existing directory makes the final report write fail, including under privileged test users.
 p.store.db.exec('PRAGMA wal_checkpoint(PASSIVE)');
 mkdirSync(blocked);
 assert.throws(()=>finalizeFinalAtlas(f.ledger,p));
 const report=JSON.parse(readFileSync(join(f.dir,'final-atlas-execution-evidence.json'),'utf8'));assert.equal(report.summary.cumulativeConsumed,4);assert.equal(report.scopeState,'revoked');assert.equal(report.pilot.state,'stopped');
});

test('failed preflight stops/revokes its prepared scope but a losing preflight cannot stop the winner',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!;stopFinalAtlasPreflight(f.ledger,p);assert.equal(f.ledger.finalRow().state,'stopped');assert.equal(p.company.creditPilot.get()!.state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(f.ledger.consumedCount(),3);
 const h=finalFixture();t.after(h.cleanup);const q=h.f!;h.ledger.claimSupervision(q.s);const loser=new FinalAtlasLineage(h.file);t.after(()=>loser.close());stopFinalAtlasPreflight(loser,q);assert.equal(h.ledger.finalRow().state,'supervising');assert.equal(q.company.investmentTeam.scope(q.s.scopeId).state,'active');assert.equal(q.company.creditPilot.get()!.state,'held');
});

test('schema3 preserves every schema1/schema2 field and receipt and freezes historical mutation',t=>{
 const h=finalHistoryFixture();t.after(h.cleanup);const before=historical(h.ledger),files=historyFiles(h.archive);
 h.ledger.authorizeFinal(h.history,'d'.repeat(64),new Date().toISOString(),'e'.repeat(64));
 assert.equal(historical(h.ledger),before);assert.deepEqual(historyFiles(h.archive),files);
 assert.equal(h.ledger.consumedCount(),3);assert.equal(h.ledger.summary().remainingUnused,1);
 const db=new DatabaseSync(h.file);t.after(()=>db.close());
 for(const sql of ['UPDATE lineage SET consumed=3','DELETE FROM lineage','UPDATE maya_continuation SET reserved=0','DELETE FROM maya_continuation',"INSERT INTO receipts(kind,at,detail) VALUES('late','','{}')","INSERT INTO maya_receipts(kind,at,detail) VALUES('late','','{}')","UPDATE maya_receipts SET detail='{}'",'DELETE FROM maya_receipts'])assert.throws(()=>db.exec(sql),/frozen|immutable|retained/i);
 for(const C of [PilotLineage,MayaLineage]){const old=new C(h.file);try{assert.throws(()=>old.stop(),/frozen/);assert.throws(()=>old.prepare({...h.ledger.original(),root:h.dir} as never));}finally{old.close();}}
 assert.equal(historical(h.ledger),before);assert.throws(()=>h.ledger.authorizeFinal(h.history,'e'.repeat(64),new Date().toISOString(),'e'.repeat(64)),/already/);
});
test('Atlas alone consumes reservation four; all future releases, reserves and admissions fail',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,before=historical(f.ledger),originalFiles=historyFiles(f.original.root),atlasFiles=historyFiles(f.history.atlas.archive),mayaFiles=historyFiles(f.archive);
 const input=reserveFinal(f);assert.equal(input.worker.worker_id,f.history.atlas.workerId);assert.equal(p.company.creditPilot.count(),4);assert.equal(f.ledger.summary().remainingUnused,0);
 f.ledger.admit(p.s,input,verifiedAccount);assert.throws(()=>f.ledger.admit(p.s,input,verifiedAccount));
 completeFixture(input,'Deterministic final Atlas fixture responds to fake Maya; not genuine inference.',p.contextBinding!.imports.map(x=>x.evidenceId));p.company.finish(input.execution.execution_id,{status:'completed',settled:true});
 finalizeFinalAtlas(f.ledger,p);assert.equal(f.ledger.finalRow().state,'stopped');assert.equal(f.ledger.finalRow().uncertain,0);
 assert.equal(f.ledger.summary().authorizedFutureReleases,0);assert.equal(f.ledger.summary().authorizedUnreleased,0);assert.equal(p.company.claimWorkNext(),undefined);
 for(const call of [()=>prepareFinalAtlas(f.ledger,sourceSha),()=>f.ledger.prepareFinal(p.s,p.contextBinding!),()=>f.ledger.claimSupervision(p.s),()=>f.ledger.release(p.s,input.request.request_id),()=>f.ledger.reserve(p.s,input.request.request_id,'fifth',p.s.workerId),()=>f.ledger.admit(p.s,input,verifiedAccount)])assert.throws(call);
 assert.equal(historical(f.ledger),before);assert.deepEqual(historyFiles(f.original.root),originalFiles);assert.deepEqual(historyFiles(f.history.atlas.archive),atlasFiles);assert.deepEqual(historyFiles(f.archive),mayaFiles);
});
test('exact original packet, Atlas opening and Maya review reach tools with new IDs and original request identity',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f),sources=[f.history.packet,f.history.opening,f.history.review];
 assert.equal(p.store.all('SELECT * FROM conversation_messages WHERE worker_id IS NOT NULL').length,0);
 for(const [i,e] of p.contextBinding!.imports.entries()){
  const source=sources[i]!,v=input.callTool('full-'+i,'read_group_record',{record_id:e.evidenceId,offset:0}) as {content:string;next_offset:null;metadata:Record<string,unknown>};
  assert.deepEqual(Buffer.from(v.content),Buffer.from(source.content));assert.equal(v.next_offset,null);assert.equal(v.metadata.source_id,source.provenance.source_id);assert.equal(v.metadata.utf8_sha256,bytesHash(source.content));assert.notEqual(e.evidenceId,source.provenance.source_id);
  if(i>0)assert.equal(v.metadata.source_request_id,i===1?f.ledger.row().request_id:f.ledger.maya().request_id);
  assert.throws(()=>input.callTool('foreign-'+i,'read_group_record',{record_id:source.provenance.source_id,offset:0}),/outside/);
 }
 assert.throws(()=>input.callTool('archive','read_group_record',{record_id:join(f.archive,'company.sqlite'),offset:0}),/outside|Invalid record_id/);
 assert.throws(()=>p.company.discussions.importPilotHistory(p.s.groupId,'Duplicate review',f.history.review),/draft/);
 assert.equal(input.tools.some(t=>t.name==='importPilotHistory'),false);
});
for(const index of [0,1,2])for(const mode of ['metadata-only','partial'])test(`final source ${index} ${mode} cannot count as delivered`,t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f),e=p.contextBinding!.imports[index]!;
 if(mode==='partial')input.callTool('partial','read_group_record',{record_id:e.evidenceId,offset:1});
 assert.throws(()=>input.callTool('cite','submit_contribution',{body:'Unread source fixture.',contribution_ids:[],evidence_ids:[e.evidenceId],questions:[],answers:[]}),/Read the complete/);
});
for(const index of [0,1,2])test('tampered final import '+index+' blocks fake provider startup',async t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f),fake=transport('final-atlas-review',p);
 fake.runtime.authorizeWith=(i,a)=>a?f.ledger.admit(p.s,i,a):f.ledger.check(p.s,i);
 for(const r of p.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='group_evidence'"))p.store.db.exec(`DROP TRIGGER "${r.name}"`);
 p.store.run('UPDATE group_evidence SET content=? WHERE evidence_id=?','Truncated or substituted fixture',p.contextBinding!.imports[index]!.evidenceId);
 await assert.rejects(fake.runtime.runSubscriptionInvestment!(input,new AbortController().signal,p.policy),/tampered/);assert.equal(fake.methods().length,0);assert.equal(f.ledger.finalRow().admitted_at,null);
});
for(const mutation of ['body','execution','request','usage','citation','read-receipt','read-request-hash','metadata','scope','report'])test('historical Maya verification rejects '+mutation,t=>{
 const f=finalHistoryFixture();t.after(f.cleanup);
 if(mutation==='report')writeFileSync(join(f.archive,'authority-maya-execution-evidence.json'),'{}');
 else {
  // Fault injection is limited to disposable labelled fixture archives.
  const db=new DatabaseSync(join(f.archive,'company.sqlite'));
  try{db.exec('PRAGMA foreign_keys=OFF');for(const r of db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all())db.exec(`DROP TRIGGER "${r.name}"`);
   const queries:Record<string,string>={body:"UPDATE conversation_messages SET body='substitute' WHERE worker_id IS NOT NULL",execution:"UPDATE executions SET worker_id='wrong-worker'",request:"UPDATE conversation_requests SET response_message_id='wrong-message' WHERE status='completed'",usage:'UPDATE ai_usage SET settled=0',citation:"UPDATE discussion_contributions SET evidence_ids='[]' WHERE execution_id IS NOT NULL",'read-receipt':"DELETE FROM tool_receipts WHERE json_extract(result,'$.record_id') IS NOT NULL",'read-request-hash':"UPDATE tool_receipts SET request_hash='wrong' WHERE json_extract(result,'$.record_id') IS NOT NULL",metadata:"UPDATE group_evidence SET metadata='{}'",scope:"UPDATE investment_team_scopes SET state='active'"};
   // Contributions carry their execution through the message join.
   if(mutation==='citation')db.exec("UPDATE discussion_contributions SET evidence_ids='[]' WHERE kind='opening'");else db.exec(queries[mutation]!);
  }finally{db.close();}
 }
 assert.throws(()=>inspectMayaHistory(f.ledger,f.archive));assert.throws(()=>f.ledger.authorizeFinal(f.history,'d'.repeat(64),new Date().toISOString(),'e'.repeat(64)));
});
test('Maya cannot receive final release; stale completed callbacks cannot change historical stages',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!;beginFinal(p,f.ledger);const before=historical(f.ledger);
 const maya=p.store.get<{request_id:string}>('SELECT request_id FROM conversation_requests WHERE target_worker_id=?',f.history.atlas.mayaWorkerId)!;
 assert.throws(()=>p.company.creditPilot.release(maya.request_id,null),/approved continuation worker/);
 assert.throws(()=>f.ledger.finish(f.history.atlas.executionId,'completed',true),/identity mismatch/);assert.throws(()=>f.ledger.finish(f.history.mayaExecutionId,'completed',true),/identity mismatch/);assert.equal(historical(f.ledger),before);assert.equal(f.ledger.consumedCount(),3);
});
test('copied manifest, stale source and missing disposable database cannot mint a replacement',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,file=join(p.root,'manifest.json'),m=readFileSync(file,'utf8');
 writeFileSync(file,JSON.stringify({...JSON.parse(m),root:f.dir}));assert.throws(()=>openFinalAtlas(f.ledger,sourceSha),/manifest/);writeFileSync(file,m);
 assert.throws(()=>openFinalAtlas(f.ledger,'2'.repeat(40)),/source/);p.close();rmSync(join(p.root,'company.sqlite'));assert.throws(()=>openFinalAtlas(f.ledger,sourceSha));assert.throws(()=>prepareFinalAtlas(f.ledger,sourceSha),/already/);assert.equal(f.ledger.consumedCount(),3);
});
test('expired owner confirmation blocks final authorization and admission',t=>{
 const h=finalHistoryFixture();t.after(h.cleanup);assert.throws(()=>h.ledger.authorizeFinal(h.history,'d'.repeat(64),new Date(Date.now()-86400001).toISOString(),'e'.repeat(64)),/reload/);
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,input=reserveFinal(f),now=Date.now();t.mock.method(Date,'now',()=>now+86400001);assert.throws(()=>f.ledger.admit(p.s,input,verifiedAccount),/expired|billing/);assert.equal(f.ledger.finalRow().admitted_at,null);t.mock.restoreAll();
});
test('clock advancement across durable reservation cannot extend the final deadline',t=>{
 const f=finalFixture();t.after(f.cleanup);const p=f.f!,earlier=Date.now(),consume=p.company.creditPilot.consume.bind(p.company.creditPilot);let consumed=false;
 t.mock.method(p.company.mandates.clock,'now',()=>earlier+(consumed?1000:0));
 t.mock.method(p.company.creditPilot,'consume',(...args:Parameters<typeof consume>)=>{const result=consume(...args);consumed=true;return result;});
 const input=reserveFinal(f),external=Date.parse(f.ledger.finalRow().reserved_at!);
 assert.ok(external>=earlier);assert.equal(Date.parse(input.localDeadline!),earlier+300000);
 assert.ok(Date.parse(input.localDeadline!)<=external+300000);f.ledger.admit(p.s,input,verifiedAccount);
 assert.equal(f.ledger.finalReceipts().filter(r=>r.kind==='admission_consumed').length,1);assert.equal(f.ledger.consumedCount(),4);
});
for(const mode of ['timeout','no-settlement'])test('final supervisor deadline permanently closes '+mode,async t=>{
 const f=finalFixture(true,false);t.after(f.cleanup);const p=f.f!,fake=transport(mode,p);
 f.ledger.bindAccount(p.s,await fake.runtime.creditPreflight(join(p.root,'workspaces',p.s.workerId)));
 fake.runtime.authorizeWith=(i,a)=>a?f.ledger.admit(p.s,i,a):f.ledger.check(p.s,i);
 // Shorten only the test's local deadline; durable policy still allows at most five minutes.
 t.mock.method(p.company.investmentActivity,'deadline',()=>new Date(Date.now()+2000).toISOString());
 const started=Date.now();await runFinalAtlas(f.ledger,p,fake.runtime);
 assert.ok(Date.now()-started<10000);assert.equal(fake.methods().filter(m=>m==='turn/start').length,1);assert.ok(fake.methods().includes('turn/interrupt'));
 assert.equal(f.ledger.consumedCount(),4);assert.equal(f.ledger.finalRow().state,'stopped');assert.equal(f.ledger.finalRow().uncertain,mode==='no-settlement'?1:0);
 assert.equal(p.company.creditPilot.get()!.state,'stopped');assert.equal(p.company.investmentTeam.scope(p.s.scopeId).state,'revoked');assert.equal(p.company.claimWorkNext(),undefined);
 assert.throws(()=>f.ledger.claimSupervision(p.s));assert.throws(()=>f.ledger.reserve(p.s,f.ledger.finalRow().request_id!,'forbidden-replay',p.s.workerId));
});
