import {randomUUID} from 'node:crypto';
import type {Company,ExecutionContext} from './company.js';
import {requireThat,strictObject,textField} from '../domain/model.js';
import type {Mandate,StrategicDecision} from '../domain/mandates.js';
import {absoluteTime} from './company-clock.js';
import {BUSINESS_POLICY,approvedIntent,baselineDefinition,businessHash,contentHash,exactEdit,gitBlobHash,markdownTarget,
  type BusinessAdapter,type BusinessGrant,type BusinessEvidence,type BusinessBaseline,type BusinessApproval,type BusinessAttempt,
  type BusinessReceipt,type ExternalAction,type MarkdownSnapshot,type MarkdownResult} from '../domain/business.js';

const id=(kind:string)=>`${kind}_${randomUUID()}`;
const pending=['awaiting_approval','approved','executing'];
export class BusinessOperations {
  adapter?:BusinessAdapter;
  private active=new Set<Promise<void>>();
  private reading=new Map<string,Promise<BusinessEvidence>>();
  private reconciling=new Set<Promise<unknown>>();
  private stopping=false;
  /** Controlled fixtures only; never configured through model or HTTP input. */
  fault?: (point:string)=>void;
  constructor(readonly company:Company){}
  private get db(){return this.company.store;}
  private now(){return this.company.mandates.now();}
  private human(){this.company.conversations.human();}
  private insert(table:string,value:object){const entries=Object.entries(value);this.db.run(`INSERT INTO ${table} (${entries.map(([k])=>k).join(',')}) VALUES (${entries.map(()=>'?').join(',')})`,...entries.map(([,v])=>v));}
  private audit(event:string,detail:object={},actor='system'){this.company.audit(`mandate_business_${event}`,actor,detail);}
  grant(grantId:string){const g=this.db.get<BusinessGrant>('SELECT * FROM business_grants WHERE grant_id=?',grantId);requireThat(g,'Business grant not found');return g;}
  action(actionId:string){const a=this.db.get<ExternalAction>('SELECT * FROM external_actions WHERE action_id=?',actionId);requireThat(a,'External action not found');return a;}
  private adapterFor(g:BusinessGrant){requireThat(this.adapter&&this.adapter.identity===g.adapter&&this.adapter.mode===g.mode,'Exact business adapter is unavailable');return this.adapter;}
  private currentGrant(g:BusinessGrant,read=false){
    this.human();const m=this.company.mandates.mandate(g.mandate_id),w=this.company.worker(g.worker_id);
    requireThat(!g.revoked_at&&Date.parse(g.expires_at)>this.company.mandates.clock.now()&&g.policy_version===BUSINESS_POLICY,'Business grant expired or revoked');
    requireThat(w.enabled&&w.capability_profile.includes('internal_message')&&m.coordinator_id===w.worker_id&&this.db.get<{enabled:number}>('SELECT enabled FROM principals WHERE principal_id=?',w.principal_id)?.enabled,'Business worker is unavailable');
    requireThat(read?['draft','active','paused'].includes(m.status):m.status==='active','Business mandate is not active');
    this.adapterFor(g);return m;
  }
  authorize(input:unknown){this.human();const a=strictObject(input,['mandate_id','target','credential_ref','expires_at','max_actions','mode']);
    const m=this.company.mandates.mandate(textField(a,'mandate_id',100)),target=markdownTarget(a.target),expires=absoluteTime(a.expires_at,'expires_at');
    requireThat(['draft','active'].includes(m.status),'Grant requires a draft or active mandate');
    requireThat(Date.parse(expires)>this.company.mandates.clock.now()&&Date.parse(expires)<=this.company.mandates.clock.now()+86400000,'Business grant lasts at most 24 hours');
    requireThat(Number.isInteger(a.max_actions)&&Number(a.max_actions)>=1&&Number(a.max_actions)<=3,'Choose one to three proposed actions');
    requireThat(a.mode==='real_live'||a.mode==='simulated_fixture','Choose explicit live or fixture provider');
    requireThat(this.adapter?.mode===a.mode,'Requested provider mode is unavailable');
    const credential=textField(a,'credential_ref',80);requireThat(/^[a-zA-Z0-9_-]+$/.test(credential),'Credential reference must be an opaque key');
    requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM business_grants')!.n<100,'Business grant capacity reached');
    const g:BusinessGrant={grant_id:id('business_grant'),mandate_id:m.mandate_id,worker_id:m.coordinator_id,provider:'github',adapter:this.adapter.identity,target:JSON.stringify(target),credential_ref:credential,policy_version:BUSINESS_POLICY,mode:a.mode,max_actions:Number(a.max_actions),expires_at:expires,created_at:this.now(),issued_by:'human',revoked_at:null};
    this.db.transaction(()=>{this.insert('business_grants',g);this.audit('grant_issued',{grant_id:g.grant_id,mandate_id:m.mandate_id},'human');});return g;
  }
  private envelope(a:ExternalAction){requireThat(businessHash(approvedIntent(a))===a.intent_hash,'External intent integrity check failed');return a;}
  private effectAuthority(a:ExternalAction,settled=true){
    this.envelope(a);const g=this.grant(a.grant_id),m=this.currentGrant(g),c=this.company.mandates.cycle(a.cycle_id);
    requireThat(!this.company.paused&&!this.stopping,'Business dispatch is paused');
    requireThat(m.version===a.mandate_version&&m.current_cycle_id===a.cycle_id&&['active','waiting'].includes(c.state)&&Date.parse(c.deadline)>this.company.mandates.clock.now(),'Originating cycle is no longer current or within deadline');
    requireThat(Date.parse(a.expires_at)>this.company.mandates.clock.now()&&g.target===a.target&&g.credential_ref===a.credential_ref&&g.worker_id===a.worker_id&&g.policy_version===a.policy_version&&g.adapter===a.adapter,'Exact external scope expired or changed');
    requireThat(!this.db.get('SELECT 1 FROM business_controls WHERE action_id=?',a.action_id),'Action was cancelled or revoked');
    const evidence=this.db.get<BusinessEvidence>('SELECT * FROM business_evidence WHERE evidence_id=?',a.baseline_id);
    requireThat(evidence&&!evidence.withdrawn_at,'Baseline is no longer authorized');
    requireThat(a.created_at>this.withdrawal(a.mandate_id),'External intent predates evidence withdrawal');
    const decision=this.db.get<StrategicDecision>('SELECT * FROM strategic_decisions WHERE decision_id=?',a.decision_id);
    requireThat(decision&&decision.created_at>this.withdrawal(a.mandate_id),'Originating decision predates evidence withdrawal');
    requireThat(!this.company.providerUnresolved(a.worker_id),'Proposing worker has an unresolved model outcome');
    if(settled){requireThat(!this.db.get("SELECT 1 FROM executions WHERE worker_id=? AND status='running'",a.worker_id),'Worker is still executing model work');const original=this.db.get<{status:string;output:string|null}>('SELECT e.status,t.output FROM executions e JOIN mandate_turns t USING(request_id) WHERE e.execution_id=?',a.execution_id);
      requireThat(original?.status==='completed'&&original.output&&JSON.parse(original.output).action==='action_wait'&&JSON.parse(original.output).action_id===a.action_id,'Proposing worker must settle its explicit action wait before execution');}
    return g;
  }
  private resourceFence(a:ExternalAction){const t=markdownTarget(JSON.parse(a.target));requireThat(!this.db.get("SELECT 1 FROM external_actions WHERE action_id<>? AND json_extract(target,'$.repository_id')=? AND json_extract(target,'$.branch')=? AND json_extract(target,'$.path')=? AND status IN ('executing','outcome_unknown')",a.action_id,t.repository_id,t.branch,t.path),'Target has an active or unknown external effect');}
  propose(context:ExecutionContext,input:unknown){
    const {mandate:m,cycle:c,worker,turn}=this.company.mandates.verify(context);
    requireThat(m.status==='active'&&c.state==='active'&&!turn.output&&!this.company.paused,'Active uncommitted mandate turn required');
    const a=strictObject(input,['grant_id','decision_id','baseline_id','edit','commit_message','rationale','measurement','risk','compensation','privacy','estimated_cost','expires_at','compensation_for']);
    const g=this.grant(textField(a,'grant_id',100));this.currentGrant(g);
    requireThat(g.mandate_id===m.mandate_id&&g.worker_id===worker.worker_id,'Business grant belongs to another scope');
    const decision=this.db.get<StrategicDecision>('SELECT * FROM strategic_decisions WHERE decision_id=? AND mandate_id=? AND cycle_id=? AND worker_id=?',textField(a,'decision_id',100),m.mandate_id,c.cycle_id,worker.worker_id);
    requireThat(decision?.initiative_id&&decision.created_at>this.withdrawal(m.mandate_id),'Action requires a current decision linked to an initiative after any evidence withdrawal');
    const baselineId=textField(a,'baseline_id',100),evidence=this.workerRecord(m,baselineId) as BusinessEvidence|undefined;
    requireThat(evidence?.grant_id===g.grant_id&&evidence.category==='baseline','Action needs its exact granted baseline');
    requireThat(this.db.get<{sha256:string}>('SELECT sha256 FROM mandate_evidence_delivery WHERE execution_id=? AND record_id=?',context.executionId,baselineId)?.sha256===businessHash(evidence),'Read the complete original baseline before proposing');
    const row=this.db.get<{snapshot:string}>('SELECT snapshot FROM business_snapshots WHERE evidence_id=?',baselineId);requireThat(row,'Baseline has no trusted provider snapshot');
    const snapshot=JSON.parse(row.snapshot) as MarkdownSnapshot,edit=exactEdit(snapshot.content,a.edit);
    requireThat(JSON.stringify(snapshot.target)===g.target,'Baseline target differs from grant');
    const existing=this.db.get<ExternalAction>('SELECT * FROM external_actions WHERE grant_id=? AND baseline_id=? AND content_sha256=?',g.grant_id,baselineId,contentHash(edit.content));
    requireThat(existing||!this.db.get('SELECT 1 FROM external_actions WHERE execution_id=?',context.executionId),'Only one distinct external action per coordinator turn');
    requireThat(existing||this.db.get<{n:number}>('SELECT count(*) n FROM external_actions WHERE grant_id=?',g.grant_id)!.n<g.max_actions,'Business action proposal allowance exhausted');
    const expires=absoluteTime(a.expires_at,'expires_at');requireThat(Date.parse(expires)>this.company.mandates.clock.now()&&expires<=c.deadline&&expires<=g.expires_at,'Approval expiry must fit current cycle and grant');
    const compensation=a.compensation_for===null?null:textField(a,'compensation_for',100);
    if(compensation){const prior=this.action(compensation);requireThat(prior.mandate_id===m.mandate_id&&prior.target===g.target&&prior.status==='succeeded','Compensation needs a confirmed effect in this mandate/target');requireThat(edit.content===prior.previous_content,'Compensation must restore the exact retained prior bytes');}
    const aid=existing?.action_id??id('action'),created=existing?.created_at??this.now();
    const result:ExternalAction={action_id:aid,mandate_id:m.mandate_id,mandate_version:m.version,cycle_id:c.cycle_id,initiative_id:decision.initiative_id,decision_id:decision.decision_id,worker_id:worker.worker_id,execution_id:context.executionId,grant_id:g.grant_id,provider:'github',adapter:g.adapter,action_type:'replace_existing_markdown',target:g.target,credential_ref:g.credential_ref,policy_version:g.policy_version,baseline_id:baselineId,expected_blob:snapshot.blob,expected_head:snapshot.head,previous_content:snapshot.content,content:edit.content,content_sha256:contentHash(edit.content),content_blob:gitBlobHash(edit.content),edit:JSON.stringify(edit.edit),commit_message:`${textField(a,'commit_message',200)}\n\nBotSquad-Action: ${aid}`,rationale:textField(a,'rationale',2000),measurement:textField(a,'measurement',2000),risk:textField(a,'risk',2000),compensation:textField(a,'compensation',2000),privacy:textField(a,'privacy',1000),estimated_cost:textField(a,'estimated_cost',500),idempotency_key:aid,intent_hash:'',expires_at:expires,created_at:created,status:'awaiting_approval',updated_at:created,error:null,compensation_for:compensation};
    result.intent_hash=businessHash(approvedIntent(result));
    if(existing){requireThat(existing.intent_hash===result.intent_hash,'Duplicate effect has a different immutable proposal; inspect the existing action');return this.summary(existing);}
    this.resourceFence(result);this.insert('external_actions',result);this.audit('proposed',{action_id:aid,mandate_id:m.mandate_id},worker.principal_id);return this.summary(result);
  }
  summary(a:ExternalAction){const {content,previous_content,credential_ref,...result}=a;return {...result,content_bytes:Buffer.byteLength(content),credential_boundary:'Trusted adapter only; opaque credential reference hidden from worker'};}
  decide(input:unknown){this.human();const p=strictObject(input,['action_id','intent_hash','decision']);requireThat(p.decision==='approved'||p.decision==='denied','Choose approve or deny');
    return this.db.transaction(()=>{const a=this.action(textField(p,'action_id',100));this.envelope(a);requireThat(p.intent_hash===a.intent_hash,'Owner decision must bind the displayed exact intent');
      const old=this.db.get<BusinessApproval>('SELECT * FROM business_approvals WHERE action_id=?',a.action_id);
      if(old){requireThat(old.decision===p.decision&&old.intent_hash===p.intent_hash,'This exact action already has a different owner decision');return old;}
      requireThat(a.status==='awaiting_approval','Action is no longer awaiting approval');if(p.decision==='approved')this.effectAuthority(a,false);
      const approval:BusinessApproval={approval_id:id('business_approval'),action_id:a.action_id,intent_hash:a.intent_hash,decision:p.decision as 'approved'|'denied',decided_by:'human',decided_at:this.now(),expires_at:a.expires_at};this.insert('business_approvals',approval);
      this.db.run('UPDATE external_actions SET status=?,updated_at=? WHERE action_id=?',p.decision==='approved'?'approved':'denied',this.now(),a.action_id);this.audit(`owner_${p.decision}`,{action_id:a.action_id},'human');return approval;});
  }
  control(input:unknown){this.human();const p=strictObject(input,['action_id','grant_id','operation']);requireThat(['cancel','revoke','request_compensation'].includes(String(p.operation)),'Unknown business control');
    return this.db.transaction(()=>{const actionId=p.action_id===null?null:textField(p,'action_id',100),grantId=p.grant_id===null?null:textField(p,'grant_id',100);requireThat(Boolean(actionId)!==Boolean(grantId),'Select exactly one action or grant');
      if(p.operation==='request_compensation')requireThat(actionId&&this.action(actionId).status==='succeeded','Compensation proposal request needs a confirmed action');
      else if(grantId){const g=this.grant(grantId);if(!g.revoked_at)this.db.run('UPDATE business_grants SET revoked_at=? WHERE grant_id=?',this.now(),grantId);}
      else this.action(actionId!);
      this.insert('business_controls',{control_id:id('business_control'),action_id:actionId,grant_id:grantId,operation:p.operation,actor:'human',created_at:this.now()});
      if(p.operation!=='request_compensation')this.db.run(`UPDATE external_actions SET status=?,updated_at=? WHERE ${actionId?'action_id':'grant_id'}=? AND status IN ('awaiting_approval','approved')`,p.operation==='revoke'?'revoked':'cancelled',this.now(),actionId??grantId!);
      this.audit('owner_control',{action_id:actionId,grant_id:grantId,operation:p.operation},'human');return {recorded:true,limitation:'Future transmission is denied. Already transmitted effects are retained and cannot be undone by cancellation.'};});
  }
  private saveEvidence(g:BusinessGrant,s:MarkdownSnapshot,baseline:BusinessBaseline,cycleId:string|null,actionId:string|null,category:'baseline'|'operational') {
    const eid=id('business_evidence'),body=s.content.slice(0,12000),mode=g.mode==='simulated_fixture'?'simulated_fixture':category==='baseline'?'real_read_only':'real_live';
    const evidence:BusinessEvidence={evidence_id:eid,mandate_id:g.mandate_id,cycle_id:cycleId,action_id:actionId,grant_id:g.grant_id,mode,category,provider:'github',source_identity:JSON.stringify(s.target),observed_at:s.retrieved_at,period:baseline.window,retrieved_at:this.now(),metric:category==='baseline'?'document_state':'approved_document_present',value:category==='baseline'?s.blob:actionId?String(s.blob===this.action(actionId).content_blob):null,unit:category==='baseline'?'git_blob_sha':'boolean',baseline:JSON.stringify(baseline),segmentation:'Exact configured repository, branch and document',missingness:baseline.missing_fields,freshness:baseline.freshness,privacy_scope:baseline.privacy,reliability:`One provider read; repository commit time is ${s.provider_time??'unknown'}. ${baseline.attribution_limitations}`,source_ref:s.source_ref,source_hash:contentHash(s.content),body:`${mode.toUpperCase()} ${category}. Exact document source, first ${body.length} of ${s.content.length} characters:\n${body}`,sha256:'',admitted_by:'trusted_adapter',withdrawn_at:null};
    evidence.sha256=businessHash({...evidence,sha256:undefined,withdrawn_at:undefined});this.insert('business_evidence',evidence);this.insert('business_snapshots',{evidence_id:eid,snapshot:JSON.stringify(s)});return evidence;
  }
  async observe(input:unknown,context?:ExecutionContext,callId?:string,signal?:AbortSignal):Promise<BusinessEvidence>{
    requireThat(!this.stopping&&!signal?.aborted,'Business read is stopped or interrupted');
    if(!context)this.human();const p=strictObject(input,['grant_id','baseline','action_id']),g=this.grant(textField(p,'grant_id',100));this.currentGrant(g,true);
    const baseline=baselineDefinition(p.baseline),actionId=p.action_id===null?null:textField(p,'action_id',100);
    if(actionId){const a=this.action(actionId);requireThat(a.grant_id===g.grant_id,'Observed action outside grant');requireThat(['succeeded','outcome_unknown'].includes(a.status),'Post-action observation requires a transmitted confirmed or unknown action');}
    const verify=()=>{requireThat(!this.stopping&&!signal?.aborted,'Business read is stopped or interrupted');this.currentGrant(this.grant(g.grant_id),true);if(context){const v=this.company.mandates.verify(context);requireThat(v.mandate.mandate_id===g.mandate_id&&v.worker.worker_id===g.worker_id&&!v.turn.output&&v.mandate.status==='active','Business observation scope is stale');requireThat(this.company.mandates.envelope(v.mandate).evidence_modes.includes(g.mode==='simulated_fixture'?'simulated_fixture':actionId?'real_live':'real_read_only'),'Business evidence mode outside mandate');}};
    verify();const digest=businessHash(p);
    if(context){requireThat(typeof callId==='string'&&callId.length>0&&callId.length<=256,'Invalid business read call');const old=this.db.get<{read_id:string;request_hash:string;evidence_id:string|null;state:string}>('SELECT * FROM business_reads WHERE execution_id=? AND call_id=?',context.executionId,callId!);
      if(old){requireThat(old.request_hash===digest,'Business read replay mismatch');if(old.evidence_id)return this.workerRecord(this.company.mandates.mandate(g.mandate_id),old.evidence_id) as BusinessEvidence;const running=this.reading.get(old.read_id);requireThat(running,'Prior read failed; no blind callback replay');return running;}}
    requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM business_reads WHERE grant_id=?',g.grant_id)!.n<12,'Business source read budget exhausted');
    requireThat(!this.db.get("SELECT 1 FROM business_reads WHERE grant_id=? AND state='pending'",g.grant_id),'One source read at a time per grant');
    const rid=id('business_read');this.insert('business_reads',{read_id:rid,grant_id:g.grant_id,execution_id:context?.executionId??null,call_id:callId??null,request_hash:digest,state:'pending',evidence_id:null,created_at:this.now(),error:null});
    const run=(async()=>{try{const snapshot=await this.adapterFor(g).read(markdownTarget(JSON.parse(g.target)),g.credential_ref,signal);verify();
      requireThat(JSON.stringify(snapshot.target)===g.target&&snapshot.blob===gitBlobHash(snapshot.content)&&Buffer.byteLength(snapshot.content)<=65536,'Invalid trusted source snapshot');
      return this.db.transaction(()=>{const cycle=context?this.company.mandates.verify(context).cycle.cycle_id:this.company.mandates.mandate(g.mandate_id).current_cycle_id;
        const e=this.saveEvidence(g,snapshot,baseline,cycle,actionId,actionId?'operational':'baseline');this.db.run("UPDATE business_reads SET state='succeeded',evidence_id=? WHERE read_id=?",e.evidence_id,rid);this.audit('observed',{evidence_id:e.evidence_id,mandate_id:g.mandate_id});return e;});
    }catch{this.db.run("UPDATE business_reads SET state='failed',error='Source unavailable, stale or unauthorized' WHERE read_id=?",rid);throw new Error('Business source unavailable, stale or unauthorized; no observation fabricated');}finally{this.reading.delete(rid);}})();this.reading.set(rid,run);return run;
  }
  private async execute(actionId:string){
    let attempt:BusinessAttempt|undefined;
    try {
      const a=this.action(actionId);this.effectAuthority(a);this.resourceFence(a);
      attempt=this.db.transaction(()=>{const current=this.action(actionId);requireThat(current.status==='approved','Action is not executable');this.effectAuthority(current);this.resourceFence(current);
        const t:BusinessAttempt={attempt_id:id('business_attempt'),action_id:actionId,intent_hash:a.intent_hash,state:'preparing',started_at:this.now(),transmitted_at:null,finished_at:null,error:null};this.insert('business_attempts',t);this.db.run("UPDATE external_actions SET status='executing',updated_at=? WHERE action_id=?",this.now(),actionId);return t;});
      this.fault?.('after_attempt_before_transmission');
      const receipt=await this.adapterFor(this.grant(a.grant_id)).replace(a,()=>{
        this.db.transaction(()=>{const current=this.action(actionId);requireThat(current.status==='executing','Action is no longer executing');this.effectAuthority(current);this.resourceFence(current);
          requireThat(this.db.get<BusinessAttempt>('SELECT * FROM business_attempts WHERE attempt_id=?',attempt!.attempt_id)?.state==='preparing','Attempt was already transmitted');
          this.db.run("UPDATE business_attempts SET state='transmitting',transmitted_at=? WHERE attempt_id=?",this.now(),attempt!.attempt_id);this.audit('transmitting',{action_id:actionId,attempt_id:attempt!.attempt_id});});
        this.fault?.('after_transmission_intent');
      });
      this.fault?.('after_provider_before_receipt');this.settle(a,attempt.attempt_id,receipt);this.fault?.('after_receipt_before_wake');
    }catch{
      if(attempt){this.db.transaction(()=>{const current=this.db.get<BusinessAttempt>('SELECT * FROM business_attempts WHERE attempt_id=?',attempt!.attempt_id)!;
        if(current.state==='settled')return;
        const uncertain=current.state==='transmitting'||current.state==='outcome_unknown';
        this.db.run('UPDATE business_attempts SET state=?,finished_at=?,error=? WHERE attempt_id=?',uncertain?'outcome_unknown':'settled',this.now(),uncertain?'Provider effect not established; no retry':'Stopped before transmission',current.attempt_id);
        this.db.run('UPDATE external_actions SET status=?,updated_at=?,error=? WHERE action_id=?',uncertain?'outcome_unknown':'failed',this.now(),uncertain?'Outcome unknown; target fenced pending read-only reconciliation':'No transmission; authority/precondition/provider unavailable',actionId);this.audit('attempt_ended',{action_id:actionId,uncertain});});}
    }
    this.company.emit('changed');
  }
  private settle(action:ExternalAction,attemptId:string,result:MarkdownResult){
    requireThat(result.blob===action.content_blob&&/^[0-9a-f]{40}$/.test(result.commit),'Receipt does not match approved bytes');
    this.db.transaction(()=>{const old=this.db.get<BusinessReceipt>('SELECT * FROM business_receipts WHERE action_id=?',action.action_id);
      if(old){requireThat(old.attempt_id===attemptId&&old.operation_id===result.commit,'Conflicting provider receipt');return;}
      const receipt:BusinessReceipt={receipt_id:id('business_receipt'),action_id:action.action_id,attempt_id:attemptId,provider:'github',adapter:action.adapter,mode:this.grant(action.grant_id).mode,target:action.target,intent_hash:action.intent_hash,content_sha256:action.content_sha256,operation_id:result.commit,provider_time:result.provider_time,recorded_at:this.now(),result:JSON.stringify(result),sha256:businessHash(result)};
      this.insert('business_receipts',receipt);this.db.run("UPDATE business_attempts SET state='settled',finished_at=? WHERE attempt_id=?",this.now(),attemptId);
      this.db.run("UPDATE external_actions SET status='succeeded',error=NULL,updated_at=? WHERE action_id=?",this.now(),action.action_id);this.audit('receipt_recorded',{action_id:action.action_id,receipt_id:receipt.receipt_id});
    });
  }
  async reconcile(input:unknown){requireThat(!this.stopping,'Business operations are stopping');const run=this.reconcileEffect(input);this.reconciling.add(run);try{return await run;}finally{this.reconciling.delete(run);}}
  private async reconcileEffect(input:unknown){this.human();const p=strictObject(input,['action_id']),a=this.action(textField(p,'action_id',100));this.envelope(a);
    requireThat(a.status==='outcome_unknown','Only an unknown effect can be reconciled');const g=this.grant(a.grant_id),attempt=this.db.get<BusinessAttempt>('SELECT * FROM business_attempts WHERE action_id=?',a.action_id)!;
    // Owner may inspect an already transmitted effect after revocation. This is read-only,
    // never a grant to replay, and never clears a model-provider uncertainty fence.
    const rid=id('reconciliation');this.db.transaction(()=>{
      requireThat(this.db.get<{n:number}>('SELECT count(*) n FROM business_reconciliations WHERE action_id=?',a.action_id)!.n<6,'Read-only reconciliation budget exhausted; retain unknown');
      requireThat(!this.db.get("SELECT 1 FROM business_reconciliations WHERE action_id=? AND state='pending'",a.action_id),'Reconciliation already in progress');
      this.insert('business_reconciliations',{reconciliation_id:rid,action_id:a.action_id,state:'pending',created_at:this.now(),finished_at:null,error:null});
    });
    try{const result=await this.adapterFor(g).reconcile(a);if(result)this.settle(a,attempt.attempt_id,result);
      this.db.run('UPDATE business_reconciliations SET state=?,finished_at=? WHERE reconciliation_id=?',result?'confirmed':'inconclusive',this.now(),rid);
      this.audit('owner_reconciliation',{action_id:a.action_id,conclusive:!!result},'human');this.company.emit('changed');return this.inspect(a.mandate_id);
    }catch{this.db.run("UPDATE business_reconciliations SET state='inconclusive',finished_at=?,error='Provider evidence unavailable; uncertainty retained' WHERE reconciliation_id=?",this.now(),rid);throw new Error('Reconciliation unavailable; no retry and uncertainty retained');}
  }
  actionWait(context:ExecutionContext,actionId:string){const v=this.company.mandates.verify(context),a=this.action(actionId);requireThat(a.mandate_id===v.mandate.mandate_id&&a.cycle_id===v.cycle.cycle_id&&a.execution_id===context.executionId,'Wait must own the proposed action');return a;}
  isPending(actionId:string){return pending.includes(this.action(actionId).status);}
  hasPending(executionId:string){return !!this.db.get("SELECT 1 FROM business_reads WHERE execution_id=? AND state='pending'",executionId);}
  reserved(workerId:string){return !!this.db.get("SELECT 1 FROM external_actions WHERE worker_id=? AND status='executing'",workerId);}
  pendingCycle(cycle:string){return !!this.db.get("SELECT 1 FROM external_actions WHERE cycle_id=? AND status IN ('awaiting_approval','approved','executing')",cycle);}
  private withdrawal(mandate:string){return this.db.get<{at:string|null}>('SELECT max(withdrawn_at) at FROM (SELECT withdrawn_at FROM mandate_observations WHERE mandate_id=? UNION ALL SELECT withdrawn_at FROM business_evidence WHERE mandate_id=?)',mandate,mandate)?.at??'';}
  catalog(mandate:string){return {
    grants:this.db.all<BusinessGrant>('SELECT * FROM business_grants WHERE mandate_id=? ORDER BY rowid DESC LIMIT 8',mandate).map(({credential_ref,...g})=>g),
    actions:this.db.all('SELECT action_id,cycle_id,initiative_id,decision_id,baseline_id,status,intent_hash,expires_at,created_at FROM external_actions WHERE mandate_id=? ORDER BY rowid DESC LIMIT 12',mandate),
    evidence:this.db.all('SELECT evidence_id,mode,category,metric,observed_at,retrieved_at,withdrawn_at FROM business_evidence WHERE mandate_id=? ORDER BY rowid DESC LIMIT 24',mandate),
    receipts:this.db.all('SELECT r.receipt_id,r.action_id,r.mode,r.recorded_at FROM business_receipts r JOIN external_actions a USING(action_id) WHERE a.mandate_id=? ORDER BY r.rowid DESC LIMIT 12',mandate),
    owner_controls:this.db.all('SELECT c.control_id,c.action_id,c.grant_id,c.operation,c.created_at FROM business_controls c LEFT JOIN external_actions a USING(action_id) LEFT JOIN business_grants g ON g.grant_id=c.grant_id WHERE a.mandate_id=? OR g.mandate_id=? ORDER BY c.rowid DESC LIMIT 12',mandate,mandate),
    note:'Bounded catalog of IDs and lifecycle only. Read originals before citing. Compensation requests are passive; a new exact action, current grant and owner approval are required.'};}
  workerRecord(m:Mandate,recordId:string):unknown {
    const e=this.db.get<BusinessEvidence>('SELECT * FROM business_evidence WHERE evidence_id=? AND mandate_id=?',recordId,m.mandate_id);
    if(e){requireThat(!e.withdrawn_at&&this.company.mandates.envelope(m).evidence_modes.includes(e.mode),'Business evidence withdrawn or mode outside mandate');requireThat(!e.observed_at||Date.parse(e.observed_at)<=this.company.mandates.clock.now(),'Future business observation denied');return e;}
    const a=this.db.get<ExternalAction>('SELECT * FROM external_actions WHERE action_id=? AND mandate_id=?',recordId,m.mandate_id);
    const receipt=this.db.get<BusinessReceipt>('SELECT r.* FROM business_receipts r JOIN external_actions a USING(action_id) WHERE r.receipt_id=? AND a.mandate_id=?',recordId,m.mandate_id);
    if(a||receipt){const originalAction=a??this.action(receipt!.action_id);requireThat(originalAction.created_at>this.withdrawal(m.mandate_id),'Business derivatives withheld after evidence withdrawal');
      if(receipt){requireThat(this.company.mandates.envelope(m).evidence_modes.includes(receipt.mode),'Receipt mode outside mandate');return receipt;}
      // Only immutable content is citable. Lifecycle is separately present in the catalog.
      const {status,updated_at,error,...original}=this.summary(a!);return original;
    }
    return undefined;
  }
  inspect(mandate?:string){this.human();if(!mandate)return {configured:!!this.adapter,policy:BUSINESS_POLICY,grants:this.db.all('SELECT * FROM business_grants ORDER BY rowid DESC LIMIT 100'),actions:this.db.all<ExternalAction>('SELECT * FROM external_actions ORDER BY rowid DESC LIMIT 100').map(a=>this.summary(a))};
    this.company.mandates.mandate(mandate);return {...this.catalog(mandate),actions:this.db.all('SELECT * FROM external_actions WHERE mandate_id=? ORDER BY rowid',mandate),evidence:this.db.all('SELECT * FROM business_evidence WHERE mandate_id=? ORDER BY rowid',mandate),approvals:this.db.all('SELECT p.* FROM business_approvals p JOIN external_actions a USING(action_id) WHERE a.mandate_id=?',mandate),receipts:this.db.all('SELECT r.* FROM business_receipts r JOIN external_actions a USING(action_id) WHERE a.mandate_id=?',mandate),reconciliations:this.db.all('SELECT r.* FROM business_reconciliations r JOIN external_actions a USING(action_id) WHERE a.mandate_id=?',mandate),attempts:this.db.all('SELECT t.* FROM business_attempts t JOIN external_actions a USING(action_id) WHERE a.mandate_id=?',mandate),controls:this.db.all('SELECT c.* FROM business_controls c LEFT JOIN external_actions a USING(action_id) LEFT JOIN business_grants g ON g.grant_id=c.grant_id WHERE a.mandate_id=? OR g.mandate_id=?',mandate,mandate),limitations:'One exact document replacement; blob CAS is not branch-head CAS. Operational publication is not business growth. Provider/model monetary costs remain unknown unless separately observed.'};}
  progress(){
    for(const a of this.db.all<ExternalAction>("SELECT * FROM external_actions WHERE status IN ('awaiting_approval','approved')")){
      const m=this.company.mandates.mandate(a.mandate_id),c=this.company.mandates.cycle(a.cycle_id),g=this.grant(a.grant_id);
      const origin=this.db.get<{status:string;output:string|null}>('SELECT e.status,t.output FROM executions e JOIN mandate_turns t USING(request_id) WHERE e.execution_id=?',a.execution_id);
      const orphan=origin&&origin.status!=='running'&&(origin.status!=='completed'||!origin.output||JSON.parse(origin.output).action_id!==a.action_id);
      if(orphan||a.created_at<=this.withdrawal(a.mandate_id)||Date.parse(a.expires_at)<=this.company.mandates.clock.now()||Date.parse(c.deadline)<=this.company.mandates.clock.now()||Date.parse(g.expires_at)<=this.company.mandates.clock.now()||g.revoked_at||!['active','paused'].includes(m.status)||m.current_cycle_id!==a.cycle_id||!['active','waiting'].includes(c.state)){
        this.db.run("UPDATE external_actions SET status='cancelled',error='Authority ended before execution',updated_at=? WHERE action_id=?",this.now(),a.action_id);this.audit('cancelled',{action_id:a.action_id});}
    }
    if(this.stopping||this.company.paused||this.active.size)return;
    for(const a of this.db.all<ExternalAction>("SELECT * FROM external_actions WHERE status='approved' ORDER BY rowid")){
      try{this.effectAuthority(a);this.resourceFence(a);}catch{continue;}
      const p=this.execute(a.action_id);this.active.add(p);void p.finally(()=>{this.active.delete(p);this.company.emit('changed');});break;
    }
  }
  nextWake(){return this.db.get<{time:string|null}>("SELECT min(expires_at) time FROM external_actions WHERE status IN ('awaiting_approval','approved')")?.time;}
  recover(){this.stopping=false;this.db.transaction(()=>{
    for(const t of this.db.all<BusinessAttempt>("SELECT * FROM business_attempts WHERE state IN ('preparing','transmitting')")){
      const unknown=t.state==='transmitting';this.db.run('UPDATE business_attempts SET state=?,error=?,finished_at=? WHERE attempt_id=?',unknown?'outcome_unknown':'settled','Application restart; no automatic replay',this.now(),t.attempt_id);
      this.db.run('UPDATE external_actions SET status=?,error=?,updated_at=? WHERE action_id=?',unknown?'outcome_unknown':'failed','Restart preserved attempt; no automatic replay',this.now(),t.action_id);
    }
    this.db.run("UPDATE business_reads SET state='failed',error='Interrupted source retrieval; no observation fabricated' WHERE state='pending'");
    this.db.run("UPDATE business_reconciliations SET state='inconclusive',finished_at=?,error='Interrupted reconciliation; uncertainty retained' WHERE state='pending'",this.now());
  });}
  beginShutdown(){this.stopping=true;}
  async drain(executionId:string){const ids=this.db.all<{read_id:string}>('SELECT read_id FROM business_reads WHERE execution_id=? AND state=\'pending\'',executionId);await Promise.allSettled(ids.map(r=>this.reading.get(r.read_id)));}
  async shutdown(){this.beginShutdown();await Promise.allSettled([...this.active,...this.reading.values(),...this.reconciling]);}
}
