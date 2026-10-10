import { sha256 } from '../scripts/investment-contracts/schema.js';
import { uses,type SourcePolicy } from '../src/domain/market/types.js';
import { action } from './fixtures/investment/support.js';
import { normalizeAction } from '../src/domain/market/admission.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationFixture } from './fixtures/publication/support.js';
test('simulator projects distinct public identities and correct ordered fills, benchmark and valuation into v1',t=>{
  const f=publicationFixture();t.after(f.cleanup);f.complete();const p=f.service.preview(f.envelope),events=p.material.events.map(x=>x.event);
  assert.deepEqual(events.filter(e=>e.type==='paper.order').map(e=>e.payload.status),['proposed','validated','pending','filled']);
  const ledger=events.filter(e=>e.type==='paper.ledger_transaction');assert.equal(ledger.length,2);assert.equal(ledger[1]!.payload.fill!.observation.availableAt,null);
  const value=events.find(e=>e.type==='portfolio.snapshot');assert.equal(value?.payload.quality,'complete');assert.equal(value?.payload.equity,'1010.000000');assert.equal(value?.payload.benchmark.equity,'1020.000000');assert.equal(value?.payload.excessReturn,'-0.010000');
  const bytes=JSON.stringify(events);for(const privateId of [f.config.runId,'fixture-owner',f.state().orders[Object.keys(f.state().orders)[0]!]!.id])assert.equal(bytes.includes(privateId),false);
  const accepted=f.service.consent({previewId:p.id,digest:p.digest});assert.equal(f.service.health(accepted.channelId).pending,events.length);
  assert.equal(f.sim.outbox(f.config.runId).length,f.sim.journal(f.config.runId).length);
});
test('missing public explanation or mismatched derivative review never invents a canonical decision',t=>{
  const f=publicationFixture();t.after(f.cleanup);f.order();f.description.decisions={};assert.throws(()=>f.service.preview(f.envelope),/review_derivative_required/);
});
test('stale preview, changed body digest and narrower participant scope cannot authorize publication',t=>{
 const f=publicationFixture();t.after(f.cleanup);const p=f.service.preview(f.envelope);assert.throws(()=>f.service.consent({previewId:p.id,digest:'wrong'}),/consent_mismatch/);
 f.description.objective='Changed explicit fixture copy';assert.throws(()=>f.service.consent({previewId:p.id,digest:p.digest}),/preview_stale/);
 assert.throws(()=>f.service.preview({...f.envelope,participants:['author']}),/participant_scope/);
});
test('approved artifact versions retain exact private origins, preserve originals and reject changed original bytes',t=>{
 const f=publicationFixture();t.after(f.cleanup);const original=Buffer.from('Private fixture evidence canary');const createdAt=f.clock.now();
 for(const [version,contentType,text] of [[1,'text/plain','Public fixture v1'],[2,'text/markdown','Public fixture v2']] as const)f.artifact({id:'private-artifact',version,title:'Approved derivative',createdAt,approvedAt:createdAt,sourceHash:sha256(original),bytes:Buffer.from(text),contentType,limitations:['Invented fixture']},original);
 const p=f.service.preview(f.envelope),versions=p.material.events.flatMap(x=>x.event.type==='artifact.published'?[x.event.payload]:[]);assert.equal(versions.length,2);assert.equal(versions[1]!.supersedes?.version,1);assert.equal(JSON.stringify(p.material.events.map(e=>e.event)).includes('private-artifact'),false);assert.equal(JSON.stringify(p.material).includes('Private fixture evidence canary'),false);
 assert.deepEqual(f.originals.get('private-artifact:1'),original);f.originals.set('private-artifact:1',Buffer.from('mutated'));assert.throws(()=>f.service.consent({previewId:p.id,digest:p.digest}),/artifact_source_mismatch/);
});
test('publication rights stay distinct from private calculation and expire before consent',t=>{
 const rights=Object.fromEntries(uses.map(u=>[u,{status:u==='public_display'?'denied':'allowed',evidence:['synthetic:permission'],note:'Synthetic scope only'}])) as SourcePolicy['rights'];const f=publicationFixture({}, {rights});t.after(f.cleanup);f.complete();assert.throws(()=>f.service.preview(f.envelope),/source_permission_missing/);
 const expiring=publicationFixture({}, {expiresAt:'2026-03-06T22:00:00.000Z'});t.after(expiring.cleanup);expiring.complete();const p=expiring.service.preview(expiring.envelope);expiring.clock.set('2026-03-06T22:01:00.000Z');assert.throws(()=>expiring.service.consent({previewId:p.id,digest:p.digest}),/source_permission_missing/);
});
for(const use of ['public_display','derived_portfolio','benchmark','exports','permanent_archive'] as const)for(const status of ['denied','unknown'] as const)test(`publication independently rejects ${status} ${use} rights`,t=>{
 const rights=Object.fromEntries(uses.map(u=>[u,{status:u===use?status:'allowed',evidence:['synthetic:permission'],note:'Synthetic scope only'}])) as SourcePolicy['rights'];const f=publicationFixture({}, {rights});t.after(f.cleanup);f.complete();assert.throws(()=>f.service.preview(f.envelope),/source_permission_missing/);
});
test('source rights expiring after consent deny delivery before reserving or sending a request',async t=>{
 const f=publicationFixture({}, {expiresAt:'2026-03-06T22:00:00.000Z'});t.after(f.cleanup);f.complete();let sent=0;const s=f.configured({send:async()=>{sent++;throw new Error('unexpected network');}}),p=s.preview(f.envelope),g=s.consent({previewId:p.id,digest:p.digest}),before=f.sim.journal(f.config.runId);f.clock.set('2026-03-06T22:01:00.000Z');
 await assert.rejects(s.deliver({channelId:g.channelId}),/source_permission_missing/);assert.equal(sent,0);assert.equal(f.store.all('SELECT * FROM investment_public_attempts').length,0);assert.deepEqual(f.sim.journal(f.config.runId),before);
});
test('matching action ID cannot license a different applied corporate action',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();f.clock.set('2026-03-09T13:31:00.000Z');const applied=action('ACME','split','private-split','2026-03-09T13:30:00.000Z',{numerator:'2',denominator:'1',availableAt:f.clock.now()});
 const e=normalizeAction({...applied,numerator:'3'},f.policy,f.clock.now(),'synthetic:action',{sourceAvailableAt:null,recordDate:null,declarationDate:null,correctionOf:null});f.market.put(e.id,'action',e,f.clock.now());f.call({type:'action',action:applied});
 f.description.actionSources[applied.id]={sourceId:'private-source',url:'https://example.invalid/synthetic-action',title:'Fixture split',publisher:'Synthetic provider',publishedAt:null,eventAt:applied.effectiveAt,retrievedAt:f.clock.now(),summary:'Invented split',limitations:['Synthetic'],rights:'owner_authored'};
 assert.throws(()=>f.service.preview(f.envelope),/action_source_mismatch/);
});
test('missing marks project nullable incomplete valuations without inventing totals',t=>{
 const f=publicationFixture();t.after(f.cleanup);const order=f.order();f.clock.set('2026-03-06T14:31:00.000Z');f.price('ACME','2026-03-06','regular_open','100');f.admitted.execute(f.config.runId,{type:'fill',orderId:order.id},'fill');f.clock.set('2026-03-06T21:01:00.000Z');f.admitted.execute(f.config.runId,{type:'value',session:'2026-03-06',asOf:'2026-03-06T21:00:00.000Z'},'missing-value');
 const p=f.service.preview(f.envelope),v=p.material.events.find(e=>e.event.type==='portfolio.snapshot')!.event;if(v.type!=='portfolio.snapshot')throw new Error('fixture');assert.notEqual(v.payload.quality,'complete');assert.equal(v.payload.equity,null);assert.equal(v.payload.excessReturn,null);
});
function recordedAction(f:ReturnType<typeof publicationFixture>,a:ReturnType<typeof action>){const e=normalizeAction(a,f.policy,f.clock.now(),'synthetic:action',{sourceAvailableAt:null,recordDate:null,declarationDate:null,correctionOf:null});f.market.put(e.id,'action',e,f.clock.now());f.description.actionSources[a.id]={sourceId:`private-${a.id}`,url:'https://example.invalid/synthetic-action',title:'Synthetic action source',publisher:'Invented provider',publishedAt:null,eventAt:a.effectiveAt,retrievedAt:f.clock.now(),summary:'Invented fixture corporate action',limitations:['Synthetic only'],rights:'owner_authored'};return f.call({type:'action',action:a});}
test('portfolio split, dividend accrual/payment, ticker update and lifecycle project from actual journal',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();f.clock.set('2026-03-09T13:31:00.000Z');recordedAction(f,action('ACME','split','split','2026-03-09T13:30:00.000Z',{availableAt:f.clock.now(),numerator:'2',denominator:'1'}));
 f.clock.set('2026-03-09T14:01:00.000Z');recordedAction(f,action('ACME','dividend','dividend','2026-03-09T14:00:00.000Z',{availableAt:f.clock.now(),cashPerShare:'1',paymentAt:'2026-03-09T15:00:00.000Z'}));f.clock.set('2026-03-09T15:01:00.000Z');f.call({type:'dividend_payment',actionId:'dividend'});
 recordedAction(f,action('ACME','ticker_change','ticker','2026-03-09T15:00:00.000Z',{availableAt:f.clock.now(),newSymbol:'NEW'}));f.call({type:'control',state:'paused'});f.call({type:'control',state:'ended'});
 const p=f.service.preview(f.envelope),events=p.material.events.map(x=>x.event);assert.deepEqual(events.filter(e=>e.type==='paper.ledger_transaction').map(e=>e.payload.effect),['initialization','fill','split','dividend_accrual','dividend_payment']);assert.deepEqual(events.filter(e=>e.type==='run.status').map(e=>e.payload.state),['paused','ended']);assert.equal(events.find(e=>e.type==='instrument.updated')?.payload.instrument.symbol,'NEW');
});
test('same-prefix corrected close appends truthful revised snapshot',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();const old=f.market.prices().find(e=>e.instrumentId==='ACME'&&e.field==='regular_close')!;f.clock.set('2026-03-06T22:00:00.000Z');const correction=f.price('ACME','2026-03-06','regular_close','110',{sourceVersion:2,status:'verified',correctionOf:old.id});f.admitted.execute(f.config.runId,{type:'revise_valuations',correctionId:correction.id},'revise');
 const snapshots=f.service.preview(f.envelope).material.events.flatMap(x=>x.event.type==='portfolio.snapshot'?[x.event.payload]:[]);assert.equal(snapshots.length,2);assert.equal(snapshots[1]!.equity,'1020.000000');assert.equal(snapshots[1]!.revision,2);
});
test('v1 cannot represent distinct benchmark action or mixed-effective historical prefix; both block explicitly',t=>{
 const benchmark=publicationFixture();t.after(benchmark.cleanup);benchmark.complete();benchmark.clock.set('2026-03-09T13:31:00.000Z');recordedAction(benchmark,action('ETF','split','benchmark-split','2026-03-09T13:30:00.000Z',{availableAt:benchmark.clock.now(),numerator:'2',denominator:'1'}));assert.throws(()=>benchmark.service.preview(benchmark.envelope),/benchmark_action_unsupported_v1/);
 const f=publicationFixture();t.after(f.cleanup);f.complete();f.clock.set('2026-03-09T13:31:00.000Z');recordedAction(f,action('ACME','dividend','later','2026-03-09T13:30:00.000Z',{availableAt:f.clock.now(),cashPerShare:'1'}));f.clock.set('2026-03-09T14:00:00.000Z');recordedAction(f,action('ACME','dividend','earlier','2026-03-06T16:00:00.000Z',{availableAt:f.clock.now(),cashPerShare:'1'}));
 const old=f.market.prices().find(e=>e.instrumentId==='ACME'&&e.field==='regular_close')!,correction=f.price('ACME','2026-03-06','regular_close','110',{sourceVersion:2,status:'verified',correctionOf:old.id});f.admitted.execute(f.config.runId,{type:'revise_valuations',correctionId:correction.id},'mixed-revise');assert.throws(()=>f.service.preview(f.envelope),/historical_prefix_unsupported_v1/);
});
test('standing financial capture never exports new corporate-action source prose in ledger or action events',t=>{
 const f=publicationFixture();t.after(f.cleanup);f.complete();const p=f.service.preview({...f.envelope,futureFinancial:true}),g=f.service.consent({previewId:p.id,digest:p.digest}),before=f.store.all('SELECT * FROM investment_public_jobs').length;f.clock.set('2026-03-09T13:31:00.000Z');recordedAction(f,action('ACME','dividend','new-source','2026-03-09T13:30:00.000Z',{availableAt:f.clock.now(),cashPerShare:'1'}));f.description.actionSources['new-source']!.summary='Private source canary must not be auto-published';assert.throws(()=>f.service.capture({channelId:g.channelId}),/new_derivative_approval_required/);assert.equal(f.store.all('SELECT * FROM investment_public_jobs').length,before);
});
