import {ACTIVITY_MAX} from '../../../src/domain/usage/policy.js';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {teamFixture} from '../investment-team/support.js';
import type {LoopEnvelope,Occurrence} from '../../../src/domain/investment-loop/types.js';
export function loopFixture(options:{committed?:boolean;activity?:boolean}={}){
 const f=teamFixture(options);if(options.activity){f.envelope.executionPolicy={...ACTIVITY_MAX};f.bounded.runSubscriptionInvestment=f.runtime.run.bind(f.runtime);}const scope=f.grant();
 // The simulator freezes its first benchmark at creation. An arbitrary 24-hour
 // buffer can skip that session as wall time advances and invalidate every loop.
 const benchmark=f.sim.inspect(f.config.runId).benchmarkNextOpen,open=f.config.calendar.sessions.filter(s=>s.status==='open'),first=open.findIndex(s=>s.date===benchmark);
 assert.ok(first>=0,'Fixture frozen benchmark must be present');const sessions=open.slice(first,first+2).map(s=>s.date);assert.equal(sessions.length,2,'Fixture requires two frozen sessions');
 const input:LoopEnvelope={scopeId:scope.scopeId,sessions,researchMinutes:60,maxCycleExecutions:12,maxDailyExecutions:16,maxRunExecutions:24,dailyLimits:{inputTokens:128000,outputTokens:24000,maxCostMicros:0},runLimits:{inputTokens:192000,outputTokens:36000,maxCostMicros:0},maxStageAttempts:3,retrySeconds:30};
 const loop=f.company.investmentLoop,preview=()=>loop.preview(input),control=(loopId:string,action:string,digest?:string,orderId?:string)=>loop.control({loopId,action,digest:digest??null,receiptId:randomUUID(),orderId:orderId??null});
 const start=()=>{const p=preview();control(p.loopId,'start',p.digest);return p;};
 const occurrences=(id:string)=>loop.occurrences(loop.get(id));const at=(o:Occurrence,delta=0)=>f.clock.set(new Date(Date.parse(o.due_at)+delta).toISOString());
 const measured=(c:ReturnType<typeof f.claim>)=>f.company.finish(c.execution.execution_id,{status:'completed',summary:'Explicit fixture settled; no actual model',investmentUsage:{inputTokens:100,outputTokens:20,costMicros:0}});
 const openings=()=>{const claims=f.pair();for(const c of claims){f.contribute(c);measured(c);}f.company.discussions.progress();return claims;};
 const waitCycle=()=>{const c=f.claim();f.call(c,'facilitate_discussion',{body:'Synthetic fixture chooses waiting for the next evidence checkpoint, without an invented investment result.',action:'synthesize',turns:[]});measured(c);f.company.discussions.progress();return c;};
 return {...f,scope,input,loop,preview,start,control,occurrences,at,measured,openings,waitCycle};
}
