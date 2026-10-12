import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensure } from '../../domain/investment/arithmetic.js';

/** OS account identity, never environment-controlled HOME or caller-selected custody roots. */
export const ownerProbeRoot = () => join(userInfo().homedir, 'Library', 'Application Support', 'BotSquad-Yahoo-HQ-READY-03B');
export const ownerCapsuleRoot = () => '/private/tmp/botsquad-yahoo-HQ-READY-03B';
const repository = fileURLToPath(new URL('../../../../', import.meta.url));
const git = (...args: string[]) => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export function probeSourceIdentity(): { commit: string; sourceHash: string } {
  ensure(git('branch', '--show-current') === 'main' && git('status', '--porcelain') === '', 'probe_requires_clean_main');
  const commit = git('rev-parse', 'HEAD');
  ensure(commit === git('rev-parse', 'origin/main'), 'probe_requires_synchronized_main');
  const files = git('ls-files', 'src', 'scripts', 'adapters/yahoo', 'package.json', 'package-lock.json', 'tsconfig.json').split('\n');
  const hasher = createHash('sha256'); hasher.update(commit);
  for (const file of files) {
    hasher.update(file); hasher.update(readFileSync(join(repository, file)));
    if (file.endsWith('.ts')) hasher.update(readFileSync(join(repository, 'dist', file.replace(/\.ts$/, '.js'))));
  }
  return { commit, sourceHash: hasher.digest('hex') };
}
export function verifyOwnerProbeHost(): void {
  ensure(process.platform === 'darwin' && process.getuid!() !== 0, 'probe_owner_host');
  ensure(execFileSync('/bin/sh', ['-c', 'ulimit -c'], { encoding: 'utf8' }).trim() === '0', 'probe_core_dumps_must_be_disabled');
  const parent = dirname(ownerProbeRoot());
  ensure(existsSync(parent) && !lstatSync(parent).isSymbolicLink(), 'probe_owner_parent');
  const vault = execFileSync('/usr/bin/fdesetup', ['status'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  ensure(vault.includes('FileVault is On.'), 'probe_encrypted_owner_host_required');
  const swap = execFileSync('/usr/sbin/sysctl', ['vm.swapusage'], { encoding: 'utf8' });
  ensure(swap.includes('(encrypted)'), 'probe_encrypted_swap_required');
}
export function assertProbeExcluded(path: string): void {
  ensure(execFileSync('/usr/bin/tmutil', ['isexcluded', path], { encoding: 'utf8' }).includes('[Excluded]'), 'probe_backup_exclusion_unverified');
}
export function excludeProbePath(path: string): void {
  execFileSync('/usr/bin/tmutil', ['addexclusion', path], { stdio: 'pipe' }); assertProbeExcluded(path);
}
