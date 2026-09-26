import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { linuxProductCommand } from './isolation/linux.js';
import { requireThat } from '../domain/model.js';
import type { Validation } from '../domain/engineering.js';

// Product code is untrusted. Never replace this with an unsandboxed fallback.
// Seatbelt denies OS effects; Node permissions further restrict reads to this worktree.
export function runProduct(root: string, files: string[], cli = false): Validation {
  requireThat(['darwin', 'linux'].includes(process.platform), 'Unsupported confined product platform');
  requireThat(realpathSync(root) === root, 'Test root is not canonical');
  requireThat(files.length > 0 && files.every(f => /^(test\/(calculate|format|integrated)(\.extra)?\.test\.mjs|cli\.mjs)$/.test(f)), 'Test command outside approved scope');
  const executable = realpathSync(process.execPath);
  const literal = (s: string) => JSON.stringify(s);
  const profile = `(version 1)(allow default)
    (deny network*)(deny file-write*)(deny process-fork)(deny signal)
    (deny process-exec (require-not (literal ${literal(executable)})))
    (deny file-read-data (require-all (vnode-type REGULAR-FILE)
      (require-not (require-any (subpath ${literal(root)}) (subpath "/opt/homebrew")
        (subpath "/usr") (subpath "/System") (subpath "/Library") (subpath "/private/var/db")
        (subpath "/private/preboot") (subpath "/dev")))))`;
  const args = ['--permission', `--allow-fs-read=${root}`, '--no-addons', '--disable-sigusr1', '--max-old-space-size=96',
    ...(cli ? [] : ['--test', '--test-isolation=none', '--test-reporter=tap']), ...files];
  const linux = process.platform === 'linux' ? linuxProductCommand(root, executable, args) : undefined;
  let result;
  try { result = spawnSync(linux?.command ?? '/usr/bin/sandbox-exec', linux?.args ?? ['-p', profile, executable, ...args], {
    cwd: root, env: { PATH: '/usr/bin:/bin', LANG: 'C', TZ: 'UTC' }, encoding: 'utf8',
    timeout: 10000, killSignal: 'SIGKILL', maxBuffer: 64000, stdio: linux ? ['ignore', 'pipe', 'pipe', linux.filterFd] : ['ignore', 'pipe', 'pipe'],
  }); } finally { linux?.close(); }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(0, 16000);
  return { command: `confined-node ${cli ? '' : '--test --test-isolation=none '}${files.join(' ')}`,
    passed: result.status === 0 && !result.error && (cli || (/^# tests [1-9][0-9]*$/m.test(output) && /^# fail 0$/m.test(output))), exit_code: result.status,
    output: result.error ? `${output}\nRunner failed or exceeded limit: ${result.error.name}` : output, checked_at: new Date().toISOString() };
}
