export const CAPABILITIES = ['internal_message', 'create_task', 'create_worker', 'read_workspace', 'write_workspace', 'run_local_tools', 'manage_repository', 'repository_read', 'repository_write_owned', 'run_repo_tests', 'inspect_git_status', 'submit_engineering_result', 'review_repository_change', 'request_integration'] as const;
export type Capability = typeof CAPABILITIES[number];
// Prompt 01 deliberately grants no arbitrary local process execution.
export const COMPANY_CEILING: readonly Capability[] = CAPABILITIES.filter(c => c !== 'run_local_tools');
export const RESEARCH_CAPABILITIES: readonly Capability[] = ['internal_message', 'read_workspace', 'write_workspace'];
export const ENGINEER_CAPABILITIES: readonly Capability[] = [...RESEARCH_CAPABILITIES, 'repository_read', 'repository_write_owned', 'run_repo_tests', 'inspect_git_status', 'submit_engineering_result'];
export const REVIEWER_CAPABILITIES: readonly Capability[] = [...RESEARCH_CAPABILITIES, 'review_repository_change'];
export const CTO_CAPABILITIES: readonly Capability[] = [...RESEARCH_CAPABILITIES, 'create_worker', 'create_task', 'manage_repository', 'request_integration'];
export const CEO_CAPABILITIES: readonly Capability[] = [...RESEARCH_CAPABILITIES, 'create_worker', 'create_task'];
export const PROFILES = {
  researcher: RESEARCH_CAPABILITIES, product_manager: RESEARCH_CAPABILITIES,
  cto: CTO_CAPABILITIES, engineer: ENGINEER_CAPABILITIES, reviewer: REVIEWER_CAPABILITIES,
} as const;
export type Profile = keyof typeof PROFILES;
export const CTO_DELEGATABLE: readonly Capability[] = [...new Set([...ENGINEER_CAPABILITIES, ...REVIEWER_CAPABILITIES])];
export const TASK_STATUSES = ['queued', 'working', 'completed', 'blocked', 'failed', 'cancelled', 'awaiting_approval'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
export type WorkerStatus = 'idle' | 'queued' | 'working' | 'blocked' | 'failed' | 'awaiting_approval';
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'interrupted' | 'awaiting_approval';

export interface Principal { principal_id: string; type: 'human' | 'bot' | 'system'; display_name: string; enabled: number; created_at: string }
export interface Worker {
  worker_id: string; principal_id: string; display_name: string; title: string; role: string; mission: string;
  manager_worker_id: string | null; runtime_type: string; workspace_path: string;
  lifecycle: 'persistent' | 'temporary'; status: WorkerStatus; capability_profile: Capability[];
  delegatable_capabilities: Capability[]; enabled: number; created_by_worker_id: string | null;
  created_at: string; updated_at: string;
}
export interface Task {
  task_id: string; requester: string; assignee_worker_id: string; objective: string;
  acceptance_criteria: string; constraints: string; parent_task_id: string | null;
  status: TaskStatus; blocking_reason: string | null; result_summary: string | null;
  kind: 'research' | 'product' | 'spec' | 'delivery' | 'engineering' | 'review'; created_execution_id: string | null;
  dispatch_reason: string; created_at: string; updated_at: string;
}
export interface Execution {
  execution_id: string; task_id: string; worker_id: string; runtime_reference: string | null;
  status: ExecutionStatus; started_at: string; finished_at: string | null; error: string | null;
  interruption_reason: string | null;
}
export interface RuntimeBinding {
  worker_id: string; runtime_type: string; runtime_reference: string; workspace_path: string; created_at: string;
}
export interface Artifact {
  artifact_id: string; task_id: string; execution_id: string; type: string; path_or_reference: string;
  description: string; sha256: string; created_at: string;
}
export interface Message {
  message_id: string; channel_id: string; sender_principal_id: string; recipient_worker_id: string | null;
  body: string; reply_to_message_id: string | null; related_task_id: string | null;
  execution_id: string | null; created_at: string;
}
export interface AuditEvent {
  event_id: string; type: string; actor_principal_id: string; worker_id: string | null;
  task_id: string | null; execution_id: string | null; detail: string; created_at: string;
}

export class DomainError extends Error {}
export function requireThat(value: unknown, message: string): asserts value {
  if (!value) throw new DomainError(message);
}
const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  queued: ['working', 'blocked', 'cancelled'], working: ['completed', 'blocked', 'failed', 'cancelled', 'awaiting_approval'],
  blocked: ['queued', 'completed', 'cancelled'], failed: ['queued', 'cancelled'],
  awaiting_approval: ['queued', 'cancelled'], completed: [], cancelled: [],
};
export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  requireThat(transitions[from]?.includes(to), `Invalid task transition: ${from} → ${to}`);
}
export function assertCapabilities(requested: readonly Capability[], ceiling: readonly Capability[]): void {
  requireThat(new Set(requested).size === requested.length, 'Duplicate capability');
  requireThat(requested.every(c => CAPABILITIES.includes(c) && ceiling.includes(c) && COMPANY_CEILING.includes(c)), 'Capability exceeds delegatable authority or company ceiling');
}
export function strictObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'Expected an object');
  const object = value as Record<string, unknown>;
  requireThat(Object.keys(object).every(k => keys.includes(k)), 'Unknown or identity-bearing argument');
  return object;
}
export function textField(object: Record<string, unknown>, key: string, max = 8000): string {
  const value = object[key];
  requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= max, `Invalid ${key} (1–${max} characters)`);
  return value.trim();
}
