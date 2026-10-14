/** One-use offline handoff; deliberately separate from restore/generation recovery. */
import {randomUUID} from 'node:crypto';
import {constants,openSync,closeSync,fsyncSync,writeFileSync,readFileSync,lstatSync,realpathSync,renameSync} from 'node:fs';
import {dirname,join,isAbsolute,resolve,sep} from 'node:path';
import {canonicalHash as hash,canonicalJson as json,sha256,requireContract as need} from '../../../scripts/investment-contracts/schema.js';
import type {Store} from '../../persistence/store.js';
import type {Channel} from '../../domain/publication/types.js';
type Reader=Pick<Store,'get'|'all'>;
const tables=['channels','intents','identities','sequences','previews','grants','captures','jobs','attempts','results','controls'].map(s=>'investment_public_'+s);
export interface CleanRestartFiles {publicationConfig:string;finiteAuthority:string;finiteCheckpoint:string}
interface Permit {
 version:1;id:string;channelId:string;generation:string;createdAt:string;expiresAt:string;targetSha:string;
 stateDigest:string;files:CleanRestartFiles;fileDigests:Record<keyof CleanRestartFiles,string>;
 state:'ready'|'claimed'|'completed';claimedBy:string|null;receiptDigest:string|null;
}
function privateFile(path:string,directory=false):void {
 const s=lstatSync(path);need(isAbsolute(path)&&resolve(path)===path&&realpathSync(path)===path&&!s.isSymbolicLink()
  &&s.uid===process.getuid?.()&&(s.mode&0o077)===0&&(directory?s.isDirectory():s.isFile()&&s.nlink===1),'FORBIDDEN');
}
function root(directory:string,excluded:readonly string[]):void {
 privateFile(directory,true);need(excluded.length>0,'FORBIDDEN');
 for(const value of excluded){const p=realpathSync(value);need(directory!==p&&!directory.startsWith(p+sep)&&!p.startsWith(directory+sep),'FORBIDDEN');}
 for(let p=dirname(directory);;p=dirname(p)){const s=lstatSync(p);need(!s.isSymbolicLink()&&s.isDirectory()&&realpathSync(p)===p
  &&(s.uid===0||s.uid===process.getuid?.())&&((s.mode&0o022)===0||s.uid===0&&(s.mode&0o1000)!==0),'FORBIDDEN');if(p===dirname(p))break;}
}
function syncDir(directory:string):void {const fd=openSync(directory,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(fd);}finally{closeSync(fd);}}
function save(path:string,value:Permit,initial=false):void {
 const target=initial?path:path+'.'+randomUUID(),fd=openSync(target,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,json(value));fsyncSync(fd);}finally{closeSync(fd);}
 if(!initial)renameSync(target,path);syncDir(dirname(path));
}
function digests(files:CleanRestartFiles):Permit['fileDigests'] {
 need(Object.keys(files).sort().join(',')==='finiteAuthority,finiteCheckpoint,publicationConfig','INVALID_SCHEMA');
 const result={} as Permit['fileDigests'];for(const k of Object.keys(files) as (keyof CleanRestartFiles)[]){privateFile(files[k]);result[k]=sha256(readFileSync(files[k]));}return result;
}
function encoded(value:unknown):unknown {
 if(value instanceof Uint8Array)return{binary:Buffer.from(value).toString('base64')};
 if(Array.isArray(value))return value.map(encoded);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encoded(v)]));return value;
}
/** Includes every consumed publication attempt/result, not merely the displayed watermark. */
export function cleanRestartState(db:Reader,channelId:string):string {
 const c=db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',channelId);need(c?.source_run_id,'NOT_FOUND');
 const source=db.get('SELECT * FROM investment_runs WHERE run_id=?',c.source_run_id);need(source,'NOT_FOUND');
 return hash(encoded({publication:Object.fromEntries(tables.map(t=>[t,db.all(`SELECT rowid AS _rowid_,* FROM ${t} ORDER BY rowid`)])),
  source,journal:db.all('SELECT * FROM investment_journal WHERE run_id=? ORDER BY version',c.source_run_id)}));
}
export function assertCleanQuiescence(db:Reader,channelId:string):void {
 const c=db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',channelId);need(c&&c.generation===c.reconciled_generation,'OUTCOME_UNKNOWN');
 need(!db.get("SELECT 1 FROM executions WHERE status='running'")&&!db.get('SELECT 1 FROM execution_runtime_attempts WHERE unresolved=1'),'OUTCOME_UNKNOWN');
 need(!db.get("SELECT 1 FROM investment_public_jobs WHERE state!='delivered' OR needs_receipt!=0 OR lease IS NOT NULL OR receipt IS NULL"),'OUTCOME_UNKNOWN');
 need(!db.get('SELECT 1 FROM investment_public_attempts a LEFT JOIN investment_public_results r ON r.attempt_id=a.id WHERE r.attempt_id IS NULL'),'OUTCOME_UNKNOWN');
 need(!db.get("SELECT 1 FROM investment_loop_occurrences WHERE state='running'")
  &&!db.get('SELECT 1 FROM financial_attempts a LEFT JOIN financial_attempt_results r ON r.attempt_id=a.attempt_id WHERE r.attempt_id IS NULL'),'OUTCOME_UNKNOWN');
}
/** Caller is an explicit offline deployment helper holding the exclusive Company data lock. */
export function prepareCleanRestart(db:Reader,directory:string,excluded:readonly string[],channelId:string,files:CleanRestartFiles,targetSha:string,at:string):void {
 prepare(db,directory,excluded,channelId,files,targetSha,at);
}
/** Only PublicationService calls this after quiescing its currently reconciled live instance. */
export function prepareLiveCleanRestart(db:Reader,directory:string,excluded:readonly string[],channelId:string,files:CleanRestartFiles,targetSha:string,at:string,liveInstance:string):void {
 need(db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',channelId)?.publisher_instance===liveInstance,'OUTCOME_UNKNOWN');
 prepare(db,directory,excluded,channelId,files,targetSha,at,liveInstance);
}
function prepare(db:Reader,directory:string,excluded:readonly string[],channelId:string,files:CleanRestartFiles,targetSha:string,at:string,liveInstance?:string):void {
 root(directory,excluded);need(/^[a-f0-9]{40}$/.test(targetSha)&&Number.isFinite(Date.parse(at)),'INVALID_SCHEMA');assertCleanQuiescence(db,channelId);
 const path=join(directory,'checkpoint.json');let prior:Permit|undefined;
 try{privateFile(path);prior=JSON.parse(readFileSync(path,'utf8')) as Permit;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 if(prior){need(liveInstance&&prior.state==='completed'&&prior.channelId===channelId&&prior.receiptDigest,'OUTCOME_UNKNOWN');
  privateFile(join(directory,'initialized'));
  const control=db.get<{detail:string}>("SELECT detail FROM investment_public_controls WHERE channel_id=? AND action='clean_restart_reconciled' AND json_extract(detail,'$.permitId')=?",channelId,prior.id);
  need(control&&hash(JSON.parse(control.detail))===prior.receiptDigest,'OUTCOME_UNKNOWN');}
 else{
  // Permanent marker survives lost/partial/consumed checkpoints. Never recreate virgin custody.
  const fd=openSync(join(directory,'initialized'),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,'publication-clean-restart-v1');fsyncSync(fd);}finally{closeSync(fd);}syncDir(directory);
 }
 const channel=db.get<Channel>('SELECT * FROM investment_public_channels WHERE id=?',channelId)!;
 const value:Permit={version:1,id:randomUUID(),channelId,generation:channel.generation,createdAt:at,expiresAt:new Date(Date.parse(at)+1800000).toISOString(),targetSha,
  stateDigest:cleanRestartState(db,channelId),files,fileDigests:digests(files),state:'ready',claimedBy:null,receiptDigest:null};
 save(path,value,!prior);
}
/** Claim is durable BEFORE any request/attempt. It cannot be reused after a crash. */
export function claimCleanRestart(db:Reader,directory:string,excluded:readonly string[],targetSha:string,instance:string,at:string,expectedFiles:CleanRestartFiles){
 root(directory,excluded);privateFile(join(directory,'initialized'));const path=join(directory,'checkpoint.json');privateFile(path);const permit=JSON.parse(readFileSync(path,'utf8')) as Permit;
 need(permit.version===1&&permit.state==='ready'&&permit.claimedBy===null&&permit.receiptDigest===null&&permit.targetSha===targetSha
  &&permit.createdAt<=at&&at<permit.expiresAt,'OUTCOME_UNKNOWN');assertCleanQuiescence(db,permit.channelId);
 need(hash(permit.files)===hash(expectedFiles)&&cleanRestartState(db,permit.channelId)===permit.stateDigest&&hash(digests(permit.files))===hash(permit.fileDigests),'OUTCOME_UNKNOWN');
 permit.state='claimed';permit.claimedBy=instance;save(path,permit);
 const verify=()=>{privateFile(path);need(json(JSON.parse(readFileSync(path,'utf8')))===json(permit)&&hash(digests(permit.files))===hash(permit.fileDigests),'OUTCOME_UNKNOWN');};
 return{channelId:permit.channelId,generation:permit.generation,permitId:permit.id,expiresAt:permit.expiresAt,verify,
  complete(detail:unknown){verify();permit.state='completed';permit.receiptDigest=hash(detail);save(path,permit);}};
}
