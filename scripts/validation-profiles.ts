import assert from 'node:assert/strict';
import type { Company } from '../src/control/company.js';
import type { RuntimeCatalog } from '../src/domain/ai-profile.js';

// Bounded acceptance harness only: use the same trusted human API as the UI.
// Configure newly hired workers while their manager is still running. Pause
// dispatch for each update, then restore it. Verify provenance, never assume
// a racing first execution picked up a new setting.
export function validationProfiles(api: <T>(path: string, data?: unknown) => Promise<T>) {
  const configured = new Set<string>();
  let catalog: RuntimeCatalog | undefined;
  return {
    async apply(state: ReturnType<Company['snapshot']>) {
      if (process.env.BOT_VALIDATION_AI_PROFILES !== '1') return;
      const pending = state.workers.filter(w => !configured.has(w.worker_id));
      if (!pending.length) return;
      catalog ??= await api<RuntimeCatalog>('runtime');
      const preferred = process.env.BOT_VALIDATION_MODEL ?? catalog.defaultModel;
      const model = catalog.models.find(m => m.model === preferred); assert.ok(model, 'Validation model must be advertised');
      const wasPaused = state.paused;
      await api('pause', { paused: true });
      try {
        for (const w of pending) {
          const wanted = w.role === 'reviewer' ? 'medium' : 'low';
          const reasoning = model.supportedReasoningEfforts.some(e => e.reasoningEffort === wanted) ? wanted : model.defaultReasoningEffort;
          const priority = w.role === 'ceo' ? 'critical' : w.role === 'cto' ? 'high' : w.role === 'reviewer' ? 'high' : 'normal';
          await api('worker-profile', { worker_id: w.worker_id, profile: { ai_model: model.model, reasoning_effort: reasoning, execution_priority: priority, ai_profile_locked: true } });
          configured.add(w.worker_id);
        }
      } finally { if (!wasPaused) await api('pause', { paused: false }); }
    },
    verify(state: ReturnType<Company['snapshot']>) {
      assert.ok(state.executions.every(e => e.provenance_status === 'recorded' && e.model && e.reasoning_effort && e.execution_priority && e.runtime_version && e.runtime_adapter), 'Missing actual execution provenance');
      assert.ok(state.bindings.every(b => b.thread_name?.startsWith('BotSquad · ')), 'Missing friendly thread names');
      if (process.env.BOT_VALIDATION_AI_PROFILES !== '1') return;
      for (const w of state.workers) {
        assert.equal(w.ai_profile_locked, 1);
        assert.ok(state.executions.some(e => e.worker_id === w.worker_id && e.model === w.ai_model && e.reasoning_effort === w.reasoning_effort && e.execution_priority === w.execution_priority), `No execution proving configured profile for ${w.display_name}`);
      }
    },
  };
}
