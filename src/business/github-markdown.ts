import {request} from 'node:https';
import {constants,openSync,fstatSync,readFileSync,closeSync,lstatSync} from 'node:fs';
import {dirname,isAbsolute} from 'node:path';
import {requireThat} from '../domain/model.js';
import {markdownTarget,gitBlobHash,type MarkdownTarget,type MarkdownSnapshot,type ExternalAction,type MarkdownResult,type BusinessAdapter} from '../domain/business.js';

interface Credential { ref:string; token_file:string; repository_id:number; repository_restricted:true; targets:MarkdownTarget[] }
/** Service-only file references. No HTTP/model input can supply a credential or path. */
function protectedText(path:string,max:number) {
  requireThat(isAbsolute(path),'Business configuration needs an absolute protected file');
  for(let p=dirname(path);p!==dirname(p);p=dirname(p)) {
    const s=lstatSync(p);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&(s.uid===0||s.uid===process.getuid?.())&&(s.mode&0o022)===0,'Business credential ancestors must be protected real directories owned by root or the service');
  }
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try { const s=fstatSync(fd);requireThat(s.isFile()&&(s.uid===process.getuid?.()||s.uid===0)&&(s.mode&0o077)===0&&s.size>0&&s.size<=max,'Business credential file must be owner-private and bounded');return readFileSync(fd,'utf8'); }
  finally {closeSync(fd);}
}
export class GithubMarkdownAdapter implements BusinessAdapter {
  readonly identity='github-markdown-v1'; readonly mode='real_live' as const;
  // The injected transport/deadline is a trusted test seam; startup exposes only configFile.
  constructor(readonly configFile:string,private readonly transport:typeof request=request,private readonly timeoutMs=10000){}
  private token(ref:string,target:MarkdownTarget) {
    const configs=JSON.parse(protectedText(this.configFile,16384)) as Credential[];
    requireThat(Array.isArray(configs)&&configs.length<=4,'Invalid bounded business credential configuration');
    const c=configs.find(x=>x.ref===ref);
    requireThat(c&&c.repository_restricted===true&&c.repository_id===target.repository_id&&Array.isArray(c.targets)&&c.targets.some(t=>JSON.stringify(markdownTarget(t))===JSON.stringify(target)),'No repository-restricted credential configured for exact target');
    // The operator must provision repository-restricted credentials. This declaration
    // is not a provider permission introspection claim; live validation verifies scope.
    const token=protectedText(c.token_file,4096).trim();
    requireThat(/^[A-Za-z0-9_]+$/.test(token)&&token.length>=20,'Invalid credential encoding');return token;
  }
  private async api(target:MarkdownTarget,ref:string,path:string,method:'GET'|'PUT'='GET',body?:object,before?:()=>void,signal?:AbortSignal):Promise<{data:any;request_id:string|null}> {
    requireThat(!signal?.aborted,'Business source retrieval interrupted');
    const token=this.token(ref,target),bytes=body===undefined?undefined:Buffer.from(JSON.stringify(body));
    return new Promise((resolve,reject)=>{
      let settled=false;
      const fail=()=>{if(!settled){settled=true;reject(new Error('GitHub request unavailable; inspect retained attempt state'));}};
      // Only internally assembled paths reach this fixed host. No redirects, proxy,
      // cookies, provider-returned URL or custom worker headers are supported.
      try {before?.();}catch(error){reject(error);return;}
      const req=this.transport({hostname:'api.github.com',port:443,path,method,headers:{Accept:'application/vnd.github+json','User-Agent':'BotSquad-business-v1','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${token}`,...(bytes?{'Content-Type':'application/json','Content-Length':bytes.length}:{})}},res=>{
        const chunks:Buffer[]=[];let size=0;
        res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>1024*1024){req.destroy();fail();}else chunks.push(chunk);});
        res.on('error',fail);res.on('end',()=>{
          if(settled)return;
          if(res.statusCode!==200){fail();return;}
          try { const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));settled=true;resolve({data,request_id:typeof res.headers['x-github-request-id']==='string'?res.headers['x-github-request-id']:null}); }
          catch{fail();}
        });
      });
      const timer=setTimeout(()=>{req.destroy();fail();},this.timeoutMs);timer.unref();
      const abort=()=>{req.destroy();fail();};signal?.addEventListener('abort',abort,{once:true});
      req.on('close',()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);});req.on('error',fail);
      if(signal?.aborted){abort();return;}
      if(bytes)req.write(bytes);req.end();
    });
  }
  private root(t:MarkdownTarget){return `/repos/${t.repository.split('/').map(encodeURIComponent).join('/')}`;}
  private async identityCheck(t:MarkdownTarget,ref:string,signal?:AbortSignal) {
    const {data}=await this.api(t,ref,this.root(t),'GET',undefined,undefined,signal);
    requireThat(data.id===t.repository_id&&String(data.full_name).toLowerCase()===t.repository.toLowerCase()&&!data.archived,'Provider repository identity is not current');
  }
  private async fileAt(t:MarkdownTarget,ref:string,commit:string,signal?:AbortSignal):Promise<{blob:string;content:string;parent:string;provider_time:string|null;message:string}> {
    requireThat(/^[0-9a-f]{40}$/.test(commit),'Invalid provider commit');
    const {data:c}=await this.api(t,ref,`${this.root(t)}/git/commits/${commit}`,'GET',undefined,undefined,signal);
    requireThat(c.sha===commit&&/^[0-9a-f]{40}$/.test(c.tree?.sha),'Invalid provider commit identity');
    let tree=c.tree.sha;const parts=t.path.split('/');requireThat(parts.length<=5,'Document path exceeds directory bound');
    let blob='';
    for(let i=0;i<parts.length;i++) {
      const {data}=await this.api(t,ref,`${this.root(t)}/git/trees/${tree}`,'GET',undefined,undefined,signal);
      requireThat(data.sha===tree&&!data.truncated&&Array.isArray(data.tree),'Incomplete Git tree');
      const entries=data.tree.filter((e:any)=>e.path===parts[i]);requireThat(entries.length===1,'Exact document path is unavailable');const entry=entries[0];
      if(i<parts.length-1){requireThat(entry.type==='tree'&&entry.mode==='040000','Document ancestor is not a tree');tree=entry.sha;}
      else {requireThat(entry.type==='blob'&&entry.mode==='100644','Only a non-executable regular Markdown blob is supported');blob=entry.sha;}
    }
    const {data:b}=await this.api(t,ref,`${this.root(t)}/git/blobs/${blob}`,'GET',undefined,undefined,signal);
    requireThat(b.sha===blob&&b.encoding==='base64'&&b.size<=65536&&typeof b.content==='string','Invalid bounded document blob');
    const bytes=Buffer.from(b.content.replace(/\s/g,''),'base64'),content=bytes.toString('utf8');
    requireThat(bytes.equals(Buffer.from(content))&&!content.includes('\0')&&bytes.length===b.size&&gitBlobHash(content)===blob,'Document must be exact UTF-8 bytes');
    return {blob,content,parent:c.parents?.[0]?.sha??'',provider_time:typeof c.committer?.date==='string'?c.committer.date:null,message:c.message};
  }
  async read(target:MarkdownTarget,credentialRef:string,signal?:AbortSignal):Promise<MarkdownSnapshot> {
    const t=markdownTarget(target);await this.identityCheck(t,credentialRef,signal);
    const {data}=await this.api(t,credentialRef,`${this.root(t)}/git/ref/heads/${encodeURIComponent(t.branch)}`,'GET',undefined,undefined,signal);
    requireThat(data.ref===`refs/heads/${t.branch}`&&data.object?.type==='commit','Exact branch is unavailable');
    const head=data.object.sha,file=await this.fileAt(t,credentialRef,head,signal);
    return {target:t,content:file.content,blob:file.blob,head,retrieved_at:new Date().toISOString(),source_ref:`github:${t.repository_id}:${head}:${t.path}:${file.blob}`,provider_time:file.provider_time};
  }
  async replace(action:ExternalAction,beforeTransmit:()=>void):Promise<MarkdownResult> {
    const t=markdownTarget(JSON.parse(action.target));
    const snapshot=await this.read(t,action.credential_ref);
    requireThat(snapshot.blob===action.expected_blob&&snapshot.content===action.previous_content,'Target document changed after approval');
    // Blob CAS preserves other current files, but does not bind unrelated branch state
    // or prevent ABA. This scope/limitation is displayed in the exact owner packet.
    const {data,request_id}=await this.api(t,action.credential_ref,`${this.root(t)}/contents/${t.path.split('/').map(encodeURIComponent).join('/')}`,'PUT',{
      message:action.commit_message,content:Buffer.from(action.content).toString('base64'),sha:action.expected_blob,branch:t.branch,
    },beforeTransmit);
    requireThat(data.content?.sha===action.content_blob&&data.content.path===t.path&&data.commit?.message===action.commit_message&&/^[0-9a-f]{40}$/.test(data.commit.sha)&&data.commit.parents?.length===1&&/^[0-9a-f]{40}$/.test(data.commit.parents[0].sha),'GitHub returned no matching effect receipt');
    // Response is minimized; independent read-back is a separate observation.
    return {commit:data.commit.sha,blob:data.content.sha,parent:data.commit.parents[0].sha,provider_time:data.commit.committer?.date??null,request_id,confirmation:'provider_response'};
  }
  async reconcile(action:ExternalAction):Promise<MarkdownResult|null> {
    const t=markdownTarget(JSON.parse(action.target));await this.identityCheck(t,action.credential_ref);
    const {data}=await this.api(t,action.credential_ref,`${this.root(t)}/commits?sha=${encodeURIComponent(t.branch)}&path=${encodeURIComponent(t.path)}&per_page=20`);
    requireThat(Array.isArray(data),'Provider history unavailable');
    const candidates=data.filter((c:any)=>c.commit?.message===action.commit_message);
    if(candidates.length!==1)return null;
    const commit=candidates[0].sha,after=await this.fileAt(t,action.credential_ref,commit);
    if(after.blob!==action.content_blob||after.content!==action.content||!after.parent)return null;
    const before=await this.fileAt(t,action.credential_ref,after.parent);
    if(before.blob!==action.expected_blob||before.content!==action.previous_content)return null;
    return {commit,blob:after.blob,parent:after.parent,provider_time:after.provider_time,request_id:null,confirmation:'reconciled_correlation'};
  }
}
