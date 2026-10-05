// Isolated operator validation only. Not imported by production or exposed through HTTP.
import {existsSync,mkdirSync,readFileSync,writeFileSync,renameSync,appendFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {acquireDataLock} from '../../src/persistence/lock.js';
import {Company} from '../../src/control/company.js';
import {Dispatcher} from '../../src/control/dispatcher.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import {PROFILES,requireThat,type Profile,type Worker} from '../../src/domain/model.js';
import {createHttpServer} from '../../src/http/server.js';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=resolve(process.env.BOT_DATA_DIR??''),port=Number(process.env.PORT);
requireThat(process.env.BOT_VALIDATION_MANDATES==='1'&&data.startsWith('/var/lib/botsquad/validation/mandates-p09-')&&/^\/var\/lib\/botsquad\/validation\/mandates-p09-[a-zA-Z0-9-]+$/.test(data)&&port>=4314&&port<=4319,'Explicit isolated Prompt 09 configuration required');
const manifest=JSON.parse(readFileSync(join(data,'validation-manifest.json'),'utf8')) as {purpose:string};requireThat(manifest.purpose==='Prompt 09 isolated real company operating loop','Wrong fixture manifest');
const unlock=acquireDataLock(data),store=new Store(join(data,'company.sqlite')),company=new Company(store,data,root);
const inputs=join(data,'runtime-inputs');mkdirSync(inputs,{recursive:true,mode:0o700});
class RecordingRuntime extends CodexRuntime {
  override async run(input:RuntimeInput,signal:AbortSignal){
    writeFileSync(join(inputs,`${input.execution.execution_id}.json`),JSON.stringify({mode:input.mode,execution:input.execution,context:input.context,binding:input.binding??null,tools:input.tools.map(t=>t.name)},null,2),{mode:0o600,flag:'wx'});
    const event=input.event,callTool=input.callTool;
    input={...input,callTool:async(callId,name,args,signal)=>{
      const path=join(inputs,`${input.execution.execution_id}.tools.jsonl`);
      try{const result=await callTool(callId,name,args,signal);appendFileSync(path,JSON.stringify({callId,name,args,result})+'\n',{mode:0o600});return result;}
      catch(error){appendFileSync(path,JSON.stringify({callId,name,args,error:String(error)})+'\n',{mode:0o600});throw error;}
    }};
    input={...input,event:(type,detail)=>{
      event(type,detail);
      const arm=join(data,'arm-inflight-crash.json');
      if(type==='runtime_turn_started'&&input.mode==='conversation'&&existsSync(arm)){
        const target=JSON.parse(readFileSync(arm,'utf8')) as {conversation_id:string};
        if(target.conversation_id===input.request.conversation_id){
          writeFileSync(join(data,'inflight-crash-evidence.json'),JSON.stringify({fault:'Operator deliberately terminated control plane after actual provider turn/start notification; not a spontaneous outage',execution:input.execution,detail,at:new Date().toISOString()},null,2),{mode:0o600,flag:'wx'});
          renameSync(arm,join(data,'consumed-inflight-crash.json'));process.exit(75);
        }
      }
    }};
    const result=await super.run(input,signal);
    if(input.mode==='conversation'&&existsSync(join(data,'pause-after-turn.json')))company.pause(true);
    writeFileSync(join(inputs,`${input.execution.execution_id}.result.json`),JSON.stringify(result,null,2),{mode:0o600,flag:'wx'});
    return result;
  }
}
const runtime=new RecordingRuntime(),catalog=await runtime.catalog(data),fixturePath=join(data,'fixture.json');
if(!existsSync(fixturePath)){
  requireThat(company.workers().length===0,'Fresh validation roster required');
  const atlas=company.initializeCEO(),objective={objective:'Prompt 09 validation-only roster setup',acceptance_criteria:'Create persistent role identities through normal hierarchy and policy',constraints:'Trusted setup; no provider invocation, synthetic answers or acceptance claims.'};
  const setup=company.createTask('human',atlas,objective,null,'product'),claim=company.claimNext()!;
  const hire=(c:NonNullable<ReturnType<Company['claimNext']>>,name:string,profile:Profile)=>company.callTool(c.context,`fixture-hire-${name}`,'hire_worker',{display_name:name,title:profile,profile,mission:`Persistent ${profile}. Assess useful software designs and evidence within explicit charter and authority.`,capabilities:[...PROFILES[profile]],lifecycle:'persistent',justification:'Explicit isolated Prompt 09 fixture roster'}) as Worker;
  const maya=hire(claim,'Maya','product_manager'),turing=hire(claim,'Turing','cto');
  company.finish(claim.execution.execution_id,{status:'interrupted',settled:true,error:'Trusted setup, no model invoked'});company.cancel(setup.task_id);
  const researchSetup=company.createTask('human',atlas,objective,null,'research'),researchClaim=company.claimNext()!;
  const scout=hire(researchClaim,'Scout','researcher');
  company.finish(researchClaim.execution.execution_id,{status:'interrupted',settled:true,error:'Trusted setup, no model invoked'});company.cancel(researchSetup.task_id);
  const delivery=company.createTask('human',turing,objective,null,'delivery'),cto=company.claimNext()!;
  const linus=hire(cto,'Linus','engineer'),grace=hire(cto,'Grace','reviewer');
  company.finish(cto.execution.execution_id,{status:'interrupted',settled:true,error:'Trusted setup, no model invoked'});company.cancel(delivery.task_id);
  const model=catalog.models.find(m=>m.model==='gpt-6-sol');requireThat(model,'Validation model must be advertised');
  for(const w of company.workers())company.updateWorkerAIProfile(w.worker_id,{ai_model:model.model,reasoning_effort:'low',execution_priority:'normal',ai_profile_locked:true},catalog);
  company.pause(true);
  writeFileSync(fixturePath,JSON.stringify({roster_fixture:true,data_root:data,revision:process.env.BOT_DEPLOYED_SHA,setup_task_ids:[setup.task_id,researchSetup.task_id,delivery.task_id],atlas:atlas.worker_id,maya:maya.worker_id,turing:turing.worker_id,scout:scout.worker_id,linus:linus.worker_id,grace:grace.worker_id},null,2),{mode:0o600,flag:'wx'});
}
const dispatcher=new Dispatcher(company,runtime),http=createHttpServer(company,dispatcher,join(root,'public'));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await dispatcher.stop();await http.close();store.close();unlock();}
http.server.listen(port,'127.0.0.1',()=>{dispatcher.runtimeState='ready';dispatcher.start();console.log('Isolated Prompt 09 validation ready');});
process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
requireThat(JSON.parse(readFileSync(fixturePath,'utf8')).data_root===data,'Fixture identity mismatch');
