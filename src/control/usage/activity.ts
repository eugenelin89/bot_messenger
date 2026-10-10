import type {Company,ExecutionContext} from '../company.js';
import type {ReplyRequest} from '../../domain/conversations.js';
import {requireThat} from '../../domain/model.js';
import {executionPolicy,type ActivityPolicy,type SubscriptionEligibility} from '../../domain/usage/policy.js';
export class InvestmentActivity {
 constructor(readonly company:Company){}
 private get db(){return this.company.store;}
 policy(scopeId:string){const p=executionPolicy(this.company.investmentTeam.envelope(this.company.investmentTeam.scope(scopeId)).executionPolicy);return p.mode!=='strict_provider_enforced'?p:undefined;}
 forExecution(id:string){const r=this.db.get<{scope_id:string}>('SELECT scope_id FROM investment_team_executions WHERE execution_id=?',id);return r?this.policy(r.scope_id):undefined;}
 deadline(executionId:string){const row=this.db.get<{reserved_at:string;policy:string}>('SELECT reserved_at,policy FROM investment_activity_invocations WHERE execution_id=?',executionId);return row?new Date(Date.parse(row.reserved_at)+(JSON.parse(row.policy) as ActivityPolicy).maxDurationMs).toISOString():null;}
 held(r:ReplyRequest){
 const s=this.company.investmentTeam.forConversation(r.conversation_id);if(!s)return false;
 const p=this.policy(s.scope_id);
 if(this.db.get("SELECT 1 FROM investment_activity_invocations WHERE state IN ('reserved','active','unknown')"))return true;
 if(!p)return false;
 if(p.mode==='credit_approved_private_pilot'&&this.company.creditPilot.held(r,p,s.scope_id))return true;
 try{const c=this.counts(s.run_id);return c.rolling24h>=p.maxRolling24h||c.run>=p.maxRun||!!this.db.get("SELECT 1 FROM investment_team_executions te JOIN executions e USING(execution_id) WHERE e.status='running'");}catch{return true;}
 }
 nextWake(){
 if(this.company.paused)return undefined;
 const now=this.company.mandates.clock.now();
 const queued=this.db.all<ReplyRequest>("SELECT r.* FROM conversation_requests r JOIN investment_team_scopes s ON s.group_id IN (SELECT group_id FROM working_groups WHERE conversation_id=r.conversation_id) WHERE r.status='queued' AND s.state='active'");
 const times:number[]=[];
 for(const r of queued){const s=this.company.investmentTeam.forConversation(r.conversation_id)!,p=this.policy(s.scope_id);if(!p)continue;try{const c=this.counts(s.run_id);if(c.run<p.maxRun&&c.rolling24h>=p.maxRolling24h){const oldest=this.db.get<{reserved_at:string}>('SELECT reserved_at FROM investment_activity_invocations WHERE reserved_at>? ORDER BY reserved_at LIMIT 1',new Date(now-86400000).toISOString());if(oldest)times.push(Date.parse(oldest.reserved_at)+86400000);}}catch{}}
 return times.length?new Date(Math.min(...times)).toISOString():undefined;
 }
 private clock(){const now=this.company.mandates.clock.now();requireThat(Number.isSafeInteger(now)&&now>=0,'Invalid activity clock');const high=this.db.get<{high_water:number}>('SELECT high_water FROM investment_activity_clock WHERE singleton=1');requireThat(!high||now>=high.high_water,'Activity clock moved backwards; admission held');return now;}
 counts(runId:string,now=this.clock()){return {rolling24h:this.db.get<{n:number}>('SELECT count(*) n FROM investment_activity_invocations WHERE reserved_at>?',new Date(now-86400000).toISOString())!.n,run:this.db.get<{n:number}>('SELECT count(*) n FROM investment_activity_invocations WHERE run_id=?',runId)!.n,active:this.db.get<{n:number}>("SELECT count(*) n FROM investment_activity_invocations WHERE state IN ('reserved','active','unknown')")!.n};}
 check(scopeId:string,policy:ActivityPolicy){const s=this.company.investmentTeam.scope(scopeId),now=this.clock(),c=this.counts(s.run_id,now);requireThat(c.rolling24h<policy.maxRolling24h,'Rolling 24-hour investment invocation allowance exhausted');requireThat(c.run<policy.maxRun,'Investment run invocation allowance exhausted');requireThat(c.active===0,'Investment invocation active or outcome unknown');requireThat(!this.company.paused,'Owner paused model admission');return now;}
 reserve(r:ReplyRequest,executionId:string,scopeId:string){const p=this.policy(scopeId);if(!p)return;if(p.mode==='credit_approved_private_pilot')this.company.creditPilot.consume(r,executionId,p,scopeId);const now=this.check(scopeId,p),s=this.company.investmentTeam.scope(scopeId),cycle=this.db.get<{occurrence_id:string}>('SELECT occurrence_id FROM investment_loop_requests WHERE request_id=?',r.request_id)?.occurrence_id;
 requireThat(this.db.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n<=2&&!this.db.get("SELECT 1 FROM investment_team_executions te JOIN executions e USING(execution_id) WHERE e.status='running' AND e.execution_id!=?",executionId),'Investment/global execution ceiling exceeded');
 this.db.run('INSERT INTO investment_activity_invocations (execution_id,scope_id,run_id,cycle_id,worker_id,request_id,reserved_at,state,policy) VALUES (?,?,?,?,?,?,?,\'reserved\',?)',executionId,scopeId,s.run_id,cycle??null,r.target_worker_id,r.request_id,new Date(now).toISOString(),JSON.stringify(p));
 this.db.run('INSERT INTO investment_activity_clock VALUES (1,?) ON CONFLICT(singleton) DO UPDATE SET high_water=excluded.high_water',now);
 }
 admit(context:ExecutionContext,identity:{threadId:string;model:string;accountFingerprint?:string;eligibility:SubscriptionEligibility}){this.db.transaction(()=>{
 const x=this.company.execution(context.executionId);requireThat(x.origin==='conversation','Investment conversation required');this.company.conversations.verify(context);
 const row=this.db.get<{state:string;scope_id:string;reserved_at:string;policy:string}>('SELECT * FROM investment_activity_invocations WHERE execution_id=?',context.executionId);requireThat(row?.state==='reserved','Investment invocation cannot replay');
 const binding=this.company.conversations.binding(context);requireThat(binding?.runtime_reference===identity.threadId&&typeof identity.model==='string'&&identity.model.length>0,'Investment runtime identity mismatch');
 const p=this.policy(row.scope_id)!;requireThat(JSON.stringify(p)===row.policy,'Reserved activity policy changed');requireThat(!this.company.paused&&this.clock()<Date.parse(row.reserved_at)+p.maxDurationMs,'Investment admission paused or deadline expired');
 requireThat(identity.eligibility.authMode==='chatgpt'&&identity.eligibility.provider==='openai','Subscription eligibility missing');
 if(p.mode==='credit_approved_private_pilot'){requireThat(identity.eligibility.paidCredits==='existing_approved'&&(identity.eligibility.ordinaryUsageAllowed||identity.eligibility.creditUsageAllowed),'Credit-approved eligibility missing');this.company.creditPilot.admit(context.executionId,p,identity.model,identity.accountFingerprint);}else requireThat(identity.eligibility.ordinaryUsageAllowed===true&&identity.eligibility.paidCredits===false,'Included-only eligibility missing');
 requireThat(this.db.get<{n:number}>("SELECT count(*) n FROM executions WHERE status='running'")!.n<=2&&!this.db.get("SELECT 1 FROM investment_activity_invocations WHERE execution_id!=? AND state IN ('reserved','active','unknown')",context.executionId),'Concurrent invocation denied');
 this.db.run("UPDATE investment_activity_invocations SET state='active',provider='openai',model=?,thread_id=?,eligibility=? WHERE execution_id=?",identity.model,identity.threadId,JSON.stringify(identity.eligibility),context.executionId);
 });}
 turn(executionId:string,turnId:string){this.db.run('UPDATE investment_activity_invocations SET turn_id=? WHERE execution_id=? AND turn_id IS NULL',turnId,executionId);}
 finish(executionId:string,status:string,settled:boolean){const r=this.db.get<{state:string}>('SELECT state FROM investment_activity_invocations WHERE execution_id=?',executionId);if(!r)return;this.db.run('UPDATE investment_activity_invocations SET state=?,finished_at=?,terminal_status=? WHERE execution_id=?',settled||r.state==='reserved'?'settled':'unknown',new Date(this.company.mandates.clock.now()).toISOString(),status,executionId);this.company.creditPilot.finish(executionId,status,settled);}
 recover(){this.company.creditPilot.recover();this.db.run("UPDATE investment_activity_invocations SET state='unknown',terminal_status='unknown' WHERE state IN ('reserved','active')");}
 summary(scopeId:string){const p=this.policy(scopeId);if(!p)return null;const s=this.company.investmentTeam.scope(scopeId);let c;try{c=this.counts(s.run_id);}catch{return {policy:p,clockHeld:true};}return {policy:p,...c,pilot:p.mode==='credit_approved_private_pilot'?{reserved:this.company.creditPilot.count(),maximum:4,state:this.company.creditPilot.get()?.state??'unapproved'}:null,remainingRolling24h:Math.max(0,p.maxRolling24h-c.rolling24h),remainingRun:Math.max(0,p.maxRun-c.run),unit:'Supervised Codex turns including internal tool loops',actualProQuotaConsumed:'unavailable'};}
}
