// Bounded read-only runtime diagnostic: the allowlist cannot transmit a model turn.
import {mkdtempSync,mkdirSync,rmSync,readFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {CodexRuntime,DISABLED_FEATURES} from './dist/src/runtime/codex.js';
import {CreditAccountVerifier} from './dist/src/runtime/credit-account.js';
import {creditEnvironment,rejectGlobalInstructions} from './dist/src/runtime/credit-policy.js';
const root=mkdtempSync('/var/tmp/botsquad-ask-ephemeral-'),workspace=join(root,'empty');mkdirSync(workspace,{mode:0o700});
const runtime=new CodexRuntime({command:'/opt/botsquad/node_modules/.bin/codex'}),deadline=Date.now()+60000,opened=[],methods=[];
const allowed=new Set(['initialize','config/read','skills/list','account/read','configRequirements/read','account/rateLimits/read','model/list','thread/start']);
const report={observedAt:new Date().toISOString(),kind:'actual_pinned_runtime_no_turn_probe',modelTurns:0,publicServiceEligibilityVerified:false,rawVisitorInput:false,providerRetentionVerified:false,hostMemoryPurgeVerified:false,passed:false};
const check=()=>{if(Date.now()>=deadline)throw Error('deadline');};
const timer=setTimeout(()=>{for(const x of opened)x.rpc.close();},60000);
try{
 const environment=creditEnvironment();rejectGlobalInstructions(environment);report.version=runtime.checkVersion(environment);
 const open=(skills,expected)=>{
  const rpc=runtime.connect(workspace,true,skills,environment);opened.push({rpc});
  const request=rpc.request.bind(rpc);rpc.request=(method,params,timeout)=>{check();if(!allowed.has(method))throw Error('method denied');methods.push(method);return request(method,params,Math.min(timeout??10000,deadline-Date.now()));};
  rpc.on('request',m=>rpc.send({id:m.id,error:{code:-32601,message:'No tools or inference in isolation probe'}}));
  const accounts=new CreditAccountVerifier(rpc,{pilotId:'ask-isolation-probe-20261013',workspace,deadline,disabledFeatures:DISABLED_FEATURES,expected,checkOpen:check});return{rpc,accounts};
 };
 const first=open();let isolated;
 try{isolated=await runtime.initialize(first.rpc,true,workspace,undefined,first.accounts);check();}finally{first.accounts.close();await first.rpc.closeAndWait();}
 const second=open(isolated.skills,isolated.verified);
 try{
  const data=await runtime.initialize(second.rpc,true,workspace,isolated.skills,second.accounts);
  if(!data.catalog.models.some(m=>m.model==='gpt-6-sol'&&m.supportedReasoningEfforts.some(e=>e.reasoningEffort==='low')))throw Error('model not advertised');
  const result=await second.rpc.request('thread/start',{cwd:workspace,approvalPolicy:'never',sandbox:'read-only',ephemeral:true,environments:[],model:'gpt-6-sol',modelProvider:'openai',serviceTier:'default',allowProviderModelFallback:false,config:{...data.overrides,compact_prompt:'No visitor context or model turn is permitted in this diagnostic.'},baseInstructions:'No visitor context or model turn is permitted in this diagnostic.',developerInstructions:'Read-only BotSquad runtime capability probe.',experimentalRawEvents:true,dynamicTools:[]});
  const thread=result.thread;
  Object.assign(report,{ephemeral:thread?.ephemeral===true,pathNull:thread?.path===null,freshParent:thread?.parentThreadId==null&&thread?.forkedFromId==null,exactWorkspace:thread?.cwd===workspace,exactModel:result.model==='gpt-6-sol',provider:result.modelProvider,serviceTier:result.serviceTier,approvalPolicy:result.approvalPolicy,sandbox:result.sandbox?.type,networkAccess:result.sandbox?.networkAccess,threadIdentityDigest:createHash('sha256').update(String(thread?.id)).digest('hex'),accountStable:second.accounts.current(data.verified),disabledSkills:data.skills.length});
  report.passed=report.ephemeral&&report.pathNull&&report.freshParent&&report.exactWorkspace&&report.exactModel&&report.provider==='openai'&&report.serviceTier==='default'&&report.approvalPolicy==='never'&&report.sandbox==='readOnly'&&report.networkAccess===false&&report.accountStable;
 }finally{second.accounts.close();await second.rpc.closeAndWait();}
}catch{report.failure='Pinned runtime isolation preflight did not establish all requested properties';process.exitCode=1;}
finally{clearTimeout(timer);let stopped=true;for(const x of opened)try{await x.rpc.closeAndWait();}catch{stopped=false;}report.localChildrenTerminated=stopped;report.methods=methods;report.modelTurns=methods.filter(m=>m==='turn/start').length;report.passed&&=stopped;console.log(JSON.stringify(report,null,2));rmSync(root,{recursive:true,force:true});}
