/** Authored clock/tool integration only. No provider, market network or live-state writes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runningFiniteFixture} from './fixtures/finite-hq/support.js';
import {hash} from '../src/domain/investment/identity.js';

function nextDay(t:test.TestContext){
 const f=runningFiniteFixture(t,f=>{f.input.sessions=['2026-10-14','2026-10-15'];f.policy.maxRun=7;});t.after(f.close);
 f.session(0);f.clock.set('2026-10-14T12:00:01.505Z');const a=f.claim(),p=f.proposal(a,'first-hold'),original=f.contribute(a).message_id;f.finish(a);
 f.clock.set('2026-10-14T12:00:38.485Z');const b=f.claim(),r=f.review(b,p);f.contribute(b);f.finish(b);
 f.clock.set('2026-10-14T12:01:13.039Z');const c=f.claim();f.submit(c,p,r);f.facilitate(c);f.finish(c);f.company.discussions.progress();f.financial(0);
 // Additional retained global activity matters even outside this authority family.
 f.authority.journal.observe(['12:01:42.449','17:06:10.156','17:06:45.395','17:07:21.902'].map((at,i)=>({executionId:'retained-other-'+i,reservedAt:'2026-10-14T'+at+'Z'})),f.clock.now());
 const occurrence=()=>f.occurrences().find(o=>o.session==='2026-10-15'&&o.stage==='research')!;
 f.clock.set(occurrence().due_at);f.renew();
 return {...f,original,occurrence};
}
function synthesis(f:ReturnType<typeof nextDay>,x:ReturnType<ReturnType<typeof nextDay>['claim']>){
 f.read(x);f.call(x,'read_group_record',{record_id:f.original,offset:0});f.call(x,'submit_synthesis',{recommendation:'Authored current-session conclusion',alternatives:'HOLD or eligible paper action',supporting_findings:'Current scoped evidence and earlier outcome',challenges_addressed:'Independent exact proposal review',dissent_and_risks:'Fixture uncertainty retained',missing_evidence_and_confidence:'No genuine inference',next_actions_and_approvals:'No extra authority',contribution_ids:[f.original],evidence_ids:[f.result.evidence.evidence_id]});
}
for(const outcome of ['HOLD','BUY','reject'] as const)test('rolling start waits within frozen window, then four turns create a new '+outcome+' outcome',t=>{
 const f=nextDay(t),c=f.company,loop=c.investmentLoop,id=f.result.loop.loopId,scope=f.result.scope.scopeId,before=f.occurrence(),group=c.discussions.group(f.result.scope.envelope.groupId),frozen=hash(c.finiteHQ.frozen(scope)),journal=readFileSync(f.authority.journal.path),custody=readFileSync(f.authority.journal.custodyPath),requests=f.store.all('SELECT request_id FROM investment_loop_requests');
 loop.tick();assert.equal(loop.get(id).state,'active');assert.equal(f.occurrence().state,'pending');assert.equal(f.occurrence().attempts,0);assert.equal(f.occurrence().retry_at,'2026-10-15T12:01:13.039Z');assert.equal(loop.nextWake(),f.occurrence().retry_at);
 for(const at of ['2026-10-15T12:00:00.000Z','2026-10-15T12:01:13.038Z']){f.clock.set(at);loop.tick();assert.equal(f.occurrence().state,'pending');assert.deepEqual(c.discussions.group(group.group_id),group);assert.deepEqual(f.store.all('SELECT request_id FROM investment_loop_requests'),requests);}
 assert.equal(hash(c.finiteHQ.frozen(scope)),frozen);assert.deepEqual(readFileSync(f.authority.journal.path),journal);assert.deepEqual(readFileSync(f.authority.journal.custodyPath),custody);
 f.clock.set('2026-10-15T12:01:13.039Z');loop.tick();assert.equal(f.occurrence().state,'running');assert.equal(f.occurrence().retry_at,null);assert.equal(f.occurrence().due_at,before.due_at);assert.equal(f.occurrence().expires_at,before.expires_at);assert.equal(f.occurrence().occurrence_id,before.occurrence_id);
 const a=f.claim();assert.deepEqual(f.call(a,'paper_inspect',{}).paperWork.proposals,[]);f.proposal(a,'second-session',outcome==='BUY'?'BUY':'HOLD',1);f.facilitate(a);f.finish(a);
 const b=f.claim();synthesis(f,b);f.finish(b);
 const d=f.claim();f.read(d);const meta=f.call(d,'paper_inspect',{}).paperWork;assert.equal(meta.currentSession,'2026-10-15');assert.equal(meta.proposals.length,1);const p=f.call(d,'paper_read_proposal',{proposalId:meta.proposals[0].proposal_id}).proposal;
 f.call(d,'paper_review',{proposalId:p.proposal_id,proposalHash:p.proposal_hash,disposition:outcome==='reject'?'reject':'approve',rationale:'Independent exact current-session review',dissent:[],evidenceIds:[f.result.evidence.evidence_id]});f.contribute(d);f.finish(d);
 const e=f.claim();f.read(e);const work=f.call(e,'paper_inspect',{}).paperWork,record=f.call(e,'paper_read_proposal',{proposalId:work.proposals[0].proposal_id}),submission={proposalId:record.proposal.proposal_id,proposalHash:record.proposal.proposal_hash,reviewId:record.review.review_id};
 if(outcome==='reject')assert.throws(()=>f.call(e,'paper_submit',submission),/Exact approved/);else assert.equal(f.call(e,'paper_submit',submission).outcome.status,outcome==='HOLD'?'hold':'pending');
 synthesis(f,e);f.finish(e);c.discussions.progress();loop.tick();assert.equal(c.discussions.group(group.group_id).state,'completed');assert.equal(f.authority.journal.counts(f.policy.authorityId,f.clock.now()).run,7);const capacity=c.finiteHQ.inspect(scope);assert.ok(capacity&&'remainingRun' in capacity);assert.equal(capacity.remainingRun,0);assert.equal(c.claimWorkNext(),undefined);
 const current=f.store.all<{execution_id:string}>('SELECT execution_id FROM investment_loop_executions WHERE occurrence_id=?',before.occurrence_id);assert.equal(current.length,4);assert.ok(current.every(x=>c.aiUsage.records({executionId:x.execution_id})[0]?.completeness==='complete'));assert.equal(f.store.all('SELECT * FROM investment_team_submissions').length,outcome==='reject'?1:2);assert.equal(hash(c.finiteHQ.frozen(scope)),frozen);
});

test('capacity beyond cutoff waits to expiry and becomes missed without new requests',t=>{
 const f=nextDay(t),c=f.company;f.authority.journal.observe([{executionId:'extra-global',reservedAt:'2026-10-15T11:00:00.000Z'},{executionId:'extra-global-2',reservedAt:'2026-10-15T11:01:00.000Z'}],f.clock.now());const before=f.store.all('SELECT * FROM investment_loop_requests');c.investmentLoop.tick();assert.equal(f.occurrence().retry_at,f.occurrence().expires_at);f.clock.set(f.occurrence().expires_at);c.investmentLoop.tick();assert.equal(f.occurrence().state,'missed');assert.equal(f.occurrence().attempts,0);assert.deepEqual(f.store.all('SELECT * FROM investment_loop_requests'),before);
});

test('unknown outcome never becomes a rolling wait',t=>{
 const f=nextDay(t),j=f.authority.journal,c=f.company;j.reserveOther({executionId:'unknown-other',reservedAt:f.clock.now()},f.clock.now());j.settleOther('unknown-other','unknown',false,f.clock.now());assert.throws(()=>j.rollingCapacityAt(f.policy.authorityId,4,f.clock.now()),/Unknown|unsettled|fence/i);c.investmentLoop.tick();assert.equal(c.investmentLoop.get(f.result.loop.loopId).state,'blocked');assert.equal(f.occurrence().retry_at,null);
});

test('permanent family exhaustion blocks before a temporary rolling shortage',t=>{
 const f=nextDay(t),j=f.authority.journal,base=j.counts(f.policy.authorityId,f.clock.now()).reservations[0]!;const {state:_,threadId:__,status:___,complete:____,...reservation}=base;
 j.reserve({...reservation,executionId:'spent-family',requestId:'spent-family-request',day:'2026-10-15',occurrenceId:'different',reservedAt:f.clock.now(),deadline:'2026-10-15T12:05:00.000Z'},f.clock.now());j.settle('spent-family','completed',true,true,f.clock.now());f.company.investmentLoop.tick();assert.equal(f.company.investmentLoop.get(f.result.loop.loopId).state,'blocked');assert.match(f.occurrence().reason!,/run allocation/);assert.equal(f.occurrence().retry_at,null);
});

test('fresh draft waits without partial openings and starts both exactly once',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const c=f.company,o=f.occurrences().find(o=>o.stage==='research')!,groupId=f.result.scope.envelope.groupId;f.clock.set(o.due_at);f.renew();
 f.authority.journal.observe(Array.from({length:7},(_,i)=>({executionId:'prior-'+i,reservedAt:new Date(Date.parse(o.due_at)-86400000+1000*(i+1)).toISOString()})),f.clock.now());
 c.investmentLoop.tick();const pending=f.occurrences().find(x=>x.occurrence_id===o.occurrence_id)!;assert.equal(pending.retry_at,new Date(Date.parse(o.due_at)+2000).toISOString());assert.equal(c.discussions.group(groupId).state,'draft');assert.equal(f.store.all('SELECT * FROM discussion_turns').length,0);
 f.clock.set(pending.retry_at!);c.investmentLoop.tick();c.investmentLoop.tick();assert.equal(c.discussions.group(groupId).state,'active');assert.equal(f.store.all('SELECT * FROM discussion_turns').length,2);assert.equal(f.authority.journal.counts(f.policy.authorityId,f.clock.now()).run,0);
});

for(const withdrawal of ['membership','sharing'] as const)test('rolling retry rechecks '+withdrawal+' withdrawal',t=>{
 const f=nextDay(t),c=f.company,g=c.discussions.group(f.result.scope.envelope.groupId);c.investmentLoop.tick();const pending=f.occurrence(),requests=f.store.all('SELECT * FROM investment_loop_requests'),run=f.authority.journal.counts(f.policy.authorityId,f.clock.now()).run;
 if(withdrawal==='membership')f.store.run('UPDATE conversation_participants SET active=0 WHERE conversation_id=? AND worker_id=?',g.conversation_id,f.second.worker_id);
 else f.store.run("INSERT INTO audit_events (event_id,type,actor_principal_id,detail,created_at) VALUES ('withdrawal-fixture','discussion_sharing_withdrawn','human',?,?)",JSON.stringify({group_id:g.group_id}),f.clock.now());
 f.clock.set(pending.retry_at!);c.investmentLoop.tick();assert.equal(c.investmentLoop.get(f.result.loop.loopId).state,'blocked');assert.deepEqual(f.store.all('SELECT * FROM investment_loop_requests'),requests);assert.equal(f.authority.journal.counts(f.policy.authorityId,f.clock.now()).run,run);assert.equal(f.occurrence().attempts,0);
});

test('active progression cannot convert rolling exhaustion into a pending retry',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);f.session(0);const c=f.company,g=c.discussions.group(f.result.scope.envelope.groupId),before=f.occurrences().find(o=>o.stage==='research')!,requests=f.store.all('SELECT * FROM investment_loop_requests');
 f.authority.journal.observe(Array.from({length:7},(_,i)=>({executionId:'global-active-'+i,reservedAt:f.clock.now()})),f.clock.now());assert.throws(()=>c.investmentLoop.planTurns(g,[{worker:g.facilitator_id,kind:'facilitate'}]),/rolling allocation/);assert.deepEqual(f.occurrences().find(o=>o.occurrence_id===before.occurrence_id),before);assert.deepEqual(f.store.all('SELECT * FROM investment_loop_requests'),requests);assert.equal(before.state,'running');assert.equal(before.attempts,1);
});
