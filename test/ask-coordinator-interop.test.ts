/** Explicit pinned cross-repository fixture. No operational endpoint, credential or model. */
import test from 'node:test';
import {fixture} from './ask-coordinator-helpers.js';
import {AskCoordinator} from '../src/control/ask/coordinator.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, createPrivateKey, randomUUID, sign } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { request } from 'node:https';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { AskAdmission, AskConversation, AskConversationPage, AskLimits, AskRoster, AskServiceScope, AskSession } from '../contracts/investment/v1/types.js';
import { askOfflineClient } from '../src/control/ask/transport.js';
import { type AskBoundaryContext } from '../src/domain/ask/contract.js';
import { canonicalHash, validate } from '../scripts/investment-contracts/schema.js';

const websiteCommit='6ecd49857a651f9cd2d3f5a6a0802fbe48f099b0';
const sourceTree='69f5de533afa126ae3290af84ed45f253b2fac96b1df9d7d87ee55e11a1fa2f4';
const receiver=process.env.BOTSQUAD_SYNTHETIC_ASK_RECEIVER;
const pins={
 'test/ask-interop-fixture.ts':'fc916b019675981ed6bfd7697e0d049e0b65c8d44a319dc2292a0ee5c9861a4f',
 'package-lock.json':'cf95b07b20cd4c53edf83effd3fe46190fc88453802fe2de0aab66cc3d53656b',
 'vendor/investment/v1/manifest.json':'5396443e475d3fe69825ef8af4e916a408b39452182e9c4828fa17b7faf37a84',
};
interface Manifest {
 synthetic:true; authority:string; origin:string; tlsPort:number; certificatePath:string; privateKeyPath:string;
 scope:AskServiceScope; limits:AskLimits; roster:AskRoster; privacyNoticeVersion:string; expiresAt:string;
}
const digest=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

test('pinned subscription receiver runs full HQ coordinator and shared dispatcher with authored employee output',{
 skip:receiver?false:'Set BOTSQUAD_SYNTHETIC_ASK_RECEIVER to the explicitly pinned built fixture checkout',timeout:120000,
},async t=>{
 const root=realpathSync(resolve(receiver!));
 // The isolated harness extracts the exact Git archive, installs the lock, verifies every
 // source file and clean-builds once. Retain that log plus this executed-artifact inventory.
 const built=JSON.parse(readFileSync(join(root,'fixture-source.json'),'utf8')) as {commit:string;sourceFiles:Record<string,string>;builtFrom:string;builtFiles:Record<string,string>};
 assert.equal(built.commit,websiteCommit);assert.equal(canonicalHash(built.sourceFiles),sourceTree);assert.equal(built.builtFrom,sourceTree);
 for(const [path,expected] of Object.entries(built.sourceFiles))assert.equal(digest(join(root,path)),expected,`Source ${path}`);
 assert.ok(built.builtFiles['dist/test/ask-interop-fixture.js']);
 for(const [path,expected] of Object.entries(built.builtFiles)){
  assert.ok(path.startsWith('dist/')&&!path.split('/').includes('..'));assert.equal(digest(join(root,path)),expected,`Built ${path}`);
 }
 for(const [path,expected] of Object.entries(pins))assert.equal(digest(join(root,path)),expected,`Pinned fixture ${path}`);
 const child=spawn(process.execPath,[join(root,'dist/test/ask-interop-fixture.js'),'--start-synthetic-subscription-interop'],{
  cwd:root,env:{PATH:process.env.PATH,TMPDIR:tmpdir()},stdio:['ignore','pipe','pipe'],
 });
 // close also follows a spawn error; exit alone does not. Every shutdown wait is bounded.
 const exited=new Promise<{code:number|null;signal:NodeJS.Signals|null}>(done=>child.once('close',(code,signal)=>done({code,signal})));
 let fixtureRoot:string|undefined,port:number|undefined;
 t.after(async()=>{
  child.kill('SIGTERM');
  let timer:ReturnType<typeof setTimeout>|undefined;
  const outcome=await Promise.race([exited,new Promise<null>(done=>{timer=setTimeout(()=>done(null),5000);})]);
  clearTimeout(timer);
  if(outcome===null){
   child.kill('SIGKILL');await Promise.race([exited,new Promise<null>(done=>{timer=setTimeout(()=>done(null),2000);})]);clearTimeout(timer);
   child.unref();child.stdout.destroy();child.stderr.destroy();assert.fail('Fixture did not cleanly stop; inspect private temporary custody');
  }
  assert.equal(outcome.code,0,'Fixture shutdown failed');assert.equal(outcome.signal,null);
  if(fixtureRoot)assert.equal(existsSync(fixtureRoot),false,'Fixture private tree must be removed');
  if(port)await new Promise<void>((done,reject)=>{
   const socket=connect(port!,'127.0.0.1');socket.setTimeout(2000,()=>{socket.destroy();reject(Error('Listener cleanup check timed out'));});
   socket.once('connect',()=>{socket.destroy();reject(Error('Fixture listener remained open'));});
   socket.once('error',error=>{socket.destroy();if((error as NodeJS.ErrnoException).code==='ECONNREFUSED')done();else reject(Error('Listener cleanup could not be verified'));});
  });
 });
 const startup=await new Promise<{synthetic:boolean;manifestPath:string}>((done,reject)=>{
  let text='';const timeout=setTimeout(()=>reject(Error('Fixture startup timed out')),15000);
  const fail=()=>{clearTimeout(timeout);reject(Error('Fixture exited before readiness'));};child.once('error',fail);child.once('exit',fail);
  child.stderr.resume();
  child.stdout.on('data',(chunk:Buffer)=>{
   text+=chunk.toString('utf8');if(text.length>8192){clearTimeout(timeout);reject(Error('Unexpected fixture startup output'));return;}
   if(!text.includes('\n'))return;
   clearTimeout(timeout);child.off('error',fail);child.off('exit',fail);
   try{done(JSON.parse(text.split('\n')[0]!));}catch{reject(Error('Invalid fixture readiness'));}
  });
 });
 assert.equal(startup.synthetic,true);fixtureRoot=dirname(realpathSync(startup.manifestPath));
 assert.equal(dirname(fixtureRoot),realpathSync(tmpdir()));assert.ok(fixtureRoot.split('/').at(-1)!.startsWith('asymmetri-ask-interop-'));
 assert.equal(statSync(fixtureRoot).mode&0o777,0o700);assert.equal(statSync(startup.manifestPath).mode&0o777,0o600);
 const manifest=JSON.parse(readFileSync(startup.manifestPath,'utf8')) as Manifest;
 assert.equal(manifest.synthetic,true);assert.equal(manifest.authority,'asymmetri.co');assert.equal(manifest.origin,'https://asymmetri.co');
 assert.equal(manifest.scope.serviceId,'fixture-ask');assert.equal(manifest.scope.keyId,'fixture-ask-key');assert.equal(manifest.scope.consumerGeneration,'1');
 assert.ok(Number.isInteger(manifest.tlsPort)&&manifest.tlsPort>0&&manifest.tlsPort<=65535);port=manifest.tlsPort;
 for(const path of [manifest.certificatePath,manifest.privateKeyPath]){
  assert.equal(dirname(realpathSync(path)),fixtureRoot);assert.equal(statSync(path).mode&0o777,0o600);
 }
 const certificate=readFileSync(manifest.certificatePath),key=createPrivateKey(readFileSync(manifest.privateKeyPath));
 const current=():AskBoundaryContext=>({scope:manifest.scope,limits:manifest.limits,now:new Date().toISOString()});
 const counts:Record<string,number>={};
 const f=fixture(false,{config:{scope:manifest.scope,limits:manifest.limits,roster:manifest.roster},now:()=>new Date().toISOString(),skipDrain:true});
 t.after(f.close);
 let lostAnswer=false;
 const coordinator=new AskCoordinator(f.db,{current,approved:f.config,authority:f.journal,controls:f.controls,content:f.content,service:f.service,
  keys:{has:(id)=>id===manifest.scope.keyId,sign:(_id,bytes)=>sign(null,bytes,key)},assertRuntimeAvailable:()=>{},maxAttempts:60,expiresAt:manifest.expiresAt,privacyNoticeVersion:manifest.privacyNoticeVersion},
 {offline:true,create:options=>{const transport=askOfflineClient(options,(o,callback)=>{
  assert.equal(o.hostname,'asymmetri.co');assert.equal(o.servername,'asymmetri.co');assert.equal(o.rejectUnauthorized,true);
  assert.equal((o.headers as Record<string,string>).host,'asymmetri.co');
  return request({...o,hostname:'127.0.0.1',port:manifest.tlsPort,ca:certificate},callback);
 });return{exchange:async(operation,intent,signal)=>{
  counts[operation.kind]=(counts[operation.kind]??0)+1;
  const result=await transport.exchange(operation,intent,signal);
  // Receiver really accepts the first answer; hide only its returned acknowledgment.
  if(operation.kind==='answer'&&!lostAnswer&&result.kind==='response'&&result.response.kind==='data'){lostAnswer=true;return{kind:'unknown',code:'network',status:null};}
  return result;
 }};}});
 f.company.askCoordinator=coordinator;f.gate(p=>coordinator.configuration(p));
 async function until(predicate:()=>boolean,reason:string,ms=75000){const deadline=Date.now()+ms;while(!predicate()&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));assert.ok(predicate(),reason+': '+JSON.stringify(f.db.all('SELECT hold_reason FROM ask_coordination')));}
 f.dispatcher.start();
 await until(()=>!!f.controls.barrier(),'Real signed initial privacy drain');
 let cookie='',csrf='';
 async function visitor<T>(method:string,path:string,schema:string|undefined,body?:unknown,expected=200):Promise<T>{
  counts.visitor=(counts.visitor??0)+1;
  const bytes=body===undefined?null:Buffer.from(JSON.stringify(body));
  const headers:Record<string,string>={host:'asymmetri.co',origin:manifest.origin,connection:'close'};
  if(cookie)headers.cookie=cookie;if(csrf)headers['x-csrf-token']=csrf;
  if(method!=='GET')headers['idempotency-key']=randomUUID();
  if(bytes){headers['content-type']='application/json';headers['content-length']=String(bytes.length);}
  return new Promise<T>((done,reject)=>{
   const req=request({hostname:'127.0.0.1',port:manifest.tlsPort,servername:'asymmetri.co',rejectUnauthorized:true,ca:certificate,
    method,path,headers,agent:false,timeout:10000},res=>{
    const parts:Buffer[]=[];let size=0;
    res.on('data',(part:Buffer)=>{size+=part.length;if(size>262144){req.destroy(Error('Fixture response too large'));return;}parts.push(part);});
    res.once('error',reject);res.once('end',()=>{
     try{
      assert.equal(res.statusCode,expected,`Visitor ${method} ${path}`);assert.ok(res.complete);
      const value=JSON.parse(Buffer.concat(parts).toString('utf8'));
      if(path==='/api/ask/v1/sessions'&&expected===201){
       const raw=res.headers['set-cookie'];assert.equal(raw?.length,1);assert.ok(/HttpOnly/i.test(raw![0]!), 'Fixture cookie is HttpOnly');assert.ok(/Secure/i.test(raw![0]!), 'Fixture cookie is Secure');assert.ok(/SameSite=Strict/i.test(raw![0]!), 'Fixture cookie is same-site strict');
       cookie=raw![0]!.split(';')[0]!;
      }
      done(schema?validate<T>(schema,value):value as T);
     }catch(error){reject(error);}
    });
   });req.once('error',reject);req.once('timeout',()=>req.destroy(Error('Fixture browser timeout')));req.end(bytes??undefined);
  });
 }
 const session=await visitor<AskSession>('POST','/api/ask/v1/sessions','AskSession',{schemaVersion:'1.0',privacyNoticeVersion:manifest.privacyNoticeVersion},201);csrf=session.csrfToken;
 const conversation=await visitor<AskConversation>('POST','/api/ask/v1/conversations','AskConversation',{schemaVersion:'1.0'},201);
 const conversationPath=`/api/ask/v1/conversations/${conversation.conversationId}`;
 const admission=await visitor<AskAdmission>('POST',`${conversationPath}/questions`,'AskAdmission',{
  schemaVersion:'1.0',text:'SYNTHETIC compatibility question. No visitor or model is involved.',context:null,priorQuestionId:null,language:'en',
 },202);
 await until(()=>!!f.db.get("SELECT 1 FROM ask_imports WHERE question_id=? AND state='delivered'",admission.questionId),'Signed coordinator delivery and lost-response reconciliation');
 const owned=await visitor<AskConversationPage>('GET',conversationPath,'AskConversationPage');
 assert.equal(owned.turns.length,1);assert.equal(owned.turns[0]!.answer?.text,'Authored private answer');assert.equal(owned.turns[0]!.answer?.workerId,'fixture-author');
 assert.equal(f.calls.length,1);assert.equal(f.calls[0]!.worker.worker_id,f.worker.worker_id);assert.equal(f.calls[0]!.execution.origin,'public_question');
 assert.equal(counts.answer,1);assert.equal(counts.receipt,1);assert.ok(lostAnswer);
 assert.equal(f.journal.inspect().models[0]?.state,'settled');assert.equal(f.journal.inspect().models[0]?.receipt?.chargeMicros,null);
 assert.equal(f.company.aiUsage.records()[0]?.completeness,'complete');assert.equal(f.company.aiUsage.records()[0]?.actualSubscriptionCharges,'unavailable');
 assert.equal(f.journal.inspect().models.length,1);assert.equal(f.db.get<{n:number}>("SELECT count(*) n FROM executions WHERE origin='public_question'")!.n,1);
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
 await visitor('DELETE',conversationPath,'AskControlReceipt');await visitor('GET',conversationPath,'Problem',undefined,404);
 await until(()=>f.controls.suppressed(conversation.conversationId,admission.questionId)&&!!f.controls.barrier(),'Signed deletion acknowledgment and empty final barrier');
 assert.equal(f.content.metadata(admission.questionId).state,'suppressed');
 await f.dispatcher.stop();
 assert.equal(f.company.paused,false);
 assert.ok(f.journal.inspect().wires.every(w=>w.state==='reconciled'));
 t.diagnostic(JSON.stringify({synthetic:true,websiteCommit,counts,employeeExecutions:f.calls.length,modelCalls:0,realSignedReceiver:true,sharedDispatcher:true,unknownCostPreserved:true,contentPurgeVerified:false,restorationVerified:false}));
});
