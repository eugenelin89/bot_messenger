import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage } from 'node:http';
import { ensure } from '../../domain/investment/arithmetic.js';
import type { FinancialRequest, YahooQuery, YahooResponse, YahooTransport } from '../../domain/market/financial.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import { publicAddress } from '../../research/public-fetch.js';
import { assertProbeCapability, isOwnerProbe, type YahooProbeCustody, type WireReceipt } from './yahoo-probe-custody.js';

export interface YahooWire {
  lookup: typeof lookup;
  request: typeof httpsRequest;
}
interface Cookie { name:string; value:string; domain:string; hostOnly:boolean; path:string; expires:number; }
function safeHttpDate(value:unknown):string|null {
  if(value===undefined)return null;
  ensure(typeof value==='string'&&value.length===29&&new Date(value).toUTCString()===value,'yahoo_header_schema');return value;
}
function safeRetryAfter(value:unknown):string|null {
  if(value===undefined)return null;
  if(typeof value==='string'&&/^\d{1,10}$/.test(value)&&Number(value)<=315360000)return value;
  return safeHttpDate(value);
}
/** Ephemeral bootstrap cookies only. No home cookie jar, auth headers, proxy, login or disk cache. */
class CookieJar {
  private cookies:Cookie[]=[];
  accept(host:string,headers:string[]):void {
    ensure(headers.length<=16,'yahoo_cookie_limit');
    for(const header of headers){
      ensure(header.length<=4096&&!/[\r\n]/.test(header),'yahoo_cookie_size');
      const [pair,...attributes]=header.split(';').map(v=>v.trim());const index=pair!.indexOf('=');ensure(index>0,'yahoo_cookie_schema');
      const name=pair!.slice(0,index),value=pair!.slice(index+1);ensure(/^[A-Za-z0-9_-]{1,64}$/.test(name)&&/^[\x21-\x3a\x3c-\x7e]{0,2048}$/.test(value),'yahoo_cookie_schema');
      let domain=host,hostOnly=true,path='/',expires=Date.now()+3600000,secure=false;
      for(const attribute of attributes){const equal=attribute.indexOf('='),key=(equal<0?attribute:attribute.slice(0,equal)).toLowerCase(),v=equal<0?'':attribute.slice(equal+1);
        if(key==='domain'){domain=v.replace(/^\./,'').toLowerCase();hostOnly=false;ensure(domain==='yahoo.com'||domain===host,'yahoo_cookie_domain');ensure(host===domain||host.endsWith('.'+domain),'yahoo_cookie_domain');}
        if(key==='path'){ensure(v.startsWith('/')&&v.length<=200,'yahoo_cookie_path');path=v;}
        if(key==='secure')secure=true;
        if(key==='max-age'){ensure(/^-?\d{1,10}$/.test(v),'yahoo_cookie_age');expires=Math.min(expires,Date.now()+Number(v)*1000);}
        if(key==='expires'){const parsed=Date.parse(v);ensure(Number.isFinite(parsed),'yahoo_cookie_age');expires=Math.min(expires,parsed);}
      }
      ensure(secure,'yahoo_cookie_requires_secure');this.cookies=this.cookies.filter(c=>!(c.name===name&&c.domain===domain&&c.path===path));
      if(expires>Date.now())this.cookies.push({name,value,domain,hostOnly,path,expires});
    }
    ensure(this.cookies.length<=16&&this.cookies.reduce((n,c)=>n+c.name.length+c.value.length,0)<=8192,'yahoo_cookie_limit');
  }
  header(url:URL):string {
    this.cookies=this.cookies.filter(c=>c.expires>Date.now());
    return this.cookies.filter(c=>(url.hostname===c.domain||!c.hostOnly&&url.hostname.endsWith('.'+c.domain))&&(url.pathname===c.path||url.pathname.startsWith(c.path.endsWith('/')?c.path:c.path+'/'))).map(c=>`${c.name}=${c.value}`).join('; ');
  }
}
/** Bounded wire shared by offline tests and the separately consumed owner probe.
 * The offline factory requires both fake drivers; live issuance verifies host custody.
 * This is not an employee capability or a permission switch.
 */
function boundedSession(financialRequest:FinancialRequest|(()=>FinancialRequest),symbol:string,wire:YahooWire,probe?:YahooProbeCustody):YahooTransport {
  const jar=new CookieJar();let active=false;
  return {kind:probe&&isOwnerProbe(probe)?'yahoo-https-v1':'authored_yahoo_fixture',async exchange(query,signal,maxBytes){
    ensure(!active,'yahoo_concurrent_wire');active=true;
    const combined=AbortSignal.any([signal,AbortSignal.timeout(10000)]);
    let reserved=false,receipt:WireReceipt={status:null,receivedBytes:0,complete:false,httpDate:null,retryAfter:null,reason:'transport_unknown',completedAt:new Date().toISOString()};
    const captured:Buffer[]=[];let bootstrap=false;
    try {
      const qualified=qualifyYahooQuery(query,typeof financialRequest==='function'?financialRequest():financialRequest,symbol);
      bootstrap=qualified.endpoint.endsWith(':cookie')||qualified.endpoint.endsWith(':crumb');
      if(probe){probe.reserve(query,maxBytes);reserved=true;}
      ensure(!combined.aborted,'yahoo_cancelled');ensure(Number.isSafeInteger(maxBytes)&&maxBytes>0&&maxBytes<=262144,'yahoo_response_limit');
      const url=new URL(query.url);for(const [key,value] of Object.entries(query.params))url.searchParams.append(key,String(value));
      const addresses=await new Promise<LookupAddress[]>((resolve,reject)=>{
        const abort=()=>reject(new Error('yahoo_dns_cancelled'));combined.addEventListener('abort',abort,{once:true});
        void wire.lookup(url.hostname,{all:true,verbatim:true}).then(resolve,reject).finally(()=>combined.removeEventListener('abort',abort));
      });
      ensure(!combined.aborted,'yahoo_cancelled');
      // all:true overload resolves an array; pin the chosen public address on the TLS connection.
      const resolved=addresses as unknown as {address:string;family:number}[];
      ensure(resolved.length>0&&resolved.length<=32&&resolved.every(a=>publicAddress(a.address)),'yahoo_protected_address');
      const selected=resolved[0]!;
      if(probe)await probe.beforeWire(combined);
      return await new Promise<YahooResponse>((resolve,reject)=>{
        const cookies=jar.header(url);
        const req=wire.request(url,{method:'GET',agent:false,signal:combined,rejectUnauthorized:true,servername:url.hostname,
          lookup:(_hostname,_options,callback)=>callback(null,selected.address,selected.family),
          headers:{'User-Agent':'BotSquad/0.1 private personal research','Accept':'application/json, text/plain','Accept-Encoding':'identity',...(cookies?{Cookie:cookies}:{})},
        },(res:IncomingMessage)=>{
          let size=0;let failed=false;
          receipt.status=res.statusCode??null;
          const rejectResponse=(error:unknown)=>{failed=true;res.destroy();req.destroy();reject(error);};
          try{
            if(probe){
              probe.seal({type:'response_headers',date:res.headers.date??null,retryAfter:res.headers['retry-after']??null});
              receipt.httpDate=safeHttpDate(res.headers.date);receipt.retryAfter=safeRetryAfter(res.headers['retry-after']);
            }
            ensure(!res.headers['content-encoding']||res.headers['content-encoding']==='identity','yahoo_compressed_response');
            const length=res.headers['content-length'];if(length)ensure(/^\d+$/.test(length)&&Number(length)<=maxBytes,'yahoo_response_size');
            // Never follow redirects or accept consent. Status is returned to the gateway's durable circuit.
            if(res.statusCode===200)jar.accept(url.hostname,res.headers['set-cookie']??[]);
          }catch(e){rejectResponse(e);return;}
          // Read only bounded application body bytes. Unread socket buffers are discarded on denial.
          // This is body accounting, not TCP/TLS/header bandwidth accounting.
          res.on('readable',()=>{
            while(!failed&&res.readableLength>0){
              if(size===maxBytes){rejectResponse(new Error('yahoo_response_size'));return;}
              const chunk=res.read(Math.min(res.readableLength,maxBytes-size)) as Buffer|null;
              if(!chunk)break;size+=chunk.length;receipt.receivedBytes=size;captured.push(chunk);
            }
            if(!failed&&res.readableLength===0)res.read(0);
          });
          res.once('error',reject);res.once('aborted',()=>reject(new Error('yahoo_response_aborted')));
          res.once('end',()=>{
            if(failed)return;
            try{
              const body=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(captured));
              if(probe&&res.statusCode===200&&bootstrap){
                const contentType=res.headers['content-type']??'';
                ensure(!/html/i.test(contentType)&&!/<(?:!doctype|html|form|script)|consent|captcha|sign.?in|log.?in|access denied/i.test(body),'yahoo_bootstrap_barrier');
                if(qualified.endpoint.endsWith(':crumb'))ensure(/^[\x21-\x7e]{1,256}$/.test(body)&&!/[<>]/.test(body),'yahoo_crumb_schema');
              }
              receipt.complete=true;receipt.reason='response';
              resolve({status:res.statusCode??0,body,contentType:res.headers['content-type']??'',retryAfter:res.headers['retry-after']??null});
            }catch(e){rejectResponse(e);}
          });
        });
        req.once('error',reject);req.end();
      });
    }catch(error){
      receipt.reason=error instanceof Error&&/^[a-z][a-z0-9_]{0,100}$/.test(error.message)?error.message:'transport_unknown';throw error;
    }finally{
      active=false;receipt.completedAt=new Date().toISOString();
      if(probe&&reserved)probe.received(receipt,bootstrap?Buffer.alloc(0):Buffer.concat(captured));
    }
  }};
}
/** Generic application transport remains inactive. The dedicated owner factory below requires
 * a consumed process-local capability; no policy, environment flag or callback enables this class.
 */
export class YahooHttpsTransport {
  readonly kind='yahoo-https-v1' as const;
  async exchange(_query:YahooQuery,_signal:AbortSignal,_maxBytes:number):Promise<YahooResponse> {throw new Error('yahoo_live_probe_not_approved');}
}
export function yahooOfflineWire(request:FinancialRequest,symbol:string,wire:YahooWire):YahooTransport {
  ensure(wire.lookup!==lookup&&wire.request!==httpsRequest,'yahoo_offline_wire_requires_fakes');
  return boundedSession(request,symbol,wire);
}

/** A consumed host capability is required; fixture capabilities cannot select real DNS/HTTPS. */
export function yahooProbeTransport(probe:YahooProbeCustody,wire?:YahooWire):YahooTransport {
  assertProbeCapability(probe);
  if(isOwnerProbe(probe))ensure(wire===undefined,'probe_real_wire_not_injectable');
  else ensure(wire&&wire.lookup!==lookup&&wire.request!==httpsRequest,'probe_fixture_requires_fake_wire');
  const transport=boundedSession(()=>probe.request,'AAPL',wire??{lookup,request:httpsRequest},probe);
  probe.bindTransport(transport);return transport;
}
