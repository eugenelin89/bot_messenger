import type { RuntimeCatalog } from '../domain/ai-profile.js';
import { requireThat } from '../domain/model.js';
import { Company } from './company.js';
import { companyTools, researchTools, type RuntimeAdapter, type RuntimeInput } from '../runtime/adapter.js';
import { RESEARCH_TOOLS } from '../domain/research.js';
import { COMPUTER_TOOLS } from './computers.js';
import { computerTools } from '../runtime/computer.js';

export class Dispatcher {
  private running = new Map<string, { controller: AbortController; done: Promise<void> }>();
  private scheduled = false;
  private stopped = true;
  private deadlineTimer?: NodeJS.Timeout;
  private readonly onChange = () => this.kick();
  private readonly onComputerInterrupt=(executionId:string)=>{const active=this.running.get(executionId);active?.controller.abort('Computer session authority ended');};
  private readonly onInvestmentInterrupt=(scopeId:string)=>{for(const [executionId,active] of this.running){if(this.company.store.get('SELECT 1 FROM investment_team_executions WHERE execution_id=? AND scope_id=?',executionId,scopeId))active.controller.abort('Investment scope authority ended');}};
  runtimeState: 'unknown' | 'ready' | 'degraded' = 'unknown';
  private catalogRequest?: Promise<RuntimeCatalog>;
  constructor(readonly company: Company, readonly adapter: RuntimeAdapter, readonly maxActive = 2) {
    requireThat(Number.isInteger(maxActive) && maxActive >= 1 && maxActive <= 2, 'Global concurrency must be one or two');
    this.company.research.provider ??= adapter.researchProvider?.(this.company.dataDir);
    this.company.investmentTeam.runtime=adapter;
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
    this.company.on('computer_interrupt',this.onComputerInterrupt);this.company.on('investment_interrupt',this.onInvestmentInterrupt);
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
    this.company.business.progress();
    this.company.mandates.progress();
    this.company.discussions.progress();
    if(this.deadlineTimer)clearTimeout(this.deadlineTimer);
    const deadline=[this.company.discussions.deadline(),this.company.mandates.nextWake(),this.company.business.nextWake()].filter((x):x is string=>!!x).sort()[0];
    if(deadline)this.deadlineTimer=setTimeout(()=>this.kick(),Math.min(2147483647,Math.max(1,Date.parse(deadline)-this.company.mandates.clock.now())));
    this.company.infrastructure.processRevocations();
    if (!this.company.paused) this.company.engineering.processQueue();
    while (!this.stopped && this.running.size < this.maxActive) {
      const claim = this.company.claimWorkNext(this.maxActive);
      if (!claim) break;
      const { worker, execution, context } = claim;
      const controller = new AbortController();
      const group=claim.origin==='conversation'?this.company.discussions.forConversation(claim.request.conversation_id):undefined;
      const mandateTurn=claim.origin==='conversation'?this.company.mandates.turn(claim.request.request_id):undefined;
      const internalTask=claim.origin==='task'?this.company.mandates.internalWork(claim.task.task_id):undefined;
      const ordinaryDeadline=mandateTurn?this.company.mandates.cycle(mandateTurn.cycle_id).deadline:internalTask?this.company.mandates.cycle(internalTask.cycle_id).deadline:group?.deadline;
      const teamScope=group?this.company.investmentTeam.forGroup(group.group_id):undefined;
      const workDeadline=[ordinaryDeadline,teamScope?this.company.investmentTeam.envelope(teamScope).expiresAt:null].filter((v):v is string=>!!v).sort()[0];
      const deadlineAbort=workDeadline?setTimeout(()=>controller.abort('Bounded work deadline expired'),Math.max(1,Date.parse(workDeadline)-this.company.mandates.clock.now())):undefined;
      const done = (async () => {
        let providerSettled=false;
        try {
          this.company.verifyWorkspace(worker);
          if (worker.runtime_type !== this.adapter.type) throw new Error('Worker/runtime adapter mismatch');
          const taskTools=companyTools(worker);
          const computerContext=claim.origin==='task'&&claim.task.kind==='computer'?this.company.computers.prepare(context):undefined;
          if(computerContext)taskTools.push(...computerTools());
          if(claim.origin==='task'&&claim.task.kind==='research'&&this.company.research.enabled(worker.worker_id))taskTools.push(...researchTools());
          const privateSession=claim.origin==='task'?this.company.mandates.taskSession(context,taskTools):undefined;
          const session=claim.origin==='task'&&!privateSession&&!computerContext?this.company.research.taskSession(context,taskTools):undefined;
          const callResearch=(callId:string,name:string,args:unknown,signal?:AbortSignal)=>this.company.research.callTool(context,callId,name,args,signal?AbortSignal.any([controller.signal,signal]):controller.signal);
          const investmentIdentity=claim.origin==='conversation'?this.company.investmentTeam.identity(claim.request.conversation_id,worker):undefined;
          const conversationWorker=investmentIdentity?{...worker,display_name:investmentIdentity.display_name,mission:investmentIdentity.mission,title:'Investment participant'}:worker;
          const input: RuntimeInput = claim.origin === 'conversation' ? {
            mode:'conversation', worker:conversationWorker, request:claim.request, execution:claim.execution,
            context:this.company.conversations.context(context),binding:this.company.conversations.binding(context),tools:this.company.conversations.tools(context),
            configured:config=>this.company.recordRuntimeConfig(context,config),
            prepareBinding:binding=>this.company.conversations.prepareBinding(context,binding),
            bind:binding=>{this.company.conversations.prepareBinding(context,binding);this.company.conversations.activateBinding(context);},
            callTool:(callId,name,args,signal)=>(RESEARCH_TOOLS as readonly string[]).includes(name)?callResearch(callId,name,args,signal):this.company.conversations.callTool(context,callId,name,args,signal?AbortSignal.any([controller.signal,signal]):controller.signal),
            event:(type,detail)=>this.company.conversations.event(context,type,detail),
          } : { mode:'task', worker, task:claim.task, execution:claim.execution, context: {...this.company.context(context),computer_use:computerContext,research_authority:claim.task.kind==='research'?this.company.research.context(context):undefined},
            binding: computerContext?undefined:privateSession?this.company.mandates.taskBinding(privateSession):session?this.company.research.taskBinding(session):this.company.binding(worker.worker_id), tools: taskTools,
            configured: config => this.company.recordRuntimeConfig(context, config),
            prepareBinding:computerContext?binding=>this.company.computers.bind(context,binding):privateSession?binding=>this.company.mandates.prepareTaskBinding(context,privateSession.session_id,binding):session?binding=>this.company.research.prepareTaskBinding(context,session.session_id,binding):undefined,
            bind: binding => computerContext?this.company.computers.bind(context,binding):privateSession?this.company.mandates.prepareTaskBinding(context,privateSession.session_id,binding,true):session?this.company.research.prepareTaskBinding(context,session.session_id,binding,true):this.company.setBinding(context, binding),
            callTool: (callId, name, args,signal) => (COMPUTER_TOOLS as readonly string[]).includes(name)?this.company.computers.callTool(context,callId,name,args,signal?AbortSignal.any([controller.signal,signal]):controller.signal):(RESEARCH_TOOLS as readonly string[]).includes(name)?callResearch(callId,name,args,signal):this.company.callTool(context, callId, name, args),
            event: (type, detail) => this.company.recordRuntimeEvent(context,type,detail),
          };
          const investmentLimits=this.company.investmentTeam.limits(execution.execution_id);
          if(investmentLimits)requireThat(this.adapter.runBoundedInvestment,'Bounded investment runtime unavailable');
          const result = investmentLimits ? await this.adapter.runBoundedInvestment!(input,controller.signal,investmentLimits) : await this.adapter.run(input, controller.signal);
          await this.company.research.drain(execution.execution_id);
          await this.company.computers.drain(execution.execution_id);
          await this.company.business.drain(execution.execution_id);
          providerSettled=result.settled===true||result.status==='completed';
          // Researchers must supply evidence, not only status prose.
          if (claim.origin === 'task' && result.status === 'completed' && (['researcher', 'product_manager'].includes(worker.role)||worker.role==='computer_operator'&&this.company.computers.forTask(claim.task.task_id)?.state!=='awaiting_approval') && !this.company.artifacts(claim.task.task_id).length) {
            throw new Error('Research finished without an artifact');
          }
          this.company.finish(execution.execution_id, result);
        } catch (error) {
          controller.abort('Runtime ended without awaiting its research callbacks');
          await this.company.research.drain(execution.execution_id);
          await this.company.computers.drain(execution.execution_id);
          await this.company.business.drain(execution.execution_id);
          this.company.finish(execution.execution_id, { status: 'failed', settled:providerSettled, error: error instanceof Error ? error.message : 'Runtime failed' });
        }
      })().finally(() => { if(deadlineAbort)clearTimeout(deadlineAbort);this.running.delete(execution.execution_id); this.kick(); });
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
    this.company.business.beginShutdown();
    if(this.deadlineTimer)clearTimeout(this.deadlineTimer);
    this.stopped = true; this.company.off('changed', this.onChange);
    this.company.off('computer_interrupt',this.onComputerInterrupt);this.company.off('investment_interrupt',this.onInvestmentInterrupt);
    for (const { controller } of this.running.values()) controller.abort('Application shutdown');
    await Promise.all([...this.running.values()].map(r => r.done));
    await this.company.computers.shutdown();
    await this.company.business.shutdown();
  }
}
