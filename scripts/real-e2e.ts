import { validationProfiles } from './validation-profiles.js';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_OBJECTIVE, type Company } from '../src/control/company.js';
import type { Task } from '../src/domain/model.js';

type Snapshot = ReturnType<Company['snapshot']>;
const root = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = resolve(process.env.BOT_VALIDATION_DIR ?? join(root, '.validation', `real-${new Date().toISOString().replace(/[:.]/g, '-')}`));
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
let child: ChildProcess | undefined; let token = ''; let base = ''; let seen = new Set<string>();
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function freePort() {
  const server = createServer(); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port; await new Promise<void>(resolve => server.close(() => resolve())); return port;
}
async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${base}/api/${path}`, { ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': token }, body: JSON.stringify(data) }), signal: AbortSignal.timeout(45000) });
  const result = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`); return result;
}
const profiles = validationProfiles(api);
async function launch() {
  const port = await freePort(); base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [join(root, 'dist/src/main.js')], { cwd: root, env: { ...process.env, BOT_DATA_DIR: dataDir, PORT: String(port) }, stdio: ['ignore', 'ignore', 'inherit'] });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('BotSquad failed to start');
    try { token = (await api<{ csrfToken: string }>('session')).csrfToken; console.log(`Started local application: ${base}`); return; }
    catch { await sleep(100); }
  }
  throw new Error('Application startup timed out');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const current = child; current.kill('SIGTERM');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { current.kill('SIGKILL'); reject(new Error('Application shutdown timed out')); }, 15000);
    current.once('exit', () => { clearTimeout(timer); resolve(); });
  });
  child = undefined;
}
async function observe(predicate: (state: Snapshot) => boolean, timeoutMs = 480000): Promise<Snapshot> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await api<Snapshot>('state');
    await profiles.apply(state);
    for (const event of state.audit) {
      if (seen.has(event.event_id)) continue; seen.add(event.event_id);
      if (['worker_provisioned', 'task_assigned', 'runtime_started', 'worker_resumed', 'artifact_submitted', 'manager_followup_queued', 'execution_completed', 'execution_failed', 'execution_interrupted', 'tool_rejected'].includes(event.type)) {
        console.log(JSON.stringify({ event: event.type, worker: event.worker_id, task: event.task_id, execution: event.execution_id, detail: JSON.parse(event.detail) as unknown }));
      }
    }
    if (predicate(state)) return state;
    const failure = state.tasks.find(t => t.status === 'failed' || t.status === 'awaiting_approval' || (t.status === 'blocked' && t.blocking_reason !== 'waiting_children'));
    if (failure) throw new Error(`Real workflow stopped: ${failure.task_id}: ${failure.blocking_reason}`);
    await sleep(300);
  }
  throw new Error('Real validation exceeded bounded deadline');
}
const started = new Date().toISOString();
try {
  await launch();
  const initial = await api<Snapshot>('state'); assert.equal(initial.workers.length, 0, 'Real E2E requires a fresh validation directory');
  await api('initialize', {}); await api('pause', { paused: true });
  await profiles.apply(await api<Snapshot>('state'));
  const objective = await api<Task>('objectives', { objective: DEFAULT_OBJECTIVE });
  await sleep(200); assert.equal((await api<Snapshot>('state')).executions.length, 0, 'Paused task dispatched');
  await api('pause', { paused: false });
  const complete = await observe(s => s.tasks.find(t => t.task_id === objective.task_id)?.status === 'completed');
  profiles.verify(complete);
  assert.equal(complete.workers.length, 2); const atlas = complete.workers.find(w => w.display_name === 'Atlas')!;
  const scout = complete.workers.find(w => w.display_name === 'Scout')!; assert.ok(scout); assert.equal(scout.manager_worker_id, atlas.worker_id);
  assert.equal(scout.lifecycle, 'persistent'); assert.equal(scout.enabled, 1); assert.equal(scout.status, 'idle');
  assert.equal(scout.title, 'Market Researcher');
  assert.equal(complete.executions.length, 3); assert.ok(complete.executions.every(e => e.status === 'completed'));
  assert.equal(complete.tasks.length, 2); assert.ok(complete.tasks.every(t => t.status === 'completed'));
  assert.ok(complete.artifacts.length >= 1); assert.equal(complete.bindings.length, 2);
  assert.ok(complete.audit.some(e => e.type === 'worker_resumed' && e.worker_id === atlas.worker_id));
  const reportResponse = await fetch(`${base}/api/artifacts/${complete.artifacts[0]!.artifact_id}`);
  const report = await reportResponse.text(); assert.ok(report.length > 300); writeFileSync(join(dataDir, 'scout-report.md'), report);
  writeFileSync(join(dataDir, 'workflow-state.json'), JSON.stringify(complete, null, 2));
  await stop(); await launch(); await sleep(500);
  const restarted = await api<Snapshot>('state');
  for (const key of ['tasks', 'messages', 'executions', 'artifacts', 'bindings'] as const) assert.deepEqual(restarted[key], complete[key], `Restart changed ${key}`);
  assert.equal(restarted.workers.length, 2); assert.equal(restarted.workers.find(w => w.worker_id === scout.worker_id)?.manager_worker_id, atlas.worker_id);
  console.log('PASS: process restart preserved state and did not repeat completed work.');
  // One bounded follow-up proves the persisted Codex binding is usable after process restart.
  const followup = await api<Task>('objectives', { objective: 'Using your previously reviewed Scout report and existing conversation context, report the single most important reliability safeguard to the Human in at most 100 words. Do not hire or assign any new research.' });
  const resumed = await observe(s => s.tasks.find(t => t.task_id === followup.task_id)?.status === 'completed', 240000);
  assert.equal(resumed.executions.length, 4); assert.equal(resumed.workers.length, 2);
  assert.equal(resumed.bindings.find(b => b.worker_id === atlas.worker_id)?.runtime_reference, complete.bindings.find(b => b.worker_id === atlas.worker_id)?.runtime_reference);
  // Verify interruption against a real turn, not only the fake protocol.
  const interruptTask = await api<Task>('objectives', { objective: 'Prepare a detailed local reasoning review of the three reliability risks from the existing report. Do not hire or assign work. The human may interrupt this validation turn.' });
  const running = await observe(s => s.audit.some(e => e.type === 'runtime_turn_started' && e.task_id === interruptTask.task_id), 60000);
  const execution = running.executions.find(e => e.task_id === interruptTask.task_id)!;
  assert.equal(execution.status, 'running', 'Turn completed before interruption could be checked');
  await api('interrupt', { execution_id: execution.execution_id });
  const interrupted = await observe(s => s.executions.find(e => e.execution_id === execution.execution_id)?.status === 'interrupted', 20000);
  assert.match(interrupted.executions.find(e => e.execution_id === execution.execution_id)?.error ?? '', /Codex confirmed turn interruption/);
  await api('cancel', { task_id: interruptTask.task_id });
  const final = await api<Snapshot>('state');
  const evidence = { started, finished: new Date().toISOString(), data_directory: dataDir, result: 'PASS',
    workflow_task_id: objective.task_id, atlas_id: atlas.worker_id, scout_id: scout.worker_id,
    checks: ['real dynamic hire', 'real Scout execution and artifact', 'real Atlas resume/evaluation', 'pause', 'process restart persistence', 'no replay of completed work', 'persisted binding resumes after restart', 'real turn interruption'],
    counts: { workers: final.workers.length, tasks: final.tasks.length, executions: final.executions.length, artifacts: final.artifacts.length },
    worker_profiles:complete.workers.map(w=>({name:w.display_name,worker_id:w.worker_id,model:w.ai_model,reasoning:w.reasoning_effort,priority:w.execution_priority,human_lock:!!w.ai_profile_locked})),bindings:complete.bindings,
    initial_workflow_executions: complete.executions, final_report: complete.tasks.find(t => t.task_id === objective.task_id)?.result_summary };
  writeFileSync(join(dataDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  writeFileSync(join(dataDir, 'final-state.json'), JSON.stringify(final, null, 2));
  console.log(`PASS: real CEO → Scout → CEO, restart/resume and interruption. Evidence: ${join(dataDir, 'evidence.json')}`);
} catch (error) {
  try { writeFileSync(join(dataDir, 'failed-state.json'), JSON.stringify(await api<Snapshot>('state'), null, 2)); } catch {}
  console.error(error instanceof Error ? error.message : 'Real validation failed'); console.error(`Retained validation directory: ${dataDir}`); process.exitCode = 1;
} finally { await stop(); }
