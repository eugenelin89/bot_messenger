// Explicit isolated real-worker validation. No production import or scripted model actions.
import {existsSync,mkdirSync,readFileSync,writeFileSync,appendFileSync,renameSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../../src/persistence/store.js';
import {acquireDataLock} from '../../src/persistence/lock.js';
import {Company} from '../../src/control/company.js';
import {Dispatcher} from '../../src/control/dispatcher.js';
import {CodexRuntime} from '../../src/runtime/codex.js';
import {BrowserClient} from '../../src/computer/client.js';
import type {RuntimeInput} from '../../src/runtime/adapter.js';
import {requireThat} from '../../src/domain/model.js';
import {createHttpServer} from '../../src/http/server.js';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const data=resolve(process.env.BOT_DATA_DIR??''),port=Number(process.env.PORT);
requireThat(process.env.BOT_VALIDATION_COMPUTER==='1'&&/^\/var\/lib\/botsquad\/validation\/computer-20261005-worker(?:[2-9])?$/.test(data)&&port===4314,'Explicit isolated C10-1 configuration required');
requireThat(JSON.parse(readFileSync(join(data,'validation-manifest.json'),'utf8')).purpose==='C10-1 isolated real worker','Wrong validation manifest');
const unlock=acquireDataLock(data),store=new Store(join(data,'company.sqlite')),company=new Company(store,data,root);
// Operator-armed lost-acknowledgement UI probe. The real browser is closed, but
// its acknowledgement is deliberately withheld until the operator releases it.
class CleanupFaultClient extends BrowserClient {
  override async close(){const confirmed=await super.close();if(existsSync(join(data,'arm-cleanup-ack.json'))&&!existsSync(join(data,'release-cleanup-ack'))){writeFileSync(join(data,'cleanup-ack-fault.json'),JSON.stringify({fault:'Deliberately withheld real browser close acknowledgement',actual_shutdown_confirmed:confirmed,at:new Date().toISOString()}),{mode:0o600});return false;}return confirmed;}
  override async confirmIdle(){if(existsSync(join(data,'arm-cleanup-ack.json'))&&!existsSync(join(data,'release-cleanup-ack')))return false;return super.confirmIdle();}
}
company.computers.factory=()=>new CleanupFaultClient();
const inputs=join(data,'runtime-inputs');mkdirSync(inputs,{recursive:true,mode:0o700});
class RecordingRuntime extends CodexRuntime {
  override async run(input:RuntimeInput,signal:AbortSignal){
    const file=join(inputs,input.execution.execution_id+'.jsonl');
    const record=(value:unknown)=>appendFileSync(file,JSON.stringify({at:new Date().toISOString(),...value as object})+'\n',{mode:0o600});
    record({kind:'input',mode:input.mode,execution:input.execution,context:input.context,binding:input.binding??null,tools:input.tools});
    const original=input.callTool,event=input.event;
    input={...input,callTool:async(callId,name,args,toolSignal)=>{record({kind:'tool_call',callId,name,args});try{const result=await original(callId,name,args,toolSignal);record({kind:'tool_result',callId,name,result});return result;}catch(e){record({kind:'tool_rejected',callId,name,error:String(e)});throw e;}},event:(type,detail)=>{event(type,detail);record({kind:'event',type,detail});}};
    const result=await super.run(input,signal);record({kind:'outcome',result});return result;
  }
}
const runtime=new RecordingRuntime(),catalog=await runtime.catalog(data),fixture=join(data,'fixture.json');
if(!existsSync(fixture)){
  requireThat(company.workers().length===0,'Fresh isolated HQ required');
  const operator=company.initializeComputerOperator({display_name:'Cora'});
  const model=catalog.models.find(m=>m.model==='gpt-6-sol');requireThat(model,'Validation model must be advertised');
  company.updateWorkerAIProfile(operator.worker_id,{ai_model:model.model,reasoning_effort:'low',execution_priority:'normal',ai_profile_locked:true},catalog);
  company.pause(true);writeFileSync(fixture,JSON.stringify({purpose:'Trusted normal owner-created operator, no browser grant or model run yet',operator:operator.worker_id,data_root:data,revision:process.env.BOT_DEPLOYED_SHA,model:model.model},null,2),{flag:'wx',mode:0o600});
}
// Labelled deterministic control-plane fault, armed only by the operator in this
// isolated validation root. Actual browser and HTTP mutation still execute.
const forward=company.computers.forward;
company.computers.forward=async(...args)=>{
 const response=await forward(...args);const arm=join(data,'arm-after-transmit.json');
 if(args[0].method==='POST'&&existsSync(arm)){
   renameSync(arm,join(data,'consumed-after-transmit.json'));writeFileSync(join(data,'after-transmit-fault.json'),JSON.stringify({fault:'Deliberate process exit after real fixture response before durable computer receipt',request:args[0],response,at:new Date().toISOString()},null,2),{mode:0o600,flag:'wx'});process.exit(75);
 }
 return response;
};
const dispatcher=new Dispatcher(company,runtime),http=createHttpServer(company,dispatcher,join(root,'public'));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await dispatcher.stop();await http.close();store.close();unlock();}
http.server.listen(port,'127.0.0.1',()=>{dispatcher.runtimeState='ready';dispatcher.start();console.log('C10-1 isolated worker HQ ready');});
process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop());
