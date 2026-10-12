/** Dedicated 03E owner CLI; never imported by startup, employees or scheduling. */
import { fork } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensure } from '../src/domain/investment/arithmetic.js';
import { hash } from '../src/domain/investment/identity.js';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { yahooProbeTransport } from '../src/control/market/yahoo-https.js';
import { YahooHistoryCustody, prepareOwnerHistory, cleanupOwnerHistory, historyStatus, ownerHistoryRoot } from '../src/control/market/yahoo-history-custody.js';
import { HISTORY_ID, historyLimits } from '../src/control/market/yahoo-history-manifest.js';
import { startHistoryWatchdog } from '../src/control/market/yahoo-history-watchdog.js';
import { inspectHistory } from '../src/control/market/yahoo-history-report.js';

const groupGone = (pid: number) => { try { process.kill(-pid, 0); return false; } catch (e) { return (e as NodeJS.ErrnoException).code === 'ESRCH'; } };
const killGroup = (pid: number | undefined) => { if (pid) try { process.kill(-pid, 'SIGKILL'); } catch { /* verified separately */ } };
/** Parent does no synchronous disk I/O while the isolated data group is alive. */
export async function superviseHistory(file: string, args: string[], cleanupArgs: string[], limits = { operationMs: 120000, wireMs: 10000, processMs: 180000 }) {
  const started = performance.now(); let expired = false, killed = false, code: number | null = null;
  let activePid: number | undefined, wireTimer: ReturnType<typeof setTimeout> | undefined, operationTimer: ReturnType<typeof setTimeout> | undefined;
  let requested = 0, pending: number | null = null, consumed = false; let messages = Promise.resolve();
  const stop = () => { killed = true; killGroup(activePid); };
  const overall = setTimeout(() => { expired = true; stop(); }, limits.processMs);
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  const spawn = (argv: string[]) => fork(file, argv, { detached: true, execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: { PATH: process.env.PATH, LANG: 'C', TMPDIR: '/private/tmp' } });
  let guard: Awaited<ReturnType<typeof startHistoryWatchdog>> | undefined;
  try {
    guard = await startHistoryWatchdog(file, cleanupArgs, limits);
    const child = spawn(args); activePid = child.pid;
    code = await new Promise<number | null>((resolve, reject) => {
      child.on('error', error => { if (!child.pid) reject(error); else stop(); });
      child.on('message', value => { messages = messages.then(async () => {
        if (expired || !value || typeof value !== 'object') return;
        if ('ready' in value && value.ready === true && !consumed) {
          consumed = true; await guard!.command('data', child.pid!); operationTimer = setTimeout(stop, Math.max(1, limits.operationMs - 50));
          child.send({ command: 'consume' }, error => { if (error) stop(); });
        } else if ('wireBegin' in value) {
          if (!consumed || pending !== null || value.wireBegin !== requested + 1 || requested >= 6) { stop(); return; }
          pending = ++requested; await guard!.command('wire', pending); wireTimer = setTimeout(stop, Math.max(1, limits.wireMs - 50));
          child.send({ wirePermit: pending }, error => { if (error) stop(); });
        } else if ('wireSettled' in value) {
          if (pending === null || value.wireSettled !== pending) { stop(); return; }
          await guard!.command('settled', pending); clearTimeout(wireTimer); pending = null;
        } else { stop(); }
      }).catch(stop); });
      child.once('exit', resolve);
    });
    await messages; clearTimeout(wireTimer); clearTimeout(operationTimer);
    // Even a normal Node exit cannot leave a raw-data-holding descendant alive.
    killGroup(activePid);
    while (activePid && !groupGone(activePid) && !expired) await new Promise(r => setTimeout(r, 20));
    ensure(activePid && groupGone(activePid), 'probe_process_group_unconfirmed');
    if (consumed) await guard.command('clear', activePid); activePid = undefined;
    ensure(!expired && performance.now() - started < limits.processMs, 'probe_process_timeout');
    const cleanup = spawn(cleanupArgs); activePid = cleanup.pid;
    const cleanupExit = new Promise<number | null>((resolve, reject) => {
      cleanup.once('error', error => { if (!cleanup.pid) reject(error); else stop(); }); cleanup.once('exit', resolve);
    });
    await guard.command('cleanup', activePid); const cleanupCode = await cleanupExit;
    killGroup(activePid);
    ensure(activePid && groupGone(activePid) && cleanupCode === 0 && !expired, 'probe_cleanup_incomplete'); await guard.command('clear', activePid); activePid = undefined;
    await guard.command('done'); ensure(await guard.done() === 0, 'probe_watchdog_stopped'); guard = undefined;
    return { id: HISTORY_ID, processExited: true, dataProcessGroupGone: true, cleanupVerified: true,
      code, killed, supervisedWirePermits: requested, elapsedMs: Math.ceil(performance.now() - started), noResume: true };
  } finally { killGroup(activePid); if (guard) await guard.abort(); clearTimeout(overall); clearTimeout(wireTimer); clearTimeout(operationTimer); process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); }
}
async function run(): Promise<void> {
  let custody: YahooHistoryCustody | undefined, db: Store | undefined;
  try {
    custody = YahooHistoryCustody.consumeOwner(); const m = custody.manifest;
    db = new Store(':memory:'); const market = new MarketStore(db), store = new FinancialStore(market, custody);
    for (const [kind, value] of [['policy', m.policy], ['instrument', m.instrument], ['calendar', m.calendar]] as const) market.register(value, kind, m.preparedAt);
    store.initialize(m.scope);
    const gateway = new FinancialDataGateway(store, { now: () => new Date().toISOString() },
      new PythonYahooAdapter(custody.capsulePath, 'hq-ready-03e-query1-only'), yahooProbeTransport(custody));
    const result = await gateway.collect(m.policy.id, m.reads[0]!, HISTORY_ID + '-history', custody.signal);
    const observation = result.observationId ? store.observation(result.observationId) : null;
    custody.finish(result, observation);
    const quality = observation ? inspectHistory(observation, m) : null;
    custody.seal({ type: 'private_report', result, quality });
    custody.record({ type: 'quality', status: result.status, quality });
  } finally { try { db?.close(); } finally { custody?.destroy(); } }
}
/** Installed only in the isolated data child. Unexpected parent loss kills Python too. */
export function watchHistorySupervisor(): void {
  ensure(typeof process.send === 'function' && process.connected, 'probe_supervisor_required');
  const stop = () => { killGroup(process.pid); process.exit(1); };
  process.once('disconnect', stop); process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
async function main(): Promise<void> {
  const command = process.argv[2];
  ensure(process.argv.length === 3 && ['prepare', 'run', 'status', 'cleanup', '--consume', '--recover'].includes(command!), 'probe_cli_command');
  ensure(process.execArgv.length === 0 && !process.env.NODE_OPTIONS && !process.env.NODE_EXTRA_CA_CERTS && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0', 'probe_node_configuration');
  if (command === 'status') { console.log(JSON.stringify(historyStatus())); return; }
  if (command === 'prepare') { const m = prepareOwnerHistory(); console.log(JSON.stringify({ id: m.id, approvalId: m.approvalId, manifestHash: hash(m), expiresAt: m.expiresAt, limits: m.limits, sequence: m.sequence })); return; }
  if (command === 'cleanup' || command === '--recover') {
    if (existsSync(join(ownerHistoryRoot(), 'spent.json'))) cleanupOwnerHistory();
    else ensure(!historyStatus().capsulePresent, 'probe_cleanup_unconsumed_capsule');
    if (process.connected) process.disconnect(); return;
  }
  if (command === 'run') {
    console.log(JSON.stringify(await superviseHistory(fileURLToPath(import.meta.url), ['--consume'], ['--recover'], historyLimits)));
    return;
  }
  ensure(typeof process.send === 'function' && process.connected, 'probe_supervisor_required');
  watchHistorySupervisor();
  await new Promise<void>(resolve => {
    const handler = (value: unknown) => { if (value && typeof value === 'object' && 'command' in value && value.command === 'consume') { process.removeListener('message', handler); resolve(); } };
    process.on('message', handler); process.send!({ ready: true });
  });
  try { await run(); } finally { process.removeAllListeners('disconnect'); process.disconnect(); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main().catch(() => {
  console.error('HQ-READY-03E stopped. Inspect private non-data receipts; never retry.');
  if (process.connected) process.disconnect(); process.exitCode = 1;
});
