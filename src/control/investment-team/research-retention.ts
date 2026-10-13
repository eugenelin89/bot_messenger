import {purgeResearchRuntime} from '../market/research-host.js';
import type {Company} from '../company.js';

/** Local content lifecycle, distinct from external provider retention and host backups.
 * Keep original hashes, attribution, turn consumption and uncertainty permanently. */
export function expireResearchContent(company:Company,at:string,runtimeJoined=false){
 const db=company.store;if(db.transactionActive)return;
 for(const run of db.all<{run_id:string;group_id:string;conversation_id:string}>(`SELECT r.run_id,s.group_id,g.conversation_id FROM private_research_runs r JOIN investment_team_scopes s USING(run_id) JOIN working_groups g USING(group_id) WHERE r.retain_until<=? AND NOT EXISTS(SELECT 1 FROM private_research_cleanup c WHERE c.run_id=r.run_id)`,at)){
  company.emit('investment_interrupt',company.investmentTeam.forGroup(run.group_id)!.scope_id);
  // A running callback is still capable of retaining data; admission is already expired.
  // Do not claim cleanup complete until its local execution has terminated.
  if(company.discussions.activeExecutions(run.group_id).length)continue;
  db.transaction(()=>db.withResearchRetention(run.group_id,()=>{
   db.run('INSERT INTO private_research_cleanup VALUES(?,?,?)',run.run_id,run.group_id,at);
   const marker='[Expired private research content]',json='{"expiredPrivateResearch":true}';
   db.run("UPDATE investment_team_scopes SET state='revoked' WHERE run_id=?",run.run_id);
   db.run("UPDATE investment_loops SET state=CASE WHEN state='finished' THEN state ELSE 'stopped' END,reason='Private research retention expired' WHERE scope_id IN(SELECT scope_id FROM investment_team_scopes WHERE run_id=?)",run.run_id);
   db.run("UPDATE investment_loop_occurrences SET state='cancelled',reason='Research expired',result=NULL WHERE loop_id IN(SELECT loop_id FROM investment_loops WHERE scope_id IN(SELECT scope_id FROM investment_team_scopes WHERE run_id=?)) AND state IN('pending','running','blocked')",run.run_id);
   db.run("UPDATE working_groups SET state='archived',deadline=NULL,topic=?,desired_output=?,constraints=?,error=NULL WHERE group_id=?",marker,marker,marker,run.group_id);
   db.run("UPDATE conversations SET state='archived',purpose=? WHERE conversation_id=?",marker,run.conversation_id);
   db.run('UPDATE conversation_messages SET body=? WHERE conversation_id=?',marker,run.conversation_id);
   db.run('UPDATE conversation_notes SET quote=? WHERE conversation_id=?',marker,run.conversation_id);
   db.run("UPDATE conversation_requests SET status=CASE WHEN status IN('queued','waiting_peer') THEN 'cancelled' ELSE status END,error=NULL WHERE conversation_id=?",run.conversation_id);
   db.run("UPDATE conversation_sessions SET handoff=?,reason='Research retention expired',state='blocked' WHERE conversation_id=?",json,run.conversation_id);
   db.run('UPDATE discussion_turns SET prompt=?,output=CASE WHEN output IS NULL THEN NULL ELSE ? END WHERE group_id=?',marker,json,run.group_id);
   db.run('UPDATE discussion_questions SET question=? WHERE group_id=?',marker,run.group_id);
   db.run('UPDATE group_evidence SET title=?,content=?,metadata=? WHERE group_id=?',marker,marker,json,run.group_id);
   db.run('UPDATE group_syntheses SET content=? WHERE group_id=?',json,run.group_id);
   db.run('UPDATE discussion_receipts SET result=? WHERE group_id=?',json,run.group_id);
   db.run('UPDATE private_research_evidence SET content=? WHERE run_id=?',json,run.run_id);
   db.run('UPDATE tool_receipts SET result=? WHERE execution_id IN(SELECT e.execution_id FROM investment_team_executions e JOIN investment_team_scopes s USING(scope_id) WHERE s.run_id=?)',json,run.run_id);
   db.run("UPDATE audit_events SET detail=? WHERE json_extract(detail,'$.group_id')=?",json,run.group_id);
   db.run('UPDATE audit_events SET detail=? WHERE execution_id IN(SELECT e.execution_id FROM investment_team_executions e JOIN investment_team_scopes s USING(scope_id) WHERE s.run_id=?)',json,run.run_id);
   db.run('UPDATE executions SET error=NULL,interruption_reason=NULL WHERE execution_id IN(SELECT e.execution_id FROM investment_team_executions e JOIN investment_team_scopes s USING(scope_id) WHERE s.run_id=?)',run.run_id);
  }));
 }
 // Redaction is durable before purging old WAL frames. A busy reader leaves a pending
 // purge, never a false completion receipt. Permanent identities contain no data bodies.
 for(const r of db.all<{run_id:string}>('SELECT run_id FROM private_research_cleanup WHERE run_id NOT IN(SELECT run_id FROM private_research_purges)')){
  const config=company.privateResearch.configuration(r.run_id),requiresRuntimePurge=config.source.policy.mode==='observed'||!!db.get('SELECT 1 FROM private_research_host_claims WHERE run_id=?',r.run_id);
  if(requiresRuntimePurge&&!runtimeJoined)continue;
  if(requiresRuntimePurge)purgeResearchRuntime(config.policy.authorityId);
  const checkpoint=db.get<{busy:number}>('PRAGMA wal_checkpoint(TRUNCATE)');if(checkpoint?.busy!==0)continue;
  db.run('INSERT INTO private_research_purges VALUES(?,?)',r.run_id,at);
 }
}
