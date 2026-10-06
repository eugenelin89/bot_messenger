import {randomUUID, generateKeyPairSync} from 'node:crypto';
import {fixture, objective, hire} from './helpers.js';
import {RemoteClients} from '../src/control/remote-clients.js';
import type {Worker} from '../src/domain/model.js';
import type {ProtectedOperation} from '../src/domain/infrastructure.js';
import {manifestHash} from '../src/domain/projects.js';
import {registered} from './projects-helpers.js';
export type AttentionFixture=ReturnType<typeof fixture>;
export const task=(f:AttentionFixture,status='blocked',reason='Inspection needed')=>{
  const w=f.company.initializeCEO();const t=f.company.createTask('human',w,objective,null);
  f.store.run('UPDATE tasks SET status=?,blocking_reason=? WHERE task_id=?',status,reason,t.task_id);return t;
};
export function computer(f:AttentionFixture){const w=f.company.initializeComputerOperator({display_name:'Browser fixture'});
  return f.company.computers.request({worker_id:w.worker_id,...objective,policy:{origins:['https://example.com'],expiresAt:new Date(Date.now()+3600000).toISOString()}});}
export function mandate(f:AttentionFixture){const w=f.company.initializeCEO();return f.company.mandates.create({title:'Fixture mandate',objective:'Inspect evidence',success_criteria:'Bounded assessment',stop_criteria:'Stop at limits',constraints:'No external effects',resources:'Internal only',coordinator_id:w.worker_id,envelope:{}});}
export function group(f:AttentionFixture){const w=f.company.initializeCEO();return f.company.discussions.create({topic:'Fixture comparison',desired_output:'Compare alternatives',constraints:'No execution',participant_ids:[],facilitator_id:w.worker_id,synthesizer_id:w.worker_id,organize_with_atlas:true,allow_incomplete:true,allow_research:false,receipt_key:randomUUID()});}
export function device(f:AttentionFixture){const trust=new RemoteClients(f.company),p=trust.createPairing({capabilities:['state:read']}),key=generateKeyPairSync('ed25519');
  const d=trust.claim({pairing_id:p.pairing_id,hq_id:p.hq_id,pairing_secret:p.pairing_secret,public_key:key.publicKey.export({format:'jwk'}),display_name:'Fixture device',platform:'test',app_version:'1'}).device;return {trust,p,d};}
export function infrastructure(f:AttentionFixture){f.company.initializeNix();const bootstrap=f.company.infrastructure.operations()[0]!;f.company.infrastructure.decide({approval_id:bootstrap.approval_id,operation_id:bootstrap.operation_id,decision:'approve'});
  f.company.assignObjective(objective);const atlas=f.company.claimNext()!;const scout=f.company.callTool(atlas.context,'hire','hire_worker',hire) as Worker;f.company.finish(atlas.execution.execution_id,{status:'completed',settled:true,summary:'Fixture roster'});
  const t=f.company.infrastructure.enqueue(scout.worker_id)!;const run=f.company.claimNext()!;const op=f.company.callTool(run.context,'create','request_create_worker_identity',{reason:'Fixture exact request'}) as ProtectedOperation;
  f.company.finish(run.execution.execution_id,{status:'completed',settled:true,summary:'Await decision'});return {t,op,scout};}
export function publication(f:AttentionFixture){const {project,repo}=registered(f);const id='operation_'+randomUUID(),approval='approval_'+randomUUID(),now=new Date().toISOString();
  const envelope={operation_id:id,approval_id:approval,operation_type:'remote_push',project_id:project.project_id,repository_id:repo.repository_id,provider:'github',identity:'fixture/repo',url:'https://github.com/fixture/repo.git',target_branch:'trunk',expected_old_sha:'a'.repeat(40),new_sha:'b'.repeat(40),integration_id:'fixture'};
  const hash=manifestHash(envelope);
  // Isolated durable pending-publication fixture; no transport or provider is invoked.
  f.store.run("INSERT INTO project_operations VALUES (?,?,'remote_push',?,?,?,?,?,'pending',?,NULL,NULL)",id,approval,project.project_id,repo.repository_id,JSON.stringify(envelope),hash,'PRIVATE_PROVIDER_PAYLOAD',now);
  f.store.run("INSERT INTO project_approvals VALUES (?,?,?,'pending',?,?,NULL,NULL,NULL)",approval,id,hash,now,new Date(Date.now()+3600000).toISOString());return {id,approval,repo,project};}
export function databaseImage(f:AttentionFixture){return f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(({name})=>[name,f.store.all(`SELECT * FROM "${name.replaceAll('"','""')}"`)]);}
