/** INV-06: empty immutable evidence/receipts; no source grant, run, or workload. */
export const migration16 = `
CREATE TABLE investment_market_records (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('policy','calendar','instrument','price','action')),
 hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), recorded_at TEXT NOT NULL
);
CREATE TABLE investment_market_attempts (
 request_id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, cache_key TEXT NOT NULL,
 policy_id TEXT NOT NULL REFERENCES investment_market_records(id), attempted_at TEXT NOT NULL,
 network INTEGER NOT NULL CHECK(network IN (0,1))
);
CREATE INDEX investment_market_attempt_policy ON investment_market_attempts(policy_id,attempted_at);
CREATE TABLE investment_market_results (
 request_id TEXT PRIMARY KEY REFERENCES investment_market_attempts(request_id),
 hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), completed_at TEXT NOT NULL
);
${['investment_market_records','investment_market_attempts','investment_market_results'].map(t=>`
CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Market evidence is immutable'); END;
CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Market evidence is retained'); END;`).join('\n')}
`;
