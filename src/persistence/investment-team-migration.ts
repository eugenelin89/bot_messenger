/** Empty additive owner scope and execution-attributed paper evidence. No retained worker authority changes. */
export const migration18=`
CREATE TABLE investment_team_scopes (
 scope_id TEXT PRIMARY KEY,run_id TEXT NOT NULL UNIQUE REFERENCES investment_runs,group_id TEXT NOT NULL UNIQUE REFERENCES working_groups,
 configuration_hash TEXT NOT NULL,group_scope INTEGER NOT NULL,context_hash TEXT NOT NULL,envelope TEXT NOT NULL,digest TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('draft','active','paused','revoked')),created_at TEXT NOT NULL
);
CREATE TABLE investment_team_previews (preview_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,digest TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE investment_team_executions (
 execution_id TEXT PRIMARY KEY REFERENCES executions,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,
 input_limit INTEGER NOT NULL,output_limit INTEGER NOT NULL,cost_limit INTEGER NOT NULL,created_at TEXT NOT NULL
);
CREATE TABLE investment_team_proposals (
 proposal_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,decision_id TEXT NOT NULL,revision INTEGER NOT NULL,
 worker_id TEXT NOT NULL REFERENCES workers,execution_id TEXT NOT NULL REFERENCES executions,proposal_hash TEXT NOT NULL,simulator_hash TEXT NOT NULL,
 command TEXT NOT NULL,narrative TEXT NOT NULL,provenance TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(scope_id,decision_id,revision)
);
CREATE TABLE investment_team_reviews (
 review_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,proposal_id TEXT NOT NULL REFERENCES investment_team_proposals,
 worker_id TEXT NOT NULL REFERENCES workers,execution_id TEXT NOT NULL REFERENCES executions,proposal_hash TEXT NOT NULL,simulator_hash TEXT NOT NULL,
 disposition TEXT NOT NULL CHECK(disposition IN ('approve','reject')),rationale TEXT NOT NULL,dissent TEXT NOT NULL,evidence TEXT NOT NULL,created_at TEXT NOT NULL,
 UNIQUE(proposal_id)
);
CREATE TABLE investment_team_submissions (
 submission_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,proposal_id TEXT NOT NULL UNIQUE REFERENCES investment_team_proposals,
 review_id TEXT NOT NULL REFERENCES investment_team_reviews,worker_id TEXT NOT NULL REFERENCES workers,execution_id TEXT NOT NULL REFERENCES executions,
 journal_version TEXT NOT NULL,result TEXT NOT NULL,created_at TEXT NOT NULL
);
CREATE TABLE investment_team_controls (id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,action TEXT NOT NULL,digest TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TRIGGER investment_team_scope_identity BEFORE UPDATE OF scope_id,run_id,group_id,configuration_hash,group_scope,created_at ON investment_team_scopes BEGIN SELECT RAISE(ABORT,'Investment scope identity is immutable'); END;
CREATE TRIGGER investment_team_scope_immutable BEFORE UPDATE OF context_hash,envelope,digest ON investment_team_scopes WHEN OLD.state!='draft' BEGIN SELECT RAISE(ABORT,'Investment scope is immutable'); END;
CREATE TRIGGER investment_team_scope_nodelete BEFORE DELETE ON investment_team_scopes BEGIN SELECT RAISE(ABORT,'Investment scope is retained'); END;
${['previews','executions','proposals','reviews','submissions','controls'].map(s=>`
CREATE TRIGGER investment_team_${s}_immutable BEFORE UPDATE ON investment_team_${s} BEGIN SELECT RAISE(ABORT,'Investment evidence is immutable'); END;
CREATE TRIGGER investment_team_${s}_nodelete BEFORE DELETE ON investment_team_${s} BEGIN SELECT RAISE(ABORT,'Investment evidence is retained'); END;`).join('')}
${['proposals','reviews','submissions'].map(s=>`
CREATE TRIGGER investment_team_${s}_owner BEFORE INSERT ON investment_team_${s} WHEN NOT EXISTS (
 SELECT 1 FROM executions e JOIN investment_team_executions te USING(execution_id) JOIN investment_team_scopes s USING(scope_id)
 JOIN conversation_requests r ON r.request_id=e.request_id JOIN working_groups g ON g.group_id=s.group_id
 WHERE e.execution_id=NEW.execution_id AND e.worker_id=NEW.worker_id AND e.origin='conversation' AND e.status='running'
 AND s.scope_id=NEW.scope_id AND s.state='active' AND g.conversation_id=r.conversation_id AND g.scope_version=s.group_scope AND g.state='active'
) BEGIN SELECT RAISE(ABORT,'Investment execution ownership mismatch'); END;`).join('')}
DROP TRIGGER discussion_execution_owner;
CREATE TRIGGER discussion_execution_owner BEFORE INSERT ON executions
 WHEN NEW.origin='conversation' AND EXISTS(SELECT 1 FROM conversation_requests r JOIN working_groups g USING(conversation_id) WHERE r.request_id=NEW.request_id)
 AND NOT EXISTS(SELECT 1 FROM discussion_turns t JOIN working_groups g USING(group_id) JOIN conversation_requests r USING(request_id)
 JOIN conversation_sessions s ON s.session_id=NEW.session_id
 WHERE t.request_id=NEW.request_id AND r.target_worker_id=NEW.worker_id AND s.worker_id=NEW.worker_id
 AND s.conversation_id=g.conversation_id AND s.generation=NEW.generation AND s.scope_version=g.scope_version
 AND ((s.tool_schema='discussion-v1' AND NOT EXISTS(SELECT 1 FROM investment_team_scopes p WHERE p.group_id=g.group_id))
 OR (s.tool_schema='investment-discussion-v1' AND EXISTS(SELECT 1 FROM investment_team_scopes p WHERE p.group_id=g.group_id AND p.state='active' AND p.group_scope=g.scope_version)))
 AND g.state='active' AND t.seen_revision IS NOT NULL)
 BEGIN SELECT RAISE(ABORT,'Invalid discussion execution owner'); END;
`;
