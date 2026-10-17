/** Additive and inactive. No grants, schedules, network or model work. */
export const migration32=`
CREATE TABLE investment_process_evidence (
 evidence_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,
 session TEXT NOT NULL,kind TEXT NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,
 content_hash TEXT NOT NULL,request_hash TEXT NOT NULL,created_at TEXT NOT NULL,
 UNIQUE(scope_id,session,request_hash)
);
CREATE TABLE investment_evidence_requests (
 request_id TEXT PRIMARY KEY,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,
 session TEXT NOT NULL,execution_id TEXT NOT NULL REFERENCES executions,
 content TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(scope_id,session,content)
);
CREATE TABLE investment_strategy_reviews (
 review_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES investment_runs,
 trigger_session TEXT NOT NULL,scope_id TEXT NOT NULL REFERENCES investment_team_scopes,
 execution_id TEXT NOT NULL REFERENCES executions,content TEXT NOT NULL,created_at TEXT NOT NULL,
 UNIQUE(run_id,trigger_session,execution_id)
);
${['investment_process_evidence','investment_evidence_requests','investment_strategy_reviews'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Investment process evidence immutable'); END; CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Investment process evidence retained'); END;`).join('\n')}
`;
