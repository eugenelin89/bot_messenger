/** Invented instruments and prices only. These defaults approve no operational run. */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../src/persistence/store.js';
import { FixtureClock, FixtureSimulator } from '../../../src/control/investment.js';
import { hash } from '../../../src/domain/investment/identity.js';
import type { Configuration, CorporateAction, Observation, Proposal, Session } from '../../../src/domain/investment/types.js';
export function configuration(overrides: Partial<Configuration> = {}): Configuration {
  const sessions: Session[] = [
    ['2026-03-06','14:30','21:00',false],['2026-03-09','13:30','20:00',false],['2026-03-10','13:30','20:00',false],['2026-03-11','13:30','20:00',false],['2026-03-12','13:30','20:00',false],['2026-03-13','13:30','20:00',false],
    ['2026-11-02','14:30','21:00',false],['2026-11-27','14:30','18:00',true],
  ].map(([date,open,close,earlyClose])=>({date:String(date),open:`${date}T${open}:00.000Z`,close:`${date}T${close}:00.000Z`,status:'open',earlyClose:Boolean(earlyClose)}));
  return {runId:'synthetic-run',version:'fixture-v1',methodology:'inv05-v1',evidenceMode:'synthetic_fixture',initialCapital:'1000',currency:'USD',universeVersion:'invented-v1',
    instruments:[{id:'ACME',symbol:'ACME',venue:'XNYS',currency:'USD',sector:'Technology',classificationSource:'synthetic-fixture'},{id:'BETA',symbol:'BETA',venue:'XNYS',currency:'USD',sector:'Industry',classificationSource:'synthetic-fixture'}],
    allowedDirections:['BUY','SELL'],longOnly:true,leverage:false,positionLimitBps:10000,sectorLimitBps:10000,drawdownAttentionBps:10000,
    commission:'0',slippageBps:0,execution:'next_regular_open',cutoffMinutes:30,maxOpeningWaitSeconds:86400,maxMarkAgeSeconds:345600,
    calendar:{version:'synthetic-calendar-v1',timezone:'America/New_York',sessions,holidays:['2026-11-26']},
    marketPolicy:{id:'fixture-raw-v1',provider:'synthetic-provider',feed:'invented-feed',acquisitionCost:'0',adjustment:'raw'},
    benchmark:{instrument:{id:'ETF',symbol:'ETF',venue:'XNYS',currency:'USD',sector:'ETF proxy',classificationSource:'synthetic-fixture'},convention:'raw_prices_explicit_dividends_next_open_reinvestment'},
    startsAt:'2026-03-06T12:00:00.000Z',endsAt:'2026-12-01T00:00:00.000Z',publicationPolicy:'disabled-fixture-v1',authorization:{fixtureOperator:'fixture-owner',authors:['author'],reviewers:['reviewer'],expiresAt:'2026-12-01T00:00:00.000Z',maxOrders:100},...overrides};
}
export function setup(overrides: Partial<Configuration> = {}) {
  const config=configuration(overrides),dir=mkdtempSync(join(tmpdir(),'botsquad-inv05-')),path=join(dir,'company.sqlite'),store=new Store(path),clock=new FixtureClock(config.startsAt),sim=new FixtureSimulator(store,clock,'fixture-owner');
  sim.create(config); let count=0;
  const call=(command:Parameters<FixtureSimulator['execute']>[1],requestId=`request-${++count}`)=>sim.execute(config.runId,command,requestId);
  const state=()=>sim.inspect(config.runId);
  const observe=(instrumentId:string,sessionDate:string,field:'regular_open'|'regular_close',value:string,patch:Partial<Observation>={})=>{
    const observation=observationFor(config,instrumentId,sessionDate,field,value,{retrievedAt:clock.now(),...patch});return call({type:'observe',observation});
  };
  const order=(decisionId:string,side:'BUY'|'SELL',quantity:string,targetSession:string,priceGuard:string,instrumentId='ACME',extra:Partial<Proposal>={})=>{
    const proposal:Proposal={decisionId,revision:1,author:'author',action:side,evidenceCutoff:clock.now(),evidence:[],rationale:'Synthetic accounting test',orders:[{instrumentId,side,quantity,priceGuard,targetSession}],...extra};
    const d=call({type:'decision',proposal});
    const reviewId=`review-${decisionId}`; const review=call({type:'review',review:{id:reviewId,decisionId,revision:1,proposalHash:hash(proposal),reviewer:'reviewer',disposition:'approve',reviewedAt:clock.now()}});
    const receipt=call({type:'submit',decisionId,revision:1,orderIndex:0,reviewId,expectedVersion:state().ledgerVersion});
    return {id:receipt.outcome.orderId!,receipt,proposal,decision:d,review};
  };
  return {config,dir,path,store,clock,sim,call,state,observe,order,close:()=>store.close()};
}
export function observationFor(c:Configuration,instrumentId:string,sessionDate:string,field:'regular_open'|'regular_close',value:string,patch:Partial<Observation>={}): Observation {
  const session=c.calendar.sessions.find(s=>s.date===sessionDate)!; const at=field==='regular_open'?session.open:session.close;
  return {id:`price-${instrumentId}-${sessionDate}-${field}`,instrumentId,venue:'XNYS',currency:'USD',provider:c.marketPolicy.provider,feed:c.marketPolicy.feed,field,value,adjustment:'raw',marketAt:at,availableAt:at,retrievedAt:at,session:sessionDate,calendarVersion:c.calendar.version,sourceId:`source-${instrumentId}-${sessionDate}-${field}`,sourceVersion:1,quality:'verified',correctionOf:null,...patch};
}
export function action(instrumentId:string,kind:CorporateAction['kind'],id:string,effectiveAt:string,patch:Partial<CorporateAction>={}): CorporateAction {
  return {id,providerActionId:id,provider:'synthetic-provider',instrumentId,sourceVersion:1,effectiveAt,availableAt:effectiveAt,adjustment:'raw',quality:'verified',kind,numerator:null,denominator:null,cashPerShare:null,paymentAt:null,newSymbol:null,...patch};
}
export function buyTwo(f:ReturnType<typeof setup>) {
  const order=f.order('buy-two','BUY','2','2026-03-06','100'); f.clock.set('2026-03-06T14:30:00.000Z'); f.observe('ACME','2026-03-06','regular_open','100');
  return f.call({type:'fill',orderId:order.id});
}
