/** Passive, append-only preparation; no migration creates runtime authority. */
export const migration30=`
CREATE TABLE observed_source_continuations (
 scope_id TEXT PRIMARY KEY REFERENCES investment_team_scopes,
 loop_id TEXT NOT NULL UNIQUE REFERENCES investment_loops,
 authority_id TEXT NOT NULL UNIQUE,
 digest TEXT NOT NULL, input TEXT NOT NULL CHECK(json_valid(input)), created_at TEXT NOT NULL
);
CREATE TRIGGER source_continuation_immutable BEFORE UPDATE ON observed_source_continuations
 BEGIN SELECT RAISE(ABORT,'Source continuation is immutable'); END;
CREATE TRIGGER source_continuation_retained BEFORE DELETE ON observed_source_continuations
 BEGIN SELECT RAISE(ABORT,'Source continuation is retained'); END;
`;
