// Additive only: no grants/operators/sessions/processes, existing pause unchanged.
export const migration13 = `
CREATE TABLE computer_sessions (
 session_id TEXT PRIMARY KEY, worker_id TEXT NOT NULL REFERENCES workers, task_id TEXT NOT NULL UNIQUE REFERENCES tasks,
 policy TEXT NOT NULL, policy_hash TEXT NOT NULL, state TEXT NOT NULL,
 generation INTEGER NOT NULL DEFAULT 0, active_execution_id TEXT REFERENCES executions,
 process_identity TEXT, created_at TEXT NOT NULL, started_at TEXT, stopped_at TEXT, deadline TEXT, last_action_at TEXT,
 actions INTEGER NOT NULL DEFAULT 0, navigations INTEGER NOT NULL DEFAULT 0, screenshots INTEGER NOT NULL DEFAULT 0,
 screenshot_bytes INTEGER NOT NULL DEFAULT 0, requests INTEGER NOT NULL DEFAULT 0, network_bytes INTEGER NOT NULL DEFAULT 0,
 current_url TEXT, page_hash TEXT, error TEXT, shutdown_confirmed INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX one_computer_environment ON computer_sessions((1))
 WHERE state IN ('provisioning','active','awaiting_approval') OR shutdown_confirmed=0 OR active_execution_id IS NOT NULL;
CREATE TRIGGER computer_policy_immutable BEFORE UPDATE OF session_id,worker_id,task_id,policy,policy_hash,created_at ON computer_sessions
 BEGIN SELECT RAISE(ABORT,'Computer policy and ownership are immutable'); END;
CREATE TABLE computer_grants (
 grant_id TEXT PRIMARY KEY, session_id TEXT NOT NULL UNIQUE REFERENCES computer_sessions, worker_id TEXT NOT NULL REFERENCES workers,
 task_id TEXT NOT NULL REFERENCES tasks, policy_hash TEXT NOT NULL, issued_by TEXT NOT NULL REFERENCES principals,
 created_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT
);
CREATE TRIGGER computer_grant_immutable BEFORE UPDATE OF grant_id,session_id,worker_id,task_id,policy_hash,issued_by,created_at,expires_at ON computer_grants
 BEGIN SELECT RAISE(ABORT,'Computer grant is immutable'); END;
CREATE TRIGGER computer_grant_revoked BEFORE UPDATE ON computer_grants WHEN OLD.revoked_at IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'Computer revocation is final'); END;
CREATE TABLE computer_contexts (
 context_id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES computer_sessions, worker_id TEXT NOT NULL REFERENCES workers,
 task_id TEXT NOT NULL REFERENCES tasks, execution_id TEXT NOT NULL UNIQUE REFERENCES executions, generation INTEGER NOT NULL,
 runtime_reference TEXT UNIQUE, thread_name TEXT, created_at TEXT NOT NULL, UNIQUE(session_id,generation)
);
CREATE TRIGGER computer_context_owner BEFORE INSERT ON computer_contexts
 WHEN NOT EXISTS(SELECT 1 FROM computer_sessions s JOIN executions e ON e.execution_id=NEW.execution_id
 WHERE s.session_id=NEW.session_id AND s.worker_id=NEW.worker_id AND s.task_id=NEW.task_id
 AND e.origin='task' AND e.worker_id=NEW.worker_id AND e.task_id=NEW.task_id)
 BEGIN SELECT RAISE(ABORT,'Computer context ownership mismatch'); END;
CREATE TABLE computer_operations (
 operation_id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES computer_sessions, execution_id TEXT NOT NULL REFERENCES executions,
 generation INTEGER NOT NULL, call_id TEXT NOT NULL, request_hash TEXT NOT NULL, tool TEXT NOT NULL,
 state TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL, finished_at TEXT, UNIQUE(execution_id,call_id)
);
CREATE TABLE computer_intents (
 intent_id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES computer_sessions, worker_id TEXT NOT NULL REFERENCES workers,
 task_id TEXT NOT NULL REFERENCES tasks, execution_id TEXT NOT NULL REFERENCES executions, generation INTEGER NOT NULL,
 policy_hash TEXT NOT NULL, request TEXT NOT NULL, request_hash TEXT NOT NULL, page_hash TEXT NOT NULL,
 state TEXT NOT NULL, reason TEXT, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, decided_at TEXT,
 decided_by TEXT REFERENCES principals, consumed_execution_id TEXT REFERENCES executions, result TEXT
);
CREATE TRIGGER computer_intent_immutable BEFORE UPDATE OF intent_id,session_id,worker_id,task_id,execution_id,generation,policy_hash,request,request_hash,page_hash,created_at,expires_at ON computer_intents
 BEGIN SELECT RAISE(ABORT,'Protected computer intent is immutable'); END;
CREATE TABLE computer_evidence (
 evidence_id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES computer_sessions, worker_id TEXT NOT NULL REFERENCES workers,
 task_id TEXT NOT NULL REFERENCES tasks, execution_id TEXT NOT NULL REFERENCES executions, generation INTEGER NOT NULL,
 url TEXT NOT NULL, viewport TEXT NOT NULL, action_sequence INTEGER NOT NULL, captured_at TEXT NOT NULL,
 sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, visibility TEXT NOT NULL CHECK(visibility='owner_private')
);
CREATE TRIGGER computer_evidence_immutable BEFORE UPDATE ON computer_evidence BEGIN SELECT RAISE(ABORT,'Computer evidence is immutable'); END;
CREATE TABLE computer_network_events (
 event_id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES computer_sessions, execution_id TEXT REFERENCES executions,
 operation_id TEXT REFERENCES computer_operations, url TEXT NOT NULL, method TEXT NOT NULL, disposition TEXT NOT NULL,
 detail TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TRIGGER computer_network_immutable BEFORE UPDATE ON computer_network_events BEGIN SELECT RAISE(ABORT,'Network evidence is immutable'); END;
CREATE TRIGGER computer_session_retained BEFORE DELETE ON computer_sessions BEGIN SELECT RAISE(ABORT,'Computer history is retained'); END;
CREATE TRIGGER computer_grant_retained BEFORE DELETE ON computer_grants BEGIN SELECT RAISE(ABORT,'Computer history is retained'); END;
CREATE TRIGGER computer_intent_retained BEFORE DELETE ON computer_intents BEGIN SELECT RAISE(ABORT,'Computer history is retained'); END;
CREATE TRIGGER computer_evidence_retained BEFORE DELETE ON computer_evidence BEGIN SELECT RAISE(ABORT,'Computer history is retained'); END;
DROP TRIGGER client_message_event;
CREATE TRIGGER client_message_event AFTER INSERT ON messages
 WHEN NOT EXISTS(SELECT 1 FROM mandate_internal_work WHERE task_id=NEW.related_task_id)
 AND NOT EXISTS(SELECT 1 FROM tasks WHERE task_id=NEW.related_task_id AND kind='computer')
 BEGIN INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES ('message.created',NEW.recipient_worker_id,NEW.related_task_id,NEW.execution_id,NEW.created_at); END;
DROP TRIGGER client_audit_event;
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events
 WHEN NEW.type NOT LIKE 'conversation_%' AND NEW.type NOT LIKE 'research_%' AND NEW.type NOT LIKE 'discussion_%' AND NEW.type NOT LIKE 'mandate_%' AND NEW.type NOT LIKE 'computer_%'
 AND NOT EXISTS(SELECT 1 FROM executions WHERE execution_id=NEW.execution_id AND origin='conversation')
 AND NOT EXISTS(SELECT 1 FROM mandate_internal_work WHERE task_id=NEW.task_id)
 AND NOT EXISTS(SELECT 1 FROM tasks WHERE task_id=NEW.task_id AND kind='computer')
 BEGIN INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at); END;
`;
