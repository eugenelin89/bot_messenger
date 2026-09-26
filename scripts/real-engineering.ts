import { validationProfiles } from './validation-profiles.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { localGit } from '../src/control/engineering.js';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Company } from '../src/control/company.js';
import type { Task } from '../src/domain/model.js';

type Snapshot = ReturnType<Company['snapshot']>;
const root = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = resolve(process.env.BOT_VALIDATION_DIR ?? join(root, '.validation', `engineering-real-${new Date().toISOString().replace(/[:.]/g, '-')}`));
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
let child: ChildProcess | undefined; let token = ''; let base = ''; let seen = new Set<string>();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const server = createServer(); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port; await new Promise<void>(resolve => server.close(() => resolve())); return port;
}
async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${base}/api/${path}`, { ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': token }, body: JSON.stringify(data) }), signal: AbortSignal.timeout(45000) });
  const result = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`); return result;
}
const profiles = validationProfiles(api);
async function launch() {
  const port = await freePort(); base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [join(root, 'dist/src/main.js')], { cwd: root, env: { ...process.env, BOT_DATA_DIR: dataDir, PORT: String(port) }, stdio: ['ignore', 'ignore', 'inherit'] });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('BotSquad failed to start');
    try { token = (await api<{ csrfToken: string }>('session')).csrfToken; console.log(`Started local application: ${base}`); return; }
    catch { await sleep(100); }
  }
  throw new Error('Application startup timed out');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const current = child; current.kill('SIGTERM');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { current.kill('SIGKILL'); reject(new Error('Application shutdown timed out')); }, 15000);
    current.once('exit', () => { clearTimeout(timer); resolve(); });
  });
  child = undefined;
}
async function observe(predicate: (state: Snapshot) => boolean, timeoutMs = 900000): Promise<Snapshot> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await api<Snapshot>('state');
    await profiles.apply(state);
    if (identities) {
      // Explicit operator-authorized acceptance policy, restricted to this fresh validation company.
      // Use the real trusted human HTTP boundary; never set an approval in SQLite.
      for (const approval of state.infrastructure.approvals.filter(a => a.status === 'pending')) {
        const op = state.infrastructure.operations.find(op => op.operation_id === approval.operation_id)!;
        assert.ok(state.workers.some(w => w.worker_id === op.target_worker_id));
        assert.ok(['create_worker_identity','prepare_worker_project_clone','disable_worker_identity'].includes(op.operation_type));
        if (op.requesting_execution_id && state.executions.find(e => e.execution_id === op.requesting_execution_id)?.status !== 'completed') continue;
        const result = await api<{status:string}>('approvals/decide', { approval_id: approval.approval_id, operation_id: op.operation_id, decision: 'approve' });
        assert.equal(result.status, 'completed', `Host operation incomplete: ${op.operation_id}`);
        console.log(JSON.stringify({event:'trusted_validation_approval', operation_id:op.operation_id, approval_id:approval.approval_id, type:op.operation_type}));
      }
    }
    for (const event of state.audit) {
      if (seen.has(event.event_id)) continue; seen.add(event.event_id);
      if (['worker_provisioned', 'task_assigned', 'runtime_started', 'worker_resumed', 'artifact_submitted', 'manager_followup_queued', 'execution_completed', 'execution_failed', 'execution_interrupted', 'tool_rejected', 'repository_created', 'engineering_batch_assigned', 'source_written', 'engineering_submitted', 'review_submitted', 'integration_completed', 'integration_failed'].includes(event.type)) {
        console.log(JSON.stringify({ event: event.type, worker: event.worker_id, task: event.task_id, execution: event.execution_id, detail: JSON.parse(event.detail) as unknown }));
      }
    }
    if (predicate(state)) return state;
    const failure = state.tasks.find(t => t.status === 'failed' || (t.status === 'awaiting_approval' && !(identities && t.kind === 'infrastructure')) || (t.status === 'blocked' && t.blocking_reason !== 'waiting_children'));
    if (failure) throw new Error(`Real workflow stopped: ${failure.task_id}: ${failure.blocking_reason}`);
    await sleep(300);
  }
  throw new Error('Real validation exceeded bounded deadline');
}

function sourceDigest() {
  const files: string[] = [];
  const walk = (dir: string) => { for (const entry of readdirSync(join(root,dir),{withFileTypes:true})) { const path = `${dir}/${entry.name}`; if(entry.isDirectory()) walk(path); else files.push(path); } };
  for(const dir of ['src','public','scripts']) walk(dir);
  files.push('package.json','package-lock.json','tsconfig.json');
  const hash=createHash('sha256'); for(const path of files.sort()) hash.update(path).update('\0').update(readFileSync(join(root,path)));
  return hash.digest('hex');
}
const identities = process.env.BOT_VALIDATE_IDENTITIES === '1';
const started = new Date().toISOString();
try {
  await launch();assert.equal((await api<Snapshot>('state')).workers.length,0,'Fresh data required');
  await api('initialize',{});await api('pause',{paused:true});
  if (identities) {
    await api('initialize-nix',{});
    const before = await api<Snapshot>('state');
    assert.equal(before.infrastructure.backend, 'linux');
    assert.equal(before.infrastructure.approvals.length, 1);
    assert.equal(before.infrastructure.approvals[0]!.status, 'pending');
    await stop(); await launch();
    const after = await api<Snapshot>('state');
    assert.deepEqual(after.infrastructure.approvals, before.infrastructure.approvals);
    assert.deepEqual(after.infrastructure.identities, before.infrastructure.identities);
    const op = after.infrastructure.operations[0]!;
    const result = await api<{status:string}>('approvals/decide', {approval_id:op.approval_id,operation_id:op.operation_id,decision:'approve'});
    assert.equal(result.status,'completed');
    await api('infrastructure/request',{worker_id:after.workers.find(w=>w.role==='ceo')!.worker_id,operation_type:'create_worker_identity',allocation_id:null});
    writeFileSync(join(dataDir,'pending-approval-restart.json'),JSON.stringify({approval:before.infrastructure.approvals[0],preserved:true,no_host_operation_before_approval:true},null,2));
  }
  await profiles.apply(await api<Snapshot>('state'));
  const objective=await api<Task>('objectives',{objective:'Build the SquadStatus validation product using a product and engineering team. Maya must define the product, Turing must coordinate two real concurrent engineers (Linus and Ada) in separate managed worktrees, Grace must review their exact commits, and trusted integration must pass full tests before advancing the local product main. Report the actual evidence to the Human. No external product repository or publishing.'});
  await sleep(200);assert.equal((await api<Snapshot>('state')).executions.length,0);await api('pause',{paused:false});
  const complete=await observe(s=>s.tasks.find(t=>t.task_id===objective.task_id)?.status==='completed' && (!identities || s.tasks.every(t=>t.status==='completed')));
  profiles.verify(complete);
  assert.equal(complete.workers.length,identities?7:6);assert.equal(complete.tasks.filter(t=>t.kind!=='infrastructure').length,6);assert.equal(complete.executions.filter(e=>complete.tasks.find(t=>t.task_id===e.task_id)?.kind!=='infrastructure').length,10);
  assert.ok(complete.tasks.every(t=>t.status==='completed'));assert.ok(complete.executions.every(e=>e.status==='completed'));
  const names=['Atlas','Maya','Turing','Linus','Ada','Grace'];
  const team=Object.fromEntries(names.map(name=>{const w=complete.workers.find(w=>w.display_name===name);assert.ok(w,`Missing ${name}`);assert.equal(w.lifecycle,'persistent');assert.equal(w.enabled,1);return [name,w];}));
  assert.equal(team.Atlas!.manager_worker_id,null);
  for(const name of ['Maya','Turing'])assert.equal(team[name]!.manager_worker_id,team.Atlas!.worker_id);
  for(const name of ['Linus','Ada','Grace'])assert.equal(team[name]!.manager_worker_id,team.Turing!.worker_id);
  assert.equal(complete.bindings.length,identities?7:6);assert.equal(new Set(complete.bindings.map(b=>b.runtime_reference)).size,identities?7:6);
  assert.equal(complete.repositories.length,1);assert.equal(complete.allocations.length,2);assert.equal(complete.submissions.length,2);assert.equal(complete.reviews.length,1);assert.equal(complete.integrations.length,1);
  const repo=complete.repositories[0]!, review=complete.reviews[0]!, integration=complete.integrations[0]!;
  assert.equal(repo.product_name,'SquadStatus');assert.equal(repo.status,'ready');assert.notEqual(repo.canonical_root,root);
  assert.equal(localGit(repo.canonical_root,['remote']),'');assert.equal(localGit(repo.canonical_root,['status','--porcelain']),'');
  assert.ok(complete.audit.some(e=>e.execution_id===review.execution_id&&e.type==='tool_completed'&&JSON.parse(e.detail).tool==='read_review_packet'));
  assert.equal(review.status,'approved');assert.equal(review.worker_id,team.Grace!.worker_id);assert.equal(integration.status,'completed');
  assert.equal(integration.final_commit,repo.current_commit);assert.equal(localGit(repo.canonical_root,['rev-parse','HEAD']),repo.current_commit);
  assert.equal(integration.candidate_commit,integration.final_commit);assert.notEqual(repo.base_commit,repo.current_commit);
  assert.deepEqual(JSON.parse(review.source_commits),complete.submissions.map(s=>s.commit_sha).sort());
  const validation=JSON.parse(integration.validation!);assert.equal(validation.tests.passed,true);assert.equal(validation.output.passed,true);
  assert.equal(validation.output.output.trim(),'Total: 4\nWorking: 2\nIdle: 1\nBlocked: 1\nFailed: 0');
  assert.equal(new Set(complete.allocations.map(a=>a.branch_name)).size,2);assert.equal(new Set(complete.allocations.map(a=>a.worktree_path)).size,2);
  const engineers=['Linus','Ada'].map(name=>{
    const worker=team[name]!;const execution=complete.executions.find(e=>e.worker_id===worker.worker_id)!;
    const allocation=complete.allocations.find(a=>a.worker_id===worker.worker_id)!;const submission=complete.submissions.find(s=>s.allocation_id===allocation.allocation_id)!;
    const turn=complete.audit.find(e=>e.type==='runtime_turn_started'&&e.execution_id===execution.execution_id)!;
    assert.ok(turn);assert.equal(execution.status,'completed');assert.equal(allocation.status,'integrated');assert.equal(submission.execution_id,execution.execution_id);
    assert.equal(localGit(allocation.worktree_path,['rev-parse','HEAD']),submission.commit_sha);assert.equal(localGit(allocation.worktree_path,['status','--porcelain']),'');
    assert.equal(JSON.parse(submission.validation).passed,true);
    assert.ok(complete.audit.filter(e=>e.type==='tool_rejected'&&e.execution_id===execution.execution_id&&/scope|mismatch/.test(e.detail)).length>=4,'Missing actual real-runtime confinement rejection evidence');
    const scopes=complete.audit.filter(e=>e.type==='engineering_access_denied'&&e.execution_id===execution.execution_id).map(e=>JSON.parse(e.detail).scope);
    for(const scope of ['botsquad_source','sibling_allocation','path_escape']) assert.ok(scopes.includes(scope),`Missing actual denied ${scope} probe`);
    return {name,...execution,runtime_turn_started_at:turn.created_at,allocation_id:allocation.allocation_id,branch:allocation.branch_name,worktree:allocation.worktree_path,commit:submission.commit_sha};
  });
  const overlap=Math.min(...engineers.map(e=>Date.parse(e.finished_at!)))-Math.max(...engineers.map(e=>Date.parse(e.started_at)));
  const turnOverlap=Math.min(...engineers.map(e=>Date.parse(e.finished_at!)))-Math.max(...engineers.map(e=>Date.parse(e.runtime_turn_started_at)));
  assert.ok(overlap>0&&turnOverlap>0,`Engineering did not overlap: ${overlap}/${turnOverlap}`);
  const policies=complete.audit.filter(e=>e.type==='runtime_policy_applied').map(e=>({worker_id:e.worker_id,execution_id:e.execution_id,...JSON.parse(e.detail)}));
  assert.equal(policies.length,complete.executions.length);assert.ok(policies.every(p=>p.network===false&&p.sandbox==='read-only'&&p.environments.length===0));
  for(const name of ['Linus','Ada','Grace']){
    const p=policies.find(p=>p.worker_id===team[name]!.worker_id)!;
    for(const forbidden of ['hire_worker','assign_task','integrate_repository','create_repository','shell','browser','computer_use','git_reset','git_push','git_remote'])assert.ok(!p.tools.includes(forbidden));
    if(name==='Grace')assert.ok(!p.tools.includes('write_source')&&!p.tools.includes('submit_engineering'));
  }
  const specTask=complete.tasks.find(t=>t.kind==='spec')!;const specArtifact=complete.artifacts.find(a=>a.artifact_id===repo.spec_artifact_id)!;
  assert.equal(specArtifact.task_id,specTask.task_id);assert.ok(Date.parse(specTask.updated_at)<Math.min(...engineers.map(e=>Date.parse(e.started_at))));
  const artifactText=async(id:string)=>(await fetch(`${base}/api/artifacts/${id}`)).text();
  const spec=await artifactText(repo.spec_artifact_id);const reviewText=await artifactText(review.artifact_id);
  writeFileSync(join(dataDir,'maya-specification.md'),spec);writeFileSync(join(dataDir,'grace-review.json'),reviewText);
  writeFileSync(join(dataDir,'workflow-state.json'),JSON.stringify(complete,null,2));
  await stop();await launch();await sleep(700);const restarted=await api<Snapshot>('state');
  for(const key of ['tasks','messages','executions','artifacts','bindings','repositories','allocations','submissions','reviews','integrations','wake_events'] as const)assert.deepEqual(restarted[key],complete[key],`Restart changed ${key}`);
  assert.ok(restarted.workers.every(w=>w.status==='idle'));assert.equal(restarted.audit.filter(e=>e.type==='manager_followup_queued').length,4);
  const relative=`.validation/${dataDir.split('/').at(-1)}`;
  const sanitize=(value:unknown)=>JSON.parse(JSON.stringify(value).replaceAll(dataDir,relative));
  const evidence=sanitize({started,finished:new Date().toISOString(),result:'PASS',source_digest:sourceDigest(),data_directory:relative,workflow_task_id:objective.task_id,
    workers:complete.workers.map(w=>({worker_id:w.worker_id,name:w.display_name,title:w.title,role:w.role,manager_worker_id:w.manager_worker_id,model:w.ai_model,reasoning:w.reasoning_effort,priority:w.execution_priority,human_lock:!!w.ai_profile_locked})),
    executions:complete.executions,bindings:complete.bindings,engineers,execution_overlap_ms:overlap,runtime_turn_overlap_ms:turnOverlap,repository:repo,submissions:complete.submissions,review,integration,
    specification:{task_id:specTask.task_id,execution_id:specArtifact.execution_id,artifact_id:specArtifact.artifact_id,sha256:specArtifact.sha256},
    runtime_policies:policies,confinement_rejections:complete.audit.filter(e=>['tool_rejected','engineering_access_denied'].includes(e.type)),wake_events:complete.wake_events,
    checks:['six real persistent Codex workers','actual Maya spec before engineering','distinct branch/worktree/commit ownership','real execution and runtime-turn overlap','real denied source/sibling/path writes','role-specific tool surface','real independent exact-commit Grace review','confined full acceptance tests','candidate before safe fast-forward','deterministic product output','process restart preserved all workflow records','no duplicate engineering/review/integration/wake'],
    counts:{workers:complete.workers.length,tasks:complete.tasks.length,executions:complete.executions.length},final_report:complete.tasks.find(t=>t.task_id===objective.task_id)!.result_summary});
  if (identities) {
    assert.ok(complete.infrastructure.identities.every(i=>i.state==='ready' && i.backend==='linux'));
    const uids=complete.infrastructure.identities.map(i=>i.uid); assert.equal(new Set(uids).size,7);
    const ownership=complete.allocations.map(a=>({worker_id:a.worker_id,allocation_id:a.allocation_id,path:a.worktree_path,uid:statSync(join(a.worktree_path,`src/${a.module}.mjs`)).uid,gid:statSync(join(a.worktree_path,`src/${a.module}.mjs`)).gid}));
    for(const file of ownership) assert.equal(file.uid,complete.infrastructure.identities.find(i=>i.worker_id===file.worker_id)!.uid);
    assert.equal(complete.audit.filter(e=>e.type==='worker_uid_commit').length,2);
    Object.assign(evidence,{infrastructure:complete.infrastructure,ownership,pending_approval_restart:true,approval_boundary:'Trusted loopback HTTP, operator-authorized fixed validation scenario; no worker approval tool',test_execution_identity:'Trusted botsquad service inside unchanged product sandbox'});
    await api('infrastructure/request',{worker_id:team.Grace!.worker_id,operation_type:'disable_worker_identity',allocation_id:null});
    const retired=await observe(s=>s.infrastructure.identities.find(i=>i.worker_id===team.Grace!.worker_id)?.state==='disabled' && s.tasks.every(t=>t.status==='completed'));
    assert.equal(retired.workers.find(w=>w.worker_id===team.Grace!.worker_id)!.enabled,0);
    assert.deepEqual(retired.reviews,complete.reviews); assert.deepEqual(retired.submissions,complete.submissions);
    Object.assign(evidence,{retirement:{worker_id:team.Grace!.worker_id,identity:retired.infrastructure.identities.find(i=>i.worker_id===team.Grace!.worker_id),operations:retired.infrastructure.operations.filter(op=>op.operation_type==='disable_worker_identity'),history_preserved:true}});
    writeFileSync(join(dataDir,'retired-state.json'),JSON.stringify(retired,null,2));
    await stop(); await launch(); await sleep(500); const afterRetirement=await api<Snapshot>('state');
    assert.deepEqual(afterRetirement.infrastructure,retired.infrastructure); assert.deepEqual(afterRetirement.executions,retired.executions);
  }
  writeFileSync(join(dataDir,'evidence.json'),JSON.stringify(evidence,null,2));writeFileSync(join(dataDir,'final-state.json'),JSON.stringify(restarted,null,2));
  console.log(`PASS: real engineering/review/integration/restart. Execution overlap ${overlap} ms; runtime-turn overlap ${turnOverlap} ms. Evidence: ${join(dataDir,'evidence.json')}`);
}catch(error){
  try{writeFileSync(join(dataDir,'failed-state.json'),JSON.stringify(await api<Snapshot>('state'),null,2));}catch{}
  console.error(error instanceof Error?error.message:'Real engineering validation failed');console.error(`Retained validation directory: ${dataDir}`);process.exitCode=1;
}finally{await stop();}
