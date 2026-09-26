import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { lstatSync, readFileSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { Company } from '../src/control/company.js';
import { localGit } from '../src/control/engineering.js';
import { runProduct } from '../src/control/product-runner.js';
import { Store, migration1 } from '../src/persistence/store.js';
import { companyTools } from '../src/runtime/adapter.js';
import type { Integration, Repository } from '../src/domain/engineering.js';
import { CEO_CAPABILITIES, COMPANY_CEILING, PROFILES } from '../src/domain/model.js';
import { fixture, until } from './helpers.js';
import { approve, assign, calculateCode, call, delivery, done, engineering, formatCode, hireProfile, readyReview, submit } from './engineering-helpers.js';

test('Prompt 01 schema migrates without losing retained data and only trusted CEO policy expands', async t => {
  const f = fixture(); t.after(() => f.close()); const path = join(f.dir, 'v1.sqlite'); const old = new DatabaseSync(path);
  old.exec('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)'); old.exec(migration1);
  old.exec("INSERT INTO schema_migrations VALUES (1,'original'); INSERT INTO principals VALUES ('human','human','Retained Human',1,'original')");
  const atlas=f.company.initializeCEO();
  old.prepare('INSERT INTO principals VALUES (?,?,?,?,?)').run(atlas.principal_id,'bot','Atlas',1,'original');
  old.prepare('INSERT INTO workers VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(atlas.worker_id,atlas.principal_id,'Atlas','CEO','ceo','Retained mission',null,'fake',atlas.workspace_path,'persistent','idle','["internal_message"]','["internal_message"]',1,null,'original','original');
  old.prepare('INSERT INTO runtime_bindings VALUES (?,?,?,?,?)').run(atlas.worker_id,'fake','retained-thread',atlas.workspace_path,'original');
  old.prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,NULL,'completed',NULL,'Retained result','assignment','original','original')").run('old-task','human',atlas.worker_id,'Retained objective','Retained criteria','Retained constraints');
  old.close();
  const migrated = new Store(path); t.after(() => migrated.close());
  assert.equal(migrated.get<{display_name:string}>("SELECT * FROM principals WHERE principal_id='human'")?.display_name, 'Retained Human');
  assert.equal(migrated.all('SELECT * FROM schema_migrations').length, 4); assert.equal(migrated.all('SELECT * FROM repositories').length, 0);
  const company=new Company(migrated,f.dir,process.cwd(),'fake');
  assert.equal(company.task('old-task').result_summary,'Retained result');assert.equal(company.task('old-task').kind,'research');
  assert.equal(company.binding(atlas.worker_id)?.runtime_reference,'retained-thread');
  assert.ok(migrated.get('SELECT 1 FROM legacy_runtime_bindings WHERE worker_id=?',atlas.worker_id));
  assert.deepEqual(company.worker(atlas.worker_id).capability_profile,[...CEO_CAPABILITIES]);
  assert.deepEqual(company.worker(atlas.worker_id).delegatable_capabilities,[...COMPANY_CEILING]);
});

test('product and delivery managers cannot complete on prose without trusted integration', async t => {
  const f=fixture();t.after(()=>f.close());f.company.assignObjective(assign);const atlas=f.company.claimNext()!;
  assert.throws(()=>done(f,atlas),/trusted integration evidence/);assert.equal(f.company.task(atlas.task.task_id).status,'working');
  f.company.finish(atlas.execution.execution_id,{status:'failed',error:'Expected rejection'});
  const d=delivery(f);assert.throws(()=>done(f,d.cto),/trusted integration evidence/);
  assert.equal(f.company.execution(d.cto.execution.execution_id).status,'running');
});

test('bounded profiles preserve hierarchy, authority ceiling, manager identity and depth', async t => {
  const f = fixture(); t.after(() => f.close()); const d = delivery(f);
  assert.equal(d.maya.role, 'product_manager'); assert.equal(d.turing.manager_worker_id, d.atlas.worker.worker_id);
  assert.ok(!d.maya.capability_profile.includes('repository_write_owned'));
  assert.throws(() => hireProfile(f, d.cto, 'BadCTO', 'cto'), /authority|Disallowed/);
  assert.throws(() => call(f, d.cto, 'hire_worker', { display_name:'Bad',title:'Bad',mission:'Bad',profile:'engineer',capabilities:[...PROFILES.engineer,'create_worker'],lifecycle:'persistent',justification:'Approved in prose' }), /authority/);
  const linus = hireProfile(f, d.cto, 'Linus', 'engineer');
  assert.equal(linus.manager_worker_id, d.turing.worker_id);
  assert.ok(linus.capability_profile.every(c => d.turing.delegatable_capabilities.includes(c)));
  assert.throws(() => call(f, d.cto, 'assign_task', { worker_id:d.maya.worker_id,...assign }), /direct subordinate/);
  // Corrupt hierarchy from outside the worker tool boundary must still fail closed.
  f.store.run('UPDATE workers SET manager_worker_id=? WHERE worker_id=?', d.maya.worker_id, d.turing.worker_id);
  assert.throws(() => hireProfile(f, d.cto, 'Ada', 'engineer'), /depth/);
});

test('managed repository rejects arbitrary paths/source targets and retains a clean remote-free base', async t => {
  const f = fixture(); t.after(() => f.close()); const d = delivery(f);
  for (const args of [{product_name:process.cwd()}, {product_name:'SquadStatus',path:process.cwd()}, {product_name:'../../escape'}]) assert.throws(() => call(f,d.cto,'create_repository',args), /approved|identity-bearing|Invalid product_name/);
  const repo = call<Repository>(f,d.cto,'create_repository',{product_name:'SquadStatus'});
  assert.ok(repo.canonical_root.startsWith(join(f.company.dataDir,'products'))); assert.notEqual(repo.canonical_root,process.cwd());
  assert.equal(localGit(repo.canonical_root,['remote']), ''); assert.equal(localGit(repo.canonical_root,['status','--porcelain']), '');
  assert.equal(call<Repository>(f,d.cto,'create_repository',{product_name:'SquadStatus'}).repository_id, repo.repository_id);
  f.store.run('UPDATE repositories SET canonical_root=? WHERE repository_id=?',process.cwd(),repo.repository_id);
  assert.throws(() => call(f,d.cto,'create_repository',{product_name:'SquadStatus'}), /managed product root/);
});

test('atomic engineering allocation has distinct branches/worktrees and cannot dispatch before manager ends', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);
  assert.equal(e.allocations.length,2); assert.notEqual(e.allocations[0]!.branch_name,e.allocations[1]!.branch_name);assert.notEqual(e.allocations[0]!.worktree_path,e.allocations[1]!.worktree_path);
  assert.equal(f.company.claimNext(),undefined); done(f,e.cto);
  const a=f.company.claimNext()!,b=f.company.claimNext()!;assert.ok(a&&b);assert.notEqual(a.worker.worker_id,b.worker.worker_id);assert.equal(f.company.claimNext(),undefined);
  const own=e.allocations.find(x=>x.worker_id===a.worker.worker_id)!,other=e.allocations.find(x=>x.worker_id===b.worker.worker_id)!;
  assert.throws(()=>call(f,a,'write_source',{allocation_id:other.allocation_id,path:`src/${other.module}.mjs`,content:'escape'}),/mismatch/);
  for(const path of ['../outside','/tmp/outside',process.cwd()+'/src/main.ts','.git',`../${other.allocation_id}/src/${other.module}.mjs`,'src/index.mjs']) assert.throws(()=>call(f,a,'write_source',{allocation_id:own.allocation_id,path,content:'escape'}),/scope/);
  const denials=f.company.snapshot().audit.filter(e=>e.type==='engineering_access_denied'&&e.execution_id===a.execution.execution_id).map(e=>JSON.parse(e.detail));
  for(const scope of ['botsquad_source','sibling_allocation','path_escape'])assert.ok(denials.some(e=>e.scope===scope));
  assert.ok(denials.every(e=>Object.keys(e).sort().join(',')==='scope,tool'));
  assert.throws(()=>call(f,a,'hire_worker',{...assign}),/Missing capability/);
  assert.throws(()=>call(f,a,'inspect_git',{allocation_id:own.allocation_id,command:'reset --hard'}),/identity-bearing/);
  assert.throws(()=>f.store.run("INSERT INTO allocations SELECT 'dup',repository_id,worker_id,task_id,branch_name,worktree_path,base_commit,module,status,created_at,updated_at FROM allocations LIMIT 1"),/UNIQUE/);
  const absolute=join(own.worktree_path,`src/${own.module}.mjs`);renameSync(absolute,absolute+'.saved');symlinkSync(join(other.worktree_path,`src/${other.module}.mjs`),absolute);
  assert.throws(()=>call(f,a,'write_source',{allocation_id:own.allocation_id,path:`src/${own.module}.mjs`,content:'escape'}),/symlink/);
});

test('branch, metadata, task and ownership substitution are rejected before engineering writes', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);done(f,e.cto);const a=f.company.claimNext()!;
  const own=e.allocations.find(x=>x.worker_id===a.worker.worker_id)!;
  localGit(own.worktree_path,['switch','-c','unexpected-branch']);
  assert.throws(()=>call(f,a,'read_source',{allocation_id:own.allocation_id,path:'README.md'}),/branch\/identity/);
  localGit(own.worktree_path,['switch',own.branch_name]);
  f.store.run('UPDATE allocations SET worker_id=? WHERE allocation_id=?',e.grace.worker_id,own.allocation_id);
  assert.throws(()=>call(f,a,'read_source',{allocation_id:own.allocation_id,path:'README.md'}),/mismatch/);
});

test('verified engineering submissions freeze exact commits and reject unrelated/dirty history', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);done(f,e.cto);const a=f.company.claimNext()!;
  const own=e.allocations.find(x=>x.worker_id===a.worker.worker_id)!;
  writeFileSync(join(own.worktree_path,'unrelated.txt'),'unexpected');
  assert.throws(()=>submit(f,a),/unrelated\/dirty/);
  // A separate allocation proves an unrecorded commit is rejected, even if content is valid.
  const b=f.company.claimNext()!;const other=e.allocations.find(x=>x.worker_id===b.worker.worker_id)!;
  call(f,b,'write_source',{allocation_id:other.allocation_id,path:`src/${other.module}.mjs`,content:other.module==='calculate'?calculateCode:formatCode});
  localGit(other.worktree_path,['add','.']);localGit(other.worktree_path,['commit','-m','Unrecorded commit']);
  assert.throws(()=>call(f,b,'submit_engineering',{allocation_id:other.allocation_id,summary:'done'}),/HEAD.*base/);
});

test('real local Git submissions and read-only exact-commit review integrate once and survive restart', async t => {
  const f=fixture();const e=readyReview(f); const packet=call<{submissions:unknown[]}>(f,e.reviewer,'read_review_packet',{});assert.equal(packet.submissions.length,2);
  const tools=companyTools(e.reviewer.worker).map(t=>t.name);assert.ok(!tools.includes('write_source'));assert.ok(!tools.includes('integrate_repository'));
  assert.throws(()=>call(f,e.reviewer,'write_source',{allocation_id:e.allocations[0]!.allocation_id,path:'src/calculate.mjs',content:'bad'}),/Missing capability/);
  assert.throws(()=>call(f,e.reviewer,'submit_review',{status:'approved',source_commits:['0'.repeat(40)]}),/commits/);
  const {review,integrator}=approve(f,e); const args={repository_id:e.repo.repository_id,review_id:review.review_id};
  const result=call<Integration>(f,integrator,'integrate_repository',args);assert.equal(result.status,'completed',result.error??'');
  assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),result.final_commit);
  assert.deepEqual(call(f,integrator,'integrate_repository',args),result); assert.equal(f.company.engineering.integrations().length,1);
  assert.equal(JSON.parse(result.validation!).output.output.trim(),'Total: 4\nWorking: 2\nIdle: 1\nBlocked: 1\nFailed: 0');
  done(f,integrator);done(f,f.company.claimNext()!); const before=f.company.snapshot();await f.close();
  const store=new Store(join(f.dir,'company.sqlite'));const company=new Company(store,f.dir,process.cwd(),'fake');t.after(()=>store.close());company.recover();
  for(const key of ['tasks','executions','artifacts','submissions','reviews','integrations','allocations','repositories'] as const) assert.deepEqual(company.snapshot()[key],before[key]);
  assert.equal(company.claimNext(),undefined);assert.ok(company.engineering.allocations().every(a=>lstatSync(a.worktree_path).isDirectory()));
});

test('changes_required and wrong-repository review prevent integration without advancing main', async t => {
  const f=fixture();t.after(()=>f.close());const e=readyReview(f);const {review,integrator}=approve(f,e,'changes_required');
  assert.throws(()=>call(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id}),/approved review/);
  assert.throws(()=>call(f,integrator,'integrate_repository',{repository_id:'another',review_id:review.review_id}),/unavailable/);
  assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);assert.equal(f.company.engineering.integrations().length,0);
});

test('integrated test failure retains candidate and leaves default branch unchanged', async t => {
  const f=fixture();t.after(()=>f.close());
  const bad=formatCode.replace("return keys.map", "if(s.total===4 && !Object.isFrozen(s)) return 'integration defect';\n  return keys.map");
  const e=readyReview(f,bad);const {review,integrator}=approve(f,e);
  const result=call<Integration>(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});
  assert.equal(result.status,'failed');assert.ok(result.candidate_commit);assert.equal(JSON.parse(result.validation!).tests.passed,false);
  assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);
  assert.throws(()=>call(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id}),/already attempted/);
});

test('actual cherry-pick conflict fails visibly and retains main and candidate evidence', async t => {
  const f=fixture();t.after(()=>f.close());const e=readyReview(f);const {review,integrator}=approve(f,e);
  let injected=false;
  // Emulate an out-of-band candidate change between worktree creation and cherry-pick.
  // This seam is internal to this test; no worker-facing configurable Git command exists.
  Reflect.set(f.company.engineering,'git',(cwd:string,args:string[])=>{
    if(args[0]==='cherry-pick'&&!injected){
      injected=true;const path=localGit(cwd,['diff-tree','--no-commit-id','--name-only','-r',args[1]!]).split('\n')[0]!;
      writeFileSync(join(cwd,path),'export function conflictingChange() { return 123; }\n');
      localGit(cwd,['add','--',path]);localGit(cwd,['commit','-m','Simulated conflicting candidate writer']);
    }
    return localGit(cwd,args);
  });
  const result=call<Integration>(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});
  assert.equal(result.status,'failed');assert.ok(injected);assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);
  const candidate=join(f.company.dataDir,'products',e.repo.repository_id,'integrations',result.integration_id);
  assert.match(localGit(candidate,['status','--porcelain']),/UU/);
});

test('new call IDs cannot duplicate a submission/review and frozen source cannot be changed', async t => {
  const f=fixture();t.after(()=>f.close());const e=readyReview(f);
  const args={status:'approved',source_commits:e.submissions.map(s=>s.commit_sha),linus_findings:'Reviewed calculation',ada_findings:'Reviewed formatting',integration_risks:'Full tests required',acceptance_assessment:'Focused checks pass',recommended_disposition:'Integrate candidate'};
  assert.throws(()=>call(f,e.reviewer,'submit_review',args),/review packet/);
  call(f,e.reviewer,'read_review_packet',{});
  const first=call(f,e.reviewer,'submit_review',args);assert.deepEqual(call(f,e.reviewer,'submit_review',args),first);
  assert.equal(f.company.engineering.reviews().length,1);
  assert.throws(()=>call(f,e.reviewer,'submit_review',{...args,status:'changes_required'}),/immutable/);
  assert.throws(()=>f.store.run("UPDATE submissions SET commit_sha='bad'"),/immutable/);
  assert.throws(()=>f.store.run('DELETE FROM reviews'),/immutable/);
});

test('confined product code cannot read host/sibling files, write, spawn, signal or access network', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);const a=e.allocations[0]!,b=e.allocations[1]!;
  const sentinel=join(f.dir,'private-sentinel.txt');writeFileSync(sentinel,'private');
  symlinkSync(sentinel,join(a.worktree_path,'escape-link'));
  const probe=`import assert from 'node:assert/strict'; import fs from 'node:fs'; import cp from 'node:child_process'; import net from 'node:net';
    for (const path of ${JSON.stringify([sentinel,'escape-link',join(b.worktree_path,'README.md'),join(process.cwd(),'src/main.ts'),'/proc/self/environ','/proc/1/root/etc/passwd'])}) assert.throws(()=>fs.readFileSync(path));
    if(process.platform==='linux') { assert.equal(fs.statSync('.git').isCharacterDevice(),true); assert.throws(()=>fs.writeFileSync('.git','corrupt')); }
    assert.throws(()=>fs.writeFileSync('escaped.txt','no')); assert.throws(()=>cp.execFileSync('/bin/echo',['no']));
    assert.throws(()=>process.kill(process.ppid,0));
    await new Promise((resolve,reject)=>{const socket=net.connect(9,'127.0.0.1');socket.once('error',resolve);socket.once('connect',()=>reject(new Error('Network escaped')));setTimeout(()=>{socket.destroy();reject(new Error('Expected immediate sandbox network denial'));},1000).unref();});
    console.log('confinement checks passed');`;
  writeFileSync(join(a.worktree_path,`test/${a.module}.extra.test.mjs`),probe);
  const result=runProduct(a.worktree_path,[`test/${a.module}.extra.test.mjs`]);assert.equal(result.passed,true,result.output);
  assert.equal(readFileSync(sentinel,'utf8'),'private');
});

test('interrupted engineer and partially recorded Git intent block without replay and retain source', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);done(f,e.cto);const a=f.company.claimNext()!;
  const own=e.allocations.find(x=>x.worker_id===a.worker.worker_id)!;
  call(f,a,'write_source',{allocation_id:own.allocation_id,path:`src/${own.module}.mjs`,content:'// partial evidence'});
  f.company.recover();assert.equal(f.company.task(a.task.task_id).status,'blocked');assert.equal(f.company.execution(a.execution.execution_id).status,'interrupted');
  assert.equal(f.company.engineering.allocations().find(x=>x.allocation_id===own.allocation_id)?.status,'blocked');
  assert.match(readFileSync(join(own.worktree_path,`src/${own.module}.mjs`),'utf8'),/partial evidence/);
  assert.throws(()=>f.company.retry(a.task.task_id,true),/Git inspection/);
});

test('interruption after verified commit allows inspected completion without repeating the commit', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);done(f,e.cto);const claim=f.company.claimNext()!;
  const submission=submit(f,claim);f.company.finish(claim.execution.execution_id,{status:'interrupted',error:'Interrupted after submission'});
  f.company.retry(claim.task.task_id,true);
  // The other queued engineer can be claimed first; find the explicit retry.
  const claims=[f.company.claimNext()!,f.company.claimNext()!];const retry=claims.find(c=>c.task.task_id===claim.task.task_id)!;
  assert.ok(retry);assert.notEqual(retry.execution.execution_id,claim.execution.execution_id);
  assert.throws(()=>call(f,retry,'write_source',{allocation_id:submission.allocation_id,path:'src/calculate.mjs',content:'overwrite'}),/frozen/);
  assert.deepEqual(call(f,retry,'submit_engineering',{allocation_id:submission.allocation_id,summary:'Inspect existing commit'}),submission);
  done(f,retry);assert.equal(f.company.engineering.submissions().length,1);
});

test('legacy runtime tool bindings stay usable for research and fail explicitly for engineering', async t => {
  const f=fixture();t.after(()=>f.close());const atlas=f.company.initializeCEO();
  f.store.run('INSERT INTO legacy_runtime_bindings VALUES (?)',atlas.worker_id);
  f.company.assignObjective({...assign,objective:'Research coordination'});const research=f.company.claimNext()!;
  assert.doesNotThrow(()=>f.company.context(research.context));done(f,research);
  f.company.assignObjective(assign);const product=f.company.claimNext()!;
  assert.throws(()=>f.company.context(product.context),/research-only tool schema/);
  assert.equal(f.company.binding(atlas.worker_id),undefined);
});

test('early product process exit cannot masquerade as passing acceptance tests', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);const a=e.allocations[0]!;
  writeFileSync(join(a.worktree_path,`src/${a.module}.mjs`),'process.exit(0);\n');
  const result=runProduct(a.worktree_path,[`test/${a.module}.test.mjs`]);assert.equal(result.passed,false);
});

test('dispatcher runs two distinct engineers concurrently and duplicate kicks never repeat allocations', async t => {
  const f=fixture();t.after(()=>f.close());const e=engineering(f);done(f,e.cto);
  let releases: (()=>void)[]=[];
  f.runtime.gate=async input=>{
    if(input.worker.role!=='engineer') return {status:'failed',error:'Bounded concurrency test ends before review'};
    await new Promise<void>(resolve=>releases.push(resolve)); return {status:'failed',error:'Controlled test stop'};
  };
  f.dispatcher.start();for(let i=0;i<10;i++)f.dispatcher.kick();await until(()=>releases.length===2);
  assert.equal(f.dispatcher.activeCount,2);assert.equal(f.company.engineering.allocations().length,2);
  assert.equal(new Set(f.runtime.calls.map(c=>c.worker.worker_id)).size,2); releases.forEach(r=>r()); releases=[];
  await until(()=>f.dispatcher.activeCount===0);
});
