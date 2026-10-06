import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Readable} from 'node:stream';
import {type ClientRequest,type IncomingMessage,type RequestOptions} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {mkdirSync,mkdtempSync,writeFileSync,chmodSync,rmSync,symlinkSync,renameSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {GithubMarkdownAdapter} from '../src/business/github-markdown.js';
import {gitBlobHash,exactEdit,type ExternalAction} from '../src/domain/business.js';

// Controlled transport for the PRODUCTION adapter. No request reaches GitHub.
const target={repository:'example/operations',repository_id:42,branch:'main',path:'README.md'};
const old='# Operations\nOld status\n',updated='# Operations\nNew status\n';
const before='a'.repeat(40),after='b'.repeat(40),intervening='c'.repeat(40),treeOld='d'.repeat(40),treeNew='e'.repeat(40);
function fixture(t:TestContext){
  const root=resolve(process.env.BOT_BUSINESS_CREDENTIAL_TEST_ROOT??join(process.cwd(),'.validation'));mkdirSync(root,{recursive:true,mode:0o700});
  const dir=mkdtempSync(join(root,'business-adapter-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const tokenPath=join(dir,'token'),configPath=join(dir,'config.json');writeFileSync(tokenPath,'github_pat_SIMULATED_NO_REAL_CREDENTIAL',{mode:0o600});
  const config=[{ref:'fixture',token_file:tokenPath,repository_id:42,repository_restricted:true,targets:[target]}];writeFileSync(configPath,JSON.stringify(config),{mode:0o600});
  const calls:{method:string;path:string;body:string;host:string}[]=[];
  let change:(path:string,data:any)=>any=(_p,d)=>d,status=200,hang=false,raw:string|undefined;
  let parent=before,candidates=[{sha:after,commit:{message:'Exact message'}}],lost=false;
  const reply=(path:string,method:string)=>{
    if(method==='PUT')return {content:{path:'README.md',sha:gitBlobHash(updated)},commit:{sha:after,message:'Exact message',parents:[{sha:parent}],committer:{date:'2026-10-05T00:00:00Z'}}};
    if(path==='/repos/example/operations')return {id:42,full_name:'example/operations',archived:false};
    if(path.endsWith('/git/ref/heads/main'))return {ref:'refs/heads/main',object:{type:'commit',sha:before}};
    if(path.includes('/commits?'))return candidates;
    if(path.includes('/git/commits/')){const sha=path.split('/').at(-1);return {sha,tree:{sha:sha===after?treeNew:treeOld},parents:[{sha:sha===after?parent:'f'.repeat(40)}],committer:{date:'2026-10-05T00:00:00Z'},message:sha===after?'Exact message':'Prior'};}
    if(path.includes('/git/trees/')){const isNew=path.endsWith(treeNew);return {sha:isNew?treeNew:treeOld,tree:[{path:'README.md',type:'blob',mode:'100644',sha:gitBlobHash(isNew?updated:old)}]};}
    if(path.includes('/git/blobs/')){const isNew=path.endsWith(gitBlobHash(updated)),content=isNew?updated:old;return {sha:gitBlobHash(content),encoding:'base64',content:Buffer.from(content).toString('base64'),size:Buffer.byteLength(content)};}
    throw Error('Unexpected fixture request path');
  };
  const transport=((options:RequestOptions,callback:(r:IncomingMessage)=>void)=>{
    assert.equal(options.hostname,'api.github.com');assert.equal(options.port,443);assert.equal(typeof options.headers,'object');
    const req=new EventEmitter() as ClientRequest;let body='';
    req.write=((chunk:Buffer)=>{body+=chunk.toString();return true;}) as ClientRequest['write'];
    req.destroy=(()=>{queueMicrotask(()=>req.emit('close'));return req;}) as ClientRequest['destroy'];
    req.end=(()=>{calls.push({method:String(options.method),path:String(options.path),body,host:String(options.hostname)});queueMicrotask(()=>{
      if(hang)return;
      if(lost&&options.method==='PUT'){req.emit('error',new Error('SIMULATED lost response with PRIVATE token'));req.emit('close');return;}
      const path=String(options.path),payload=change(path,reply(path,String(options.method))),res=Readable.from([Buffer.from(raw??JSON.stringify(payload))]) as IncomingMessage;
      Object.assign(res,{statusCode:status,headers:{'x-github-request-id':'SIMULATED-REQUEST',...(status===302?{location:'http://localhost/secret'}:{})}});
      res.on('end',()=>req.emit('close'));callback(res);
    });return req;}) as ClientRequest['end'];
    return req;
  }) as typeof httpsRequest;
  const adapter=new GithubMarkdownAdapter(configPath,transport,15);
  const action={target:JSON.stringify(target),credential_ref:'fixture',expected_blob:gitBlobHash(old),previous_content:old,content:updated,content_blob:gitBlobHash(updated),commit_message:'Exact message'} as ExternalAction;
  return {adapter,action,calls,config,configPath,tokenPath,dir,change(fn:typeof change){change=fn;},status(n:number){status=n;},hang(){hang=true;},raw(value:string){raw=value;},parent(value:string){parent=value;},candidates(value:typeof candidates){candidates=value;},lost(){lost=true;}};
}
test('production adapter fixture reads exact source, emits approved PUT bytes, retains actual provider parent',async t=>{
  const f=fixture(t),snapshot=await f.adapter.read(target,'fixture');assert.equal(snapshot.content,old);assert.equal(snapshot.blob,gitBlobHash(old));assert.equal(snapshot.head,before);
  f.parent(intervening);let boundaries=0;const result=await f.adapter.replace(f.action,()=>{boundaries++;assert.equal(f.calls.filter(c=>c.method==='PUT').length,0);});
  assert.equal(result.parent,intervening);assert.equal(result.confirmation,'provider_response');assert.equal(boundaries,1);
  const puts=f.calls.filter(c=>c.method==='PUT');assert.equal(puts.length,1);assert.equal(puts[0]!.path,'/repos/example/operations/contents/README.md');
  assert.deepEqual(JSON.parse(puts[0]!.body),{message:'Exact message',content:Buffer.from(updated).toString('base64'),sha:gitBlobHash(old),branch:'main'});
  assert.ok(!JSON.stringify({snapshot,result}).includes('CREDENTIAL'));
});
for(const defect of ['repository_identity','redirect','symlink','executable','truncated_tree','blob_identity','invalid_utf8','oversize','malformed_json','wrong_ref'] as const)test(`production adapter denies ${defect} before effect`,async t=>{
  const f=fixture(t);let boundaries=0;
  f.change((path,d)=>{if(defect==='repository_identity'&&path==='/repos/example/operations')d.id=99;
    if(path.includes('/git/trees/')){if(defect==='symlink')d.tree[0].mode='120000';if(defect==='executable')d.tree[0].mode='100755';if(defect==='truncated_tree')d.truncated=true;}
    if(path.includes('/git/blobs/')){if(defect==='blob_identity')d.sha='0'.repeat(40);if(defect==='invalid_utf8'){d.content='/w==';d.size=1;}}
    if(defect==='wrong_ref'&&path.includes('/git/ref/'))d.ref='refs/heads/other';return d;});
  if(defect==='redirect')f.status(302);if(defect==='oversize')f.raw('x'.repeat(1024*1024+1));if(defect==='malformed_json')f.raw('{broken');
  await assert.rejects(f.adapter.replace(f.action,()=>{boundaries++;}));assert.equal(boundaries,0);assert.equal(f.calls.filter(c=>c.method==='PUT').length,0);
  if(defect==='redirect')assert.equal(f.calls.length,1,'Redirect must not be followed');
});
test('production adapter timeout rejects without exposing raw transport error',async t=>{
  const f=fixture(t);f.hang();const keepAlive=setTimeout(()=>{},1000);t.after(()=>clearTimeout(keepAlive));
  await assert.rejects(f.adapter.read(target,'fixture'),/GitHub request unavailable/);
});
test('changed document and revoked authority at final boundary never make a PUT',async t=>{
  const f=fixture(t);await assert.rejects(f.adapter.replace({...f.action,expected_blob:'0'.repeat(40)},()=>{}),/changed/);
  await assert.rejects(f.adapter.replace(f.action,()=>{throw Error('Revoked before transmission');}),/Revoked/);assert.equal(f.calls.filter(c=>c.method==='PUT').length,0);
});
for(const defect of ['path','message','blob','parent','commit'] as const)test(`malformed ${defect} in transmitted provider success is rejected`,async t=>{
  const f=fixture(t);f.change((path,d)=>{if(path.includes('/contents/')){if(defect==='path')d.content.path='other.md';if(defect==='message')d.commit.message='Other';if(defect==='blob')d.content.sha='0'.repeat(40);if(defect==='parent')d.commit.parents=[];if(defect==='commit')d.commit.sha='bad';}return d;});
  let transmitted=false;await assert.rejects(f.adapter.replace(f.action,()=>{transmitted=true;}));assert.ok(transmitted);assert.equal(f.calls.filter(c=>c.method==='PUT').length,1);
});
test('lost response permits read-only correlated reconciliation with no second PUT',async t=>{
  const f=fixture(t);f.lost();await assert.rejects(f.adapter.replace(f.action,()=>{}),e=>e instanceof Error&&!e.message.includes('PRIVATE'));
  const receipt=await f.adapter.reconcile(f.action);assert.equal(receipt?.commit,after);assert.equal(receipt?.confirmation,'reconciled_correlation');assert.equal(f.calls.filter(c=>c.method==='PUT').length,1);
});
for(const defect of ['absent','multiple','message','after_blob','parent_blob','provider_failure'] as const)test(`reconciliation ${defect} cannot fabricate a receipt`,async t=>{
  const f=fixture(t);if(defect==='absent')f.candidates([]);if(defect==='multiple')f.candidates([{sha:after,commit:{message:'Exact message'}},{sha:intervening,commit:{message:'Exact message'}}]);if(defect==='message')f.candidates([{sha:after,commit:{message:'Other'}}]);
  if(defect==='after_blob')f.change((path,d)=>{if(path.endsWith(`/git/commits/${after}`))d.tree.sha=treeOld;return d;});
  if(defect==='parent_blob')f.change((path,d)=>{if(path.endsWith(`/git/commits/${before}`))d.tree.sha=treeNew;return d;});
  if(defect==='provider_failure'){f.status(403);await assert.rejects(f.adapter.reconcile(f.action));}else assert.equal(await f.adapter.reconcile(f.action),null);
  assert.equal(f.calls.filter(c=>c.method==='PUT').length,0);
});
for(const defect of ['token_mode','config_mode','symlink_token','unsafe_ancestor','credential_scope','missing_ref'] as const)test(`protected credential boundary denies ${defect}`,async t=>{
  const f=fixture(t);
  if(defect==='token_mode')chmodSync(f.tokenPath,0o644);if(defect==='config_mode')chmodSync(f.configPath,0o644);
  if(defect==='symlink_token'){renameSync(f.tokenPath,f.tokenPath+'.real');symlinkSync(f.tokenPath+'.real',f.tokenPath);}
  if(defect==='unsafe_ancestor')chmodSync(f.dir,0o777);
  if(defect==='credential_scope'){f.config[0]!.repository_restricted=false as true;writeFileSync(f.configPath,JSON.stringify(f.config));}
  await assert.rejects(f.adapter.read(target,defect==='missing_ref'?'unconfigured':'fixture'));assert.equal(f.calls.length,0);
});
test('exact edit replacement is literal even with JavaScript replacement metacharacters',()=>{
  for(const value of ['$&',"$'",'$`','$$'])assert.equal(exactEdit('before old after',{old_text:'old',new_text:value}).content,`before ${value} after`);
});
