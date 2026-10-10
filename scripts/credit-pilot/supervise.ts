import {Dispatcher} from '../../src/control/dispatcher.js';
import type {Company} from '../../src/control/company.js';
import type {RuntimeAdapter} from '../../src/runtime/adapter.js';
import {requireThat} from '../../src/domain/model.js';
/** One explicit release per call. Durable polling also observes controls from another process. */
export async function supervisePilot(company:Company,runtime:RuntimeAdapter,groupId:string,request:string,inspected:string|null){
 const dispatcher=new Dispatcher(company,runtime);dispatcher.start();
 try{
 const group=company.discussions.group(groupId);if(group.state==='draft')company.discussions.control({group_id:groupId,action:'start',receipt_key:'private-pilot-start'});
 company.discussions.progress();const requestId=request==='first'?company.store.get<{request_id:string}>("SELECT r.request_id FROM conversation_requests r JOIN discussion_turns t USING(request_id) WHERE t.group_id=? AND r.status='queued' ORDER BY r.rowid LIMIT 1",groupId)?.request_id:request;
 requireThat(requestId,'No queued turn remains');company.creditPilot.release(requestId,inspected);dispatcher.kick();
 const deadline=Date.now()+315000;
 while(Date.now()<deadline){
  const p=company.creditPilot.get()!;if(p.execution_id&&p.state!=='running'&&p.state!=='released')break;
  try{requireThat(!company.paused,'Owner paused');company.investmentTeam.authorize(company.conversations.request(requestId));}catch{company.creditPilot.stop();break;}
  await new Promise(r=>setTimeout(r,50));
 }
 if(['running','released'].includes(company.creditPilot.get()!.state))company.creditPilot.stop();
 }finally{await dispatcher.stop();}
}
