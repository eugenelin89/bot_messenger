import type {DatabaseSync} from 'node:sqlite';

/** Research identities are not simulator portfolios. Migration creates no authority or work. */
export function migratePrivateResearch(db:DatabaseSync) {
 db.exec(`
 CREATE TABLE investment_run_identities(run_id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('paper','private_research')));
 INSERT INTO investment_run_identities SELECT run_id,'paper' FROM investment_runs;
 CREATE TRIGGER investment_run_identity AFTER INSERT ON investment_runs BEGIN INSERT INTO investment_run_identities VALUES(NEW.run_id,'paper'); END;
 CREATE TRIGGER investment_run_identity_immutable BEFORE UPDATE ON investment_run_identities BEGIN SELECT RAISE(ABORT,'Run identity immutable'); END;
 CREATE TRIGGER investment_run_identity_retained BEFORE DELETE ON investment_run_identities BEGIN SELECT RAISE(ABORT,'Run identity retained'); END;
 `);
 // Retain incoming FKs, every legacy column and rowid. Foreign keys are disabled by Store
 // only around the migration transaction; restore/check them before returning to callers.
 const triggers=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all() as {name:string;sql:string}[];
 for(const t of triggers)db.exec(`DROP TRIGGER "${t.name}"`);
 for(const name of ['investment_team_scopes','investment_activity_invocations','ai_usage']) {
  const sql=(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name) as {sql:string}).sql;
  const indexes=db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(name) as {sql:string}[];
  db.exec(sql.replace(new RegExp(`CREATE TABLE ["']?${name}["']?`),`CREATE TABLE ${name}_research_next`).replaceAll('REFERENCES investment_runs','REFERENCES investment_run_identities'));
  db.exec(`INSERT INTO ${name}_research_next(rowid,${(db.prepare(`PRAGMA table_info(${name})`).all() as {name:string}[]).map(c=>c.name).join(',')}) SELECT rowid,* FROM ${name}; DROP TABLE ${name}; ALTER TABLE ${name}_research_next RENAME TO ${name};`);
  for(const index of indexes)db.exec(index.sql);
 }
 for(const t of triggers)db.exec(t.sql);
 db.exec(`
 CREATE TABLE private_research_previews(preview_id TEXT PRIMARY KEY,digest TEXT NOT NULL,input TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL);
 CREATE TABLE private_research_runs(run_id TEXT PRIMARY KEY REFERENCES investment_run_identities,preview_id TEXT NOT NULL UNIQUE REFERENCES private_research_previews,configuration TEXT NOT NULL,digest TEXT NOT NULL,collection_approved INTEGER NOT NULL CHECK(collection_approved IN (0,1)),processing_approved INTEGER NOT NULL CHECK(processing_approved IN (0,1)),created_at TEXT NOT NULL,expires_at TEXT NOT NULL,retain_until TEXT NOT NULL);
 CREATE TABLE private_research_receipts(receipt_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE private_research_evidence(evidence_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES private_research_runs,observation_id TEXT NOT NULL,observation_hash TEXT NOT NULL,request_key TEXT NOT NULL,revision INTEGER NOT NULL,predecessor_id TEXT,content TEXT NOT NULL,content_hash TEXT NOT NULL,retrieved_at TEXT NOT NULL,normalized_at TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(run_id,observation_id),UNIQUE(run_id,request_key,revision));
 CREATE TABLE private_research_deliveries(delivery_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES private_research_runs,evidence_id TEXT NOT NULL REFERENCES private_research_evidence,worker_id TEXT NOT NULL REFERENCES workers,execution_id TEXT NOT NULL REFERENCES executions,content_hash TEXT NOT NULL,delivered_at TEXT NOT NULL,UNIQUE(execution_id,evidence_id));
 CREATE TABLE private_research_host_claims(run_id TEXT PRIMARY KEY REFERENCES private_research_runs,host_hash TEXT NOT NULL,verified_at TEXT NOT NULL);
 CREATE TABLE private_research_purges(run_id TEXT PRIMARY KEY REFERENCES private_research_runs,purged_at TEXT NOT NULL);
 CREATE TABLE private_research_cleanup(run_id TEXT PRIMARY KEY REFERENCES private_research_runs,group_id TEXT NOT NULL UNIQUE REFERENCES working_groups,expired_at TEXT NOT NULL);
 ${['private_research_previews','private_research_runs','private_research_receipts','private_research_evidence','private_research_deliveries','private_research_cleanup','private_research_purges','private_research_host_claims'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Research record immutable'); END; CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Research record retained'); END;`).join('\n')}
 `);
 // Only the scoped trusted retention transaction can redact content; immutable
 // identities and accounting remain. Ordinary SQL/API writes still hit old guards.
 const groups:Record<string,string>={
  conversation_messages:'SELECT group_id FROM working_groups WHERE conversation_id=OLD.conversation_id',
  conversation_notes:'SELECT group_id FROM working_groups WHERE conversation_id=OLD.conversation_id',
  conversation_sessions:'SELECT group_id FROM working_groups WHERE conversation_id=OLD.conversation_id',
  conversation_requests:'SELECT group_id FROM working_groups WHERE conversation_id=OLD.conversation_id',
  working_groups:'SELECT OLD.group_id',discussion_turns:'SELECT OLD.group_id',group_evidence:'SELECT OLD.group_id',group_syntheses:'SELECT OLD.group_id',discussion_receipts:'SELECT OLD.group_id',
  private_research_evidence:'SELECT group_id FROM investment_team_scopes WHERE run_id=OLD.run_id',
  audit_events:"SELECT coalesce((SELECT s.group_id FROM investment_team_scopes s JOIN investment_team_executions e USING(scope_id) WHERE e.execution_id=OLD.execution_id),json_extract(OLD.detail,'$.group_id'))"
 };
 for(const [table,group] of Object.entries(groups)){
  const guards=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger' AND tbl_name=?").all(table) as {name:string;sql:string}[];
  for(const trigger of guards){if(!/BEFORE UPDATE/i.test(trigger.sql))continue;const [head,body]=trigger.sql.split(/\bBEGIN\b/i);const match=head!.match(/\bWHEN\b([\s\S]*)$/i);const base=match?head!.slice(0,match.index):head;const condition=match?`(${match[1]}) AND `:'';db.exec(`DROP TRIGGER "${trigger.name}"`);db.exec(`${base} WHEN ${condition} NOT (research_retention_active((${group}))=1 AND EXISTS(SELECT 1 FROM private_research_cleanup WHERE group_id=(${group}))) BEGIN ${body}`);}
 }
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Private research migration foreign-key mismatch');
}
