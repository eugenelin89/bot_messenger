import { Company } from './company.js';
import { companyTools, type RuntimeAdapter } from '../runtime/adapter.js';

export class Dispatcher {
  private running = new Map<string, { controller: AbortController; done: Promise<void> }>();
  private scheduled = false;
  private stopped = true;
  private readonly onChange = () => this.kick();
  constructor(readonly company: Company, readonly adapter: RuntimeAdapter, readonly maxActive = 2) {}
  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.company.recover();
    this.company.on('changed', this.onChange);
    this.kick();
  }
  kick() {
    if (this.stopped || this.scheduled) return;
    this.scheduled = true;
    setImmediate(() => {
      this.scheduled = false;
      if (this.stopped) return;
      try { this.drain(); }
      catch (error) {
        this.company.pause(true);
        this.company.audit('dispatcher_failed', 'system', { error: error instanceof Error ? error.message : 'Dispatcher failure' });
      }
    });
  }
  private drain() {
    while (!this.stopped && this.running.size < this.maxActive) {
      const claim = this.company.claimNext();
      if (!claim) break;
      const { task, worker, execution, context } = claim;
      const controller = new AbortController();
      const done = (async () => {
        try {
          this.company.verifyWorkspace(worker);
          if (worker.runtime_type !== this.adapter.type) throw new Error('Worker/runtime adapter mismatch');
          const result = await this.adapter.run({ worker, task, execution, context: this.company.context(context),
            binding: this.company.binding(worker.worker_id), tools: companyTools(worker),
            bind: binding => this.company.setBinding(context, binding),
            callTool: (callId, name, args) => this.company.callTool(context, callId, name, args),
            event: (type, detail) => this.company.audit(type, 'system', detail, worker.worker_id, task.task_id, execution.execution_id),
          }, controller.signal);
          // Researchers must supply evidence, not only status prose.
          if (result.status === 'completed' && ['researcher', 'product_manager'].includes(worker.role) && !this.company.artifacts(task.task_id).length) {
            throw new Error('Research finished without an artifact');
          }
          this.company.finish(execution.execution_id, result);
        } catch (error) {
          this.company.finish(execution.execution_id, { status: 'failed', error: error instanceof Error ? error.message : 'Runtime failed' });
        }
      })().finally(() => { this.running.delete(execution.execution_id); this.kick(); });
      this.running.set(execution.execution_id, { controller, done });
    }
  }
  interrupt(executionId: string) {
    if (!this.adapter.supportsInterrupt) throw new Error('Runtime does not support interruption');
    const active = this.running.get(executionId);
    if (!active) throw new Error('Execution is not active in this dispatcher');
    this.company.audit('interrupt_requested', 'human', {}, null, null, executionId);
    active.controller.abort('Human requested interruption');
  }
  get activeCount() { return this.running.size; }
  async stop() {
    this.stopped = true; this.company.off('changed', this.onChange);
    for (const { controller } of this.running.values()) controller.abort('Application shutdown');
    await Promise.all([...this.running.values()].map(r => r.done));
  }
}
