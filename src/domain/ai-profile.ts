import { requireThat, strictObject } from './model.js';

export const PRIORITIES = ['low', 'normal', 'high', 'critical'] as const;
export type Priority = typeof PRIORITIES[number];
export interface AIProfile {
  ai_model: string | null; reasoning_effort: string | null;
  execution_priority: Priority; ai_profile_locked: number;
}
export interface RuntimeModel {
  id: string; model: string; displayName: string; isDefault: boolean;
  defaultReasoningEffort: string;
  supportedReasoningEfforts: { reasoningEffort: string; description: string }[];
}
export interface RuntimeCatalog {
  version: string; adapter: string; authMode: string; models: RuntimeModel[]; defaultModel: string;
}
export interface EffectiveAIConfig {
  model: string; reasoning_effort: string; execution_priority: Priority;
  runtime_version: string; runtime_adapter: string;
}
export function resolveAIProfile(profile: AIProfile, catalog: RuntimeCatalog): EffectiveAIConfig {
  const requested = profile.ai_model ?? catalog.defaultModel;
  const model = catalog.models.find(m => m.model === requested || m.id === requested);
  requireThat(model, 'Configured model is not advertised by the active runtime; choose an available model.');
  const effort = profile.reasoning_effort ?? model.defaultReasoningEffort;
  requireThat(model.supportedReasoningEfforts.some(e => e.reasoningEffort === effort), 'Reasoning effort is not supported by the selected model.');
  requireThat(PRIORITIES.includes(profile.execution_priority), 'Invalid execution priority');
  return { model: model.model, reasoning_effort: effort, execution_priority: profile.execution_priority,
    runtime_version: catalog.version, runtime_adapter: catalog.adapter };
}
export function parseAIProfile(value: unknown): AIProfile {
  const a = strictObject(value, ['ai_model', 'reasoning_effort', 'execution_priority', 'ai_profile_locked']);
  for (const k of ['ai_model', 'reasoning_effort']) requireThat(a[k] === null || (typeof a[k] === 'string' && (a[k] as string).length > 0 && (a[k] as string).length <= 100), `Invalid ${k}`);
  requireThat(PRIORITIES.includes(a.execution_priority as Priority), 'Invalid execution priority');
  requireThat(typeof a.ai_profile_locked === 'boolean', 'Human lock must be a boolean');
  return { ai_model: a.ai_model as string | null, reasoning_effort: a.reasoning_effort as string | null,
    execution_priority: a.execution_priority as Priority, ai_profile_locked: Number(a.ai_profile_locked) };
}
