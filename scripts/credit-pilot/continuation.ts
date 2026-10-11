/** Trusted local owner supervisor. No worker or HTTP entry point. */
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {Company} from '../../src/control/company.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import {requireThat} from '../../src/domain/model.js';
import {inspectOriginal,registerAuthority,openAuthority,issuePermit,type PilotLineage} from '../../src/control/usage/pilot-lineage.js';
import {acceptedSource,repoRoot} from './run.js';
import {preparePilot,bindPreparedSuccessor,type PilotWorker} from './setup.js';
import {supervisePilot} from './supervise.js';

function open(ledger:PilotLineage,sha:string){
 const s=ledger.successor();requireThat(s.source===sha,'Successor source differs from accepted source');
 const root=realpathSync(s.root),m=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
 for(const [key,value] of Object.entries({root:s.root,pilotId:s.pilotId,scopeId:s.scopeId,groupId:s.groupId,runId:s.runId,model:s.model}))requireThat(m[key]===value,'Disposable manifest differs from durable authority');
 // A missing company DB must never be silently initialized by Store.
 requireThat(readFileSync(join(root,'company.sqlite')).length>0,'Successor database missing');
 const store=new Store(join(root,'company.sqlite')),company=new Company(store,root,repoRoot);
 company.creditPilot.attach(ledger,s);
 const runtime=new CodexRuntime({command:join(repoRoot,'node_modules/.bin/codex'),creditPilot:{pilotId:s.pilotId,disposableRoot:s.root,model:s.model,permit:issuePermit(ledger,s)}});
 return {s,store,company,runtime};
}
type SuccessorContext=Pick<ReturnType<typeof open>,'s'|'store'|'company'>;
function report(ledger:PilotLineage,f?:SuccessorContext){
 const row=ledger.row();return {lineage:row,receipts:ledger.receipts(),cumulativeReserved:row.consumed,originalReserved:1,remainingReservations:4-row.consumed,authorizedUnreleased:row.state==='prepared'?1:0,
 ...(f?{pilot:f.company.creditPilot.get(),localReservations:f.company.creditPilot.localCount(),usage:f.company.aiUsage.report({runId:f.s.runId}),executions:f.store.all('SELECT * FROM executions'),reservations:f.store.all('SELECT * FROM investment_activity_invocations'),contributions:f.store.all('SELECT m.message_id,m.worker_id,m.execution_id,m.created_at,m.body,c.kind FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE c.group_id=? ORDER BY c.rowid',f.s.groupId),events:f.store.all("SELECT type,execution_id,created_at,detail FROM audit_events WHERE type LIKE 'runtime_%' OR type LIKE 'credit_pilot_%' OR type='tool_rejected' ORDER BY rowid")}:{}),limitations:['Owner-confirmed reload OFF; not a queried billing setting.','API-equivalent reference cost is not actual purchased-credit consumption.','Original historical account fingerprint was unavailable; successor preflight pins current account and routing.','Exactly one additional Atlas attempt; unused reservations are not released.']};
}
export function stopSuccessor(f:SuccessorContext){
 f.company.creditPilot.stop();
 // Serialize the check with revocation so simultaneous owner stop/finalization is idempotent.
 f.store.transaction(()=>{if(f.company.investmentTeam.scope(f.s.scopeId).state!=='revoked')f.company.investmentTeam.control({scopeId:f.s.scopeId,action:'revoke'});});
}
export function finalizeContinuation(ledger:PilotLineage,f:SuccessorContext){
 ledger.stop('supervisor_finished');stopSuccessor(f);
 const evidence=report(ledger,f);
 // Retain externally before attempting the replaceable temporary copy.
 writeFileSync(join(resolve(ledger.path,'..'),'execution-evidence.json'),JSON.stringify(evidence,null,2),{mode:0o600});
 writeFileSync(join(f.s.root,'continuation-evidence.json'),JSON.stringify(evidence,null,2),{mode:0o600});
 return evidence;
}
async function main(){
 const [action,sha,...args]=process.argv.slice(2);requireThat(action,'Action required');if(!['stop','stop-lineage'].includes(action)){requireThat(sha,'Accepted main SHA required');acceptedSource(sha);}
 if(action==='register'){
  const [archive,archiveDigest,confirmation]=args;requireThat(archive&&archiveDigest&&confirmation,'register requires retained archive, independently verified digest and actual owner reload-OFF confirmation timestamp');
  requireThat(/^[a-f0-9]{64}$/.test(archiveDigest),'Exact independent archive digest required');
  registerAuthority(inspectOriginal(realpathSync(archive),archiveDigest),confirmation);console.log(JSON.stringify({registered:true,originalConsumed:1,remaining:3,authorizedNewReservations:1}));return;
 }
 const ledger=openAuthority();
 try {
  if(action==='inspect-lineage'){console.log(JSON.stringify(report(ledger),null,2));return;}
  if(action==='stop-lineage'){ledger.stop();console.log(JSON.stringify(report(ledger),null,2));return;}
  if(action==='prepare'){
   const original=ledger.original();inspectOriginal(original.archive,original.archiveDigest);
   const roster=JSON.parse(readFileSync(join(original.archive,'roster.json'),'utf8')) as PilotWorker[];
   // Prepare creates inert local state; only the durable compare-and-swap confers successor authority.
   requireThat(ledger.row().state==='registered','A successor already exists or lineage is stopped');
   const f=preparePilot(roster,original.model,repoRoot);
   try {f.company.creditPilot.approve(f.manifest.scopeId,original.model,ledger.row().reload_confirmed_at);
    const s=bindPreparedSuccessor(ledger,f,sha!);
    console.log(JSON.stringify({successor:s,cumulativeConsumed:1,remaining:3,authorizedNewReservations:1}));
   }finally{f.close();}return;
  }
  const f=open(ledger,action==='stop'?ledger.successor().source:sha!);
  try {
   if(action==='preflight'){
    const verified=await f.runtime.creditPreflight(join(f.s.root,'workspaces',f.s.workerId));
    requireThat(verified.catalog.models.some(m=>m.model===f.s.model&&m.supportedReasoningEfforts.some(e=>e.reasoningEffort==='low')),'Approved exact model/reasoning absent from current catalog');
    ledger.bindAccount(f.s,verified);writeFileSync(join(f.s.root,'continuation-preflight.json'),JSON.stringify({...verified,modelTurns:0,source:sha,observedAt:new Date().toISOString()},null,2),{mode:0o600});
    console.log(JSON.stringify({verified:true,model:f.s.model,modelTurns:0}));return;
   }
   if(action==='inspect'){console.log(JSON.stringify(report(ledger,f),null,2));return;}
   if(action==='stop'){stopSuccessor(f);console.log(JSON.stringify(report(ledger,f),null,2));return;}
   requireThat(action==='turn','Choose register, prepare, preflight, inspect, inspect-lineage, turn, stop or stop-lineage');
   inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
   requireThat(ledger.row().state==='prepared'&&ledger.row().release_count===0,'This request permits only one release, never replay');
   try {await supervisePilot(f.company,f.runtime,f.s.groupId,'first',null);}
   finally {
    // Completion is a terminal single-release result, including setup exceptions.
    const evidence=finalizeContinuation(ledger,f);
    console.log(JSON.stringify(evidence,null,2));
   }
  }catch(e){if(action==='preflight')ledger.stop('preflight_failed');throw e;}finally{f.store.close();}
 }finally{ledger.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:'Continuation stopped');process.exitCode=1;});
