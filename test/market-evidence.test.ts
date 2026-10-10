import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/persistence/store.js';
import { FixtureClock } from '../src/control/investment.js';
import { MarketStore } from '../src/control/market/store.js';
import { MarketCollector } from '../src/control/market/collector.js';
import { MarketAdmission, MarketFixtureSimulator } from '../src/control/market/admission.js';
import { admitFixturePrice, admitFixtureAction, evidenceRights, normalizeAction } from '../src/domain/market/admission.js';
import { scheduledCalendar2026, simulatorCalendar, calendarSession, adjacentSession, withClosures } from '../src/domain/market/calendar.js';
import { normalizePrice } from '../src/domain/market/normalize.js';
import { symbolAt, validateInstrument, validatePolicy } from '../src/domain/market/validation.js';
import { uses, type SourcePolicy, type PriceAdapter, type PriceRequest, type InstrumentIdentity, type MarketTransportResponse } from '../src/domain/market/types.js';
import { configuration, action } from './fixtures/investment/support.js';
const request:PriceRequest={instrumentId:'ACME',session:'2026-03-06',field:'regular_open'};
function policy():SourcePolicy{return {id:'fixture-raw-v1',version:1,provider:'synthetic-provider',feed:'invented-feed',mode:'synthetic_fixture',incrementalCost:'0',reviewedAt:'2026-01-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',rights:Object.fromEntries(uses.map(use=>[use,{status:'allowed',evidence:['synthetic:invented'],note:'Invented fixture permission only'}])) as SourcePolicy['rights'],attribution:'Invented deterministic fixture',maxObservationAgeMs:86400000,maxRequests:4,minIntervalMs:1000,cacheMs:2000,timeoutMs:100,maxBytes:4096};}
const instrument:InstrumentIdentity={id:'ACME',venue:'XNYS',currency:'USD',source:'synthetic:instrument',symbols:[{symbol:'ACME',from:'2026-01-01',until:null}]};
function body(patch:Record<string,unknown>={}){return JSON.stringify({schema:'synthetic-price-v1',symbol:'ACME',venue:'XNYS',currency:'USD',field:'regular_open',value:'100',adjustment:'raw',session:'2026-03-06',marketAt:'2026-03-06T14:30:00.000Z',availableAt:null,sourceId:'fixture-open',sourceVersion:1,status:'verified',correctionOf:null,...patch});}
function fixture(p=policy()){
  const dir=mkdtempSync(join(tmpdir(),'botsquad-inv06-')),path=join(dir,'company.sqlite'),db=new Store(path),store=new MarketStore(db),clock=new FixtureClock('2026-03-06T14:31:00.000Z'),calendar=scheduledCalendar2026();
  store.register(p,'policy',clock.now());store.register(calendar,'calendar',clock.now());store.register(instrument,'instrument',clock.now());
  let calls=0;let response:MarketTransportResponse={status:200,contentType:'application/json',body:body(),retryAfterSeconds:null};
  const adapter:PriceAdapter={kind:'synthetic-json-v1',async read(){calls++;return response;}};
  const collector=new MarketCollector(store,clock,adapter);
  return {dir,path,db,store,clock,p,calendar,adapter,collector,calls:()=>calls,response:(r:Partial<MarketTransportResponse>)=>{response={...response,...r};},collect:(id:string)=>collector.collect(p.id,calendar.id,request,id),close:()=>{db.close();rmSync(dir,{recursive:true,force:true});}};
}
test('2026 official scheduled calendar: full closures, DST, early closes, bounds, no weekday approximation',()=>{
 const c=scheduledCalendar2026();assert.equal(c.calendar.sessions.filter(s=>s.status==='open').length,251);
 for(const d of c.calendar.holidays)assert.equal(calendarSession(c,d)!.status,'closed');
 assert.equal(calendarSession(c,'2026-03-07'),null);assert.equal(adjacentSession(c,'2026-03-06','next')!.date,'2026-03-09');
 assert.equal(calendarSession(c,'2026-03-06')!.open,'2026-03-06T14:30:00.000Z');assert.equal(calendarSession(c,'2026-03-09')!.open,'2026-03-09T13:30:00.000Z');
 assert.equal(calendarSession(c,'2026-10-30')!.open,'2026-10-30T13:30:00.000Z');assert.equal(calendarSession(c,'2026-11-02')!.open,'2026-11-02T14:30:00.000Z');
 assert.equal(calendarSession(c,'2026-11-27')!.close,'2026-11-27T18:00:00.000Z');assert.equal(calendarSession(c,'2026-12-24')!.earlyClose,true);assert.equal(calendarSession(c,'2026-07-02')!.earlyClose,false);
 assert.equal(adjacentSession(c,'2026-07-06','previous')!.date,'2026-07-02');assert.throws(()=>calendarSession(c,'2027-01-04'),/out_of_range/);
 const next=withClosures(c,'emergency-v2','2026-10-11T00:00:00Z',[{date:'2026-10-12',reason:'Synthetic emergency closure',source:'synthetic:closure'}]);
 assert.equal(calendarSession(next,'2026-10-12')!.status,'closed');assert.equal(calendarSession(c,'2026-10-12')!.status,'open');
});
test('symbol identity retains half-open history and rejects ambiguous mappings',()=>{
 const i={...instrument,symbols:[{symbol:'OLD',from:'2026-01-01',until:'2026-06-01'},{symbol:'NEW',from:'2026-06-01',until:null}]};assert.equal(symbolAt(i,'2026-05-31'),'OLD');assert.equal(symbolAt(i,'2026-06-01'),'NEW');
 assert.throws(()=>validateInstrument({...i,symbols:[...i.symbols,{symbol:'OVERLAP',from:'2026-07-01',until:null}]}),/overlapping/);
});
test('strict source policies prohibit paid acquisition and unsupported or unsupported evidenced rights',()=>{
 const p=policy();assert.throws(()=>validatePolicy({...p,incrementalCost:'1'} as unknown as SourcePolicy),/cost/);p.rights.automation.evidence=[];assert.throws(()=>validatePolicy(p),/rights_evidence/);
});
for(const [name,patch,quality] of [
 ['adjusted',{adjustment:'split_adjusted'},'unsupported_adjustment'],['wrong field',{field:'daily_close'},'wrong_field'],['wrong symbol',{symbol:'OTHER'},'wrong_instrument'],['wrong session',{session:'2026-03-09'},'calendar_mismatch'],['missing timestamp',{marketAt:null},'invalid_timestamp'],['future timestamp',{availableAt:'2026-03-06T15:00:00Z'},'invalid_timestamp'],['schema drift',{extra:'unexpected'},'schema_changed'],['precision',{value:'100.0000001'},'invalid_price'],['float',{value:100},'invalid_price'],['negative',{value:'-1'},'invalid_price'],['exponent',{value:'1e2'},'invalid_price'],['zero',{value:'0'},'invalid_price'],['halt',{status:'halted',value:null},'halted'],['missing',{status:'missing',value:null,marketAt:null},'missing']
] as const)test(`price validation: ${name}`,async t=>{const f=fixture();t.after(f.close);f.response({body:body(patch)});const r=await f.collect('request');assert.equal(r.quality,quality);assert.equal(f.calls(),1);if(quality!=='halted'&&quality!=='missing')assert.equal(r.evidence,null);});
test('duplicate JSON keys, layout changes and oversize response never produce a price',async t=>{
 for(const raw of [body().replace('"value":"100"','"value":"100","value":"200"'),'<html>changed</html>',' '.repeat(5000)]){
  const f=fixture();t.after(f.close);f.response({body:raw});const result=await f.collect('r');assert.equal(result.evidence,null);
 }
});
test('cache retains original retrieval and unknown source availability; new request is durable without I/O',async t=>{
 const f=fixture();t.after(f.close);const first=await f.collect('first');assert.equal(first.quality,'verified');assert.equal(first.evidence!.sourceAvailableAt,null);assert.equal(first.evidence!.knownAt,f.clock.now());
 f.clock.set('2026-03-06T14:31:01.000Z');const second=await f.collect('second');assert.deepEqual(second.evidence,first.evidence);assert.equal(f.calls(),1);assert.deepEqual(await f.collect('first'),first);
 assert.throws(()=>f.store.register({...f.p,maxRequests:10},'policy',f.clock.now()),/identity_conflict/);
});
test('rate limits/backoff and finite budgets persist across reopen; no automatic retries or paid fallback',async t=>{
 const f=fixture({...policy(),maxRequests:1});t.after(f.close);f.response({status:429,retryAfterSeconds:20});const first=await f.collect('first');assert.equal(first.quality,'rate_limited');assert.equal(first.retryAfter,'2026-03-06T14:31:20.000Z');
 f.clock.set('2026-03-06T14:31:30.000Z');const reopened=new Store(f.path);try{const collector=new MarketCollector(new MarketStore(reopened),f.clock,f.adapter);assert.equal((await collector.collect(f.p.id,f.calendar.id,request,'second')).reason,'finite_source_budget_exhausted');}finally{reopened.close();}assert.equal(f.calls(),1);
});
test('unknown source rights and observed mode never invoke fixture transport or relabel prices',async t=>{
 const p=policy();p.rights.automation.status='unknown';const f=fixture(p);t.after(f.close);assert.equal((await f.collect('r')).quality,'unknown_rights');assert.equal(f.calls(),0);
 const observed=policy();observed.mode='observed';for(const use of uses)observed.rights[use].evidence=['https://example.invalid/fixture-not-permission'];const g=fixture(observed);t.after(g.close);assert.equal((await g.collect('r')).reason,'live_price_adapter_not_verified');assert.equal(g.calls(),0);
});
test('individual rights are independent: valid internal evidence does not become public chart/export/archive permission',async t=>{
 const p=policy();p.rights.derived_portfolio.status='unknown';p.rights.permanent_archive.status='denied';const f=fixture(p);t.after(f.close);const r=await f.collect('r');assert.equal(r.quality,'verified');
 assert.doesNotThrow(()=>evidenceRights(r.evidence!,p,['internal_calculation'],f.clock.now()));for(const use of ['derived_portfolio','permanent_archive'] as const)assert.throws(()=>evidenceRights(r.evidence!,p,[use],f.clock.now()),/permission_missing/);
});
test('interrupted pending request consumes quota and requires an explicit distinct attempt after backoff',async t=>{
 const f=fixture();t.after(f.close);let release!:(r:MarketTransportResponse)=>void;
 const adapter:PriceAdapter={kind:'synthetic-json-v1',read:()=>new Promise(r=>{release=r;})},collector=new MarketCollector(f.store,f.clock,adapter);
 const inFlight=collector.collect(f.p.id,f.calendar.id,request,'same');const duplicate=await collector.collect(f.p.id,f.calendar.id,request,'same');assert.equal(duplicate.reason,'interrupted_attempt_requires_new_request');assert.equal(f.store.result('same'),null);
 release({status:200,contentType:'application/json',body:body(),retryAfterSeconds:null});assert.equal((await inFlight).quality,'verified');
});
test('correction is immutable and version-linked; stale and conflicting observations cannot be admitted',async t=>{
 const f=fixture();t.after(f.close);const first=await f.collect('first');f.clock.set('2026-03-06T14:32:00.000Z');f.response({body:body({value:'101',sourceVersion:2,correctionOf:first.evidence!.id})});const corrected=await f.collect('corrected');assert.equal(corrected.quality,'corrected');assert.equal(f.store.get<typeof first.evidence>(first.evidence!.id,'price')!.value,'100.000000');
 assert.equal(corrected.evidence!.correctionOf,first.evidence!.id);
 const g=fixture();t.after(g.close);const original=await g.collect('o');g.clock.set('2026-03-06T14:32:00.000Z');g.response({body:body({value:'99'})});assert.equal((await g.collect('conflict')).quality,'conflicting_sources');
 const cfg=configuration({calendar:simulatorCalendar(g.calendar,'2026-03-06','2026-11-30')});assert.throws(()=>new MarketAdmission(g.store).observation(original.evidence!.id,cfg,g.clock.now()),/source_conflict/);
 const e=normalizePrice(body(),request,f.p,instrument,f.calendar,'2026-03-09T14:31:00.000Z',[]);assert.equal(e.quality,'stale');assert.throws(()=>admitFixturePrice(e,f.p,f.calendar,cfg,e.retrievedAt),/not_verified/);
});
test('late retrieval keeps cutoff and original fill through corrections; missing/close data cannot manufacture open',async t=>{
 const f=fixture();t.after(f.close);const cfg=configuration({calendar:simulatorCalendar(f.calendar,'2026-03-06','2026-11-30')}),clock=new FixtureClock(cfg.startsAt),sim=new MarketFixtureSimulator(f.store,clock,'fixture-owner');sim.create(cfg);
 const proposal={decisionId:'decision',revision:1,author:'author',action:'BUY' as const,evidenceCutoff:clock.now(),evidence:[],rationale:'Invented evidence',orders:[{instrumentId:'ACME',side:'BUY' as const,quantity:'2',priceGuard:'110',targetSession:'2026-03-06'}]};
 const {hash}=await import('../src/domain/investment/identity.js');sim.execute(cfg.runId,{type:'decision',proposal},'decision');sim.execute(cfg.runId,{type:'review',review:{id:'review',decisionId:'decision',revision:1,proposalHash:hash(proposal),reviewer:'reviewer',disposition:'approve',reviewedAt:clock.now()}},'review');
 const order=sim.execute(cfg.runId,{type:'submit',decisionId:'decision',revision:1,orderIndex:0,expectedVersion:sim.inspect(cfg.runId).ledgerVersion,reviewId:'review'},'submit').outcome.orderId!;
 clock.set(f.clock.now());assert.equal(sim.execute(cfg.runId,{type:'fill',orderId:order},'missing').outcome.status,'data_blocked');
 const result=await f.collect('open');const admitted=new MarketAdmission(f.store).observation(result.evidence!.id,cfg,clock.now());assert.equal(admitted.knowledgeBasis,'first_retrieval');sim.observe(cfg.runId,result.evidence!.id);
 assert.equal(sim.execute(cfg.runId,{type:'fill',orderId:order},'fill').outcome.fills[0]!.price,'100.000000');assert.equal(sim.inspect(cfg.runId).portfolio.cash,'800.000000');
 f.clock.set('2026-03-06T14:32:00.000Z');clock.set(f.clock.now());f.response({body:body({value:'109',sourceVersion:2,correctionOf:result.evidence!.id})});const correction=await f.collect('corrected');sim.observe(cfg.runId,correction.evidence!.id);assert.equal(sim.inspect(cfg.runId).portfolio.cash,'800.000000');
 const late={...proposal,decisionId:'late'};sim.execute(cfg.runId,{type:'decision',proposal:late},'late');sim.execute(cfg.runId,{type:'review',review:{id:'late-review',decisionId:'late',revision:1,proposalHash:hash(late),reviewer:'reviewer',disposition:'approve',reviewedAt:clock.now()}},'late-review');assert.equal(sim.execute(cfg.runId,{type:'submit',decisionId:'late',revision:1,orderIndex:0,expectedVersion:sim.inspect(cfg.runId).ledgerVersion,reviewId:'late-review'},'late-submit').outcome.status,'rejected');
});
test('corporate actions preserve unknown payment, ratios, symbol changes and unsupported events; corrections require reconciliation',()=>{
 const p=policy(),at='2026-03-09T13:30:00Z',options={sourceAvailableAt:null,recordDate:null,declarationDate:null,correctionOf:null};
 const dividend=normalizeAction(action('ACME','dividend','div','2026-03-09T13:30:00Z',{availableAt:at,cashPerShare:'1'}),p,at,'synthetic:action',options);assert.equal(dividend.action.paymentAt,null);assert.equal(admitFixtureAction(dividend,p,at).paymentAt,null);
 for(const [kind,patch] of [['split',{numerator:'1',denominator:'10'}],['ticker_change',{newSymbol:'NEW'}],['unsupported',{}]] as const)assert.equal(normalizeAction(action('ACME',kind,kind,at,{availableAt:at,...patch}),p,at,'synthetic:action',options).action.kind,kind);
 const corrected=normalizeAction({...dividend.action,id:'corrected',sourceVersion:2},p,at,'synthetic:correction',{...options,correctionOf:dividend.id},[dividend]);assert.throws(()=>admitFixtureAction(corrected,p,at),/reconciliation/);
});
test('unchanged source version and correction retain original identity/knowledge after cache expiry and reopen',async t=>{
 const f=fixture();t.after(f.close);const first=await f.collect('first');f.clock.set('2026-03-06T14:32:00.000Z');const repeated=await f.collect('second');assert.deepEqual(repeated.evidence,first.evidence);assert.equal(f.calls(),2);
 f.clock.set('2026-03-06T14:33:00.000Z');f.response({body:body({value:'101',sourceVersion:2,correctionOf:first.evidence!.id})});const corrected=await f.collect('third');f.clock.set('2026-03-06T14:34:00.000Z');
 const reopened=new Store(f.path);try{const r=await new MarketCollector(new MarketStore(reopened),f.clock,f.adapter).collect(f.p.id,f.calendar.id,request,'fourth');assert.deepEqual(r.evidence,corrected.evidence);}finally{reopened.close();}
});
test('a frozen policy ID is required even when another policy uses the same provider and feed',async t=>{
 const f=fixture();t.after(f.close);const r=await f.collect('r'),cfg=configuration({marketPolicy:{...configuration().marketPolicy,id:'another-policy'},calendar:simulatorCalendar(f.calendar,'2026-03-06','2026-11-30')});assert.throws(()=>admitFixturePrice(r.evidence!,f.p,f.calendar,cfg,f.clock.now()),/frozen_source_policy/);
});
test('known corrections fence originals before admission and before price use; lineage sync is atomic',async t=>{
 const f=fixture();t.after(f.close);const cfg=configuration({calendar:simulatorCalendar(f.calendar,'2026-03-06','2026-11-30')}),clock=new FixtureClock(cfg.startsAt),sim=new MarketFixtureSimulator(f.store,clock,'fixture-owner');sim.create(cfg);
 const first=await f.collect('first');clock.set(f.clock.now());sim.observe(cfg.runId,first.evidence!.id);
 f.clock.set('2026-03-06T14:32:00.000Z');clock.set(f.clock.now());f.response({body:body({value:'101',sourceVersion:2,correctionOf:first.evidence!.id})});const corrected=await f.collect('second');
 assert.throws(()=>new MarketAdmission(f.store).observation(first.evidence!.id,cfg,clock.now()),/superseded/);
 assert.throws(()=>sim.execute(cfg.runId,{type:'benchmark_open',session:'2026-03-06'},'use-before-sync'),/correction_not_delivered/);
 sim.observe(cfg.runId,corrected.evidence!.id);assert.equal(sim.inspect(cfg.runId).observations.length,2);
});
test('simultaneous correction responses serialize semantic checks and cannot fork one predecessor',async t=>{
 const f=fixture();t.after(f.close);const first=await f.collect('first');let finishA!:(r:MarketTransportResponse)=>void,finishB!:(r:MarketTransportResponse)=>void;
 const a=new MarketCollector(f.store,f.clock,{kind:'synthetic-json-v1',read:()=>new Promise(r=>{finishA=r;})});f.clock.set('2026-03-06T14:32:00.000Z');const promiseA=a.collect(f.p.id,f.calendar.id,request,'a');
 const otherDb=new Store(f.path);t.after(()=>otherDb.close());const b=new MarketCollector(new MarketStore(otherDb),f.clock,{kind:'synthetic-json-v1',read:()=>new Promise(r=>{finishB=r;})});f.clock.set('2026-03-06T14:32:02.000Z');const promiseB=b.collect(f.p.id,f.calendar.id,request,'b');
 const response=(value:string):MarketTransportResponse=>({status:200,contentType:'application/json',body:body({value,sourceVersion:2,correctionOf:first.evidence!.id}),retryAfterSeconds:null});finishA(response('101'));finishB(response('102'));
 const results=await Promise.all([promiseA,promiseB]);assert.equal(results.filter(r=>r.quality==='corrected').length,1);assert.equal(results.filter(r=>r.reason==='correction_mismatch').length,1);assert.equal(f.store.prices().filter(e=>e.correctionOf===first.evidence!.id).length,1);
});
test('timeout settles durably, provider failures back off, and expiry during request denies retention',async t=>{
 const f=fixture({...policy(),timeoutMs:5});t.after(f.close);const hung=new MarketCollector(f.store,f.clock,{kind:'synthetic-json-v1',read:()=>new Promise(()=>{})});assert.equal((await hung.collect(f.p.id,f.calendar.id,request,'timeout')).quality,'unavailable');assert.equal((await f.collect('backoff')).reason,'provider_backoff');assert.equal(f.calls(),0);
 const p=policy();p.expiresAt='2026-03-06T14:31:01.000Z';const g=fixture(p);t.after(g.close);const expiry=new MarketCollector(g.store,g.clock,{kind:'synthetic-json-v1',async read(){g.clock.set('2026-03-06T14:31:02.000Z');return {status:200,contentType:'application/json',body:body(),retryAfterSeconds:null};}});
 const result=await expiry.collect(p.id,g.calendar.id,request,'expiry');assert.equal(result.reason,'source_permission_expired_during_request');assert.equal(result.evidence,null);assert.equal(g.store.prices().length,0);
});
test('crash-style pending reservation survives a separately reopened handle without starting network work',async t=>{
 const f=fixture();t.after(f.close);let release!:(r:MarketTransportResponse)=>void;const pending=new MarketCollector(f.store,f.clock,{kind:'synthetic-json-v1',read:()=>new Promise(r=>{release=r;})}).collect(f.p.id,f.calendar.id,request,'pending');
 const db=new Store(f.path);try{const reopened=new MarketCollector(new MarketStore(db),f.clock,f.adapter);assert.equal((await reopened.collect(f.p.id,f.calendar.id,request,'pending')).reason,'interrupted_attempt_requires_new_request');assert.equal(f.calls(),0);assert.equal(db.get<{n:number}>('SELECT count(*) n FROM investment_market_attempts WHERE network=1')!.n,1);}finally{db.close();}
 release({status:503,contentType:'application/json',body:'{}',retryAfterSeconds:null});await pending;
});
test('order reservations use current corrections and rights, before a fill is attempted',async t=>{
 const p=policy();p.expiresAt='2026-03-06T14:33:00.000Z';const f=fixture(p);t.after(f.close);const cfg=configuration({calendar:simulatorCalendar(f.calendar,'2026-03-06','2026-11-30')}),clock=new FixtureClock(cfg.startsAt),sim=new MarketFixtureSimulator(f.store,clock,'fixture-owner');sim.create(cfg);
 const first=await f.collect('first');clock.set(f.clock.now());sim.observe(cfg.runId,first.evidence!.id);
 const proposal={decisionId:'next-day',revision:1,author:'author',action:'BUY' as const,evidenceCutoff:clock.now(),evidence:[],rationale:'Synthetic next-session risk test',orders:[{instrumentId:'ACME',side:'BUY' as const,quantity:'2',priceGuard:'110',targetSession:'2026-03-09'}]};
 const {hash}=await import('../src/domain/investment/identity.js');sim.execute(cfg.runId,{type:'decision',proposal},'decision');sim.execute(cfg.runId,{type:'review',review:{id:'review',decisionId:proposal.decisionId,revision:1,proposalHash:hash(proposal),reviewer:'reviewer',disposition:'approve',reviewedAt:clock.now()}},'review');
 f.clock.set('2026-03-06T14:32:00.000Z');clock.set(f.clock.now());f.response({body:body({value:'101',sourceVersion:2,correctionOf:first.evidence!.id})});const correction=await f.collect('correction');
 const command={type:'submit' as const,decisionId:proposal.decisionId,revision:1,orderIndex:0,expectedVersion:sim.inspect(cfg.runId).ledgerVersion,reviewId:'review'};
 assert.throws(()=>sim.execute(cfg.runId,command,'unsafe-submit'),/correction_not_delivered/);assert.equal(sim.inspect(cfg.runId).portfolio.reservedCash,'0.000000');
 sim.observe(cfg.runId,correction.evidence!.id);clock.set('2026-03-06T14:33:01.000Z');assert.throws(()=>sim.execute(cfg.runId,command,'expired-submit'),/permission_missing/);assert.equal(sim.inspect(cfg.runId).portfolio.reservedCash,'0.000000');
});
test('request identity snapshots caller-owned fields across asynchronous transport',async t=>{
 const f=fixture();t.after(f.close);const mutable={...request};let release!:(r:MarketTransportResponse)=>void;let received:PriceRequest|null=null;
 const collector=new MarketCollector(f.store,f.clock,{kind:'synthetic-json-v1',read:(r)=>{received=r;return new Promise(resolve=>{release=resolve;});}});
 const pending=collector.collect(f.p.id,f.calendar.id,mutable,'immutable');mutable.field='regular_close';assert.equal(Object.isFrozen(received),true);
 release({status:200,contentType:'application/json',body:body(),retryAfterSeconds:null});const result=await pending;assert.equal(result.evidence!.field,'regular_open');
 await assert.rejects(collector.collect(f.p.id,f.calendar.id,mutable,'immutable'),/request_conflict/);
});
for(const scenario of ['429','503','schema','conflict','missing','pending'] as const)test(`newer ${scenario} attempt prevents reuse of an overlapping older success within its cache TTL`,async t=>{
 const f=fixture({...policy(),cacheMs:60000,timeoutMs:1000});t.after(f.close);
 const releases:Array<(r:MarketTransportResponse)=>void>=[];let calls=0;
 const transport=(status:number,payload=body()):MarketTransportResponse=>({status,contentType:'application/json',body:payload,retryAfterSeconds:30});
 const collector=new MarketCollector(f.store,f.clock,{kind:'synthetic-json-v1',read:()=>{calls++;return calls<=2?new Promise(resolve=>{releases.push(resolve);}):Promise.resolve(transport(503));}});
 const first=collector.collect(f.p.id,f.calendar.id,request,'first');f.clock.set('2026-03-06T14:31:01.000Z');const second=collector.collect(f.p.id,f.calendar.id,request,'second');
 f.clock.set('2026-03-06T14:31:02.000Z');releases[0]!(transport(200));assert.equal((await first).quality,'verified');
 if(scenario!=='pending'){
  releases[1]!(scenario==='429'||scenario==='503'?transport(Number(scenario)):transport(200,scenario==='schema'?'{}':body(scenario==='conflict'?{value:'99'}:{status:'missing',value:null,marketAt:null})));
  assert.notEqual((await second).quality,'verified');
 }
 f.clock.set('2026-03-06T14:31:03.000Z');const third=await collector.collect(f.p.id,f.calendar.id,request,'third');assert.notEqual(third.reason,'cached_original_retrieval');assert.equal(third.evidence,null);
 if(scenario==='429'||scenario==='503'){assert.equal(third.reason,'provider_backoff');assert.equal(calls,2);}else assert.equal(calls,3);
 if(scenario==='pending'){releases[1]!(transport(503));await second;}
});
