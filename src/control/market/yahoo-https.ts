import { lookup } from 'node:dns/promises';
import { createHash } from 'node:crypto';
import type { LookupAddress } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { LookupFunction } from 'node:net';
import { isIP } from 'node:net';
import { performance } from 'node:perf_hooks';
import { setTimeout as sleep } from 'node:timers/promises';
import { yahooDiagnostic, YahooTransportError, type YahooStage, type YahooStageConfirmation } from './yahoo-diagnostics.js';
import { ensure } from '../../domain/investment/arithmetic.js';
import type { FinancialRequest, YahooQuery, YahooResponse, YahooTransport } from '../../domain/market/financial.js';
import { qualifyYahooQuery } from '../../domain/market/yahoo-transport.js';
import { acceptedCookie404, benignCookie404, isCookieBootstrap, validCrumb } from '../../domain/market/yahoo-bootstrap.js';
import { isBootstrapHistoryFixture } from './yahoo-history-custody.js';
import { publicAddress } from '../../research/public-fetch.js';
import type { WireReceipt } from './yahoo-probe-custody.js';
import { assertFinancialCustody, isOwnerFinancialCustody, type FinancialCustody } from './financial-custody.js';

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
  hasAnonymousCookie(url:URL):boolean {
    return this.header(url).split('; ').some(pair=>/^A3=.+$/.test(pair));
  }
}
/** Bounded wire shared by offline tests and the separately consumed owner probe.
 * The offline factory requires both fake drivers; live issuance verifies host custody.
 * This is not an employee capability or a permission switch.
 */
/** Honor both Node lookup contracts while returning only the already validated, single pin.
 * Node24 may request all:true even when the preflight DNS lookup returned a single address.
 */
export function yahooPinnedLookup(selected: LookupAddress): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [{ address: selected.address, family: selected.family }]);
    else callback(null, selected.address, selected.family);
  };
}
function boundedSession(financialRequest:FinancialRequest|(()=>FinancialRequest),symbol:string,wire:YahooWire,probe?:FinancialCustody,compatibility=false):YahooTransport {
  const jar = new CookieJar(); let active = false, terminal = false; let crumb:string|null=null,lastResponse=-Infinity;let acceptedCookies:string|null=null;
  // Pin effective cookie headers from the first acceptance, independently of crumb/cache expiry.
  const cookieIdentity=()=>{
    const headers=[jar.header(new URL('https://query1.finance.yahoo.com/v1/test/getcrumb')),jar.header(new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`))];
    ensure(headers.every(header=>header.split('; ').some(pair=>/^A3=.+$/.test(pair))),'yahoo_bootstrap_cookie_missing');
    return JSON.stringify(headers);
  };
  return { kind: probe && isOwnerFinancialCustody(probe) ? 'yahoo-https-v1' : 'authored_yahoo_fixture', async exchange(query, signal, maxBytes) {
    ensure(!terminal,'yahoo_bootstrap_terminal');
    ensure(!active, 'yahoo_concurrent_wire'); active = true;
    const deadline = AbortSignal.timeout(10000);
    const combined = AbortSignal.any([signal, deadline, ...(probe ? [probe.signal] : [])]);
    const started = performance.now();
    let last: YahooStageConfirmation = { stage: 'exchange_started', at: new Date().toISOString(), elapsedMs: 0 };
    const confirmed = new Set<YahooStage>(['exchange_started']);
    let reserved = false, wireIntent = false, frozen = false, settlementFailed = false;
    const receipt: WireReceipt = { status: null, receivedBytes: 0, complete: false, httpDate: null,
      retryAfter: null, reason: 'yahoo_transport_unknown', completedAt: new Date().toISOString() };
    const captured: Buffer[] = []; let bootstrap = false;
    const stop = (): 'timeout' | 'cancelled' | null => {
      if (performance.now() - started >= 10000) return 'timeout';
      if (!combined.aborted) return null;
      // Gateway deadlines carry fixed reasons; arbitrary caller reasons are never serialized.
      const reason = combined.reason;
      return reason === deadline.reason && deadline.aborted || reason instanceof Error &&
        ['financial_transport_timeout', 'financial_timeout'].includes(reason.message) ? 'timeout' : 'cancelled';
    };
    const checkTime = () => ensure(stop() === null, 'yahoo_cancelled');
    const confirm = (stage: YahooStage): void => {
      if (frozen || confirmed.has(stage)) return;
      const admissionStage = stage === 'request_validated' || stage === 'request_reserved';
      if (!admissionStage) checkTime();
      const next = { stage, at: new Date().toISOString(), elapsedMs: Math.floor(performance.now() - started) };
      if (probe && reserved) {
        try { probe.confirmTransportStage(next); }
        catch (error) { settlementFailed = true; throw error; }
      }
      last = next; confirmed.add(stage); if (!admissionStage) checkTime();
    };
    const diagnose = (error: unknown) => yahooDiagnostic(last, error, receipt.status, wireIntent, stop(), settlementFailed);
    try {
      const qualified = qualifyYahooQuery(query, typeof financialRequest === 'function' ? financialRequest() : financialRequest, symbol);
      if(compatibility){
        if(acceptedCookies!==null)ensure(cookieIdentity()===acceptedCookies,'yahoo_bootstrap_cookie_changed');
        ensure(isCookieBootstrap(query)||qualified.endpoint==='query1.finance.yahoo.com:crumb'||qualified.endpoint==='query1.finance.yahoo.com:chart','yahoo_endpoint');
        if(!isCookieBootstrap(query))ensure(jar.hasAnonymousCookie(new URL(query.url)),'yahoo_bootstrap_cookie_missing');
        if(qualified.endpoint.endsWith(':chart'))ensure(crumb!==null&&query.params.crumb===crumb,'yahoo_crumb_schema');
      }
      confirm('request_validated'); bootstrap = qualified.endpoint.endsWith(':cookie') || qualified.endpoint.endsWith(':crumb');
      if (probe) {
        try { probe.reserve(query, maxBytes); }
        catch (error) {
          // A failed durable reservation may have partially written. It is never refundable.
          // Known custody denials keep their fixed token; unknown I/O failures remain unsettled.
          if (!(error instanceof Error) || !error.message.startsWith('probe_')) settlementFailed = true;
          throw error;
        }
        reserved = true; confirm('request_reserved');
      }
      checkTime();
      ensure(Number.isSafeInteger(maxBytes) && maxBytes > 0 && maxBytes <= 262144, 'yahoo_response_limit');
      const url = new URL(query.url);
      for (const [key, value] of Object.entries(query.params)) url.searchParams.append(key, String(value));
      if (probe && 'beforeDns' in probe) await probe.beforeDns(combined);
      confirm('dns_started');
      const addresses = await new Promise<LookupAddress[]>((resolve, reject) => {
        let done = false;
        const finish = (error: unknown, value?: LookupAddress[]) => {
          if (done) return; done = true; combined.removeEventListener('abort', abort);
          if (error) reject(error); else resolve(value!);
        };
        const abort = () => finish(new Error('yahoo_cancelled'));
        combined.addEventListener('abort', abort, { once: true });
        if (combined.aborted) { abort(); return; }
        try { checkTime(); void wire.lookup(url.hostname, { all: true, verbatim: true }).then(value => finish(null, value), error => finish(error)); }
        catch (error) { finish(error); }
      });
      checkTime(); confirm('dns_resolved');
      ensure(Array.isArray(addresses) && addresses.length > 0 && addresses.length <= 32 &&
        addresses.every(a => a && typeof a.address === 'string' && [4, 6].includes(a.family) &&
          isIP(a.address) === a.family && publicAddress(a.address)), 'yahoo_protected_address');
      const selected = addresses[0]!; confirm('destination_validated');
      if (probe) await probe.beforeWire(combined);
      if(compatibility){
        while(performance.now()-lastResponse<5000){
          checkTime();await sleep(Math.ceil(5000-(performance.now()-lastResponse)),undefined,{signal:combined});
        }
        checkTime();ensure(performance.now()-lastResponse>=5000,'yahoo_bootstrap_interval');
      }
      checkTime(); wireIntent = true; confirm('wire_intent');
      return await new Promise<YahooResponse>((resolve, reject) => {
        let req: ClientRequest | undefined, res: IncomingMessage | undefined;
        const finish = (error: unknown, value?: YahooResponse) => {
          if (frozen) return;
          frozen = true; combined.removeEventListener('abort', abort);
          if (error) {
            // Diagnose before destroy emits secondary reset/abort/close events.
            receipt.diagnostic = diagnose(error); receipt.reason = receipt.diagnostic.code;
            res?.destroy(); req?.destroy(); reject(new YahooTransportError(receipt.diagnostic));
          } else { resolve(value!); }
        };
        const abort = () => finish(new Error('yahoo_cancelled'));
        const guarded = (action: () => void) => {
          if (frozen) return;
          try { checkTime(); action(); } catch (error) { finish(error); }
        };
        combined.addEventListener('abort', abort, { once: true });
        if (combined.aborted) { abort(); return; }
        try {
          // DNS/rate spacing may outlive a cookie. Recheck the actual target immediately before I/O.
          if(compatibility&&acceptedCookies!==null)ensure(cookieIdentity()===acceptedCookies,'yahoo_bootstrap_cookie_changed');
          const cookies = jar.header(url);
          if(compatibility&&(acceptedCookies!==null||!isCookieBootstrap(query)))ensure(cookies.split('; ').some(pair=>/^A3=.+$/.test(pair)),'yahoo_bootstrap_cookie_missing');
          checkTime();
          req = wire.request(url, { method: 'GET', agent: false, signal: combined, rejectUnauthorized: true,
            servername: url.hostname, ...{ family: selected.family, autoSelectFamily: false }, lookup: yahooPinnedLookup(selected), maxHeaderSize: 16384,
            headers: { 'User-Agent': 'BotSquad/0.1 private personal research', 'Accept': 'application/json, text/plain',
              'Accept-Encoding': 'identity', ...(cookies ? { Cookie: cookies } : {}) } }, incoming => {
            // Attach the error sink even to a response arriving after cancellation.
            incoming.on('error', error => finish(error));
            if (frozen) { incoming.destroy(); return; }
            res = incoming;
            guarded(() => {
              receipt.status = Number.isInteger(incoming.statusCode) && incoming.statusCode! >= 100 && incoming.statusCode! <= 599 ? incoming.statusCode! : null;
              confirm('response_headers'); ensure(receipt.status !== null, 'yahoo_response_schema');
              if (probe) {
                receipt.httpDate = safeHttpDate(incoming.headers.date);
                receipt.retryAfter = safeRetryAfter(incoming.headers['retry-after']);
                try { probe.seal({ type: 'response_headers', date: receipt.httpDate, retryAfter: receipt.retryAfter }); }
                catch (error) { settlementFailed = true; throw error; }
              }
              ensure(!incoming.headers['content-encoding'] || incoming.headers['content-encoding'] === 'identity', 'yahoo_compressed_response');
              const length = incoming.headers['content-length'];
              if (length) ensure(/^\d+$/.test(length) && Number(length) <= maxBytes, 'yahoo_response_size');
              if (receipt.status === 200 && !compatibility) jar.accept(url.hostname, incoming.headers['set-cookie'] ?? []);
            });
            if (frozen) return;
            incoming.on('readable', () => guarded(() => {
              while (incoming.readableLength > 0) {
                ensure(receipt.receivedBytes < maxBytes, 'yahoo_response_size');
                const chunk = incoming.read(Math.min(incoming.readableLength, maxBytes - receipt.receivedBytes)) as Buffer | null;
                if (!chunk) break; receipt.receivedBytes += chunk.length; captured.push(chunk);
              }
              if (incoming.readableLength === 0) incoming.read(0);
            }));
            incoming.once('aborted', () => finish(new Error('yahoo_response_aborted')));
            incoming.once('close', () => { if (!frozen) finish(new Error('yahoo_response_incomplete')); });
            incoming.once('end', () => guarded(() => {
              // Preserve BOM as content: stripping it would broaden the literal bootstrap grammar.
              const originalBody = Buffer.concat(captured);
              const body = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(originalBody);
              const response:YahooResponse={ status: receipt.status!, body, contentType: incoming.headers['content-type'] ?? '', retryAfter: incoming.headers['retry-after'] ?? null };
              if(compatibility){try{
                ensure(!incoming.headers.location&&!incoming.headers.refresh&&!incoming.headers['www-authenticate']&&!incoming.headers['proxy-authenticate'],'yahoo_bootstrap_barrier');
                if(isCookieBootstrap(query)&&(response.status===200||response.status===404)){
                  ensure(response.status===404?benignCookie404(response):/^text\/plain(?:;\s*charset=utf-8)?$/i.test(response.contentType)&&!/<|consent|captcha|sign.?in|log.?in|access.denied|forbidden|unauthori[sz]ed|too.many.requests/i.test(body),'yahoo_bootstrap_barrier');
                  // A fresh, usable anonymous cookie must exist in THIS complete response.
                  // The child's empty cookie jar remains empty; never manufacture _cookie=True.
                  const headers=incoming.headers['set-cookie']??[],candidate=new CookieJar();
                  ensure(headers.every(h=>!/^\s*(?:T|Y)\s*=/.test(h)),'yahoo_bootstrap_barrier');
                  candidate.accept(url.hostname,headers);
                  ensure(candidate.hasAnonymousCookie(new URL('https://query1.finance.yahoo.com/v1/test/getcrumb'))&&candidate.hasAnonymousCookie(new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)),'yahoo_bootstrap_cookie_missing');
                  if(acceptedCookies!==null)ensure(cookieIdentity()===acceptedCookies,'yahoo_bootstrap_cookie_changed');
                  jar.accept(url.hostname,headers);
                  const current=cookieIdentity();
                  ensure(acceptedCookies===null||current===acceptedCookies,'yahoo_bootstrap_cookie_changed');
                  acceptedCookies??=current;
                  response.bootstrapCookiePresent=true;
                }else if(qualified.endpoint.endsWith(':crumb')&&response.status===200){
                  ensure(/^text\/plain(?:;\s*charset=utf-8)?$/i.test(response.contentType)&&validCrumb(body),'yahoo_crumb_schema');crumb=body;
                }
                if(response.status!==200&&!(isCookieBootstrap(query)&&benignCookie404(response)&&response.bootstrapCookiePresent))terminal=true;
              }catch{
                // Completed invalid responses have known status/bytes. Preserve them in the
                // gateway ledger without forwarding their body to yfinance or admitting more I/O.
                terminal=true;delete response.bootstrapCookiePresent;response.bootstrapRejected=true;
              }}
              if (compatibility) {
                receipt.bodyHash = createHash('sha256').update(originalBody).digest('hex');
                if (acceptedCookie404(query, response)) receipt.bootstrapDisposition = 'accepted_cookie_404';
                else if (response.bootstrapRejected) receipt.bootstrapDisposition = 'rejected_bootstrap';
              }
              if (probe && !compatibility && receipt.status === 200 && bootstrap) {
                const contentType = incoming.headers['content-type'] ?? '';
                ensure(!/html/i.test(contentType) && !/<(?:!doctype|html|form|script)|consent|captcha|sign.?in|log.?in|access denied/i.test(body), 'yahoo_bootstrap_barrier');
                if (qualified.endpoint.endsWith(':crumb')) ensure(/^[\x21-\x7e]{1,256}$/.test(body) && !/[<>]/.test(body), 'yahoo_crumb_schema');
              }
              confirm('response_complete'); receipt.complete = true;
              receipt.diagnostic = diagnose(null); receipt.reason = receipt.diagnostic.code;
              finish(null, response);
            }));
          });
          req.on('error', error => finish(error));
          req.once('close', () => { if (!frozen && !res) finish(new Error('yahoo_response_incomplete')); });
          req.once('socket', socket => guarded(() => {
            confirm('socket_assigned');
            socket.once('connect', () => guarded(() => confirm('tcp_connected')));
            socket.once('secureConnect', () => guarded(() => confirm('tls_established')));
          }));
          req.once('finish', () => guarded(() => confirm('request_finished')));
          if (frozen) { req.destroy(); return; }
          confirm('request_created'); checkTime(); req.end();
        } catch (error) { finish(error); }
      });
    } catch (error) {
      if(compatibility)terminal=true;
      frozen = true;
      receipt.diagnostic ??= diagnose(error); receipt.reason = receipt.diagnostic.code;
      throw new YahooTransportError(receipt.diagnostic);
    } finally {
      if(compatibility)lastResponse=performance.now();
      frozen = true; receipt.completedAt = new Date().toISOString();
      try {
        if (probe && reserved) probe.received(receipt, bootstrap ? Buffer.alloc(0) : Buffer.concat(captured));
      } catch {
        // Failure to durably settle never makes a response successful or restores allowance.
        throw new YahooTransportError(yahooDiagnostic(last, null, receipt.status, wireIntent, null, true));
      } finally { active = false; }
    }
  } };
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

/** Source-only compatibility validation. No live issuer or existing owner CLI selects this path. */
export function yahooBootstrapOfflineWire(request:FinancialRequest,symbol:string,wire:YahooWire):YahooTransport {
  ensure(wire.lookup!==lookup&&wire.request!==httpsRequest,'yahoo_offline_wire_requires_fakes');
  return boundedSession(request,symbol,wire,undefined,true);
}

/** A consumed host capability is required; fixture capabilities cannot select real DNS/HTTPS. */
export function yahooProbeTransport(probe:FinancialCustody,wire?:YahooWire):YahooTransport {
  assertFinancialCustody(probe);
  if(isOwnerFinancialCustody(probe))ensure(wire===undefined,'probe_real_wire_not_injectable');
  else ensure(wire&&wire.lookup!==lookup&&wire.request!==httpsRequest,'probe_fixture_requires_fake_wire');
  const transport=boundedSession(()=>probe.request,'AAPL',wire??{lookup,request:httpsRequest},probe,isBootstrapHistoryFixture(probe));
  probe.bindTransport(transport);return transport;
}
