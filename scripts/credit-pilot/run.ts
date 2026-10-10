/** Explicit local supervisor CLI. Never starts more than one turn per invocation. */
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {Company} from '../../src/control/company.js';
import {supervisePilot} from './supervise.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import {verifyPilotRoot} from '../../src/control/usage/credit-pilot.js';
import {requireThat} from '../../src/domain/model.js';
import {preparePilot,type PilotWorker} from './setup.js';
export const repoRoot=resolve(fileURLToPath(new URL('../../..',import.meta.url)));
function acceptedSource(sha:string){requireThat(/^[0-9a-f]{40}$/.test(sha),'Exact accepted main SHA required');const git=(...args:string[])=>execFileSync('git',args,{cwd:repoRoot,encoding:'utf8',timeout:10000}).trim();requireThat(git('rev-parse','HEAD')===sha&&git('rev-parse','origin/main')===sha&&git('status','--porcelain')==='','Use the clean synchronized accepted main checkout and rebuild before the pilot');}
function open(root:string){root=realpathSync(root);const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8')) as {pilotId:string;root:string;model:string;scopeId:string;groupId:string;runId:string};verifyPilotRoot(root,manifest.pilotId);requireThat(manifest.root===root,'Pilot directory identity mismatch');const store=new Store(join(root,'company.sqlite')),company=new Company(store,root,repoRoot);const runtime=new CodexRuntime({command:join(repoRoot,'node_modules/.bin/codex'),creditPilot:{pilotId:manifest.pilotId,disposableRoot:root,model:manifest.model}});return {root,manifest,store,company,runtime};}
function report(f:ReturnType<typeof open>){return {pilot:f.company.creditPilot.get(),reserved:f.company.creditPilot.count(),usage:f.company.aiUsage.report({runId:f.manifest.runId}),queued:f.store.all("SELECT r.request_id,r.target_worker_id,t.kind FROM conversation_requests r JOIN discussion_turns t USING(request_id) WHERE t.group_id=? AND r.status='queued' ORDER BY r.rowid",f.manifest.groupId),contributions:f.store.all('SELECT m.message_id,m.worker_id,m.execution_id,m.created_at,m.body,c.kind,c.contribution_ids,c.evidence_ids FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE c.group_id=? ORDER BY c.rowid',f.manifest.groupId),runtimeEvents:f.store.all("SELECT type,execution_id,created_at,detail FROM audit_events WHERE type LIKE 'runtime_%' OR type LIKE 'credit_pilot_%' OR type='tool_rejected' ORDER BY rowid"),limitations:['Synthetic market evidence only; no completed investment cycle is implied.','API-equivalent estimates are not actual purchased-credit charges.','Internal provider retries may consume more credits; local stop cannot guarantee upstream billing cutoff.']};}
async function main(){const [action,...args]=process.argv.slice(2);
 if(action==='prepare'){const [rosterPath,model,confirmation,sha]=args;requireThat(rosterPath&&model&&confirmation&&sha,'prepare requires roster JSON, exact model, reload-disabled confirmation timestamp and accepted main SHA');acceptedSource(sha);const roster=JSON.parse(readFileSync(rosterPath,'utf8')) as PilotWorker[];const f=preparePilot(roster,model,repoRoot);try{f.company.creditPilot.approve(f.manifest.scopeId,model,confirmation);writeFileSync(join(f.root,'accepted-source.json'),JSON.stringify({sha,rosterSource:resolve(rosterPath),rosterHash:f.manifest.rosterHash}),{mode:0o600});console.log(JSON.stringify(f.manifest));}finally{f.close();}return;}
 const root=args[0];requireThat(root,'Explicit disposable pilot directory required');const f=open(root);
 try{
 if(action==='preflight'){console.log(JSON.stringify({catalog:await f.runtime.catalog(f.root),modelTurns:0}));return;}
 if(action==='inspect'){console.log(JSON.stringify(report(f),null,2));return;}
 if(action==='stop'){f.company.creditPilot.stop();f.company.investmentTeam.control({scopeId:f.manifest.scopeId,action:'revoke'});console.log(JSON.stringify({stopped:true,reserved:f.company.creditPilot.count()}));return;}
 requireThat(action==='turn','Choose prepare, preflight, inspect, turn or stop');const [,,inspected,sha]=args;const request=args[1];requireThat(request&&inspected&&sha,'turn requires root, request ID (or first), inspected previous execution ID (or none), accepted main SHA');acceptedSource(sha);requireThat(JSON.parse(readFileSync(join(f.root,'accepted-source.json'),'utf8')).sha===sha,'Pilot source approval changed');
 await supervisePilot(f.company,f.runtime,f.manifest.groupId,request,inspected==='none'?null:inspected);
 const evidence=report(f);writeFileSync(join(f.root,`evidence-${f.company.creditPilot.count()}.json`),JSON.stringify(evidence,null,2),{mode:0o600});console.log(JSON.stringify(evidence,null,2));
 }finally{f.store.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e instanceof Error?e.message:'Private pilot stopped');process.exitCode=1;});
