import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,lstatSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync} from 'node:fs';
import {join,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {requireThat} from '../../domain/model.js';
import type {GroupEvidence} from '../../domain/discussions.js';
import type {PilotLineage,Successor} from './pilot-lineage.js';

export const bytesHash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export const canonicalTextHash=(value:string)=>bytesHash(JSON.stringify(value));
export interface HistoricalSource {
 kind:'imported_historical_contribution'|'imported_synthetic_packet';
 source_id:string;source_group_id:string;source_worker_id:string|null;
 source_execution_id:string|null;source_timestamp:string;source_model:string|null;
 utf8_sha256:string;byte_length:number;canonical_sha256:string;
 source_evidence_ids:string[];archive_sha256:string;
}
export interface HistoricalText {content:string;provenance:HistoricalSource}
export interface AtlasHistory {
 archive:string;archiveDigest:string;files:Record<string,string>;legacyRow:string;legacyReceipts:string;
 workerId:string;mayaWorkerId:string;executionId:string;packet:HistoricalText;contribution:HistoricalText;
}
export function historyFiles(root:string){
 requireThat(realpathSync(root)===root,'Canonical historical archive required');
 const files:Record<string,string>={};
 const walk=(dir:string)=>{for(const name of readdirSync(dir).sort()){
  const file=join(dir,name),s=lstatSync(file);requireThat(!s.isSymbolicLink(),'Historical archive symlink denied');
  if(s.isDirectory())walk(file);else{requireThat(s.isFile(),'Historical archive entry invalid');files[relative(root,file)]=bytesHash(readFileSync(file));}
 }};walk(root);return {files,digest:bytesHash(JSON.stringify(files))};
}
/** Do not open retained WAL databases, even read-only: inspect a closed snapshot copy. */
export function readHistoricalDatabase<T>(file:string,fn:(db:DatabaseSync)=>T):T {
 requireThat(!existsSync(file+'-wal')||readFileSync(file+'-wal').length===0,'Historical database has uncheckpointed WAL');
 const dir=mkdtempSync(join(tmpdir(),'botsquad-history-read-'));
 try{const copy=join(dir,'snapshot.sqlite');copyFileSync(file,copy);const db=new DatabaseSync(copy,{readOnly:true});try{return fn(db);}finally{db.close();}}
 finally{rmSync(dir,{recursive:true,force:true});}
}
function bounded(content:unknown):asserts content is string {
 requireThat(typeof content==='string'&&content.trim().length>0&&content.length<=6000&&Buffer.byteLength(content)<=24000,'Complete historical text must fit one bounded record');
}
/** The caller chooses the retained archive, but the stopped external authority authenticates its identity. */
export function inspectAtlasHistory(ledger:PilotLineage,archive:string,expectedDigest?:string):AtlasHistory {
 const row=ledger.row(),s=JSON.parse(row.successor??'null') as Successor|null;
 requireThat(row.state==='stopped'&&row.consumed===2&&row.release_count===1&&row.uncertain===0&&s&&row.admitted_at&&row.execution_id&&row.request_id,'Settled stopped Atlas predecessor with two consumed reservations required');
 const inventory=historyFiles(archive);requireThat(!expectedDigest||inventory.digest===expectedDigest,'Atlas archive digest mismatch');
 const report=JSON.parse(readFileSync(join(archive,'authority-execution-evidence.json'),'utf8'));
 const legacyRow=JSON.stringify(row),legacyReceipts=JSON.stringify(ledger.receipts());
 requireThat(JSON.stringify(report.lineage)===legacyRow&&JSON.stringify(report.receipts)===legacyReceipts,'Atlas report does not match retained external lineage');
 requireThat(ledger.receipts().filter(r=>r.kind==='reserved').length===1&&ledger.receipts().filter(r=>r.kind==='admission_consumed').length===1&&ledger.receipts().some(r=>r.kind==='completion'&&JSON.parse(String(r.detail)).executionId===row.execution_id&&JSON.parse(String(r.detail)).settled===true),'Atlas reservation/admission/settlement receipts missing');
 readHistoricalDatabase(join(archive,'authority-lineage.sqlite'),db=>{
  requireThat(JSON.stringify(db.prepare('SELECT * FROM lineage WHERE singleton=1').get())===legacyRow&&JSON.stringify(db.prepare('SELECT * FROM receipts ORDER BY sequence').all())===legacyReceipts,'Archived authority disagrees with original lineage');
 });
 const original=ledger.original(),roster=JSON.parse(readFileSync(join(original.archive,'roster.json'),'utf8'));
 requireThat(bytesHash(JSON.stringify(roster))===original.rosterHash&&roster.length===2&&roster[0].worker_id===s.workerId&&roster[0].display_name==='Atlas'&&roster[1].display_name==='Maya'&&roster[1].worker_id!==s.workerId,'Original Atlas/Maya identities required');
 const result=readHistoricalDatabase(join(archive,'company.sqlite'),db=>{
  const get=(sql:string,...args:string[])=>db.prepare(sql).get(...args) as Record<string,unknown>|undefined;
  const p=get('SELECT * FROM investment_credit_pilot'),scope=get('SELECT * FROM investment_team_scopes WHERE scope_id=?',s.scopeId);
  requireThat(p?.pilot_id===s.pilotId&&p.scope_id===s.scopeId&&p.state==='stopped'&&p.execution_id===row.execution_id&&scope?.state==='revoked','Atlas source must remain stopped and revoked');
  const x=get('SELECT * FROM executions WHERE execution_id=?',row.execution_id!),r=get('SELECT * FROM conversation_requests WHERE request_id=?',row.request_id!);
  const a=get('SELECT * FROM investment_activity_invocations WHERE execution_id=?',row.execution_id!),u=get('SELECT * FROM ai_usage WHERE execution_id=?',row.execution_id!);
  requireThat(x?.worker_id===s.workerId&&x.request_id===row.request_id&&x.status==='completed'&&x.origin==='conversation'&&x.provenance_status==='recorded'&&x.model===s.model&&x.reasoning_effort==='low'&&x.runtime_version==='codex-cli 0.157.0'&&x.runtime_adapter==='codex-app-server','Original genuine Atlas execution provenance missing');
  requireThat(a?.state==='settled'&&a.worker_id===s.workerId&&a.request_id===row.request_id&&a.scope_id===s.scopeId&&a.run_id===s.runId&&a.model===s.model&&a.provider==='openai'&&a.thread_id&&a.turn_id&&u?.settled===1&&u.status==='completed'&&u.worker_id===s.workerId&&u.request_id===row.request_id&&u.thread_id===a.thread_id&&u.turn_id===a.turn_id&&u.model===s.model&&u.provider==='openai'&&u.model_changed===0&&u.tokens,'Atlas settled usage and provider identity required');
  const messages=db.prepare('SELECT m.*,c.kind,c.evidence_ids,c.group_id FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE m.execution_id=?').all(row.execution_id!);
  requireThat(messages.length===1,'Exactly one complete Atlas contribution required');const m=messages[0]!;
  requireThat(m.worker_id===s.workerId&&m.group_id===s.groupId&&m.conversation_id===r?.conversation_id&&r?.target_worker_id===s.workerId&&r.status==='completed'&&r.response_message_id===m.message_id&&m.request_id===row.request_id&&m.response_to===row.request_id&&m.created_at&&Date.parse(String(m.created_at))>=Date.parse(String(x.started_at))&&Date.parse(String(m.created_at))<=Date.parse(String(x.finished_at)),'Atlas contribution source identity mismatch');
  bounded(m.body);
  const retained=report.contributions.filter((c:Record<string,unknown>)=>c.execution_id===row.execution_id);
  requireThat(retained.length===1&&['message_id','worker_id','execution_id','created_at','body','kind'].every(k=>retained[0][k]===m[k]),'Atlas report contribution differs from archived bytes');
  const packets=db.prepare('SELECT * FROM group_evidence WHERE group_id=? ORDER BY revision').all(s.groupId) as unknown as GroupEvidence[];
  requireThat(packets.length===1,'Exact original synthetic packet required');const packet=packets[0]!;bounded(packet.content);
  requireThat(packet.kind==='owner_material'&&packet.sha256===canonicalTextHash(packet.content)&&packet.content.startsWith('SYNTHETIC')&&packet.content.includes('ACME')&&packet.content.includes('BETA'),'Original fictional evidence provenance invalid');
  readHistoricalDatabase(join(original.archive,'company.sqlite'),old=>{
   const prior=old.prepare('SELECT content,sha256 FROM group_evidence').all();
   requireThat(prior.length===1&&prior[0]!.content===packet.content&&prior[0]!.sha256===packet.sha256,'Atlas scenario differs from original synthetic packet');
  });
  const evidenceIds=JSON.parse(String(m.evidence_ids)) as string[];
  requireThat(evidenceIds.includes(packet.evidence_id)&&evidenceIds.every(id=>id===packet.evidence_id),'Atlas must cite its supplied original packet');
  requireThat(db.prepare("SELECT 1 FROM tool_receipts WHERE execution_id=? AND json_extract(result,'$.record_id')=? AND json_extract(result,'$.content')=? AND json_extract(result,'$.next_offset') IS NULL").get(row.execution_id!,packet.evidence_id,packet.content),'Atlas original full evidence delivery missing');
  const text=(content:string,kind:HistoricalSource['kind'],id:string,time:string,worker:string|null,execution:string|null,model:string|null,refs:string[]):HistoricalText=>({content,provenance:{kind,source_id:id,source_group_id:s.groupId,source_worker_id:worker,source_execution_id:execution,source_timestamp:time,source_model:model,utf8_sha256:bytesHash(content),byte_length:Buffer.byteLength(content),canonical_sha256:canonicalTextHash(content),source_evidence_ids:refs,archive_sha256:inventory.digest}});
  return {packet:text(packet.content,'imported_synthetic_packet',packet.evidence_id,packet.created_at,null,null,null,[]),contribution:text(m.body,'imported_historical_contribution',String(m.message_id),String(m.created_at),s.workerId,row.execution_id,s.model,evidenceIds)};
 });
 requireThat(historyFiles(archive).digest===inventory.digest,'Atlas archive changed during inspection');
 return {archive,archiveDigest:inventory.digest,files:inventory.files,legacyRow,legacyReceipts,workerId:s.workerId,mayaWorkerId:roster[1].worker_id,executionId:row.execution_id,...result};
}

export interface MayaImport {evidenceId:string;content:string;metadata:string;sha256:string;revision:number;title:string}
export interface MayaContextBinding {groupId:string;scopeId:string;runId:string;workerId:string;desiredOutput:string;imports:MayaImport[];isolationDigest:string}
// Freeze every content-bearing source reachable by the permitted discussion/paper
// tools. Only start/claim bookkeeping is normalized; no content is normalized.
const staticTables=['principals','workers','working_groups','conversations','conversation_participants','conversation_messages','discussion_contributions','investment_team_scopes','investment_runs','investment_journal','investment_outbox','investment_receipts'];
const emptyTables=['discussion_questions','group_syntheses','discussion_extensions','conversation_notes','investment_team_proposals','investment_team_reviews','investment_team_submissions','investment_loops','research_tool_workers','standing_grants','research_sources','research_operations','research_task_sessions','tasks','messages','artifacts','runtime_bindings','mandates','mandate_task_sessions','computer_contexts','projects'];
function isolationDigest(db:DatabaseSync){
 const omitted:Record<string,string[]>={workers:['status','updated_at'],working_groups:['state','started_at','deadline','updated_at','turns_used']};
 for(const table of emptyTables)requireThat(db.prepare(`SELECT count(*) n FROM ${table}`).get()!.n===0,'Maya context contains unrelated history or authority: '+table);
 const projection=staticTables.map(table=>[table,db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all().map(row=>Object.fromEntries(Object.entries(row).filter(([key])=>!omitted[table]?.includes(key))))]);
 return bytesHash(JSON.stringify(projection));
}
export function captureMayaIsolation(root:string){const db=new DatabaseSync(join(root,'company.sqlite'),{readOnly:true});try{return isolationDigest(db);}finally{db.close();}}
const openingPrompt='Give your own perspective, compare practical alternatives against the charter and supplied evidence. State assumptions, risks and a useful question. No invented disagreement or approval.';
function verifyMayaProgress(db:DatabaseSync,b:MayaContextBinding){
 const g=db.prepare('SELECT * FROM working_groups').get()!;
 requireThat(['draft','active'].includes(String(g.state))&&g.turns_used===(g.state==='draft'?0:2),'Unexpected Maya group progression');
 const turns=db.prepare('SELECT t.*,r.target_worker_id,r.message_id,r.conversation_id,r.requester_principal_id,r.kind request_kind,r.hop,r.parent_request_id,r.return_worker_id,r.response_message_id,r.error,r.status FROM discussion_turns t JOIN conversation_requests r USING(request_id) ORDER BY t.rowid').all();
 requireThat(turns.length===(g.state==='draft'?0:2)&&db.prepare('SELECT count(*) n FROM conversation_requests').get()!.n===turns.length,'Unexpected Maya requests');
 const charter=db.prepare('SELECT message_id FROM conversation_messages').get()!;
 const members=db.prepare('SELECT worker_id FROM conversation_participants WHERE worker_id IS NOT NULL').all().map(r=>r.worker_id);
 requireThat(new Set(turns.map(t=>t.target_worker_id)).size===turns.length&&turns.every(t=>members.includes(t.target_worker_id)&&t.group_id===b.groupId&&t.kind==='opening'&&t.round===1&&t.prompt===openingPrompt&&t.contribution_ids==='[]'&&t.evidence_ids==='[]'&&t.output===null&&t.advanced===0&&t.message_id===charter.message_id&&t.conversation_id===g.conversation_id&&t.requester_principal_id==='human'&&t.request_kind==='reply'&&t.hop===0&&t.parent_request_id===null&&t.return_worker_id===null&&t.response_message_id===null&&t.error===null&&(t.status==='queued'||t.target_worker_id===b.workerId&&t.status==='replying')),'Maya opening request/context changed');
 const sessions=db.prepare('SELECT * FROM conversation_sessions').all(),executions=db.prepare('SELECT * FROM executions').all();
 requireThat(sessions.length<=1&&executions.length===sessions.length&&sessions.every(x=>x.worker_id===b.workerId&&x.conversation_id===g.conversation_id&&x.generation===1&&x.previous_session_id===null&&x.completed_turns===0&&x.reason==='initial_context')&&executions.every(x=>x.worker_id===b.workerId&&x.origin==='conversation'&&x.session_id===sessions[0]!.session_id&&x.status==='running'),'Maya must have only its fresh initial provider context');
}
/** Read actual stored bytes at preflight and both runtime admission checks, never just catalog hashes. */
export function verifyMayaContext(root:string,binding:MayaContextBinding,context?:unknown,executionId?:string){
 const file=join(root,'company.sqlite');requireThat(lstatSync(file).isFile()&&!lstatSync(file).isSymbolicLink()&&realpathSync(file)===file,'Maya database missing or redirected');
 const db=new DatabaseSync(file,{readOnly:true});
 try{
  const rows=db.prepare('SELECT * FROM group_evidence ORDER BY revision').all() as unknown as GroupEvidence[];
  requireThat(rows.length===2&&binding.imports.length===2&&rows.every((r,i)=>{const p=binding.imports[i]!;return r.group_id===binding.groupId&&r.evidence_id===p.evidenceId&&r.content===p.content&&r.metadata===p.metadata&&r.title===p.title&&r.revision===p.revision&&r.sha256===p.sha256&&r.sha256===canonicalTextHash(r.content)&&r.source_id===null&&r.actor==='human'&&r.execution_id===null&&r.kind==='owner_material';}),'Maya imported evidence missing, truncated or tampered');
  requireThat(isolationDigest(db)===binding.isolationDigest,'Maya prepared context content changed');
  verifyMayaProgress(db,binding);
  const group=db.prepare('SELECT * FROM working_groups').all();
  requireThat(group.length===1&&group[0]!.group_id===binding.groupId&&group[0]!.desired_output===binding.desiredOutput,'Maya discussion assignment mismatch');
  if(context!==undefined){
   requireThat(executionId&&db.prepare('SELECT 1 FROM discussion_checkpoints c JOIN discussion_turns t USING(turn_id) JOIN executions x USING(execution_id) WHERE c.execution_id=? AND c.context_hash=? AND t.group_id=? AND x.worker_id=?').get(executionId,bytesHash(JSON.stringify(context)),binding.groupId,binding.workerId),'Maya runtime context differs from the trusted delivered checkpoint');
   const c=context as {mode?:string;group_id?:string;desired_output?:string;shared_evidence?:{evidence_id:string;sha256:string;retained_characters:number;revision:number}[];worker?:{worker_id:string}};
   requireThat(c.mode==='discussion'&&c.group_id===binding.groupId&&c.desired_output===binding.desiredOutput&&c.worker?.worker_id===binding.workerId&&c.shared_evidence?.length===2&&c.shared_evidence.every((v,i)=>{const p=binding.imports[i]!;return v.evidence_id===p.evidenceId&&v.sha256===p.sha256&&v.retained_characters===p.content.length&&v.revision===p.revision;}),'Reviewed Maya context does not expose both complete original records');
  }
 }finally{db.close();}
}
