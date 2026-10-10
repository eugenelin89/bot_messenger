import type {TurnLimits} from '../investment-team/types.js';
export interface LoopEnvelope {
 scopeId:string; sessions:string[]; researchMinutes:number; maxCycleExecutions:number;
 maxDailyExecutions:number; maxRunExecutions:number;
 dailyLimits:TurnLimits; runLimits:TurnLimits; maxStageAttempts:number; retrySeconds:number;
}
export interface Loop {
 loop_id:string;scope_id:string;envelope:string;digest:string;plan_revision:number;
 state:'draft'|'active'|'paused'|'blocked'|'stopped'|'finished';generation:number;
 reason:string|null;created_at:string;updated_at:string;
}
export type Stage='research'|'cutoff'|'open'|'expire'|'mark';
export interface Occurrence {
 occurrence_id:string;loop_id:string;plan_digest:string;plan_revision:number;session:string;stage:Stage;due_at:string;expires_at:string;
 state:'pending'|'running'|'complete'|'missed'|'cancelled'|'blocked';generation:number;
 attempts:number;retry_at:string|null;reason:string|null;result:string|null;created_at:string;updated_at:string;
}
export interface InvestmentUsage {inputTokens:number;outputTokens:number;costMicros:number}
