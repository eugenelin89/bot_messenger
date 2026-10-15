/** Finite HQ authority. Independent of company snapshots and Decision 037. No implicit initialization. */
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {closeSync,existsSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,realpathSync,renameSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {userInfo} from 'node:os';
import {requireThat} from '../../domain/model.js';
import {canonical,hash} from '../../domain/investment/identity.js';
import {executionPolicy,finiteProfile,type FiniteAIProfile,type FiniteHQPolicy} from '../../domain/usage/policy.js';

export interface TelemetryRecovery {
 oldAuthorityId:string;executionId:string;reservationHash:string;checkpointDigest:string;
 localUsageHash:string;retainedEvidenceHash:string;portfolioHead:string;maxAdditional:7;
}
export interface ObservedRenewal {
 oldAuthorityId:string;predecessorIds:string[];checkpointDigest:string;
 baseline:{executionId:string;reservationHash:string}[];
 exceptions:{executionId:string;authorityId:string;reservationHash:string;localUsageHash:string;status:string}[];
 portfolioHead:string;ownerReceiptHash:string;maxAdditional:7;session:string;collectAt:string;researchAt:string;
}
export interface FiniteEnvelope {
 recovery?:TelemetryRecovery;
 renewal?:ObservedRenewal;
 authorityId:string;hqId:string;root:string;runId:string;groupId:string;scopeId:string;
 previewDigest:string;configurationHash:string;sourceHash:string;calendarHash:string;occurrencesHash:string;scopeDigest:string;loopDigest:string;
 participants:{workerId:string;responsibility:string}[];proposers:string[];reviewers:string[];submitters:string[];
 profile:FiniteAIProfile;accountFingerprint:string;routingFingerprint:string;expiresAt:string;
 research?:{requestHashes:string[];retainUntil:string};purpose?:'private_research'|'observed_paper';evidenceMode:'synthetic_fixture'|'observed';methodology:'inv05-v1'|'private-research-v1'|'inv-real-open-v1';paperOperations:string[];policy:FiniteHQPolicy;
 approval:{ownerId:string;receiptHash:string;approvedAt:string};
}
export interface ReloadAttestation {authorityId:string;runId:string;accountFingerprint:string;ownerId:string;confirmedAt:string;reloadOff:true;evidenceHash:string}
export interface FiniteReservation {authorityId:string;executionId:string;requestId:string;workerId:string;runId:string;scopeId:string;occurrenceId:string;generation:number;sessionId:string;providerGeneration:number;conversationId:string;day:string;reservedAt:string;deadline:string;scopeDigest:string;profile:FiniteAIProfile}
interface Entry {sequence:number;epoch:string;at:string;kind:string;payload:string;previous:string|null;digest:string}
interface Custody {epoch:string;sequence:number;digest:string;at:string}
export interface ReservationState extends FiniteReservation {state:'reserved'|'admitted'|'transmitted'|'settled'|'unknown';threadId?:string;status?:string;complete?:boolean}
interface OtherReservation {executionId:string;reservedAt:string;state:"active"|"settled"|"unknown";status?:string}
interface OwnerReceipt {receiptId:string;requestHash:string;authorityId:string;action:string;confirmedAt:string;controlRevision:number;reloadHash?:string}
interface CollectionReservation {authorityId:string;requestHash:string;state:'reserved'|'settled'|'unknown';at:string;status?:string;settledAt?:string;wireAt?:string}
interface State {recoveryHolds:Set<string>;providerUntil:string|null;providerBlocked:boolean;collections:Map<string,CollectionReservation>;receipts:Map<string,OwnerReceipt>;revisions:Map<string,number>;other:Map<string,OtherReservation>;authorities:Map<string,FiniteEnvelope>;attestations:Map<string,ReloadAttestation>;reservations:Map<string,ReservationState>;holds:Map<string,string>;stopped:Set<string>;observed:Map<string,{executionId:string;reservedAt:string}>;head:Custody}
const hex=(v:string)=>/^[a-f0-9]{64}$/.test(v);
const validTime=(s:string)=>Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const uid=()=>process.getuid?.();
function privatePath(path:string,file=false){const s=lstatSync(path);requireThat(realpathSync(path)===path&&!s.isSymbolicLink()&&s.uid===uid()&&(s.mode&0o077)===0&&(file?s.isFile()&&s.nlink===1:s.isDirectory()),'Finite authority requires canonical owner-private custody');return s;}
function syncDir(path:string){const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}
function validateEnvelope(e:FiniteEnvelope){
 if(e.renewal){const r=e.renewal;requireThat(!e.recovery&&e.purpose==='observed_paper'&&r.maxAdditional===7&&e.policy.maxRun===7&&e.policy.maxRolling24h===7&&e.policy.maxCycle===7&&e.policy.maxDay===7&&e.policy.maxWorker===7&&r.predecessorIds.length===2&&new Set(r.predecessorIds).size===2&&r.predecessorIds.includes(r.oldAuthorityId)&&!r.predecessorIds.includes(e.authorityId)&&r.baseline.length>0&&new Set(r.baseline.map(x=>x.executionId)).size===r.baseline.length&&r.baseline.every(x=>hex(x.reservationHash))&&r.exceptions.length===2&&new Set(r.exceptions.map(x=>x.executionId)).size===2&&r.exceptions.every(x=>hex(x.reservationHash)&&hex(x.localUsageHash)&&r.predecessorIds.includes(x.authorityId))&&[r.checkpointDigest,r.portfolioHead,r.ownerReceiptHash].every(hex)&&/^\d{4}-\d{2}-\d{2}$/.test(r.session)&&validTime(r.collectAt)&&validTime(r.researchAt)&&r.collectAt<r.researchAt&&r.researchAt<e.expiresAt,'Exact bounded observed renewal required');}
 requireThat(executionPolicy(e.policy).mode==='credit_approved_finite_hq'&&e.authorityId===e.policy.authorityId,'Finite policy mismatch');finiteProfile(e.profile);if(e.recovery)requireThat(e.purpose==='observed_paper'&&e.recovery.maxAdditional===7&&e.recovery.oldAuthorityId!==e.authorityId&&[e.recovery.reservationHash,e.recovery.checkpointDigest,e.recovery.localUsageHash,e.recovery.retainedEvidenceHash,e.recovery.portfolioHead].every(hex),'Exact telemetry recovery binding required');
 requireThat(realpathSync(e.root)===e.root&&e.hqId.length>0&&e.runId.length>0&&e.groupId.length>0&&e.scopeId.length>0,'Exact canonical HQ identity required');
 requireThat([e.previewDigest,e.configurationHash,e.sourceHash,e.calendarHash,e.occurrencesHash,e.scopeDigest,e.loopDigest,e.accountFingerprint,e.routingFingerprint,e.approval.receiptHash].every(hex),'Frozen authority digests required');
 requireThat(e.purpose==='private_research'?['synthetic_fixture','observed'].includes(e.evidenceMode)&&e.methodology==='private-research-v1'&&e.paperOperations.length===0:(e.purpose===undefined&&e.evidenceMode==='synthetic_fixture'&&e.methodology==='inv05-v1'||e.purpose==='observed_paper'&&['observed','synthetic_fixture'].includes(e.evidenceMode)&&e.methodology==='inv-real-open-v1')&&canonical(e.paperOperations)===canonical(['paper_inspect','paper_propose','paper_read_proposal','paper_review','paper_submit']),'Exact research or synthetic paper authority required');
 if(e.purpose==='private_research')requireThat(e.research&&e.research.requestHashes.length>0&&e.research.requestHashes.length<=3&&new Set(e.research.requestHashes).size===e.research.requestHashes.length&&e.research.requestHashes.every(hex)&&validTime(e.research.retainUntil)&&e.research.retainUntil>=e.expiresAt&&e.proposers.length===0&&e.submitters.length===0,'Bounded research collection/retention required');else if(e.purpose==='observed_paper')requireThat(e.research&&e.research.requestHashes.length>0&&e.research.requestHashes.length<=160&&new Set(e.research.requestHashes).size===e.research.requestHashes.length&&e.research.requestHashes.every(hex)&&validTime(e.research.retainUntil)&&e.research.retainUntil>=e.expiresAt&&Date.parse(e.expiresAt)-Date.parse(e.approval.approvedAt)<=31*86400000,'Finite observed source and retention required');else requireThat(e.research===undefined,'Paper scope cannot acquire collection');
 const ids=e.participants.map(p=>p.workerId);requireThat(ids.length>=2&&ids.length<=6&&new Set(ids).size===ids.length&&e.participants.every(p=>p.responsibility.length>0),'Invalid finite roster');
 requireThat((e.purpose==='private_research'?[e.reviewers]:[e.proposers,e.reviewers,e.submitters]).every(role=>role.length>0&&new Set(role).size===role.length&&role.every(id=>ids.includes(id))),'Invalid finite roles');
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
  const state:State={recoveryHolds:new Set(),providerUntil:null,providerBlocked:false,collections:new Map(),receipts:new Map(),revisions:new Map(),other:new Map(),authorities:new Map(),attestations:new Map(),reservations:new Map(),holds:new Map(),stopped:new Set(),observed:new Map(),head:null!};
  let previous:string|null=null,last=0,epoch='';
  for(const row of rows){const {digest,...body}=row;requireThat(row.sequence===++last&&row.previous===previous&&hash(body)===digest&&validTime(row.at)&&(!state.head||row.at>=state.head.at),'Finite authority history discontinuity');
   if(last===1){requireThat(row.kind==='genesis','Finite authority genesis missing');epoch=row.epoch;}requireThat(row.epoch===epoch,'Finite authority epoch changed');previous=digest;state.head={epoch,sequence:last,digest,at:row.at};
   const p=JSON.parse(row.payload);
   switch(row.kind){
    case 'collection_reserve':requireThat(!state.collections.has(p.id),'Collection cannot replay');state.collections.set(p.id,p);break;
    case 'collection_settle':{const r=state.collections.get(p.id);requireThat(r?.state==='reserved','Collection already settled');r.state=p.known?'settled':'unknown';r.status=p.status;r.settledAt=row.at;if(p.retryAt)state.providerUntil=state.providerUntil&&state.providerUntil>p.retryAt?state.providerUntil:p.retryAt;if(p.blocked)state.providerBlocked=true;break;}
    case 'collection_wire':{const r=state.collections.get(p.id);requireThat(r?.state==='reserved'&&!r.wireAt,'Collection wire already consumed');r.wireAt=row.at;break;}
    case 'collection_unknown':{const r=state.collections.get(p.id);requireThat(r,'Collection missing');r.state='unknown';break;}
    case 'genesis':requireThat(last===1,'Duplicate genesis');break;
    case 'approve_renewal':requireThat(p.renewal,'Renewal event binding missing');
    case 'approve':validateEnvelope(p);requireThat(row.kind==='approve_renewal'||!p.renewal,'Renewal requires versioned event');requireThat(!state.authorities.has(p.authorityId),'Duplicate authority');state.authorities.set(p.authorityId,p);break;
    case 'attest':state.attestations.set(p.authorityId,p);break;
    case 'reload_invalid':state.attestations.delete(p.authorityId);break;
    case 'reserve':requireThat(!state.reservations.has(p.executionId),'Duplicate reservation');state.reservations.set(p.executionId,{...p,state:'reserved'});break;
    case 'admit':{const r=state.reservations.get(p.executionId);requireThat(r?.state==='reserved','Invalid admission history');Object.assign(r,{state:'admitted',threadId:p.threadId});break;}
    case 'transmit':{const r=state.reservations.get(p.executionId);requireThat(r?.state==='admitted'&&r.threadId===p.threadId,'Invalid finite transmission history');r.state='transmitted';break;}
    case 'settle':{const r=state.reservations.get(p.executionId);requireThat(r,'Settlement without reservation');if(r.state!=='unknown')Object.assign(r,{state:p.settled?'settled':'unknown',status:p.status,complete:p.complete});break;}
    case 'unknown':{const r=state.reservations.get(p.executionId);requireThat(r,'Unknown reservation missing');r.state='unknown';break;}
    case 'hold':{const recoverable=p.cause==='recovery'&&(!state.holds.has(p.authorityId)||state.recoveryHolds.has(p.authorityId));state.recoveryHolds.delete(p.authorityId);if(recoverable)state.recoveryHolds.add(p.authorityId);state.holds.set(p.authorityId,p.reason);state.revisions.set(p.authorityId,row.sequence);break;}
    case 'resume':state.recoveryHolds.delete(p.authorityId);state.holds.delete(p.authorityId);state.revisions.set(p.authorityId,row.sequence);break;
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
  try{const s=this.read();requireThat(validTime(at)&&at>=s.head.at,'Finite authority clock moved backward');const before=s.head.sequence,value=fn(s,(kind,payload)=>this.append(s,kind,payload,at));this.db.exec('COMMIT');committed=true;if(s.head.sequence!==before)this.custody(s.head);return value;}
  catch(e){if(!committed)this.db.exec('ROLLBACK');throw e;}
 }
 approve(envelope:FiniteEnvelope,attestation:ReloadAttestation,at:string){requireThat(!envelope.recovery&&!envelope.renewal,'Use exact one-use recovery or renewal approval');this.tx(at,(s,add)=>{validateEnvelope(envelope);requireThat(!s.authorities.has(envelope.authorityId)&&![...s.authorities.values()].some(e=>e.scopeId===envelope.scopeId||e.runId===envelope.runId&&!(envelope.purpose==='observed_paper'&&e.purpose==='observed_paper'&&(s.stopped.has(e.authorityId)||e.expiresAt<=at)&&[...s.reservations.values()].filter(r=>r.authorityId===e.authorityId).every(r=>r.state==='settled'&&['completed','failed','interrupted'].includes(r.status??'')&&r.complete)&&[...s.collections.values()].filter(r=>r.authorityId===e.authorityId).every(r=>r.state==='settled'))),'Finite authority already exists');requireThat(envelope.approval.approvedAt===at,'Truthful authority approval timestamp required');this.validAttestation(envelope,attestation,at);add('approve',envelope);add('attest',attestation);});}
 /** Explicit fresh allowance after the two retained settled gaps; never refunds history. */
 renewalPreview(oldAuthorityId:string,executionIds:string[],at:string){
  const s=this.read(),e=s.authorities.get(oldAuthorityId);this.providerReady(s,at);this.collectionFence(s);
  requireThat(e?.purpose==='observed_paper'&&e.recovery&&!e.renewal&&s.holds.has(oldAuthorityId)&&!s.stopped.has(oldAuthorityId)&&at<e.expiresAt,'Held one-use recovery predecessor required');
  const predecessorIds=[e.recovery.oldAuthorityId,oldAuthorityId].sort(),all=[...s.reservations.values()];
  requireThat(s.other.size===0&&s.observed.size===0&&[...s.authorities.values()].every(x=>x.runId===e.runId&&predecessorIds.includes(x.authorityId))&&all.every(x=>predecessorIds.includes(x.authorityId)&&x.state==='settled'),'Uncertain or unrelated history blocks renewal');
  const gaps=all.filter(x=>!x.complete);requireThat(gaps.length===2&&canonical(gaps.map(x=>x.executionId).sort())===canonical([...executionIds].sort())&&gaps.every(x=>['completed','awaiting_approval','failed','interrupted'].includes(x.status??''))&&all.filter(x=>x.complete).every(x=>['completed','failed','interrupted'].includes(x.status??'')),'Exact two settled incomplete records required');
  requireThat(s.stopped.has(e.recovery.oldAuthorityId),'Original authority must remain retired');this.validAttestation(e,s.attestations.get(oldAuthorityId)!,at);
  return {oldAuthorityId,predecessorIds,checkpointDigest:s.head.digest,baseline:all.map(x=>({executionId:x.executionId,reservationHash:hash(x)})),exceptions:gaps.map(x=>({executionId:x.executionId,authorityId:x.authorityId,reservationHash:hash(x),status:x.status!})),reload:structuredClone(s.attestations.get(oldAuthorityId)!)};
 }
 approveRenewal(envelope:FiniteEnvelope,attestation:ReloadAttestation,oldAccount:{accountFingerprint:string;routingFingerprint:string},at:string){return this.tx(at,(s,add)=>{
  validateEnvelope(envelope);const r=envelope.renewal;requireThat(r,'Exact renewal required');const duplicate=s.authorities.get(envelope.authorityId);
  if(duplicate){requireThat(canonical(duplicate)===canonical(envelope)&&canonical(s.attestations.get(envelope.authorityId))===canonical(attestation),'Renewal receipt conflict');return duplicate;}
  const p=this.renewalPreview(r.oldAuthorityId,r.exceptions.map(x=>x.executionId),at),old=s.authorities.get(r.oldAuthorityId)!;
  requireThat(r.checkpointDigest===p.checkpointDigest&&canonical(r.predecessorIds)===canonical(p.predecessorIds)&&canonical(r.baseline)===canonical(p.baseline)&&canonical(r.exceptions.map(({localUsageHash,...x})=>x))===canonical(p.exceptions),'Renewal retained history or custody changed');
  requireThat(![...s.authorities.values()].some(x=>x.scopeId===envelope.scopeId||x.approval.receiptHash===envelope.approval.receiptHash||x.renewal?.ownerReceiptHash===r.ownerReceiptHash),'Renewal already consumed');
  requireThat(envelope.approval.approvedAt===at&&envelope.approval.ownerId===old.approval.ownerId&&at<r.collectAt,'Truthful future owner renewal required');
  for(const key of ['hqId','root','runId','configurationHash','sourceHash','calendarHash','participants','proposers','reviewers','submitters','profile','evidenceMode','methodology','paperOperations'] as const)requireThat(canonical(envelope[key])===canonical(old[key]),'Renewal cannot change retained identity or profile');
  requireThat(oldAccount.accountFingerprint===old.accountFingerprint&&oldAccount.routingFingerprint===old.routingFingerprint&&envelope.policy.maxDurationMs===old.policy.maxDurationMs,'Original live account/routing and duration required');
  requireThat(envelope.research?.retainUntil===old.research?.retainUntil&&envelope.research!.requestHashes.every(h=>![...s.collections.values()].some(x=>r.predecessorIds.includes(x.authorityId)&&x.requestHash===h)),'Renewal source requests must be unspent');
  this.validAttestation(envelope,attestation,at);requireThat(attestation.confirmedAt===p.reload.confirmedAt&&attestation.evidenceHash===p.reload.evidenceHash,'Retain authentic reload confirmation');
  for(const authorityId of r.predecessorIds)add('stop',{authorityId,reason:'Explicit owner seven-call renewal; original consumption and gaps retained'});
  add('approve_renewal',envelope);add('attest',attestation);return envelope;
 });}
 /** Only a single settled-completed telemetry gap is eligible; no provider uncertainty is waived. */
 recoveryPreview(oldAuthorityId:string,executionId:string,at:string){const s=this.read();this.providerReady(s,at);this.collectionFence(s);const e=s.authorities.get(oldAuthorityId),r=s.reservations.get(executionId);
  requireThat(e?.purpose==='observed_paper'&&!e.recovery&&at<e.expiresAt&&s.holds.has(oldAuthorityId)&&!s.stopped.has(oldAuthorityId),'Exact held original observed authority required');
  requireThat(![...s.authorities.values()].some(a=>a.recovery?.oldAuthorityId===oldAuthorityId),'Telemetry exception permanently consumed');
  requireThat(r?.authorityId===oldAuthorityId&&r.state==='settled'&&r.status==='completed'&&r.complete===false,'Only settled-completed missing telemetry is eligible');
  requireThat([...s.reservations.values()].every(x=>x.state==='settled'&&x.status==='completed'&&(x.complete===true||x.executionId===executionId))&&s.other.size===0&&s.observed.size===0,'Additional incomplete or unproven history blocks recovery');
  this.validAttestation(e,s.attestations.get(oldAuthorityId)!,at);
  return {oldAuthorityId,executionId,reservationHash:hash(r),checkpointDigest:s.head.digest,oldAttempts:[...s.reservations.values()].filter(x=>x.authorityId===oldAuthorityId).length,reload:structuredClone(s.attestations.get(oldAuthorityId)!)};
 }
 /** Read-only explicit draft repair: only normal startup holds may follow the bound checkpoint. */
 recoveryDraftCheckpoint(oldAuthorityId:string,executionId:string,originalDigest:string,at:string){
  const current=this.recoveryPreview(oldAuthorityId,executionId,at),base=this.db.prepare('SELECT sequence FROM events WHERE digest=?').get(originalDigest) as {sequence:number}|undefined;
  requireThat(base,'Original recovery checkpoint is not retained');
  const suffix=this.db.prepare('SELECT * FROM events WHERE sequence>? ORDER BY sequence').all(base.sequence) as unknown as Entry[];
  requireThat(suffix.length>0&&suffix.every(e=>e.kind==='hold'&&canonical(JSON.parse(e.payload))===canonical({authorityId:oldAuthorityId,cause:'recovery',reason:'Recovery requires exact owner resume of eligible future work'})),'Only retained startup recovery holds permit draft revision');
  // recoveryPreview/read verified the entire contiguous hash chain and independent custody.
  return {...current,originalDigest,suffix:structuredClone(suffix)};
 }
 approveRecovery(envelope:FiniteEnvelope,attestation:ReloadAttestation,oldAccount:{accountFingerprint:string;routingFingerprint:string},at:string){this.tx(at,(s,add)=>{
  validateEnvelope(envelope);const link=envelope.recovery;requireThat(link,'Exact recovery required');
  // Re-read while holding BEGIN IMMEDIATE; external writers cannot consume the exception concurrently.
  const p=this.recoveryPreview(link.oldAuthorityId,link.executionId,at),old=s.authorities.get(link.oldAuthorityId)!;
  requireThat(link.reservationHash===p.reservationHash&&link.checkpointDigest===s.head.digest,'Recovery custody or exceptional record changed');
  requireThat(!s.authorities.has(envelope.authorityId)&&![...s.authorities.values()].some(a=>a.scopeId===envelope.scopeId||a.runId===envelope.runId&&a.authorityId!==old.authorityId),'Recovery successor already exists');
  requireThat(envelope.approval.approvedAt===at&&envelope.approval.ownerId===old.approval.ownerId,'Truthful owner recovery approval required');
  for(const key of ['hqId','root','runId','configurationHash','sourceHash','calendarHash','participants','proposers','reviewers','submitters','profile','expiresAt','evidenceMode','methodology','paperOperations'] as const)requireThat(canonical(envelope[key])===canonical(old[key]),'Recovery cannot change retained identity, profile or policy');
  requireThat(oldAccount.accountFingerprint===old.accountFingerprint&&oldAccount.routingFingerprint===old.routingFingerprint,'Original live account/routing verification required');
  for(const key of ['maxDay','maxRolling24h','maxCycle','maxWorker','maxDurationMs','maxConcurrent'] as const)requireThat(envelope.policy[key]===old.policy[key],'Recovery activity limit changed');
  requireThat(envelope.policy.maxRun===old.policy.maxRun&&p.oldAttempts===4,'Exact four retained plus seven additional ceiling required');
  requireThat(envelope.research?.retainUntil===old.research?.retainUntil&&envelope.research!.requestHashes.every(h=>old.research!.requestHashes.includes(h)&&![...s.collections.values()].some(r=>r.authorityId===old.authorityId&&r.requestHash===h)),'Recovery source must be original unused requests');
  this.validAttestation(envelope,attestation,at);requireThat(attestation.confirmedAt===p.reload.confirmedAt&&attestation.evidenceHash===p.reload.evidenceHash,'Retain authentic reload confirmation and evidence');
  add('stop',{authorityId:old.authorityId,reason:'Owner-approved one-use telemetry recovery; original gap retained'});add('approve',envelope);add('attest',attestation);
 });}
 private runLimit(e:FiniteEnvelope){return Math.min(e.policy.maxRun,e.recovery?4+e.recovery.maxAdditional:e.policy.maxRun);}
 private family(_s:State,e:FiniteEnvelope){return new Set([e.authorityId,...(e.recovery?[e.recovery.oldAuthorityId]:[])]);}
 private acceptedGap(e:FiniteEnvelope,r:ReservationState){return !!e.renewal&&r.state==='settled'&&r.complete===false&&e.renewal.exceptions.some(x=>x.executionId===r.executionId&&x.authorityId===r.authorityId&&x.status===r.status&&x.reservationHash===hash(r))||!!e.recovery&&r.authorityId===e.recovery.oldAuthorityId&&r.executionId===e.recovery.executionId&&hash(r)===e.recovery.reservationHash&&r.state==='settled'&&r.status==='completed'&&r.complete===false;}
 private renewalHistory(s:State,e:FiniteEnvelope){const r=e.renewal;if(!r)return;requireThat(s.other.size===0&&s.observed.size===0&&r.predecessorIds.every(id=>s.stopped.has(id))&&r.baseline.every(x=>hash(s.reservations.get(x.executionId))===x.reservationHash),'Renewal retained baseline changed');const baseline=new Set(r.baseline.map(x=>x.executionId));requireThat([...s.reservations.values()].every(x=>baseline.has(x.executionId)||x.authorityId===e.authorityId&&(x.state==='settled'?x.status==='completed'&&x.complete:x.state!=='unknown')),'New incomplete or uncertain renewal history');}
 private budget(s:State,e:FiniteEnvelope,at:string){const all=[...s.reservations.values()],run=all.filter(r=>e.purpose==='observed_paper'?this.family(s,e).has(r.authorityId):r.runId===e.runId),rawRolling=[...new Map([...s.observed.values(),...s.other.values(),...all].filter(r=>Date.parse(r.reservedAt)>Date.parse(at)-86400000).map(r=>[r.executionId,r])).values()],baseline=new Set(e.renewal?.baseline.map(x=>x.executionId)??[]);return {all,run,rawRolling,rolling:rawRolling.filter(x=>!baseline.has(x.executionId))};}
 private validAttestation(e:FiniteEnvelope,a:ReloadAttestation,at:string){requireThat(a&&a.authorityId===e.authorityId&&a.runId===e.runId&&a.accountFingerprint===e.accountFingerprint&&a.ownerId===e.approval.ownerId&&a.reloadOff===true&&hex(a.evidenceHash)&&validTime(a.confirmedAt)&&a.confirmedAt<=at&&Date.parse(at)-Date.parse(a.confirmedAt)<(e.purpose==='observed_paper'?31:1)*86400000,'Recent authentic owner reload-OFF attestation required');}
 renew(a:ReloadAttestation,at:string){this.tx(at,(s,add)=>{const e=s.authorities.get(a.authorityId);requireThat(e&&!s.stopped.has(e.authorityId)&&at<e.expiresAt,'Authority missing, stopped or expired');this.validAttestation(e,a,at);requireThat(a.confirmedAt>=(s.attestations.get(e.authorityId)?.confirmedAt??''),'Attestation reversal');add('attest',a);});}
 invalidateReload(id:string,at:string){this.tx(at,(s,add)=>{requireThat(s.authorities.has(id),'Finite authority missing');add('reload_invalid',{authorityId:id});add('hold',{authorityId:id,reason:'Owner reports reload status changed or unavailable'});});}
 private current(s:State,id:string,at:string,held=false){const e=s.authorities.get(id);requireThat(e&&!s.stopped.has(id)&&at<e.expiresAt&&at>=s.head.at,'Finite authority unavailable, expired or clock reversed');requireThat(held||!s.holds.has(id),s.holds.get(id)??'Finite authority held');this.validAttestation(e,s.attestations.get(id)!,at);this.renewalHistory(s,e);if(e.recovery){requireThat(s.other.size===0&&s.observed.size===0,'Unproven other investment history blocks recovery');const old=s.reservations.get(e.recovery.executionId);requireThat(old&&this.acceptedGap(e,old)&&s.stopped.has(e.recovery.oldAuthorityId),'Recovery history changed');requireThat([...s.reservations.values()].every(r=>r.state==='settled'?(r.status==='completed'&&r.complete===true||this.acceptedGap(e,r)):r.state!=='unknown'&&r.authorityId===e.authorityId),'Additional incomplete or uncertain recovery history');}return e;}
 hasAuthority(id:string){return this.read().authorities.has(id);}
 envelope(id:string){const e=this.read().authorities.get(id);requireThat(e,'Finite authority missing');return structuredClone(e);}
 private providerReady(s:State,at:string){requireThat(!s.providerBlocked&&(!s.providerUntil||at>=s.providerUntil),'Provider-wide research circuit is blocked');}
 sourceReady(id:string,at:string){const s=this.read();this.current(s,id,at);this.providerReady(s,at);this.collectionFence(s);}
 private collectionFence(s:State,except?:string){requireThat(![...s.collections].some(([id,r])=>id!==except&&r.state!=='settled'),'Research collection unresolved');}
 checkCollection(id:string,at:string){const s=this.read(),r=s.collections.get(id);this.providerReady(s,at);requireThat(r?.state==='reserved','Exact active collection required');this.current(s,r.authorityId,at);this.collectionFence(s,id);requireThat([...s.other.values(),...s.reservations.values()].every(r=>r.state==='settled'),'Investment fence occupied');return r;}
 collectionWire(id:string,at:string){this.tx(at,(s,add)=>{this.providerReady(s,at);const r=s.collections.get(id);requireThat(r?.state==='reserved'&&!r.wireAt,'Collection wire already consumed');this.current(s,r.authorityId,at);this.collectionFence(s,id);requireThat([...s.other.values(),...s.reservations.values()].every(r=>r.state==='settled'),'Investment fence occupied');const prior=[...s.collections.values()].filter(x=>x!==r).at(-1);requireThat(!prior||!!prior.settledAt&&Date.parse(at)-Date.parse(prior.settledAt)>=5000,'Provider-wide collection interval');add('collection_wire',{id});});}
 check(id:string,at:string){const s=this.read();this.current(s,id,at);requireThat(![...s.collections.values()].some(r=>r.state!=='settled'),'Research collection unresolved');requireThat(![...s.other.values()].some(r=>r.state==='unknown')&&![...s.reservations.values()].some(r=>r.state==='unknown'),'Unknown finite settlement permanently fences new work');return s;}
 reserveCollection(authorityId:string,requestHash:string,at:string){return this.tx(at,(s,add)=>{this.providerReady(s,at);const e=this.current(s,authorityId,at);requireThat([...s.other.values(),...s.reservations.values()].every(r=>r.state==='settled'),'Investment fence occupied');requireThat(['private_research','observed_paper'].includes(e.purpose??'')&&e.research?.requestHashes.includes(requestHash),'Collection not explicitly approved');requireThat(![...s.collections.values()].some(r=>r.state!=='settled'),'Research collection unresolved');const id=hash([authorityId,requestHash]),family=this.family(s,e);requireThat(!s.collections.has(id)&&![...s.collections.values()].some(r=>family.has(r.authorityId)&&r.requestHash===requestHash),'Collection allowance permanently spent');const last=[...s.collections.values()].at(-1);requireThat(!last||Date.parse(at)-Date.parse(last.settledAt??last.at)>=5000,'Provider-wide collection interval');add('collection_reserve',{id,authorityId,requestHash,state:'reserved',at});return id;});}
 settleCollection(id:string,status:string,known:boolean,at:string,retryAt:string|null=null,blocked=false){this.tx(at,(s,add)=>{const r=s.collections.get(id);requireThat(r?.state==='reserved','Collection already consumed');requireThat(retryAt===null||validTime(retryAt)&&retryAt>=at,'Invalid provider circuit deadline');add('collection_settle',{id,status,known,retryAt,blocked});if(!known||status!=='ok')add('hold',{authorityId:r.authorityId,reason:'Collection failed or uncertain; no automatic retry'});});}
 collection(id:string){return this.read().collections.get(id);}
 /** A durable absent wire marker proves this process did not transmit. The attempt
  * remains consumed and its authority held; unavailable journal evidence never clears it. */
 failCollection(id:string,at:string){this.tx(at,(s,add)=>{const r=s.collections.get(id);requireThat(r?.state==='reserved','Collection already consumed');const known=!r.wireAt;add('collection_settle',{id,status:known?'local_cancelled':'unknown',known,retryAt:null,blocked:false});add('hold',{authorityId:r.authorityId,reason:'Collection failed or uncertain; no automatic retry'});});}
 counts(id:string,at:string){const s=this.read(),e=s.authorities.get(id);requireThat(e,'Finite authority missing');const {all,run,rolling,rawRolling}=this.budget(s,e,at);return {providerCircuit:{until:s.providerUntil,blocked:s.providerBlocked},collections:[...s.collections.entries()].filter(([,r])=>r.authorityId===id).map(([id,r])=>({id,...r})),controlRevision:s.revisions.get(id)??0,run:run.length,rolling:rolling.length,rawRolling:rawRolling.length,lifetimeRun:all.filter(r=>r.runId===e.runId).length,renewal:e.renewal?{additional:e.renewal.maxAdditional,retainedAttempts:e.renewal.baseline.length,ownerReceiptHash:e.renewal.ownerReceiptHash}:null,workers:Object.fromEntries(e.participants.map(p=>[p.workerId,run.filter(r=>r.workerId===p.workerId).length])),active:all.filter(r=>['reserved','admitted','transmitted','unknown'].includes(r.state)).length+[...s.other.values()].filter(r=>r.state!=='settled').length,reservations:run,hold:s.holds.get(id)??null,stopped:s.stopped.has(id),reloadConfirmedAt:s.attestations.get(id)?.confirmedAt??null};}
 /** Read-only planning: aging a settled reservation never refunds its run allowance. */
 rollingCapacityAt(id:string,needed:number,at:string){
  const s=this.check(id,at),e=this.current(s,id,at);this.providerReady(s,at);
  requireThat(Number.isSafeInteger(needed)&&needed>0&&needed<=e.policy.maxRolling24h,'Invalid rolling planning allocation');
  requireThat([...s.other.values(),...s.reservations.values()].every(r=>r.state==='settled'),'Unsettled investment cannot wait for rolling capacity');
  const rolling=this.budget(s,e,at).rolling.sort((a,b)=>a.reservedAt.localeCompare(b.reservedAt));
  const release=rolling.length+needed-e.policy.maxRolling24h;
  return release<=0?at:new Date(Date.parse(rolling[release-1]!.reservedAt)+86400000).toISOString();
 }
 observe(records:{executionId:string;reservedAt:string}[],at:string){this.tx(at,(s,add)=>{for(const r of records){requireThat(validTime(r.reservedAt)&&r.reservedAt<=at,'Invalid historical reservation');const prior=s.observed.get(r.executionId);requireThat(!prior||canonical(prior)===canonical(r),'Historical reservation changed');if(!prior&&!s.reservations.has(r.executionId)&&!s.other.has(r.executionId))add('observe',r);}});}
 reserve(r:FiniteReservation,at:string){this.tx(at,(s,add)=>{
  this.collectionFence(s);const e=this.current(s,r.authorityId,at),{all,run,rolling}=this.budget(s,e,at);
  requireThat(![...s.other.values()].some(x=>x.state!=='settled')&&!all.some(x=>['reserved','admitted','transmitted','unknown'].includes(x.state)),'Finite investment fence occupied');
  requireThat(!all.some(x=>x.executionId===r.executionId||x.requestId===r.requestId),'Finite request already consumed');
  requireThat(r.runId===e.runId&&r.scopeId===e.scopeId&&r.scopeDigest===e.scopeDigest&&canonical(r.profile)===canonical(e.profile)&&e.participants.some(p=>p.workerId===r.workerId)&&r.day===new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))&&r.reservedAt===at&&validTime(r.deadline)&&r.deadline>at&&r.deadline<=e.expiresAt&&Date.parse(r.deadline)<=Date.parse(at)+e.policy.maxDurationMs&&r.occurrenceId.length>0&&Number.isSafeInteger(r.generation)&&r.generation>0&&r.sessionId.length>0&&r.conversationId.length>0&&Number.isSafeInteger(r.providerGeneration)&&r.providerGeneration>0,'Finite reservation binding mismatch');
  requireThat(run.length<this.runLimit(e)&&rolling.length<e.policy.maxRolling24h&&run.filter(x=>x.workerId===r.workerId).length<e.policy.maxWorker&&run.filter(x=>x.occurrenceId===r.occurrenceId).length<e.policy.maxCycle&&run.filter(x=>x.day===r.day).length<e.policy.maxDay,'Finite allocation exhausted');add('reserve',r);
 });}
 admit(r:FiniteReservation,identity:{threadId:string;model:string;accountFingerprint:string;routingFingerprint:string},at:string){this.tx(at,(s,add)=>{this.collectionFence(s);const e=this.current(s,r.authorityId,at),stored=s.reservations.get(r.executionId);requireThat(stored?.state==='reserved','Exact unspent finite admission required');const {state:_,...binding}=stored;requireThat(canonical(binding)===canonical(r)&&at<r.deadline,'Exact unspent finite admission required');requireThat(identity.model===e.profile.model&&identity.accountFingerprint===e.accountFingerprint&&identity.routingFingerprint===e.routingFingerprint&&identity.threadId.length>0,'Approved account, model or routing changed');add('admit',{executionId:r.executionId,threadId:identity.threadId});});}
 settle(executionId:string,status:string,settled:boolean,complete:boolean,at:string){this.tx(at,(s,add)=>{const r=s.reservations.get(executionId);requireThat(r,'Finite reservation missing');add('settle',{executionId,status,settled,complete});if(!settled||status!=='completed'||!complete)add('hold',{authorityId:r.authorityId,reason:!settled?'Unknown provider settlement':status!=='completed'?'Provider turn did not complete':'Required token telemetry incomplete'});});}
 transmit(executionId:string,threadId:string,account:{fingerprint:string;routingFingerprint:string},at:string){this.tx(at,(s,add)=>{this.collectionFence(s);const r=s.reservations.get(executionId);requireThat(r?.state==='admitted'&&r.threadId===threadId&&at<r.deadline,'Finite transmission already consumed or unadmitted');const e=this.current(s,r.authorityId,at);requireThat(account.fingerprint===e.accountFingerprint&&account.routingFingerprint===e.routingFingerprint,'Approved account/routing changed before transmission');add('transmit',{executionId,threadId});});}
 hold(id:string,reason:string,at:string,stop=false){this.tx(at,(s,add)=>{requireThat(s.authorities.has(id),'Finite authority missing');add(stop?'stop':'hold',{authorityId:id,reason});});}
 recover(local:{executionId:string;settled:boolean;status:string;complete:boolean}[],at:string){this.tx(at,(s,add)=>{for(const [id,r] of s.collections)if(r.state==='reserved')add('collection_unknown',{id});for(const r of s.other.values()){const l=local.find(x=>x.executionId===r.executionId);if(r.state!=='settled'||!l?.settled||l.status!==r.status)add('other_unknown',{executionId:r.executionId});}for(const r of s.reservations.values()){const l=local.find(x=>x.executionId===r.executionId);if(r.state!=='settled'||!l?.settled||l.status!==r.status||l.complete!==r.complete)add('unknown',{executionId:r.executionId});}for(const id of s.authorities.keys())if(!s.stopped.has(id))add('hold',{authorityId:id,reason:'Recovery requires exact owner resume of eligible future work',cause:'recovery'});});}
 resume(id:string,at:string){this.tx(at,(s,add)=>{this.collectionFence(s);this.current(s,id,at,true);requireThat(![...s.other.values()].some(r=>r.state!=='settled')&&![...s.reservations.values()].some(r=>r.state!=='settled'||r.status!=='completed'||!r.complete),'Unsettled or incomplete finite history cannot resume');add('resume',{authorityId:id});});}
 /** Standing observed scopes may survive an idle restart, never an uncertain external effect. */
 private settledObservedHistory(s:State,e:FiniteEnvelope,at:string){return [...s.reservations.values()].every(r=>{if(this.acceptedGap(e,r))return true;if(r.state!=='settled'||!r.complete)return false;if(r.status==='completed')return true;const old=s.authorities.get(r.authorityId);return r.authorityId!==e.authorityId&&old?.purpose==='observed_paper'&&(s.stopped.has(old.authorityId)||old.expiresAt<=at)&&['failed','interrupted'].includes(r.status??'');});}
 restoreObserved(id:string,at:string){return this.tx(at,(s,add)=>{const e=this.current(s,id,at,true);requireThat(e.purpose==='observed_paper'&&s.recoveryHolds.has(id),'Only the observed standing recovery hold may restore');this.providerReady(s,at);this.collectionFence(s);requireThat([...s.other.values()].every(r=>r.state==='settled')&&this.settledObservedHistory(s,e,at),'Uncertain or incomplete external history cannot restore');add('resume',{authorityId:id});});}
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
  if(action==='resume'){this.collectionFence(s);const e=this.current(s,id,at,true);requireThat(expectedRevision===(s.revisions.get(id)??0),'Exact current authority hold revision required');requireThat([...s.other.values()].every(r=>r.state==='settled')&&(e.purpose==='observed_paper'?this.settledObservedHistory(s,e,at):[...s.reservations.values()].every(r=>r.state==='settled'&&r.status==='completed'&&r.complete)),'Unsettled or incomplete finite history cannot resume');requireThat([...s.reservations.values()].filter(r=>e.purpose==='observed_paper'?this.family(s,e).has(r.authorityId):r.runId===e.runId).length<this.runLimit(e),'Exhausted finite run cannot resume');add('resume',{authorityId:id});}
  else add(action==='stop'?'stop':'hold',{authorityId:id,reason:'Owner '+action});
  const result:OwnerReceipt={receiptId,requestHash,authorityId:id,action,confirmedAt:at,controlRevision:s.head.sequence};add('owner_receipt',result);return result;
 });}
 /** Recomputed under the external write lock; no company snapshot can erase consumed history. */
 private recoveryRelease(s:State,id:string,at:string){
  const e=this.current(s,id,at,true);this.providerReady(s,at);this.collectionFence(s);
  requireThat(e.purpose==='private_research'&&s.recoveryHolds.has(id),'Only an exact research recovery hold can be released');
  requireThat(![...s.collections.values()].some(r=>r.authorityId===id)&&![...s.reservations.values()].some(r=>r.authorityId===id||r.runId===e.runId),'First collection release requires untouched external history');
  requireThat([...s.other.values()].every(r=>r.state==='settled'&&r.status==='completed')&&[...s.reservations.values()].every(r=>r.state==='settled'&&r.status==='completed'&&r.complete),'Unsettled or incomplete investment history prevents release');
  const rolling=new Set([...s.observed.values(),...s.other.values(),...s.reservations.values()].filter(r=>Date.parse(r.reservedAt)>Date.parse(at)-86400000).map(r=>r.executionId)).size;
  requireThat(e.policy.maxRolling24h-rolling>=e.participants.length+4,'Insufficient remaining research allowance');
  const binding={action:'release_research_recovery',envelopeHash:hash(e),authorityId:id,runId:e.runId,scopeId:e.scopeId,previewDigest:e.previewDigest,configurationHash:e.configurationHash,hold:s.holds.get(id)!,controlRevision:s.revisions.get(id)!,reloadHash:hash(s.attestations.get(id))};
  return {...binding,digest:hash(binding)};
 }
 recoveryReleasePreview(id:string,at:string){return this.recoveryRelease(this.read(),id,at);}
 private recoveryReceipt(s:State,id:string,receiptId:string,requestHash:string,at:string){
  const old=s.receipts.get(receiptId);if(!old)return;
  requireThat(old.authorityId===id&&old.action==='release_research_recovery'&&old.requestHash===requestHash,'Finite owner receipt conflict');
  this.current(s,id,at);requireThat(old.controlRevision===(s.revisions.get(id)??0),'Historical release cannot clear a newer hold');
  requireThat(old.reloadHash===hash(s.attestations.get(id)),'Release reload evidence changed');return old;
 }
 recoveryReleaseReceipt(id:string,receiptId:string,requestHash:string,at:string){return this.recoveryReceipt(this.read(),id,receiptId,requestHash,at);}
 releaseResearchRecovery(id:string,digest:string,receiptId:string,requestHash:string,at:string){return this.tx(at,(s,add)=>{
  const old=this.recoveryReceipt(s,id,receiptId,requestHash,at);if(old)return old;
  const preview=this.recoveryRelease(s,id,at);requireThat(digest===preview.digest,'Exact current research recovery release digest required');
  add('resume',{authorityId:id});
  const result:OwnerReceipt={authorityId:id,action:'release_research_recovery',receiptId,requestHash,confirmedAt:at,controlRevision:s.head.sequence,reloadHash:preview.reloadHash};
  add('owner_receipt',result);return result;
 });}
 /** Accounting only: never grants another investment mode runtime permission. */
 exposure(at:string){const s=this.read();requireThat(validTime(at)&&at>=s.head.at,'Finite authority clock moved backward');return {rolling:new Set([...s.observed.values(),...s.other.values(),...s.reservations.values()].filter(r=>Date.parse(r.reservedAt)>Date.parse(at)-86400000).map(r=>r.executionId)).size,active:[...s.collections.values()].some(r=>r.state!=='settled')||[...s.other.values()].some(r=>r.state!=='settled')||[...s.reservations.values()].some(r=>r.state!=='settled')};}
 reserveOther(r:{executionId:string;reservedAt:string},at:string){this.tx(at,(s,add)=>{requireThat(![...s.authorities.values()].some(e=>(e.recovery||e.renewal)&&!s.stopped.has(e.authorityId)&&at<e.expiresAt),'Other investment modes held during telemetry recovery');this.collectionFence(s);requireThat(r.executionId.length>0&&r.reservedAt===at&&!s.other.has(r.executionId)&&!s.observed.has(r.executionId)&&!s.reservations.has(r.executionId),'Other investment identity already consumed');const all=[...s.other.values(),...s.reservations.values()];requireThat(all.every(x=>x.state==='settled'),'External investment fence occupied');requireThat(new Set([...s.observed.values(),...all].filter(x=>Date.parse(x.reservedAt)>Date.parse(at)-86400000).map(x=>x.executionId)).size<8,'External rolling investment allocation exhausted');add('other_reserve',r);});}
 checkOther(executionId:string,at:string){const s=this.read();this.collectionFence(s);requireThat(at>=s.head.at&&s.other.get(executionId)?.state==='active','Other investment reservation missing or uncertain');}
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
