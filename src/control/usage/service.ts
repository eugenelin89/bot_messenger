import {createHash} from 'node:crypto';
import type {Company} from '../company.js';
import {requireThat} from '../../domain/model.js';
import {normalizeTokens,subtractTokens,addTokens,ZERO,type Tokens,type UsageObservation} from '../../domain/usage/tokens.js';
import {estimate,priceFor,PRICING_VERSION,PRICES,usd,type Estimate,type Price} from '../../domain/usage/pricing.js';
interface Row {usage_id:string;execution_id:string;worker_id:string;activity:string;run_id:string|null;scope_id:string|null;cycle_id:string|null;request_id:string|null;provider:string|null;model:string|null;thread_id:string|null;turn_id:string|null;service_tier:string|null;started_at:string;finished_at:string|null;status:string;baseline:string|null;tokens:string|null;last_total:string|null;completeness:string;reasons:string;pricing_version:string;price:string|null;estimate:string|null;model_changed:number;settled:number}
const json=(v:unknown)=>JSON.stringify(v);
const day=(at:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export class AIUsage {
 constructor(readonly company:Company){}
 private get db(){return this.company.store;}
 private now(){return new Date(this.company.mandates.clock.now()).toISOString();}
 ensure(executionId:string,usageId=executionId,activity?:string){
 const x=this.company.execution(executionId),s=x.origin==='conversation'?this.company.investmentTeam.forConversation(this.company.conversations.request(x.request_id).conversation_id):undefined;
 const cycle=this.db.get<{occurrence_id:string}>('SELECT occurrence_id FROM investment_loop_executions WHERE execution_id=?',executionId)?.occurrence_id;
 const turn=x.origin==='conversation'?this.company.discussions.turn(x.request_id):undefined;
 this.db.run('INSERT OR IGNORE INTO ai_usage (usage_id,execution_id,worker_id,activity,run_id,scope_id,cycle_id,request_id,started_at,pricing_version) VALUES (?,?,?,?,?,?,?,?,?,?)',usageId,executionId,x.worker_id,activity??turn?.kind??(x.origin==='task'?'task':'conversation'),s?.run_id??null,s?.scope_id??null,cycle??null,x.origin==='conversation'?x.request_id:null,this.now(),PRICING_VERSION);
 }
 private row(id:string){const r=this.db.get<Row>('SELECT * FROM ai_usage WHERE usage_id=?',id);requireThat(r,'Usage record missing');return r;}
 private reason(id:string,reason:string){const r=this.row(id),reasons=JSON.parse(r.reasons) as string[];if(!reasons.includes(reason))reasons.push(reason);this.db.run("UPDATE ai_usage SET reasons=?,completeness='incomplete' WHERE usage_id=?",json(reasons),id);}
 observe(executionId:string,event:UsageObservation,usageId=executionId){this.db.transaction(()=>{
 this.ensure(executionId,usageId);const r=this.row(usageId);
 if(event.kind==='start'){
 const i=event.identity;requireThat(!r.thread_id||r.thread_id===i.threadId,'Usage thread identity changed');if(r.thread_id){requireThat(r.model===i.model&&r.provider===i.provider,'Usage provenance immutable');return;}
 // Fresh threads have an exact zero baseline. Resume baselines need a verified retained final total.
 const previous=this.db.get<Row>("SELECT * FROM ai_usage WHERE thread_id=? AND usage_id!=? ORDER BY rowid DESC LIMIT 1",i.threadId,usageId);
 const baseline=i.freshThread?json(ZERO):previous?.completeness==='complete'?previous.last_total:null;
 this.db.run('UPDATE ai_usage SET provider=?,model=?,thread_id=?,service_tier=?,baseline=?,price=? WHERE usage_id=?',i.provider,i.model,i.threadId,i.serviceTier,baseline??null,json(priceFor(i.model,i.provider)),usageId);return;
 }
 requireThat(r.thread_id===event.threadId,'Usage thread mismatch');
 if(event.kind==='turn'){requireThat(!r.turn_id||r.turn_id===event.turnId,'Usage turn changed');this.db.run('UPDATE ai_usage SET turn_id=? WHERE usage_id=?',event.turnId,usageId);return;}
 requireThat(r.turn_id===event.turnId,'Usage turn mismatch');
 if(event.kind==='provider_retry'){this.reason(usageId,'Provider retry observed; failed-attempt token coverage unavailable');this.refresh(usageId);return;}
 if(event.kind==='model_changed'){this.db.run('UPDATE ai_usage SET model_changed=1 WHERE usage_id=?',usageId);this.reason(usageId,'Provider changed model');this.refresh(usageId);return;}
 try {
 if(event.kind==='response'){
 const payload=event.usage===null?'null':json(normalizeTokens(event.usage));
 requireThat(typeof event.responseId==='string'&&event.responseId.length>0&&event.responseId.length<=300,'Invalid response identity');
 const prior=this.db.get<{payload:string}>('SELECT payload FROM ai_usage_responses WHERE usage_id=? AND response_id=?',usageId,event.responseId);
 requireThat(!prior||prior.payload===payload,'Conflicting response usage');
 this.db.run('INSERT OR IGNORE INTO ai_usage_responses VALUES (?,?,?,?)',usageId,event.responseId,payload,this.now());
 const responses=this.db.all<{payload:string}>('SELECT payload FROM ai_usage_responses WHERE usage_id=?',usageId);
 const valid=responses.filter(p=>p.payload!=='null');const tokens=valid.reduce((sum,p)=>addTokens(sum,JSON.parse(p.payload) as Tokens),ZERO);
 this.db.run('UPDATE ai_usage SET tokens=? WHERE usage_id=?',valid.length?json(tokens):null,usageId);
 if(valid.length!==responses.length)this.reason(usageId,'An upstream response omitted usage');
 }else{
 const total=normalizeTokens(event.total),last=normalizeTokens(event.last),digest=createHash('sha256').update(json({total,last})).digest('hex');
 if(this.db.get('SELECT 1 FROM ai_usage_observations WHERE usage_id=? AND observation_hash=?',usageId,digest))return;
 subtractTokens(total,last);
 this.db.run('INSERT INTO ai_usage_observations VALUES (?,?,?,?,?,?,?)',usageId,digest,event.threadId,event.turnId,json(total),json(last),this.now());
 if(r.last_total)subtractTokens(total,JSON.parse(r.last_total) as Tokens);
 this.db.run('UPDATE ai_usage SET last_total=? WHERE usage_id=?',json(total),usageId);
 // Cumulative notifications are diagnostic estimates; never add repeated snapshots or `last` values.
 if(!this.db.get('SELECT 1 FROM ai_usage_responses WHERE usage_id=?',usageId)&&r.baseline){const tokens=subtractTokens(total,JSON.parse(r.baseline) as Tokens);this.db.run('UPDATE ai_usage SET tokens=? WHERE usage_id=?',json(tokens),usageId);}
 }
 }catch{this.reason(usageId,'Rejected malformed, contradictory, decreasing or overflowing usage');}
 this.refresh(usageId);
 });}
 private refresh(id:string){const r=this.row(id);const e=estimate(r.tokens?JSON.parse(r.tokens):null,r.price?JSON.parse(r.price):null,r.service_tier,r.completeness==='complete',!!r.model_changed);this.db.run('UPDATE ai_usage SET estimate=? WHERE usage_id=?',json(e),id);}
 finish(executionId:string,status:string,settled:boolean,usageId=executionId){this.db.transaction(()=>{this.ensure(executionId,usageId);const r=this.row(usageId);
 // A terminal turn alone does not make estimated/replayed cumulative telemetry authoritative.
 const responses=this.db.all<{payload:string}>('SELECT payload FROM ai_usage_responses WHERE usage_id=?',usageId);
 const missing=r.tokens?Object.entries(JSON.parse(r.tokens) as Tokens).filter(([,value])=>value===null).map(([key])=>key):[];
 if(missing.length)this.reason(usageId,'Usage incomplete: missing '+missing.join(', '));
 const complete=missing.length===0&&status==='completed'&&settled&&responses.length>0&&responses.every(p=>p.payload!=='null')&&JSON.parse(r.reasons).length===0;
 this.db.run("UPDATE ai_usage SET status=?,settled=?,finished_at=CASE WHEN ?='unknown' THEN NULL ELSE coalesce(finished_at,?) END,completeness=? WHERE usage_id=?",status,Number(settled),status,this.now(),complete?'complete':'incomplete',usageId);
 if(!complete)this.reason(usageId,responses.length?'Usage incomplete: terminal settlement or categories missing':'Usage incomplete: no authoritative response usage');
 this.refresh(usageId);
 });}
 recover(){for(const r of this.db.all<Row>("SELECT * FROM ai_usage WHERE status='running'"))this.finish(r.execution_id,'unknown',false,r.usage_id);}
 records(filter:{executionId?:string;workerId?:string;runId?:string;cycleId?:string}={}){
 const where:string[]=[],values:string[]=[];for(const [key,column] of [['executionId','execution_id'],['workerId','worker_id'],['runId','run_id'],['cycleId','cycle_id']] as const)if(filter[key]){where.push(`${column}=?`);values.push(filter[key]!);}
 return this.db.all<Row>(`SELECT * FROM ai_usage ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY started_at,usage_id`,...values).map(r=>({...r,workerName:this.company.worker(r.worker_id).display_name,tokens:r.tokens?JSON.parse(r.tokens) as Tokens:null,price:r.price?JSON.parse(r.price) as Price:null,estimate:r.estimate?JSON.parse(r.estimate) as Estimate:null,reasons:JSON.parse(r.reasons) as string[],day:day(r.started_at),durationMs:r.finished_at?Math.max(0,Date.parse(r.finished_at)-Date.parse(r.started_at)):null,actualSubscriptionCharges:'unavailable',actualProQuotaConsumed:'unavailable'}));
 }
 aggregate(rows:ReturnType<AIUsage['records']>){
 const total=(k:keyof Tokens)=>rows.every(r=>r.tokens&&r.tokens[k]!==null)?String(rows.reduce((n,r)=>n+BigInt(r.tokens![k]!),0n)):null;
 const priced=rows.filter(r=>r.estimate?.picoUsd!==null&&r.estimate?.picoUsd!==undefined),picos=priced.reduce((n,r)=>n+BigInt(r.estimate!.picoUsd!),0n);
 const incomplete=rows.filter(r=>r.completeness!=='complete').map(r=>r.usage_id),unpriced=rows.filter(r=>!r.estimate?.picoUsd).map(r=>r.usage_id);
 const completed=priced.filter(r=>r.status==='completed');
 return {invocations:rows.length,inputTokens:total('inputTokens'),cachedInputTokens:total('cachedInputTokens'),outputTokens:total('outputTokens'),totalTokens:total('totalTokens'),estimatedUsd:priced.length?usd(picos):null,estimateStatus:unpriced.length||incomplete.length||priced.some(r=>r.estimate?.state!=='available')?'partial':'complete',unpricedExecutionIds:unpriced,incompleteExecutionIds:incomplete,durationMs:rows.every(r=>r.durationMs!==null)?rows.reduce((n,r)=>n+r.durationMs!,0):null,unknownDurationExecutionIds:rows.filter(r=>r.durationMs===null).map(r=>r.usage_id),averageEstimatedUsdPerPricedCompletedInvocation:completed.length?usd(completed.reduce((n,r)=>n+BigInt(r.estimate!.picoUsd!),0n)/BigInt(completed.length)):null,averageDenominator:completed.length};
 }
 report(filter:Parameters<AIUsage['records']>[0]={}){this.company.conversations.human();const rows=this.records(filter);const group=(key:'worker_id'|'cycle_id'|'day'|'activity')=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].filter((k):k is string=>k!==null).map(k=>[k,this.aggregate(rows.filter(r=>r[key]===k))]));
 return {executions:rows,summary:this.aggregate(rows),byWorker:group('worker_id'),byCycle:Object.fromEntries(Object.entries(group('cycle_id')).map(([id,summary])=>[id,{...summary,byWorker:Object.fromEntries([...new Set(rows.filter(r=>r.cycle_id===id).map(r=>r.worker_id))].map(worker=>[worker,this.aggregate(rows.filter(r=>r.cycle_id===id&&r.worker_id===worker))]))}])),byDay:group('day'),byActivity:group('activity'),rolling24h:this.aggregate(rows.filter(r=>Date.parse(r.started_at)>this.company.mandates.clock.now()-86400000)),pricing:{version:PRICING_VERSION,entries:PRICES,methodology:'(uncached input × input rate + cached input × cached rate + output × output rate) / 1,000,000. Reasoning is included in output. Base token estimate only; excludes tool/feature fees, regional processing and unverified pricing dimensions. Separate from actual billing and portfolio P&L.'},actualSubscriptionCharges:'unavailable',actualProQuotaConsumed:'unavailable'};
 }
}
