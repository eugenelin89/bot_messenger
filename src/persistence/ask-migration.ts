/** Passive, non-content privacy journal. No service, scope, key or authority is seeded. */
export const migration26 = `
CREATE TABLE ask_control_services (
 service_id TEXT PRIMARY KEY, generation TEXT NOT NULL, instance TEXT NOT NULL,
 binding_hash TEXT NOT NULL, next_cursor TEXT, pending_id TEXT, barrier_id TEXT,
 pages INTEGER NOT NULL DEFAULT 0, observed_at TEXT NOT NULL
);
CREATE TABLE ask_control_requests (
 service_id TEXT NOT NULL REFERENCES ask_control_services(service_id), sync_id TEXT NOT NULL,
 generation TEXT NOT NULL, instance TEXT NOT NULL, request TEXT NOT NULL CHECK(json_valid(request)),
 request_hash TEXT NOT NULL, created_at TEXT NOT NULL, retain_until TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','complete','abandoned','reconciled')),
 response TEXT CHECK(response IS NULL OR json_valid(response)), response_hash TEXT,
 resolved_by TEXT,
 CHECK((state='complete' AND response IS NOT NULL AND response_hash IS NOT NULL) OR (state<>'complete' AND response IS NULL AND response_hash IS NULL)),
 CHECK((state='reconciled' AND resolved_by IS NOT NULL) OR (state<>'reconciled' AND resolved_by IS NULL)),
 PRIMARY KEY(service_id,sync_id),
 FOREIGN KEY(service_id,resolved_by) REFERENCES ask_control_requests(service_id,sync_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE UNIQUE INDEX ask_one_pending_sync ON ask_control_requests(service_id) WHERE state='pending';
CREATE TABLE ask_privacy_controls (
 service_id TEXT NOT NULL REFERENCES ask_control_services(service_id), control_id TEXT NOT NULL,
 control_hash TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)),
 conversation_id TEXT NOT NULL, question_id TEXT, action TEXT NOT NULL CHECK(action IN ('cancel','delete','expire')),
 effective_at TEXT NOT NULL, purge_by TEXT NOT NULL, suppression_until TEXT NOT NULL,
 application_version TEXT NOT NULL CHECK(application_version='suppression-journal-v1'),
 application_hash TEXT NOT NULL, recorded_at TEXT NOT NULL, acknowledged_at TEXT,
 PRIMARY KEY(service_id,control_id)
);
CREATE INDEX ask_suppression_target ON ask_privacy_controls(service_id,conversation_id,question_id);
CREATE TRIGGER ask_control_identity BEFORE UPDATE ON ask_privacy_controls
WHEN NEW.service_id<>OLD.service_id OR NEW.control_id<>OLD.control_id OR NEW.control_hash<>OLD.control_hash
 OR NEW.payload<>OLD.payload OR NEW.conversation_id<>OLD.conversation_id OR NEW.question_id IS NOT OLD.question_id
 OR NEW.action<>OLD.action OR NEW.effective_at<>OLD.effective_at OR NEW.purge_by<>OLD.purge_by
 OR NEW.suppression_until<>OLD.suppression_until OR NEW.application_version<>OLD.application_version
 OR NEW.application_hash<>OLD.application_hash OR NEW.recorded_at<>OLD.recorded_at
 OR (OLD.acknowledged_at IS NOT NULL AND NEW.acknowledged_at IS NOT OLD.acknowledged_at)
BEGIN SELECT RAISE(ABORT,'Ask control identity immutable'); END;
CREATE TRIGGER ask_request_identity BEFORE UPDATE ON ask_control_requests
WHEN NEW.service_id<>OLD.service_id OR NEW.sync_id<>OLD.sync_id OR NEW.generation<>OLD.generation
 OR NEW.instance<>OLD.instance OR NEW.request<>OLD.request OR NEW.request_hash<>OLD.request_hash
 OR NEW.created_at<>OLD.created_at OR NEW.retain_until<>OLD.retain_until
 OR (OLD.state<>'pending' AND (NEW.response IS NOT OLD.response OR NEW.response_hash IS NOT OLD.response_hash))
 OR NOT ((NEW.state=OLD.state AND NEW.resolved_by IS OLD.resolved_by)
   OR (OLD.state='pending' AND NEW.state IN ('complete','abandoned') AND NEW.resolved_by IS NULL)
   OR (OLD.state='abandoned' AND NEW.state='reconciled' AND EXISTS(
     SELECT 1 FROM ask_control_requests r JOIN ask_control_services s USING(service_id)
     WHERE r.service_id=OLD.service_id AND r.sync_id=NEW.resolved_by AND r.state='complete'
     AND r.generation=OLD.generation AND r.instance=s.instance)))
BEGIN SELECT RAISE(ABORT,'Ask sync identity immutable'); END;
`;

/** Metadata only. Raw Ask content and delivery bodies never belong in Company backups. */
export const migration27 = `
CREATE TABLE ask_content_services (
 service_id TEXT PRIMARY KEY, store_id TEXT NOT NULL UNIQUE, generation TEXT NOT NULL,
 instance TEXT NOT NULL, observed_at TEXT NOT NULL,
 custody_held INTEGER NOT NULL DEFAULT 0 CHECK(custody_held IN (0,1))
);
CREATE TABLE ask_imports (
 service_id TEXT NOT NULL REFERENCES ask_content_services(service_id), question_id TEXT NOT NULL,
 session_id TEXT NOT NULL, conversation_id TEXT NOT NULL, question_hash TEXT NOT NULL,
 question_digest TEXT NOT NULL, content_ref TEXT NOT NULL UNIQUE,
 received_at TEXT NOT NULL, expires_at TEXT NOT NULL, retain_until TEXT NOT NULL, metadata_until TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('content_pending','available','answer_reserved','answer_staged','delivered','suppressed','expired','held')),
 answer_id TEXT, answer_digest TEXT, answer_generated_at TEXT,
 receipt TEXT CHECK(receipt IS NULL OR json_valid(receipt)), receipt_hash TEXT,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(service_id,question_id), UNIQUE(service_id,answer_id),
 CHECK((answer_id IS NULL AND answer_digest IS NULL AND answer_generated_at IS NULL)
    OR (answer_id IS NOT NULL AND answer_digest IS NOT NULL AND answer_generated_at IS NOT NULL)),
 CHECK((receipt IS NULL AND receipt_hash IS NULL) OR (receipt IS NOT NULL AND receipt_hash IS NOT NULL))
);
CREATE INDEX ask_import_conversation ON ask_imports(service_id,conversation_id,question_id);
CREATE TABLE ask_content_controls (
 service_id TEXT NOT NULL REFERENCES ask_content_services(service_id), control_id TEXT NOT NULL,
 control_hash TEXT NOT NULL, store_id TEXT NOT NULL,
 application_version TEXT NOT NULL CHECK(application_version='private-content-v1'),
 state TEXT NOT NULL CHECK(state IN ('pending','applied')), suppression_until TEXT NOT NULL,
 PRIMARY KEY(service_id,control_id)
);
CREATE TRIGGER ask_import_identity BEFORE UPDATE ON ask_imports
WHEN NEW.service_id<>OLD.service_id OR NEW.question_id<>OLD.question_id
 OR NEW.session_id<>OLD.session_id OR NEW.conversation_id<>OLD.conversation_id
 OR NEW.question_hash<>OLD.question_hash OR NEW.question_digest<>OLD.question_digest
 OR NEW.content_ref<>OLD.content_ref OR NEW.received_at<>OLD.received_at OR NEW.expires_at<>OLD.expires_at
 OR NEW.retain_until>OLD.retain_until OR NEW.metadata_until<>OLD.metadata_until
 OR (OLD.answer_id IS NOT NULL AND (NEW.answer_id IS NOT OLD.answer_id
   OR NEW.answer_digest IS NOT OLD.answer_digest OR NEW.answer_generated_at IS NOT OLD.answer_generated_at))
 OR (OLD.receipt IS NOT NULL AND (NEW.receipt IS NOT OLD.receipt OR NEW.receipt_hash IS NOT OLD.receipt_hash))
 OR (OLD.state IN ('suppressed','expired','held') AND NEW.state NOT IN ('suppressed','expired','held'))
 OR (OLD.state='held' AND NEW.state<>'held')
BEGIN SELECT RAISE(ABORT,'Ask import identity immutable'); END;
CREATE TRIGGER ask_content_custody_hold BEFORE UPDATE ON ask_content_services
WHEN OLD.custody_held=1 AND NEW.custody_held<>1
BEGIN SELECT RAISE(ABORT,'Ask custody hold immutable'); END;
CREATE TRIGGER ask_content_control_identity BEFORE UPDATE ON ask_content_controls
WHEN NEW.service_id<>OLD.service_id OR NEW.control_id<>OLD.control_id OR NEW.control_hash<>OLD.control_hash
 OR NEW.store_id<>OLD.store_id OR NEW.application_version<>OLD.application_version
 OR NEW.suppression_until<>OLD.suppression_until OR (OLD.state='applied' AND NEW.state<>'applied')
BEGIN SELECT RAISE(ABORT,'Ask content control identity immutable'); END;
`;
