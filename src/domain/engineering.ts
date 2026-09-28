export interface Repository {
  repository_id: string; product_name: string; canonical_root: string; default_branch: string;
  base_commit: string; current_commit: string; created_by: string; workflow_task_id: string | null;
  spec_artifact_id: string | null; status: string; created_at: string; updated_at: string;
  project_id: string; source_kind: string; remote_provider: string | null; remote_identity: string | null;
  remote_url: string | null; remote_policy: 'none' | 'fetch_only' | 'approved_push'; remote_sha: string | null; remote_state: string;
}
export interface Allocation {
  allocation_id: string; repository_id: string; worker_id: string; task_id: string;
  branch_name: string; worktree_path: string; base_commit: string; module: string | null;
  status: string; created_at: string; updated_at: string;
  write_scope: string; protected_paths: string; recipe_ids: string; policy_snapshot: string; manifest_hash: string;
  revision_round: number; format_version: number;
}
export interface Validation {
  command: string; passed: boolean; exit_code: number | null; output: string; checked_at: string;
}
export interface Submission {
  submission_id: string; repository_id: string; task_id: string; worker_id: string;
  execution_id: string; allocation_id: string; base_commit: string; branch_name: string;
  commit_sha: string; changed_paths: string; validation: string; summary: string; created_at: string;
  commit_list: string | null; revision_round: number; previous_submission_id: string | null;
}
export interface Review {
  review_id: string; repository_id: string; task_id: string; worker_id: string; execution_id: string;
  source_commits: string; status: 'approved' | 'changes_required'; artifact_id: string; created_at: string;
  round_id: string | null;
}
export interface Integration {
  integration_id: string; repository_id: string; review_id: string; base_commit: string;
  source_commits: string; candidate_commit: string | null; final_commit: string | null;
  strategy: string; validation: string | null; status: string; error: string | null;
  requested_by: string; execution_id: string; created_at: string; updated_at: string;
  round_id: string | null; submission_ids: string | null; delivery_task_id: string | null;
}
