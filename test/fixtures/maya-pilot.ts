import {randomUUID} from 'node:crypto';
import {copyFileSync,mkdirSync,mkdtempSync,realpathSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pilotFixture} from './credit-pilot.js';
import {PilotLineage,MayaLineage,inspectOriginal,type Successor} from '../../src/control/usage/pilot-lineage.js';
import {bytesHash,inspectAtlasHistory} from '../../src/control/usage/pilot-history.js';
import {finalizeContinuation} from '../../scripts/credit-pilot/continuation.js';
import {prepareMaya} from '../../scripts/credit-pilot/maya-review.js';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import type {Company} from '../../src/control/company.js';

export const sourceSha='1'.repeat(40),verifiedAccount={fingerprint:'a'.repeat(64),routingFingerprint:'b'.repeat(64)};
export function completeFixture(input:RuntimeInput,body='Deterministic historical fixture — never genuine employee speech.',evidenceIds:string[]=[]){
 const threadId='fixture-'+input.execution.execution_id,turnId=randomUUID();
 input.bind({worker_id:input.worker.worker_id,runtime_type:'codex-app-server',runtime_reference:threadId,workspace_path:input.worker.workspace_path,created_at:new Date().toISOString()});
 input.configured({model:'test-model',reasoning_effort:'low',runtime_version:'codex-cli 0.157.0',runtime_adapter:'codex-app-server',execution_priority:'normal'});
 input.usage!({kind:'start',identity:{threadId,model:'test-model',provider:'openai',serviceTier:'standard',freshThread:true}});
 input.admitSubscription!({threadId,model:'test-model',accountFingerprint:verifiedAccount.fingerprint,eligibility:{authMode:'chatgpt',planType:'pro',paidCredits:'existing_approved',ordinaryUsageAllowed:true,creditUsageAllowed:true,provider:'openai'}});
 input.usage!({kind:'turn',threadId,turnId});input.usage!({kind:'response',threadId,turnId,responseId:randomUUID(),usage:{inputTokens:100,cachedInputTokens:10,cacheWriteInputTokens:0,outputTokens:20,reasoningOutputTokens:5,totalTokens:120}});
 for(const id of evidenceIds)input.callTool(randomUUID(),'read_group_record',{record_id:id,offset:0});
 input.callTool(randomUUID(),'submit_contribution',{body,contribution_ids:[],evidence_ids:evidenceIds,questions:[],answers:[]});
}
export function historyFixture(){
 const original=pilotFixture(),atlas=pilotFixture(),dir=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-maya-test-'))),file=join(dir,'lineage.sqlite');
 const roster=original.roster.map((w,i)=>({...w,display_name:i===0?'Atlas':'Maya'}));
 const first=original.claim();original.company.finish(first.execution.execution_id,{status:'awaiting_approval',settled:false,error:'Labelled original fixture setup failure'});
 original.company.creditPilot.stop();original.company.investmentTeam.control({scopeId:original.manifest.scopeId,action:'revoke'});
 writeFileSync(join(original.root,'roster.json'),JSON.stringify(roster));
 writeFileSync(join(original.root,'manifest.json'),JSON.stringify({...original.manifest,rosterHash:bytesHash(JSON.stringify(roster))}));
 writeFileSync(join(original.root,'accepted-source.json'),JSON.stringify({sha:sourceSha}));
 writeFileSync(join(original.root,'final-inspection.json'),JSON.stringify({pilot:original.company.creditPilot.get(),reserved:1}));
 original.close();writeFileSync(join(original.root,'company.sqlite-wal'),'');
 const old=PilotLineage.create(file,inspectOriginal(original.root),new Date().toISOString());
 const s:Successor={pilotId:atlas.manifest.pilotId,root:atlas.root,scopeId:atlas.manifest.scopeId,groupId:atlas.manifest.groupId,runId:atlas.manifest.runId,workerId:roster[0]!.worker_id,model:'test-model',source:sourceSha,expiresAt:atlas.envelope.expiresAt};
 old.prepare(s);old.bindAccount(s,verifiedAccount);atlas.company.creditPilot.attach(old,s);
 const c=atlas.claim(),input=atlas.input(c);old.admit(s,input,verifiedAccount);completeFixture(input,undefined,[atlas.manifest.evidenceId]);atlas.company.finish(c.execution.execution_id,{status:'completed',settled:true});
 const report=finalizeContinuation(old,{s,store:atlas.store,company:atlas.company});old.close();atlas.close();
 const archive=join(dir,'atlas-archive');mkdirSync(archive,{mode:0o700});
 copyFileSync(join(atlas.root,'company.sqlite'),join(archive,'company.sqlite'));copyFileSync(file,join(archive,'authority-lineage.sqlite'));
 writeFileSync(join(archive,'authority-execution-evidence.json'),JSON.stringify(report),{mode:0o600});
 const ledger=new MayaLineage(file),history=inspectAtlasHistory(ledger,archive);
 return {dir,file,archive,ledger,history,original,atlas,cleanup(){ledger.close();if(original.store.db.isOpen)original.close();if(atlas.store.db.isOpen)atlas.close();for(const p of [dir,original.root,atlas.root])rmSync(p,{recursive:true,force:true});}};
}
export function mayaFixture(prepared=true,bindAccount=true){
 const h=historyFixture();h.ledger.authorizeMaya(h.history,'c'.repeat(64),new Date().toISOString());
 const f=prepared?prepareMaya(h.ledger,sourceSha,process.cwd()):undefined;
 if(f){f.company.investmentTeam.runtime=h.atlas.adapter;if(bindAccount)h.ledger.bindAccount(f.s,verifiedAccount);}
 return {...h,f,cleanup(){if(f){if(f.store.db.isOpen)f.close();rmSync(f.root,{recursive:true,force:true});}h.cleanup();}};
}
export function beginMaya(f:NonNullable<ReturnType<typeof mayaFixture>['f']>,ledger:MayaLineage){
 ledger.claimSupervision(f.s);f.company.discussions.control({group_id:f.s.groupId,action:'start',receipt_key:randomUUID()});
 return f.store.get<{request_id:string}>("SELECT request_id FROM conversation_requests WHERE target_worker_id=? AND status='queued'",f.s.workerId)!.request_id;
}
export function claimedInput(company:Company,c:ReturnType<Company['claimWorkNext']>):Extract<RuntimeInput,{mode:'conversation'}> {
 if(!c||c.origin!=='conversation')throw Error('Expected conversation claim');
 return {mode:'conversation',worker:c.worker,request:c.request,execution:c.execution,context:company.conversations.context(c.context),tools:company.conversations.tools(c.context),binding:company.conversations.binding(c.context),localDeadline:company.investmentActivity.deadline(c.execution.execution_id)!,
  prepareBinding:b=>company.conversations.prepareBinding(c.context,b),bind:b=>{company.conversations.prepareBinding(c.context,b);company.conversations.activateBinding(c.context);},configured:cfg=>company.recordRuntimeConfig(c.context,cfg),callTool:(id,name,args,signal)=>company.conversations.callTool(c.context,id,name,args,signal),event:(type,detail)=>company.conversations.event(c.context,type,detail),usage:o=>{company.aiUsage.observe(c.execution.execution_id,o);if(o.kind==='turn')company.investmentActivity.turn(c.execution.execution_id,o.turnId);},admitSubscription:i=>company.investmentActivity.admit(c.context,i)};
}
