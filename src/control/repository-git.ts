import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { requireThat } from '../domain/model.js';
import { HARD_BOUNDS, relativePath } from '../domain/projects.js';

export const isSha = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{40}$/.test(s);
export function localGit(cwd: string, args: string[]): string {
  return execFileSync('/usr/bin/git', ['-c', `safe.directory=${cwd}`, '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
    '-c', 'commit.gpgsign=false', '-c', 'core.attributesFile=/dev/null', '-c', 'diff.external=', '-c', 'core.quotePath=false',
    '-c', 'protocol.allow=never', '-c', 'protocol.file.allow=always', '-c', 'credential.helper=',
    '-c', 'user.name=BotSquad', '-c', 'user.email=botsquad@localhost', ...args], {
    cwd, env: { PATH: '/usr/bin:/bin', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1', GIT_LFS_SKIP_SMUDGE: '1', LANG: 'C' },
    encoding: 'utf8', timeout: 15000, maxBuffer: HARD_BOUNDS.diff_bytes + 1024, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
export function safeFile(root: string, path: string, createParents: boolean | 'inspect' = false, limit = HARD_BOUNDS.file_bytes): string {
  relativePath(path);
  requireThat(realpathSync(root) === root && lstatSync(root).isDirectory(), 'Repository root symlink mismatch');
  let current = root;
  const parts = path.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = join(current, parts[i]!);
    if (!existsSync(current)) {
      // existsSync follows links; lstat detects a dangling symlink too.
      try { lstatSync(current); throw new Error('Dangling path'); } catch (e) { requireThat((e as NodeJS.ErrnoException).code === 'ENOENT', 'Source symlink rejected'); }
      if (i < parts.length - 1) { requireThat(createParents, 'Source parent missing'); if(createParents!=='inspect')mkdirSync(current, { mode: 0o700 }); }
      continue;
    }
    const s = lstatSync(current);
    requireThat(!s.isSymbolicLink() && realpathSync(current) === current, 'Source symlink escape rejected');
    requireThat(i < parts.length - 1 ? s.isDirectory() : s.isFile() && s.nlink === 1 && s.size <= limit, 'Source hardlink/non-file or byte limit rejected');
  }
  return current;
}
export function safeText(root: string, path: string, limit = HARD_BOUNDS.file_bytes) {
  const content = readFileSync(safeFile(root, path, false, limit));
  requireThat(!content.includes(0), 'Binary source content is unsupported');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(content); } catch { throw new Error('Source is not UTF-8 text'); }
}
export function workingBounds(root:string,bounds=HARD_BOUNDS,replacing?:string,newBytes=0){
  let files=0,bytes=0,entries=0;const seen=new Set<string>();
  const walk=(directory:string)=>{for(const name of readdirSync(directory)){
    if(directory===root&&name==='.git')continue;
    const path=join(directory,name),relative=path.slice(root.length+1),stat=lstatSync(path);relativePath(relative);
    requireThat(++entries<=bounds.files*4&&!stat.isSymbolicLink()&&(stat.isDirectory()||stat.isFile()&&stat.nlink===1),'Unsafe source tree');
    requireThat(!seen.has(relative.toLowerCase()),'Case-colliding source paths denied');seen.add(relative.toLowerCase());
    if(stat.isDirectory())walk(path);else if(relative!==replacing){files++;bytes+=stat.size;requireThat(stat.size<=bounds.file_bytes,'Source file limit exceeded');}
  }};walk(root);if(replacing){files++;bytes+=newBytes;}
  requireThat(files<=bounds.files&&bytes<=bounds.repository_bytes,'Repository content limit exceeded');return {files,bytes};
}
export function inspectGitMetadata(root: string, worktreeMetadata?: string) {
  requireThat(realpathSync(root) === root, 'Repository root symlink rejected');
  const metadata = join(root, '.git');
  if (worktreeMetadata) {
    requireThat(lstatSync(metadata).isFile() && !lstatSync(metadata).isSymbolicLink() && lstatSync(metadata).nlink === 1 && readFileSync(metadata,'utf8').trim() === `gitdir: ${worktreeMetadata}`, 'Worktree metadata identity mismatch');
    return;
  }
  requireThat(lstatSync(metadata).isDirectory() && realpathSync(metadata) === metadata, 'Independent Git metadata required');
  const configPath = join(metadata, 'config'); const stat = lstatSync(configPath);
  requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size < 8192, 'Unsafe Git config');
  requireThat(readFileSync(configPath, 'utf8').split('\n').map(s => s.trim()).filter(Boolean).every(s => s === '[core]' || /^(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode) = (0|true|false)$/.test(s)), 'Repository configuration outside managed policy');
  for (const p of ['objects/info/alternates','objects/info/http-alternates','info/grafts','info/attributes','shallow','refs/replace','config.worktree']) requireThat(!existsSync(join(metadata, p)), 'Git indirection or unsafe metadata denied');
  for (const name of readdirSync(join(metadata, 'hooks'))) requireThat(name.endsWith('.sample'), 'Active Git hooks denied');
  requireThat(!localGit(root, ['remote']) && !localGit(root, ['for-each-ref','refs/replace']), 'Remote or replacement refs denied');
}
export function inspectTree(root: string, commit: string, bounds = HARD_BOUNDS) {
  requireThat(isSha(commit), 'Invalid tree commit');
  const rows = localGit(root, ['ls-tree','-rlz',commit]).split('\0').filter(Boolean);
  requireThat(rows.length <= bounds.files, 'Repository file count exceeded');
  let bytes = 0; const seen = new Set<string>(); const tree: string[] = [];
  for (const row of rows) {
    const match = /^(100644|100755) blob [0-9a-f]{40}\s+(\d+)\t(.+)$/s.exec(row);
    requireThat(match, 'Repository symlinks/submodules/special entries are unsupported');
    const path = relativePath(match[3]); const size = Number(match[2]);
    requireThat(!seen.has(path.toLowerCase()), 'Case-colliding repository paths denied'); seen.add(path.toLowerCase());
    requireThat(!['.gitmodules','.gitattributes'].includes(path.split('/').at(-1)!), 'Submodules, LFS and custom Git attributes are unsupported');
    requireThat(size <= bounds.file_bytes && (bytes += size) <= bounds.repository_bytes, 'Repository file/total size exceeded');
    tree.push(path);
  }
  return { paths: tree, bytes, files: rows.length };
}
export function inspectObjects(root: string, bounds = HARD_BOUNDS) {
  const rows = localGit(root, ['cat-file','--batch-all-objects','--batch-check=%(objecttype) %(objectsize)']).split('\n').filter(Boolean);
  requireThat(rows.length <= 10000, 'Git object count exceeded');
  let bytes = 0;
  for (const line of rows) {
    const [type, size] = line.split(' '); const n = Number(size);
    requireThat(Number.isSafeInteger(n) && n >= 0 && (type !== 'blob' || n <= bounds.file_bytes) && (bytes += n) <= bounds.repository_bytes, 'Git object bounds exceeded');
  }
  return { objects: rows.length, bytes };
}
export function changedPaths(root: string, base: string, head?: string) {
  const raw = localGit(root, ['diff','--name-only','-z','--no-ext-diff','--no-renames',base,...(head ? [head] : [])]);
  return raw.split('\0').filter(Boolean).map(p => relativePath(p)).sort();
}
