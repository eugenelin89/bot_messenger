/** Additive only: old rows, fields, IDs and authority are untouched. */
export const migration14 = `
CREATE TABLE business_grants (
 grant_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, worker_id TEXT NOT NULL REFERENCES workers,
 provider TEXT NOT NULL CHECK(provider='github'), adapter TEXT NOT NULL, target TEXT NOT NULL, credential_ref TEXT NOT NULL,
 policy_version TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('real_live','simulated_fixture')),
 max_actions INTEGER NOT NULL CHECK(max_actions BETWEEN 1 AND 3), expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
 issued_by TEXT NOT NULL REFERENCES principals CHECK(issued_by='human'), revoked_at TEXT
);
CREATE TABLE business_evidence (
 evidence_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, cycle_id TEXT REFERENCES operating_cycles,
 action_id TEXT REFERENCES external_actions, grant_id TEXT REFERENCES business_grants,
 mode TEXT NOT NULL CHECK(mode IN ('real_live','real_read_only','public_source','owner_provided','sanitized_snapshot','simulated_fixture')),
 category TEXT NOT NULL CHECK(category IN ('baseline','operational','business')), provider TEXT NOT NULL, source_identity TEXT NOT NULL,
 observed_at TEXT, period TEXT NOT NULL, retrieved_at TEXT NOT NULL, metric TEXT NOT NULL, value TEXT, unit TEXT NOT NULL,
 baseline TEXT NOT NULL, segmentation TEXT NOT NULL, missingness TEXT NOT NULL, freshness TEXT NOT NULL, privacy_scope TEXT NOT NULL,
 reliability TEXT NOT NULL, source_ref TEXT NOT NULL, source_hash TEXT NOT NULL, body TEXT NOT NULL, sha256 TEXT NOT NULL,
 admitted_by TEXT NOT NULL CHECK(admitted_by IN ('human','trusted_adapter')), withdrawn_at TEXT
);
CREATE TABLE business_snapshots (
 evidence_id TEXT PRIMARY KEY REFERENCES business_evidence, snapshot TEXT NOT NULL
);
CREATE TABLE external_actions (
 action_id TEXT PRIMARY KEY, mandate_id TEXT NOT NULL REFERENCES mandates, mandate_version INTEGER NOT NULL,
 cycle_id TEXT NOT NULL REFERENCES operating_cycles, initiative_id TEXT NOT NULL REFERENCES initiatives,
 decision_id TEXT NOT NULL REFERENCES strategic_decisions, worker_id TEXT NOT NULL REFERENCES workers,
 execution_id TEXT NOT NULL REFERENCES executions, grant_id TEXT NOT NULL REFERENCES business_grants,
 provider TEXT NOT NULL CHECK(provider='github'), adapter TEXT NOT NULL, action_type TEXT NOT NULL CHECK(action_type='replace_existing_markdown'),
 target TEXT NOT NULL, credential_ref TEXT NOT NULL, policy_version TEXT NOT NULL,
 baseline_id TEXT NOT NULL REFERENCES business_evidence, expected_blob TEXT NOT NULL, expected_head TEXT NOT NULL,
 previous_content TEXT NOT NULL, content TEXT NOT NULL, content_sha256 TEXT NOT NULL, content_blob TEXT NOT NULL,
 edit TEXT NOT NULL, commit_message TEXT NOT NULL, rationale TEXT NOT NULL, measurement TEXT NOT NULL,
 risk TEXT NOT NULL, compensation TEXT NOT NULL, privacy TEXT NOT NULL, estimated_cost TEXT NOT NULL,
 idempotency_key TEXT NOT NULL UNIQUE, intent_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('awaiting_approval','approved','executing','succeeded','failed','outcome_unknown','denied','revoked','cancelled')),
 updated_at TEXT NOT NULL, error TEXT, compensation_for TEXT REFERENCES external_actions,
 UNIQUE(grant_id,baseline_id,content_sha256)
);
CREATE TABLE business_approvals (
 approval_id TEXT PRIMARY KEY, action_id TEXT NOT NULL UNIQUE REFERENCES external_actions, intent_hash TEXT NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN ('approved','denied')), decided_by TEXT NOT NULL REFERENCES principals CHECK(decided_by='human'),
 decided_at TEXT NOT NULL, expires_at TEXT NOT NULL
);
CREATE TABLE business_attempts (
 attempt_id TEXT PRIMARY KEY, action_id TEXT NOT NULL UNIQUE REFERENCES external_actions, intent_hash TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('preparing','transmitting','settled','outcome_unknown')),
 started_at TEXT NOT NULL, transmitted_at TEXT, finished_at TEXT, error TEXT
);
CREATE TABLE business_receipts (
 receipt_id TEXT PRIMARY KEY, action_id TEXT NOT NULL UNIQUE REFERENCES external_actions,
 attempt_id TEXT NOT NULL UNIQUE REFERENCES business_attempts, provider TEXT NOT NULL, adapter TEXT NOT NULL,
 mode TEXT NOT NULL, target TEXT NOT NULL, intent_hash TEXT NOT NULL, content_sha256 TEXT NOT NULL,
 operation_id TEXT NOT NULL, provider_time TEXT, recorded_at TEXT NOT NULL, result TEXT NOT NULL, sha256 TEXT NOT NULL
);
CREATE TABLE business_reads (
 read_id TEXT PRIMARY KEY, grant_id TEXT NOT NULL REFERENCES business_grants, execution_id TEXT REFERENCES executions,
 call_id TEXT, request_hash TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','succeeded','failed')),
 evidence_id TEXT REFERENCES business_evidence, created_at TEXT NOT NULL, error TEXT,
 UNIQUE(execution_id,call_id)
);
CREATE UNIQUE INDEX one_business_resource_effect ON external_actions(json_extract(target,'$.repository_id'),json_extract(target,'$.branch'),json_extract(target,'$.path')) WHERE status IN ('executing','outcome_unknown');
CREATE TABLE business_controls (
 control_id TEXT PRIMARY KEY, action_id TEXT REFERENCES external_actions, grant_id TEXT REFERENCES business_grants,
 operation TEXT NOT NULL CHECK(operation IN ('cancel','revoke','request_compensation')), actor TEXT NOT NULL CHECK(actor='human'), created_at TEXT NOT NULL,
 CHECK((action_id IS NULL)<>(grant_id IS NULL)), CHECK(operation<>'request_compensation' OR action_id IS NOT NULL)
);
CREATE TABLE business_reconciliations (
 reconciliation_id TEXT PRIMARY KEY, action_id TEXT NOT NULL REFERENCES external_actions,
 state TEXT NOT NULL CHECK(state IN ('pending','confirmed','inconclusive')), created_at TEXT NOT NULL, finished_at TEXT,
 error TEXT
);
CREATE UNIQUE INDEX one_business_reconciliation ON business_reconciliations(action_id) WHERE state='pending';
CREATE UNIQUE INDEX one_business_intent_per_execution ON external_actions(execution_id);
CREATE TRIGGER business_action_transition BEFORE UPDATE OF status ON external_actions WHEN OLD.status<>NEW.status AND NOT (
 (OLD.status='awaiting_approval' AND NEW.status IN ('approved','denied','revoked','cancelled')) OR
 (OLD.status='approved' AND NEW.status IN ('executing','revoked','cancelled')) OR
 (OLD.status='executing' AND NEW.status IN ('succeeded','failed','outcome_unknown')) OR
 (OLD.status='outcome_unknown' AND NEW.status='succeeded'))
 BEGIN SELECT RAISE(ABORT,'Invalid external action transition'); END;
CREATE TRIGGER business_attempt_transition BEFORE UPDATE OF state ON business_attempts WHEN OLD.state<>NEW.state AND NOT (
 (OLD.state='preparing' AND NEW.state IN ('transmitting','settled')) OR
 (OLD.state='transmitting' AND NEW.state IN ('settled','outcome_unknown')) OR
 (OLD.state='outcome_unknown' AND NEW.state='settled'))
 BEGIN SELECT RAISE(ABORT,'Invalid business attempt transition'); END;
CREATE TRIGGER business_grant_identity BEFORE UPDATE OF grant_id,mandate_id,worker_id,provider,adapter,target,credential_ref,policy_version,mode,max_actions,expires_at,created_at,issued_by ON business_grants
 BEGIN SELECT RAISE(ABORT,'Business authority is immutable'); END;
CREATE TRIGGER business_grant_revocation BEFORE UPDATE OF revoked_at ON business_grants WHEN OLD.revoked_at IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'Business revocation is terminal'); END;
CREATE TRIGGER business_action_owner BEFORE INSERT ON external_actions
 WHEN NOT EXISTS(SELECT 1 FROM mandates m JOIN operating_cycles c USING(mandate_id)
 JOIN strategic_decisions d ON d.cycle_id=c.cycle_id JOIN initiatives i ON i.initiative_id=d.initiative_id
 JOIN business_grants g ON g.mandate_id=m.mandate_id JOIN executions e ON e.execution_id=NEW.execution_id
 JOIN mandate_turns t ON t.request_id=e.request_id
 JOIN business_evidence b ON b.evidence_id=NEW.baseline_id
 WHERE m.mandate_id=NEW.mandate_id AND m.version=NEW.mandate_version AND m.status='active'
 AND m.current_cycle_id=NEW.cycle_id AND c.cycle_id=NEW.cycle_id AND c.state='active'
 AND d.decision_id=NEW.decision_id AND d.mandate_id=m.mandate_id AND d.worker_id=NEW.worker_id
 AND i.initiative_id=NEW.initiative_id AND i.mandate_id=m.mandate_id
 AND g.grant_id=NEW.grant_id AND g.worker_id=NEW.worker_id AND g.target=NEW.target AND g.revoked_at IS NULL
 AND g.policy_version=NEW.policy_version AND g.credential_ref=NEW.credential_ref AND g.adapter=NEW.adapter
 AND e.worker_id=NEW.worker_id AND e.status='running' AND t.cycle_id=c.cycle_id AND t.output IS NULL
 AND b.mandate_id=m.mandate_id AND b.grant_id=g.grant_id AND b.withdrawn_at IS NULL)
 BEGIN SELECT RAISE(ABORT,'Invalid external action lineage'); END;
CREATE TRIGGER business_approval_owner BEFORE INSERT ON business_approvals
 WHEN NOT EXISTS(SELECT 1 FROM external_actions a WHERE a.action_id=NEW.action_id AND a.intent_hash=NEW.intent_hash AND a.status='awaiting_approval' AND a.expires_at=NEW.expires_at)
 BEGIN SELECT RAISE(ABORT,'Approval must bind exact pending effect'); END;
CREATE TRIGGER business_attempt_owner BEFORE INSERT ON business_attempts
 WHEN NOT EXISTS(SELECT 1 FROM external_actions a JOIN business_approvals p USING(action_id)
 WHERE a.action_id=NEW.action_id AND a.intent_hash=NEW.intent_hash AND p.intent_hash=a.intent_hash AND p.decision='approved' AND a.status='approved')
 BEGIN SELECT RAISE(ABORT,'Attempt needs exact approval'); END;
CREATE TRIGGER business_receipt_owner BEFORE INSERT ON business_receipts
 WHEN NOT EXISTS(SELECT 1 FROM external_actions a JOIN business_attempts t USING(action_id)
 JOIN business_grants g ON g.grant_id=a.grant_id
 WHERE a.action_id=NEW.action_id AND t.attempt_id=NEW.attempt_id AND a.intent_hash=NEW.intent_hash
 AND a.provider=NEW.provider AND a.adapter=NEW.adapter AND g.mode=NEW.mode
 AND a.target=NEW.target AND a.content_sha256=NEW.content_sha256 AND t.state IN ('transmitting','outcome_unknown'))
 BEGIN SELECT RAISE(ABORT,'Receipt ownership mismatch'); END;
CREATE TRIGGER business_evidence_owner BEFORE INSERT ON business_evidence
 WHEN (NEW.cycle_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM operating_cycles WHERE cycle_id=NEW.cycle_id AND mandate_id=NEW.mandate_id))
 OR (NEW.grant_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM business_grants WHERE grant_id=NEW.grant_id AND mandate_id=NEW.mandate_id))
 OR (NEW.action_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM external_actions WHERE action_id=NEW.action_id AND mandate_id=NEW.mandate_id AND grant_id=NEW.grant_id))
 BEGIN SELECT RAISE(ABORT,'Business evidence scope mismatch'); END;
CREATE TRIGGER business_action_immutable BEFORE UPDATE OF action_id,mandate_id,mandate_version,cycle_id,initiative_id,decision_id,worker_id,execution_id,grant_id,provider,adapter,action_type,target,credential_ref,policy_version,baseline_id,expected_blob,expected_head,previous_content,content,content_sha256,content_blob,edit,commit_message,rationale,measurement,risk,compensation,privacy,estimated_cost,idempotency_key,intent_hash,expires_at,created_at,compensation_for ON external_actions
 BEGIN SELECT RAISE(ABORT,'Approved intent fields are immutable'); END;
CREATE TRIGGER business_evidence_immutable BEFORE UPDATE OF evidence_id,mandate_id,cycle_id,action_id,grant_id,mode,category,provider,source_identity,observed_at,period,retrieved_at,metric,value,unit,baseline,segmentation,missingness,freshness,privacy_scope,reliability,source_ref,source_hash,body,sha256,admitted_by ON business_evidence
 BEGIN SELECT RAISE(ABORT,'Business evidence originals are immutable'); END;
CREATE TRIGGER business_evidence_withdrawal BEFORE UPDATE OF withdrawn_at ON business_evidence WHEN OLD.withdrawn_at IS NOT NULL
 BEGIN SELECT RAISE(ABORT,'Business withdrawal is terminal'); END;
CREATE TRIGGER business_attempt_identity BEFORE UPDATE OF attempt_id,action_id,intent_hash,started_at ON business_attempts
 BEGIN SELECT RAISE(ABORT,'Attempt identity is immutable'); END;
${['business_grants','business_evidence','business_snapshots','external_actions','business_approvals','business_attempts','business_receipts','business_reads','business_controls','business_reconciliations'].map(t=>`CREATE TRIGGER ${t}_retained BEFORE DELETE ON ${t} BEGIN SELECT RAISE(ABORT,'Business history is retained'); END;`).join('\n')}
${['business_snapshots','business_approvals','business_receipts','business_controls'].map(t=>`CREATE TRIGGER ${t}_immutable BEFORE UPDATE ON ${t} BEGIN SELECT RAISE(ABORT,'Business original is immutable'); END;`).join('\n')}
`;
