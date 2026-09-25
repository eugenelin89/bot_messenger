import type { Worker, Task, Execution, RuntimeBinding } from '../domain/model.js';

export interface ToolDefinition { name: string; description: string; inputSchema: Record<string, unknown> }
export interface RuntimeInput {
  worker: Worker; task: Task; execution: Execution; binding?: RuntimeBinding;
  context: unknown; tools: ToolDefinition[];
  callTool(callId: string, name: string, args: unknown): unknown;
  bind(binding: RuntimeBinding): void;
  event(type: string, detail: Record<string, unknown>): void;
}
export interface RuntimeResult { status: 'completed' | 'failed' | 'interrupted' | 'awaiting_approval'; summary?: string; error?: string }
export interface RuntimeAdapter {
  readonly type: string;
  readonly supportsInterrupt: boolean;
  run(input: RuntimeInput, signal: AbortSignal): Promise<RuntimeResult>;
}

const string = { type: 'string' };
function tool(name: string, description: string, properties: Record<string, unknown>): ToolDefinition {
  return { name, description, inputSchema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } };
}
export function companyTools(worker: Worker): ToolDefinition[] {
  const tools = [tool('list_company_status', 'Inspect workers and your current task and direct child tasks. No model dispatch.', {})];
  if (worker.capability_profile.includes('create_worker')) tools.push(tool('hire_worker',
    'Provision a subordinate within your delegatable capability ceiling. The new worker remains idle. Reuse an existing suitable worker when possible. Suggested researcher: Scout, Market Researcher.', {
      display_name: string, title: string, mission: string, capabilities: { type: 'array', items: { type: 'string', enum: worker.delegatable_capabilities } },
      lifecycle: { type: 'string', enum: ['persistent', 'temporary'] }, justification: string,
    }));
  if (worker.capability_profile.includes('create_task')) tools.push(tool('assign_task',
    'Assign one bounded research task to your direct subordinate. This creates durable work and wakes the worker. Your objective will wait; you will resume with their result. One child assignment per objective in Prompt 01.', {
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
  return tools;
}
