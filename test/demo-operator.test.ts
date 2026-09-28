import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { actions, parseScenario, studyPlan } from '../scripts/demo-operator/scenario.js';
import { boundedPath, executeSteps, Recorder, redact } from '../scripts/demo-operator/recorder.js';
import { demoOrigin } from '../scripts/demo-operator/driver.js';
import { checkApproval, checkBaseline, checkCanonical, type RunScope, type Snapshot } from '../scripts/demo-operator/assertions.js';
import type { Approval, ProtectedOperation } from '../src/domain/infrastructure.js';

test('demo scenario parsing validates identity, complete ordering, deadlines and confined recipes',()=>{
  const s=studyPlan();assert.deepEqual(parseScenario(s),s);
  for(const bad of [null,{...s,operator:'Eugene'},{...s,steps:actions.slice(1)},{...s,steps:[...actions].reverse()},{...s,steps:[...actions,'sql']},{...s,timeout_ms:Infinity},{...s,run:'shell'},{...s,policy:{...s.policy,recipes:[{...s.policy.recipes[0],argv:['--eval','true']}]}}]) assert.throws(()=>parseScenario(bad));
});
test('a failed step or assertion stops all later consequential actions',async()=>{
  const seen:string[]=[];
  await assert.rejects(executeSteps(['create','assert','approve'],async step=>{seen.push(step);if(step==='assert')assert.equal(false,true); }));
  assert.deepEqual(seen,['create','assert']);
});
test('artifact paths reject traversal, absolute paths and existing symlink parents or targets',()=>{
  const root=mkdtempSync(join(tmpdir(),'demo-path-'));mkdirSync(join(root,'screenshots'));const outside=mkdtempSync(join(tmpdir(),'demo-outside-'));
  assert.equal(boundedPath(root,'screenshots/a.png'),join(realpathSync(root),'screenshots/a.png'));
  symlinkSync(outside,join(root,'escape'));symlinkSync(join(outside,'x'),join(root,'link'));
  for(const path of ['../x','/tmp/x','screenshots/../../x','./x','a//b','escape/x','link','a\\b']) assert.throws(()=>boundedPath(root,path));
});
test('events associate existing bounded screenshots and generate a distinct operator/system transcript',()=>{
  const parent=mkdtempSync(join(tmpdir(),'demo-record-'));const rec=new Recorder(join(parent,'run'));
  assert.throws(()=>rec.record({step_id:'create',kind:'operator_action',description:'Created project',result:'pass',screenshot:'screenshots/missing.png'}));
  writeFileSync(rec.path('screenshots/create.png'),'test image');
  rec.record({step_id:'create',kind:'operator_action',description:'Created project',result:'pass',screenshot:'screenshots/create.png'});
  rec.record({step_id:'spec',kind:'system_event',description:'Maya finished specification',result:'observed'});
  const events=JSON.parse(readFileSync(rec.path('events.json'),'utf8'));assert.equal(events.length,2);assert.equal(events[0].screenshot,'screenshots/create.png');
  const transcript=readFileSync(rec.path('transcript.md'),'utf8');assert.match(transcript,/Operator action/);assert.match(transcript,/BotSquad autonomous action/);
  assert.throws(()=>new Recorder(rec.root),'Never overwrite an earlier run');
});
test('structured evidence redacts credentials and private managed host paths',()=>{
  const value=redact({csrfToken:'never-log-me',nested:{authorization:'Bearer private',password:'hidden'},body:'Bearer abc.def.ghi sk-abcdefghijklmnop ghp_abcdefghijklmnop token=plaintext /var/lib/botsquad/.codex/auth.json',key:'-----BEGIN PRIVATE KEY-----\nmaterial\n-----END PRIVATE KEY-----',commit:'1234567890abcdef'});
  const text=JSON.stringify(value);for(const secret of ['never-log-me','private','hidden','abc.def.ghi','abcdefghijklmnop','plaintext','material','auth.json'])assert.ok(!text.includes(secret),secret);
  assert.match(text,/1234567890abcdef/);
});
test('browser origin is restricted to the declared private HQ',()=>{
  assert.equal(demoOrigin('http://127.0.0.1:4310'),'http://127.0.0.1:4310');
  for(const url of ['https://example.com','http://localhost:4310','http://127.0.0.1:4311','http://user:pass@127.0.0.1:4310','http://127.0.0.1:4310/?approve=all'])assert.throws(()=>demoOrigin(url));
});
function bootstrap(){
  const op={operation_id:'op',approval_id:'approval',operation_type:'create_worker_identity',target_worker_id:'nix',requester_principal_id:'human',requester_worker_id:null,requesting_execution_id:null,task_id:null,parameters:'{"worker_id":"nix"}',status:'pending'} as ProtectedOperation;
  const a={approval_id:'approval',operation_id:'op',status:'pending',expires_at:new Date(Date.now()+60000).toISOString()} as Approval;
  const s={workers:[{worker_id:'nix',role:'devops',enabled:1}],infrastructure:{operations:[op]}} as unknown as Snapshot;
  const scope={atlasId:'atlas',nixId:'nix',baselineWorkers:new Set(['atlas']),bootstrapOperationId:'op'} as RunScope;
  return {op,a,s,scope};
}
test('unexpected protected operations, targets, extra parameters and expired approvals stop automation',()=>{
  const {op,a,s,scope}=bootstrap();assert.equal(checkApproval(s,a,scope),op);
  for(const change of [{operation_type:'disable_worker_identity'},{target_worker_id:'other'},{requester_worker_id:'forged'},{parameters:'{"worker_id":"nix","path":"/root"}'},{approval_id:'other'}]) {
    const bad={...s,infrastructure:{...s.infrastructure,operations:[{...op,...change}]}} as Snapshot;
    assert.throws(()=>checkApproval(bad,a,scope));
  }
  assert.throws(()=>checkApproval(s,{...a,expires_at:'2000-01-01T00:00:00Z'},scope));
  assert.throws(()=>checkApproval(s,a,{...scope,bootstrapOperationId:'unknown'}));
});
test('baseline refuses unrelated pending work and canonical advancement requires a trusted integration record',()=>{
  const s={paused:true,workers:[{role:'ceo',enabled:1}],executions:[],tasks:[],project_approvals:[],infrastructure:{backend:'linux',approvals:[]},repositories:[{repository_id:'repo',current_commit:'before'}],integrations:[]} as unknown as Snapshot;
  checkBaseline(s);assert.throws(()=>checkBaseline({...s,paused:false}));assert.throws(()=>checkBaseline({...s,tasks:[{status:'queued'}]} as Snapshot));
  const scope={repositoryId:'repo'} as RunScope;checkCanonical(s,scope,'before');
  assert.throws(()=>checkCanonical({...s,repositories:[{repository_id:'repo',current_commit:'forged'}]} as Snapshot,scope,'before'));
});
test('production demo runner has UI-only mutations, no database, shell or private control-plane shortcuts',()=>{
  const root=join(process.cwd(),'scripts/demo-operator');
  const files=readdirSync(root).filter(f=>f.endsWith('.ts'));
  const source=files.map(f=>readFileSync(join(root,f),'utf8').replace(/^import type .*$/gm,'')).join('\n');
  for(const forbidden of [/node:sqlite/,/node:child_process/,/new Store\(/,/\.request\.(post|put|patch|delete)\(/,/method\s*:\s*['"]POST/,/from ['"].*src\/(control|persistence)\//,/\.evaluate\([^\n]*(fetch|click|request|mutate)/]) assert.doesNotMatch(source,forbidden);
  assert.match(source,/button\.click\(\)/);
});
