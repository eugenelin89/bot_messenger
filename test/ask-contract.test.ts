import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AskClaim, AskQuestion, AskControlSync, AskAnswerReceipt } from '../contracts/investment/v1/types.js';
import {
  ASK_WIRE_BYTES, ASK_PROBLEM_BYTES, prepareAskRequest, decodeAskResponse, assertAskRequestCurrent,
  assertAskRetry, askReceiptIdentity, type AskOperation, type AskBoundaryContext, type AskWireResponse,
} from '../src/domain/ask/contract.js';
import { canonicalHash, canonicalJson, ContractError, sha256, problem } from '../scripts/investment-contracts/schema.js';
import { questionHash } from '../scripts/investment-contracts/ask.js';
import { signatureBase, signatureInput, contentDigest } from '../scripts/investment-contracts/signatures.js';

const examples = JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const openapi = JSON.parse(readFileSync('contracts/investment/v1/openapi.json','utf8'));
const fixture = <T>(name: string): T => structuredClone(examples[name]);
const context = (): AskBoundaryContext => ({scope:fixture('AskServiceScope'), limits:fixture('AskLimits'), now:'2026-01-05T21:32:00Z'});
const operations = (): AskOperation[] => [
  {kind:'claim', input:fixture('AskClaimInput')},
  {kind:'renew', requestId:'fixture-renew', claim:fixture('AskClaim'), input:fixture('AskRenewInput')},
  {kind:'status', requestId:'fixture-status', claim:fixture('AskClaim'), input:fixture('AskStatusDelivery')},
  {kind:'answer', requestId:'fixture-delivery', claim:fixture('AskClaim'), input:fixture('AskAnswerDelivery')},
  {kind:'receipt', identity:askReceiptIdentity(fixture('AskAnswer'))},
  {kind:'control_sync', input:fixture('AskControlSyncInput')},
];
const wire = (value: unknown): AskWireResponse => ({status:200,contentType:'application/json',cacheControl:'private, no-store',bytes:Buffer.from(JSON.stringify(value))});
function responseName(op: AskOperation): string {
  return ({claim:'AskClaimPage',renew:'AskClaim',status:'AskStatus',answer:'AskAnswerReceipt',receipt:'AskAnswerReceipt',control_sync:'AskControlSync'})[op.kind];
}
function fails(fn:()=>unknown, code?: string) {
  assert.throws(fn,e=>e instanceof ContractError && (!code || e.code===code));
}
function changedClaim(mutate:(q:AskQuestion)=>void): AskClaim {
  const c=fixture<AskClaim>('AskClaim');mutate(c.question);c.question.questionHash=questionHash(c.question);return c;
}
for(const op of operations()) test(`Ask ${op.kind} uses existing OpenAPI method, path, permission and named golden response`,()=>{
  const ctx=context(),request=prepareAskRequest(op,ctx);
  const path=request.path.replace('fixture-claim','{id}').replace('fixture-question-a','{id}').replace('fixture-answer-a','{answerId}');
  const spec=openapi.paths[path][request.method.toLowerCase()];assert.ok(spec);
  assert.equal(spec['x-required-scope'],request.permission);
  assert.equal(spec.responses['200'].content['application/json'].schema.$ref,`./schema.json#/$defs/${responseName(op)}`);
  assert.equal(request.origin,'https://asymmetri.co');assert.equal(request.bodyHash,sha256(request.body));
  assert.equal(decodeAskResponse(request,wire(fixture(responseName(op))),ctx).kind,'data');
  if(request.method==='GET'){assert.equal(request.body,'');assert.equal(request.requestId,null);}else{
    assert.equal(request.body,canonicalJson('input' in op?op.input:op.identity));
    const id='claimRequestId' in ('input' in op?op.input:{})?(op as Extract<AskOperation,{kind:'claim'}>).input.claimRequestId:request.requestId;
    assert.equal(request.requestId,id);
  }
  const reply=fixture<Record<string,unknown>>(responseName(op));reply.privateThreadId='forbidden';
  fails(()=>decodeAskResponse(request,wire(reply),ctx),'INVALID_SCHEMA');
  const noPermission=context(),permissions=noPermission.scope.permissions.filter(p=>p!==request.permission);
  assert.ok(permissions.length > 0);
  noPermission.scope.permissions=permissions as typeof noPermission.scope.permissions;
  fails(()=>prepareAskRequest(op,noPermission));
});

test('prepared Ask intent is immutable; caller changes cannot alter body or response binding',()=>{
  const op=operations()[3]! as Extract<AskOperation,{kind:'answer'}>,ctx=context(),req=prepareAskRequest(op,ctx),body=req.body;
  op.input.answer.text='changed';op.claim.question.input.text='changed';ctx.scope.consumerGeneration='2';
  assert.equal(req.body,body);assert.ok(Object.isFrozen(req)&&Object.isFrozen(req.binding));
  fails(()=>assertAskRequestCurrent(req,ctx),'CONFLICT');
  assert.equal(decodeAskResponse(req,wire(fixture('AskAnswerReceipt')),context()).kind,'data');
});
for(const change of ['service','key','generation','expiry','disabled','limits'] as const)test(`Ask rejects prepared ${change} changes before response/next transmission`,()=>{
  const ctx=context(),req=prepareAskRequest(operations()[0]!,ctx);
  if(change==='service')ctx.scope.serviceId='other';if(change==='key')ctx.scope.keyId='other';
  if(change==='generation')ctx.scope.consumerGeneration='2';if(change==='expiry')ctx.now=ctx.scope.expiresAt;
  if(change==='disabled')ctx.scope.enabled=false;if(change==='limits')ctx.limits.dailyExecutions--;
  fails(()=>assertAskRequestCurrent(req,ctx));
  if(change!=='expiry')fails(()=>decodeAskResponse(req,wire(fixture('AskClaimPage')),ctx));
});

test('Ask paths cannot be supplied or escaped through identities and publication scope is not Ask scope',()=>{
  const op=operations()[1]! as Extract<AskOperation,{kind:'renew'}>;
  for(const id of ['../claims','a/b','a%2fb','a?b','a#b','a\nb']){op.claim.claimId=id;fails(()=>prepareAskRequest(op,context()),'INVALID_SCHEMA');}
  fails(()=>prepareAskRequest({kind:'publish'} as unknown as AskOperation,context()));
  fails(()=>prepareAskRequest(operations()[0]!,{...context(),scope:fixture('PublisherScope')}));
  const forged=operations()[0]! as Extract<AskOperation,{kind:'claim'}>;
  Object.assign(forged.input,{tools:['shell'],callbackUrl:'https://evil.test'});fails(()=>prepareAskRequest(forged,context()),'INVALID_SCHEMA');
});

test('Ask prepared bytes use the existing signature profile and preserve empty GET semantics',()=>{
  for(const op of operations()){
    const req=prepareAskRequest(op,context()),body=Buffer.from(req.body),headers:[string,string][]=[['botsquad-generation','1']];
    if(req.requestId)headers.push(['content-type','application/json'],['content-digest',contentDigest(body)],['idempotency-key',req.requestId]);
    const input=signatureInput(req.method,{created:1767648720,expires:1767648780,keyId:'fixture-ask-key',nonce:'abcdefghijklmnopqrstuv'});
    const base=signatureBase({method:req.method,authority:'asymmetri.co',path:req.path,headers,body},input);
    assert.ok(base.includes(`"@path": ${req.path}`));assert.equal(base.includes('"idempotency-key":'),req.method==='POST');
  }
});

test('Ask retry checks frozen wrapper while answer identity survives new claim/control wrappers',()=>{
  const op=operations()[3]! as Extract<AskOperation,{kind:'answer'}>,first=prepareAskRequest(op,context());
  assertAskRetry(first,prepareAskRequest(structuredClone(op),context()));
  op.input.lastControlSyncId='new-sync';const changed=prepareAskRequest(op,context());fails(()=>assertAskRetry(first,changed),'CONFLICT');
  assert.equal(changed.binding.answerDigest,first.binding.answerDigest);assert.notEqual(changed.bodyHash,first.bodyHash);
  op.requestId='new-transport-id';const fresh=prepareAskRequest(op,context());fails(()=>assertAskRetry(first,fresh),'CONFLICT');
  assert.equal(decodeAskResponse(fresh,wire(fixture('AskAnswerReceipt')),context()).kind,'data');
  const receipt=fixture<AskAnswerReceipt>('AskAnswerReceipt');receipt.answerDigest=canonicalHash(op.input);
  fails(()=>decodeAskResponse(fresh,wire(receipt),context()),'CONFLICT');
});

for(const [name,mutate] of [
  ['service',(c:AskClaim)=>{c.serviceId='other';}],
  ['generation',(c:AskClaim)=>{c.consumerGeneration='2';}],
  ['nested service',(c:AskClaim)=>{c.question.serviceId='other';c.question.questionHash=questionHash(c.question);}],
  ['hash',(c:AskClaim)=>{c.question.input.text='tampered';}],
  ['lease',(c:AskClaim)=>{c.leaseExpiresAt='2026-01-05T21:32:00Z';}],
  ['long lease',(c:AskClaim)=>{c.leaseExpiresAt='2026-01-05T21:41:00Z';}],
  ['expired',(c:AskClaim)=>{c.question.expiresAt='2026-01-05T21:31:00Z';c.question.questionHash=questionHash(c.question);}],
  ['future received',(c:AskClaim)=>{c.question.receivedAt='2026-01-05T21:34:00Z';c.question.questionHash=questionHash(c.question);}],
] as const)test(`Ask claim rejects ${name}`,()=>{
  const p=fixture<{claim:AskClaim}>('AskClaimPage');mutate(p.claim);
  fails(()=>decodeAskResponse(prepareAskRequest(operations()[0]!,context()),wire(p),context()));
});

test('Ask claim request identity, renewal full question, prior history and fresh general context are checked',()=>{
  const ctx=context(),claimReq=prepareAskRequest(operations()[0]!,ctx),p=fixture<Record<string,unknown>>('AskClaimPage');p.claimRequestId='other';
  fails(()=>decodeAskResponse(claimReq,wire(p),ctx),'CONFLICT');
  const renewal=prepareAskRequest(operations()[1]!,ctx);
  fails(()=>decodeAskResponse(renewal,wire(changedClaim(q=>{q.sessionId='other-session';})),ctx),'CONFLICT');
  const general=changedClaim(q=>{q.input.context=null;q.input.text='SYNTHETIC: explain recursion.';});
  assert.equal(decodeAskResponse(claimReq,wire({...fixture<object>('AskClaimPage'),claim:general}),ctx).kind,'data');
  for(const mutate of [(q:AskQuestion)=>{q.priorOwnedQuestionIds=[q.questionId];q.input.priorQuestionId=q.questionId;},(q:AskQuestion)=>{q.input.priorQuestionId='unknown';}])
    fails(()=>decodeAskResponse(claimReq,wire({...fixture<object>('AskClaimPage'),claim:changedClaim(mutate)}),ctx),'CONFLICT');
});

test('status binds question/hash and allows authoritative cancellation, without worker or dispatch proof',()=>{
  const req=prepareAskRequest(operations()[2]!,context()),status=fixture<Record<string,unknown>>('AskStatus');
  status.state='cancelled';status.route=null;status.safeReason='Cancelled by visitor.';
  assert.equal(decodeAskResponse(req,wire(status),context()).kind,'data');
  status.questionHash='a'.repeat(64);fails(()=>decodeAskResponse(req,wire(status),context()),'CONFLICT');
});
for(const kind of ['answer','receipt'] as const)test(`${kind} verifies every identity and retains suppressed dispositions`,()=>{
  const req=prepareAskRequest(operations().find(o=>o.kind===kind)!,context());
  for(const field of ['answerId','questionId','questionHash','answerDigest'] as const){
    const r=fixture<AskAnswerReceipt>('AskAnswerReceipt');r[field]=field.endsWith('Hash')||field.endsWith('Digest')?'a'.repeat(64):'other';
    fails(()=>decodeAskResponse(req,wire(r),context()),'CONFLICT');
  }
  for(const disposition of ['accepted','discarded_deleted','discarded_cancelled','discarded_expired','withheld_evidence'] as const){
    const r=fixture<AskAnswerReceipt>('AskAnswerReceipt');r.disposition=disposition;
    const decoded=decodeAskResponse(req,wire(r),context());assert.ok(decoded.kind==='data');assert.deepEqual(decoded.value,r);
  }
});

test('control pages never claim durable application or dispatch authority; stale empty page is not a fresh barrier',()=>{
  const req=prepareAskRequest(operations()[5]!,context()),page=fixture<AskControlSync>('AskControlSync');
  for(const [controls,cursor,expected] of [[page.controls,null,false],[page.controls,'next-page',false],[[],'next-page',false],[[],null,true]] as const){
    const r=decodeAskResponse(req,wire({...page,controls,nextCursor:cursor}),context());
    assert.ok(r.kind==='data');assert.equal(r.terminalControlPage,expected);assert.equal('controlsDrained' in r,false);assert.equal('dispatch' in r,false);
  }
  const later={...context(),now:'2026-01-05T21:33:00Z'},r=decodeAskResponse(req,wire({...page,controls:[],nextCursor:null}),later);
  assert.ok(r.kind==='data');assert.equal(r.terminalControlPage,false);
  // Expired freshness does not throw away deletion/cancellation records that still need applying.
  assert.equal(decodeAskResponse(req,wire(page),later).kind,'data');
});
test('tighter local control freshness preserves privacy records and shortens only the terminal barrier',()=>{
  const ctx=context();ctx.limits.controlFreshnessSeconds=30;
  const req=prepareAskRequest(operations()[5]!,ctx),page=fixture<AskControlSync>('AskControlSync');
  assert.equal(decodeAskResponse(req,wire(page),ctx).kind,'data');
  const empty={...page,controls:[],nextCursor:null};
  const fresh=decodeAskResponse(req,wire(empty),ctx);
  assert.ok(fresh.kind==='data');assert.equal(fresh.terminalControlPage,true);
  const later={...ctx,now:'2026-01-05T21:32:31Z'};
  assert.equal(decodeAskResponse(req,wire(page),later).kind,'data');
  const stale=decodeAskResponse(req,wire(empty),later);
  assert.ok(stale.kind==='data');assert.equal(stale.terminalControlPage,false);
});
for(const [name,mutate] of [
  ['sync',(s:AskControlSync)=>{s.syncId='other';}],['duplicate controls',(s:AskControlSync)=>{s.controls.push({...s.controls[0]!});}],
  ['future check',(s:AskControlSync)=>{s.checkedAt='2026-01-05T21:32:01Z';}],['reversed validity',(s:AskControlSync)=>{s.validUntil=s.checkedAt;}],
  ['excess validity',(s:AskControlSync)=>{s.validUntil='2026-01-05T21:33:01Z';}],
  ['future action',(s:AskControlSync)=>{s.controls[0]!.effectiveAt='2026-01-05T21:32:01Z';}],
  ['purge before action',(s:AskControlSync)=>{s.controls[0]!.purgeBy='2026-01-05T21:31:00Z';}],
  ['suppression before purge',(s:AskControlSync)=>{s.controls[0]!.suppressionUntil=s.checkedAt;}],
  ['unbounded retention',(s:AskControlSync)=>{s.controls[0]!.suppressionUntil='2027-01-01T00:00:00Z';}],
  ['cancel without question',(s:AskControlSync)=>{s.controls[0]!.questionId=null;}],
] as const)test(`Ask control rejects ${name}`,()=>{const page=fixture<AskControlSync>('AskControlSync');mutate(page);fails(()=>decodeAskResponse(prepareAskRequest(operations()[5]!,context()),wire(page),context()));});

test('response parser rejects duplicate keys, invalid UTF-8, excessive body/depth, wrong media and public caching',()=>{
  const req=prepareAskRequest(operations()[0]!,context()),valid=wire(fixture('AskClaimPage'));
  for(const bytes of [Buffer.from('{"claim":null,"claim":null}'),Buffer.from([0xc0,0xaf]),Buffer.alloc(ASK_WIRE_BYTES+1),Buffer.from('['.repeat(18)+'0'+']'.repeat(18))])
    fails(()=>decodeAskResponse(req,{...valid,bytes},context()));
  for(const cacheControl of ['public, max-age=60','no-store','private','private, no-store, public'])fails(()=>decodeAskResponse(req,{...valid,cacheControl},context()),'FORBIDDEN');
  for(const status of [201,204,302])fails(()=>decodeAskResponse(req,{...valid,status},context()));
  fails(()=>decodeAskResponse(req,{...valid,contentType:'text/html'},context()),'UNSUPPORTED_MEDIA');
});

test('bounded problem decoding discards remote details and retry claims, validates status and never commands model replay',()=>{
  const req=prepareAskRequest(operations()[0]!,context()),p=problem('OUTCOME_UNKNOWN','fixture-problem');p.detail='remote-private-stack';p.retryable=true;
  const reply={...wire(p),status:409,contentType:'application/problem+json'},r=decodeAskResponse(req,reply,context());
  assert.deepEqual(r,{kind:'problem',code:'OUTCOME_UNKNOWN',status:409,retryAfterSeconds:null});assert.ok(!JSON.stringify(r).includes('remote-private-stack'));
  fails(()=>decodeAskResponse(req,{...reply,status:500},context()));
  fails(()=>decodeAskResponse(req,{...reply,bytes:Buffer.alloc(ASK_PROBLEM_BYTES+1)},context()),'TOO_LARGE');
});

test('HQ answer envelope can exceed browser input cap but remains byte bounded',()=>{
  const op=operations()[3]! as Extract<AskOperation,{kind:'answer'}>;
  op.input.answer.text='€'.repeat(8000);const req=prepareAskRequest(op,context());assert.ok(Buffer.byteLength(req.body)>context().limits.requestBytes);
  const ctx=context();ctx.limits.answerCharacters=100;fails(()=>prepareAskRequest(op,ctx),'TOO_LARGE');
  op.input.answer.publicSources=Array.from({length:20},(_,i)=>({sourceId:'source-'+i,url:'https://example.com/public',title:'€'.repeat(300),publisher:'€'.repeat(200),publishedAt:null,eventAt:null,retrievedAt:'2026-01-05T21:30:00Z',summary:'€'.repeat(2000),limitations:Array.from({length:10},()=>'€'.repeat(500)),rights:'public_link'}));
  fails(()=>prepareAskRequest(op,context()),'TOO_LARGE');
});

for(const kind of ['renew','status','answer'] as const)test(`${kind} prepared before expiry cannot transmit after claim or question expiry`,()=>{
  const req=prepareAskRequest(operations().find(o=>o.kind===kind)!,context());
  for(const now of ['2026-01-05T21:35:00Z','2026-01-05T21:40:00Z'])
    fails(()=>assertAskRequestCurrent(req,{...context(),now}),'EXPIRED');
});
test('delayed historical and suppression receipts remain decodable after transmitted lease expires',()=>{
  const req=prepareAskRequest(operations()[3]!,context()),ctx={...context(),now:'2026-01-05T21:41:00Z'};
  for(const disposition of ['accepted','discarded_expired','discarded_deleted'] as const){
    const r=fixture<AskAnswerReceipt>('AskAnswerReceipt');r.disposition=disposition;
    assert.equal(decodeAskResponse(req,wire(r),ctx).kind,'data');
  }
  // Pure response decoding also records a pre-expiry acceptance after scope time has elapsed.
  assert.equal(decodeAskResponse(req,wire(fixture('AskAnswerReceipt')),{...ctx,now:ctx.scope.expiresAt}).kind,'data');
});
test('minimal receipt identity works after raw answer purge and tighter content limits',()=>{
  const a=fixture<import('../contracts/investment/v1/types.js').AskAnswer>('AskAnswer');a.text='a'.repeat(8000);
  const identity=askReceiptIdentity(a),r=fixture<AskAnswerReceipt>('AskAnswerReceipt');r.answerDigest=identity.answerDigest;
  a.text='';const ctx=context();ctx.limits.answerCharacters=100;
  const req=prepareAskRequest({kind:'receipt',identity},ctx);assert.equal(req.body,'');assert.equal('text' in identity,false);
  ctx.limits.answerCharacters=50;assertAskRequestCurrent(req,ctx);
  assert.equal(decodeAskResponse(req,wire(r),ctx).kind,'data');
});
test('tightened retention policy still consumes valid historical cancellation and deletion records',()=>{
  const ctx=context();ctx.limits.rawRetentionSeconds=60;ctx.limits.suppressionRetentionSeconds=604800;
  const req=prepareAskRequest(operations()[5]!,ctx),page=fixture<AskControlSync>('AskControlSync');
  page.controls[0]!.purgeBy='2026-01-06T21:32:00Z';
  for(const action of ['cancel','delete'] as const){page.controls[0]!.action=action;assert.equal(decodeAskResponse(req,wire(page),ctx).kind,'data');}
});
