/** Dormant Ask authority custody. No Company, credentials, runtime permit or network caller. */
import { randomUUID } from 'node:crypto';
import { closeSync, constants, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { canonicalHash, canonicalJson, requireContract as need, validate } from '../../../scripts/investment-contracts/schema.js';
import { admission, configuration, digest, exact, grant, id, instant, micros, reservation, usage,
  type AskAdmissionProof, type AskGrant, type AskGrantConfiguration, type AskReservation, type AskUsageReceipt } from '../../domain/ask/authority.js';
import type { AskWireProof } from './transport.js';
import {checkAskConfiguration} from '../../../scripts/investment-contracts/ask.js';
import type { AskClaimPage, AskClaim, AskStatus, AskControlSync, AskServiceConfiguration, AskAnswerReceipt } from '../../../contracts/investment/v1/types.js';

interface Head {epoch:string;sequence:number;digest:string;at:string}
interface Entry {sequence:number;epoch:string;at:string;kind:string;payload:string;previous:string|null;digest:string}
interface ModelState {binding:AskReservation;owner:string;state:'reserved'|'admitted'|'transmitted'|'settled'|'settled_over_limit'|'unknown';proof:AskAdmissionProof|null;receipt:AskUsageReceipt|null}
export interface AskWireObservation {kind:'data'|'problem';status:number;responseDigest:string}
interface WireState {proof:AskWireProof;state:'unknown'|'reconciled';observation:AskWireObservation|null;receipt:AskAnswerReceipt|null}
export interface AskConfigurationCheckpoint {serviceId:string;generation:string;keyId:string;revision:string;hash:string}
export type AskAppliedWireEffect =
 | {kind:'claim';claimRequestId:string;questionId:string|null;questionDigest:string|null;claimDigest:string|null}
 | {kind:'renew';questionId:string;claimDigest:string}
 | {kind:'status';questionId:string;statusDigest:string}
 | {kind:'control_sync';syncId:string;applicationDigest:string};
interface AskEffectCheckpoints {claims:Map<string,{serviceId:string;questionId:string;claimDigest:string}>;statuses:Map<string,{serviceId:string;questionId:string;statusDigest:string}>;controls:Map<string,{serviceId:string;applicationDigest:string}>}
interface State extends AskEffectCheckpoints {paused:Set<string>;configurations:Map<string,AskConfigurationCheckpoint>;head:Head;grants:Map<string,AskGrant>;revoked:Set<string>;models:Map<string,ModelState>;wires:Map<string,WireState>}
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
  need(['configuration','claim','renew','status','answer','receipt','control_sync'].includes(value.kind),'INVALID_SCHEMA');
  id(value.serviceId);validate('Sequence',value.generation);digest(value.intentDigest);digest(value.signedWireDigest);
  need((value.kind==='receipt'||value.kind==='configuration')?value.requestId===null:value.requestId!==null,'INVALID_SCHEMA');if(value.requestId!==null)id(value.requestId);
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
  need(!s.paused.has(g.serviceId),'UNAVAILABLE');
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
    case 'owner_pause':{
      exact(value,'serviceId paused');id(value.serviceId as string);need(typeof value.paused==='boolean','INVALID_SCHEMA');
      if(value.paused)s.paused.add(value.serviceId as string);else s.paused.delete(value.serviceId as string);break;
    }
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
      need(p.kind==='configuration'||p.kind==='receipt'||p.kind==='control_sync'||![...s.wires.values()].some(x=>x.state==='unknown'
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
    case 'configuration_observed':{
      exact(value,'attemptIds sourceAttemptId snapshot');
      const ids=value.attemptIds as string[],source=s.wires.get(value.sourceAttemptId as string),c=value.snapshot as AskServiceConfiguration;
      need(source?.proof.kind==='configuration'&&source.observation?.kind==='data'&&source.observation.responseDigest===canonicalHash(c),'CONFLICT');
      checkAskConfiguration(c,c.scope,at);
      need(c.serviceId===source.proof.serviceId&&c.consumerGeneration===source.proof.generation,'CONFLICT');
      const key=c.serviceId+'/'+c.consumerGeneration+'/'+c.scope.keyId,prior=s.configurations.get(key);
      need(!prior||BigInt(c.configurationRevision)>=BigInt(prior.revision),'CONFLICT');
      if(prior&&c.configurationRevision===prior.revision)need(c.configurationHash===prior.hash,'CONFLICT');
      need(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'INVALID_SCHEMA');
      for(const attemptId of ids){id(attemptId);const w=s.wires.get(attemptId);need(w&&w.proof.kind==='configuration'&&w.proof.serviceId===c.serviceId&&w.proof.generation===c.consumerGeneration&&w.proof.intentDigest===source.proof.intentDigest,'CONFLICT');w.state='reconciled';}
      s.configurations.set(key,{serviceId:c.serviceId,generation:c.consumerGeneration,keyId:c.scope.keyId,revision:c.configurationRevision,hash:c.configurationHash});break;
    }
    case 'wire_applied':{
      exact(value,'attemptIds sourceAttemptId responseDigest effect');digest(value.responseDigest as string);const effect=value.effect as AskAppliedWireEffect;
      need(effect&&['claim','renew','status','control_sync'].includes(effect.kind),'INVALID_SCHEMA');
      switch(effect.kind){
        case 'claim':exact(effect,'kind claimRequestId questionId questionDigest claimDigest');id(effect.claimRequestId);need((effect.questionId===null)===(effect.questionDigest===null)&&(effect.questionId===null)===(effect.claimDigest===null),'INVALID_SCHEMA');if(effect.questionId!==null){id(effect.questionId);digest(effect.questionDigest!);digest(effect.claimDigest!);}break;
        case 'renew':exact(effect,'kind questionId claimDigest');id(effect.questionId);digest(effect.claimDigest);break;
        case 'status':exact(effect,'kind questionId statusDigest');id(effect.questionId);digest(effect.statusDigest);break;
        case 'control_sync':exact(effect,'kind syncId applicationDigest');id(effect.syncId);digest(effect.applicationDigest);break;
      }
      const source=s.wires.get(value.sourceAttemptId as string),ids=value.attemptIds as string[];
      need(source?.proof.kind===effect.kind&&source.observation?.kind==='data'&&source.observation.responseDigest===value.responseDigest,'CONFLICT');
      if(effect.kind==='claim')need(source.proof.requestId===effect.claimRequestId,'CONFLICT');
      if(effect.kind==='control_sync')need(source.proof.requestId===effect.syncId,'CONFLICT');
      need(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'INVALID_SCHEMA');
      for(const attemptId of ids){id(attemptId);const w=s.wires.get(attemptId);need(w&&w.proof.kind===effect.kind&&w.proof.serviceId===source.proof.serviceId&&w.proof.generation===source.proof.generation&&w.proof.intentDigest===source.proof.intentDigest,'CONFLICT');w.state='reconciled';}
      const serviceId=source.proof.serviceId;
      if((effect.kind==='claim'||effect.kind==='renew')&&effect.questionId!==null)s.claims.set(serviceId+'/'+effect.questionId,{serviceId,questionId:effect.questionId,claimDigest:effect.claimDigest!});
      if(effect.kind==='status')s.statuses.set(serviceId+'/'+effect.questionId,{serviceId,questionId:effect.questionId,statusDigest:effect.statusDigest});
      if(effect.kind==='control_sync')s.controls.set(serviceId,{serviceId,applicationDigest:effect.applicationDigest});break;
    }
    case 'control_drain':{
      exact(value,'attemptIds sourceAttemptId terminalPage applicationDigest');digest(value.applicationDigest as string);
      const page=validate<AskControlSync>('AskControlSync',value.terminalPage),source=s.wires.get(value.sourceAttemptId as string),ids=value.attemptIds as string[];
      need(source?.proof.kind==='control_sync'&&source.proof.requestId===page.syncId&&source.observation?.kind==='data'&&source.observation.responseDigest===canonicalHash(page),'CONFLICT');
      need(page.controls.length===0&&page.nextCursor===null&&Date.parse(page.checkedAt)<=instant(at)&&instant(at)<Date.parse(page.validUntil),'EXPIRED');
      need(Array.isArray(ids)&&ids.length>0&&ids.length<=100&&new Set(ids).size===ids.length,'INVALID_SCHEMA');
      for(const attemptId of ids){id(attemptId);const w=s.wires.get(attemptId);need(w?.proof.kind==='control_sync'&&w.proof.serviceId===source.proof.serviceId&&w.proof.generation===source.proof.generation,'CONFLICT');w.state='reconciled';}break;
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
  constructor(readonly directory:string,readonly checkpointDirectory:string,readonly hqId:string,excludedBackupRoots:readonly string[],private readonly purpose:'ask-fixture-v1'|'ask-production-v1'='ask-fixture-v1'){
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
  /** Fixture custody is never accepted by the operational loader. */
  static createFixture(directory:string,checkpointDirectory:string,hqId:string,excludedBackupRoots:readonly string[],at:string):AskAuthorityJournal {
    return this.initialize(directory,checkpointDirectory,hqId,excludedBackupRoots,at,'ask-fixture-v1');
  }
  /** Explicit offline provisioning only. Empty custody grants no spending or model authority. */
  static createProduction(directory:string,checkpointDirectory:string,hqId:string,excludedBackupRoots:readonly string[],at:string,initializationApprovalDigest:string):AskAuthorityJournal {
    digest(initializationApprovalDigest);return this.initialize(directory,checkpointDirectory,hqId,excludedBackupRoots,at,'ask-production-v1',initializationApprovalDigest);
  }
  private static initialize(directory:string,checkpointDirectory:string,hqId:string,excludedBackupRoots:readonly string[],at:string,purpose:'ask-fixture-v1'|'ask-production-v1',initializationApprovalDigest?:string):AskAuthorityJournal {
    id(hqId);instant(at);locations(directory,checkpointDirectory,excludedBackupRoots);
    const path=join(directory,'authority.sqlite'),checkpoint=join(checkpointDirectory,'checkpoint.json');
    need(!exists(path)&&!exists(checkpoint),'CONFLICT');
    for(const suffix of ['-journal','-wal','-shm'])need(!exists(path+suffix),'OUTCOME_UNKNOWN');
    // Permanent initialization marker prevents a partial genesis being mistaken for virgin custody.
    writeExclusive(join(directory,'initialized'),purpose);syncDir(directory);
    writeExclusive(path,'');const db=new DatabaseSync(path);
    try{
      db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;');db.exec(schema);
      const body={sequence:1,epoch:randomUUID(),at,kind:'genesis',payload:canonicalJson({hqId,purpose,...(initializationApprovalDigest?{initializationApprovalDigest}:{})}),previous:null};
      const hash=canonicalHash(body);db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run(1,body.epoch,at,body.kind,body.payload,null,hash);db.exec('COMMIT');
      writeExclusive(checkpoint,canonicalJson({epoch:body.epoch,sequence:1,digest:hash,at}));syncDir(directory);syncDir(checkpointDirectory);
    }finally{db.close();}
    return new AskAuthorityJournal(directory,checkpointDirectory,hqId,excludedBackupRoots,purpose);
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
    const s:State={paused:new Set(),claims:new Map(),statuses:new Map(),controls:new Map(),configurations:new Map(),head:null!,grants:new Map(),revoked:new Set(),models:new Map(),wires:new Map()};
    for(const row of rows){
      const {digest:hash,...body}=row;instant(row.at);need(row.sequence===(s.head?.sequence??0)+1&&row.previous===(s.head?.digest??null)
        &&canonicalHash(body)===hash&&(!s.head||row.epoch===s.head.epoch&&row.at>=s.head.at),'CONFLICT');
      const payload=JSON.parse(row.payload);need(canonicalJson(payload)===row.payload,'CONFLICT');
      if(row.sequence===1){exact(payload,'hqId purpose'+(this.purpose==='ask-production-v1'?' initializationApprovalDigest':''));
        need(row.kind==='genesis'&&payload.hqId===this.hqId&&payload.purpose===this.purpose,'CONFLICT');
        if(this.purpose==='ask-production-v1')digest(payload.initializationApprovalDigest as string);}
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
  assertCurrent(grantId:string,at:string):AskGrant {instant(at);return structuredClone(current(this.read(),grantId,at));}
  revoke(grantId:string,at:string):void {this.event('revoke',{grantId},at);}
  ownerPause(serviceId:string,paused:boolean,at:string):void {this.event('owner_pause',{serviceId,paused},at);}
  isPaused(serviceId:string):boolean {id(serviceId);return this.read().paused.has(serviceId);}
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
   * authority. Other effects require their own typed local application or terminal control drain. */
  reconcileAnswer(attemptIds:string[],sourceAttemptId:string,receipt:AskAnswerReceipt,at:string):void {this.event('answer_receipt',{attemptIds,sourceAttemptId,receipt},at);}
  /** Only the trusted coordinator calls these after its operation-specific durable effect.
   * They never settle a model, infer a successful mutation from HTTP errors, or authorize work. */
  observeConfiguration(attemptIds:string[],sourceAttemptId:string,snapshot:AskServiceConfiguration,at:string):void {this.event('configuration_observed',{attemptIds,sourceAttemptId,snapshot},at);}
  appliedClaim(attemptIds:string[],sourceAttemptId:string,value:AskClaimPage,at:string):void {
    validate('AskClaimPage',value);const q=value.claim?.question;
    this.event('wire_applied',{attemptIds,sourceAttemptId,responseDigest:canonicalHash(value),effect:{kind:'claim',claimRequestId:value.claimRequestId,questionId:q?.questionId??null,questionDigest:q?canonicalHash(q):null,claimDigest:value.claim?canonicalHash(value.claim):null}},at);
  }
  appliedRenew(attemptIds:string[],sourceAttemptId:string,value:AskClaim,at:string):void {
    validate('AskClaim',value);this.event('wire_applied',{attemptIds,sourceAttemptId,responseDigest:canonicalHash(value),effect:{kind:'renew',questionId:value.question.questionId,claimDigest:canonicalHash(value)}},at);
  }
  appliedStatus(attemptIds:string[],sourceAttemptId:string,value:AskStatus,at:string):void {
    validate('AskStatus',value);this.event('wire_applied',{attemptIds,sourceAttemptId,responseDigest:canonicalHash(value),effect:{kind:'status',questionId:value.questionId,statusDigest:canonicalHash(value)}},at);
  }
  appliedControls(attemptIds:string[],sourceAttemptId:string,value:AskControlSync,applicationDigest:string,at:string):void {
    validate('AskControlSync',value);this.event('wire_applied',{attemptIds,sourceAttemptId,responseDigest:canonicalHash(value),effect:{kind:'control_sync',syncId:value.syncId,applicationDigest}},at);
  }
  /** A fresh terminal traversal resolves only control metadata selected by the trusted
   * journal's resolved_by relation after local suppression and content maintenance. */
  reconcileControlDrain(attemptIds:string[],sourceAttemptId:string,terminalPage:AskControlSync,applicationDigest:string,at:string):void {
    this.event('control_drain',{attemptIds,sourceAttemptId,terminalPage,applicationDigest},at);
  }
  inspect():{effects:{claims:{serviceId:string;questionId:string;claimDigest:string}[];statuses:{serviceId:string;questionId:string;statusDigest:string}[];controls:{serviceId:string;applicationDigest:string}[]};head:Head;configurations:AskConfigurationCheckpoint[];grants:AskGrant[];models:ModelState[];wires:(WireState&{attemptId:string})[]}{
    const s=this.read();return structuredClone({effects:{claims:[...s.claims.values()],statuses:[...s.statuses.values()],controls:[...s.controls.values()]},head:s.head,configurations:[...s.configurations.values()],grants:[...s.grants.values()],models:[...s.models.values()],wires:[...s.wires.entries()].map(([attemptId,w])=>({...w,attemptId}))});
  }
  close():void {this.db.close();}
}
