import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Integration} from '../src/domain/engineering.js';
import {localGit} from '../src/control/repository-git.js';
import {fixture} from './helpers.js';
import {call,done} from './engineering-helpers.js';
import {allocated,readyGeneric,reviewGeneric,submitGeneric} from './projects-helpers.js';
function queued(f:ReturnType<typeof fixture>){const e=readyGeneric(f);const review=reviewGeneric(f,e.reviewer,'approved');const manager=f.company.claimNext()!;const queue=call<Integration>(f,manager,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});done(f,manager);return {...e,review,queue};}

test('interrupted assigned review resumes by inspection without replacing packet or replaying submissions',async t=>{
  const f=fixture();t.after(()=>f.close());const e=readyGeneric(f);const before=f.company.engineering.rounds()[0]!;const submissions=f.company.engineering.submissions();
  f.company.recover();assert.equal(f.company.task(e.reviewer.task.task_id).status,'blocked');f.company.retry(e.reviewer.task.task_id,true);
  const resumed=f.company.claimNext()!;assert.equal(resumed.task.task_id,e.reviewer.task.task_id);reviewGeneric(f,resumed,'approved');
  assert.deepEqual(f.company.engineering.rounds()[0],before);assert.deepEqual(f.company.engineering.submissions(),submissions);assert.equal(f.company.engineering.reviews().length,1);
});

test('stale queued integration blocks without merging, resetting or hiding the changed canonical head',async t=>{
  const f=fixture();t.after(()=>f.close());const e=queued(f);writeFileSync(join(e.repo.canonical_root,'README.md'),'Independent trusted change\n');localGit(e.repo.canonical_root,['add','README.md']);localGit(e.repo.canonical_root,['commit','-m','Concurrent operator change']);const changed=localGit(e.repo.canonical_root,['rev-parse','HEAD']);
  f.store.run('UPDATE repositories SET current_commit=? WHERE repository_id=?',changed,e.repo.repository_id);f.company.engineering.processQueue();assert.equal(f.company.engineering.integrations()[0]!.status,'blocked');assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),changed);
});

test('failed generic full recipe retains immutable candidate and canonical base',async t=>{
  const f=fixture();t.after(()=>f.close());const e=allocated(f);done(f,e.cto);const cs=[f.company.claimNext()!,f.company.claimNext()!];
  for(const c of cs){submitGeneric(f,c,c.worker.worker_id===e.ada.worker_id?"export function report(n) {return n===17?'integration defect':'Balance: '+n;}\n":undefined);done(f,c);}
  const manager=f.company.claimNext()!;call(f,manager,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,manager);const review=reviewGeneric(f,f.company.claimNext()!,'approved');const c=f.company.claimNext()!;const queue=call<Integration>(f,c,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});done(f,c);f.company.engineering.processQueue();
  const result=f.company.engineering.integrations()[0]!;assert.equal(result.integration_id,queue.integration_id);assert.equal(result.status,'failed');assert.ok(result.candidate_commit);assert.equal(JSON.parse(result.validation!).passed,false);assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);assert.throws(()=>f.store.run("UPDATE integrations SET status='queued' WHERE integration_id=?",queue.integration_id),/immutable/);
});

test('source that forges TAP and exits only during full acceptance cannot advance canonical Git',async t=>{
  const f=fixture();t.after(()=>f.close());const e=allocated(f);done(f,e.cto);
  for(const c of [f.company.claimNext()!,f.company.claimNext()!]){
    submitGeneric(f,c,c.worker.worker_id===e.ada.worker_id?"export function report(n) {if(n===17){process.stdout.write('# tests 1\\n# fail 0\\n');process.exit(0);}return 'Balance: '+n;}\n":undefined);done(f,c);
  }
  const manager=f.company.claimNext()!;call(f,manager,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,manager);
  const review=reviewGeneric(f,f.company.claimNext()!,'approved');const c=f.company.claimNext()!;
  call(f,c,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});done(f,c);f.company.engineering.processQueue();
  const result=f.company.engineering.integrations()[0]!;
  assert.equal(result.status,'failed');assert.ok(result.candidate_commit);assert.equal(JSON.parse(result.validation!).passed,false);
  assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);
  assert.equal(f.company.engineering.repositories()[0]!.current_commit,e.repo.base_commit);
});

test('process crash after validated canonical advance reconciles persisted candidate without cherry-pick replay',async t=>{
  const f=fixture();t.after(()=>f.close());const e=queued(f);const source=process.cwd();
  const child=`import {Store} from ${JSON.stringify(new URL('../src/persistence/store.js',import.meta.url).href)};import {Company} from ${JSON.stringify(new URL('../src/control/company.js',import.meta.url).href)};const store=new Store(${JSON.stringify(join(f.dir,'company.sqlite'))});const c=new Company(store,${JSON.stringify(f.dir)},${JSON.stringify(source)},'fake');Reflect.set(c.engineering,'completeIntegration',()=>process.exit(73));c.engineering.processQueue();`;
  assert.throws(()=>execFileSync(process.execPath,['--input-type=module','-e',child],{cwd:source,stdio:'pipe',timeout:20000}),e=>(e as {status:number}).status===73);
  const interrupted=f.company.engineering.integrations()[0]!;assert.equal(interrupted.status,'running');assert.equal(JSON.parse(interrupted.validation!).passed,true);assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),interrupted.candidate_commit);
  const count=localGit(e.repo.canonical_root,['rev-list','--count','HEAD']);f.company.recover();const recovered=f.company.engineering.integrations()[0]!;assert.equal(recovered.status,'completed');assert.equal(recovered.final_commit,interrupted.candidate_commit);f.company.recover();assert.equal(localGit(e.repo.canonical_root,['rev-list','--count','HEAD']),count);assert.equal(f.company.engineering.integrations().length,1);
});

test('interrupted candidate without validated advance blocks and cannot replay after restart',async t=>{
  const f=fixture();t.after(()=>f.close());const e=queued(f);f.store.run("UPDATE integrations SET status='running' WHERE integration_id=?",e.queue.integration_id);
  f.company.recover();assert.equal(f.company.engineering.integrations()[0]!.status,'blocked');assert.equal(f.company.engineering.repositories()[0]!.status,'blocked');assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.repo.base_commit);f.company.engineering.processQueue();assert.equal(f.company.engineering.integrations().length,1);
});
