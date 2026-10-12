/** One final owner-selected Atlas response. No generic successor/reset command. */
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {Company} from '../../src/control/company.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import {requireThat} from '../../src/domain/model.js';
import {inspectOriginal,openFinalAtlasAuthority,issuePermit,type FinalAtlasLineage,type Successor} from '../../src/control/usage/pilot-lineage.js';
import {bytesHash} from '../../src/control/usage/pilot-history.js';
import {inspectMayaHistory} from '../../src/control/usage/pilot-final-history.js';
import {acceptedSource,repoRoot} from './run.js';
import {preparePilot,type PilotWorker} from './setup.js';
import {supervisePilot} from './supervise.js';
import {stopSuccessor} from './continuation.js';

export function prepareFinalAtlas(ledger:FinalAtlasLineage,sha:string,sourceRoot:string=repoRoot){
 const a=ledger.finalAuthorization();requireThat(ledger.finalRow().state==='authorized','Final Atlas preparation already consumed');
 inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
 const history=inspectMayaHistory(ledger,a.history.archive,a.history.archiveDigest);
 const roster=JSON.parse(readFileSync(join(ledger.original().archive,'roster.json'),'utf8')) as PilotWorker[];
 const f=preparePilot(roster,ledger.original().model,sourceRoot,'codex-app-server',undefined,history);let installed=false;
 try{
  f.company.creditPilot.approve(f.manifest.scopeId,f.manifest.model,a.reloadConfirmedAt);
  const s:Successor={pilotId:f.manifest.pilotId,root:f.root,scopeId:f.manifest.scopeId,groupId:f.manifest.groupId,runId:f.manifest.runId,workerId:history.atlas.workerId,model:f.manifest.model,source:sha,expiresAt:f.envelope.expiresAt};
  requireThat(f.contextBinding,'Historical Final Atlas context missing');ledger.prepareFinal(s,f.contextBinding);installed=true;
  f.company.creditPilot.attach(ledger,s);
  writeFileSync(join(f.root,'accepted-source.json'),JSON.stringify({sha,mayaArchiveDigest:history.archiveDigest,originalArchiveDigest:ledger.original().archiveDigest}),{mode:0o600});
  return {...f,s};
 }catch(e){if(installed)ledger.stop('final_atlas_preparation_failed');f.close();throw e;}
}
export function openFinalAtlas(ledger:FinalAtlasLineage,sha:string,sourceRoot:string=repoRoot){
 const s=ledger.successor();requireThat(s.source===sha,'Final Atlas source differs from accepted source');
 requireThat(realpathSync(s.root)===s.root,'Canonical Final Atlas root required');
 const m=JSON.parse(readFileSync(join(s.root,'manifest.json'),'utf8'));
 for(const [key,value] of Object.entries({root:s.root,pilotId:s.pilotId,scopeId:s.scopeId,groupId:s.groupId,runId:s.runId,model:s.model}))requireThat(m[key]===value,'Final Atlas manifest differs from durable authority');
 requireThat(readFileSync(join(s.root,'company.sqlite')).length>0,'Final Atlas database missing');
 const store=new Store(join(s.root,'company.sqlite'));
 try{const company=new Company(store,s.root,sourceRoot);company.creditPilot.attach(ledger,s);return {s,store,company};}catch(e){store.close();throw e;}
}
export function finalAtlasReport(ledger:FinalAtlasLineage,f?:ReturnType<typeof openFinalAtlas>){
 return {summary:ledger.summary(),historicalLineage:ledger.row(),historicalReceipts:ledger.receipts(),historicalMaya:ledger.maya(),historicalMayaReceipts:ledger.mayaReceipts(),finalAtlas:ledger.finalRow(),receipts:ledger.finalReceipts(),...(f?{
  pilot:f.company.creditPilot.get(),scopeState:f.company.investmentTeam.scope(f.s.scopeId).state,
  usage:f.company.aiUsage.report({runId:f.s.runId}),executions:f.store.all('SELECT * FROM executions'),reservations:f.store.all('SELECT * FROM investment_activity_invocations'),
  imports:f.store.all('SELECT * FROM group_evidence WHERE group_id=? ORDER BY revision',f.s.groupId),
  contributions:f.store.all('SELECT m.*,c.kind,c.contribution_ids,c.evidence_ids FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE c.group_id=? ORDER BY c.rowid',f.s.groupId),
  toolReceipts:f.store.all('SELECT * FROM tool_receipts'),events:f.store.all("SELECT type,execution_id,created_at,detail FROM audit_events WHERE type LIKE 'runtime_%' OR type LIKE 'conversation_runtime_%' OR type LIKE 'credit_pilot_%' OR type='tool_rejected' ORDER BY rowid")
 }:{}),limitations:['Historical Atlas and Maya texts are imported evidence, not new speech or synchronous discussion.','API-equivalent estimated USD is not actual credit deduction.','A local deadline cannot guarantee upstream billing cutoff.','The final reservation exhausts the original four-turn allowance; no further invocation.']};
}
export function finalizeFinalAtlas(ledger:FinalAtlasLineage,f:ReturnType<typeof openFinalAtlas>){
 // The successful claim is an in-process latch: consulting a lost authority here must
 // never prevent local stop/revoke. Competing supervisors never receive this latch.
 requireThat(ledger.ownsSupervisionLocally(),'Only the owning Final Atlas supervisor can finalize');
 let authorityFailure:unknown;
 try{ledger.stop('final_atlas_supervisor_finished');}catch(e){authorityFailure=e;}
 stopSuccessor(f);
 const report=authorityFailure?{authorityUnavailable:true,uncertain:true,error:String(authorityFailure),successor:f.s,pilot:f.company.creditPilot.get(),scopeState:f.company.investmentTeam.scope(f.s.scopeId).state,executions:f.store.all('SELECT * FROM executions'),reservations:f.store.all('SELECT * FROM investment_activity_invocations'),usage:f.company.aiUsage.report({runId:f.s.runId}),notice:'External state could not be verified or updated. No authority was recreated and no reservation may be refunded or replayed.'}:finalAtlasReport(ledger,f);
 const body=JSON.stringify(report,null,2);
 // Separate filenames preserve both historical execution reports forever. Do not write
 // into a changed external registry; retain failure evidence in the local sandbox.
 if(!authorityFailure)writeFileSync(join(dirname(ledger.path),'final-atlas-execution-evidence.json'),body,{mode:0o600});
 writeFileSync(join(f.s.root,'final-atlas-evidence.json'),body,{mode:0o600});
 if(authorityFailure)throw authorityFailure;
 return report;
}
export async function runFinalAtlas(ledger:FinalAtlasLineage,f:ReturnType<typeof openFinalAtlas>,runtime:Parameters<typeof supervisePilot>[1]){
 // Claim before constructing/starting a dispatcher. A concurrent loser cannot recover or stop the winner.
 ledger.claimSupervision(f.s);
 try{
  const g=f.company.discussions.group(f.s.groupId);
  if(g.state==='draft')f.company.discussions.control({group_id:g.group_id,action:'start',receipt_key:'final_atlas_historical_review_start'});
  const requests=f.store.all<{request_id:string;target_worker_id:string}>("SELECT r.request_id,r.target_worker_id FROM conversation_requests r JOIN discussion_turns t USING(request_id) WHERE t.group_id=? AND r.status='queued' AND t.kind='opening'",f.s.groupId);
  const atlas=requests.filter(r=>r.target_worker_id===f.s.workerId);requireThat(atlas.length===1,'Exactly one queued Final Atlas assignment required');
  await supervisePilot(f.company,runtime,f.s.groupId,atlas[0]!.request_id,null);
 }finally{finalizeFinalAtlas(ledger,f);}
}
export function stopFinalAtlasPreflight(ledger:FinalAtlasLineage,f:ReturnType<typeof openFinalAtlas>){
 if(ledger.stopFailedPreflight())stopSuccessor(f);
}
async function main(){
 const [action,sha,...args]=process.argv.slice(2);requireThat(action,'Final Atlas action required');
 if(!['stop','stop-lineage'].includes(action)){requireThat(sha,'Accepted main SHA required');acceptedSource(sha);}
 const ledger=openFinalAtlasAuthority();
 if(!['stop','stop-lineage'].includes(action))requireThat(ledger.original().model==='gpt-6-luna','Exact owner-approved gpt-6-luna required; no fallback');
 try{
  if(action==='authorize'){
   const [archive,expectedDigest,ownerRequestFile,reloadConfirmationFile]=args;
   requireThat(archive&&expectedDigest&&/^[a-f0-9]{64}$/.test(expectedDigest)&&ownerRequestFile&&reloadConfirmationFile,'authorize requires verified Maya archive/digest, retained owner request file and retained applicable reload-OFF confirmation JSON');
   inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
   const history=inspectMayaHistory(ledger,realpathSync(archive),expectedDigest);
   const reloadBytes=readFileSync(reloadConfirmationFile),reload=JSON.parse(reloadBytes.toString('utf8'));
   requireThat(typeof reload.receivedAt==='string'&&typeof reload.source==='string'&&reload.source.includes('automatic reload is still OFF')&&reload.existingCreditsApproved===true&&reload.providerManagedRetriesWithinTurnApproved===true,'Explicit retained owner reload-OFF evidence required');
   ledger.authorizeFinal(history,bytesHash(readFileSync(ownerRequestFile)),reload.receivedAt,bytesHash(reloadBytes));console.log(JSON.stringify(ledger.summary()));return;
  }
  if(action==='inspect-lineage'){console.log(JSON.stringify(finalAtlasReport(ledger),null,2));return;}
  if(action==='stop-lineage'){ledger.stop();console.log(JSON.stringify(ledger.summary()));return;}
  if(action==='prepare'){const f=prepareFinalAtlas(ledger,sha!);try{console.log(JSON.stringify({successor:f.s,...ledger.summary()}));}finally{f.close();}return;}
  const f=openFinalAtlas(ledger,action==='stop'?ledger.successor().source:sha!);
  try{
   if(action==='inspect'){console.log(JSON.stringify(finalAtlasReport(ledger,f),null,2));return;}
   if(action==='stop'){stopSuccessor(f);console.log(JSON.stringify(ledger.summary()));return;}
   const runtime=new CodexRuntime({command:join(repoRoot,'node_modules/.bin/codex'),creditPilot:{pilotId:f.s.pilotId,disposableRoot:f.s.root,model:f.s.model,permit:issuePermit(ledger,f.s)}});
   if(action==='preflight'){
    try{
     ledger.verifyContext(f.s);
     const v=await runtime.creditPreflight(join(f.s.root,'workspaces',f.s.workerId));
     requireThat(v.catalog.models.some(m=>m.model===f.s.model&&m.supportedReasoningEfforts.some(e=>e.reasoningEffort==='low')),'Exact previously approved model/low reasoning absent; no fallback');
     ledger.bindAccount(f.s,v);writeFileSync(join(f.s.root,'final-atlas-preflight.json'),JSON.stringify({...v,modelTurns:0,source:sha,observedAt:new Date().toISOString()},null,2),{mode:0o600});
     console.log(JSON.stringify({verified:true,model:f.s.model,modelTurns:0}));return;
    }catch(e){stopFinalAtlasPreflight(ledger,f);throw e;}
   }
   requireThat(action==='turn','Choose authorize, prepare, preflight, inspect, inspect-lineage, turn, stop or stop-lineage');
   inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
   inspectMayaHistory(ledger,ledger.finalAuthorization().history.archive,ledger.finalAuthorization().history.archiveDigest);
   await runFinalAtlas(ledger,f,runtime);console.log(JSON.stringify(finalAtlasReport(ledger,f),null,2));
  }finally{f.store.close();}
 }finally{ledger.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:'Final Atlas continuation stopped');process.exitCode=1;});
