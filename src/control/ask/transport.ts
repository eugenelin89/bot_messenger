/** Dormant Ask HTTP delivery adapter. No grant issuance, persistence or model replay. */
import { randomBytes } from 'node:crypto';
import { request as httpsRequest, type RequestOptions } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { TLSSocket } from 'node:tls';
import {
  ASK_ORIGIN, ASK_WIRE_BYTES, ASK_PROBLEM_BYTES, reconstructAskRequest, decodeAskResponse,
  type AskOperation, type AskKind, type AskBoundaryContext, type PreparedAskRequest,
  type DecodedAskResponse, type AskWireResponse,
} from '../../domain/ask/contract.js';
import { contentDigest, signatureBase, signatureInput, type SignedMessage } from '../../../scripts/investment-contracts/signatures.js';

export const ASK_DEADLINE_MS = 10000;
export const ASK_HEADER_BYTES = 16384;
/** Must be backed by dedicated Ask key custody, never a worker or publication grant. */
export interface AskSigningKeys {
  has(keyId: string, nowSeconds: number): boolean;
  sign(keyId: string, bytes: Buffer, nowSeconds: number): Buffer;
}
export interface AskTransportOptions {
  keys: AskSigningKeys;
  /** Trusted synchronous integration hook: recheck local grant/controls/stop before send.
   * It returns current wire scope/limits/clock, not proof of any durable grant or model authority. */
  current: () => AskBoundaryContext;
}
export type AskTransportCode = 'busy' | 'cancelled' | 'invalid_intent' | 'key_unavailable'
  | 'timeout' | 'network' | 'response_headers' | 'response_limit' | 'response_incomplete' | 'response_rejected';
export type AskExchangeResult<K extends AskKind> =
  | { kind:'response'; response:DecodedAskResponse<K> }
  | { kind:'not_sent'|'unknown'; code:AskTransportCode; status:number|null };
export interface AskClient {
  /** Caller must persist exact intent before calling. One attempt, never an automatic retry. */
  exchange<K extends AskKind>(operation:Extract<AskOperation,{kind:K}>, intent:PreparedAskRequest<K>, signal:AbortSignal):Promise<AskExchangeResult<K>>;
}
export type AskRequestWire = (options:RequestOptions, callback:(response:IncomingMessage)=>void)=>ClientRequest;

function client(options:AskTransportOptions, wire:AskRequestWire):AskClient {
  let active=false;
  return {async exchange(operation,intent,signal) {
    if(active)return {kind:'not_sent',code:'busy',status:null};
    if(signal.aborted)return {kind:'not_sent',code:'cancelled',status:null};
    active=true;
    try {
      let request:PreparedAskRequest<typeof operation.kind>, snapshot:typeof operation;
      try {
        snapshot=structuredClone(operation);
        const ctx=options.current();request=reconstructAskRequest(snapshot,intent,ctx);
        if(!options.keys.has(ctx.scope.keyId,Math.floor(Date.parse(ctx.now)/1000)))
          return {kind:'not_sent',code:'key_unavailable',status:null};
      }catch{return {kind:'not_sent',code:'invalid_intent',status:null};}
      const headers:Record<string,string>={host:'asymmetri.co',connection:'close',accept:'application/json, application/problem+json'};
      if(request.method==='POST')headers['content-length']=String(Buffer.byteLength(request.body));
      // Raw HTTP is deliberately not configurable, including through a supplied operation.
      const target=new URL(ASK_ORIGIN);
      const outcome=await new Promise<AskWireResponse|{kind:'not_sent'|'unknown';code:AskTransportCode;status:number|null}>(resolve=>{
        let req:ClientRequest|undefined,res:IncomingMessage|undefined,done=false,transmitted=false,status:number|null=null,size=0;
        const chunks:Buffer[]=[];
        const finish=(value:AskWireResponse|{kind:'not_sent'|'unknown';code:AskTransportCode;status:number|null})=>{
          if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);
          resolve(value);res?.destroy();req?.destroy();
        };
        const fail=(code:AskTransportCode)=>finish({kind:transmitted?'unknown':'not_sent',code,status});
        const abort=()=>fail('cancelled');
        const timer=setTimeout(()=>fail('timeout'),ASK_DEADLINE_MS);
        signal.addEventListener('abort',abort,{once:true});
        try {
          req=wire({protocol:'https:',hostname:target.hostname,port:443,servername:target.hostname,
            method:request.method,path:request.path,headers,agent:false,rejectUnauthorized:true,
            maxHeaderSize:ASK_HEADER_BYTES,insecureHTTPParser:false},incoming=>{
            res=incoming;status=incoming.statusCode??0;
            if(done){incoming.destroy();return;}
            const names=incoming.rawHeaders.filter((_,i)=>i%2===0).map(n=>n.toLowerCase());
            const unique=['content-type','cache-control','content-length','transfer-encoding','content-encoding'];
            const rawSize=incoming.rawHeaders.reduce((n,h)=>n+Buffer.byteLength(h)+2,0);
            if(rawSize>ASK_HEADER_BYTES||unique.some(n=>names.filter(x=>x===n).length>1)
              ||incoming.headers['content-encoding']!==undefined||incoming.headers.location!==undefined
              ||incoming.headers.refresh!==undefined||incoming.headers['set-cookie']!==undefined
              ||incoming.headers['www-authenticate']!==undefined||incoming.headers['proxy-authenticate']!==undefined){fail('response_headers');return;}
            const problem=status>=400&&status<=599,limit=problem?ASK_PROBLEM_BYTES:ASK_WIRE_BYTES;
            const length=incoming.headers['content-length'];
            if(length!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(length)||Number(length)>limit)){fail('response_limit');return;}
            if(status!==200&&!problem){fail('response_rejected');return;}
            incoming.on('data',(part:Buffer)=>{
              if(done)return;size+=part.length;if(size>limit){fail('response_limit');return;}chunks.push(part);
            });
            incoming.once('aborted',()=>fail('response_incomplete'));
            incoming.once('error',()=>fail('network'));
            incoming.once('end',()=>{
              if(!incoming.complete){fail('response_incomplete');return;}
              finish({status:status!,contentType:incoming.headers['content-type']??'',cacheControl:incoming.headers['cache-control']??'',bytes:Buffer.concat(chunks)});
            });
            incoming.once('close',()=>{if(!done)fail('response_incomplete');});
          });
          req.once('error',()=>fail('network'));
          req.once('information',()=>fail('response_rejected'));
          req.once('upgrade',(incoming,socket)=>{incoming.destroy();socket.destroy();fail('response_rejected');});
          req.once('close',()=>{if(!done&&!res)fail('response_incomplete');});
          if(done||signal.aborted){fail('cancelled');req.destroy();return;}
          req.once('socket',socket=>{
            // ClientRequest has not been written/ended/flushed. DNS and TLS may consume
            // the whole lease: reauthorize only after a verified connection is ready.
            socket.once('secureConnect',()=>{
              if(done||signal.aborted){fail('cancelled');return;}
              if(!(socket as TLSSocket).authorized){fail('network');return;}
              try {
                const ctx=options.current();request=reconstructAskRequest(snapshot,request,ctx);
                const now=Math.floor(Date.parse(ctx.now)/1000),b=request.binding;
                const expires=Math.min(now+60,Math.floor(Date.parse(ctx.scope.expiresAt)/1000),
                  b.claimExpiresAt?Math.floor(Date.parse(b.claimExpiresAt)/1000):Infinity,
                  b.questionExpiresAt?Math.floor(Date.parse(b.questionExpiresAt)/1000):Infinity);
                if(expires<=now)throw new Error('expired');
                if(!options.keys.has(ctx.scope.keyId,now)){fail('key_unavailable');return;}
                const body=Buffer.from(request.body),signedHeaders:[string,string][]=[['botsquad-generation',b.generation]];
                if(request.method==='POST')signedHeaders.push(['content-type','application/json'],['content-digest',contentDigest(body)],['idempotency-key',request.requestId!]);
                const message:SignedMessage={method:request.method,authority:'asymmetri.co',path:request.path,headers:signedHeaders,body};
                const input=signatureInput(request.method,{created:now,expires,keyId:ctx.scope.keyId,nonce:randomBytes(24).toString('base64url')});
                const signature=options.keys.sign(ctx.scope.keyId,Buffer.from(signatureBase(message,input)),now);
                if(signature.length!==64){fail('key_unavailable');return;}
                const latest=options.current();reconstructAskRequest(snapshot,request,latest);
                if(Date.parse(latest.now)>=expires*1000||!options.keys.has(latest.scope.keyId,Math.floor(Date.parse(latest.now)/1000)))throw new Error('expired');
                if(signal.aborted){fail('cancelled');return;}
                for(const [name,value] of signedHeaders)req!.setHeader(name,value);
                req!.setHeader('signature-input',input);req!.setHeader('signature',`sig1=:${signature.toString('base64')}:`);
                // Conservative uncertainty boundary: end may partially write then throw.
                transmitted=true;req!.end(body);
              }catch{fail(transmitted?'network':'invalid_intent');}
            });
          });
        }catch{fail('network');}
      });
      if('code' in outcome)return outcome;
      try{return {kind:'response',response:decodeAskResponse(request,outcome,options.current())};}
      catch{return {kind:'unknown',code:'response_rejected',status:outcome.status};}
    }finally{active=false;}
  }};
}
/** No application caller currently provisions this adapter or its dedicated Ask keys. */
export function createAskHttpsClient(options:AskTransportOptions):AskClient {return client(options,httpsRequest);}
/** Trusted test injection only; never accepts a real default request function as an offline wire. */
export function askOfflineClient(options:AskTransportOptions,wire:AskRequestWire):AskClient {
  if(wire===httpsRequest)throw new Error('ask_offline_wire_required');
  return client(options,wire);
}
