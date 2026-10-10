import { randomBytes } from 'node:crypto';
import { Store } from '../../persistence/store.js';
import { ensure } from '../../domain/investment/arithmetic.js';
import { exact, hash, id, integer, time } from '../../domain/investment/identity.js';
import type { Channel, Destination, Envelope, Grant, Job, Material, MaterialJSON, Preview, PublicationSource, SimulationClock } from '../../domain/publication/types.js';
import type { Event, EventBatch, PublisherScope, PublicationReceipt, ContentReceipt, HeartbeatReceipt, PublicStatus } from '../../../contracts/investment/v1/types.js';
import { canonicalJson, parseJson, sha256, validate } from '../../../scripts/investment-contracts/schema.js';
import { checkPublicationBatch } from '../../../scripts/investment-contracts/publication.js';
import { checkContent } from '../../../scripts/investment-contracts/content.js';
import { destinationValid, signedRequest, type KeyRing, type PublicationTransport } from './transport.js';
function object(value:unknown):asserts value is object {ensure(value!==null&&typeof value==='object'&&!Array.isArray(value),'publication_object_required');}
const opaque=()=>randomBytes(24).toString('hex');
const systemClock:SimulationClock={now:()=>new Date().toISOString()};
const encode=(m:Material):MaterialJSON=>({...m,contents:m.contents.map(c=>({origin:c.origin,contentType:c.contentType,base64:c.bytes.toString('base64'),sha256:sha256(c.bytes)}))});
const decode=(m:MaterialJSON):Material=>({...m,contents:m.contents.map(c=>({origin:c.origin,contentType:c.contentType,bytes:Buffer.from(c.base64,'base64')}))});
export interface PublicationOptions {
  sources?:PublicationSource[]; destinations?:Destination[]; keys?:KeyRing; transport?:PublicationTransport; clock?:SimulationClock;
  fault?:(phase:'before_stage_commit'|'before_send'|'after_send'|'before_receipt_commit')=>void;
}
/** Trusted owner facade. No worker tools, automatic activation, timers or model calls. */
export class PublicationService {
  private readonly sources:Map<string,PublicationSource>;
  private readonly destinations:Map<string,Destination>;
  private readonly clock:SimulationClock;
  private readonly restartFences=new Map<string,string>();
  private readonly instance=opaque();
  constructor(readonly db:Store,private readonly options:PublicationOptions={}) {
    this.sources=new Map((options.sources??[]).map(s=>[s.id,s]));
    this.destinations=new Map((options.destinations??[]).map(d=>{destinationValid(d);return [d.id,Object.freeze({...d})];}));this.clock=options.clock??systemClock;
    for(const c of db.all<Channel>('SELECT * FROM investment_public_channels'))this.restartFences.set(c.id,c.generation);
  }
  private owner(){ensure(this.db.get<{enabled:number}>("SELECT enabled FROM principals WHERE principal_id='human'")?.enabled===1,'publication_owner_disabled');}
  private channel(id:string):Channel {const c=this.db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',id);ensure(c,'publication_channel_missing');return c;}
  private source(c:Channel):PublicationSource {const s=this.sources.get(c.source_id);ensure(s,'publication_source_unconfigured');ensure((s.privateRunId??null)===c.source_run_id,'publication_source_binding_changed');return s;}
  private destination(c:Channel):Destination {const d=this.destinations.get(c.destination_id);ensure(d,'publication_destination_unconfigured');return {...d,generation:c.generation,keyId:c.key_id};}
  private restoreRequired(c:Channel):boolean {return this.restartFences.has(c.id)||c.publisher_instance!==this.instance||c.reconciled_generation!==c.generation;}
  private jobs(c:Channel):Job[]{return this.db.all<Job>('SELECT * FROM investment_public_jobs WHERE channel_id=? ORDER BY position',c.id);}
  private material(c:Channel):Material {
    return this.source(c).project({experimentId:c.experiment_id,runId:c.run_id,policyVersion:c.policy_version,sequence:(key)=>{
      const old=this.db.get<{sequence:number}>('SELECT sequence FROM investment_public_sequences WHERE channel_id=? AND source_key=?',c.id,key);if(old)return String(old.sequence);
      const sequence=(this.db.get<{n:number}>('SELECT max(sequence) n FROM investment_public_sequences WHERE channel_id=?',c.id)?.n??0)+1;ensure(sequence<=100000,'publication_sequence_budget');
      this.db.run('INSERT INTO investment_public_sequences VALUES (?,?,?)',c.id,key,sequence);return String(sequence);
    },identity:(kind,privateId)=>{
      ensure(kind.length>0&&kind.length<80&&privateId.length>0&&privateId.length<500,'publication_identity_invalid');
      const old=this.db.get<{public_id:string}>('SELECT public_id FROM investment_public_identities WHERE channel_id=? AND kind=? AND private_id=?',c.id,kind,privateId);if(old)return old.public_id;
      ensure(this.db.get<{n:number}>('SELECT count(*) n FROM investment_public_identities')!.n<100000,'publication_identity_budget');
      const value=opaque();this.db.run('INSERT INTO investment_public_identities VALUES (?,?,?,?)',c.id,kind,privateId,value);return value;
    }});
  }
  private history(c:Channel):Event[]{return this.jobs(c).filter(j=>j.kind==='batch').flatMap(j=>validate<EventBatch>('EventBatch',parseJson(j.body)).events);}
  private base(c:Channel):string {return hash(this.jobs(c).map(j=>({id:j.id,digest:j.digest})));}
  private envelope(input:unknown):Envelope {
    object(input);exact(input,['sourceId','destinationId','audience','futureFinancial','participants','eventTypes','contentTypes','expiresAt','maxAttempts','maxBytes','maxQueueBytes','maxAgeSeconds','writesPerMinute']);
    const e=JSON.parse(canonicalJson(input)) as Envelope;id(e.sourceId);id(e.destinationId);ensure(e.audience==='public'&&typeof e.futureFinancial==='boolean','publication_audience_required');
    const source=this.sources.get(e.sourceId);ensure(source&&this.destinations.has(e.destinationId),'publication_configuration_missing');
    ensure(Array.isArray(e.participants)&&new Set(e.participants).size===e.participants.length&&hash([...e.participants].sort())===hash([...source.participants].sort()),'publication_participant_scope');
    ensure(time(e.expiresAt)>time(this.clock.now())&&time(e.expiresAt)-time(this.clock.now())<=31*86400000,'publication_expiry');
    integer(e.maxAttempts,1,1000);integer(e.maxBytes,1,67108864);integer(e.maxQueueBytes,1,67108864);integer(e.maxAgeSeconds,1,86400);integer(e.writesPerMinute,1,60);
    ensure(Array.isArray(e.eventTypes)&&new Set(e.eventTypes).size===e.eventTypes.length&&Array.isArray(e.contentTypes)&&new Set(e.contentTypes).size===e.contentTypes.length,'publication_scope_invalid');return e;
  }
  private scope(c:Channel,e:Envelope):PublisherScope {
    const d=this.destination(c);
    return validate<PublisherScope>('PublisherScope',{publisherId:d.publisherId,keyId:d.keyId,experimentId:c.experiment_id,runId:c.run_id,eventTypes:e.eventTypes,contentTypes:e.contentTypes,publicationPolicyVersion:c.policy_version,expiresAt:e.expiresAt,enabled:true,generation:c.generation,writesPerMinute:e.writesPerMinute,bytesPerDay:e.maxBytes});
  }
  inspect() {
    this.owner();return {configured:this.sources.size>0&&this.destinations.size>0,transportConfigured:!!this.options.transport&&!!this.options.keys,
      sources:[...this.sources.values()].map(s=>({id:s.id,title:s.title,mode:s.mode,participants:s.participants})),
      destinations:[...this.destinations.values()].map(d=>({id:d.id,title:d.title,origin:d.origin,generation:d.generation,keyId:d.keyId})),
      channels:this.db.all<Channel>('SELECT * FROM investment_public_channels').map(c=>({...c,health:this.health(c.id)})),
      limitation:'Source-only. Revocation stops future transmission; already published copies require separate receiver owner withdrawal. No credentials, destinations or grants are enabled by startup.'};
  }
  health(channelId:string) {
    const c=this.channel(channelId),jobs=this.jobs(c),pending=jobs.filter(j=>j.state!=='delivered'),at=this.clock.now();
    const grants=this.db.all<Grant>('SELECT * FROM investment_public_grants WHERE channel_id=? ORDER BY rowid',c.id),g=grants.at(-1),e=g?JSON.parse(g.envelope) as Envelope:null;
    const captured=this.db.get<{n:number}>('SELECT max(journal_version) n FROM investment_public_captures WHERE channel_id=?',c.id)?.n??0,unstaged=this.db.all<{journal_version:number;recorded_at:string;bytes:number}>('SELECT i.journal_version,i.recorded_at,length(j.payload) bytes FROM investment_public_intents i JOIN investment_journal j ON j.run_id=? AND j.version=i.journal_version WHERE i.channel_id=? AND i.journal_version>? ORDER BY i.journal_version',c.source_run_id,c.id,captured);
    const usage=g?this.db.get<{attempts:number;bytes:number}>('SELECT count(*) attempts,coalesce(sum(bytes),0) bytes FROM investment_public_attempts WHERE grant_id=?',g.id):null,budgetExhausted=!!e&&!!usage&&(usage.attempts>=e.maxAttempts||usage.bytes>=e.maxBytes);
    const bytes=pending.reduce((n,j)=>n+j.body.length,0),unstagedBytes=unstaged.reduce((n,j)=>n+j.bytes,0),oldest=[pending[0]?.created_at,unstaged[0]?.recorded_at].filter((x):x is string=>!!x).sort()[0],age=oldest?Math.max(0,(time(at)-time(oldest))/1000):0;
    return {unstaged:unstaged.length,unstagedSourceBytes:unstagedBytes,budgetExhausted,state:g?.state??'unconfigured',pending:pending.length,bytes,oldestAgeSeconds:age,uncertain:pending.filter(j=>j.needs_receipt===1||['sending','uncertain'].includes(j.state)).length,
      delivered:jobs.length-pending.length,grantId:g?.id??null,expiresAt:e?.expiresAt??null,
      restoreRequired:this.restoreRequired(c),deliveryBlocked:this.restoreRequired(c)||!g||g.state!=='active'||!!e&&time(at)>=time(e.expiresAt)||pending.some(j=>j.state==='blocked'),
      newRiskBlocked:unstaged.length>0||budgetExhausted||this.restoreRequired(c)||!g||g.state!=='active'||!!e&&(time(at)>=time(e.expiresAt)||age>e.maxAgeSeconds||bytes+unstagedBytes>e.maxQueueBytes)||pending.some(j=>j.state==='blocked'),jobs:jobs.map(j=>({id:j.id,kind:j.kind,state:j.state,digest:j.digest,retryAt:j.retry_at,receipt:j.receipt?JSON.parse(j.receipt):null}))};
  }
  preview(input:unknown):Preview {
    this.owner();const e=this.envelope(input);
    return this.db.transaction(()=>{
      let c=this.db.get<Channel>('SELECT * FROM investment_public_channels WHERE source_id=? AND destination_id=?',e.sourceId,e.destinationId);
      if(!c){const d=this.destinations.get(e.destinationId)!,s=this.sources.get(e.sourceId)!;
        c={id:opaque(),source_id:s.id,source_run_id:s.privateRunId??null,destination_id:d.id,experiment_id:opaque(),run_id:opaque(),policy_version:opaque(),generation:d.generation,key_id:d.keyId,reconciled_generation:d.generation,publisher_instance:this.instance};
        this.db.run('INSERT INTO investment_public_channels VALUES (?,?,?,?,?,?,?,?,?,?,?)',c.id,c.source_id,c.source_run_id,c.destination_id,c.experiment_id,c.run_id,c.policy_version,c.generation,c.key_id,c.reconciled_generation,c.publisher_instance);
        if(c.source_run_id)this.db.run('INSERT INTO investment_public_intents SELECT ?,version,journal_hash,recorded_at FROM investment_journal WHERE run_id=?',c.id,c.source_run_id);
      }
      this.scope(c,e);const material=this.material(c);ensure(material.events.length<=1000&&material.contents.length<=100,'publication_capture_budget');this.source(c).checkRights(material,this.clock.now());
      const selected:Material={...material,events:material.events.filter(x=>e.eventTypes.includes(x.event.type)),contents:material.contents.filter(x=>e.contentTypes.includes(x.contentType))};
      const content=new Map(selected.contents.map(x=>{const result=checkContent(x.bytes,x.contentType,sha256(x.bytes));return [result.sha256,result];}));
      const history=this.history(c);for(const x of selected.events){const existing=history.find(h=>h.eventId===x.event.eventId);ensure(!existing||hash(existing)===hash(x.event),'publication_source_conflict');}
      const next=selected.events.filter(x=>!history.some(h=>h.eventId===x.event.eventId));
      for(const x of next){const batchId=opaque(),batch={schemaVersion:'1.0',batchId,experimentId:c.experiment_id,runId:c.run_id,events:[x.event]};checkPublicationBatch(Buffer.from(canonicalJson(batch)),batchId,{experimentId:c.experiment_id,runId:c.run_id,now:this.clock.now(),scope:this.scope(c,e),history,content,receipts:new Map()});history.push(x.event);}
      // Display all selected exact bytes, including pending jobs that a replacement consent will cover.
      const payload={id:opaque(),channelId:c.id,createdAt:this.clock.now(),envelope:e,destination:{id:c.destination_id,origin:this.destination(c).origin,generation:c.generation,keyId:c.key_id},sourceHash:material.sourceHash,baseHash:this.base(c),material:encode(selected)};
      ensure(Buffer.byteLength(canonicalJson(payload))<=8388608,'publication_preview_size');const preview={...payload,digest:hash(payload)};
      this.db.run('INSERT INTO investment_public_previews VALUES (?,?,?,?,?)',preview.id,c.id,preview.digest,canonicalJson(preview),preview.createdAt);return preview;
    });
  }
  consent(input:unknown) {
    this.owner();object(input);exact(input,['previewId','digest']);const x=input as {previewId:string;digest:string};
    return this.db.transaction(()=>{
      const row=this.db.get<{payload:string;digest:string}>('SELECT * FROM investment_public_previews WHERE id=?',x.previewId);ensure(row&&row.digest===x.digest,'publication_consent_mismatch');
      const p=JSON.parse(row.payload) as Preview,{digest,...unsigned}=p;ensure(hash(unsigned)===digest,'publication_preview_corrupt');const c=this.channel(p.channelId);
      const prior=this.db.get<Grant>('SELECT * FROM investment_public_grants WHERE preview_id=?',p.id);if(prior)return {grantId:prior.id,channelId:c.id,state:prior.state};
      const e=this.envelope(p.envelope);
      ensure(p.baseHash===this.base(c)&&p.sourceHash===this.material(c).sourceHash&&p.destination.generation===c.generation&&p.destination.keyId===c.key_id&&p.destination.origin===this.destination(c).origin,'publication_preview_stale');
      this.source(c).checkRights(decode(p.material),this.clock.now());
      const grantId=opaque();this.db.run("UPDATE investment_public_grants SET state='revoked' WHERE channel_id=? AND state<>'revoked'",c.id);
      this.db.run('INSERT INTO investment_public_grants VALUES (?,?,?,?,?,?)',grantId,c.id,p.id,canonicalJson(e),'active',this.clock.now());
      const jobs=this.jobs(c),allowed=new Set(p.material.events.map(x=>x.event.eventId));
      for(const j of jobs.filter(j=>j.state!=='delivered')){
        ensure(j.kind!=='batch'||validate<EventBatch>('EventBatch',parseJson(j.body)).events.every(event=>allowed.has(event.eventId)),'publication_pending_scope_conflict');
        ensure(j.kind!=='content'||p.material.contents.some(x=>x.sha256===j.digest&&x.contentType===j.content_type),'publication_pending_content_conflict');
        this.db.run('UPDATE investment_public_jobs SET grant_id=?,state=? WHERE id=?',grantId,j.state==='blocked'?'queued':j.state,j.id);
      }
      const prefix=`/api/experiments/v1/experiments/${c.experiment_id}/runs/${c.run_id}`;
      for(const content of p.material.contents){const bytes=Buffer.from(content.base64,'base64');if(!jobs.some(j=>j.kind==='content'&&j.digest===content.sha256&&j.content_type===content.contentType))this.addJob(c,grantId,'content',bytes,`${prefix}/content/${content.sha256}`,content.contentType);}
      const history=this.history(c);
      for(const {event} of p.material.events)if(!history.some(h=>h.eventId===event.eventId)){
        const jobId=opaque(),batch={schemaVersion:'1.0',batchId:jobId,experimentId:c.experiment_id,runId:c.run_id,events:[event]};this.addJob(c,grantId,'batch',Buffer.from(canonicalJson(batch)),`${prefix}/events`,'application/json',jobId);
      }
      ensure(this.jobs(c).filter(j=>j.state!=='delivered').reduce((n,j)=>n+j.body.length,0)<=e.maxQueueBytes,'publication_backlog_budget');
      this.captureReceipt(c,grantId,p.sourceHash);this.controlReceipt(c,'consent',{grantId,previewId:p.id,digest:p.digest});this.options.fault?.('before_stage_commit');return {grantId,channelId:c.id,state:'active'};
    });
  }
  private captureReceipt(c:Channel,grantId:string,materialHash:string) {
    const version=this.db.get<{n:number}>('SELECT max(journal_version) n FROM investment_public_intents WHERE channel_id=?',c.id)?.n??0;
    if(this.db.get('SELECT id FROM investment_public_captures WHERE channel_id=? AND grant_id=? AND journal_version=? AND material_hash=?',c.id,grantId,version,materialHash))return;
    this.db.run('INSERT INTO investment_public_captures VALUES (?,?,?,?,?,?)',opaque(),c.id,grantId,version,materialHash,this.clock.now());
  }
  /** One bounded standing-envelope capture. New prose/artifact derivatives still need exact owner approval. */
  capture(input:unknown) {
    this.owner();object(input);exact(input,['channelId']);const x=input as {channelId:string};
    return this.db.transaction(()=>{
      const c=this.channel(x.channelId);ensure(!this.restoreRequired(c),'publication_restore_reconciliation_required');
      const g=this.db.get<Grant>("SELECT * FROM investment_public_grants WHERE channel_id=? AND state='active' ORDER BY rowid DESC LIMIT 1",c.id);ensure(g,'publication_grant_inactive');
      const e=JSON.parse(g.envelope) as Envelope;ensure(hash([...this.source(c).participants].sort())===hash([...e.participants].sort()),'publication_participant_scope');ensure(e.futureFinancial&&time(this.clock.now())<time(e.expiresAt),'publication_standing_capture_denied');
      const p=JSON.parse(this.db.get<{payload:string}>('SELECT payload FROM investment_public_previews WHERE id=?',g.preview_id)!.payload) as Preview;
      ensure(p.destination.origin===this.destination(c).origin&&p.destination.generation===c.generation,'publication_generation_fenced');
      const material=this.material(c);ensure(material.events.length<=1000&&material.contents.length<=100,'publication_capture_budget');this.source(c).checkRights(material,this.clock.now());
      const history=this.history(c),selected=material.events.filter(x=>e.eventTypes.includes(x.event.type)),financial=new Set<Event['type']>(['paper.order','paper.ledger_transaction','portfolio.snapshot','market.action','instrument.updated','run.status']);
      for(const x of selected){const prior=history.find(h=>h.eventId===x.event.eventId);ensure(!prior||hash(prior)===hash(x.event),'publication_source_conflict');if(!financial.has(x.event.type))ensure(p.material.events.some(a=>hash(a)===hash(x)),'publication_new_derivative_approval_required');}
      for(const content of material.contents.filter(x=>e.contentTypes.includes(x.contentType)))ensure(p.material.contents.some(a=>a.sha256===sha256(content.bytes)&&a.contentType===content.contentType&&hash(a.origin)===hash(content.origin)),'publication_new_derivative_approval_required');
      const approvedSources=new Set(p.material.events.flatMap(({event})=>event.type==='market.action'?[hash(event.payload.source)]:event.type==='paper.ledger_transaction'&&event.payload.corporateAction?[hash(event.payload.corporateAction.source)]:[]));
      for(const x of selected.filter(x=>!history.some(h=>h.eventId===x.event.eventId))){const event=x.event,source=event.type==='market.action'?event.payload.source:event.type==='paper.ledger_transaction'?event.payload.corporateAction?.source:null;ensure(!source||approvedSources.has(hash(source)),'publication_new_derivative_approval_required');}
      const content=new Map(p.material.contents.map(x=>[x.sha256,checkContent(Buffer.from(x.base64,'base64'),x.contentType,x.sha256)]));
      for(const x of selected.filter(x=>!history.some(h=>h.eventId===x.event.eventId))){ensure(financial.has(x.event.type)&&x.origin.kind==='journal','publication_new_derivative_approval_required');const jobId=opaque(),batch={schemaVersion:'1.0',batchId:jobId,experimentId:c.experiment_id,runId:c.run_id,events:[x.event]},bytes=Buffer.from(canonicalJson(batch));checkPublicationBatch(bytes,jobId,{experimentId:c.experiment_id,runId:c.run_id,now:this.clock.now(),scope:this.scope(c,e),history,content,receipts:new Map()});this.addJob(c,g.id,'batch',bytes,`/api/experiments/v1/experiments/${c.experiment_id}/runs/${c.run_id}/events`,'application/json',jobId);history.push(x.event);}
      ensure(this.jobs(c).filter(j=>j.state!=='delivered').reduce((n,j)=>n+j.body.length,0)<=e.maxQueueBytes,'publication_backlog_budget');this.captureReceipt(c,g.id,material.sourceHash);this.options.fault?.('before_stage_commit');return this.health(c.id);
    });
  }
  private addJob(c:Channel,g:string,kind:Job['kind'],body:Buffer,path:string,type:Job['content_type'],jobId=opaque()) {
    ensure(this.db.get<{n:number}>('SELECT count(*) n FROM investment_public_jobs')!.n<100000,'publication_storage_budget');
    const position=(this.db.get<{n:number}>('SELECT max(position) n FROM investment_public_jobs WHERE channel_id=?',c.id)?.n??0)+1;
    this.db.run('INSERT INTO investment_public_jobs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',jobId,c.id,g,position,kind,body,sha256(body),path,type,'queued',null,null,null,this.clock.now(),null,0);
  }
  private controlReceipt(c:Channel,action:string,detail:unknown){this.db.run('INSERT INTO investment_public_controls VALUES (?,?,?,?,?)',opaque(),c.id,action,canonicalJson(detail),this.clock.now());}
  control(input:unknown) {
    this.owner();object(input);exact(input,['channelId','action','keyId','generation']);const x=input as {channelId:string;action:string;keyId:string|null;generation:string|null};
    return this.db.transaction(()=>{const c=this.channel(x.channelId);
      if(x.action==='pause'||x.action==='revoke'){
        ensure(x.keyId===null&&x.generation===null,'publication_control_fields');this.db.run("UPDATE investment_public_grants SET state=? WHERE channel_id=? AND state<>'revoked'",x.action==='pause'?'paused':'revoked',c.id);
      }else if(x.action==='rotate'){
        ensure(x.keyId&&x.generation===null&&this.options.keys?.has(x.keyId,Math.floor(time(this.clock.now())/1000)),'publication_key_unavailable');this.db.run('UPDATE investment_public_channels SET key_id=? WHERE id=?',x.keyId,c.id);
      }else if(x.action==='generation'){
        ensure(x.keyId===null&&x.generation&&/^[1-9]\d{0,17}$/.test(x.generation)&&BigInt(x.generation)>BigInt(c.generation),'invalid_generation');
        ensure(!this.jobs(c).some(j=>j.state==='sending'&&j.attempted_at&&time(this.clock.now())-time(j.attempted_at)<30000),'publication_request_in_flight');
        this.db.run('UPDATE investment_public_channels SET generation=?,reconciled_generation=NULL WHERE id=?',x.generation,c.id);this.db.run("UPDATE investment_public_grants SET state='revoked' WHERE channel_id=?",c.id);
      }else ensure(false,'publication_control_denied');
      this.controlReceipt(c,x.action,x);if(x.action==='generation'&&this.jobs(c).length&&!this.restartFences.has(c.id))this.restartFences.set(c.id,c.generation);return this.health(c.id);
    });
  }
  heartbeat(input:unknown) {
    this.owner();object(input);exact(input,['channelId']);const x=input as {channelId:string};
    return this.db.transaction(()=>{const c=this.channel(x.channelId),g=this.db.get<Grant>("SELECT * FROM investment_public_grants WHERE channel_id=? AND state='active' ORDER BY rowid DESC LIMIT 1",c.id);ensure(g,'publication_grant_inactive');
      const e=JSON.parse(g.envelope) as Envelope;ensure(hash([...this.source(c).participants].sort())===hash([...e.participants].sort()),'publication_participant_scope');ensure(time(this.clock.now())<time(e.expiresAt),'publication_grant_expired');
      ensure(!this.jobs(c).some(j=>j.kind==='heartbeat'&&j.state!=='delivered'),'publication_heartbeat_pending');
      const jobId=opaque(),history=this.history(c),body={schemaVersion:'1.0',heartbeatId:jobId,experimentId:c.experiment_id,runId:c.run_id,sentAt:this.clock.now(),lastSourceSequence:history.at(-1)?.sourceSequence??null,state:history.filter(e=>e.type==='run.status'||e.type==='run.published').at(-1)?.payload.state??'configured'};
      this.addJob(c,g.id,'heartbeat',Buffer.from(canonicalJson(body)),`/api/experiments/v1/experiments/${c.experiment_id}/runs/${c.run_id}/heartbeat`,'application/json',jobId);return this.health(c.id);
    });
  }
  private authority(c:Channel,j:Job) {
    this.owner();const g=this.db.get<Grant>('SELECT * FROM investment_public_grants WHERE id=?',j.grant_id);ensure(g?.state==='active','publication_grant_inactive');
    const e=JSON.parse(g.envelope) as Envelope;ensure(hash([...this.source(c).participants].sort())===hash([...e.participants].sort()),'publication_participant_scope');ensure(time(this.clock.now())<time(e.expiresAt),'publication_grant_expired');
    const p=JSON.parse(this.db.get<{payload:string}>('SELECT payload FROM investment_public_previews WHERE id=?',g.preview_id)!.payload) as Preview;
    ensure(p.destination.generation===c.generation&&p.destination.origin===this.destination(c).origin,'publication_generation_fenced');
    ensure(sha256(j.body)===j.digest,'publication_job_corrupt');this.source(c).checkRights(decode(p.material),this.clock.now());
    if(j.kind==='batch')ensure(validate<EventBatch>('EventBatch',parseJson(j.body)).events.every(v=>e.eventTypes.includes(v.type)),'publication_scope_denied');
    if(j.kind==='content'){ensure(e.contentTypes.includes(j.content_type),'publication_content_scope_denied');checkContent(Buffer.from(j.body),j.content_type,j.digest);}
    ensure(this.options.keys?.has(c.key_id,Math.floor(time(this.clock.now())/1000))&&this.options.transport,'publication_transport_unconfigured');return e;
  }
  /** Executes at most one bounded request. A pending batch is reconciled before retransmission. */
  async deliver(input:unknown) {
    this.owner();object(input);exact(input,['channelId']);const x=input as {channelId:string};
    const reserved=this.db.transaction(()=>{
      const c=this.channel(x.channelId);ensure(!this.restoreRequired(c),'publication_restore_reconciliation_required');const jobs=this.jobs(c);let j=jobs.find(j=>j.state!=='delivered');if(!j)return null;
      if(j.state==='sending'&&j.attempted_at&&time(this.clock.now())-time(j.attempted_at)<30000)return null;
      if(j.retry_at&&time(this.clock.now())<time(j.retry_at))return null;
      if(j.state==='blocked')return null;
      // Content PUT is explicitly same-byte idempotent and refreshes expired receiver staging.
      if(j.kind==='batch'&&j.state==='queued'){
        const events=validate<EventBatch>('EventBatch',parseJson(j.body)).events;
        const needed=events.flatMap(e=>e.type==='artifact.published'?[e.payload.sha256]:[]);
        const refresh=jobs.find(old=>old.kind==='content'&&needed.includes(old.digest)&&old.state==='delivered'&&old.attempted_at&&time(this.clock.now())-time(old.attempted_at)>=3600000);
        if(refresh){this.db.run('UPDATE investment_public_jobs SET grant_id=? WHERE id=?',j.grant_id,refresh.id);j={...refresh,grant_id:j.grant_id};}
      }
      const operation=j.kind==='batch'&&(j.needs_receipt===1||['sending','uncertain'].includes(j.state))?'receipt':'write';
      const e=this.authority(c,j),attempts=this.db.all<{attempted_at:string;bytes:number}>('SELECT attempted_at,bytes FROM investment_public_attempts WHERE grant_id=?',j.grant_id);
      ensure(attempts.length<e.maxAttempts&&attempts.reduce((sum,a)=>sum+a.bytes,0)+(operation==='receipt'?0:j.body.length)<=e.maxBytes,'publication_budget_exhausted');
      if(attempts.filter(a=>time(a.attempted_at)>time(this.clock.now())-60000).length>=e.writesPerMinute)return null;
      const attemptId=opaque(),at=this.clock.now();
      this.db.run('INSERT INTO investment_public_attempts VALUES (?,?,?,?,?,?,?,?,?)',attemptId,j.id,c.id,j.grant_id,operation,c.generation,c.key_id,at,operation==='receipt'?0:j.body.length);
      this.db.run("UPDATE investment_public_jobs SET state='sending',attempted_at=?,lease=?,needs_receipt=? WHERE id=?",at,attemptId,j.kind==='batch'?1:0,j.id);
      return {c,j,attemptId,operation,at};
    });
    if(!reserved)return this.health(x.channelId);
    const {c,j,attemptId,operation,at}=reserved;
    let result:{state:Job['state'];detail:string;receipt?:unknown;retry?:string;clearUncertainty?:boolean};
    try {
      this.options.fault?.('before_send');
      // No await between this current-authority check and handing bytes to the transport.
      ensure(!this.restoreRequired(this.channel(c.id)),'publication_restore_reconciliation_required');this.authority(this.channel(c.id),j);
      const d=this.destination(this.channel(c.id)),path=operation==='receipt'?j.path.replace(/\/events$/,`/receipts/${j.id}`):j.path;
      const request=signedRequest(d,this.options.keys!,at,operation==='receipt'?'GET':j.kind==='content'?'PUT':'POST',path,operation==='receipt'?Buffer.alloc(0):Buffer.from(j.body),operation==='receipt'?undefined:j.id,j.content_type);
      const response=await this.options.transport!.send(d,request);this.options.fault?.('after_send');
      ensure(response.contentType==='application/json'||response.contentType==='application/problem+json','publication_response_type');const value=parseJson(response.bytes,262144);
      if(response.status>=200&&response.status<300){this.receipt(c,j,value);result={state:'delivered',detail:'receiver_acknowledged',receipt:value};}
      else {
        const problem=validate<{code:string;status:number;retryable:boolean;retryAfterSeconds:number|null}>('Problem',value);ensure(problem.status===response.status,'publication_response_status');
        if(operation==='receipt'&&response.status===404&&problem.code==='NOT_FOUND')result={state:'queued',detail:'receipt_absent_same_bytes_retry',clearUncertainty:true,retry:new Date(time(this.clock.now())+1000).toISOString()};
        else if(!problem.retryable||[400,401,403,410,413,415,422].includes(response.status)||response.status===409&&!['DEPENDENCY_NOT_READY','SEQUENCE_GAP'].includes(problem.code))result={state:'blocked',detail:`receiver_${problem.code}`};
        else result={state:j.kind==='batch'?'uncertain':'queued',detail:`receiver_${problem.code}`,retry:new Date(time(this.clock.now())+Math.max(this.retryDelay(j.id),Math.min(problem.retryAfterSeconds??0,3600)*1000)).toISOString()};
      }
    }catch(error){
      // No error text/body/signature is persisted. An interrupted write remains uncertain.
      result={state:'uncertain',detail:error instanceof Error&&error.message.startsWith('publication_')?error.message:'publication_outcome_unknown',retry:new Date(time(this.clock.now())+this.retryDelay(j.id)).toISOString()};
    }
    this.db.transaction(()=>{
      const current=this.db.get<Job>('SELECT * FROM investment_public_jobs WHERE id=?',j.id);ensure(current,'publication_job_missing');
      this.db.run('INSERT INTO investment_public_results VALUES (?,?,?,?,?)',attemptId,result.state,result.detail,this.clock.now(),result.receipt?canonicalJson(result.receipt):null);
      this.options.fault?.('before_receipt_commit');
      // Historical receipts are retained even when consent was revoked during the request.
      if(current.state!=='delivered'&&(current.lease===attemptId||result.receipt))this.db.run('UPDATE investment_public_jobs SET state=?,retry_at=?,lease=NULL,receipt=?,needs_receipt=? WHERE id=?',result.state,result.retry??null,result.receipt?canonicalJson(result.receipt):current.receipt,result.receipt||result.clearUncertainty?0:current.needs_receipt,j.id);
    });return this.health(c.id);
  }
  private retryDelay(jobId:string):number {const n=this.db.get<{n:number}>('SELECT count(*) n FROM investment_public_attempts WHERE job_id=?',jobId)!.n;return Math.min(3600000,1000*2**Math.min(12,Math.max(0,n-1)))+randomBytes(2).readUInt16BE(0)%501;}
  /** Restore never trusts a copied local lease. Receiver owner must first advance its generation. */
  async reconcile(input:unknown) {
    this.owner();object(input);exact(input,['channelId']);const x=input as {channelId:string};
    const reserved=this.db.transaction(()=>{
      const c=this.channel(x.channelId),prior=this.restartFences.get(c.id);
      ensure(prior&&BigInt(c.generation)>BigInt(prior),'publication_receiver_generation_advance_required');
      ensure(c.reconciled_generation===null,'publication_generation_already_reconciled');
      const batches=this.jobs(c).filter(j=>j.kind==='batch'),anchor=batches.filter(j=>this.db.get('SELECT id FROM investment_public_attempts WHERE job_id=? LIMIT 1',j.id)).at(-1)??batches[0];
      ensure(anchor,'publication_restore_anchor_required');
      const g=this.db.get<Grant>("SELECT * FROM investment_public_grants WHERE channel_id=? AND state='active' ORDER BY rowid DESC LIMIT 1",c.id);ensure(g,'publication_grant_inactive');
      const j={...anchor,grant_id:g.id},e=this.authority(c,j),attempts=this.db.all<{attempted_at:string}>('SELECT attempted_at FROM investment_public_attempts WHERE grant_id=?',g.id);
      ensure(attempts.length+2<=e.maxAttempts&&attempts.filter(a=>time(a.attempted_at)>time(this.clock.now())-60000).length+2<=e.writesPerMinute,'publication_budget_exhausted');
      const attemptId=opaque(),at=this.clock.now();this.db.run('INSERT INTO investment_public_attempts VALUES (?,?,?,?,?,?,?,?,?)',attemptId,j.id,c.id,g.id,'restore_receipt',c.generation,c.key_id,at,0);this.db.run('INSERT INTO investment_public_attempts VALUES (?,?,?,?,?,?,?,?,?)',attemptId+'-status',j.id,c.id,g.id,'restore_status',c.generation,c.key_id,at,0);return {c,j,attemptId,at};
    });
    const {c,j,attemptId,at}=reserved;let receipt:PublicationReceipt|undefined;
    try {
      this.authority(this.channel(c.id),j);
      const d=this.destination(this.channel(c.id)),request=signedRequest(d,this.options.keys!,at,'GET',j.path.replace(/\/events$/,`/receipts/${j.id}`),Buffer.alloc(0));
      const response=await this.options.transport!.send(d,request);let absent=false,value:PublicationReceipt|undefined,receiptProof:unknown;
      if(response.status===200&&response.contentType==='application/json'){value=validate<PublicationReceipt>('PublicationReceipt',parseJson(response.bytes));this.receipt(c,j,value);receiptProof=value;}
      else {ensure(response.status===404&&response.contentType==='application/problem+json'&&validate<{code:string}>('Problem',parseJson(response.bytes)).code==='NOT_FOUND','publication_restore_receipt_required');absent=true;receiptProof={code:'NOT_FOUND',batchId:j.id};const prior=this.jobs(c).filter(old=>old.kind==='batch'&&old.position<j.position&&old.state==='delivered'&&old.receipt).at(-1);if(prior){value=validate<PublicationReceipt>('PublicationReceipt',JSON.parse(prior.receipt!));this.receipt(c,prior,value);}}
      if(value){const history=this.history(c),watermark=value.watermark,prefix=history.filter(e=>watermark.sourceSequence!==null&&BigInt(e.sourceSequence)<=BigInt(watermark.sourceSequence)),ledger=prefix.filter(e=>e.type==='paper.ledger_transaction').at(-1);ensure(!watermark.sourceGaps&&prefix.at(-1)?.sourceSequence===watermark.sourceSequence&&watermark.journalSequence===(ledger?.payload.journalSequence??null)&&watermark.journalHash===(ledger?.payload.journalHash??null),'publication_restore_watermark_conflict');}
      this.authority(this.channel(c.id),j);ensure(this.channel(c.id).generation===c.generation&&this.channel(c.id).reconciled_generation===null,'publication_generation_fenced');
      const statusResponse=await this.options.transport!.send(d,{method:'GET',authority:new URL(d.origin).host,path:j.path.replace(/\/events$/,'/status'),headers:[],body:Buffer.alloc(0)});let statusProof:unknown;
      if(value){ensure(statusResponse.status===200&&statusResponse.contentType==='application/json','publication_restore_status_required');const status=validate<PublicStatus>('PublicStatus',parseJson(statusResponse.bytes));ensure(status.experimentId===c.experiment_id&&status.runId===c.run_id&&hash(status.watermark)===hash(value.watermark),'publication_restore_current_watermark_conflict');statusProof=status;}
      else {ensure(absent&&!this.jobs(c).some(j=>j.kind==='batch'&&j.state==='delivered')&&statusResponse.status===404&&statusResponse.contentType==='application/problem+json'&&validate<{code:string}>('Problem',parseJson(statusResponse.bytes)).code==='NOT_FOUND','publication_restore_current_watermark_conflict');statusProof={code:'NOT_FOUND',runId:c.run_id};}
      receipt=value;
      this.db.transaction(()=>{this.authority(this.channel(c.id),j);const current=this.channel(c.id);ensure(current.generation===c.generation&&current.reconciled_generation===null&&current.publisher_instance===c.publisher_instance,'publication_generation_fenced');this.db.run('INSERT INTO investment_public_results VALUES (?,?,?,?,?)',attemptId,'delivered','restore_reconciled',this.clock.now(),canonicalJson(receiptProof));this.db.run('INSERT INTO investment_public_results VALUES (?,?,?,?,?)',attemptId+'-status','delivered','restore_current_watermark',this.clock.now(),canonicalJson(statusProof));this.db.run('UPDATE investment_public_channels SET reconciled_generation=?,publisher_instance=? WHERE id=?',c.generation,this.instance,c.id);if(absent)this.db.run("UPDATE investment_public_jobs SET state='queued',needs_receipt=0,lease=NULL,retry_at=NULL WHERE id=? AND state<>'delivered'",j.id);this.controlReceipt(c,'restore_reconciled',{attemptId,generation:c.generation,watermark:value?.watermark??null});});
      this.restartFences.delete(c.id);
    }catch(error){for(const id of [attemptId,attemptId+'-status'])if(!this.db.get('SELECT attempt_id FROM investment_public_results WHERE attempt_id=?',id))this.db.run('INSERT INTO investment_public_results VALUES (?,?,?,?,?)',id,'blocked','restore_reconciliation_required',this.clock.now(),id===attemptId&&receipt?canonicalJson(receipt):null);throw error;}
    return this.health(c.id);
  }
  private receipt(c:Channel,j:Job,value:unknown):void {
    if(j.kind==='batch'){
      const r=validate<PublicationReceipt>('PublicationReceipt',value),batch=validate<EventBatch>('EventBatch',parseJson(j.body));
      ensure(r.batchId===j.id&&r.experimentId===c.experiment_id&&r.runId===c.run_id&&r.bodyDigest===j.digest,'publication_receipt_mismatch');
      const all=[...r.acceptedIds,...r.duplicateIds];ensure(new Set(all).size===all.length&&hash([...all].sort())===hash(batch.events.map(e=>e.eventId).sort()),'publication_receipt_events');
      ensure(r.watermark.sourceSequence!==null&&BigInt(r.watermark.sourceSequence)>=BigInt(batch.events.at(-1)!.sourceSequence),'publication_receipt_watermark');
      const ledger=batch.events.find(e=>e.type==='paper.ledger_transaction');if(ledger?.type==='paper.ledger_transaction')ensure(this.history(c).some(e=>e.type==='paper.ledger_transaction'&&e.payload.journalSequence===r.watermark.journalSequence&&e.payload.journalHash===r.watermark.journalHash&&BigInt(e.payload.journalSequence)>=BigInt(ledger.payload.journalSequence)),'publication_receipt_journal');
    }else if(j.kind==='content'){
      const r=validate<ContentReceipt>('ContentReceipt',value);ensure(r.uploadId===j.id&&r.experimentId===c.experiment_id&&r.runId===c.run_id&&r.sha256===j.digest&&r.contentType===j.content_type&&r.sizeBytes===j.body.length,'publication_content_receipt_mismatch');
    }else {const r=validate<HeartbeatReceipt>('HeartbeatReceipt',value);ensure(r.heartbeatId===j.id,'publication_heartbeat_receipt_mismatch');}
  }
}
