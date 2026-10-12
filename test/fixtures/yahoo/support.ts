/** Authored Yahoo-shaped data for fictional ACME. No downloaded financial data. */
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../src/persistence/store.js';
import { MarketStore } from '../../../src/control/market/store.js';
import { FinancialStore } from '../../../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../../../src/control/market/financial-gateway.js';
import { FinancialAdmission } from '../../../src/control/market/financial-admission.js';
import { FixtureClock } from '../../../src/control/investment.js';
import { scheduledCalendar2026 } from '../../../src/domain/market/calendar.js';
import { uses, type SourcePolicy } from '../../../src/domain/market/types.js';
import { FINANCIAL_SCHEMA,YAHOO_ADAPTER,yahooSettings,type FinancialClass,type FinancialRequest,type FinancialScope,type YahooAdapter,type YahooAdapterOutput,type YahooQuery,type YahooResponse,type YahooTransport } from '../../../src/domain/market/financial.js';
export const at='2026-03-09T21:00:00.000Z';
export function request(dataClass:FinancialClass='ohlcv',patch:Partial<FinancialRequest>={}):FinancialRequest {
  const history=['ohlcv','actions'].includes(dataClass);
  return {schemaVersion:FINANCIAL_SCHEMA,instrumentId:'ACME',dataClass,start:history?'2026-03-06':null,end:history?'2026-03-10':null,interval:history?'1d':null,
    statement:dataClass==='statement'?'income':null,frequency:dataClass==='statement'?'annual':null,fields:dataClass==='fundamentals'?['shortName','marketCap','trailingPE']:[],adjustment:'yahoo_unrepaired',...patch};
}
export function output(r:FinancialRequest):YahooAdapterOutput {
  let data:unknown;
  if(['ohlcv','actions'].includes(r.dataClass))data={columns:['Open','High','Low','Close','Adj Close','Volume','Dividends','Stock Splits'],rows:[
    {index:'2026-03-06T00:00:00-05:00',providerTimestamp:'2026-03-06T14:30:00Z',dividend:null,split:null,values:['100.125','105','99','102','51','1000','0','0']},
    {index:'2026-03-09T00:00:00-04:00',providerTimestamp:'2026-03-09T13:30:00Z',dividend:{timestamp:'2026-03-09T13:30:00Z',currency:'USD'},split:{timestamp:'2026-03-09T13:30:00Z'},values:['51','53','50','52','52','2000','0.5','2']},
  ]};
  else if(r.dataClass==='fundamentals')data={values:Object.fromEntries(r.fields.map(f=>[f,f==='shortName'?'Fictional ACME':f==='marketCap'?'1234567890123':'20.25'])),quoteCurrency:'USD',reportingCurrency:'USD'};
  else data={columns:['2025-12-31'],rows:[{label:'TotalRevenue',values:['123456789.25']},{label:'NetIncome',values:[null]}]};
  return {protocol:YAHOO_ADAPTER,versions:{python:'3.12.12',yfinance:'1.7.0'},symbol:'ACME',dataClass:r.dataClass,currency:'USD',timezone:'America/New_York',exchange:'NYQ',data,settings:{...yahooSettings}};
}
export function chart(){return {chart:{error:null,result:[{meta:{currency:'USD',symbol:'ACME',exchangeName:'NYQ',fullExchangeName:'NYSE',instrumentType:'EQUITY',firstTradeDate:946684800,regularMarketTime:1773086400,hasPrePostMarketData:true,gmtoffset:-14400,timezone:'EDT',exchangeTimezoneName:'America/New_York',regularMarketPrice:52,chartPreviousClose:100,priceHint:2,currentTradingPeriod:{pre:{timezone:'EDT',start:1773043200,end:1773063000,gmtoffset:-14400},regular:{timezone:'EDT',start:1773063000,end:1773086400,gmtoffset:-14400},post:{timezone:'EDT',start:1773086400,end:1773100800,gmtoffset:-14400}},dataGranularity:'1d',range:'1d',validRanges:['1d','5d','1mo']},
  timestamp:[Date.parse('2026-03-06T14:30:00Z')/1000,Date.parse('2026-03-09T13:30:00Z')/1000],indicators:{quote:[{open:[100.125,51],high:[105,53],low:[99,50],close:[102,52],volume:[1000,2000]}],adjclose:[{adjclose:[51,52]}]},events:{dividends:{'1773063000':{amount:0.5,date:1773063000,currency:'USD'}},splits:{'1773063000':{date:1773063000,numerator:2,denominator:1,splitRatio:'2:1'}}}}]}};}
export function responseFor(query:YahooQuery):YahooResponse {
  const url=new URL(query.url);let value:unknown;
  if(url.hostname==='fc.yahoo.com')return {status:200,body:'fixture-cookie-bootstrap',contentType:'text/plain',retryAfter:null};
  if(url.pathname.endsWith('/getcrumb'))return {status:200,body:'fixture-crumb',contentType:'text/plain',retryAfter:null};
  if(url.pathname.includes('/chart/'))value=chart();
  else if(url.pathname.includes('/quoteSummary/'))value={quoteSummary:{error:null,result:[{symbol:'ACME',quoteType:{shortName:'Fictional ACME'},summaryDetail:{marketCap:{raw:1234567890123,fmt:'1.23T'},trailingPE:{raw:20.25,fmt:'20.25'}}}]}};
  else if(url.pathname==='/v7/finance/quote')value={quoteResponse:{error:null,result:[{symbol:'ACME',shortName:'Fictional ACME',marketCap:1234567890123,trailingPE:20.25,currency:'USD',financialCurrency:'USD',totalRevenue:123456789.25}]}};
  else if(url.pathname.includes('/timeseries/')){
    const type=String(query.params.type??url.searchParams.get('type')??'');const prefix=type.startsWith('quarterly')?'quarterly':'annual';
    const metric=type.includes('TotalRevenue')?'TotalRevenue':type.includes('TotalAssets')?'TotalAssets':type.includes('OperatingCashFlow')?'OperatingCashFlow':'trailingPegRatio';
    const name=metric==='trailingPegRatio'?metric:prefix+metric;
    value={timeseries:{error:null,result:[{meta:{symbol:['ACME'],type:[name]},timestamp:[1767139200],[name]:[{asOfDate:'2025-12-31',periodType:prefix==='annual'?'12M':'3M',currencyCode:'USD',reportedValue:{raw:123456789.25,fmt:'123M'}}]}]}};
  }else throw new Error('unexpected_fixture_endpoint');
  return {status:200,body:JSON.stringify(value),contentType:'application/json',retryAfter:null};
}
export function fixture(options:{at?:string;scope?:Partial<FinancialScope>;policy?:Partial<SourcePolicy>;adapter?:YahooAdapter;transport?:YahooTransport;initialize?:boolean}={}) {
  const dir=mkdtempSync(join(tmpdir(),'botsquad-financial-')),path=join(dir,'hq.sqlite'),db=new Store(path),market=new MarketStore(db),store=new FinancialStore(market),clock=new FixtureClock(options.at??at),calendar=scheduledCalendar2026();
  const policy:SourcePolicy={id:'yahoo-fixture',version:1,provider:'yahoo',feed:'yfinance',mode:'synthetic_fixture',incrementalCost:'0',reviewedAt:'2026-03-06T00:00:00Z',expiresAt:'2026-03-13T00:00:00Z',rights:Object.fromEntries(uses.map(u=>[u,{status:['automation','internal_calculation','retention'].includes(u)?'allowed':'denied',evidence:['synthetic:authored-yahoo-fixture'],note:'Authored fixture only; no Yahoo permission asserted'}])) as SourcePolicy['rights'],attribution:'Authored offline fixture',maxObservationAgeMs:86400000,maxRequests:100,minIntervalMs:5000,cacheMs:86400000,timeoutMs:10000,maxBytes:262144,...options.policy};
  market.register(policy,'policy',at);market.register(calendar,'calendar',at);market.register({id:'ACME',venue:'XNYS',currency:'USD',source:'synthetic:instrument',symbols:[{symbol:'ACME',from:'2026-01-01',until:null}]},'instrument',at);
  const scope:FinancialScope={id:'fixture-scope',mode:'synthetic_fixture',policyIds:[policy.id],instrumentIds:['ACME'],calendarId:calendar.id,approvedAt:'2026-03-06T00:00:00Z',expiresAt:'2026-03-13T00:00:00Z',maxRequests:100,minIntervalMs:5000,maxResponseBytes:262144,maxTotalBytes:8388608,timeoutMs:10000,maxRetries:2,...options.scope};
  if(options.initialize!==false)store.initialize(scope);
  const queries:YahooQuery[]=[];
  const transport:YahooTransport=options.transport??{kind:'authored_yahoo_fixture',async exchange(q){queries.push(structuredClone(q));clock.set(new Date(Date.parse(clock.now())+5000).toISOString());return responseFor(q);}};
  const adapter:YahooAdapter=options.adapter??{kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});return JSON.stringify(output(r));}};
  const gateway=new FinancialDataGateway(store,clock,adapter,transport),admission=new FinancialAdmission(store,clock);
  return {dir,path,db,market,store,clock,calendar,policy,scope,queries,transport,adapter,gateway,admission,close(){db.close();rmSync(dir,{recursive:true,force:true});}};
}
