export const migration20=`
CREATE TABLE ai_usage (
 usage_id TEXT PRIMARY KEY, execution_id TEXT NOT NULL REFERENCES executions, worker_id TEXT NOT NULL REFERENCES workers,
 activity TEXT NOT NULL, run_id TEXT REFERENCES investment_runs, scope_id TEXT REFERENCES investment_team_scopes,
 cycle_id TEXT, request_id TEXT, provider TEXT, model TEXT, thread_id TEXT, turn_id TEXT,
 service_tier TEXT, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL DEFAULT 'running',
 baseline TEXT, tokens TEXT, last_total TEXT, completeness TEXT NOT NULL DEFAULT 'incomplete',
 reasons TEXT NOT NULL DEFAULT '[]', pricing_version TEXT NOT NULL, price TEXT, estimate TEXT,
 model_changed INTEGER NOT NULL DEFAULT 0, settled INTEGER NOT NULL DEFAULT 0,
 UNIQUE(execution_id,usage_id)
);
CREATE UNIQUE INDEX ai_usage_turn_identity ON ai_usage(provider,thread_id,turn_id) WHERE turn_id IS NOT NULL;
CREATE TABLE ai_usage_observations (
 usage_id TEXT NOT NULL REFERENCES ai_usage, observation_hash TEXT NOT NULL, thread_id TEXT NOT NULL,
 turn_id TEXT NOT NULL, total TEXT NOT NULL, last TEXT NOT NULL, observed_at TEXT NOT NULL,
 PRIMARY KEY(usage_id,observation_hash)
);
CREATE TRIGGER ai_usage_observations_immutable BEFORE UPDATE ON ai_usage_observations BEGIN SELECT RAISE(ABORT,'Usage observations immutable'); END;
CREATE TRIGGER ai_usage_observations_retained BEFORE DELETE ON ai_usage_observations BEGIN SELECT RAISE(ABORT,'Usage observations retained'); END;
CREATE TABLE ai_usage_responses (
 usage_id TEXT NOT NULL REFERENCES ai_usage, response_id TEXT NOT NULL,
 payload TEXT NOT NULL, observed_at TEXT NOT NULL, PRIMARY KEY(usage_id,response_id)
);
CREATE TRIGGER ai_usage_responses_immutable BEFORE UPDATE ON ai_usage_responses BEGIN SELECT RAISE(ABORT,'Usage responses immutable'); END;
CREATE TRIGGER ai_usage_responses_retained BEFORE DELETE ON ai_usage_responses BEGIN SELECT RAISE(ABORT,'Usage responses retained'); END;
-- Existing records have no authoritative retained usage. Preserve their original attribution
-- and timestamps; never infer zero usage or silently exclude pre-migration executions.
INSERT INTO ai_usage (usage_id,execution_id,worker_id,activity,run_id,scope_id,cycle_id,request_id,started_at,finished_at,status,reasons,pricing_version)
 SELECT e.execution_id,e.execution_id,e.worker_id,coalesce(t.kind,e.origin),s.run_id,s.scope_id,l.occurrence_id,e.request_id,e.started_at,e.finished_at,e.status,
 '["Usage incomplete: execution predates usage telemetry"]','unavailable-pre-schema-20'
 FROM executions e LEFT JOIN investment_team_executions te USING(execution_id)
 LEFT JOIN investment_team_scopes s USING(scope_id) LEFT JOIN investment_loop_executions l USING(execution_id)
 LEFT JOIN discussion_turns t ON t.request_id=e.request_id;
CREATE TABLE investment_activity_invocations (
 execution_id TEXT PRIMARY KEY REFERENCES executions, scope_id TEXT NOT NULL REFERENCES investment_team_scopes,
 run_id TEXT NOT NULL REFERENCES investment_runs, cycle_id TEXT, worker_id TEXT NOT NULL REFERENCES workers,
 request_id TEXT NOT NULL UNIQUE REFERENCES conversation_requests, reserved_at TEXT NOT NULL,
 provider TEXT, model TEXT, thread_id TEXT, turn_id TEXT, eligibility TEXT,
 state TEXT NOT NULL CHECK(state IN ('reserved','active','settled','unknown')), finished_at TEXT,
 terminal_status TEXT, policy TEXT NOT NULL
);
CREATE INDEX investment_activity_window ON investment_activity_invocations(reserved_at);
CREATE TRIGGER activity_identity_immutable BEFORE UPDATE ON investment_activity_invocations
 WHEN NEW.execution_id!=OLD.execution_id OR NEW.scope_id!=OLD.scope_id OR NEW.run_id!=OLD.run_id OR NEW.worker_id!=OLD.worker_id
 OR NEW.cycle_id IS NOT OLD.cycle_id OR NEW.request_id!=OLD.request_id OR NEW.reserved_at!=OLD.reserved_at OR NEW.policy!=OLD.policy
 BEGIN SELECT RAISE(ABORT,'Activity reservation immutable'); END;
CREATE TRIGGER activity_no_refund BEFORE DELETE ON investment_activity_invocations BEGIN SELECT RAISE(ABORT,'Activity reservations never refund'); END;
CREATE TABLE investment_activity_clock (singleton INTEGER PRIMARY KEY CHECK(singleton=1),high_water INTEGER NOT NULL);
`;
