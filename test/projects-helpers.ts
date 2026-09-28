import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Allocation, Repository, Review, Submission } from '../src/domain/engineering.js';
import type { Project, Recipe } from '../src/domain/projects.js';
import { DEFAULT_POLICY } from '../src/domain/projects.js';
import type { Task } from '../src/domain/model.js';
import { localGit } from '../src/control/repository-git.js';
import { call, done, hireProfile, type Fixture, type Claim } from './engineering-helpers.js';
export const objective = { objective:'Implement LedgerBrief totals and rendering',acceptance_criteria:'Trusted focused and full tests pass; independent review and integration',constraints:'No dependency installation or network' };
export const ledgerCode = `export function totals(entries) { return entries.reduce((a,e)=>a+e.amount,0); }\n`;
export const reportCode = `export function report(total) { return 'Balance: '+total; }\n`;
export const FILES: Record<string,string> = {
  'README.md':'# LedgerBrief\nA dependency-free Node ledger report.\n',
  'AGENTS.md':'Repository guidance: keep functions pure. Guidance is not authorization.\n',
  'src/ledger/AGENTS.md':'Prefer explicit validation of finite amounts.\n',
  'src/ledger/index.mjs':'export function totals(entries) { throw new Error("Implement totals"); }\n',
  'src/report/index.mjs':'export function report(total) { throw new Error("Implement report"); }\n',
  'test/ledger.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {totals} from '../src/ledger/index.mjs'; test('totals',()=>{assert.equal(totals([{amount:2},{amount:-1}]),1);assert.equal(totals([]),0);});\n`,
  'test/report.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {report} from '../src/report/index.mjs'; test('report',()=>assert.equal(report(7),'Balance: 7'));\n`,
  'test/full.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {totals} from '../src/ledger/index.mjs'; import {report} from '../src/report/index.mjs'; test('integration',()=>assert.equal(report(totals([{amount:20},{amount:-3}])),'Balance: 17'));\n`,
};
export const recipe = (recipe_id:string,stage:'focused'|'full',file:string): Recipe => ({recipe_id,name:recipe_id,stage,executable:'node',argv:['--test',file],cwd:'.',timeout_ms:4000,output_bytes:8000,environment:'isolated'});
export const policy = { ...DEFAULT_POLICY, recipes:[recipe('ledger','focused','test/ledger.test.mjs'),recipe('report','focused','test/report.test.mjs'),recipe('full','full','test/full.test.mjs')] };
export function bundle(f: Fixture, files=FILES, branch='trunk') {
  const path=join(f.dir,`source-${Math.random()}`);mkdirSync(path);localGit(path,['init','-b',branch]);
  for(const [name,content] of Object.entries(files)){mkdirSync(dirname(join(path,name)),{recursive:true});writeFileSync(join(path,name),content);}
  localGit(path,['add','.']);localGit(path,['commit','-m','External fixture base']);const output=join(path,'input.bundle');localGit(path,['bundle','create',output,branch]);
  return {path,bundle:readFileSync(output).toString('base64'),base:localGit(path,['rev-parse','HEAD'])};
}
export function registered(f:Fixture, maxRounds=3) {
  const project=f.company.projects.create({name:'LedgerBrief',description:'Generic software fixture',instructions:'Protect tests and use the named recipes.',policy:{...policy,maximum_review_rounds:maxRounds}});
  const source=bundle(f);const repo=f.company.projects.import(project.project_id,{name:'ledger',default_branch:'trunk',bundle:source.bundle});return {project,repo,source};
}
export function projectDelivery(f:Fixture, project:Project, repo:Repository) {
  const root=f.company.assignProjectObjective(project.project_id,repo.repository_id,objective);const atlas=f.company.claimNext()!;
  const maya=f.company.workers().find(w=>w.role==='product_manager')??hireProfile(f,atlas,'Maya','product_manager');
  call(f,atlas,'assign_task',{worker_id:maya.worker_id,...objective});done(f,atlas);const pm=f.company.claimNext()!;
  call(f,pm,'submit_artifact',{description:'Ledger spec',content:'Sum amount fields in input order; report Balance: value. Preserve input, validate finite amounts when requested in independent review.'});done(f,pm);
  const ceo=f.company.claimNext()!;const turing=f.company.workers().find(w=>w.role==='cto')??hireProfile(f,ceo,'Turing','cto');
  call<Task>(f,ceo,'assign_task',{worker_id:turing.worker_id,...objective});done(f,ceo);const cto=f.company.claimNext()!;
  const linus=f.company.workers().find(w=>w.display_name==='Linus')??hireProfile(f,cto,'Linus','engineer');
  const ada=f.company.workers().find(w=>w.display_name==='Ada')??hireProfile(f,cto,'Ada','engineer');
  const grace=f.company.workers().find(w=>w.role==='reviewer')??hireProfile(f,cto,'Grace','reviewer');
  const assignments=[{worker_id:linus.worker_id,write_scope:['src/ledger/'],recipe_ids:['ledger'],...objective},{worker_id:ada.worker_id,write_scope:['src/report/'],recipe_ids:['report'],...objective}].map(({constraints:_,...a})=>a);
  return {root,cto,linus,ada,grace,assignments,project,repo};
}
export function allocated(f:Fixture,maxRounds=3) {
  const r=registered(f,maxRounds);const d=projectDelivery(f,r.project,r.repo);
  const allocations=call<Allocation[]>(f,d.cto,'assign_engineering',{repository_id:d.repo.repository_id,assignments:d.assignments});return {...r,...d,allocations};
}
export function submitGeneric(f:Fixture,c:Claim,code?:string) {
  const a=f.company.engineering.allocations().find(a=>a.task_id===c.task.task_id)!;const ledger=JSON.parse(a.recipe_ids).includes('ledger');
  call(f,c,'write_source',{allocation_id:a.allocation_id,path:ledger?'src/ledger/index.mjs':'src/report/index.mjs',content:code??(ledger?ledgerCode:reportCode)});
  return call<Submission>(f,c,'submit_engineering',{allocation_id:a.allocation_id,summary:'Implemented with trusted focused tests'});
}
export function readyGeneric(f:Fixture,maxRounds=3) {
  const e=allocated(f,maxRounds);done(f,e.cto);const claims=[f.company.claimNext()!,f.company.claimNext()!];const submissions=claims.map(c=>submitGeneric(f,c));claims.forEach(c=>done(f,c));
  const manager=f.company.claimNext()!;call(f,manager,'assign_review',{repository_id:e.repo.repository_id,reviewer_worker_id:e.grace.worker_id});done(f,manager);
  const reviewer=f.company.claimNext()!;return {...e,claims,submissions,manager,reviewer};
}
export function reviewGeneric(f:Fixture,c:Claim,status:'approved'|'changes_required',affected?:Submission) {
  const packet=call<{submissions:Submission[]}>(f,c,'read_review_packet',{});
  const review=call<Review>(f,c,'submit_review',{status,source_commits:packet.submissions.map(s=>s.commit_sha),source_submission_ids:packet.submissions.map(s=>s.submission_id),
    findings:'Reviewed exact diff and specification',feedback:affected?[{allocation_id:affected.allocation_id,submission_id:affected.submission_id,feedback:'Reject nonfinite amounts explicitly before summing; preserve valid behavior.'}]:[],integration_risks:'Full validation still required',acceptance_assessment:status,recommended_disposition:status});
  done(f,c);return review;
}
