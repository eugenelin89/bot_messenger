import type { RuntimeCatalog } from '../domain/ai-profile.js';
import { requireThat } from '../domain/model.js';
import { Company } from './company.js';
import { companyTools, researchTools, type RuntimeAdapter, type RuntimeInput } from '../runtime/adapter.js';
import { RESEARCH_TOOLS } from '../domain/research.js';

export class Dispatcher {
  private running = new Map<string, { controller: AbortController; done: Promise<void> }>();
  private scheduled = false;
  private stopped = true;
  private readonly onChange = () => this.kick();
  runtimeState: 'unknown' | 'ready' | 'degraded' = 'unknown';
  private catalogRequest?: Promise<RuntimeCatalog>;
  constructor(readonly company: Company, readonly adapter: RuntimeAdapter, readonly maxActive = 2) {
    requireThat(Number.isInteger(maxActive) && maxActive >= 1 && maxActive <= 2, 'Global concurrency must be one or two');
    this.company.research.provider ??= adapter.researchProvider?.(this.company.dataDir);
  }
  async runtimeCatalog(): Promise<RuntimeCatalog> {
    requireThat(this.adapter.catalog, 'Runtime discovery is unavailable');
    if (!this.catalogRequest) this.catalogRequest = this.adapter.catalog(this.company.dataDir)
      .then(catalog => { this.runtimeState = 'ready'; return catalog; })
      .catch(error => { this.runtimeState = 'degraded'; throw error; })
      .finally(() => { this.catalogRequest = undefined; });
    return this.catalogRequest;
  }
  get initialized() { return !this.stopped; }
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
    this.company.infrastructure.processRevocations();
    if (!this.company.paused) this.company.engineering.processQueue();
    while (!this.stopped && this.running.size < this.maxActive) {
      const claim = this.company.claimWorkNext(this.maxActive);
      if (!claim) break;
      const { worker, execution, context } = claim;
      const controller = new AbortController();
      const done = (async () => {
        let providerSettled=false;
        try {
          this.company.verifyWorkspace(worker);
          if (worker.runtime_type !== this.adapter.type) throw new Error('Worker/runtime adapter mismatch');
          const taskTools=companyTools(worker);
          if(claim.origin==='task'&&claim.task.kind==='research'&&this.company.research.enabled(worker.worker_id))taskTools.push(...researchTools());
          const session=claim.origin==='task'?this.company.research.taskSession(context,taskTools):undefined;
          const callResearch=(callId:string,name:string,args:unknown,signal?:AbortSignal)=>this.company.research.callTool(context,callId,name,args,signal?AbortSignal.any([controller.signal,signal]):controller.signal);
          const input: RuntimeInput = claim.origin === 'conversation' ? {
            mode:'conversation', worker, request:claim.request, execution:claim.execution,
            context:this.company.conversations.context(context),binding:this.company.conversations.binding(context),tools:this.company.conversations.tools(context),
            configured:config=>this.company.recordRuntimeConfig(context,config),
            prepareBinding:binding=>this.company.conversations.prepareBinding(context,binding),
            bind:binding=>{this.company.conversations.prepareBinding(context,binding);this.company.conversations.activateBinding(context);},
            callTool:(callId,name,args,signal)=>(RESEARCH_TOOLS as readonly string[]).includes(name)?callResearch(callId,name,args,signal):this.company.conversations.callTool(context,callId,name,args),
            event:(type,detail)=>this.company.conversations.event(context,type,detail),
          } : { mode:'task', worker, task:claim.task, execution:claim.execution, context: {...this.company.context(context),research_authority:claim.task.kind==='research'?this.company.research.context(context):undefined},
            binding: session?this.company.research.taskBinding(session):this.company.binding(worker.worker_id), tools: taskTools,
            configured: config => this.company.recordRuntimeConfig(context, config),
            prepareBinding:session?binding=>this.company.research.prepareTaskBinding(context,session.session_id,binding):undefined,
            bind: binding => session?this.company.research.prepareTaskBinding(context,session.session_id,binding,true):this.company.setBinding(context, binding),
            callTool: (callId, name, args,signal) => (RESEARCH_TOOLS as readonly string[]).includes(name)?callResearch(callId,name,args,signal):this.company.callTool(context, callId, name, args),
            event: (type, detail) => this.company.recordRuntimeEvent(context,type,detail),
          };
          const result = await this.adapter.run(input, controller.signal);
          await this.company.research.drain(execution.execution_id);
          providerSettled=result.settled===true||result.status==='completed';
          // Researchers must supply evidence, not only status prose.
          if (claim.origin === 'task' && result.status === 'completed' && ['researcher', 'product_manager'].includes(worker.role) && !this.company.artifacts(claim.task.task_id).length) {
            throw new Error('Research finished without an artifact');
          }
          this.company.finish(execution.execution_id, result);
        } catch (error) {
          controller.abort('Runtime ended without awaiting its research callbacks');
          await this.company.research.drain(execution.execution_id);
          this.company.finish(execution.execution_id, { status: 'failed', settled:providerSettled, error: error instanceof Error ? error.message : 'Runtime failed' });
        }
      })().finally(() => { this.running.delete(execution.execution_id); this.kick(); });
      this.running.set(execution.execution_id, { controller, done });
    }
  }
  canInterrupt(executionId: string) {
    return this.adapter.supportsInterrupt && this.running.has(executionId) && this.company.execution(executionId).status === 'running';
  }
  interrupt(executionId: string) {
    if (!this.adapter.supportsInterrupt) throw new Error('Runtime does not support interruption');
    const active = this.running.get(executionId);
    if (!active) throw new Error('Execution is not active in this dispatcher');
    if (active.controller.signal.aborted) return;
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
