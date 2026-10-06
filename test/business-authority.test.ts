import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers.js';
import {FixtureAdapter,setup,target,baseline} from './business-helpers.js';
import type {BusinessReceipt,ExternalAction} from '../src/domain/business.js';

for(const allowed of [false,true])test(`worker observation mode ${allowed?'allowed metadata only':'excluded before provider I/O'}`,async t=>{
  const f=fixture();t.after(()=>f.close());const atlas=f.company.initializeCEO(),adapter=new FixtureAdapter();f.company.business.adapter=adapter;
  const m=f.company.mandates.create({title:'Mode boundary',objective:'Read only the allowed source',success_criteria:'Typed observation',stop_criteria:'No authority',constraints:'SIMULATED',resources:'No spending',coordinator_id:atlas.worker_id,envelope:{evidence_modes:[allowed?'simulated_fixture':'owner_provided']}});
  const g=f.company.business.authorize({mandate_id:m.mandate_id,target,credential_ref:'fixture',expires_at:new Date(Date.now()+60000).toISOString(),max_actions:1,mode:'simulated_fixture'});
  f.company.mandates.control({mandate_id:m.mandate_id,action:'activate'});const c=f.company.claimWorkNext();assert.ok(c?.origin==='conversation');f.company.conversations.context(c.context);
  const promise=f.company.mandates.callTool(c.context,'observe','observe_business_document',{grant_id:g.grant_id,baseline,action_id:null}) as Promise<Record<string,unknown>>;
  if(allowed){const result=await promise;assert.equal(adapter.reads,1);assert.equal(result.mode,'simulated_fixture');assert.ok(result.evidence_id);assert.equal(result.body,undefined);assert.equal(result.baseline,undefined);assert.equal(result.content,undefined);}
  else {await assert.rejects(promise,/mode outside mandate/);assert.equal(adapter.reads,0);for(const table of ['business_reads','business_evidence'])assert.equal(f.store.get<{n:number}>(`SELECT count(*) n FROM ${table}`)!.n,0);}
});

test('fresh coordinator cannot reuse a pre-withdrawal Decision with a fresh valid baseline',async t=>{
  const f=await setup();t.after(()=>f.close());
  const source=f.company.mandates.admitObservation({mandate_id:f.m.mandate_id,cycle_id:null,initiative_id:null,mode:'owner_provided',name:'Unrelated private source',value:null,unit:null,observed_at:null,period:null,source:'owner',provenance:'Owner',limitations:'Unknown',missingness:'Unknown',body:'Private source'});
  f.company.finish(f.claim.execution.execution_id,{status:'failed',settled:true,error:'Controlled known interruption'});f.company.mandates.progress();f.advance(1);f.company.mandates.withdrawObservation({observation_id:source.observation_id});f.advance(30001);f.company.mandates.progress();
  const c=f.company.claimWorkNext();assert.ok(c?.origin==='conversation');f.company.conversations.context(c.context);
  const call=(name:string,args:unknown)=>f.company.mandates.callTool(c.context,randomUUID(),name,args);
  const e=await f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:null});call('read_mandate_record',{record_id:e.evidence_id});
  assert.throws(()=>call('propose_markdown_action',{...f.proposal,baseline_id:e.evidence_id}),/current decision.*after any evidence withdrawal/);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM external_actions')!.n,0);
  const i=call('propose_initiative',{title:'Fresh analysis',mechanism:'Review current text',expected_outcome:'Clearer text',assumptions:'Unknown impact'}) as {initiative_id:string};
  const d=call('record_strategic_decision',{initiative_id:i.initiative_id,disposition:'iterate',recommendation:'Propose current correction',rationale:'Current source only',alternatives:'Leave unchanged',evidence_ids:[e.evidence_id],contrary_evidence:'Impact unknown',unknowns:'Reader benefit',missing_evidence:null}) as {decision_id:string};
  const a=call('propose_markdown_action',{...f.proposal,baseline_id:e.evidence_id,decision_id:d.decision_id}) as ExternalAction;assert.equal(a.status,'awaiting_approval');assert.equal(f.adapter.puts,0);
});

test('SQL receipt ownership rejects substituted existing attempt and exact scope fields',async t=>{
  const f=await setup();t.after(()=>f.close());const first=f.propose();f.wait(first);f.approve(first);const now=new Date(f.time()).toISOString();
  f.store.run("INSERT INTO business_attempts VALUES (?,?,?,'preparing',?,NULL,NULL,NULL)",'prior-attempt',first.action_id,first.intent_hash,now);f.store.run("UPDATE external_actions SET status='executing' WHERE action_id=?",first.action_id);f.store.run("UPDATE business_attempts SET state='settled' WHERE attempt_id='prior-attempt'");f.store.run("UPDATE external_actions SET status='failed' WHERE action_id=?",first.action_id);
  f.company.mandates.progress();const c=f.company.claimWorkNext();assert.ok(c?.origin==='conversation');f.company.conversations.context(c.context);const call=(name:string,args:unknown)=>f.company.mandates.callTool(c.context,randomUUID(),name,args);
  const e=await f.company.business.observe({grant_id:f.grant.grant_id,baseline,action_id:null});call('read_mandate_record',{record_id:e.evidence_id});
  const a=call('propose_markdown_action',{...f.proposal,baseline_id:e.evidence_id}) as ExternalAction;call('wait_for_external_action',{action_id:a.action_id,summary:'Exact approval required'});f.company.finish(c.execution.execution_id,{status:'completed',settled:true});f.approve(a);
  f.store.run("INSERT INTO business_attempts VALUES (?,?,?,'preparing',?,NULL,NULL,NULL)",'current-attempt',a.action_id,a.intent_hash,now);f.store.run("UPDATE external_actions SET status='executing' WHERE action_id=?",a.action_id);f.store.run("UPDATE business_attempts SET state='transmitting',transmitted_at=? WHERE attempt_id='current-attempt'",now);
  const receipt:BusinessReceipt={receipt_id:'receipt',action_id:a.action_id,attempt_id:'current-attempt',provider:'github',adapter:a.adapter,mode:'simulated_fixture',target:a.target,intent_hash:a.intent_hash,content_sha256:a.content_sha256,operation_id:'b'.repeat(40),provider_time:null,recorded_at:now,result:'{}',sha256:'fixture'};
  const insert=(row:BusinessReceipt)=>f.store.run(`INSERT INTO business_receipts (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(()=>'?').join(',')})`,...Object.values(row));
  for(const change of [{attempt_id:'prior-attempt'},{adapter:'other'},{mode:'real_live' as const},{provider:'other'},{target:'{}'},{intent_hash:'other'},{content_sha256:'other'}]){assert.throws(()=>insert({...receipt,...change}),/Receipt ownership mismatch/);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,0);}
  insert(receipt);assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM business_receipts')!.n,1);assert.deepEqual(f.store.all('PRAGMA foreign_key_check'),[]);
});
