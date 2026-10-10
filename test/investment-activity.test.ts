import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {teamFixture} from './fixtures/investment-team/support.js';
import {ACTIVITY_MAX,type ActivityPolicy} from '../src/domain/usage/policy.js';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {Dispatcher} from '../src/control/dispatcher.js';
import {CodexRuntime} from '../src/runtime/codex.js';
import {until,objective} from './helpers.js';
const eligibility={authMode:'chatgpt',planType:'pro',ordinaryUsageAllowed:true,paidCredits:false,provider:'openai'} as const;
function setup(p:ActivityPolicy={...ACTIVITY_MAX}){const f=teamFixture();f.envelope.executionPolicy=p;f.envelope.maxExecutions=p.maxRun;f.bounded.runSubscriptionInvestment=f.runtime.run.bind(f.runtime);const scope=f.grant();f.control('start');return {...f,scope,a:f.company.investmentActivity};}
function admit(f:ReturnType<typeof setup>,c:ReturnType<typeof f.claim>){f.a.admit(c.context,{threadId:f.company.conversations.binding(c.context)!.runtime_reference,model:'fake-model',eligibility});}
// Build retained settled conversation history with valid SQL owner constraints; no model runs.
function history(f:ReturnType<typeof setup>,c:ReturnType<typeof f.claim>,at:string){
 const copy=(table:string,row:Record<string,unknown>)=>{const keys=Object.keys(row);f.store.run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,...Object.values(row) as any[]);};
 const request=randomUUID(),execution=randomUUID();
 copy('conversation_requests',{...f.store.get<Record<string,unknown>>('SELECT * FROM conversation_requests WHERE request_id=?',c.request.request_id)!,request_id:request,response_message_id:null});
 copy('discussion_turns',{...f.store.get<Record<string,unknown>>('SELECT * FROM discussion_turns WHERE request_id=?',c.request.request_id)!,turn_id:randomUUID(),request_id:request});
 copy('executions',{...f.store.get<Record<string,unknown>>('SELECT * FROM executions WHERE execution_id=?',c.execution.execution_id)!,execution_id:execution,request_id:request});
 copy('investment_activity_invocations',{...f.store.get<Record<string,unknown>>('SELECT * FROM investment_activity_invocations WHERE execution_id=?',c.execution.execution_id)!,execution_id:execution,request_id:request,reserved_at:at});
 return execution;
}
test('one investment reservation is atomic across independent connections, while ordinary work retains the second slot',async t=>{
 const f=setup();t.after(()=>f.close());const other=new Store(join(f.dir,'company.sqlite'));t.after(()=>other.close());const company=new Company(other,f.dir,process.cwd(),'fake');company.mandates.clock=f.company.mandates.clock;company.investmentTeam.runtime=f.bounded;
 const claims=await Promise.all([Promise.resolve().then(()=>f.company.claimWorkNext()),Promise.resolve().then(()=>company.claimWorkNext())]);assert.equal(claims.filter(Boolean).length,1);assert.equal(f.a.counts(f.config.runId).active,1);
 const c=claims.find(Boolean)!;assert.equal(f.store.get<{n:number}>('SELECT count(*) n FROM ai_usage WHERE execution_id=?',c.execution.execution_id)!.n,1);
 f.company.assignObjective(objective);const ordinary=f.company.claimNext();if(c.worker.worker_id===f.scout.worker_id)assert.ok(ordinary);else { // Atlas is busy: Scout still receives an ordinary owner task.
 f.company.createTask('human',f.scout,objective,null,'research');assert.ok(f.company.claimNext());}
 assert.equal(f.store.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n,2);assert.equal(f.company.claimWorkNext(),undefined);
});
test('first eight reservations consume rolling allowance; exact 24-hour boundary releases one, not at midnight',async t=>{
 const f=setup();t.after(()=>f.close());const c=f.claim();admit(f,c);f.contribute(c);f.finish(c);const first=f.store.get<{reserved_at:string}>('SELECT reserved_at FROM investment_activity_invocations')!.reserved_at;
 for(let i=1;i<8;i++){f.a.check(f.scope.scopeId,ACTIVITY_MAX);history(f,c,new Date(Date.parse(first)+i).toISOString());}
 assert.equal(f.a.counts(f.config.runId).rolling24h,8);assert.throws(()=>f.a.check(f.scope.scopeId,ACTIVITY_MAX),/24-hour/);
 f.clock.set(new Date(Date.parse(first)+86400000-1).toISOString());assert.throws(()=>f.a.check(f.scope.scopeId,ACTIVITY_MAX),/24-hour/);
 f.clock.set(new Date(Date.parse(first)+86400000).toISOString());assert.equal(f.a.counts(f.config.runId).rolling24h,7);assert.doesNotThrow(()=>f.a.check(f.scope.scopeId,ACTIVITY_MAX));
});
test('24-run maximum survives expired rolling windows; lower limits and backwards clocks hold',async t=>{
 const f=setup();t.after(()=>f.close());const c=f.claim();admit(f,c);f.contribute(c);f.finish(c);const start=Date.parse(f.clock.now());
 for(let i=1;i<24;i++){f.clock.set(new Date(start+i*86400000).toISOString());f.a.check(f.scope.scopeId,ACTIVITY_MAX);history(f,c,f.clock.now());}
 assert.equal(f.a.counts(f.config.runId).run,24);assert.throws(()=>f.a.check(f.scope.scopeId,ACTIVITY_MAX),/run invocation/);f.company.mandates.clock={now:()=>start-1000};assert.throws(()=>f.a.counts(f.config.runId),/backwards/);assert.equal(f.a.summary(f.scope.scopeId)!.clockHeld,true);
});
test('lower approved rolling cap holds queued work without permanently failing the request',async t=>{const f=setup({...ACTIVITY_MAX,maxRolling24h:1});t.after(()=>f.close());const c=f.claim();admit(f,c);f.contribute(c);f.finish(c);assert.equal(f.company.claimWorkNext(),undefined);assert.ok(f.store.get("SELECT 1 FROM conversation_requests WHERE status='queued'"));const summary=f.a.summary(f.scope.scopeId)!;assert.ok('remainingRolling24h' in summary);assert.equal(summary.remainingRolling24h,0);});
for(const action of ['pause','revoke','expiry','global_pause'] as const)test(`fresh admission rechecks ${action}`,async t=>{const f=setup();t.after(()=>f.close());const c=f.claim();if(action==='expiry')f.clock.set(f.envelope.expiresAt);else if(action==='global_pause')f.company.pause(true);else f.company.investmentTeam.control({scopeId:f.scope.scopeId,action});assert.throws(()=>admit(f,c));assert.equal(f.a.counts(f.config.runId).run,1);});
test('crash after reservation before runtime setup is visible, durable and never replayed',async t=>{const f=setup();t.after(()=>f.close());const c=f.claim();assert.equal(f.company.aiUsage.records({executionId:c.execution.execution_id}).length,1);f.clock.set(new Date(Date.parse(f.clock.now())+2*86400000).toISOString());f.company.recover();const u=f.company.aiUsage.report({executionId:c.execution.execution_id});assert.equal(u.executions[0]!.status,'unknown');assert.equal(u.executions[0]!.durationMs,null);assert.equal(u.summary.durationMs,null);assert.equal(u.summary.unknownDurationExecutionIds.length,1);assert.equal(f.a.counts(f.config.runId).run,1);assert.equal(f.a.counts(f.config.runId).active,1);assert.equal(f.company.claimWorkNext(),undefined);const reopened=new Store(join(f.dir,'company.sqlite'));assert.equal(reopened.get<{state:string}>('SELECT state FROM investment_activity_invocations')!.state,'unknown');reopened.close();assert.throws(()=>admit(f,c));assert.throws(()=>f.store.run('DELETE FROM investment_activity_invocations'),/never refund/);assert.throws(()=>f.store.run("UPDATE investment_activity_invocations SET cycle_id='forged'"),/immutable/);});
test('uncertain active result retains one-investment fence; no refunded or replayed invocation',async t=>{const f=setup();t.after(()=>f.close());const c=f.claim();admit(f,c);assert.throws(()=>admit(f,c),/replay/);f.company.finish(c.execution.execution_id,{status:'interrupted',settled:false});assert.equal(f.a.counts(f.config.runId).active,1);assert.equal(f.company.claimWorkNext(),undefined);assert.equal(f.runtime.calls.length,0);});
test('unmetered proof is mandatory and hidden model research/peer paths remain prohibited',async t=>{const f=setup();t.after(()=>f.close());const c=f.claim();assert.throws(()=>f.a.admit(c.context,{threadId:f.company.conversations.binding(c.context)!.runtime_reference,model:'fake-model',eligibility:{...eligibility,paidCredits:true} as any}),/eligibility/);assert.throws(()=>f.call(c,'ask_peer',{worker_id:f.scout.worker_id,question:'Hidden inference'}));await assert.rejects(()=>Promise.resolve().then(()=>f.company.research.callTool(c.context,'search','research_search',{query:'Synthetic research'},new AbortController().signal)),/bounded|research|grant|authority/i);assert.equal(f.a.counts(f.config.runId).run,1);});
test('pinned Codex capability is unavailable and never falls back or launches its command',async t=>{const f=setup();t.after(()=>f.close());const codex=new CodexRuntime({command:'/does-not-exist'});assert.equal('runSubscriptionInvestment' in codex,false);f.company.investmentTeam.runtime=codex;assert.equal(f.company.investmentTeam.runtimeAvailable(f.scope.scopeId),false);assert.equal(f.company.claimWorkNext(),undefined);assert.match(f.company.investmentTeam.inspect().subscriptionBlockReason!,/included-only.*retries/);assert.equal(f.a.counts(f.config.runId).run,0);});
test('finite adapter deadline interrupts once, retains partial usage and never retries',async t=>{const f=setup({...ACTIVITY_MAX,maxDurationMs:100});let starts=0,abort=false;
 f.bounded.runSubscriptionInvestment=async(input,signal)=>{starts++;const threadId='fixture-thread';input.bind({worker_id:input.worker.worker_id,runtime_type:'fake',runtime_reference:threadId,workspace_path:input.worker.workspace_path,created_at:f.clock.now()});input.admitSubscription!({threadId,model:'fake-model',eligibility});input.usage!({kind:'start',identity:{threadId,model:'fake-model',provider:'openai',serviceTier:'standard',freshThread:true}});input.usage!({kind:'turn',threadId,turnId:'t'});await new Promise<void>(resolve=>{if(signal.aborted)resolve();else signal.addEventListener('abort',()=>resolve(),{once:true});});abort=true;return {status:'interrupted',settled:false};};const dispatcher=new Dispatcher(f.company,f.bounded);t.after(async()=>{await dispatcher.stop();await f.close();});dispatcher.start();await until(()=>abort);await until(()=>dispatcher.activeCount===0);assert.equal(starts,1);assert.equal(f.a.counts(f.config.runId).active,1);assert.equal(f.company.aiUsage.report({runId:f.config.runId}).summary.incompleteExecutionIds.length,1);
});

test('eight actual claims count openings, follow-up, synthesis, review and finalize including resumed sessions',async t=>{
 const f=setup();t.after(()=>f.close());const kinds:string[]=[],threads:string[]=[];
 const claim=()=>{const c=f.claim();admit(f,c);kinds.push(f.company.discussions.turn(c.request.request_id)!.kind);threads.push(f.company.conversations.binding(c.context)!.runtime_reference);return c;};
 const first=claim(),a=f.contribute(first);f.finish(first);const second=claim();f.contribute(second);f.finish(second);
 const facilitator=claim();f.call(facilitator,'facilitate_discussion',{body:'Request an independent challenge of the synthetic premise.',action:'discuss',turns:[{worker_id:f.scout.worker_id,prompt:'Challenge the retained uncertainty.',contribution_ids:[a.message_id],evidence_ids:[]}]});f.finish(facilitator);
 const response=claim();f.contribute(response,'The uncertainty remains explicit.',[a.message_id]);f.finish(response);
 const decision=claim();f.call(decision,'facilitate_discussion',{body:'Retain the challenge and synthesize.',action:'synthesize',turns:[]});f.finish(decision);
 const body={recommendation:'Wait for evidence',alternatives:'A guarded paper position',supporting_findings:'Only synthetic assumptions',challenges_addressed:'Demand uncertainty remains',dissent_and_risks:'Opportunity cost',missing_evidence_and_confidence:'No live evidence',next_actions_and_approvals:'Owner approval remains separate',contribution_ids:[a.message_id],evidence_ids:[]};
 const draft=claim(),saved=f.call(draft,'submit_synthesis',body);f.finish(draft);
 const reviewer=claim();f.call(reviewer,'read_group_record',{record_id:saved.message_id,offset:0});f.contribute(reviewer,'Retain the draft uncertainty.',[saved.message_id]);f.finish(reviewer);
 const final=claim();f.call(final,'submit_synthesis',body);f.finish(final);assert.deepEqual(kinds,['opening','opening','facilitate','response','facilitate','synthesis','review','finalize']);assert.equal(f.a.counts(f.config.runId).run,8);assert.ok(new Set(threads).size<8);assert.throws(()=>f.a.check(f.scope.scopeId,ACTIVITY_MAX),/24-hour/);assert.equal(f.company.aiUsage.report({runId:f.config.runId}).summary.invocations,8);
});
