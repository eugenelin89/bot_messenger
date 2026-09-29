// SQL only: no host, network, runtime or existing-domain side effects.
export const migration6 = `
CREATE TABLE client_hq (singleton INTEGER PRIMARY KEY CHECK(singleton=1), hq_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE TRIGGER client_hq_immutable BEFORE UPDATE ON client_hq BEGIN SELECT RAISE(ABORT,'HQ identity is immutable'); END;
CREATE TRIGGER client_hq_retained BEFORE DELETE ON client_hq BEGIN SELECT RAISE(ABORT,'HQ identity is retained'); END;
CREATE TABLE remote_devices (
 device_id TEXT PRIMARY KEY, owner_principal_id TEXT NOT NULL REFERENCES principals,
 public_key TEXT NOT NULL, key_algorithm TEXT NOT NULL CHECK(key_algorithm='Ed25519'), fingerprint TEXT NOT NULL,
 display_name TEXT NOT NULL, platform TEXT NOT NULL, app_version TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','active','revoked','denied')), capabilities TEXT NOT NULL,
 created_at TEXT NOT NULL, confirmed_at TEXT, last_seen_at TEXT, revoked_at TEXT
);
CREATE UNIQUE INDEX remote_active_key ON remote_devices(fingerprint) WHERE state IN ('pending','active');
CREATE TRIGGER remote_device_identity_immutable BEFORE UPDATE OF device_id,owner_principal_id,public_key,key_algorithm,fingerprint,capabilities,created_at ON remote_devices
BEGIN SELECT RAISE(ABORT,'Device identity and authority are immutable'); END;
CREATE TRIGGER remote_device_state BEFORE UPDATE OF state ON remote_devices
WHEN NOT ((OLD.state='pending' AND NEW.state IN ('active','denied')) OR (OLD.state='active' AND NEW.state='revoked'))
BEGIN SELECT RAISE(ABORT,'Invalid device transition'); END;
CREATE TRIGGER remote_device_retained BEFORE DELETE ON remote_devices BEGIN SELECT RAISE(ABORT,'Device history is retained'); END;
CREATE TABLE client_pairings (
 pairing_id TEXT PRIMARY KEY, hq_id TEXT NOT NULL REFERENCES client_hq(hq_id), owner_principal_id TEXT NOT NULL REFERENCES principals,
 secret_hash TEXT NOT NULL, capabilities TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('open','claimed','confirmed','denied','expired')),
 device_id TEXT REFERENCES remote_devices, created_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE client_challenges (
 challenge_id TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES remote_devices, nonce TEXT NOT NULL,
 expires_at TEXT NOT NULL, consumed_at TEXT
);
CREATE INDEX client_challenges_device ON client_challenges(device_id,expires_at);
CREATE TABLE client_tokens (
 token_hash TEXT PRIMARY KEY, device_id TEXT NOT NULL REFERENCES remote_devices, created_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE INDEX client_tokens_device ON client_tokens(device_id,expires_at);
CREATE TABLE client_receipts (
 device_id TEXT NOT NULL REFERENCES remote_devices, principal_id TEXT NOT NULL REFERENCES principals,
 client_request_id TEXT NOT NULL, method TEXT NOT NULL, path TEXT NOT NULL, request_hash TEXT NOT NULL,
 status INTEGER NOT NULL, response TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
 interrupt_execution_id TEXT REFERENCES executions, PRIMARY KEY(device_id,client_request_id)
);
CREATE TRIGGER client_receipts_immutable BEFORE UPDATE ON client_receipts BEGIN SELECT RAISE(ABORT,'Client result is immutable'); END;
CREATE INDEX client_receipts_expiry ON client_receipts(expires_at);
CREATE TABLE client_events (
 cursor INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, worker_id TEXT, task_id TEXT, execution_id TEXT, created_at TEXT NOT NULL
);
CREATE TRIGGER client_audit_event AFTER INSERT ON audit_events BEGIN
 INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES (
 CASE WHEN NEW.execution_id IS NOT NULL THEN 'execution.changed' WHEN NEW.task_id IS NOT NULL THEN 'task.changed'
 WHEN NEW.worker_id IS NOT NULL THEN 'worker.changed' ELSE 'state.changed' END,
 NEW.worker_id,NEW.task_id,NEW.execution_id,NEW.created_at);
END;
CREATE TRIGGER client_message_event AFTER INSERT ON messages BEGIN
 INSERT INTO client_events(type,worker_id,task_id,execution_id,created_at) VALUES ('message.created',NEW.recipient_worker_id,NEW.related_task_id,NEW.execution_id,NEW.created_at);
END;
CREATE TRIGGER client_events_bound AFTER INSERT ON client_events BEGIN
 DELETE FROM client_events WHERE cursor<=NEW.cursor-10000;
END;
`;
