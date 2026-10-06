import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { requireThat } from '../domain/model.js';
import { publicAddress } from '../research/public-fetch.js';
import { computerUrl,type ComputerPolicy,type CanonicalRequest,type BrowserResponse } from '../domain/computer.js';

// Called only after a durable reservation and authorization recheck. No redirects
// or retries here. Chromium sees a read redirect and every next request is gated.
export async function forwardBrowserRequest(request:CanonicalRequest,policy:ComputerPolicy,signal:AbortSignal,
  beforeSend:()=>void=()=>{}):Promise<BrowserResponse> {
  const u=computerUrl(request.url,policy);const host=u.hostname.replace(/^\[|\]$/g,'');
  const combined=AbortSignal.any([signal,AbortSignal.timeout(10000)]);
  combined.throwIfAborted();
  const addresses=isIP(host)?[{address:host,family:isIP(host)}]:await new Promise<{address:string;family:number}[]>((resolve,reject)=>{
    const aborted=()=>reject(combined.reason);combined.addEventListener('abort',aborted,{once:true});
    lookup(host,{all:true,verbatim:true}).then(resolve,reject).finally(()=>combined.removeEventListener('abort',aborted));
  });
  combined.throwIfAborted();
  requireThat(addresses.length>0&&addresses.every(a=>publicAddress(a.address)||policy.fixtureOrigins.includes(u.origin)&&a.address==='127.0.0.1'),'DNS resolved to a protected address');
  beforeSend();combined.throwIfAborted();
  return new Promise((resolve,reject)=>{
    const req=(u.protocol==='https:'?httpsRequest:httpRequest)(u,{method:request.method,agent:false,signal:combined,headers:request.headers,
      lookup:(_h,options,callback)=>{if(options.all)callback(null,addresses);else callback(null,addresses[0]!.address,addresses[0]!.family);}},res=>{
      const status=res.statusCode??0;
      const bad=(message:string)=>{res.destroy();reject(new Error(message));};
      if(request.method==='POST'&&status>=300&&status<400){bad('Protected request redirect refused; inspect effect outcome');return;}
      if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){bad('Compressed browser response denied');return;}
      if(res.headers['content-disposition']&&/attachment/i.test(res.headers['content-disposition'])){bad('Downloads are disabled');return;}
      if(Number(res.headers['content-length']??0)>2097152){bad('Browser response exceeds two MiB');return;}
      const headers:Record<string,string>={};
      for(const name of ['content-type','location','cache-control','content-security-policy','x-content-type-options','access-control-allow-origin']){
        const v=res.headers[name];if(typeof v==='string'&&v.length<=4096)headers[name]=v;
      }
      if(headers.location){try{computerUrl(new URL(headers.location,u).href,policy);}catch{bad('Redirect origin denied');return;}}
      headers['cache-control']='no-store';
      headers['content-security-policy']=[headers['content-security-policy'],"object-src 'none'; worker-src 'none'; frame-src 'none'; base-uri 'none'"].filter(Boolean).join(', ');
      const chunks:Buffer[]=[];let bytes=0;
      res.on('data',(b:Buffer)=>{bytes+=b.length;if(bytes>2097152){bad('Browser response exceeds two MiB');return;}chunks.push(b);});
      res.on('error',reject);res.on('end',()=>resolve({status,headers,body:Buffer.concat(chunks).toString('base64')}));
    });
    req.on('error',reject);req.end(Buffer.from(request.body,'base64'));
  });
}
