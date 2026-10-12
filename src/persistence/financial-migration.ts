/** HQ-READY-03: empty research-only records. No provider, grant, worker, timer or I/O. */
export const migration23 = `
CREATE TABLE financial_scopes (
 provider TEXT PRIMARY KEY CHECK(provider='yahoo'), scope_id TEXT NOT NULL UNIQUE,
 hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), recorded_at TEXT NOT NULL
);
CREATE TABLE financial_revocations (
 scope_id TEXT PRIMARY KEY REFERENCES financial_scopes(scope_id), revoked_at TEXT NOT NULL
);
CREATE TABLE financial_requests (
 request_id TEXT PRIMARY KEY, scope_id TEXT NOT NULL REFERENCES financial_scopes(scope_id),
 policy_id TEXT NOT NULL REFERENCES investment_market_records(id), request_key TEXT NOT NULL,
 request_hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), created_at TEXT NOT NULL
);
CREATE INDEX financial_cache ON financial_requests(request_key,created_at);
CREATE TABLE financial_attempts (
 attempt_id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES financial_requests(request_id),
 ordinal INTEGER NOT NULL, endpoint TEXT NOT NULL, query_hash TEXT NOT NULL, started_at TEXT NOT NULL,
 UNIQUE(request_id,ordinal)
);
CREATE TABLE financial_attempt_results (
 attempt_id TEXT PRIMARY KEY REFERENCES financial_attempts(attempt_id), status INTEGER NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes>=0), response_hash TEXT, reason TEXT NOT NULL,
 completed_at TEXT NOT NULL, retry_at TEXT
);
CREATE TABLE financial_payloads (
 attempt_id TEXT PRIMARY KEY REFERENCES financial_attempts(attempt_id), endpoint TEXT NOT NULL,
 parameters TEXT NOT NULL CHECK(json_valid(parameters)), content_type TEXT NOT NULL,
 body TEXT NOT NULL, sha256 TEXT NOT NULL, retrieved_at TEXT NOT NULL
);
CREATE TABLE financial_observations (
 observation_id TEXT PRIMARY KEY, request_key TEXT NOT NULL, content_hash TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision>0), predecessor_id TEXT REFERENCES financial_observations(observation_id),
 policy_id TEXT NOT NULL REFERENCES investment_market_records(id), instrument_id TEXT NOT NULL REFERENCES investment_market_records(id),
 hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), first_retrieved_at TEXT NOT NULL,
 UNIQUE(request_key,revision), UNIQUE(predecessor_id)
);
CREATE INDEX financial_vintages ON financial_observations(request_key,first_retrieved_at);
CREATE TABLE financial_results (
 request_id TEXT PRIMARY KEY REFERENCES financial_requests(request_id), observation_id TEXT REFERENCES financial_observations(observation_id),
 hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), completed_at TEXT NOT NULL
);
CREATE TABLE financial_deliveries (
 delivery_id TEXT PRIMARY KEY, scope_id TEXT NOT NULL REFERENCES financial_scopes(scope_id),
 observation_id TEXT NOT NULL REFERENCES financial_observations(observation_id),
 consumer_id TEXT NOT NULL, delivered_at TEXT NOT NULL, hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload))
);
${['financial_scopes','financial_revocations','financial_requests','financial_attempts','financial_attempt_results','financial_payloads','financial_observations','financial_results','financial_deliveries'].map(t => `
CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Financial history is immutable'); END;
CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Financial history is retained'); END;
`).join('\n')}
`;
