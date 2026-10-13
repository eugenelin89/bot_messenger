/** Disposable metadata fixtures only: no provider, operational grant or employee is exercised. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { canonicalHash, canonicalJson, ContractError } from '../scripts/investment-contracts/schema.js';
import { AskAuthorityJournal, ASK_AUTHORITY_CAPACITY } from '../src/control/ask/authority-journal.js';
import { admission, configuration, grant, micros, reservation, usage, type AskGrant, type AskGrantConfiguration, type AskReservation, type AskAdmissionProof, type AskUsageReceipt } from '../src/domain/ask/authority.js';
import type { AskWireProof } from '../src/control/ask/transport.js';
const examples=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const at='2026-01-05T21:32:00.000Z',later='2026-01-05T21:32:10.000Z',h=(s:string)=>canonicalHash(s);
function fixture(){
 const base=mkdtempSync(join(realpathSync(tmpdir()),'ask-authority-')),dir=join(base,'authority'),cp=join(base,'independent'),excluded=join(base,'company-backups');
 for(const p of [dir,cp,excluded])mkdirSync(p,{mode:0o700});
 let journal=AskAuthorityJournal.createFixture(dir,cp,'fixture-hq',[excluded],at);
 return {base,dir,cp,excluded,get journal(){return journal;},reopen(){journal.close();journal=new AskAuthorityJournal(dir,cp,'fixture-hq',[excluded]);return journal;},close(){journal.close();rmSync(base,{recursive:true,force:true});}};
}
function packet(overrides:Partial<AskGrant>={}){
 const config:AskGrantConfiguration={scope:structuredClone(examples.AskServiceScope),limits:structuredClone(examples.AskLimits),roster:structuredClone(examples.AskRoster)};
 config.limits.monetaryEnforcement='verified_cap';config.limits.dailyBudgetUsd='1';
 if(overrides.serviceId){config.scope.serviceId=overrides.serviceId;config.roster.serviceId=overrides.serviceId;}
 if(overrides.generation)config.scope.consumerGeneration=overrides.generation;
 const g:AskGrant={id:'grant-a',hqId:'fixture-hq',serviceId:config.scope.serviceId,generation:config.scope.consumerGeneration,
 scopeDigest:canonicalHash(config.scope),limitsDigest:canonicalHash(config.limits),rosterDigest:canonicalHash(config.roster),workerIds:['fixture-author'],adapterId:'fixture-adapter',model:'fixture-model.1',profileDigest:h('profile'),accountDigest:h('account'),routingDigest:h('routing'),eligibilityDigest:h('eligibility'),costPolicyDigest:h('cost'),contextPolicyDigest:h('context'),toolPolicyDigest:h('tools'),approvalDigest:h('approval'),approvedAt:at,expiresAt:'2026-01-05T23:32:00.000Z',maxExecutions:4,dailyExecutions:2,maxInputTokens:100,maxOutputTokens:50,totalTokens:600,dailyTokens:300,maxDurationMs:60000,maxChargeMicros:'100',totalChargeMicros:'400',dailyChargeMicros:'200',monetaryMode:'verified_cap',routerExecutions:0,researchCalls:0,...overrides};
 return {g,config};
}
function binding(g=packet().g,n='a',time=at):AskReservation{return{id:'execution-'+n,grantId:g.id,serviceId:g.serviceId,generation:g.generation,questionId:'question-'+n,questionHash:h('question-'+n),conversationId:'conversation-'+n,workerId:g.workerIds[0]!,workerSessionId:'worker-session-'+n,providerGeneration:1,contextDigest:h('context-'+n),claimDigest:h('claim-'+n),requestDigest:h('request-'+n),reservedAt:time,deadline:new Date(Date.parse(time)+60000).toISOString(),questionExpiresAt:new Date(Date.parse(time)+120000).toISOString()};}
function proof(g:AskGrant,r:AskReservation):AskAdmissionProof{return{adapterId:g.adapterId,model:g.model,profileDigest:g.profileDigest,accountDigest:g.accountDigest,routingDigest:g.routingDigest,eligibilityDigest:g.eligibilityDigest,costPolicyDigest:g.costPolicyDigest,contextPolicyDigest:g.contextPolicyDigest,toolPolicyDigest:g.toolPolicyDigest,scopeDigest:g.scopeDigest,limitsDigest:g.limitsDigest,rosterDigest:g.rosterDigest,checkedAt:r.reservedAt,expiresAt:r.deadline,providerSessionId:'provider-'+r.id,reservationDigest:canonicalHash(r),publicServiceAllowed:true,inputBoundEnforced:true,outputBoundEnforced:true,monetaryMode:g.monetaryMode,maxChargeMicros:g.maxChargeMicros};}
function receipt(p:AskAdmissionProof):AskUsageReceipt{return{providerSessionId:p.providerSessionId,responseDigest:h('response'),usageDigest:h('usage'),inputTokens:5,outputTokens:3,chargeMicros:'1',complete:true};}
function reject(fn:()=>unknown,code?:string){assert.throws(fn,e=>e instanceof ContractError&&(!code||e.code===code));}
function approve(f:ReturnType<typeof fixture>,p=packet()){f.journal.approve(p.g,p.config,p.g.approvedAt);return p.g;}
function settled(f:ReturnType<typeof fixture>,g:AskGrant,n:string){const r=binding(g,n),p=proof(g,r);f.journal.reserve(r,at);f.journal.admit(r.id,p,at);f.journal.beforeModelTransmit(r.id,p,at);f.journal.settle(r.id,receipt(p),at);return{r,p};}
const wire=(n='a',kind:AskWireProof['kind']='claim'):AskWireProof=>({kind,serviceId:'fixture-ask',generation:'1',requestId:kind==='receipt'?null:'request-'+n,intentDigest:h('intent-'+n),signedWireDigest:h('wire-'+n),answerIdentity:kind==='answer'||kind==='receipt'?{serviceId:'fixture-ask',answerId:'answer-a',questionId:'question-a',questionHash:h('question-a'),answerDigest:h('answer-a'),generatedAt:at}:null});

test('strict metadata schemas reject unknown content, imprecise money and expired binding',()=>{
 const {g,config}=packet(),r=binding(g),p=proof(g,r);configuration(grant(g),config);reservation(r);admission(p,g,r,at);usage(receipt(p),g,p.providerSessionId);
 reject(()=>grant({...g,rawQuestion:'private'} as AskGrant),'INVALID_SCHEMA');
 for(const amount of ['1e2','01','1.1','-1','1000000000000000'])reject(()=>micros(amount));
 reject(()=>reservation({...r,questionExpiresAt:at}));
 reject(()=>admission({...p,reservationDigest:h('different')},g,r,at),'CONFLICT');
 reject(()=>admission(p,g,r,r.deadline),'EXPIRED');
 reject(()=>usage({...receipt(p),complete:false} as unknown as AskUsageReceipt,g,p.providerSessionId));
});
test('canonical scope, roster and every bound intersect with grant',()=>{
 const {g,config}=packet();for(const key of ['scopeDigest','limitsDigest','rosterDigest'] as const)reject(()=>configuration({...g,[key]:h('wrong')},config),'CONFLICT');
 reject(()=>configuration({...g,workerIds:['unlisted']},config),'FORBIDDEN');
 reject(()=>configuration({...g,maxInputTokens:config.limits.maxInputTokens+1},config),'BUDGET_EXHAUSTED');
 reject(()=>configuration({...g,expiresAt:'2026-01-07T00:00:00.000Z'},config),'FORBIDDEN');
 const closed=structuredClone(config);closed.scope.enabled=false;reject(()=>configuration({...g,scopeDigest:canonicalHash(closed.scope)},closed),'FORBIDDEN');
 const low=structuredClone(config);low.limits.dailyBudgetUsd='0.0001';reject(()=>configuration({...g,limitsDigest:canonicalHash(low.limits)},low),'BUDGET_EXHAUSTED');
});
test('model settlement preserves full worst-case spend across grants and services',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f);settled(f,g,'a');
 const other=packet({id:'grant-b',serviceId:'service-b'});approve(f,other);settled(f,other.g,'b');
 reject(()=>f.journal.reserve(binding(g,'c'),at),'BUDGET_EXHAUSTED');
 assert.equal(f.journal.inspect().models.length,2);assert.equal(f.journal.inspect().models[0]!.receipt!.inputTokens,5);
});
test('known no-send consumes authority and question identity without refund',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g);f.journal.reserve(r,at);f.journal.notSent(r.id,at);
 reject(()=>f.journal.reserve({...r,id:'different'},at),'CONFLICT');
 f.journal.reserve(binding(g,'b'),at);f.journal.notSent('execution-b',at);
 reject(()=>f.journal.reserve(binding(g,'c'),at),'BUDGET_EXHAUSTED');
});
test('any unresolved model fences other workers and later grants',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g);f.journal.reserve(r,at);f.journal.unknown(r.id,at);
 const next=packet({id:'grant-b',generation:'2'});approve(f,next);
 reject(()=>f.journal.reserve(binding(next.g,'b'),at),'OUTCOME_UNKNOWN');
 reject(()=>f.journal.notSent(r.id,at),'OUTCOME_UNKNOWN');
 assert.equal(f.journal.inspect().models[0]!.state,'unknown');
});
test('restart cannot transmit, settle or refund reservations owned by a prior process',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g),p=proof(g,r);f.journal.reserve(r,at);f.journal.admit(r.id,p,at);f.reopen();
 reject(()=>f.journal.beforeModelTransmit(r.id,p,at),'CONFLICT');reject(()=>f.journal.notSent(r.id,at),'OUTCOME_UNKNOWN');
 reject(()=>f.journal.settle(r.id,receipt(p),at),'OUTCOME_UNKNOWN');f.journal.unknown(r.id,at);assert.equal(f.journal.inspect().models[0]!.state,'unknown');
});
test('revocation between admission and wire denies transmission; confirmed late settlement remains durable',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g),p=proof(g,r);f.journal.reserve(r,at);f.journal.admit(r.id,p,at);f.journal.revoke(g.id,at);
 reject(()=>f.journal.beforeModelTransmit(r.id,p,at),'FORBIDDEN');f.journal.notSent(r.id,at);
 const next=packet({id:'grant-b'});approve(f,next);const r2=binding(next.g,'b'),p2=proof(next.g,r2);f.journal.reserve(r2,at);f.journal.admit(r2.id,p2,at);f.journal.beforeModelTransmit(r2.id,p2,at);f.journal.revoke(next.g.id,at);f.journal.settle(r2.id,receipt(p2),'2026-01-06T00:00:00.000Z');assert.equal(f.journal.inspect().models[1]!.state,'settled');
});
test('new generation fences prior grants and provider sessions cannot cross answers',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),first=settled(f,g,'a');const next=packet({id:'grant-b',generation:'2'});approve(f,next);
 reject(()=>f.journal.reserve(binding(g,'b'),at),'FORBIDDEN');const r=binding(next.g,'c');f.journal.reserve(r,at);
 reject(()=>f.journal.admit(r.id,{...proof(next.g,r),providerSessionId:first.p.providerSessionId},at),'CONFLICT');
});
test('exact context, fresh proof and unchanged admission required immediately before model transmission',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g),p=proof(g,r);f.journal.reserve(r,at);
 reject(()=>f.journal.admit(r.id,{...p,publicServiceAllowed:false} as unknown as AskAdmissionProof,at),'FORBIDDEN');
 reject(()=>f.journal.admit(r.id,{...p,accountDigest:h('other')},at),'FORBIDDEN');f.journal.admit(r.id,p,at);
 reject(()=>f.journal.beforeModelTransmit(r.id,{...p,providerSessionId:'other-provider'},later),'CONFLICT');
 f.journal.beforeModelTransmit(r.id,p,later);reject(()=>f.journal.notSent(r.id,later),'OUTCOME_UNKNOWN');
 reject(()=>f.journal.settle(r.id,{...receipt(p),outputTokens:g.maxOutputTokens+1},later),'BUDGET_EXHAUSTED');
 assert.equal(f.journal.inspect().models[0]!.state,'transmitted');
});
test('lost answer plus transient retry stays unknown until a matching immutable receipt',t=>{
 const f=fixture();t.after(()=>f.close());const a=wire('a','answer'),retry={...a,signedWireDigest:h('fresh-signature')};f.journal.beforeWire('attempt-a',a,at);f.reopen();
 reject(()=>f.journal.beforeWire('attempt-b',{...wire('b','answer'),answerIdentity:{...a.answerIdentity!,answerId:'answer-b'}},at),'OUTCOME_UNKNOWN');
 f.journal.beforeWire('attempt-retry',retry,at);
 f.journal.wireResult('attempt-retry',retry,{kind:'problem',status:503,responseDigest:h('unavailable')},at);
 assert.ok(f.journal.inspect().wires.every(x=>x.state==='unknown'));
 const poll=wire('poll','receipt');f.journal.beforeWire('poll',poll,at);
 f.journal.wireResult('poll',poll,{kind:'problem',status:404,responseDigest:h('not-found')},at);
 reject(()=>f.journal.wireResult('poll',poll,{kind:'data',status:200,responseDigest:h('receipt')},later),'CONFLICT');
 const poll2={...poll,signedWireDigest:h('fresh-poll')};f.journal.beforeWire('poll2',poll2,later);
 const r={schemaVersion:'1.0' as const,receiptId:'receipt-a',answerId:'answer-a',questionId:'question-a',questionHash:h('question-a'),answerDigest:h('answer-a'),receivedAt:later,disposition:'accepted' as const};
 f.journal.wireResult('poll2',poll2,{kind:'data',status:200,responseDigest:canonicalHash(r)},later);
 assert.ok(f.journal.inspect().wires.every(x=>x.state==='unknown'));

 reject(()=>f.journal.reconcileAnswer(['attempt-a','attempt-retry'],'poll2',{...r,answerDigest:h('other')},later),'CONFLICT');
 f.journal.reconcileAnswer(['attempt-a'],'poll2',r,later);
 const conflicting={...r,receiptId:'other-receipt',disposition:'discarded_deleted' as const},poll3={...poll,signedWireDigest:h('third-poll')};
 f.journal.beforeWire('poll3',poll3,later);f.journal.wireResult('poll3',poll3,{kind:'data',status:200,responseDigest:canonicalHash(conflicting)},later);
 reject(()=>f.journal.reconcileAnswer(['attempt-retry'],'poll3',conflicting,later),'CONFLICT');
 assert.equal(f.journal.inspect().wires[1]!.state,'unknown');
 f.journal.reconcileAnswer(['attempt-retry','poll','poll2'],'poll2',r,later);
 assert.ok(f.journal.inspect().wires.slice(0,4).every(x=>x.state==='reconciled'));assert.equal(f.journal.inspect().wires[4]!.state,'unknown');
 reject(()=>f.journal.reconcileAnswer(['attempt-a'],'poll2',{...r,disposition:'discarded_deleted'},later),'CONFLICT');
});
test('wire observation binds the full attempt; identical digest cannot alias another service or operation',t=>{
 const f=fixture();t.after(()=>f.close());const a=wire();f.journal.beforeWire('a',a,at);
 for(const delta of [{serviceId:'other'},{generation:'2'},{kind:'renew' as const},{requestId:'other'}]){
  reject(()=>f.journal.beforeWire('alias',{...a,...delta,signedWireDigest:h('alias')},at),'CONFLICT');
  reject(()=>f.journal.wireResult('a',{...a,...delta},{kind:'data',status:200,responseDigest:h('result')},at),'CONFLICT');
 }
 f.journal.wireResult('a',a,{kind:'data',status:200,responseDigest:h('result')},at);
 reject(()=>f.journal.beforeWire('b',wire('b'),at),'OUTCOME_UNKNOWN');
});
test('privacy and receipt observations proceed through uncertainty but never clear model or claim effects',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),r=binding(g);f.journal.reserve(r,at);f.journal.unknown(r.id,at);
 f.journal.beforeWire('a',wire(),at);const p=wire('receipt','receipt');f.journal.beforeWire('r',p,at);f.journal.beforeWire('c',wire('sync','control_sync'),at);
 f.journal.wireResult('r',p,{kind:'problem',status:404,responseDigest:h('result')},at);
 const poll={...p,signedWireDigest:h('later-receipt')};f.journal.beforeWire('r2',poll,later);
 const result={schemaVersion:'1.0' as const,receiptId:'receipt-a',answerId:'answer-a',questionId:'question-a',questionHash:h('question-a'),answerDigest:h('answer-a'),receivedAt:later,disposition:'accepted' as const};
 f.journal.wireResult('r2',poll,{kind:'data',status:200,responseDigest:canonicalHash(result)},later);
 f.journal.reconcileAnswer(['r','r2'],'r2',result,later);
 assert.equal(f.journal.inspect().models[0]!.state,'unknown');assert.equal(f.journal.inspect().wires[0]!.state,'unknown');
 assert.ok(f.journal.inspect().wires.filter(w=>w.proof.kind==='receipt').every(w=>w.state==='reconciled'));
 reject(()=>f.journal.beforeWire('injected',{...wire('x'),rawBody:'PRIVATE-QUESTION-SENTINEL'} as AskWireProof,later),'INVALID_SCHEMA');
 assert.equal(readFileSync(f.journal.path).includes(Buffer.from('PRIVATE-QUESTION-SENTINEL')),false);
});
test('checkpoint rollback, missing custody and replaced file identity fail closed without rebuilding',t=>{
 const f=fixture();t.after(()=>f.close());const old=readFileSync(f.journal.checkpointPath);approve(f);writeFileSync(f.journal.checkpointPath,old);reject(()=>f.journal.inspect(),'OUTCOME_UNKNOWN');
 assert.throws(()=>new AskAuthorityJournal(f.dir,f.cp,'fixture-hq',[f.excluded]));
});
test('atomic checkpoint replacement is allowed; authority file replacement and insecure modes are denied',t=>{
 const f=fixture();t.after(()=>f.close());approve(f);f.journal.inspect();chmodSync(f.journal.path,0o644);reject(()=>f.journal.inspect(),'FORBIDDEN');chmodSync(f.journal.path,0o600);
 const copy=join(f.dir,'replacement');copyFileSync(f.journal.path,copy);chmodSync(copy,0o600);unlinkSync(f.journal.path);copyFileSync(copy,f.journal.path);chmodSync(f.journal.path,0o600);reject(()=>f.journal.inspect(),'CONFLICT');
});
test('immutable SQLite rows, backward clocks, foreign HQ and excluded backup roots are rejected',t=>{
 const f=fixture();t.after(()=>f.close());approve(f);const db=new DatabaseSync(f.journal.path);try{assert.throws(()=>db.exec('DELETE FROM events'));}finally{db.close();}
 reject(()=>f.journal.revoke('grant-a','2026-01-05T21:31:59.000Z'),'OUTCOME_UNKNOWN');
 reject(()=>new AskAuthorityJournal(f.dir,f.cp,'other-hq',[f.excluded]),'CONFLICT');
 reject(()=>new AskAuthorityJournal(f.dir,f.cp,'fixture-hq',[f.base]),'FORBIDDEN');
});
test('fixture initialization refuses orphaned SQLite sidecars without overwriting them',t=>{
 const base=mkdtempSync(join(realpathSync(tmpdir()),'ask-orphan-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const dirs=['authority','checkpoint','excluded'].map(n=>join(base,n));for(const d of dirs)mkdirSync(d,{mode:0o700});
 const orphan=join(dirs[0]!,'authority.sqlite-journal');writeFileSync(orphan,'orphan',{mode:0o600});
 reject(()=>AskAuthorityJournal.createFixture(dirs[0]!,dirs[1]!,'fixture-hq',[dirs[2]!],at),'OUTCOME_UNKNOWN');assert.equal(readFileSync(orphan,'utf8'),'orphan');
});

test('rolling spend crosses midnight and expires only at the exact 24 hour boundary',t=>{
 const f=fixture();t.after(()=>f.close());
 const a=packet({approvedAt:'2026-01-05T23:59:00.000Z',expiresAt:'2026-01-06T23:59:00.000Z',dailyExecutions:1});
 a.config.scope.expiresAt=a.g.expiresAt;a.g.scopeDigest=canonicalHash(a.config.scope);approve(f,a);
 const first=binding(a.g,'before-midnight',a.g.approvedAt);f.journal.reserve(first,first.reservedAt);f.journal.notSent(first.id,first.reservedAt);
 const b=packet({id:'grant-midnight',approvedAt:'2026-01-06T00:01:00.000Z',expiresAt:'2026-01-07T00:01:00.000Z',dailyExecutions:1});
 b.config.scope.expiresAt=b.g.expiresAt;b.g.scopeDigest=canonicalHash(b.config.scope);approve(f,b);
 reject(()=>f.journal.reserve(binding(b.g,'after-midnight',b.g.approvedAt),b.g.approvedAt),'BUDGET_EXHAUSTED');
 const next=binding(b.g,'next-day','2026-01-06T23:59:00.000Z');f.journal.reserve(next,next.reservedAt);assert.equal(f.journal.inspect().models.length,2);
});
test('checkpoint write failure after SQL commit retains unknown custody and denies reinitialization',t=>{
 const f=fixture();t.after(()=>f.close());const p=packet();chmodSync(f.cp,0o500);
 try{assert.throws(()=>f.journal.approve(p.g,p.config,at));}finally{chmodSync(f.cp,0o700);}
 const db=new DatabaseSync(f.journal.path);try{assert.equal(db.prepare('SELECT count(*) n FROM events').get()!.n,2);}finally{db.close();}
 reject(()=>f.journal.inspect(),'OUTCOME_UNKNOWN');
 reject(()=>new AskAuthorityJournal(f.dir,f.cp,'fixture-hq',[f.excluded]),'OUTCOME_UNKNOWN');
 reject(()=>AskAuthorityJournal.createFixture(f.dir,f.cp,'fixture-hq',[f.excluded],at),'CONFLICT');
});

test('physical journal ceiling accommodates maximum bounded metadata plus index/page overhead',()=>{
 const c=ASK_AUTHORITY_CAPACITY;
 assert.ok(c.pageBytes*c.maxPages>=c.events*(c.eventBytes+2048)*2);
 assert.ok(c.pageBytes*c.maxPages<=512*1024*1024);
});


test('near-cap journal denies new work while preserving model completion, receipt and revocation slots',t=>{
 const f=fixture();t.after(()=>f.close());const g=approve(f),other=packet({id:'spent-grant'});approve(f,other);f.journal.revoke(other.g.id,at);
 const r=binding(g),p=proof(g,r);f.journal.reserve(r,at);const w=wire('answer','answer');f.journal.beforeWire('answer',w,at);
 const result={schemaVersion:'1.0' as const,receiptId:'receipt-a',answerId:'answer-a',questionId:'question-a',questionHash:h('question-a'),answerDigest:h('answer-a'),receivedAt:at,disposition:'accepted' as const};
 // Author a valid long fixture in one transaction, avoiding 10,000 quadratic fsync/replay
 // setup calls. Production APIs still replay every event and enforce the final boundaries.
 let head=f.journal.inspect().head;const db=new DatabaseSync(f.journal.path);
 try{db.exec('BEGIN IMMEDIATE');const insert=db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)');
  while(head.sequence<ASK_AUTHORITY_CAPACITY.events-6){
   const body={sequence:head.sequence+1,epoch:head.epoch,at,kind:'revoke',payload:canonicalJson({grantId:other.g.id}),previous:head.digest},hash=canonicalHash(body);
   insert.run(body.sequence,body.epoch,at,body.kind,body.payload,body.previous,hash);head={epoch:body.epoch,sequence:body.sequence,digest:hash,at};
  }db.exec('COMMIT');
 }finally{db.close();}
 writeFileSync(f.journal.checkpointPath,canonicalJson(head),{mode:0o600});
 assert.equal(f.journal.inspect().head.sequence,9994);
 reject(()=>f.journal.beforeWire('poll',wire('poll','receipt'),at),'BUDGET_EXHAUSTED');
 const fresh=packet({id:'new-grant'});reject(()=>approve(f,fresh),'BUDGET_EXHAUSTED');
 f.journal.admit(r.id,p,at);f.journal.beforeModelTransmit(r.id,p,at);f.journal.settle(r.id,receipt(p),at);
 f.journal.wireResult('answer',w,{kind:'data',status:200,responseDigest:canonicalHash(result)},at);
 f.journal.reconcileAnswer(['answer'],'answer',result,at);f.journal.revoke(g.id,at);
 assert.equal(f.journal.inspect().head.sequence,10000);assert.equal(f.journal.inspect().models[0]!.state,'settled');
 assert.equal(f.journal.inspect().wires[0]!.state,'reconciled');
 reject(()=>f.journal.revoke(g.id,at),'OUTCOME_UNKNOWN');
});
