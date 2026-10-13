/** Passive non-content coordination. No service, configuration, key or authority is seeded. */
export const migration29=`
CREATE TABLE ask_coordination (
 service_id TEXT PRIMARY KEY,generation TEXT NOT NULL,instance TEXT NOT NULL,
 configuration_revision TEXT,configuration_hash TEXT,configuration TEXT CHECK(configuration IS NULL OR json_valid(configuration)),
 observed_at TEXT NOT NULL,next_poll TEXT NOT NULL,next_claim TEXT NOT NULL,hold_reason TEXT,
 max_attempts INTEGER NOT NULL CHECK(max_attempts BETWEEN 1 AND 2000),expires_at TEXT NOT NULL,
 CHECK((configuration_revision IS NULL AND configuration_hash IS NULL AND configuration IS NULL)
 OR (configuration_revision IS NOT NULL AND configuration_hash IS NOT NULL AND configuration IS NOT NULL))
);
CREATE TABLE ask_wire_operations (
 id TEXT PRIMARY KEY,service_id TEXT NOT NULL,generation TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('configuration','claim','renew','status','answer','receipt','control_sync')),
 descriptor TEXT NOT NULL CHECK(json_valid(descriptor)),intent_digest TEXT NOT NULL,
 created_at TEXT NOT NULL,retry_at TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','applied','held')),
 attempts INTEGER NOT NULL DEFAULT 0,response_digest TEXT,last_problem TEXT,
 FOREIGN KEY(service_id) REFERENCES ask_coordination(service_id)
);
CREATE TABLE ask_wire_attempts (
 id TEXT PRIMARY KEY,operation_id TEXT NOT NULL REFERENCES ask_wire_operations(id),created_at TEXT NOT NULL,
 proof TEXT CHECK(proof IS NULL OR json_valid(proof)),
 state TEXT NOT NULL CHECK(state IN ('prepared','transmitted','not_sent','unknown','response')),
 response_digest TEXT
);
CREATE TABLE ask_claim_custody (
 service_id TEXT NOT NULL,question_id TEXT NOT NULL,claim_id TEXT NOT NULL,generation TEXT NOT NULL,
 lease_expires_at TEXT NOT NULL,claim_digest TEXT NOT NULL,question_digest TEXT NOT NULL,
 updated_at TEXT NOT NULL,last_status TEXT CHECK(last_status IS NULL OR json_valid(last_status)),last_status_digest TEXT,
 PRIMARY KEY(service_id,question_id),UNIQUE(service_id,claim_id)
);
CREATE TABLE ask_claim_epochs (
 service_id TEXT NOT NULL,question_id TEXT NOT NULL,claim_id TEXT NOT NULL,generation TEXT NOT NULL,
 lease_expires_at TEXT NOT NULL,claim_digest TEXT NOT NULL,question_digest TEXT NOT NULL,
 PRIMARY KEY(service_id,claim_id)
);
CREATE TRIGGER ask_claim_epoch_identity BEFORE UPDATE ON ask_claim_epochs
 WHEN NEW.service_id<>OLD.service_id OR NEW.question_id<>OLD.question_id OR NEW.claim_id<>OLD.claim_id
 OR NEW.generation<>OLD.generation OR NEW.question_digest<>OLD.question_digest OR NEW.lease_expires_at<OLD.lease_expires_at
 BEGIN SELECT RAISE(ABORT,'Ask claim epoch immutable'); END;
CREATE TRIGGER ask_wire_identity BEFORE UPDATE ON ask_wire_operations
 WHEN NEW.id<>OLD.id OR NEW.service_id<>OLD.service_id OR NEW.generation<>OLD.generation
 OR NEW.kind<>OLD.kind OR NEW.descriptor<>OLD.descriptor OR NEW.intent_digest<>OLD.intent_digest
 OR NEW.created_at<>OLD.created_at OR NEW.attempts<OLD.attempts
 OR (OLD.state<>'pending' AND NEW.state<>OLD.state)
 BEGIN SELECT RAISE(ABORT,'Ask wire identity immutable'); END;
CREATE TRIGGER ask_attempt_identity BEFORE UPDATE ON ask_wire_attempts
 WHEN NEW.id<>OLD.id OR NEW.operation_id<>OLD.operation_id OR NEW.created_at<>OLD.created_at
 OR (OLD.proof IS NOT NULL AND NEW.proof IS NOT OLD.proof)
 OR (OLD.response_digest IS NOT NULL AND NEW.response_digest IS NOT OLD.response_digest)
 BEGIN SELECT RAISE(ABORT,'Ask wire attempt immutable'); END;
CREATE TRIGGER ask_claim_identity BEFORE UPDATE ON ask_claim_custody
 WHEN NEW.service_id<>OLD.service_id OR NEW.question_id<>OLD.question_id
 OR NEW.generation<>OLD.generation OR NEW.question_digest<>OLD.question_digest
 OR NEW.lease_expires_at<OLD.lease_expires_at
 BEGIN SELECT RAISE(ABORT,'Ask claim identity immutable'); END;
CREATE TRIGGER ask_coordination_identity BEFORE UPDATE ON ask_coordination
 WHEN NEW.service_id<>OLD.service_id OR NEW.generation<>OLD.generation OR NEW.max_attempts<>OLD.max_attempts
 OR NEW.expires_at<>OLD.expires_at OR (OLD.hold_reason IS NOT NULL AND NEW.hold_reason IS NOT OLD.hold_reason)
 BEGIN SELECT RAISE(ABORT,'Ask coordination custody immutable'); END;
${['ask_wire_operations','ask_wire_attempts','ask_claim_custody','ask_claim_epochs','ask_coordination'].map(t=>`CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Ask coordination evidence retained'); END;`).join('\n')}
`;
