import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import type { IncomingMessage } from 'node:http';
import { ensure } from '../../domain/investment/arithmetic.js';
import type { FinancialRequest, YahooQuery, YahooResponse, YahooTransport } from '../../domain/market/financial.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import { publicAddress } from '../../research/public-fetch.js';

export interface YahooWire {
  lookup: typeof lookup;
  request: typeof httpsRequest;
}
interface Cookie { name:string; value:string; domain:string; hostOnly:boolean; path:string; expires:number; }
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
/** Dormant wire implementation. All production admission remains closed pending an approved probe.
 * Tests inject BOTH DNS and HTTPS, so this factory cannot accidentally default to a real socket.
 * This is not an employee capability or a permission switch.
 */
function boundedSession(financialRequest:FinancialRequest,symbol:string,wire:YahooWire):YahooTransport {
  const jar=new CookieJar();let active=false;
  return {kind:'authored_yahoo_fixture',async exchange(query,signal,maxBytes){
    ensure(!active,'yahoo_concurrent_wire');active=true;
    const combined=AbortSignal.any([signal,AbortSignal.timeout(10000)]);
    try {
      qualifyYahooQuery(query,financialRequest,symbol);
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
      return await new Promise<YahooResponse>((resolve,reject)=>{
        const cookies=jar.header(url);
        const req=wire.request(url,{method:'GET',agent:false,signal:combined,rejectUnauthorized:true,servername:url.hostname,
          lookup:(_hostname,_options,callback)=>callback(null,selected.address,selected.family),
          headers:{'User-Agent':'BotSquad/0.1 private personal research','Accept':'application/json, text/plain','Accept-Encoding':'identity',...(cookies?{Cookie:cookies}:{})},
        },(res:IncomingMessage)=>{
          const chunks:Buffer[]=[];let size=0;const rejectResponse=(error:unknown)=>{res.destroy();req.destroy();reject(error);};
          try{
            ensure(!res.headers['content-encoding']||res.headers['content-encoding']==='identity','yahoo_compressed_response');
            const length=res.headers['content-length'];if(length)ensure(/^\d+$/.test(length)&&Number(length)<=maxBytes,'yahoo_response_size');
            // Never follow redirects or accept consent. Status is returned to the gateway's durable circuit.
            if(res.statusCode===200)jar.accept(url.hostname,res.headers['set-cookie']??[]);
          }catch(e){rejectResponse(e);return;}
          res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>maxBytes){rejectResponse(new Error('yahoo_response_size'));return;}chunks.push(chunk);});
          res.once('error',reject);res.once('aborted',()=>reject(new Error('yahoo_response_aborted')));
          res.once('end',()=>resolve({status:res.statusCode??0,body:Buffer.concat(chunks).toString('utf8'),contentType:res.headers['content-type']??'',retryAfter:res.headers['retry-after']??null}));
        });
        req.once('error',reject);req.end();
      });
    }finally{active=false;}
  }};
}
/** Required future live gate: reviewed trusted owner approval + finite-retention/restore custody.
 * A policy, mode label, environment variable, or caller's callback is not that approval.
 * Construction/import never performs DNS. Live calls fail before touching the dormant wire.
 */
export class YahooHttpsTransport {
  readonly kind='yahoo-https-v1' as const;
  async exchange(_query:YahooQuery,_signal:AbortSignal,_maxBytes:number):Promise<YahooResponse> {throw new Error('yahoo_live_probe_not_approved');}
}
export function yahooOfflineWire(request:FinancialRequest,symbol:string,wire:YahooWire):YahooTransport {
  ensure(wire.lookup!==lookup&&wire.request!==httpsRequest,'yahoo_offline_wire_requires_fakes');
  return boundedSession(request,symbol,wire);
}
