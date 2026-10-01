// Additive migration. Existing conversations, grants, sessions and artifacts are untouched.
export const migration10 = `
CREATE TABLE working_groups (
 group_id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations,
 topic TEXT NOT NULL, desired_output TEXT NOT NULL, constraints TEXT NOT NULL,
 created_by TEXT NOT NULL REFERENCES principals CHECK(created_by='human'),
 initiating_operation TEXT NOT NULL CHECK(initiating_operation IN ('owner_selected','owner_atlas')),
 eligible_workers TEXT NOT NULL, facilitator_id TEXT NOT NULL REFERENCES workers,
 synthesizer_id TEXT NOT NULL REFERENCES workers,
 state TEXT NOT NULL CHECK(state IN ('draft','active','paused','blocked','stopped','completed','archived')),
 scope_version INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 0, evidence_revision INTEGER NOT NULL DEFAULT 0,
 round INTEGER NOT NULL DEFAULT 1, turns_used INTEGER NOT NULL DEFAULT 0,
 turn_limit INTEGER NOT NULL CHECK(turn_limit BETWEEN 8 AND 40), round_limit INTEGER NOT NULL CHECK(round_limit BETWEEN 1 AND 5),
 extensions_used INTEGER NOT NULL DEFAULT 0 CHECK(extensions_used BETWEEN 0 AND 2),
 synthesis_used INTEGER NOT NULL DEFAULT 0 CHECK(synthesis_used BETWEEN 0 AND 6), deadline TEXT,
 allow_incomplete INTEGER NOT NULL CHECK(allow_incomplete IN (0,1)), allow_research INTEGER NOT NULL CHECK(allow_research IN (0,1)), error TEXT,
 created_at TEXT NOT NULL, started_at TEXT, updated_at TEXT NOT NULL
);
CREATE TABLE discussion_turns (
 turn_id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups,
 request_id TEXT NOT NULL UNIQUE REFERENCES conversation_requests,
 kind TEXT NOT NULL CHECK(kind IN ('organize','opening','facilitate','response','synthesis','review','finalize')),
 round INTEGER NOT NULL, prompt TEXT NOT NULL, contribution_ids TEXT NOT NULL, evidence_ids TEXT NOT NULL,
 seen_revision INTEGER, seen_evidence_revision INTEGER, output TEXT,
 advanced INTEGER NOT NULL DEFAULT 0 CHECK(advanced IN (0,1)), created_at TEXT NOT NULL
);
CREATE TABLE discussion_contributions (
 message_id TEXT PRIMARY KEY REFERENCES conversation_messages, group_id TEXT NOT NULL REFERENCES working_groups,
 revision INTEGER NOT NULL, kind TEXT NOT NULL, contribution_ids TEXT NOT NULL, evidence_ids TEXT NOT NULL,
 seen_revision INTEGER NOT NULL, seen_evidence_revision INTEGER NOT NULL, UNIQUE(group_id,revision)
);
CREATE TABLE discussion_checkpoints (
 checkpoint_id TEXT PRIMARY KEY, turn_id TEXT NOT NULL REFERENCES discussion_turns,
 execution_id TEXT NOT NULL REFERENCES executions, revision INTEGER NOT NULL, evidence_revision INTEGER NOT NULL,
 context_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE discussion_questions (
 question_id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups,
 message_id TEXT NOT NULL REFERENCES conversation_messages, question TEXT NOT NULL,
 target_worker_id TEXT REFERENCES workers, answered_by TEXT REFERENCES conversation_messages
);
CREATE TABLE group_evidence (
 evidence_id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups,
 kind TEXT NOT NULL CHECK(kind IN ('owner_material','document_excerpt','public_source')),
 title TEXT NOT NULL, content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 6000), metadata TEXT NOT NULL,
 sha256 TEXT NOT NULL, source_id TEXT REFERENCES research_sources, revision INTEGER NOT NULL,
 actor TEXT NOT NULL REFERENCES principals, execution_id TEXT REFERENCES executions, created_at TEXT NOT NULL,
 UNIQUE(group_id,source_id,sha256)
);
CREATE TABLE group_syntheses (
 synthesis_id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups,
 version INTEGER NOT NULL, previous_id TEXT REFERENCES group_syntheses, execution_id TEXT NOT NULL UNIQUE REFERENCES executions,
 worker_id TEXT NOT NULL REFERENCES workers, state TEXT NOT NULL CHECK(state IN ('draft','final')),
 transcript_revision INTEGER NOT NULL, evidence_revision INTEGER NOT NULL, scope_version INTEGER NOT NULL,
 content TEXT NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(group_id,version)
);
CREATE TABLE discussion_extensions (
 extension_id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups, issued_by TEXT NOT NULL REFERENCES principals CHECK(issued_by='human'),
 revision INTEGER NOT NULL, turns INTEGER NOT NULL, rounds INTEGER NOT NULL, minutes INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE discussion_receipts (
 receipt_key TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES working_groups,
 request_hash TEXT NOT NULL, result TEXT NOT NULL
);
CREATE TABLE discussion_retrieval_usage (
 execution_id TEXT PRIMARY KEY REFERENCES executions, record_chars INTEGER NOT NULL CHECK(record_chars BETWEEN 0 AND 48000), refreshes INTEGER NOT NULL CHECK(refreshes BETWEEN 0 AND 3)
);
CREATE TABLE discussion_assignments (
 receipt_key TEXT PRIMARY KEY, synthesis_id TEXT NOT NULL REFERENCES group_syntheses,
 request_hash TEXT NOT NULL, task_id TEXT NOT NULL UNIQUE REFERENCES tasks, created_at TEXT NOT NULL
);
CREATE TRIGGER group_synthesis_owner BEFORE INSERT ON group_syntheses
 WHEN NOT EXISTS(SELECT 1 FROM executions e JOIN discussion_turns t USING(request_id) JOIN working_groups g USING(group_id)
 WHERE e.execution_id=NEW.execution_id AND e.origin='conversation' AND e.status='running'
 AND e.worker_id=NEW.worker_id AND g.group_id=NEW.group_id AND g.synthesizer_id=NEW.worker_id
 AND t.seen_revision=NEW.transcript_revision AND t.seen_evidence_revision=NEW.evidence_revision AND g.scope_version=NEW.scope_version
 AND ((t.kind='synthesis' AND NEW.state='draft') OR (t.kind='finalize' AND NEW.state='final')))
 OR NEW.version!=(SELECT coalesce(max(version),0)+1 FROM group_syntheses WHERE group_id=NEW.group_id)
 OR coalesce(NEW.previous_id,'')!=coalesce((SELECT synthesis_id FROM group_syntheses WHERE group_id=NEW.group_id ORDER BY version DESC LIMIT 1),'')
 BEGIN SELECT RAISE(ABORT,'Invalid synthesis ownership or predecessor'); END;
CREATE TRIGGER discussion_contribution_owner BEFORE INSERT ON discussion_contributions
 WHEN NOT EXISTS(SELECT 1 FROM conversation_messages m JOIN working_groups g USING(conversation_id)
 WHERE m.message_id=NEW.message_id AND g.group_id=NEW.group_id AND g.revision=NEW.revision
 AND ((m.worker_id IS NULL AND m.sender_principal_id='human' AND m.execution_id IS NULL)
 OR EXISTS(SELECT 1 FROM executions e JOIN discussion_turns t USING(request_id) WHERE e.execution_id=m.execution_id
 AND e.worker_id=m.worker_id AND t.group_id=NEW.group_id AND t.seen_revision=NEW.seen_revision
 AND t.seen_evidence_revision=NEW.seen_evidence_revision)))
 BEGIN SELECT RAISE(ABORT,'Invalid contribution ownership'); END;
CREATE TRIGGER discussion_checkpoint_owner BEFORE INSERT ON discussion_checkpoints
 WHEN NOT EXISTS(SELECT 1 FROM discussion_turns t JOIN executions e USING(request_id) JOIN working_groups g USING(group_id)
 WHERE t.turn_id=NEW.turn_id AND e.execution_id=NEW.execution_id AND e.status='running'
 AND NEW.revision<=g.revision AND NEW.evidence_revision<=g.evidence_revision)
 BEGIN SELECT RAISE(ABORT,'Invalid checkpoint ownership'); END;
CREATE TRIGGER group_evidence_owner BEFORE INSERT ON group_evidence
 WHEN NOT ((NEW.actor='human' AND NEW.execution_id IS NULL) OR
 EXISTS(SELECT 1 FROM executions e JOIN discussion_turns t USING(request_id) JOIN working_groups g USING(group_id)
 JOIN workers w ON w.worker_id=e.worker_id JOIN research_sources s ON s.source_id=NEW.source_id
 WHERE e.execution_id=NEW.execution_id AND e.status='running' AND t.group_id=NEW.group_id
 AND w.principal_id=NEW.actor AND NEW.kind='public_source' AND s.worker_id=e.worker_id
 AND s.origin='conversation' AND s.scope_id=g.conversation_id))
 BEGIN SELECT RAISE(ABORT,'Invalid evidence export ownership'); END;
CREATE TRIGGER discussion_turn_owner BEFORE INSERT ON discussion_turns
 WHEN NOT EXISTS(SELECT 1 FROM working_groups g JOIN conversation_requests r ON r.conversation_id=g.conversation_id
 WHERE g.group_id=NEW.group_id AND r.request_id=NEW.request_id AND r.requester_principal_id='human'
 AND r.kind='reply' AND r.scope_version=g.scope_version)
 BEGIN SELECT RAISE(ABORT,'Invalid discussion request owner'); END;
CREATE TRIGGER discussion_turn_identity BEFORE UPDATE OF turn_id,group_id,request_id,kind,round,prompt,contribution_ids,evidence_ids,created_at ON discussion_turns
 BEGIN SELECT RAISE(ABORT,'Discussion turn ownership is immutable'); END;
CREATE TRIGGER discussion_turn_output BEFORE UPDATE OF output ON discussion_turns WHEN OLD.output IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'Committed discussion output is immutable'); END;
CREATE TRIGGER discussion_owner_immutable BEFORE UPDATE OF group_id,conversation_id,created_by,initiating_operation,eligible_workers,topic,desired_output,constraints,created_at,allow_research,allow_incomplete ON working_groups
 BEGIN SELECT RAISE(ABORT,'Discussion charter and ownership are immutable'); END;
CREATE TRIGGER discussion_execution_owner BEFORE INSERT ON executions
 WHEN NEW.origin='conversation' AND EXISTS(SELECT 1 FROM conversation_requests r JOIN working_groups g USING(conversation_id) WHERE r.request_id=NEW.request_id)
 AND NOT EXISTS(SELECT 1 FROM discussion_turns t JOIN working_groups g USING(group_id) JOIN conversation_requests r USING(request_id)
 JOIN conversation_sessions s ON s.session_id=NEW.session_id
 WHERE t.request_id=NEW.request_id AND r.target_worker_id=NEW.worker_id AND s.worker_id=NEW.worker_id
 AND s.conversation_id=g.conversation_id AND s.generation=NEW.generation AND s.scope_version=g.scope_version
 AND s.tool_schema='discussion-v1' AND g.state='active' AND t.seen_revision IS NOT NULL)
 BEGIN SELECT RAISE(ABORT,'Invalid discussion execution owner'); END;
CREATE TRIGGER discussion_transcript_revision AFTER INSERT ON conversation_messages
 WHEN EXISTS(SELECT 1 FROM working_groups WHERE conversation_id=NEW.conversation_id)
 BEGIN UPDATE working_groups SET revision=revision+1,updated_at=NEW.created_at WHERE conversation_id=NEW.conversation_id; END;
CREATE TRIGGER discussion_membership_scope AFTER UPDATE OF active ON conversation_participants
 WHEN OLD.active!=NEW.active AND EXISTS(SELECT 1 FROM working_groups WHERE conversation_id=NEW.conversation_id)
 BEGIN UPDATE working_groups SET state='blocked',scope_version=scope_version+1,error='Participant access changed; create a newly authorized group with reviewed evidence.' WHERE conversation_id=NEW.conversation_id;
 UPDATE conversations SET scope_version=scope_version+1 WHERE conversation_id=NEW.conversation_id; END;
${['discussion_contributions','discussion_checkpoints','group_evidence','group_syntheses','discussion_extensions','discussion_receipts','discussion_assignments'].map(table=>`
CREATE TRIGGER ${table}_immutable BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(ABORT,'Discussion evidence is immutable'); END;
CREATE TRIGGER ${table}_retained BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT,'Discussion evidence is retained'); END;`).join('')}
DROP TRIGGER client_audit_event;
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events
 WHEN NEW.type NOT LIKE 'conversation_%' AND NEW.type NOT LIKE 'research_%' AND NEW.type NOT LIKE 'discussion_%'
 AND NOT EXISTS (SELECT 1 FROM executions WHERE execution_id=NEW.execution_id AND origin='conversation')
 BEGIN
 INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,
 NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at);
 END;
`;
