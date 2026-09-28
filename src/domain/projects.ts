import { requireThat, strictObject, textField } from './model.js';
import { canonical, hash } from './infrastructure.js';

export const HARD_BOUNDS = Object.freeze({ repository_bytes: 16 * 1024 * 1024, bundle_bytes: 4 * 1024 * 1024,
  files: 1000, file_bytes: 128 * 1024, diff_bytes: 256 * 1024, changed_files: 100, commits: 16 });
export interface Recipe {
  recipe_id: string; name: string; stage: 'focused' | 'full'; executable: 'node'; argv: string[];
  cwd: string; timeout_ms: number; output_bytes: number; environment: 'isolated';
}
export interface ProjectPolicy {
  protected_paths: string[]; maximum_writers: number; maximum_review_rounds: number;
  bounds: typeof HARD_BOUNDS; recipes: Recipe[];
}
export interface Project {
  project_id: string; name: string; description: string; status: 'active' | 'archiving' | 'archived';
  instructions: string; policy: string; created_by: string; created_at: string; updated_at: string; legacy: number;
}
export interface ReviewRound {
  round_id: string; repository_id: string; delivery_task_id: string; task_id: string; round_number: number;
  base_commit: string; submission_ids: string; packet: string; packet_hash: string; created_at: string; legacy: number;
}
export const DEFAULT_POLICY: ProjectPolicy = {
  protected_paths: ['AGENTS.md', '.github/', '.botsquad/', 'test/'], maximum_writers: 2, maximum_review_rounds: 3,
  bounds: { ...HARD_BOUNDS }, recipes: [],
};

// Portable, intentionally conservative path alphabet. No glob/case/Unicode ambiguity.
export function relativePath(value: unknown, directory = false): string {
  requireThat(typeof value === 'string' && value.length > 0 && value.length <= 240 && /^[A-Za-z0-9_.\-/]+$/.test(value), 'Path outside repository scope');
  const path = directory && value.endsWith('/') ? value.slice(0, -1) : value;
  requireThat(!path.startsWith('/') && path.split('/').every(s => s && s !== '.' && s !== '..' && s.toLowerCase() !== '.git' && !s.endsWith('.') && !s.endsWith('.lock')), 'Path outside repository scope');
  return value;
}
export function branchName(value: unknown): string {
  requireThat(typeof value === 'string' && value.length <= 100 && /^[A-Za-z0-9][A-Za-z0-9_/-]*$/.test(value) && !value.endsWith('/') && !value.includes('//'), 'Invalid default branch');
  return value;
}
export const within = (path: string, scope: string) => scope.endsWith('/') ? path.startsWith(scope) : path === scope;
export const overlaps = (a: string, b: string) => within(a, b) || within(b, a);
export function paths(value: unknown): string[] {
  requireThat(Array.isArray(value) && value.length > 0 && value.length <= 32, 'Expected bounded write scope');
  const result = value.map(p => relativePath(p, true));
  requireThat(new Set(result.map(p => p.toLowerCase())).size === result.length, 'Duplicate scope');
  return result.sort();
}
export function protectedPath(path: string, protectedPaths: string[]) {
  return path.split('/').some(p => p.toLowerCase() === 'agents.md') || protectedPaths.some(p => within(path.toLowerCase(), p.toLowerCase()));
}
export function writeAllowed(path: string, scopes: string[], protectedPaths: string[]) {
  relativePath(path);
  requireThat(scopes.some(p => within(path, p)) && !protectedPath(path, protectedPaths), 'Path outside assigned write scope or protected');
}
export function parseRecipe(value: unknown): Recipe {
  const a = strictObject(value, ['recipe_id','name','stage','executable','argv','cwd','timeout_ms','output_bytes','environment']);
  const recipeId = textField(a, 'recipe_id', 60);
  requireThat(/^[a-z][a-z0-9_-]*$/.test(recipeId), 'Invalid recipe ID');
  requireThat(a.executable === 'node' && a.environment === 'isolated', 'Recipe executable/environment outside trusted allowlist');
  requireThat(a.stage === 'focused' || a.stage === 'full', 'Invalid recipe stage');
  requireThat(Array.isArray(a.argv) && a.argv.length > 0 && a.argv.length <= 40, 'Invalid recipe argv');
  // Node tests are the first supported runtime. Flags that expand permission or load
  // host modules are never accepted, even from policy. Paths are literal, no shell.
  requireThat(a.argv.every(v => typeof v === 'string' && (v === '--test' || (!v.startsWith('-') && relativePath(v)))), 'Recipe argv outside trusted allowlist');
  requireThat(a.argv[0] === '--test' && a.argv.length > 1 && a.argv.slice(1).every(v => !String(v).startsWith('-')), 'Recipe must name explicit Node test files');
  const cwd = a.cwd === '.' ? '.' : relativePath(a.cwd);
  requireThat(Number.isInteger(a.timeout_ms) && Number(a.timeout_ms) >= 100 && Number(a.timeout_ms) <= 30000, 'Recipe timeout outside bounds');
  requireThat(Number.isInteger(a.output_bytes) && Number(a.output_bytes) >= 1024 && Number(a.output_bytes) <= 64000, 'Recipe output outside bounds');
  return { recipe_id: recipeId, name: textField(a, 'name', 100), stage: a.stage, executable: 'node', argv: a.argv as string[], cwd,
    timeout_ms: Number(a.timeout_ms), output_bytes: Number(a.output_bytes), environment: 'isolated' };
}
export function parsePolicy(value: unknown): ProjectPolicy {
  const a = strictObject(value, ['protected_paths','maximum_writers','maximum_review_rounds','bounds','recipes']);
  requireThat(Array.isArray(a.protected_paths) && a.protected_paths.length <= 64, 'Invalid protected paths');
  const protectedPaths = a.protected_paths.map(p => relativePath(p, true));
  for (const p of ['AGENTS.md','.github/','.botsquad/']) requireThat(protectedPaths.includes(p), 'Mandatory protected paths cannot be removed');
  requireThat(Number.isInteger(a.maximum_writers) && Number(a.maximum_writers) >= 1 && Number(a.maximum_writers) <= 2, 'Writer ceiling exceeded');
  requireThat(Number.isInteger(a.maximum_review_rounds) && Number(a.maximum_review_rounds) >= 1 && Number(a.maximum_review_rounds) <= 5, 'Review ceiling exceeded');
  const bounds = strictObject(a.bounds, Object.keys(HARD_BOUNDS));
  for (const [key, limit] of Object.entries(HARD_BOUNDS)) requireThat(Number.isInteger(bounds[key]) && Number(bounds[key]) >= 1 && Number(bounds[key]) <= limit, 'Repository bounds exceeded');
  requireThat(Array.isArray(a.recipes) && a.recipes.length <= 16, 'Invalid recipes');
  const recipes = a.recipes.map(parseRecipe);
  requireThat(new Set(recipes.map(r => r.recipe_id)).size === recipes.length, 'Duplicate recipe ID');
  return { protected_paths: protectedPaths, maximum_writers: Number(a.maximum_writers), maximum_review_rounds: Number(a.maximum_review_rounds), bounds: bounds as unknown as typeof HARD_BOUNDS, recipes };
}
export function manifestHash(manifest: object) { return hash(canonical(manifest)); }
export function normalizeRemote(value: unknown) {
  requireThat(typeof value === 'string' && value.length <= 250 && /^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(value), 'Only credential-free GitHub HTTPS repository URLs are accepted');
  const url = new URL(value); const [owner, raw] = url.pathname.slice(1).split('/');
  const name = raw!.replace(/\.git$/, '');
  requireThat(name && name !== '.' && name !== '..' && !name.startsWith('-'), 'Invalid GitHub repository identity');
  const identity = `${owner!.toLowerCase()}/${name.toLowerCase()}`;
  return { provider: 'github', identity, url: `https://github.com/${identity}.git` };
}
