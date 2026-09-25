export interface Repository {
  repository_id: string; product_name: string; canonical_root: string; default_branch: string;
  base_commit: string; current_commit: string; created_by: string; workflow_task_id: string;
  spec_artifact_id: string; status: string; created_at: string; updated_at: string;
}
export interface Allocation {
  allocation_id: string; repository_id: string; worker_id: string; task_id: string;
  branch_name: string; worktree_path: string; base_commit: string; module: 'calculate' | 'format';
  status: string; created_at: string; updated_at: string;
}
export interface Validation {
  command: string; passed: boolean; exit_code: number | null; output: string; checked_at: string;
}
export interface Submission {
  submission_id: string; repository_id: string; task_id: string; worker_id: string;
  execution_id: string; allocation_id: string; base_commit: string; branch_name: string;
  commit_sha: string; changed_paths: string; validation: string; summary: string; created_at: string;
}
export interface Review {
  review_id: string; repository_id: string; task_id: string; worker_id: string; execution_id: string;
  source_commits: string; status: 'approved' | 'changes_required'; artifact_id: string; created_at: string;
}
export interface Integration {
  integration_id: string; repository_id: string; review_id: string; base_commit: string;
  source_commits: string; candidate_commit: string | null; final_commit: string | null;
  strategy: string; validation: string | null; status: string; error: string | null;
  requested_by: string; execution_id: string; created_at: string; updated_at: string;
}
