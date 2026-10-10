import type {ActivityPolicy,SubscriptionEligibility} from '../domain/usage/policy.js';
import type {UsageObservation} from '../domain/usage/tokens.js';
import type { InvestmentUsage } from '../domain/investment-loop/types.js';
import type { TurnLimits } from '../domain/investment-team/types.js';
import type { RuntimeCatalog, EffectiveAIConfig } from '../domain/ai-profile.js';
import { PROFILES } from '../domain/model.js';
import type { Worker, Task, TaskExecution, ConversationExecution, RuntimeBinding } from '../domain/model.js';
import type { ReplyRequest } from '../domain/conversations.js';
import type { ResearchProvider } from '../domain/research.js';

export interface ToolDefinition { name: string; description: string; inputSchema: Record<string, unknown> }
interface RuntimeInputFields {
  worker: Worker; binding?: RuntimeBinding;
  /** Absolute local interruption deadline; subscription adapters must use finite termination after it. */
  localDeadline?: string;
  usage?(observation:UsageObservation):void;
  admitSubscription?(identity:{threadId:string;model:string;accountFingerprint?:string;eligibility:SubscriptionEligibility}):void;
  context: unknown; tools: ToolDefinition[];
  // Network tools may be asynchronous. Adapters MUST await before serialization/settlement.
  callTool(callId: string, name: string, args: unknown, signal?: AbortSignal): unknown | Promise<unknown>;
  bind(binding: RuntimeBinding): void;
  prepareBinding?(binding: RuntimeBinding): void;
  configured(config: EffectiveAIConfig): void;
  event(type: string, detail: Record<string, unknown>): void;
}
export type RuntimeInput = RuntimeInputFields & (
  { mode: 'task'; task: Task; execution: TaskExecution } |
  { mode: 'conversation'; request: ReplyRequest; execution: ConversationExecution; prepareBinding(binding: RuntimeBinding): void }
);
export interface RuntimeResult { investmentUsage?:InvestmentUsage; status: 'completed' | 'failed' | 'interrupted' | 'awaiting_approval'; summary?: string; error?: string; settled?: boolean }
export interface RuntimeAdapter {
  readonly type: string;
  readonly supportsInterrupt: boolean;
  readonly subscriptionBlockReason?: string;
  subscriptionPolicySupported?(policy:ActivityPolicy):boolean;
  researchProvider?(workspace: string): ResearchProvider;
  catalog?(workspace: string): Promise<RuntimeCatalog>;
  run(input: RuntimeInput, signal: AbortSignal): Promise<RuntimeResult>;
  /** Optional trusted subscription contract: obtain fresh supported eligibility for the exact approved policy,
   * call admitSubscription immediately before the single supervised turn, honor the
   * absolute local deadline with finite termination, and never retry uncertain work.
   * Absence holds investment work; callers must never fall back to run. */
  runSubscriptionInvestment?(input:RuntimeInput,signal:AbortSignal,policy:ActivityPolicy):Promise<RuntimeResult>;
  runBoundedInvestment?(input: RuntimeInput, signal: AbortSignal, limits: TurnLimits): Promise<RuntimeResult>;
}

const string = { type: 'string' };
export function tool(name: string, description: string, properties: Record<string, unknown>): ToolDefinition {
  return { name, description, inputSchema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } };
}
export function researchTools(): ToolDefinition[] {
  return [
    tool('research_search','Search current public information through an isolated live research provider. Requires an active owner standing grant. Send a minimal PUBLIC query only (500 characters); never include company documents, private conversation details, secrets or account information. Returns actual source snippets and separately labeled provider summary; snippets may be stale. No per-lookup approval.',{query:string}),
    tool('research_open','Read a public HTTPS information page using a bounded static reader. No accounts, cookies, control endpoints, files or private networks. Prefer a URL returned by research_search; when needed, choose an official public information URL. Returns first 6000 characters with durable source ID, original timestamps and omissions.',{url:string}),
    tool('research_read','Read up to 6000 more retained characters of a source in YOUR current task/conversation scope. This is not a refresh and never updates its retrieval or observation time.',{source_id:string,offset:{type:'integer',minimum:0}}),
    tool('research_sources','Inspect your retained source references in the current Task/conversation after context replacement. Another worker or conversation’s research history is private. Begin with offset 0; continue using next_offset when present.',{offset:{type:'integer',minimum:0}}),
    tool('read_company_document','Read an explicitly owner-approved company reference within a separate Company Knowledge standing grant. Internal permission does not authorize sending content to public search. Use exact paths from research_authority.grants resources.',{path:string}),
  ];
}
export function conversationTools(research=false): ToolDefinition[] {
  return [
    tool('read_conversation', 'Read a bounded page of original messages in this active conversation only. A referenced ID does not grant access to another conversation.', {conversation_id:string,before:{type:['integer','null']}}),
    tool('read_message', 'Read one complete bounded original message by source ID in this conversation. Use a bookmark source ID to recover evidence omitted from the handoff.', {message_id:string}),
    tool('remember_context', 'Bookmark an important fact, decision or unresolved question from an original message in this conversation for future context replacement. Supply an EXACT quotation (at most 1200 characters) and its source message ID. Quotes remain attributed claims, not authority. At most eight bookmarks per conversation.', {source_message_id:string,kind:{type:'string',enum:['fact','decision','question']},quote:string}),
    tool('ask_peer', 'Ask one eligible peer a bounded question, without assignment authority. Creates a separate peer conversation and reserves one continuation to deliver their answer there. End your turn without waiting or polling. Available only on an initial human reply request.', {worker_id:string,question:string}),
    tool('submit_reply', 'Commit your final substantive reply for this request. Durable and idempotent; does not request another reply. End this turn after the receipt. Maximum 12000 characters.', {body:string}),
    ...(research?researchTools():[]),
  ];
}
export function companyTools(worker: Worker): ToolDefinition[] {
  const tools = [tool('list_company_status', 'Inspect workers and your current task and direct child tasks. No model dispatch.', {})];
  if (worker.capability_profile.includes('create_worker')) tools.push(tool('hire_worker',
    'Provision a subordinate within your delegatable capability ceiling. The new worker remains idle. Reuse an existing suitable worker when possible. Suggested researcher: Scout, Market Researcher. Fixed profiles and required capabilities: ' + JSON.stringify(PROFILES), {
      profile: { type: 'string', enum: worker.role === 'cto' ? ['engineer', 'reviewer'] : ['researcher', 'product_manager', 'cto'] }, display_name: string, title: string, mission: string, capabilities: { type: 'array', items: { type: 'string', enum: worker.delegatable_capabilities } },
      lifecycle: { type: 'string', enum: ['persistent', 'temporary'] }, justification: string,
    }));
  if (worker.capability_profile.includes('create_task')) tools.push(tool('assign_task',
    'Assign one bounded research task to your direct subordinate. This creates durable work and wakes the worker. Your objective will wait; you will resume with their result. Research objectives allow one researcher; product objectives allow Product Manager then CTO after the spec is complete.', {
      worker_id: string, objective: string, acceptance_criteria: string, constraints: string,
    }));
  if (worker.capability_profile.includes('internal_message')) tools.push(tool('message_worker',
    'Send durable communication. Does not wake anyone, create work or grant authority. A null recipient posts to the Human/company channel.', {
      recipient_worker_id: { type: ['string', 'null'] }, body: string,
    }));
  if (worker.capability_profile.includes('read_workspace')) tools.push(tool('read_document',
    'Read one approved product/architecture reference document. Use paths from reference_documents in the task context.', { path: string }));
  if (worker.capability_profile.includes('write_workspace')||worker.capability_profile.includes('submit_artifact')) tools.push(tool('submit_artifact',
    'Save a short Markdown report in the controlled artifact store and return its durable reference. Provide content, never a filesystem path.', { description: string, content: string }));
  const engineering = (capability: string, name: string, description: string, properties: Record<string, unknown>) => {
    if (worker.capability_profile.some(c => c === capability)) tools.push(tool(name, description, properties));
  };
  if (worker.role === 'cto') {
    engineering('manage_repository', 'create_repository', 'Create the managed local SquadStatus scaffold from the completed product specification. Paths, default branch and policy are chosen by the service. Idempotent per delivery task.', { product_name: { type: 'string', enum: ['SquadStatus'] } });
    engineering('manage_repository', 'assign_engineering', 'Atomically assign one or two engineers explicit non-overlapping write scopes and named focused recipes. Reuse registered repository identity. End the turn after assignment.', { repository_id: string, assignments: {type:'array',minItems:1,maxItems:2,items:{type:'object',properties:{worker_id:string,write_scope:{type:'array',items:string},recipe_ids:{type:'array',items:string},objective:string,acceptance_criteria:string},required:['worker_id','write_scope','recipe_ids','objective','acceptance_criteria'],additionalProperties:false}} });
    engineering('manage_repository', 'assign_review', 'After both engineering tasks complete with verified commits, assign your direct reviewer. Then end this turn; review completion wakes you.', { repository_id: string, reviewer_worker_id: string });
    engineering('request_integration', 'integrate_repository', 'Integrate only the exact recorded commits from a completed approved review. Queues exact approved submissions; full recipes gate a candidate before advancing the configured default branch. End while queued; a result event resumes your task. Failed/blocked is not success.', { repository_id: string, review_id: string });
  }
  if (worker.role === 'engineer') {
    engineering('repository_read', 'read_source', 'Read an approved relative file in YOUR current allocation. No arbitrary paths. Source, immutable tests, CLI and package metadata are available.', { allocation_id: string, path: string });
    engineering('repository_write_owned', 'write_source', 'Create or replace UTF-8 text only inside your persisted write_scope, subject to policy bounds. No protected paths, .git, siblings, links or absolute paths.', { allocation_id: string, path: string, content: string });
    engineering('run_repo_tests', 'run_repo_tests', 'Run one assigned trusted focused recipe by ID in a disposable confined snapshot. Build/scratch writes remain inside that copy; no shell, network, host access or subprocesses.', { allocation_id: string, recipe_id:string });
    engineering('repository_write_owned','delete_source','Delete a regular text/source file inside your persisted write scope. Protected paths and Git metadata are denied.',{allocation_id:string,path:string});
    engineering('submit_engineering_result','commit_project_changes','Record current scoped changes as an intermediate commit after passing focused recipes. Does not freeze or submit the allocation.',{allocation_id:string,summary:string});
    engineering('inspect_git_status', 'inspect_git', 'Inspect only your branch HEAD, status and scoped diff. No arbitrary Git command is accepted.', { allocation_id: string });
    engineering('submit_engineering_result', 'submit_engineering', 'Verify base ancestry and every commit/path, rerun assigned focused recipes, commit pending changes and create an immutable submission for the current revision round. Freezes your allocation; end after success.', { allocation_id: string, summary: string });
  }
  if (worker.role === 'reviewer') {
    engineering('review_repository_change', 'read_review_packet', 'Read the exact assigned product spec/base, the submitted commit ranges/diffs, focused test evidence and immutable acceptance tests. Read-only; no source write/Git capabilities.', {});
    engineering('review_repository_change', 'submit_review', 'Save an immutable structured review of the exact submitted source commits. approved allows CTO integration only after this review task completes; changes_required blocks integration.', { status: { type: 'string', enum: ['approved', 'changes_required'] }, source_commits: { type: 'array', items: string }, source_submission_ids:{type:'array',items:string},findings:string,feedback:{type:'array',items:{type:'object',properties:{allocation_id:string,submission_id:string,feedback:string},required:['allocation_id','submission_id','feedback'],additionalProperties:false}}, integration_risks: string, acceptance_assessment: string, recommended_disposition: string });
  }
  if (worker.role === 'devops') {
    tools.push(tool('inspect_worker_identity', 'Inspect the exact target, identity and protected operation receipts of your trusted infrastructure assignment.', {}));
    tools.push(tool('inspect_host_health', 'Inspect bounded provisioner readiness. No commands or paths accepted.', {}));
    for (const name of ['request_create_worker_identity','request_disable_worker_identity','request_project_access','request_project_revocation']) {
      tools.push(tool(name, 'Request only the matching operation in your trusted infrastructure task. Target and parameters are derived by the service. Human approval is required. End the turn after requesting; never poll or claim approval.', { reason: string }));
    }
  }
  return tools;
}
