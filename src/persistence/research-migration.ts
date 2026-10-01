// No grants, capability-profile changes, or host actions occur in this migration.
export const migration9 = `
CREATE TABLE standing_grants (
 grant_id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers,
 capability TEXT NOT NULL CHECK(capability IN ('public_research','company_knowledge')),
 granted_by TEXT NOT NULL REFERENCES principals, operation TEXT NOT NULL,
 policy_version TEXT NOT NULL, modes TEXT NOT NULL, resources TEXT NOT NULL, limits TEXT NOT NULL,
 delegation INTEGER NOT NULL CHECK(delegation=0), created_at TEXT NOT NULL,
 expires_at TEXT, revoked_at TEXT
);
CREATE UNIQUE INDEX one_current_standing_grant ON standing_grants(worker_id,capability) WHERE revoked_at IS NULL;
CREATE TRIGGER standing_grant_immutable BEFORE UPDATE OF grant_id,worker_id,capability,granted_by,operation,policy_version,modes,resources,limits,delegation,created_at,expires_at ON standing_grants
 BEGIN SELECT RAISE(ABORT,'Grant authority is immutable; revoke and grant a new version'); END;
CREATE TRIGGER standing_grant_retained BEFORE DELETE ON standing_grants BEGIN SELECT RAISE(ABORT,'Grant history is retained'); END;
CREATE TRIGGER standing_grant_revoked BEFORE UPDATE ON standing_grants WHEN OLD.revoked_at IS NOT NULL BEGIN SELECT RAISE(ABORT,'Revocation is final'); END;
CREATE TABLE research_tool_workers (worker_id TEXT PRIMARY KEY REFERENCES workers, activated_at TEXT NOT NULL);
CREATE TABLE research_operations (
 operation_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES executions,
 worker_id TEXT NOT NULL REFERENCES workers, origin TEXT NOT NULL, scope_id TEXT NOT NULL,
 grant_id TEXT NOT NULL REFERENCES standing_grants, policy_version TEXT NOT NULL,
 call_id TEXT NOT NULL, request_hash TEXT NOT NULL, tool TEXT NOT NULL, request TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('reserved','running','completed','failed','withheld','unknown')),
 result TEXT, output_chars INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, finished_at TEXT,
 provider TEXT, runtime_reference TEXT UNIQUE, unresolved INTEGER NOT NULL DEFAULT 0,
 UNIQUE(execution_id,call_id)
);
CREATE INDEX research_budget ON research_operations(worker_id,created_at);
CREATE TABLE research_sources (
 source_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL REFERENCES research_operations,
 worker_id TEXT NOT NULL REFERENCES workers, origin TEXT NOT NULL, scope_id TEXT NOT NULL,
 url TEXT NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL, content TEXT NOT NULL, sha256 TEXT NOT NULL,
 retrieved_at TEXT NOT NULL, published_at TEXT, observed_at TEXT, freshness TEXT NOT NULL, omissions TEXT NOT NULL
);
CREATE TRIGGER research_source_immutable BEFORE UPDATE ON research_sources BEGIN SELECT RAISE(ABORT,'Source evidence is immutable'); END;
CREATE TRIGGER research_source_retained BEFORE DELETE ON research_sources BEGIN SELECT RAISE(ABORT,'Source evidence is retained'); END;
CREATE TABLE research_task_sessions (
 session_id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers, execution_id TEXT NOT NULL REFERENCES executions,
 runtime_reference TEXT UNIQUE, thread_name TEXT, previous_reference TEXT, tool_hash TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('creating','prepared','active','blocked')), created_at TEXT NOT NULL, activated_at TEXT
);
CREATE UNIQUE INDEX one_research_task_session ON research_task_sessions(worker_id) WHERE state IN ('creating','prepared','active');
DROP TRIGGER client_audit_event;
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events
 WHEN NEW.type NOT LIKE 'conversation_%' AND NEW.type NOT LIKE 'research_%'
 AND NOT EXISTS (SELECT 1 FROM executions WHERE execution_id=NEW.execution_id AND origin='conversation')
 BEGIN
 INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,
 NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at);
 END;
`;
