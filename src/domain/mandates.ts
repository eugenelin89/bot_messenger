/** Strategic direction and typed trusted bounds are separate. Prose never grants tools. */
export const MANDATE_SCHEMA = 'mandate-review-v1';
/** Minimum first-due dispatch window. end_at remains an inclusive hard cutoff;
 * this admits ordinary timer jitter, not a promise of capacity or an extension. */
export const MIN_REVIEW_DISPATCH_WINDOW_SECONDS = 30;
export const EVIDENCE_MODES = ['real_read_only','public_source','owner_provided','sanitized_snapshot','simulated_fixture','real_live'] as const;
export type EvidenceMode = typeof EVIDENCE_MODES[number];
export type MandateStatus = 'draft'|'active'|'paused'|'blocked'|'completed'|'stopped'|'cancelled';
export interface MandateEnvelope {
  internal_tasks:boolean; working_groups:boolean; public_research:boolean; worker_schedules:boolean;
  max_executions:number; max_tasks:number; max_groups:number; max_research_operations:number;
  max_pending_work:number; max_cycle_minutes:number; max_cycles:number;
  min_interval_seconds:number; max_horizon_days:number; max_occurrences:number; max_active_schedules:number;
  timezone:string; evidence_modes:EvidenceMode[];
}
export const DEFAULT_MANDATE_ENVELOPE:MandateEnvelope = Object.freeze({
  internal_tasks:true,working_groups:true,public_research:false,worker_schedules:true,
  max_executions:40,max_tasks:3,max_groups:1,max_research_operations:16,max_pending_work:2,
  max_cycle_minutes:60,max_cycles:4,min_interval_seconds:60,max_horizon_days:7,
  max_occurrences:4,max_active_schedules:1,timezone:'America/Vancouver',evidence_modes:[...EVIDENCE_MODES],
});
export interface Mandate {
  mandate_id:string; owner_id:string; title:string; objective:string; success_criteria:string; stop_criteria:string;
  constraints:string; resources:string; envelope:string; coordinator_id:string; status:MandateStatus;
  version:number; activated_at:string|null; current_cycle_id:string|null; strategic_state:string;
  created_at:string; updated_at:string;
}
export interface OperatingCycle {
  cycle_id:string; mandate_id:string; mandate_version:number; number:number; occurrence_id:string|null;
  state:'active'|'waiting'|'closed'|'blocked'|'cancelled'; trigger:string; executions_reserved:number;
  tasks_created:number; groups_created:number; failures:number; retry_at:string|null;
  deadline:string; summary:string|null; error:string|null; created_at:string; closed_at:string|null;
}
export interface ReviewTurn {
  turn_id:string; cycle_id:string; request_id:string; output:string|null; advanced:number; created_at:string;
}
export interface Initiative {
  initiative_id:string; mandate_id:string; cycle_id:string; title:string; mechanism:string; expected_outcome:string;
  assumptions:string; status:'proposed'|'active'|'stopped'; created_by:string; execution_id:string; created_at:string;
}
export interface StrategicDecision {
  decision_id:string; mandate_id:string; cycle_id:string; initiative_id:string|null; previous_id:string|null;
  disposition:'continue'|'iterate'|'pivot'|'stop'|'scale'; recommendation:string; rationale:string; alternatives:string;
  evidence_ids:string; contrary_evidence:string; unknowns:string; missing_evidence:string|null;
  worker_id:string; execution_id:string; created_at:string;
}
export interface Observation {
  observation_id:string; mandate_id:string; cycle_id:string|null; initiative_id:string|null;
  mode:EvidenceMode; name:string; value:string|null; unit:string|null; observed_at:string|null; period:string|null;
  recorded_at:string; source:string; provenance:string; classification:'mandate_private'; limitations:string;
  missingness:string; body:string; sha256:string; admitted_by:string; withdrawn_at:string|null;
}
export type Recurrence = {kind:'once'} | {kind:'interval';seconds:number} | {kind:'daily';local_time:string};
export interface ReviewSchedule {
  schedule_id:string; mandate_id:string; initiative_id:string|null; owner_id:string; creator_id:string;
  purpose:string; coordinator_id:string; timezone:string; recurrence:string; end_at:string; occurrence_limit:number;
  consumed:number; version:number; status:'active'|'paused'|'cancelled'|'exhausted'; next_due:string|null;
  overlap_policy:'hold_one'; missed_policy:'coalesce'; created_at:string; updated_at:string;
}
export interface ReviewOccurrence {
  occurrence_id:string; schedule_id:string; schedule_version:number; mandate_id:string;
  due_at:string; through_at:string; missed_count:number; state:'due'|'held'|'queued'|'completed'|'blocked'|'cancelled'|'superseded';
  cycle_id:string|null; reason:string|null; created_at:string; completed_at:string|null;
}
