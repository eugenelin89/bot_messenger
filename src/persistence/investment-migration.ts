/** INV-05: additive, empty by default. No authority, run, schedule or model work is seeded. */
export const migration15 = `
CREATE TABLE investment_runs (
 run_id TEXT PRIMARY KEY, configuration TEXT NOT NULL CHECK(json_valid(configuration)),
 configuration_hash TEXT NOT NULL, evidence_mode TEXT NOT NULL CHECK(evidence_mode='synthetic_fixture'),
 created_at TEXT NOT NULL, head_version INTEGER NOT NULL DEFAULT 0 CHECK(head_version>=0),
 head_hash TEXT, checkpoint_hash TEXT
);
CREATE TABLE investment_journal (
 run_id TEXT NOT NULL REFERENCES investment_runs, version INTEGER NOT NULL CHECK(version>0),
 transaction_id TEXT NOT NULL UNIQUE, operation_id TEXT NOT NULL, request_hash TEXT NOT NULL,
 previous_hash TEXT, journal_hash TEXT NOT NULL, recorded_at TEXT NOT NULL,
 payload TEXT NOT NULL CHECK(json_valid(payload)), PRIMARY KEY(run_id,version), UNIQUE(run_id,operation_id)
);
CREATE TABLE investment_outbox (
 run_id TEXT NOT NULL, journal_version INTEGER NOT NULL, event_id TEXT NOT NULL UNIQUE,
 dependency_event_id TEXT REFERENCES investment_outbox(event_id),
 state TEXT NOT NULL DEFAULT 'disabled' CHECK(state='disabled'),
 projection TEXT NOT NULL CHECK(json_valid(projection)), projection_hash TEXT NOT NULL,
 PRIMARY KEY(run_id,journal_version), FOREIGN KEY(run_id,journal_version) REFERENCES investment_journal(run_id,version)
);
CREATE TABLE investment_receipts (
 run_id TEXT NOT NULL REFERENCES investment_runs, request_id TEXT NOT NULL, request_hash TEXT NOT NULL,
 journal_version INTEGER NOT NULL, PRIMARY KEY(run_id,request_id),
 FOREIGN KEY(run_id,journal_version) REFERENCES investment_journal(run_id,version)
);
CREATE TRIGGER investment_configuration_immutable BEFORE UPDATE OF run_id,configuration,configuration_hash,evidence_mode,created_at ON investment_runs
 BEGIN SELECT RAISE(ABORT,'Simulation configuration is frozen'); END;
CREATE TRIGGER investment_run_retained BEFORE DELETE ON investment_runs
 BEGIN SELECT RAISE(ABORT,'Simulation runs are retained'); END;
CREATE TRIGGER investment_contiguous BEFORE INSERT ON investment_journal
 WHEN NEW.version != (SELECT head_version+1 FROM investment_runs WHERE run_id=NEW.run_id)
 OR NEW.previous_hash IS NOT (SELECT head_hash FROM investment_runs WHERE run_id=NEW.run_id)
 BEGIN SELECT RAISE(ABORT,'Invalid journal predecessor'); END;
CREATE TRIGGER investment_head_guard BEFORE UPDATE OF head_version,head_hash,checkpoint_hash ON investment_runs
 WHEN NEW.head_version != OLD.head_version+1 OR NOT EXISTS(
 SELECT 1 FROM investment_journal j JOIN investment_outbox o ON j.run_id=o.run_id AND j.version=o.journal_version
 WHERE j.run_id=NEW.run_id AND j.version=NEW.head_version AND j.journal_hash=NEW.head_hash
 AND json_extract(j.payload,'$.checkpointHash')=NEW.checkpoint_hash)
 BEGIN SELECT RAISE(ABORT,'Head requires committed journal and disabled outbox'); END;
${['investment_journal','investment_outbox','investment_receipts'].map(t=>`
CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Investment history is immutable'); END;
CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Investment history is retained'); END;`).join('\n')}
`;
