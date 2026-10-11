/** One explicitly owner-selected Maya review. No generic successor/reset command. */
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {Company} from '../../src/control/company.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import {requireThat} from '../../src/domain/model.js';
import {inspectOriginal,openMayaAuthority,issuePermit,type MayaLineage,type Successor} from '../../src/control/usage/pilot-lineage.js';
import {bytesHash,inspectAtlasHistory} from '../../src/control/usage/pilot-history.js';
import {acceptedSource,repoRoot} from './run.js';
import {preparePilot,type PilotWorker} from './setup.js';
import {supervisePilot} from './supervise.js';
import {stopSuccessor} from './continuation.js';

export function prepareMaya(ledger:MayaLineage,sha:string,sourceRoot:string=repoRoot){
 const a=ledger.authorization();requireThat(ledger.maya().state==='authorized','Maya preparation already consumed');
 inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
 const history=inspectAtlasHistory(ledger,a.history.archive,a.history.archiveDigest);
 const roster=JSON.parse(readFileSync(join(ledger.original().archive,'roster.json'),'utf8')) as PilotWorker[];
 const f=preparePilot(roster,ledger.original().model,sourceRoot,'codex-app-server',history);let installed=false;
 try{
  f.company.creditPilot.approve(f.manifest.scopeId,f.manifest.model,a.reloadConfirmedAt);
  const s:Successor={pilotId:f.manifest.pilotId,root:f.root,scopeId:f.manifest.scopeId,groupId:f.manifest.groupId,runId:f.manifest.runId,workerId:history.mayaWorkerId,model:f.manifest.model,source:sha,expiresAt:f.envelope.expiresAt};
  requireThat(f.contextBinding,'Historical Maya context missing');ledger.prepareMaya(s,f.contextBinding);installed=true;
  f.company.creditPilot.attach(ledger,s);
  writeFileSync(join(f.root,'accepted-source.json'),JSON.stringify({sha,atlasArchiveDigest:history.archiveDigest,originalArchiveDigest:ledger.original().archiveDigest}),{mode:0o600});
  return {...f,s};
 }catch(e){if(installed)ledger.stop('maya_preparation_failed');f.close();throw e;}
}
export function openMaya(ledger:MayaLineage,sha:string,sourceRoot:string=repoRoot){
 const s=ledger.successor();requireThat(s.source===sha,'Maya source differs from accepted source');
 requireThat(realpathSync(s.root)===s.root,'Canonical Maya root required');
 const m=JSON.parse(readFileSync(join(s.root,'manifest.json'),'utf8'));
 for(const [key,value] of Object.entries({root:s.root,pilotId:s.pilotId,scopeId:s.scopeId,groupId:s.groupId,runId:s.runId,model:s.model}))requireThat(m[key]===value,'Maya manifest differs from durable authority');
 requireThat(readFileSync(join(s.root,'company.sqlite')).length>0,'Maya database missing');
 const store=new Store(join(s.root,'company.sqlite'));
 try{const company=new Company(store,s.root,sourceRoot);company.creditPilot.attach(ledger,s);return {s,store,company};}catch(e){store.close();throw e;}
}
export function mayaReport(ledger:MayaLineage,f?:ReturnType<typeof openMaya>){
 return {summary:ledger.summary(),historicalLineage:ledger.row(),historicalReceipts:ledger.receipts(),maya:ledger.maya(),receipts:ledger.mayaReceipts(),...(f?{
  pilot:f.company.creditPilot.get(),scopeState:f.company.investmentTeam.scope(f.s.scopeId).state,
  usage:f.company.aiUsage.report({runId:f.s.runId}),executions:f.store.all('SELECT * FROM executions'),reservations:f.store.all('SELECT * FROM investment_activity_invocations'),
  imports:f.store.all('SELECT * FROM group_evidence WHERE group_id=? ORDER BY revision',f.s.groupId),
  contributions:f.store.all('SELECT m.*,c.kind,c.contribution_ids,c.evidence_ids FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE c.group_id=? ORDER BY c.rowid',f.s.groupId),
  toolReceipts:f.store.all('SELECT * FROM tool_receipts'),events:f.store.all("SELECT type,execution_id,created_at,detail FROM audit_events WHERE type LIKE 'runtime_%' OR type LIKE 'credit_pilot_%' OR type='tool_rejected' ORDER BY rowid")
 }:{}),limitations:['Historical Atlas text is imported evidence, not new speech or two-way discussion.','API-equivalent estimated USD is not actual credit deduction.','A local deadline cannot guarantee upstream billing cutoff.','One Maya turn only; remaining unused reservation is unauthorized.']};
}
export function finalizeMaya(ledger:MayaLineage,f:ReturnType<typeof openMaya>){
 // The successful claim is an in-process latch: consulting a lost authority here must
 // never prevent local stop/revoke. Competing supervisors never receive this latch.
 requireThat(ledger.ownsSupervisionLocally(),'Only the owning Maya supervisor can finalize');
 let authorityFailure:unknown;
 try{ledger.stop('maya_supervisor_finished');}catch(e){authorityFailure=e;}
 stopSuccessor(f);
 const report=authorityFailure?{authorityUnavailable:true,uncertain:true,error:String(authorityFailure),successor:f.s,pilot:f.company.creditPilot.get(),scopeState:f.company.investmentTeam.scope(f.s.scopeId).state,executions:f.store.all('SELECT * FROM executions'),reservations:f.store.all('SELECT * FROM investment_activity_invocations'),usage:f.company.aiUsage.report({runId:f.s.runId}),notice:'External state could not be verified or updated. No authority was recreated and no reservation may be refunded or replayed.'}:mayaReport(ledger,f);
 const body=JSON.stringify(report,null,2);
 // Separate filenames preserve Atlas execution-evidence.json forever. Do not write
 // into a changed external registry; retain failure evidence in the local sandbox.
 if(!authorityFailure)writeFileSync(join(dirname(ledger.path),'maya-execution-evidence.json'),body,{mode:0o600});
 writeFileSync(join(f.s.root,'maya-evidence.json'),body,{mode:0o600});
 if(authorityFailure)throw authorityFailure;
 return report;
}
export async function runMaya(ledger:MayaLineage,f:ReturnType<typeof openMaya>,runtime:Parameters<typeof supervisePilot>[1]){
 // Claim before constructing/starting a dispatcher. A concurrent loser cannot recover or stop the winner.
 ledger.claimSupervision(f.s);
 try{
  const g=f.company.discussions.group(f.s.groupId);
  if(g.state==='draft')f.company.discussions.control({group_id:g.group_id,action:'start',receipt_key:'maya_historical_review_start'});
  const requests=f.store.all<{request_id:string;target_worker_id:string}>("SELECT r.request_id,r.target_worker_id FROM conversation_requests r JOIN discussion_turns t USING(request_id) WHERE t.group_id=? AND r.status='queued' AND t.kind='opening'",f.s.groupId);
  const maya=requests.filter(r=>r.target_worker_id===f.s.workerId);requireThat(maya.length===1,'Exactly one queued Maya assignment required');
  await supervisePilot(f.company,runtime,f.s.groupId,maya[0]!.request_id,null);
 }finally{finalizeMaya(ledger,f);}
}
export function stopMayaPreflight(ledger:MayaLineage,f:ReturnType<typeof openMaya>){
 if(ledger.stopFailedPreflight())stopSuccessor(f);
}
async function main(){
 const [action,sha,...args]=process.argv.slice(2);requireThat(action,'Maya action required');
 if(!['stop','stop-lineage'].includes(action)){requireThat(sha,'Accepted main SHA required');acceptedSource(sha);}
 const ledger=openMayaAuthority();
 try{
  if(action==='authorize'){
   const [archive,expectedDigest,ownerRequestFile,reloadConfirmedAt]=args;
   requireThat(archive&&expectedDigest&&/^[a-f0-9]{64}$/.test(expectedDigest)&&ownerRequestFile&&reloadConfirmedAt,'authorize requires verified Atlas archive/digest, retained owner request file and actual applicable reload-OFF confirmation time');
   inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
   const history=inspectAtlasHistory(ledger,realpathSync(archive),expectedDigest);
   ledger.authorizeMaya(history,bytesHash(readFileSync(ownerRequestFile)),reloadConfirmedAt);console.log(JSON.stringify(ledger.summary()));return;
  }
  if(action==='inspect-lineage'){console.log(JSON.stringify(mayaReport(ledger),null,2));return;}
  if(action==='stop-lineage'){ledger.stop();console.log(JSON.stringify(ledger.summary()));return;}
  if(action==='prepare'){const f=prepareMaya(ledger,sha!);try{console.log(JSON.stringify({successor:f.s,...ledger.summary()}));}finally{f.close();}return;}
  const f=openMaya(ledger,action==='stop'?ledger.successor().source:sha!);
  try{
   if(action==='inspect'){console.log(JSON.stringify(mayaReport(ledger,f),null,2));return;}
   if(action==='stop'){stopSuccessor(f);console.log(JSON.stringify(ledger.summary()));return;}
   const runtime=new CodexRuntime({command:join(repoRoot,'node_modules/.bin/codex'),creditPilot:{pilotId:f.s.pilotId,disposableRoot:f.s.root,model:f.s.model,permit:issuePermit(ledger,f.s)}});
   if(action==='preflight'){
    try{
     ledger.verifyContext(f.s);
     const v=await runtime.creditPreflight(join(f.s.root,'workspaces',f.s.workerId));
     requireThat(v.catalog.models.some(m=>m.model===f.s.model&&m.supportedReasoningEfforts.some(e=>e.reasoningEffort==='low')),'Exact previously approved model/low reasoning absent; no fallback');
     ledger.bindAccount(f.s,v);writeFileSync(join(f.s.root,'maya-preflight.json'),JSON.stringify({...v,modelTurns:0,source:sha,observedAt:new Date().toISOString()},null,2),{mode:0o600});
     console.log(JSON.stringify({verified:true,model:f.s.model,modelTurns:0}));return;
    }catch(e){stopMayaPreflight(ledger,f);throw e;}
   }
   requireThat(action==='turn','Choose authorize, prepare, preflight, inspect, inspect-lineage, turn, stop or stop-lineage');
   inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
   inspectAtlasHistory(ledger,ledger.authorization().history.archive,ledger.authorization().history.archiveDigest);
   await runMaya(ledger,f,runtime);console.log(JSON.stringify(mayaReport(ledger,f),null,2));
  }finally{f.store.close();}
 }finally{ledger.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:'Maya continuation stopped');process.exitCode=1;});
