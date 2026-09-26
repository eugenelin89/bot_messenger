import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const migration1 = `
CREATE TABLE principals (
 principal_id TEXT PRIMARY KEY, type TEXT NOT NULL CHECK(type IN ('human','bot','system')),
 display_name TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
);
CREATE TABLE workers (
 worker_id TEXT PRIMARY KEY, principal_id TEXT NOT NULL UNIQUE REFERENCES principals,
 display_name TEXT NOT NULL UNIQUE COLLATE NOCASE, title TEXT NOT NULL, role TEXT NOT NULL, mission TEXT NOT NULL,
 manager_worker_id TEXT REFERENCES workers, runtime_type TEXT NOT NULL, workspace_path TEXT NOT NULL UNIQUE,
 lifecycle TEXT NOT NULL CHECK(lifecycle IN ('persistent','temporary')),
 status TEXT NOT NULL CHECK(status IN ('idle','queued','working','blocked','failed','awaiting_approval')),
 capability_profile TEXT NOT NULL, delegatable_capabilities TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
 created_by_worker_id TEXT REFERENCES workers, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE runtime_bindings (
 worker_id TEXT PRIMARY KEY REFERENCES workers, runtime_type TEXT NOT NULL, runtime_reference TEXT NOT NULL UNIQUE,
 workspace_path TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
);
CREATE TABLE channels (channel_id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, topic TEXT NOT NULL);
CREATE TABLE tasks (
 task_id TEXT PRIMARY KEY, requester TEXT NOT NULL REFERENCES principals, assignee_worker_id TEXT NOT NULL REFERENCES workers,
 objective TEXT NOT NULL, acceptance_criteria TEXT NOT NULL, constraints TEXT NOT NULL, parent_task_id TEXT REFERENCES tasks,
 status TEXT NOT NULL CHECK(status IN ('queued','working','completed','blocked','failed','cancelled','awaiting_approval')),
 blocking_reason TEXT, result_summary TEXT, dispatch_reason TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE executions (
 execution_id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks, worker_id TEXT NOT NULL REFERENCES workers,
 runtime_reference TEXT, status TEXT NOT NULL CHECK(status IN ('running','completed','failed','interrupted','awaiting_approval')),
 started_at TEXT NOT NULL, finished_at TEXT, error TEXT, interruption_reason TEXT
);
CREATE UNIQUE INDEX one_execution_per_worker ON executions(worker_id) WHERE status='running';
CREATE UNIQUE INDEX one_execution_per_task ON executions(task_id) WHERE status='running';
CREATE INDEX task_queue ON tasks(status, created_at);
CREATE TABLE messages (
 message_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES channels,
 sender_principal_id TEXT NOT NULL REFERENCES principals, recipient_worker_id TEXT REFERENCES workers,
 body TEXT NOT NULL, reply_to_message_id TEXT REFERENCES messages, related_task_id TEXT REFERENCES tasks,
 execution_id TEXT REFERENCES executions, created_at TEXT NOT NULL
);
CREATE TABLE artifacts (
 artifact_id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks, execution_id TEXT NOT NULL REFERENCES executions,
 type TEXT NOT NULL, path_or_reference TEXT NOT NULL UNIQUE, description TEXT NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE audit_events (
 event_id TEXT PRIMARY KEY, type TEXT NOT NULL, actor_principal_id TEXT NOT NULL REFERENCES principals,
 worker_id TEXT REFERENCES workers, task_id TEXT REFERENCES tasks, execution_id TEXT REFERENCES executions,
 detail TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER messages_no_update BEFORE UPDATE ON messages BEGIN SELECT RAISE(ABORT,'Messages are immutable'); END;
CREATE TRIGGER messages_no_delete BEFORE DELETE ON messages BEGIN SELECT RAISE(ABORT,'Messages are immutable'); END;
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('paused','false');
CREATE TABLE tool_receipts (
 execution_id TEXT NOT NULL REFERENCES executions, call_id TEXT NOT NULL, request_hash TEXT NOT NULL,
 result TEXT NOT NULL, PRIMARY KEY(execution_id,call_id)
);
CREATE TABLE wake_events (
 source_task_id TEXT PRIMARY KEY REFERENCES tasks, parent_task_id TEXT NOT NULL REFERENCES tasks, created_at TEXT NOT NULL
);
`;

const migration2 = `
CREATE TABLE legacy_runtime_bindings (worker_id TEXT PRIMARY KEY REFERENCES workers);
INSERT INTO legacy_runtime_bindings SELECT worker_id FROM runtime_bindings;
ALTER TABLE tasks ADD COLUMN kind TEXT NOT NULL DEFAULT 'research';
ALTER TABLE tasks ADD COLUMN created_execution_id TEXT REFERENCES executions;
CREATE TABLE repositories (
 repository_id TEXT PRIMARY KEY, product_name TEXT NOT NULL, canonical_root TEXT NOT NULL UNIQUE,
 default_branch TEXT NOT NULL, base_commit TEXT, current_commit TEXT, created_by TEXT NOT NULL REFERENCES workers,
 workflow_task_id TEXT NOT NULL UNIQUE REFERENCES tasks, spec_artifact_id TEXT NOT NULL REFERENCES artifacts,
 status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE allocations (
 allocation_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 worker_id TEXT NOT NULL REFERENCES workers, task_id TEXT NOT NULL UNIQUE REFERENCES tasks,
 branch_name TEXT NOT NULL UNIQUE, worktree_path TEXT NOT NULL UNIQUE, base_commit TEXT NOT NULL,
 module TEXT NOT NULL CHECK(module IN ('calculate','format')), status TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(repository_id,module)
);
CREATE UNIQUE INDEX one_writer_allocation ON allocations(worker_id) WHERE status IN ('allocating','active','submitting','blocked');
CREATE TABLE submissions (
 submission_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 task_id TEXT NOT NULL UNIQUE REFERENCES tasks, worker_id TEXT NOT NULL REFERENCES workers,
 execution_id TEXT NOT NULL REFERENCES executions, allocation_id TEXT NOT NULL UNIQUE REFERENCES allocations,
 base_commit TEXT NOT NULL, branch_name TEXT NOT NULL, commit_sha TEXT NOT NULL,
 changed_paths TEXT NOT NULL, validation TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE reviews (
 review_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 task_id TEXT NOT NULL UNIQUE REFERENCES tasks, worker_id TEXT NOT NULL REFERENCES workers,
 execution_id TEXT NOT NULL REFERENCES executions, source_commits TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('approved','changes_required')),
 artifact_id TEXT NOT NULL REFERENCES artifacts, created_at TEXT NOT NULL
);
CREATE TABLE integrations (
 integration_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL UNIQUE REFERENCES repositories,
 review_id TEXT NOT NULL UNIQUE REFERENCES reviews, base_commit TEXT NOT NULL,
 source_commits TEXT NOT NULL, candidate_commit TEXT, final_commit TEXT,
 strategy TEXT NOT NULL, validation TEXT, status TEXT NOT NULL, error TEXT,
 requested_by TEXT NOT NULL REFERENCES workers, execution_id TEXT NOT NULL REFERENCES executions,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE task_scopes (task_id TEXT PRIMARY KEY REFERENCES tasks, repository_id TEXT NOT NULL REFERENCES repositories);
CREATE TRIGGER submissions_no_update BEFORE UPDATE ON submissions BEGIN SELECT RAISE(ABORT,'Submissions are immutable'); END;
CREATE TRIGGER submissions_no_delete BEFORE DELETE ON submissions BEGIN SELECT RAISE(ABORT,'Submissions are immutable'); END;
CREATE TRIGGER reviews_no_update BEFORE UPDATE ON reviews BEGIN SELECT RAISE(ABORT,'Reviews are immutable'); END;
CREATE TRIGGER reviews_no_delete BEFORE DELETE ON reviews BEGIN SELECT RAISE(ABORT,'Reviews are immutable'); END;
`;

export const migration3 = `
ALTER TABLE workers ADD COLUMN ai_model TEXT;
ALTER TABLE workers ADD COLUMN reasoning_effort TEXT;
ALTER TABLE workers ADD COLUMN execution_priority TEXT NOT NULL DEFAULT 'normal' CHECK(execution_priority IN ('low','normal','high','critical'));
ALTER TABLE workers ADD COLUMN ai_profile_locked INTEGER NOT NULL DEFAULT 1 CHECK(ai_profile_locked IN (0,1));
ALTER TABLE executions ADD COLUMN model TEXT;
ALTER TABLE executions ADD COLUMN reasoning_effort TEXT;
ALTER TABLE executions ADD COLUMN execution_priority TEXT CHECK(execution_priority IN ('low','normal','high','critical'));
ALTER TABLE executions ADD COLUMN runtime_version TEXT;
ALTER TABLE executions ADD COLUMN runtime_adapter TEXT;
ALTER TABLE executions ADD COLUMN provenance_status TEXT NOT NULL DEFAULT 'legacy' CHECK(provenance_status IN ('legacy','unresolved','recorded'));
ALTER TABLE runtime_bindings ADD COLUMN thread_name TEXT;
CREATE TRIGGER provenance_immutable BEFORE UPDATE OF model,reasoning_effort,execution_priority,runtime_version,runtime_adapter,provenance_status ON executions
WHEN OLD.provenance_status != 'unresolved' OR OLD.status != 'running'
BEGIN SELECT RAISE(ABORT,'Execution provenance is immutable'); END;
`;

export class Store {
  readonly db: DatabaseSync;
  private inTransaction = false;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    this.transaction(() => {
      if (!this.get('SELECT version FROM schema_migrations WHERE version=1')) {
        this.db.exec(migration1);
        this.run('INSERT INTO schema_migrations VALUES (1,?)', new Date().toISOString());
      }
      if (!this.get('SELECT version FROM schema_migrations WHERE version=2')) {
        this.db.exec(migration2);
        this.run('INSERT INTO schema_migrations VALUES (2,?)', new Date().toISOString());
      }
      if (!this.get('SELECT version FROM schema_migrations WHERE version=3')) {
        this.db.exec(migration3);
        this.run('INSERT INTO schema_migrations VALUES (3,?)', new Date().toISOString());
      }
    });
  }
  run(sql: string, ...params: SQLInputValue[]) { return this.db.prepare(sql).run(...params); }
  get<T>(sql: string, ...params: SQLInputValue[]): T | undefined { return this.db.prepare(sql).get(...params) as T | undefined; }
  all<T>(sql: string, ...params: SQLInputValue[]): T[] { return this.db.prepare(sql).all(...params) as T[]; }
  transaction<T>(fn: () => T): T {
    if (this.inTransaction) return fn();
    this.db.exec('BEGIN IMMEDIATE');
    this.inTransaction = true;
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    finally { this.inTransaction = false; }
  }
  close() { this.db.close(); }
}
