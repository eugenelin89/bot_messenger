import type { DatabaseSync } from 'node:sqlite';
import { DEFAULT_POLICY } from '../domain/projects.js';

// SQL-only migration. Git, filesystem, network and Unix account actions are forbidden.
// Called with foreign keys disabled BEFORE the enclosing migration transaction;
// references retain their original table names while replacements are copied/renamed.
export function migrateProjects(db: DatabaseSync) {
  const tables = ['repositories','allocations','submissions','integrations'];
  const before = Object.fromEntries(tables.map(t => [t, db.prepare(`SELECT * FROM ${t} ORDER BY 1`).all()]));
  db.exec(`
CREATE TABLE projects (
 project_id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('active','archiving','archived')), instructions TEXT NOT NULL,
 policy TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES principals, created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL, legacy INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE runtime_tool_versions (worker_id TEXT PRIMARY KEY REFERENCES workers, schema_version INTEGER NOT NULL);
INSERT INTO runtime_tool_versions SELECT worker_id,4 FROM runtime_bindings;
CREATE TABLE repositories_v5 (
 repository_id TEXT PRIMARY KEY, product_name TEXT NOT NULL, canonical_root TEXT NOT NULL UNIQUE,
 default_branch TEXT NOT NULL, base_commit TEXT, current_commit TEXT, created_by TEXT NOT NULL,
 workflow_task_id TEXT REFERENCES tasks, spec_artifact_id TEXT REFERENCES artifacts,
 status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 project_id TEXT NOT NULL REFERENCES projects, source_kind TEXT NOT NULL,
 remote_provider TEXT, remote_identity TEXT, remote_url TEXT,
 remote_policy TEXT NOT NULL DEFAULT 'none' CHECK(remote_policy IN ('none','fetch_only','approved_push')),
 remote_sha TEXT, remote_state TEXT NOT NULL DEFAULT 'none'
);
CREATE TABLE allocations_v5 (
 allocation_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 worker_id TEXT NOT NULL REFERENCES workers, task_id TEXT NOT NULL UNIQUE REFERENCES tasks,
 branch_name TEXT NOT NULL UNIQUE, worktree_path TEXT NOT NULL UNIQUE, base_commit TEXT NOT NULL,
 module TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 write_scope TEXT NOT NULL, protected_paths TEXT NOT NULL, recipe_ids TEXT NOT NULL,
 policy_snapshot TEXT NOT NULL, manifest_hash TEXT NOT NULL, revision_round INTEGER NOT NULL DEFAULT 1,
 format_version INTEGER NOT NULL DEFAULT 2
);
CREATE TABLE submissions_v5 (
 submission_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 task_id TEXT NOT NULL REFERENCES tasks, worker_id TEXT NOT NULL REFERENCES workers,
 execution_id TEXT NOT NULL REFERENCES executions, allocation_id TEXT NOT NULL REFERENCES allocations,
 base_commit TEXT NOT NULL, branch_name TEXT NOT NULL, commit_sha TEXT NOT NULL,
 changed_paths TEXT NOT NULL, validation TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT NOT NULL,
 commit_list TEXT, revision_round INTEGER NOT NULL DEFAULT 1, previous_submission_id TEXT REFERENCES submissions,
 UNIQUE(allocation_id,commit_sha), UNIQUE(allocation_id,revision_round)
);
CREATE TABLE integrations_v5 (
 integration_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 review_id TEXT NOT NULL REFERENCES reviews, base_commit TEXT NOT NULL, source_commits TEXT NOT NULL,
 candidate_commit TEXT, final_commit TEXT, strategy TEXT NOT NULL, validation TEXT, status TEXT NOT NULL,
 error TEXT, requested_by TEXT NOT NULL REFERENCES workers, execution_id TEXT NOT NULL REFERENCES executions,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 round_id TEXT, submission_ids TEXT, delivery_task_id TEXT REFERENCES tasks
);
CREATE TABLE review_rounds (
 round_id TEXT PRIMARY KEY, repository_id TEXT NOT NULL REFERENCES repositories,
 delivery_task_id TEXT NOT NULL REFERENCES tasks, task_id TEXT NOT NULL UNIQUE REFERENCES tasks,
 round_number INTEGER NOT NULL, base_commit TEXT NOT NULL, submission_ids TEXT NOT NULL,
 packet TEXT NOT NULL, packet_hash TEXT NOT NULL, created_at TEXT NOT NULL, legacy INTEGER NOT NULL DEFAULT 0,
 UNIQUE(delivery_task_id,round_number)
);
ALTER TABLE reviews ADD COLUMN round_id TEXT REFERENCES review_rounds;
CREATE TABLE revision_requests (
 revision_id TEXT PRIMARY KEY, review_id TEXT NOT NULL REFERENCES reviews,
 allocation_id TEXT NOT NULL REFERENCES allocations, source_submission_id TEXT NOT NULL REFERENCES submissions,
 feedback TEXT NOT NULL, revision_round INTEGER NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(review_id,allocation_id)
);
CREATE TABLE allocation_commits (
 allocation_id TEXT NOT NULL REFERENCES allocations, commit_sha TEXT NOT NULL,
 execution_id TEXT NOT NULL REFERENCES executions, operation_id TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL, PRIMARY KEY(allocation_id,commit_sha)
);
CREATE TABLE allocation_releases (
 allocation_id TEXT PRIMARY KEY REFERENCES allocations, operation_id TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL, result TEXT, created_at TEXT NOT NULL
);
CREATE TABLE project_operations (
 operation_id TEXT PRIMARY KEY, approval_id TEXT NOT NULL UNIQUE, operation_type TEXT NOT NULL CHECK(operation_type='remote_push'),
 project_id TEXT NOT NULL REFERENCES projects, repository_id TEXT NOT NULL REFERENCES repositories,
 envelope TEXT NOT NULL, envelope_hash TEXT NOT NULL, reason TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','running','completed','blocked','denied','expired')),
 requested_at TEXT NOT NULL, result TEXT, error TEXT
);
CREATE TABLE project_approvals (
 approval_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL UNIQUE REFERENCES project_operations,
 envelope_hash TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','approved','consumed','denied','expired')),
 requested_at TEXT NOT NULL, expires_at TEXT NOT NULL, decided_at TEXT, decided_by TEXT REFERENCES principals, consumed_at TEXT
);
CREATE TABLE project_operation_receipts (
 operation_id TEXT PRIMARY KEY REFERENCES project_operations, envelope_hash TEXT NOT NULL,
 result TEXT NOT NULL, recorded_at TEXT NOT NULL
);
`);
  // Preserve only known historical facts. No invented human authorship, packet,
  // commit range validation, remote identity or Linux manifest is claimed.
  const policy = JSON.stringify(DEFAULT_POLICY);
  db.prepare(`INSERT INTO projects SELECT 'project_legacy_'||r.repository_id,r.product_name,
    'Migrated Prompt 02–04 repository; historical policy retained explicitly','active','',?,
    w.principal_id,r.created_at,r.updated_at,1 FROM repositories r JOIN workers w ON w.worker_id=r.created_by`).run(policy);
  db.exec(`INSERT INTO repositories_v5 SELECT r.*,'project_legacy_'||repository_id,'legacy_squadstatus',NULL,NULL,NULL,'none',NULL,'none' FROM repositories r;`);
  db.prepare(`INSERT INTO allocations_v5 SELECT a.*,json_array('src/'||module||'.mjs','test/'||module||'.extra.test.mjs'),
    '[]',json_array(module),?,'legacy-unrecorded',1,1 FROM allocations a`).run(policy);
  db.exec(`
INSERT INTO submissions_v5 SELECT s.*,NULL,1,NULL FROM submissions s;
INSERT INTO integrations_v5 SELECT i.*,NULL,NULL,r.workflow_task_id FROM integrations i JOIN repositories r USING(repository_id);
`);
  // Verify every original field before retiring an old table, inside the same
  // transaction. A mismatch leaves the entire retained schema untouched.
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}_v5 ORDER BY 1`).all();
    const old = before[table]!;
    if (rows.length !== old.length || old.some((row, n) => Object.keys(row).some(k => rows[n]![k] !== row[k]))) throw new Error(`Migration lost ${table} history`);
  }
  db.exec(`
DROP TRIGGER submissions_no_update; DROP TRIGGER submissions_no_delete;
DROP TABLE submissions; DROP TABLE allocations; DROP TABLE integrations; DROP TABLE repositories;
ALTER TABLE repositories_v5 RENAME TO repositories;
ALTER TABLE allocations_v5 RENAME TO allocations;
ALTER TABLE submissions_v5 RENAME TO submissions;
ALTER TABLE integrations_v5 RENAME TO integrations;
CREATE INDEX repository_project ON repositories(project_id);
CREATE UNIQUE INDEX legacy_workflow_repository ON repositories(workflow_task_id) WHERE workflow_task_id IS NOT NULL;
CREATE INDEX submission_allocation ON submissions(allocation_id,created_at);
CREATE UNIQUE INDEX one_writer_allocation ON allocations(worker_id) WHERE status IN ('pending_infrastructure','allocating','active','submitting','submitted','reviewed','blocked');
CREATE UNIQUE INDEX one_running_integration ON integrations(repository_id) WHERE status IN ('running','preparing');
CREATE UNIQUE INDEX one_review_integration ON integrations(review_id);
CREATE TRIGGER submissions_no_update BEFORE UPDATE ON submissions BEGIN SELECT RAISE(ABORT,'Submissions are immutable'); END;
CREATE TRIGGER submissions_no_delete BEFORE DELETE ON submissions BEGIN SELECT RAISE(ABORT,'Submissions are immutable'); END;
CREATE TRIGGER allocation_manifest_immutable BEFORE UPDATE OF repository_id,worker_id,task_id,branch_name,worktree_path,base_commit,write_scope,protected_paths,recipe_ids,policy_snapshot,manifest_hash,format_version ON allocations BEGIN SELECT RAISE(ABORT,'Allocation manifest is immutable'); END;
CREATE TRIGGER integrations_terminal_immutable BEFORE UPDATE ON integrations WHEN OLD.status IN ('completed','failed','blocked') BEGIN SELECT RAISE(ABORT,'Integration result is immutable'); END;
CREATE TRIGGER integrations_no_delete BEFORE DELETE ON integrations BEGIN SELECT RAISE(ABORT,'Integration history is retained'); END;
CREATE TRIGGER rounds_no_update BEFORE UPDATE ON review_rounds BEGIN SELECT RAISE(ABORT,'Review round is immutable'); END;
CREATE TRIGGER rounds_no_delete BEFORE DELETE ON review_rounds BEGIN SELECT RAISE(ABORT,'Review round is immutable'); END;
CREATE TRIGGER revisions_no_update BEFORE UPDATE ON revision_requests BEGIN SELECT RAISE(ABORT,'Revision request is immutable'); END;
CREATE TRIGGER revisions_no_delete BEFORE DELETE ON revision_requests BEGIN SELECT RAISE(ABORT,'Revision request is immutable'); END;
CREATE TRIGGER project_operation_envelope BEFORE UPDATE OF approval_id,operation_type,project_id,repository_id,envelope,envelope_hash,reason,requested_at ON project_operations BEGIN SELECT RAISE(ABORT,'Operation envelope is immutable'); END;
CREATE TRIGGER project_operation_terminal BEFORE UPDATE ON project_operations WHEN OLD.status IN ('completed','blocked','denied','expired') BEGIN SELECT RAISE(ABORT,'Operation is terminal'); END;
CREATE TRIGGER project_approval_envelope BEFORE UPDATE OF operation_id,envelope_hash,requested_at,expires_at ON project_approvals BEGIN SELECT RAISE(ABORT,'Approval envelope is immutable'); END;
CREATE TRIGGER project_approval_transition BEFORE UPDATE ON project_approvals
WHEN NOT ((OLD.status='pending' AND NEW.status IN ('approved','denied','expired')) OR (OLD.status='approved' AND NEW.status IN ('consumed','expired')))
OR (NEW.status IN ('approved','denied') AND (NEW.decided_by IS NOT 'human' OR NEW.decided_at IS NULL))
OR (NEW.status='consumed' AND (NEW.decided_by IS NOT 'human' OR NEW.consumed_at IS NULL))
BEGIN SELECT RAISE(ABORT,'Invalid trusted approval transition'); END;
`);
  for (const table of ['project_operations','project_approvals','project_operation_receipts']) {
    db.exec(`CREATE TRIGGER ${table}_no_delete BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT,'Protected history is retained'); END;`);
  }
  db.exec(`CREATE TRIGGER project_receipts_no_update BEFORE UPDATE ON project_operation_receipts BEGIN SELECT RAISE(ABORT,'Receipt is immutable'); END;`);
  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all();
    const old = before[table]!;
    if (rows.length !== old.length || old.some((row, n) => Object.keys(row).some(k => rows[n]![k] !== row[k]))) throw new Error(`Migration lost ${table} history`);
  }
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Project migration foreign-key validation failed');
}
