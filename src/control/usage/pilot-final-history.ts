import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {requireThat} from '../../domain/model.js';
import type {GroupEvidence} from '../../domain/discussions.js';
import {inspectOriginal,type MayaLineage,type Successor} from './pilot-lineage.js';
import {bytesHash,canonicalTextHash,historyFiles,inspectAtlasHistory,readHistoricalDatabase,type AtlasHistory,type HistoricalText} from './pilot-history.js';

export interface FinalAtlasHistory {
 atlas:AtlasHistory;archive:string;archiveDigest:string;files:Record<string,string>;
 mayaRow:string;mayaReceipts:string;mayaExecutionId:string;
 packet:HistoricalText;opening:HistoricalText;review:HistoricalText;
 mayaReadReceipts:string;mayaUsage:string;atlasUsage:string;
}
function complete(content:unknown):asserts content is string {
 requireThat(typeof content==='string'&&content.trim().length>0&&content.length<=6000&&Buffer.byteLength(content)<=24000,'Complete final historical source must fit one bounded record');
}
/** Read immutable predecessor snapshots only through disposable read-only copies. */
export function inspectMayaHistory(ledger:MayaLineage,archive:string,expectedDigest?:string):FinalAtlasHistory {
 inspectOriginal(ledger.original().archive,ledger.original().archiveDigest);
 const m=ledger.maya(),a=ledger.authorization(),s=JSON.parse(m.successor??'null') as Successor|null;
 requireThat(m.state==='stopped'&&m.reserved===1&&m.release_count===1&&m.uncertain===0&&m.admitted_at&&m.execution_id&&m.request_id&&s,'Settled stopped Maya predecessor with third reservation required');
 requireThat(ledger.row().consumed===2&&ledger.row().state==='stopped','Original two consumed reservations must remain stopped');
 const atlas=inspectAtlasHistory(ledger,a.history.archive,a.history.archiveDigest);
 requireThat(JSON.stringify(atlas)===JSON.stringify(a.history)&&s.workerId===atlas.mayaWorkerId&&s.model===ledger.original().model,'Authenticated Atlas history and original Maya identity required');
 const inventory=historyFiles(archive);requireThat(!expectedDigest||inventory.digest===expectedDigest,'Maya archive digest mismatch');
 const mayaRow=JSON.stringify(m),mayaReceipts=JSON.stringify(ledger.mayaReceipts());
 const report=JSON.parse(readFileSync(join(archive,'authority-maya-execution-evidence.json'),'utf8'));
 requireThat(JSON.stringify(report.historicalLineage)===atlas.legacyRow&&JSON.stringify(report.historicalReceipts)===atlas.legacyReceipts&&JSON.stringify(report.maya)===mayaRow&&JSON.stringify(report.receipts)===mayaReceipts,'Maya report disagrees with retained immutable authority');
 requireThat(report.summary.cumulativeConsumed===3&&report.summary.state==='stopped'&&report.scopeState==='revoked','Maya final stopped report required');
 const receipts=ledger.mayaReceipts();
 for(const kind of ['reserved','admission_consumed'])requireThat(receipts.filter(r=>r.kind===kind).length===1&&JSON.parse(String(receipts.find(r=>r.kind===kind)!.detail)).executionId===m.execution_id,'Maya one-use reservation/admission identity missing');
 requireThat(receipts.some(r=>r.kind==='completion'&&JSON.parse(String(r.detail)).executionId===m.execution_id&&JSON.parse(String(r.detail)).status==='completed'&&JSON.parse(String(r.detail)).settled===true),'Maya settled completion receipt required');
 readHistoricalDatabase(join(archive,'authority-lineage.sqlite'),db=>{
  for(const [table,expected] of [['lineage',atlas.legacyRow],['maya_continuation',mayaRow]] as const)requireThat(JSON.stringify(db.prepare(`SELECT * FROM ${table} WHERE singleton=1`).get())===expected,'Maya archived authority identity mismatch');
  for(const [table,expected] of [['receipts',atlas.legacyReceipts],['maya_receipts',mayaReceipts]] as const)requireThat(JSON.stringify(db.prepare(`SELECT * FROM ${table} ORDER BY sequence`).all())===expected,'Maya archived authorization receipts mismatch');
 });
 const original=ledger.original();
 const packet=readHistoricalDatabase(join(original.archive,'company.sqlite'),db=>{
  const rows=db.prepare('SELECT * FROM group_evidence').all() as unknown as GroupEvidence[];
  requireThat(rows.length===1,'One original fictional packet required');const p=rows[0]!;complete(p.content);
  requireThat(p.content===atlas.packet.content&&p.sha256===canonicalTextHash(p.content),'Original packet bytes differ from authenticated Atlas input');
  return {content:p.content,provenance:{...atlas.packet.provenance,source_id:p.evidence_id,source_group_id:p.group_id,source_timestamp:p.created_at,archive_sha256:original.archiveDigest}};
 });
 const opening:HistoricalText={content:atlas.contribution.content,provenance:{...atlas.contribution.provenance,source_request_id:ledger.row().request_id}};
 const result=readHistoricalDatabase(join(archive,'company.sqlite'),db=>{
  const get=(sql:string,...args:string[])=>db.prepare(sql).get(...args);
  const pilot=get('SELECT * FROM investment_credit_pilot'),scope=get('SELECT * FROM investment_team_scopes WHERE scope_id=?',s.scopeId);
  requireThat(pilot?.pilot_id===s.pilotId&&pilot.scope_id===s.scopeId&&pilot.state==='stopped'&&pilot.execution_id===m.execution_id&&scope?.state==='revoked','Maya original scope must stay stopped and revoked');
  const x=get('SELECT * FROM executions WHERE execution_id=?',m.execution_id!),r=get('SELECT * FROM conversation_requests WHERE request_id=?',m.request_id!);
  const v=get('SELECT * FROM investment_activity_invocations WHERE execution_id=?',m.execution_id!),u=get('SELECT * FROM ai_usage WHERE execution_id=?',m.execution_id!);
  requireThat(x?.worker_id===s.workerId&&x.request_id===m.request_id&&x.status==='completed'&&x.origin==='conversation'&&x.provenance_status==='recorded'&&x.model===s.model&&x.reasoning_effort==='low'&&x.runtime_version==='codex-cli 0.157.0'&&x.runtime_adapter==='codex-app-server','Genuine Maya execution provenance missing');
  requireThat(v?.state==='settled'&&v.worker_id===s.workerId&&v.request_id===m.request_id&&v.scope_id===s.scopeId&&v.run_id===s.runId&&v.model===s.model&&v.provider==='openai'&&v.thread_id&&v.turn_id&&u?.settled===1&&u.status==='completed'&&u.worker_id===s.workerId&&u.request_id===m.request_id&&u.thread_id===v.thread_id&&u.turn_id===v.turn_id&&u.model===s.model&&u.provider==='openai'&&u.model_changed===0&&u.tokens,'Settled Maya usage and provider identity required');
  const session=get('SELECT * FROM conversation_sessions WHERE session_id=?',String(x.session_id));
  requireThat(session?.worker_id===s.workerId&&session.conversation_id===r?.conversation_id&&session.generation===1&&session.previous_session_id===null&&session.runtime_reference===v.thread_id&&x.generation===1,'Original fresh Maya provider generation required');
  requireThat(report.executions.length===1&&JSON.stringify(report.executions[0])===JSON.stringify(x)&&report.reservations.length===1&&JSON.stringify(report.reservations[0])===JSON.stringify(v),'Maya report execution or reservation changed');
  const reportedUsage=report.usage.executions.filter((q:Record<string,unknown>)=>q.execution_id===m.execution_id);
  requireThat(reportedUsage.length===1&&Object.entries(u).every(([k,value])=>JSON.stringify(reportedUsage[0][k])===JSON.stringify(['tokens','price','estimate','reasons'].includes(k)&&typeof value==='string'?JSON.parse(value):value)),'Maya original usage or pricing record changed');
  requireThat(db.prepare('SELECT count(*) n FROM executions').get()!.n===1&&db.prepare('SELECT count(*) n FROM investment_activity_invocations').get()!.n===1,'Maya archive contains unexpected execution');
  const messages=db.prepare('SELECT m.*,c.kind,c.evidence_ids,c.contribution_ids,c.group_id FROM conversation_messages m JOIN discussion_contributions c USING(message_id) WHERE m.execution_id=?').all(m.execution_id!);
  requireThat(messages.length===1,'One authentic complete Maya contribution required');const msg=messages[0]!;complete(msg.body);
  requireThat(msg.worker_id===s.workerId&&msg.group_id===s.groupId&&msg.request_id===m.request_id&&msg.response_to===m.request_id&&msg.conversation_id===r?.conversation_id&&r?.target_worker_id===s.workerId&&r?.status==='completed'&&r?.response_message_id===msg.message_id&&Number.isFinite(Date.parse(String(msg.created_at)))&&Date.parse(String(msg.created_at))>=Date.parse(String(x.started_at))&&Date.parse(String(msg.created_at))<=Date.parse(String(x.finished_at)),'Maya source identity or timestamp mismatch');
  const retained=report.contributions.filter((c:Record<string,unknown>)=>c.execution_id===m.execution_id);
  requireThat(retained.length===1&&['message_id','worker_id','request_id','execution_id','created_at','body','kind','contribution_ids','evidence_ids'].every(k=>retained[0][k]===msg[k]),'Maya contribution report differs from original bytes');
  const imports=db.prepare('SELECT * FROM group_evidence ORDER BY revision').all() as unknown as GroupEvidence[];
  const binding=JSON.parse(m.context_binding!);requireThat(imports.length===2&&binding.imports.length===2,'Maya authenticated two-source import required');
  const fullReads=[];
  for(const [i,source] of [atlas.packet,atlas.contribution].entries()){
   const e=imports[i]!,b=binding.imports[i]!,metadata=JSON.parse(e.metadata);
   requireThat(e.group_id===s.groupId&&e.kind==='owner_material'&&e.actor==='human'&&e.execution_id===null&&e.source_id===null&&e.content===source.content&&e.sha256===canonicalTextHash(source.content)&&Object.entries(source.provenance).every(([k,value])=>JSON.stringify(metadata[k])===JSON.stringify(value))&&e.evidence_id===b.evidenceId&&e.evidence_id!==source.provenance.source_id&&e.content===b.content&&e.metadata===b.metadata&&e.sha256===b.sha256,'Maya imported original source substituted');
   const reads=db.prepare("SELECT * FROM tool_receipts WHERE execution_id=? AND json_extract(result,'$.record_id')=? AND json_extract(result,'$.content')=? AND json_extract(result,'$.next_offset') IS NULL").all(m.execution_id!,e.evidence_id,e.content);
   requireThat(reads.length>0&&reads.every(q=>{const result=JSON.parse(String(q.result));return JSON.stringify(result.metadata)===e.metadata&&typeof q.call_id==='string'&&q.call_id.length>0&&q.request_hash===bytesHash(JSON.stringify(['read_group_record',{record_id:e.evidence_id,offset:0}]));}),'Maya complete authenticated source delivery receipt missing');
   fullReads.push(...reads);
  }
  const cited=JSON.parse(String(msg.evidence_ids)) as string[];
  requireThat(cited.length===2&&imports.every(e=>cited.includes(e.evidence_id)),'Maya must cite both fully delivered sources');
  const review:HistoricalText={content:msg.body,provenance:{kind:'imported_historical_contribution',source_id:String(msg.message_id),source_group_id:s.groupId,source_worker_id:s.workerId,source_execution_id:m.execution_id,source_request_id:m.request_id,source_timestamp:String(msg.created_at),source_model:s.model,utf8_sha256:bytesHash(msg.body),byte_length:Buffer.byteLength(msg.body),canonical_sha256:canonicalTextHash(msg.body),source_evidence_ids:cited,archive_sha256:inventory.digest}};
  return {review,mayaReadReceipts:JSON.stringify(fullReads),mayaUsage:JSON.stringify(u)};
 });
 const atlasUsage=readHistoricalDatabase(join(atlas.archive,'company.sqlite'),db=>JSON.stringify(db.prepare('SELECT * FROM ai_usage WHERE execution_id=?').get(atlas.executionId)));
 requireThat(historyFiles(archive).digest===inventory.digest,'Maya archive changed during inspection');
 return {atlas,archive,archiveDigest:inventory.digest,files:inventory.files,mayaRow,mayaReceipts,mayaExecutionId:m.execution_id,packet,opening,...result,atlasUsage};
}
