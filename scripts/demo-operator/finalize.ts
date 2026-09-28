import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { boundedPath, redact, type DemoEvent } from './recorder.js';
import type { Snapshot } from './assertions.js';

const stamp=(ms:number)=>{const s=Math.floor(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
export function finalize(directory:string) {
  const path=(name:string)=>boundedPath(directory,name);
  const read=<T>(name:string)=>JSON.parse(readFileSync(path(name),'utf8')) as T;
  const run=read<{status:string;operator:string;version:string;scope:{projectId:string;repositoryId:string;objectiveId:string}}>('run.json');
  const events=read<DemoEvent[]>('events.json');assert.equal(run.status,'passed','Failed attempts cannot become tutorials');
  assert.ok(!events.some(e=>e.result==='fail'),'A successful tutorial cannot contain failed assertions');
  const state=read<Snapshot>('final-state.json');const baseline=read<{state:Snapshot}>('baseline.json').state;
  const name=(id?:string)=>state.workers.find(w=>w.worker_id===id)?.display_name;
  const meaningful=events.filter(e=>e.kind!=='system_event'||!['runtime turn started','execution started'].includes(e.description));
  const lines=meaningful.map(e=>`- **${stamp(e.elapsed_ms)} — ${e.kind==='operator_action'?'Operator action':e.kind==='system_event'?'BotSquad autonomous action':'Verified milestone'}:** ${e.kind==='system_event'&&name(e.related_worker_id)?name(e.related_worker_id)+' — ':''}${e.description}${e.screenshot?` [Screenshot](${e.screenshot})`:''}`);
  writeFileSync(path('tutorial-transcript.md'),`# StudyPlan recorded transcript\n\nOperator: **${run.operator} (automation)**. This is one continuous real run; no time was removed from the raw video.\n\n${lines.join('\n')}\n`,{mode:0o600});
  const repos=state.repositories.filter(r=>r.repository_id===run.scope.repositoryId);assert.equal(repos.length,1);
  const reviews=state.reviews.filter(r=>r.repository_id===run.scope.repositoryId);
  const revised=reviews.some(r=>r.status==='changes_required');
  const allocations=state.allocations.filter(a=>a.repository_id===run.scope.repositoryId);
  const submissions=state.submissions.filter(s=>s.repository_id===run.scope.repositoryId);
  const integrations=state.integrations.filter(i=>i.repository_id===run.scope.repositoryId);
  const executions=state.executions.filter(e=>!baseline.executions.some(b=>b.execution_id===e.execution_id));
  const engineers=allocations.map(a=>executions.filter(e=>e.worker_id===a.worker_id&&e.task_id===a.task_id));
  let overlap=0,turnOverlap=0;
  for(const a of engineers[0]??[])for(const b of engineers[1]??[]) {
    const finish=Math.min(Date.parse(a.finished_at!),Date.parse(b.finished_at!));
    overlap=Math.max(overlap,finish-Math.max(Date.parse(a.started_at),Date.parse(b.started_at)));
    const turns=[a,b].map(e=>state.audit.find(x=>x.execution_id===e.execution_id&&x.type==='runtime_turn_started')?.created_at);
    if(turns.every(Boolean))turnOverlap=Math.max(turnOverlap,finish-Math.max(...turns.map(t=>Date.parse(t!))));
  }
  const approvedIds=events.filter(e=>e.kind==='operator_action'&&e.related_approval_id).map(e=>e.related_approval_id);
  const evidence={run,project:state.projects.find(p=>p.project_id===run.scope.projectId),repository:repos[0],
    workers:state.workers.filter(w=>executions.some(e=>e.worker_id===w.worker_id)),executions,allocations,submissions,reviews,integrations,
    approval_operations:state.infrastructure.operations.filter(o=>approvedIds.includes(o.approval_id)),
    execution_overlap_ms:overlap,model_turn_overlap_ms:turnOverlap,
    review_outcome:revised?'Grace requested a legitimate revision and the tutorial captured it.':'Grace approved the first submission; no fake revision was introduced.'};
  writeFileSync(path('evidence.json'),JSON.stringify(redact(evidence),null,2)+'\n',{mode:0o600});
  const milestone=(prefix:string)=>events.find(e=>e.step_id.startsWith(prefix));
  const narrate=(prefix:string,text:string)=>{const event=milestone(prefix);return event?`## ${stamp(event.elapsed_ms)}\n\n${text}\n`:'';};
  const narration=`# StudyPlan narration script\n\nFuture voiceover for the recorded run. The operator is automation, not a named human.\n\n`+
    narrate('01-start','This is BotSquad’s existing development headquarters. The automated Demo Operator will use the same controls a human sees. Earlier history remains visible.')+
    narrate('02-project-created','We create a fresh StudyPlan Project. It will turn a list of study tasks into a prioritized daily plan. The repository is created by BotSquad and stays local.')+
    narrate('02b-policy','The operator configures two focused test recipes and one full recipe. These are bounded Node tests; workers cannot choose an arbitrary command or install packages.')+
    narrate('03-objective-assigned','We give Atlas the goal and the acceptance criteria. The organization decides how to deliver it.')+
    narrate('04-maya-spec','Maya has produced a product specification. This is real worker output saved as an inspectable artifact.')+
    narrate('05-turing-plan','Turing divides the work into separate planning and reporting areas. Each engineer can read context but write only inside the assigned scope.')+
    narrate('07-approval','Nix requests the required access. The operator inspects the exact worker, operation and scope before approving. The trusted provisioner performs the bounded change.')+
    narrate('06-engineers-working',overlap>0?'Both engineers really overlap in this run. Each works in a separate private clone.':'The engineers work in their assigned private clones. This recording does not manufacture concurrency.')+
    narrate('08-submissions','The engineers submit actual Git commits with focused validation evidence. Their claims are now available for independent review.')+
    narrate('09-grace-review',revised?'Grace found a real issue and requested changes. The run retains the original review, revision and later exact review.':'Grace reviews the exact submitted work and approves the first round. No artificial defect or revision is added for the video.')+
    narrate('10-integration','Trusted integration combines the approved commits and runs the full validation recipe. Only a completed authenticated test result allows the canonical branch to advance.')+
    narrate('11-final-project','StudyPlan is now integrated. Its Project, commits, reviews and validation remain inspectable. No GitHub publication was needed.')+
    narrate('12-paused','We pause new dispatch and leave the finished Project active. Nothing is deleted. The transcript, events, screenshots and recording all come from this run.');
  writeFileSync(path('narration.md'),narration,{mode:0o600});
  return evidence;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const directory=process.argv[2];assert.ok(directory,'Usage: node dist/scripts/demo-operator/finalize.js RUN_DIRECTORY');
  const evidence=finalize(resolve(directory));console.log(JSON.stringify({project_id:evidence.run.scope.projectId,review_outcome:evidence.review_outcome,execution_overlap_ms:evidence.execution_overlap_ms}));
}
