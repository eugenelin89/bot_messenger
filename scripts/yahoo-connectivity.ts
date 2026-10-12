import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensure } from '../src/domain/investment/arithmetic.js';
import { prepareOwnerConnectivity, runOwnerConnectivity, connectivityStatus, recoverConnectivity } from '../src/control/market/yahoo-connectivity.js';

/** Parent never performs synchronous I/O while a child can own response memory. */
export async function superviseConnectivityChild(file: string, args: string[], ceilingMs = 30000): Promise<{ code: number | null; killed: boolean }> {
  const child = fork(file, args, { execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: { PATH: process.env.PATH, LANG: 'C', TMPDIR: '/private/tmp' } });
  let killed = false, failed = false;
  let transportTimer: ReturnType<typeof setTimeout> | undefined;
  const kill = () => { killed = true; child.kill('SIGKILL'); };
  // Armed before the consume command. 30s includes startup, custody, transport and cleanup.
  const timer = setTimeout(kill, ceilingMs);
  const interrupt = () => { child.send?.({ command: 'stop' }, () => {}); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    return await new Promise((resolve, reject) => {
      child.on('error', error => {
        if (!child.pid) { reject(error); return; } // No process was created.
        if (!failed) { failed = true; kill(); } // Keep watchdog armed until actual exit.
      });
      child.once('exit', code => resolve({ code: failed && code === 0 ? 1 : code, killed }));
      child.once('message', value => {
        if (value && typeof value === 'object' && 'ready' in value && value.ready === true) {
          // Stronger than the transport limit: include source/host checks, reservation and
          // cleanup in this independent 10s ceiling, starting before consumption is allowed.
          transportTimer = setTimeout(kill, Math.min(10000, ceilingMs));
          child.send({ command: 'consume' }, () => {});
        }
      });
    });
  } finally { clearTimeout(timer); clearTimeout(transportTimer); process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt); }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  ensure(process.argv.length === 3 && ['prepare', 'run', 'status', 'cleanup', '--supervised-consume'].includes(command!), 'connectivity_command');
  ensure(process.execArgv.length === 0 && !process.env.NODE_OPTIONS && !process.env.NODE_EXTRA_CA_CERTS
    && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0', 'connectivity_node_configuration');
  if (command === 'status') { console.log(JSON.stringify(connectivityStatus())); return; }
  if (command === 'prepare') {
    const manifest = prepareOwnerConnectivity();
    console.log(JSON.stringify({ id: manifest.scope.id, approvalId: manifest.approvalId, expiresAt: manifest.expiresAt, source: manifest.source })); return;
  }
  if (command === 'cleanup') { recoverConnectivity(); console.log('HQ-READY-03D recovery recorded; no resume.'); return; }
  if (command === 'run') {
    const result = await superviseConnectivityChild(fileURLToPath(import.meta.url), ['--supervised-consume']);
    console.log(JSON.stringify({ id: 'HQ-READY-03D', processExited: true, ...result, noResume: true }));
    process.exitCode = result.code === 0 && !result.killed ? 0 : 1; return;
  }
  ensure(typeof process.send === 'function' && process.connected, 'connectivity_supervisor_required');
  const abort = new AbortController();
  const disconnect = () => { abort.abort(); process.exit(1); };
  process.once('disconnect', disconnect); // Loss of the independent watchdog is terminal.
  process.once('SIGINT', () => abort.abort()); process.once('SIGTERM', () => abort.abort());
  await new Promise<void>(resolve => {
    process.on('message', value => {
      if (!value || typeof value !== 'object' || !('command' in value)) return;
      if (value.command === 'consume') resolve();
      if (value.command === 'stop') abort.abort();
    });
    process.send!({ ready: true });
  });
  try { await runOwnerConnectivity(abort.signal); }
  finally { process.removeListener('disconnect', disconnect); process.disconnect(); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main().catch(() => {
    // No exception/driver/provider text escapes the child or owner console.
    console.error('HQ-READY-03D stopped. Inspect private non-data receipts; never retry.');
    if (process.connected) process.disconnect(); process.exitCode = 1;
  });
}
