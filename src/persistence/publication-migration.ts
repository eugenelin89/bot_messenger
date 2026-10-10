/** INV-07: passive publication records only; no destinations, keys or grants are seeded. */
export const migration17 = `
CREATE TABLE investment_public_channels (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL, source_run_id TEXT, destination_id TEXT NOT NULL,
 experiment_id TEXT NOT NULL, run_id TEXT NOT NULL, policy_version TEXT NOT NULL,
 generation TEXT NOT NULL, key_id TEXT NOT NULL, reconciled_generation TEXT, publisher_instance TEXT NOT NULL, UNIQUE(source_id,destination_id)
);
CREATE TABLE investment_public_intents (
 channel_id TEXT NOT NULL REFERENCES investment_public_channels(id), journal_version INTEGER NOT NULL,
 journal_hash TEXT NOT NULL, recorded_at TEXT NOT NULL, PRIMARY KEY(channel_id,journal_version)
);
CREATE TRIGGER investment_public_capture AFTER INSERT ON investment_journal BEGIN
 INSERT INTO investment_public_intents SELECT id,NEW.version,NEW.journal_hash,NEW.recorded_at
 FROM investment_public_channels WHERE source_run_id=NEW.run_id;
END;
CREATE TABLE investment_public_identities (
 channel_id TEXT NOT NULL REFERENCES investment_public_channels(id), kind TEXT NOT NULL,
 private_id TEXT NOT NULL, public_id TEXT NOT NULL UNIQUE, PRIMARY KEY(channel_id,kind,private_id)
);
CREATE TABLE investment_public_sequences (
 channel_id TEXT NOT NULL REFERENCES investment_public_channels(id), source_key TEXT NOT NULL,
 sequence INTEGER NOT NULL, PRIMARY KEY(channel_id,source_key), UNIQUE(channel_id,sequence)
);
CREATE TABLE investment_public_previews (
 id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES investment_public_channels(id),
 digest TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), created_at TEXT NOT NULL
);
CREATE TABLE investment_public_grants (
 id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES investment_public_channels(id),
 preview_id TEXT NOT NULL REFERENCES investment_public_previews(id), envelope TEXT NOT NULL CHECK(json_valid(envelope)),
 state TEXT NOT NULL CHECK(state IN ('active','paused','revoked')), created_at TEXT NOT NULL
);
CREATE TABLE investment_public_captures (
 id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES investment_public_channels(id),
 grant_id TEXT NOT NULL REFERENCES investment_public_grants(id), journal_version INTEGER NOT NULL,
 material_hash TEXT NOT NULL, recorded_at TEXT NOT NULL
);
CREATE TABLE investment_public_jobs (
 id TEXT PRIMARY KEY, channel_id TEXT NOT NULL REFERENCES investment_public_channels(id),
 grant_id TEXT NOT NULL REFERENCES investment_public_grants(id), position INTEGER NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('batch','content','heartbeat')), body BLOB NOT NULL, digest TEXT NOT NULL,
 path TEXT NOT NULL, content_type TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('queued','sending','uncertain','delivered','blocked')),
 attempted_at TEXT, retry_at TEXT, lease TEXT, created_at TEXT NOT NULL, receipt TEXT, needs_receipt INTEGER NOT NULL DEFAULT 0 CHECK(needs_receipt IN (0,1)),
 UNIQUE(channel_id,position)
);
CREATE TABLE investment_public_attempts (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES investment_public_jobs(id),
 channel_id TEXT NOT NULL, grant_id TEXT NOT NULL, operation TEXT NOT NULL,
 generation TEXT NOT NULL, key_id TEXT NOT NULL, attempted_at TEXT NOT NULL, bytes INTEGER NOT NULL
);
CREATE TABLE investment_public_results (
 attempt_id TEXT PRIMARY KEY REFERENCES investment_public_attempts(id),
 state TEXT NOT NULL, detail TEXT NOT NULL, recorded_at TEXT NOT NULL, receipt TEXT
);
CREATE TABLE investment_public_controls (
 id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, recorded_at TEXT NOT NULL
);
${['investment_public_captures','investment_public_sequences','investment_public_intents','investment_public_identities','investment_public_previews','investment_public_attempts','investment_public_results','investment_public_controls'].map(t=>`
CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Publication evidence immutable'); END;
CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Publication evidence retained'); END;`).join('\n')}
CREATE TRIGGER investment_public_jobs_payload BEFORE UPDATE ON investment_public_jobs
WHEN NEW.id<>OLD.id OR NEW.channel_id<>OLD.channel_id OR NEW.position<>OLD.position OR NEW.kind<>OLD.kind OR NEW.body<>OLD.body OR NEW.digest<>OLD.digest OR NEW.path<>OLD.path OR NEW.content_type<>OLD.content_type OR NEW.created_at<>OLD.created_at
BEGIN SELECT RAISE(ABORT,'Publication job bytes immutable'); END;
CREATE TRIGGER investment_public_jobs_retained BEFORE DELETE ON investment_public_jobs BEGIN SELECT RAISE(ABORT,'Publication jobs retained'); END;
CREATE TRIGGER investment_public_grants_retained BEFORE DELETE ON investment_public_grants BEGIN SELECT RAISE(ABORT,'Publication consent retained'); END;
CREATE TRIGGER investment_public_grants_envelope BEFORE UPDATE ON investment_public_grants
WHEN NEW.id<>OLD.id OR NEW.channel_id<>OLD.channel_id OR NEW.preview_id<>OLD.preview_id OR NEW.envelope<>OLD.envelope OR NEW.created_at<>OLD.created_at
BEGIN SELECT RAISE(ABORT,'Publication consent immutable'); END;
`;
