import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { chart, fixture, request } from './fixtures/yahoo/support.js';
import { bytesHash } from '../src/domain/market/validation.js';
import type { YahooQuery, YahooResponse } from '../src/domain/market/financial.js';

const at='2026-10-12T20:00:00.000Z';
const r=request('ohlcv',{instrumentId:'AAPL',start:'2026-09-01',end:'2026-10-01'});
const query:YahooQuery={method:'GET',url:'https://query1.finance.yahoo.com/v8/finance/chart/AAPL',params:{period1:1788235200,period2:1790827200,interval:'1d',includePrePost:false,events:'div,splits,capitalGains'}};
function setup(t:TestContext,modify?:(data:ReturnType<typeof chart>)=>void,reply?:Partial<YahooResponse>){
 assert.ok(existsSync('adapters/yahoo/.venv/bin/python'),'Pinned Python required; no skipped acceptance');
 const f=fixture({at,policy:{reviewedAt:at,expiresAt:'2026-10-13T00:00:00Z',maxRequests:1,cacheMs:0},scope:{instrumentIds:['AAPL'],approvedAt:at,expiresAt:'2026-10-13T00:00:00Z',maxRequests:1,maxRetries:0,maxTotalBytes:262144,timeoutMs:120000},adapter:new PythonYahooAdapter(undefined,'hq-ready-03h-direct-chart')});
 t.after(f.close);
 f.market.register({id:'AAPL',venue:'XNAS',currency:'USD',source:'synthetic:authored-aapl',symbols:[{symbol:'AAPL',from:'2026-09-01',until:null}]},'instrument',at);
 const data=chart(),row=data.chart.result[0]!,sessions=f.calendar.calendar.sessions.filter(s=>s.status==='open'&&s.date>='2026-09-01'&&s.date<'2026-10-01');
 row.meta.symbol='AAPL';row.meta.exchangeName='NMS';row.timestamp=sessions.map(s=>Date.parse(s.open)/1000);
 row.indicators.quote=[{open:sessions.map(()=>10),high:sessions.map(()=>12),low:sessions.map(()=>9),close:sessions.map(()=>11),volume:sessions.map(()=>100)}];
 row.indicators.adjclose=[{adjclose:sessions.map(()=>8)}];row.events={dividends:{},splits:{}} as never;
 modify?.(data);
 const response:YahooResponse={status:200,body:JSON.stringify(data),contentType:'application/json',retryAfter:null,...reply};
 const queries:YahooQuery[]=[];
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(q){queries.push(structuredClone(q));assert.deepEqual(q,query);assert.equal(queries.length,1);return response;}});
 return {...f,response,queries,gateway,collect:(id='direct',signal?:AbortSignal)=>gateway.collect(f.policy.id,r,id,signal)};
}
test('direct captured chart uses actual pinned parser and gateway once without bootstrap or fabricated state',async t=>{
 const f=setup(t),result=await f.collect();assert.equal(result.status,'ok',result.reason);assert.deepEqual(f.queries,[query]);
 const e=f.store.observation(result.observationId!);
 assert.equal(e.records.length,21);assert.deepEqual(e.missingSessions,[]);assert.equal(e.rawResponses.length,1);
 assert.equal(e.rawResponses[0]!.body,f.response.body);assert.equal(e.rawResponses[0]!.sha256,bytesHash(f.response.body));
 assert.equal(e.records[0]!.kind==='ohlcv'&&e.records[0]!.open,'10');assert.equal(e.records[0]!.kind==='ohlcv'&&e.records[0]!.adjustedClose,'8');
 assert.equal(e.providerAvailableAt,null);assert.equal(e.knownAt,at);assert.equal(e.executionQualified,false);assert.equal(e.adjustment,'provider_split_basis_unqualified');
 assert.deepEqual(e.versions,{python:'3.12.12',yfinance:'1.7.0'});
 f.admission.deliver(e.id,'fixture-reader','delivery');assert.throws(()=>f.admission.decisionEvidence('delivery','fixture-reader','2026-09-30T20:00:00Z'),/financial_lookahead/);
 assert.deepEqual(await f.collect(),result);assert.equal(f.queries.length,1);
 assert.notEqual((await f.collect('second')).status,'ok');assert.equal(f.queries.length,1);
});
for(const field of ['symbol','currency','exchangeName','exchangeTimezoneName','instrumentType','dataGranularity'])test(`direct parser rejects missing ${field} from captured metadata`,async t=>{
 const f=setup(t,data=>{delete (data.chart.result[0]!.meta as unknown as Record<string,unknown>)[field];}),result=await f.collect();
 assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(f.queries.length,1);
});
for(const [field,value] of [['symbol','OTHER'],['currency','CAD'],['exchangeName','NYQ'],['exchangeTimezoneName','UTC'],['instrumentType','ETF'],['dataGranularity','1h']])test(`direct parser rejects wrong ${field}`,async t=>{
 const f=setup(t,data=>{(data.chart.result[0]!.meta as unknown as Record<string,unknown>)[field!]=value;}),result=await f.collect();
 assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(f.queries.length,1);
});
test('direct parser retains explicit missing volume and missing scheduled session',async t=>{
 const f=setup(t,data=>{const row=data.chart.result[0]!;row.timestamp.pop();for(const values of Object.values(row.indicators.quote[0]!))values.pop();row.indicators.adjclose[0]!.adjclose.pop();(row.indicators.quote[0]!.volume as (number|null)[])[0]=null;}),result=await f.collect();
 assert.equal(result.status,'ok',result.reason);const e=f.store.observation(result.observationId!);assert.equal(e.records.length,20);assert.deepEqual(e.missingSessions,['2026-09-30']);assert.ok(e.issues.includes('partial'));assert.equal(e.records[0]!.kind==='ohlcv'&&e.records[0]!.volume,null);
});
for(const duplicate of ['timestamp','session'])test(`direct rejects duplicate ${duplicate} instead of yfinance dropping bars`,async t=>{
 const f=setup(t,data=>{const row=data.chart.result[0]!;row.timestamp[1]=row.timestamp[0]!+(duplicate==='session'?60:0);}),result=await f.collect();assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(f.queries.length,1);
});
for(const status of [301,401,403,404,429,500,502,503,504])test(`direct HTTP ${status} stops once without fallback`,async t=>{
 const f=setup(t,undefined,{status}),result=await f.collect();assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(f.queries.length,1);
 assert.equal(f.db.get<{status:number}>('SELECT status FROM financial_attempt_results')!.status,status);
});
for(const body of ['{invalid','{"chart":{"error":{"code":"Unauthorized"},"result":null}}','{"chart":{"error":null,"result":[]}}','<html>consent</html>'])test('direct malformed/denied/empty chart stops once',async t=>{
 const f=setup(t,undefined,{body}),result=await f.collect();assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(f.queries.length,1);
});

for(const mode of ['normal','extra','alternate'])test(`production direct parser guards YfData/native transport and captured reads: ${mode}`,t=>{
 const f=setup(t);
 const input=JSON.stringify({protocol:'yahoo-yfinance-v1',input:{symbol:'AAPL',request:r}})+'\n'+JSON.stringify({type:'response',id:1,response:f.response})+'\n';
 const child=spawnSync('adapters/yahoo/.venv/bin/python',['-I','-B','test/fixtures/yahoo/direct_parser_guard.py',mode],{input,encoding:'utf8',timeout:15000,env:{PATH:'/usr/bin:/bin',LANG:'C.UTF-8',OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1'}});
 const messages=child.stdout.trim().split('\n').map(line=>JSON.parse(line));
 assert.deepEqual(messages.filter(m=>m.type==='request').map(m=>m.query),[query]);
 assert.equal(child.status,mode==='normal'?0:1,child.stderr);
 assert.equal(messages.at(-1).type,mode==='normal'?'result':'error');
 if(mode!=='normal')assert.equal(messages.at(-1).code,'python_captured_chart_scope');
});

for(const token of ['NaN','Infinity','-Infinity'])test(`direct rejects non-JSON numeric literal ${token}`,async t=>{
 const f=setup(t);f.response.body=f.response.body.replace('"open":[10,','"open":['+token+',');
 const result=await f.collect();assert.equal(result.observationId,null);assert.equal(result.reason,'python_direct_json');assert.equal(f.queries.length,1);
});
test('direct rejects duplicate JSON keys',async t=>{
 const f=setup(t);f.response.body=f.response.body.replace('"symbol":"AAPL"','"symbol":"AAPL","symbol":"AAPL"');
 assert.equal((await f.collect()).reason,'python_direct_json');assert.equal(f.queries.length,1);
});
test('direct cancellation closes actual Python before any second exchange',async()=>{
 const controller=new AbortController();let reached!:()=>void;const ready=new Promise<void>(r=>{reached=r;});let calls=0;
 const read=new PythonYahooAdapter(undefined,'hq-ready-03h-direct-chart').read({symbol:'AAPL',request:r},async q=>{calls++;assert.deepEqual(q,query);reached();return new Promise(()=>{});},controller.signal);
 await ready;controller.abort();await assert.rejects(read,/financial_cancelled/);assert.equal(calls,1);
});

test('direct rejects multiple top-level chart results',async t=>{
 const f=setup(t,data=>{data.chart.result.push(structuredClone(data.chart.result[0]!));}),result=await f.collect();assert.equal(result.observationId,null);assert.equal(result.reason,'python_chart_schema');assert.equal(f.queries.length,1);
});

for(const [field,value] of [['volume',true],['volume','100'],['volume',100.9],['volume',-1],['volume',9007199254740992],['open',true],['open','10'],['adjclose',false]])test(`direct rejects original numeric coercion ${field}:${JSON.stringify(value)}`,async t=>{
 const f=setup(t,data=>{const row=data.chart.result[0]!,values=field==='adjclose'?row.indicators.adjclose[0]!.adjclose:(row.indicators.quote[0]! as unknown as Record<string,unknown[]>)[String(field)]!;(values as unknown[])[0]=value;}),result=await f.collect();assert.equal(result.observationId,null);assert.equal(result.reason,'python_direct_numeric_schema');assert.equal(f.queries.length,1);
});
for(const edit of [{numerator:true},{denominator:'2'},{denominator:0},{date:true},{date:1788276600.5}])test(`direct rejects original action coercion ${JSON.stringify(edit)}`,async t=>{
 const f=setup(t,data=>{const row=data.chart.result[0]!,stamp=row.timestamp[0]!;row.events={splits:{[stamp]:{date:stamp,numerator:2,denominator:1,splitRatio:'2:1',...edit}}} as never;}),result=await f.collect();assert.equal(result.observationId,null);assert.equal(result.reason,'python_direct_action_schema');assert.equal(f.queries.length,1);
});
