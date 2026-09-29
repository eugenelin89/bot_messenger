export const CONVERSATION_LIMITS = Object.freeze({
  messageChars: 8000, replyChars: 12000, contextChars: 32000, pageSize: 30,
  queuedGlobal: 32, queuedWorker: 8, requestsPerMinute: 12, messagesPerMinute: 40,
  chainRequests: 4, chainHops: 2, toolCalls: 12, turnsPerSession: 8, inputCharsPerSession: 64000,
});
export const CONVERSATION_SCHEMA = 'conversation-v1';
export interface Conversation {
  conversation_id: string; purpose: string; state: 'active' | 'muted' | 'archived';
  scope_version: number; created_by: string; created_at: string; updated_at: string;
}
export interface ConversationMessage {
  message_id: string; conversation_id: string; sender_principal_id: string;
  worker_id: string | null; execution_id: string | null; body: string;
  request_id: string | null; response_to: string | null; created_at: string;
}
export interface ReplyRequest {
  request_id: string; conversation_id: string; message_id: string; target_worker_id: string;
  requester_principal_id: string; chain_id: string; hop: number;
  kind: 'reply' | 'peer' | 'continuation'; parent_request_id: string | null;
  return_worker_id: string | null; status: 'queued' | 'waiting_peer' | 'replying' | 'completed' | 'interrupted' | 'failed' | 'blocked' | 'cancelled';
  scope_version: number; response_message_id: string | null; error: string | null;
  created_at: string; updated_at: string;
}
export interface ConversationSession {
  session_id: string; worker_id: string; conversation_id: string; generation: number;
  scope_version: number; mode: 'conversation'; tool_schema: string; tool_hash: string;
  previous_session_id: string | null; runtime_reference: string | null; thread_name: string | null;
  state: 'creating' | 'prepared' | 'active' | 'superseded' | 'blocked'; reason: string;
  handoff: string; handoff_hash: string; handoff_version: number;
  completed_turns: number; input_chars: number; rollover_requested: number;
  unresolved: number;
  created_at: string; activated_at: string | null;
}
