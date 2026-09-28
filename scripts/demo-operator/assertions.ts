import assert from 'node:assert/strict';
import type { Company } from '../../src/control/company.js';
import type { Approval, ProtectedOperation } from '../../src/domain/infrastructure.js';
import { manifestHash, overlaps } from '../../src/domain/projects.js';
export type Snapshot=ReturnType<Company['snapshot']>;
export interface RunScope {projectId?:string;repositoryId?:string;objectiveId?:string;atlasId:string;nixId?:string;baselineWorkers:Set<string>;bootstrapOperationId?:string;atlasProvisionTaskId?:string;}
export function checkBaseline(s:Snapshot) {
  assert.equal(s.paused,true,'HQ must start paused');assert.equal(s.infrastructure.backend,'linux');
  assert.equal(s.executions.filter(e=>e.status==='running').length,0,'Active execution at start');
  assert.equal(s.tasks.filter(t=>!['completed','cancelled'].includes(t.status)).length,0,'Resolve existing outstanding work first');
  assert.equal(s.infrastructure.approvals.filter(a=>a.status==='pending').length,0,'Unexpected existing approval');
  assert.equal(s.project_approvals.filter(a=>a.status==='pending').length,0,'Unexpected publication approval');
  assert.equal(s.workers.filter(w=>w.role==='ceo'&&w.enabled).length,1);
}
export function projectTasks(s:Snapshot,scope:RunScope) {
  const ids=new Set<string>(scope.objectiveId?[scope.objectiveId]:[]);
  for(let n=0;n<=s.tasks.length;n++) for(const t of s.tasks) if(t.parent_task_id&&ids.has(t.parent_task_id)) ids.add(t.task_id);
  return s.tasks.filter(t=>ids.has(t.task_id));
}
export function checkObjective(s:Snapshot,scope:RunScope) {
  const repo=s.repositories.find(r=>r.repository_id===scope.repositoryId);
  assert.equal(repo?.project_id,scope.projectId,'Repository belongs to the wrong Project');
  const scopes=s.task_scopes as {repository_id:string;task_id:string}[];
  const roots=s.tasks.filter(t=>t.parent_task_id===null&&scopes.some(x=>x.repository_id===scope.repositoryId&&x.task_id===t.task_id));
  assert.equal(roots.length,1,'Expected one scoped root objective');assert.equal(roots[0]!.assignee_worker_id,scope.atlasId);
  return roots[0]!;
}
export function checkApproval(s:Snapshot,a:Approval,scope:RunScope):ProtectedOperation {
  const op=s.infrastructure.operations.find(o=>o.operation_id===a.operation_id);
  assert.ok(op,'Approval operation missing');assert.equal(op.approval_id,a.approval_id);assert.equal(op.status,'pending');
  assert.equal(a.status,'pending');assert.ok(Date.parse(a.expires_at)>Date.now(),'Expired approval');
  const p=JSON.parse(op.parameters);assert.equal(p.worker_id,op.target_worker_id);
  const target=s.workers.find(w=>w.worker_id===op.target_worker_id);assert.ok(target?.enabled);
  assert.ok(['create_worker_identity','prepare_worker_project_clone'].includes(op.operation_type),'Unexpected protected operation');
  if(op.operation_id===scope.bootstrapOperationId) {
    assert.equal(op.operation_type,'create_worker_identity');assert.equal(target.worker_id,scope.nixId);assert.equal(target.role,'devops');
    assert.equal(op.requester_principal_id,'human');assert.equal(op.requester_worker_id,null);assert.equal(op.task_id,null);
    assert.deepEqual(Object.keys(p),['worker_id']);return op;
  }
  const nix=s.workers.find(w=>w.worker_id===scope.nixId);assert.ok(nix&&nix.role==='devops');
  assert.equal(op.requester_worker_id,nix.worker_id);assert.equal(op.requester_principal_id,nix.principal_id);
  const infra=s.infrastructure.tasks.find(t=>t.task_id===op.task_id);assert.ok(infra);
  assert.equal(infra.target_worker_id,target.worker_id);assert.equal(infra.operation_type,op.operation_type);
  const e=s.executions.find(e=>e.execution_id===op.requesting_execution_id);assert.ok(e);assert.equal(e.worker_id,nix.worker_id);assert.equal(e.task_id,op.task_id);
  // Pending request turns are inspected but never approved until their turn is completed.
  const tasks=projectTasks(s,scope);
  const isAtlas=target.worker_id===scope.atlasId&&op.task_id===scope.atlasProvisionTaskId;
  const isProjectWorker=['product_manager','cto','engineer','reviewer'].includes(target.role)&&tasks.some(t=>t.assignee_worker_id===target.worker_id);
  assert.ok(isAtlas||isProjectWorker,'Approval target is outside this tutorial');
  if(op.operation_type==='create_worker_identity') assert.deepEqual(Object.keys(p),['worker_id']);
  else {
    const allocation=s.allocations.find(x=>x.allocation_id===p.allocation_id);assert.ok(allocation);
    assert.equal(allocation.repository_id,scope.repositoryId);assert.equal(allocation.worker_id,target.worker_id);
    assert.equal(p.repository_id,scope.repositoryId);assert.equal(p.task_id,allocation.task_id);assert.equal(p.base_commit,allocation.base_commit);
    assert.equal(infra.allocation_id,allocation.allocation_id);assert.equal(p.manifest_hash,allocation.manifest_hash);
    assert.equal(manifestHash(JSON.parse(p.manifest)),allocation.manifest_hash);
    assert.ok(p.bundle?.omitted===true,'Expected read-only bounded bundle metadata');
    assert.ok(tasks.some(t=>t.task_id===allocation.task_id));
  }
  return op;
}
export function checkAllocations(s:Snapshot,scope:RunScope) {
  const allocations=s.allocations.filter(a=>a.repository_id===scope.repositoryId);assert.equal(allocations.length,2,'Two independent engineering scopes required');
  assert.equal(new Set(allocations.map(a=>a.worker_id)).size,2);assert.equal(new Set(allocations.map(a=>a.worktree_path)).size,2);
  const [a,b]=allocations.map(a=>JSON.parse(a.write_scope) as string[]);
  assert.ok(a&&b&&a.length&&b.length);assert.ok(!a.some(x=>b.some(y=>overlaps(x.toLowerCase(),y.toLowerCase()))),'Scopes overlap');
  return allocations;
}
export function checkCanonical(s:Snapshot,scope:RunScope,initial:string) {
  const repo=s.repositories.find(r=>r.repository_id===scope.repositoryId);assert.ok(repo);
  if(repo.current_commit!==initial) assert.ok(s.integrations.some(i=>i.repository_id===repo.repository_id&&i.status==='completed'&&i.final_commit===repo.current_commit),'Canonical advanced without trusted completed integration');
}
export function checkFinal(s:Snapshot,scope:RunScope,initial:string) {
  const allocations=checkAllocations(s,scope);checkCanonical(s,scope,initial);
  const tasks=projectTasks(s,scope);assert.ok(tasks.length>=6);assert.ok(tasks.every(t=>t.status==='completed'),'Project workflow incomplete');
  const repo=s.repositories.find(r=>r.repository_id===scope.repositoryId)!;assert.notEqual(repo.current_commit,initial);
  assert.equal(repo.remote_policy,'none');assert.equal(repo.source_kind,'local_new');
  assert.ok(repo.spec_artifact_id&&s.artifacts.some(a=>a.artifact_id===repo.spec_artifact_id));
  const integration=s.integrations.find(i=>i.repository_id===repo.repository_id&&i.status==='completed'&&i.final_commit===repo.current_commit);assert.ok(integration);
  const validation=JSON.parse(integration.validation!);assert.equal(validation.passed,true);assert.ok(validation.recipes?.length>0&&validation.recipes.every((r:{passed:boolean})=>r.passed));
  const review=s.reviews.find(r=>r.review_id===integration.review_id);assert.ok(review);assert.equal(review.status,'approved');
  const round=s.review_rounds.find(r=>r.round_id===review.round_id);assert.ok(round);
  const ids=JSON.parse(round.submission_ids) as string[];
  const submissions=ids.map(id=>s.submissions.find(x=>x.submission_id===id)!);assert.ok(submissions.every(Boolean));
  assert.deepEqual(JSON.parse(review.source_commits).sort(),submissions.map(x=>x.commit_sha).sort());
  assert.deepEqual(JSON.parse(integration.source_commits).sort(),submissions.map(x=>x.commit_sha).sort());
  assert.ok(s.audit.some(e=>e.execution_id===review.execution_id&&e.type==='tool_completed'&&JSON.parse(e.detail).tool==='read_review_packet'));
  for(const a of allocations) {
    const sub=submissions.find(x=>x.allocation_id===a.allocation_id);assert.ok(sub);assert.match(sub.commit_sha,/^[a-f0-9]{40}$/);
    assert.ok(s.infrastructure.projects.some(p=>p.allocation_id===a.allocation_id&&p.state==='ready'));
    const exec=s.executions.find(e=>e.execution_id===sub.execution_id);assert.ok(exec?.runtime_reference);assert.equal(exec.status,'completed');assert.equal(exec.provenance_status,'recorded');
  }
  const relevant=s.executions.filter(e=>tasks.some(t=>t.task_id===e.task_id));
  assert.ok(relevant.every(e=>e.runtime_reference&&e.provenance_status==='recorded'&&e.status==='completed'));
  return {project_id:scope.projectId,repository_id:scope.repositoryId,objective_id:scope.objectiveId,canonical_sha:repo.current_commit,allocations,submissions,reviews:s.reviews.filter(r=>r.repository_id===repo.repository_id),integration,executions:relevant,workers:s.workers.filter(w=>relevant.some(e=>e.worker_id===w.worker_id)),validation};
}
