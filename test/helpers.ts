import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/persistence/store.js';
import { Company, DEFAULT_OBJECTIVE } from '../src/control/company.js';
import { Dispatcher } from '../src/control/dispatcher.js';
import type { Artifact, Worker } from '../src/domain/model.js';
import type { RuntimeAdapter, RuntimeInput, RuntimeResult } from '../src/runtime/adapter.js';

export const hire = { display_name: 'Scout', title: 'Market Researcher', mission: 'Review local documentation and report coordination risks',
  capabilities: ['internal_message', 'read_workspace', 'write_workspace'], lifecycle: 'persistent', justification: 'Independent research is needed' };
export const objective = { objective: DEFAULT_OBJECTIVE, acceptance_criteria: 'Three risks with failure modes and mitigations, report evaluated by Atlas', constraints: 'Local only' };
export const assignment = { objective: 'Review product and architecture documents; identify the three largest coordination risks.', acceptance_criteria: 'Three risks, each with impact, failure and mitigation. Save a report.', constraints: 'Approved local documents only.' };
export async function until(predicate: () => boolean, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) { if (Date.now() > deadline) throw new Error('Test condition timed out'); await new Promise(resolve => setTimeout(resolve, 10)); }
}
export class FakeRuntime implements RuntimeAdapter {
  readonly type = 'fake'; readonly supportsInterrupt = true; calls: RuntimeInput[] = [];
  active = new Map<string, number>(); maxByWorker = new Map<string, number>();
  gate?: (input: RuntimeInput, signal: AbortSignal) => Promise<RuntimeResult | undefined>;
  async run(input: RuntimeInput, signal: AbortSignal): Promise<RuntimeResult> {
    this.calls.push(input);
    const count = (this.active.get(input.worker.worker_id) ?? 0) + 1; this.active.set(input.worker.worker_id, count);
    this.maxByWorker.set(input.worker.worker_id, Math.max(count, this.maxByWorker.get(input.worker.worker_id) ?? 0));
    try {
      input.bind(input.binding ?? { worker_id: input.worker.worker_id, runtime_type: this.type,
        runtime_reference: `fake:${input.worker.worker_id}`, workspace_path: input.worker.workspace_path, created_at: new Date().toISOString() });
      input.event(input.binding ? 'worker_resumed' : 'runtime_started', {});
      const overridden = await this.gate?.(input, signal); if (overridden) return overridden;
      if (input.worker.role === 'ceo') {
        if (input.task.dispatch_reason === 'child_results') {
          const children = (input.context as { children: { artifacts: { content: string }[] }[] }).children;
          if (!children[0]?.artifacts[0]?.content.includes('Risk')) throw new Error('CEO missing child evidence');
          return { status: 'completed', summary: 'Evaluated Scout’s report: enforce authority in code, use atomic task claims, and retain execution evidence for recovery.' };
        }
        const status = input.callTool('status', 'list_company_status', {}) as { workers: Worker[] };
        const scout = status.workers.find(w => w.display_name === 'Scout') ?? input.callTool('hire', 'hire_worker', hire) as Worker;
        input.callTool('assign', 'assign_task', { worker_id: scout.worker_id, ...assignment });
        return { status: 'completed', summary: 'Assigned bounded documentation research to Scout. I will evaluate the report when it arrives.' };
      }
      input.callTool('read', 'read_document', { path: 'docs/architecture/SYSTEM_ARCHITECTURE.md' });
      const report = input.callTool('artifact', 'submit_artifact', { description: 'Three coordination risks', content: '# Risks\n\nRisk 1: authority confusion. Failure: forged approval. Mitigation: trusted capability checks.\n\nRisk 2: duplicate work. Failure: overlapping execution. Mitigation: atomic claims.\n\nRisk 3: recovery gaps. Failure: lost context. Mitigation: durable execution and artifact records.' }) as Artifact;
      return { status: 'completed', summary: `Report saved: ${report.artifact_id}` };
    } finally { this.active.set(input.worker.worker_id, count - 1); }
  }
}
export function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'botsquad-test-'));
  const store = new Store(join(dir, 'company.sqlite')); const runtime = new FakeRuntime();
  const company = new Company(store, dir, process.cwd(), runtime.type); const dispatcher = new Dispatcher(company, runtime);
  return { dir, store, runtime, company, dispatcher, async close() { await dispatcher.stop(); store.close(); } };
}
