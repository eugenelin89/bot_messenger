import {createHash,randomUUID} from 'node:crypto';
import type {Company,ExecutionContext} from './company.js';
import {requireThat,strictObject,textField,type Task,type RuntimeBinding} from '../domain/model.js';
import type {ToolDefinition} from '../runtime/adapter.js';
import type {ReplyRequest} from '../domain/conversations.js';
import {DEFAULT_MANDATE_ENVELOPE as DEFAULTS,EVIDENCE_MODES,type MandateEnvelope,type Mandate,type OperatingCycle,type ReviewTurn,type Initiative,type StrategicDecision,type Observation,type ReviewSchedule,type ReviewOccurrence,type Recurrence} from '../domain/mandates.js';
import {systemClock,timezone,absoluteTime,nextReviewInstant,wallClockInstant,type Clock} from './company-clock.js';
import {mandateTools} from '../runtime/mandates.js';
const id=(kind:string)=>`${kind}_${randomUUID()}`;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids=(value:unknown,max=16):string[]=>{requireThat(Array.isArray(value)&&value.length<=max&&value.every(x=>typeof x==='string'&&x.length<=100)&&new Set(value).size===value.length,'Invalid bounded record IDs');return value;};
const optional=(a:Record<string,unknown>,key:string,max=2000)=>a[key]===null?null:textField(a,key,max);
interface Work {work_id:string;mandate_id:string;cycle_id:string;decision_id:string|null;task_id:string|null;group_id:string|null;execution_id:string;delivered:number;created_at:string}
interface PrivateTaskSession {session_id:string;task_id:string;mandate_id:string;worker_id:string;execution_id:string;runtime_reference:string|null;thread_name:string|null;tool_hash:string;state:string;created_at:string}
export class Mandates {
  clock:Clock=systemClock;
  /** Validation-only injected application fault. Never configured from HTTP/model input. */
  fault?: (point:string)=>void;
  constructor(readonly company:Company){}
  get db(){return this.company.store;}
  now(){return new Date(this.clock.now()).toISOString();}
  private human(){this.company.conversations.human();}
  private withdrawal(mandate:string){return this.db.get<{at:string|null}>('SELECT max(withdrawn_at) at FROM mandate_observations WHERE mandate_id=?',mandate)?.at??'';}
  private requireDerived(m:Mandate,createdAt:string){requireThat(createdAt>this.withdrawal(m.mandate_id),'Derived record predates evidence withdrawal; retained for owner history, unavailable for future worker delivery');}
  private audit(type:string,mandate:string,detail:object={},actor='system',execution:string|null=null){this.company.audit(`mandate_${type}`,actor,{mandate_id:mandate,...detail},null,null,execution);}
  mandate(value:string){const m=this.db.get<Mandate>('SELECT * FROM mandates WHERE mandate_id=?',value);requireThat(m,'Mandate not found');return m;}
  cycle(value:string){const c=this.db.get<OperatingCycle>('SELECT * FROM operating_cycles WHERE cycle_id=?',value);requireThat(c,'Operating cycle not found');return c;}
  schedule(value:string){const s=this.db.get<ReviewSchedule>('SELECT * FROM review_schedules WHERE schedule_id=?',value);requireThat(s,'Review schedule not found');return s;}
  envelope(m:Mandate):MandateEnvelope{return JSON.parse(m.envelope);}
  forConversation(c:string){const row=this.db.get<{mandate_id:string}>('SELECT mandate_id FROM mandate_conversations WHERE conversation_id=?',c);return row?this.mandate(row.mandate_id):undefined;}
  turn(request:string){return this.db.get<ReviewTurn>('SELECT * FROM mandate_turns WHERE request_id=?',request);}
  private parseEnvelope(value:unknown):MandateEnvelope {
    const a=strictObject(value,Object.keys(DEFAULTS)),e={...DEFAULTS,...a};
    for(const k of ['internal_tasks','working_groups','public_research','worker_schedules'] as const)requireThat(typeof e[k]==='boolean',`Invalid ${k}`);
    const bounds={max_executions:[2,80],max_tasks:[0,6],max_groups:[0,2],max_research_operations:[0,32],max_pending_work:[1,4],max_cycle_minutes:[1,120],max_cycles:[1,12],min_interval_seconds:[30,86400],max_horizon_days:[1,30],max_occurrences:[1,12],max_active_schedules:[1,3]} as const;
    for(const k of Object.keys(bounds) as (keyof typeof bounds)[]){const [min,max]=bounds[k];requireThat(Number.isInteger(e[k])&&e[k]>=min&&e[k]<=max,`${k} must be ${min}–${max}`);}
    timezone(e.timezone);requireThat(Array.isArray(e.evidence_modes)&&e.evidence_modes.length>0&&e.evidence_modes.every(x=>EVIDENCE_MODES.includes(x))&&new Set(e.evidence_modes).size===e.evidence_modes.length,'Choose explicit evidence modes');
    return e;
  }
  private coordinator(m:Mandate){
    this.human();const w=this.company.worker(m.coordinator_id);
    requireThat(w.enabled&&w.lifecycle==='persistent'&&w.capability_profile.includes('internal_message')&&this.db.get<{enabled:number}>('SELECT enabled FROM principals WHERE principal_id=?',w.principal_id)?.enabled,'Mandate coordinator is unavailable');
    requireThat(!this.company.providerUnresolved(w.worker_id),'Coordinator has an unresolved provider outcome');return w;
  }
  create(input:unknown){
    this.human();const a=strictObject(input,['title','objective','success_criteria','stop_criteria','constraints','resources','coordinator_id','envelope']);
    const envelope=this.parseEnvelope(a.envelope),coordinator=this.company.worker(textField(a,'coordinator_id',100));
    requireThat(coordinator.enabled&&coordinator.lifecycle==='persistent'&&coordinator.capability_profile.includes('internal_message'),'Select an eligible persistent coordinator');
    requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM mandates')!.n<100,'Mandate capacity reached');
    return this.db.transaction(()=>{
      const m=id('mandate'),time=this.now();
      this.db.run("INSERT INTO mandates VALUES (?,'human',?,?,?,?,?,?,?,?, 'draft',1,NULL,NULL,'No strategic decision yet',?,?)",m,textField(a,'title',200),textField(a,'objective',3000),textField(a,'success_criteria',2000),textField(a,'stop_criteria',2000),textField(a,'constraints',3000),textField(a,'resources',2000),JSON.stringify(envelope),coordinator.worker_id,time,time);
      const c=id('conversation');this.db.run("INSERT INTO conversations VALUES (?,?,'active',1,'human',?,?)",c,`Mandate: ${textField(a,'title',200)}`,time,time);
      this.db.run("INSERT INTO conversation_participants VALUES (?,'human',NULL,1)",c);this.db.run('INSERT INTO conversation_participants VALUES (?,?,?,1)',c,coordinator.principal_id,coordinator.worker_id);
      this.db.run('INSERT INTO mandate_conversations VALUES (?,?)',m,c);
      this.db.run("INSERT INTO conversation_messages VALUES (?,?,'human',NULL,NULL,?,NULL,NULL,?)",id('cmessage'),c,`Strategic mandate ${m}. Explicit owner activation and the stored envelope are required for work.`,time);
      this.audit('draft_created',m,{},'human');return this.mandate(m);
    });
  }
  list(){this.human();return {items:this.db.all<Mandate>('SELECT * FROM mandates ORDER BY rowid DESC LIMIT 100'),defaults:DEFAULTS,evidence_modes:EVIDENCE_MODES};}
  inspect(mandateId:string){this.human();const m=this.mandate(mandateId);return {mandate:m,envelope:this.envelope(m),paused:this.company.paused,clock_now:this.now(),
    cycles:this.db.all('SELECT * FROM operating_cycles WHERE mandate_id=? ORDER BY number DESC',mandateId),initiatives:this.db.all('SELECT * FROM initiatives WHERE mandate_id=? ORDER BY rowid',mandateId),
    decisions:this.db.all('SELECT * FROM strategic_decisions WHERE mandate_id=? ORDER BY rowid DESC LIMIT 100',mandateId),observations:this.db.all('SELECT * FROM mandate_observations WHERE mandate_id=? ORDER BY rowid DESC LIMIT 100',mandateId),
    work:this.db.all('SELECT * FROM mandate_internal_work WHERE mandate_id=? ORDER BY rowid',mandateId),schedules:this.db.all('SELECT * FROM review_schedules WHERE mandate_id=? ORDER BY rowid',mandateId),occurrences:this.db.all('SELECT * FROM review_occurrences WHERE mandate_id=? ORDER BY rowid DESC LIMIT 100',mandateId),
    executions:this.db.all('SELECT e.*,t.cycle_id FROM executions e JOIN mandate_turns t USING(request_id) JOIN operating_cycles c USING(cycle_id) WHERE c.mandate_id=? ORDER BY e.rowid DESC LIMIT 100',mandateId)};}
  control(input:unknown){this.human();const a=strictObject(input,['mandate_id','action']);const m=this.mandate(textField(a,'mandate_id',100)),action=textField(a,'action',30);
    return this.db.transaction(()=>{
      if(action==='activate'){requireThat(m.status==='draft','Only a draft can activate');this.coordinator(m);this.db.run("UPDATE mandates SET status='active',activated_at=?,updated_at=? WHERE mandate_id=?",this.now(),this.now(),m.mandate_id);this.openCycle(this.mandate(m.mandate_id),'owner_activation');}
      else if(action==='pause'){requireThat(m.status==='active','Only active mandates can pause');this.db.run("UPDATE mandates SET status='paused',updated_at=? WHERE mandate_id=?",this.now(),m.mandate_id);}
      else if(action==='resume'){requireThat(m.status==='paused','Only a paused mandate can resume; blocked outcomes require inspection');this.coordinator(m);this.db.run("UPDATE mandates SET status='active',updated_at=? WHERE mandate_id=?",this.now(),m.mandate_id);}
      else if(action==='review_now'){requireThat(m.status==='active','Activate or resume the mandate first');this.openCycle(m,'owner_review_now');}
      else if(action==='stop'||action==='cancel'){
        requireThat(!['completed','stopped','cancelled'].includes(m.status),'Mandate already terminal');this.stop(m,action==='stop'?'stopped':'cancelled');
      }else requireThat(false,'Unknown mandate control');
      this.audit(`owner_${action}`,m.mandate_id,{},'human');return this.mandate(m.mandate_id);
    });
  }
  private stop(m:Mandate,status:'stopped'|'cancelled'|'completed'){
    this.db.run('UPDATE mandates SET status=?,updated_at=? WHERE mandate_id=?',status,this.now(),m.mandate_id);
    this.db.run("UPDATE review_schedules SET status='cancelled',next_due=NULL,updated_at=? WHERE mandate_id=? AND status IN ('active','paused')",this.now(),m.mandate_id);
    this.db.run("UPDATE review_occurrences SET state='cancelled',reason='Mandate ended',completed_at=? WHERE mandate_id=? AND state IN ('due','held')",this.now(),m.mandate_id);
    this.db.run("UPDATE operating_cycles SET state='cancelled',error='Mandate ended',closed_at=? WHERE mandate_id=? AND state IN ('active','waiting','blocked')",this.now(),m.mandate_id);
    this.db.run("UPDATE conversation_requests SET status='cancelled',error='Mandate ended',updated_at=? WHERE status='queued' AND request_id IN (SELECT t.request_id FROM mandate_turns t JOIN operating_cycles c USING(cycle_id) WHERE c.mandate_id=?)",this.now(),m.mandate_id);
    for(const work of this.db.all<Work>('SELECT * FROM mandate_internal_work WHERE mandate_id=?',m.mandate_id)){
      if(work.task_id){const t=this.company.task(work.task_id);if(['queued','blocked','awaiting_approval'].includes(t.status))this.company.cancel(t.task_id);}
      if(work.group_id){this.db.run("UPDATE working_groups SET state='stopped',error='Mandate ended' WHERE group_id=? AND state IN ('draft','active','paused','blocked')",work.group_id);this.db.run("UPDATE conversation_requests SET status='cancelled',error='Mandate ended' WHERE status='queued' AND request_id IN (SELECT request_id FROM discussion_turns WHERE group_id=?)",work.group_id);}
    }
  }
  admitObservation(input:unknown){this.human();const a=strictObject(input,['mandate_id','cycle_id','initiative_id','mode','name','value','unit','observed_at','period','source','provenance','limitations','missingness','body']);const m=this.mandate(textField(a,'mandate_id',100));
    requireThat(this.envelope(m).evidence_modes.includes(a.mode as Observation['mode']),'Evidence mode is outside this mandate policy');
    const cycle=optional(a,'cycle_id',100),initiative=optional(a,'initiative_id',100);
    if(cycle)requireThat(this.cycle(cycle).mandate_id===m.mandate_id,'Cycle belongs to another mandate');
    if(initiative)requireThat(this.db.get('SELECT 1 FROM initiatives WHERE initiative_id=? AND mandate_id=?',initiative,m.mandate_id),'Initiative belongs to another mandate');
    const observed=a.observed_at===null?null:absoluteTime(a.observed_at,'observed_at');requireThat(!observed||Date.parse(observed)<=this.clock.now(),'Future observations cannot be admitted');
    requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM mandate_observations WHERE mandate_id=?',m.mandate_id)!.n<100,'Observation capacity reached');
    const body=textField(a,'body',4000),oid=id('observation');
    this.db.run("INSERT INTO mandate_observations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'mandate_private',?,?,?,?,'human',NULL)",oid,m.mandate_id,cycle,initiative,String(a.mode),textField(a,'name',200),optional(a,'value',500),optional(a,'unit',100),observed,optional(a,'period',300),this.now(),textField(a,'source',1000),textField(a,'provenance',1500),textField(a,'limitations',1500),textField(a,'missingness',1000),body,hash(body));
    this.audit('observation_admitted',m.mandate_id,{observation_id:oid,mode:a.mode,observed_at:observed},'human');return this.db.get<Observation>('SELECT * FROM mandate_observations WHERE observation_id=?',oid)!;
  }
  withdrawObservation(input:unknown){this.human();const a=strictObject(input,['observation_id']);const o=this.db.get<Observation>('SELECT * FROM mandate_observations WHERE observation_id=?',textField(a,'observation_id',100));requireThat(o,'Observation not found');return this.db.transaction(()=>{
    if(o.withdrawn_at)return {withdrawn:true};
    this.db.run('UPDATE mandate_observations SET withdrawn_at=coalesce(withdrawn_at,?) WHERE observation_id=?',this.now(),o.observation_id);
    // Models can quote observations into free-form derivatives without preserving
    // every dependency. Invalidate all earlier derived worker material conservatively,
    // while retaining the owner's complete historical records and provider fences.
    const conversation=this.db.get<{conversation_id:string}>('SELECT conversation_id FROM mandate_conversations WHERE mandate_id=?',o.mandate_id)!;
    this.db.run('UPDATE conversations SET scope_version=scope_version+1 WHERE conversation_id=?',conversation.conversation_id);
    for(const work of this.db.all<Work>('SELECT * FROM mandate_internal_work WHERE mandate_id=?',o.mandate_id)){
      if(work.group_id){const evidence=this.db.get<{evidence_id:string}>('SELECT evidence_id FROM group_evidence WHERE group_id=? LIMIT 1',work.group_id);if(evidence)this.company.discussions.withdrawEvidence({group_id:work.group_id,evidence_id:evidence.evidence_id});}
      if(work.task_id&&this.company.task(work.task_id).status==='queued')this.company.cancel(work.task_id);
    }
    for(const queued of this.db.all<{turn_id:string;request_id:string;cycle_id:string}>("SELECT t.* FROM mandate_turns t JOIN operating_cycles c USING(cycle_id) JOIN conversation_requests r USING(request_id) WHERE c.mandate_id=? AND r.status='queued'",o.mandate_id)){
      this.db.run("UPDATE conversation_requests SET status='cancelled',error='Evidence withdrawal replaced the pending scope' WHERE request_id=?",queued.request_id);this.db.run('UPDATE mandate_turns SET advanced=1 WHERE turn_id=?',queued.turn_id);
      try{this.enqueue(this.cycle(queued.cycle_id));}catch(error){this.block(this.cycle(queued.cycle_id),String(error));}
    }
    this.audit('observation_withdrawn',o.mandate_id,{observation_id:o.observation_id},'human');return {withdrawn:true};
  });}
  private openCycle(m:Mandate,trigger:string,occurrence?:ReviewOccurrence){
    requireThat(m.status==='active','Mandate is not active');this.coordinator(m);
    requireThat(!this.db.get("SELECT 1 FROM operating_cycles WHERE mandate_id=? AND state IN ('active','waiting','blocked')",m.mandate_id),'An earlier mandate cycle remains open');
    const n=this.db.get<{n:number}>('SELECT count(*) n FROM operating_cycles WHERE mandate_id=?',m.mandate_id)!.n+1;
    requireThat(n<=this.envelope(m).max_cycles,'Mandate cycle allowance exhausted; owner must author a new mandate');
    const c=id('cycle');this.db.run("INSERT INTO operating_cycles(cycle_id,mandate_id,mandate_version,number,occurrence_id,state,trigger,deadline,created_at) VALUES (?,?,?,?,?,'active',?,?,?)",c,m.mandate_id,m.version,n,occurrence?.occurrence_id??null,trigger,new Date(this.clock.now()+this.envelope(m).max_cycle_minutes*60000).toISOString(),this.now());
    this.db.run('UPDATE mandates SET current_cycle_id=?,updated_at=? WHERE mandate_id=?',c,this.now(),m.mandate_id);
    this.enqueue(this.cycle(c));this.audit('cycle_opened',m.mandate_id,{cycle_id:c,trigger,occurrence_id:occurrence?.occurrence_id??null});return this.cycle(c);
  }
  private reserve(c:OperatingCycle,count:number){requireThat(c.executions_reserved+count<=this.envelope(this.mandate(c.mandate_id)).max_executions,'Cycle model-execution envelope exhausted');this.db.run('UPDATE operating_cycles SET executions_reserved=executions_reserved+? WHERE cycle_id=?',count,c.cycle_id);}
  private enqueue(c:OperatingCycle){
    const m=this.mandate(c.mandate_id);this.reserve(this.cycle(c.cycle_id),1);
    const conversation=this.db.get<{conversation_id:string}>('SELECT conversation_id FROM mandate_conversations WHERE mandate_id=?',m.mandate_id)!;
    const r=this.company.conversations.queueMandate(conversation.conversation_id,m.coordinator_id);
    this.db.run('INSERT INTO mandate_turns VALUES (?,?,?,NULL,0,?)',id('mturn'),c.cycle_id,r.request_id,this.now());
    this.db.run("UPDATE operating_cycles SET state='active',retry_at=NULL WHERE cycle_id=?",c.cycle_id);
  }
  authorize(r:ReplyRequest){const m=this.forConversation(r.conversation_id);if(!m)return;const t=this.turn(r.request_id);requireThat(t,'Mandate request has no typed turn');const c=this.cycle(t.cycle_id);
    requireThat(m.status==='active'||m.status==='paused'&&r.status!=='queued','Mandate is held or ended');
    requireThat(c.state==='active'&&c.mandate_version===m.version&&m.coordinator_id===r.target_worker_id,'Mandate cycle or coordinator authority changed');
    requireThat(Date.parse(c.deadline)>this.clock.now(),'Mandate cycle deadline expired');
    const scheduled=this.unstartedSchedule(c);if(scheduled){requireThat(scheduled.schedule.version===scheduled.occurrence.schedule_version&&scheduled.schedule.status!=='cancelled'&&scheduled.schedule.status!=='paused'&&Date.parse(scheduled.schedule.end_at)>=this.clock.now(),'Scheduled review is paused, expired or superseded');}
  }
  private unstartedSchedule(c:OperatingCycle){if(!c.occurrence_id||this.db.get('SELECT 1 FROM executions e JOIN mandate_turns t USING(request_id) WHERE t.cycle_id=?',c.cycle_id))return;
    const occurrence=this.db.get<ReviewOccurrence>('SELECT * FROM review_occurrences WHERE occurrence_id=?',c.occurrence_id)!;return {occurrence,schedule:this.schedule(occurrence.schedule_id)};
  }
  held(conversation:string){const direct=this.forConversation(conversation),group=this.company.discussions.forConversation(conversation),work=group?this.internalWork(undefined,group.group_id):undefined,m=direct??(work?this.mandate(work.mandate_id):undefined);if(m?.status==='paused')return true;
    return !!(direct?.current_cycle_id&&this.unstartedSchedule(this.cycle(direct.current_cycle_id))?.schedule.status==='paused');
  }
  verify(context:ExecutionContext){const v=this.company.conversations.verify(context),m=this.forConversation(v.request.conversation_id),turn=this.turn(v.request.request_id);requireThat(m&&turn,'Mandate review execution required');const cycle=this.cycle(turn.cycle_id);return {...v,mandate:m,cycle,turn};}
  private acting(context:ExecutionContext){const v=this.verify(context);requireThat(v.mandate.status==='active'&&!v.turn.output,'Mandate is paused or this turn already committed');return v;}
  tools(){return mandateTools();}
  private works(cycle:string){return this.db.all<Work>('SELECT * FROM mandate_internal_work WHERE cycle_id=? ORDER BY rowid',cycle);}
  private workTerminal(w:Work){return w.task_id?['completed','failed','cancelled'].includes(this.company.task(w.task_id).status):['completed','blocked','stopped','archived'].includes(this.company.discussions.group(w.group_id!).state);}
  private pending(cycle:string){return this.works(cycle).filter(w=>!this.workTerminal(w));}
  context(context:ExecutionContext){const {mandate:m,cycle:c,worker,session}=this.verify(context),withdrawn=this.withdrawal(m.mandate_id);
    const result={mode:'mandate_review',clock_now:this.now(),mandate:{...m,envelope:this.envelope(m),strategic_state:withdrawn?'Earlier strategic prose is withheld after evidence withdrawal; evaluate currently available originals.':m.strategic_state},cycle:c,
      session:{session_id:session.session_id,generation:session.generation,previous_session_id:session.previous_session_id},
      worker:{worker_id:worker.worker_id,role:worker.role,display_name:worker.display_name},
      eligible_workers:this.company.discussions.eligible().map(w=>({worker_id:w.worker_id,display_name:w.display_name,role:w.role,manager_worker_id:w.manager_worker_id,research_eligible:this.company.research.eligible(w.worker_id)})),
      initiatives:this.db.all("SELECT initiative_id,CASE WHEN created_at>? THEN title ELSE '[Withheld after evidence withdrawal]' END title,status,cycle_id FROM initiatives WHERE mandate_id=? ORDER BY rowid DESC LIMIT 20",withdrawn,m.mandate_id),
      decisions:this.db.all("SELECT decision_id,cycle_id,disposition,CASE WHEN created_at>? THEN substr(recommendation,1,300) ELSE '[Withheld after evidence withdrawal]' END recommendation_preview,created_at FROM strategic_decisions WHERE mandate_id=? ORDER BY rowid DESC LIMIT 20",withdrawn,m.mandate_id),
      observations:this.db.all('SELECT observation_id,mode,name,cycle_id,initiative_id,observed_at,period,recorded_at,withdrawn_at FROM mandate_observations WHERE mandate_id=? ORDER BY rowid DESC LIMIT 100',m.mandate_id),
      previous_cycles:this.db.all("SELECT cycle_id,number,state,CASE WHEN created_at>? THEN substr(summary,1,800) ELSE '[Withheld after evidence withdrawal]' END fallible_summary_preview FROM operating_cycles WHERE mandate_id=? AND number<? ORDER BY number DESC LIMIT 2",withdrawn,m.mandate_id,c.number),
      internal_work:this.db.all<Work>('SELECT * FROM mandate_internal_work WHERE mandate_id=? ORDER BY rowid DESC LIMIT 30',m.mandate_id).map(w=>({...w,status:w.task_id?this.company.task(w.task_id).status:this.company.discussions.group(w.group_id!).state,result_ids:w.task_id?this.company.artifacts(w.task_id).map(a=>a.artifact_id):this.db.all<{synthesis_id:string}>("SELECT synthesis_id FROM group_syntheses WHERE group_id=? AND state='final'",w.group_id!).map(s=>s.synthesis_id)})),
      schedules:this.db.all<ReviewSchedule>('SELECT * FROM review_schedules WHERE mandate_id=? ORDER BY rowid DESC LIMIT 12',m.mandate_id).map(s=>({...s,purpose:s.created_at>withdrawn?s.purpose:'Purpose withheld after evidence withdrawal; owner history remains available'})),
      pending_occurrences:this.db.all("SELECT * FROM review_occurrences WHERE mandate_id=? AND state IN ('due','held','queued','blocked') LIMIT 12",m.mandate_id),
      authority:'Only typed internal mandate tools. No hiring, grants, protected approvals, repository writes, publication, spending or Computer Use. Public research uses independently granted Task/discussion paths. Catalogs/previews are not evidence delivery; retrieve original records before citing. Unknown values remain unknown. Summaries are fallible and never permission.'};
    requireThat(JSON.stringify(result).length<=48000,'Mandate context exceeds its bounded budget');return result;
  }
  private record(m:Mandate,recordId:string):unknown {
    const observation=this.db.get<Observation>('SELECT * FROM mandate_observations WHERE observation_id=? AND mandate_id=?',recordId,m.mandate_id);
    if(observation){requireThat(!observation.withdrawn_at&&this.envelope(m).evidence_modes.includes(observation.mode),'Observation was withdrawn or its mode is outside policy');requireThat(!observation.observed_at||Date.parse(observation.observed_at)<=this.clock.now(),'Future observation denied');return observation;}
    for(const [table,key] of [['strategic_decisions','decision_id'],['initiatives','initiative_id']] as const){const row=this.db.get<{created_at:string}>(`SELECT * FROM ${table} WHERE ${key}=? AND mandate_id=?`,recordId,m.mandate_id);if(row){this.requireDerived(m,row.created_at);return row;}}
    const work=this.db.get<Work>('SELECT * FROM mandate_internal_work WHERE mandate_id=? AND task_id=?',m.mandate_id,recordId);
    if(work){this.requireDerived(m,work.created_at);this.taskEvidence(recordId);const task=this.company.task(recordId);return {task,artifacts:this.company.artifacts(recordId).map(a=>({artifact_id:a.artifact_id,description:a.description,sha256:a.sha256})),evidence_mode:'internal_worker_analysis',limitation:'Worker interpretation is not a measured observation'};}
    const artifact=this.db.get<{task_id:string}>('SELECT a.task_id FROM artifacts a JOIN mandate_internal_work w USING(task_id) WHERE a.artifact_id=? AND w.mandate_id=?',recordId,m.mandate_id);
    if(artifact){this.requireDerived(m,this.internalWork(artifact.task_id)!.created_at);this.taskEvidence(artifact.task_id);return {artifact_id:recordId,task_id:artifact.task_id,content:this.company.artifactContent(recordId),evidence_mode:'internal_worker_analysis',limitation:'Worker interpretation is not a measured observation'};}
    const synthesis=this.db.get<{group_id:string;content:string;created_at:string}>('SELECT s.* FROM group_syntheses s JOIN mandate_internal_work w USING(group_id) WHERE s.synthesis_id=? AND w.mandate_id=? AND s.state=\'final\'',recordId,m.mandate_id);
    if(synthesis){this.requireDerived(m,synthesis.created_at);const group=this.company.discussions.group(synthesis.group_id);requireThat(group.state==='completed','Only a settled completed group synthesis is readable');requireThat(!this.db.get("SELECT 1 FROM audit_events WHERE type='discussion_sharing_withdrawn' AND json_extract(detail,'$.group_id')=?",group.group_id),'Shared evidence was withdrawn');return {...synthesis,evidence_mode:'working_group_interpretation',limitation:'Recommendations and interpretations are not observations or approvals'};}
    requireThat(false,'Record is absent or outside this mandate scope');
  }
  private delivered(context:ExecutionContext,m:Mandate,recordId:string){const original=this.record(m,recordId),receipt=this.db.get<{sha256:string}>('SELECT sha256 FROM mandate_evidence_delivery WHERE execution_id=? AND record_id=? AND mandate_id=?',context.executionId,recordId,m.mandate_id);requireThat(receipt?.sha256===hash(original),'Citation requires the complete current original record delivered in this execution');return original;}
  private substantiveEvidence(ref:string){
    if(this.db.get('SELECT 1 FROM mandate_observations WHERE observation_id=?',ref)||this.db.get("SELECT 1 FROM group_syntheses WHERE synthesis_id=? AND state='final'",ref))return true;
    const task=this.db.get<{task_id:string}>("SELECT task_id FROM tasks WHERE task_id=? UNION SELECT task_id FROM artifacts WHERE artifact_id=?",ref,ref);
    return !!(task&&this.db.get("SELECT 1 FROM tasks t JOIN executions e USING(task_id) WHERE t.task_id=? AND t.status='completed' AND e.status='completed' AND (t.result_summary IS NOT NULL OR EXISTS(SELECT 1 FROM artifacts a WHERE a.task_id=t.task_id))",task.task_id));
  }
  private read(context:ExecutionContext,m:Mandate,input:unknown){const a=strictObject(input,['record_id','offset']),recordId=textField(a,'record_id',100),record=this.record(m,recordId),serialized=JSON.stringify(record),digest=hash(record);const offset=a.offset===undefined?0:a.offset;requireThat(typeof offset==='number'&&Number.isInteger(offset)&&offset>=0&&offset<serialized.length,`offset must be an integer from 0 to ${serialized.length-1}; omit it or use 0 for the first page, then use only a non-null next_offset.`);
    const content=serialized.slice(offset,offset+6000);
    const used=this.db.get<{chars:number}>('SELECT chars FROM mandate_read_usage WHERE execution_id=?',context.executionId)?.chars??0;requireThat(used+content.length<=48000,'Mandate retrieval budget exhausted');
    this.db.run('INSERT INTO mandate_read_usage VALUES (?,?) ON CONFLICT(execution_id) DO UPDATE SET chars=chars+excluded.chars',context.executionId,content.length);
    this.db.run('INSERT OR IGNORE INTO mandate_read_chunks VALUES (?,?,?,?,?)',context.executionId,recordId,offset,content.length,digest);
    let end=0;for(const chunk of this.db.all<{offset:number;chars:number}>('SELECT offset,chars FROM mandate_read_chunks WHERE execution_id=? AND record_id=? AND sha256=? ORDER BY offset',context.executionId,recordId,digest)){if(chunk.offset>end)break;end=Math.max(end,chunk.offset+chunk.chars);}
    if(end>=serialized.length)this.db.run('INSERT OR IGNORE INTO mandate_evidence_delivery VALUES (?,?,?,?,?)',context.executionId,recordId,m.mandate_id,digest,this.now());
    return {record_id:recordId,offset,content,next_offset:offset+content.length<serialized.length?offset+content.length:null,total_characters:serialized.length,fully_delivered:end>=serialized.length,sha256:digest,next_action:end>=serialized.length?'Complete original delivered. Do not reread it this execution. Read a different needed record or make your next decision.':'Continue with the returned next_offset.',remaining_retrieval_characters:48000-used-content.length};
  }
  private commitTurn(context:ExecutionContext,output:object,summary:string){const {turn,request,worker}=this.acting(context),message=id('cmessage');
    this.db.run('UPDATE mandate_turns SET output=? WHERE turn_id=?',JSON.stringify(output),turn.turn_id);
    this.db.run('INSERT INTO conversation_messages VALUES (?,?,?,?,?,?,?,?,?)',message,request.conversation_id,worker.principal_id,worker.worker_id,context.executionId,summary,request.request_id,request.request_id,this.now());
    this.db.run("UPDATE conversation_requests SET response_message_id=?,status='completed',updated_at=? WHERE request_id=?",message,this.now(),request.request_id);return {committed:true,end_turn:true};
  }
  callTool(context:ExecutionContext,callId:string,name:string,input:unknown):unknown {
    requireThat(typeof callId==='string'&&callId.length>0&&callId.length<=256,'Invalid tool call ID');
    return this.db.transaction(()=>{
      const v=this.verify(context),m=v.mandate,c=v.cycle,e=this.envelope(m),digest=hash([name,input]);
      const old=this.db.get<{request_hash:string;result:string}>('SELECT * FROM tool_receipts WHERE execution_id=? AND call_id=?',context.executionId,callId);if(old){requireThat(old.request_hash===digest,'Tool replay mismatch');return JSON.parse(old.result);}
      this.acting(context);
      requireThat(mandateTools().some(t=>t.name===name),'Tool is outside mandate authority');
      requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM tool_receipts WHERE execution_id=?',context.executionId)!.n<20,'Mandate tool budget exhausted');let result:unknown;
      if(name==='inspect_mandate'){strictObject(input,[]);result=this.context(context);}
      else if(name==='read_mandate_record')result=this.read(context,m,input);
      else if(name==='propose_initiative'){
        const a=strictObject(input,['title','mechanism','expected_outcome','assumptions']);requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM initiatives WHERE mandate_id=?',m.mandate_id)!.n<20,'Initiative bound reached');const i=id('initiative');
        this.db.run("INSERT INTO initiatives VALUES (?,?,?,?,?,?,?,'proposed',?,?,?)",i,m.mandate_id,c.cycle_id,textField(a,'title',200),textField(a,'mechanism',2000),textField(a,'expected_outcome',2000),textField(a,'assumptions',2000),v.worker.principal_id,context.executionId,this.now());result=this.db.get<Initiative>('SELECT * FROM initiatives WHERE initiative_id=?',i);
      }else if(name==='record_strategic_decision'){
        const a=strictObject(input,['initiative_id','disposition','recommendation','rationale','alternatives','evidence_ids','contrary_evidence','unknowns','missing_evidence']);const initiative=optional(a,'initiative_id',100);if(initiative)requireThat(this.db.get('SELECT 1 FROM initiatives WHERE initiative_id=? AND mandate_id=?',initiative,m.mandate_id),'Initiative outside mandate');
        requireThat(['continue','iterate','pivot','stop','scale'].includes(String(a.disposition)),'Invalid strategic disposition');const cited=ids(a.evidence_ids);for(const ref of cited){this.delivered(context,m,ref);requireThat(!this.db.get('SELECT 1 FROM initiatives WHERE initiative_id=?',ref),'A hypothesis is not supporting evidence; cite observations or internal results');}const missing=optional(a,'missing_evidence',1500);
        const substantive=cited.some(ref=>this.substantiveEvidence(ref));requireThat(substantive||missing,'Cite delivered evidence or explicitly describe missing evidence; prior decisions and unexecuted Task metadata are not observations or settled results');
        requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM strategic_decisions WHERE cycle_id=?',c.cycle_id)!.n<6,'Decision bound reached');const d=id('decision'),previous=this.db.get<{decision_id:string}>('SELECT decision_id FROM strategic_decisions WHERE mandate_id=? ORDER BY rowid DESC LIMIT 1',m.mandate_id)?.decision_id??null;
        this.db.run('INSERT INTO strategic_decisions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',d,m.mandate_id,c.cycle_id,initiative,previous,String(a.disposition),textField(a,'recommendation',2000),textField(a,'rationale',4000),textField(a,'alternatives',3000),JSON.stringify(cited),textField(a,'contrary_evidence',2000),textField(a,'unknowns',2000),missing,v.worker.worker_id,context.executionId,this.now());
        if(initiative)this.db.run('UPDATE initiatives SET status=? WHERE initiative_id=?',a.disposition==='stop'?'stopped':'active',initiative);
        this.db.run('UPDATE mandates SET strategic_state=?,updated_at=? WHERE mandate_id=?',textField(a,'recommendation',2000),this.now(),m.mandate_id);result=this.db.get<StrategicDecision>('SELECT * FROM strategic_decisions WHERE decision_id=?',d);this.audit('decision_recorded',m.mandate_id,{cycle_id:c.cycle_id,decision_id:d},v.worker.principal_id,context.executionId);
      }else if(name==='assign_internal_task'){
        const a=strictObject(input,['decision_id','worker_id','objective','acceptance_criteria','constraints','evidence_ids']);requireThat(e.internal_tasks&&c.tasks_created<e.max_tasks,'Internal Task envelope exhausted or disabled');requireThat(this.pending(c.cycle_id).length<e.max_pending_work,'Pending internal work limit reached');
        const exported=ids(a.evidence_ids??[],8).map(ref=>({record_id:ref,original:this.delivered(context,m,ref)}));requireThat(JSON.stringify(exported).length<=12000,'Selected Task evidence exceeds 12000 characters; choose a smaller relevant packet');
        const decision=textField(a,'decision_id',100);requireThat(this.db.get('SELECT 1 FROM strategic_decisions WHERE decision_id=? AND cycle_id=?',decision,c.cycle_id),'Task must link a decision in this cycle');const worker=this.company.worker(textField(a,'worker_id',100));
        requireThat(v.worker.capability_profile.includes('create_task')&&worker.manager_worker_id===v.worker.worker_id,'Only existing assignment authority over direct reports is permitted');requireThat(worker.enabled&&worker.lifecycle==='persistent'&&['researcher','product_manager'].includes(worker.role),'Only bounded analysis/research specialists are supported');requireThat(!this.company.providerUnresolved(worker.worker_id),'Assignee has an unresolved provider outcome');
        this.reserve(this.cycle(c.cycle_id),1);
        const task=this.company.createTask(v.worker.principal_id,worker,{objective:textField(a,'objective',6000),acceptance_criteria:textField(a,'acceptance_criteria',3000),constraints:`Internal mandate analysis only; no external actions or new authority. Evidence modes must remain labelled. ${textField(a,'constraints',3000)}`},null,'research',context.executionId);
        this.db.run('INSERT INTO mandate_internal_work VALUES (?,?,?,?,?,NULL,?,0,?)',id('internal'),m.mandate_id,c.cycle_id,decision,task.task_id,context.executionId,this.now());
        for(const item of exported)this.db.run('INSERT INTO mandate_task_evidence VALUES (?,?,?,?)',task.task_id,item.record_id,hash(item.original),JSON.stringify(item.original));
        // Creation audit precedes the link in the shared Task method; remove only these
        // new private notification hints atomically, never original audit events.
        this.db.run('DELETE FROM client_events WHERE task_id=?',task.task_id);
        this.db.run('UPDATE operating_cycles SET tasks_created=tasks_created+1 WHERE cycle_id=?',c.cycle_id);result={task_id:task.task_id,status:task.status};
      }else if(name==='convene_working_group'){
        const a=strictObject(input,['topic','desired_output','constraints','participant_ids','facilitator_id','synthesizer_id','observation_ids','allow_research']);requireThat(e.working_groups&&c.groups_created<e.max_groups,'Group envelope exhausted or disabled');requireThat(this.pending(c.cycle_id).length<e.max_pending_work,'Pending internal work limit reached');requireThat(typeof a.allow_research==='boolean'&&(!a.allow_research||e.public_research),'Public research is outside mandate envelope');
        const observations=ids(a.observation_ids,8).map(ref=>{const o=this.delivered(context,m,ref) as Observation;requireThat(o.observation_id===ref,'Only admitted observations can be exported');return o;});
        this.reserve(this.cycle(c.cycle_id),24);const group=this.company.discussions.createForMandate(context,{topic:textField(a,'topic',300),desired_output:textField(a,'desired_output',2000),constraints:textField(a,'constraints',2000),participant_ids:ids(a.participant_ids,6),facilitator_id:textField(a,'facilitator_id',100),synthesizer_id:textField(a,'synthesizer_id',100),allow_research:a.allow_research},observations);
        this.db.run('INSERT INTO mandate_internal_work VALUES (?,?,?,NULL,NULL,?,?,0,?)',id('internal'),m.mandate_id,c.cycle_id,group.group_id,context.executionId,this.now());this.db.run('UPDATE operating_cycles SET groups_created=groups_created+1 WHERE cycle_id=?',c.cycle_id);result={group_id:group.group_id,state:group.state};
      }else if(name==='schedule_review')result=this.saveSchedule(input,m,v.worker.principal_id,context);
      else if(name==='wait_for_internal_work'){
        const a=strictObject(input,['summary']);requireThat(this.works(c.cycle_id).some(w=>!w.delivered),'No unreviewed internal work; model polling is not allowed');const summary=textField(a,'summary',4000);result=this.commitTurn(context,{action:'wait',summary},summary);
      }else{
        const a=strictObject(input,['summary','stop']);requireThat(typeof a.stop==='boolean','Choose explicit stop state');requireThat(!this.pending(c.cycle_id).length,'Internal work is not settled');requireThat(!this.works(c.cycle_id).some(w=>!w.delivered),'Wait for trusted result delivery and evaluate internal work before closing');
        requireThat(this.db.get('SELECT 1 FROM strategic_decisions WHERE cycle_id=?',c.cycle_id),'Record a strategic decision before closing');
        requireThat(a.stop||this.db.get("SELECT 1 FROM review_schedules WHERE mandate_id=? AND status='active' AND next_due IS NOT NULL",m.mandate_id)||this.db.get("SELECT 1 FROM review_occurrences WHERE mandate_id=? AND state IN ('due','held')",m.mandate_id),'Persist a future review or explicitly stop');
        const summary=textField(a,'summary',4000);result=this.commitTurn(context,{action:'close',summary,stop:a.stop},summary);
      }
      this.db.run('INSERT INTO tool_receipts VALUES (?,?,?,?)',context.executionId,callId,digest,JSON.stringify(result));this.audit('tool_completed',m.mandate_id,{tool:name},v.worker.principal_id,context.executionId);return result;
    });
  }
  saveOwnerSchedule(input:unknown){this.human();const a=strictObject(input,['mandate_id','schedule_id','purpose','initiative_id','due_at','first_local_date','recurrence_kind','interval_seconds','local_time','occurrence_limit','end_at']);const {mandate_id,first_local_date,...parameters}=a;
    return this.db.transaction(()=>{const m=this.mandate(textField({mandate_id},'mandate_id',100));
      if(first_local_date!==undefined&&first_local_date!==null){
        requireThat(a.recurrence_kind==='daily'&&a.due_at===null,'A first local date is only accepted for a daily review without an absolute due time');
        parameters.due_at=new Date(wallClockInstant(textField(a,'first_local_date',10),textField(a,'local_time',5),this.envelope(m).timezone)).toISOString();
      }
      return this.saveSchedule(parameters,m,'human');
    });}
  private saveSchedule(input:unknown,m:Mandate,actor:string,context?:ExecutionContext){
    const a=strictObject(input,['schedule_id','purpose','initiative_id','due_at','recurrence_kind','interval_seconds','local_time','occurrence_limit','end_at']),e=this.envelope(m);
    requireThat(m.status==='active'||!context&&m.status==='paused','Schedules require an activated mandate');requireThat(!context||e.worker_schedules,'Worker-created reviews are outside this envelope');
    const scheduleId=optional(a,'schedule_id',100),old=scheduleId?this.schedule(scheduleId):undefined;requireThat(!old||old.mandate_id===m.mandate_id&&old.status!=='cancelled'&&(old.status!=='exhausted'||!!this.db.get("SELECT 1 FROM review_occurrences WHERE schedule_id=? AND state IN ('due','held')",old.schedule_id)),'Schedule is terminal or outside mandate');
    const due=absoluteTime(a.due_at,'due_at'),end=absoluteTime(a.end_at,'end_at'),instant=Date.parse(due);
    requireThat(instant>=this.clock.now()+e.min_interval_seconds*1000&&instant<=this.clock.now()+e.max_horizon_days*86400000,'Review due time is outside the scheduling envelope');
    requireThat(Date.parse(end)>=instant&&Date.parse(end)<=this.clock.now()+e.max_horizon_days*86400000,'Schedule end is outside the horizon');
    requireThat(Number.isInteger(a.occurrence_limit)&&Number(a.occurrence_limit)>0&&Number(a.occurrence_limit)<=e.max_occurrences,'Occurrence count exceeds envelope');
    requireThat(!old||Number(a.occurrence_limit)>old.consumed,'Edit must retain consumed occurrences within its total limit');
    let recurrence:Recurrence;
    if(a.recurrence_kind==='once'){requireThat(a.interval_seconds===null&&a.local_time===null&&a.occurrence_limit===1,'One-time reviews have one occurrence and no recurrence fields');recurrence={kind:'once'};}
    else if(a.recurrence_kind==='interval'){requireThat(Number.isInteger(a.interval_seconds)&&Number(a.interval_seconds)>=e.min_interval_seconds&&Number(a.interval_seconds)<=30*86400&&a.local_time===null,'Interval is outside envelope');recurrence={kind:'interval',seconds:Number(a.interval_seconds)};}
    else {requireThat(a.recurrence_kind==='daily'&&a.interval_seconds===null,'Unsupported recurrence');const local=textField(a,'local_time',5);requireThat(/^([01]\d|2[0-3]):[0-5]\d$/.test(local),'Daily local time must be HH:mm');
      const p=new Intl.DateTimeFormat('en-CA',{timeZone:e.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);const fields=Object.fromEntries(p.map(x=>[x.type,x.value]));
      requireThat(wallClockInstant(`${fields.year}-${fields.month}-${fields.day}`,local,e.timezone)===instant,'First daily due instant must match the selected zone/time and DST rule');recurrence={kind:'daily',local_time:local};}
    const initiative=optional(a,'initiative_id',100);if(initiative)requireThat(this.db.get('SELECT 1 FROM initiatives WHERE initiative_id=? AND mandate_id=?',initiative,m.mandate_id),'Schedule initiative outside mandate');
    requireThat(old||this.db.get<{n:number}>("SELECT count(*) n FROM review_schedules WHERE mandate_id=? AND status IN ('active','paused')",m.mandate_id)!.n<e.max_active_schedules,'Active schedule limit reached');
    requireThat(old||this.db.get<{n:number}>('SELECT count(*) n FROM review_schedules WHERE mandate_id=?',m.mandate_id)!.n<24,'Retained schedule limit reached');
    const sid=old?.schedule_id??id('schedule'),version=(old?.version??0)+1;
    if(old){this.db.run("UPDATE review_schedules SET status=CASE WHEN status='paused' THEN 'paused' ELSE 'active' END,purpose=?,initiative_id=?,recurrence=?,end_at=?,occurrence_limit=?,version=?,next_due=?,updated_at=? WHERE schedule_id=?",textField(a,'purpose',1000),initiative,JSON.stringify(recurrence),end,Number(a.occurrence_limit),version,due,this.now(),sid);
      this.invalidateQueued(sid,'superseded','Schedule version edited');
    }else this.db.run("INSERT INTO review_schedules VALUES (?,?,?,'human',?,?,?,?,?,?,?,0,?,'active',?,'hold_one','coalesce',?,?)",sid,m.mandate_id,initiative,actor,textField(a,'purpose',1000),m.coordinator_id,e.timezone,JSON.stringify(recurrence),end,Number(a.occurrence_limit),version,due,this.now(),this.now());
    const result=this.schedule(sid);this.db.run('INSERT INTO review_schedule_versions VALUES (?,?,?,?,?)',sid,version,JSON.stringify(result),actor,this.now());this.audit('schedule_saved',m.mandate_id,{schedule_id:sid,version,actor},actor,context?.executionId??null);return result;
  }
  private invalidateQueued(scheduleId:string,state:'cancelled'|'superseded',reason:string){
    for(const o of this.db.all<ReviewOccurrence>("SELECT * FROM review_occurrences WHERE schedule_id=? AND state IN ('due','held','queued')",scheduleId)){
      if(o.cycle_id&&this.db.get('SELECT 1 FROM executions e JOIN mandate_turns t USING(request_id) WHERE t.cycle_id=?',o.cycle_id))continue;
      if(o.cycle_id){this.db.run("UPDATE conversation_requests SET status='cancelled',error=? WHERE status='queued' AND request_id IN (SELECT request_id FROM mandate_turns WHERE cycle_id=?)",reason,o.cycle_id);this.db.run("UPDATE operating_cycles SET state='cancelled',error=?,closed_at=? WHERE cycle_id=?",reason,this.now(),o.cycle_id);}
      this.db.run('UPDATE review_occurrences SET state=?,reason=?,completed_at=? WHERE occurrence_id=?',state,reason,this.now(),o.occurrence_id);
    }
  }
  controlSchedule(input:unknown){this.human();const a=strictObject(input,['schedule_id','action']),s=this.schedule(textField(a,'schedule_id',100)),action=textField(a,'action',20);requireThat(['pause','resume','cancel'].includes(action),'Invalid schedule control');
    return this.db.transaction(()=>{
      const pending=this.db.get("SELECT 1 FROM review_occurrences WHERE schedule_id=? AND state IN ('due','held','queued')",s.schedule_id);
      requireThat(s.status!=='cancelled','Cancelled schedules cannot be resurrected');requireThat(action==='cancel'||action==='pause'&&(s.status==='active'||s.status==='exhausted'&&!!pending)||action==='resume'&&s.status==='paused','Schedule state does not permit this control');
      this.db.run('UPDATE review_schedules SET status=?,next_due=CASE WHEN ? THEN NULL ELSE next_due END,updated_at=? WHERE schedule_id=?',action==='cancel'?'cancelled':action==='pause'?'paused':s.next_due?'active':'exhausted',Number(action==='cancel'),this.now(),s.schedule_id);
      if(action==='cancel')this.invalidateQueued(s.schedule_id,'cancelled','Owner cancelled schedule');
      this.audit(`schedule_${action}`,s.mandate_id,{schedule_id:s.schedule_id},'human');return this.schedule(s.schedule_id);
    });
  }
  /** Due discovery and consumption are one transaction; crash after it safely leaves
   * durable due work. Claim+cycle+request are a second atomic transaction. */
  tick(){
    const time=this.clock.now();
    for(const s of this.db.all<ReviewSchedule>("SELECT * FROM review_schedules WHERE status='active' AND next_due IS NOT NULL AND next_due<=? ORDER BY next_due",this.now())){
      this.db.transaction(()=>{
        let due=Date.parse(s.next_due!),through=due,next:number|null=due,count=0;const recurrence=JSON.parse(s.recurrence) as Recurrence;
        while(next!==null&&next<=time&&next<=Date.parse(s.end_at)&&s.consumed+count<s.occurrence_limit){through=next;count++;next=nextReviewInstant(next,recurrence,s.timezone);}
        if(!count){this.db.run("UPDATE review_schedules SET status='exhausted',next_due=NULL WHERE schedule_id=?",s.schedule_id);return;}
        const exhausted=s.consumed+count>=s.occurrence_limit||next===null||next>Date.parse(s.end_at);
        const held=this.db.get<ReviewOccurrence>("SELECT * FROM review_occurrences WHERE schedule_id=? AND schedule_version=? AND state IN ('due','held')",s.schedule_id,s.version);
        if(held)this.db.run('UPDATE review_occurrences SET through_at=?,missed_count=missed_count+? WHERE occurrence_id=?',new Date(through).toISOString(),count,held.occurrence_id);
        else this.db.run("INSERT OR IGNORE INTO review_occurrences VALUES (?,?,?,?,?,?,?,'due',NULL,NULL,?,NULL)",`occurrence_${hash([s.schedule_id,s.version,s.next_due])}`,s.schedule_id,s.version,s.mandate_id,s.next_due!,new Date(through).toISOString(),count-1,this.now());
        this.fault?.('after_next_calculation_before_commit');
        this.db.run('UPDATE review_schedules SET next_due=?,consumed=consumed+?,status=?,updated_at=? WHERE schedule_id=?',exhausted?null:new Date(next!).toISOString(),count,exhausted?'exhausted':'active',this.now(),s.schedule_id);
        this.audit('occurrence_due',s.mandate_id,{schedule_id:s.schedule_id,version:s.version,coalesced_occurrences:count,through_at:new Date(through).toISOString()});
      });
      this.fault?.('after_occurrence_before_claim');
    }
    for(const o of this.db.all<ReviewOccurrence>("SELECT * FROM review_occurrences WHERE state IN ('due','held') ORDER BY due_at,rowid"))this.db.transaction(()=>{
      const s=this.schedule(o.schedule_id),m=this.mandate(o.mandate_id);let state:ReviewOccurrence['state']='held',reason:string|null=null;
      if(s.version!==o.schedule_version){state='superseded';reason='Stale schedule version';}
      else if(s.status==='cancelled'||['stopped','completed','cancelled'].includes(m.status)){state='cancelled';reason='Schedule or mandate ended';}
      else if(this.clock.now()>Date.parse(s.end_at)){state='cancelled';reason='Schedule end expired before dispatch';}
      else if(this.company.paused||m.status==='paused'||s.status==='paused')reason='Paused; one coalesced occurrence is held';
      else if(m.status!=='active'){state='blocked';reason='Mandate is not active';}
      else if(this.db.get("SELECT 1 FROM operating_cycles WHERE mandate_id=? AND state IN ('active','waiting','blocked')",m.mandate_id))reason='Earlier strategic cycle remains open; hold one';
      else {
        try{this.coordinator(m);requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM operating_cycles WHERE mandate_id=?',m.mandate_id)!.n<this.envelope(m).max_cycles,'Mandate cycle allowance exhausted');}
        catch(error){state='blocked';reason=String(error);}
        if(!reason){
          const c=this.openCycle(m,'durable_schedule',o);
          this.fault?.('after_claim_before_execution');
          this.db.run("UPDATE review_occurrences SET state='queued',cycle_id=?,reason=NULL WHERE occurrence_id=?",c.cycle_id,o.occurrence_id);this.audit('occurrence_queued',m.mandate_id,{occurrence_id:o.occurrence_id,cycle_id:c.cycle_id});return;
        }
      }
      if(o.state!==state||o.reason!==reason){this.db.run('UPDATE review_occurrences SET state=?,reason=?,completed_at=? WHERE occurrence_id=?',state,reason,['cancelled','superseded'].includes(state)?this.now():null,o.occurrence_id);this.audit('occurrence_held',m.mandate_id,{occurrence_id:o.occurrence_id,state,reason});}
    });
  }
  private block(c:OperatingCycle,reason:string){
    this.db.run("UPDATE operating_cycles SET state='blocked',error=?,retry_at=NULL WHERE cycle_id=?",reason,c.cycle_id);
    this.db.run("UPDATE conversation_requests SET status='cancelled',error=? WHERE status='queued' AND request_id IN (SELECT request_id FROM mandate_turns WHERE cycle_id=?)",reason,c.cycle_id);
    for(const work of this.db.all<Work>('SELECT * FROM mandate_internal_work WHERE cycle_id=?',c.cycle_id)){
      // Active attempts settle through the dispatcher; never clear their outcome fences.
      if(work.task_id&&['queued','blocked','awaiting_approval'].includes(this.company.task(work.task_id).status))this.company.cancel(work.task_id);
    }
    if(c.occurrence_id)this.db.run("UPDATE review_occurrences SET state='blocked',reason=? WHERE occurrence_id=?",reason,c.occurrence_id);
    this.audit('cycle_blocked',c.mandate_id,{cycle_id:c.cycle_id,reason});
  }
  progress(){
    for(const initial of this.db.all<OperatingCycle>("SELECT * FROM operating_cycles WHERE state IN ('active','waiting')"))this.db.transaction(()=>{
      const c=this.cycle(initial.cycle_id),m=this.mandate(c.mandate_id);
      const scheduled=this.unstartedSchedule(c);
      if(scheduled&&(scheduled.schedule.version!==scheduled.occurrence.schedule_version||scheduled.schedule.status==='cancelled'||Date.parse(scheduled.schedule.end_at)<this.clock.now())){this.invalidateQueued(scheduled.schedule.schedule_id,'cancelled','Schedule ended before first review execution');return;}
      if(Date.parse(c.deadline)<=this.clock.now()){this.block(c,'Cycle wall-clock limit reached; no automatic extension');return;}
      if(m.status!=='active')return;
      if(this.db.get("SELECT 1 FROM executions e JOIN mandate_turns t USING(request_id) WHERE t.cycle_id=? AND e.status='running'",c.cycle_id))return;
      if(this.company.providerUnresolved(m.coordinator_id)){this.block(c,'Coordinator provider outcome unresolved; retained decisions are not replayed');return;}
      if(c.retry_at){if(Date.parse(c.retry_at)>this.clock.now())return;try{this.enqueue(c);}catch(error){this.block(c,String(error));}return;}
      const turn=this.db.get<ReviewTurn&{status:string;response_message_id:string|null}>("SELECT t.*,r.status,r.response_message_id FROM mandate_turns t JOIN conversation_requests r USING(request_id) WHERE t.cycle_id=? AND t.advanced=0 ORDER BY t.rowid DESC LIMIT 1",c.cycle_id);
      if(!turn||['queued','replying'].includes(turn.status))return;
      const execution=this.db.get<{status:string;execution_id:string}>('SELECT execution_id,status FROM executions WHERE request_id=? ORDER BY rowid DESC LIMIT 1',turn.request_id);
      if(turn.status!=='completed'||!turn.output||execution?.status!=='completed'){
        // A known failed invocation has no unknown fence. At most two fresh bounded
        // continuations reconstruct durable effects; committed decisions are retained.
        this.db.run('UPDATE mandate_turns SET advanced=1 WHERE turn_id=?',turn.turn_id);
        if(c.failures>=2){this.block(c,'Known review failure retry allowance exhausted; inspect retained attempts');return;}
        this.db.run("UPDATE operating_cycles SET state='waiting',failures=failures+1,retry_at=?,error='Known failed review; bounded backoff' WHERE cycle_id=?",new Date(this.clock.now()+30000*2**c.failures).toISOString(),c.cycle_id);this.audit('review_backoff',m.mandate_id,{cycle_id:c.cycle_id,attempt:c.failures+1});return;
      }
      const output=JSON.parse(turn.output) as {action:'wait'|'close';summary:string;stop?:boolean};
      if(output.action==='wait'){
        if(this.pending(c.cycle_id).length){this.db.run("UPDATE operating_cycles SET state='waiting' WHERE cycle_id=?",c.cycle_id);return;}
        this.db.run('UPDATE mandate_internal_work SET delivered=1 WHERE cycle_id=?',c.cycle_id);this.db.run('UPDATE mandate_turns SET advanced=1 WHERE turn_id=?',turn.turn_id);
        try{this.enqueue(c);}catch(error){this.block(c,String(error));}
      }else{
        this.fault?.('after_confirmed_decision_before_occurrence_completion');
        this.db.run('UPDATE mandate_turns SET advanced=1 WHERE turn_id=?',turn.turn_id);
        this.db.run("UPDATE operating_cycles SET state='closed',summary=?,closed_at=? WHERE cycle_id=?",output.summary,this.now(),c.cycle_id);
        if(c.occurrence_id)this.db.run("UPDATE review_occurrences SET state='completed',completed_at=?,reason=NULL WHERE occurrence_id=?",this.now(),c.occurrence_id);
        this.audit('cycle_closed',m.mandate_id,{cycle_id:c.cycle_id,occurrence_id:c.occurrence_id});
        if(output.stop)this.stop(m,'stopped');
      }
    });
    this.tick();
  }
  nextWake(){const candidates=[
    this.db.get<{time:string|null}>("SELECT min(next_due) time FROM review_schedules WHERE status='active'")?.time,
    this.db.get<{time:string|null}>("SELECT min(retry_at) time FROM operating_cycles c JOIN mandates m USING(mandate_id) WHERE c.state='waiting' AND m.status='active'")?.time,
    this.db.get<{time:string|null}>("SELECT min(deadline) time FROM operating_cycles WHERE state IN ('active','waiting')")?.time,
    this.db.get<{time:string|null}>("SELECT min(strftime('%Y-%m-%dT%H:%M:%fZ',s.end_at,'+0.001 seconds')) time FROM review_schedules s JOIN review_occurrences o USING(schedule_id) WHERE o.state='queued' AND NOT EXISTS (SELECT 1 FROM executions e JOIN mandate_turns t USING(request_id) WHERE t.cycle_id=o.cycle_id)")?.time,
  ].filter((x):x is string=>!!x);return candidates.sort()[0];}
  internalWork(taskId?:string,groupId?:string){return taskId?this.db.get<Work>('SELECT * FROM mandate_internal_work WHERE task_id=?',taskId):groupId?this.db.get<Work>('SELECT * FROM mandate_internal_work WHERE group_id=?',groupId):undefined;}
  taskSession(context:ExecutionContext,tools:ToolDefinition[]){const {task,worker}=this.company.verifyContext(context),work=this.internalWork(task.task_id);if(!work)return;
    const existing=this.db.get<PrivateTaskSession>('SELECT * FROM mandate_task_sessions WHERE task_id=?',task.task_id);
    if(existing){requireThat(existing.execution_id===context.executionId&&existing.tool_hash===hash(tools)&&existing.state!=='blocked','Private Task context no longer owns this execution');return existing;}
    requireThat(!this.company.providerUnresolved(worker.worker_id),'Prior provider outcome is unresolved');const sid=id('mandate_task_session');
    this.db.run("INSERT INTO mandate_task_sessions VALUES (?,?,?,?,?,NULL,NULL,?,'creating',?)",sid,task.task_id,work.mandate_id,worker.worker_id,context.executionId,hash(tools),this.now());
    return this.db.get<PrivateTaskSession>('SELECT * FROM mandate_task_sessions WHERE session_id=?',sid)!;
  }
  taskBinding(session:PrivateTaskSession):RuntimeBinding|undefined {if(session.state!=='active'||!session.runtime_reference)return;const w=this.company.worker(session.worker_id);return {worker_id:w.worker_id,runtime_type:w.runtime_type,runtime_reference:session.runtime_reference,workspace_path:w.workspace_path,created_at:session.created_at,thread_name:session.thread_name};}
  prepareTaskBinding(context:ExecutionContext,sessionId:string,binding:RuntimeBinding,activate=false){const {worker,task}=this.company.verifyContext(context),s=this.db.get<PrivateTaskSession>('SELECT * FROM mandate_task_sessions WHERE session_id=?',sessionId);
    requireThat(s&&s.worker_id===worker.worker_id&&s.task_id===task.task_id&&s.execution_id===context.executionId&&['creating','prepared','active'].includes(s.state),'Private Task context no longer owns execution');
    this.company.verifyWorkspace(worker,binding.workspace_path);requireThat(binding.worker_id===worker.worker_id&&binding.runtime_type===worker.runtime_type,'Private Task binding identity mismatch');
    for(const table of ['runtime_bindings','conversation_sessions','research_task_sessions','research_operations'])requireThat(!this.db.get(`SELECT 1 FROM ${table} WHERE runtime_reference=?`,binding.runtime_reference),'Private Task cannot reuse another work context');
    requireThat(!this.db.get('SELECT 1 FROM mandate_task_sessions WHERE runtime_reference=? AND session_id!=?',binding.runtime_reference,sessionId),'Private Task context belongs to another Task');
    requireThat(!s.runtime_reference||s.runtime_reference===binding.runtime_reference,'Private Task context cannot change implicitly');
    this.db.run('UPDATE mandate_task_sessions SET runtime_reference=?,thread_name=?,state=? WHERE session_id=?',binding.runtime_reference,binding.thread_name??null,activate?'active':'prepared',sessionId);
    if(activate)this.db.run('UPDATE executions SET runtime_reference=? WHERE execution_id=?',binding.runtime_reference,context.executionId);
  }
  internalEligible(task:Task){const w=this.internalWork(task.task_id);if(!w)return true;const m=this.mandate(w.mandate_id),c=this.cycle(w.cycle_id);return m.status==='active'&&['active','waiting'].includes(c.state)&&Date.parse(c.deadline)>this.clock.now()&&!this.db.get('SELECT 1 FROM executions WHERE task_id=?',task.task_id);}
  authorizeInternal(taskId?:string,groupId?:string){const work=this.internalWork(taskId,groupId);if(!work)return;
    const m=this.mandate(work.mandate_id),c=this.cycle(work.cycle_id);this.requireDerived(m,work.created_at);requireThat(['active','paused'].includes(m.status)&&['active','waiting'].includes(c.state)&&Date.parse(c.deadline)>this.clock.now(),'Internal work mandate is ended, blocked or expired');
    if(taskId)this.taskEvidence(taskId);
  }
  taskEvidence(taskId:string){const work=this.internalWork(taskId);if(!work)return undefined;const m=this.mandate(work.mandate_id);return this.db.all<{record_id:string;sha256:string;content:string}>('SELECT record_id,sha256,content FROM mandate_task_evidence WHERE task_id=?',taskId).map(e=>{requireThat(hash(this.record(m,e.record_id))===e.sha256,'Selected Task evidence changed or was withdrawn');return {...e,evidence:JSON.parse(e.content),content:undefined};});}
  researchAuthority(context:ExecutionContext,reserve=false){const execution=this.company.execution(context.executionId);
    const conversation=execution.origin==='conversation'?this.company.conversations.request(execution.request_id).conversation_id:undefined;
    requireThat(!conversation||!this.forConversation(conversation),'Coordinator research must use existing authorized Task or discussion paths');
    const group=conversation?this.company.discussions.forConversation(conversation):undefined,work=this.internalWork(execution.task_id??undefined,group?.group_id);if(!work)return;
    const m=this.mandate(work.mandate_id);requireThat(m.status==='active'&&this.envelope(m).public_research,'Mandate does not permit new research');this.authorizeInternal(work.task_id??undefined,work.group_id??undefined);
    const used=this.db.get<{n:number}>(`SELECT count(*) n FROM research_operations r JOIN executions e USING(execution_id) WHERE EXISTS
      (SELECT 1 FROM mandate_internal_work w LEFT JOIN working_groups g USING(group_id) WHERE w.cycle_id=? AND (w.task_id=e.task_id OR g.conversation_id=r.scope_id))`,work.cycle_id)!.n;
    if(reserve)requireThat(used<this.envelope(m).max_research_operations,'Mandate research envelope exhausted');
  }
}
