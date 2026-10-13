import {verifyResearchHost} from './research-host.js';
import type {Company} from '../company.js';
import {ensure} from '../../domain/investment/arithmetic.js';
import {canonical,hash,time} from '../../domain/investment/identity.js';
import type {FinancialRequest,FinancialScope,YahooQuery,YahooTransport} from '../../domain/market/financial.js';
import type {FinancialStore} from './financial-store.js';
import type {WireReceipt} from './yahoo-probe-custody.js';
import type {YahooStageConfirmation} from './yahoo-diagnostics.js';
import {symbolAt} from '../../domain/market/validation.js';

const issued=new WeakSet<object>(),owners=new WeakSet<object>();
/** Fresh research authority, never a reissue of a historical Yahoo qualification. Raw
 * gateway storage is memory-only; only the explicitly selected normalized evidence leaves it. */
export class ResearchCustody {
 private store?:FinancialStore;private transport?:YahooTransport;private logical=false;private wire=false;private ended=false;
 private controller=new AbortController();private timer:ReturnType<typeof setTimeout>;private monitor:ReturnType<typeof setInterval>;private readonly started=Date.now();
 readonly reservationId:string;readonly scope:FinancialScope;readonly symbol:string;
 private constructor(readonly company:Company,readonly scopeId:string,readonly request:FinancialRequest){
  const {s,r,c}=company.privateResearch.assertScope(scopeId,false);ensure(r.collection_approved===1,'research_collection_unapproved');ensure(c.source.requests.some(x=>canonical(x)===canonical(request)),'research_request_scope');
  const envelope=company.finiteHQ.assert(scopeId);ensure(envelope.purpose==='private_research','research_authority_required');
  if(company.finiteHQ.trusted)verifyResearchHost(company,scopeId);
  const instrument=c.source.instruments.find(i=>i.id===request.instrumentId)!;this.symbol=symbolAt(instrument,request.start!);
  this.reservationId=company.finiteHQ.reserveCollection(scopeId,hash(request));
  this.scope={id:s.run_id,mode:c.source.policy.mode,policyIds:[c.source.policy.id],instrumentIds:c.source.instruments.map(i=>i.id),calendarId:c.source.calendar.id,approvedAt:company.investmentTeam.now(),expiresAt:c.expiresAt,maxRequests:1,minIntervalMs:5000,maxResponseBytes:262144,maxTotalBytes:262144,timeoutMs:120000,maxRetries:0};
  issued.add(this);if(company.finiteHQ.trusted){owners.add(this);}
  this.monitor=setInterval(()=>{try{this.check();}catch{this.controller.abort();}},500);
  this.timer=setTimeout(()=>this.controller.abort(),Math.min(120000,time(c.expiresAt)-time(company.privateResearch.now())));
 }
 static consume(company:Company,scopeId:string,request:FinancialRequest){return new ResearchCustody(company,scopeId,structuredClone(request));}
 get signal(){return this.controller.signal;}
 check(){ensure(issued.has(this)&&!this.ended&&!this.signal.aborted&&Date.now()-this.started<120000,'research_custody_expired');this.company.privateResearch.assertScope(this.scopeId,false);if(this.company.finiteHQ.trusted)verifyResearchHost(this.company,this.scopeId);this.company.finiteHQ.assertCollection(this.scopeId,this.reservationId);const l=this.company.investmentLoop.forScope(this.scopeId);ensure(l&&['draft','active'].includes(l.state),'research_collection_stopped');}
 bind(store:FinancialStore){this.check();ensure(!this.store&&store.db.all<{file:string}>('PRAGMA database_list').every(r=>r.file===''),'research_memory_store_required');store.db.db.exec('PRAGMA temp_store=MEMORY');this.store=store;}
 assertStore(store:FinancialStore,scope:FinancialScope){this.check();ensure(this.store===store&&hash(scope)===hash(this.scope),'research_store_scope');}
 bindTransport(transport:YahooTransport){this.check();ensure(!this.transport,'research_transport_rebound');this.transport=transport;}
 begin(store:FinancialStore,transport:YahooTransport,request:FinancialRequest){this.assertStore(store,this.scope);ensure(!this.logical&&transport===this.transport&&hash(request)===hash(this.request),'research_collection_exhausted');this.logical=true;}
 reserve(query:YahooQuery,maxBytes:number){this.check();ensure(this.logical&&!this.wire&&maxBytes<=262144,'research_wire_exhausted');
  const request=this.request;
  const midnight=(date:string)=>{const target=Date.parse(date+'T00:00:00Z');let instant=target;for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant));const p=Object.fromEntries(parts.map(p=>[p.type,p.value]));const local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);instant+=target-local;}return instant/1000;};
  ensure(query.params.period1===midnight(request.start!)&&query.params.period2===midnight(request.end!),'research_exact_history_range');
  // The parser uses New York midnight bounds, independently of DST. Compare the full
  // typed query against the request using the existing strict query qualifier as well.
  ensure(query.method==='GET'&&query.url===`https://query1.finance.yahoo.com/v8/finance/chart/${this.symbol}`&&Object.keys(query.params).sort().join(',')==='events,includePrePost,interval,period1,period2'&&query.params.interval==='1d'&&query.params.includePrePost===false&&query.params.events==='div,splits,capitalGains','research_direct_query_required');
  this.wire=true;
 }
 async beforeDns(signal:AbortSignal){this.check();ensure(this.wire&&!signal.aborted,'research_wire_denied');}
 async beforeWire(signal:AbortSignal){this.check();ensure(this.wire&&!signal.aborted,'research_wire_denied');this.company.finiteHQ.collectionWire(this.reservationId);}
 confirmTransportStage(_stage:YahooStageConfirmation){this.check();}
 received(receipt:WireReceipt,_body:Buffer){ensure(this.wire,'research_response_without_request');if(!receipt.complete)this.controller.abort();}
 seal(_value:unknown){this.check();/* Raw originals are retained by FinancialStore in memory only. */}
 close(){this.ended=true;clearTimeout(this.timer);clearInterval(this.monitor);this.controller.abort();}
}
export function isResearchCustody(value:unknown):value is ResearchCustody{return !!value&&issued.has(value as object);}
export function isOwnerResearchCustody(value:unknown){return !!value&&owners.has(value as object);}
