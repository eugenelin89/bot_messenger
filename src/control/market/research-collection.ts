import type {Company} from '../company.js';
import {Store} from '../../persistence/store.js';
import {MarketStore} from './store.js';
import {FinancialStore} from './financial-store.js';
import {FinancialDataGateway} from './financial-gateway.js';
import {ResearchCustody} from './research-custody.js';
import {yahooProbeTransport} from './yahoo-https.js';
import {PythonYahooAdapter} from './yahoo-python.js';
import type {FinancialRequest,YahooAdapter,YahooTransport} from '../../domain/market/financial.js';
import {ensure} from '../../domain/investment/arithmetic.js';
import {hash} from '../../domain/investment/identity.js';

/** Trusted service entrypoint, selected by the authenticated owner route and never an employee tool. Each
 * approved exact request can be consumed once, independently of HQ database restores. */
export async function collectPrivateResearch(company:Company,scopeId:string,request:FinancialRequest,signal?:AbortSignal,fixture?:{adapter:YahooAdapter;transport:YahooTransport},occurrence?:{occurrenceId:string;generation:number}){
 ensure(!signal?.aborted,'research_collection_cancelled');
 ensure(!fixture||!company.finiteHQ.trusted&&fixture.transport.kind==='authored_yahoo_fixture','research_live_injection_denied');
 const custody=ResearchCustody.consume(company,scopeId,request,occurrence);
 let settled=false,db:Store|undefined;
 try {
  db=new Store(':memory:');
  const observed=company.observedInvestment.isRun(custody.scope.id),service=observed?company.observedInvestment:company.privateResearch;
  const c=observed?company.observedInvestment.scopeConfiguration(scopeId):company.privateResearch.configuration(custody.scope.id),market=new MarketStore(db),clock={now:()=>company.privateResearch.now()};
  market.register(c.source.policy,'policy',clock.now());market.register(c.source.calendar,'calendar',clock.now());for(const i of c.source.instruments)market.register(i,'instrument',clock.now());
  const store=new FinancialStore(market,custody);store.initialize(custody.scope);
  let transport:YahooTransport;
  if(fixture){transport={kind:'authored_yahoo_fixture',async exchange(q,s,b){custody.reserve(q,b);await custody.beforeDns(s);await custody.beforeWire(s);const r=await fixture.transport.exchange(q,s,b);custody.received({status:r.status,receivedBytes:Buffer.byteLength(r.body),complete:true,httpDate:null,retryAfter:r.retryAfter,reason:'fixture',completedAt:clock.now()},Buffer.from(r.body));return r;}};custody.bindTransport(transport);}
  else transport=yahooProbeTransport(custody);
  const gateway=new FinancialDataGateway(store,clock,fixture?.adapter??new PythonYahooAdapter(undefined,observed?'observed-paper-direct':'private-research-direct'),transport);
  const result=await gateway.collect(c.source.policy.id,request,'collection_'+hash([custody.reservationId,request]),AbortSignal.any([custody.signal,...(signal?[signal]:[])]));
  custody.check();
  const evidenceId=result.observationId?service.admit(scopeId,store,result.observationId):null;
  company.finiteHQ.settleCollection(custody.reservationId,result.status,result.status!=='unknown',result.retryAt,result.reason==='yahoo_access_blocked');settled=true;
  return {reservationId:custody.reservationId,status:result.status,reason:result.reason,evidenceId};
 }finally {
  try{if(!settled)company.finiteHQ.failCollection(custody.reservationId);}finally{custody.close();db?.close();}
 }
}
