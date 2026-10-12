import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway,retryInstant } from '../src/control/market/financial-gateway.js';
import { FinancialAdmission } from '../src/control/market/financial-admission.js';
import { YAHOO_ADAPTER,type YahooAdapter,type YahooResponse } from '../src/domain/market/financial.js';
import { fixture,request,output,responseFor } from './fixtures/yahoo/support.js';
import { MarketAdmission } from '../src/control/market/admission.js';
import { configuration } from './fixtures/investment/support.js';
const count=(f:ReturnType<typeof fixture>,table:string)=>f.db.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n;

test('empty gateway is inactive, observed mode denied, and schema migration has no seeded authority',async t=>{
 const f=fixture({initialize:false});t.after(f.close);assert.equal(count(f,'financial_scopes'),0);
 assert.equal((await f.gateway.collect(f.policy.id,request(),'inactive')).reason,'financial_gateway_inactive');assert.equal(f.queries.length,0);
 assert.throws(()=>f.store.initialize({...f.scope,mode:'observed' as never}),/live_yahoo_not_authorized/);
 f.store.initialize(f.scope);assert.throws(()=>f.store.initialize({...f.scope,maxRequests:99}),/cannot_refill/);
});

test('all four classes retain bounded originals, units, source identity and private/execution gates',async t=>{
 const f=fixture();t.after(f.close);
 for(const klass of ['ohlcv','fundamentals','statement','actions'] as const){const result=await f.gateway.collect(f.policy.id,request(klass),klass);assert.equal(result.status,'ok',result.reason);
  const e=f.store.observation(result.observationId!);assert.equal(e.providerAvailableAt,null);assert.equal(e.knownAt,e.firstRetrievedAt);assert.equal(e.providerId,null);assert.equal(e.executionQualified,false);assert.equal(e.rawResponses.length,1);assert.equal(e.localRevision,1);
  assert.throws(()=>f.admission.deliver(e.id,'worker','public-'+klass,'public' as never),/financial_use_denied/);
  assert.throws(()=>new MarketAdmission(f.market).observation(e.id,configuration(),f.clock.now()),/market_record_missing/);
 }
 const actions=f.store.observation(f.store.result('actions')!.observationId!).records;assert.equal(actions.length,2);assert.equal(actions[0]!.kind,'dividend');assert.equal(actions[1]!.kind,'split');
 assert.equal('paymentAt' in actions[0]!&&actions[0].paymentAt,null);assert.equal(count(f,'investment_market_attempts'),0);
});

test('cache/replay preserve first knowledge and immutable originals across handles and restart',async t=>{
 const f=fixture();t.after(f.close);const first=await f.gateway.collect(f.policy.id,request(),'first');const original=f.store.observation(first.observationId!);
 f.clock.set('2026-03-09T22:00:00.000Z');const cached=await f.gateway.collect(f.policy.id,request(),'cached');assert.equal(cached.cached,true);assert.equal(cached.observationId,original.id);assert.equal(f.queries.length,1);
 assert.deepEqual(await f.gateway.collect(f.policy.id,request(),'first'),first);
 await assert.rejects(()=>f.gateway.collect(f.policy.id,request('actions'),'first'),/financial_request_conflict/);
 const reopened=new Store(f.path);try{const another=new FinancialStore(new MarketStore(reopened));assert.deepEqual(another.observation(original.id),original);assert.equal(another.result('cached')!.cached,true);}finally{reopened.close();}
 assert.throws(()=>f.db.run('UPDATE financial_observations SET payload=?','{}'),/immutable/);assert.throws(()=>f.db.run('DELETE FROM financial_attempts'),/retained/);
});

test('append corrections and A-B-A reversions; historical cutoff uses only the delivered vintage',async t=>{
 let revised=false;const adapter:YahooAdapter={kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const data=output(r);if(revised)(data.data as {rows:{values:string[]}[]}).rows[0]!.values[0]='101';return JSON.stringify(data);}};
 const f=fixture({adapter,policy:{cacheMs:0}});t.after(f.close);const a=await f.gateway.collect(f.policy.id,request(),'a');const ea=f.store.observation(a.observationId!);
 f.admission.deliver(ea.id,'consumer','read-a');const cutoff=f.clock.now();assert.equal(f.admission.decisionEvidence('read-a','consumer',cutoff).id,ea.id);
 revised=true;const b=await f.gateway.collect(f.policy.id,request(),'b');const eb=f.store.observation(b.observationId!);assert.equal(eb.predecessorId,ea.id);assert.equal(eb.localRevision,2);
 assert.equal(f.admission.decisionEvidence('read-a','consumer',cutoff).id,ea.id);assert.throws(()=>f.admission.decisionEvidence('read-a','consumer',f.clock.now()),/superseded/);
 f.admission.deliver(eb.id,'consumer','read-b');assert.throws(()=>f.admission.decisionEvidence('read-b','consumer',cutoff),/lookahead/);
 revised=false;const again=await f.gateway.collect(f.policy.id,request(),'again');assert.equal(f.store.observation(again.observationId!).localRevision,3);assert.equal(f.store.observation(ea.id).firstRetrievedAt,ea.firstRetrievedAt);
});

test('current fundamentals and delayed statements cannot be backdated to event/period end',async t=>{
 const f=fixture();t.after(f.close);for(const klass of ['fundamentals','statement'] as const){const r=await f.gateway.collect(f.policy.id,request(klass),klass);f.admission.deliver(r.observationId!,'employee',klass);
  assert.throws(()=>f.admission.decisionEvidence(klass,'employee','2026-03-09T20:00:00Z'),/lookahead/);assert.throws(()=>f.admission.decisionEvidence(klass,'other',f.clock.now()),/delivery_scope/);
 }
 assert.throws(()=>f.admission.decisionEvidence('statement','employee',f.clock.now()),/quality_unqualified/);
});

test('missing, NaN, stale and partial data stay explicit; no substitution or decision admission',async t=>{
 const adapter:YahooAdapter={kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const a=output(r);const rows=(a.data as {rows:{values:(string|null)[]}[]}).rows;rows[0]!.values[0]=null;rows[1]!.values[5]='NaN';return JSON.stringify(a);}};
 const f=fixture({adapter});t.after(f.close);const r=await f.gateway.collect(f.policy.id,request(),'missing');const e=f.store.observation(r.observationId!);assert.ok(e.issues.includes('missing'));assert.ok(e.issues.includes('nan'));assert.ok(e.issues.includes('partial'));
 f.admission.deliver(e.id,'consumer','read');assert.throws(()=>f.admission.decisionEvidence('read','consumer',f.clock.now()),/quality_unqualified/);
 f.clock.set('2026-03-11T21:00:00Z');const stale=f.admission.deliver(e.id,'consumer','later');assert.equal(stale.quality,'stale');assert.ok(stale.limitations.includes('stale'));assert.throws(()=>f.admission.decisionEvidence('later','consumer',f.clock.now()),/financial_stale/);
});

for(const [label,mutate] of Object.entries({
 changed_schema:(a:ReturnType<typeof output>)=>{(a as unknown as {extra:boolean}).extra=true;},
 currency:(a:ReturnType<typeof output>)=>{a.currency='CAD';},
 timezone:(a:ReturnType<typeof output>)=>{a.timezone='UTC';},
 adjustment:(a:ReturnType<typeof output>)=>{a.settings.auto_adjust=true as never;},
 changed_columns:(a:ReturnType<typeof output>)=>{(a.data as {columns:string[]}).columns[0]='Opening';},
 wrong_offset:(a:ReturnType<typeof output>)=>{(a.data as {rows:{index:string}[]}).rows[1]!.index='2026-03-09T00:00:00-05:00';},
 invalid_ohlc:(a:ReturnType<typeof output>)=>{(a.data as {rows:{values:string[]}[]}).rows[0]!.values[1]='10';},
}))test(`typed rejection: ${label}`,async t=>{
 const f=fixture({adapter:{kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const a=output(r);mutate(a);return JSON.stringify(a);}}});t.after(f.close);
 const result=await f.gateway.collect(f.policy.id,request(),label);assert.notEqual(result.status,'ok');assert.equal(result.observationId,null);assert.equal(count(f,'financial_observations'),0);assert.equal(f.queries.length,1);
 assert.equal(count(f,'financial_payloads'),1);const raw=f.db.get<{body:string;parameters:string}>('SELECT body,parameters FROM financial_payloads')!;assert.equal(raw.body,responseFor(f.queries[0]!).body);assert.ok(!raw.parameters.includes('crumb'));
 assert.throws(()=>f.db.run('DELETE FROM financial_payloads'),/retained/);
});

test('omitted elapsed trading sessions remain explicit gaps without fabricated bars',async t=>{
 const f=fixture({adapter:{kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const a=output(r);(a.data as {rows:unknown[]}).rows.pop();return JSON.stringify(a);}}});t.after(f.close);
 const result=await f.gateway.collect(f.policy.id,request(),'gap');const e=f.store.observation(result.observationId!);
 assert.deepEqual(e.missingSessions,['2026-03-09']);assert.equal(e.records.length,1);assert.ok(e.issues.includes('missing'));assert.ok(e.issues.includes('partial'));
 f.admission.deliver(e.id,'consumer','gap-read');assert.throws(()=>f.admission.decisionEvidence('gap-read','consumer',f.clock.now()),/quality_unqualified/);
});

test('real clock permits three rate-spaced bootstrap/data calls with individual policy deadlines',async t=>{
 const calls:number[]=[];
 const adapter:YahooAdapter={kind:YAHOO_ADAPTER,async read({request:r},exchange){
  await exchange({method:'GET',url:'https://fc.yahoo.com/',params:{}});await exchange({method:'GET',url:'https://query1.finance.yahoo.com/v1/test/getcrumb',params:{}});
  await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});return JSON.stringify(output(r));
 }};
 const f=fixture({scope:{timeoutMs:15000},policy:{timeoutMs:100},adapter,transport:{kind:'authored_yahoo_fixture',async exchange(q){calls.push(Date.now());return responseFor(q);}}});t.after(f.close);
 const start=Date.now(),epoch=Date.parse(f.clock.now());f.clock.now=()=>new Date(epoch+Date.now()-start).toISOString();
 const result=await f.gateway.collect(f.policy.id,request(),'consistent-clock');assert.equal(result.status,'ok',result.reason);assert.equal(calls.length,3);
 assert.ok(calls[1]!-calls[0]!>=5000);assert.ok(calls[2]!-calls[1]!>=5000);assert.equal(count(f,'financial_attempts'),3);assert.equal(count(f,'financial_payloads'),1);
});

test('provider-wide budget survives policy/class changes and separate database handles',async t=>{
 const f=fixture({scope:{maxRequests:1}});t.after(f.close);assert.equal((await f.gateway.collect(f.policy.id,request(),'one')).status,'ok');
 const db2=new Store(f.path);try{const gateway=new FinancialDataGateway(new FinancialStore(new MarketStore(db2)),f.clock,f.adapter,f.transport);
 const denied=await gateway.collect(f.policy.id,request('fundamentals'),'two');assert.equal(denied.reason,'financial_request_limit');assert.equal(f.queries.length,1);assert.equal(count(f,'financial_attempts'),1);
 }finally{db2.close();}
});

test('retries are finite, real transport attempts are counted, 429 Retry-After is not shortened',async t=>{
 let calls=0;const f=fixture({policy:{cacheMs:0}});t.after(f.close);
 const transport={kind:'authored_yahoo_fixture' as const,async exchange(q:Parameters<typeof responseFor>[0]){calls++;f.clock.set(new Date(Date.parse(f.clock.now())+5000).toISOString());return calls<=2?{status:503,body:'temporary',contentType:'text/plain',retryAfter:null}:responseFor(q);}};
 const gateway=new FinancialDataGateway(f.store,f.clock,f.adapter,transport);assert.equal((await gateway.collect(f.policy.id,request(),'retry')).status,'ok');assert.equal(calls,3);assert.equal(count(f,'financial_attempts'),3);
 const throttled=new FinancialDataGateway(f.store,f.clock,f.adapter,{kind:'authored_yahoo_fixture',async exchange(){calls++;return {status:429,body:'rate limited',contentType:'text/plain',retryAfter:'172800'};}});
 const r=await throttled.collect(f.policy.id,request('fundamentals'),'throttle');assert.equal(r.reason,'yahoo_rate_limited');assert.equal(Date.parse(r.retryAt!)-Date.parse(r.completedAt),172800000);
 const next=await throttled.collect(f.policy.id,request('actions'),'held');assert.equal(next.reason,'financial_provider_circuit');assert.equal(calls,4);
 assert.equal(retryInstant('Wed, 11 Mar 2026 21:00:00 GMT','2026-03-09T21:00:00Z'),'2026-03-11T21:00:00.000Z');
});

for(const status of [403,301,500])test(`HTTP ${status} is terminal and never follows redirects or changes identity`,async t=>{
 let calls=0;const f=fixture({transport:{kind:'authored_yahoo_fixture',async exchange(){calls++;return {status,body:'denied',contentType:'text/plain',retryAfter:null};}}});t.after(f.close);
 const r=await f.gateway.collect(f.policy.id,request(),'denied');assert.equal(r.observationId,null);assert.equal(calls,1);assert.equal(count(f,'financial_attempts'),1);
});

test('revocation and expiry during I/O deny retention and cached delivery',async t=>{
 let finish!:(r:YahooResponse)=>void;const f=fixture({transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(r=>{finish=r;})}});t.after(f.close);
 const pending=f.gateway.collect(f.policy.id,request(),'pending');await new Promise(r=>setImmediate(r));f.store.revoke(f.clock.now());finish(responseFor({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{}}));
 const result=await pending;assert.equal(result.observationId,null);assert.equal(count(f,'financial_observations'),0);assert.equal((await f.gateway.collect(f.policy.id,request(),'after')).reason,'financial_scope_revoked');
});

test('cancellation, transport timeout and oversized output fence uncertain effects',async t=>{
 const f=fixture({scope:{timeoutMs:30},transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(()=>{})}});t.after(f.close);
 const result=await f.gateway.collect(f.policy.id,request(),'timeout');assert.equal(result.status,'unknown');assert.equal(count(f,'financial_attempts'),1);
 assert.equal((await f.gateway.collect(f.policy.id,request('actions'),'after')).reason,'financial_provider_uncertain_or_busy');
 const g=fixture({scope:{timeoutMs:1000},transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(()=>{})}});t.after(g.close);const controller=new AbortController();const promise=g.gateway.collect(g.policy.id,request(),'cancel',controller.signal);controller.abort();assert.equal((await promise).status,'unknown');
});

test('concurrent callers share one reservation and cannot complete an in-flight duplicate',async t=>{
 let finish!:(r:YahooResponse)=>void;const f=fixture({transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(r=>{finish=r;})}});t.after(f.close);
 const first=f.gateway.collect(f.policy.id,request(),'same');await new Promise(r=>setImmediate(r));assert.equal((await f.gateway.collect(f.policy.id,request(),'same')).status,'unknown');
 assert.equal((await f.gateway.collect(f.policy.id,request('actions'),'other')).reason,'financial_provider_uncertain_or_busy');assert.equal(f.store.result('same'),null);
 finish(responseFor({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{}}));assert.equal((await first).status,'ok');assert.equal(count(f,'financial_attempts'),1);
 const db=new Store(f.path);try{const admission=new FinancialAdmission(new FinancialStore(new MarketStore(db)),f.clock);f.store.revoke(f.clock.now());assert.throws(()=>admission.deliver(f.store.result('same')!.observationId!,'consumer','read'),/revoked/);}finally{db.close();}
});

test('rollback after completion cannot backdate a correction or delivery even after original start',async t=>{
 const f=fixture({policy:{cacheMs:0}});t.after(f.close);const first=await f.gateway.collect(f.policy.id,request(),'first');const e=f.store.observation(first.observationId!);
 let rolled='2026-03-09T21:00:01Z';f.clock.now=()=>rolled;assert.equal((await f.gateway.collect(f.policy.id,request(),'rollback')).reason,'financial_clock_reversal');assert.equal(f.queries.length,1);
 assert.throws(()=>f.admission.deliver(e.id,'consumer','rollback'),/financial_clock_reversal/);assert.equal(count(f,'financial_observations'),1);
 rolled='2026-03-09T22:00:00Z';f.admission.deliver(e.id,'consumer','later');rolled='2026-03-09T21:30:00Z';assert.equal((await f.gateway.collect(f.policy.id,request(),'after-delivery')).reason,'financial_clock_reversal');
});

test('smaller source-policy timeout terminates a hanging underlying call',async t=>{
 const f=fixture({scope:{timeoutMs:1000},policy:{timeoutMs:20},transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(()=>{})}});t.after(f.close);
 const start=performance.now();const r=await f.gateway.collect(f.policy.id,request(),'policy-timeout');assert.equal(r.status,'unknown');assert.ok(performance.now()-start<500);assert.equal(count(f,'financial_attempts'),1);
});

test('expiry while receiving data denies persistence and receipt cannot expand scope',async t=>{
 let finish!:(r:YahooResponse)=>void;const f=fixture({transport:{kind:'authored_yahoo_fixture',exchange:()=>new Promise(r=>{finish=r;})}});t.after(f.close);
 const pending=f.gateway.collect(f.policy.id,request(),'expires');await new Promise(r=>setImmediate(r));f.clock.set(f.scope.expiresAt);finish(responseFor({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{}}));
 assert.equal((await pending).observationId,null);assert.equal(count(f,'financial_observations'),0);
});

test('oversized transport/output and exhausted transient allowance retain failure receipts',async t=>{
 const f=fixture({transport:{kind:'authored_yahoo_fixture',async exchange(){return {status:200,body:'x'.repeat(262145),contentType:'application/json',retryAfter:null};}}});t.after(f.close);
 assert.equal((await f.gateway.collect(f.policy.id,request(),'oversized')).status,'unknown');assert.equal(count(f,'financial_observations'),0);
 const g=fixture({adapter:{kind:YAHOO_ADAPTER,async read(_input,exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});return 'x'.repeat(524289);}}});t.after(g.close);
 assert.equal((await g.gateway.collect(g.policy.id,request(),'adapter-big')).reason,'financial_adapter_size');
 let calls=0;const h=fixture();t.after(h.close);const failed=new FinancialDataGateway(h.store,h.clock,h.adapter,{kind:'authored_yahoo_fixture',async exchange(){calls++;h.clock.set(new Date(Date.parse(h.clock.now())+5000).toISOString());return {status:503,body:'temporary',contentType:'text/plain',retryAfter:null};}});
 const r=await failed.collect(h.policy.id,request(),'exhausted');assert.equal(calls,3);assert.equal(r.reason,'yahoo_transient');assert.ok(r.retryAt);
});

test('future bars/actions, closed sessions, current incomplete bars, empty responses and precision are explicit',async t=>{
 const f=fixture({at:'2026-03-09T12:00:00Z'});t.after(f.close);const result=await f.gateway.collect(f.policy.id,request(),'partial');const e=f.store.observation(result.observationId!);assert.ok(e.issues.includes('partial'));
 f.admission.deliver(e.id,'consumer','partial');assert.throws(()=>f.admission.decisionEvidence('partial','consumer',f.clock.now()),/quality_unqualified/);
 const actions=await f.gateway.collect(f.policy.id,request('actions'),'future');const ae=f.store.observation(actions.observationId!);assert.equal(ae.records[0]!.kind,'dividend');f.admission.deliver(ae.id,'consumer','future-action');assert.throws(()=>f.admission.decisionEvidence('future-action','consumer',f.clock.now()),/quality_unqualified|future_action/);
 // Non-trading dates are rejected by the same frozen reference calendar, not weekday guesses.
 const closed=fixture({adapter:{kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const a=output(r);const row=(a.data as {rows:{index:string;providerTimestamp:string}[]}).rows[0]!;row.index='2026-03-07T00:00:00-05:00';row.providerTimestamp='2026-03-07T14:30:00Z';return JSON.stringify(a);}}});t.after(closed.close);assert.equal((await closed.gateway.collect(closed.policy.id,request(),'closed')).reason,'financial_calendar_mismatch');
 const empty=fixture({adapter:{kind:YAHOO_ADAPTER,async read({request:r},exchange){await exchange({method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}});const a=output(r);(a.data as {rows:unknown[]}).rows=[];return JSON.stringify(a);}}});t.after(empty.close);assert.equal((await empty.gateway.collect(empty.policy.id,request(),'empty')).status,'missing');
});
