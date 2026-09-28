import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import type {Company} from './company.js';
import type {Integration,Repository} from '../domain/engineering.js';
import {branchName,HARD_BOUNDS,manifestHash,normalizeRemote} from '../domain/projects.js';
import {requireThat,strictObject,textField} from '../domain/model.js';
import {boundedGit} from './bounded-git.js';
export {boundedGit} from './bounded-git.js';
import {canonical} from '../domain/infrastructure.js';
import {inspectGitMetadata,inspectObjects,inspectTree,isSha,localGit} from './repository-git.js';

const now=()=>new Date().toISOString();
const id=(type:string)=>`${type}_${randomUUID()}`;
export interface RemoteEnvelope {
  operation_id:string; approval_id:string; operation_type:'remote_push';project_id:string;repository_id:string;
  provider:string;identity:string;url:string;target_branch:string;expected_old_sha:string;new_sha:string;integration_id:string;
}
export interface ProjectOperation {
  operation_id:string;approval_id:string;operation_type:string;project_id:string;repository_id:string;envelope:string;envelope_hash:string;reason:string;
  status:'pending'|'running'|'completed'|'blocked'|'denied'|'expired';requested_at:string;result:string|null;error:string|null;
}
export interface ProjectApproval {approval_id:string;operation_id:string;envelope_hash:string;status:'pending'|'approved'|'consumed'|'denied'|'expired';requested_at:string;expires_at:string;decided_at:string|null;decided_by:string|null;consumed_at:string|null}
export interface RemoteTransport {
  inspect(repo:Repository):string;
  fetch(repo:Repository,ref:string):void;
  publish(repo:Repository,envelope:RemoteEnvelope):void;
}
export function publicationPacket(sourceRoot:string,repo:Repository,e:RemoteEnvelope) {
  requireThat(isSha(e.expected_old_sha)&&isSha(e.new_sha)&&e.expected_old_sha!==e.new_sha&&!/^0+$/.test(e.expected_old_sha)&&!/^0+$/.test(e.new_sha),'Publication needs existing nonzero commits');branchName(e.target_branch);
  localGit(repo.canonical_root,['merge-base','--is-ancestor',e.expected_old_sha,e.new_sha]);
  const pack=boundedGit(sourceRoot,repo.canonical_root,['pack-objects','--stdout','--revs'],`${e.new_sha}\n^${e.expected_old_sha}\n`,HARD_BOUNDS.bundle_bytes);
  requireThat(pack.length<=HARD_BOUNDS.bundle_bytes&&pack.subarray(0,4).toString()==='PACK','Publication pack exceeds bounds');
  const command=Buffer.from(`${e.expected_old_sha} ${e.new_sha} refs/heads/${e.target_branch}\0report-status\n`);
  return Buffer.concat([Buffer.from((command.length+4).toString(16).padStart(4,'0')),command,Buffer.from('0000'),pack]);
}
export class GithubTransport implements RemoteTransport {
  // Optional operator-selected service-owned 0600 file. Never inherited Git/gh auth.
  constructor(readonly sourceRoot:string,readonly tokenFile:string|undefined=process.env.BOTSQUAD_GITHUB_TOKEN_FILE) {}
  private target(repo:Repository) {const n=normalizeRemote(repo.remote_url);requireThat(n.identity===repo.remote_identity&&n.provider===repo.remote_provider,'Remote identity mismatch');return n;}
  inspect(repo:Repository) {
    const n=this.target(repo);
    const result=boundedGit(this.sourceRoot,repo.canonical_root,['ls-remote','--symref','--',n.url,'HEAD',`refs/heads/${repo.default_branch}`]).toString();
    requireThat(result.includes(`ref: refs/heads/${repo.default_branch}\tHEAD\n`),'Remote default branch changed');
    const rows=result.trim().split('\n').filter(r=>r.endsWith(`\trefs/heads/${repo.default_branch}`));
    requireThat(rows.length===1&&isSha(rows[0]!.split('\t')[0]),'Remote branch is missing or unsupported');return rows[0]!.split('\t')[0]!;
  }
  fetch(repo:Repository,ref:string) {
    const n=this.target(repo);requireThat(/^refs\/botsquad\/remote\/[A-Za-z0-9_-]+$/.test(ref),'Invalid trusted fetch ref');
    boundedGit(this.sourceRoot,repo.canonical_root,['fetch','--no-tags','--no-write-fetch-head','--no-recurse-submodules','--',n.url,`refs/heads/${repo.default_branch}:${ref}`]);
  }
  publish(repo:Repository,e:RemoteEnvelope) {
    this.target(repo);requireThat(this.tokenFile,'GitHub publication credential is not configured by the operator');
    const packet=publicationPacket(this.sourceRoot,repo,e);
    execFileSync('/usr/bin/python3',[join(this.sourceRoot,'deploy/github-publish.py'),e.identity,e.target_branch,e.expected_old_sha,e.new_sha,this.tokenFile],{cwd:repo.canonical_root,env:{PATH:'/usr/bin:/bin',LANG:'C'},input:packet,timeout:40000,maxBuffer:65536,stdio:['pipe','pipe','pipe']});
  }
}
export class RemoteProjects {
  constructor(readonly company:Company,readonly transport:RemoteTransport) {}
  private get store(){return this.company.store;}
  operations(){return this.store.all<ProjectOperation>('SELECT * FROM project_operations ORDER BY requested_at,rowid');}
  approvals(){this.expire();return this.store.all<ProjectApproval>('SELECT * FROM project_approvals ORDER BY requested_at,rowid');}
  private operation(operationId:string){const op=this.store.get<ProjectOperation>('SELECT * FROM project_operations WHERE operation_id=?',operationId);requireThat(op,'Project operation not found');return op;}
  private idle(repo:Repository){
    requireThat(!this.store.get("SELECT 1 FROM task_scopes s JOIN tasks t USING(task_id) WHERE s.repository_id=? AND t.status NOT IN ('completed','failed','cancelled')",repo.repository_id),'Resolve repository tasks before remote mutation');
    requireThat(!this.store.get("SELECT 1 FROM integrations WHERE repository_id=? AND status IN ('queued','running','preparing')",repo.repository_id),'Integration prevents remote mutation');
  }
  private verified(repositoryId:string){
    const repo=this.company.projects.repository(repositoryId);inspectGitMetadata(repo.canonical_root);
    requireThat(repo.canonical_root===join(this.company.dataDir,'products',repo.repository_id,'main')&&realpathSync(repo.canonical_root)===repo.canonical_root,'Canonical repository mismatch');
    requireThat(localGit(repo.canonical_root,['branch','--show-current'])===repo.default_branch&&localGit(repo.canonical_root,['rev-parse','HEAD'])===repo.current_commit&&!localGit(repo.canonical_root,['status','--porcelain']),'Canonical state changed or dirty');
    const n=normalizeRemote(repo.remote_url);requireThat(n.provider===repo.remote_provider&&n.identity===repo.remote_identity&&n.url===repo.remote_url,'Remote identity mismatch');return repo;
  }
  attach(repositoryId:string,value:unknown){
    const a=strictObject(value,['url','policy']);const n=normalizeRemote(a.url);requireThat(['none','fetch_only','approved_push'].includes(String(a.policy)),'Invalid remote policy');
    const repo=this.company.projects.repository(repositoryId);this.idle(repo);
    requireThat(!repo.remote_identity||repo.remote_identity===n.identity,'Registered remote identity is immutable; register another repository');
    requireThat(!this.operations().some(o=>o.repository_id===repositoryId&&['pending','running'].includes(o.status)),'Resolve protected publication first');
    this.store.run('UPDATE repositories SET remote_provider=?,remote_identity=?,remote_url=?,remote_policy=?,remote_state=?,updated_at=? WHERE repository_id=?',n.provider,n.identity,n.url,String(a.policy),repo.remote_sha?'configured':'unfetched',now(),repositoryId);
    this.company.audit('repository_remote_policy','human',{repository_id:repositoryId,remote_identity:n.identity,policy:a.policy});return this.company.projects.repository(repositoryId);
  }
  register(projectId:string,value:unknown){
    const a=strictObject(value,['name','default_branch','url','policy']);const n=normalizeRemote(a.url);const branch=branchName(a.default_branch);
    requireThat(a.policy==='fetch_only'||a.policy==='approved_push','Remote registration requires fetch policy');this.company.projects.get(projectId);
    const path=join(this.company.dataDir,'remote-imports',id('import'));mkdirSync(path,{recursive:true,mode:0o700});requireThat(realpathSync(path)===path,'Import staging path mismatch');localGit(path,['init','-b',branch]);
    const temporary={canonical_root:path,default_branch:branch,remote_url:n.url,remote_identity:n.identity,remote_provider:n.provider} as Repository;
    const expected=this.transport.inspect(temporary);const ref=`refs/botsquad/remote/${id('fetch')}`;this.transport.fetch(temporary,ref);
    const head=localGit(path,['rev-parse',ref]);requireThat(head===expected,'Remote changed during registration');const bounds=this.company.projects.policy(projectId).bounds;inspectObjects(path,bounds);inspectTree(path,head,bounds);
    localGit(path,['update-ref',`refs/heads/${branch}`,head,'0'.repeat(40)]);const bundle=join(path,'import.bundle');localGit(path,['bundle','create',bundle,branch]);
    const bytes=readFileSync(bundle);requireThat(bytes.length<=bounds.bundle_bytes,'Remote bundle exceeds bounds');
    const repo=this.company.projects.initialize(projectId,textField(a,'name',100),branch,'remote',{bundle:bytes.toString('base64')});this.attach(repo.repository_id,{url:n.url,policy:a.policy});
    this.store.run("UPDATE repositories SET remote_sha=?,remote_state='in_sync' WHERE repository_id=?",head,repo.repository_id);return this.company.projects.repository(repo.repository_id);
  }
  fetch(repositoryId:string){
    const repo=this.verified(repositoryId);requireThat(repo.remote_policy!=='none','Remote fetching is disabled');this.idle(repo);
    requireThat(!this.operations().some(o=>o.repository_id===repositoryId&&['pending','running'].includes(o.status)),'Resolve protected publication before fetching');
    try{
      const expected=this.transport.inspect(repo);const ref=`refs/botsquad/remote/${id('fetch')}`;this.transport.fetch(repo,ref);const remote=localGit(repo.canonical_root,['rev-parse',ref]);requireThat(remote===expected,'Remote changed during fetch');
      inspectObjects(repo.canonical_root,this.company.projects.policy(repo.project_id).bounds);inspectTree(repo.canonical_root,remote,this.company.projects.policy(repo.project_id).bounds);
      if(repo.remote_sha)localGit(repo.canonical_root,['merge-base','--is-ancestor',repo.remote_sha,remote]);
      let state='in_sync';let final=repo.current_commit;
      if(remote!==repo.current_commit){
        let ahead=false;try{localGit(repo.canonical_root,['merge-base','--is-ancestor',remote,repo.current_commit]);ahead=true;}catch{/* Check the other direction. */}
        if(ahead)state='local_ahead';else{localGit(repo.canonical_root,['merge-base','--is-ancestor',repo.current_commit,remote]);localGit(repo.canonical_root,['merge','--ff-only',remote]);final=remote;}
      }
      this.store.run('UPDATE repositories SET current_commit=?,remote_sha=?,remote_state=?,updated_at=? WHERE repository_id=?',final,remote,state,now(),repositoryId);
      this.company.audit('repository_remote_fetched','human',{repository_id:repositoryId,remote_identity:repo.remote_identity,remote_sha:remote,canonical_sha:final,state});return this.company.projects.repository(repositoryId);
    }catch{
      this.store.run("UPDATE repositories SET remote_state='blocked',updated_at=? WHERE repository_id=?",now(),repositoryId);
      this.company.audit('repository_remote_blocked','human',{repository_id:repositoryId});throw new Error('Remote fetch blocked: inspect identity, branch, bounds and divergence; canonical history was not reset');
    }
  }
  requestPush(repositoryId:string,value:unknown){
    const a=strictObject(value,['integration_id','reason']);const repo=this.verified(repositoryId);this.idle(repo);requireThat(repo.remote_policy==='approved_push','Remote policy does not permit publication');
    const integration=this.store.get<Integration>("SELECT * FROM integrations WHERE integration_id=? AND repository_id=? AND status='completed'",textField(a,'integration_id',100),repositoryId);
    requireThat(integration&&integration.final_commit===repo.current_commit,'Only the current integrated commit may be published');
    const existing=this.operations().find(o=>o.repository_id===repositoryId&&['pending','running'].includes(o.status));if(existing){requireThat(JSON.parse(existing.envelope).new_sha===integration.final_commit,'Another publication is pending');return existing;}
    requireThat(repo.remote_sha&&repo.remote_state!=='blocked','Fetch and inspect the remote before publication');const old=this.transport.inspect(repo);
    requireThat(old===repo.remote_sha,'Remote changed since fetch; inspect and fetch before requesting approval');requireThat(old!==repo.current_commit,'Integrated commit is already published');
    localGit(repo.canonical_root,['merge-base','--is-ancestor',old,repo.current_commit]);
    const operationId=id('operation'),approvalId=id('approval'),requested=now();const envelope:RemoteEnvelope={operation_id:operationId,approval_id:approvalId,operation_type:'remote_push',project_id:repo.project_id,repository_id:repositoryId,provider:repo.remote_provider!,identity:repo.remote_identity!,url:repo.remote_url!,target_branch:repo.default_branch,expected_old_sha:old,new_sha:repo.current_commit,integration_id:integration.integration_id};
    const content=canonical(envelope),hash=manifestHash(envelope);const reason=textField(a,'reason',2000);
    this.store.transaction(()=>{this.store.run("INSERT INTO project_operations VALUES (?,?,'remote_push',?,?,?,?,?,'pending',?,NULL,NULL)",operationId,approvalId,repo.project_id,repositoryId,content,hash,reason,requested);this.store.run("INSERT INTO project_approvals VALUES (?,?,?,'pending',?,?,NULL,NULL,NULL)",approvalId,operationId,hash,requested,new Date(Date.now()+3600000).toISOString());this.company.audit('project_approval_requested','human',{operation_id:operationId,approval_id:approvalId,envelope});});return this.operation(operationId);
  }
  private expire(){for(const a of this.store.all<ProjectApproval>("SELECT * FROM project_approvals WHERE status IN ('pending','approved') AND expires_at<=?",now()))this.store.transaction(()=>{this.store.run("UPDATE project_approvals SET status='expired' WHERE approval_id=?",a.approval_id);this.store.run("UPDATE project_operations SET status='expired',error='Approval expired' WHERE operation_id=?",a.operation_id);this.company.audit('project_approval_expired','system',{approval_id:a.approval_id,operation_id:a.operation_id});});}
  decide(approvalId:string,value:unknown){
    const a=strictObject(value,['approved']);requireThat(typeof a.approved==='boolean','Trusted approval requires an explicit boolean');this.expire();
    const approval=this.store.get<ProjectApproval>('SELECT * FROM project_approvals WHERE approval_id=?',approvalId);requireThat(approval?.status==='pending','Approval is not pending');const op=this.operation(approval.operation_id);
    requireThat(manifestHash(JSON.parse(op.envelope))===op.envelope_hash&&approval.envelope_hash===op.envelope_hash,'Approval envelope mismatch');
    this.store.transaction(()=>{this.store.run("UPDATE project_approvals SET status=?,decided_at=?,decided_by='human' WHERE approval_id=?",a.approved?'approved':'denied',now(),approvalId);if(!a.approved)this.store.run("UPDATE project_operations SET status='denied' WHERE operation_id=?",op.operation_id);this.company.audit('project_approval_decided','human',{approval_id:approvalId,operation_id:op.operation_id,approved:a.approved});});return this.operation(op.operation_id);
  }
  private validate(op:ProjectOperation){
    const e=JSON.parse(op.envelope) as RemoteEnvelope;requireThat(manifestHash(e)===op.envelope_hash&&e.operation_id===op.operation_id&&e.approval_id===op.approval_id&&e.operation_type==='remote_push','Operation envelope mismatch');
    const repo=this.verified(op.repository_id);this.idle(repo);requireThat(repo.remote_policy==='approved_push'&&repo.project_id===e.project_id&&repo.repository_id===e.repository_id&&repo.remote_identity===e.identity&&repo.remote_url===e.url&&repo.remote_provider===e.provider&&repo.default_branch===e.target_branch&&repo.current_commit===e.new_sha,'Publication policy or repository changed');
    requireThat(this.store.get("SELECT 1 FROM integrations WHERE integration_id=? AND repository_id=? AND status='completed' AND final_commit=?",e.integration_id,e.repository_id,e.new_sha),'Integrated publication evidence missing');
    localGit(repo.canonical_root,['merge-base','--is-ancestor',e.expected_old_sha,e.new_sha]);return {repo,e};
  }
  private finish(op:ProjectOperation,sha:string,reconciled:boolean){
    const result={remote_sha:sha,reconciled,executor:'trusted_service',root_operation:false};
    this.store.transaction(()=>{this.store.run('INSERT INTO project_operation_receipts VALUES (?,?,?,?)',op.operation_id,op.envelope_hash,JSON.stringify(result),now());this.store.run("UPDATE project_operations SET status='completed',result=?,error=NULL WHERE operation_id=?",JSON.stringify(result),op.operation_id);this.store.run("UPDATE repositories SET remote_sha=?,remote_state='in_sync' WHERE repository_id=?",sha,op.repository_id);this.company.audit('repository_published','system',{operation_id:op.operation_id,...result});});
  }
  private block(op:ProjectOperation){this.store.run("UPDATE project_operations SET status='blocked',error='Remote or trusted publication preconditions changed; inspect before a new approval' WHERE operation_id=?",op.operation_id);this.store.run("UPDATE repositories SET remote_state='blocked' WHERE repository_id=?",op.repository_id);this.company.audit('repository_publication_blocked','system',{operation_id:op.operation_id});}
  execute(operationId:string,inspectOnly=false){
    this.expire();let op=this.operation(operationId);if(op.status==='completed')return op;requireThat(['pending','running'].includes(op.status),'Publication is terminal');
    const approval=this.store.get<ProjectApproval>('SELECT * FROM project_approvals WHERE operation_id=?',operationId)!;
    requireThat(approval.envelope_hash===op.envelope_hash&&approval.decided_by==='human'&&(op.status==='pending'?approval.status==='approved':approval.status==='consumed'),'Exact trusted human approval is required');
    let verified:ReturnType<RemoteProjects['validate']>;
    try{verified=this.validate(op);}catch{this.block(op);return this.operation(operationId);}
    if(op.status==='pending')this.store.transaction(()=>{this.store.run("UPDATE project_approvals SET status='consumed',consumed_at=? WHERE approval_id=?",now(),approval.approval_id);this.store.run("UPDATE project_operations SET status='running' WHERE operation_id=?",operationId);});op=this.operation(operationId);
    const {repo,e}=verified;
    try{
      const remote=this.transport.inspect(repo);
      if(remote===e.new_sha){this.finish(op,remote,true);return this.operation(operationId);}
      if(remote!==e.expected_old_sha){this.block(op);return this.operation(operationId);}
      if(inspectOnly)return op;
      let lost=false;try{this.transport.publish(repo,e);}catch{lost=true;}
      const after=this.transport.inspect(repo);
      if(after===e.new_sha)this.finish(op,after,lost);
      else if(after!==e.expected_old_sha)this.block(op);
      else this.store.run("UPDATE project_operations SET error='Publication did not advance the remote; inspect credentials or transport and retry this same approved operation' WHERE operation_id=?",operationId);
    }catch{this.store.run("UPDATE project_operations SET error='Remote state unavailable; inspect and reconcile this same operation before retry' WHERE operation_id=? AND status='running'",operationId);}
    return this.operation(operationId);
  }
  recover(){for(const op of this.operations().filter(o=>o.status==='running'))this.execute(op.operation_id,true);}
}
