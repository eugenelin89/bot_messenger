/** Passive finite schedules. No retained owner consent or runtime authority is inferred. */
export const migration19=`
CREATE TABLE investment_loops (
 loop_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL UNIQUE REFERENCES investment_team_scopes,
 envelope TEXT NOT NULL,digest TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN ('draft','active','paused','blocked','stopped','finished')),
 generation INTEGER NOT NULL DEFAULT 1,plan_revision INTEGER NOT NULL,reason TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE investment_loop_previews (preview_id TEXT PRIMARY KEY,loop_id TEXT NOT NULL REFERENCES investment_loops,digest TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE investment_loop_occurrences (
 occurrence_id TEXT PRIMARY KEY,loop_id TEXT NOT NULL REFERENCES investment_loops,plan_digest TEXT NOT NULL,plan_revision INTEGER NOT NULL,session TEXT NOT NULL,
 stage TEXT NOT NULL CHECK(stage IN ('research','cutoff','open','expire','mark')),due_at TEXT NOT NULL,expires_at TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','running','complete','missed','cancelled','blocked')),generation INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,retry_at TEXT,reason TEXT,result TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 UNIQUE(loop_id,plan_revision,session,stage)
);
CREATE TABLE investment_loop_requests (request_id TEXT PRIMARY KEY REFERENCES conversation_requests,occurrence_id TEXT NOT NULL REFERENCES investment_loop_occurrences,generation INTEGER NOT NULL);
CREATE UNIQUE INDEX investment_one_running_research ON investment_loop_occurrences(loop_id) WHERE stage='research' AND state='running';
CREATE TABLE investment_loop_executions (
 execution_id TEXT PRIMARY KEY REFERENCES investment_team_executions,occurrence_id TEXT NOT NULL REFERENCES investment_loop_occurrences,
 generation INTEGER NOT NULL,day TEXT NOT NULL,created_at TEXT NOT NULL
);
CREATE TABLE investment_loop_usage (
 execution_id TEXT PRIMARY KEY REFERENCES investment_loop_executions,state TEXT NOT NULL CHECK(state IN ('measured','unknown','exceeded')),
 input_tokens INTEGER,output_tokens INTEGER,cost_micros INTEGER,created_at TEXT NOT NULL
);
CREATE TABLE investment_loop_attempts (
 attempt_id TEXT PRIMARY KEY,occurrence_id TEXT NOT NULL REFERENCES investment_loop_occurrences,number INTEGER NOT NULL,
 state TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(occurrence_id,number)
);
CREATE TABLE investment_loop_controls (receipt_id TEXT PRIMARY KEY,loop_id TEXT NOT NULL REFERENCES investment_loops,request_hash TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TRIGGER investment_loop_identity BEFORE UPDATE OF loop_id,scope_id,created_at ON investment_loops BEGIN SELECT RAISE(ABORT,'Loop envelope is immutable'); END;
CREATE TRIGGER investment_loop_envelope BEFORE UPDATE OF envelope,digest,plan_revision ON investment_loops WHEN OLD.state!='draft' BEGIN SELECT RAISE(ABORT,'Loop envelope is immutable'); END;
CREATE TRIGGER investment_loop_nodelete BEFORE DELETE ON investment_loops BEGIN SELECT RAISE(ABORT,'Loop is retained'); END;
CREATE TRIGGER investment_occurrence_identity BEFORE UPDATE OF occurrence_id,loop_id,plan_digest,plan_revision,session,stage,due_at,expires_at,created_at ON investment_loop_occurrences BEGIN SELECT RAISE(ABORT,'Occurrence identity is immutable'); END;
CREATE TRIGGER investment_occurrence_nodelete BEFORE DELETE ON investment_loop_occurrences BEGIN SELECT RAISE(ABORT,'Occurrence is retained'); END;
${['previews','requests','executions','usage','attempts','controls'].map(s=>`
CREATE TRIGGER investment_loop_${s}_immutable BEFORE UPDATE ON investment_loop_${s} BEGIN SELECT RAISE(ABORT,'Loop evidence is immutable'); END;
CREATE TRIGGER investment_loop_${s}_nodelete BEFORE DELETE ON investment_loop_${s} BEGIN SELECT RAISE(ABORT,'Loop evidence is retained'); END;`).join('')}
CREATE TRIGGER investment_loop_execution_owner BEFORE INSERT ON investment_loop_executions WHEN NOT EXISTS (
 SELECT 1 FROM investment_team_executions te JOIN investment_loops l USING(scope_id) JOIN investment_loop_occurrences o USING(loop_id)
 JOIN executions e USING(execution_id) WHERE te.execution_id=NEW.execution_id AND e.status='running' AND l.state='active'
 AND o.occurrence_id=NEW.occurrence_id AND o.stage='research' AND o.state='running' AND o.generation=l.generation AND NEW.generation=l.generation
) BEGIN SELECT RAISE(ABORT,'Invalid loop execution owner'); END;
`;
