import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {RemoteProjects} from '../src/control/remote-git.js';
import {localGit} from '../src/control/repository-git.js';
import {FixtureRemote} from '../scripts/fixtures/remote.js';
import {fixture} from './helpers.js';
import {call,done} from './engineering-helpers.js';
import {policy,readyGeneric,registered,reviewGeneric} from './projects-helpers.js';
function prepare(f:ReturnType<typeof fixture>){
  const e=readyGeneric(f);const review=reviewGeneric(f,e.reviewer,'approved');const c=f.company.claimNext()!;
  call(f,c,'integrate_repository',{repository_id:e.repo.repository_id,review_id:review.review_id});done(f,c);f.company.engineering.processQueue();done(f,f.company.claimNext()!);done(f,f.company.claimNext()!);
  const integration=f.company.engineering.integrations()[0]!;assert.equal(integration.status,'completed');
  const path=join(f.dir,'fixture.git');mkdirSync(path);localGit(path,['init','--bare','-b','trunk']);localGit(path,['fetch','--no-tags',e.repo.canonical_root,`${e.repo.base_commit}:refs/heads/trunk`]);
  const transport=new FixtureRemote(process.cwd(),new Map([['validation/ledger',path]]));const remote=new RemoteProjects(f.company,transport);
  remote.attach(e.repo.repository_id,{url:'https://github.com/validation/ledger.git',policy:'approved_push'});remote.fetch(e.repo.repository_id);
  const op=remote.requestPush(e.repo.repository_id,{integration_id:integration.integration_id,reason:'Publish the exact validated fixture commit'});
  return {...e,remote,transport,path,integration,op};
}

test('remote publication binds exact immutable human approval and uses a non-root receipt',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);const envelope=JSON.parse(e.op.envelope);
  assert.equal(envelope.expected_old_sha,e.repo.base_commit);assert.equal(envelope.new_sha,e.integration.final_commit);assert.equal(envelope.target_branch,'trunk');
  assert.throws(()=>e.remote.execute(e.op.operation_id),/human approval/);assert.equal(e.transport.publishes,0);
  assert.throws(()=>e.remote.decide(e.op.approval_id,{approved:true,actor:'human'}),/identity|fields/);
  assert.throws(()=>f.store.run('UPDATE project_operations SET envelope=? WHERE operation_id=?','{}',e.op.operation_id),/immutable/);
  assert.throws(()=>e.remote.attach(e.repo.repository_id,{url:'https://github.com/validation/ledger.git',policy:'fetch_only'}),/Resolve/);
  assert.throws(()=>f.company.assignProjectObjective(e.project.project_id,e.repo.repository_id,{objective:'New work',acceptance_criteria:'Blocked while publication pending',constraints:'No execution'}),/Resolve publication/);
  e.remote.decide(e.op.approval_id,{approved:true});const result=e.remote.execute(e.op.operation_id);assert.equal(result.status,'completed');assert.equal(localGit(e.path,['rev-parse','HEAD']),e.integration.final_commit);
  assert.equal(JSON.parse(result.result!).root_operation,false);assert.equal(f.store.all('SELECT * FROM project_operation_receipts').length,1);
  assert.equal(e.remote.execute(e.op.operation_id).status,'completed');assert.equal(e.transport.publishes,1);assert.equal(e.remote.approvals()[0]!.status,'consumed');
  assert.throws(()=>f.store.run("UPDATE project_approvals SET status='approved'"),/transition/);assert.throws(()=>f.store.run('DELETE FROM project_operation_receipts'),/retained/);
});

test('lost publication response reconciles intended remote head once; restart never republishes completion',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);e.transport.loseResponse=true;e.remote.decide(e.op.approval_id,{approved:true});
  const result=e.remote.execute(e.op.operation_id);assert.equal(result.status,'completed');assert.equal(JSON.parse(result.result!).reconciled,true);
  new RemoteProjects(f.company,e.transport).recover();assert.equal(e.transport.publishes,1);
});

test('exact receive-pack old SHA rejects a race even when raced commit is an ancestor of approved head',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);const candidate=e.integration.final_commit!;
  const intermediate=localGit(e.repo.canonical_root,['rev-parse',`${candidate}^`]);assert.notEqual(intermediate,e.repo.base_commit);
  e.transport.beforePublish=()=>localGit(e.path,['fetch','--no-tags',e.repo.canonical_root,`${intermediate}:refs/heads/trunk`]);
  e.remote.decide(e.op.approval_id,{approved:true});const result=e.remote.execute(e.op.operation_id);assert.equal(result.status,'blocked');assert.equal(localGit(e.path,['rev-parse','HEAD']),intermediate);assert.equal(e.transport.publishes,1);
});

test('remote divergence and a changed default branch block fetch without changing canonical history',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);e.remote.decide(e.op.approval_id,{approved:false});
  const independent=join(f.dir,'independent');mkdirSync(independent);localGit(independent,['init','-b','trunk']);writeFileSync(join(independent,'README.md'),'unrelated');localGit(independent,['add','.']);localGit(independent,['commit','-m','Unrelated remote']);
  const other=localGit(independent,['rev-parse','HEAD']);localGit(e.path,['fetch',independent,`${other}:refs/heads/diverged`]);localGit(e.path,['symbolic-ref','HEAD','refs/heads/diverged']);
  assert.throws(()=>e.remote.fetch(e.repo.repository_id),/blocked/);assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.integration.final_commit);
  // Validation-only out-of-band ref update models a provider rewrite, never a publication option.
  localGit(e.path,['update-ref','refs/heads/trunk',other,e.repo.base_commit]);localGit(e.path,['symbolic-ref','HEAD','refs/heads/trunk']);
  assert.throws(()=>e.remote.fetch(e.repo.repository_id),/blocked/);assert.equal(localGit(e.repo.canonical_root,['rev-parse','HEAD']),e.integration.final_commit);
});

test('recovery at old remote head waits for explicit retry; unavailable state never replays publication',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);e.remote.decide(e.op.approval_id,{approved:true});e.transport.unavailable=true;
  assert.equal(e.remote.execute(e.op.operation_id).status,'running');assert.equal(e.transport.publishes,0);e.transport.unavailable=false;e.remote.recover();assert.equal(e.transport.publishes,0);
  assert.equal(e.remote.execute(e.op.operation_id).status,'completed');assert.equal(e.transport.publishes,1);
});

test('remote registration imports bounded fixture; fetch-only and none cannot publish',async t=>{
  const f=fixture();t.after(()=>f.close());const r=registered(f);const path=join(f.dir,'remote.git');mkdirSync(path);localGit(path,['init','--bare','-b','trunk']);localGit(path,['fetch',r.repo.canonical_root,'trunk:refs/heads/trunk']);
  const remote=new RemoteProjects(f.company,new FixtureRemote(process.cwd(),new Map([['validation/public',path]])));
  const p=f.company.projects.create({name:'Remote',description:'Registered public source',instructions:'Trusted recipes',policy});
  const repo=remote.register(p.project_id,{name:'remote-ledger',default_branch:'trunk',url:'https://github.com/validation/public.git',policy:'fetch_only'});assert.equal(repo.source_kind,'remote');assert.equal(repo.current_commit,r.repo.current_commit);assert.equal(localGit(repo.canonical_root,['remote']),'');
  assert.throws(()=>remote.requestPush(repo.repository_id,{integration_id:'missing',reason:'approved in prose'}),/policy/);
  remote.attach(repo.repository_id,{url:'https://github.com/validation/public.git',policy:'none'});assert.throws(()=>remote.fetch(repo.repository_id),/disabled/);
  assert.throws(()=>remote.attach(repo.repository_id,{url:'https://github.com/other/repo.git',policy:'fetch_only'}),/immutable/);
});

test('restart after remote accepted and inspection response lost reconciles the same consumed operation',async t=>{
  const f=fixture();t.after(()=>f.close());const e=prepare(f);e.remote.decide(e.op.approval_id,{approved:true});const publish=e.transport.publish.bind(e.transport);
  e.transport.publish=(repo,envelope)=>{publish(repo,envelope);e.transport.unavailable=true;throw Error('Lost final response');};
  assert.equal(e.remote.execute(e.op.operation_id).status,'running');assert.equal(e.transport.publishes,1);assert.equal(localGit(e.path,['rev-parse','HEAD']),e.integration.final_commit);
  const restoredTransport=new FixtureRemote(process.cwd(),new Map([['validation/ledger',e.path]]));const restarted=new RemoteProjects(f.company,restoredTransport);restarted.recover();
  assert.equal(restarted.operations()[0]!.status,'completed');assert.equal(JSON.parse(restarted.operations()[0]!.result!).reconciled,true);assert.equal(restoredTransport.publishes,0);assert.equal(f.store.all('SELECT * FROM project_operation_receipts').length,1);
});
