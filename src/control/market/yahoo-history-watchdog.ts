import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensure } from '../../domain/investment/arithmetic.js';
/** Non-data guard in a separate process group. It remains responsive if either JS loop stalls. */
export async function startHistoryWatchdog(file: string, cleanupArgs: string[], limits: { operationMs: number; wireMs: number; processMs: number }) {
  const python = fileURLToPath(new URL('../../../../adapters/yahoo/.venv/bin/python', import.meta.url));
  const script = fileURLToPath(new URL('../../../../adapters/yahoo/history_watchdog.py', import.meta.url));
  const child = spawn(python, ['-I', '-B', script, process.execPath, file, JSON.stringify(cleanupArgs), JSON.stringify(limits)],
    { detached: true, env: { PATH: process.env.PATH, LANG: 'C' }, stdio: ['pipe', 'pipe', 'ignore'] });
  let counter = 0, ready = false, closed = false, buffer = '';
  const waits = new Map<number, { resolve(): void; reject(error: Error): void }>();
  let readyResolve!: () => void, readyReject!: (error: Error) => void;
  const available = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const fail = () => { const e = new Error('probe_watchdog_stopped'); readyReject(e); for (const wait of waits.values()) wait.reject(e); waits.clear(); };
  child.on('error', fail); child.stdin.on('error', fail);
  const exited = new Promise<number | null>(resolve => child.once('exit', code => { closed = true; fail(); resolve(code); }));
  child.stdout.on('data', chunk => {
    buffer += String(chunk); if (buffer.length > 8192) { fail(); child.stdin.destroy(); return; }
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n'), line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      try { const value = JSON.parse(line);
        if (!ready && value.ready === true) { ready = true; readyResolve(); }
        else if (Number.isSafeInteger(value.ack) && waits.has(value.ack)) { waits.get(value.ack)!.resolve(); waits.delete(value.ack); }
        else { fail(); child.stdin.destroy(); }
      } catch { fail(); child.stdin.destroy(); }
    }
  });
  await available;
  return { async command(command: 'data' | 'cleanup' | 'wire' | 'settled' | 'clear' | 'done', value?: number) {
    ensure(!closed, 'probe_watchdog_stopped'); const id = ++counter;
    await new Promise<void>((resolve, reject) => { waits.set(id, { resolve, reject }); child.stdin.write(JSON.stringify({ id, command, value }) + '\n'); });
  }, async done() { child.stdin.end(); return await exited; },
  // EOF, not killing the guard: it must survive long enough to kill/join/recover the data group.
  async abort() { child.stdin.destroy(); return await exited; } };
}
