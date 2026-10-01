import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { RESEARCH_LIMITS as L, ResearchFailure, type PublicSource } from '../domain/research.js';

const fail = (code: string, message: string): never => { throw new ResearchFailure(code,message); };
export function publicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a,b,c] = address.split('.').map(Number) as [number,number,number,number];
    return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||
      a===100&&b>=64&&b<=127||a===192&&(b===168||b===0||b===88&&c===99)||
      a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
  }
  if (isIP(address)!==6) return false;
  const normalized=new URL(`https://[${address}]/`).hostname.slice(1,-1);
  // Admit global-unicast only. Exclude transition/tunnel, documentation and special-use prefixes.
  const first=Number.parseInt(normalized.split(':')[0]!,16);
  if(!Number.isFinite(first)||first<0x2000||first>0x3fff||first===0x2002||first===0x3fff)return false;
  if(first===0x2001){const second=Number.parseInt(normalized.split(':')[1]||'0',16);if(second<0x200||second===0xdb8)return false;}
  return true;
}
export function publicUrl(value: string): URL {
  if(typeof value!=='string'||value.length>2048||/[\u0000-\u0020\u007f\\]/.test(value))fail('unsafe_url','Use a normal public HTTPS information URL.');
  let u: URL;try{u=new URL(value);}catch{return fail('unsafe_url','Invalid public source URL.');}
  if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')fail('unsafe_url','Only public HTTPS on port 443 without credentials is permitted.');
  const host=u.hostname.replace(/^\[|\]$/g,'').replace(/\.$/,'').toLowerCase();
  if(isIP(host)){if(!publicAddress(host))fail('protected_destination','Protected network destinations are unavailable.');}
  else if(!host.includes('.')||/(?:^|\.)(?:localhost|local|internal|intranet|lan|home|test|invalid|example|onion)$/.test(host)||host==='metadata.google.internal')fail('protected_destination','Protected network destinations are unavailable.');
  let path: string;try{path=decodeURIComponent(u.pathname);}catch{return fail('unsafe_url','Malformed source path.');}
  if(/(?:^|\/)(?:login|logout|sign-?in|sign-?up|oauth|authorize|admin|delete|remove|unsubscribe|checkout|payment|webhook|callback|execute|command|control)(?:\/|\.|$)/i.test(path))fail('action_url','Account, credential and control endpoints are outside public information retrieval.');
  for(const [key,val] of u.searchParams)if(/(?:token|secret|password|api[_-]?key|session|auth|cookie|signature|^action$|^cmd$|^command$)/i.test(key)||val.length>500)fail('action_url','Credential-bearing or control URLs are outside public information retrieval.');
  u.hash='';return u;
}
export async function resolvePublic(u: URL, resolver: typeof lookup=lookup) {
  const host=u.hostname.replace(/^\[|\]$/g,'');
  const addresses=isIP(host)?[{address:host,family:isIP(host)}]:await resolver(host,{all:true,verbatim:true});
  if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))fail('protected_destination','DNS resolved to a protected or unsupported destination.');
  return addresses;
}
function entities(s: string) {
  return s.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d{1,7}|#x[\da-f]{1,6});/gi,e=>{
    const names:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
    if(names[e.toLowerCase()])return names[e.toLowerCase()]!;
    const n=e[2]?.toLowerCase()==='x'?parseInt(e.slice(3,-1),16):parseInt(e.slice(2,-1),10);
    return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):' ';
  });
}
export function extractPage(body: string, type: string) {
  const html=/html/.test(type);
  const title=html?entities(body.match(/<title\b[^>]*>([^<]{0,1000})<\/title>/i)?.[1]??'Public page'):'Public text';
  const text=html?entities(body.replace(/<(script|style|svg|iframe|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ').replace(/<!--[^]*?-->/g,' ').replace(/<[^>]*>/g,' ')).replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n\n').trim():body;
  return {title:title.slice(0,300),content:text.slice(0,L.sourceChars),omissions:text.length>L.sourceChars?`Only first ${L.sourceChars} extracted characters retained.`:'Bounded static text extraction; scripts, images and interactive content are not read.'};
}
// Dependencies are trusted construction/test injection, never worker-supplied arguments.
export async function fetchPublic(value: string, signal: AbortSignal, dependencies: {lookup?:typeof lookup;request?:typeof request}={}): Promise<PublicSource> {
  const combined=AbortSignal.any([signal,AbortSignal.timeout(L.fetchTimeoutMs)]);
  const abort=()=>fail(signal.aborted?'cancelled':'source_timeout',signal.aborted?'Lookup cancelled.':'Public source timed out.');
  let url=publicUrl(value);
  for(let redirects=0;redirects<=L.redirects;redirects++) {
    if(combined.aborted)abort();
    const addresses=await Promise.race([resolvePublic(url,dependencies.lookup),new Promise<never>((_,reject)=>combined.addEventListener('abort',()=>reject(new ResearchFailure('source_timeout','DNS lookup timed out.')),{once:true}))]);
    if(combined.aborted)abort();
    const response=await new Promise<{status:number;location?:string;type:string;body:string}>((resolve,reject)=>{
      const req=(dependencies.request??request)(url,{method:'GET',agent:false,signal:combined,rejectUnauthorized:true,
        headers:{'User-Agent':'BotSquad/0.1 public-information reader','Accept':'text/html, text/plain, application/json;q=0.8, application/xml;q=0.8','Accept-Encoding':'identity'},
        // Socket connects only to the validated answer. TLS still validates the original hostname.
        lookup:(_hostname,options,callback)=>{const a=addresses[0]!;if(options.all)callback(null,addresses);else callback(null,a.address,a.family);},
      },res=>{
        const status=res.statusCode??0;const type=String(res.headers['content-type']??'').toLowerCase();
        if(status>=300&&status<400){res.destroy();resolve({status,location:res.headers.location,type,body:''});return;}
        if(status!==200){res.destroy();reject(new ResearchFailure(status===429?'source_rate_limit':'source_http_error',`Public source returned HTTP ${status}.`));return;}
        if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();reject(new ResearchFailure('source_encoding','Compressed response refused; no decompression performed.'));return;}
        if(!/^(?:text\/(?:html|plain|xml)|application\/(?:json|xml|xhtml\+xml))(?:;|$)/.test(type)){res.destroy();reject(new ResearchFailure('source_type','Only static text, HTML, XML and JSON sources are supported.'));return;}
        if(Number(res.headers['content-length']??0)>L.bytes){res.destroy();reject(new ResearchFailure('source_too_large','Public source exceeds the one MiB response limit.'));return;}
        const chunks:Buffer[]=[];let bytes=0;
        res.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>L.bytes){res.destroy(new ResearchFailure('source_too_large','Public source exceeds the one MiB response limit.'));return;}chunks.push(chunk);});
        res.on('error',reject);res.on('end',()=>resolve({status,type,body:Buffer.concat(chunks).toString('utf8')}));
      });req.on('error',reject);req.end();
    }).catch(error=>{if(combined.aborted)abort();if(error instanceof ResearchFailure)throw error;return fail('source_unavailable','Public source could not be reached or TLS validation failed.');});
    if(response.status>=300&&response.status<400){if(redirects===L.redirects||!response.location)fail('source_redirect','Public source redirect limit or missing location.');url=publicUrl(new URL(response.location!,url).href);continue;}
    return {...extractPage(response.body,response.type),url:url.href,kind:'retrieved_page',retrieved_at:new Date().toISOString(),published_at:null,observed_at:null,freshness:'live_response'};
  }
  return fail('source_redirect','Public source redirect limit.');
}
