import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {repoRoot} from '../scripts/credit-pilot/run.js';
import {pilotFixture} from './fixtures/credit-pilot.js';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {ACTIVITY_MAX,executionPolicy,eligibleCreditSubscription} from '../src/domain/usage/policy.js';
import {CommittedTeamPublicationSource} from '../src/control/publication/team-source.js';
import {teamFixture} from './fixtures/investment-team/support.js';
import {CodexRuntime} from '../src/runtime/codex.js';

test('credit eligibility accepts existing credits while rejecting metered, unknown and unusable accounts',()=>{
 const a={account:{type:'chatgpt',planType:'pro'},requiresOpenaiAuth:true},l={ordinaryUsageAllowed:false,rateLimits:{planType:'pro',credits:{hasCredits:true,unlimited:false},spendControlReached:false}};
 assert.equal(eligibleCreditSubscription(a,l).paidCredits,'existing_approved');assert.throws(()=>eligibleCreditSubscription({...a,account:{type:'apiKey'}},l));assert.throws(()=>eligibleCreditSubscription(a,{}));assert.throws(()=>eligibleCreditSubscription(a,{...l,rateLimits:{...l.rateLimits,credits:{hasCredits:false}}}));assert.throws(()=>eligibleCreditSubscription(a,{...l,rateLimits:{...l.rateLimits,spendControlReached:true}}));assert.equal(executionPolicy(ACTIVITY_MAX).mode,'subscription_activity_capped');
});
test('four total pilot reservations require explicit inspection; no automatic fifth across workers or restart',t=>{
 const f=pilotFixture();t.after(f.close);assert.equal(f.company.claimWorkNext(),undefined);
 for(let n=0;n<4;n++){const c=f.claim();assert.equal(f.company.claimWorkNext(),undefined);f.complete(c);assert.equal(f.company.creditPilot.count(),n+1);assert.equal(f.company.claimWorkNext(),undefined);if(n<3)assert.throws(()=>f.company.creditPilot.release(f.queued()[0]?.request_id??'missing','wrong-execution'),/Inspect/);}
 assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.throws(()=>f.release());
 const db=new Store(join(f.root,'company.sqlite'));try{const c=new Company(db,f.root,process.cwd());c.recover();assert.equal(c.creditPilot.count(),4);assert.equal(c.creditPilot.get()!.state,'stopped');assert.equal(c.claimWorkNext(),undefined);assert.throws(()=>db.run("UPDATE investment_credit_pilot SET pilot_id='replacement'"),/immutable/);}finally{db.close();}
 assert.equal(f.company.aiUsage.report({runId:f.manifest.runId}).summary.invocations,4);assert.equal(f.store.all('SELECT * FROM investment_loops').length,0);assert.equal(f.store.all('SELECT * FROM investment_public_channels').length,0);
});
test('crash after reservation consumes permit and quota, fences continuation and preserves usage',t=>{
 const f=pilotFixture();t.after(f.close);const c=f.claim();assert.equal(f.company.creditPilot.count(),1);f.company.recover();assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.store.get<{state:string}>('SELECT state FROM investment_activity_invocations WHERE execution_id=?',c.execution.execution_id)!.state,'unknown');assert.equal(f.company.aiUsage.records({executionId:c.execution.execution_id})[0]!.completeness,'incomplete');
});
test('restart clears unused release; atomic concurrent claimers cannot consume the same permit',t=>{
 const f=pilotFixture();t.after(f.close);f.release();f.company.recover();assert.equal(f.company.claimWorkNext(),undefined);f.release();const other=new Store(join(f.root,'company.sqlite'));try{const c2=new Company(other,f.root,process.cwd());c2.investmentTeam.runtime=f.adapter;assert.ok(f.company.claimWorkNext());assert.equal(c2.claimWorkNext(),undefined);assert.equal(f.company.creditPilot.count(),1);}finally{other.close();}
});
test('private pilot rejects ordinary capability, research, orders, wrong audience and scheduled loops',t=>{
 const f=pilotFixture();t.after(f.close);assert.equal(new CodexRuntime().runSubscriptionInvestment,undefined);const runtime=new CodexRuntime({creditPilot:{pilotId:f.policy.pilotId,disposableRoot:f.root,model:'test-model'}});assert.equal(runtime.subscriptionPolicySupported(ACTIVITY_MAX),false);assert.equal(runtime.subscriptionPolicySupported(f.policy),true);
 const c=f.claim(),i=f.input(c);assert.ok(i.tools.every(t=>!['research_search','research_open','ask_peer','assign_task','paper_submit','paper_propose','paper_review'].includes(t.name)));assert.throws(()=>f.company.investmentLoop.preview({scopeId:f.manifest.scopeId}),/Private pilot/);
 assert.throws(()=>executionPolicy({...f.policy,maxDurationMs:300001}));assert.throws(()=>executionPolicy({...f.policy,maxPilot:5}));assert.throws(()=>f.company.creditPilot.approve(f.manifest.scopeId,'test-model',new Date().toISOString()),/fresh/);
});
test('owner pause and scope revocation deny a released request without consuming another reservation',t=>{
 const f=pilotFixture();t.after(f.close);f.release();f.company.pause(true);assert.equal(f.company.claimWorkNext(),undefined);f.company.pause(false);f.company.investmentTeam.control({scopeId:f.manifest.scopeId,action:'revoke'});assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.company.creditPilot.count(),0);
});
test('populated schema20 migration preserves all old rows and creates no pilot approval',t=>{
 const f=pilotFixture();t.after(f.close);const c=f.claim();f.complete(c);f.store.db.exec('DROP TABLE investment_credit_pilot');f.store.run('DELETE FROM schema_migrations WHERE version=21');const tables=f.store.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(x=>x.name),before=Object.fromEntries(tables.map(n=>[n,f.store.all(`SELECT rowid original_rowid,* FROM ${n} ORDER BY rowid`)]));
 for(let i=0;i<2;i++){const db=new Store(join(f.root,'company.sqlite'));try{for(const n of tables)assert.deepEqual(db.all(`SELECT rowid original_rowid,* FROM ${n}${n==='schema_migrations'?' WHERE version<=20':''} ORDER BY rowid`),before[n]);assert.equal(db.all('SELECT * FROM investment_credit_pilot').length,0);assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);}finally{db.close();}}
});

for(const action of ['owner','group','scope','revoke'])test('pilot '+action+' pause/stop remains final after settled completion',t=>{
 const f=pilotFixture();t.after(f.close);const c=f.claim();
 if(action==='owner')f.company.pause(true);else if(action==='group')f.company.discussions.control({group_id:f.group.group_id,action:'pause',receipt_key:'fixture-pilot-pause'});else f.company.investmentTeam.control({scopeId:f.manifest.scopeId,action:action==='scope'?'pause':'revoke'});
 assert.equal(f.company.creditPilot.get()!.state,'stopped');f.company.creditPilot.finish(c.execution.execution_id,'completed',true);assert.equal(f.company.creditPilot.get()!.state,'stopped');assert.throws(()=>f.release());
});
test('failed reservation insert rolls back execution, permit and usage together',t=>{
 const f=pilotFixture();t.after(f.close);f.release();f.store.db.exec("CREATE TEMP TRIGGER fail_reservation BEFORE INSERT ON investment_activity_invocations BEGIN SELECT RAISE(ABORT,'fixture reservation failure'); END");
 assert.throws(()=>f.company.claimWorkNext(),/fixture reservation failure/);assert.equal(f.company.creditPilot.get()!.state,'released');assert.equal(f.company.creditPilot.get()!.execution_id,null);assert.equal(f.company.creditPilot.count(),0);assert.equal(f.store.all('SELECT * FROM executions').length,0);assert.equal(f.company.aiUsage.records().length,0);
 f.store.db.exec('DROP TRIGGER fail_reservation');assert.ok(f.company.claimWorkNext());assert.equal(f.company.creditPilot.count(),1);
});
test('private pilot cannot be selected as a committed publication source',async t=>{
 const f=pilotFixture(),template=teamFixture();t.after(f.close);t.after(()=>template.close());const description=structuredClone(template.description);description.artifacts=[];description.workers=Object.fromEntries(f.envelope.participants.map(p=>[p.workerId,{name:p.name,role:'Investment participant',responsibilities:[p.responsibility],status:'unavailable' as const}]));
 const source=new CommittedTeamPublicationSource('private-denial','Private fixture',f.store,{now:()=>new Date().toISOString()},'disposable-pilot-owner',f.manifest.runId,description,{groupId:f.group.group_id,runtimeEvidence:'fake_runtime_fixture',evidenceRights:{}});
 assert.throws(()=>source.project({experimentId:'fixture',runId:'fixture',policyVersion:'1',identity:(_kind,key)=>key,sequence:()=>'1'}),/private_pilot_publication_prohibited/);assert.equal(f.store.all('SELECT * FROM investment_public_attempts').length,0);
});

test('pilot binds authentication fingerprint across turns and refuses a changed account',t=>{
 const f=pilotFixture();t.after(f.close);const a=f.claim();f.complete(a);assert.equal(f.company.creditPilot.get()!.account_fingerprint,'a'.repeat(64));const b=f.claim();assert.throws(()=>f.company.creditPilot.admit(b.execution.execution_id,f.policy,'test-model','b'.repeat(64)),/authentication identity/);assert.throws(()=>f.store.run("UPDATE investment_credit_pilot SET account_fingerprint=NULL"),/immutable/);assert.equal(f.company.creditPilot.get()!.account_fingerprint,'a'.repeat(64));
});

test('credit eligibility handles multi-bucket, unknown and included-only observations conservatively',()=>{
 const account={account:{type:'chatgpt',planType:'pro'},requiresOpenaiAuth:true},bucket={planType:'pro',credits:{hasCredits:false},spendControlReached:false};
 assert.equal(eligibleCreditSubscription(account,{ordinaryUsageAllowed:true,rateLimitsByLimitId:{codex:bucket}}).creditUsageAllowed,false);
 for(const limits of [{ordinaryUsageAllowed:null,rateLimits:bucket},{ordinaryUsageAllowed:false,rateLimitsByLimitId:{a:{...bucket,credits:{hasCredits:true}},b:bucket}},{ordinaryUsageAllowed:true,rateLimitsByLimitId:{a:bucket,b:{...bucket,planType:'plus'}}},{ordinaryUsageAllowed:true,rateLimits:{...bucket,spendControlReached:true}}])assert.throws(()=>eligibleCreditSubscription(account,limits));
});

test('emitted CLI resolves repository root and inspects disposable records without inference',t=>{
 const f=pilotFixture();t.after(f.close);assert.equal(repoRoot,process.cwd());const result=JSON.parse(execFileSync(process.execPath,[join(repoRoot,'dist/scripts/credit-pilot/run.js'),'inspect',f.root],{encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe']}));assert.equal(result.reserved,0);assert.equal(result.pilot.pilot_id,f.policy.pilotId);assert.equal(result.usage.summary.invocations,0);
});
