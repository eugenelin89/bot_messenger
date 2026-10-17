/** Authored private-storage evidence only. No website, provider or employee executes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AskAnswer, AskAnswerReceipt, AskClaim, AskControlReceipt } from '../contracts/investment/v1/types.js';
import { ContractError, canonicalHash } from '../scripts/investment-contracts/schema.js';
import { questionHash } from '../scripts/investment-contracts/ask.js';
import type { AskBoundaryContext } from '../src/domain/ask/contract.js';
import { Store } from '../src/persistence/store.js';
import { ASK_CONTENT_BYTES, ASK_CONTENT_ROWS, AskContentStore } from '../src/persistence/ask-content-store.js';
import { AskControlJournal } from '../src/control/ask/control-journal.js';
import { AskPrivateContent } from '../src/control/ask/private-content.js';
import { removeEmptyAskContentMigration } from './fixtures/investment/schema.js';

const examples=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const canary='authored-raw-question-canary-908f058d',answerCanary='authored-raw-answer-canary-1baa1e44';
function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-ask-content-'))),hq=join(root,'hq'),raw=join(root,'raw');
 mkdirSync(hq,{mode:0o700});mkdirSync(raw,{mode:0o700});const path=join(hq,'company.sqlite');
 const db=new Store(path),ctx:AskBoundaryContext={scope:structuredClone(examples.AskServiceScope),limits:structuredClone(examples.AskLimits),now:'2026-01-05T21:32:00Z'};
 let journal=new AskControlJournal(db,()=>ctx),content:AskPrivateContent;
 const drain=(controls:AskControlReceipt[]=[])=>{
  for(const list of controls.length?[controls,[]]:[[]]){const intent=journal.prepareSync();journal.acceptPage(intent.operation.input.syncId,{schemaVersion:'1.0',syncId:intent.operation.input.syncId,controls:list,nextCursor:null,checkedAt:ctx.now,validUntil:new Date(Date.parse(ctx.now)+60000).toISOString()});}
 };
 drain();content=new AskPrivateContent(db,raw,[hq],()=>ctx,journal);
 const claim=(id='fixture-question-a',prior:string[]=[],session='fixture-session-a',conversation='fixture-conversation-a'):AskClaim=>{
  const c=structuredClone(examples.AskClaim) as AskClaim;c.question.questionId=id;c.question.sessionId=session;c.question.conversationId=conversation;c.question.priorOwnedQuestionIds=prior;
  c.question.input={...c.question.input,text:canary,context:null,priorQuestionId:prior.at(-1)??null};c.question.questionHash=questionHash(c.question);return c;
 };
 const answer=(c:AskClaim=claim()):AskAnswer=>({...structuredClone(examples.AskAnswer),answerId:'answer-'+c.question.questionId,questionId:c.question.questionId,questionHash:c.question.questionHash,conversationId:c.question.conversationId,text:answerCanary,evidence:[],knowledgeAsOf:null,interpretation:'general_answer'});
 const receipt=(a:AskAnswer):AskAnswerReceipt=>({schemaVersion:'1.0',answerId:a.answerId,questionId:a.questionId,questionHash:a.questionHash,answerDigest:canonicalHash(a),receiptId:'receipt-'+a.answerId,receivedAt:ctx.now,disposition:'accepted'});
 const control=(questionId:string|null=null):AskControlReceipt=>({schemaVersion:'1.0',controlId:questionId?'cancel-one':'delete-chat',conversationId:'fixture-conversation-a',questionId,action:questionId?'cancel':'delete',effectiveAt:ctx.now,purgeBy:ctx.now,suppressionUntil:new Date(Date.parse(ctx.now)+ctx.limits.suppressionRetentionSeconds*1000).toISOString()});
 const sql=(text:string)=>{const p=new DatabaseSync(join(raw,'content.sqlite'));try{p.exec('PRAGMA foreign_keys=ON');p.exec(text);}finally{p.close();}};
 const count=(table:string)=>{const p=new DatabaseSync(join(raw,'content.sqlite'));try{return Number(p.prepare(`SELECT count(*) n FROM ${table}`).get()!.n);}finally{p.close();}};
 return {root,hq,raw,path,db,ctx,claim,answer,receipt,control,drain,sql,count,get journal(){return journal;},get content(){return content;},
  reopen(){content.close();journal=new AskControlJournal(db,()=>ctx);content=new AskPrivateContent(db,raw,[hq],()=>ctx,journal);},
  close(){try{content.close();}finally{db.close();rmSync(root,{recursive:true,force:true});}},
 };
}
function rejects(fn:()=>unknown,code:string){assert.throws(fn,error=>error instanceof ContractError&&error.code===code);}
const owner=(c:AskClaim)=>({sessionId:c.question.sessionId,conversationId:c.question.conversationId,questionId:c.question.questionId});
function deliver(f:ReturnType<typeof fixture>,c=f.claim()){
 f.content.importQuestion(c);const a=f.answer(c);f.content.commitAnswer(c.question.questionId,a);f.content.recordReceipt(f.receipt(a));return a;
}

test('identity-first import is idempotent, mutation-safe, and keeps every raw byte out of Company SQLite/WAL',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),row=f.content.importQuestion(c),again=f.content.importQuestion(c);
 assert.equal(row.content_ref,again.content_ref);assert.equal(row.state,'available');assert.equal(f.count('questions'),1);
 const got=f.content.question(owner(c));got.input.text='changed';assert.equal(f.content.question(owner(c)).input.text,canary);
 deliver(f,c);const tables=f.db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
 for(const {name} of tables){const text=JSON.stringify(f.db.all(`SELECT * FROM "${name}"`));assert.ok(!text.includes(canary)&&!text.includes(answerCanary),name);}
 for(const path of [f.path,f.path+'-wal']){try{const bytes=readFileSync(path);assert.equal(bytes.includes(Buffer.from(canary)),false);assert.equal(bytes.includes(Buffer.from(answerCanary)),false);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}}
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM executions')!.n,0);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
});
test('changed immutable input, owner or question hash conflicts under the same import identity',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);
 for(const change of ['text','owner'] as const){const bad=structuredClone(c);if(change==='text')bad.question.input.text='changed';else bad.question.sessionId='other-session';bad.question.questionHash=questionHash(bad.question);rejects(()=>f.content.importQuestion(bad),'CONFLICT');}
 const bad=structuredClone(c);bad.question.questionHash='0'.repeat(64);rejects(()=>f.content.importQuestion(bad),'CONFLICT');assert.equal(f.count('questions'),1);
});
test('one immutable answer and outbox are committed together; changed retries never replace either',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,a);f.content.commitAnswer(c.question.questionId,a);
 assert.equal(f.count('answers'),1);assert.equal(f.count('outbox'),1);assert.deepEqual(f.content.pendingAnswer(c.question.questionId),{answer:a,state:'pending_authority'});
 rejects(()=>f.content.commitAnswer(c.question.questionId,{...a,text:'changed'}),'CONFLICT');assert.deepEqual(f.content.pendingAnswer(c.question.questionId)!.answer,a);
 f.content.recordReceipt(f.receipt(a));f.content.recordReceipt(f.receipt(a));assert.equal(f.content.pendingAnswer(c.question.questionId),null);
 rejects(()=>f.content.recordReceipt({...f.receipt(a),receiptId:'changed'}),'CONFLICT');
});
test('stored ownership binds every history ID and includes only receipt-confirmed completed turns',t=>{
 const f=fixture();t.after(f.close);const first=f.claim();deliver(f,first);const next=f.claim('follow-up',[first.question.questionId]);f.content.importQuestion(next);
 const history=f.content.history(next.question.questionId);assert.equal(history.turns.length,1);assert.equal(history.turns[0]!.question.input.text,canary);
 rejects(()=>f.content.question({...owner(next),sessionId:'another-session'}),'NOT_FOUND');
 rejects(()=>f.content.question({...owner(next),conversationId:'another-conversation'}),'NOT_FOUND');
 const bad=f.claim('cross-owner',[first.question.questionId],'another-session','another-conversation');rejects(()=>f.content.importQuestion(bad),'NOT_FOUND');
 const own=f.claim('unconfirmed',[],'another-session','another-conversation');f.content.importQuestion(own);f.content.commitAnswer(own.question.questionId,f.answer(own));
 const follows=f.claim('follows-unconfirmed',[own.question.questionId],'another-session','another-conversation');f.content.importQuestion(follows);rejects(()=>f.content.history(follows.question.questionId),'OUTCOME_UNKNOWN');
});
test('Company import reservation survives private insert failure and identical retry preserves deadlines',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.sql("CREATE TRIGGER fail_question BEFORE INSERT ON questions BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.importQuestion(c),'UNAVAILABLE');const reserved=f.content.metadata(c.question.questionId);assert.equal(reserved.state,'content_pending');assert.equal(f.count('questions'),0);
 f.sql('DROP TRIGGER fail_question');f.ctx.now='2026-01-05T21:32:20Z';const complete=f.content.importQuestion(c);
 assert.equal(complete.state,'available');assert.equal(complete.content_ref,reserved.content_ref);assert.equal(complete.retain_until,reserved.retain_until);
});
test('private import commit before Company completion reconciles on restart without inserting another body',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.db.db.exec("CREATE TEMP TRIGGER fail_available BEFORE UPDATE ON ask_imports WHEN NEW.state='available' BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.importQuestion(c),'UNAVAILABLE');assert.equal(f.count('questions'),1);assert.equal(f.content.metadata(c.question.questionId).state,'content_pending');
 f.db.db.exec('DROP TRIGGER fail_available');f.reopen();const result=f.content.reconcile();assert.equal(result[0]!.state,'available');assert.equal(f.count('questions'),1);
});
for(const target of ['answers','outbox'])test(`private ${target} failure leaves one answer reservation and no partial answer/outbox`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);
 f.sql(`CREATE TRIGGER fail_answer BEFORE INSERT ON ${target} BEGIN SELECT RAISE(ABORT,'authored fault'); END`);
 rejects(()=>f.content.commitAnswer(c.question.questionId,a),'UNAVAILABLE');assert.equal(f.count('answers'),0);assert.equal(f.count('outbox'),0);
 assert.equal(f.content.reconcile()[0]!.state,'answer_reserved');rejects(()=>f.content.pendingAnswer(c.question.questionId),'OUTCOME_UNKNOWN');
 f.sql('DROP TRIGGER fail_answer');rejects(()=>f.content.commitAnswer(c.question.questionId,{...a,text:'regenerated'}),'CONFLICT');
 f.content.commitAnswer(c.question.questionId,a);assert.equal(f.count('answers'),1);assert.equal(f.count('outbox'),1);
});
test('private answer/outbox commit before projection failure reconciles exact existing bytes on restart',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);
 f.db.db.exec("CREATE TEMP TRIGGER fail_staged BEFORE UPDATE ON ask_imports WHEN NEW.state='answer_staged' BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.commitAnswer(c.question.questionId,a),'UNAVAILABLE');assert.equal(f.count('answers'),1);assert.equal(f.count('outbox'),1);assert.equal(f.content.metadata(c.question.questionId).state,'answer_reserved');
 f.db.db.exec('DROP TRIGGER fail_staged');f.reopen();assert.equal(f.content.reconcile()[0]!.state,'answer_staged');f.drain();assert.deepEqual(f.content.pendingAnswer(c.question.questionId)!.answer,a);
});
for(const damage of ['missing_question','corrupt_question','missing_outbox'])test(`${damage} after availability becomes a durable hold and cannot recreate content`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);
 if(damage==='missing_outbox'){f.content.commitAnswer(c.question.questionId,f.answer(c));f.sql('DELETE FROM outbox');}
 else if(damage==='missing_question')f.sql('DELETE FROM questions');else f.sql("UPDATE questions SET payload=json_set(payload,'$.input.text','corrupt')");
 rejects(()=>f.content.reconcile(),'OUTCOME_UNKNOWN');assert.equal(f.content.metadata(c.question.questionId).state,'held');
 rejects(()=>f.content.importQuestion(c),'WITHDRAWN');assert.equal(f.count('questions'),0);
});
test('already-ACKed deletion controls suppress late imports and leave no fresh body',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.drain([f.control()]);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM ask_privacy_controls WHERE acknowledged_at IS NOT NULL')!.n,1);
 f.content.maintenance();rejects(()=>f.content.importQuestion(c),'WITHDRAWN');assert.equal(f.count('questions'),0);assert.equal(f.count('tombstones'),1);
 assert.deepEqual(f.content.maintenance(),{contentPurgeVerified:false,restorationVerified:false});
});
test('suppression after staging deletes local bodies/outbox but preserves minimal late-receipt identity',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,a);f.drain([f.control()]);f.content.maintenance();
 assert.equal(f.content.metadata(c.question.questionId).state,'suppressed');for(const table of ['questions','answers','outbox'])assert.equal(f.count(table),0);
 const bytes=readFileSync(join(f.raw,'content.sqlite'));assert.equal(bytes.includes(Buffer.from(canary)),false);assert.equal(bytes.includes(Buffer.from(answerCanary)),false);
 assert.equal(f.content.receiptIdentity(c.question.questionId)!.answerDigest,canonicalHash(a));f.content.recordReceipt(f.receipt(a));assert.equal(f.content.metadata(c.question.questionId).state,'suppressed');
 rejects(()=>f.content.pendingAnswer(c.question.questionId),'WITHDRAWN');assert.equal(f.count('questions'),0);
});
for(const phase of ['reserved','private_committed'])test(`deletion between ${phase} import and finalization cannot resurrect content`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim();
 if(phase==='reserved')f.sql("CREATE TRIGGER stop_import BEFORE INSERT ON questions BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 else f.db.db.exec("CREATE TEMP TRIGGER stop_import BEFORE UPDATE ON ask_imports WHEN NEW.state='available' BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.importQuestion(c),'UNAVAILABLE');
 if(phase==='reserved')f.sql('DROP TRIGGER stop_import');else f.db.db.exec('DROP TRIGGER stop_import');
 f.drain([f.control()]);f.content.reconcile();assert.equal(f.content.metadata(c.question.questionId).state,'suppressed');assert.equal(f.count('questions'),0);rejects(()=>f.content.importQuestion(c),'WITHDRAWN');
});
test('queue expiry and expired scope require no new traffic or active grant to purge uncompleted content',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,f.answer(c));
 f.ctx.now='2026-01-06T00:01:00Z';f.content.maintenance();assert.equal(f.content.metadata(c.question.questionId).state,'expired');assert.equal(f.count('questions'),0);assert.ok(f.content.receiptIdentity(c.question.questionId));
});
test('delivered history survives queue expiry, then original raw retention removes bodies without erasing identity',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);const retained=f.content.metadata(c.question.questionId).retain_until;
 f.ctx.now='2026-01-06T00:01:00Z';f.content.maintenance();assert.equal(f.count('questions'),1);assert.equal(f.content.metadata(c.question.questionId).retain_until,retained);
 f.ctx.now=retained;f.content.maintenance();assert.equal(f.count('questions'),0);assert.ok(f.content.receiptIdentity(c.question.questionId));
});
test('tighter raw retention after restart shortens an original deadline; no retry extends it',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);f.ctx.limits.rawRetentionSeconds=86400;f.reopen();f.content.maintenance();
 assert.equal(f.content.metadata(c.question.questionId).retain_until,'2026-01-06T21:30:00.000Z');f.ctx.now='2026-01-06T21:30:00.000Z';f.content.maintenance();assert.equal(f.count('questions'),0);
});
test('metadata alone never grants access under a stale barrier; nested Company transactions are rejected',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();rejects(()=>f.db.transaction(()=>f.content.importQuestion(c)),'CONFLICT');assert.equal(f.count('questions'),0);
 f.content.importQuestion(c);f.ctx.now='2026-01-05T21:33:00Z';rejects(()=>f.content.question(owner(c)),'FORBIDDEN');assert.equal(f.count('questions'),1);
});
test('clock rollback and old instances are fenced, including durable restart',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);const old=f.content;
 const next=new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,f.journal);t.after(()=>next.close());rejects(()=>old.metadata(c.question.questionId),'CONFLICT');
 f.ctx.now='2026-01-05T21:31:00Z';rejects(()=>next.maintenance(),'CONFLICT');rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,f.journal),'CONFLICT');
});
test('pending Company reservations count toward capacity even without private bodies',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.sql("CREATE TRIGGER stop_import BEFORE INSERT ON questions BEGIN SELECT RAISE(ABORT,'authored fault'); END");rejects(()=>f.content.importQuestion(c),'UNAVAILABLE');
 const row=f.content.metadata(c.question.questionId);f.db.transaction(()=>{for(let n=1;n<ASK_CONTENT_ROWS;n++)f.db.run("INSERT INTO ask_imports SELECT service_id,?,session_id,conversation_id,question_hash,question_digest,?,received_at,expires_at,retain_until,metadata_until,state,answer_id,answer_digest,answer_generated_at,receipt,receipt_hash,updated_at FROM ask_imports WHERE question_id=?",'reserved-'+n,'opaque-'+n,row.question_id);});
 f.sql('DROP TRIGGER stop_import');rejects(()=>f.content.importQuestion(f.claim('new-question')),'BUDGET_EXHAUSTED');assert.equal(f.count('questions'),0);
});
test('private path must stay outside Company and every explicitly configured backup root',t=>{
 const f=fixture();t.after(f.close);const inside=join(f.hq,'raw');mkdirSync(inside,{mode:0o700});
 rejects(()=>new AskPrivateContent(f.db,inside,[f.hq],()=>f.ctx,f.journal),'FORBIDDEN');
 rejects(()=>new AskPrivateContent(f.db,f.raw,[f.root],()=>f.ctx,f.journal),'FORBIDDEN');rejects(()=>new AskPrivateContent(f.db,f.raw,[],()=>f.ctx,f.journal),'FORBIDDEN');
 chmodSync(f.raw,0o755);rejects(()=>f.content.maintenance(),'FORBIDDEN');chmodSync(f.raw,0o700);
});
for(const damage of ['symlink','hardlink','replacement'])test(`private ${damage} custody change is denied`,t=>{
 const f=fixture();t.after(f.close);const path=join(f.raw,'content.sqlite'),saved=join(f.root,'original.sqlite');
 if(damage==='hardlink'){linkSync(path,saved);rejects(()=>f.content.maintenance(),'FORBIDDEN');rmSync(saved);}
 else{renameSync(path,saved);if(damage==='symlink')symlinkSync(saved,path);else copyFileSync(saved,path);rejects(()=>f.content.maintenance(),damage==='symlink'?'FORBIDDEN':'CONFLICT');rmSync(path);renameSync(saved,path);}
});
test('a missing or mismatched private store cannot be silently replaced after Company binding',t=>{
 const f=fixture();t.after(f.close);const other=fixture();t.after(other.close);const path=join(f.raw,'content.sqlite'),saved=join(f.root,'saved.sqlite');renameSync(path,saved);
 rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,f.journal),'OUTCOME_UNKNOWN');copyFileSync(join(other.raw,'content.sqlite'),path);
 rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,f.journal),'CONFLICT');rmSync(path);renameSync(saved,path);
});
test('a journal for a different service cannot supply privacy controls or freshness',t=>{
 const f=fixture();t.after(f.close);const ctx=structuredClone(f.ctx);ctx.scope.serviceId='other-service';const journal=new AskControlJournal(f.db,()=>ctx);
 rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,journal),'CONFLICT');
});
test('schema26 upgrades preserve every prior row across repeated opens and seed no authority or content',t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'botsquad-ask-migration-'))),path=join(root,'company.sqlite');t.after(()=>rmSync(root,{recursive:true,force:true}));
 const first=new Store(path);first.run("INSERT INTO settings VALUES('preservation-fixture','retained')");
 const ctx:AskBoundaryContext={scope:structuredClone(examples.AskServiceScope),limits:structuredClone(examples.AskLimits),now:'2026-01-05T21:32:00Z'},journal=new AskControlJournal(first,()=>ctx);
 for(const controls of [[structuredClone(examples.AskControlReceipt)],[]]){const intent=journal.prepareSync();journal.acceptPage(intent.operation.input.syncId,{schemaVersion:'1.0',syncId:intent.operation.input.syncId,controls,nextCursor:null,checkedAt:ctx.now,validUntil:'2026-01-05T21:33:00Z'});}
 removeEmptyAskContentMigration(first.db);
 const tables=first.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'schema_migrations'").map(x=>x.name);
 const before=Object.fromEntries(tables.map(name=>[name,first.all(`SELECT rowid,* FROM "${name}" ORDER BY rowid`)]));first.close();
 for(let pass=0;pass<3;pass++){const db=new Store(path);try{for(const name of tables)assert.deepEqual(db.all(`SELECT rowid,* FROM "${name}" ORDER BY rowid`),before[name],name);
  for(const name of ['ask_content_services','ask_imports','ask_content_controls'])assert.equal(db.get<{n:number}>(`SELECT count(*) n FROM ${name}`)!.n,0);
  assert.equal(db.get<{n:number}>('SELECT max(version) n FROM schema_migrations')!.n,32);assert.deepEqual(db.all('PRAGMA foreign_key_check'),[]);
 }finally{db.close();}}
});

for(const disposition of ['discarded_cancelled','discarded_deleted','discarded_expired','withheld_evidence'] as const)test(`${disposition} receipt purges before any control page and prevents late answer resurrection`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,a);
 const receipt={...f.receipt(a),disposition};f.content.recordReceipt(receipt);f.content.recordReceipt(receipt);
 assert.equal(f.content.metadata(c.question.questionId).state,disposition==='discarded_expired'?'expired':'suppressed');
 for(const table of ['questions','answers','outbox'])assert.equal(f.count(table),0);
 rejects(()=>f.content.question(owner(c)),'WITHDRAWN');rejects(()=>f.content.commitAnswer(c.question.questionId,a),'WITHDRAWN');
 f.reopen();f.content.maintenance();assert.equal(f.count('questions'),0);assert.ok(f.content.receiptIdentity(c.question.questionId));
});
test('a terminal receipt after an interrupted answer reservation never permits an identical late body',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);
 f.sql("CREATE TRIGGER stop_answer BEFORE INSERT ON answers BEGIN SELECT RAISE(ABORT,'authored fault'); END");rejects(()=>f.content.commitAnswer(c.question.questionId,a),'UNAVAILABLE');f.sql('DROP TRIGGER stop_answer');
 f.content.recordReceipt({...f.receipt(a),disposition:'discarded_deleted'});assert.equal(f.count('questions'),0);
 rejects(()=>f.content.commitAnswer(c.question.questionId,a),'WITHDRAWN');assert.equal(f.count('answers'),0);
});
test('a receipted private outbox with no Company receipt is a durable rollback hold',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,f.answer(c));f.sql("UPDATE outbox SET state='receipted'");
 rejects(()=>f.content.pendingAnswer(c.question.questionId),'OUTCOME_UNKNOWN');assert.equal(f.content.metadata(c.question.questionId).state,'held');f.reopen();rejects(()=>f.content.pendingAnswer(c.question.questionId),'FORBIDDEN');
 f.drain();rejects(()=>f.content.pendingAnswer(c.question.questionId),'WITHDRAWN');
});
test('privacy controls purge raw bytes while preserving uncertain holds beyond metadata pruning',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);f.sql("UPDATE questions SET payload=json_set(payload,'$.input.text','corrupt')");rejects(()=>f.content.reconcile(),'OUTCOME_UNKNOWN');
 f.drain([f.control()]);f.content.maintenance();assert.equal(f.content.metadata(c.question.questionId).state,'held');assert.equal(f.count('questions'),0);
 f.ctx.now=new Date(Date.parse(f.content.metadata(c.question.questionId).metadata_until)+300000).toISOString();rejects(()=>f.content.pruneMetadata(),'OUTCOME_UNKNOWN');assert.equal(f.content.metadata(c.question.questionId).state,'held');
});
test('expired reconciled metadata and ACKed controls retire without allowing replay of an expired claim',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);f.drain([f.control()]);f.content.maintenance();
 f.ctx.now=new Date(Date.parse(f.content.metadata(c.question.questionId).metadata_until)+300000).toISOString();assert.deepEqual(f.content.pruneMetadata(),{imports:1,controls:1});
 assert.equal(f.count('tombstones'),0);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM ask_imports')!.n,0);rejects(()=>f.content.importQuestion(c),'FORBIDDEN');
});
test('orphan content holds service admission durably but cannot block privacy or expiry cleanup',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);const retain=f.content.metadata(c.question.questionId).retain_until;f.db.run('DELETE FROM ask_imports WHERE question_id=?',c.question.questionId);
 rejects(()=>f.content.maintenance(),'OUTCOME_UNKNOWN');assert.equal(f.count('questions'),1);assert.equal(f.db.get<{custody_held:number}>('SELECT custody_held FROM ask_content_services')!.custody_held,1);
 f.ctx.now=retain;rejects(()=>f.content.maintenance(),'OUTCOME_UNKNOWN');assert.equal(f.count('questions'),0);f.reopen();rejects(()=>f.content.maintenance(),'OUTCOME_UNKNOWN');
});
for(const change of ['disabled','tighter_limits'] as const)test(`live ${change} does not block cleanup or inherit an earlier admission barrier`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);
 if(change==='disabled')f.ctx.scope.enabled=false;else f.ctx.limits.rawRetentionSeconds=86400;
 rejects(()=>f.content.question(owner(c)),change==='disabled'?'FORBIDDEN':'CONFLICT');f.ctx.now='2026-01-13T00:00:00Z';f.content.maintenance();assert.equal(f.count('questions'),0);
});
test('a same-service journal from another Company cannot substitute empty controls or freshness',t=>{
 const f=fixture();t.after(f.close);const other=fixture();t.after(other.close);f.drain([f.control()]);
 rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,other.journal),'CONFLICT');assert.equal(f.count('questions'),0);
});
for(const suffix of ['-journal','-wal','-shm'])test(`dangling ${suffix} symlink is denied before private database access`,t=>{
 const f=fixture();t.after(f.close);const path=join(f.raw,'content.sqlite')+suffix;symlinkSync(join(f.root,'missing'),path);
 rejects(()=>f.content.maintenance(),'FORBIDDEN');rejects(()=>new AskPrivateContent(f.db,f.raw,[f.hq],()=>f.ctx,f.journal),'FORBIDDEN');rmSync(path);
});
test('private capacity counts UTF-8 question and answer bytes and leaves no partial outbox',t=>{
 const f=fixture();t.after(f.close);const raw=new AskContentStore(f.raw,f.ctx.scope.serviceId,[f.hq],true);t.after(()=>raw.close());let stopped=false;
 for(let n=0;n<ASK_CONTENT_ROWS;n++){
  const c=f.claim('byte-cap-'+n);c.question.input.text='😀'.repeat(2000);c.question.questionHash=questionHash(c.question);const a=f.answer(c);a.text='😀'.repeat(4000);
  try{raw.insertQuestion('ref-'+n,c.question,'2026-01-12T21:30:00.000Z');raw.insertAnswer('ref-'+n,c.question,a);}catch(error){assert.ok(error instanceof ContractError&&error.code==='BUDGET_EXHAUSTED');stopped=true;break;}
 }
 assert.equal(stopped,true);const db=new DatabaseSync(join(f.raw,'content.sqlite'));try{
  const bytes=db.prepare('SELECT (SELECT coalesce(sum(length(CAST(payload AS BLOB))),0) FROM questions)+(SELECT coalesce(sum(length(CAST(payload AS BLOB))),0) FROM answers) n').get()!.n as number;
  assert.ok(bytes<=ASK_CONTENT_BYTES&&bytes>ASK_CONTENT_BYTES-40000);assert.equal(f.count('answers'),f.count('outbox'));
 }finally{db.close();}
});

// Kill only a disposable child after an actual committed boundary; no production hooks.
for(const phase of ['question_reserved','question_private','answer_reserved','answer_private','receipt_committed','discard_committed','control_private'] as const)test(`SIGKILL at ${phase} preserves exact durable state across restart`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);
 if(!phase.startsWith('question'))f.content.importQuestion(c);
 if(['receipt_committed','discard_committed','control_private'].includes(phase))f.content.commitAnswer(c.question.questionId,a);
 if(phase==='control_private')f.drain([f.control()]);
 const script=`
 import {readFileSync} from 'node:fs';
 import {Store} from ${JSON.stringify(new URL('../src/persistence/store.js',import.meta.url).href)};
 import {AskContentStore} from ${JSON.stringify(new URL('../src/persistence/ask-content-store.js',import.meta.url).href)};
 import {AskPrivateContent} from ${JSON.stringify(new URL('../src/control/ask/private-content.js',import.meta.url).href)};
 import {AskControlJournal} from ${JSON.stringify(new URL('../src/control/ask/control-journal.js',import.meta.url).href)};
 const {path,raw,hq,ctx,claim,answer,receipt,phase}=JSON.parse(readFileSync(0,'utf8'));
 const db=new Store(path),journal=new AskControlJournal(db,()=>ctx),content=new AskPrivateContent(db,raw,[hq],()=>ctx,journal);
 const intent=journal.prepareSync();journal.acceptPage(intent.operation.input.syncId,{schemaVersion:'1.0',syncId:intent.operation.input.syncId,controls:[],nextCursor:null,checkedAt:ctx.now,validUntil:new Date(Date.parse(ctx.now)+60000).toISOString()});
 const kill=()=>process.kill(process.pid,'SIGKILL');
 const method=phase.startsWith('question')?'insertQuestion':phase.startsWith('answer')?'insertAnswer':phase==='control_private'?'control':null;
 if(method){const original=AskContentStore.prototype[method];AskContentStore.prototype[method]=function(...args){if(phase.endsWith('_reserved'))kill();const value=original.apply(this,args);kill();return value;};}
 else {const original=db.transaction.bind(db);db.transaction=function(fn){const result=original(fn);if(db.get('SELECT receipt FROM ask_imports WHERE question_id=?',claim.question.questionId)?.receipt)kill();return result;};}
 if(phase.startsWith('question'))content.importQuestion(claim);
 else if(phase.startsWith('answer'))content.commitAnswer(claim.question.questionId,answer);
 else if(phase==='control_private')content.maintenance();
 else content.recordReceipt(receipt);
 throw new Error('crash checkpoint not reached');`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',script],{input:JSON.stringify({path:f.path,raw:f.raw,hq:f.hq,ctx:f.ctx,claim:c,answer:a,receipt:{...f.receipt(a),disposition:phase==='discard_committed'?'discarded_deleted':'accepted'},phase}),encoding:'utf8',timeout:15000});
 assert.equal(result.signal,'SIGKILL',result.stderr);assert.equal(result.stdout,'');f.reopen();f.content.maintenance();
 if(phase==='discard_committed'||phase==='control_private'){assert.equal(f.count('questions'),0);assert.equal(f.content.metadata(c.question.questionId).state,'suppressed');}
 else{
  const row=f.content.reconcile()[0]!;const expected={question_reserved:'content_pending',question_private:'available',answer_reserved:'answer_reserved',answer_private:'answer_staged',receipt_committed:'delivered'}[phase];assert.equal(row.state,expected);
  assert.equal(f.count('questions'),phase==='question_reserved'?0:1);assert.equal(f.count('answers'),['answer_private','receipt_committed'].includes(phase)?1:0);assert.equal(f.count('answers'),f.count('outbox'));
 }
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM executions')!.n,0);
});

for(const damage of ['missing_outbox','receipt_rollback'] as const)test(`expiry still preserves uncertainty from ${damage} while purging raw bytes`,t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,f.answer(c));
 f.sql(damage==='missing_outbox'?'DELETE FROM outbox':"UPDATE outbox SET state='receipted'");f.ctx.now='2026-01-06T00:01:00Z';
 rejects(()=>f.content.maintenance(),'OUTCOME_UNKNOWN');assert.equal(f.content.metadata(c.question.questionId).state,'held');assert.equal(f.count('questions'),0);
 f.ctx.now=new Date(Date.parse(f.content.metadata(c.question.questionId).metadata_until)+300000).toISOString();rejects(()=>f.content.pruneMetadata(),'OUTCOME_UNKNOWN');
});

test('identical discard receipt retry finishes a failed private purge',t=>{
 const f=fixture();t.after(f.close);const c=f.claim(),a=f.answer(c);f.content.importQuestion(c);f.content.commitAnswer(c.question.questionId,a);
 const receipt={...f.receipt(a),disposition:'discarded_deleted' as const};f.sql("CREATE TRIGGER stop_purge BEFORE DELETE ON questions BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.recordReceipt(receipt),'UNAVAILABLE');assert.ok(f.content.metadata(c.question.questionId).receipt);assert.equal(f.count('questions'),1);
 f.sql('DROP TRIGGER stop_purge');f.content.recordReceipt(receipt);assert.equal(f.count('questions'),0);assert.equal(f.count('answers'),0);assert.equal(f.count('outbox'),0);
});
test('deadline shortening interrupted between stores resumes without extending or losing the identity',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);f.ctx.limits.rawRetentionSeconds=86400;
 f.sql("CREATE TRIGGER stop_shorten BEFORE UPDATE OF retain_until ON questions BEGIN SELECT RAISE(ABORT,'authored fault'); END");
 rejects(()=>f.content.maintenance(),'UNAVAILABLE');assert.equal(f.content.metadata(c.question.questionId).retain_until,'2026-01-06T21:30:00.000Z');
 f.sql('DROP TRIGGER stop_shorten');f.reopen();f.content.maintenance();assert.equal(f.content.metadata(c.question.questionId).state,'delivered');
 f.ctx.now='2026-01-06T21:30:00.000Z';f.content.maintenance();assert.equal(f.count('questions'),0);
});

test('corrupt minimal receipt is held without blocking raw purge or unrelated expiry',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();deliver(f,c);const other=f.claim('unrelated-expiring');f.content.importQuestion(other);
 f.db.db.exec('DROP TRIGGER ask_import_identity');f.db.run("UPDATE ask_imports SET receipt_hash=? WHERE question_id=?",'0'.repeat(64),c.question.questionId);
 f.ctx.now='2026-01-06T00:01:00Z';rejects(()=>f.content.maintenance(),'OUTCOME_UNKNOWN');
 assert.equal(f.content.metadata(c.question.questionId).state,'held');assert.equal(f.content.metadata(other.question.questionId).state,'expired');assert.equal(f.count('questions'),0);
 assert.equal(f.content.reconcile().find(row=>row.question_id===c.question.questionId)!.state,'held');assert.ok(f.content.metadata(c.question.questionId).receipt);
});
test('a separately supplied content clock cannot use an older journal freshness window',t=>{
 const f=fixture();t.after(f.close);const c=f.claim();f.content.importQuestion(c);const later=structuredClone(f.ctx);
 const content=new AskPrivateContent(f.db,f.raw,[f.hq],()=>later,f.journal);t.after(()=>content.close());later.now='2026-01-05T21:33:00Z';
 rejects(()=>content.question(owner(c)),'FORBIDDEN');assert.equal(f.count('questions'),1);
});

test('same Company services isolate identical question, conversation, answer and control IDs',t=>{
 const f=fixture();t.after(f.close);const raw=join(f.root,'raw-other');mkdirSync(raw,{mode:0o700});
 const ctx=structuredClone(f.ctx);ctx.scope.serviceId='other-service';ctx.scope.keyId='other-key';
 const journal=new AskControlJournal(f.db,()=>ctx);
 const sync=(controls:AskControlReceipt[]=[])=>{for(const page of controls.length?[controls,[]]:[[]]){const intent=journal.prepareSync();journal.acceptPage(intent.operation.input.syncId,{schemaVersion:'1.0',syncId:intent.operation.input.syncId,controls:page,nextCursor:null,checkedAt:ctx.now,validUntil:'2026-01-05T21:33:00Z'});}};
 sync();const content=new AskPrivateContent(f.db,raw,[f.hq],()=>ctx,journal);t.after(()=>content.close());
 const a=f.claim(),b=f.claim();b.serviceId=ctx.scope.serviceId;b.question.serviceId=ctx.scope.serviceId;b.question.questionHash=questionHash(b.question);
 const answerA=f.answer(a),answerB={...f.answer(b),serviceId:ctx.scope.serviceId};
 f.content.importQuestion(a);f.content.commitAnswer(a.question.questionId,answerA);content.importQuestion(b);content.commitAnswer(b.question.questionId,answerB);
 const before=content.metadata(b.question.questionId);assert.equal(before.answer_id,f.content.metadata(a.question.questionId).answer_id);
 f.drain([f.control()]);f.content.maintenance();assert.equal(f.count('questions'),0);assert.equal(f.content.metadata(a.question.questionId).state,'suppressed');
 assert.deepEqual(content.metadata(b.question.questionId),before);assert.deepEqual(content.question(owner(b)),b.question);assert.deepEqual(content.pendingAnswer(b.question.questionId),{answer:answerB,state:'pending_authority'});
 sync([f.control()]);content.maintenance();assert.equal(content.metadata(b.question.questionId).state,'suppressed');
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM ask_content_controls WHERE control_id=?',f.control().controlId)!.n,2);assert.equal(f.content.metadata(a.question.questionId).state,'suppressed');
});
