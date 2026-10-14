import type {DatabaseSync} from 'node:sqlite';

/** Metadata only; migration creates no service, grant, question or model work. */
export function migrateAskExecutions(db:DatabaseSync):void {
 db.exec(`CREATE TABLE ask_dispatches (
  execution_id TEXT PRIMARY KEY, service_id TEXT NOT NULL, question_id TEXT NOT NULL,
  worker_id TEXT NOT NULL REFERENCES workers, public_worker_id TEXT NOT NULL,
  grant_id TEXT NOT NULL, reservation_digest TEXT NOT NULL, context_digest TEXT NOT NULL,
  route TEXT NOT NULL CHECK(json_valid(route)), evidence_refs TEXT NOT NULL CHECK(json_valid(evidence_refs)), generation TEXT NOT NULL,
  created_at TEXT NOT NULL, deadline TEXT NOT NULL, duty_until TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('reserved','running','completed','failed','unknown','suppressed')),
  unresolved INTEGER NOT NULL CHECK(unresolved IN (0,1)),
  UNIQUE(service_id,question_id)
 );
 CREATE TABLE ask_service_holds (
  service_id TEXT PRIMARY KEY, reason TEXT NOT NULL CHECK(reason IN ('custody_mismatch','content_reconciliation')),
  worker_ids TEXT NOT NULL CHECK(json_valid(worker_ids)), unresolved INTEGER NOT NULL CHECK(unresolved IN (0,1)),created_at TEXT NOT NULL
 );`);
 // Rebuild only the execution discriminator. Preserve every incoming FK, column,
 // rowid, index and trigger, including guards introduced after schema 7.
 const triggers=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all() as {name:string;sql:string}[];
 for(const t of triggers)db.exec(`DROP TRIGGER "${t.name}"`);
 const original=(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='executions'").get() as {sql:string}).sql;
 const indexes=db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='executions' AND sql IS NOT NULL").all() as {sql:string}[];
 const old="origin IN ('task','conversation')";
 const end="OR (origin='conversation' AND task_id IS NULL AND request_id IS NOT NULL AND session_id IS NOT NULL AND generation>0)";
 if(!original.includes(old)||!original.includes(end))throw Error('Unexpected execution ownership schema');
 db.exec(original.replace(/CREATE TABLE ["']?executions["']?/, 'CREATE TABLE executions_ask_next')
  .replace(old,"origin IN ('task','conversation','public_question')")
  .replace(end,end+" OR (origin='public_question' AND task_id IS NULL AND request_id IS NULL AND session_id IS NULL AND generation IS NULL)"));
 const columns=(db.prepare('PRAGMA table_info(executions)').all() as {name:string}[]).map(c=>c.name).join(',');
 db.exec(`INSERT INTO executions_ask_next(rowid,${columns}) SELECT rowid,* FROM executions;
  DROP TABLE executions; ALTER TABLE executions_ask_next RENAME TO executions;`);
 for(const i of indexes)db.exec(i.sql);
 for(const t of triggers)db.exec(t.name==='client_audit_event'
  ?t.sql.replace("origin='conversation'","origin IN ('conversation','public_question')") : t.sql);
 db.exec(`CREATE TRIGGER execution_ask_owner BEFORE INSERT ON executions
  WHEN NEW.origin='public_question' AND NOT EXISTS (
   SELECT 1 FROM ask_dispatches a JOIN ask_imports i USING(service_id,question_id) JOIN ask_content_services c ON c.service_id=a.service_id
   WHERE a.execution_id=NEW.execution_id AND a.worker_id=NEW.worker_id
    AND a.state='reserved' AND i.state='available' AND a.generation=c.generation AND c.custody_held=0)
  BEGIN SELECT RAISE(ABORT,'Invalid public question execution owner'); END;
 CREATE UNIQUE INDEX one_ask_execution ON executions(origin) WHERE origin='public_question' AND status='running';
 CREATE TRIGGER ask_dispatch_identity BEFORE UPDATE ON ask_dispatches
  WHEN NEW.execution_id<>OLD.execution_id OR NEW.service_id<>OLD.service_id OR NEW.question_id<>OLD.question_id
   OR NEW.worker_id<>OLD.worker_id OR NEW.public_worker_id<>OLD.public_worker_id OR NEW.grant_id<>OLD.grant_id
   OR NEW.reservation_digest<>OLD.reservation_digest OR NEW.context_digest<>OLD.context_digest
   OR NEW.route<>OLD.route OR NEW.evidence_refs<>OLD.evidence_refs OR NEW.generation<>OLD.generation OR NEW.created_at<>OLD.created_at OR NEW.deadline<>OLD.deadline OR NEW.duty_until<>OLD.duty_until
   OR (OLD.state='unknown' AND NEW.state<>'unknown')
  BEGIN SELECT RAISE(ABORT,'Public question execution identity immutable'); END;
 CREATE TRIGGER ask_dispatch_retained BEFORE DELETE ON ask_dispatches
  BEGIN SELECT RAISE(ABORT,'Public question execution retained'); END;`);
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Ask migration foreign-key mismatch');
}
