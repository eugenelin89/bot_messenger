import type {ExecutionPolicy} from '../usage/policy.js';
import type { Proposal } from '../investment/types.js';
export const INVESTMENT_SCHEMA='investment-discussion-v1';
export const PAPER_TOOLS=['paper_inspect','paper_propose','paper_read_proposal','paper_review','paper_submit'] as const;
export interface TurnLimits { inputTokens:number; outputTokens:number; maxCostMicros:number }
export interface TeamEnvelope {
 executionPolicy?:ExecutionPolicy;
 runId:string; groupId:string; audience:'public_candidate';
 participants:{workerId:string;name:string;responsibility:string}[];
 proposers:string[]; reviewers:string[]; submitters:string[];
 expiresAt:string; maxExecutions:number; maxResearch:number; maxProposals:number; maxOrders:number;
 turnLimits:TurnLimits; publicationChannelId:string;
}
export interface TeamScope { scope_id:string;run_id:string;group_id:string;configuration_hash:string;group_scope:number;context_hash:string;envelope:string;digest:string;state:'draft'|'active'|'paused'|'revoked';created_at:string }
export interface PaperNarrative { rationale:string;alternatives:[string,...string[]];risks:[string,...string[]];invalidationCondition:string;contributionIds:string[];evidenceIds:string[] }
export interface PaperProposal {proposal_id:string;scope_id:string;decision_id:string;revision:number;worker_id:string;execution_id:string;proposal_hash:string;simulator_hash:string;command:string;narrative:string;provenance:string;created_at:string}
export interface PaperReview {review_id:string;scope_id:string;proposal_id:string;worker_id:string;execution_id:string;proposal_hash:string;simulator_hash:string;disposition:'approve'|'reject';rationale:string;dissent:string;evidence:string;created_at:string}
export interface PaperInput extends PaperNarrative {decisionId:string;revision:number;action:Proposal['action'];marketObservationIds:string[];order:Proposal['orders'][number]|null}
