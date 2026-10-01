// Operator-only isolated validation entrypoint. Never enabled by normal HTTP or src/main.
// Trusted roster and optional source-outage fixtures are not model-produced evidence.
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {acquireDataLock} from '../../src/persistence/lock.js';
import {Company} from '../../src/control/company.js';
import {Dispatcher} from '../../src/control/dispatcher.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import {PROFILES,requireThat,type Worker} from '../../src/domain/model.js';
import {ResearchFailure} from '../../src/domain/research.js';
import {createHttpServer} from '../../src/http/server.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=resolve(process.env.BOT_DATA_DIR??'');const port=Number(process.env.PORT);
requireThat(process.env.BOT_VALIDATION_RESEARCH==='1'&&data==='/var/lib/botsquad/validation/research-20261001-we01'&&port===4311,'Explicit fresh Ubuntu research validation configuration required');
requireThat(existsSync(join(data,'validation-manifest.json')),'Missing operator validation manifest');
const unlock=acquireDataLock(data);const store=new Store(join(data,'company.sqlite'));const company=new Company(store,data,root);
const inputs=join(data,'runtime-inputs');mkdirSync(inputs,{recursive:true,mode:0o700});
class RecordingRuntime extends CodexRuntime {
  override async run(input:RuntimeInput,signal:AbortSignal){
    writeFileSync(join(inputs,`${input.execution.execution_id}.json`),JSON.stringify({mode:input.mode,execution:input.execution,context:input.context,binding:input.binding??null,tools:input.tools.map(t=>t.name)},null,2),{mode:0o600,flag:'wx'});
    return super.run(input,signal);
  }
}
const runtime=new RecordingRuntime();const catalog=await runtime.catalog(data);const fixturePath=join(data,'fixture.json');
if(!existsSync(fixturePath)){
  requireThat(company.workers().length===0,'Validation roster requires fresh data');
  const atlas=company.initializeCEO();const task=company.createTask('human',atlas,{objective:'Validation-only roster setup',acceptance_criteria:'Persistent Atlas and Scout identities',constraints:'Trusted fixture; no model invocation or scripted research.'},null,'research');
  const claim=company.claimNext()!;
  const scout=company.callTool(claim.context,'fixture-hire-scout','hire_worker',{profile:'researcher',display_name:'Scout',title:'Public Researcher',mission:'Investigate useful public information and produce clear sourced reports within standing authority.',capabilities:[...PROFILES.researcher],lifecycle:'persistent',justification:'Explicit isolated WE-01 validation roster'}) as Worker;
  company.finish(claim.execution.execution_id,{status:'interrupted',settled:true,error:'Trusted fixture roster setup; no provider invoked'});company.cancel(task.task_id);
  const model=catalog.models.find(m=>m.model==='gpt-6-sol');requireThat(model,'Configured validation model must be advertised');
  for(const w of company.workers())company.updateWorkerAIProfile(w.worker_id,{ai_model:model.model,reasoning_effort:'low',execution_priority:'normal',ai_profile_locked:true},catalog);
  company.pause(true);
  writeFileSync(fixturePath,JSON.stringify({roster_fixture:true,setup_task_ids:[task.task_id],atlas:atlas.worker_id,scout:scout.worker_id,data_root:data,revision:process.env.BOT_DEPLOYED_SHA},null,2),{mode:0o600,flag:'wx'});
}
// Only an explicit operator-created file in this isolated data root enables faults.
// Real parent workers still run normally; fault output is labelled and never public acceptance.
const provider=runtime.researchProvider(data);const fetcher=company.research.fetcher;
company.research.provider={name:provider.name,async search(query,signal,hooks){
  if(existsSync(join(data,'source-outage-fixture.json')))throw new ResearchFailure('source_unavailable','ISOLATED VALIDATION FIXTURE: public provider unavailable; no lookup was transmitted.');
  return provider.search(query,signal,hooks);
}};
company.research.fetcher=async(url,signal)=>{
  if(existsSync(join(data,'source-outage-fixture.json')))throw new ResearchFailure('source_unavailable','ISOLATED VALIDATION FIXTURE: public source unavailable; no request was transmitted.');
  return fetcher(url,signal);
};
const dispatcher=new Dispatcher(company,runtime);const http=createHttpServer(company,dispatcher,join(root,'public'));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await dispatcher.stop();await http.close();store.close();unlock();}
http.server.listen(port,'127.0.0.1',()=>{dispatcher.runtimeState='ready';dispatcher.start();console.log('Isolated WE-01 validation ready');});
process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
// Read just the validation fixture to fail visibly if an operator points at wrong setup.
requireThat(JSON.parse(readFileSync(fixturePath,'utf8')).data_root===data,'Validation manifest identity mismatch');
