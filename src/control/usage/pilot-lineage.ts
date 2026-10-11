import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {inspectAtlasHistory,verifyMayaContext,type AtlasHistory,type MayaContextBinding} from './pilot-history.js';
import {closeSync,openSync,fsyncSync,lstatSync,realpathSync,mkdirSync,readFileSync,readdirSync,copyFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join,dirname,relative,isAbsolute} from 'node:path';
import {userInfo,tmpdir} from 'node:os';
import {requireThat} from '../../domain/model.js';
import type {RuntimeInput} from '../../runtime/adapter.js';
import type {VerifiedCreditAccount} from '../../runtime/credit-account.js';

export const authorityDirectory=join(userInfo().homedir,'.botsquad','decision037-authority');
const authorityFile=join(authorityDirectory,'lineage.sqlite');
const digest=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const stamp=()=>new Date().toISOString();
const hex=(s:string)=>/^[a-f0-9]{64}$/.test(s);
export interface OriginalPilot {pilotId:string;scopeId:string;executionId:string;model:string;archive:string;archiveDigest:string;rosterHash:string;workerId:string;source:string;files:Record<string,string>}
export interface Successor {pilotId:string;root:string;scopeId:string;groupId:string;runId:string;workerId:string;model:string;source:string;expiresAt:string}
export interface LineageRow {original:string;consumed:number;release_count:number;state:'registered'|'prepared'|'released'|'reserved'|'admitted'|'stopped';successor:string|null;request_id:string|null;execution_id:string|null;reserved_at:string|null;admitted_at:string|null;account:string|null;routing:string|null;reload_confirmed_at:string;uncertain:number;reason:string|null;updated_at:string}

/** Only bytes are read from retained evidence. SQLite inspection uses a disposable copy. */
export function inspectOriginal(archive:string,expectedDigest?:string):OriginalPilot {
 requireThat(realpathSync(archive)===archive,'Canonical original archive required');
 const files:Record<string,string>={};
 function walk(dir:string){for(const name of readdirSync(dir).sort()){const path=join(dir,name),s=lstatSync(path);requireThat(!s.isSymbolicLink(),'Archive symlinks denied');if(s.isDirectory())walk(path);else {requireThat(s.isFile(),'Archive contains unsupported entry');files[relative(archive,path)]=digest(readFileSync(path));}}}
 walk(archive);const archiveDigest=digest(JSON.stringify(files));
 requireThat(!expectedDigest||archiveDigest===expectedDigest,'Original archive digest mismatch');
 const json=(name:string)=>JSON.parse(readFileSync(join(archive,name),'utf8'));
 const m=json('manifest.json'),report=json('final-inspection.json'),roster=json('roster.json');
 requireThat(readFileSync(join(archive,'company.sqlite-wal')).length===0,'Original archive has unsettled WAL');
 const scratch=mkdtempSync(join(tmpdir(),'botsquad-archive-read-'));
 let original:OriginalPilot;
 try {
  const file=join(scratch,'snapshot.sqlite');copyFileSync(join(archive,'company.sqlite'),file);
  const db=new DatabaseSync(file,{readOnly:true});
  try {
   const p=db.prepare('SELECT * FROM investment_credit_pilot').get() as Record<string,unknown>;
   const scope=db.prepare('SELECT state FROM investment_team_scopes WHERE scope_id=?').get(String(p.scope_id));
   const reservations=db.prepare('SELECT execution_id,thread_id,turn_id,state FROM investment_activity_invocations').all();
   requireThat(p.state==='stopped'&&scope?.state==='revoked'&&reservations.length===1&&reservations[0]!.execution_id===p.execution_id&&reservations[0]!.thread_id===null&&reservations[0]!.turn_id===null&&reservations[0]!.state==='settled','Original stopped/revoked one-reservation history required');
   requireThat(p.pilot_id===m.pilotId&&p.scope_id===m.scopeId&&p.model===m.model&&report.reserved===1&&report.pilot.execution_id===p.execution_id&&report.pilot.state==='stopped','Original archive identity inconsistent');
   requireThat(p.account_fingerprint===null,'Continuation requires the recorded unadmitted original identity');
   const x=db.prepare('SELECT worker_id FROM executions WHERE execution_id=?').get(String(p.execution_id));
   requireThat(Array.isArray(roster)&&roster.length===2&&roster[0].worker_id===x?.worker_id&&roster[0].display_name==='Atlas'&&roster[1].display_name==='Maya'&&digest(JSON.stringify(roster))===m.rosterHash,'Original minimal Atlas/Maya roster mismatch');
   original={pilotId:m.pilotId,scopeId:m.scopeId,executionId:String(p.execution_id),model:m.model,archive,archiveDigest,rosterHash:m.rosterHash,workerId:String(x!.worker_id),source:json('accepted-source.json').sha,files};
  }finally{db.close();}
 }finally{rmSync(scratch,{recursive:true,force:true});}
 return original;
}
function privatePath(file:string){
 const dir=dirname(file);
 for(const p of [dir,file]){const s=lstatSync(p);requireThat(!s.isSymbolicLink()&&realpathSync(p)===p&&s.uid===process.getuid?.()&&(s.mode&0o077)===0,'Lineage authority must be canonical and owner-private');}
 requireThat(lstatSync(file).isFile()&&lstatSync(file).nlink===1,'Lineage authority must be one regular file');
}
function syncDirectory(dir:string){const fd=openSync(dir,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}

/** Dedicated private schema v1. It never opens an HQ or the historical archive with Store. */
export class PilotLineage {
 protected readonly db:DatabaseSync;
 private readonly inode:number;
 constructor(readonly path:string){privatePath(path);this.inode=lstatSync(path).ino;this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON');requireThat([1,2].includes(Number(this.db.prepare('PRAGMA user_version').get()?.user_version)),'Unknown lineage schema');}
 static create(file:string,original:OriginalPilot,reloadConfirmedAt:string){
  requireThat(Number.isFinite(Date.parse(reloadConfirmedAt))&&Date.parse(reloadConfirmedAt)<=Date.now()&&Date.now()-Date.parse(reloadConfirmedAt)<86400000,'Recent owner reload-OFF confirmation required');
  const fd=openSync(file,'wx',0o600);closeSync(fd);const db=new DatabaseSync(file);
  try {db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; BEGIN IMMEDIATE; PRAGMA user_version=1;
   CREATE TABLE lineage(singleton INTEGER PRIMARY KEY CHECK(singleton=1),original TEXT NOT NULL,consumed INTEGER NOT NULL CHECK(consumed BETWEEN 1 AND 4),release_count INTEGER NOT NULL CHECK(release_count BETWEEN 0 AND 1),state TEXT NOT NULL CHECK(state IN ('registered','prepared','released','reserved','admitted','stopped')),successor TEXT,request_id TEXT,execution_id TEXT,reserved_at TEXT,admitted_at TEXT,account TEXT,routing TEXT,reload_confirmed_at TEXT NOT NULL,uncertain INTEGER NOT NULL CHECK(uncertain IN(0,1)),reason TEXT,updated_at TEXT NOT NULL);
   CREATE TABLE receipts(sequence INTEGER PRIMARY KEY,kind TEXT NOT NULL,at TEXT NOT NULL,detail TEXT NOT NULL);
   CREATE TRIGGER retained BEFORE DELETE ON lineage BEGIN SELECT RAISE(ABORT,'Lineage retained'); END;
   CREATE TRIGGER monotonic BEFORE UPDATE ON lineage WHEN NEW.original!=OLD.original OR NEW.reload_confirmed_at!=OLD.reload_confirmed_at OR NEW.consumed<OLD.consumed OR NEW.release_count<OLD.release_count OR (OLD.successor IS NOT NULL AND NEW.successor IS NOT OLD.successor) OR (OLD.execution_id IS NOT NULL AND NEW.execution_id IS NOT OLD.execution_id) OR (OLD.request_id IS NOT NULL AND NEW.request_id IS NOT OLD.request_id) OR (OLD.account IS NOT NULL AND (NEW.account IS NOT OLD.account OR NEW.routing IS NOT OLD.routing)) OR (OLD.state='stopped' AND NEW.state!='stopped') BEGIN SELECT RAISE(ABORT,'Lineage is monotonic'); END;
   CREATE TRIGGER receipts_update BEFORE UPDATE ON receipts BEGIN SELECT RAISE(ABORT,'Receipt immutable'); END;
   CREATE TRIGGER receipts_delete BEFORE DELETE ON receipts BEGIN SELECT RAISE(ABORT,'Receipt retained'); END;`);
   db.prepare("INSERT INTO lineage VALUES(1,?,1,0,'registered',NULL,NULL,NULL,NULL,NULL,NULL,NULL,?,0,NULL,?)").run(JSON.stringify(original),reloadConfirmedAt,stamp());
   db.prepare('INSERT INTO receipts(kind,at,detail) VALUES(?,?,?)').run('original_inherited',stamp(),JSON.stringify({decision:'037',originalConsumed:1,maximum:4,authorizedNewReservations:1,authorization:'Decision037 owner-selected one-Atlas continuation, 2026-10-10',reloadEvidence:'Explicit owner confirmation; not programmatically queried',reloadConfirmedAt,archiveDigest:original.archiveDigest}));
   db.exec('COMMIT');
  }finally{db.close();syncDirectory(dirname(file));}
  return new PilotLineage(file);
 }
 protected present(){privatePath(this.path);requireThat(lstatSync(this.path).ino===this.inode,'Lineage authority was replaced');}
 protected tx<T>(fn:()=>T){this.present();this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 row(){this.present();return this.db.prepare('SELECT * FROM lineage WHERE singleton=1').get() as unknown as LineageRow;}
 original(){return JSON.parse(this.row().original) as OriginalPilot;}
 consumedCount(){return this.row().consumed;}
 isStopped(){return this.row().state==='stopped';}
 matchesSuccessor(s:Successor){return this.row().successor===JSON.stringify(s);}
 successor(){const s=this.row().successor;requireThat(s,'No authorized successor');return JSON.parse(s) as Successor;}
 receipts(){return this.db.prepare('SELECT * FROM receipts ORDER BY sequence').all();}
 private receipt(kind:string,detail:unknown){this.db.prepare('INSERT INTO receipts(kind,at,detail) VALUES(?,?,?)').run(kind,stamp(),JSON.stringify(detail));}
 private current(s:Successor){const row=this.row();requireThat(row.successor===JSON.stringify(s)&&realpathSync(s.root)===s.root,'Exact authorized successor required');requireThat(row.state!=='stopped'&&Date.now()>=Date.parse(row.updated_at)&&Date.now()<Date.parse(s.expiresAt)&&Date.now()>=Date.parse(row.reload_confirmed_at)&&Date.now()-Date.parse(row.reload_confirmed_at)<86400000,'Lineage stopped, expired or billing confirmation stale');return row;}
 prepare(s:Successor){return this.tx(()=>{const row=this.row(),o=this.original();requireThat(row.state==='registered'&&!row.successor&&row.consumed===1&&row.release_count===0,'Original lineage already has a successor or is stopped');requireThat(s.workerId===o.workerId&&s.model===o.model&&s.pilotId!==o.pilotId&&/^[a-f0-9]{40}$/.test(s.source)&&isAbsolute(s.root)&&realpathSync(s.root)===s.root&&Date.parse(s.expiresAt)>Date.now()&&Date.parse(s.expiresAt)<=Date.now()+3600000,'Invalid successor authority');this.db.prepare("UPDATE lineage SET successor=?,state='prepared',updated_at=?").run(JSON.stringify(s),stamp());this.receipt('successor_prepared',s);return s;});}
 assertLive(s:Successor){const r=this.current(s);requireThat(['released','reserved','admitted'].includes(r.state),'Continuation is not actively authorized');}
 bindAccount(s:Successor,v:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){this.tx(()=>{const r=this.current(s);requireThat(r.state==='prepared'&&r.release_count===0&&hex(v.fingerprint)&&hex(v.routingFingerprint),'Read-only verified preflight required before release');requireThat(!r.account||r.account===v.fingerprint&&r.routing===v.routingFingerprint,'Approved account/routing changed');this.db.prepare('UPDATE lineage SET account=?,routing=?,updated_at=?').run(v.fingerprint,v.routingFingerprint,stamp());this.receipt('account_verified',{fingerprint:v.fingerprint,routingFingerprint:v.routingFingerprint});});}
 release(s:Successor,requestId:string){this.tx(()=>{const r=this.current(s);requireThat(r.state==='prepared'&&r.release_count===0&&r.consumed===1&&r.account&&r.routing&&requestId.length>0,'One new Atlas release only; verified account required');this.db.prepare("UPDATE lineage SET state='released',release_count=1,request_id=?,updated_at=?").run(requestId,stamp());this.receipt('released',{requestId,workerId:s.workerId});});}
 reserve(s:Successor,requestId:string,executionId:string,workerId:string){this.tx(()=>{const r=this.current(s);requireThat(r.state==='released'&&r.release_count===1&&r.consumed<4&&!r.execution_id&&r.request_id===requestId&&s.workerId===workerId,'Lineage reservation unavailable or duplicate');this.db.prepare("UPDATE lineage SET state='reserved',consumed=consumed+1,execution_id=?,reserved_at=?,uncertain=1,updated_at=?").run(executionId,stamp(),stamp());this.receipt('reserved',{executionId,requestId,cumulativeConsumed:r.consumed+1});});}
 check(s:Successor,input:RuntimeInput){const r=this.current(s);requireThat(r.state==='reserved'&&r.consumed===2&&r.release_count===1&&input.mode==='conversation'&&input.execution.execution_id===r.execution_id&&input.request.request_id===r.request_id&&input.worker.worker_id===s.workerId&&input.worker.ai_model===s.model&&input.worker.workspace_path===join(s.root,'workspaces',s.workerId)&&Date.now()<Date.parse(r.reserved_at!)+300000,'Exact unspent lineage admission required');return r;}
 admit(s:Successor,input:RuntimeInput,v:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){this.tx(()=>{const r=this.check(s,input);requireThat(r.account===v.fingerprint&&r.routing===v.routingFingerprint,'Approved account or routing changed since preflight');this.db.prepare("UPDATE lineage SET state='admitted',admitted_at=?,updated_at=?").run(stamp(),stamp());this.receipt('admission_consumed',{executionId:r.execution_id,requestId:r.request_id});});}
 finish(executionId:string,status:string,settled:boolean){this.tx(()=>{const r=this.row();requireThat(r.execution_id===executionId,'Lineage completion identity mismatch');const wasStopped=r.state==='stopped';this.db.prepare("UPDATE lineage SET state='stopped',uncertain=?,reason=?,updated_at=?").run(wasStopped?r.uncertain:(!settled?1:0),wasStopped?r.reason:'single_authorized_attempt_finished',stamp());this.receipt('completion',{executionId,status,settled,priorStopPreserved:wasStopped});});}
 stop(reason='owner_stop'){this.tx(()=>{const r=this.row();this.db.prepare("UPDATE lineage SET state='stopped',reason=coalesce(reason,?),updated_at=?").run(reason,stamp());this.receipt('stop',{reason,consumed:r.consumed,uncertain:r.uncertain});});}
 recover(){if(['released','reserved','admitted'].includes(this.row().state))this.stop('restart_or_incomplete_supervision');}
 close(){if(this.db.isOpen)this.db.close();}
}

const trustedLedgers=new WeakSet<PilotLineage>();
const permits=new WeakMap<object,{ledger:PilotLineage;successor:Successor}>();
export interface CreditLineagePermit {readonly kind:'decision037-one-atlas-turn'|'decision037-one-maya-turn'}
function checkAuthorityParent(){const p=dirname(authorityDirectory),s=lstatSync(p);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(p)===p&&s.uid===process.getuid?.()&&(s.mode&0o077)===0,'Owner-private authority parent required');}
export function registerAuthority(original:OriginalPilot,confirmation:string){
 mkdirSync(dirname(authorityDirectory),{recursive:true,mode:0o700});checkAuthorityParent();
 // Exclusive directory is a durable initialization tombstone, including a crash before DB creation.
 mkdirSync(authorityDirectory,{mode:0o700});syncDirectory(dirname(authorityDirectory));
 const ledger=PilotLineage.create(authorityFile,original,confirmation);ledger.close();
}
export function openAuthority(){checkAuthorityParent();const ledger=new PilotLineage(authorityFile);trustedLedgers.add(ledger);return ledger;}
export function openMayaAuthority(){checkAuthorityParent();const ledger=new MayaLineage(authorityFile);trustedLedgers.add(ledger);return ledger;}
export function issuePermit(ledger:PilotLineage,s:Successor):CreditLineagePermit {requireThat(trustedLedgers.has(ledger)&&ledger.matchesSuccessor(s),'Trusted private supervisor authority required');const permit:CreditLineagePermit=Object.freeze({kind:ledger instanceof MayaLineage?'decision037-one-maya-turn':'decision037-one-atlas-turn'});permits.set(permit,{ledger,successor:s});return permit;}
export function verifyPermit(permit:CreditLineagePermit|undefined,input:RuntimeInput,account?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){const p=permit&&permits.get(permit);requireThat(p,'Durable supervisor lineage permit required; fixtures cannot authorize inference');if(account)p.ledger.admit(p.successor,input,account);else p.ledger.check(p.successor,input);}

export interface MayaAuthorization {history:AtlasHistory;ownerRequestDigest:string;authorizedAt:string;reloadConfirmedAt:string}
export interface MayaRow {
 singleton:number;authorization:string;state:'authorized'|'prepared'|'supervising'|'released'|'reserved'|'admitted'|'stopped';
 successor:string|null;context_binding:string|null;supervisor_id:string|null;release_count:number;reserved:number;
 request_id:string|null;execution_id:string|null;reserved_at:string|null;admitted_at:string|null;
 account:string|null;routing:string|null;uncertain:number;reason:string|null;updated_at:string;
}
/** Additive schema2. row()/receipts() deliberately continue to return the unchanged Atlas history. */
export class MayaLineage extends PilotLineage {
 private supervisorId?:string;
 maya(){this.present();requireThat(this.db.prepare('PRAGMA user_version').get()?.user_version===2,'Maya continuation not authorized');const r=this.db.prepare('SELECT * FROM maya_continuation WHERE singleton=1').get() as unknown as MayaRow;requireThat(r,'Maya authority missing');return r;}
 authorization(){return JSON.parse(this.maya().authorization) as MayaAuthorization;}
 mayaReceipts(){this.present();return this.db.prepare('SELECT * FROM maya_receipts ORDER BY sequence').all();}
 private mayaReceipt(kind:string,detail:unknown){this.db.prepare('INSERT INTO maya_receipts(kind,at,detail) VALUES(?,?,?)').run(kind,stamp(),JSON.stringify(detail));}
 authorizeMaya(history:AtlasHistory,ownerRequestDigest:string,reloadConfirmedAt:string){
  requireThat(hex(ownerRequestDigest)&&Date.parse(reloadConfirmedAt)<=Date.now()&&Date.now()-Date.parse(reloadConfirmedAt)<86400000,'Owner request digest and current reload-OFF confirmation required');
  const verified=inspectAtlasHistory(this,history.archive,history.archiveDigest);
  requireThat(JSON.stringify(verified)===JSON.stringify(history),'Exact verified historical sources required');
  return this.tx(()=>{
   requireThat(this.db.prepare('PRAGMA user_version').get()?.user_version===1,'Maya authorization already exists; no renewal or reset');
   requireThat(JSON.stringify(this.row())===history.legacyRow&&JSON.stringify(this.receipts())===history.legacyReceipts,'Atlas history changed before authorization');
   this.db.exec(`
    CREATE TABLE maya_continuation(singleton INTEGER PRIMARY KEY CHECK(singleton=1),authorization TEXT NOT NULL,
     state TEXT NOT NULL CHECK(state IN ('authorized','prepared','supervising','released','reserved','admitted','stopped')),
     successor TEXT,context_binding TEXT,supervisor_id TEXT,release_count INTEGER NOT NULL CHECK(release_count BETWEEN 0 AND 1),
     reserved INTEGER NOT NULL CHECK(reserved BETWEEN 0 AND 1),request_id TEXT,execution_id TEXT,reserved_at TEXT,admitted_at TEXT,
     account TEXT,routing TEXT,uncertain INTEGER NOT NULL CHECK(uncertain IN(0,1)),reason TEXT,updated_at TEXT NOT NULL);
    CREATE TABLE maya_receipts(sequence INTEGER PRIMARY KEY,kind TEXT NOT NULL,at TEXT NOT NULL,detail TEXT NOT NULL);
    CREATE TRIGGER atlas_frozen BEFORE UPDATE ON lineage BEGIN SELECT RAISE(ABORT,'Atlas history frozen by Maya amendment'); END;
    CREATE TRIGGER atlas_receipts_frozen BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'Atlas receipts frozen by Maya amendment'); END;
    CREATE TRIGGER maya_retained BEFORE DELETE ON maya_continuation BEGIN SELECT RAISE(ABORT,'Maya authority retained'); END;
    CREATE TRIGGER maya_monotonic BEFORE UPDATE ON maya_continuation WHEN
     NEW.authorization!=OLD.authorization OR NEW.release_count<OLD.release_count OR NEW.reserved<OLD.reserved OR
     (OLD.successor IS NOT NULL AND NEW.successor IS NOT OLD.successor) OR (OLD.context_binding IS NOT NULL AND NEW.context_binding IS NOT OLD.context_binding) OR
     (OLD.supervisor_id IS NOT NULL AND NEW.supervisor_id IS NOT OLD.supervisor_id) OR
     (OLD.request_id IS NOT NULL AND NEW.request_id IS NOT OLD.request_id) OR (OLD.execution_id IS NOT NULL AND NEW.execution_id IS NOT OLD.execution_id) OR
     (OLD.reserved_at IS NOT NULL AND NEW.reserved_at IS NOT OLD.reserved_at) OR (OLD.admitted_at IS NOT NULL AND NEW.admitted_at IS NOT OLD.admitted_at) OR
     (OLD.account IS NOT NULL AND (NEW.account IS NOT OLD.account OR NEW.routing IS NOT OLD.routing)) OR
     (OLD.state='stopped' AND (NEW.state!='stopped' OR NEW.uncertain!=OLD.uncertain OR NEW.reason IS NOT OLD.reason))
     BEGIN SELECT RAISE(ABORT,'Maya authority is monotonic'); END;
    CREATE TRIGGER maya_budget BEFORE UPDATE ON maya_continuation WHEN NEW.reserved+(SELECT consumed FROM lineage)>4
     BEGIN SELECT RAISE(ABORT,'Original pilot allowance exhausted'); END;
    CREATE TRIGGER maya_receipts_immutable BEFORE UPDATE ON maya_receipts BEGIN SELECT RAISE(ABORT,'Maya receipt immutable'); END;
    CREATE TRIGGER maya_receipts_retained BEFORE DELETE ON maya_receipts BEGIN SELECT RAISE(ABORT,'Maya receipt retained'); END;
    PRAGMA user_version=2;
   `);
   const authorization:MayaAuthorization={history,ownerRequestDigest,authorizedAt:stamp(),reloadConfirmedAt};
   this.db.prepare("INSERT INTO maya_continuation VALUES(1,?,'authorized',NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,?)").run(JSON.stringify(authorization),stamp());
   this.mayaReceipt('owner_authorized',{decision:'037',originalMaximum:4,historicalConsumed:2,authorizedMayaReservations:1,ownerRequestDigest,atlasArchiveDigest:history.archiveDigest,reloadConfirmedAt,reloadEvidence:'Retained owner confirmation, applicable to this invocation; not a billing API result'});
   return this.summary();
  });
 }
 override consumedCount(){return this.row().consumed+this.maya().reserved;}
 override isStopped(){return this.maya().state==='stopped';}
 override matchesSuccessor(s:Successor){return this.maya().successor===JSON.stringify(s);}
 override successor(){const s=this.maya().successor;requireThat(s,'Maya successor not prepared');return JSON.parse(s) as Successor;}
 summary(){const r=this.maya();return {originalReserved:1,atlasReserved:1,mayaReserved:r.reserved,cumulativeConsumed:this.consumedCount(),maximum:4,remainingUnused:4-this.consumedCount(),authorizedUnreleased:['authorized','prepared','supervising'].includes(r.state)&&r.release_count===0?1:0,authorizedFutureReleases:0,state:r.state,uncertain:r.uncertain};}
 private intact(){const h=this.authorization().history;requireThat(JSON.stringify(this.row())===h.legacyRow&&JSON.stringify(this.receipts())===h.legacyReceipts,'Historical authority changed');}
 private currentMaya(s:Successor){
  const r=this.maya(),a=this.authorization();this.intact();
  requireThat(r.successor===JSON.stringify(s)&&realpathSync(s.root)===s.root,'Exact Maya successor required');
  requireThat(r.state!=='stopped'&&Date.now()>=Date.parse(r.updated_at)&&Date.now()<Date.parse(s.expiresAt)&&Date.now()>=Date.parse(a.reloadConfirmedAt)&&Date.now()-Date.parse(a.reloadConfirmedAt)<86400000,'Maya stopped, expired or billing confirmation stale');
  return r;
 }
 prepareMaya(s:Successor,binding:MayaContextBinding){return this.tx(()=>{
  const r=this.maya(),a=this.authorization(),prior=JSON.parse(this.row().successor!) as Successor;this.intact();
  requireThat(r.state==='authorized'&&!r.successor&&r.reserved===0&&r.release_count===0&&this.row().consumed===2,'Maya successor already prepared or stopped');
  requireThat(s.workerId===a.history.mayaWorkerId&&s.workerId!==prior.workerId&&s.model===prior.model&&s.pilotId!==prior.pilotId&&s.scopeId!==prior.scopeId&&s.groupId!==prior.groupId&&s.root!==prior.root&&s.pilotId!==this.original().pilotId&&s.scopeId!==this.original().scopeId&&/^[a-f0-9]{40}$/.test(s.source)&&isAbsolute(s.root)&&realpathSync(s.root)===s.root&&Date.parse(s.expiresAt)>Date.now()&&Date.parse(s.expiresAt)<=Date.now()+3600000,'Invalid one-use Maya successor');
  requireThat(binding.workerId===s.workerId&&binding.groupId===s.groupId&&binding.scopeId===s.scopeId&&binding.runId===s.runId&&binding.imports.length===2,'Exact Maya context binding required');
  for(const [i,source] of [a.history.packet,a.history.contribution].entries()){
   const imp=binding.imports[i]!,metadata=JSON.parse(imp.metadata) as Record<string,unknown>;
   requireThat(imp.content===source.content&&Object.entries(source.provenance).every(([k,v])=>JSON.stringify(metadata[k])===JSON.stringify(v))&&metadata.export_authority==='explicit_owner_historical_pilot_import'&&metadata.omitted_characters===0&&metadata.audience_scope_version===1&&JSON.stringify((metadata.audience_worker_ids as string[]).slice().sort())===JSON.stringify([a.history.workerId,a.history.mayaWorkerId].sort())&&imp.evidenceId!==source.provenance.source_id,'Imported content or source attribution changed');
  }
  verifyMayaContext(s.root,binding);
  this.db.prepare("UPDATE maya_continuation SET successor=?,context_binding=?,state='prepared',updated_at=?").run(JSON.stringify(s),JSON.stringify(binding),stamp());this.mayaReceipt('successor_prepared',s);return s;
 });}
 override prepare(_s:Successor):Successor {throw Error('Maya preparation requires verified complete historical context');}
 verifyContext(s:Successor,context?:unknown,executionId?:string){this.currentMaya(s);const h=this.authorization().history;inspectAtlasHistory(this,h.archive,h.archiveDigest);verifyMayaContext(s.root,JSON.parse(this.maya().context_binding!) as MayaContextBinding,context,executionId);}
 override bindAccount(s:Successor,v:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){this.tx(()=>{const r=this.currentMaya(s);requireThat(r.state==='prepared'&&hex(v.fingerprint)&&hex(v.routingFingerprint)&&(!r.account||r.account===v.fingerprint&&r.routing===v.routingFingerprint),'Prepared Maya and unchanged verified account/routing required');this.verifyContext(s);this.db.prepare('UPDATE maya_continuation SET account=?,routing=?,updated_at=?').run(v.fingerprint,v.routingFingerprint,stamp());this.mayaReceipt('account_verified',v);});}
 claimSupervision(s:Successor){const token=randomUUID();this.tx(()=>{const r=this.currentMaya(s);requireThat(r.state==='prepared'&&!r.supervisor_id&&r.release_count===0&&r.account&&r.routing,'Maya supervisor already claimed or preflight incomplete');this.verifyContext(s);this.db.prepare("UPDATE maya_continuation SET state='supervising',supervisor_id=?,updated_at=?").run(token,stamp());this.mayaReceipt('supervisor_claimed',{supervisorId:token});});this.supervisorId=token;}
 ownsSupervisionLocally(){return !!this.supervisorId;}
 ownsSupervision(){return !!this.supervisorId&&this.maya().supervisor_id===this.supervisorId;}
 override release(s:Successor,requestId:string){this.tx(()=>{const r=this.currentMaya(s);requireThat(this.ownsSupervision()&&r.state==='supervising'&&r.release_count===0&&r.reserved===0&&requestId.length>0&&requestId!==this.row().request_id,'Exactly one Maya release by its owning supervisor required');this.verifyContext(s);this.db.prepare("UPDATE maya_continuation SET state='released',release_count=1,request_id=?,updated_at=?").run(requestId,stamp());this.mayaReceipt('released',{requestId,workerId:s.workerId});});}
 override reserve(s:Successor,requestId:string,executionId:string,workerId:string){this.tx(()=>{const r=this.currentMaya(s);requireThat(r.state==='released'&&r.release_count===1&&r.reserved===0&&this.consumedCount()===2&&r.request_id===requestId&&workerId===s.workerId&&executionId!==this.row().execution_id&&executionId.length>0,'Maya reservation unavailable or identity mismatch');this.db.prepare("UPDATE maya_continuation SET state='reserved',reserved=1,execution_id=?,reserved_at=?,uncertain=1,updated_at=?").run(executionId,stamp(),stamp());this.mayaReceipt('reserved',{executionId,requestId,cumulativeConsumed:3,remainingUnused:1,authorizedFurtherReleases:0});});}
 override check(s:Successor,input:RuntimeInput):LineageRow {
  const r=this.currentMaya(s);requireThat(r.state==='reserved'&&this.consumedCount()===3&&r.reserved===1&&r.release_count===1&&input.mode==='conversation'&&input.execution.execution_id===r.execution_id&&input.request.request_id===r.request_id&&input.request.target_worker_id===s.workerId&&input.execution.worker_id===s.workerId&&input.worker.worker_id===s.workerId&&input.worker.ai_model===s.model&&input.worker.reasoning_effort==='low'&&input.worker.workspace_path===join(s.root,'workspaces',s.workerId)&&!input.binding&&Date.now()<Date.parse(r.reserved_at!)+300000,'Exact unspent fresh Maya admission required');
  this.verifyContext(s,input.context,input.execution.execution_id);
  // The return type stays the legacy diagnostic row; Maya state is never projected onto it.
  return this.row();
 }
 override admit(s:Successor,input:RuntimeInput,v:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){this.tx(()=>{this.check(s,input);const r=this.maya();requireThat(r.account===v.fingerprint&&r.routing===v.routingFingerprint,'Maya account or routing changed since preflight');this.db.prepare("UPDATE maya_continuation SET state='admitted',admitted_at=?,updated_at=?").run(stamp(),stamp());this.mayaReceipt('admission_consumed',{executionId:r.execution_id,requestId:r.request_id});});}
 override assertLive(s:Successor){const r=this.currentMaya(s);requireThat(['released','reserved','admitted'].includes(r.state),'Maya continuation not actively authorized');}
 override finish(executionId:string,status:string,settled:boolean){this.tx(()=>{const r=this.maya();requireThat(r.execution_id===executionId,'Maya completion identity mismatch');if(r.state!=='stopped')this.db.prepare("UPDATE maya_continuation SET state='stopped',uncertain=?,reason='single_authorized_maya_attempt_finished',updated_at=?").run(settled?0:1,stamp());this.mayaReceipt('completion',{executionId,status,settled,priorStopPreserved:r.state==='stopped'});});}
 override stop(reason='owner_stop'){this.tx(()=>{const r=this.maya();if(r.state!=='stopped')this.db.prepare("UPDATE maya_continuation SET state='stopped',reason=?,updated_at=?").run(reason,stamp());this.mayaReceipt('stop',{reason,consumed:this.consumedCount(),uncertain:r.uncertain});});}
 stopFailedPreflight(){return this.tx(()=>{if(this.maya().state==='prepared'){this.db.prepare("UPDATE maya_continuation SET state='stopped',reason='preflight_failed',updated_at=?").run(stamp());this.mayaReceipt('stop',{reason:'preflight_failed',consumed:this.consumedCount()});return true;}return false;});}
 override recover(){const r=this.maya();if(r.state==='supervising'&&this.ownsSupervision())return;if(['supervising','released','reserved','admitted'].includes(r.state))this.stop('restart_or_incomplete_supervision');}
}
