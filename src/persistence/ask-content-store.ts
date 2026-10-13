/** Dedicated private raw-content custody. This is not the Company database or a grant. */
import { randomUUID } from 'node:crypto';
import { closeSync, constants, fsyncSync, lstatSync, openSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { ContractError, canonicalHash, canonicalJson, requireContract as need } from '../../scripts/investment-contracts/schema.js';
import type { AskAnswer, AskControlReceipt, AskQuestion } from '../../contracts/investment/v1/types.js';

export const ASK_CONTENT_ROWS=512, ASK_CONTENT_BYTES=8*1024*1024;
const schema=`
CREATE TABLE identity (singleton INTEGER PRIMARY KEY CHECK(singleton=1), version INTEGER NOT NULL CHECK(version=1), store_id TEXT NOT NULL, service_id TEXT NOT NULL);
CREATE TABLE questions (ref TEXT PRIMARY KEY, service_id TEXT NOT NULL, question_id TEXT NOT NULL,
 conversation_id TEXT NOT NULL, digest TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)),
 retain_until TEXT NOT NULL, UNIQUE(service_id,question_id));
CREATE TABLE answers (ref TEXT PRIMARY KEY REFERENCES questions(ref) ON DELETE CASCADE,
 answer_id TEXT NOT NULL UNIQUE, digest TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE outbox (ref TEXT PRIMARY KEY REFERENCES answers(ref) ON DELETE CASCADE,
 answer_id TEXT NOT NULL, digest TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending_authority','receipted')));
CREATE TABLE tombstones (service_id TEXT NOT NULL, control_id TEXT NOT NULL, digest TEXT NOT NULL,
 conversation_id TEXT NOT NULL, question_id TEXT, suppression_until TEXT NOT NULL,
 PRIMARY KEY(service_id,control_id));
`;
interface QuestionRow {ref:string;digest:string;payload:string;retain_until:string}
interface AnswerRow {answer_id:string;digest:string;payload:string}
export function privateContentError<T>(fn:()=>T):T {
 try{return fn();}catch(error){if(error instanceof ContractError)throw error;throw new ContractError('UNAVAILABLE');}
}
function privatePath(path:string,directory:boolean){
 const s=lstatSync(path);
 need(!s.isSymbolicLink()&&realpathSync(path)===path&&s.uid===process.getuid?.()&&(s.mode&0o077)===0
  &&(directory?s.isDirectory():s.isFile()&&s.nlink===1),'FORBIDDEN');return s;
}
const within=(a:string,b:string)=>a===b||a.startsWith(b+sep);
// existsSync follows symlinks and would miss a dangling unsafe sidecar.
function present(path:string):boolean{
 try{lstatSync(path);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return false;throw error;}
}

/** Caller owns the service data lock; no automatic backup, replacement, network or model. */
export class AskContentStore {
 readonly path:string;
 readonly id:string;
 private readonly db:DatabaseSync;
 private readonly rootIdentity:{dev:number;ino:number};
 private readonly fileIdentity:{dev:number;ino:number};
 constructor(readonly root:string,readonly serviceId:string,excludedBackupRoots:readonly string[],mustExist:boolean){
  const opened=privateContentError(()=>{
   need(isAbsolute(root)&&resolve(root)===root&&excludedBackupRoots.length>0,'FORBIDDEN');
   const rootStat=privatePath(root,true);
   for(let parent=dirname(root);;parent=dirname(parent)){
    const s=lstatSync(parent);
    need(s.isDirectory()&&!s.isSymbolicLink()&&realpathSync(parent)===parent
     &&(s.uid===0||s.uid===process.getuid?.())&&((s.mode&0o022)===0||(s.uid===0&&(s.mode&0o1000)!==0)),'FORBIDDEN');
    if(parent===dirname(parent))break;
   }
   for(const excluded of excludedBackupRoots){
    need(isAbsolute(excluded)&&resolve(excluded)===excluded&&realpathSync(excluded)===excluded,'FORBIDDEN');
    need(!within(root,excluded)&&!within(excluded,root),'FORBIDDEN');
   }
   const path=join(root,'content.sqlite');need(!mustExist||present(path),'OUTCOME_UNKNOWN');
   // A crash may leave a valid DELETE rollback journal. Never follow an unsafe sidecar.
   for(const suffix of ['-journal','-wal','-shm'])if(present(path+suffix))privatePath(path+suffix,false);
   need(!present(path+'-wal')&&!present(path+'-shm'),'OUTCOME_UNKNOWN');
   const fresh=!present(path);
   if(fresh){const fd=openSync(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{fsyncSync(fd);}finally{closeSync(fd);}}
   const fileStat=privatePath(path,false),db=new DatabaseSync(path);
   try{
    db.exec('PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA temp_store=MEMORY; PRAGMA busy_timeout=5000; PRAGMA max_page_count=4096;');
    if(fresh){db.exec('BEGIN IMMEDIATE');try{db.exec(schema);db.prepare('INSERT INTO identity VALUES(1,1,?,?)').run(randomUUID(),serviceId);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}}
    const identity=db.prepare('SELECT * FROM identity WHERE singleton=1').get() as {version:number;store_id:string;service_id:string}|undefined;
    need(identity?.version===1&&identity.service_id===serviceId,'CONFLICT');
    need(db.prepare('PRAGMA journal_mode').get()!.journal_mode==='delete'&&db.prepare('PRAGMA secure_delete').get()!.secure_delete===1
     &&db.prepare('PRAGMA synchronous').get()!.synchronous===2&&db.prepare('PRAGMA temp_store').get()!.temp_store===2,'FORBIDDEN');
    need(db.prepare('PRAGMA integrity_check').get()!.integrity_check==='ok'&&!db.prepare('PRAGMA foreign_key_check').all().length,'CONFLICT');
    const fd=openSync(root,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(fd);}finally{closeSync(fd);}
    return {db,path,id:identity.store_id,rootStat,fileStat};
   }catch(error){db.close();throw error;}
  });
  this.db=opened.db;this.path=opened.path;this.id=opened.id;this.rootIdentity=opened.rootStat;this.fileIdentity=opened.fileStat;
 }
 assertCustody():void {
  const r=privatePath(this.root,true),f=privatePath(this.path,false);
  need(r.dev===this.rootIdentity.dev&&r.ino===this.rootIdentity.ino&&f.dev===this.fileIdentity.dev&&f.ino===this.fileIdentity.ino,'CONFLICT');
  for(const suffix of ['-journal','-wal','-shm'])if(present(this.path+suffix))privatePath(this.path+suffix,false);
  need(!present(this.path+'-wal')&&!present(this.path+'-shm'),'OUTCOME_UNKNOWN');
 }
 private get<T>(sql:string,...params:SQLInputValue[]):T|undefined{return this.db.prepare(sql).get(...params) as T|undefined;}
 private transaction<T>(fn:()=>T):T{
  this.assertCustody();this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 private blocked(q:AskQuestion){return !!this.get('SELECT 1 FROM tombstones WHERE service_id=? AND conversation_id=? AND (question_id IS NULL OR question_id=?)',q.serviceId,q.conversationId,q.questionId);}
 private capacity(extra:number,rows:number){
  const totals=this.get<{n:number;bytes:number}>('SELECT count(*) n,coalesce(sum(length(CAST(payload AS BLOB))),0) bytes FROM questions')!;
  const answers=this.get<{bytes:number}>('SELECT coalesce(sum(length(CAST(payload AS BLOB))),0) bytes FROM answers')!;
  need(totals.n+rows<=ASK_CONTENT_ROWS&&totals.bytes+answers.bytes+extra<=ASK_CONTENT_BYTES,'BUDGET_EXHAUSTED');
 }
 empty():boolean{return this.get<{n:number}>('SELECT (SELECT count(*) FROM questions)+(SELECT count(*) FROM tombstones) n')!.n===0;}
 references():{ref:string;question_id:string;service_id:string}[]{this.assertCustody();return this.db.prepare('SELECT ref,question_id,service_id FROM questions').all() as {ref:string;question_id:string;service_id:string}[];}
 question(ref:string):{question:AskQuestion;digest:string;retainUntil:string}|null{
  this.assertCustody();const row=this.get<QuestionRow>('SELECT * FROM questions WHERE ref=?',ref);if(!row)return null;
  const question=JSON.parse(row.payload) as AskQuestion;need(canonicalHash(question)===row.digest,'CONFLICT');
  return {question,digest:row.digest,retainUntil:row.retain_until};
 }
 insertQuestion(ref:string,q:AskQuestion,retainUntil:string):void{
  this.transaction(()=>{
   need(!this.blocked(q),'WITHDRAWN');const old=this.question(ref),digest=canonicalHash(q);
   if(old){need(old.digest===digest&&canonicalJson(old.question)===canonicalJson(q)&&old.retainUntil===retainUntil,'CONFLICT');return;}
   const body=canonicalJson(q);this.capacity(Buffer.byteLength(body),1);
   this.db.prepare('INSERT INTO questions VALUES(?,?,?,?,?,?,?)').run(ref,q.serviceId,q.questionId,q.conversationId,digest,body,retainUntil);
  });
 }
 answer(ref:string):{answer:AskAnswer;digest:string;state:'pending_authority'|'receipted'}|null{
  this.assertCustody();const row=this.get<AnswerRow>('SELECT * FROM answers WHERE ref=?',ref);if(!row)return null;
  const answer=JSON.parse(row.payload) as AskAnswer,out=this.get<{answer_id:string;digest:string;state:'pending_authority'|'receipted'}>('SELECT * FROM outbox WHERE ref=?',ref);
  need(canonicalHash(answer)===row.digest&&answer.answerId===row.answer_id&&out?.answer_id===row.answer_id&&out.digest===row.digest,'CONFLICT');
  return {answer,digest:row.digest,state:out.state};
 }
 insertAnswer(ref:string,q:AskQuestion,a:AskAnswer):void{
  this.transaction(()=>{
   need(!this.blocked(q),'WITHDRAWN');const question=this.question(ref);need(question&&canonicalHash(q)===question.digest,'CONFLICT');
   const old=this.answer(ref),digest=canonicalHash(a);if(old){need(old.digest===digest&&canonicalJson(old.answer)===canonicalJson(a),'CONFLICT');return;}
   const body=canonicalJson(a);this.capacity(Buffer.byteLength(body),0);
   this.db.prepare('INSERT INTO answers VALUES(?,?,?,?)').run(ref,a.answerId,digest,body);
   this.db.prepare("INSERT INTO outbox VALUES(?,?,?,'pending_authority')").run(ref,a.answerId,digest);
  });
 }
 receipted(ref:string):void{this.transaction(()=>{this.db.prepare("UPDATE outbox SET state='receipted' WHERE ref=?").run(ref);});}
 remove(ref:string):void{this.transaction(()=>{this.db.prepare('DELETE FROM questions WHERE ref=?').run(ref);});}
 shorten(ref:string,retainUntil:string):void{
  this.assertCustody();const row=this.get<{retain_until:string}>('SELECT retain_until FROM questions WHERE ref=?',ref);
  if(row&&row.retain_until>retainUntil)this.transaction(()=>{this.db.prepare('UPDATE questions SET retain_until=min(retain_until,?) WHERE ref=?').run(retainUntil,ref);});
 }
 control(c:AskControlReceipt):void{
  this.transaction(()=>{
   const prior=this.get<{digest:string}>('SELECT digest FROM tombstones WHERE service_id=? AND control_id=?',this.serviceId,c.controlId),digest=canonicalHash(c);
   if(prior)need(prior.digest===digest,'CONFLICT');else{
    need(this.get<{n:number}>('SELECT count(*) n FROM tombstones')!.n<100000,'BUDGET_EXHAUSTED');
    this.db.prepare('INSERT INTO tombstones VALUES(?,?,?,?,?,?)').run(this.serviceId,c.controlId,digest,c.conversationId,c.questionId,c.suppressionUntil);
   }
   this.db.prepare('DELETE FROM questions WHERE service_id=? AND conversation_id=? AND (? IS NULL OR question_id=?)').run(this.serviceId,c.conversationId,c.questionId,c.questionId);
  });
 }
 /** Local SQLite rows only. Backups/filesystem/provider erasure is not attested here. */
 sweep(now:string):void{this.transaction(()=>{this.db.prepare('DELETE FROM questions WHERE retain_until<=?').run(now);});}
 retireControl(controlId:string):void{this.transaction(()=>{this.db.prepare('DELETE FROM tombstones WHERE service_id=? AND control_id=?').run(this.serviceId,controlId);});}
 close():void{this.db.close();}
}
