import type { RuntimeCatalog, EffectiveAIConfig } from '../domain/ai-profile.js';
import { PROFILES } from '../domain/model.js';
import type { Worker, Task, Execution, RuntimeBinding } from '../domain/model.js';

export interface ToolDefinition { name: string; description: string; inputSchema: Record<string, unknown> }
export interface RuntimeInput {
  worker: Worker; task: Task; execution: Execution; binding?: RuntimeBinding;
  context: unknown; tools: ToolDefinition[];
  callTool(callId: string, name: string, args: unknown): unknown;
  bind(binding: RuntimeBinding): void;
  configured(config: EffectiveAIConfig): void;
  event(type: string, detail: Record<string, unknown>): void;
}
export interface RuntimeResult { status: 'completed' | 'failed' | 'interrupted' | 'awaiting_approval'; summary?: string; error?: string }
export interface RuntimeAdapter {
  readonly type: string;
  readonly supportsInterrupt: boolean;
  catalog?(workspace: string): Promise<RuntimeCatalog>;
  run(input: RuntimeInput, signal: AbortSignal): Promise<RuntimeResult>;
}

const string = { type: 'string' };
function tool(name: string, description: string, properties: Record<string, unknown>): ToolDefinition {
  return { name, description, inputSchema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } };
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
  if (worker.capability_profile.includes('write_workspace')) tools.push(tool('submit_artifact',
    'Save a short Markdown report in the controlled artifact store and return its durable reference. Provide content, never a filesystem path.', { description: string, content: string }));
  const engineering = (capability: string, name: string, description: string, properties: Record<string, unknown>) => {
    if (worker.capability_profile.some(c => c === capability)) tools.push(tool(name, description, properties));
  };
  if (worker.role === 'cto') {
    engineering('manage_repository', 'create_repository', 'Create the managed local SquadStatus scaffold from the completed product specification. Paths, default branch and policy are chosen by the service. Idempotent per delivery task.', { product_name: { type: 'string', enum: ['SquadStatus'] } });
    engineering('manage_repository', 'assign_engineering', 'Atomically allocate and assign calculate and format to two direct engineers. They receive distinct branches/worktrees and dispatch concurrently after your turn ends. Then end this turn.', { repository_id: string, calculate_worker_id: string, format_worker_id: string });
    engineering('manage_repository', 'assign_review', 'After both engineering tasks complete with verified commits, assign your direct reviewer. Then end this turn; review completion wakes you.', { repository_id: string, reviewer_worker_id: string });
    engineering('request_integration', 'integrate_repository', 'Integrate only the exact recorded commits from a completed approved review. Full tests run on a candidate before fast-forwarding main. Inspect returned status; failed/blocked is not success.', { repository_id: string, review_id: string });
  }
  if (worker.role === 'engineer') {
    engineering('repository_read', 'read_source', 'Read an approved relative file in YOUR current allocation. No arbitrary paths. Source, immutable tests, CLI and package metadata are available.', { allocation_id: string, path: string });
    engineering('repository_write_owned', 'write_source', 'Write only src/<assigned-module>.mjs or test/<assigned-module>.extra.test.mjs in your allocation. Exact identity/path checks; no .git, siblings, symlinks or absolute paths. Maximum 16000 bytes.', { allocation_id: string, path: string, content: string });
    engineering('run_repo_tests', 'run_repo_tests', 'Run the fixed focused acceptance and optional extra tests in an OS-confined Node process. No command arguments, shell, network, writes or subprocesses.', { allocation_id: string });
    engineering('inspect_git_status', 'inspect_git', 'Inspect only your branch HEAD, status and scoped diff. No arbitrary Git command is accepted.', { allocation_id: string });
    engineering('submit_engineering_result', 'submit_engineering', 'Verify allocation/base/scope, rerun focused tests, and create one immutable commit through trusted Git. Freezes your allocation and retains validation evidence. End after success.', { allocation_id: string, summary: string });
  }
  if (worker.role === 'reviewer') {
    engineering('review_repository_change', 'read_review_packet', 'Read the exact assigned product spec/base, both submitted commits/diffs, focused test evidence and immutable acceptance tests. Read-only; no source write/Git capabilities.', {});
    engineering('review_repository_change', 'submit_review', 'Save an immutable structured review of the exact submitted source commits. approved allows CTO integration only after this review task completes; changes_required blocks integration.', { status: { type: 'string', enum: ['approved', 'changes_required'] }, source_commits: { type: 'array', items: string }, linus_findings: string, ada_findings: string, integration_risks: string, acceptance_assessment: string, recommended_disposition: string });
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
