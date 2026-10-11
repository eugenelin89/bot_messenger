import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
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
 private readonly db:DatabaseSync;
 private readonly inode:number;
 constructor(readonly path:string){privatePath(path);this.inode=lstatSync(path).ino;this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON');requireThat(this.db.prepare('PRAGMA user_version').get()?.user_version===1,'Unknown lineage schema');}
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
 private present(){privatePath(this.path);requireThat(lstatSync(this.path).ino===this.inode,'Lineage authority was replaced');}
 private tx<T>(fn:()=>T){this.present();this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 row(){this.present();return this.db.prepare('SELECT * FROM lineage WHERE singleton=1').get() as unknown as LineageRow;}
 original(){return JSON.parse(this.row().original) as OriginalPilot;}
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
export interface CreditLineagePermit {readonly kind:'decision037-one-atlas-turn'}
function checkAuthorityParent(){const p=dirname(authorityDirectory),s=lstatSync(p);requireThat(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(p)===p&&s.uid===process.getuid?.()&&(s.mode&0o077)===0,'Owner-private authority parent required');}
export function registerAuthority(original:OriginalPilot,confirmation:string){
 mkdirSync(dirname(authorityDirectory),{recursive:true,mode:0o700});checkAuthorityParent();
 // Exclusive directory is a durable initialization tombstone, including a crash before DB creation.
 mkdirSync(authorityDirectory,{mode:0o700});syncDirectory(dirname(authorityDirectory));
 const ledger=PilotLineage.create(authorityFile,original,confirmation);ledger.close();
}
export function openAuthority(){checkAuthorityParent();const ledger=new PilotLineage(authorityFile);trustedLedgers.add(ledger);return ledger;}
export function issuePermit(ledger:PilotLineage,s:Successor):CreditLineagePermit {requireThat(trustedLedgers.has(ledger)&&ledger.row().successor===JSON.stringify(s),'Trusted private supervisor authority required');const permit=Object.freeze({kind:'decision037-one-atlas-turn' as const});permits.set(permit,{ledger,successor:s});return permit;}
export function verifyPermit(permit:CreditLineagePermit|undefined,input:RuntimeInput,account?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>){const p=permit&&permits.get(permit);requireThat(p,'Durable supervisor lineage permit required; fixtures cannot authorize inference');if(account)p.ledger.admit(p.successor,input,account);else p.ledger.check(p.successor,input);}
