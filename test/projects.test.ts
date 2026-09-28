import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,symlinkSync,existsSync,realpathSync,linkSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {localGit,inspectGitMetadata} from '../src/control/repository-git.js';
import {DEFAULT_POLICY,HARD_BOUNDS,normalizeRemote,parsePolicy,parseRecipe,relativePath,overlaps} from '../src/domain/projects.js';
import type {Allocation,Integration,Submission} from '../src/domain/engineering.js';
import {runRecipe,runProduct} from '../src/control/product-runner.js';
import {fixture} from './helpers.js';
import {call,done} from './engineering-helpers.js';
import {allocated,bundle,FILES,ledgerCode,objective,policy,projectDelivery,readyGeneric,recipe,registered,reviewGeneric,submitGeneric} from './projects-helpers.js';

test('Projects persist, contain multiple repositories, use configurable branches and archive without deleting Git',async t=>{
  const f=fixture();t.after(()=>f.close());const p=f.company.projects.create({name:'General',description:'Software',instructions:'Read me',policy:DEFAULT_POLICY});
  const a=f.company.projects.local(p.project_id,{name:'API',default_branch:'trunk'});const b=f.company.projects.local(p.project_id,{name:'Library',default_branch:'stable/release'});
  assert.notEqual(a.repository_id,b.repository_id);assert.equal(a.project_id,b.project_id);assert.equal(localGit(a.canonical_root,['branch','--show-current']),'trunk');
  assert.throws(()=>f.company.assignProjectObjective(p.project_id,a.repository_id,objective),/recipes/);
  f.company.projects.archive(p.project_id);assert.equal(f.company.projects.get(p.project_id,false).status,'archived');assert.ok(existsSync(join(a.canonical_root,'.git')));
  assert.throws(()=>f.company.projects.local(p.project_id,{name:'blocked',default_branch:'main'}),/archived/);
  assert.throws(()=>f.company.assignProjectObjective(p.project_id,b.repository_id,objective),/archived/);
});

test('bounded bundle import preserves history and rejects host paths, unsupported refs, symlinks and oversized inputs',async t=>{
  const f=fixture();t.after(()=>f.close());const r=registered(f);assert.equal(r.repo.current_commit,r.source.base);assert.equal(r.repo.workflow_task_id,null);assert.equal(localGit(r.repo.canonical_root,['remote']),'');
  assert.throws(()=>f.company.projects.import(r.project.project_id,{path:r.source.path,name:'bad',default_branch:'trunk'}),/fields|identity/);
  assert.throws(()=>f.company.projects.import(r.project.project_id,{name:'bad',default_branch:'main',bundle:r.source.bundle}),/branch missing/);
  const bad=bundle(f);symlinkSync('README.md',join(bad.path,'escape'));localGit(bad.path,['add','escape']);localGit(bad.path,['commit','-m','Unsupported symlink']);localGit(bad.path,['bundle','create',join(bad.path,'symlink.bundle'),'trunk']);
  assert.throws(()=>f.company.projects.import(r.project.project_id,{name:'bad',default_branch:'trunk',bundle:readFileSync(join(bad.path,'symlink.bundle')).toString('base64')}),/symlinks/);
  assert.throws(()=>f.company.projects.import(r.project.project_id,{name:'big',default_branch:'trunk',bundle:Buffer.alloc(HARD_BOUNDS.bundle_bytes+1).toString('base64')}),/oversized|limit/);
  const attrs=bundle(f,{...FILES,'.gitattributes':'*.bin filter=lfs'});assert.throws(()=>f.company.projects.import(r.project.project_id,{name:'lfs',default_branch:'trunk',bundle:attrs.bundle}),/LFS/);
  const rows=f.company.engineering.repositories();const files=readdirSync(f.dir,{recursive:true}).sort();
  assert.throws(()=>f.company.projects.import(r.project.project_id,{name:'empty',default_branch:'trunk',bundle:''}),/empty/);
  assert.deepEqual(f.company.engineering.repositories(),rows);assert.deepEqual(readdirSync(f.dir,{recursive:true}).sort(),files);
});

test('paths, overlap, protected instructions, remote identities and recipe argv fail closed',()=>{
  for(const path of ['../x','/etc/passwd','src//x','src/.git/config','src/../x','a\\b','a\0b','src/é','src/a.lock'])assert.throws(()=>relativePath(path));
  assert.ok(overlaps('src/','src/report/'));assert.equal(overlaps('src/report/','src/ledger/'),false);
  assert.deepEqual(normalizeRemote('https://github.com/Owner/Project.git'),{provider:'github',identity:'owner/project',url:'https://github.com/owner/project.git'});
  for(const url of ['https://token@github.com/o/r.git','http://github.com/o/r','https://github.com/o/r?token=x','git@github.com:o/r','file:///tmp/repo','https://github.com.evil/o/r','https://github.com/o/../r'])assert.throws(()=>normalizeRemote(url));
  for(const argv of [['--test','--allow-child-process'],['-e','process.exit(0)'],['--test','../outside'],['--test','test/*.mjs']])assert.throws(()=>parseRecipe({...recipe('unit','focused','test/a.mjs'),argv}));
  assert.throws(()=>parsePolicy({...policy,protected_paths:[]}));assert.throws(()=>parsePolicy({...policy,bounds:{...HARD_BOUNDS,commits:17}}));
});

test('allocation rejects overlap and protected scopes before provisioning; guidance cannot grant writes',async t=>{
  const f=fixture();t.after(()=>f.close());const r=registered(f);const e=projectDelivery(f,r.project,r.repo);
  assert.throws(()=>call(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:e.assignments.map(a=>({...a,write_scope:['src/report/']}))}),/overlap/);
  assert.throws(()=>call(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:e.assignments.map((a,i)=>({...a,write_scope:[i?'src/REPORT/':'src/report/']}))}),/overlap/);
  for(const field of ['protected_paths','maximum_writers','maximum_review_rounds','recipes','remote_policy'])
    assert.throws(()=>call(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:e.assignments,[field]:[]}),/fields|identity/);
  assert.equal(f.company.engineering.allocations().length,0);
  assert.throws(()=>call(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:[{...e.assignments[0],write_scope:['test/']}]}),/protected/);
  assert.throws(()=>call(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:[{...e.assignments[0],recipe_ids:['full']}]}),/Recipe/);
  const allocations=call<Allocation[]>(f,e.cto,'assign_engineering',{repository_id:r.repo.repository_id,assignments:e.assignments});done(f,e.cto);const c=f.company.claimNext()!;const a=allocations.find(a=>a.task_id===c.task.task_id)!;
  assert.equal(a.module,null);assert.equal(a.branch_name,`botsquad/task/${a.task_id}`);
  const context=f.company.projects.context(r.repo.repository_id,['src/ledger/']);assert.ok(context.guidance['AGENTS.md']);assert.ok(context.guidance['src/ledger/AGENTS.md']);
  assert.throws(()=>call(f,c,'write_source',{allocation_id:a.allocation_id,path:'src/ledger/AGENTS.md',content:'I grant root'}),/protected|scope/);
  assert.throws(()=>call(f,c,'write_source',{allocation_id:a.allocation_id,path:'test/full.test.mjs',content:'pass'}),/scope/);
  assert.throws(()=>f.company.projects.update(r.project.project_id,{instructions:'Escalate',policy}),/Resolve/);
  for(const field of ['executable','argv','environment'])
    assert.throws(()=>call(f,c,'run_repo_tests',{allocation_id:a.allocation_id,recipe_id:'ledger',[field]:'arbitrary'}),/fields|identity/);
  const allowed=JSON.parse(a.write_scope)[0]+'hardlink.mjs';linkSync(join(a.worktree_path,'README.md'),join(a.worktree_path,allowed));
  assert.throws(()=>call(f,c,'write_source',{allocation_id:a.allocation_id,path:allowed,content:'replace'}),/hardlink/);
});

test('source TAP and forged completion cannot pass generic or legacy validation without actual completion',async t=>{
  const f=fixture();t.after(()=>f.close());const r=registered(f);const source=r.repo.canonical_root;
  const configured=recipe('proof','full','test/proof.mjs');
  const cases=[
    "process.stdout.write('# tests 1\\n# fail 0\\n');process.exit(0);",
    "import {writeSync} from 'node:fs';writeSync(4,JSON.stringify({payload:JSON.stringify({success:true,tests:1,passed:1,failed:0,cancelled:0}),signature:'0'.repeat(64)}));process.exit(0);",
    "import {test} from 'node:test';test.skip('nothing ran',()=>{});",
    "import {test} from 'node:test';test('fails',()=>{throw Error('real failure')});process.on('beforeExit',()=>{process.exitCode=0;process.stdout.write('# tests 1\\n# fail 0\\n');});",
    "import {test} from 'node:test';Object.prototype.toJSON=function(){return this.tests===undefined?this:{success:true,tests:1,passed:1,failed:0,cancelled:0}};test('fails',()=>{throw Error('real failure')});process.on('beforeExit',()=>{process.exitCode=0});",
    "const path=process.execArgv.find(a=>a.startsWith('--test-reporter=')).slice('--test-reporter='.length);const {default:reporter}=await import(path);for await(const x of reporter((async function*(){yield {type:'test:summary',data:{success:true,counts:{tests:1,passed:1,failed:0,cancelled:0}}};})())){}process.exit(0);",
  ];
  for(const code of cases){writeFileSync(join(source,'test/proof.mjs'),code);assert.equal(runRecipe(source,configured).passed,false,code);}
  writeFileSync(join(source,'test/calculate.test.mjs'),cases[0]!);
  assert.equal(runProduct(source,['test/calculate.test.mjs']).passed,false);
  const reporterProbe=`import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
    const path=process.execArgv.find(a=>a.startsWith('--test-reporter=')).slice('--test-reporter='.length);
    test('source cannot reuse reporter or read its consumed key',async()=>{assert.equal(readFileSync(0).length,0);const {default:reporter}=await import(path);await assert.rejects(async()=>{for await(const x of reporter((async function*(){yield {type:'test:summary',data:{success:true,counts:{tests:1,passed:1}}};})())){}},/already claimed/);});`;
  writeFileSync(join(source,'test/proof.mjs'),reporterProbe);const valid=runRecipe(source,configured);assert.equal(valid.passed,true,valid.output);
});

test('archived Project workers retain compatible bindings when reused on another Project',async t=>{
  const f=fixture();t.after(()=>f.close());const e=allocated(f);done(f,e.cto);
  const workers=f.company.workers().map(w=>w.worker_id);const bindings=[];
  for(const c of [f.company.claimNext()!,f.company.claimNext()!]){
    const binding={worker_id:c.worker.worker_id,runtime_type:c.worker.runtime_type,runtime_reference:'retained-'+c.worker.worker_id,workspace_path:c.worker.workspace_path,created_at:new Date().toISOString(),thread_name:null};
    f.company.setBinding(c.context,binding);bindings.push(f.company.binding(c.worker.worker_id));submitGeneric(f,c);done(f,c);
  }
  const manager=f.company.claimNext()!;call(f,manager,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,manager);
  const review=reviewGeneric(f,f.company.claimNext()!,'approved');const integrate=f.company.claimNext()!;call(f,integrate,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});done(f,integrate);f.company.engineering.processQueue();
  for(let c=f.company.claimNext();c;c=f.company.claimNext())done(f,c);
  f.company.projects.archive(e.project.project_id);
  const second=registered(f);const next=projectDelivery(f,second.project,second.repo);call(f,next.cto,'assign_engineering',{repository_id:second.repo.repository_id,assignments:next.assignments});done(f,next.cto);
  for(const c of [f.company.claimNext()!,f.company.claimNext()!]){
    assert.deepEqual(f.company.binding(c.worker.worker_id),bindings.find(b=>b?.worker_id===c.worker.worker_id));
    f.company.setBinding(c.context,f.company.binding(c.worker.worker_id)!);
    const context=JSON.stringify(f.company.context(c.context));assert.ok(context.includes(second.repo.repository_id));assert.equal(context.includes(e.repo.repository_id),false);
    submitGeneric(f,c);done(f,c);
  }
  assert.deepEqual(f.company.workers().map(w=>w.worker_id),workers);
  assert.equal(f.company.engineering.integrations().filter(i=>i.status==='completed').length,1);
});

test('generic read/write/delete and multi-commit submission retain immutable Git-derived paths',async t=>{
  const f=fixture();t.after(()=>f.close());const e=allocated(f);done(f,e.cto);const c=f.company.claimNext()!;const a=e.allocations.find(a=>a.task_id===c.task.task_id)!;
  assert.match(call<{content:string}>(f,c,'read_source',{allocation_id:a.allocation_id,path:'test/full.test.mjs'}).content,/integration/);
  const scope=(JSON.parse(a.write_scope) as string[])[0]!;const source=scope+'scratch/note.mjs';call(f,c,'write_source',{allocation_id:a.allocation_id,path:source,content:''});assert.ok(existsSync(join(a.worktree_path,source)));
  call(f,c,'delete_source',{allocation_id:a.allocation_id,path:source});assert.equal(existsSync(join(a.worktree_path,source)),false);
  assert.throws(()=>call(f,c,'read_source',{allocation_id:a.allocation_id,path:'.git/config'}),/scope/);
  const code=scope.includes('ledger')?ledgerCode:"export function report(total) {return 'Balance: '+total;}\n";
  call(f,c,'write_source',{allocation_id:a.allocation_id,path:scope+'index.mjs',content:code});call(f,c,'commit_project_changes',{allocation_id:a.allocation_id,summary:'First implementation'});
  call(f,c,'write_source',{allocation_id:a.allocation_id,path:scope+'note.mjs',content:'export const version=1;\n'});
  const s=call<Submission>(f,c,'submit_engineering',{allocation_id:a.allocation_id,summary:'Two scoped commits'});assert.equal(JSON.parse(s.commit_list!).length,2);assert.equal(JSON.parse(s.changed_paths).length,2);
  assert.deepEqual(call(f,c,'submit_engineering',{allocation_id:a.allocation_id,summary:'retry'}),s);
  assert.throws(()=>call(f,c,'delete_source',{allocation_id:a.allocation_id,path:scope+'note.mjs'}),/frozen/);
  assert.throws(()=>f.store.run('UPDATE submissions SET summary=? WHERE submission_id=?','tampered',s.submission_id),/immutable/);
});

test('real Git revision, exact second review, durable queue, second delivery and archive preserve history',async t=>{
  const f=fixture();t.after(()=>f.close());const e=readyGeneric(f);const first=e.submissions.find(s=>s.worker_id===e.linus.worker_id)!;
  const r1=reviewGeneric(f,e.reviewer,'changes_required',first);assert.equal(f.company.engineering.rounds().length,1);
  // Restart after changes_required with the revision durably queued.
  f.company.recover();assert.equal(f.company.engineering.submissions().length,2);
  const revision=f.company.claimNext()!;assert.equal(revision.task.task_id,first.task_id);assert.equal(revision.worker.worker_id,first.worker_id);
  const s2=submitGeneric(f,revision,`export function totals(entries) { if(!Array.isArray(entries)||entries.some(e=>!e||!Number.isFinite(e.amount))) throw new TypeError('finite amounts required');return entries.reduce((a,e)=>a+e.amount,0); }\n`);done(f,revision);
  f.company.recover();assert.equal(f.company.engineering.submissions().length,3);
  assert.equal(s2.previous_submission_id,first.submission_id);assert.notEqual(s2.commit_sha,first.commit_sha);assert.equal(s2.revision_round,2);
  const manager=f.company.claimNext()!;call(f,manager,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,manager);
  const reviewer=f.company.claimNext()!;const r2=reviewGeneric(f,reviewer,'approved');assert.notEqual(r1.round_id,r2.round_id);assert.ok(JSON.parse(r2.source_commits).includes(s2.commit_sha));assert.ok(!JSON.parse(r2.source_commits).includes(first.commit_sha));
  const integrator=f.company.claimNext()!;const queue=call<Integration>(f,integrator,'integrate_repository',{repository_id:e.repo.repository_id,review_id:r2.review_id});assert.equal(queue.status,'queued');done(f,integrator);assert.equal(f.company.task(integrator.task.task_id).blocking_reason,'waiting_integration');
  f.company.recover();f.company.engineering.processQueue();const result=f.company.engineering.integrations()[0]!;assert.equal(result.status,'completed',result.error??'');assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),result.final_commit);
  done(f,f.company.claimNext()!);done(f,f.company.claimNext()!);assert.equal(f.company.task(e.root.task_id).status,'completed');
  // Reuse all durable workers and their original workspaces for another delivery.
  e.allocations.forEach(a=>f.company.projects.release(a.allocation_id));const next=projectDelivery(f,e.project,f.company.projects.repository(e.repo.repository_id));
  const as=call<Allocation[]>(f,next.cto,'assign_engineering',{repository_id:e.repo.repository_id,assignments:next.assignments});assert.ok(as.every(a=>a.base_commit===result.final_commit));done(f,next.cto);
  const cs=[f.company.claimNext()!,f.company.claimNext()!];for(const c of cs){const a=as.find(a=>a.task_id===c.task.task_id)!;const scope=JSON.parse(a.write_scope)[0];const old=call<{content:string}>(f,c,'read_source',{allocation_id:a.allocation_id,path:scope+'index.mjs'}).content;submitGeneric(f,c,old+'\n// Second delivery.\n');done(f,c);}
  const m=f.company.claimNext()!;call(f,m,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,m);const rr=reviewGeneric(f,f.company.claimNext()!,'approved');const i=f.company.claimNext()!;call(f,i,'integrate_repository',{repository_id:e.repo.repository_id,review_id:rr.review_id});done(f,i);f.company.engineering.processQueue();done(f,f.company.claimNext()!);done(f,f.company.claimNext()!);
  assert.equal(f.company.engineering.integrations().filter(i=>i.status==='completed').length,2);
  f.company.projects.archive(e.project.project_id);assert.ok(f.company.engineering.allocations().every(a=>a.status==='released'));assert.equal(f.company.engineering.submissions().length,5);assert.equal(f.company.engineering.reviews().length,3);
  const store2=new Store(join(f.dir,'company.sqlite'));t.after(()=>store2.close());const restarted=new Company(store2,f.dir,process.cwd(),'fake');restarted.recover();assert.equal(restarted.projects.get(e.project.project_id,false).status,'archived');assert.equal(restarted.claimNext(),undefined);
});

test('review-round ceiling escalates to human and never queues an unbounded revision',async t=>{
  const f=fixture();t.after(()=>f.close());const e=readyGeneric(f,1);reviewGeneric(f,e.reviewer,'changes_required',e.submissions[0]);
  assert.match(f.company.task(e.cto.task.task_id).blocking_reason??'',/review_round_limit/);assert.equal(f.company.claimNext(),undefined);assert.equal(f.store.all('SELECT * FROM revision_requests').length,0);
});

test('generic validation permits scratch writes only in disposable copy and denies host, process and network',async t=>{
  const f=fixture();t.after(()=>f.close());const r=registered(f);const sentinel=join(f.dir,'private');writeFileSync(sentinel,'secret');
  const probe=`import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import cp from 'node:child_process';import net from 'node:net';test('sandbox',async()=>{fs.mkdirSync('build',{recursive:true});fs.writeFileSync('build/result','ok');assert.throws(()=>fs.readFileSync(${JSON.stringify(sentinel)}));assert.throws(()=>fs.readFileSync('.git/config'));assert.throws(()=>cp.execFileSync('/bin/echo',['escape']));assert.throws(()=>process.kill(process.ppid,0));await new Promise((resolve,reject)=>{const s=net.connect(9,'127.0.0.1');s.once('error',resolve);s.once('connect',()=>reject(Error('network escaped')));setTimeout(()=>{s.destroy();reject(Error('no network denial'));},1000).unref();});});`;
  writeFileSync(join(r.repo.canonical_root,'test/probe.mjs'),probe);const v=runRecipe(r.repo.canonical_root,recipe('probe','focused','test/probe.mjs'));assert.equal(v.passed,true,v.output);assert.equal(existsSync(join(r.repo.canonical_root,'build')),false);assert.equal(readFileSync(sentinel,'utf8'),'secret');
  writeFileSync(join(r.repo.canonical_root,'test/probe.mjs'),'process.exit(0);');assert.equal(runRecipe(r.repo.canonical_root,recipe('probe','focused','test/probe.mjs')).passed,false);
  writeFileSync(join(r.repo.canonical_root,'.git/config'),'[core]\n hooksPath = /tmp/hooks\n');assert.throws(()=>inspectGitMetadata(r.repo.canonical_root),/configuration/);
});

test('generic recipe deadline and output limits fail closed without accepting early exit',async t=>{
  const f=fixture();t.after(()=>f.close());const source=realpathSync(bundle(f).path);
  writeFileSync(join(source,'test/limit.mjs'),'while(true) {}');
  const configured={...recipe('limit','focused','test/limit.mjs'),timeout_ms:250};
  const timed=runRecipe(source,configured);assert.equal(timed.passed,false);assert.match(timed.output,/exceeded limit/);
  writeFileSync(join(source,'test/limit.mjs'),"process.stdout.write('x'.repeat(100000));");
  const noisy=runRecipe(source,{...configured,timeout_ms:4000,output_bytes:1024});assert.equal(noisy.passed,false);assert.ok(noisy.output.length<1200);
  writeFileSync(join(source,'test/limit.mjs'),'process.exit(0);');assert.equal(runRecipe(source,{...configured,timeout_ms:4000}).passed,false);
});

test('Linux generic recipes cap large buffers and the disposable build filesystem', {skip:process.platform!=='linux'},async t=>{
  const f=fixture();t.after(()=>f.close());const source=realpathSync(bundle(f).path);
  writeFileSync(join(source,'test/limits.mjs'),`import {test} from 'node:test';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
  test('large buffer denied',()=>assert.throws(()=>Buffer.alloc(1024*1024*1024)));
  test('scratch capacity bounded',()=>{const block=Buffer.alloc(1024*1024);let bytes=0;assert.throws(()=>{for(let i=0;i<80;i++){writeFileSync('build/block'+i,block);bytes+=block.length;}});assert.ok(bytes<=64*1024*1024);});`);
  const result=runRecipe(source,{...recipe('limits','full','test/limits.mjs'),timeout_ms:10000});assert.equal(result.passed,true,result.output);
});
