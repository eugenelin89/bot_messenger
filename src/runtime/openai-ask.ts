/** Ask-only, stateless, single-attempt Responses client. Never used for investing. */
import {randomUUID,createHash} from 'node:crypto';
import {constants,openSync,closeSync,fstatSync,lstatSync,readFileSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,resolve} from 'node:path';
import {request,type RequestOptions} from 'node:https';
import type {IncomingMessage} from 'node:http';
import {TLSSocket} from 'node:tls';
import {performance} from 'node:perf_hooks';
import {canonicalHash as hash,canonicalJson as json,parseJson,requireContract as need} from '../../scripts/investment-contracts/schema.js';
import {ASK_API_POLICY as policy,ASK_API_DIGESTS,ASK_API_INSTRUCTIONS,askSubmitTool,apiCharge,checkApiUsage,type AskApiUsage} from '../domain/ask/api-policy.js';
import type {AskRuntimeInput} from '../domain/ask/execution.js';
import type {AskAdmissionProof} from '../domain/ask/authority.js';
import {normalizeTokens} from '../domain/usage/tokens.js';
import type {AskRuntimeAdapter,AskRuntimeResult} from './adapter.js';

/** Reads only an owner-private, non-symlink file under non-writable ancestors. */
export function readAskProtectedFile(path:string,maxBytes=262144):string {
 need(isAbsolute(path)&&resolve(path)===path&&realpathSync(path)===path,'FORBIDDEN');
 for(let p=dirname(path);;p=dirname(p)){
  const s=lstatSync(p);need(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(p)===p
   &&(s.uid===0||s.uid===process.getuid?.())&&((s.mode&0o022)===0||s.uid===0&&(s.mode&0o1000)!==0),'FORBIDDEN');
  if(p===dirname(p))break;
 }
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const s=fstatSync(fd);need(s.isFile()&&s.nlink===1&&s.uid===process.getuid?.()&&(s.mode&0o077)===0&&s.size<=maxBytes,'FORBIDDEN');return readFileSync(fd,'utf8');}
 finally{closeSync(fd);}
}
function key(path:string):string {const value=readAskProtectedFile(path,4096).trim();need(/^sk-[A-Za-z0-9_-]{20,4000}$/.test(value),'FORBIDDEN');return value;}
export function askApiAccountDigest(path:string):string {return hash({provider:'openai-api',credentialSha256:createHash('sha256').update(key(path)).digest('hex')});}
export interface AskApiOptions {
 credentialFile:string;accountDigest:string;
 /** Operational control rechecks explicit grant, expiration and durable pause. */
 assertReady():void;
}
interface Reply {status:number;requestId:string;body:Buffer}

export class OpenAiAskRuntime implements AskRuntimeAdapter {
 private denied=false;
 constructor(private readonly options:AskApiOptions){}
 assertAskAvailable():void {
  need(!this.denied,'FORBIDDEN');this.options.assertReady();
  need(askApiAccountDigest(this.options.credentialFile)===this.options.accountDigest,'FORBIDDEN');
 }
 protected openRequest(options:RequestOptions,callback:(response:IncomingMessage)=>void){return request(options,callback);}
 /** Tests may subclass the wire boundary. Operational composition always uses this concrete class. */
 protected transmit(body:string,credential:string,executionId:string,signal:AbortSignal,beforeWire:()=>void,deadline:string):Promise<Reply> {
  const absolute=Date.parse(deadline),monotonic=performance.now()+Math.max(0,absolute-Date.now());
  return new Promise((resolve,reject)=>{
   let req:ReturnType<typeof request>|undefined;
   try{
    // Connect without flushing headers/body. Recheck at the verified TLS boundary.
    signal.throwIfAborted();
    req=this.openRequest({protocol:'https:',hostname:'api.openai.com',port:443,path:'/v1/responses',method:'POST',agent:false,signal,rejectUnauthorized:true,
     headers:{authorization:`Bearer ${credential}`,'content-type':'application/json','content-length':Buffer.byteLength(body),'x-client-request-id':executionId,'user-agent':'BotSquad-Ask/1'}},res=>{
      const chunks:Buffer[]=[];let size=0;
      res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>1048576){res.destroy();req?.destroy(new Error('Response too large'));}else chunks.push(chunk);});
      res.on('error',reject);res.on('aborted',()=>reject(new Error('Response incomplete')));
      res.on('end',()=>{if(!res.complete)return reject(new Error('Response incomplete'));
       const id=res.headers['x-request-id'];resolve({status:res.statusCode??0,requestId:typeof id==='string'?id:'',body:Buffer.concat(chunks)});});
     });
    req.on('error',reject);
    req.once('socket',socket=>{
     const send=()=>{try{
      need(socket instanceof TLSSocket&&socket.authorized&&!socket.destroyed,'FORBIDDEN');
      signal.throwIfAborted();beforeWire();signal.throwIfAborted();
      need(Date.now()<absolute&&performance.now()<monotonic,'EXPIRED');req!.end(body);
     }catch(error){req!.destroy();reject(error);}};
     if(socket instanceof TLSSocket&&!socket.connecting&&socket.authorized)send();else socket.once('secureConnect',send);
    });
   }catch(error){req?.destroy();reject(error);}
  });
 }
 async runAsk(input:AskRuntimeInput,signal:AbortSignal):Promise<AskRuntimeResult> {
  let transmitted=false,apiUsage:AskApiUsage|undefined;
  try{
   this.assertAskAvailable();signal.throwIfAborted();input.authorize();
   const g=input.grant,r=input.reservation;
   need(input.mode==='public_question'&&!input.binding&&!input.investment&&!input.prepareBinding&&!input.admitSubscription
    &&g.adapterId===policy.adapterId&&g.model===policy.model&&g.monetaryMode==='verified_cap'
    &&g.accountDigest===this.options.accountDigest&&g.maxInputTokens===policy.maxInputTokens&&g.maxOutputTokens===policy.maxOutputTokens
    &&g.maxChargeMicros===policy.maxChargeMicros&&g.researchCalls===0&&g.routerExecutions===0,'FORBIDDEN');
   for(const k of Object.keys(ASK_API_DIGESTS) as (keyof typeof ASK_API_DIGESTS)[])need(g[k]===ASK_API_DIGESTS[k],'FORBIDDEN');
   need(input.localDeadline===r.deadline&&r.contextDigest===hash(input.context)
    &&input.tools.length===1&&hash(input.tools[0])===hash(askSubmitTool()),'FORBIDDEN');
   const context=json(input.context);need(Buffer.byteLength(context)<=131072,'TOO_LARGE');
   const submit=input.tools[0]!,body=json({model:policy.model,instructions:ASK_API_INSTRUCTIONS,input:[{role:'user',content:[{type:'input_text',text:context}]}],
    store:false,stream:false,background:false,truncation:'disabled',service_tier:'default',reasoning:{effort:'none'},max_output_tokens:policy.maxOutputTokens,
    tools:[{type:'function',name:submit.name,description:submit.description,parameters:submit.inputSchema,strict:true}],
    tool_choice:{type:'function',name:submit.name},parallel_tool_calls:false});
   need(Buffer.byteLength(body)<=147456,'TOO_LARGE');
   const session=randomUUID(),checkedMs=Date.now(),now=new Date(checkedMs).toISOString(),expiresAt=new Date(Math.min(checkedMs+60000,Date.parse(r.deadline))).toISOString();
   need(now<expiresAt,'EXPIRED');
   const proof:AskAdmissionProof={...ASK_API_DIGESTS,adapterId:policy.adapterId,model:policy.model,accountDigest:this.options.accountDigest,
    scopeDigest:g.scopeDigest,limitsDigest:g.limitsDigest,rosterDigest:g.rosterDigest,checkedAt:now,expiresAt,providerSessionId:session,reservationDigest:hash(r),
    publicServiceAllowed:true,inputBoundEnforced:true,outputBoundEnforced:true,monetaryMode:'verified_cap',maxChargeMicros:policy.maxChargeMicros};
   input.configured({model:policy.model,reasoning_effort:'none',execution_priority:'low',runtime_version:policy.version,runtime_adapter:policy.adapterId});
   input.bind(session);input.admit(proof);
   input.usage({kind:'start',identity:{threadId:session,model:policy.model,provider:'openai',serviceTier:'default',freshThread:true}});
   const abort=AbortSignal.any([signal,AbortSignal.timeout(Math.max(1,Date.parse(r.deadline)-Date.now()))]);
   const credential=key(this.options.credentialFile);
   const response=await this.transmit(body,credential,input.execution.execution_id,abort,()=>{
    this.assertAskAvailable();input.authorize();need(Date.now()<Date.parse(proof.expiresAt),'EXPIRED');
    input.event('runtime_turn_starting',{});input.beforeTransmit(proof);transmitted=true;
   },proof.expiresAt);
   if(response.status===401||response.status===403)this.denied=true;
   need(response.status===200,'OUTCOME_UNKNOWN');
   const v=parseJson(response.body) as Record<string,unknown>;
   need(v&&v.object==='response'&&v.model===policy.model&&v.service_tier==='default'
    &&['completed','incomplete','failed'].includes(v.status as string)&&typeof v.id==='string','OUTCOME_UNKNOWN');
   const u=v.usage as Record<string,unknown>,i=u?.input_tokens_details as Record<string,unknown>,o=u?.output_tokens_details as Record<string,unknown>;
   need(u&&Object.keys(u).sort().join(',')==='input_tokens,input_tokens_details,output_tokens,output_tokens_details,total_tokens'
    &&i&&o&&Object.keys(i).every(k=>k==='cached_tokens'||k==='cache_write_tokens'&&i[k]===0)
    &&Object.keys(o).every(k=>k==='reasoning_tokens'),'OUTCOME_UNKNOWN');
   const tokens=normalizeTokens({inputTokens:u?.input_tokens,cachedInputTokens:i?.cached_tokens,cacheWriteInputTokens:0,
    outputTokens:u?.output_tokens,reasoningOutputTokens:o?.reasoning_tokens,totalTokens:u?.total_tokens});
   const receipt:AskApiUsage={version:policy.version,responseId:v.id,requestId:response.requestId,model:policy.model,serviceTier:'default',
    status:v.status as AskApiUsage['status'],bodyDigest:createHash('sha256').update(response.body).digest('hex'),tokens,chargeMicros:apiCharge(tokens)};
   checkApiUsage(receipt);
   input.usage({kind:'turn',threadId:session,turnId:receipt.responseId});
   input.usage({kind:'response',threadId:session,turnId:receipt.responseId,responseId:receipt.responseId,usage:tokens});apiUsage=receipt;
   if(v.status!=='completed')return{status:'failed',settled:true,apiUsage};
   need(Array.isArray(v.output),'INVALID_SCHEMA');
   const calls=v.output.filter((x:unknown)=>!!x&&typeof x==='object'&&(x as Record<string,unknown>).type==='function_call') as Record<string,unknown>[];
   need(calls.length===1&&v.output.every((x:Record<string,unknown>)=>['function_call','reasoning'].includes(x.type as string)),'INVALID_SCHEMA');
   const call=calls[0]!;need(call.name===submit.name&&call.status==='completed'&&typeof call.call_id==='string'&&typeof call.arguments==='string','INVALID_SCHEMA');
   signal.throwIfAborted();input.authorize();input.callTool(call.call_id,submit.name,parseJson(Buffer.from(call.arguments,'utf8')),signal);
   return{status:'completed',settled:true,providerTurnCompleted:true,apiUsage};
  }catch{
   // Never log raw provider errors/body/key/input. Unknown transmitted work keeps its full reservation.
   return{status:signal.aborted?'interrupted':'failed',settled:!!apiUsage||!transmitted,
    ...(apiUsage?{apiUsage,providerTurnCompleted:apiUsage.status==='completed'}:{})};
  }
 }
}
