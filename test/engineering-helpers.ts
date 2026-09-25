import { PROFILES, type Profile, type Task, type Worker } from '../src/domain/model.js';
import type { Allocation, Repository, Review, Submission } from '../src/domain/engineering.js';
import type { Company } from '../src/control/company.js';
import { fixture } from './helpers.js';

export type Fixture = ReturnType<typeof fixture>;
export type Claim = NonNullable<ReturnType<Company['claimNext']>>;
export const calculateCode = `export function calculateStatusSummary(workers) {
  if (!Array.isArray(workers)) throw new TypeError('Expected workers array');
  const summary = {total: workers.length, working:0, idle:0, blocked:0, failed:0};
  for (const worker of workers) {
    if (!worker || !['working','idle','blocked','failed'].includes(worker.status)) throw new TypeError('Invalid status');
    summary[worker.status]++;
  }
  return summary;
}`;
export const formatCode = `export function formatStatusSummary(s) {
  const keys = ['total','working','idle','blocked','failed'];
  if (!s || !keys.every(k => Number.isSafeInteger(s[k]) && s[k] >= 0) || s.total !== s.working+s.idle+s.blocked+s.failed) throw new TypeError('Invalid summary');
  return keys.map(k => k[0].toUpperCase()+k.slice(1)+': '+s[k]).join('\\n');
}`;
export function call<T>(f: Fixture, claim: Claim, name: string, args: unknown, callId = `${name}-${Math.random()}`): T {
  return f.company.callTool(claim.context, callId, name, args) as T;
}
export function hireProfile(f: Fixture, claim: Claim, name: string, profile: Profile): Worker {
  return call(f, claim, 'hire_worker', { display_name: name, title: profile, profile, mission: `Bounded ${profile} work`, capabilities: [...PROFILES[profile]], lifecycle: 'persistent', justification: 'Required team role' });
}
export function done(f: Fixture, claim: Claim) { f.company.finish(claim.execution.execution_id, { status: 'completed', summary: 'Evidence available; stage complete' }); }
export const assign = { objective: 'Build SquadStatus according to the contract', acceptance_criteria: 'Verified evidence', constraints: 'Bounded local workflow' };
export function delivery(f: Fixture) {
  const root = f.company.assignObjective(assign); const atlas = f.company.claimNext()!;
  const maya = hireProfile(f, atlas, 'Maya', 'product_manager');
  call(f, atlas, 'assign_task', { worker_id: maya.worker_id, ...assign }); done(f, atlas);
  const pm = f.company.claimNext()!;
  call(f, pm, 'submit_artifact', { description: 'Product spec', content: 'SquadStatus specification: calculate and format, independent modules, strict validation, deterministic output, complete tests and independent exact-commit review.' }); done(f, pm);
  const ceo = f.company.claimNext()!; const turing = hireProfile(f, ceo, 'Turing', 'cto');
  const task = call<Task>(f, ceo, 'assign_task', { worker_id: turing.worker_id, ...assign }); done(f, ceo);
  const cto = f.company.claimNext()!;
  return { root, atlas, maya, pm, ceo, turing, task, cto };
}
export function engineering(f: Fixture) {
  const d = delivery(f);
  const repo = call<Repository>(f, d.cto, 'create_repository', { product_name: 'SquadStatus' });
  const linus = hireProfile(f, d.cto, 'Linus', 'engineer'); const ada = hireProfile(f, d.cto, 'Ada', 'engineer'); const grace = hireProfile(f, d.cto, 'Grace', 'reviewer');
  const allocations = call<Allocation[]>(f, d.cto, 'assign_engineering', { repository_id: repo.repository_id, calculate_worker_id: linus.worker_id, format_worker_id: ada.worker_id });
  return { ...d, repo, linus, ada, grace, allocations };
}
export function submit(f: Fixture, claim: Claim, code?: string): Submission {
  const a = f.company.engineering.allocations().find(a => a.task_id === claim.task.task_id)!;
  call(f, claim, 'write_source', { allocation_id: a.allocation_id, path: `src/${a.module}.mjs`, content: code ?? (a.module === 'calculate' ? calculateCode : formatCode) });
  return call(f, claim, 'submit_engineering', { allocation_id: a.allocation_id, summary: 'Implemented and validated module' });
}
export function readyReview(f: Fixture, badFormat?: string) {
  const e = engineering(f); done(f, e.cto); const first = f.company.claimNext()!; const second = f.company.claimNext()!;
  const submissions = [first, second].map(c => submit(f, c, c.worker.worker_id === e.ada.worker_id ? badFormat : undefined));
  done(f, first); done(f, second); const manager = f.company.claimNext()!;
  call(f, manager, 'assign_review', { repository_id: e.repo.repository_id, reviewer_worker_id: e.grace.worker_id }); done(f, manager);
  return { ...e, first, second, submissions, manager, reviewer: f.company.claimNext()! };
}
export function approve(f: Fixture, e: ReturnType<typeof readyReview>, status = 'approved') {
  call(f, e.reviewer, 'read_review_packet', {});
  const review = call<Review>(f, e.reviewer, 'submit_review', { status, source_commits: e.submissions.map(s => s.commit_sha), linus_findings: 'Calculation matches contract', ada_findings: 'Formatting matches contract', integration_risks: 'Full integrated tests still required', acceptance_assessment: 'Focused evidence inspected', recommended_disposition: status });
  done(f, e.reviewer); return { review, integrator: f.company.claimNext()! };
}
