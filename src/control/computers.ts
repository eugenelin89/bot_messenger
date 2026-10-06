import {setTimeout as delay} from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { mkdirSync,realpathSync,writeFileSync,openSync,fsyncSync,closeSync,readFileSync,lstatSync } from 'node:fs';
import { join } from 'node:path';
import type { Company,ExecutionContext,TaskInput } from './company.js';
import { requireThat,strictObject,textField,type Task,type RuntimeBinding } from '../domain/model.js';
import { computerHash,parseComputerPolicy,computerUrl,canonicalBrowserRequest,type ComputerSession,type ComputerGrant,type ComputerPolicy,type ComputerIntent,type ComputerState,type BrowserRequest,type BrowserResponse,type PageSnapshot,type CanonicalRequest } from '../domain/computer.js';
import { BrowserClient,type BrowserEnvironment } from '../computer/client.js';
import { forwardBrowserRequest } from '../computer/network.js';

const id=(kind:string)=>`${kind}_${randomUUID()}`;const now=()=>new Date().toISOString();
export const COMPUTER_TOOLS=['computer_status','computer_snapshot','computer_navigate','computer_click','computer_type','computer_press','computer_scroll','computer_request_protected_action','computer_execute_approved','computer_finish'] as const;
interface Operation {operation_id:string;session_id:string;execution_id:string;generation:number;call_id:string;request_hash:string;tool:string;state:string;result:string|null}
interface ContextRow {context_id:string;session_id:string;worker_id:string;task_id:string;execution_id:string;generation:number;runtime_reference:string|null;thread_name:string|null;created_at:string}
interface Active {browser:BrowserEnvironment;abort:AbortController;deadline:NodeJS.Timeout;idle?:NodeJS.Timeout;operation?:Operation;context?:ExecutionContext;acceptNetwork:boolean;network:number;networkPending:Set<Promise<unknown>>}
export class Computers {
  readonly fixtureCeiling:readonly string[];
  factory:()=>BrowserEnvironment=()=>new BrowserClient();
  forward=forwardBrowserRequest;
  private environments=new Map<string,Active>();
  private pending=new Map<string,Promise<unknown>>();
  private stopping=new Map<string,Promise<ComputerSession>>();
  private cleanupCheck?:Promise<boolean>;
  private cleanupLoop?:Promise<void>;
  private cleanupAbort=new AbortController();
  constructor(readonly company:Company) {this.fixtureCeiling=Object.freeze(JSON.parse(process.env.BOT_COMPUTER_FIXTURES??'[]'));}
  private get db(){return this.company.store;}
  private owner(){requireThat(this.db.get<{enabled:number}>("SELECT enabled FROM principals WHERE principal_id='human'")?.enabled===1,'Owner is disabled');}
  session(sessionId:string){const s=this.db.get<ComputerSession>('SELECT * FROM computer_sessions WHERE session_id=?',sessionId);requireThat(s,'Computer session not found');return s;}
  forTask(taskId:string){return this.db.get<ComputerSession>('SELECT * FROM computer_sessions WHERE task_id=?',taskId);}
  grant(sessionId:string){return this.db.get<ComputerGrant>('SELECT * FROM computer_grants WHERE session_id=?',sessionId);}
  policy(s:ComputerSession):ComputerPolicy{return JSON.parse(s.policy);}
  unknown(workerId?:string){return !!this.db.get(`SELECT 1 FROM computer_intents WHERE state='unknown' ${workerId?'AND worker_id=?':''}`,...(workerId?[workerId]:[]));}
  private eligibleWorker(workerId:string){const w=this.company.worker(workerId);requireThat(w.enabled&&w.role==='computer_operator'&&w.capability_profile.includes('computer_use_sandboxed'),'Worker has no Computer Use authority');return w;}
  private authority(s:ComputerSession,context?:ExecutionContext) {
    this.owner();this.eligibleWorker(s.worker_id);const p=this.policy(s);const g=this.grant(s.session_id);
    requireThat(g&&!g.revoked_at&&g.policy_hash===s.policy_hash&&g.worker_id===s.worker_id&&g.task_id===s.task_id&&Date.parse(g.expires_at)>Date.now(),'Computer Use grant is absent, expired or revoked');
    requireThat(computerHash(s.policy)===s.policy_hash&&p.fixtureOrigins.every(o=>this.fixtureCeiling.includes(o)),'Computer policy no longer matches trusted scope');
    requireThat(!s.deadline||Date.parse(s.deadline)>Date.now(),'Computer session deadline expired');
    requireThat(!this.unknown(),'An uncertain protected browser effect requires owner inspection; Computer Use is fenced');
    if(context){const {worker,task,execution}=this.company.verifyContext(context);requireThat(worker.worker_id===s.worker_id&&task.task_id===s.task_id&&s.active_execution_id===execution.execution_id,'Computer session ownership or generation mismatch');
      const c=this.db.get<ContextRow>('SELECT * FROM computer_contexts WHERE execution_id=?',execution.execution_id);requireThat(c?.session_id===s.session_id&&c.generation===s.generation,'Stale computer callback');}
    return p;
  }
  request(input:unknown) {
    this.owner();const a=strictObject(input,['worker_id','objective','acceptance_criteria','constraints','policy']);const worker=this.eligibleWorker(textField(a,'worker_id',100));
    requireThat(!this.unknown(),'Uncertain protected effect blocks new Computer Use');
    const policy=JSON.stringify(parseComputerPolicy(a.policy,this.fixtureCeiling));
    return this.db.transaction(()=>{
      const task=this.company.createTask('human',worker,{objective:textField(a,'objective'),acceptance_criteria:textField(a,'acceptance_criteria'),constraints:textField(a,'constraints')} as TaskInput,null,'computer');
      this.db.run("UPDATE tasks SET status='blocked',blocking_reason='Computer session awaits exact owner authorization' WHERE task_id=?",task.task_id);
      const sessionId=id('computer');this.db.run("INSERT INTO computer_sessions(session_id,worker_id,task_id,policy,policy_hash,state,created_at) VALUES(?,?,?,?,?,'requested',?)",sessionId,worker.worker_id,task.task_id,policy,computerHash(policy),now());
      this.company.audit('computer_requested','human',{session_id:sessionId,policy_hash:computerHash(policy)},worker.worker_id,task.task_id);
      this.company.refreshWorker(worker.worker_id);return this.session(sessionId);
    });
  }
  authorize(input:unknown) {
    this.owner();const a=strictObject(input,['session_id','policy_hash','decision']);const s=this.session(textField(a,'session_id',100));
    requireThat(s.state==='requested'&&a.policy_hash===s.policy_hash,'Review the exact requested immutable policy');requireThat(a.decision==='approve'||a.decision==='deny','Invalid session decision');this.eligibleWorker(s.worker_id);
    const p=this.policy(s);requireThat(Date.parse(p.expiresAt)>Date.now()&&!this.unknown(),'Expired or fenced Computer Use');
    this.db.transaction(()=>{
      if(a.decision==='approve') {
        this.db.run('INSERT INTO computer_grants VALUES(?,?,?,?,?,?,?,?,NULL)',id('computergrant'),s.session_id,s.worker_id,s.task_id,s.policy_hash,'human',now(),p.expiresAt);
        this.db.run("UPDATE computer_sessions SET state='ready' WHERE session_id=?",s.session_id);
        this.db.run("UPDATE tasks SET status='queued',blocking_reason=NULL,updated_at=? WHERE task_id=? AND status='blocked'",now(),s.task_id);
      } else {this.db.run("UPDATE computer_sessions SET state='denied',stopped_at=? WHERE session_id=?",now(),s.session_id);this.db.run("UPDATE tasks SET status='cancelled',blocking_reason='Owner denied Computer Use' WHERE task_id=?",s.task_id);}
      this.company.audit('computer_authorization','human',{session_id:s.session_id,decision:a.decision},s.worker_id,s.task_id);this.company.refreshWorker(s.worker_id);
    });this.company.changed();return this.session(s.session_id);
  }
  eligible(task:Task) {
    if(task.kind!=='computer')return true;const s=this.forTask(task.task_id);if(!s)return false;
    try{this.authority(s);}catch{return false;}
    if(s.state==='ready')return !this.db.get("SELECT 1 FROM computer_sessions WHERE state IN ('provisioning','active','awaiting_approval') OR shutdown_confirmed=0 OR active_execution_id IS NOT NULL");
    return s.state==='awaiting_approval'&&!!this.environments.get(s.session_id)&&!!this.db.get("SELECT 1 FROM computer_intents WHERE session_id=? AND state='approved'",s.session_id);
  }
  prepare(context:ExecutionContext) {
    const {task,worker,execution}=this.company.verifyContext(context);const s=this.forTask(task.task_id);requireThat(s&&task.kind==='computer','Computer Task required');this.authority(s);
    this.db.transaction(()=>{
      requireThat(!this.db.get('SELECT 1 FROM computer_contexts WHERE execution_id=?',execution.execution_id),'Computer execution already prepared');
      this.db.run('UPDATE computer_sessions SET generation=generation+1,active_execution_id=? WHERE session_id=?',execution.execution_id,s.session_id);
      this.db.run('INSERT INTO computer_contexts VALUES(?,?,?,?,?,?,NULL,NULL,?)',id('computercontext'),s.session_id,worker.worker_id,task.task_id,execution.execution_id,s.generation+1,now());
    });return this.context(context);
  }
  context(context:ExecutionContext) {
    const {task}=this.company.verifyContext(context);const s=this.forTask(task.task_id);requireThat(s,'No computer session');this.authority(s,context);
    const intents=this.db.all<ComputerIntent>("SELECT * FROM computer_intents WHERE session_id=? AND (state IN ('captured','pending','approved','transmitting','unknown') OR rowid IN (SELECT rowid FROM computer_intents WHERE session_id=? ORDER BY rowid DESC LIMIT 8)) ORDER BY rowid",s.session_id,s.session_id).map(({request,result,...intent})=>{
      const req=JSON.parse(request) as CanonicalRequest;const receipt=result?JSON.parse(result) as Partial<BrowserResponse>&{error?:string}:null;
      return {...intent,...(['captured','pending','approved','transmitting'].includes(intent.state)?{request}:{request_summary:{method:req.method,url:req.url,body_bytes:Buffer.byteLength(req.body,'base64'),body_sha256:computerHash(Buffer.from(req.body,'base64'))}}),receipt:receipt?{status:receipt.status,error:receipt.error?.slice(0,1000),body_bytes:receipt.body?Buffer.byteLength(receipt.body,'base64'):0,body_excerpt:receipt.body?Buffer.from(receipt.body,'base64').toString('utf8').slice(0,2000):undefined,full_receipt:'Retained for owner inspection'}:null};
    });
    const result={session:s,policy:this.policy(s),observation_format:'structured_rendered_snapshot',intents,
      evidence:this.db.all('SELECT * FROM computer_evidence WHERE session_id=? ORDER BY captured_at',s.session_id),prior_operations:this.db.all('SELECT operation_id,execution_id,generation,tool,state,created_at,finished_at FROM computer_operations WHERE session_id=? ORDER BY rowid DESC LIMIT 8',s.session_id)};
    requireThat(Buffer.byteLength(JSON.stringify(result))<=196608,'Computer context exceeds bounded size');return result;
  }
  bind(context:ExecutionContext,binding:RuntimeBinding) {
    const {worker,execution}=this.company.verifyContext(context);const s=this.forTask(execution.task_id);requireThat(s,'Computer session missing');this.authority(s,context);
    requireThat(binding.worker_id===worker.worker_id&&binding.workspace_path===worker.workspace_path&&binding.runtime_type===worker.runtime_type,'Computer provider binding mismatch');
    for(const table of ['runtime_bindings','conversation_sessions','research_task_sessions','research_operations','mandate_task_sessions'])requireThat(!this.db.get(`SELECT 1 FROM ${table} WHERE runtime_reference=?`,binding.runtime_reference),'Provider context belongs to another work mode');
    const c=this.db.get<ContextRow>('SELECT * FROM computer_contexts WHERE execution_id=?',context.executionId)!;requireThat(!c.runtime_reference||c.runtime_reference===binding.runtime_reference,'Cannot replace an active computer provider context');
    this.db.transaction(()=>{this.db.run('UPDATE computer_contexts SET runtime_reference=?,thread_name=? WHERE context_id=?',binding.runtime_reference,binding.thread_name??null,c.context_id);this.db.run('UPDATE executions SET runtime_reference=? WHERE execution_id=?',binding.runtime_reference,execution.execution_id);});
  }
  hasPending(executionId:string){return [...this.pending.keys()].some(k=>k.startsWith(executionId+':'));}
  async drain(executionId:string){await Promise.allSettled([...this.pending.entries()].filter(([k])=>k.startsWith(executionId+':')).map(([,p])=>p));}
  private touch(sessionId:string) {
    const active=this.environments.get(sessionId);if(!active)return;const s=this.session(sessionId);if(active.idle)clearTimeout(active.idle);
    active.idle=setTimeout(()=>void this.stop(sessionId,'expired','Idle browser deadline expired'),this.policy(s).idleSeconds*1000);
    this.db.run('UPDATE computer_sessions SET last_action_at=? WHERE session_id=?',now(),sessionId);
  }
  private async launch(s:ComputerSession) {
    if(this.environments.has(s.session_id))return this.environments.get(s.session_id)!;
    requireThat(s.state==='ready','Session is not authorized for provisioning');const p=this.authority(s);
    const deadline=Math.min(Date.now()+p.maxRuntimeSeconds*1000,Date.parse(p.expiresAt));
    this.db.run("UPDATE computer_sessions SET state='provisioning',started_at=?,deadline=?,shutdown_confirmed=0 WHERE session_id=?",now(),new Date(deadline).toISOString(),s.session_id);
    const active:Active={browser:this.factory(),abort:new AbortController(),deadline:setTimeout(()=>void this.stop(s.session_id,'expired','Session runtime expired'),Math.max(1,deadline-Date.now())),acceptNetwork:false,network:0,networkPending:new Set()};this.environments.set(s.session_id,active);
    try {
      const processIdentity=await active.browser.launch(s.session_id,p.maxRuntimeSeconds,r=>this.network(s.session_id,r),()=>{void this.stop(s.session_id,'failed','Browser process or broker connection lost');});
      this.authority(this.session(s.session_id));requireThat(!active.abort.signal.aborted,'Browser launch interrupted');
      this.db.run("UPDATE computer_sessions SET state='active',process_identity=? WHERE session_id=?",JSON.stringify(processIdentity),s.session_id);this.touch(s.session_id);return active;
    } catch(e){await this.stop(s.session_id,'failed','Browser provisioning failed');throw e;}
  }
  private event(s:ComputerSession,raw:BrowserRequest,disposition:string,detail:string) {
    const active=this.environments.get(s.session_id);let safeUrl='[invalid or denied URL]';try{const u=new URL(String(raw.url));safeUrl=(u.origin+u.pathname).slice(0,2048);}catch{}this.db.run('INSERT INTO computer_network_events VALUES(?,?,?,?,?,?,?,?,?)',id('computernet'),s.session_id,active?.context?.executionId??null,active?.operation?.operation_id??null,safeUrl,String(raw.method).slice(0,10),disposition,detail.slice(0,300),now());
  }
  private network(sessionId:string,raw:BrowserRequest):Promise<BrowserResponse|null> {
    const active=this.environments.get(sessionId);const promise=this.performNetwork(sessionId,raw);
    active?.networkPending.add(promise);void promise.then(()=>active?.networkPending.delete(promise),()=>active?.networkPending.delete(promise));return promise;
  }
  private async performNetwork(sessionId:string,raw:BrowserRequest,approvedIntentId?:string):Promise<BrowserResponse|null> {
    const active=this.environments.get(sessionId);const s=this.session(sessionId);let request:CanonicalRequest;let intent:ComputerIntent|undefined;let reserved=false;
    const context=active?.context;const operation=active?.operation;
    try {
      const p=this.policy(s);
      if(s.requests>=p.maxRequests){void this.stop(sessionId,'expired','Browser request bound reached');return null;}
      this.db.run('UPDATE computer_sessions SET requests=requests+1 WHERE session_id=?',sessionId);
      requireThat(active&&context&&operation&&active.acceptNetwork&&!active.abort.signal.aborted,'No active Task action authorizes page networking');this.authority(s,context);
      requireThat((approvedIntentId?s.state==='awaiting_approval':s.state==='active')&&active.network<4,'Browser network is paused or saturated');
      requireThat(!['websocket','eventsource','manifest'].includes(raw.resourceType),'Browser resource type denied');
      request=canonicalBrowserRequest(raw,p);
      if(request.method==='POST') {
        if(approvedIntentId) {
          intent=this.db.get<ComputerIntent>('SELECT * FROM computer_intents WHERE intent_id=?',approvedIntentId);
          requireThat(intent?.state==='approved'&&intent.session_id===sessionId&&intent.request_hash===computerHash(JSON.stringify(request))&&Date.parse(intent.expires_at)>Date.now(),'Protected request differs from its exact approval');
        } else {
          requireThat(['computer_click','computer_press'].includes(operation.tool)&&s.page_hash,'Unexpected page mutation denied');
          requireThat(!this.db.get("SELECT 1 FROM computer_intents WHERE session_id=? AND state IN ('captured','pending','approved','transmitting')",sessionId),'A protected intent already exists');
          const intentId=id('computerintent');this.db.run("INSERT INTO computer_intents VALUES(?,?,?,?,?,?,?,?,?,?,'captured',NULL,?,?,NULL,NULL,NULL,NULL)",intentId,sessionId,s.worker_id,s.task_id,context.executionId,s.generation,s.policy_hash,JSON.stringify(request),computerHash(JSON.stringify(request)),s.page_hash,now(),new Date(Math.min(Date.parse(s.deadline!),Date.now()+300000)).toISOString());
          this.event(s,raw,'blocked',`Protected fixture request captured as ${intentId}; zero transmission`);return null;
        }
      }
      if(s.network_bytes+2097152>p.maxNetworkBytes){void this.stop(sessionId,'expired','Browser aggregate-byte bound reached');throw new Error('Browser aggregate-byte bound reached');}
      if(raw.resourceType==='document'){if(s.navigations>=p.maxNavigations){void this.stop(sessionId,'expired','Navigation bound reached');throw new Error('Navigation bound reached');}this.db.run('UPDATE computer_sessions SET navigations=navigations+1 WHERE session_id=?',sessionId);}
      this.db.run('UPDATE computer_sessions SET network_bytes=network_bytes+2097152 WHERE session_id=?',sessionId);reserved=true;active.network++;
      const response=await this.forward(request,p,active.abort.signal,()=>{
        requireThat(active.context===context&&active.operation===operation,'Browser action authority ended');this.authority(this.session(sessionId),context);requireThat(this.session(sessionId).state===(approvedIntentId?'awaiting_approval':'active'),'Page network authority ended');
        if(intent){const result=this.db.run("UPDATE computer_intents SET state='transmitting',consumed_execution_id=? WHERE intent_id=? AND state='approved'",context.executionId,intent.intent_id);requireThat(result.changes===1,'Protected approval already consumed');}
      });
      // Retain a trusted response even if authority is revoked after transmission;
      // current authorization separately gates delivery to the worker/browser.
      if(intent)this.db.run("UPDATE computer_intents SET state='completed',result=? WHERE intent_id=? AND state='transmitting'",JSON.stringify(response),intent.intent_id);
      this.db.run('UPDATE computer_sessions SET network_bytes=network_bytes-? WHERE session_id=?',2097152-Buffer.byteLength(response.body,'base64'),sessionId);
      this.event(s,raw,'forwarded',`HTTP ${response.status}`);requireThat(active.context===context&&active.operation===operation,'Late browser response withheld');this.authority(this.session(sessionId),context);return response;
    } catch(e) {
      if(intent&&this.db.get<{state:string}>('SELECT state FROM computer_intents WHERE intent_id=?',intent.intent_id)?.state==='transmitting') {
        this.db.run("UPDATE computer_intents SET state='unknown',result=? WHERE intent_id=?",JSON.stringify({error:'Transmission started; no trusted response committed. Never retry.'}),intent.intent_id);
        void this.stop(sessionId,'unknown','Protected mutation outcome is unknown; no replay');
      }
      this.event(s,raw,'blocked',e instanceof Error?e.message:'Network denied');return null;
    } finally {if(active&&reserved)active.network--;}
  }
  async callTool(context:ExecutionContext,callId:string,name:string,input:unknown,signal:AbortSignal):Promise<unknown> {
    requireThat(typeof callId==='string'&&callId.length>0&&callId.length<=256,'Invalid computer call ID');const {task}=this.company.verifyContext(context);
    const s=this.forTask(task.task_id);requireThat(s,'Task has no ComputerSession');const p=this.authority(s,context);
    requireThat((COMPUTER_TOOLS as readonly string[]).includes(name),'Unknown computer tool');
    const a=strictObject(input,name==='computer_navigate'?['session_id','url']:name==='computer_click'?['session_id','ref']:name==='computer_type'?['session_id','ref','text']:name==='computer_press'?['session_id','ref','key']:name==='computer_scroll'?['session_id','delta']:name==='computer_request_protected_action'?['session_id','intent_id','reason']:name==='computer_execute_approved'?['session_id','intent_id']:['session_id']);
    requireThat(a.session_id===s.session_id,'Cross-session browser access denied');
    const requestHash=computerHash(JSON.stringify([name,input]));const key=context.executionId+':'+callId;
    for(const table of ['tool_receipts','research_operations'])requireThat(!this.db.get(`SELECT 1 FROM ${table} WHERE execution_id=? AND call_id=?`,context.executionId,callId),'Tool call ID belongs to another tool');
    const old=this.db.get<Operation>('SELECT * FROM computer_operations WHERE execution_id=? AND call_id=?',context.executionId,callId);
    if(old){requireThat(old.request_hash===requestHash,'Computer call replay payload mismatch');if(this.pending.has(key))return this.pending.get(key);if(old.result)return JSON.parse(old.result);throw new Error('Prior browser action has no committed result; it cannot be replayed');}
    requireThat(!this.hasPending(context.executionId),'Await the previous browser action');
    if(name!=='computer_status')requireThat(p.actions.includes(name.slice('computer_'.length) as any),'Action is outside approved policy');
    if(s.actions>=p.maxActions){await this.stop(s.session_id,'expired','Computer action bound reached');throw new Error('Computer action bound reached');}
    const operationId=id('computerop');this.db.transaction(()=>{
      this.db.run('UPDATE computer_sessions SET actions=actions+1 WHERE session_id=?',s.session_id);
      this.db.run("INSERT INTO computer_operations VALUES(?,?,?,?,?,?,?,'reserved',NULL,?,NULL)",operationId,s.session_id,context.executionId,s.generation,callId,requestHash,name,now());
    });const op=this.db.get<Operation>('SELECT * FROM computer_operations WHERE operation_id=?',operationId)!;
    const abort=()=>{void this.stop(s.session_id,'interrupted','Active worker was interrupted');};signal.addEventListener('abort',abort,{once:true});
    const run=Promise.resolve().then(async()=>{
      let actionEnvironment:Active|undefined;let attemptedApproved=false;
      try {
        signal.throwIfAborted();let result:unknown;
        if(name==='computer_status')result=this.context(context);
        else if(name==='computer_request_protected_action') {
          const intent=this.intent(textField(a,'intent_id',100));requireThat(intent.session_id===s.session_id&&intent.state==='captured'&&intent.page_hash===s.page_hash,'Protected intent/page no longer matches');
          this.db.transaction(()=>{this.db.run("UPDATE computer_intents SET state='pending',reason=? WHERE intent_id=?",textField(a,'reason',1000),intent.intent_id);this.db.run("UPDATE computer_sessions SET state='awaiting_approval' WHERE session_id=?",s.session_id);});
          result={awaiting_owner_approval:true,intent_id:intent.intent_id,instruction:'End this turn now. The owner must decide the exact protected intent; do not poll.'};
        } else if(name==='computer_finish') {
          requireThat(s.state==='active'&&!this.db.get("SELECT 1 FROM computer_intents WHERE session_id=? AND state IN ('approved','transmitting','unknown')",s.session_id),'Cannot finish with a paused, unconsumed or uncertain effect');const closed=await this.stop(s.session_id,'completed','Worker finished bounded browser work',false);requireThat(closed.state==='completed'&&closed.shutdown_confirmed===1,'Browser cleanup is unconfirmed; completion withheld');result={completed:true,session_id:s.session_id};
        } else {
          requireThat(['ready','active','awaiting_approval'].includes(s.state),'Computer session is closed');
          if(s.state==='awaiting_approval')requireThat(name==='computer_execute_approved','Only the exact approved continuation can resume this browser');
          const active=await this.launch(s);actionEnvironment=active;active.operation=op;active.context=context;active.acceptNetwork=true;this.touch(s.session_id);
          let args:Record<string,unknown>={page_hash:s.page_hash};let approved:ComputerIntent|undefined;
          if(name==='computer_navigate'){const url=computerUrl(textField(a,'url',2048),p);args={url:url.href};}
          if(name==='computer_snapshot'){if(s.screenshots>=p.maxScreenshots||s.screenshot_bytes+2097152>p.maxScreenshotBytes){await this.stop(s.session_id,'expired','Screenshot budget exceeded');throw new Error('Screenshot budget exceeded');}this.db.run('UPDATE computer_sessions SET screenshots=screenshots+1,screenshot_bytes=screenshot_bytes+2097152 WHERE session_id=?',s.session_id);}
          if(name==='computer_click')args={...args,ref:textField(a,'ref',100)};
          if(name==='computer_type')args={...args,ref:textField(a,'ref',100),text:textField(a,'text',2000)};
          if(name==='computer_press')args={...args,ref:textField(a,'ref',100),key:textField(a,'key',30)};
          if(name==='computer_scroll')args={...args,delta:a.delta};
          if(name==='computer_execute_approved') {
            const intent=this.intent(textField(a,'intent_id',100));requireThat(intent.session_id===s.session_id&&intent.state==='approved'&&intent.policy_hash===s.policy_hash&&Date.parse(intent.expires_at)>Date.now(),'Protected approval is unavailable');
            approved=intent;attemptedApproved=true;args={page_hash:intent.page_hash};
          }
          this.db.run("UPDATE computer_operations SET state='running' WHERE operation_id=?",op.operation_id);
          let response=await active.browser.action(s.session_id,name.slice('computer_'.length),{...args,allowed_origins:p.origins});
          let mutation:unknown;
          if(approved){
            requireThat(response.snapshot.hash===approved.page_hash,'Approved checkpoint was not verified');
            const receipt=await this.performNetwork(s.session_id,{...JSON.parse(approved.request),resourceType:'fetch'},approved.intent_id);
            requireThat(receipt&&this.intent(approved.intent_id).state==='completed','No trusted protected-effect receipt; do not report success');
            mutation={intent_id:approved.intent_id,status:receipt.status,body:Buffer.from(receipt.body,'base64').toString('utf8').slice(0,4000),source:'trusted_http_receipt'};
            this.authority(this.session(s.session_id),context);this.db.run("UPDATE computer_sessions SET state='active' WHERE session_id=?",s.session_id);
            response=await active.browser.action(s.session_id,'resume_approved',{allowed_origins:p.origins});
          }
          active.acceptNetwork=false;while(active.networkPending.size)await Promise.allSettled([...active.networkPending]);
          this.authority(this.session(s.session_id),context);signal.throwIfAborted();
          response.snapshot.url=computerUrl(response.snapshot.url,p).href;this.db.run('UPDATE computer_sessions SET current_url=?,page_hash=? WHERE session_id=?',response.snapshot.url,response.snapshot.hash,s.session_id);
          const evidence=response.screenshot?this.saveScreenshot(this.session(s.session_id),context,response.snapshot,response.screenshot):undefined;
          result={snapshot:response.snapshot,evidence,mutation,intents:this.db.all("SELECT intent_id,state,request_hash FROM computer_intents WHERE session_id=? AND state IN ('captured','pending','approved','unknown')",s.session_id)};
        }
        const encoded=JSON.stringify(result);requireThat(Buffer.byteLength(encoded)<=196608,'Computer result exceeds bounded context size');this.db.run("UPDATE computer_operations SET state='completed',result=?,finished_at=? WHERE operation_id=?",encoded,now(),operationId);return JSON.parse(encoded);
      } catch(e) {if(attemptedApproved)await this.stop(s.session_id,'failed','Protected continuation failed; inspect original receipt before any new work');const result={ok:false,error:e instanceof Error?e.message:'Browser action failed'};this.db.run("UPDATE computer_operations SET state='failed',result=?,finished_at=? WHERE operation_id=?",JSON.stringify(result),now(),operationId);return result;}
      finally {signal.removeEventListener('abort',abort);const active=actionEnvironment;if(active){active.acceptNetwork=false;while(active.networkPending.size)await Promise.allSettled([...active.networkPending]);active.context=undefined;active.operation=undefined;}this.pending.delete(key);this.company.changed();}
    });this.pending.set(key,run);return run;
  }
  private saveScreenshot(s:ComputerSession,context:ExecutionContext,snapshot:PageSnapshot,base64:string) {
    const bytes=Buffer.from(base64,'base64');requireThat(bytes.length<=2097152&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid bounded PNG');
    const root=join(this.company.dataDir,'computer-evidence');mkdirSync(root,{recursive:true,mode:0o700});requireThat(realpathSync(root)===root,'Evidence directory must be canonical');
    const evidenceId=id('computerevidence');const path=join(root,evidenceId+'.png');writeFileSync(path,bytes,{flag:'wx',mode:0o600});
    const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}const dir=openSync(root,'r');try{fsyncSync(dir);}finally{closeSync(dir);}
    this.db.transaction(()=>{this.db.run("INSERT INTO computer_evidence VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'owner_private')",evidenceId,s.session_id,s.worker_id,s.task_id,context.executionId,s.generation,snapshot.url,JSON.stringify({width:1024,height:768}),s.actions,now(),computerHash(bytes),bytes.length);this.db.run('UPDATE computer_sessions SET screenshot_bytes=screenshot_bytes-? WHERE session_id=?',2097152-bytes.length,s.session_id);});
    return {evidence_id:evidenceId,sha256:computerHash(bytes),bytes:bytes.length,visibility:'owner_private'};
  }
  evidence(evidenceId:string) {
    this.owner();const row=this.db.get<{sha256:string;bytes:number}>('SELECT * FROM computer_evidence WHERE evidence_id=?',evidenceId);requireThat(row&&/^computerevidence_[\da-f-]+$/.test(evidenceId),'Evidence not found');
    const path=join(this.company.dataDir,'computer-evidence',evidenceId+'.png');requireThat(realpathSync(path)===path&&lstatSync(path).isFile(),'Evidence path is invalid');const bytes=readFileSync(path);requireThat(bytes.length===row.bytes&&computerHash(bytes)===row.sha256,'Evidence integrity failed');return bytes;
  }
  intent(intentId:string){const row=this.db.get<ComputerIntent>('SELECT * FROM computer_intents WHERE intent_id=?',intentId);requireThat(row,'Protected intent not found');return row;}
  decide(input:unknown) {
    this.owner();const a=strictObject(input,['intent_id','request_hash','page_hash','decision']);const intent=this.intent(textField(a,'intent_id',100));const s=this.session(intent.session_id);this.authority(s);
    requireThat(intent.state==='pending'&&s.state==='awaiting_approval'&&this.company.task(s.task_id).status==='awaiting_approval','Wait for the requesting worker to settle before deciding');
    requireThat(intent.request_hash===a.request_hash&&intent.page_hash===a.page_hash&&intent.page_hash===s.page_hash&&Date.parse(intent.expires_at)>Date.now(),'Exact approval has changed or expired');requireThat(a.decision==='approve'||a.decision==='deny','Invalid approval decision');
    this.db.transaction(()=>{this.db.run('UPDATE computer_intents SET state=?,decided_at=?,decided_by=? WHERE intent_id=?',a.decision==='approve'?'approved':'denied',now(),'human',intent.intent_id);
      if(a.decision==='approve')this.db.run("UPDATE tasks SET status='queued',dispatch_reason='computer_approved',blocking_reason=NULL WHERE task_id=? AND status='awaiting_approval'",s.task_id);
      this.company.audit('computer_action_decided','human',{intent_id:intent.intent_id,decision:a.decision},s.worker_id,s.task_id);});
    if(a.decision==='deny')void this.stop(s.session_id,'denied','Owner denied protected action');this.company.refreshWorker(s.worker_id);this.company.changed();return this.intent(intent.intent_id);
  }
  settled(task:Task,outcome:string):'awaiting_approval'|'completed'|'failed'|undefined {
    if(task.kind!=='computer')return;const s=this.forTask(task.task_id)!;
    this.db.run('UPDATE computer_sessions SET active_execution_id=NULL WHERE session_id=?',s.session_id);
    if(outcome!=='completed'){void this.stop(s.session_id,'failed','Worker execution did not settle successfully');return 'failed';}
    if(s.state==='awaiting_approval')return 'awaiting_approval';
    if(s.state==='completed'&&s.shutdown_confirmed===1&&!this.unknown()&&!this.db.get("SELECT 1 FROM computer_intents WHERE session_id=? AND state IN ('approved','transmitting')",s.session_id))return 'completed';
    void this.stop(s.session_id,'failed','Worker ended without completing its bounded browser session');return 'failed';
  }
  stop(sessionId:string,state:ComputerState,reason:string,interrupt=true):Promise<ComputerSession> {
    const pending=this.stopping.get(sessionId);if(pending)return pending;
    const run=Promise.resolve().then(()=>this.performStop(sessionId,state,reason,interrupt));this.stopping.set(sessionId,run);
    void run.then(()=>this.stopping.delete(sessionId),()=>this.stopping.delete(sessionId));return run;
  }
  private async performStop(sessionId:string,state:ComputerState,reason:string,interrupt:boolean) {
    const s=this.session(sessionId);const active=this.environments.get(sessionId);
    if(['completed','denied','interrupted','expired','failed','unknown'].includes(s.state)&&!active){if(this.unknown(s.worker_id)&&s.state!=='unknown'){this.db.run("UPDATE computer_sessions SET state='unknown',error=? WHERE session_id=?",'Protected effect outcome is unknown; never replay',sessionId);this.company.changed();}if(!s.shutdown_confirmed)await this.recheckCleanup();return this.session(sessionId);}
    this.db.transaction(()=>{this.db.run('UPDATE computer_sessions SET state=?,error=?,stopped_at=? WHERE session_id=?',this.unknown(s.worker_id)?'unknown':state==='completed'?'interrupted':state,reason,now(),sessionId);
      this.db.run("UPDATE computer_intents SET state='cancelled' WHERE session_id=? AND state IN ('captured','pending','approved')",sessionId);
      const task=this.company.task(s.task_id);if(task.status!=='working'&&!['completed','cancelled','failed'].includes(task.status))this.db.run("UPDATE tasks SET status='blocked',blocking_reason=? WHERE task_id=?",reason,s.task_id);});
    // Relinquish the environment before synchronous interruption listeners run.
    // Runtime abort may re-enter stop; it must not own or close this resource twice.
    if(active){this.environments.delete(sessionId);clearTimeout(active.deadline);if(active.idle)clearTimeout(active.idle);active.abort.abort(reason);}
    if(interrupt&&s.active_execution_id)this.company.emit('computer_interrupt',s.active_execution_id);
    let confirmed=s.shutdown_confirmed===1;
    if(active)confirmed=await active.browser.close();
    this.db.run("UPDATE computer_sessions SET shutdown_confirmed=?,state=CASE WHEN EXISTS(SELECT 1 FROM computer_intents WHERE session_id=? AND state='unknown') THEN 'unknown' ELSE state END WHERE session_id=?",confirmed?1:0,sessionId,sessionId);
    if(state==='completed'&&!this.unknown(s.worker_id))this.db.run('UPDATE computer_sessions SET state=?,error=? WHERE session_id=?',confirmed?'completed':'failed',confirmed?reason:'Browser shutdown unconfirmed; completion withheld',sessionId);
    if(!confirmed)this.startCleanup();
    this.company.audit('computer_stopped','system',{session_id:sessionId,reason,shutdown_confirmed:confirmed},s.worker_id,s.task_id);this.company.refreshWorker(s.worker_id);this.company.changed();return this.session(sessionId);
  }
  async control(input:unknown) {
    this.owner();const a=strictObject(input,['session_id','action']);const s=this.session(textField(a,'session_id',100));requireThat(a.action==='interrupt'||a.action==='revoke','Invalid computer control');
    if(a.action==='revoke')this.db.run('UPDATE computer_grants SET revoked_at=? WHERE session_id=? AND revoked_at IS NULL',now(),s.session_id);
    return this.stop(s.session_id,'interrupted',a.action==='revoke'?'Owner revoked Computer Use':'Owner interrupted browser');
  }
  recover() {
    this.db.transaction(()=>{this.db.run("UPDATE computer_intents SET state='unknown' WHERE state='transmitting'");this.db.run("UPDATE computer_operations SET state='failed',finished_at=? WHERE state IN ('reserved','running')",now());
      for(const s of this.db.all<ComputerSession>("SELECT * FROM computer_sessions WHERE state IN ('provisioning','active','awaiting_approval') OR shutdown_confirmed=0 OR active_execution_id IS NOT NULL")) {
        this.db.run("UPDATE computer_intents SET state='cancelled' WHERE session_id=? AND state IN ('captured','pending','approved')",s.session_id);
        this.db.run('UPDATE computer_sessions SET state=?,stopped_at=?,error=?,active_execution_id=NULL WHERE session_id=?',this.unknown(s.worker_id)?'unknown':'failed',now(),'Application restart closed the old environment; approvals cannot restore its page',s.session_id);
        this.db.run("UPDATE tasks SET status='blocked',blocking_reason='Computer environment lost on restart; inspect original evidence' WHERE task_id=? AND status IN ('queued','awaiting_approval')",s.task_id);
      }});
    if(this.db.get('SELECT 1 FROM computer_sessions WHERE shutdown_confirmed=0'))this.startCleanup();
  }
  private recheckCleanup():Promise<boolean> {
    if(this.cleanupCheck)return this.cleanupCheck;
    const run=(async()=>{if(this.cleanupAbort.signal.aborted||this.environments.size)return false;
      if(!await this.factory().confirmIdle()||this.cleanupAbort.signal.aborted)return false;
      this.db.run("UPDATE computer_sessions SET shutdown_confirmed=1 WHERE shutdown_confirmed=0 AND state IN ('completed','denied','interrupted','expired','failed','unknown')");this.company.changed();return true;
    })();this.cleanupCheck=run;void run.then(()=>this.cleanupCheck=undefined,()=>this.cleanupCheck=undefined);return run;
  }
  private startCleanup() {
    if(this.cleanupLoop||this.cleanupAbort.signal.aborted)return;
    const run=this.confirmCleanup();this.cleanupLoop=run;void run.then(()=>this.cleanupLoop=undefined,()=>this.cleanupLoop=undefined);
  }
  private async confirmCleanup() {
    // Bounded restart reconciliation, with an explicit owner-triggered recheck after
    // delayed broker recovery. Shutdown cancels/awaits it before SQLite closes.
    for(let attempt=0;attempt<5&&!this.cleanupAbort.signal.aborted;attempt++) {
      if(await this.recheckCleanup())return;
      await delay(1000,undefined,{signal:this.cleanupAbort.signal}).catch(()=>{});
    }
  }
  async shutdown(){await Promise.all([...this.environments.keys()].map(s=>this.stop(s,'interrupted','HQ shutdown')));await Promise.allSettled([...this.stopping.values()]);await Promise.allSettled([...this.pending.values()]);this.cleanupAbort.abort();await Promise.allSettled([this.cleanupLoop,this.cleanupCheck]);}
  inspect(sessionId?:string){this.owner();return sessionId?{session:this.session(sessionId),grant:this.grant(sessionId),intents:this.db.all('SELECT * FROM computer_intents WHERE session_id=? ORDER BY created_at',sessionId),evidence:this.db.all('SELECT * FROM computer_evidence WHERE session_id=? ORDER BY captured_at',sessionId),network:this.db.all('SELECT * FROM computer_network_events WHERE session_id=? ORDER BY rowid DESC LIMIT 100',sessionId)}:{sessions:this.db.all('SELECT * FROM computer_sessions ORDER BY created_at DESC LIMIT 100'),available:process.platform==='linux',fixture_origins:this.fixtureCeiling,uploads:'deny',downloads:'deny'};}
}
