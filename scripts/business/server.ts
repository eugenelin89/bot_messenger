// Explicit isolated real-model acceptance; no real business provider or credential.
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {acquireDataLock} from '../../src/persistence/lock.js';
import {Company} from '../../src/control/company.js';
import {Dispatcher} from '../../src/control/dispatcher.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import {PROFILES,requireThat,type Worker} from '../../src/domain/model.js';
import {createHttpServer} from '../../src/http/server.js';
import {FixtureBusinessProvider,fixtureTarget} from './fixture-provider.js';
const root=fileURLToPath(new URL('../../../',import.meta.url)),data=resolve(process.env.BOT_DATA_DIR??''),port=Number(process.env.PORT);
requireThat(process.env.BOT_VALIDATION_BUSINESS==='1'&&/^\/var\/lib\/botsquad\/validation\/business-p11-[a-zA-Z0-9-]+$/.test(data)&&port>=4314&&port<=4319,'Explicit isolated Prompt 11 configuration required');
const manifest=JSON.parse(readFileSync(join(data,'validation-manifest.json'),'utf8'));requireThat(manifest.purpose==='Prompt 11 real workers with SIMULATED provider','Wrong validation manifest');
const unlock=acquireDataLock(data),store=new Store(join(data,'company.sqlite')),company=new Company(store,data,root);company.business.adapter=new FixtureBusinessProvider(data);
const inputs=join(data,'runtime-inputs');mkdirSync(inputs,{recursive:true,mode:0o700});
class RecordingRuntime extends CodexRuntime {
  override async run(input:RuntimeInput,signal:AbortSignal){
    writeFileSync(join(inputs,`${input.execution.execution_id}.json`),JSON.stringify({mode:input.mode,execution:input.execution,context:input.context,binding:input.binding??null,tools:input.tools.map(t=>t.name)},null,2),{mode:0o600,flag:'wx'});
    const call=input.callTool;input={...input,callTool:async(callId,name,args,signal)=>{try{const result=await call(callId,name,args,signal);appendFileSync(join(inputs,`${input.execution.execution_id}.tools.jsonl`),JSON.stringify({callId,name,args,result})+'\n',{mode:0o600});return result;}catch(error){appendFileSync(join(inputs,`${input.execution.execution_id}.tools.jsonl`),JSON.stringify({callId,name,args,error:String(error)})+'\n',{mode:0o600});throw error;}}};
    const result=await super.run(input,signal);writeFileSync(join(inputs,`${input.execution.execution_id}.result.json`),JSON.stringify(result,null,2),{mode:0o600,flag:'wx'});return result;
  }
}
const runtime=new RecordingRuntime(),catalog=await runtime.catalog(data),fixturePath=join(data,'fixture.json');
if(!existsSync(fixturePath)){
  requireThat(company.workers().length===0,'Fresh isolated roster required');const atlas=company.initializeCEO();
  const setupTasks:string[]=[];
  const hired=(['product_manager','researcher'] as const).map((profile,i)=>{
    const task=company.createTask('human',atlas,{objective:'Isolated Prompt 11 roster setup',acceptance_criteria:'Persistent specialists through normal hierarchy',constraints:'Trusted setup only; no provider invocation or scripted employee answer'},null,i?'research':'product'),claim=company.claimNext()!;
    const worker=company.callTool(claim.context,`setup-${profile}`,'hire_worker',{display_name:i?'Scout':'Maya',title:profile,profile,mission:'Assess evidence and alternative improvements within current bounded authority.',capabilities:[...PROFILES[profile]],lifecycle:'persistent',justification:'Explicit isolated business acceptance roster'}) as Worker;
    company.finish(claim.execution.execution_id,{status:'interrupted',settled:true,error:'Trusted roster setup; no model invoked'});company.cancel(task.task_id);setupTasks.push(task.task_id);return worker;
  });
  const model=catalog.models.find(m=>m.model===catalog.defaultModel)??catalog.models.find(m=>m.isDefault);requireThat(model,'Advertised default runtime model required');
  for(const worker of company.workers())company.updateWorkerAIProfile(worker.worker_id,{ai_model:model.model,reasoning_effort:model.defaultReasoningEffort,execution_priority:'normal',ai_profile_locked:true},catalog);
  company.pause(true);writeFileSync(fixturePath,JSON.stringify({mode:'simulated_fixture',real_runtime:true,data_root:data,revision:process.env.BOT_DEPLOYED_SHA,atlas:atlas.worker_id,maya:hired[0]!.worker_id,scout:hired[1]!.worker_id,setup_task_ids:setupTasks,target:fixtureTarget},null,2),{mode:0o600,flag:'wx'});
}
const dispatcher=new Dispatcher(company,runtime),http=createHttpServer(company,dispatcher,join(root,'public'));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await dispatcher.stop();await http.close();store.close();unlock();}
http.server.listen(port,'127.0.0.1',()=>{dispatcher.runtimeState='ready';dispatcher.start();console.log('Isolated Prompt 11 ready: real workers; SIMULATED provider only');});
process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
