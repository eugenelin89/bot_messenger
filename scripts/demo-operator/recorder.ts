import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const sensitive = /(?:authorization|cookie|password|secret|credential|csrf|access.?token|refresh.?token|api.?key|private.?key)/i;
export function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/^[\s]*[\[{]/.test(value)) {
      try {return JSON.stringify(redact(JSON.parse(value)));}catch {/* Plain text, not serialized structured data. */}
    }
    return value
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,'[REDACTED KEY]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._~+\/-]+=*)/gi,'[REDACTED]')
    .replace(/((?:password|secret|token|api_key|authorization)\s*[=:]\s*)[^\s,;"}]+/gi,'$1[REDACTED]')
    .replace(/\/var\/lib\/botsquad(?:-workers)?[^\s"'<>]*/g,'[managed host path]');
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,sensitive.test(k)?'[REDACTED]':redact(v)]));
  return value;
}
export function boundedPath(root: string, name: string): string {
  if (isAbsolute(name) || !/^[A-Za-z0-9_./-]+$/.test(name) || name.split('/').some(p=>!p||p==='.'||p==='..')) throw Error('Unsafe artifact path');
  const base=realpathSync(root); const target=resolve(base,name); const rel=relative(base,target);
  if (rel.startsWith(`..${sep}`)||isAbsolute(rel)||!rel) throw Error('Artifact escapes root');
  let cursor=target;
  while (cursor!==base) {
    let stat;try {stat=lstatSync(cursor);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    if(stat?.isSymbolicLink())throw Error('Artifact symlink denied');cursor=dirname(cursor);
  }
  return target;
}
export interface DemoEvent {
  timestamp: string; elapsed_ms: number; step_id: string;
  kind:'operator_action'|'system_event'|'assertion'|'failure';
  description: string; expected_state?: unknown; observed_state?: unknown;
  result:'pass'|'observed'|'fail'; screenshot?: string;
  related_project_id?: string; related_repository_id?: string; related_task_id?: string;
  related_worker_id?: string; related_execution_id?: string; related_approval_id?: string;
}
export class Recorder {
  readonly started=Date.now(); readonly events:DemoEvent[]=[];
  constructor(readonly root:string) { mkdirSync(root,{recursive:false,mode:0o700}); mkdirSync(join(root,'screenshots'),{mode:0o700}); }
  path(name:string) { return boundedPath(this.root,name); }
  save(name:string,value:unknown) { writeFileSync(this.path(name),JSON.stringify(redact(value),null,2)+'\n',{mode:0o600}); }
  record(event:Omit<DemoEvent,'timestamp'|'elapsed_ms'>) {
    if(event.screenshot&&!existsSync(this.path(event.screenshot))) throw Error('Screenshot must exist before event association');
    const out=redact({...event,timestamp:new Date().toISOString(),elapsed_ms:Date.now()-this.started}) as DemoEvent;
    this.events.push(out);this.save('events.json',this.events); this.transcript();
  }
  transcript() {
    const lines=this.events.map(e=>{
      const seconds=Math.floor(e.elapsed_ms/1000);const at=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
      const actor=e.kind==='operator_action'?'Operator action':e.kind==='system_event'?'BotSquad autonomous action':e.kind;
      return `- ${at} — **${actor}:** ${e.description} (${e.result})${e.screenshot?` [Screenshot](${e.screenshot})`:''}`;
    });
    writeFileSync(this.path('transcript.md'),`# Run transcript\n\nOperator: BotSquad Demo Operator (automation).\n\n${lines.join('\n')}\n`,{mode:0o600});
  }
  fileMetadata(name:string) { const data=readFileSync(this.path(name));return {path:resolve(this.path(name)),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')}; }
}
export async function executeSteps<T extends string>(steps:readonly T[], execute:(step:T)=>Promise<void>) {
  for(const step of steps) await execute(step); // An exception stops all later actions.
}
