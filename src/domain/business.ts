import {createHash} from 'node:crypto';
import {requireThat, strictObject, textField} from './model.js';

export const BUSINESS_POLICY = 'github-markdown-v1';
export const BUSINESS_MODES = ['real_live','real_read_only','public_source','owner_provided','sanitized_snapshot','simulated_fixture'] as const;
export type BusinessMode = typeof BUSINESS_MODES[number];
export const businessHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const contentHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const gitBlobHash = (value: string) => createHash('sha1').update(`blob ${Buffer.byteLength(value)}\0`).update(value).digest('hex');

export interface MarkdownTarget { repository: string; repository_id: number; branch: string; path: string }
export interface BusinessGrant {
  grant_id: string; mandate_id: string; worker_id: string; provider: 'github'; adapter: string;
  target: string; credential_ref: string; policy_version: string; mode: 'real_live'|'simulated_fixture';
  max_actions: number; expires_at: string; created_at: string; issued_by: 'human'; revoked_at: string|null;
}
export interface BusinessBaseline {
  outcome: string; measurement_source: string; window: string; unit: string; denominator: string|null;
  freshness: string; missing_fields: string; privacy: string; expected_lag: string; attribution_limitations: string;
}
export interface BusinessEvidence {
  evidence_id: string; mandate_id: string; cycle_id: string|null; action_id: string|null; grant_id: string|null;
  mode: BusinessMode; category: 'baseline'|'operational'|'business'; provider: string; source_identity: string;
  observed_at: string|null; period: string; retrieved_at: string; metric: string; value: string|null; unit: string;
  baseline: string; segmentation: string; missingness: string; freshness: string; privacy_scope: string;
  reliability: string; source_ref: string; source_hash: string; body: string; sha256: string;
  admitted_by: 'human'|'trusted_adapter'; withdrawn_at: string|null;
}
export type ActionStatus = 'awaiting_approval'|'approved'|'executing'|'succeeded'|'failed'|'outcome_unknown'|'denied'|'revoked'|'cancelled';
export interface ExternalAction {
  action_id: string; mandate_id: string; mandate_version: number; cycle_id: string; initiative_id: string;
  decision_id: string; worker_id: string; execution_id: string; grant_id: string; provider: 'github';
  adapter: string; action_type: 'replace_existing_markdown'; target: string; credential_ref: string;
  policy_version: string; baseline_id: string; expected_blob: string; expected_head: string;
  previous_content: string; content: string; content_sha256: string; content_blob: string;
  edit: string; commit_message: string; rationale: string; measurement: string; risk: string;
  compensation: string; privacy: string; estimated_cost: string; idempotency_key: string;
  intent_hash: string; expires_at: string; created_at: string; status: ActionStatus;
  updated_at: string; error: string|null; compensation_for: string|null;
}
export interface BusinessApproval {
  approval_id: string; action_id: string; intent_hash: string; decision: 'approved'|'denied';
  decided_by: 'human'; decided_at: string; expires_at: string;
}
export interface BusinessAttempt {
  attempt_id: string; action_id: string; intent_hash: string; state: 'preparing'|'transmitting'|'settled'|'outcome_unknown';
  started_at: string; transmitted_at: string|null; finished_at: string|null; error: string|null;
}
export interface BusinessReceipt {
  receipt_id: string; action_id: string; attempt_id: string; provider: string; adapter: string; mode: BusinessMode;
  target: string; intent_hash: string; content_sha256: string; operation_id: string;
  provider_time: string|null; recorded_at: string; result: string; sha256: string;
}
export interface MarkdownSnapshot {
  target: MarkdownTarget; content: string; blob: string; head: string; retrieved_at: string;
  source_ref: string; provider_time: string|null;
}
export interface MarkdownResult { commit: string; blob: string; parent: string; provider_time: string|null; request_id: string|null; confirmation?:'provider_response'|'reconciled_correlation' }
export interface BusinessAdapter {
  readonly identity: string; readonly mode: 'real_live'|'simulated_fixture';
  read(target: MarkdownTarget, credentialRef: string, signal?:AbortSignal): Promise<MarkdownSnapshot>;
  replace(action: ExternalAction, beforeTransmit: () => void): Promise<MarkdownResult>;
  reconcile(action: ExternalAction): Promise<MarkdownResult|null>;
}

export function markdownTarget(value: unknown): MarkdownTarget {
  const a = strictObject(value, ['repository','repository_id','branch','path']);
  const repository = textField(a,'repository',160), branch = textField(a,'branch',120), path = textField(a,'path',240);
  requireThat(/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]{1,100}$/.test(repository), 'Invalid GitHub repository');
  requireThat(Number.isSafeInteger(a.repository_id) && Number(a.repository_id)>0, 'Stable repository ID required');
  requireThat(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) && !branch.includes('..') && !branch.includes('//') && !branch.endsWith('/') && !branch.endsWith('.lock'), 'Invalid exact branch');
  requireThat(/^[A-Za-z0-9_-][A-Za-z0-9_./-]*\.md$/.test(path) && !path.split('/').some(x=>!x||x==='.'||x==='..') && !/(^|\/)AGENTS\.md$/i.test(path) && !path.toLowerCase().startsWith('.github/'), 'Only an existing ordinary Markdown document is supported');
  return {repository,repository_id:Number(a.repository_id),branch,path};
}
export function baselineDefinition(value: unknown): BusinessBaseline {
  const keys=['outcome','measurement_source','window','unit','denominator','freshness','missing_fields','privacy','expected_lag','attribution_limitations'];
  const a=strictObject(value,keys), result:Record<string,string|null>={};
  for(const key of keys) result[key]=key==='denominator'&&a[key]===null?null:textField(a,key,1000);
  return result as unknown as BusinessBaseline;
}
export function exactEdit(previous: string, value: unknown) {
  const a=strictObject(value,['old_text','new_text']);
  const old=textField(a,'old_text',8000);
  requireThat(typeof a.new_text==='string'&&a.new_text.length<=8000,'Replacement must be bounded text');
  requireThat(previous.indexOf(old)>=0 && previous.indexOf(old)===previous.lastIndexOf(old),'Exact old text must occur once in the baseline');
  const content=previous.replace(old,()=>a.new_text as string);
  requireThat(content!==previous && Buffer.byteLength(content)<=65536 && !content.includes('\0') && Buffer.from(content).toString('utf8')===content,'Expected a changed UTF-8 document within 64 KiB');
  return {content,edit:{old_text:old,new_text:a.new_text}};
}
export function approvedIntent(action: ExternalAction) {
  const {status,updated_at,error,intent_hash,...immutable}=action;
  return immutable;
}
