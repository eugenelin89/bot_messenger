import { spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { HARD_BOUNDS, parseRecipe, relativePath, type Recipe } from '../domain/projects.js';
import { linuxProductCommand } from './isolation/linux.js';
import { requireThat } from '../domain/model.js';
import type { Validation } from '../domain/engineering.js';

const reporter = fileURLToPath(new URL('./validation-reporter.js', import.meta.url));
function completedTests(receipt: string | Buffer | null | undefined, key: Buffer): boolean {
  try {
    if (!receipt || receipt.length > 2048) return false;
    const { payload, signature } = JSON.parse(receipt.toString());
    if (typeof payload !== 'string' || signature !== createHmac('sha256', key).update(payload).digest('hex')) return false;
    const result = JSON.parse(payload);
    return result.success === true && Number.isSafeInteger(result.tests) && result.tests > 0 &&
      Number.isSafeInteger(result.passed) && result.passed > 0 && result.failed === 0 && result.cancelled === 0;
  } catch { return false; }
}

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
      (require-not (require-any (subpath ${literal(root)}) (literal ${literal(reporter)}) (subpath "/opt/homebrew")
        (subpath "/usr") (subpath "/System") (subpath "/Library") (subpath "/private/var/db")
        (subpath "/private/preboot") (subpath "/dev")))))`;
  const args = ['--permission', `--allow-fs-read=${root}`, '--no-addons', '--disable-sigusr1', '--max-old-space-size=96',
    ...(cli ? [] : [`--allow-fs-read=${reporter}`, '--test', '--test-isolation=none', `--test-reporter=${reporter}`]), ...files];
  const key = randomBytes(32);
  const linux = process.platform === 'linux' ? linuxProductCommand(root, executable, args, {writable:false,cwd:'.',reporter:cli?undefined:reporter}) : undefined;
  let result;
  try { result = spawnSync(linux?.command ?? '/usr/bin/sandbox-exec', linux?.args ?? ['-p', profile, executable, ...args], {
    cwd: root, env: { PATH: '/usr/bin:/bin', LANG: 'C', TZ: 'UTC' }, encoding: 'utf8',
    input: cli ? undefined : key, timeout: 10000, killSignal: 'SIGKILL', maxBuffer: 64000,
    stdio: ['pipe', 'pipe', 'pipe', linux?.filterFd ?? 'ignore', 'pipe'],
  }); } finally { linux?.close(); }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(0, 16000);
  return { command: `confined-node ${cli ? '' : '--test --test-isolation=none '}${files.join(' ')}`,
    passed: result.status === 0 && !result.error && (cli || completedTests(result.output[4], key)), exit_code: result.status,
    output: result.error ? `${output}\nRunner failed or exceeded limit: ${result.error.name}` : output, checked_at: new Date().toISOString() };
}

// Generic recipes run in a disposable copy. Build output never mutates a clone or
// canonical repository. Node is the explicitly supported runtime in this milestone.
export function runRecipe(source: string, configured: Recipe, bounds = HARD_BOUNDS): Validation & {recipe_id:string} {
  const recipe=parseRecipe(configured);
  requireThat(['darwin','linux'].includes(process.platform),'Unsupported confined validation platform');
  requireThat(realpathSync(source)===source,'Validation source is not canonical');
  const root=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-validation-')));
  try {
    let count=0;let bytes=0;
    const copy=(path:string,relative='')=>{
      for(const name of readdirSync(path)){
        if(!relative&&name==='.git')continue;
        const rel=relative?`${relative}/${name}`:name;relativePath(rel);
        const from=join(path,name),to=join(root,rel),stat=lstatSync(from);
        requireThat(++count<=bounds.files*2&&!stat.isSymbolicLink()&&(stat.isDirectory()||stat.isFile())&&(stat.isDirectory()||stat.nlink===1),'Unsafe validation snapshot entry');
        if(stat.isDirectory()){mkdirSync(to,{mode:0o700});copy(from,rel);}
        else{requireThat(stat.size<=bounds.file_bytes&&(bytes+=stat.size)<=bounds.repository_bytes,'Validation snapshot exceeds bounds');copyFileSync(from,to);}
      }
    };
    copy(source);mkdirSync(join(root,'build','.tmp'),{recursive:true,mode:0o700});
    const cwd=recipe.cwd==='.'?root:join(root,recipe.cwd);
    requireThat(realpathSync(cwd)===cwd&&lstatSync(cwd).isDirectory(),'Recipe working directory invalid');
    const executable=realpathSync(process.execPath);
    const args=['--jitless','--permission',`--allow-fs-read=${root}`,`--allow-fs-write=${root}/build`,'--no-addons','--disable-sigusr1','--max-old-space-size=96',
      `--allow-fs-read=${reporter}`,'--test','--test-isolation=none',`--test-reporter=${reporter}`,...recipe.argv.slice(1)];
    const profile=`(version 1)(allow default)(deny network*)(deny process-fork)(deny signal)
      (deny process-exec (require-not (literal ${JSON.stringify(executable)})))
      (deny file-write* (require-not (subpath ${JSON.stringify(join(root,'build'))})))
      (deny file-read-data (require-all (vnode-type REGULAR-FILE) (require-not (require-any
        (subpath ${JSON.stringify(root)}) (literal ${JSON.stringify(reporter)}) (subpath "/opt/homebrew") (subpath "/usr") (subpath "/System")
        (subpath "/Library") (subpath "/private/var/db") (subpath "/private/preboot") (subpath "/dev")))))`;
    const key=randomBytes(32);
    const linux=process.platform==='linux'?linuxProductCommand(root,executable,args,{writable:true,cwd:recipe.cwd,reporter}):undefined;
    let result;
    try{result=spawnSync(linux?.command??'/usr/bin/sandbox-exec',linux?.args??['-p',profile,executable,...args],{
      cwd,env:{PATH:'/usr/bin:/bin',LANG:'C',TZ:'UTC',TMPDIR:join(root,'build','.tmp')},encoding:'utf8',timeout:recipe.timeout_ms,
      input:key,killSignal:'SIGKILL',maxBuffer:recipe.output_bytes,stdio:['pipe','pipe','pipe',linux?.filterFd??'ignore','pipe'],
    });}finally{linux?.close();}
    const output=`${result.stdout??''}${result.stderr??''}`.slice(0,recipe.output_bytes);
    return {recipe_id:recipe.recipe_id,command:`confined-node recipe:${recipe.recipe_id}`,passed:result.status===0&&!result.error&&completedTests(result.output[4],key),exit_code:result.status,
      output:result.error?`${output}\nRunner failed or exceeded limit: ${result.error.name}`:output,checked_at:new Date().toISOString()};
  }finally{rmSync(root,{recursive:true,force:true});}
}
