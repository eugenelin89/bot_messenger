import { createHash } from 'node:crypto';
import { requireThat, strictObject } from './model.js';

export const PROTECTED_TYPES = ['create_worker_identity', 'disable_worker_identity', 'prepare_worker_project_clone', 'revoke_worker_project_access'] as const;
export type ProtectedType = typeof PROTECTED_TYPES[number];
export interface OSIdentity {
  worker_id: string; backend: 'linux' | 'development'; state: 'unprovisioned' | 'ready' | 'disabled';
  unix_username: string | null; uid: number | null; gid: number | null; home_path: string | null;
  created_at: string | null; disabled_at: string | null; provision_operation_id: string | null;
}
export interface ProtectedOperation {
  operation_id: string; approval_id: string; operation_type: ProtectedType; target_worker_id: string;
  requester_principal_id: string; requester_worker_id: string | null; requesting_execution_id: string | null;
  task_id: string | null; parameters: string; parameter_hash: string; preconditions: string;
  reason: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'denied' | 'expired';
  requested_at: string; result: string | null; error: string | null;
}
export interface Approval {
  approval_id: string; operation_id: string; envelope_hash: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'consumed'; requested_at: string;
  expires_at: string; decided_at: string | null; decided_by: string | null; consumed_at: string | null;
}
export interface ProjectBinding {
  allocation_id: string; worker_id: string; repository_id: string; path: string;
  state: 'pending' | 'ready' | 'revoked'; operation_id: string | null;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  requireThat(value === null || ['string','boolean','number'].includes(typeof value), 'Invalid canonical value');
  return JSON.stringify(value);
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function identityName(workerId: string): string {
  requireThat(/^worker_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(workerId), 'Invalid worker ID');
  return `bsw-${hash(workerId).slice(0,24)}`;
}
export function parseDecision(value: unknown) {
  const a = strictObject(value, ['approval_id','operation_id','decision']);
  requireThat(typeof a.approval_id === 'string' && typeof a.operation_id === 'string' && ['approve','deny'].includes(a.decision as string), 'Invalid approval decision');
  return a as { approval_id: string; operation_id: string; decision: 'approve' | 'deny' };
}
