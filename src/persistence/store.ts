import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const migration1 = `
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
