/** Explicit pinned cross-repository fixture. No operational endpoint, credential or model. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, createPrivateKey, randomUUID, sign } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { request } from 'node:https';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { AskAdmission, AskAnswer, AskConversation, AskConversationPage, AskLimits, AskServiceScope, AskSession } from '../contracts/investment/v1/types.js';
import { Store } from '../src/persistence/store.js';
import { AskControlJournal } from '../src/control/ask/control-journal.js';
import { askOfflineClient } from '../src/control/ask/transport.js';
import { askReceiptIdentity, prepareAskRequest, type AskBoundaryContext, type AskKind, type AskOperation } from '../src/domain/ask/contract.js';
import { canonicalHash, validate } from '../scripts/investment-contracts/schema.js';

const websiteCommit='d1ddbe679c05314158310183518afaaaedd8ae00';
const sourceTree='8e91367bcbb6d559a1cf5832d9e48ad0ac28e52dcfe1d38a7e9c2b3c5d45df02';
const receiver=process.env.BOTSQUAD_SYNTHETIC_ASK_RECEIVER;
const pins={
 'test/ask-interop-fixture.ts':'8a1808ab8b15190c4cfa17b3c36231dbb18ef5ba9a059b3dba76cbee828ff1ce',
 'package-lock.json':'cf95b07b20cd4c53edf83effd3fe46190fc88453802fe2de0aab66cc3d53656b',
 'vendor/investment/v1/manifest.json':'7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31',
};
interface Manifest {
 synthetic:true; authority:string; origin:string; tlsPort:number; certificatePath:string; privateKeyPath:string;
 scope:AskServiceScope; limits:AskLimits; privacyNoticeVersion:string; expiresAt:string;
}
const digest=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

test('pinned synthetic receiver interoperates with typed HQ HTTPS and durable suppression journal',{
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
 const child=spawn(process.execPath,[join(root,'dist/test/ask-interop-fixture.js'),'--start-synthetic-interop'],{
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
 const client=askOfflineClient({current,keys:{
  has:(id,at)=>id===manifest.scope.keyId&&at<Math.floor(Date.parse(manifest.expiresAt)/1000),
  sign:(id,bytes)=>{assert.equal(id,manifest.scope.keyId);return sign(null,bytes,key);},
 }},(options,callback)=>{
  assert.equal(options.protocol,'https:');assert.equal(options.hostname,'asymmetri.co');assert.equal(options.port,443);
  assert.equal(options.servername,'asymmetri.co');assert.equal(options.rejectUnauthorized,true);
  assert.equal((options.headers as Record<string,string>).host,'asymmetri.co');
  return request({...options,hostname:'127.0.0.1',port:manifest.tlsPort,ca:certificate},callback);
 });
 async function exchange<K extends AskKind>(op:Extract<AskOperation,{kind:K}>,intent=prepareAskRequest(op,current())){
  counts[op.kind]=(counts[op.kind]??0)+1;
  const result=await client.exchange(op,intent,new AbortController().signal);
  assert.equal(result.kind,'response',`${op.kind}: ${'code' in result?result.code:'response'}`);
  if(result.kind!=='response')throw Error('No typed response');
  assert.equal(result.response.kind,'data',`${op.kind}: ${result.response.kind==='problem'?result.response.code:'data'}`);
  if(result.response.kind!=='data')throw Error('No typed data');return result.response.value;
 }
 const local=mkdtempSync(join(tmpdir(),'botsquad-ask-interop-journal-')),db=new Store(join(local,'company.sqlite'));
 t.after(()=>{db.close();rmSync(local,{recursive:true,force:true});});const journal=new AskControlJournal(db,current);
 async function drain(){
  for(let pages=0;pages<10;pages++){
   const {operation,prepared}=journal.prepareSync();const value=await exchange<'control_sync'>(operation,prepared);
   journal.acceptPage(operation.input.syncId,value);const barrier=journal.barrier();
   if(barrier){assert.equal(barrier.contentPurgeVerified,false);assert.equal(barrier.restorationVerified,false);return barrier;}
  }
  throw Error('Synthetic control traversal exceeded bounded pages');
 }
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
 await drain();
 const session=await visitor<AskSession>('POST','/api/ask/v1/sessions','AskSession',{schemaVersion:'1.0',privacyNoticeVersion:manifest.privacyNoticeVersion},201);csrf=session.csrfToken;
 const conversation=await visitor<AskConversation>('POST','/api/ask/v1/conversations','AskConversation',{schemaVersion:'1.0'},201);
 const conversationPath=`/api/ask/v1/conversations/${conversation.conversationId}`;
 const admission=await visitor<AskAdmission>('POST',`${conversationPath}/questions`,'AskAdmission',{
  schemaVersion:'1.0',text:'SYNTHETIC compatibility question. No visitor or model is involved.',context:null,priorQuestionId:null,language:'en',
 },202);
 const page=await exchange<'claim'>({kind:'claim',input:{schemaVersion:'1.0',serviceId:manifest.scope.serviceId,consumerGeneration:'1',capacity:1,claimRequestId:randomUUID()}});
 assert.ok(page.claim);let claim=page.claim;assert.equal(claim.question.questionHash,admission.questionHash);assert.equal(claim.question.questionId,admission.questionId);
 claim=await exchange<'renew'>({kind:'renew',requestId:randomUUID(),claim,input:{schemaVersion:'1.0',serviceId:manifest.scope.serviceId,consumerGeneration:'1',questionId:admission.questionId,questionHash:admission.questionHash}});
 assert.ok(Date.parse(claim.leaseExpiresAt)<=Date.now()+90000);
 const barrier=await drain();
 const status=await exchange<'status'>({kind:'status',requestId:randomUUID(),claim,input:{schemaVersion:'1.0',claimId:claim.claimId,consumerGeneration:'1',lastControlSyncId:barrier.syncId,status:{
  schemaVersion:'1.0',questionId:admission.questionId,questionHash:admission.questionHash,state:'answering',updatedAt:new Date().toISOString(),safeReason:null,
  route:{workerId:'fixture-author',reason:'generalist',explanation:'Synthetic compatibility fixture; no employee executed.',routingPolicyVersion:'fixture-routing-1',previousWorkerId:null},
 }}});assert.equal(status.state,'answering');
 const answer:AskAnswer={schemaVersion:'1.0',serviceId:manifest.scope.serviceId,answerId:randomUUID(),conversationId:conversation.conversationId,questionId:admission.questionId,questionRevision:1,
  questionHash:admission.questionHash,workerId:'fixture-author',routingPolicyVersion:'fixture-routing-1',generatedAt:new Date().toISOString(),text:'SYNTHETIC authored answer. No model ran.',
  evidence:[],knowledgeAsOf:null,limitations:['No real employee execution or market data.'],interpretation:'general_answer',publicSources:[]};
 const delivery={schemaVersion:'1.0' as const,claimId:claim.claimId,consumerGeneration:'1',lastControlSyncId:barrier.syncId,answer};
 const receipt=await exchange<'answer'>({kind:'answer',requestId:randomUUID(),claim,input:delivery});assert.equal(receipt.disposition,'accepted');
 const retry=await exchange<'answer'>({kind:'answer',requestId:randomUUID(),claim,input:delivery});assert.deepEqual(retry,receipt);
 assert.deepEqual(await exchange<'receipt'>({kind:'receipt',identity:askReceiptIdentity(answer)}),receipt);
 const owned=await visitor<AskConversationPage>('GET',conversationPath,'AskConversationPage');assert.equal(owned.turns.length,1);assert.deepEqual(owned.turns[0]!.answer,answer);
 await visitor('DELETE',conversationPath,'AskControlReceipt');await visitor('GET',conversationPath,'Problem',undefined,404);
 await drain();assert.equal(journal.suppressed(conversation.conversationId,admission.questionId),true);assert.equal(journal.controls().length,1);assert.equal(journal.controls()[0]!.action,'delete');
 assert.equal(db.get<{n:number}>('SELECT count(*) n FROM executions')!.n,0);
 assert.equal(db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
 t.diagnostic(JSON.stringify({synthetic:true,websiteCommit,counts,controls:journal.controls().length,modelCalls:0,contentPurgeVerified:false,restorationVerified:false}));
});
