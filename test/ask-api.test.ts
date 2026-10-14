/** Disposable HTTPS oracle only. No real account, inference, employee answer or spending. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,realpathSync,readFileSync,writeFileSync,rmSync,chmodSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer,request,type RequestOptions} from 'node:https';
import {createSecureContext} from 'node:tls';
import type {IncomingMessage} from 'node:http';
import {performance} from 'node:perf_hooks';
import {OpenAiAskRuntime,askApiAccountDigest} from '../src/runtime/openai-ask.js';
import {ASK_API_POLICY as p,ASK_API_DIGESTS,askSubmitTool,apiCharge} from '../src/domain/ask/api-policy.js';
import {canonicalHash as hash} from '../scripts/investment-contracts/schema.js';
import {admission,type AskGrant} from '../src/domain/ask/authority.js';
import type {AskRuntimeInput} from '../src/domain/ask/execution.js';
import type {UsageObservation} from '../src/domain/usage/tokens.js';
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
test('pinned Ask API uses one verified TLS request and retains failure accounting',async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'ask-api-')));t.after(()=>rmSync(root,{recursive:true,force:true}));
 execFileSync('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(root,'tls.key'),'-out',join(root,'tls.crt'),'-days','1','-subj','/CN=api.openai.com','-addext','subjectAltName=DNS:api.openai.com'],{stdio:'ignore',timeout:10000});
 const cert=readFileSync(join(root,'tls.crt')),key=readFileSync(join(root,'tls.key')),secure=createSecureContext({key,cert});
 const credentialFile=join(root,'api-key');writeFileSync(credentialFile,'sk-authored-only-12345678901234567890',{mode:0o600});
 const accountDigest=askApiAccountDigest(credentialFile);let held:((e:null,context:typeof secure)=>void)|undefined,hold=false;
 let requestIdentity=true,status=200,reply:Record<string,unknown>,requests:Record<string,unknown>[]=[];
 const server=createServer({key,cert,SNICallback:(_name,callback)=>{if(hold)held=callback;else callback(null,secure);}},async(req,res)=>{
  const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(chunk);requests.push(JSON.parse(Buffer.concat(chunks).toString()));
  res.writeHead(status,{'content-type':'application/json',...(requestIdentity?{'x-request-id':'req_authored'}:{})});res.end(JSON.stringify(reply));
 });
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise<void>(r=>server.close(()=>r())));
 const port=(server.address() as {port:number}).port;
 class OfflineApi extends OpenAiAskRuntime {
  trust=true;wrongHost=false;
  protected override openRequest(options:RequestOptions,callback:(response:IncomingMessage)=>void){
   assert.equal(options.hostname,'api.openai.com');assert.equal(options.path,'/v1/responses');assert.equal(options.method,'POST');
   return request({...options,hostname:'127.0.0.1',port,servername:this.wrongHost?'wrong.invalid':'api.openai.com',...(this.trust?{ca:cert}:{})},callback);
  }
 }
 function fixture(){
  requestIdentity=true;status=200;hold=false;held=undefined;requests=[];chmodSync(credentialFile,0o600);writeFileSync(credentialFile,'sk-authored-only-12345678901234567890');
  reply={object:'response',id:'resp_authored',model:p.model,service_tier:'default',status:'completed',usage:{input_tokens:2000,input_tokens_details:{cached_tokens:0},output_tokens:400,output_tokens_details:{reasoning_tokens:0},total_tokens:2400},
   output:[{type:'function_call',status:'completed',name:'ask_submit_answer',call_id:'call_authored',arguments:JSON.stringify({text:'Authored oracle',interpretation:'general_answer',evidence:[],publicSources:[],limitations:['Fixture only']})}]};
  let allowed=true,ready=true,sends=0,answers=0;const observations:UsageObservation[]=[];
  const now=new Date().toISOString(),deadline=new Date(Date.now()+10000).toISOString(),context={question:{text:'private visitor test canary'},history:[]};
  const g:AskGrant={id:'grant',hqId:'hq',serviceId:'ask',generation:'1',scopeDigest:hash('scope'),limitsDigest:hash('limits'),rosterDigest:hash('roster'),workerIds:['employee'],
   ...ASK_API_DIGESTS,adapterId:p.adapterId,model:p.model,accountDigest,approvalDigest:hash('authored'),approvedAt:now,expiresAt:deadline,maxExecutions:15,dailyExecutions:15,
   maxInputTokens:p.maxInputTokens,maxOutputTokens:p.maxOutputTokens,totalTokens:6046080,dailyTokens:6046080,maxDurationMs:10000,maxChargeMicros:p.maxChargeMicros,totalChargeMicros:'5000000',dailyChargeMicros:'5000000',monetaryMode:'verified_cap',routerExecutions:0,researchCalls:0};
  const r={id:'execution',grantId:g.id,serviceId:g.serviceId,generation:'1',questionId:'question',questionHash:hash('question'),conversationId:'visitor',workerId:'employee',workerSessionId:'fresh-public',providerGeneration:1,contextDigest:hash(context),claimDigest:hash('claim'),requestDigest:hash('question'),reservedAt:now,deadline,questionExpiresAt:deadline};
  const input:AskRuntimeInput={mode:'public_question',worker:{} as AskRuntimeInput['worker'],execution:{execution_id:'execution'} as AskRuntimeInput['execution'],grant:g,reservation:r,context,tools:[askSubmitTool()],localDeadline:deadline,
   authorize(){assert.ok(allowed);},admit(proof){admission(proof,g,r,new Date().toISOString());},beforeTransmit(proof){assert.ok(allowed);admission(proof,g,r,new Date().toISOString());sends++;},
   bind(){},configured(c){assert.equal(c.runtime_adapter,p.adapterId);},event(){},usage(e){observations.push(e);},callTool(){assert.ok(allowed);answers++;return{accepted:true};}};
  const api=new OfflineApi({credentialFile,accountDigest,assertReady(){assert.ok(ready);}});
  return{api,input,observations,get sends(){return sends;},get answers(){return answers;},deny(){allowed=false;},disable(){ready=false;},run(signal=new AbortController().signal){return api.runAsk(input,signal);}};
 }
 await t.test('fixed stateless body, correct measured cost and no key in context',async()=>{
  const f=fixture(),r=await f.run();assert.equal(r.status,'completed');assert.equal(r.apiUsage?.chargeMicros,'3300');assert.equal(f.answers,1);assert.equal(f.sends,1);assert.equal(requests.length,1);
  const body=requests[0]!;assert.equal(body.store,false);assert.equal(body.truncation,'disabled');assert.equal(body.service_tier,'default');assert.equal(body.max_output_tokens,3072);assert.equal(body.parallel_tool_calls,false);
  assert.equal(JSON.stringify(body).includes('sk-authored'),false);assert.equal(body.previous_response_id,undefined);assert.equal(body.conversation,undefined);
  assert.equal(f.observations.filter(o=>o.kind==='response').length,1);assert.equal(r.apiUsage?.requestId,'req_authored');
 });
 for(const terminal of ['incomplete','failed'])await t.test(`billable ${terminal} settles without an answer`,async()=>{const f=fixture();reply.status=terminal;reply.output=[];const r=await f.run();assert.equal(r.settled,true);assert.equal(r.status,'failed');assert.equal(r.apiUsage?.chargeMicros,'3300');assert.equal(f.answers,0);assert.equal(r.providerTurnCompleted,undefined);});
 for(const defect of ['missing-usage','cache-write','extra-price','missing-request-identity','missing-request-header','wrong-model','multiple-tools'])await t.test(`${defect} never delivers an answer or retries`,async()=>{
  const f=fixture();if(defect==='missing-usage')delete reply.usage;
  if(defect==='cache-write')((reply.usage as Record<string,unknown>).input_tokens_details as Record<string,unknown>).cache_write_tokens=2;
  if(defect==='extra-price')((reply.usage as Record<string,unknown>).output_tokens_details as Record<string,unknown>).audio_tokens=1;
  if(defect==='missing-request-identity')reply.id='invalid';
  if(defect==='missing-request-header')requestIdentity=false;
  if(defect==='wrong-model')reply.model='other';
  if(defect==='multiple-tools')(reply.output as unknown[]).push((reply.output as unknown[])[0]);
  const r=await f.run();assert.equal(r.status,'failed');assert.equal(f.answers,0);assert.equal(requests.length,1);
  assert.equal(r.settled,defect==='multiple-tools');assert.equal(!!r.apiUsage,defect==='multiple-tools');
 });
 for(const fail of ['untrusted','hostname'])await t.test(`${fail} TLS sends no HTTP bytes`,async()=>{const f=fixture();f.api.trust=fail!=='untrusted';f.api.wrongHost=fail==='hostname';const r=await f.run();assert.equal(r.settled,true);assert.equal(f.sends,0);assert.equal(requests.length,0);});
 for(const change of ['authority','backend','credential'])await t.test(`${change} revoked during TLS sends no HTTP bytes`,async()=>{
  const f=fixture();hold=true;const result=f.run();for(let n=0;!held&&n<200;n++)await sleep(5);assert.ok(held);
  if(change==='authority')f.deny();if(change==='backend')f.disable();if(change==='credential')writeFileSync(credentialFile,'sk-changed-authored-12345678901234567890');
  held(null,secure);const r=await result;assert.equal(r.settled,true);assert.equal(f.sends,0);assert.equal(requests.length,0);
 });
 await t.test('deadline crossing inside durable custody sends zero HTTP bytes and retains uncertainty',async()=>{
  const f=fixture();f.input.reservation.deadline=f.input.localDeadline=new Date(Date.now()+180).toISOString();f.input.reservation.questionExpiresAt=f.input.localDeadline;
  const before=f.input.beforeTransmit;f.input.beforeTransmit=proof=>{before(proof);const end=performance.now()+250;while(performance.now()<end){/* authored fsync delay */}};
  const r=await f.run();assert.equal(f.sends,1);assert.equal(requests.length,0);assert.equal(r.settled,false);
 });
 await t.test('proof horizon crossing inside custody stops bytes before later execution deadline',async()=>{
  const f=fixture(),actualNow=Date.now;f.input.reservation.deadline=f.input.localDeadline=new Date(actualNow()+120000).toISOString();f.input.reservation.questionExpiresAt=f.input.localDeadline;f.input.grant.expiresAt=f.input.localDeadline;f.input.grant.maxDurationMs=120000;
  const before=f.input.beforeTransmit;f.input.beforeTransmit=proof=>{before(proof);Date.now=()=>Date.parse(proof.expiresAt)+1;};
  try{const r=await f.run();assert.equal(f.sends,1);assert.equal(requests.length,0);assert.equal(r.settled,false);}finally{Date.now=actualNow;}
 });
 await t.test('401 stops later attempts even if caller requests another run',async()=>{const f=fixture();status=401;const first=await f.run();assert.equal(first.settled,false);await f.run();assert.equal(requests.length,1);});
 await t.test('altered tool schema fails before connection',async()=>{const f=fixture();f.input.tools[0]!.inputSchema={type:'object'};await f.run();assert.equal(f.sends,0);assert.equal(requests.length,0);});
 await t.test('credential with public read permissions is unavailable',async()=>{const f=fixture();chmodSync(credentialFile,0o644);await f.run();assert.equal(f.sends,0);assert.equal(requests.length,0);});
 assert.equal(apiCharge({inputTokens:1,cachedInputTokens:1,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:1}),'1');
});
