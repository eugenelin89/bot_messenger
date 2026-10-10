import {randomUUID} from 'node:crypto';
import {teamFixture} from '../investment-team/support.js';
import type {LoopEnvelope,Occurrence} from '../../../src/domain/investment-loop/types.js';
export function loopFixture(options:{committed?:boolean}={}){
 const f=teamFixture(options),scope=f.grant();const sessions=f.config.calendar.sessions.filter(s=>s.status==='open'&&Date.parse(s.open)>Date.parse(f.clock.now())+86400000).slice(0,2).map(s=>s.date);
 const input:LoopEnvelope={scopeId:scope.scopeId,sessions,researchMinutes:60,maxCycleExecutions:12,maxDailyExecutions:16,maxRunExecutions:24,dailyLimits:{inputTokens:128000,outputTokens:24000,maxCostMicros:0},runLimits:{inputTokens:192000,outputTokens:36000,maxCostMicros:0},maxStageAttempts:3,retrySeconds:30};
 const loop=f.company.investmentLoop,preview=()=>loop.preview(input),control=(loopId:string,action:string,digest?:string,orderId?:string)=>loop.control({loopId,action,digest:digest??null,receiptId:randomUUID(),orderId:orderId??null});
 const start=()=>{const p=preview();control(p.loopId,'start',p.digest);return p;};
 const occurrences=(id:string)=>loop.occurrences(loop.get(id));const at=(o:Occurrence,delta=0)=>f.clock.set(new Date(Date.parse(o.due_at)+delta).toISOString());
 const measured=(c:ReturnType<typeof f.claim>)=>f.company.finish(c.execution.execution_id,{status:'completed',summary:'Explicit fixture settled; no actual model',investmentUsage:{inputTokens:100,outputTokens:20,costMicros:0}});
 const openings=()=>{const claims=f.pair();for(const c of claims){f.contribute(c);measured(c);}f.company.discussions.progress();return claims;};
 const waitCycle=()=>{const c=f.claim();f.call(c,'facilitate_discussion',{body:'Synthetic fixture chooses waiting for the next evidence checkpoint, without an invented investment result.',action:'synthesize',turns:[]});measured(c);f.company.discussions.progress();return c;};
 return {...f,scope,input,loop,preview,start,control,occurrences,at,measured,openings,waitCycle};
}
