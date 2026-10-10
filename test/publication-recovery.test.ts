import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicationFixture } from './fixtures/publication/support.js';
import { PublicationService } from '../src/control/publication/service.js';
import { verifySignedRequest, type SignedMessage } from '../scripts/investment-contracts/signatures.js';
import { canonicalJson, parseJson, sha256, validate } from '../scripts/investment-contracts/schema.js';
import type { EventBatch, PublicationReceipt, Problem } from '../contracts/investment/v1/types.js';
import type { PublicationTransport, WireResponse } from '../src/control/publication/transport.js';
import type { Job } from '../src/domain/publication/types.js';
function oracle(f:ReturnType<typeof publicationFixture>) {
 const calls:SignedMessage[]=[],receipts=new Map<string,PublicationReceipt>(),nonces=new Set<string>();let behavior:(m:SignedMessage)=>Promise<WireResponse>|WireResponse=normal;
 function normal(m:SignedMessage):WireResponse {
  if(m.path.endsWith('/status')){if(!receipts.size)return problem(404,'NOT_FOUND');const receipt=[...receipts.values()].at(-1)!;const sample=JSON.parse(readFileSync(new URL('../../contracts/investment/v1/responses.json',import.meta.url),'utf8')).examples.PublicStatus;return ok({...sample,experimentId:receipt.experimentId,runId:receipt.runId,watermark:receipt.watermark});}
  const keyId=m.headers.find(([k])=>k==='signature-input')![1].includes('rotated-key')?'rotated-key':'fixture-key';
  const verified=verifySignedRequest(m,{authority:new URL(f.destination.origin).host,generation:m.headers.find(([k])=>k==='botsquad-generation')![1],keyId,publicKey:keyId==='fixture-key'?f.key.publicKey:f.secondKey.publicKey,enabled:true,notBefore:0,notAfter:2000000000,now:Math.floor(Date.parse(f.clock.now())/1000),usedNonces:nonces,targets:new Set([`${m.method} ${m.path}`])});nonces.add(verified.nonceKey);
  if(m.method==='PUT'){const c=f.store.get<{experiment_id:string;run_id:string}>('SELECT * FROM investment_public_channels')!;return ok({schemaVersion:'1.0',uploadId:m.headers.find(([k])=>k==='idempotency-key')![1],experimentId:c.experiment_id,runId:c.run_id,sha256:sha256(m.body),contentType:m.headers.find(([k])=>k==='content-type')![1],sizeBytes:m.body.length,receivedAt:f.clock.now(),state:'staged_private'});}
  if(m.path.endsWith('/heartbeat')){const h=parseJson(m.body) as {heartbeatId:string};return ok({schemaVersion:'1.0',heartbeatId:h.heartbeatId,receivedAt:f.clock.now()});}
  if(m.method==='GET'){const r=receipts.get(m.path.split('/').at(-1)!);return r?ok(r):problem(404,'NOT_FOUND');}
  const batch=validate<EventBatch>('EventBatch',parseJson(m.body)),ledger=batch.events.find(e=>e.type==='paper.ledger_transaction'),last=batch.events.at(-1)!;
  const value:PublicationReceipt={schemaVersion:'1.0',batchId:batch.batchId,experimentId:batch.experimentId,runId:batch.runId,bodyDigest:sha256(m.body),receiptId:'fixture-receipt',receivedAt:f.clock.now(),acceptedIds:batch.events.map(e=>e.eventId),duplicateIds:[],receiverCursor:'fixture-cursor',watermark:{journalSequence:ledger?.payload.journalSequence??null,journalHash:ledger?.payload.journalHash??null,sourceSequence:last.sourceSequence,sourceGaps:false}};
  receipts.set(batch.batchId,value);return ok(value);
 }
 const transport:PublicationTransport={send:async(_d,m)=>{calls.push(m);return behavior(m);}};
 return {calls,receipts,transport,normal,set:(fn:typeof behavior)=>{behavior=fn;}};
}
const ok=(value:unknown):WireResponse=>({status:200,contentType:'application/json',bytes:Buffer.from(canonicalJson(value))});
const problem=(status:number,code:Problem['code']):WireResponse=>({status,contentType:'application/problem+json',bytes:Buffer.from(canonicalJson({schemaVersion:'1.0',status,code,requestId:'fixture-request',retryAfterSeconds:null,detail:'Fixture failure',retryable:false,resync:null}))});
function stage(f:ReturnType<typeof publicationFixture>,s:PublicationService,e=f.envelope){const p=s.preview(e),g=s.consent({previewId:p.id,digest:p.digest});return {p,g,channelId:g.channelId};}
const advance=(f:ReturnType<typeof publicationFixture>,seconds=2)=>f.clock.set(new Date(Date.parse(f.clock.now())+seconds*1000).toISOString());

test('consent replay returns the same historical grant after stage, change, expiry and revocation',t=>{
 const f=publicationFixture();t.after(f.cleanup);const {p,g}=stage(f,f.service);f.service.control({channelId:g.channelId,action:'revoke',keyId:null,generation:null});f.description.objective='Changed';f.clock.set('2026-03-20T00:00:00Z');
 assert.deepEqual(f.service.consent({previewId:p.id,digest:p.digest}),{...g,state:'revoked'});assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM investment_public_grants')!.n,1);
});
test('lost write at exact byte budget reconciles with zero-body signed GET and preserves bytes',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),p=s.preview(f.envelope);
 // Public IDs and serialized batch IDs are fixed length, so a preview can calculate the exact one-event batch size.
 const event=p.material.events[0]!.event;const maxBytes=Buffer.byteLength(canonicalJson({schemaVersion:'1.0',batchId:'a'.repeat(48),experimentId:event.experimentId,runId:event.runId,events:[event]}));
 const {channelId}=stage(f,s,{...f.envelope,maxBytes});o.set(m=>{o.normal(m);throw new Error('lost acknowledgement');});await s.deliver({channelId});advance(f);o.set(o.normal);await s.deliver({channelId});
 assert.deepEqual(o.calls.map(m=>m.method),['POST','GET']);assert.equal(o.calls[1]!.body.length,0);assert.equal(s.health(channelId).delivered,1);assert.equal(f.store.all<{bytes:number}>('SELECT bytes FROM investment_public_attempts')[1]!.bytes,0);
});
test('late acknowledgement survives a replacement lease and cannot be downgraded by later failure',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);let finishA!:(r:WireResponse)=>void,finishB!:(r:WireResponse)=>void;
 o.set(()=>new Promise(resolve=>{finishA=resolve;}));const a=s.deliver({channelId});advance(f,31);o.set(()=>new Promise(resolve=>{finishB=resolve;}));const b=s.deliver({channelId});
 finishA(o.normal(o.calls[0]!));await a;finishB(problem(403,'FORBIDDEN'));await b;assert.equal(s.health(channelId).delivered,1);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM investment_public_results WHERE receipt IS NOT NULL')!.n,1);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM investment_public_results')!.n,2);
});
test('unknown write stays reconciliation-only after failed GET, key rotation and renewed consent',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);o.set(()=>{throw new Error('lost');});await s.deliver({channelId});advance(f);o.set(()=>problem(403,'FORBIDDEN'));await s.deliver({channelId});
 s.control({channelId,action:'rotate',keyId:'rotated-key',generation:null});stage(f,s);advance(f);o.set(o.normal);await s.deliver({channelId});assert.deepEqual(o.calls.map(m=>m.method),['POST','GET','GET']);
 advance(f);await s.deliver({channelId});assert.equal(o.calls[3]!.method,'POST');assert.deepEqual(o.calls[3]!.body,o.calls[0]!.body);
});
test('revocation during transmission retains receipt and stops future transmission',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);o.set(m=>{s.control({channelId,action:'revoke',keyId:null,generation:null});return o.normal(m);});await s.deliver({channelId});assert.equal(s.health(channelId).delivered,1);await assert.rejects(s.deliver({channelId}),/grant_inactive/);assert.equal(o.calls.length,1);
});
test('backlog age exposes a new-risk denial signal while active bounded catch-up continues',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s,{...f.envelope,maxAgeSeconds:1});advance(f);
 assert.equal(s.health(channelId).newRiskBlocked,true);assert.equal(s.health(channelId).deliveryBlocked,false);await s.deliver({channelId});assert.equal(s.health(channelId).delivered,1);
});

for(const [field,changed] of Object.entries({batchId:'wrong',experimentId:'wrong',runId:'wrong',bodyDigest:'0'.repeat(64),acceptedIds:['wrong'],duplicateIds:['wrong'],watermark:{sourceSequence:'0',journalSequence:null,journalHash:null,sourceGaps:false}}))test(`mismatched batch receipt ${field} cannot acknowledge delivery or alter accounting`,async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s),before=f.sim.journal(f.config.runId);
 o.set(m=>{const r=o.normal(m);return ok({...parseJson(r.bytes) as object,[field]:changed});});await s.deliver({channelId});
 assert.equal(s.health(channelId).delivered,0);assert.equal(s.health(channelId).uncertain,1);assert.deepEqual(f.sim.journal(f.config.runId),before);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM investment_public_results WHERE receipt IS NOT NULL')!.n,0);
});
for(const [field,changed] of Object.entries({uploadId:'wrong',experimentId:'wrong',runId:'wrong',sha256:'0'.repeat(64),contentType:'text/csv',sizeBytes:999}))test(`mismatched content receipt ${field} cannot acknowledge delivery`,async t=>{
 const f=publicationFixture();t.after(f.cleanup);const original=Buffer.from('private fixture');f.artifact({id:'original',version:1,title:'Derivative',createdAt:f.clock.now(),approvedAt:f.clock.now(),sourceHash:sha256(original),bytes:Buffer.from('Public derivative'),contentType:'text/plain',limitations:['Synthetic']},original);
 const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s),before=f.sim.journal(f.config.runId);o.set(m=>ok({...parseJson(o.normal(m).bytes) as object,[field]:changed}));await s.deliver({channelId});
 assert.equal(s.health(channelId).delivered,0);assert.equal(s.health(channelId).jobs[0]!.kind,'content');assert.deepEqual(f.sim.journal(f.config.runId),before);
});
test('mismatched heartbeat receipt cannot acknowledge the heartbeat',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);while(s.health(channelId).pending)await s.deliver({channelId});s.heartbeat({channelId});const before=f.sim.journal(f.config.runId),delivered=s.health(channelId).delivered;
 o.set(m=>ok({...parseJson(o.normal(m).bytes) as object,heartbeatId:'wrong'}));await s.deliver({channelId});assert.equal(s.health(channelId).delivered,delivered);assert.equal(s.health(channelId).jobs.at(-1)!.state,'uncertain');assert.deepEqual(f.sim.journal(f.config.runId),before);
});
test('restart requires newer remote generation and matching remote watermark before authority resumes',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);await s.deliver({channelId});const restarted=f.configured(o.transport);
 await assert.rejects(restarted.deliver({channelId}),/restore_reconciliation_required/);await assert.rejects(restarted.reconcile({channelId}),/generation_advance_required/);
 restarted.control({channelId,action:'generation',keyId:null,generation:'2'});stage(f,restarted);await assert.rejects(s.deliver({channelId}),/restore_reconciliation_required/);o.set(()=>problem(403,'FORBIDDEN'));await assert.rejects(restarted.reconcile({channelId}),/restore_receipt_required/);assert.equal(restarted.health(channelId).restoreRequired,true);
 o.set(o.normal);await restarted.reconcile({channelId});assert.equal(restarted.health(channelId).restoreRequired,false);await assert.rejects(s.deliver({channelId}),/restore_reconciliation_required/);await restarted.deliver({channelId});assert.equal(restarted.health(channelId).delivered,2);
});
test('source ID reuse cannot rebind old run rights or previews',t=>{
 const f=publicationFixture();t.after(f.cleanup);stage(f,f.service);const source={id:f.source.id,title:'Different run',mode:f.source.mode,participants:f.source.participants,privateRunId:'other-run',project:f.source.project.bind(f.source),checkRights:()=>{throw new Error('must not inspect wrong run');}};
 const replacement=new PublicationService(f.store,{sources:[source],destinations:[f.destination],clock:f.clock});assert.throws(()=>replacement.preview(f.envelope),/source_binding_changed/);
});
test('stage transaction rolls back grants, jobs and controls together after fault',t=>{
 const f=publicationFixture({fault:phase=>{if(phase==='before_stage_commit')throw new Error('disk failure');}});t.after(f.cleanup);const p=f.service.preview(f.envelope);assert.throws(()=>f.service.consent({previewId:p.id,digest:p.digest}),/disk failure/);
 for(const table of ['grants','jobs','controls'])assert.equal(f.store.get<{n:number}>(`SELECT count(*) n FROM investment_public_${table}`)!.n,0);
});
test('a content job cannot be reassigned to consent for another content type',t=>{
 const f=publicationFixture();t.after(f.cleanup);const bytes=Buffer.from('Approved synthetic derivative');f.artifact({id:'original-artifact',version:1,title:'Fixture artifact',createdAt:f.clock.now(),approvedAt:f.clock.now(),sourceHash:sha256(Buffer.from('private source')),bytes,contentType:'text/plain',limitations:['Invented fixture']},Buffer.from('private source'));
 stage(f,f.service,{...f.envelope,eventTypes:['run.published'],contentTypes:['text/plain']});f.description.artifacts[0]!.contentType='text/markdown';const p=f.service.preview({...f.envelope,eventTypes:['run.published'],contentTypes:['text/markdown']});assert.throws(()=>f.service.consent({previewId:p.id,digest:p.digest}),/pending_content_conflict/);
 const j=f.store.get<Job>("SELECT * FROM investment_public_jobs WHERE kind='content'")!;assert.equal(j.content_type,'text/plain');
});
test('never-sent restored channel resumes only after authenticated receipt absence and current run absence',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s),r=f.configured(o.transport);r.control({channelId,action:'generation',keyId:null,generation:'2'});stage(f,r);await r.reconcile({channelId});assert.equal(r.health(channelId).restoreRequired,false);assert.deepEqual(o.calls.map(m=>m.path.split('/').at(-1)),[s.health(channelId).jobs[0]!.id,'status']);await r.deliver({channelId});assert.equal(r.health(channelId).delivered,1);
});
test('absent final attempt reconciles against earlier delivered receipt and current matching head',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);await s.deliver({channelId});o.set(()=>{throw new Error('failed before commit');});await s.deliver({channelId});advance(f,31);const r=f.configured(o.transport);r.control({channelId,action:'generation',keyId:null,generation:'2'});stage(f,r);o.set(o.normal);await r.reconcile({channelId});await r.deliver({channelId});assert.equal(r.health(channelId).delivered,2);
});
test('only one restored instance can claim a generation, including overlapping late status responses',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);await s.deliver({channelId});const a=f.configured(o.transport),b=f.configured(o.transport);a.control({channelId,action:'generation',keyId:null,generation:'2'});stage(f,a);
 const held:{m:SignedMessage;resolve:(response:WireResponse)=>void}[]=[];o.set(m=>m.path.endsWith('/status')?new Promise(resolve=>held.push({m,resolve})):o.normal(m));const pendingA=a.reconcile({channelId}),pendingB=b.reconcile({channelId});await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(held.length,2);
 held[1]!.resolve(o.normal(held[1]!.m));await pendingB;held[0]!.resolve(o.normal(held[0]!.m));await assert.rejects(pendingA,/generation_fenced/);await assert.rejects(a.reconcile({channelId}),/already_reconciled/);await assert.rejects(a.deliver({channelId}),/restore_reconciliation_required/);assert.equal(b.health(channelId).restoreRequired,false);
});
test('standing financial consent captures later fills while new derivative explanations stay blocked',t=>{
 const f=publicationFixture();t.after(f.cleanup);const order=f.order(),{channelId}=stage(f,f.service,{...f.envelope,futureFinancial:true,maxAgeSeconds:1});const initial=f.service.health(channelId).pending;
 f.clock.set('2026-03-06T14:31:00.000Z');f.price('ACME','2026-03-06','regular_open','100');f.admitted.execute(f.config.runId,{type:'fill',orderId:order.id},'later-fill');assert.ok(f.service.health(channelId).unstaged>0);assert.equal(f.service.health(channelId).newRiskBlocked,true);
 f.service.capture({channelId});assert.equal(f.service.health(channelId).unstaged,0);assert.equal(f.service.health(channelId).pending,initial+2);const captures=f.store.all('SELECT * FROM investment_public_captures').length;f.service.capture({channelId});assert.equal(f.store.all('SELECT * FROM investment_public_captures').length,captures);
 f.clock.set('2026-03-09T14:00:00.000Z');f.order('new-thesis','2026-03-10');assert.throws(()=>f.service.capture({channelId}),/new_derivative_approval_required/);assert.ok(f.service.health(channelId).unstaged>0);
});
test('finite preview consent never implies permission for future capture',t=>{
 const f=publicationFixture();t.after(f.cleanup);const {channelId}=stage(f,f.service);assert.throws(()=>f.service.capture({channelId}),/standing_capture_denied/);
});
test('permanent receiver errors block and outage retries grow within a finite budget',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);o.set(()=>problem(415,'UNSUPPORTED_MEDIA'));await s.deliver({channelId});assert.equal(s.health(channelId).jobs[0]!.state,'blocked');const calls=o.calls.length;await s.deliver({channelId});assert.equal(o.calls.length,calls);
 const a=publicationFixture();t.after(a.cleanup);const z=oracle(a),q=a.configured(z.transport),c=stage(a,q).channelId;z.set(()=>{throw new Error('fixture outage');});await q.deliver({channelId:c});const first=q.health(c).jobs[0]!.retryAt!;const firstDelay=Date.parse(first)-Date.parse(a.clock.now());advance(a,2);await q.deliver({channelId:c});const secondDelay=Date.parse(q.health(c).jobs[0]!.retryAt!)-Date.parse(a.clock.now());assert.ok(firstDelay>=1000&&firstDelay<=1500);assert.ok(secondDelay>=2000&&secondDelay<=2500);
});
test('receiver 429 waits the declared bounded delay without another immediate transmission',async t=>{
 const f=publicationFixture();t.after(f.cleanup);const o=oracle(f),s=f.configured(o.transport),{channelId}=stage(f,s);o.set(()=>({status:429,contentType:'application/problem+json',bytes:Buffer.from(canonicalJson({schemaVersion:'1.0',code:'RATE_LIMITED',status:429,requestId:'fixture-rate',retryable:true,detail:'Fixture rate',retryAfterSeconds:60,resync:null}))}));await s.deliver({channelId});await s.deliver({channelId});assert.equal(o.calls.length,1);assert.equal(Date.parse(s.health(channelId).jobs[0]!.retryAt!)-Date.parse(f.clock.now()),60000);
});
