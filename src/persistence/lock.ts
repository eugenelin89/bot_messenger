import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireThat } from '../domain/model.js';

// One service owns recovery for a database. SQLite still independently protects claims.
export function acquireDataLock(dataDir: string): () => void {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const path = join(dataDir, 'service.lock'); const owner = randomUUID();
  const startupPath = join(dataDir, 'startup.lock');
  // Serialize stale-lock reclamation with ordinary startup. Without this gate, two
  // starters could both observe a dead PID and one could unlink the other's new lock.
  try { writeFileSync(startupPath, JSON.stringify({ pid: process.pid, owner }), { flag: 'wx', mode: 0o600 }); }
  catch { throw new Error('Another startup owns startup.lock. If startup crashed, inspect the recorded PID before removing that lock.'); }
  try {
    if (existsSync(path)) {
      let previous: { pid: number };
      try { previous = JSON.parse(readFileSync(path, 'utf8')) as { pid: number }; }
      catch { throw new Error('Unreadable service.lock; inspect the data directory before recovery'); }
      requireThat(Number.isSafeInteger(previous.pid) && previous.pid > 0, 'Invalid service.lock; manual inspection required');
      try { process.kill(previous.pid, 0); throw new Error('Another Bot Messenger process owns this data directory'); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        unlinkSync(path);
      }
    }
    writeFileSync(path, JSON.stringify({ pid: process.pid, owner }), { flag: 'wx', mode: 0o600 });
  } finally { unlinkSync(startupPath); }
  return () => {
    if (existsSync(path) && (JSON.parse(readFileSync(path, 'utf8')) as { owner: string }).owner === owner) unlinkSync(path);
  };
}
