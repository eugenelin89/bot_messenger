import type { DatabaseSync } from 'node:sqlite';

// Rebuild only execution ownership. Copy rowid as well as every legacy field so
// existing API cursors, execution IDs and all incoming foreign keys remain valid.
export function migrateConversations(db: DatabaseSync) {
  db.exec(`
CREATE TABLE conversations (
 conversation_id TEXT PRIMARY KEY, purpose TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('active','muted','archived')),
 scope_version INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL REFERENCES principals,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE conversation_participants (
 conversation_id TEXT NOT NULL REFERENCES conversations, principal_id TEXT NOT NULL REFERENCES principals,
 worker_id TEXT REFERENCES workers, active INTEGER NOT NULL CHECK(active IN (0,1)),
 PRIMARY KEY(conversation_id,principal_id), UNIQUE(conversation_id,worker_id)
);
CREATE TABLE conversation_chains (
 chain_id TEXT PRIMARY KEY, consumed INTEGER NOT NULL CHECK(consumed BETWEEN 1 AND 4), created_at TEXT NOT NULL
);
CREATE TABLE conversation_requests (
 request_id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations,
 message_id TEXT NOT NULL REFERENCES conversation_messages, target_worker_id TEXT NOT NULL REFERENCES workers,
 requester_principal_id TEXT NOT NULL REFERENCES principals, chain_id TEXT NOT NULL REFERENCES conversation_chains,
 hop INTEGER NOT NULL CHECK(hop BETWEEN 0 AND 2), kind TEXT NOT NULL CHECK(kind IN ('reply','peer','continuation')),
 parent_request_id TEXT REFERENCES conversation_requests, return_worker_id TEXT REFERENCES workers,
 status TEXT NOT NULL CHECK(status IN ('queued','waiting_peer','replying','completed','interrupted','failed','blocked','cancelled')),
 scope_version INTEGER NOT NULL, response_message_id TEXT UNIQUE REFERENCES conversation_messages, error TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX one_peer_continuation ON conversation_requests(parent_request_id) WHERE kind='continuation';
CREATE TABLE conversation_deliveries (
 peer_request_id TEXT PRIMARY KEY REFERENCES conversation_requests, return_worker_id TEXT NOT NULL REFERENCES workers,
 continuation_request_id TEXT UNIQUE REFERENCES conversation_requests, state TEXT NOT NULL CHECK(state IN ('waiting','queued','blocked')),
 error TEXT, created_at TEXT NOT NULL
);
CREATE TABLE conversation_messages (
 message_id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations,
 sender_principal_id TEXT NOT NULL REFERENCES principals, worker_id TEXT REFERENCES workers,
 execution_id TEXT REFERENCES executions, body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 12000),
 request_id TEXT REFERENCES conversation_requests, response_to TEXT UNIQUE REFERENCES conversation_requests, created_at TEXT NOT NULL
);
CREATE INDEX conversation_history ON conversation_messages(conversation_id,created_at);
CREATE TABLE conversation_notes (
 note_id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations,
 source_message_id TEXT NOT NULL REFERENCES conversation_messages, kind TEXT NOT NULL CHECK(kind IN ('fact','decision','question')),
 quote TEXT NOT NULL CHECK(length(quote) BETWEEN 1 AND 1200), execution_id TEXT NOT NULL REFERENCES executions,
 created_at TEXT NOT NULL, UNIQUE(conversation_id,source_message_id,quote)
);
CREATE TRIGGER conversation_note_immutable BEFORE UPDATE ON conversation_notes BEGIN SELECT RAISE(ABORT,'Source bookmarks are immutable'); END;
CREATE TRIGGER conversation_note_retained BEFORE DELETE ON conversation_notes BEGIN SELECT RAISE(ABORT,'Source bookmarks are retained'); END;
CREATE TABLE conversation_sessions (
 session_id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers, conversation_id TEXT NOT NULL REFERENCES conversations,
 generation INTEGER NOT NULL CHECK(generation>0), scope_version INTEGER NOT NULL,
 mode TEXT NOT NULL CHECK(mode='conversation'), tool_schema TEXT NOT NULL, tool_hash TEXT NOT NULL,
 previous_session_id TEXT REFERENCES conversation_sessions, runtime_reference TEXT UNIQUE, thread_name TEXT,
 state TEXT NOT NULL CHECK(state IN ('creating','prepared','active','superseded','blocked')),
 reason TEXT NOT NULL, handoff TEXT NOT NULL, handoff_hash TEXT NOT NULL, handoff_version INTEGER NOT NULL,
 completed_turns INTEGER NOT NULL DEFAULT 0, input_chars INTEGER NOT NULL DEFAULT 0,
 rollover_requested INTEGER NOT NULL DEFAULT 0, unresolved INTEGER NOT NULL DEFAULT 0 CHECK(unresolved IN (0,1)), created_at TEXT NOT NULL, activated_at TEXT,
 UNIQUE(worker_id,conversation_id,generation)
);
CREATE UNIQUE INDEX one_active_conversation_session ON conversation_sessions(worker_id,conversation_id) WHERE state='active';
CREATE UNIQUE INDEX one_preparing_conversation_session ON conversation_sessions(worker_id,conversation_id) WHERE state IN ('creating','prepared');
CREATE TABLE conversation_receipts (
 principal_id TEXT NOT NULL REFERENCES principals, receipt_key TEXT NOT NULL, request_hash TEXT NOT NULL,
 result TEXT NOT NULL, PRIMARY KEY(principal_id,receipt_key)
);
CREATE TABLE executions_next (
 execution_id TEXT PRIMARY KEY, task_id TEXT REFERENCES tasks, worker_id TEXT NOT NULL REFERENCES workers,
 runtime_reference TEXT, status TEXT NOT NULL CHECK(status IN ('running','completed','failed','interrupted','awaiting_approval')),
 started_at TEXT NOT NULL, finished_at TEXT, error TEXT, interruption_reason TEXT,
 model TEXT, reasoning_effort TEXT, execution_priority TEXT CHECK(execution_priority IN ('low','normal','high','critical')),
 runtime_version TEXT, runtime_adapter TEXT, provenance_status TEXT NOT NULL DEFAULT 'legacy' CHECK(provenance_status IN ('legacy','unresolved','recorded')),
 origin TEXT NOT NULL DEFAULT 'task' CHECK(origin IN ('task','conversation')),
 request_id TEXT REFERENCES conversation_requests, session_id TEXT REFERENCES conversation_sessions, generation INTEGER,
 CHECK((origin='task' AND task_id IS NOT NULL AND request_id IS NULL AND session_id IS NULL AND generation IS NULL)
 OR (origin='conversation' AND task_id IS NULL AND request_id IS NOT NULL AND session_id IS NOT NULL AND generation>0))
);
INSERT INTO executions_next (rowid,execution_id,task_id,worker_id,runtime_reference,status,started_at,finished_at,error,interruption_reason,model,reasoning_effort,execution_priority,runtime_version,runtime_adapter,provenance_status)
 SELECT rowid,execution_id,task_id,worker_id,runtime_reference,status,started_at,finished_at,error,interruption_reason,model,reasoning_effort,execution_priority,runtime_version,runtime_adapter,provenance_status FROM executions;
DROP TABLE executions;
ALTER TABLE executions_next RENAME TO executions;
CREATE UNIQUE INDEX one_execution_per_worker ON executions(worker_id) WHERE status='running';
CREATE UNIQUE INDEX one_execution_per_task ON executions(task_id) WHERE status='running';
CREATE UNIQUE INDEX one_execution_per_request ON executions(request_id) WHERE status='running';
CREATE TRIGGER execution_origin_immutable BEFORE UPDATE OF origin,task_id,worker_id,request_id,session_id,generation ON executions
 BEGIN SELECT RAISE(ABORT,'Execution ownership is immutable'); END;
CREATE TRIGGER execution_task_owner BEFORE INSERT ON executions WHEN NEW.origin='task' AND NOT EXISTS (
 SELECT 1 FROM tasks WHERE task_id=NEW.task_id AND assignee_worker_id=NEW.worker_id)
 BEGIN SELECT RAISE(ABORT,'Invalid task execution owner'); END;
CREATE TRIGGER execution_conversation_owner BEFORE INSERT ON executions WHEN NEW.origin='conversation' AND NOT EXISTS (
 SELECT 1 FROM conversation_requests r JOIN conversation_sessions s ON s.session_id=NEW.session_id
 WHERE r.request_id=NEW.request_id AND r.target_worker_id=NEW.worker_id AND r.conversation_id=s.conversation_id
 AND s.worker_id=NEW.worker_id AND s.generation=NEW.generation AND r.scope_version=s.scope_version)
 BEGIN SELECT RAISE(ABORT,'Invalid conversation execution owner'); END;
CREATE TRIGGER provenance_immutable BEFORE UPDATE OF model,reasoning_effort,execution_priority,runtime_version,runtime_adapter,provenance_status ON executions
 WHEN OLD.provenance_status != 'unresolved' OR OLD.status != 'running'
 BEGIN SELECT RAISE(ABORT,'Execution provenance is immutable'); END;
CREATE TRIGGER conversation_message_no_update BEFORE UPDATE ON conversation_messages BEGIN SELECT RAISE(ABORT,'Conversation messages are immutable'); END;
CREATE TRIGGER conversation_message_no_delete BEFORE DELETE ON conversation_messages BEGIN SELECT RAISE(ABORT,'Conversation messages are retained'); END;
CREATE TRIGGER conversation_request_owner BEFORE UPDATE OF conversation_id,message_id,target_worker_id,requester_principal_id,chain_id,hop,kind,parent_request_id,return_worker_id,scope_version ON conversation_requests
 BEGIN SELECT RAISE(ABORT,'Reply ownership is immutable'); END;
CREATE TRIGGER conversation_request_terminal BEFORE UPDATE ON conversation_requests WHEN OLD.status IN ('completed','cancelled')
 BEGIN SELECT RAISE(ABORT,'Reply request is terminal'); END;
CREATE TRIGGER conversation_handoff_immutable BEFORE UPDATE OF worker_id,conversation_id,generation,scope_version,mode,tool_schema,tool_hash,previous_session_id,reason,handoff,handoff_hash,handoff_version ON conversation_sessions
 BEGIN SELECT RAISE(ABORT,'Handoff provenance is immutable'); END;
DROP TRIGGER client_audit_event;
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events
 WHEN NEW.type NOT LIKE 'conversation_%' AND NOT EXISTS (SELECT 1 FROM executions WHERE execution_id=NEW.execution_id AND origin='conversation')
 BEGIN
 INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,
 NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at);
 END;
`);
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Conversation migration foreign-key validation failed');
}

// Shared provider intent fence, added separately because schema 7 was exercised in validation.
// Historical executions have no invented outcome metadata.
export const migration8 = `
CREATE TABLE execution_runtime_attempts (
 execution_id TEXT PRIMARY KEY REFERENCES executions, unresolved INTEGER NOT NULL CHECK(unresolved IN (0,1))
);
`;
