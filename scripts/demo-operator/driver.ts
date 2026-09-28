import assert from 'node:assert/strict';
import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { renameSync } from 'node:fs';
import { Recorder } from './recorder.js';
import { checkAllocations, checkApproval, checkBaseline, checkCanonical, checkFinal, projectTasks, type RunScope, type Snapshot } from './assertions.js';
import type { Action, Scenario } from './scenario.js';

export function demoOrigin(value:string) {
  const url=new URL(value);
  assert.ok(url.protocol==='http:'&&url.hostname==='127.0.0.1'&&url.port==='4310'&&url.pathname==='/'&&!url.username&&!url.password&&!url.search&&!url.hash,'Only the private HQ loopback URL http://127.0.0.1:4310 is supported');
  return url.origin;
}
const delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export class BrowserDriver {
  browser!:Browser; context!:BrowserContext; page!:Page;
  baseline!:Snapshot; scope!:RunScope; initialCommit=''; readonly seen=new Set<string>(); readonly milestones=new Set<string>();
  private readonly origin:string;
  constructor(readonly scenario:Scenario,readonly recorder:Recorder,url:string,readonly expectedSha:string) { this.origin=demoOrigin(url);assert.match(expectedSha,/^[a-f0-9]{40}$/); }
  async start() {
    this.browser=await chromium.launch({channel:'chrome',headless:true});
    this.context=await this.browser.newContext({viewport:{width:1600,height:1000},recordVideo:{dir:this.recorder.root,size:{width:1600,height:1000}},acceptDownloads:false,serviceWorkers:'block'});
    // One ephemeral profile, no personal session, no external page or request.
    await this.context.route('**/*',route=>new URL(route.request().url()).origin===this.origin?route.continue():route.abort());
    this.page=await this.context.newPage();this.page.setDefaultTimeout(12000);
    this.page.on('dialog',dialog=>void dialog.dismiss());
    this.context.on('page',page=>{if(page!==this.page)void page.close();});
    await this.page.goto(this.origin,{waitUntil:'domcontentloaded'});
    await this.page.locator('#connection.online, #connection-dot.online').waitFor();
  }
  async read<T>(path:string):Promise<T> {
    assert.ok(path==='state'||path==='health'||/^artifacts\/artifact_[a-f0-9-]+$/.test(path),'Unsupported read-only verification endpoint');
    const response=await this.context.request.get(`${this.origin}/api/${path}`,{timeout:15000});
    assert.ok(response.ok(),`Read-only ${path} returned ${response.status()}`);return await response.json() as T;
  }
  state(){return this.read<Snapshot>('state');}
  async tab(tab:string) { await this.closeInspector();await this.page.locator(`[data-tab="${tab}"]`).click(); }
  async closeInspector() {
    if(await this.page.locator('#inspect').evaluate(e=>(e as HTMLDialogElement).open)) {
      await this.page.locator('#close-inspect').click();
    }
  }
  async capture(id:string,description:string,kind:'operator_action'|'assertion'='operator_action',observed?:unknown) {
    await delay(400);
    const screenshot=`screenshots/${id}.png`;
    await this.page.screenshot({path:this.recorder.path(screenshot),fullPage:false});
    this.recorder.record({step_id:id,kind,description,result:'pass',screenshot,observed_state:observed,related_project_id:this.scope?.projectId,related_repository_id:this.scope?.repositoryId});
  }
  async form(values:Record<string,string>) {
    for(const [key,value] of Object.entries(values)) await this.page.locator(`#project-form [name="${key}"]`).fill(value);
    await this.page.locator('#project-form button[type=submit]').click();
    await this.page.waitForFunction(()=>!document.querySelector<HTMLDialogElement>('#inspect')?.open || !!document.querySelector('#project-form-error')?.textContent);
    const error=await this.page.locator('#project-form-error').textContent().catch(()=>'');assert.ok(!error,error??'Form rejected');
  }
  async selectProject(){await this.tab('products');await this.page.locator(`[data-select-project="${this.scope.projectId}"]`).click();}
  async pause() {
    if(!(await this.state()).paused) {await this.closeInspector();await this.page.locator('#pause').click();assert.equal((await this.state()).paused,true);}
  }
  async step(step:Action) {
    switch(step) {
      case 'open_hq': {
        this.baseline=await this.state();checkBaseline(this.baseline);
        const health=await this.read<{commit:string;runtime:string}>('health');assert.equal(health.commit,this.expectedSha);assert.equal(health.runtime,'ready');
        this.scope={atlasId:this.baseline.workers.find(w=>w.role==='ceo')!.worker_id,baselineWorkers:new Set(this.baseline.workers.map(w=>w.worker_id))};
        this.baseline.audit.forEach(e=>this.seen.add(e.event_id));this.recorder.save('baseline.json',{health,state:this.baseline});
        await this.capture('01-start','BotSquad Demo Operator opens the paused development HQ. Automation is explicitly identified in the scenario and objective.', 'assertion',health);break;
      }
      case 'create_project': {
        await this.tab('products');await this.page.locator('[data-project-action=create]').click();
        await this.form({name:this.scenario.name,description:'A tiny dependency-free daily study planner. Automated tutorial operated by BotSquad Demo Operator.',instructions:this.scenario.instructions});
        const projects=(await this.state()).projects.filter(p=>!this.baseline.projects.some(b=>b.project_id===p.project_id));assert.equal(projects.length,1);
        this.scope.projectId=projects[0]!.project_id;assert.equal(projects[0]!.name,this.scenario.name);
        await this.capture('02-project-created','Created a fresh StudyPlan Project through New Project.','operator_action',{project_id:this.scope.projectId});break;
      }
      case 'configure_project': {
        await this.page.locator('[data-project-action=policy]').click();
        await this.form({instructions:this.scenario.instructions,policy:JSON.stringify(this.scenario.policy,null,2)});
        const p=(await this.state()).projects.find(p=>p.project_id===this.scope.projectId)!;assert.deepEqual(JSON.parse(p.policy),this.scenario.policy);
        await this.capture('02b-policy','Configured named focused and full recipes through the Project policy form.','operator_action',this.scenario.policy);break;
      }
      case 'create_repository': {
        await this.page.locator('[data-project-action=local]').click();await this.form({name:'StudyPlan',default_branch:'main'});
        const repos=(await this.state()).repositories.filter(r=>r.project_id===this.scope.projectId);assert.equal(repos.length,1);
        const repo=repos[0]!;this.scope.repositoryId=repo.repository_id;this.initialCommit=repo.current_commit!;assert.match(this.initialCommit,/^[a-f0-9]{40}$/);
        assert.equal(repo.source_kind,'local_new');assert.equal(repo.remote_policy,'none');
        await this.capture('02c-repository','Created a real local managed repository through New repository.','operator_action',{repository_id:repo.repository_id,initial_commit:repo.current_commit,default_branch:repo.default_branch});break;
      }
      case 'prepare_infrastructure': {
        await this.tab('infrastructure');let s=await this.state();let nix=s.workers.find(w=>w.role==='devops');
        if(!nix) {
          await this.page.locator('#initialize-nix').click();s=await this.state();nix=s.workers.find(w=>w.role==='devops');assert.ok(nix);
          const op=s.infrastructure.operations.filter(o=>!this.baseline.infrastructure.operations.some(b=>b.operation_id===o.operation_id));assert.equal(op.length,1);
          this.scope.nixId=nix.worker_id;this.scope.bootstrapOperationId=op[0]!.operation_id;
          await this.capture('07a-nix-bootstrap','Initialized Nix through Infrastructure; the exact bootstrap approval is pending.');await this.approvals(s);
        }
        this.scope.nixId=nix.worker_id;
        s=await this.state();assert.ok(s.infrastructure.identities.some(i=>i.worker_id===nix!.worker_id&&i.state==='ready'));
        if(s.infrastructure.identities.find(i=>i.worker_id===this.scope.atlasId)?.state!=='ready') {
          await this.tab('infrastructure');await this.page.locator(`[data-infra-worker="${this.scope.atlasId}"][data-infra-type=create_worker_identity]`).click();
          s=await this.state();const task=s.infrastructure.tasks.find(t=>t.target_worker_id===this.scope.atlasId&&t.operation_type==='create_worker_identity');assert.ok(task);this.scope.atlasProvisionTaskId=task.task_id;
          await this.capture('07b-atlas-request','Asked Nix to provision the retained Atlas identity using the Infrastructure UI.');
        }
        break;
      }
      case 'assign_objective': {
        await this.selectProject();await this.page.locator(`[data-repo-action=objective][data-repository="${this.scope.repositoryId}"]`).click();
        await this.form({objective:`BotSquad Demo Operator (automated tutorial): ${this.scenario.objective}`,acceptance_criteria:this.scenario.acceptance,constraints:this.scenario.constraints});
        const s=await this.state();const scopes=(s.task_scopes as {project_id:string;repository_id:string;task_id:string}[]).filter(x=>x.project_id===this.scope.projectId&&x.repository_id===this.scope.repositoryId);
        const roots=s.tasks.filter(t=>t.parent_task_id===null&&scopes.some(x=>x.task_id===t.task_id));assert.equal(roots.length,1);
        this.scope.objectiveId=roots[0]!.task_id;assert.equal(roots[0]!.assignee_worker_id,this.scope.atlasId);
        await this.capture('03-objective-assigned','Assigned the natural-language StudyPlan goal to Atlas through Assign objective.','operator_action',{task_id:this.scope.objectiveId,project_id:this.scope.projectId,repository_id:this.scope.repositoryId});break;
      }
      case 'resume_dispatch': {
        await this.page.locator('#pause').click();assert.equal((await this.state()).paused,false);
        await this.capture('03b-dispatch','Resumed dispatch through the HQ control. BotSquad now owns planning and execution.');break;
      }
      case 'observe_workflow': await this.observe();break;
      case 'inspect_result': {
        const s=await this.state();const result=checkFinal(s,this.scope,this.initialCommit);this.recorder.save('result.json',result);this.recorder.save('final-state.json',s);
        await this.selectProject();await this.page.locator(`[data-evidence=integrations][data-record="${result.integration.integration_id}"]`).click();
        await this.capture('10-integration','Inspected the completed trusted integration and full validation evidence.','assertion',result.integration);
        await this.closeInspector();await this.capture('11-final-project','StudyPlan is integrated; exact submissions, independent review and canonical SHA are visible.','assertion',{canonical_sha:result.canonical_sha});
        const finalArtifacts=s.artifacts.filter(a=>a.task_id===this.scope.objectiveId);
        for(const artifact of finalArtifacts) {
          const response=await this.context.request.get(`${this.origin}/api/artifacts/${artifact.artifact_id}`);assert.ok(response.ok());
          this.recorder.save(`artifact-${artifact.artifact_id}.json`,{artifact_id:artifact.artifact_id,description:artifact.description,content:await response.text()});
        }
        if(finalArtifacts.length) {
          await this.tab('tasks');await this.page.locator(`[data-artifact="${finalArtifacts.at(-1)!.artifact_id}"]`).first().click();
          await this.capture('11b-final-output','Opened Atlas’s final artifact containing the reported StudyPlan result.');
        }
        break;
      }
      case 'pause_dispatch': await this.pause();await this.capture('12-paused','Paused new dispatch after the complete tutorial, preserving the active Project and all history.');break;
    }
  }
  private async approvals(s:Snapshot) {
    assert.equal(s.project_approvals.filter(a=>a.status==='pending').length,0,'Unexpected publication approval; stop');
    const approved=[];
    for(const a of s.infrastructure.approvals.filter(a=>a.status==='pending')) {
      const op=checkApproval(s,a,this.scope);
      if(op.requesting_execution_id&&s.executions.find(e=>e.execution_id===op.requesting_execution_id)?.status!=='completed') continue;
      approved.push({a,op});
    }
    for(const {a,op} of approved) {
      await this.tab('approvals');const button=this.page.locator(`[data-approval="${a.approval_id}"][data-decision=approve]`);
      const card=button.locator('xpath=ancestor::article');await card.locator('summary').click();await button.scrollIntoViewIfNeeded();
      await this.capture(`07-approval-${a.approval_id}`,'Inspected exact scenario-bound approval scope before deciding.','assertion',{approval_id:a.approval_id,operation_id:op.operation_id,type:op.operation_type,target:op.target_worker_id,parameters:JSON.parse(op.parameters)});
      // Recheck against a fresh read immediately before clicking the exact UI control.
      checkApproval(await this.state(),a,this.scope);await button.click();
      const after=await this.state();assert.equal(after.infrastructure.operations.find(o=>o.operation_id===op.operation_id)?.status,'completed','Protected operation did not complete');
      this.recorder.record({step_id:'approve',kind:'operator_action',description:`Approved ${op.operation_type} through the exact Approve button.`,result:'pass',related_approval_id:a.approval_id,related_worker_id:op.target_worker_id,observed_state:{operation_id:op.operation_id,status:'completed'}});
    }
  }
  private systemEvents(s:Snapshot) {
    const types=/^(task_assigned|task_completed|execution_started|execution_completed|execution_failed|artifact_submitted|engineering_submitted|review_submitted|revision_queued|integration_|worker_hired|worker_identity_ready|worker_project_access_granted|runtime_turn_started)/;
    for(const e of s.audit) {
      if(this.seen.has(e.event_id))continue;this.seen.add(e.event_id);if(!types.test(e.type))continue;
      this.recorder.record({step_id:'observe_workflow',kind:'system_event',description:e.type.replaceAll('_',' '),result:'observed',observed_state:{event_id:e.event_id,recorded_at:e.created_at,detail:JSON.parse(e.detail)},related_project_id:this.scope.projectId,related_repository_id:this.scope.repositoryId,related_task_id:e.task_id??undefined,related_worker_id:e.worker_id??undefined,related_execution_id:e.execution_id??undefined});
    }
  }
  private async milestone(id:string,description:string,show:()=>Promise<void>) {
    if(this.milestones.has(id))return;await show();await this.capture(id,description,'assertion');this.milestones.add(id);
  }
  async observe() {
    const deadline=Date.now()+this.scenario.timeout_ms;
    while(Date.now()<deadline) {
      const s=await this.state();this.systemEvents(s);checkCanonical(s,this.scope,this.initialCommit);
      const newTasks=s.tasks.filter(t=>!this.baseline.tasks.some(b=>b.task_id===t.task_id));
      const failure=newTasks.find(t=>t.status==='failed'||t.status==='cancelled'||t.status==='blocked'&&!['waiting_children','waiting_integration'].includes(t.blocking_reason??''));
      assert.ok(!failure,`Real workflow stopped: ${failure?.task_id}: ${failure?.blocking_reason}`);
      await this.approvals(s);
      const tasks=projectTasks(s,this.scope);const spec=tasks.find(t=>t.kind==='spec'&&t.status==='completed');
      const artifact=spec&&s.artifacts.find(a=>a.task_id===spec.task_id);
      if(artifact) await this.milestone('04-maya-spec','Maya completed a real product specification.',async()=>{await this.tab('tasks');await this.page.locator(`[data-artifact="${artifact.artifact_id}"]`).first().click();});
      const allocations=s.allocations.filter(a=>a.repository_id===this.scope.repositoryId);
      if(allocations.length===2) {checkAllocations(s,this.scope);await this.milestone('05-turing-plan','Turing allocated two non-overlapping engineering scopes.',()=>this.selectProject());}
      const running=s.executions.filter(e=>e.status==='running'&&allocations.some(a=>a.task_id===e.task_id));
      if(running.length) await this.milestone('06-engineers-working',`${running.length} real engineering execution(s) observed.`,async()=>{await this.selectProject();await this.page.locator('.concurrency-banner').first().scrollIntoViewIfNeeded();});
      const submissions=s.submissions.filter(x=>x.repository_id===this.scope.repositoryId);
      if(submissions.length>=2) await this.milestone('08-submissions','Immutable engineering submissions reference real Git commits.',()=>this.selectProject());
      for(const review of s.reviews.filter(r=>r.repository_id===this.scope.repositoryId)) await this.milestone(`09-grace-review-${review.review_id}`,`Independent review recorded ${review.status}.`,async()=>{await this.selectProject();await this.page.locator(`[data-artifact="${review.artifact_id}"]`).click();});
      if(s.tasks.find(t=>t.task_id===this.scope.objectiveId)?.status==='completed'&&newTasks.every(t=>t.status==='completed')) {checkFinal(s,this.scope,this.initialCommit);return;}
      await this.closeInspector();await delay(1500);
    }
    throw Error('Real workflow exceeded the declared deadline');
  }
  async close() {
    const video=this.page?.video();await this.context?.close();
    if(video) {const path=await video.path();renameSync(path,this.recorder.path('demo-raw.webm'));this.recorder.save('video.json',{...this.recorder.fileMetadata('demo-raw.webm'),format:'WebM',recording:'Playwright native browser context video',wall_duration_ms:Date.now()-this.recorder.started});}
    await this.browser?.close();
  }
}
