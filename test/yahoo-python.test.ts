import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { fixture,request,responseFor,chart } from './fixtures/yahoo/support.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import type { YahooQuery } from '../src/domain/market/financial.js';
const skip=!existsSync(new URL('../../adapters/yahoo/.venv/bin/python',import.meta.url))?'Pinned isolated Python dependencies are not installed':false;
test('actual Python cancellation closes the child while a fixture exchange is pending',{skip},async()=>{
 const controller=new AbortController();let reached!:()=>void;const ready=new Promise<void>(r=>{reached=r;});
 const read=new PythonYahooAdapter().read({symbol:'ACME',request:request()},async()=>{reached();return new Promise(()=>{});},controller.signal);
 await ready;controller.abort();await assert.rejects(read,/financial_cancelled/);
});
for(const klass of ['ohlcv','actions','fundamentals','statement'] as const)test(`pinned actual yfinance ${klass} uses exclusively authored fixture HTTP via gateway`,{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);const r=await f.gateway.collect(f.policy.id,request(klass),klass);
 assert.equal(r.status,'ok',JSON.stringify({r,queries:f.queries}));const e=f.store.observation(r.observationId!);assert.equal(e.versions.yfinance,'1.7.0');assert.equal(e.versions.python,'3.12.12');assert.ok(e.records.length>0);
 assert.ok(f.queries.some(q=>q.url.includes('fc.yahoo.com')));assert.ok(f.queries.some(q=>q.url.includes('getcrumb')));
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM financial_attempts')!.n,f.queries.length);
 assert.ok(!e.rawResponses.some(r=>r.endpoint.endsWith(':crumb')||r.endpoint.endsWith(':cookie')));
 if(klass==='ohlcv'){const bars=e.records.filter(r=>r.kind==='ohlcv');assert.equal(bars[0]!.open,'100.125');assert.equal(bars[0]!.adjustedClose,'51');assert.equal(bars[1]!.providerEventAt,'2026-03-09T13:30:00Z');}
});
for(const statement of ['income','balance_sheet','cash_flow'] as const)for(const frequency of ['annual','quarterly'] as const)test(`pinned financial statement ${statement}/${frequency}`,{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);const result=await f.gateway.collect(f.policy.id,request('statement',{statement,frequency}),statement+'-'+frequency);
 assert.equal(result.status,'ok',JSON.stringify({result,queries:f.queries}));const e=f.store.observation(result.observationId!);assert.ok(e.records.some(r=>r.kind==='statement'&&r.frequency===frequency));assert.equal(e.providerAvailableAt,null);
});
test('actual yfinance cannot silently convert null source volume to zero',{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(q){f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());const response=responseFor(q);if(q.url.includes('/chart/')){const data=chart();(data.chart.result[0]!.indicators.quote[0]!.volume as (number|null)[])[0]=null;response.body=JSON.stringify(data);}return response;}});
 const result=await gateway.collect(f.policy.id,request(),'missing-volume');assert.equal(result.status,'ok',result.reason);const e=f.store.observation(result.observationId!);assert.ok(e.issues.includes('missing'));const bar=e.records[0]!;assert.equal(bar.kind==='ohlcv'&&bar.volume,null);
});
test('actual library 403 stops before strategy/consent fallback; direct process requests cannot escape parent',{skip},async t=>{
 let calls=0;const f=fixture({adapter:new PythonYahooAdapter(),transport:{kind:'authored_yahoo_fixture',async exchange(){calls++;return {status:403,body:'fixture-block',contentType:'text/plain',retryAfter:null};}}});t.after(f.close);
 const r=await f.gateway.collect(f.policy.id,request(),'blocked');assert.equal(r.reason,'yahoo_access_blocked');assert.equal(calls,1);
 const adapter=new PythonYahooAdapter();const controller=new AbortController();let invoked=false;
 await assert.rejects(()=>adapter.read({symbol:'../../escape',request:request()},async(_q:YahooQuery)=>{invoked=true;throw new Error('must_not_run');},controller.signal),/python_symbol/);assert.equal(invoked,false);
});

for(const reportingCurrency of ['CAD',null])test(`actual library retains distinct/missing financial currency: ${reportingCurrency}`,{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(q){
  f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());const response=responseFor(q);
  if(q.url.includes('/v7/finance/quote')){const data=JSON.parse(response.body);data.quoteResponse.result[0].financialCurrency=reportingCurrency;response.body=JSON.stringify(data);}return response;
 }});
 const result=await gateway.collect(f.policy.id,request('fundamentals',{fields:['marketCap','totalRevenue']}),'currencies');assert.equal(result.status,'ok',result.reason);
 const e=f.store.observation(result.observationId!),cap=e.records[0]!,revenue=e.records[1]!;assert.equal(e.currency,'USD');assert.equal(cap.kind==='fundamental'&&cap.unit,'USD');
 assert.equal(revenue.kind==='fundamental'&&revenue.unit,reportingCurrency??'unqualified');assert.equal(e.issues.includes('unknown_unit'),reportingCurrency===null);
});

for(const currency of ['CAD',null])test(`actual actions preserve currency and their own event time: ${currency}`,{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);
 const dividendAt='2026-03-09T14:15:00Z',splitAt='2026-03-09T15:00:00Z';
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(q){
  f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());const response=responseFor(q);
  if(q.url.includes('/chart/')){const data=JSON.parse(response.body),events=data.chart.result[0].events;events.dividends['1773063000'].currency=currency;events.dividends['1773063000'].date=Date.parse(dividendAt)/1000;events.splits['1773063000'].date=Date.parse(splitAt)/1000;response.body=JSON.stringify(data);}return response;
 }});
 const result=await gateway.collect(f.policy.id,request('actions'),'action-provenance');assert.equal(result.status,'ok',result.reason);const e=f.store.observation(result.observationId!);
 assert.equal(e.records[0]!.kind,'dividend');assert.equal('currency' in e.records[0]!&&e.records[0].currency,currency);assert.equal(e.records[0]!.providerEventAt,dividendAt);
 assert.equal(e.records[1]!.kind,'split');assert.equal(e.records[1]!.providerEventAt,splitAt);assert.equal(e.issues.includes('unknown_unit'),currency===null);
});

for(const endpoint of ['chart','quoteSummary','quote','timeseries'] as const)test(`actual library rejects original provider symbol mismatch: ${endpoint}`,{skip},async t=>{
 const f=fixture({adapter:new PythonYahooAdapter()});t.after(f.close);
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(q){
  f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());const response=responseFor(q);
  const path=endpoint==='quote'?'/v7/finance/quote':`/${endpoint}/`;
  if(q.url.includes(path)){const data=JSON.parse(response.body),container=endpoint==='quote'?'quoteResponse':endpoint;const row=data[container].result[0];if(endpoint==='chart'||endpoint==='timeseries')row.meta.symbol=endpoint==='timeseries'?['OTHER']:'OTHER';else row.symbol='OTHER';response.body=JSON.stringify(data);}return response;
 }});
 const klass=endpoint==='chart'?'ohlcv':endpoint==='timeseries'?'statement':'fundamentals';
 const result=await gateway.collect(f.policy.id,request(klass),'bad-symbol');assert.equal(result.reason,'python_source_identity');assert.equal(result.observationId,null);
 assert.ok(f.db.get<{n:number}>('SELECT count(*) n FROM financial_payloads')!.n>0);
});

for(const failure of ['denial','malformed','empty','container'] as const)test(`actual library HTTP200 ${failure} stops before quote/chunk fallback`,{skip},async()=>{
 const adapter=new PythonYahooAdapter(),queries:YahooQuery[]=[];
 const dataClass=failure==='denial'?'fundamentals':'statement';
 const target=failure==='denial'?'/quoteSummary/':'/timeseries/';
 let stopped=false;
 await assert.rejects(()=>adapter.read({symbol:'ACME',request:request(dataClass)},async query=>{
  assert.equal(stopped,false,'no follow-on exchange after schema/denial');queries.push(query);
  const response=responseFor(query);
  if(query.url.includes(target)){
   stopped=true;
   response.body=failure==='denial'?JSON.stringify({quoteSummary:{error:{code:'Unauthorized',description:'fixture denial'},result:null}}):
    failure==='malformed'?'{invalid':failure==='empty'?JSON.stringify({timeseries:{error:null,result:[]}}):JSON.stringify({wrong:{result:[]}});
  }
  return response;
 },new AbortController().signal),/provider_denial|source_schema|source_empty/);
 assert.equal(stopped,true);assert.ok(queries.at(-1)!.url.includes(target));
});
