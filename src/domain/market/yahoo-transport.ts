import { ensure } from '../investment/arithmetic.js';
import { exact, time } from '../investment/identity.js';
import type { FinancialRequest, YahooQuery } from './financial.js';
/** Audited release's finite endpoint family. No redirect, consent, login, search or arbitrary URL. */
export function qualifyYahooQuery(query:YahooQuery,request:FinancialRequest,symbol:string):{endpoint:string;params:Record<string,string>} {
  exact(query,['method','url','params']);ensure(query.method==='GET'&&typeof query.url==='string'&&query.url.length<=16000,'yahoo_request_method');
  ensure(query.params!==null&&typeof query.params==='object'&&!Array.isArray(query.params),'yahoo_request_params');
  const url=new URL(query.url);ensure(url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!url.hash,'yahoo_endpoint');
  const params:Record<string,string>={};
  for(const [key,value] of url.searchParams){ensure(!Object.hasOwn(params,key),'yahoo_duplicate_parameter');params[key]=value;}
  for(const [key,value] of Object.entries(query.params)) {
    ensure(!Object.hasOwn(params,key)&&['string','number','boolean'].includes(typeof value),'yahoo_duplicate_parameter');params[key]=String(value);
  }
  ensure(Object.keys(params).length<=12&&Object.entries(params).every(([k,v])=>k.length<=30&&v.length<=12000),'yahoo_request_params');
  // Credential values never enter durable request receipts. They are not source evidence.
  if(Object.hasOwn(params,'crumb')){ensure(params.crumb!.length<=256,'yahoo_crumb_size');delete params.crumb;}
  const keys=(allowed:string[])=>ensure(Object.keys(params).every(k=>allowed.includes(k)),'yahoo_request_params');
  let endpoint:string;
  if(url.hostname==='fc.yahoo.com'&&url.pathname==='/'){keys([]);endpoint='cookie';}
  else {
    ensure(['query1.finance.yahoo.com','query2.finance.yahoo.com'].includes(url.hostname),'yahoo_endpoint');
    if(url.pathname==='/v1/test/getcrumb'){keys([]);endpoint='crumb';}
    else if(url.pathname===`/v8/finance/chart/${symbol}`) {
      keys(['period1','period2','range','interval','includePrePost','events']);
      ensure(params.interval==='1d'&&(params.includePrePost===undefined||params.includePrePost==='false'),'yahoo_chart_settings');
      if(params.range!==undefined) ensure(params.range==='1d'&&params.period1===undefined&&params.period2===undefined,'yahoo_history_unbounded');
      else {
        ensure(['ohlcv','actions'].includes(request.dataClass)&&/^\d+$/.test(params.period1??'')&&/^\d+$/.test(params.period2??''),'yahoo_history_unbounded');
        const start=Number(params.period1)*1000,end=Number(params.period2)*1000;
        // yfinance interprets requested dates in the exchange timezone; UTC offsets are bounded, not assumed constant.
        ensure(start>=time(`${request.start}T00:00:00Z`)&&start<=time(`${request.start}T12:00:00Z`)&&end>=time(`${request.end}T00:00:00Z`)&&end<=time(`${request.end}T12:00:00Z`),'yahoo_history_range');
      }
      if(params.events!==undefined)ensure(params.events==='div,splits,capitalGains','yahoo_chart_settings');endpoint='chart';
    } else if(url.pathname===`/v10/finance/quoteSummary/${symbol}`&&request.dataClass==='fundamentals') {
      keys(['modules','corsDomain','formatted','symbol','lang','region']);
      ensure(params.modules==='financialData,quoteType,defaultKeyStatistics,assetProfile,summaryDetail'&&params.symbol===symbol&&params.formatted==='false'&&params.corsDomain==='finance.yahoo.com'&&params.lang==='en-US'&&params.region==='US','yahoo_quote_settings');endpoint='quote_summary';
    } else if(url.pathname==='/v7/finance/quote'&&request.dataClass==='fundamentals') {
      keys(['symbols','formatted','lang','region']);ensure(params.symbols===symbol&&params.formatted==='false'&&params.lang==='en-US'&&params.region==='US','yahoo_quote_settings');endpoint='quote';
    } else if(url.pathname===`/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}`&&['statement','fundamentals'].includes(request.dataClass)) {
      keys(['symbol','type','period1','period2']);ensure(params.symbol===symbol&&/^\d+$/.test(params.period1??'')&&/^\d+$/.test(params.period2??''),'yahoo_statement_settings');
      const types=(params.type??'').split(',');ensure(types.length>0&&types.length<=300&&new Set(types).size===types.length&&types.every(t=>/^(annual|quarterly)[A-Za-z]{1,80}$/.test(t)||t==='trailingPegRatio'),'yahoo_statement_fields');
      if(request.dataClass==='statement')ensure(types.every(t=>t.startsWith(request.frequency==='annual'?'annual':'quarterly')),'yahoo_statement_frequency');
      else ensure(types.length===1&&types[0]==='trailingPegRatio','yahoo_statement_fields');
      const span=Number(params.period2)-Number(params.period1);ensure(span>0&&span<=12*366*86400,'yahoo_statement_range');endpoint='timeseries';
    } else throw new Error('yahoo_endpoint');
  }
  return {endpoint:`${url.hostname}:${endpoint}`,params};
}
