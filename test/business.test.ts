import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fixture,until} from './helpers.js';
import {Company} from '../src/control/company.js';
import {Store} from '../src/persistence/store.js';
import {ClientDTOs} from '../src/client/dto.js';
import {createHttpServer} from '../src/http/server.js';
import {markdownTarget,exactEdit,type ExternalAction} from '../src/domain/business.js';

import {setup,baseline,target} from './business-helpers.js';

test('bounded typed target and exact edit deny authority expansion and invalid bytes',()=>{
  assert.deepEqual(markdownTarget(target),target);
  for(const path of ['.github/workflows/deploy.md','AGENTS.md','docs/AGENTS.md','../README.md','docs//README.md','a.js','/README.md'])assert.throws(()=>markdownTarget({...target,path}));
  for(const repository of ['https://github.com/example/operations','example/../x','127.0.0.1'])assert.throws(()=>markdownTarget({...target,repository}));
  assert.throws(()=>markdownTarget({...target,url:'http://localhost'}));
  assert.throws(()=>exactEdit('twice twice',{old_text:'twice',new_text:'one'}));
  assert.throws(()=>exactEdit('old',{old_text:'old',new_text:'\ud800'}));
  assert.throws(()=>exactEdit('old',{old_text:'old',new_text:'old'}));
});
test('proposal is passive and immutable; exact approval cannot be forged by a worker tool',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();assert.equal(f.adapter.puts,0);
  for(const name of ['approve_external_action','external_request','computer_execute_approved'])assert.throws(()=>f.call(name,{}),/outside mandate/);
  assert.throws(()=>f.company.business.decide({action_id:a.action_id,intent_hash:'forged',decision:'approved'}),/exact intent/);
  for(const [field,value] of [['target','{}'],['content','substitute'],['expires_at','2099'],['policy_version','future']])assert.throws(()=>f.store.run(`UPDATE external_actions SET ${field}=? WHERE action_id=?`,value!,a.action_id),/immutable/);
  assert.throws(()=>f.store.run("UPDATE external_actions SET status='succeeded' WHERE action_id=?",a.action_id),/transition/);
  f.approve(a);f.company.business.progress();await new Promise(r=>setTimeout(r,15));assert.equal(f.adapter.puts,0,'running coordinator cannot dispatch effect');
});
test('duplicate proposals, exact owner requests and dispatcher kicks yield one effect and receipt',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();assert.equal(f.propose().action_id,a.action_id);f.wait(a);
  assert.equal(f.approve(a).approval_id,f.approve(a).approval_id);for(let i=0;i<5;i++)f.company.business.progress();
  await until(()=>f.company.business.action(a.action_id).status==='succeeded');f.company.business.progress();
  assert.equal(f.adapter.puts,1);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_attempts')!.n,1);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,1);
  const observed=await f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:a.action_id});assert.equal(observed.category,'operational');assert.equal(observed.value,'true');assert.equal(observed.mode,'simulated_fixture');
  f.company.mandates.progress();f.company.mandates.progress();assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM mandate_turns')!.n,2);
});
test('changed content cannot consume an approved operation and never transmits',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.adapter.content='Different current state';f.company.business.progress();
  await until(()=>f.company.business.action(a.action_id).status==='failed');assert.equal(f.adapter.puts,0);assert.equal(f.store.get<{state:string}>('SELECT state FROM business_attempts')!.state,'settled');
});
for(const kind of ['deny','revoke','cancel','grant','expire','stop','pause','disabled','withdraw'] as const)test(`current ${kind} authority prevents any transmission`,async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);
  if(kind==='deny')f.company.business.decide({action_id:a.action_id,intent_hash:a.intent_hash,decision:'denied'});else f.approve(a);
  if(kind==='revoke'||kind==='cancel')f.company.business.control({action_id:a.action_id,grant_id:null,operation:kind});
  if(kind==='grant')f.company.business.control({action_id:null,grant_id:f.grant.grant_id,operation:'revoke'});
  if(kind==='expire')f.advance(600001);
  if(kind==='stop'||kind==='pause')f.company.mandates.control({mandate_id:f.m.mandate_id,action:kind});
  if(kind==='disabled')f.store.run('UPDATE workers SET enabled=0 WHERE worker_id=?',f.atlas.worker_id);
  if(kind==='withdraw')f.company.mandates.withdrawObservation({observation_id:f.evidence.evidence_id});
  f.company.business.progress();await new Promise(r=>setTimeout(r,15));assert.equal(f.adapter.puts,0);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,0);
});
test('revoke during asynchronous preflight is rechecked at transmission boundary',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);
  let release!:()=>void;f.adapter.before=()=>new Promise<void>(r=>{release=r;});f.company.business.progress();await until(()=>!!release);
  f.company.business.control({action_id:null,grant_id:f.grant.grant_id,operation:'revoke'});release();await until(()=>f.company.business.action(a.action_id).status==='failed');assert.equal(f.adapter.puts,0);
});
test('late provider success after revocation retains the exact receipt and intervention',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);
  let release!:()=>void;f.adapter.after=()=>new Promise<void>(r=>{release=r;});f.company.business.progress();await until(()=>f.adapter.puts===1);
  f.company.business.control({action_id:a.action_id,grant_id:null,operation:'revoke'});release();await until(()=>f.company.business.action(a.action_id).status==='succeeded');
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,1);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_controls')!.n,1);assert.equal(f.adapter.puts,1);
});
test('lost response fences the target, allows read-only continuation, and reconciles without retry',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.adapter.unknown=true;f.company.business.progress();
  await until(()=>f.company.business.action(a.action_id).status==='outcome_unknown');assert.equal(f.company.providerUnresolved(f.atlas.worker_id),false);
  f.company.mandates.progress();const next=f.company.claimWorkNext();assert.ok(next?.origin==='conversation');
  assert.equal(next.execution.generation,f.claim.execution.generation+1);assert.equal(f.company.business.action(a.action_id).status,'outcome_unknown');
  f.company.business.progress();assert.equal(f.adapter.puts,1);await f.company.business.reconcile({action_id:a.action_id});assert.equal(f.company.business.action(a.action_id).status,'succeeded');assert.equal(f.adapter.puts,1);
});
test('inconclusive reconciliation retains unknown and revoked controls cannot erase it',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.adapter.unknown=true;f.company.business.progress();await until(()=>f.company.business.action(a.action_id).status==='outcome_unknown');
  f.adapter.receipt=null;f.company.business.control({action_id:null,grant_id:f.grant.grant_id,operation:'revoke'});await f.company.business.reconcile({action_id:a.action_id});
  assert.equal(f.company.business.action(a.action_id).status,'outcome_unknown');assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,0);assert.equal(f.adapter.puts,1);
});
for(const point of ['after_attempt_before_transmission','after_transmission_intent','after_provider_before_receipt','after_receipt_before_wake'])test(`retained failure at ${point} never repeats effect`,async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.company.business.fault=p=>{if(p===point)throw new Error('Controlled crash fixture');};f.company.business.progress();
  await until(()=>['failed','outcome_unknown','succeeded'].includes(f.company.business.action(a.action_id).status));const count=f.adapter.puts;
  f.company.business.recover();for(let i=0;i<5;i++)f.company.business.progress();await new Promise(r=>setTimeout(r,20));assert.equal(f.adapter.puts,count);
  assert.equal(count,point==='after_attempt_before_transmission'||point==='after_transmission_intent'?0:1);
  const status=f.company.business.action(a.action_id).status;assert.equal(status,point==='after_receipt_before_wake'?'succeeded':point==='after_attempt_before_transmission'?'failed':'outcome_unknown');
});
test('evidence mode, baseline and privacy persist; worker cannot fabricate real observation',async t=>{
  const f=await setup();t.after(()=>f.close());assert.equal(f.evidence.admitted_by,'trusted_adapter');assert.deepEqual(JSON.parse(f.evidence.baseline),baseline);
  assert.throws(()=>f.call('admit_business_observation',{value:100}),/outside mandate/);
  assert.throws(()=>f.store.run("UPDATE business_evidence SET mode='real_live' WHERE evidence_id=?",f.evidence.evidence_id),/immutable/);
  const other=f.company.mandates.create({title:'Other',objective:'Private',success_criteria:'Private',stop_criteria:'Stop',constraints:'Private',resources:'None',coordinator_id:f.atlas.worker_id,envelope:{}});
  assert.equal(f.company.business.workerRecord(other,f.evidence.evidence_id),undefined);
  const dto=new ClientDTOs(f.company,'fixture-hq');for(const resource of ['tasks','executions','messages','artifacts'] as const)assert.ok(!JSON.stringify(dto.page(resource,new URLSearchParams())).includes(f.evidence.evidence_id));
  assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM client_events WHERE type LIKE '%business%'")!.n,0);
});
test('adapter failure redacts raw provider errors and admits no invented value',async t=>{
  const f=await setup();t.after(()=>f.close());f.adapter.failRead=true;
  await assert.rejects(f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:null}),e=>e instanceof Error&&!e.message.includes('PRIVATE PROVIDER SECRET'));
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_evidence')!.n,1);assert.ok(!JSON.stringify(f.store.all('SELECT * FROM business_reads')).includes('PRIVATE PROVIDER SECRET'));
});
test('current-schema reopening preserves rows and creates no new authority or work',async()=>{
  const f=fixture();f.company.initializeCEO();const before=f.store.all('SELECT * FROM workers');await f.dispatcher.stop();f.store.close();
  for(let i=0;i<3;i++){const store=new Store(join(f.dir,'company.sqlite'));try{
    assert.deepEqual(store.all('SELECT * FROM workers'),before);assert.equal(store.get<{integrity_check:string}>('PRAGMA integrity_check')!.integrity_check,'ok');assert.deepEqual(store.all('PRAGMA foreign_key_check'),[]);
    for(const table of ['business_grants','external_actions','business_approvals','business_receipts','business_evidence','executions'])assert.equal(store.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0);
    if(i===2){const company=new Company(store,f.dir,process.cwd(),'fake');company.recover();assert.equal(company.claimWorkNext(),undefined);}
  }finally{store.close();}}
});
test('changed duplicate metadata and multiple proposals cannot strand an originating turn',async t=>{
  const f=await setup();t.after(()=>f.close());f.propose();
  assert.throws(()=>f.call('propose_markdown_action',{...f.proposal,risk:'Different risk disclosure'}),/different immutable/);
  assert.throws(()=>f.call('propose_markdown_action',{...f.proposal,edit:{...f.proposal.edit,new_text:'Another correction'}}),/one distinct/);
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM external_actions')!.n,1);
});
test('known settled origin failure terminalizes untransmitted intent without changing lineage',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.approve(a);
  f.company.finish(f.claim.execution.execution_id,{status:'failed',settled:true,error:'Controlled known model failure'});f.company.business.progress();
  assert.equal(f.company.business.action(a.action_id).status,'cancelled');assert.equal(f.company.business.action(a.action_id).execution_id,f.claim.execution.execution_id);assert.equal(f.adapter.puts,0);
});
test('shutdown closes transmission admission before asynchronous preflight returns',async t=>{
  const f=await setup();t.after(()=>f.store.close());const a=f.propose();f.wait(a);f.approve(a);
  let release!:()=>void;f.adapter.before=()=>new Promise<void>(r=>{release=r;});f.company.business.progress();await until(()=>!!release);
  const stopped=f.dispatcher.stop();release();await stopped;assert.equal(f.adapter.puts,0);assert.equal(f.company.business.action(a.action_id).status,'failed');
});
for(const state of ['approved','preparing','transmitting','receipt'] as const)test(`actual database reopen from ${state} retains ownership and never blindly replays`,async()=>{
  const f=await setup();const a=f.propose();f.wait(a);f.approve(a);
  if(state==='receipt'){f.company.business.progress();await until(()=>f.company.business.action(a.action_id).status==='succeeded');}
  if(state==='preparing'||state==='transmitting'){
    f.store.run("INSERT INTO business_attempts VALUES (?,?,?,'preparing',?,NULL,NULL,NULL)",'retained-attempt',a.action_id,a.intent_hash,new Date(f.time()).toISOString());
    f.store.run("UPDATE external_actions SET status='executing' WHERE action_id=?",a.action_id);
    if(state==='transmitting'){f.store.run("UPDATE business_attempts SET state='transmitting',transmitted_at=? WHERE attempt_id='retained-attempt'",new Date(f.time()).toISOString());await f.adapter.replace(f.company.business.action(a.action_id),()=>{});}
  }
  await f.dispatcher.stop();f.store.close();const store=new Store(join(f.dir,'company.sqlite'));
  try{const company=new Company(store,f.dir,process.cwd(),'fake');company.business.adapter=f.adapter;company.mandates.clock={now:f.time};company.recover();
    if(state==='approved'){company.business.progress();await until(()=>company.business.action(a.action_id).status==='succeeded');}
    if(state==='preparing')assert.equal(company.business.action(a.action_id).status,'failed');
    if(state==='transmitting'){assert.equal(company.business.action(a.action_id).status,'outcome_unknown');company.business.progress();assert.equal(f.adapter.puts,1);await company.business.reconcile({action_id:a.action_id});}
    for(let i=0;i<3;i++){company.business.progress();company.mandates.progress();}
    assert.equal(f.adapter.puts,state==='preparing'?0:1);assert.equal(store.get<{n:number}>('SELECT count(*) n FROM mandate_turns')!.n,2);
    assert.equal(company.business.action(a.action_id).execution_id,f.claim.execution.execution_id);assert.deepEqual(store.all('PRAGMA foreign_key_check'),[]);await company.business.shutdown();
  }finally{store.close();}
});
test('withdrawal of a non-baseline source blocks approved effects and removes action prose from fresh context',async t=>{
  const f=await setup();t.after(()=>f.close());const other=f.company.mandates.admitObservation({mandate_id:f.m.mandate_id,cycle_id:null,initiative_id:null,mode:'owner_provided',name:'Private source',value:null,unit:null,observed_at:null,period:null,source:'owner:private',provenance:'Owner admission',limitations:'Unknown',missingness:'Costs unknown',body:'PRIVATE_WITHDRAWAL_SENTINEL'});
  const a=f.call('propose_markdown_action',{...f.proposal,rationale:'PRIVATE_WITHDRAWAL_SENTINEL'}) as ExternalAction;f.wait(a);f.approve(a);f.advance(1);
  f.company.mandates.withdrawObservation({observation_id:other.observation_id});f.company.business.progress();f.company.mandates.progress();assert.equal(f.adapter.puts,0);assert.equal(f.company.business.action(a.action_id).status,'cancelled');
  assert.ok(!JSON.stringify(f.company.business.catalog(f.m.mandate_id)).includes('PRIVATE_WITHDRAWAL_SENTINEL'));assert.throws(()=>f.company.business.workerRecord(f.m,a.action_id),/withheld/);
});
test('read callback after withdrawal cannot deliver old private evidence',async t=>{
  const f=await setup();t.after(()=>f.close());let release!:()=>void;const read=f.adapter.read.bind(f.adapter);f.adapter.read=async target=>{await new Promise<void>(r=>{release=r;});return read(target);};
  const pending=f.call('observe_business_document',{grant_id:f.grant.grant_id,baseline,action_id:null}) as Promise<unknown>;await until(()=>!!release);f.advance(1);f.company.mandates.withdrawObservation({observation_id:f.evidence.evidence_id});release();await assert.rejects(pending,/unavailable/);
  assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_evidence')!.n,1);assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM business_reads WHERE state='failed'")!.n,1);
});
for(const event of ['abort','shutdown'] as const)test(`${event} denies new reads and prevents late observation despite running database execution`,async t=>{
  const f=await setup();t.after(()=>f.close());let release!:()=>void;const controller=new AbortController(),original=f.adapter.read.bind(f.adapter);
  f.adapter.read=async target=>{await new Promise<void>(r=>{release=r;});return original(target);};
  const pending=f.company.conversations.callTool(f.claim.context,'interrupt-read','observe_business_document',{grant_id:f.grant.grant_id,baseline,action_id:null},controller.signal) as Promise<unknown>;
  await until(()=>!!release);assert.throws(()=>f.company.finish(f.claim.execution.execution_id,{status:'completed',settled:true}),/business callbacks/);
  const a=f.propose();assert.throws(()=>f.call('wait_for_external_action',{action_id:a.action_id,summary:'Premature commitment'}),/pending business read/);
  if(event==='abort')controller.abort();else f.company.business.beginShutdown();
  if(event==='shutdown')await assert.rejects(f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:null}),/stopped/);
  release();await assert.rejects(pending,/unavailable/);assert.equal(f.company.execution(f.claim.execution.execution_id).status,'running');assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_evidence')!.n,1);
});
test('business preflight reserves only its worker and uses no model execution slot',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);let release!:()=>void;
  f.adapter.before=()=>new Promise<void>(r=>{release=r;});f.company.business.progress();await until(()=>!!release);
  const queued=f.company.createTask('human',f.atlas,{objective:'Unrelated internal work',acceptance_criteria:'Bounded result',constraints:'No external effect'},null,'product');
  assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.business.reserved(f.atlas.worker_id),true);assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n,0);
  release();await until(()=>f.company.business.action(a.action_id).status==='succeeded');const next=f.company.claimWorkNext();assert.ok(next?.origin==='task');assert.equal(next.task.task_id,queued.task_id);
});
test('unknown effect fences the canonical target across another mandate and grant',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.adapter.unknown=true;f.company.business.progress();await until(()=>f.company.business.action(a.action_id).status==='outcome_unknown');
  const m=f.company.mandates.create({title:'Second scope',objective:'Another correction',success_criteria:'Explicit evidence',stop_criteria:'Unknown effects',constraints:'SIMULATED only',resources:'No spending',coordinator_id:f.atlas.worker_id,envelope:{}});
  const g=f.company.business.authorize({mandate_id:m.mandate_id,target,credential_ref:'fixture',expires_at:new Date(f.time()+3600000).toISOString(),max_actions:1,mode:'simulated_fixture'}),e=await f.company.business.observe({grant_id:g.grant_id,baseline,action_id:null});
  f.company.mandates.control({mandate_id:m.mandate_id,action:'activate'});const next=f.company.claimWorkNext();assert.ok(next?.origin==='conversation');f.company.conversations.context(next.context);
  const call=(name:string,args:unknown)=>f.company.mandates.callTool(next.context,randomUUID(),name,args);
  call('read_mandate_record',{record_id:e.evidence_id});const i=call('propose_initiative',{title:'Another correction',mechanism:'Change text',expected_outcome:'Clearer document',assumptions:'No business impact'}) as {initiative_id:string};
  const d=call('record_strategic_decision',{initiative_id:i.initiative_id,disposition:'iterate',recommendation:'Correct another phrase',rationale:'SIMULATED analysis',alternatives:'Stop',evidence_ids:[e.evidence_id],contrary_evidence:'Unknown prior effect',unknowns:'Impact',missing_evidence:null}) as {decision_id:string};
  assert.throws(()=>call('propose_markdown_action',{...f.proposal,grant_id:g.grant_id,decision_id:d.decision_id,baseline_id:e.evidence_id,edit:{old_text:'Status appears once.',new_text:'Second correction.'}}),/unknown external effect/);assert.equal(f.adapter.puts,1);
});
test('separate compensation proposal restores exact prior bytes and never inherits approval',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.company.business.progress();await until(()=>f.company.business.action(a.action_id).status==='succeeded');
  f.company.business.control({action_id:a.action_id,grant_id:null,operation:'request_compensation'});const e=await f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:null});
  f.company.mandates.progress();const next=f.company.claimWorkNext();assert.ok(next?.origin==='conversation');f.company.conversations.context(next.context);
  const call=(name:string,args:unknown)=>f.company.mandates.callTool(next.context,randomUUID(),name,args);call('read_mandate_record',{record_id:e.evidence_id});
  const d=call('record_strategic_decision',{initiative_id:a.initiative_id,disposition:'iterate',recommendation:'Propose exact restoration after owner request',rationale:'Owner request requires separate review',alternatives:'Retain current document',evidence_ids:[e.evidence_id],contrary_evidence:'Correction remains present',unknowns:'Benefit',missing_evidence:null}) as {decision_id:string};
  const proposal={...f.proposal,decision_id:d.decision_id,baseline_id:e.evidence_id,compensation_for:a.action_id,edit:{old_text:'Status appears once.',new_text:'Unrelated text'}};
  assert.throws(()=>call('propose_markdown_action',proposal),/exact retained prior bytes/);
  const compensation=call('propose_markdown_action',{...proposal,edit:{old_text:'Status appears once.',new_text:'Status is duplicated.\nStatus is duplicated.'}}) as ExternalAction;
  assert.notEqual(compensation.action_id,a.action_id);assert.equal(compensation.status,'awaiting_approval');assert.equal(f.company.business.action(compensation.action_id).content,f.company.business.action(a.action_id).previous_content);assert.equal(f.adapter.puts,1);
});
test('business HTTP control remains local owner-only and no client v1 endpoint is added',async t=>{
  const f=await setup();t.after(()=>f.close());const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));t.after(()=>http.close());
  const address=http.server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(`${base}/api/business`,{headers:{Authorization:'Bearer device'}})).status,403);
  assert.equal((await fetch(`${base}/api/business/decide`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.notEqual((await fetch(`${base}/api/v1/business`)).status,200);
});
test('scheduled Cycle 2 independently reads receipt and observed outcome after fresh context',async t=>{
  const f=await setup();t.after(()=>f.close());const a=f.propose();f.wait(a);f.approve(a);f.company.business.progress();await until(()=>f.company.business.action(a.action_id).status==='succeeded');
  const observation=await f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:a.action_id});
  f.company.mandates.progress();const continuation=f.company.claimWorkNext();assert.ok(continuation?.origin==='conversation');
  f.company.conversations.context(continuation.context);
  const call=(name:string,args:unknown)=>f.company.mandates.callTool(continuation.context,randomUUID(),name,args);
  call('schedule_review',{schedule_id:null,purpose:'Review observed operational correction',initiative_id:a.initiative_id,due_at:new Date(f.time()+60000).toISOString(),recurrence_kind:'once',interval_seconds:null,local_time:null,occurrence_limit:1,end_at:new Date(f.time()+600000).toISOString()});
  call('complete_cycle',{summary:'Effect confirmed; scheduled evidence review',stop:false});f.company.finish(continuation.execution.execution_id,{status:'completed',settled:true,summary:'Scheduled'});f.company.mandates.progress();
  f.advance(60000);f.company.mandates.progress();const second=f.company.claimWorkNext();assert.ok(second?.origin==='conversation');f.company.conversations.context(second.context);
  const cycle=f.company.mandates.verify(second.context).cycle;assert.equal(cycle.number,2);assert.equal(cycle.trigger,'durable_schedule');
  const receipt=f.store.get<{receipt_id:string}>('SELECT receipt_id FROM business_receipts')!;
  for(const ref of [receipt.receipt_id,observation.evidence_id]){const read=f.company.mandates.callTool(second.context,randomUUID(),'read_mandate_record',{record_id:ref}) as {fully_delivered:boolean};assert.equal(read.fully_delivered,true);}
  const decision=f.company.mandates.callTool(second.context,randomUUID(),'record_strategic_decision',{initiative_id:a.initiative_id,disposition:'stop',recommendation:'Stop this bounded documentation correction',rationale:'Exact fixture correction observed; no claim of business growth',alternatives:'Continue observing or expand without authority',evidence_ids:[receipt.receipt_id,observation.evidence_id],contrary_evidence:'Reader benefit remains unmeasured',unknowns:'Model monetary costs and customer impact',missing_evidence:null});assert.ok(decision);
});
