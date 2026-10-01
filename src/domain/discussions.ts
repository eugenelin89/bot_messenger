export const DISCUSSION_SCHEMA = 'discussion-v1';
export const DISCUSSION_LIMITS = Object.freeze({
  participants: 6, queuedGroups: 8, groups: 500, turns: 24, rounds: 3,
  hardTurns: 40, hardRounds: 5, extensions: 2, extensionTurns: 8,
  minutes: 60, extensionMinutes: 30, outputChars: 8000, transcriptChars: 180000,
  contextChars: 48000, evidenceItems: 32, evidenceChars: 6000, packetChars: 64000,
  synthesisChars: 12000, artifactChars: 32000, synthesisTurns: 6, reservedTurns: 3, questions: 24,
  ownerNotes: 32, toolCalls: 16, retrievalChars: 48000,
});
export type DiscussionState = 'draft'|'active'|'paused'|'blocked'|'stopped'|'completed'|'archived';
export type DiscussionTurnKind = 'organize'|'opening'|'facilitate'|'response'|'synthesis'|'review'|'finalize';
export interface WorkingGroup {
  group_id:string; conversation_id:string; topic:string; desired_output:string; constraints:string;
  created_by:string; initiating_operation:'owner_selected'|'owner_atlas'; eligible_workers:string;
  facilitator_id:string; synthesizer_id:string; state:DiscussionState; scope_version:number;
  revision:number; evidence_revision:number; round:number; turns_used:number; turn_limit:number;
  round_limit:number; extensions_used:number; synthesis_used:number; deadline:string|null;
  allow_incomplete:number; allow_research:number; error:string|null; created_at:string; started_at:string|null;
  updated_at:string;
}
export interface DiscussionTurn {
  turn_id:string; group_id:string; request_id:string; kind:DiscussionTurnKind; round:number;
  prompt:string; contribution_ids:string; evidence_ids:string; seen_revision:number|null;
  seen_evidence_revision:number|null; output:string|null; advanced:number; created_at:string;
}
export interface GroupEvidence {
  evidence_id:string; group_id:string; kind:'owner_material'|'document_excerpt'|'public_source';
  title:string; content:string; metadata:string; sha256:string; source_id:string|null;
  revision:number; actor:string; execution_id:string|null; created_at:string;
}
export interface GroupSynthesis {
  synthesis_id:string; group_id:string; version:number; previous_id:string|null;
  execution_id:string; worker_id:string; state:'draft'|'final'; transcript_revision:number;
  evidence_revision:number; scope_version:number; content:string; sha256:string; created_at:string;
}
