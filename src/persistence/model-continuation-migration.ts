/** Passive immutable preparation only; independent approval is required for every effect. */
export const migration31=`
CREATE TABLE observed_model_continuations (
 scope_id TEXT PRIMARY KEY REFERENCES investment_team_scopes,
 loop_id TEXT NOT NULL UNIQUE REFERENCES investment_loops,
 authority_id TEXT NOT NULL UNIQUE,
 digest TEXT NOT NULL,input TEXT NOT NULL CHECK(json_valid(input)),created_at TEXT NOT NULL
);
CREATE TRIGGER model_continuation_immutable BEFORE UPDATE ON observed_model_continuations
 BEGIN SELECT RAISE(ABORT,'Model continuation is immutable'); END;
CREATE TRIGGER model_continuation_retained BEFORE DELETE ON observed_model_continuations
 BEGIN SELECT RAISE(ABORT,'Model continuation is retained'); END;
`;
