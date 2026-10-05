import type {DatabaseSync} from 'node:sqlite';
/** The one existing CHECK widened here records the actual coordinator principal.
 * All existing group rowids/values and triggers are retained. No work is created. */
export function migrateMandates(db:DatabaseSync){
  const table=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='working_groups'").get() as {sql:string};
  const triggers=db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND (tbl_name='working_groups' OR sql LIKE '%working_groups%')").all() as {sql:string}[];
  for(const trigger of triggers){const name=/CREATE TRIGGER (\w+)/i.exec(trigger.sql)?.[1];if(!name)throw new Error('Unrecognized retained trigger');db.exec(`DROP TRIGGER ${name}`);}
  db.exec(table.sql.replace('CREATE TABLE working_groups','CREATE TABLE working_groups_new').replace(" CHECK(created_by='human')",'').replace("('owner_selected','owner_atlas')","('owner_selected','owner_atlas','mandate_coordinator')"));
  const columns=(db.prepare('PRAGMA table_info(working_groups)').all() as {name:string}[]).map(c=>c.name).join(',');
  db.exec(`INSERT INTO working_groups_new(rowid,${columns}) SELECT rowid,${columns} FROM working_groups ORDER BY rowid`);
  db.exec('DROP TABLE working_groups; ALTER TABLE working_groups_new RENAME TO working_groups');
  for(const trigger of triggers)db.exec(trigger.sql.replace("(m.worker_id IS NULL AND m.sender_principal_id='human' AND m.execution_id IS NULL)","(m.worker_id IS NULL AND m.execution_id IS NULL AND (m.sender_principal_id='human' OR (g.initiating_operation='mandate_coordinator' AND NEW.kind='charter' AND m.sender_principal_id=g.created_by)))"));
  db.exec(migration11);
}
export const migration11=`
CREATE TABLE mandates (
 mandate_id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES principals CHECK(owner_id='human'),
 title TEXT NOT NULL, objective TEXT NOT NULL, success_criteria TEXT NOT NULL, stop_criteria TEXT NOT NULL,
 constraints TEXT NOT NULL, resources TEXT NOT NULL, envelope TEXT NOT NULL, coordinator_id TEXT NOT NULL REFERENCES workers,
 status TEXT NOT NULL CHECK(status IN ('draft','active','paused','blocked','completed','stopped','cancelled')),
 version INTEGER NOT NULL, activated_at TEXT, current_cycle_id TEXT REFERENCES operating_cycles,
 strategic_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE mandate_conversations (
 mandate_id TEXT PRIMARY KEY REFERENCES mandates, conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations
);
CREATE TABLE operating_cycles (
 cycle_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, mandate_version INTEGER NOT NULL,
 number INTEGER NOT NULL, occurrence_id TEXT UNIQUE REFERENCES review_occurrences,
 state TEXT NOT NULL CHECK(state IN ('active','waiting','closed','blocked','cancelled')),
 trigger TEXT NOT NULL, executions_reserved INTEGER NOT NULL DEFAULT 0, tasks_created INTEGER NOT NULL DEFAULT 0,
 groups_created INTEGER NOT NULL DEFAULT 0, failures INTEGER NOT NULL DEFAULT 0, retry_at TEXT,
 deadline TEXT NOT NULL, summary TEXT, error TEXT, created_at TEXT NOT NULL, closed_at TEXT,
 UNIQUE(mandate_id,number)
);
CREATE UNIQUE INDEX one_open_mandate_cycle ON operating_cycles(mandate_id) WHERE state IN ('active','waiting','blocked');
CREATE TABLE mandate_turns (
 turn_id TEXT PRIMARY KEY, cycle_id TEXT NOT NULL REFERENCES operating_cycles,
 request_id TEXT NOT NULL UNIQUE REFERENCES conversation_requests, output TEXT, advanced INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE initiatives (
 initiative_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, cycle_id TEXT NOT NULL REFERENCES operating_cycles,
 title TEXT NOT NULL, mechanism TEXT NOT NULL, expected_outcome TEXT NOT NULL, assumptions TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('proposed','active','stopped')), created_by TEXT NOT NULL REFERENCES principals,
 execution_id TEXT NOT NULL REFERENCES executions, created_at TEXT NOT NULL
);
CREATE TABLE strategic_decisions (
 decision_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, cycle_id TEXT NOT NULL REFERENCES operating_cycles,
 initiative_id TEXT REFERENCES initiatives, previous_id TEXT REFERENCES strategic_decisions,
 disposition TEXT NOT NULL CHECK(disposition IN ('continue','iterate','pivot','stop','scale')),
 recommendation TEXT NOT NULL, rationale TEXT NOT NULL, alternatives TEXT NOT NULL, evidence_ids TEXT NOT NULL,
 contrary_evidence TEXT NOT NULL, unknowns TEXT NOT NULL, missing_evidence TEXT,
 worker_id TEXT NOT NULL REFERENCES workers, execution_id TEXT NOT NULL REFERENCES executions, created_at TEXT NOT NULL
);
CREATE TABLE mandate_observations (
 observation_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, cycle_id TEXT REFERENCES operating_cycles,
 initiative_id TEXT REFERENCES initiatives, mode TEXT NOT NULL CHECK(mode IN ('real_read_only','public_source','owner_provided','sanitized_snapshot','simulated_fixture')),
 name TEXT NOT NULL, value TEXT, unit TEXT, observed_at TEXT, period TEXT, recorded_at TEXT NOT NULL,
 source TEXT NOT NULL, provenance TEXT NOT NULL, classification TEXT NOT NULL CHECK(classification='mandate_private'),
 limitations TEXT NOT NULL, missingness TEXT NOT NULL, body TEXT NOT NULL, sha256 TEXT NOT NULL,
 admitted_by TEXT NOT NULL REFERENCES principals CHECK(admitted_by='human'), withdrawn_at TEXT
);
CREATE TABLE mandate_internal_work (
 work_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, cycle_id TEXT NOT NULL REFERENCES operating_cycles,
 decision_id TEXT REFERENCES strategic_decisions, task_id TEXT UNIQUE REFERENCES tasks, group_id TEXT UNIQUE REFERENCES working_groups,
 execution_id TEXT NOT NULL REFERENCES executions, delivered INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
 CHECK((task_id IS NOT NULL AND group_id IS NULL AND decision_id IS NOT NULL) OR (task_id IS NULL AND group_id IS NOT NULL))
);
CREATE TABLE mandate_read_chunks (
 execution_id TEXT NOT NULL REFERENCES executions, record_id TEXT NOT NULL, offset INTEGER NOT NULL, chars INTEGER NOT NULL, sha256 TEXT NOT NULL, PRIMARY KEY(execution_id,record_id,offset)
);
CREATE TABLE mandate_evidence_delivery (
 execution_id TEXT NOT NULL REFERENCES executions, record_id TEXT NOT NULL, mandate_id TEXT NOT NULL REFERENCES mandates,
 sha256 TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(execution_id,record_id)
);
CREATE TABLE review_schedules (
 schedule_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, initiative_id TEXT REFERENCES initiatives,
 owner_id TEXT NOT NULL REFERENCES principals CHECK(owner_id='human'), creator_id TEXT NOT NULL REFERENCES principals,
 purpose TEXT NOT NULL, coordinator_id TEXT NOT NULL REFERENCES workers, timezone TEXT NOT NULL,
 recurrence TEXT NOT NULL, end_at TEXT NOT NULL, occurrence_limit INTEGER NOT NULL, consumed INTEGER NOT NULL DEFAULT 0,
 version INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','paused','cancelled','exhausted')),
 next_due TEXT, overlap_policy TEXT NOT NULL CHECK(overlap_policy='hold_one'), missed_policy TEXT NOT NULL CHECK(missed_policy='coalesce'),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX review_next_due ON review_schedules(status,next_due);
CREATE TABLE review_schedule_versions (
 schedule_id TEXT NOT NULL REFERENCES review_schedules, version INTEGER NOT NULL, snapshot TEXT NOT NULL,
 actor_id TEXT NOT NULL REFERENCES principals, created_at TEXT NOT NULL, PRIMARY KEY(schedule_id,version)
);
CREATE TABLE review_occurrences (
 occurrence_id TEXT PRIMARY KEY, schedule_id TEXT NOT NULL REFERENCES review_schedules,
 schedule_version INTEGER NOT NULL, mandate_id TEXT NOT NULL REFERENCES mandates, due_at TEXT NOT NULL, through_at TEXT NOT NULL,
 missed_count INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('due','held','queued','completed','blocked','cancelled','superseded')),
 cycle_id TEXT UNIQUE REFERENCES operating_cycles, reason TEXT, created_at TEXT NOT NULL, completed_at TEXT,
 UNIQUE(schedule_id,schedule_version,due_at), FOREIGN KEY(schedule_id,schedule_version) REFERENCES review_schedule_versions
);
CREATE INDEX review_pending ON review_occurrences(state,due_at);
CREATE TRIGGER mandate_execution_owner BEFORE INSERT ON executions
 WHEN NEW.origin='conversation' AND EXISTS(SELECT 1 FROM conversation_requests r JOIN mandate_conversations mc USING(conversation_id) WHERE r.request_id=NEW.request_id)
 AND NOT EXISTS(SELECT 1 FROM mandate_turns t JOIN operating_cycles c USING(cycle_id) JOIN mandates m USING(mandate_id)
 JOIN mandate_conversations mc USING(mandate_id) JOIN conversation_requests r USING(request_id)
 JOIN conversation_sessions s ON s.session_id=NEW.session_id
 WHERE t.request_id=NEW.request_id AND r.target_worker_id=NEW.worker_id AND m.coordinator_id=NEW.worker_id
 AND s.worker_id=NEW.worker_id AND s.conversation_id=mc.conversation_id AND s.generation=NEW.generation
 AND s.tool_schema='mandate-review-v1' AND m.status='active' AND c.state='active' AND c.mandate_version=m.version)
 BEGIN SELECT RAISE(ABORT,'Invalid mandate review execution owner'); END;
CREATE TRIGGER mandate_decision_owner BEFORE INSERT ON strategic_decisions
 WHEN NOT EXISTS(SELECT 1 FROM executions e JOIN mandate_turns t USING(request_id) JOIN operating_cycles c USING(cycle_id)
 JOIN mandates m USING(mandate_id) WHERE e.execution_id=NEW.execution_id AND e.status='running' AND e.worker_id=NEW.worker_id
 AND c.cycle_id=NEW.cycle_id AND m.mandate_id=NEW.mandate_id AND m.coordinator_id=NEW.worker_id AND m.status='active')
 BEGIN SELECT RAISE(ABORT,'Invalid strategic decision ownership'); END;
CREATE TRIGGER mandate_turn_owner BEFORE INSERT ON mandate_turns
 WHEN NOT EXISTS(SELECT 1 FROM operating_cycles c JOIN mandates m USING(mandate_id) JOIN mandate_conversations mc USING(mandate_id)
 JOIN conversation_requests r USING(conversation_id) WHERE c.cycle_id=NEW.cycle_id AND r.request_id=NEW.request_id
 AND r.target_worker_id=m.coordinator_id AND r.kind='reply' AND r.requester_principal_id=m.owner_id)
 BEGIN SELECT RAISE(ABORT,'Invalid mandate turn owner'); END;
CREATE TRIGGER mandate_turn_identity BEFORE UPDATE OF turn_id,cycle_id,request_id,created_at ON mandate_turns
 BEGIN SELECT RAISE(ABORT,'Mandate turn ownership is immutable'); END;
CREATE TRIGGER cycle_identity BEFORE UPDATE OF cycle_id,mandate_id,mandate_version,number,occurrence_id,trigger,created_at ON operating_cycles
 BEGIN SELECT RAISE(ABORT,'Cycle ownership is immutable'); END;
CREATE TRIGGER internal_work_identity BEFORE UPDATE OF work_id,mandate_id,cycle_id,decision_id,task_id,group_id,execution_id,created_at ON mandate_internal_work
 BEGIN SELECT RAISE(ABORT,'Internal work ownership is immutable'); END;
CREATE TRIGGER occurrence_identity BEFORE UPDATE OF occurrence_id,schedule_id,schedule_version,mandate_id,due_at,created_at ON review_occurrences
 BEGIN SELECT RAISE(ABORT,'Occurrence identity is immutable'); END;
CREATE TRIGGER occurrence_terminal BEFORE UPDATE ON review_occurrences WHEN OLD.state IN ('completed','cancelled','superseded')
 BEGIN SELECT RAISE(ABORT,'Terminal occurrence history is immutable'); END;
CREATE TRIGGER schedule_identity BEFORE UPDATE OF schedule_id,mandate_id,owner_id,creator_id,coordinator_id,timezone,created_at ON review_schedules
 BEGIN SELECT RAISE(ABORT,'Schedule ownership is immutable'); END;
CREATE TRIGGER mandate_turn_output BEFORE UPDATE OF output ON mandate_turns WHEN OLD.output IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'Committed mandate turn is immutable'); END;
CREATE TRIGGER observation_body_immutable BEFORE UPDATE OF observation_id,mandate_id,cycle_id,initiative_id,mode,name,value,unit,observed_at,period,recorded_at,source,provenance,classification,limitations,missingness,body,sha256,admitted_by ON mandate_observations
 BEGIN SELECT RAISE(ABORT,'Observation originals are immutable'); END;
CREATE TRIGGER mandate_authority_immutable BEFORE UPDATE OF owner_id,objective,success_criteria,stop_criteria,constraints,resources,envelope,coordinator_id ON mandates WHEN OLD.status!='draft'
 BEGIN SELECT RAISE(ABORT,'Active mandate authority requires a new owner-authored mandate'); END;
${['strategic_decisions','review_schedule_versions','mandate_evidence_delivery'].map(t=>`
CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Strategic originals are immutable'); END;
CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Strategic originals are retained'); END;`).join('')}
DROP TRIGGER client_message_event;
CREATE TRIGGER client_message_event AFTER INSERT ON messages
 WHEN NOT EXISTS(SELECT 1 FROM mandate_internal_work WHERE task_id=NEW.related_task_id)
 BEGIN INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES ('message.created',NEW.recipient_worker_id,NEW.related_task_id,NEW.execution_id,NEW.created_at); END;
DROP TRIGGER client_audit_event;
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events
 WHEN NEW.type NOT LIKE 'conversation_%' AND NEW.type NOT LIKE 'research_%' AND NEW.type NOT LIKE 'discussion_%' AND NEW.type NOT LIKE 'mandate_%'
 AND NOT EXISTS(SELECT 1 FROM executions WHERE execution_id=NEW.execution_id AND origin='conversation')
 AND NOT EXISTS(SELECT 1 FROM mandate_internal_work WHERE task_id=NEW.task_id)
 BEGIN INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at); END;
`;
