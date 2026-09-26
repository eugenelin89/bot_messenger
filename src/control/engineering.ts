import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, constants, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { requireThat, strictObject, textField, type Execution, type Task, type Worker } from '../domain/model.js';
import type { Allocation, Integration, Repository, Review, Submission, Validation } from '../domain/engineering.js';
import type { Company } from './company.js';
import { PRODUCT_CONTRACT, SQUAD_FILES } from './product-scaffold.js';
import { runProduct } from './product-runner.js';

const now = () => new Date().toISOString();
const id = (kind: string) => `${kind}_${randomUUID()}`;
const sha = (s: string) => /^[0-9a-f]{40}$/.test(s);
type Actor = { worker: Worker; task: Task; execution: Execution };
export const ENGINEERING_TOOLS = {
  create_repository: 'manage_repository', assign_engineering: 'manage_repository', assign_review: 'manage_repository',
  read_source: 'repository_read', write_source: 'repository_write_owned', run_repo_tests: 'run_repo_tests',
  inspect_git: 'inspect_git_status', submit_engineering: 'submit_engineering_result',
  read_review_packet: 'review_repository_change', submit_review: 'review_repository_change', integrate_repository: 'request_integration',
} as const;

// Fixed argv and an empty Git environment prevent hooks, filters, credentials and inherited configuration.
export function localGit(cwd: string, args: string[]): string {
  return execFileSync('/usr/bin/git', ['-c', `safe.directory=${cwd}`, '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
    '-c', 'commit.gpgsign=false', '-c', 'core.attributesFile=/dev/null', '-c', 'diff.external=',
    '-c', 'user.name=BotSquad', '-c', 'user.email=botsquad@localhost', ...args], {
    cwd, env: { PATH: '/usr/bin:/bin', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_NO_REPLACE_OBJECTS: '1', GIT_LFS_SKIP_SMUDGE: '1', LANG: 'C' },
    encoding: 'utf8', timeout: 10000, maxBuffer: 128000, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export class Engineering {
  readonly root: string;
  constructor(readonly company: Company, readonly sourceRoot: string, private readonly git = localGit) {
    this.root = join(company.dataDir, 'products');
    mkdirSync(this.root, { recursive: true, mode: 0o700 });
    requireThat(realpathSync(this.root) === this.root, 'Managed product root is a symlink');
  }
  private get store() { return this.company.store; }
  repositories(): Repository[] { return this.store.all('SELECT * FROM repositories ORDER BY created_at'); }
  allocations(): Allocation[] { return this.store.all('SELECT * FROM allocations ORDER BY created_at'); }
  submissions(repositoryId?: string): Submission[] { return repositoryId ? this.store.all('SELECT * FROM submissions WHERE repository_id=? ORDER BY allocation_id', repositoryId) : this.store.all('SELECT * FROM submissions ORDER BY created_at'); }
  reviews(): Review[] { return this.store.all('SELECT * FROM reviews ORDER BY created_at'); }
  integrations(): Integration[] { return this.store.all('SELECT * FROM integrations ORDER BY created_at'); }
  private event(type: string, actor: Actor, detail: object) { this.company.audit(type, actor.worker.principal_id, detail, actor.worker.worker_id, actor.task.task_id, actor.execution.execution_id); }
  recordAccessDenied(actor: Actor, tool: string, input: unknown) {
    const args = input && typeof input === 'object' ? input as Record<string, unknown> : {};
    const path = typeof args.path === 'string' ? args.path : '';
    const sibling = this.allocations().find(a => a.allocation_id === args.allocation_id && a.worker_id !== actor.worker.worker_id);
    const scope = sibling ? 'sibling_allocation' : path === join(this.sourceRoot, 'src/main.ts') ? 'botsquad_source'
      : path.startsWith('/') || path.split('/').includes('..') ? 'path_escape' : 'owned_scope';
    this.event('engineering_access_denied', actor, { tool, scope });
  }
  private canonical(path: string) { requireThat(realpathSync(this.root) === this.root && realpathSync(path) === path, 'Managed path mismatch or symlink escape'); }
  private repository(repositoryId: string): Repository {
    const repo = this.store.get<Repository>('SELECT * FROM repositories WHERE repository_id=?', repositoryId);
    requireThat(repo && repo.status === 'ready', 'Repository unavailable; inspect its state');
    requireThat(repo.canonical_root === join(this.root, repo.repository_id, 'main') && repo.canonical_root !== this.sourceRoot, 'Repository is outside managed product root');
    this.canonical(repo.canonical_root); this.canonical(join(repo.canonical_root, '.git'));
    const configPath = join(repo.canonical_root, '.git', 'config'); this.canonical(configPath);
    requireThat(lstatSync(configPath).isFile() && lstatSync(configPath).nlink === 1, 'Repository config is not a regular owned file');
    const configLines = readFileSync(configPath, 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
    requireThat(configLines.every(line => line === '[core]' || /^(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode) = (0|true|false)$/.test(line)), 'Repository configuration outside managed policy');
    requireThat(this.git(repo.canonical_root, ['rev-parse', '--show-toplevel']) === repo.canonical_root, 'Repository identity mismatch');
    const config = this.git(repo.canonical_root, ['config', '--local', '--list']);
    requireThat(config.split('\n').every(line => /^core\.(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode)=/.test(line)), 'Repository configuration outside managed policy');
    requireThat(!this.git(repo.canonical_root, ['remote']) && !this.git(repo.canonical_root, ['for-each-ref', 'refs/replace']), 'Remotes or replacement objects are forbidden');
    requireThat(this.git(repo.canonical_root, ['branch', '--show-current']) === 'main' && repo.default_branch === 'main', 'Default branch mismatch');
    requireThat(sha(repo.base_commit) && sha(repo.current_commit), 'Invalid repository commit state');
    return repo;
  }
  private ownedRepository(actor: Actor, repositoryId: string) {
    requireThat(actor.worker.role === 'cto' && actor.task.kind === 'delivery', 'Only the assigned CTO may manage this product');
    const repo = this.repository(repositoryId);
    requireThat(repo.created_by === actor.worker.worker_id && repo.workflow_task_id === actor.task.task_id, 'Repository manager/task mismatch');
    return repo;
  }
  private allocation(actor: Actor, allocationId: string, writable = false) {
    requireThat(actor.worker.role === 'engineer' && actor.task.kind === 'engineering', 'Only assigned engineers have worktree access');
    const a = this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=?', allocationId);
    requireThat(a && a.worker_id === actor.worker.worker_id && a.task_id === actor.task.task_id, 'Allocation/worker/task mismatch');
    requireThat(writable ? a.status === 'active' : ['active', 'submitted', 'reviewed', 'integrated'].includes(a.status), 'Allocation is frozen or requires inspection');
    this.verifyAllocation(a); return a;
  }
  verifyAllocation(a: Allocation) {
    const repo = this.repository(a.repository_id);
    if (this.company.infrastructure.linux) {
      const identity = this.company.infrastructure.identity(a.worker_id); const binding = this.company.infrastructure.project(a.allocation_id);
      requireThat(identity.state === 'ready' && binding?.state === 'ready' && binding.worker_id === a.worker_id && binding.repository_id === a.repository_id && binding.path === a.worktree_path && a.worktree_path === this.company.infrastructure.clonePath(a.worker_id, a.allocation_id), 'Worker project identity is not ready');
      this.canonical(a.worktree_path);
      requireThat(lstatSync(a.worktree_path).uid === identity.uid && lstatSync(a.worktree_path).gid === identity.gid, 'Clone UID/GID mismatch');
      let entries = 0;
      const inspect = (path: string) => {
        for (const name of readdirSync(path)) {
          const entry = join(path, name); const stat = lstatSync(entry);
          requireThat(++entries < 2000 && !stat.isSymbolicLink() && (stat.isDirectory() || stat.isFile()) && (stat.isDirectory() || stat.nlink === 1) && stat.uid === identity.uid, 'Unsafe clone entry');
          if (stat.isDirectory()) inspect(entry);
        }
      };
      inspect(a.worktree_path);
      const gitDir = join(a.worktree_path, '.git'); requireThat(lstatSync(gitDir).isDirectory(), 'Clone must have independent Git metadata');
      const config = readFileSync(join(gitDir, 'config'), 'utf8');
      requireThat(config.split('\n').map(s => s.trim()).filter(Boolean).every(line => line === '[core]' || /^(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode) = (0|true|false)$/.test(line)), 'Clone config outside managed policy');
      requireThat(['objects/info/alternates','info/grafts','shallow','refs/replace'].every(path => !existsSync(join(gitDir, path))), 'Clone Git indirection denied');
      requireThat(this.git(a.worktree_path, ['branch','--show-current']) === a.branch_name && a.branch_name === `botsquad/${a.module}/${a.task_id}` && a.base_commit === repo.base_commit && this.company.task(a.task_id).assignee_worker_id === a.worker_id, 'Clone allocation mismatch');
      return repo;
    }
    requireThat(a.worktree_path === join(this.root, repo.repository_id, 'worktrees', a.allocation_id), 'Allocation path outside managed root');
    requireThat(a.branch_name === `botsquad/${a.module}/${a.task_id}` && a.base_commit === repo.base_commit, 'Allocation branch/base mismatch');
    this.canonical(a.worktree_path);
    const metadata = join(a.worktree_path, '.git'); requireThat(lstatSync(metadata).isFile() && !lstatSync(metadata).isSymbolicLink(), 'Worktree metadata must be a regular file');
    const gitDirectory = join(repo.canonical_root, '.git', 'worktrees', a.allocation_id); this.canonical(gitDirectory);
    requireThat(readFileSync(metadata, 'utf8').trim() === `gitdir: ${gitDirectory}`, 'Worktree metadata identity mismatch');
    requireThat(readFileSync(join(gitDirectory, 'commondir'), 'utf8').trim() === '../..' && readFileSync(join(gitDirectory, 'gitdir'), 'utf8').trim() === metadata, 'Worktree backlink mismatch');
    requireThat(this.git(a.worktree_path, ['rev-parse', '--path-format=absolute', '--git-common-dir']) === join(repo.canonical_root, '.git'), 'Worktree belongs to another repository');
    requireThat(this.git(a.worktree_path, ['rev-parse', '--show-toplevel']) === a.worktree_path && this.git(a.worktree_path, ['branch', '--show-current']) === a.branch_name, 'Worktree branch/identity mismatch');
    requireThat(this.company.task(a.task_id).assignee_worker_id === a.worker_id, 'Allocation assignment mismatch');
    return repo;
  }
  projectProvisionParameters(allocationId: string, prepare: boolean) {
    const a = this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=?', allocationId); requireThat(a, 'Allocation missing');
    if (!prepare) return { allocation_id: allocationId };
    const repo = this.repository(a.repository_id);
    const path = join(this.root, repo.repository_id, `${allocationId}.seed.bundle`);
    if (!existsSync(path)) this.git(repo.canonical_root, ['bundle', 'create', path, 'main']);
    requireThat(!lstatSync(path).isSymbolicLink() && lstatSync(path).nlink === 1 && lstatSync(path).size < 500000, 'Invalid seed bundle');
    return { allocation_id: allocationId, repository_id: a.repository_id, task_id: a.task_id, module: a.module, base_commit: a.base_commit, bundle: readFileSync(path).toString('base64') };
  }
  private workerAction(a: Allocation, type: string, fields: object = {}) {
    const identity = this.company.infrastructure.identity(a.worker_id); requireThat(identity.state === 'ready', 'Worker identity is unavailable');
    const result = this.company.infrastructure.host.request({ type, operation_id: id('operation'), worker_id: a.worker_id, allocation_id: a.allocation_id, ...fields });
    requireThat(result.uid === identity.uid && result.gid === identity.gid, 'Worker action ran under incorrect UID');
    return result;
  }
  private importSubmission(a: Allocation, result: Record<string, unknown>) {
    requireThat(typeof result.commit === 'string' && sha(result.commit) && typeof result.bundle === 'string', 'Invalid submission receipt');
    const repo = this.repository(a.repository_id); const path = join(this.root, repo.repository_id, `${a.allocation_id}.submitted.bundle`);
    writeFileSync(path, Buffer.from(result.bundle, 'base64'), { flag: 'wx', mode: 0o600 });
    this.git(repo.canonical_root, ['bundle', 'verify', path]);
    this.git(repo.canonical_root, ['fetch', '--no-tags', '--no-write-fetch-head', path, `${result.commit}:refs/botsquad/submissions/${a.allocation_id}`]);
    requireThat(this.git(repo.canonical_root, ['rev-parse', `${result.commit}^`]) === a.base_commit, 'Imported commit has unrelated parent');
    const paths = this.paths(repo.canonical_root, a.base_commit, result.commit);
    requireThat(paths.includes(`src/${a.module}.mjs`) && paths.every(p => this.allowedPaths(a).includes(p)), 'Imported commit exceeds owned source scope');
    requireThat(this.git(repo.canonical_root, ['rev-parse','HEAD']) === repo.current_commit, 'Import changed canonical main');
  }
  private allowedPaths(a: Allocation) { return [`src/${a.module}.mjs`, `test/${a.module}.extra.test.mjs`]; }
  private sourcePath(a: Allocation, path: string, write = false) {
    requireThat((write ? this.allowedPaths(a) : [...Object.keys(SQUAD_FILES), ...this.allowedPaths(a)]).includes(path), 'Path is outside assigned source scope');
    const absolute = join(a.worktree_path, path); this.canonical(dirname(absolute));
    if (existsSync(absolute)) {
      const stat = lstatSync(absolute);
      requireThat(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, 'Source symlink/hardlink or non-file rejected'); this.canonical(absolute);
      requireThat(stat.size <= 16000, 'Source file exceeds byte limit');
    }
    return absolute;
  }
  private focusedTests(a: Allocation): Validation {
    // Every tracked source/test file must still be regular and within this allocation.
    for (const path of Object.keys(SQUAD_FILES)) this.sourcePath(a, path);
    const extra = `test/${a.module}.extra.test.mjs`;
    if (existsSync(join(a.worktree_path, extra))) this.sourcePath(a, extra);
    return runProduct(a.worktree_path, [`test/${a.module}.test.mjs`, ...(existsSync(join(a.worktree_path, extra)) ? [extra] : [])]);
  }
  private paths(root: string, base: string, commit?: string): string[] {
    return this.git(root, ['diff', '--name-only', '--no-ext-diff', base, ...(commit ? [commit] : [])]).split('\n').filter(Boolean);
  }
  private checkSubmission(s: Submission) {
    const a = this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=?', s.allocation_id);
    requireThat(a && a.repository_id === s.repository_id && a.task_id === s.task_id && a.worker_id === s.worker_id && a.base_commit === s.base_commit && a.branch_name === s.branch_name, 'Submission allocation mismatch');
    const repo = this.verifyAllocation(a);
    requireThat(sha(s.commit_sha) && this.git(a.worktree_path, ['rev-parse', 'HEAD']) === s.commit_sha, 'Submitted branch/commit mismatch');
    requireThat(this.git(a.worktree_path, ['rev-parse', `${s.commit_sha}^`]) === a.base_commit, 'Submitted commit is unrelated to allocation base');
    requireThat(!this.git(a.worktree_path, ['status', '--porcelain']), 'Submitted worktree is dirty');
    const paths = this.paths(repo.canonical_root, s.base_commit, s.commit_sha);
    requireThat(paths.includes(`src/${a.module}.mjs`) && paths.every(p => this.allowedPaths(a).includes(p)) && JSON.stringify(paths) === s.changed_paths, 'Submitted paths do not match verified scope');
    requireThat((JSON.parse(s.validation) as Validation).passed, 'Submission has no passing validation');
    return a;
  }
  specForDelivery(task: Task): string {
    requireThat(task.parent_task_id, 'Delivery requires a parent objective');
    const specTask = this.store.get<Task>("SELECT * FROM tasks WHERE parent_task_id=? AND kind='spec' AND status='completed'", task.parent_task_id);
    requireThat(specTask && this.company.worker(specTask.assignee_worker_id).role === 'product_manager', 'Product spec must complete before engineering');
    const artifact = this.company.artifacts(specTask.task_id)[0]; requireThat(artifact, 'Product spec artifact missing');
    this.company.artifactContent(artifact.artifact_id); return artifact.artifact_id;
  }
  context(task: Task) {
    if (task.kind === 'research') return undefined;
    const allocation = this.store.get<Allocation>('SELECT * FROM allocations WHERE task_id=?', task.task_id);
    const scope = this.store.get<{ repository_id: string }>('SELECT * FROM task_scopes WHERE task_id=?', task.task_id);
    const repo = this.store.get<Repository>('SELECT * FROM repositories WHERE workflow_task_id=? OR repository_id=?', task.task_id, allocation?.repository_id ?? scope?.repository_id ?? '');
    const specId = repo?.spec_artifact_id ?? (task.kind === 'delivery' ? this.specForDelivery(task) : undefined);
    return { contract: PRODUCT_CONTRACT, allocation, repository: repo,
      own_submission: allocation ? this.store.get<Submission>('SELECT * FROM submissions WHERE allocation_id=?', allocation.allocation_id) : undefined,
      confinement_checks: allocation ? { source_checkout_path: join(this.sourceRoot, 'src', 'main.ts'), sibling: this.allocations().filter(a => a.repository_id === allocation.repository_id && a.allocation_id !== allocation.allocation_id).map(a => ({ allocation_id: a.allocation_id, path: `src/${a.module}.mjs` }))[0] } : undefined,
      specification: specId ? { artifact_id: specId, content: this.company.artifactContent(specId) } : undefined,
      submissions: repo && task.kind === 'delivery' ? this.submissions(repo.repository_id) : undefined,
      reviews: repo && task.kind === 'delivery' ? this.reviews().filter(r => r.repository_id === repo.repository_id) : undefined,
      integration: repo ? this.integrations().find(i => i.repository_id === repo.repository_id) : undefined };
  }
  execute(name: keyof typeof ENGINEERING_TOOLS, input: unknown, actor: Actor): unknown {
    requireThat(actor.worker.capability_profile.includes(ENGINEERING_TOOLS[name]), `Missing capability: ${ENGINEERING_TOOLS[name]}`);
    switch (name) {
      case 'create_repository': {
        const args = strictObject(input, ['product_name']); requireThat(textField(args, 'product_name', 60) === 'SquadStatus', 'Only the managed SquadStatus scaffold is approved');
        requireThat(actor.worker.role === 'cto' && actor.task.kind === 'delivery', 'Only the assigned CTO creates products');
        const existing = this.store.get<Repository>('SELECT * FROM repositories WHERE workflow_task_id=?', actor.task.task_id);
        if (existing) return this.ownedRepository(actor, existing.repository_id);
        const spec = this.specForDelivery(actor.task); const repositoryId = id('repository');
        const directory = join(this.root, repositoryId); const root = join(directory, 'main');
        this.store.run('INSERT INTO repositories VALUES (?,?,?,\'main\',NULL,NULL,?,?,?,\'creating\',?,?)', repositoryId, 'SquadStatus', root, actor.worker.worker_id, actor.task.task_id, spec, now(), now());
        try {
          this.canonical(this.root); mkdirSync(root, { recursive: true, mode: 0o700 }); this.canonical(root);
          for (const [path, content] of Object.entries(SQUAD_FILES)) { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), content, { flag: 'wx', mode: 0o600 }); }
          this.git(root, ['init', '-b', 'main']); this.git(root, ['add', '--', ...Object.keys(SQUAD_FILES)]); this.git(root, ['commit', '-m', 'Initialize SquadStatus acceptance scaffold']);
          const base = this.git(root, ['rev-parse', 'HEAD']);
          requireThat(!this.git(root, ['status', '--porcelain']), 'Scaffold is dirty');
          this.store.run("UPDATE repositories SET base_commit=?,current_commit=?,status='ready',updated_at=? WHERE repository_id=?", base, base, now(), repositoryId);
          this.event('repository_created', actor, { repository_id: repositoryId, base_commit: base }); return this.repository(repositoryId);
        } catch { this.store.run("UPDATE repositories SET status='blocked',updated_at=? WHERE repository_id=?", now(), repositoryId); throw new Error('Repository creation failed; retained for inspection'); }
      }
      case 'assign_engineering': {
        const args = strictObject(input, ['repository_id', 'calculate_worker_id', 'format_worker_id']);
        if (this.company.infrastructure.linux) this.company.infrastructure.requireReadyNix();
        const repo = this.ownedRepository(actor, textField(args, 'repository_id', 100));
        const existing = this.allocations().filter(a => a.repository_id === repo.repository_id);
        requireThat(textField(args, 'calculate_worker_id', 100) !== textField(args, 'format_worker_id', 100), 'Engineering workers must differ');
        if (existing.length) {
          requireThat(existing.length === 2 && existing.every(a => a.worker_id === args[`${a.module}_worker_id`] && a.status !== 'allocating' && a.status !== 'blocked'), 'Allocation already exists or requires inspection');
          existing.filter(a => a.status !== 'pending_infrastructure').forEach(a => this.verifyAllocation(a)); return existing;
        }
        const workers = (['calculate', 'format'] as const).map(module => {
          const worker = this.company.worker(textField(args, `${module}_worker_id`, 100));
          requireThat(worker.role === 'engineer' && worker.manager_worker_id === actor.worker.worker_id && worker.enabled, 'Engineer manager/profile mismatch');
          requireThat(!this.store.get("SELECT 1 FROM allocations WHERE worker_id=? AND status IN ('pending_infrastructure','allocating','active','submitting','blocked')", worker.worker_id), 'Worker already owns an active allocation');
          return { worker, module };
        });
        const allocated = this.store.transaction(() => workers.map(({ worker, module }) => {
          const task = this.company.createTask(actor.worker.principal_id, worker, { objective: `Implement ${module === 'calculate' ? 'calculateStatusSummary(workers)' : 'formatStatusSummary(summary)'} for SquadStatus. Read the specification and immutable focused tests. Edit only your module and optional extra test. Run focused tests, inspect diff, submit a verified commit.`, acceptance_criteria: PRODUCT_CONTRACT, constraints: 'Own allocation only; no shell/network/remote/force, no worker creation; at most one submission.' }, actor.task.task_id, 'engineering', actor.execution.execution_id);
          const allocationId = id('allocation'); const branch = `botsquad/${module}/${task.task_id}`;
          const path = this.company.infrastructure.linux ? this.company.infrastructure.clonePath(worker.worker_id, allocationId) : join(this.root, repo.repository_id, 'worktrees', allocationId);
          this.store.run("INSERT INTO allocations VALUES (?,?,?,?,?,?,?,?,'allocating',?,?)", allocationId, repo.repository_id, worker.worker_id, task.task_id, branch, path, repo.base_commit, module, now(), now());
          if (this.company.infrastructure.linux) {
            this.store.run("UPDATE allocations SET status='pending_infrastructure' WHERE allocation_id=?", allocationId);
            this.store.run("UPDATE tasks SET blocking_reason='Waiting for approved Linux identity and project clone' WHERE task_id=?", task.task_id);
            this.store.run("INSERT INTO worker_project_bindings VALUES (?,?,?,?,'pending',NULL)", allocationId, worker.worker_id, repo.repository_id, path);
          }
          return this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=?', allocationId)!;
        }));
        if (this.company.infrastructure.linux) {
          for (const a of allocated) { this.company.infrastructure.enqueue(a.worker_id); this.company.infrastructure.enqueue(a.worker_id, 'prepare_worker_project_clone', a.allocation_id); }
          this.event('engineering_batch_awaiting_infrastructure', actor, { allocations: allocated.map(a => a.allocation_id) });
          return allocated;
        }
        try {
          for (const a of allocated) {
            mkdirSync(dirname(a.worktree_path), { recursive: true, mode: 0o700 }); this.canonical(dirname(a.worktree_path));
            this.git(repo.canonical_root, ['worktree', 'add', '-b', a.branch_name, a.worktree_path, repo.base_commit]); this.verifyAllocation(a);
          }
          this.store.transaction(() => allocated.forEach(a => this.store.run("UPDATE allocations SET status='active',updated_at=? WHERE allocation_id=?", now(), a.allocation_id)));
          this.event('engineering_batch_assigned', actor, { allocations: allocated.map(a => a.allocation_id) }); return this.allocations().filter(a => a.repository_id === repo.repository_id);
        } catch { this.store.run("UPDATE allocations SET status='blocked',updated_at=? WHERE repository_id=?", now(), repo.repository_id); throw new Error('Worktree allocation failed; retained for inspection'); }
      }
      case 'read_source': case 'write_source': case 'run_repo_tests': case 'inspect_git': case 'submit_engineering': {
        const keys = name === 'write_source' ? ['allocation_id', 'path', 'content'] : name === 'read_source' ? ['allocation_id', 'path'] : name === 'submit_engineering' ? ['allocation_id', 'summary'] : ['allocation_id'];
        const args = strictObject(input, keys); const a = this.allocation(actor, textField(args, 'allocation_id', 100), name === 'write_source');
        if (name === 'read_source') { const path = textField(args, 'path', 200); return { path, content: readFileSync(this.sourcePath(a, path), 'utf8') }; }
        if (name === 'write_source') {
          const path = textField(args, 'path', 200); const content = textField(args, 'content', 16000) + '\n'; const absolute = this.sourcePath(a, path, true);
          requireThat(Buffer.byteLength(content) <= 16000, 'Source exceeds byte limit');
          if (this.company.infrastructure.linux) this.workerAction(a, 'write_project_source', { path, content });
          else { const fd = openSync(absolute, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, 0o600);
          try { writeFileSync(fd, content); } finally { closeSync(fd); } }
          this.event('source_written', actor, { allocation_id: a.allocation_id, path, bytes: Buffer.byteLength(content) }); return { path, bytes: Buffer.byteLength(content) };
        }
        if (name === 'inspect_git') return { status: this.git(a.worktree_path, ['status', '--short']), diff: this.git(a.worktree_path, ['diff', '--no-ext-diff', a.base_commit, '--', ...this.allowedPaths(a)]), head: this.git(a.worktree_path, ['rev-parse', 'HEAD']) };
        if (name === 'run_repo_tests') { const validation = this.focusedTests(a); this.event('product_tests_run', actor, { allocation_id: a.allocation_id, validation }); return validation; }
        const existing = this.store.get<Submission>('SELECT * FROM submissions WHERE allocation_id=?', a.allocation_id);
        if (existing) { this.checkSubmission(existing); return existing; }
        requireThat(a.status === 'active' && this.git(a.worktree_path, ['rev-parse', 'HEAD']) === a.base_commit, 'Submission HEAD is not the allocation base; inspect unrelated/partial commit');
        const untracked = this.git(a.worktree_path, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean);
        const paths = [...new Set([...this.paths(a.worktree_path, a.base_commit), ...untracked])].sort();
        requireThat(paths.includes(`src/${a.module}.mjs`) && paths.every(p => this.allowedPaths(a).includes(p)), 'Submission has missing source or unrelated/dirty paths');
        paths.forEach(p => { requireThat(existsSync(this.sourcePath(a, p, true)), 'Submission cannot delete source'); });
        const validation = this.focusedTests(a); requireThat(validation.passed, 'Focused tests failed; fix the implementation before submitting');
        const summary = textField(args, 'summary', 2000);
        this.store.run("UPDATE allocations SET status='submitting',updated_at=? WHERE allocation_id=?", now(), a.allocation_id);
        try {
          if (this.company.infrastructure.linux) {
            const result = this.workerAction(a, 'commit_project'); this.importSubmission(a, result);
            this.event('worker_uid_commit', actor, { allocation_id: a.allocation_id, uid: result.uid, gid: result.gid, commit: result.commit });
          } else { this.git(a.worktree_path, ['add', '--', ...paths]); this.git(a.worktree_path, ['commit', '-m', `Implement ${a.module} for ${a.task_id}`]); }
          requireThat(!this.git(a.worktree_path, ['status', '--porcelain']), 'Commit left a dirty worktree');
          const commit = this.git(a.worktree_path, ['rev-parse', 'HEAD']); const submissionId = id('submission');
          this.store.transaction(() => {
            this.store.run('INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', submissionId, a.repository_id, a.task_id, a.worker_id, actor.execution.execution_id, a.allocation_id, a.base_commit, a.branch_name, commit, JSON.stringify(paths), JSON.stringify(validation), summary, now());
            this.store.run("UPDATE allocations SET status='submitted',updated_at=? WHERE allocation_id=?", now(), a.allocation_id);
          });
          this.event('engineering_submitted', actor, { submission_id: submissionId, allocation_id: a.allocation_id, commit }); return this.store.get<Submission>('SELECT * FROM submissions WHERE submission_id=?', submissionId);
        } catch { this.store.run("UPDATE allocations SET status='blocked',updated_at=? WHERE allocation_id=?", now(), a.allocation_id); throw new Error('Submission interrupted or failed; inspect retained Git state'); }
      }
      case 'assign_review': {
        const args = strictObject(input, ['repository_id', 'reviewer_worker_id']); const repo = this.ownedRepository(actor, textField(args, 'repository_id', 100));
        const reviewer = this.company.worker(textField(args, 'reviewer_worker_id', 100));
        requireThat(reviewer.role === 'reviewer' && reviewer.manager_worker_id === actor.worker.worker_id, 'Reviewer manager/profile mismatch');
        const submissions = this.submissions(repo.repository_id);
        requireThat(submissions.length === 2 && submissions.every(s => this.company.task(s.task_id).status === 'completed'), 'Both engineering tasks must complete before review');
        submissions.forEach(s => this.checkSubmission(s));
        const existing = this.store.get<Task>("SELECT t.* FROM tasks t JOIN task_scopes s USING(task_id) WHERE s.repository_id=? AND t.kind='review'", repo.repository_id);
        if (existing) { requireThat(existing.assignee_worker_id === reviewer.worker_id, 'Review already assigned'); return existing; }
        return this.store.transaction(() => {
          const task = this.company.createTask(actor.worker.principal_id, reviewer, { objective: 'Independently review the exact SquadStatus submissions against the product spec. Read the review packet and submit a structured approved or changes_required review. Source is read-only.', acceptance_criteria: PRODUCT_CONTRACT, constraints: 'One review, exact recorded commits only; no source writes, commits, integration or delegation.' }, actor.task.task_id, 'review', actor.execution.execution_id);
          this.store.run('INSERT INTO task_scopes VALUES (?,?)', task.task_id, repo.repository_id); return task;
        });
      }
      case 'read_review_packet': case 'submit_review': {
        const args = strictObject(input, name === 'read_review_packet' ? [] : ['status', 'source_commits', 'linus_findings', 'ada_findings', 'integration_risks', 'acceptance_assessment', 'recommended_disposition']);
        requireThat(actor.worker.role === 'reviewer' && actor.task.kind === 'review', 'Read-only review requires an assigned reviewer');
        const scope = this.store.get<{ repository_id: string }>('SELECT * FROM task_scopes WHERE task_id=?', actor.task.task_id); requireThat(scope, 'Review scope missing');
        const repo = this.repository(scope.repository_id); requireThat(repo.created_by === actor.worker.manager_worker_id, 'Reviewer repository manager mismatch');
        const submissions = this.submissions(repo.repository_id); requireThat(submissions.length === 2, 'Review needs two submissions'); submissions.forEach(s => this.checkSubmission(s));
        const commits = submissions.map(s => s.commit_sha).sort();
        if (name === 'read_review_packet') return { repository_id: repo.repository_id, base_commit: repo.base_commit,
          spec: this.company.artifactContent(repo.spec_artifact_id), contract: PRODUCT_CONTRACT,
          base_files: Object.fromEntries(Object.keys(SQUAD_FILES).map(path => [path, this.git(repo.canonical_root, ['show', `${repo.base_commit}:${path}`])])),
          submissions: submissions.map(s => ({ ...s, worker_name: this.company.worker(s.worker_id).display_name, module: this.store.get<Allocation>('SELECT * FROM allocations WHERE allocation_id=?', s.allocation_id)!.module, diff: this.git(repo.canonical_root, ['diff', '--no-ext-diff', s.base_commit, s.commit_sha]) })),
          trusted_tests: Object.fromEntries(Object.entries(SQUAD_FILES).filter(([path]) => path.startsWith('test/'))) };
        requireThat(args.status === 'approved' || args.status === 'changes_required', 'Invalid review disposition');
        requireThat(Array.isArray(args.source_commits) && JSON.stringify([...args.source_commits].sort()) === JSON.stringify(commits), 'Review source commits do not match submissions');
        requireThat(this.store.get("SELECT 1 FROM audit_events WHERE execution_id=? AND type='tool_completed' AND json_extract(detail,'$.tool')='read_review_packet'", actor.execution.execution_id), 'Read the exact review packet before submitting a review');
        const existing = this.store.get<Review>('SELECT * FROM reviews WHERE task_id=?', actor.task.task_id);
        if (existing) { requireThat(existing.status === args.status, 'Review is immutable'); return existing; }
        const content = JSON.stringify({ status: args.status, source_commits: commits, linus_findings: textField(args, 'linus_findings', 2500), ada_findings: textField(args, 'ada_findings', 2500), integration_risks: textField(args, 'integration_risks', 2500), acceptance_assessment: textField(args, 'acceptance_assessment', 2500), recommended_disposition: textField(args, 'recommended_disposition', 2500) }, null, 2);
        return this.store.transaction(() => {
          const artifact = this.company.saveArtifact(actor, 'Independent SquadStatus review', content, 'review'); const reviewId = id('review');
          this.store.run('INSERT INTO reviews VALUES (?,?,?,?,?,?,?,?,?)', reviewId, repo.repository_id, actor.task.task_id, actor.worker.worker_id, actor.execution.execution_id, JSON.stringify(commits), args.status as string, artifact.artifact_id, now());
          this.store.run("UPDATE allocations SET status='reviewed',updated_at=? WHERE repository_id=?", now(), repo.repository_id);
          this.event('review_submitted', actor, { review_id: reviewId, status: args.status, source_commits: commits }); return this.store.get<Review>('SELECT * FROM reviews WHERE review_id=?', reviewId);
        });
      }
      case 'integrate_repository': {
        const args = strictObject(input, ['repository_id', 'review_id']); const repo = this.ownedRepository(actor, textField(args, 'repository_id', 100));
        const review = this.store.get<Review>('SELECT * FROM reviews WHERE review_id=?', textField(args, 'review_id', 100));
        requireThat(review && review.repository_id === repo.repository_id && review.status === 'approved' && this.company.task(review.task_id).status === 'completed', 'Integration requires completed approved review of this repository');
        this.company.artifactContent(review.artifact_id);
        const submissions = this.submissions(repo.repository_id); submissions.forEach(s => this.checkSubmission(s));
        const commits = submissions.map(s => s.commit_sha).sort(); requireThat(submissions.length === 2 && JSON.stringify(commits) === review.source_commits, 'Integration commits differ from review');
        const existing = this.store.get<Integration>('SELECT * FROM integrations WHERE repository_id=?', repo.repository_id);
        if (existing) { requireThat(existing.status === 'completed' && existing.review_id === review.review_id && existing.final_commit === this.git(repo.canonical_root, ['rev-parse', 'HEAD']), 'Integration already attempted; inspect retained state'); return existing; }
        requireThat(this.git(repo.canonical_root, ['rev-parse', 'HEAD']) === repo.current_commit && repo.current_commit === repo.base_commit && !this.git(repo.canonical_root, ['status', '--porcelain']), 'Default branch changed or is dirty');
        const integrationId = id('integration'); const candidatePath = join(this.root, repo.repository_id, 'integrations', integrationId);
        this.store.run("INSERT INTO integrations VALUES (?,?,?,?,?,NULL,NULL,'cherry-pick-then-fast-forward',NULL,'preparing',NULL,?,?,?,?)", integrationId, repo.repository_id, review.review_id, repo.current_commit, review.source_commits, actor.worker.worker_id, actor.execution.execution_id, now(), now());
        try {
          mkdirSync(dirname(candidatePath), { recursive: true, mode: 0o700 }); this.canonical(dirname(candidatePath));
          this.git(repo.canonical_root, ['worktree', 'add', '-b', `botsquad/integration/${integrationId}`, candidatePath, repo.current_commit]); this.canonical(candidatePath);
          for (const commit of commits) this.git(candidatePath, ['cherry-pick', commit]);
          const candidate = this.git(candidatePath, ['rev-parse', 'HEAD']);
          requireThat(this.git(candidatePath, ['rev-list', '--count', `${repo.base_commit}..${candidate}`]) === '2', 'Candidate contains unreviewed history');
          const tests = ['test/calculate.test.mjs', 'test/format.test.mjs', 'test/integrated.test.mjs', ...['calculate', 'format'].map(m => `test/${m}.extra.test.mjs`).filter(p => existsSync(join(candidatePath, p)))];
          const validation = runProduct(candidatePath, tests); const output = validation.passed ? runProduct(candidatePath, ['cli.mjs'], true) : undefined;
          const passed = validation.passed && output?.passed && output.output.trim() === 'Total: 4\nWorking: 2\nIdle: 1\nBlocked: 1\nFailed: 0';
          this.store.run('UPDATE integrations SET candidate_commit=?,validation=?,updated_at=? WHERE integration_id=?', candidate, JSON.stringify({ tests: validation, output }), now(), integrationId);
          requireThat(passed, 'Integrated acceptance tests or product output failed');
          requireThat(this.git(repo.canonical_root, ['rev-parse', 'HEAD']) === repo.current_commit && !this.git(repo.canonical_root, ['status', '--porcelain']), 'Default branch changed during integration');
          this.git(repo.canonical_root, ['merge', '--ff-only', candidate]);
          requireThat(this.git(repo.canonical_root, ['rev-parse', 'HEAD']) === candidate && !this.git(repo.canonical_root, ['status', '--porcelain']), 'Final integration state mismatch');
          this.store.transaction(() => {
            this.store.run("UPDATE integrations SET final_commit=?,status='completed',updated_at=? WHERE integration_id=?", candidate, now(), integrationId);
            this.store.run('UPDATE repositories SET current_commit=?,updated_at=? WHERE repository_id=?', candidate, now(), repo.repository_id);
            this.store.run("UPDATE allocations SET status='integrated',updated_at=? WHERE repository_id=?", now(), repo.repository_id);
          });
          this.event('integration_completed', actor, { integration_id: integrationId, candidate_commit: candidate, final_commit: candidate });
        } catch (error) {
          const unchanged = this.git(repo.canonical_root, ['rev-parse', 'HEAD']) === repo.current_commit;
          this.store.run("UPDATE integrations SET status=?,error=?,updated_at=? WHERE integration_id=?", unchanged ? 'failed' : 'blocked', 'Integration conflict, test failure or interrupted Git operation; inspect candidate evidence', now(), integrationId);
          if (!unchanged) this.store.run("UPDATE repositories SET status='blocked' WHERE repository_id=?", repo.repository_id);
          this.event('integration_failed', actor, { integration_id: integrationId, default_unchanged: unchanged, reason: error instanceof Error && error.name === 'DomainError' ? error.message : 'Git operation failed' });
        }
        return this.store.get<Integration>('SELECT * FROM integrations WHERE integration_id=?', integrationId);
      }
    }
  }
  recover() {
    this.store.run("UPDATE repositories SET status='blocked',updated_at=? WHERE status='creating'", now());
    this.store.run("UPDATE allocations SET status='blocked',updated_at=? WHERE status IN ('allocating','submitting') OR (status='active' AND task_id IN (SELECT task_id FROM tasks WHERE status='blocked'))", now());
    this.store.run("UPDATE integrations SET status='blocked',error='Application restart during integration; inspect candidate and default branch',updated_at=? WHERE status='preparing'", now());
    this.store.run("UPDATE repositories SET status='blocked' WHERE repository_id IN (SELECT repository_id FROM integrations WHERE status='blocked')");
    for (const a of this.allocations().filter(a => a.status === 'blocked')) {
      this.store.run("UPDATE tasks SET status='blocked',blocking_reason='Engineering allocation requires inspection',updated_at=? WHERE task_id=? AND status='queued'", now(), a.task_id);
    }
  }
  assertDeliverable(task: Task) {
    if (task.kind === 'engineering') {
      const submission = this.store.get<Submission>('SELECT * FROM submissions WHERE task_id=?', task.task_id);
      requireThat(submission, 'Engineer finished without a verified submission'); this.checkSubmission(submission);
    }
    if (task.kind === 'spec') requireThat(this.company.artifacts(task.task_id).length, 'Product specification artifact required');
    if (task.kind === 'review') requireThat(this.store.get('SELECT 1 FROM reviews WHERE task_id=?', task.task_id), 'Reviewer finished without a structured review');
    if (task.kind === 'delivery' || task.kind === 'product') {
      const deliveryId = task.kind === 'delivery' ? task.task_id : this.store.get<Task>("SELECT * FROM tasks WHERE parent_task_id=? AND kind='delivery' AND status='completed'", task.task_id)?.task_id;
      requireThat(deliveryId && this.store.get("SELECT 1 FROM integrations i JOIN repositories r ON r.repository_id=i.repository_id WHERE r.workflow_task_id=? AND i.status='completed' AND r.status='ready' AND r.current_commit=i.final_commit", deliveryId), 'Delivery completion requires successful trusted integration evidence');
    }
  }
}
