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
