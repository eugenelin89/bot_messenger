import { closeSync, existsSync, mkdtempSync, openSync, lstatSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { requireThat } from '../../domain/model.js';

// Linux x86_64 seccomp ABI, classic BPF. Fail closed on another architecture.
// bubblewrap installs this after namespace/mount setup and before exec of Node.
// Only CLONE_THREAD is allowed; clone3 returns ENOSYS for libc's clone fallback.
export function linuxFilter(): Buffer {
  requireThat(process.arch === 'x64', 'Linux confinement currently validates x86_64 only');
  const code: [number, number, number, number][] = [];
  const emit = (op: number, jt: number, jf: number, k: number) => code.push([op, jt, jf, k]);
  const deny = (nr: number, errno = 1) => { emit(0x15, 0, 1, nr); emit(0x06, 0, 0, 0x00050000 | errno); };
  emit(0x20, 0, 0, 4); // seccomp_data.arch
  emit(0x15, 1, 0, 0xc000003e); emit(0x06, 0, 0, 0x80000000);
  emit(0x20, 0, 0, 0); // syscall number; reject x32 ABI
  emit(0x35, 0, 1, 0x40000000); emit(0x06, 0, 0, 0x80000000);
  for (const nr of [41, 53, 57, 58, 62, 101, 155, 165, 166, 169, 175, 176, 200, 234,
    246, 248, 249, 250, 272, 298, 304, 308, 310, 311, 313, 321, 323, 424, 428, 429, 430, 431, 432, 438, 442]) deny(nr);
  deny(435, 38); // clone3 -> ENOSYS
  emit(0x15, 0, 7, 56); // clone
  emit(0x20, 0, 0, 16); // args[0], clone flags
  emit(0x45, 1, 0, 0x00010000); // CLONE_THREAD required
  emit(0x06, 0, 0, 0x00050001);
  emit(0x45, 0, 1, 0x7e020080); // no namespace flags
  emit(0x06, 0, 0, 0x00050001);
  emit(0x06, 0, 0, 0x7fff0000);
  emit(0x06, 0, 0, 0x00050001);
  emit(0x06, 0, 0, 0x7fff0000);
  const bytes = Buffer.alloc(code.length * 8);
  code.forEach(([op, jt, jf, k], i) => { bytes.writeUInt16LE(op, i * 8); bytes[i * 8 + 2] = jt; bytes[i * 8 + 3] = jf; bytes.writeUInt32LE(k, i * 8 + 4); });
  return bytes;
}

export function linuxProductCommand(root: string, executable: string, nodeArgs: string[]) {
  requireThat(process.platform === 'linux' && process.arch === 'x64', 'Unsupported Linux confinement platform');
  requireThat(existsSync('/opt/botsquad-runtime/bwrap'), 'Linux confinement requires bubblewrap; run the Ubuntu bootstrap');
  requireThat(executable.startsWith('/opt/') || executable.startsWith('/usr/'), 'Linux Node must be installed in a trusted system runtime directory');
  const temporary = mkdtempSync(join(tmpdir(), 'botsquad-seccomp-'));
  const filter = join(temporary, 'filter.bpf');
  writeFileSync(filter, linuxFilter(), { mode: 0o600 });
  const filterFd = openSync(filter, 'r'); unlinkSync(filter); rmdirSync(temporary);
  const args = ['--unshare-all', '--die-with-parent', '--new-session', '--cap-drop', 'ALL', '--clearenv',
    '--ro-bind', root, '/work', '--ro-bind', executable, '/runtime/node',
    // A fresh proc mount is forbidden beneath systemd's protected proc submounts.
    // The bounded Node tests need no procfs; retain PID isolation with an empty /proc.
    '--dir', '/proc', '--dev', '/dev'];
  // Only the dynamic loader/libraries are mounted, never /home, /etc, /opt or /var.
  const libraryRoots = new Set<string>();
  for (const path of ['/lib', '/lib64', '/usr/lib', '/usr/lib64']) {
    if (!existsSync(path)) continue;
    const canonical = realpathSync(path);
    if (!libraryRoots.has(canonical)) { args.push('--ro-bind', canonical, canonical); libraryRoots.add(canonical); }
    if (path !== canonical) args.push('--symlink', canonical, path);
  }
  // Hide Git metadata even in the immutable product mount.
  if (existsSync(join(root, '.git'))) {
    if (lstatSync(join(root, '.git')).isDirectory()) args.push('--tmpfs', '/work/.git', '--remount-ro', '/work/.git');
    else args.push('--ro-bind', '/dev/null', '/work/.git');
  }
  args.push('--remount-ro', '/', '--chdir', '/work', '--setenv', 'LANG', 'C', '--setenv', 'TZ', 'UTC',
    '--seccomp', '3', '--', '/runtime/node', ...nodeArgs.map(a => a === `--allow-fs-read=${root}` ? '--allow-fs-read=/work' : a));
  return { command: '/opt/botsquad-runtime/bwrap', args, filterFd, close: () => closeSync(filterFd) };
}
