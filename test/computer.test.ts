import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fixture,objective } from './helpers.js';
import { COMPUTER_CAPABILITIES,COMPANY_CEILING } from '../src/domain/model.js';
import { parseComputerPolicy,computerUrl,canonicalBrowserRequest,computerHash,type BrowserRequest,type BrowserResponse,type PageSnapshot,type ComputerIntent } from '../src/domain/computer.js';
import type { BrowserEnvironment } from '../src/computer/client.js';
import { Store } from '../src/persistence/store.js';
import { ClientDTOs } from '../src/client/dto.js';

const origin='http://127.0.0.1:43991';
const policy=(extra:Record<string,unknown>={})=>({origins:[origin],fixtureOrigins:[origin],mutationPaths:['/save'],expiresAt:new Date(Date.now()+600000).toISOString(),...extra});
// Deterministic adapter ONLY. Real-browser acceptance is a separate Linux gate.
class SyntheticBrowser implements BrowserEnvironment {
  launches=0;closed=0;lost=()=>{};network!:(r:BrowserRequest)=>Promise<BrowserResponse|null>;
  snap:PageSnapshot={url:origin+'/',title:'Synthetic fixture',text:'Synthetic rendered content',elements:[{ref:'e0',tag:'button',role:'button',name:'Save',type:'submit',value:'',checked:false,href:''}],hash:'page-hash'};
  async launch(_id:string,_seconds:number,network:typeof this.network,lost:()=>void){this.launches++;this.network=network;this.lost=lost;return {epoch:'synthetic',browser:'not-a-real-browser',viewport:{width:1024,height:768}};}
  async action(_id:string,action:string,args:Record<string,unknown>) {
    if(action==='navigate'){this.snap.url=String(args.url);await this.network({url:this.snap.url,method:'GET',headers:{},body:'',resourceType:'document'});}
    if(action==='click')await this.network({url:origin+'/save',method:'POST',headers:{'content-type':'application/json'},body:Buffer.from('{"setting":"on"}').toString('base64'),resourceType:'fetch'});
    if(action==='execute_approved')assert.equal(args.page_hash,this.snap.hash);
    return {snapshot:{...this.snap},...(action==='snapshot'?{screenshot:Buffer.from([137,80,78,71,13,10,26,10,0]).toString('base64')}:{})};
  }
  async close(){this.closed++;return true;}
  async confirmIdle(){return true;}
}
function setup() {
  const previous=process.env.BOT_COMPUTER_FIXTURES;process.env.BOT_COMPUTER_FIXTURES=JSON.stringify([origin]);const f=fixture();
  if(previous===undefined)delete process.env.BOT_COMPUTER_FIXTURES;else process.env.BOT_COMPUTER_FIXTURES=previous;
  const browser=new SyntheticBrowser();f.company.computers.factory=()=>browser;
  f.company.computers.forward=async(_r,_p,_s,before)=>{before?.();return {status:200,headers:{'content-type':'text/html'},body:Buffer.from('fixture response').toString('base64')};};
  const worker=f.company.initializeComputerOperator({display_name:'Operator'});
  const request=(extra:Record<string,unknown>={})=>f.company.computers.request({worker_id:worker.worker_id,...objective,policy:policy(extra)});
  const start=(extra:Record<string,unknown>={})=>{const s=request(extra);f.company.computers.authorize({session_id:s.session_id,policy_hash:s.policy_hash,decision:'approve'});const claim=f.company.claimNext();assert.ok(claim);f.company.computers.prepare(claim.context);return {s,...claim};};
  return {...f,browser,worker,request,start};
}
type F=ReturnType<typeof setup>;type Run=ReturnType<F['start']>;
const call=(f:F,r:Run,tool:string,args:Record<string,unknown>={},callId:string=randomUUID())=>f.company.computers.callTool(r.context,callId,'computer_'+tool,{session_id:r.s.session_id,...args},new AbortController().signal) as Promise<any>;
async function pendingIntent(f:F,r:Run) {
  await call(f,r,'navigate',{url:origin+'/'});await call(f,r,'click',{ref:'e0'});
  const i=f.store.get<ComputerIntent>("SELECT * FROM computer_intents WHERE session_id=? AND state='captured' ORDER BY rowid DESC LIMIT 1",r.s.session_id)!;assert.ok(i);
  const wait=await call(f,r,'request_protected_action',{intent_id:i.intent_id,reason:'Harmless disposable fixture save'});assert.equal(wait.awaiting_owner_approval,true);
  return i;
}

test('computer policy rejects scheme/origin/private-network expansion, unsupported file access and bounds',()=>{
  const p=parseComputerPolicy(policy(),[origin]);assert.equal(computerUrl(origin+'/flow',p).origin,origin);
  for(const url of ['file:///etc/passwd','chrome://settings','javascript:alert(1)','data:text/html,test','http://127.0.0.1:4310/api/session','https://example.org','http://169.254.169.254/','http://[::1]/'])assert.throws(()=>computerUrl(url,p));
  for(const change of [{uploads:'allow'},{downloads:'allow'},{maxActions:101},{maxRuntimeSeconds:901},{extra:'authority'},{fixtureOrigins:['http://127.0.0.1:4310']}])assert.throws(()=>parseComputerPolicy(policy(change),[origin]));
  for(const host of ['127.0.0.1','169.254.169.254','10.0.0.1','[::1]','[::ffff:127.0.0.1]','[fd00::1]','[fe80::1]'])assert.throws(()=>parseComputerPolicy(policy({origins:['https://'+host],fixtureOrigins:[],mutationPaths:[]}),[]));
});
test('protected request identity includes fixed headers and rejects upload or unexpected methods',()=>{
  const p=parseComputerPolicy(policy(),[origin]);const raw={url:origin+'/save',method:'POST',body:'e30=',resourceType:'fetch',headers:{'content-type':'application/json',cookie:'secret',authorization:'secret','x-http-method-override':'DELETE'}};
  const canonical=canonicalBrowserRequest(raw,p);assert.deepEqual(Object.keys(canonical.headers).sort(),['accept','accept-encoding','content-type','origin','user-agent']);
  assert.notEqual(computerHash(JSON.stringify(canonical)),computerHash(JSON.stringify(canonicalBrowserRequest({...raw,headers:{'content-type':'text/plain'}},p))));
  assert.throws(()=>canonicalBrowserRequest({...raw,headers:{'content-type':'multipart/form-data'}},p));assert.throws(()=>canonicalBrowserRequest({...raw,method:'DELETE'},p));
});
test('migration and startup create no computer authority, operator or environment and preserve old fields',async t=>{
  const f=fixture();t.after(()=>f.close());const w=f.company.initializeCEO();const before=JSON.stringify(f.store.all('SELECT * FROM workers'));
  assert.ok(!w.delegatable_capabilities.includes('computer_use_sandboxed'));assert.ok(!COMPANY_CEILING.includes('computer_use_sandboxed'));
  const reopened=new Store(join(f.dir,'company.sqlite'));try{assert.equal(JSON.stringify(reopened.all('SELECT * FROM workers')),before);for(const table of ['computer_sessions','computer_grants','computer_contexts','computer_intents'])assert.equal(reopened.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0);assert.equal(reopened.get<{value:string}>("SELECT value FROM settings WHERE key='paused'")!.value,'false');assert.equal(reopened.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.deepEqual(reopened.all('PRAGMA foreign_key_check'),[]);}finally{reopened.close();}
});
test('owner-created operator has minimal capabilities and session authorization is explicit and immutable',async t=>{
  const f=setup();t.after(()=>f.close());assert.deepEqual(f.worker.capability_profile,COMPUTER_CAPABILITIES);assert.deepEqual(f.worker.delegatable_capabilities,[]);
  const s=f.request();assert.equal(f.company.claimNext(),undefined);assert.equal(f.browser.launches,0);
  assert.throws(()=>f.company.computers.authorize({session_id:s.session_id,policy_hash:'changed',decision:'approve'}));
  f.company.computers.authorize({session_id:s.session_id,policy_hash:s.policy_hash,decision:'approve'});
  assert.throws(()=>f.store.run('UPDATE computer_sessions SET policy=? WHERE session_id=?','{}',s.session_id),/immutable/);
  assert.throws(()=>f.store.run('UPDATE computer_grants SET expires_at=? WHERE session_id=?','2099',s.session_id),/immutable/);
  assert.equal(f.browser.launches,0);assert.ok(f.company.claimNext());
});
test('ordinary/forged/cross-worker/stale tool callers cannot provision a browser',async t=>{
  const f=setup();t.after(()=>f.close());const ceo=f.company.initializeCEO();assert.throws(()=>f.company.computers.request({worker_id:ceo.worker_id,...objective,policy:policy()}),/authority/);
  const r=f.start();await assert.rejects(()=>f.company.computers.callTool({...r.context,workerId:ceo.worker_id},'forged','computer_navigate',{session_id:r.s.session_id,url:origin},new AbortController().signal),/identity/);
  await assert.rejects(()=>call(f,r,'navigate',{session_id:'another',url:origin}),/Cross-session/);assert.equal(f.browser.launches,0);
  await f.company.computers.control({session_id:r.s.session_id,action:'revoke'});await assert.rejects(()=>call(f,r,'navigate',{url:origin}),/revoked/);assert.equal(f.browser.launches,0);
});
test('one computer reservation prevents a second model claim before browser creation',async t=>{
  const f=setup();t.after(()=>f.close());const other=f.company.initializeComputerOperator({display_name:'Other'});const r=f.start();const s=f.company.computers.request({worker_id:other.worker_id,...objective,policy:policy()});f.company.computers.authorize({session_id:s.session_id,policy_hash:s.policy_hash,decision:'approve'});
  assert.equal(f.company.claimNext(),undefined);assert.equal(f.browser.launches,0);await f.company.computers.control({session_id:r.s.session_id,action:'revoke'});
});
test('attributable evidence and call IDs remain bound to their execution',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();await call(f,r,'navigate',{url:origin});const result=await call(f,r,'snapshot',{},'snapshot');assert.ok(result.evidence.evidence_id);
  const row=f.store.get<any>('SELECT * FROM computer_evidence');assert.equal(row.worker_id,f.worker.worker_id);assert.equal(row.task_id,r.task.task_id);assert.equal(row.execution_id,r.execution.execution_id);assert.equal(f.company.computers.evidence(row.evidence_id).length,row.bytes);
  assert.deepEqual(await call(f,r,'snapshot',{},'snapshot'),result);assert.equal(f.company.computers.session(r.s.session_id).screenshots,1);
  await assert.rejects(()=>call(f,r,'navigate',{url:origin},'snapshot'),/payload/);assert.throws(()=>f.company.callTool(r.context,'snapshot','list_company_status',{}),/Computer Use/);
  assert.equal((await call(f,r,'finish')).completed,true);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Synthetic evidence test complete'});assert.equal(f.company.task(r.task.task_id).status,'completed');
});
test('protected mutation has zero effect before approval, frees execution, then sends exactly once',async t=>{
  const f=setup();t.after(()=>f.close());let mutations=0;f.company.computers.forward=async(req,_p,_s,before)=>{before?.();if(req.method==='POST')mutations++;return {status:200,headers:{},body:'e30='};};
  const r=f.start();const intent=await pendingIntent(f,r);assert.equal(mutations,0);
  const decision={intent_id:intent.intent_id,request_hash:intent.request_hash,page_hash:intent.page_hash,decision:'approve'};
  assert.throws(()=>f.company.computers.decide(decision),/settle/);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Awaiting exact fixture approval'});
  assert.equal(f.company.task(r.task.task_id).status,'awaiting_approval');assert.equal(f.company.execution(r.execution.execution_id).status,'awaiting_approval');assert.throws(()=>f.company.retry(r.task.task_id,true),/Computer Tasks/);
  assert.throws(()=>f.company.computers.decide({...decision,request_hash:'changed'}),/changed/);f.company.computers.decide(decision);
  const next=f.company.claimNext();assert.ok(next);f.company.computers.prepare(next.context);const continuation={...r,...next};assert.equal(f.company.computers.session(r.s.session_id).generation,2);
  await assert.rejects(()=>call(f,r,'snapshot'),/authorized/);await call(f,continuation,'execute_approved',{intent_id:intent.intent_id},'effect');assert.equal(mutations,1);
  await call(f,continuation,'execute_approved',{intent_id:intent.intent_id},'effect');assert.equal(mutations,1);assert.equal((await call(f,continuation,'execute_approved',{intent_id:intent.intent_id})).ok,false);assert.equal(mutations,1);
});
test('denial and revocation after an approval wait produce zero effects and stop the browser',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});
  f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'deny'});await f.company.computers.drain(r.execution.execution_id);
  assert.equal(f.company.computers.intent(i.intent_id).state,'denied');assert.ok(f.browser.closed);assert.equal(f.company.claimNext(),undefined);
});
test('unknown transmitted mutation survives model settlement and fences retry, rollover and new sessions',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'approve'});
  const next=f.company.claimNext();assert.ok(next);f.company.computers.prepare(next.context);let effects=0;f.company.computers.forward=async(_r,_p,_s,before)=>{before?.();effects++;throw new Error('Deterministic injected lost response after fixture effect');};
  await call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id});assert.equal(effects,1);assert.equal(f.company.computers.intent(i.intent_id).state,'unknown');assert.equal(f.company.providerUnresolved(f.worker.worker_id),true);assert.throws(()=>f.request(),/Uncertain/);
  f.company.finish(next.execution.execution_id,{status:'completed',summary:'Effect uncertain'});assert.equal(f.company.computers.intent(i.intent_id).state,'unknown');f.company.computers.recover();assert.equal(f.company.computers.intent(i.intent_id).state,'unknown');assert.equal(f.company.claimNext(),undefined);
});
test('restart cancels pre-transmission intent, retains policy/evidence and never restores browser state',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});await f.company.computers.shutdown();
  f.company.computers.recover();assert.equal(f.company.computers.intent(i.intent_id).state,'cancelled');assert.equal(f.company.computers.session(r.s.session_id).policy,r.s.policy);assert.equal(f.browser.launches,1);assert.equal(f.company.claimNext(),undefined);
});
test('request policy blocks malicious page destinations and background requests after the action',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();await call(f,r,'navigate',{url:origin});
  for(const url of ['http://169.254.169.254/','file:///etc/passwd','https://gmail.com/',origin+'/'])assert.equal(await f.browser.network({url,method:'GET',headers:{},body:'',resourceType:'fetch'}),null);
  assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM computer_network_events WHERE disposition='blocked'")!.n,4);
});
test('Computer Use stays private to local owner API projections and device event stream',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();f.company.callTool(r.context,'private','message_worker',{recipient_worker_id:null,body:'PRIVATE BROWSER PAGE'});
  const dto=new ClientDTOs(f.company,'test');assert.equal(dto.page('tasks',new URLSearchParams()).items.length,0);assert.equal(dto.page('messages',new URLSearchParams()).items.length,0);assert.equal(dto.page('executions',new URLSearchParams()).items.length,0);
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM client_events WHERE task_id=?',r.task.task_id)!.n,0);await assert.rejects(()=>call(f,r,'status',{actor:'human'}),/identity-bearing/);
});
test('exhausted action bounds close the environment and stale access remains denied',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start({maxActions:1});await call(f,r,'navigate',{url:origin});await assert.rejects(()=>call(f,r,'snapshot'),/bound/);assert.equal(f.company.computers.session(r.s.session_id).state,'expired');assert.equal(f.browser.closed,1);
});

test('synchronous runtime interruption cannot re-enter browser teardown twice',async t=>{
 const f=setup();t.after(()=>f.close());const r=f.start();await call(f,r,'navigate',{url:origin});
 let interrupted=0;f.company.on('computer_interrupt',()=>{interrupted++;void f.company.computers.stop(r.s.session_id,'interrupted','Reentrant runtime abort');});
 await f.company.computers.stop(r.s.session_id,'failed','Real browser lost');
 assert.equal(interrupted,1);assert.equal(f.browser.closed,1);assert.equal(f.company.computers.session(r.s.session_id).shutdown_confirmed,1);assert.equal(f.company.computers.session(r.s.session_id).state,'failed');
});

test('status reconstruction is bounded and never recursively embeds receipt results',async t=>{
 const f=setup();t.after(()=>f.close());const r=f.start();
 for(let n=0;n<30;n++){const status=await call(f,r,'status');assert.ok(JSON.stringify(status).length<10000);assert.ok(status.prior_operations.every((o:any)=>!Object.hasOwn(o,'result')));}
 assert.ok(f.store.get<{n:number}>('SELECT sum(length(result)) n FROM computer_operations')!.n<300000);
});
test('restart releases prelaunch and already-closed reservations without erasing provider uncertainty',async t=>{
 const f=setup();t.after(()=>f.close());const r=f.start();assert.equal(f.browser.launches,0);f.company.recover();assert.equal(f.company.computers.session(r.s.session_id).active_execution_id,null);assert.equal(f.company.computers.session(r.s.session_id).state,'failed');
 const other=f.company.initializeComputerOperator({display_name:'Replacement'});const s=f.company.computers.request({worker_id:other.worker_id,...objective,policy:policy()});f.company.computers.authorize({session_id:s.session_id,policy_hash:s.policy_hash,decision:'approve'});const next=f.company.claimNext();assert.ok(next);f.company.computers.prepare(next.context);await f.company.computers.callTool(next.context,'close','computer_finish',{session_id:s.session_id},new AbortController().signal);await f.company.computers.stop(s.session_id,'failed','Closed before model settlement');f.company.recover();assert.equal(f.company.computers.session(s.session_id).active_execution_id,null);
});
test('page callbacks cannot redeem an approved intent before the trusted checkpoint passes',async t=>{
 const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Wait'});f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'approve'});const next=f.company.claimNext()!;f.company.computers.prepare(next.context);let effects=0;f.company.computers.forward=async(_r,_p,_s,before)=>{before?.();effects++;return {status:200,headers:{},body:'e30='};};
 f.browser.action=async()=>{assert.equal(await f.browser.network({...JSON.parse(i.request),resourceType:'fetch'}),null);throw new Error('Approved page changed');};
 const outcome=await call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id});assert.equal(outcome.ok,false);assert.equal(effects,0);assert.equal(f.company.computers.intent(i.intent_id).state,'cancelled');
});
test('action failure drains in-flight network callbacks before ownership can be reused',async t=>{
 const f=setup();t.after(()=>f.close());const r=f.start();let release!:()=>void;let started!:()=>void;const networkStarted=new Promise<void>(resolve=>started=resolve);
 f.company.computers.forward=async(_r,_p,_s,before)=>{before?.();started();await new Promise<void>(resolve=>release=resolve);return {status:200,headers:{},body:'e30='};};
 f.browser.action=async()=>{void f.browser.network({url:origin+'/',method:'GET',headers:{},body:'',resourceType:'fetch'});throw new Error('Injected action failure with request outstanding');};
 const action=call(f,r,'navigate',{url:origin});await networkStarted;assert.equal(f.company.computers.hasPending(r.execution.execution_id),true);await assert.rejects(()=>call(f,r,'finish'),/previous browser action/);release();assert.equal((await action).ok,false);assert.equal(f.company.computers.hasPending(r.execution.execution_id),false);
});
test('public browser reads reject credential and control URLs',()=>{
 const p=parseComputerPolicy(policy({origins:['https://www.wikipedia.org'],fixtureOrigins:[],mutationPaths:[]}));
 for(const path of ['/unsubscribe','/admin/users','/read?access_token=secret','/read?signature=secret','/read?action=delete'])assert.throws(()=>computerUrl('https://www.wikipedia.org'+path,p));
});

test('unconfirmed finish cannot report success and owner can recheck delayed broker cleanup',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();await call(f,r,'navigate',{url:origin});let idle=false;
  f.browser.close=async()=>false;f.browser.confirmIdle=async()=>idle;
  const result=await call(f,r,'finish');assert.equal(result.ok,false);assert.match(result.error,/unconfirmed/);assert.notEqual(f.company.computers.session(r.s.session_id).state,'completed');assert.equal(f.company.computers.session(r.s.session_id).shutdown_confirmed,0);
  f.company.finish(r.execution.execution_id,{status:'interrupted',settled:true,error:'Labelled lost cleanup acknowledgement'});
  const other=f.company.initializeComputerOperator({display_name:'After cleanup'}),next=f.company.computers.request({worker_id:other.worker_id,...objective,policy:policy()});f.company.computers.authorize({session_id:next.session_id,policy_hash:next.policy_hash,decision:'approve'});
  await new Promise(r=>setTimeout(r,5200));assert.equal(f.company.claimNext(),undefined);idle=true;
  const checked=await f.company.computers.control({session_id:r.s.session_id,action:'interrupt'});assert.equal(checked.shutdown_confirmed,1);assert.notEqual(checked.state,'completed');assert.ok(f.company.claimNext());
});
test('large durable protected receipts are bounded in status and later approval generations',async t=>{
  const f=setup();t.after(()=>f.close());let effects=0;const body=Buffer.alloc(256*1024,65).toString('base64');
  f.company.computers.forward=async(req,_p,_s,before)=>{before?.();if(req.method==='POST')effects++;return {status:200,headers:{},body};};
  const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'approve'});const next=f.company.claimNext()!;f.company.computers.prepare(next.context);
  const current={...r,...next};await call(f,current,'execute_approved',{intent_id:i.intent_id});assert.equal(effects,1);assert.equal(JSON.parse(f.company.computers.intent(i.intent_id).result!).body,body);
  const status=await call(f,current,'status');assert.notEqual(status.ok,false);assert.ok(Buffer.byteLength(JSON.stringify(status))<16384);assert.equal(status.intents[0].receipt.body_bytes,256*1024);assert.equal(status.intents[0].receipt.body_excerpt.length,2000);
  const second=await pendingIntent(f,current);f.company.finish(next.execution.execution_id,{status:'completed',summary:'Waiting again'});f.company.computers.decide({intent_id:second.intent_id,request_hash:second.request_hash,page_hash:second.page_hash,decision:'approve'});const third=f.company.claimNext()!;const context=f.company.computers.prepare(third.context);assert.ok(Buffer.byteLength(JSON.stringify(context))<16384);const actionable=context.intents.find(x=>x.intent_id===second.intent_id);assert.ok(actionable&&'request' in actionable);assert.equal(actionable.request,second.request);assert.equal(effects,1);
});
test('consumed intent before any transmission is conservatively unknown and cannot replay',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'approve'});const next=f.company.claimNext()!;f.company.computers.prepare(next.context);
  let calls=0;f.company.computers.forward=async(_r,_p,_s,before)=>{calls++;before?.();throw Error('Labelled crash window after durable consumption, before socket transmission');};
  const result=await call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id});assert.equal(result.ok,false);assert.equal(f.company.computers.intent(i.intent_id).state,'unknown');assert.equal(calls,1);await assert.rejects(()=>call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id}));assert.equal(calls,1);
});
test('committed effect receipt survives revocation before worker delivery without becoming unknown',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const i=await pendingIntent(f,r);f.company.finish(r.execution.execution_id,{status:'completed',summary:'Waiting'});f.company.computers.decide({intent_id:i.intent_id,request_hash:i.request_hash,page_hash:i.page_hash,decision:'approve'});const next=f.company.claimNext()!;f.company.computers.prepare(next.context);let effects=0;
  f.company.computers.forward=async(_r,_p,_s,before)=>{before?.();effects++;return {status:200,headers:{},body:'e30='};};const original=f.browser.action.bind(f.browser);f.browser.action=async(...args)=>{if(args[1]==='resume_approved')await f.company.computers.control({session_id:r.s.session_id,action:'revoke'});return original(...args);};
  const result=await call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id});assert.equal(result.ok,false);assert.equal(effects,1);assert.equal(f.company.computers.intent(i.intent_id).state,'completed');assert.equal(JSON.parse(f.company.computers.intent(i.intent_id).result!).status,200);assert.equal(f.company.computers.unknown(),false);await assert.rejects(()=>call(f,{...r,...next},'execute_approved',{intent_id:i.intent_id}),/revoked/);assert.equal(effects,1);
});
test('evidence publication failure consumes its attempt without a fabricated screenshot receipt',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();await call(f,r,'navigate',{url:origin});const {writeFileSync}=await import('node:fs');writeFileSync(join(f.dir,'computer-evidence'),'Deliberately unavailable evidence directory');
  const result=await call(f,r,'snapshot');assert.equal(result.ok,false);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM computer_evidence')!.n,0);assert.equal(f.company.computers.session(r.s.session_id).screenshots,1);assert.equal(f.store.get<{state:string}>("SELECT state FROM computer_operations WHERE tool='computer_snapshot'")!.state,'failed');
});
test('computer provider references cannot cross ordinary Task or direct conversation bindings in either direction',async t=>{
  const f=setup();t.after(()=>f.close());const r=f.start();const atlas=f.company.initializeCEO();f.company.createTask('human',atlas,objective,null,'product');const ordinary=f.company.claimNext()!;assert.ok(ordinary);
  const binding=(worker:typeof atlas,reference:string)=>({worker_id:worker.worker_id,runtime_type:worker.runtime_type,workspace_path:worker.workspace_path,runtime_reference:reference,created_at:new Date().toISOString(),thread_name:'Explicit binding isolation fixture'});
  f.company.setBinding(ordinary.context,binding(atlas,'ordinary-reference'));assert.throws(()=>f.company.computers.bind(r.context,binding(f.worker,'ordinary-reference')),/another work mode/);
  f.company.computers.bind(r.context,binding(f.worker,'computer-reference'));assert.throws(()=>f.company.setBinding(ordinary.context,binding(atlas,'computer-reference')),/computer context/);f.company.finish(ordinary.execution.execution_id,{status:'interrupted',settled:true,error:'Explicit binding-only fixture ended'});
  const c=f.company.conversations.open({worker_id:atlas.worker_id,purpose:'Binding boundary'});f.company.conversations.send({conversation_id:c.conversation_id,body:'Binding test',request_reply:true,receipt_key:randomUUID()});const direct=f.company.claimWorkNext()!;assert.equal(direct.origin,'conversation');
  assert.throws(()=>f.company.conversations.prepareBinding(direct.context,binding(atlas,'computer-reference')),/computer context/);f.company.conversations.prepareBinding(direct.context,binding(atlas,'direct-reference'));assert.throws(()=>f.company.computers.bind(r.context,binding(f.worker,'direct-reference')),/another work mode/);
});
