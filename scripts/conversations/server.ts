// Explicit validation entrypoint only. Never imported by src/main or enabled via HTTP.
// Roster setup and fault injection are labelled fixtures; conversation turns use real Codex.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../../src/persistence/store.js';
import { acquireDataLock } from '../../src/persistence/lock.js';
import { Company } from '../../src/control/company.js';
import { Dispatcher } from '../../src/control/dispatcher.js';
import { CodexRuntime } from '../../src/runtime/codex.js';
import type { RuntimeInput } from '../../src/runtime/adapter.js';
import { PROFILES, requireThat, type Profile, type Worker } from '../../src/domain/model.js';
import { createHttpServer } from '../../src/http/server.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=resolve(process.env.BOT_DATA_DIR??''); const port=Number(process.env.PORT);
requireThat(process.env.BOT_VALIDATION_CONVERSATIONS==='1'&&data.startsWith('/var/lib/botsquad/validation/conversations-')&&port===4311,'Explicit isolated Ubuntu conversation validation configuration required');
requireThat(existsSync(join(data,'validation-manifest.json')),'Missing operator validation manifest');
const unlock=acquireDataLock(data);const store=new Store(join(data,'company.sqlite'));const company=new Company(store,data,root);
const evidenceDir=join(data,'runtime-inputs');mkdirSync(evidenceDir,{recursive:true,mode:0o700});
class RecordingRuntime extends CodexRuntime {
  override async run(input:RuntimeInput,signal:AbortSignal) {
    writeFileSync(join(evidenceDir,`${input.execution.execution_id}.json`),JSON.stringify({mode:input.mode,execution:input.execution,context:input.context,binding:input.binding??null,tools:input.tools.map(t=>t.name)},null,2),{mode:0o600,flag:'wx'});
    if(input.mode==='conversation') {
      const original=input.prepareBinding;
      input={...input,prepareBinding:binding=>{
        original(binding);
        const arm=join(data,'arm-prepared-crash.json');
        if(existsSync(arm)) {
          const gate=JSON.parse(readFileSync(arm,'utf8')) as {conversation_id:string};
          if(input.mode==='conversation'&&gate.conversation_id===input.request.conversation_id) {
            writeFileSync(join(data,'prepared-crash-evidence.json'),JSON.stringify({boundary:'real provider created; before activation and turn invocation',execution:input.execution,binding,at:new Date().toISOString()},null,2),{mode:0o600,flag:'wx'});
            renameSync(arm,join(data,'consumed-prepared-crash.json'));process.exit(75);
          }
        }
      }};
    }
    return super.run(input,signal);
  }
}
const runtime=new RecordingRuntime();const catalog=await runtime.catalog(data);
const fixturePath=join(data,'fixture.json');
if(!existsSync(fixturePath)) {
  requireThat(company.workers().length===0,'Validation roster requires fresh data');
  const atlas=company.initializeCEO();const objective={objective:'Validation-only roster setup',acceptance_criteria:'Create bounded role identities through normal trusted hiring policy',constraints:'No provider run; fixture setup is not model evidence.'};
  const task=company.createTask('human',atlas,objective,null,'product');const atlasClaim=company.claimNext()!;
  const hire=(claim:NonNullable<ReturnType<Company['claimNext']>>,name:string,profile:Profile)=>company.callTool(claim.context,`fixture-hire-${name}`,'hire_worker',{display_name:name,title:profile,profile,mission:`Persistent ${profile}; reason carefully about reliable software and human-visible behavior.`,capabilities:[...PROFILES[profile]],lifecycle:'persistent',justification:'Explicit trusted Prompt 07 validation roster'}) as Worker;
  const maya=hire(atlasClaim,'Maya','product_manager');const turing=hire(atlasClaim,'Turing','cto');
  company.finish(atlasClaim.execution.execution_id,{status:'interrupted',error:'Fixture roster setup; no provider invoked'});company.cancel(task.task_id);
  const ctoTask=company.createTask('human',turing,objective,null,'delivery');const ctoClaim=company.claimNext()!;
  const linus=hire(ctoClaim,'Linus','engineer');const ada=hire(ctoClaim,'Ada','engineer');
  company.finish(ctoClaim.execution.execution_id,{status:'interrupted',error:'Fixture roster setup; no provider invoked'});company.cancel(ctoTask.task_id);
  for(const w of company.workers()) {
    const model=catalog.models.find(m=>m.model==='gpt-6-sol');requireThat(model,'Configured validation model must be advertised');
    company.updateWorkerAIProfile(w.worker_id,{ai_model:model.model,reasoning_effort:'low',execution_priority:'normal',ai_profile_locked:true},catalog);
  }
  const initial=company.createTask('human',linus,{objective:'Read the approved System Architecture document and analyze how atomic claims and durable receipts prevent duplicate work. Save a concise report with submit_artifact, then summarize the tradeoffs. Private task-only test marker: TASK_SCOPE_SENTINEL_P07. Do not repeat that marker in unrelated conversations.',acceptance_criteria:'Actual bounded evidence from the approved document, a saved report and clear uncertainty.',constraints:'No hiring, assignments, peer messages, source writes, tests or external actions.'},null,'research');
  company.pause(true);
  writeFileSync(fixturePath,JSON.stringify({roster_fixture:true,setup_task_ids:[task.task_id,ctoTask.task_id],atlas:atlas.worker_id,maya:maya.worker_id,turing:turing.worker_id,linus:linus.worker_id,ada:ada.worker_id,initial_task_id:initial.task_id},null,2),{mode:0o600,flag:'wx'});
}
const fixture=JSON.parse(readFileSync(fixturePath,'utf8')) as {linus:string;initial_task_id:string};
let checking=false;
company.on('changed',()=>{
  if(checking)return;checking=true;
  try {
    const finished=company.task(fixture.initial_task_id).status==='completed';
    const archived=store.get("SELECT 1 FROM conversations c JOIN conversation_participants p USING(conversation_id) WHERE c.state='archived' AND p.worker_id=? AND EXISTS(SELECT 1 FROM conversation_requests r WHERE r.conversation_id=c.conversation_id AND r.status='completed')",fixture.linus);
    const marker=join(data,'return-task.json');
    if(finished&&archived&&!existsSync(marker)) {
      const task=company.createTask('human',company.worker(fixture.linus),{objective:'Return to the legitimate document-analysis assignment. Using your earlier task report, explain one concrete reconciliation rule in at most 150 words. Do not use conversation-only context or tools. Do not hire or assign anyone.',acceptance_criteria:'Real task continuation in the original compatible task binding.',constraints:'Existing task tools only; no external actions.'},null,'research');
      writeFileSync(marker,JSON.stringify({task_id:task.task_id,fixture_trigger:'Archive a completed Linus conversation to request validation of return to task mode.'}),{mode:0o600,flag:'wx'});
    }
  }finally{checking=false;}
});
const dispatcher=new Dispatcher(company,runtime);const http=createHttpServer(company,dispatcher,join(root,'public'));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await dispatcher.stop();await http.close();store.close();unlock();}
http.server.listen(port,'127.0.0.1',()=>{dispatcher.runtimeState='ready';dispatcher.start();console.log('Isolated Prompt 07 validation ready');});
process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
