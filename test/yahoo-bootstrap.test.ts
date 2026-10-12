import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { yahooBootstrapOfflineWire, type YahooWire } from '../src/control/market/yahoo-https.js';
import { acceptedCookie404, isCookieBootstrap } from '../src/domain/market/yahoo-bootstrap.js';
import { qualifyYahooQuery } from '../src/domain/market/yahoo-transport.js';
import { historyManifest } from '../src/control/market/yahoo-history-manifest.js';
import type { YahooQuery, YahooResponse } from '../src/domain/market/financial.js';
import { fixture, chart, request } from './fixtures/yahoo/support.js';

const at='2026-10-12T20:00:00.000Z', cookie='A3=authored-private-cookie; Domain=.yahoo.com; Path=/; Secure; HttpOnly';
const r=request('ohlcv',{instrumentId:'AAPL',start:'2026-09-01',end:'2026-10-01'});
const cookieQuery:YahooQuery={method:'GET',url:'https://fc.yahoo.com/',params:{}};
type Reply=YahooResponse & {headers:IncomingMessage['headers'];pending?:boolean};
function setup(t:TestContext,change?:(reply:Reply,q:YahooQuery,n:number)=>void,realClock=false,totalBytes=1048576){
 assert.ok(existsSync('adapters/yahoo/.venv/bin/python'),'pinned Python required; no skipped acceptance');
 let mono=0;
 const prepared=realClock?new Date().toISOString():at,expires=new Date(Date.parse(prepared)+86400000).toISOString();
 if(!realClock)t.mock.method(performance,'now',()=>mono);
 const f=fixture({at:prepared,
  policy:{reviewedAt:prepared,expiresAt:expires,maxRequests:6,cacheMs:0},
  scope:{instrumentIds:['AAPL'],approvedAt:prepared,expiresAt:expires,maxRequests:6,maxRetries:0,maxTotalBytes:totalBytes,timeoutMs:120000},
  adapter:new PythonYahooAdapter(undefined,'hq-ready-03f-offline-bootstrap')});
 t.after(f.close);
 f.market.register({id:'AAPL',venue:'XNAS',currency:'USD',source:'synthetic:authored-aapl',symbols:[{symbol:'AAPL',from:'2026-09-01',until:null}]},'instrument',at);
 const c=chart(),row=c.chart.result[0]!;
 const sessions=f.calendar.calendar.sessions.filter(s=>s.status==='open'&&s.date>='2026-09-01'&&s.date<'2026-10-01');
 row.meta.symbol='AAPL';row.meta.exchangeName='NMS';row.timestamp=sessions.map(s=>Date.parse(s.open)/1000);
 row.indicators.quote=[{open:sessions.map(()=>10),high:sessions.map(()=>12),low:sessions.map(()=>9),close:sessions.map(()=>11),volume:sessions.map(()=>100)}];
 row.indicators.adjclose=[{adjclose:sessions.map(()=>11)}];row.events={dividends:{},splits:{}} as never;
 const queries:YahooQuery[]=[],starts:number[]=[],completions:number[]=[],headers:RequestOptions['headers'][]=[];
 let dns=0;let late:()=>void=()=>{};let onLookup:(n:number)=>void=()=>{};
 const wire:YahooWire={lookup:(async()=>{dns++;if(!realClock)mono+=5000;onLookup(dns);return [{address:'1.1.1.1',family:4}];}) as unknown as typeof lookup,
  request:((url:URL,opts:RequestOptions,cb:(res:IncomingMessage)=>void)=>{
   const q:YahooQuery={method:'GET',url:url.origin+url.pathname,params:Object.fromEntries(url.searchParams)};
   queries.push(q);starts.push(performance.now());headers.push(opts.headers);
   assert.equal(opts.rejectUnauthorized,true);assert.equal(opts.family,4);assert.equal((opts as RequestOptions&{autoSelectFamily:boolean}).autoSelectFamily,false);
   const bootstrap=isCookieBootstrap(q),crumb=url.pathname.endsWith('/getcrumb');
   const reply:Reply={status:bootstrap?404:200,body:bootstrap?'Not Found':crumb?'authored-crumb':JSON.stringify(c),contentType:bootstrap||crumb?'text/plain':'application/json',retryAfter:null,headers:bootstrap?{'set-cookie':[cookie]}:{}};
   change?.(reply,q,queries.length);
   const req=new EventEmitter() as ClientRequest;req.destroy=(()=>req) as ClientRequest['destroy'];
   req.end=(()=>{queueMicrotask(()=>{
    const res=new PassThrough() as unknown as IncomingMessage;res.statusCode=reply.status;res.headers={'content-type':reply.contentType,...reply.headers};cb(res);
    if(!realClock)f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());
    res.once('end',()=>completions.push(performance.now()));late=()=>{(res as unknown as PassThrough).end(reply.body);};if(!reply.pending)late();
   });return req;}) as ClientRequest['end'];return req;
  }) as typeof httpsRequest};
 const transport=yahooBootstrapOfflineWire(r,'AAPL',wire),clock=realClock?{now:()=>new Date().toISOString()}:f.clock;
 const gateway=new FinancialDataGateway(f.store,clock,f.adapter,transport);
 return {...f,queries,headers,starts,completions,transport,gateway,get dns(){return dns;},late:()=>late(),onLookup:(hook:(n:number)=>void)=>{onLookup=hook;},collect:(id='bootstrap',signal?:AbortSignal)=>gateway.collect(f.policy.id,r,id,signal)};
}

test('pinned upstream source semantics: 404, missing cookies, no-crumb and retry behavior with authored sessions',()=>{
 const result=spawnSync('adapters/yahoo/.venv/bin/python',['-I','-B','test/fixtures/yahoo/upstream_bootstrap.py'],{encoding:'utf8',env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',OPENBLAS_NUM_THREADS:'1'},timeout:15000});
 assert.equal(result.status,0,result.stderr);assert.match(result.stderr,/Ran 5 tests/);
});
test('real pinned yfinance: bootstrap404 -> crumb -> fictional AAPL through complete corrected gateway',async t=>{
 const f=setup(t),result=await f.collect();assert.equal(result.status,'ok',result.reason);
 assert.equal(f.queries.length,6);assert.equal(f.dns,6);
 const expected=historyManifest(at,'a'.repeat(64)).sequence;
 assert.deepEqual(f.queries.map(q=>qualifyYahooQuery(q,r,'AAPL')),expected.map(q=>qualifyYahooQuery(q,r,'AAPL')));
 const statuses=f.db.all<{status:number;reason:string}>('SELECT status,reason FROM financial_attempt_results ORDER BY rowid');
 assert.deepEqual(statuses.map(s=>s.status),[404,404,200,200,404,200]);
 assert.equal(statuses.filter(s=>s.reason==='yahoo_cookie_bootstrap_404').length,3);
 const e=f.store.observation(result.observationId!);
 assert.equal(e.records.length,21);assert.equal(e.rawResponses.length,2);assert.deepEqual(e.missingSessions,[]);
 assert.equal(e.records[0]!.kind==='ohlcv'&&e.records[0]!.open,'10');assert.equal(e.providerAvailableAt,null);
 assert.equal(e.executionQualified,false);assert.ok(e.issues.includes('unqualified_adjustment'));assert.equal(e.knownAt,e.firstRetrievedAt);
 assert.ok(e.firstRetrievedAt>=at);assert.ok(!JSON.stringify(e).includes('authored-private-cookie'));assert.ok(!JSON.stringify(e).includes('authored-crumb'));
 assert.equal((f.headers[2] as Record<string,string>).Cookie,'A3=authored-private-cookie');
 assert.ok(f.queries.filter(q=>q.url.includes('/chart/')).every(q=>q.params.crumb==='authored-crumb'));
 assert.deepEqual(await f.collect(),result);assert.equal(f.queries.length,6);
 assert.notEqual((await f.collect('seventh')).status,'ok');assert.equal(f.queries.length,6);
 f.admission.deliver(e.id,'fixture-consumer','delivery');
 assert.throws(()=>f.admission.decisionEvidence('delivery','fixture-consumer','2026-09-30T20:00:00Z'),/financial_lookahead/);
});
for(const status of [200,404])test(`missing cookie on bootstrap HTTP${status} is never treated as a session`,async t=>{
 const f=setup(t,reply=>{reply.status=status;reply.headers={};});const result=await f.collect();assert.equal(result.status,'unavailable',result.reason);assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,1);
});
for(const badCookie of ['', 'A3=; Domain=.yahoo.com; Path=/; Secure', 'A3=x; Domain=.yahoo.com; Path=/; Secure; Max-Age=0','A3=x; Path=/; Secure','A3=x; Domain=.yahoo.com; Path=/wrong; Secure','A3=x; Domain=.yahoo.com; Path=/v1/test/getcrumb; Secure','A3=x; Domain=.evil.test; Path=/; Secure','A3=x; Domain=.yahoo.com; Path=/','T=login; Domain=.yahoo.com; Path=/; Secure'])test(`unusable or login cookie is blocked: ${badCookie}`,async t=>{
 const f=setup(t,reply=>{reply.headers={'set-cookie':badCookie?[badCookie]:[]};});const result=await f.collect();assert.equal(result.status,'unavailable',result.reason);assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,1);
});
for(const body of ['consent required','<html>Not Found</html>','Access Denied','Please log in','CAPTCHA','Forbidden','unknown response','Not Found\nAccess denied','Not Found\u0000','Not Found\r','Not Found\n\n'])test(`unrecognized/barrier 404 fails closed: ${JSON.stringify(body)}`,async t=>{
 const f=setup(t,reply=>{reply.body=body;});const result=await f.collect();assert.equal(result.status,'unavailable',result.reason);assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,1);
});
for(const status of [401,403,429,302,404,503])for(const ordinal of [1,3,4].filter(n=>status!==404||n!==1))test(`HTTP${status} at ordinal${ordinal} never invokes library fallback`,async t=>{
 const f=setup(t,(reply,_q,n)=>{if(n===ordinal){reply.status=status;reply.body='Not Found';}});
 const result=await f.collect();assert.notEqual(result.status,'ok');assert.notEqual(result.status,'unknown');assert.equal(f.queries.length,ordinal);assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid DESC LIMIT 1')!.status,status);
});
for(const body of ['', '<html>consent</html>','Too Many Requests','invalid crumb','crumb\n','x'.repeat(257)])test(`invalid crumb stops before chart: ${body.slice(0,25)}`,async t=>{
 const f=setup(t,(reply,_q,n)=>{if(n===3)reply.body=body;});const result=await f.collect();assert.equal(result.status,'unavailable');assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,3);assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid DESC LIMIT 1')!.status,200);
});
for(const problem of ['html','location','refresh','authentication','oversize','content_length','encoding','changed_cookie'] as const)test(`response controls retained: ${problem}`,async t=>{
 const f=setup(t,(reply,_q,n)=>{
  if(problem==='changed_cookie'){if(n===5)reply.headers={'set-cookie':[cookie.replace('authored-private-cookie','changed')]};return;}
  if(n!==1)return;
  if(problem==='html')reply.contentType='text/html';
  if(problem==='location')reply.headers.location='https://consent.yahoo.com/';
  if(problem==='refresh')reply.headers.refresh='0; url=https://consent.yahoo.com/';
  if(problem==='authentication')reply.headers['www-authenticate']='Basic';
  if(problem==='oversize')reply.body='x'.repeat(262145);
  if(problem==='content_length')reply.headers['content-length']='262145';
  if(problem==='encoding')reply.headers['content-encoding']='gzip';
 });
 const result=await f.collect();assert.equal(result.status,['oversize','content_length','encoding'].includes(problem)?'unknown':'unavailable',result.reason);assert.equal(f.queries.length,problem==='changed_cookie'?5:1);
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/terminal/);
});
test('second bootstrap cannot rotate the parent cookie before crumb acquisition',async t=>{
 const f=setup(t,(reply,_q,n)=>{if(n===2)reply.headers={'set-cookie':[cookie.replace('authored-private-cookie','rotated-before-crumb')]};});
 const result=await f.collect();assert.equal(result.status,'unavailable',result.reason);assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,2);
 assert.deepEqual(f.db.all<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid').map(row=>row.status),[404,404]);
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_observations')!.n,0);
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/terminal/);assert.equal(f.queries.length,2);
});
test('expired first cookie cannot authorize another bootstrap or DNS lookup',async t=>{
 let now=Date.now();t.mock.method(Date,'now',()=>now);
 const f=setup(t,reply=>{reply.headers['set-cookie']=[cookie+'; Max-Age=1'];});
 await f.transport.exchange(cookieQuery,new AbortController().signal,262144);now+=2000;
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/yahoo_destination_denied/);
 assert.equal(f.queries.length,1);assert.equal(f.dns,1);
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/terminal/);
});
test('second bootstrap cannot renew expired state during its response even with the same cookie',async t=>{
 let now=Date.now();t.mock.method(Date,'now',()=>now);
 const f=setup(t,(reply,_q,n)=>{reply.headers['set-cookie']=[cookie+'; Max-Age=1'];if(n===2)now+=2000;});
 const result=await f.collect();assert.equal(result.status,'unavailable',result.reason);assert.equal(result.reason,'yahoo_bootstrap_rejected');assert.equal(f.queries.length,2);
 assert.deepEqual(f.db.all<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid').map(row=>row.status),[404,404]);
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_observations')!.n,0);
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/terminal/);
});
test('404 exception cannot apply to other endpoint, path, parameters or absent parent verdict',()=>{
 const response:YahooResponse={status:404,body:'Not Found',contentType:'text/plain',retryAfter:null,bootstrapCookiePresent:true};
 for(const body of ['Not Found','Not Found\n','Not Found\r\n','404 Not Found','404 Not Found\n','404 Not Found\r\n'])assert.equal(acceptedCookie404(cookieQuery,{...response,body}),true);
 for(const q of [{...cookieQuery,url:'https://fc.yahoo.com/elsewhere'},{...cookieQuery,url:'https://fc.yahoo.com/?'},{...cookieQuery,url:'https://query1.finance.yahoo.com/v1/test/getcrumb'},{...cookieQuery,params:{crumb:'x'}}])assert.equal(acceptedCookie404(q,response),false);
 assert.equal(acceptedCookie404(cookieQuery,{...response,bootstrapCookiePresent:undefined}),false);
 assert.throws(()=>yahooBootstrapOfflineWire(r,'AAPL',{lookup,request:httpsRequest}),/requires_fakes/);
});
test('Python bridge itself rejects unqualified404 and missing cookie, preserving legacy200-only behavior',async()=>{
 for(const profile of ['hq-ready-03e-query1-only','hq-ready-03f-offline-bootstrap'] as const){
  let calls=0;await assert.rejects(()=>new PythonYahooAdapter(undefined,profile).read({symbol:'AAPL',request:r},async()=>{calls++;return {status:404,body:'Not Found',contentType:'text/plain',retryAfter:null};},new AbortController().signal),/python_adapter_failure/);assert.equal(calls,1);
 }
});
test('fictional incomplete AAPL sessions and missing fields stay explicit after bootstrap404',async t=>{
 const f=setup(t,(reply,_q,n)=>{if(n!==6)return;const d=JSON.parse(reply.body),row=d.chart.result[0];row.timestamp.splice(1,1);for(const a of Object.values(row.indicators.quote[0]) as unknown[][])a.splice(1,1);row.indicators.adjclose[0].adjclose.splice(1,1);row.indicators.quote[0].volume[0]=null;reply.body=JSON.stringify(d);});
 const result=await f.collect();assert.equal(result.status,'ok',result.reason);const e=f.store.observation(result.observationId!);
 assert.equal(e.records.length,20);assert.equal(e.missingSessions.length,1);assert.ok(e.issues.includes('partial'));assert.equal(e.records[0]!.kind==='ohlcv'&&e.records[0]!.volume,null);
});
test('real-clock corrected six-request sequence waits five seconds after each completed response',async t=>{
 const f=setup(t,undefined,true),result=await f.collect();assert.equal(result.status,'ok',result.reason);
 assert.equal(f.starts.length,6);for(let n=1;n<6;n++)assert.ok(f.starts[n]!-f.completions[n-1]!>=5000,`${n}: ${f.starts[n]!-f.completions[n-1]!}`);
});

test('cookie expiry during DNS is rechecked before the next wire',async t=>{
 let now=Date.now();t.mock.method(Date,'now',()=>now);
 const f=setup(t,reply=>{if(reply.headers['set-cookie'])reply.headers['set-cookie']=[cookie+'; Max-Age=1'];});
 f.onLookup(n=>{if(n===3)now+=2000;});
 const result=await f.collect();assert.equal(result.status,'unknown');assert.equal(f.queries.length,2);assert.equal(f.dns,3);
 assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid DESC LIMIT 1')!.status,0);
});
test('cancellation during compatibility response spacing admits no second socket',async t=>{
 const f=setup(t,undefined,true),controller=new AbortController();
 await f.transport.exchange(cookieQuery,controller.signal,262144);
 const pending=f.transport.exchange(cookieQuery,controller.signal,262144);
 await new Promise(resolve=>setTimeout(resolve,30));controller.abort();
 await assert.rejects(()=>pending,/cancelled/);assert.equal(f.queries.length,1);assert.equal(f.dns,2);
 await assert.rejects(()=>f.transport.exchange(cookieQuery,new AbortController().signal,262144),/terminal/);
});
test('cancellation after accepted404 retains uncertainty; late response cannot deliver or replay',async t=>{
 let reached!:()=>void;const ready=new Promise<void>(resolve=>{reached=resolve;});
 const f=setup(t,(reply,_q,n)=>{if(n===2){reply.pending=true;reached();}}),controller=new AbortController();
 const pending=f.collect('cancelled',controller.signal);await ready;controller.abort();const result=await pending;
 assert.equal(result.status,'unknown');assert.equal(f.queries.length,2);f.late();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(f.db.all<{status:number}>('SELECT status FROM financial_attempt_results ORDER BY rowid').map(row=>row.status),[404,0]);
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_observations')!.n,0);
 assert.deepEqual(await f.collect('cancelled'),result);assert.equal((await f.collect('after-cancel')).reason,'financial_provider_uncertain_or_busy');assert.equal(f.queries.length,2);
});
test('SIGKILL after accepted404 preserves its actual status and consumed allowance without replay',async t=>{
 const f=setup(t),url=(p:string)=>new URL(`../src/${p}.js`,import.meta.url).href;
 const script=`import {Store} from ${JSON.stringify(url('persistence/store'))};import {MarketStore} from ${JSON.stringify(url('control/market/store'))};import {FinancialStore} from ${JSON.stringify(url('control/market/financial-store'))};import {FinancialDataGateway} from ${JSON.stringify(url('control/market/financial-gateway'))};
 const db=new Store(process.argv[1]),store=new FinancialStore(new MarketStore(db));
 const adapter={kind:'yahoo-yfinance-v1',read:async(_,exchange)=>{await exchange(${JSON.stringify(cookieQuery)});process.kill(process.pid,'SIGKILL');}};
 const transport={kind:'authored_yahoo_fixture',exchange:async()=>({status:404,body:'Not Found',contentType:'text/plain',retryAfter:null,bootstrapCookiePresent:true})};
 await new FinancialDataGateway(store,{now:()=>${JSON.stringify(at)}},adapter,transport).collect('yahoo-fixture',${JSON.stringify(r)},'crashed');`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script,f.path],{encoding:'utf8',timeout:15000});assert.equal(child.signal,'SIGKILL',child.stderr);
 assert.equal((await f.collect('crashed')).status,'unknown');assert.equal((await f.collect('replacement')).reason,'financial_provider_uncertain_or_busy');assert.equal(f.queries.length,0);
 assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results')!.status,404);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_attempts')!.n,1);
 assert.throws(()=>f.store.initialize({...f.scope,maxRequests:7}),/cannot_refill/);
});

for(const status of [403,429,404,503])test(`HTTP${status} with barrier headers preserves backoff across fresh transport`,async t=>{
 const f=setup(t,reply=>{reply.status=status;reply.headers.location='https://consent.yahoo.com/';reply.headers['retry-after']='600';});
 const result=await f.collect();assert.equal(result.reason,status===403?'yahoo_access_blocked':status===429?'yahoo_rate_limited':'yahoo_bootstrap_rejected');assert.ok(result.retryAt);
 assert.equal(result.retryAt,status===403?f.scope.expiresAt:new Date(Date.parse(f.clock.now())+(status===404?60000:600000)).toISOString());
 assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results')!.status,status);
 let calls=0;const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(){calls++;throw new Error('should_not_run');}});
 const next=await gateway.collect(f.policy.id,r,'new-transport');assert.equal(next.reason,'financial_provider_circuit');assert.equal(calls,0);assert.equal(f.queries.length,1);
});

test('accepted404 bytes consume aggregate capacity before any second attempt',async t=>{
 const f=setup(t,undefined,false,262144),result=await f.collect();assert.equal(result.reason,'financial_byte_limit');assert.equal(f.queries.length,1);assert.equal(f.dns,1);
 assert.deepEqual(f.db.all<{status:number;bytes:number}>('SELECT status,bytes FROM financial_attempt_results').map(row=>({...row})),[{status:404,bytes:9}]);
});
