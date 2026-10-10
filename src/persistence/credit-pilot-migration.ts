export const migration21=`
CREATE TABLE investment_credit_pilot (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1), pilot_id TEXT NOT NULL UNIQUE,
 scope_id TEXT NOT NULL UNIQUE REFERENCES investment_team_scopes, model TEXT NOT NULL,
 disposable_root TEXT NOT NULL, reload_confirmed_at TEXT NOT NULL, approved_at TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('held','released','running','stopped')),
 request_id TEXT REFERENCES conversation_requests, execution_id TEXT REFERENCES executions,
 inspected_execution_id TEXT REFERENCES executions, account_fingerprint TEXT CHECK(account_fingerprint IS NULL OR length(account_fingerprint)=64)
);
CREATE TRIGGER credit_pilot_identity BEFORE UPDATE ON investment_credit_pilot
 WHEN NEW.pilot_id!=OLD.pilot_id OR NEW.scope_id!=OLD.scope_id OR NEW.model!=OLD.model
 OR (OLD.account_fingerprint IS NOT NULL AND NEW.account_fingerprint IS NOT OLD.account_fingerprint)
 OR NEW.disposable_root!=OLD.disposable_root OR NEW.reload_confirmed_at!=OLD.reload_confirmed_at OR NEW.approved_at!=OLD.approved_at
 BEGIN SELECT RAISE(ABORT,'Pilot approval is immutable'); END;
CREATE TRIGGER credit_pilot_retained BEFORE DELETE ON investment_credit_pilot BEGIN SELECT RAISE(ABORT,'Pilot approval retained'); END;
`;
