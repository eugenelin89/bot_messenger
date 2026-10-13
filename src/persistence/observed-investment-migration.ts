import type {DatabaseSync} from 'node:sqlite';

/** Additive, inactive migration. Rebuild only constraints, retaining every old row and rowid. */
export function migrateObservedInvestment(db:DatabaseSync) {
 const triggers=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all() as {name:string;sql:string}[];
 for(const t of triggers)db.exec(`DROP TRIGGER "${t.name}"`);
 for(const name of ['investment_runs','investment_team_scopes','investment_loop_occurrences']) {
  const original=(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(name) as {sql:string}).sql;
  const indexes=db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL").all(name) as {sql:string}[];
  let sql=original.replace(new RegExp(`CREATE TABLE ["']?${name}["']?`),`CREATE TABLE ${name}_observed_next`);
  if(name==='investment_runs')sql=sql.replace("CHECK(evidence_mode='synthetic_fixture')","CHECK(evidence_mode IN ('synthetic_fixture','observed'))");
  if(name==='investment_team_scopes')sql=sql.replace('run_id TEXT NOT NULL UNIQUE','run_id TEXT NOT NULL');
  if(name==='investment_loop_occurrences')sql=sql.replace("'research','cutoff','open','expire','mark'","'research','cutoff','open','expire','mark','collect_research','collect_close'");
  db.exec(sql);
  const columns=(db.prepare(`PRAGMA table_info(${name})`).all() as {name:string}[]).map(c=>c.name).join(',');
  db.exec(`INSERT INTO ${name}_observed_next(rowid,${columns}) SELECT rowid,* FROM ${name}; DROP TABLE ${name}; ALTER TABLE ${name}_observed_next RENAME TO ${name};`);
  for(const i of indexes)db.exec(i.sql);
 }
 for(const t of triggers)db.exec(t.sql);
 db.exec(`
 CREATE TABLE observed_investment_previews(preview_id TEXT PRIMARY KEY,digest TEXT NOT NULL,input TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL);
 CREATE TABLE observed_investment_runs(run_id TEXT PRIMARY KEY REFERENCES investment_runs,preview_id TEXT NOT NULL REFERENCES observed_investment_previews,input TEXT NOT NULL,digest TEXT NOT NULL,retain_until TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE observed_investment_scopes(scope_id TEXT PRIMARY KEY REFERENCES investment_team_scopes,run_id TEXT NOT NULL REFERENCES observed_investment_runs,preview_id TEXT NOT NULL REFERENCES observed_investment_previews,input TEXT NOT NULL,digest TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE observed_investment_receipts(receipt_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE observed_financial_evidence(evidence_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES observed_investment_runs,instrument_id TEXT NOT NULL,request_hash TEXT NOT NULL,observation_hash TEXT NOT NULL,content TEXT NOT NULL,content_hash TEXT NOT NULL,qualification TEXT NOT NULL,retrieved_at TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(run_id,observation_hash));
 CREATE TABLE observed_price_qualifications(price_id TEXT PRIMARY KEY REFERENCES investment_market_records,evidence_id TEXT NOT NULL REFERENCES observed_financial_evidence,price_hash TEXT NOT NULL);
 CREATE TABLE observed_public_reviews(review_id TEXT PRIMARY KEY REFERENCES investment_team_reviews,content TEXT NOT NULL,content_hash TEXT NOT NULL);
 CREATE TABLE observed_collection_results(reservation_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX observed_evidence_run ON observed_financial_evidence(run_id,instrument_id,retrieved_at);
 CREATE UNIQUE INDEX investment_single_live_scope ON investment_team_scopes(run_id) WHERE state IN ('draft','active','paused');
 ${['observed_investment_previews','observed_investment_runs','observed_investment_scopes','observed_investment_receipts','observed_financial_evidence','observed_collection_results','observed_price_qualifications','observed_public_reviews'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Observed investment evidence immutable'); END; CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Observed investment evidence retained'); END;`).join('\n')}
 `);
 if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Observed investment migration foreign-key mismatch');
}
