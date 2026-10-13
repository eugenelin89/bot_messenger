/** Dormant Ask authority custody. No Company, credentials, runtime permit or network caller. */
import { randomUUID } from 'node:crypto';
import { closeSync, constants, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { canonicalHash, canonicalJson, requireContract as need, validate } from '../../../scripts/investment-contracts/schema.js';
import { admission, configuration, digest, exact, grant, id, instant, micros, reservation, usage,
  type AskAdmissionProof, type AskGrant, type AskGrantConfiguration, type AskReservation, type AskUsageReceipt } from '../../domain/ask/authority.js';
import type { AskWireProof } from './transport.js';
import type { AskAnswerReceipt } from '../../../contracts/investment/v1/types.js';

interface Head {epoch:string;sequence:number;digest:string;at:string}
interface Entry {sequence:number;epoch:string;at:string;kind:string;payload:string;previous:string|null;digest:string}
interface ModelState {binding:AskReservation;owner:string;state:'reserved'|'admitted'|'transmitted'|'settled'|'settled_over_limit'|'unknown';proof:AskAdmissionProof|null;receipt:AskUsageReceipt|null}
export interface AskWireObservation {kind:'data'|'problem';status:number;responseDigest:string}
interface WireState {proof:AskWireProof;state:'unknown'|'reconciled';observation:AskWireObservation|null;receipt:AskAnswerReceipt|null}
interface State {head:Head;grants:Map<string,AskGrant>;revoked:Set<string>;models:Map<string,ModelState>;wires:Map<string,WireState>}
export const ASK_AUTHORITY_CAPACITY=Object.freeze({events:10000,eventBytes:16384,pageBytes:4096,maxPages:131072});
const schema=`PRAGMA user_version=1;
CREATE TABLE events(sequence INTEGER PRIMARY KEY,epoch TEXT NOT NULL,at TEXT NOT NULL,kind TEXT NOT NULL,
 payload TEXT NOT NULL CHECK(json_valid(payload)),previous TEXT,digest TEXT NOT NULL UNIQUE);
CREATE TRIGGER immutable_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'immutable'); END;
CREATE TRIGGER immutable_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'immutable'); END;`;
const within=(a:string,b:string)=>a===b||a.startsWith(b+sep);
function exists(path:string):boolean{try{lstatSync(path);return true;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;}}
function privatePath(path:string,directory:boolean){
  const s=lstatSync(path);need(!s.isSymbolicLink()&&realpathSync(path)===path&&s.uid===process.getuid?.()
    &&(s.mode&0o077)===0&&(directory?s.isDirectory():s.isFile()&&s.nlink===1),'FORBIDDEN');return s;
}
function root(path:string):void {
  need(isAbsolute(path)&&resolve(path)===path,'FORBIDDEN');privatePath(path,true);
  for(let p=dirname(path);;p=dirname(p)){
    const s=lstatSync(p);need(!s.isSymbolicLink()&&s.isDirectory()&&realpathSync(p)===p
      &&(s.uid===0||s.uid===process.getuid?.())&&((s.mode&0o022)===0||s.uid===0&&(s.mode&0o1000)!==0),'FORBIDDEN');
    if(p===dirname(p))break;
  }
}
function locations(directory:string,checkpointDirectory:string,excluded:readonly string[]):void {
  root(directory);root(checkpointDirectory);
  need(!within(directory,checkpointDirectory)&&!within(checkpointDirectory,directory)&&excluded.length>0,'FORBIDDEN');
  for(const p of excluded){
    need(isAbsolute(p)&&resolve(p)===p&&realpathSync(p)===p,'FORBIDDEN');
    need(!within(directory,p)&&!within(p,directory)&&!within(checkpointDirectory,p)&&!within(p,checkpointDirectory),'FORBIDDEN');
  }
}
function syncDir(path:string):void{const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(fd);}finally{closeSync(fd);}}
function writeExclusive(path:string,body:string):void{
  const fd=openSync(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,body);fsyncSync(fd);}finally{closeSync(fd);}
}
function proof(value:AskWireProof):void {
  exact(value,'kind serviceId generation requestId intentDigest signedWireDigest answerIdentity');
  need(['claim','renew','status','answer','receipt','control_sync'].includes(value.kind),'INVALID_SCHEMA');
  id(value.serviceId);validate('Sequence',value.generation);digest(value.intentDigest);digest(value.signedWireDigest);
  need(value.kind==='receipt'?value.requestId===null:value.requestId!==null,'INVALID_SCHEMA');if(value.requestId!==null)id(value.requestId);
  if(value.kind==='answer'||value.kind==='receipt'){
    const a=value.answerIdentity;exact(a,'serviceId answerId questionId questionHash answerDigest generatedAt');
    need(a.serviceId===value.serviceId,'CONFLICT');id(a.answerId as string);id(a.questionId as string);
    digest(a.questionHash as string);digest(a.answerDigest as string);validate('Time',a.generatedAt);
  }else need(value.answerIdentity===null,'INVALID_SCHEMA');
}
function current(s:State,grantId:string,at:string):AskGrant {
  need(![...s.models.values()].some(x=>x.state==='settled_over_limit'),'BUDGET_EXHAUSTED');
  need(![...s.models.values()].some(x=>x.state==='unknown'),'OUTCOME_UNKNOWN');
  const g=s.grants.get(grantId);need(g&&!s.revoked.has(grantId)&&g.approvedAt<=at&&at<g.expiresAt,'FORBIDDEN');
  need(![...s.grants.values()].some(x=>x.serviceId===g.serviceId&&BigInt(x.generation)>BigInt(g.generation)),'FORBIDDEN');return g;
}
function model(s:State,executionId:string):ModelState{const r=s.models.get(executionId);need(r,'CONFLICT');return r;}
function limits(s:State,g:AskGrant,r:AskReservation,at:string):void {
  need(!s.models.has(r.id)&&![...s.models.values()].some(x=>x.binding.serviceId===r.serviceId&&x.binding.questionId===r.questionId),'CONFLICT');
  need(![...s.models.values()].some(x=>x.state!=='settled'),'OUTCOME_UNKNOWN');
  need(r.serviceId===g.serviceId&&r.generation===g.generation&&g.workerIds.includes(r.workerId)
    &&r.reservedAt===at&&r.deadline<=g.expiresAt&&instant(r.deadline)-instant(at)<=g.maxDurationMs,'FORBIDDEN');
  const all=[...s.models.values()],own=all.filter(x=>x.binding.grantId===g.id);
  const rolling=all.filter(x=>instant(x.binding.reservedAt)>instant(at)-86400000);
  const day=all.filter(x=>x.binding.reservedAt.slice(0,10)===at.slice(0,10));
  for(const [rows,count,tokens,cost] of [[own,g.maxExecutions,g.totalTokens,g.totalChargeMicros],
    [rolling,g.dailyExecutions,g.dailyTokens,g.dailyChargeMicros],[day,g.dailyExecutions,g.dailyTokens,g.dailyChargeMicros]] as const){
    const spent=rows.map(x=>s.grants.get(x.binding.grantId)!);
    const tokenSum=rows.reduce((sum,row,i)=>{
      const reserved=BigInt(spent[i]!.maxInputTokens)+BigInt(spent[i]!.maxOutputTokens);
      const measured=row.receipt?BigInt(row.receipt.inputTokens)+BigInt(row.receipt.outputTokens):0n;
      return sum+(measured>reserved?measured:reserved);
    },0n);
    need(rows.length<count&&tokenSum+BigInt(g.maxInputTokens)+BigInt(g.maxOutputTokens)<=BigInt(tokens),'BUDGET_EXHAUSTED');
    if(g.monetaryMode!=='activity_capped_subscription'){
      // Unknown historical exposure is not zero, including after a mode/grant change.
      need(cost!==null&&g.maxChargeMicros!==null&&spent.every(e=>e.maxChargeMicros!==null),'OUTCOME_UNKNOWN');
      const costSum=spent.reduce((sum,e)=>sum+micros(e.maxChargeMicros!),0n);
      need(costSum+micros(g.maxChargeMicros)<=micros(cost),'BUDGET_EXHAUSTED');
    }
  }
}
/** One typed event interpreter validates both new writes and every replay. */
function apply(s:State,kind:string,value:unknown,at:string,hqId:string):void {
  switch(kind){
    case 'grant':{
      exact(value,'grant configuration');const g=grant(value.grant as AskGrant);configuration(g,value.configuration as AskGrantConfiguration);
      need(g.hqId===hqId&&g.approvedAt===at&&!s.grants.has(g.id),'CONFLICT');
      need(![...s.grants.values()].some(x=>x.serviceId===g.serviceId&&BigInt(x.generation)>BigInt(g.generation)),'CONFLICT');
      s.grants.set(g.id,g);break;
    }
    case 'revoke':{
      exact(value,'grantId');id(value.grantId as string);need(s.grants.has(value.grantId as string),'CONFLICT');s.revoked.add(value.grantId as string);break;
    }
    case 'reserve':{
      exact(value,'binding owner');id(value.owner as string);const r=reservation(value.binding as AskReservation),g=current(s,r.grantId,at);
      limits(s,g,r,at);s.models.set(r.id,{binding:r,owner:value.owner as string,state:'reserved',proof:null,receipt:null});break;
    }
    case 'admit':{
      exact(value,'executionId owner proof');const r=model(s,value.executionId as string),g=current(s,r.binding.grantId,at);
      need(value.owner===r.owner&&r.state==='reserved'&&at<r.binding.deadline,'CONFLICT');
      admission(value.proof as AskAdmissionProof,g,r.binding,at);
      // Initial integration always starts an isolated public context per answer. Reusing a
      // provider session needs a separately reviewed continuity policy, not a new grant.
      need(![...s.models.values()].some(x=>x.proof?.providerSessionId===(value.proof as AskAdmissionProof).providerSessionId),'CONFLICT');
      r.proof=value.proof as AskAdmissionProof;r.state='admitted';break;
    }
    case 'transmit':{
      exact(value,'executionId owner proof');const r=model(s,value.executionId as string),g=current(s,r.binding.grantId,at);
      need(value.owner===r.owner&&r.state==='admitted'&&at<r.binding.deadline,'CONFLICT');
      admission(value.proof as AskAdmissionProof,g,r.binding,at);
      need(canonicalJson(value.proof)===canonicalJson(r.proof),'CONFLICT');r.state='transmitted';break;
    }
    case 'settle':{
      exact(value,'executionId owner receipt');const r=model(s,value.executionId as string),g=s.grants.get(r.binding.grantId)!;
      need(value.owner===r.owner&&r.state==='transmitted'&&r.proof,'OUTCOME_UNKNOWN');
      const result=usage(value.receipt as AskUsageReceipt,g,r.proof.providerSessionId);r.receipt=value.receipt as AskUsageReceipt;
      r.state=result==='threshold_exceeded'?'settled_over_limit':'settled';break;
    }
    case 'not_sent':{
      exact(value,'executionId owner');const r=model(s,value.executionId as string);
      need(value.owner===r.owner&&['reserved','admitted'].includes(r.state),'OUTCOME_UNKNOWN');r.state='settled';break;
    }
    case 'unknown':{
      exact(value,'executionId');const r=model(s,value.executionId as string);need(r.state!=='settled'&&r.state!=='settled_over_limit','CONFLICT');r.state='unknown';break;
    }
    case 'wire':{
      exact(value,'attemptId proof');id(value.attemptId as string);proof(value.proof as AskWireProof);
      const p=value.proof as AskWireProof;
      need(!s.wires.has(value.attemptId as string)&&![...s.wires.values()].some(x=>x.proof.signedWireDigest===p.signedWireDigest),'CONFLICT');
      // Explicit retry of the identical immutable idempotent intent can reconcile a lost
      // result; different work stays held. Transport itself never retries automatically.
      need(p.kind==='receipt'||p.kind==='control_sync'||![...s.wires.values()].some(x=>x.state==='unknown'
        &&x.proof.serviceId===p.serviceId&&x.proof.kind===p.kind&&x.proof.intentDigest!==p.intentDigest),'OUTCOME_UNKNOWN');
      for(const old of s.wires.values())if(p.requestId!==null&&old.proof.serviceId===p.serviceId&&old.proof.requestId===p.requestId)
        need(old.proof.intentDigest===p.intentDigest,'CONFLICT');
      for(const old of s.wires.values())if(old.proof.intentDigest===p.intentDigest)
        need(canonicalJson({...old.proof,signedWireDigest:p.signedWireDigest})===canonicalJson(p),'CONFLICT');
      s.wires.set(value.attemptId as string,{proof:p,state:'unknown',observation:null,receipt:null});break;
    }
    case 'wire_result':{
      exact(value,'attemptId proof observation');proof(value.proof as AskWireProof);
      const w=s.wires.get(value.attemptId as string),o=value.observation as AskWireObservation;
      need(w&&canonicalJson(w.proof)===canonicalJson(value.proof),'CONFLICT');
      exact(o,'kind status responseDigest');digest(o.responseDigest);
      need(o.kind==='data'&&o.status===200||o.kind==='problem'&&Number.isSafeInteger(o.status)&&o.status>=400&&o.status<=599,'INVALID_SCHEMA');
      // A response cannot resolve prior effects. Each physical exchange has one immutable
      // observation; later polls use fresh signed attempts and can return different data.
      need(w.observation===null||canonicalJson(w.observation)===canonicalJson(o),'CONFLICT');w.observation=o;
      break;
    }
    case 'answer_receipt':{
      exact(value,'attemptIds sourceAttemptId receipt');const ids=value.attemptIds as string[];id(value.sourceAttemptId as string);
      need(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'INVALID_SCHEMA');ids.forEach(id);
      const receipt=validate<AskAnswerReceipt>('AskAnswerReceipt',value.receipt);
      const source=s.wires.get(value.sourceAttemptId as string);
      need(source?.proof.answerIdentity&&source.observation?.kind==='data'
        &&source.observation.responseDigest===canonicalHash(receipt),'CONFLICT');
      const identity=canonicalJson(source.proof.answerIdentity);
      for(const attemptId of ids){
        const w=s.wires.get(attemptId),a=w?.proof.answerIdentity;
        need(w&&a&&(w.proof.kind==='answer'||w.proof.kind==='receipt'),'CONFLICT');
        const binding=canonicalJson(a);need(identity===binding,'CONFLICT');
        need(receipt.answerId===a.answerId&&receipt.questionId===a.questionId&&receipt.questionHash===a.questionHash
          &&receipt.answerDigest===a.answerDigest&&Date.parse(a.generatedAt)<=Date.parse(receipt.receivedAt)
          &&Date.parse(receipt.receivedAt)<=instant(at),'CONFLICT');
        for(const prior of s.wires.values())if(prior.receipt&&canonicalJson(prior.proof.answerIdentity)===binding)
          need(canonicalJson(prior.receipt)===canonicalJson(receipt),'CONFLICT');
        need(w.receipt===null||canonicalJson(w.receipt)===canonicalJson(receipt),'CONFLICT');
        w.receipt=receipt;w.state='reconciled';
      }break;
    }
    default:need(false,'INVALID_SCHEMA');
  }
}

/** Caller supplies exclusive HQ ownership. Open never initializes missing custody. */
export class AskAuthorityJournal {
  readonly path:string;readonly checkpointPath:string;
  private readonly db:DatabaseSync;private readonly owner=randomUUID();
  private readonly identities:readonly {path:string;dev:number;ino:number;directory:boolean}[];
  constructor(readonly directory:string,readonly checkpointDirectory:string,readonly hqId:string,excludedBackupRoots:readonly string[]){
    id(hqId);locations(directory,checkpointDirectory,excludedBackupRoots);
    this.path=join(directory,'authority.sqlite');this.checkpointPath=join(checkpointDirectory,'checkpoint.json');
    this.identities=[directory,checkpointDirectory,this.path].map((path,i)=>{const stat=privatePath(path,i<2);return{path,dev:stat.dev,ino:stat.ino,directory:i<2};});
    this.present();this.db=new DatabaseSync(this.path);
    try{
      this.db.exec(`PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA temp_store=MEMORY; PRAGMA busy_timeout=5000; PRAGMA max_page_count=${ASK_AUTHORITY_CAPACITY.maxPages};`);
      need(this.db.prepare('PRAGMA page_size').get()?.page_size===ASK_AUTHORITY_CAPACITY.pageBytes,'CONFLICT');
      need(this.db.prepare('PRAGMA user_version').get()?.user_version===1,'CONFLICT');this.read();
    }catch(e){this.db.close();throw e;}
  }
  /** Test construction only. There is deliberately no production initializer or runtime permit. */
  static createFixture(directory:string,checkpointDirectory:string,hqId:string,excludedBackupRoots:readonly string[],at:string):AskAuthorityJournal {
    id(hqId);instant(at);locations(directory,checkpointDirectory,excludedBackupRoots);
    const path=join(directory,'authority.sqlite'),checkpoint=join(checkpointDirectory,'checkpoint.json');
    need(!exists(path)&&!exists(checkpoint),'CONFLICT');
    for(const suffix of ['-journal','-wal','-shm'])need(!exists(path+suffix),'OUTCOME_UNKNOWN');
    // Permanent initialization marker prevents a partial genesis being mistaken for virgin custody.
    writeExclusive(join(directory,'initialized'),'ask-authority-fixture-v1');syncDir(directory);
    writeExclusive(path,'');const db=new DatabaseSync(path);
    try{
      db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;');db.exec(schema);
      const body={sequence:1,epoch:randomUUID(),at,kind:'genesis',payload:canonicalJson({hqId,purpose:'ask-fixture-v1'}),previous:null};
      const hash=canonicalHash(body);db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(1,body.epoch,at,body.kind,body.payload,null,hash);db.exec('COMMIT');
      writeExclusive(checkpoint,canonicalJson({epoch:body.epoch,sequence:1,digest:hash,at}));syncDir(directory);syncDir(checkpointDirectory);
    }finally{db.close();}
    return new AskAuthorityJournal(directory,checkpointDirectory,hqId,excludedBackupRoots);
  }
  private present():void {
    for(const expected of this.identities){const s=privatePath(expected.path,expected.directory);need(s.dev===expected.dev&&s.ino===expected.ino,'CONFLICT');}
    privatePath(this.checkpointPath,false);privatePath(join(this.directory,'initialized'),false);
    for(const suffix of ['-journal','-wal','-shm'])if(exists(this.path+suffix))privatePath(this.path+suffix,false);
    need(!exists(this.path+'-wal')&&!exists(this.path+'-shm'),'OUTCOME_UNKNOWN');
  }
  private read():State {
    this.present();need(this.db.prepare('PRAGMA integrity_check').get()?.integrity_check==='ok','CONFLICT');
    const count=this.db.prepare('SELECT count(*) n FROM events').get()!.n as number;need(count>0&&count<=ASK_AUTHORITY_CAPACITY.events,'BUDGET_EXHAUSTED');
    const rows=this.db.prepare('SELECT * FROM events ORDER BY sequence').all() as unknown as Entry[];
    const s:State={head:null!,grants:new Map(),revoked:new Set(),models:new Map(),wires:new Map()};
    for(const row of rows){
      const {digest:hash,...body}=row;instant(row.at);need(row.sequence===(s.head?.sequence??0)+1&&row.previous===(s.head?.digest??null)
        &&canonicalHash(body)===hash&&(!s.head||row.epoch===s.head.epoch&&row.at>=s.head.at),'CONFLICT');
      const payload=JSON.parse(row.payload);need(canonicalJson(payload)===row.payload,'CONFLICT');
      if(row.sequence===1){need(row.kind==='genesis'&&canonicalJson(payload)===canonicalJson({hqId:this.hqId,purpose:'ask-fixture-v1'}),'CONFLICT');}
      else apply(s,row.kind,payload,row.at,this.hqId);
      s.head={epoch:row.epoch,sequence:row.sequence,digest:hash,at:row.at};
    }
    need(canonicalJson(JSON.parse(readFileSync(this.checkpointPath,'utf8')))===canonicalJson(s.head),'OUTCOME_UNKNOWN');return s;
  }
  private event(kind:string,payload:unknown,at:string):void {
    this.present();instant(at);const encoded=canonicalJson(payload);need(Buffer.byteLength(encoded)<=ASK_AUTHORITY_CAPACITY.eventBytes,'TOO_LARGE');
    this.db.exec('BEGIN IMMEDIATE');let committed=false;
    try{
      const s=this.read();need(at>=s.head.at&&s.head.sequence<ASK_AUTHORITY_CAPACITY.events,'OUTCOME_UNKNOWN');apply(s,kind,JSON.parse(encoded),at,this.hqId);
      // Reserve durable space for completion of every accepted effect and revocation of
      // every live grant, including many simultaneous receipt/control reconciliation reads.
      const completion=[...s.models.values()].reduce((n,r)=>n+({reserved:3,admitted:2,transmitted:1,settled:0,settled_over_limit:0,unknown:0}[r.state]),0)
        +[...s.wires.values()].reduce((n,w)=>n+(w.state==='unknown'?(w.observation===null?2:1):0),0)+s.grants.size-s.revoked.size;
      need(s.head.sequence+1+completion<=ASK_AUTHORITY_CAPACITY.events,'BUDGET_EXHAUSTED');
      const body={sequence:s.head.sequence+1,epoch:s.head.epoch,at,kind,payload:encoded,previous:s.head.digest},hash=canonicalHash(body);
      this.db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(body.sequence,body.epoch,at,kind,encoded,body.previous,hash);
      this.db.exec('COMMIT');committed=true;
      // No provider/wire effect may follow unless both independent files are durable.
      const temp=this.checkpointPath+'.'+randomUUID();
      writeExclusive(temp,canonicalJson({epoch:body.epoch,sequence:body.sequence,digest:hash,at}));
      renameSync(temp,this.checkpointPath);syncDir(this.checkpointDirectory);
    }catch(e){if(!committed)this.db.exec('ROLLBACK');throw e;}
  }
  approve(value:AskGrant,config:AskGrantConfiguration,at:string):void {this.event('grant',{grant:value,configuration:config},at);}
  revoke(grantId:string,at:string):void {this.event('revoke',{grantId},at);}
  reserve(value:AskReservation,at:string):void {this.event('reserve',{binding:value,owner:this.owner},at);}
  admit(executionId:string,value:AskAdmissionProof,at:string):void {this.event('admit',{executionId,owner:this.owner,proof:value},at);}
  beforeModelTransmit(executionId:string,value:AskAdmissionProof,at:string):void {this.event('transmit',{executionId,owner:this.owner,proof:value},at);}
  settle(executionId:string,value:AskUsageReceipt,at:string):void {this.event('settle',{executionId,owner:this.owner,receipt:value},at);}
  notSent(executionId:string,at:string):void {this.event('not_sent',{executionId,owner:this.owner},at);}
  unknown(executionId:string,at:string):void {this.event('unknown',{executionId},at);}
  /** Synchronous metadata-only callback for the transport's final pre-wire boundary. */
  beforeWire(attemptId:string,value:Readonly<AskWireProof>,at:string):void {this.event('wire',{attemptId,proof:value},at);}
  /** Exact-attempt response observation only; never clears effect uncertainty. */
  wireResult(attemptId:string,value:AskWireProof,observation:AskWireObservation,at:string):void {this.event('wire_result',{attemptId,proof:value,observation},at);}
  /** Trusted consumer supplies the decoded matching receiver receipt. This journal does not
   * authenticate arbitrary caller data. Historical answer disposition is not display/model
   * authority. Other operation-specific reconciliation remains unimplemented and held. */
  reconcileAnswer(attemptIds:string[],sourceAttemptId:string,receipt:AskAnswerReceipt,at:string):void {this.event('answer_receipt',{attemptIds,sourceAttemptId,receipt},at);}
  inspect():{head:Head;grants:AskGrant[];models:ModelState[];wires:WireState[]}{
    const s=this.read();return structuredClone({head:s.head,grants:[...s.grants.values()],models:[...s.models.values()],wires:[...s.wires.values()]});
  }
  close():void {this.db.close();}
}
