/** Finite HQ authority. Independent of company snapshots and Decision 037. No implicit initialization. */
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {closeSync,existsSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,realpathSync,renameSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {userInfo} from 'node:os';
import {requireThat} from '../../domain/model.js';
import {canonical,hash} from '../../domain/investment/identity.js';
import {executionPolicy,finiteProfile,type FiniteAIProfile,type FiniteHQPolicy} from '../../domain/usage/policy.js';

export interface FiniteEnvelope {
 authorityId:string;hqId:string;root:string;runId:string;groupId:string;scopeId:string;
 previewDigest:string;configurationHash:string;sourceHash:string;calendarHash:string;occurrencesHash:string;scopeDigest:string;loopDigest:string;
 participants:{workerId:string;responsibility:string}[];proposers:string[];reviewers:string[];submitters:string[];
 profile:FiniteAIProfile;accountFingerprint:string;routingFingerprint:string;expiresAt:string;
 evidenceMode:'synthetic_fixture';methodology:'inv05-v1';paperOperations:string[];policy:FiniteHQPolicy;
 approval:{ownerId:string;receiptHash:string;approvedAt:string};
}
export interface ReloadAttestation {authorityId:string;runId:string;accountFingerprint:string;ownerId:string;confirmedAt:string;reloadOff:true;evidenceHash:string}
export interface FiniteReservation {authorityId:string;executionId:string;requestId:string;workerId:string;runId:string;scopeId:string;occurrenceId:string;generation:number;sessionId:string;providerGeneration:number;conversationId:string;day:string;reservedAt:string;deadline:string;scopeDigest:string;profile:FiniteAIProfile}
interface Entry {sequence:number;epoch:string;at:string;kind:string;payload:string;previous:string|null;digest:string}
interface Custody {epoch:string;sequence:number;digest:string;at:string}
export interface ReservationState extends FiniteReservation {state:'reserved'|'admitted'|'transmitted'|'settled'|'unknown';threadId?:string;status?:string;complete?:boolean}
interface OtherReservation {executionId:string;reservedAt:string;state:"active"|"settled"|"unknown";status?:string}
interface OwnerReceipt {receiptId:string;requestHash:string;authorityId:string;action:string;confirmedAt:string;controlRevision:number}
interface State {receipts:Map<string,OwnerReceipt>;revisions:Map<string,number>;other:Map<string,OtherReservation>;authorities:Map<string,FiniteEnvelope>;attestations:Map<string,ReloadAttestation>;reservations:Map<string,ReservationState>;holds:Map<string,string>;stopped:Set<string>;observed:Map<string,{executionId:string;reservedAt:string}>;head:Custody}
const hex=(v:string)=>/^[a-f0-9]{64}$/.test(v);
const validTime=(s:string)=>Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const uid=()=>process.getuid?.();
function privatePath(path:string,file=false){const s=lstatSync(path);requireThat(realpathSync(path)===path&&!s.isSymbolicLink()&&s.uid===uid()&&(s.mode&0o077)===0&&(file?s.isFile()&&s.nlink===1:s.isDirectory()),'Finite authority requires canonical owner-private custody');return s;}
function syncDir(path:string){const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}
function validateEnvelope(e:FiniteEnvelope){
 requireThat(executionPolicy(e.policy).mode==='credit_approved_finite_hq'&&e.authorityId===e.policy.authorityId,'Finite policy mismatch');finiteProfile(e.profile);
 requireThat(realpathSync(e.root)===e.root&&e.hqId.length>0&&e.runId.length>0&&e.groupId.length>0&&e.scopeId.length>0,'Exact canonical HQ identity required');
 requireThat([e.previewDigest,e.configurationHash,e.sourceHash,e.calendarHash,e.occurrencesHash,e.scopeDigest,e.loopDigest,e.accountFingerprint,e.routingFingerprint,e.approval.receiptHash].every(hex),'Frozen authority digests required');
 requireThat(e.evidenceMode==='synthetic_fixture'&&e.methodology==='inv05-v1'&&canonical(e.paperOperations)===canonical(['paper_inspect','paper_propose','paper_read_proposal','paper_review','paper_submit']),'Private synthetic paper authority only');
 const ids=e.participants.map(p=>p.workerId);requireThat(ids.length>=2&&ids.length<=6&&new Set(ids).size===ids.length&&e.participants.every(p=>p.responsibility.length>0),'Invalid finite roster');
 requireThat([e.proposers,e.reviewers,e.submitters].every(role=>role.length>0&&new Set(role).size===role.length&&role.every(id=>ids.includes(id))),'Invalid finite roles');
 requireThat(validTime(e.expiresAt)&&validTime(e.approval.approvedAt)&&e.approval.ownerId.length>0&&Date.parse(e.expiresAt)>Date.parse(e.approval.approvedAt),'Invalid finite approval interval');
}

/** Event history and independent custody must agree exactly. A partial cross-file commit stays stopped. */
export class FiniteJournal {
 private readonly db:DatabaseSync;private readonly inode:number;
 constructor(readonly path:string,readonly custodyPath:string){
  privatePath(dirname(path));privatePath(dirname(custodyPath));this.inode=privatePath(path,true).ino;privatePath(custodyPath,true);
  this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL');
  try{requireThat(this.db.prepare('PRAGMA user_version').get()?.user_version===1,'Unsupported finite authority schema');this.read();}catch(error){this.db.close();throw error;}
 }
 /** Fixture-only paths are never capable of obtaining a genuine runtime permit. */
 static createFixture(path:string,custodyPath:string,at:string){return createJournal(path,custodyPath,at);}
 private present(){privatePath(dirname(this.path));privatePath(dirname(this.custodyPath));requireThat(privatePath(this.path,true).ino===this.inode,'Finite authority replaced');privatePath(this.custodyPath,true);}
 private read():State {
  this.present();requireThat(this.db.prepare('PRAGMA integrity_check').get()?.integrity_check==='ok','Finite authority corrupt');
  const rows=this.db.prepare('SELECT * FROM events ORDER BY sequence').all() as unknown as Entry[];
  requireThat(rows.length>0,'Finite authority incomplete');
  const state:State={receipts:new Map(),revisions:new Map(),other:new Map(),authorities:new Map(),attestations:new Map(),reservations:new Map(),holds:new Map(),stopped:new Set(),observed:new Map(),head:null!};
  let previous:string|null=null,last=0,epoch='';
  for(const row of rows){const {digest,...body}=row;requireThat(row.sequence===++last&&row.previous===previous&&hash(body)===digest&&validTime(row.at)&&(!state.head||row.at>=state.head.at),'Finite authority history discontinuity');
   if(last===1){requireThat(row.kind==='genesis','Finite authority genesis missing');epoch=row.epoch;}requireThat(row.epoch===epoch,'Finite authority epoch changed');previous=digest;state.head={epoch,sequence:last,digest,at:row.at};
   const p=JSON.parse(row.payload);
   switch(row.kind){
    case 'genesis':requireThat(last===1,'Duplicate genesis');break;
    case 'approve':validateEnvelope(p);requireThat(!state.authorities.has(p.authorityId),'Duplicate authority');state.authorities.set(p.authorityId,p);break;
    case 'attest':state.attestations.set(p.authorityId,p);break;
    case 'reload_invalid':state.attestations.delete(p.authorityId);break;
    case 'reserve':requireThat(!state.reservations.has(p.executionId),'Duplicate reservation');state.reservations.set(p.executionId,{...p,state:'reserved'});break;
    case 'admit':{const r=state.reservations.get(p.executionId);requireThat(r?.state==='reserved','Invalid admission history');Object.assign(r,{state:'admitted',threadId:p.threadId});break;}
    case 'transmit':{const r=state.reservations.get(p.executionId);requireThat(r?.state==='admitted'&&r.threadId===p.threadId,'Invalid finite transmission history');r.state='transmitted';break;}
    case 'settle':{const r=state.reservations.get(p.executionId);requireThat(r,'Settlement without reservation');if(r.state!=='unknown')Object.assign(r,{state:p.settled?'settled':'unknown',status:p.status,complete:p.complete});break;}
    case 'unknown':{const r=state.reservations.get(p.executionId);requireThat(r,'Unknown reservation missing');r.state='unknown';break;}
    case 'hold':state.holds.set(p.authorityId,p.reason);state.revisions.set(p.authorityId,row.sequence);break;
    case 'resume':state.holds.delete(p.authorityId);state.revisions.set(p.authorityId,row.sequence);break;
    case 'stop':state.stopped.add(p.authorityId);state.revisions.set(p.authorityId,row.sequence);break;
    case 'owner_receipt':requireThat(!state.receipts.has(p.receiptId),'Duplicate owner receipt');state.receipts.set(p.receiptId,p);break;
    case 'observe':state.observed.set(p.executionId,p);break;
    case 'other_reserve':requireThat(!state.other.has(p.executionId),'Duplicate other investment reservation');state.other.set(p.executionId,{...p,state:'active'});break;
    case 'other_settle':{const r=state.other.get(p.executionId);requireThat(r,'Other investment reservation missing');if(r.state!=='unknown')Object.assign(r,{state:p.settled?'settled':'unknown',status:p.status});break;}
    case 'other_unknown':{const r=state.other.get(p.executionId);requireThat(r,'Other investment reservation missing');r.state='unknown';break;}
    default:throw new Error('Unknown finite authority event');
   }
  }
  const custody=JSON.parse(readFileSync(this.custodyPath,'utf8')) as Custody;requireThat(canonical(custody)===canonical(state.head),'Finite authority/custody mismatch: offline reconciliation required');return state;
 }
 private append(state:State,kind:string,payload:unknown,at:string){const body={sequence:state.head.sequence+1,epoch:state.head.epoch,at,kind,payload:canonical(payload),previous:state.head.digest};const digest=hash(body);this.db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?,?)').run(body.sequence,body.epoch,at,kind,body.payload,body.previous,digest);state.head={epoch:body.epoch,sequence:body.sequence,digest,at};}
 private custody(head:Custody){const tmp=this.custodyPath+'.'+randomUUID();const fd=openSync(tmp,'wx',0o600);try{writeFileSync(fd,canonical(head));fsyncSync(fd);}finally{closeSync(fd);}renameSync(tmp,this.custodyPath);syncDir(dirname(this.custodyPath));}
 private tx<T>(at:string,fn:(s:State,add:(kind:string,payload:unknown)=>void)=>T):T {
  this.present();this.db.exec('BEGIN IMMEDIATE');let committed=false;
  try{const s=this.read();requireThat(validTime(at)&&at>=s.head.at,'Finite authority clock moved backward');const value=fn(s,(kind,payload)=>this.append(s,kind,payload,at));this.db.exec('COMMIT');committed=true;this.custody(s.head);return value;}
  catch(e){if(!committed)this.db.exec('ROLLBACK');throw e;}
 }
 approve(envelope:FiniteEnvelope,attestation:ReloadAttestation,at:string){this.tx(at,(s,add)=>{validateEnvelope(envelope);requireThat(!s.authorities.has(envelope.authorityId)&&![...s.authorities.values()].some(e=>e.runId===envelope.runId||e.scopeId===envelope.scopeId),'Finite authority already exists');requireThat(envelope.approval.approvedAt===at,'Truthful authority approval timestamp required');this.validAttestation(envelope,attestation,at);add('approve',envelope);add('attest',attestation);});}
 private validAttestation(e:FiniteEnvelope,a:ReloadAttestation,at:string){requireThat(a&&a.authorityId===e.authorityId&&a.runId===e.runId&&a.accountFingerprint===e.accountFingerprint&&a.ownerId===e.approval.ownerId&&a.reloadOff===true&&hex(a.evidenceHash)&&validTime(a.confirmedAt)&&a.confirmedAt<=at&&Date.parse(at)-Date.parse(a.confirmedAt)<86400000,'Recent authentic owner reload-OFF attestation required');}
 renew(a:ReloadAttestation,at:string){this.tx(at,(s,add)=>{const e=s.authorities.get(a.authorityId);requireThat(e&&!s.stopped.has(e.authorityId)&&at<e.expiresAt,'Authority missing, stopped or expired');this.validAttestation(e,a,at);requireThat(a.confirmedAt>=(s.attestations.get(e.authorityId)?.confirmedAt??''),'Attestation reversal');add('attest',a);});}
 invalidateReload(id:string,at:string){this.tx(at,(s,add)=>{requireThat(s.authorities.has(id),'Finite authority missing');add('reload_invalid',{authorityId:id});add('hold',{authorityId:id,reason:'Owner reports reload status changed or unavailable'});});}
 private current(s:State,id:string,at:string,held=false){const e=s.authorities.get(id);requireThat(e&&!s.stopped.has(id)&&at<e.expiresAt&&at>=s.head.at,'Finite authority unavailable, expired or clock reversed');requireThat(held||!s.holds.has(id),s.holds.get(id)??'Finite authority held');this.validAttestation(e,s.attestations.get(id)!,at);return e;}
 envelope(id:string){const e=this.read().authorities.get(id);requireThat(e,'Finite authority missing');return structuredClone(e);}
 check(id:string,at:string){const s=this.read();this.current(s,id,at);requireThat(![...s.other.values()].some(r=>r.state==='unknown')&&![...s.reservations.values()].some(r=>r.state==='unknown'),'Unknown finite settlement permanently fences new work');return s;}
 counts(id:string,at:string){const s=this.read(),e=s.authorities.get(id);requireThat(e,'Finite authority missing');const all=[...s.reservations.values()],run=all.filter(r=>r.runId===e.runId),rolling=new Map([...s.observed.values(),...s.other.values(),...all].filter(r=>Date.parse(r.reservedAt)>Date.parse(at)-86400000).map(r=>[r.executionId,r]));return {controlRevision:s.revisions.get(id)??0,run:run.length,rolling:rolling.size,workers:Object.fromEntries(e.participants.map(p=>[p.workerId,run.filter(r=>r.workerId===p.workerId).length])),active:all.filter(r=>['reserved','admitted','transmitted','unknown'].includes(r.state)).length+[...s.other.values()].filter(r=>r.state!=='settled').length,reservations:run,hold:s.holds.get(id)??null,stopped:s.stopped.has(id),reloadConfirmedAt:s.attestations.get(id)?.confirmedAt??null};}
 observe(records:{executionId:string;reservedAt:string}[],at:string){this.tx(at,(s,add)=>{for(const r of records){requireThat(validTime(r.reservedAt)&&r.reservedAt<=at,'Invalid historical reservation');const prior=s.observed.get(r.executionId);requireThat(!prior||canonical(prior)===canonical(r),'Historical reservation changed');if(!prior&&!s.reservations.has(r.executionId)&&!s.other.has(r.executionId))add('observe',r);}});}
 reserve(r:FiniteReservation,at:string){this.tx(at,(s,add)=>{
  const e=this.current(s,r.authorityId,at),all=[...s.reservations.values()],run=all.filter(x=>x.runId===r.runId),rolling=new Set([...s.observed.values(),...s.other.values(),...all].filter(x=>Date.parse(x.reservedAt)>Date.parse(at)-86400000).map(x=>x.executionId));
  requireThat(![...s.other.values()].some(x=>x.state!=='settled')&&!all.some(x=>['reserved','admitted','transmitted','unknown'].includes(x.state)),'Finite investment fence occupied');
  requireThat(!all.some(x=>x.executionId===r.executionId||x.requestId===r.requestId),'Finite request already consumed');
  requireThat(r.runId===e.runId&&r.scopeId===e.scopeId&&r.scopeDigest===e.scopeDigest&&canonical(r.profile)===canonical(e.profile)&&e.participants.some(p=>p.workerId===r.workerId)&&r.day===new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))&&r.reservedAt===at&&validTime(r.deadline)&&r.deadline>at&&r.deadline<=e.expiresAt&&Date.parse(r.deadline)<=Date.parse(at)+e.policy.maxDurationMs&&r.occurrenceId.length>0&&Number.isSafeInteger(r.generation)&&r.generation>0&&r.sessionId.length>0&&r.conversationId.length>0&&Number.isSafeInteger(r.providerGeneration)&&r.providerGeneration>0,'Finite reservation binding mismatch');
  requireThat(run.length<e.policy.maxRun&&rolling.size<e.policy.maxRolling24h&&run.filter(x=>x.workerId===r.workerId).length<e.policy.maxWorker&&run.filter(x=>x.occurrenceId===r.occurrenceId).length<e.policy.maxCycle&&run.filter(x=>x.day===r.day).length<e.policy.maxDay,'Finite allocation exhausted');add('reserve',r);
 });}
 admit(r:FiniteReservation,identity:{threadId:string;model:string;accountFingerprint:string;routingFingerprint:string},at:string){this.tx(at,(s,add)=>{const e=this.current(s,r.authorityId,at),stored=s.reservations.get(r.executionId);requireThat(stored?.state==='reserved','Exact unspent finite admission required');const {state:_,...binding}=stored;requireThat(canonical(binding)===canonical(r)&&at<r.deadline,'Exact unspent finite admission required');requireThat(identity.model===e.profile.model&&identity.accountFingerprint===e.accountFingerprint&&identity.routingFingerprint===e.routingFingerprint&&identity.threadId.length>0,'Approved account, model or routing changed');add('admit',{executionId:r.executionId,threadId:identity.threadId});});}
 settle(executionId:string,status:string,settled:boolean,complete:boolean,at:string){this.tx(at,(s,add)=>{const r=s.reservations.get(executionId);requireThat(r,'Finite reservation missing');add('settle',{executionId,status,settled,complete});if(!settled||status!=='completed'||!complete)add('hold',{authorityId:r.authorityId,reason:!settled?'Unknown provider settlement':status!=='completed'?'Provider turn did not complete':'Required token telemetry incomplete'});});}
 transmit(executionId:string,threadId:string,account:{fingerprint:string;routingFingerprint:string},at:string){this.tx(at,(s,add)=>{const r=s.reservations.get(executionId);requireThat(r?.state==='admitted'&&r.threadId===threadId&&at<r.deadline,'Finite transmission already consumed or unadmitted');const e=this.current(s,r.authorityId,at);requireThat(account.fingerprint===e.accountFingerprint&&account.routingFingerprint===e.routingFingerprint,'Approved account/routing changed before transmission');add('transmit',{executionId,threadId});});}
 hold(id:string,reason:string,at:string,stop=false){this.tx(at,(s,add)=>{requireThat(s.authorities.has(id),'Finite authority missing');add(stop?'stop':'hold',{authorityId:id,reason});});}
 recover(local:{executionId:string;settled:boolean;status:string;complete:boolean}[],at:string){this.tx(at,(s,add)=>{for(const r of s.other.values()){const l=local.find(x=>x.executionId===r.executionId);if(r.state!=='settled'||!l?.settled||l.status!==r.status)add('other_unknown',{executionId:r.executionId});}for(const r of s.reservations.values()){const l=local.find(x=>x.executionId===r.executionId);if(r.state!=='settled'||!l?.settled||l.status!==r.status||l.complete!==r.complete)add('unknown',{executionId:r.executionId});}for(const id of s.authorities.keys())if(!s.stopped.has(id))add('hold',{authorityId:id,reason:'Recovery requires exact owner resume of eligible future work'});});}
 resume(id:string,at:string){this.tx(at,(s,add)=>{this.current(s,id,at,true);requireThat(![...s.other.values()].some(r=>r.state!=='settled')&&![...s.reservations.values()].some(r=>r.state!=='settled'||r.status!=='completed'||!r.complete),'Unsettled or incomplete finite history cannot resume');add('resume',{authorityId:id});});}
 /** Owner idempotency belongs outside company restore paths, alongside its effect. */
 ownerReload(id:string,receiptId:string,requestHash:string,reloadOff:boolean,at:string){return this.tx(at,(s,add)=>{
  const old=s.receipts.get(receiptId);if(old){requireThat(old.requestHash===requestHash&&old.authorityId===id,'Finite owner receipt conflict');return old;}
  const e=s.authorities.get(id);requireThat(e&&!s.stopped.has(id)&&at<e.expiresAt,'Authority missing, stopped or expired');
  if(reloadOff){const a:ReloadAttestation={authorityId:id,runId:e.runId,accountFingerprint:e.accountFingerprint,ownerId:e.approval.ownerId,confirmedAt:at,reloadOff:true,evidenceHash:requestHash};this.validAttestation(e,a,at);add('attest',a);}else{add('reload_invalid',{authorityId:id});add('hold',{authorityId:id,reason:'Owner reports reload status changed or unavailable'});}
  const result:OwnerReceipt={receiptId,requestHash,authorityId:id,action:reloadOff?'reload_off':'reload_unavailable',confirmedAt:at,controlRevision:reloadOff?s.revisions.get(id)??0:s.head.sequence};add('owner_receipt',result);return result;
 });}
 ownerControl(id:string,action:'pause'|'stop'|'resume',receiptId:string,requestHash:string,expectedRevision:number|undefined,at:string){return this.tx(at,(s,add)=>{
  const old=s.receipts.get(receiptId);if(old){requireThat(old.requestHash===requestHash&&old.authorityId===id&&old.action===action,'Finite owner receipt conflict');if(action==='resume')requireThat(old.controlRevision===(s.revisions.get(id)??0),'Historical resume cannot clear a newer hold');return old;}
  requireThat(s.authorities.has(id),'Finite authority missing');
  if(action==='resume'){const e=this.current(s,id,at,true);requireThat(expectedRevision===(s.revisions.get(id)??0),'Exact current authority hold revision required');requireThat([...s.other.values()].every(r=>r.state==='settled')&&[...s.reservations.values()].every(r=>r.state==='settled'&&r.status==='completed'&&r.complete),'Unsettled or incomplete finite history cannot resume');requireThat([...s.reservations.values()].filter(r=>r.runId===e.runId).length<e.policy.maxRun,'Exhausted finite run cannot resume');add('resume',{authorityId:id});}
  else add(action==='stop'?'stop':'hold',{authorityId:id,reason:'Owner '+action});
  const result:OwnerReceipt={receiptId,requestHash,authorityId:id,action,confirmedAt:at,controlRevision:s.head.sequence};add('owner_receipt',result);return result;
 });}
 /** Accounting only: never grants another investment mode runtime permission. */
 exposure(at:string){const s=this.read();requireThat(validTime(at)&&at>=s.head.at,'Finite authority clock moved backward');return {rolling:new Set([...s.observed.values(),...s.other.values(),...s.reservations.values()].filter(r=>Date.parse(r.reservedAt)>Date.parse(at)-86400000).map(r=>r.executionId)).size,active:[...s.other.values()].some(r=>r.state!=='settled')||[...s.reservations.values()].some(r=>r.state!=='settled')};}
 reserveOther(r:{executionId:string;reservedAt:string},at:string){this.tx(at,(s,add)=>{requireThat(r.executionId.length>0&&r.reservedAt===at&&!s.other.has(r.executionId)&&!s.observed.has(r.executionId)&&!s.reservations.has(r.executionId),'Other investment identity already consumed');const all=[...s.other.values(),...s.reservations.values()];requireThat(all.every(x=>x.state==='settled'),'External investment fence occupied');requireThat(new Set([...s.observed.values(),...all].filter(x=>Date.parse(x.reservedAt)>Date.parse(at)-86400000).map(x=>x.executionId)).size<8,'External rolling investment allocation exhausted');add('other_reserve',r);});}
 checkOther(executionId:string,at:string){const s=this.read();requireThat(at>=s.head.at&&s.other.get(executionId)?.state==='active','Other investment reservation missing or uncertain');}
 settleOther(executionId:string,status:string,settled:boolean,at:string){this.tx(at,(s,add)=>{requireThat(s.other.has(executionId),'Other investment reservation missing');add('other_settle',{executionId,status,settled});});}
 otherState(executionId:string){return this.read().other.get(executionId);}
 state(executionId:string){return this.read().reservations.get(executionId);}
 close(){this.db.close();}
}
function createJournal(path:string,custodyPath:string,at:string){
 requireThat(validTime(at)&&dirname(path)!==dirname(custodyPath),'Independent finite custody location required');privatePath(dirname(path));privatePath(dirname(custodyPath));
 const fd=openSync(path,'wx',0o600);closeSync(fd);const cf=openSync(custodyPath,'wx',0o600);closeSync(cf);const db=new DatabaseSync(path),epoch=randomUUID();
 try{db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA user_version=1; CREATE TABLE events(sequence INTEGER PRIMARY KEY,epoch TEXT NOT NULL,at TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,previous TEXT,digest TEXT NOT NULL UNIQUE); CREATE TRIGGER immutable BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'Finite authority immutable'); END; CREATE TRIGGER retained BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'Finite authority retained'); END;`);const body={sequence:1,epoch,at,kind:'genesis',payload:'{}',previous:null},digest=hash(body);db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?,?)').run(1,epoch,at,'genesis','{}',null,digest);const c=openSync(custodyPath,'r+');try{writeFileSync(c,canonical({epoch,sequence:1,digest,at}));fsyncSync(c);}finally{closeSync(c);}}finally{db.close();syncDir(dirname(path));syncDir(dirname(custodyPath));}
 return new FiniteJournal(path,custodyPath);
}
const serviceRoot=join(userInfo().homedir,'.botsquad'),authorityDir=join(serviceRoot,'finite-hq-authority'),custodyDir=join(serviceRoot,'finite-hq-custody');
const trusted=new WeakSet<FiniteJournal>();
/** A later explicitly approved operational task must provision this once. Never called by startup or HTTP. */
export function provisionFiniteJournal(at:string){mkdirSync(serviceRoot,{recursive:true,mode:0o700});privatePath(serviceRoot);mkdirSync(authorityDir,{mode:0o700});syncDir(serviceRoot);mkdirSync(custodyDir,{mode:0o700});syncDir(serviceRoot);const j=createJournal(join(authorityDir,'authority.sqlite'),join(custodyDir,'checkpoint.json'),at);trusted.add(j);return j;}
export function openFiniteJournal(){privatePath(serviceRoot);const j=new FiniteJournal(join(authorityDir,'authority.sqlite'),join(custodyDir,'checkpoint.json'));trusted.add(j);return j;}
export function isTrustedFiniteJournal(j:FiniteJournal){return trusted.has(j);}

/** Probe only; partial custody never becomes a fresh allowance. */
export function existingFiniteJournal(){if(!existsSync(authorityDir)&&!existsSync(custodyDir))return undefined;return openFiniteJournal();}
