import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {existsSync,mkdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Company} from '../src/control/company.js';
import type {Task} from '../src/domain/model.js';
import type {Project} from '../src/domain/projects.js';
import type {Repository} from '../src/domain/engineering.js';
import type {ProjectOperation} from '../src/control/remote-git.js';
import {localGit} from '../src/control/repository-git.js';
import {validationProfiles} from './validation-profiles.js';
import {ledgerFiles,ledgerPolicy,ledgerObjective} from './fixtures/ledger.js';

type Snapshot=ReturnType<Company['snapshot']>;
const root=fileURLToPath(new URL('../../',import.meta.url));
const data=resolve(process.env.BOT_VALIDATION_DIR??join(root,'.validation',`projects-${new Date().toISOString().replace(/[:.]/g,'-')}`));
assert.ok(!existsSync(join(data,'company.sqlite')),'Use fresh validation state');mkdirSync(data,{recursive:true,mode:0o700});
const started=new Date().toISOString();const identities=process.env.BOT_VALIDATE_IDENTITIES==='1';
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
let child:ChildProcess|undefined;let base='';let token='';const seen=new Set<string>();
const save=(name:string,value:unknown)=>writeFileSync(join(data,name),JSON.stringify(value,null,2),{mode:0o600});
async function api<T>(path:string,body?:unknown):Promise<T>{
  const res=await fetch(`${base}/api/${path}`,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':token},body:JSON.stringify(body)}),signal:AbortSignal.timeout(45000)});
  const out=await res.json() as T&{error?:string};if(!res.ok)throw new Error(out.error??`HTTP ${res.status}`);return out;
}
const profiles=validationProfiles(api);
async function launch(){
  const s=createServer();await new Promise<void>(r=>s.listen(0,'127.0.0.1',r));const port=(s.address() as {port:number}).port;await new Promise<void>(r=>s.close(()=>r()));base=`http://127.0.0.1:${port}`;
  child=spawn(process.execPath,[join(root,'dist/scripts/fixtures/projects-server.js')],{cwd:root,env:{...process.env,BOT_DATA_DIR:data,PORT:String(port)},stdio:['ignore','ignore','inherit']});
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){if(child.exitCode!==null)throw new Error('Validation server stopped');try{token=(await api<{csrfToken:string}>('session')).csrfToken;return;}catch{await sleep(100);}}
  throw new Error('Validation server startup timed out');
}
async function stop(){
  if(!child||child.exitCode!==null)return;const c=child;
  await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>{c.kill('SIGKILL');reject(new Error('Shutdown deadline'));},15000);c.once('exit',()=>{clearTimeout(timeout);resolve();});c.kill('SIGTERM');});child=undefined;
}
async function observe(predicate:(s:Snapshot)=>boolean,timeout=900000){
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){
    const s=await api<Snapshot>('state');await profiles.apply(s);
    if(identities)for(const a of s.infrastructure.approvals.filter(a=>a.status==='pending')){
      const op=s.infrastructure.operations.find(o=>o.operation_id===a.operation_id)!;
      assert.ok(s.workers.some(w=>w.worker_id===op.target_worker_id));
      assert.ok(['create_worker_identity','prepare_worker_project_clone','disable_worker_identity'].includes(op.operation_type));
      if(op.requesting_execution_id&&s.executions.find(e=>e.execution_id===op.requesting_execution_id)?.status!=='completed')continue;
      if(op.operation_type==='prepare_worker_project_clone')assert.ok(s.allocations.some(a=>a.allocation_id===JSON.parse(op.parameters).allocation_id));
      const result=await api<{status:string}>('approvals/decide',{approval_id:a.approval_id,operation_id:op.operation_id,decision:'approve'});assert.equal(result.status,'completed');
      console.log(JSON.stringify({event:'trusted_validation_approval',type:op.operation_type,operation:op.operation_id,approval:a.approval_id}));
    }
    for(const e of s.audit){if(seen.has(e.event_id))continue;seen.add(e.event_id);if(/^(execution_|engineering_submitted|review_submitted|revision_queued|integration_|tool_rejected|worker_provisioned|task_assigned)/.test(e.type))console.log(JSON.stringify({event:e.type,worker:e.worker_id,task:e.task_id,execution:e.execution_id,detail:JSON.parse(e.detail)}));}
    if(predicate(s))return s;
    const failed=s.tasks.find(t=>t.status==='failed'||t.status==='blocked'&&!['waiting_children','waiting_integration'].includes(t.blocking_reason??''));
    if(failed)throw new Error(`Real workflow stopped: ${failed.task_id}: ${failed.blocking_reason}`);
    await sleep(250);
  }
  throw new Error('Real workflow deadline exceeded');
}
const stableKeys=['tasks','executions','submissions','review_rounds','reviews','revision_requests','integrations','allocations','bindings','messages','artifacts'] as const;
const recovery:Record<string,unknown>[]=[];
async function checkpoint(name:string){
  const before=await observe(s=>existsSync(join(data,`gate-${name}.json`))&&s.paused&&!s.executions.some(e=>e.status==='running'));
  save(`checkpoint-${name}.json`,before);await stop();await launch();const after=await api<Snapshot>('state');
  for(const k of stableKeys)assert.deepEqual(after[k],before[k],`${name} restart changed ${k}`);
  assert.ok(after.paused);recovery.push({stage:name,at:new Date().toISOString(),executions:after.executions.length,submissions:after.submissions.length,rounds:after.review_rounds.length,integrations:after.integrations.map(i=>({id:i.integration_id,status:i.status}))});
  console.log(JSON.stringify({event:'restart_checkpoint_passed',stage:name}));await api('pause',{paused:false});return before;
}
try{
  const source=join(data,'external-source');mkdirSync(source);localGit(source,['init','-b','trunk']);
  for(const [path,content]of Object.entries(ledgerFiles)){mkdirSync(dirname(join(source,path)),{recursive:true});writeFileSync(join(source,path),content);}
  localGit(source,['add','.']);localGit(source,['commit','-m','External LedgerBrief acceptance fixture']);
  const initial=localGit(source,['rev-parse','HEAD']);const bundle=join(data,'input.bundle');localGit(source,['bundle','create',bundle,'trunk']);
  const remotes=['publication','divergence'].map(label=>({identity:`botsquad-validation/ledger-${label}`,bare:join(data,`${label}.git`)}));
  for(const r of remotes){localGit(data,['clone','--bare',source,r.bare]);localGit(r.bare,['config','--remove-section','remote.origin']);}
  save('validation-fixture.json',{remotes});await launch();assert.equal((await api<Snapshot>('state')).workers.length,0);
  await api('initialize',{});await api('pause',{paused:true});
  if(identities){
    await api('initialize-nix',{});const before=await api<Snapshot>('state');assert.equal(before.infrastructure.backend,'linux');assert.equal(before.infrastructure.approvals.length,1);
    await stop();await launch();const after=await api<Snapshot>('state');assert.deepEqual(after.infrastructure,before.infrastructure);
    const op=after.infrastructure.operations[0]!;assert.equal((await api<{status:string}>('approvals/decide',{approval_id:op.approval_id,operation_id:op.operation_id,decision:'approve'})).status,'completed');
    await api('infrastructure/request',{worker_id:after.workers.find(w=>w.role==='ceo')!.worker_id,operation_type:'create_worker_identity',allocation_id:null});
    recovery.push({stage:'pending_identity_approval',preserved:true});
  }
  await profiles.apply(await api<Snapshot>('state'));
  const project=await api<Project>('projects/create',{name:'LedgerBrief real acceptance',description:'Imported non-SquadStatus software with staged independent revision acceptance',instructions:ledgerObjective.objective,policy:ledgerPolicy});
  const repository=await api<Repository>('projects/repositories/import',{project_id:project.project_id,repository:{name:'LedgerBrief',default_branch:'trunk',bundle:readFileSync(bundle).toString('base64')}});
  assert.equal(repository.current_commit,initial);assert.equal(repository.source_kind,'imported');
  await api('projects/remote/configure',{repository_id:repository.repository_id,url:`https://github.com/${remotes[0]!.identity}.git`,policy:'approved_push'});
  await api('projects/remote/fetch',{repository_id:repository.repository_id});
  const task=await api<Task>('projects/objective',{project_id:project.project_id,repository_id:repository.repository_id,...ledgerObjective});
  await api('pause',{paused:false});
  for(const stage of ['submissions','revision','resubmission','integration'])await checkpoint(stage);
  const complete=await observe(s=>s.tasks.find(t=>t.task_id===task.task_id)?.status==='completed'&&s.tasks.every(t=>t.status==='completed'));
  await api('pause',{paused:true});profiles.verify(complete);assert.ok(complete.executions.every(e=>e.status==='completed'));
  assert.equal(complete.workers.length,identities?7:6);assert.equal(complete.allocations.length,2);assert.equal(complete.submissions.length,3);assert.equal(complete.review_rounds.length,2);assert.equal(complete.reviews.length,2);assert.equal(complete.integrations.length,1);
  const r1=complete.reviews.find(r=>r.status==='changes_required')!,r2=complete.reviews.find(r=>r.status==='approved')!;assert.ok(r1&&r2);
  const revised=complete.submissions.find(s=>s.revision_round===2)!;const original=complete.submissions.find(s=>s.submission_id===revised.previous_submission_id)!;
  assert.equal(original.worker_id,revised.worker_id);assert.equal(original.task_id,revised.task_id);assert.notEqual(original.commit_sha,revised.commit_sha);
  assert.ok(JSON.parse(r1.source_commits).includes(original.commit_sha));assert.ok(JSON.parse(r2.source_commits).includes(revised.commit_sha));assert.ok(!JSON.parse(r2.source_commits).includes(original.commit_sha));
  for(const r of [r1,r2])assert.ok(complete.audit.some(e=>e.execution_id===r.execution_id&&e.type==='tool_completed'&&JSON.parse(e.detail).tool==='read_review_packet'));
  const integration=complete.integrations[0]!;const repo=complete.repositories[0]!;assert.equal(integration.status,'completed');assert.equal(integration.final_commit,repo.current_commit);assert.equal(integration.candidate_commit,repo.current_commit);assert.equal(localGit(repo.canonical_root,['rev-parse','HEAD']),repo.current_commit);assert.equal(localGit(repo.canonical_root,['status','--porcelain']),'');
  const validation=JSON.parse(integration.validation!);assert.equal(validation.passed,true);assert.ok(validation.recipes.every((r:{passed:boolean})=>r.passed));
  const engineers=['Linus','Ada'].map(name=>{
    const worker=complete.workers.find(w=>w.display_name===name)!;assert.ok(worker);const allocation=complete.allocations.find(a=>a.worker_id===worker.worker_id)!;
    const first=complete.submissions.find(s=>s.allocation_id===allocation.allocation_id&&s.revision_round===1)!;const execution=complete.executions.find(e=>e.execution_id===first.execution_id)!;
    const turn=complete.audit.find(e=>e.execution_id===execution.execution_id&&e.type==='runtime_turn_started')!;assert.ok(turn);
    assert.equal(localGit(allocation.worktree_path,['remote']),'');assert.equal(localGit(allocation.worktree_path,['status','--porcelain']),'');
    assert.ok(complete.audit.filter(e=>e.execution_id===execution.execution_id&&e.type==='tool_rejected').length>=4,'Expected actual rejected scope probes');
    const path=JSON.parse(first.changed_paths)[0] as string;const ownership=statSync(join(allocation.worktree_path,path));
    if(identities)assert.equal(ownership.uid,complete.infrastructure.identities.find(i=>i.worker_id===worker.worker_id)!.uid);
    return {worker_id:worker.worker_id,name,allocation_id:allocation.allocation_id,scope:JSON.parse(allocation.write_scope),clone:allocation.worktree_path,uid:ownership.uid,gid:ownership.gid,execution_id:execution.execution_id,started:execution.started_at,turn_started:turn.created_at,finished:execution.finished_at};
  });
  const overlap=Math.min(...engineers.map(e=>Date.parse(e.finished!)))-Math.max(...engineers.map(e=>Date.parse(e.started)));
  const turnOverlap=Math.min(...engineers.map(e=>Date.parse(e.finished!)))-Math.max(...engineers.map(e=>Date.parse(e.turn_started)));assert.ok(overlap>0&&turnOverlap>0);
  assert.equal(new Set(engineers.map(e=>e.clone)).size,2);if(identities)assert.equal(new Set(engineers.map(e=>e.uid)).size,2);
  const originalExecution=complete.executions.find(e=>e.execution_id===original.execution_id)!,revisionExecution=complete.executions.find(e=>e.execution_id===revised.execution_id)!;assert.equal(originalExecution.runtime_reference,revisionExecution.runtime_reference);
  const policies=complete.audit.filter(e=>e.type==='runtime_policy_applied').map(e=>({execution_id:e.execution_id,...JSON.parse(e.detail)}));assert.equal(policies.length,complete.executions.length);assert.ok(policies.every(p=>p.network===false&&p.sandbox==='read-only'&&p.environments.length===0));
  save('workflow-state.json',complete);
  if(identities&&process.env.BOT_VALIDATE_PROJECT_PROBES==='1'){
    writeFileSync(join(data,'operator-probes-ready'),'Real generic clones ready for harmless UID probes\n',{mode:0o600});
    const deadline=Date.now()+180000;while(!existsSync(join(data,'operator-probes-complete'))&&Date.now()<deadline)await sleep(300);assert.ok(existsSync(join(data,'operator-probes-complete')),'Operator probes deadline');
  }
  const publication=await api<ProjectOperation>('projects/remote/request-push',{repository_id:repo.repository_id,integration_id:integration.integration_id,reason:'Explicitly authorized disposable Prompt 05 remote fixture publication'});
  const envelope=JSON.parse(publication.envelope);assert.equal(envelope.expected_old_sha,initial);assert.equal(envelope.new_sha,repo.current_commit);
  const running=await api<ProjectOperation>('projects/approvals/decide',{approval_id:publication.approval_id,approved:true});assert.equal(running.status,'running');assert.equal(localGit(remotes[0]!.bare,['rev-parse','HEAD']),repo.current_commit);
  await stop();await launch();const reconciled=await api<Snapshot>('state');const published=reconciled.project_operations.find(o=>o.operation_id===publication.operation_id)!;assert.equal(published.status,'completed');assert.equal(JSON.parse(published.result!).reconciled,true);
  await api('projects/remote/retry',{operation_id:publication.operation_id});assert.deepEqual(JSON.parse(readFileSync(join(data,'publication-attempts.json'),'utf8')),[publication.operation_id]);
  recovery.push({stage:'accepted_remote_lost_response',operation_id:publication.operation_id,receipt_count:reconciled.project_receipts.length,publish_attempts:1});
  // Independent remote history fork against a second imported repository. No reset
  // of the accepted publication target or fabricated integration records.
  const imported=join(data,'integrated.bundle');localGit(repo.canonical_root,['bundle','create',imported,'trunk']);
  const second=await api<Repository>('projects/repositories/import',{project_id:project.project_id,repository:{name:'Divergence inspection',default_branch:'trunk',bundle:readFileSync(imported).toString('base64')}});
  await api('projects/remote/configure',{repository_id:second.repository_id,url:`https://github.com/${remotes[1]!.identity}.git`,policy:'fetch_only'});await api('projects/remote/fetch',{repository_id:second.repository_id});
  writeFileSync(join(source,'REMOTE.md'),'Independent remote change\n');localGit(source,['add','REMOTE.md']);localGit(source,['commit','-m','Disposable divergent remote change']);localGit(source,['push',remotes[1]!.bare,'trunk:trunk']);
  await assert.rejects(api('projects/remote/fetch',{repository_id:second.repository_id}));assert.equal(localGit(second.canonical_root,['rev-parse','HEAD']),repo.current_commit);
  const diverged=await api<Snapshot>('state');assert.equal(diverged.repositories.find(r=>r.repository_id===second.repository_id)!.remote_state,'blocked');
  await api('projects/archive',{project_id:project.project_id});const archived=await api<Snapshot>('state');assert.equal(archived.projects.find(p=>p.project_id===project.project_id)!.status,'archived');assert.ok(archived.allocations.every(a=>a.status==='released'));assert.ok(archived.infrastructure.projects.every(p=>p.state==='revoked'));
  await assert.rejects(api('projects/objective',{project_id:project.project_id,repository_id:repo.repository_id,...ledgerObjective}),/archived/);
  for(const key of ['submissions','reviews','review_rounds','integrations','bindings'] as const)assert.deepEqual(archived[key],complete[key]);
  save('archived-state.json',archived);await stop();await launch();const afterArchive=await api<Snapshot>('state');
  for(const key of [...stableKeys,'projects','repositories','allocation_releases','project_operations','project_approvals','project_receipts','infrastructure'] as const)assert.deepEqual(afterArchive[key],archived[key],`Archive restart changed ${key}`);
  recovery.push({stage:'archived',preserved:true,new_work_rejected:true});
  if(identities&&process.env.BOT_VALIDATE_PROJECT_PROBES==='1'){
    const deadline=Date.now()+90000;while(!existsSync(join(data,'archive-probes-complete'))&&Date.now()<deadline)await sleep(300);assert.ok(existsSync(join(data,'archive-probes-complete')),'Archive access probes deadline');
  }
  const sanitized=JSON.parse(JSON.stringify({result:'PASS',started,finished:new Date().toISOString(),source_sha:localGit(root,['rev-parse','HEAD']),project:afterArchive.projects[0],repositories:afterArchive.repositories,workers:complete.workers.map(w=>({worker_id:w.worker_id,name:w.display_name,role:w.role,model:w.ai_model,reasoning:w.reasoning_effort,priority:w.execution_priority})),bindings:complete.bindings,engineers,execution_overlap_ms:overlap,runtime_turn_overlap_ms:turnOverlap,submissions:complete.submissions,reviews:complete.reviews,rounds:complete.review_rounds,integration,recovery,remote:{identity:remotes[0]!.identity,initial,new:repo.current_commit,operation:published,approvals:reconciled.project_approvals,receipts:reconciled.project_receipts,publish_attempts:1,divergence_blocked:true,live_authenticated_github_push:'unvalidated'},scope_denials:complete.audit.filter(e=>e.type==='tool_rejected'),runtime_policies:policies}).replaceAll(data,`.validation/${data.split('/').at(-1)}`));
  save('evidence.json',sanitized);save('final-state.json',afterArchive);console.log(`PASS: real Projects, revision, queue, remote reconciliation, archive. Overlap ${overlap}/${turnOverlap} ms. Evidence ${join(data,'evidence.json')}`);
}catch(error){try{save('failed-state.json',await api('state'));}catch{}console.error(error instanceof Error?error.stack:error);console.error(`Retained validation state: ${data}`);process.exitCode=1;}
finally{await stop();}
