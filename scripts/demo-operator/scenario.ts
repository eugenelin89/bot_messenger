import { DEFAULT_POLICY, parsePolicy, type ProjectPolicy } from '../../src/domain/projects.js';

export const actions = ['open_hq', 'create_project', 'configure_project', 'create_repository', 'prepare_infrastructure', 'assign_objective', 'resume_dispatch', 'observe_workflow', 'inspect_result', 'pause_dispatch'] as const;
export type Action = typeof actions[number];
export interface Scenario {
  name: string; operator: 'BotSquad Demo Operator'; objective: string;
  acceptance: string; constraints: string; instructions: string; policy: ProjectPolicy;
  steps: Action[]; timeout_ms: number;
}
export function parseScenario(input: unknown): Scenario {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid scenario');
  const s = input as Record<string, unknown>;
  const keys = ['name','operator','objective','acceptance','constraints','instructions','policy','steps','timeout_ms'];
  if (Object.keys(s).some(k => !keys.includes(k)) || keys.some(k => !(k in s))) throw Error('Unexpected scenario fields');
  for (const k of ['name','objective','acceptance','constraints','instructions']) {
    if (typeof s[k] !== 'string' || !s[k].trim() || s[k].length > 8000) throw Error(`Invalid ${k}`);
  }
  if (s.operator !== 'BotSquad Demo Operator') throw Error('Explicit automated operator identity required');
  if (!Array.isArray(s.steps) || JSON.stringify(s.steps) !== JSON.stringify(actions)) throw Error('Invalid step ordering');
  if (!Number.isInteger(s.timeout_ms) || Number(s.timeout_ms) < 1000 || Number(s.timeout_ms) > 3600000) throw Error('Invalid deadline');
  return { ...s, policy: parsePolicy(s.policy) } as unknown as Scenario;
}
const recipe = (id: string, stage: 'focused'|'full', files: string[]) => ({recipe_id:id,name:`StudyPlan ${id} tests`,stage,executable:'node' as const,argv:['--test',...files],cwd:'.',timeout_ms:10000,output_bytes:16000,environment:'isolated' as const});
export function studyPlan(name = 'StudyPlan'): Scenario {
  return parseScenario({ name, operator:'BotSquad Demo Operator', timeout_ms:2700000, steps:[...actions],
    objective:'Create a tiny dependency-free Node study planner. Given study tasks with subject, estimated minutes, and priority, produce a deterministic daily plan with recommended task order, total study time, and a readable text summary. Keep the code simple. Include meaningful automated edge-case tests and a sample plan in a final artifact. Use the normal product specification, engineering allocation, independent review and trusted integration workflow.',
    acceptance:'Support empty input, equal priorities, invalid values, and input immutability. Higher numeric priority comes first; ties preserve input order. Use task fields subject, minutes, priority. Planning exports planStudy(tasks) returning {tasks, totalMinutes}; reporting exports formatPlan(plan) returning readable text without mutating its input. Keep report tests independent using literal plan data. Include meaningful focused tests in src/planner/planner.test.mjs and src/report/report.test.mjs. Both must pass the full integration recipe. Provide an inspectable sample result artifact after integration.',
    constraints:'Local managed repository only. No external publication, network, packages, shell, or dependency installation. Respect project policy, non-overlapping scopes and named confined recipes. Do not invent a review problem; request revisions only for real issues.',
    instructions:'StudyPlan tutorial operated by BotSquad Demo Operator (automation, not a named human). The planner and report formatter are naturally separate scopes under src/planner/ and src/report/. Engineers should write tests alongside their own module. Managers decide assignments and review normally. The full recipe runs both module suites. Save the final example as a trusted task artifact; do not run a separate shell demo.',
    policy:{...DEFAULT_POLICY,recipes:[recipe('planner','focused',['src/planner/planner.test.mjs']),recipe('report','focused',['src/report/report.test.mjs']),recipe('full','full',['src/planner/planner.test.mjs','src/report/report.test.mjs'])]},
  });
}
