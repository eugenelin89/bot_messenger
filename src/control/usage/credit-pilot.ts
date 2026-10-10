import {readFileSync,realpathSync} from 'node:fs';
import {join,relative,sep} from 'node:path';
import {tmpdir} from 'node:os';
import type {Company} from '../company.js';
import {requireThat} from '../../domain/model.js';
import type {ReplyRequest} from '../../domain/conversations.js';
import type {CreditPilotPolicy} from '../../domain/usage/policy.js';
export interface PilotApproval {pilot_id:string;scope_id:string;model:string;disposable_root:string;reload_confirmed_at:string;approved_at:string;state:'held'|'released'|'running'|'stopped';request_id:string|null;execution_id:string|null;inspected_execution_id:string|null;account_fingerprint:string|null}
export function verifyPilotRoot(root:string,pilotId:string){
 const canonical=realpathSync(root),temp=realpathSync(tmpdir()),r=relative(temp,canonical);
 requireThat(canonical===root&&r!==''&&!r.startsWith('..'+sep)&&r!=='..'&&!r.startsWith(sep),'Pilot requires a canonical disposable temporary directory');
 const marker=JSON.parse(readFileSync(join(root,'private-credit-pilot.json'),'utf8')) as {pilotId?:string;purpose?:string};
 requireThat(marker.pilotId===pilotId&&marker.purpose==='disposable-private-synthetic','Disposable pilot identity mismatch');
}
/** Trusted local supervisor only. No HTTP/worker tool can create or release this approval. */
export class CreditPilot {
 constructor(readonly company:Company){}
 private get db(){return this.company.store;}
 get(){return this.db.get<PilotApproval>('SELECT * FROM investment_credit_pilot WHERE singleton=1');}
 count(){return this.db.get<{n:number}>("SELECT count(*) n FROM investment_activity_invocations WHERE json_extract(policy,'$.mode')='credit_approved_private_pilot'")!.n;}
 approve(scopeId:string,model:string,reloadConfirmedAt:string){this.company.conversations.human();return this.db.transaction(()=>{
 const scope=this.company.investmentTeam.scope(scopeId),e=this.company.investmentTeam.envelope(scope),p=e.executionPolicy;
 requireThat(p?.mode==='credit_approved_private_pilot'&&e.audience==='private_synthetic'&&scope.state==='active','Exact consented private pilot scope required');
 verifyPilotRoot(this.company.dataDir,p.pilotId);
 requireThat(!this.get()&&this.count()===0&&!this.db.get('SELECT 1 FROM executions')&&!this.db.get('SELECT 1 FROM investment_loops')&&!this.db.get('SELECT 1 FROM investment_public_channels'),'Pilot approval requires fresh disposable state');
 requireThat(typeof model==='string'&&model.length>0&&model.length<=100&&Number.isFinite(Date.parse(reloadConfirmedAt))&&Date.parse(reloadConfirmedAt)<=Date.now()&&Date.now()-Date.parse(reloadConfirmedAt)<=86400000,'Recent explicit automatic-reload-disabled confirmation required');
 this.db.run("INSERT INTO investment_credit_pilot VALUES (1,?,?,?,?,?,?,'held',NULL,NULL,NULL,NULL)",p.pilotId,scopeId,model,this.company.dataDir,reloadConfirmedAt,new Date().toISOString());
 return this.get()!;
 });}
 check(policy:CreditPilotPolicy,scopeId:string){const p=this.get();requireThat(p&&p.pilot_id===policy.pilotId&&p.scope_id===scopeId&&p.state!=='stopped','Private pilot approval missing or stopped');verifyPilotRoot(this.company.dataDir,p.pilot_id);requireThat(p.disposable_root===this.company.dataDir&&this.count()<4,'Four-turn private pilot allowance exhausted');return p;}
 held(request:ReplyRequest,policy:CreditPilotPolicy,scopeId:string){try{const p=this.check(policy,scopeId);return p.state!=='released'||p.request_id!==request.request_id;}catch{return true;}}
 /** Inspection is explicit: supply the exact previously completed execution ID, or null for turn one. */
 release(requestId:string,inspectedExecutionId:string|null){this.company.conversations.human();return this.db.transaction(()=>{
 const p=this.get();requireThat(p?.state==='held'&&p.execution_id===inspectedExecutionId,'Inspect the exact previous pilot execution before release');
 const scope=this.company.investmentTeam.scope(p.scope_id),policy=this.company.investmentTeam.envelope(scope).executionPolicy;requireThat(policy?.mode==='credit_approved_private_pilot','Pilot policy changed');this.check(policy,p.scope_id);
 if(p.execution_id){const usage=this.company.aiUsage.records({executionId:p.execution_id})[0],reservation=this.db.get<{state:string}>('SELECT state FROM investment_activity_invocations WHERE execution_id=?',p.execution_id);
 requireThat(usage?.status==='completed'&&usage.settled===1&&usage.tokens&&usage.thread_id&&usage.turn_id&&usage.model===p.model&&usage.provider==='openai'&&!usage.model_changed&&reservation?.state==='settled'&&!usage.reasons.some(x=>/Rejected|omitted usage|no authoritative/.test(x)),'Previous pilot usage/identity/settlement is not safe for continuation');}
 const r=this.company.conversations.request(requestId);requireThat(r.status==='queued'&&this.company.investmentTeam.forConversation(r.conversation_id)?.scope_id===p.scope_id,'Choose one queued request in the approved pilot');
 this.company.investmentTeam.authorize(r);requireThat(!this.company.paused,'Owner paused admission');
 this.db.run("UPDATE investment_credit_pilot SET state='released',request_id=?,inspected_execution_id=? WHERE singleton=1",requestId,inspectedExecutionId);
 this.company.audit('credit_pilot_turn_released','human',{pilot_id:p.pilot_id,request_id:requestId,inspected_execution_id:inspectedExecutionId});this.company.emit('changed');
 });}
 consume(request:ReplyRequest,executionId:string,policy:CreditPilotPolicy,scopeId:string){const p=this.check(policy,scopeId);requireThat(p.state==='released'&&p.request_id===request.request_id,'One inspected pilot request must be released');this.db.run("UPDATE investment_credit_pilot SET state='running',execution_id=? WHERE singleton=1",executionId);}
 admit(executionId:string,policy:CreditPilotPolicy,model:string,accountFingerprint?:string){const p=this.get();requireThat(p?.state==='running'&&p.pilot_id===policy.pilotId&&p.execution_id===executionId&&p.model===model&&this.count()<=4,'Pilot attempt identity or allowance mismatch');verifyPilotRoot(this.company.dataDir,p.pilot_id);requireThat(typeof accountFingerprint==='string'&&/^[a-f0-9]{64}$/.test(accountFingerprint)&&(!p.account_fingerprint||p.account_fingerprint===accountFingerprint),'Pilot authentication identity changed or unavailable');if(!p.account_fingerprint)this.db.run('UPDATE investment_credit_pilot SET account_fingerprint=? WHERE singleton=1',accountFingerprint);}
 finish(executionId:string,status:string,settled:boolean){const p=this.get();if(p?.execution_id!==executionId)return;this.db.run("UPDATE investment_credit_pilot SET state=?,request_id=NULL WHERE singleton=1",p.state!=='stopped'&&status==='completed'&&settled&&this.count()<4?'held':'stopped');}
 recover(){this.db.run("UPDATE investment_credit_pilot SET state=CASE WHEN state='running' THEN 'stopped' ELSE 'held' END,request_id=NULL WHERE state IN ('released','running')");}
 stop(){const p=this.get();if(!p)return;this.db.run("UPDATE investment_credit_pilot SET state='stopped',request_id=NULL WHERE singleton=1");this.company.emit('investment_interrupt',p.scope_id);}
}
