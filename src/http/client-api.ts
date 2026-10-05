import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Company } from '../control/company.js';
import type { Dispatcher } from '../control/dispatcher.js';
import { RemoteClients, type Authentication, type Receipt } from '../control/remote-clients.js';
import { ClientDTOs, privateStrategyFilter, type Resource } from '../client/dto.js';
import { canonical, check, ClientError, hash, identifier, LIMITS, newId, object, requestKey, text, type Scope } from '../client/protocol.js';
import { DomainError } from '../domain/model.js';
import { parseAIProfile, type RuntimeCatalog } from '../domain/ai-profile.js';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
interface Stream { response: ServerResponse; authorization: string; deviceId: string; cursor: number; blocked: boolean; heartbeat: number; expiry: NodeJS.Timeout }
interface Notification { cursor: number; type: string; worker_id: string | null; task_id: string | null; execution_id: string | null; created_at: string }
const resourceScope: Record<Resource, Scope> = { workers: 'state:read', tasks: 'state:read', executions: 'state:read', messages: 'state:read', projects: 'projects:read', repositories: 'projects:read', artifacts: 'artifacts:read' };

export class ClientAPI {
  readonly trust: RemoteClients;
  readonly dto: ClientDTOs;
  private streams = new Set<Stream>();
  private readonly timer: NodeJS.Timeout;
  private readonly cleanupTimer: NodeJS.Timeout;
  private readonly changed = () => this.pump();
  constructor(readonly company: Company, readonly dispatcher: Dispatcher, readonly commit: string, clock = Date.now) {
    this.trust = new RemoteClients(company, clock); this.dto = new ClientDTOs(company, this.trust.hq.hq_id);
    company.on('changed', this.changed);
    this.timer = setInterval(() => this.pump(), 1000).unref();
    this.cleanupTimer = setInterval(() => this.trust.cleanup(), 30_000).unref();
  }
  close() {
    clearInterval(this.timer); clearInterval(this.cleanupTimer); this.company.off('changed', this.changed);
    for (const stream of this.streams) { clearTimeout(stream.expiry); stream.response.end(); } this.streams.clear();
  }
  private envelope(data: unknown, requestId: string) { return { data, request_id: requestId }; }
  private currentCursor() { return this.company.store.get<{ n: number }>("SELECT coalesce((SELECT seq FROM sqlite_sequence WHERE name='client_events'),0) n")!.n; }
  private cursor(n: number) { return `${this.trust.hq.hq_id}:${n}`; }
  private parseCursor(value: string): number {
    check(value.length <= 90 && value.startsWith(`${this.trust.hq.hq_id}:`), 400, 'invalid_cursor', 'Cursor does not belong to this HQ.');
    const tail = value.slice(this.trust.hq.hq_id.length + 1); check(/^(0|[1-9]\d{0,15})$/.test(tail));
    const n = Number(tail); check(Number.isSafeInteger(n) && n <= this.currentCursor(), 400, 'invalid_cursor', 'Cursor is invalid.'); return n;
  }
  private retained(cursor: number) {
    const min = this.company.store.get<{ n: number | null }>('SELECT min(cursor) n FROM client_events')!.n;
    check(cursor >= (min === null ? this.currentCursor() : min - 1), 409, 'reset_required', 'Event cursor is no longer retained; refetch authoritative state.');
  }
  private pump() {
    for (const stream of this.streams) {
      try {
        this.trust.authenticate(stream.authorization, 'state:read');
        this.retained(stream.cursor);
        if (stream.response.writableLength > 65_536) { stream.response.destroy(); continue; }
        if (stream.blocked) continue;
        const events = this.company.store.all<Notification>('SELECT * FROM client_events WHERE cursor>? ORDER BY cursor LIMIT 100', stream.cursor);
        for (const event of events) {
          const cursor = this.cursor(event.cursor);
          const payload = { event_id: cursor, cursor, type: event.type, worker_id: event.worker_id, task_id: event.task_id, execution_id: event.execution_id, created_at: event.created_at };
          stream.cursor = event.cursor;
          if (!stream.response.write(`id: ${cursor}\nevent: ${event.type}\ndata: ${JSON.stringify(payload)}\n\n`)) { stream.blocked = true; break; }
        }
        if (!stream.blocked && this.trust.clock() - stream.heartbeat >= 15_000) {
          stream.heartbeat = this.trust.clock(); stream.blocked = !stream.response.write(': keepalive\n\n');
        }
      } catch (error) {
        const code = error instanceof ClientError ? error.code : 'stream_closed';
        stream.response.end(`event: ${code === 'reset_required' ? 'reset_required' : 'authorization_expired'}\ndata: {}\n\n`);
        this.streams.delete(stream);
      }
    }
  }
  private events(req: IncomingMessage, res: ServerResponse, auth: Authentication, requestId: string) {
    check(this.streams.size < LIMITS.devices * LIMITS.streamsPerDevice && [...this.streams].filter(s => s.deviceId === auth.device.device_id).length < LIMITS.streamsPerDevice,
      429, 'stream_limit', 'Device event stream limit reached.');
    const last = req.headers['last-event-id']; check(last === undefined || typeof last === 'string');
    const cursor = last === undefined ? this.currentCursor() : this.parseCursor(last); this.retained(cursor);
    res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive', 'X-Request-ID': requestId });
    res.write(`event: ready\ndata: ${JSON.stringify({ cursor: this.cursor(cursor), expires_at: auth.expires_at })}\n\n`);
    const expiry = setTimeout(() => { res.end('event: authorization_expired\ndata: {}\n\n'); this.streams.delete(stream); }, Math.max(1, Date.parse(auth.expires_at) - this.trust.clock())).unref();
    const stream: Stream = { response: res, authorization: req.headers.authorization!, deviceId: auth.device.device_id, cursor, blocked: false, heartbeat: this.trust.clock(), expiry };
    this.streams.add(stream); res.on('close', () => { clearTimeout(expiry); this.streams.delete(stream); });
    res.on('drain', () => { stream.blocked = false; this.pump(); }); this.pump();
  }
  private body(req: IncomingMessage): Promise<unknown> {
    check(/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers['content-type'] ?? ''), 415, 'unsupported_content_type', 'Use application/json.');
    check(req.headers['content-encoding'] === undefined, 415, 'unsupported_content_type', 'Encoded request bodies are unsupported.');
    check(!req.headers['content-length'] || Number(req.headers['content-length']) <= LIMITS.bodyBytes, 413, 'request_too_large', 'Request exceeds the size limit.');
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []; let length = 0; let failed = false;
      const timeout = setTimeout(() => { failed = true; chunks.length = 0; reject(new ClientError(408, 'request_timeout', 'Request body timed out.')); }, 10_000).unref();
      req.on('data', (chunk: Buffer) => {
        if (failed) return; length += chunk.length;
        if (length > LIMITS.bodyBytes) { failed = true; clearTimeout(timeout); chunks.length = 0; reject(new ClientError(413, 'request_too_large', 'Request exceeds the size limit.')); }
        else chunks.push(chunk);
      });
      req.on('end', () => { clearTimeout(timeout); if (failed) return; try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))) as unknown); } catch { reject(new ClientError(400, 'invalid_json', 'Malformed JSON.')); } });
      req.on('error', () => { clearTimeout(timeout); reject(new ClientError(400, 'invalid_request', 'Request could not be read.')); });
      req.on('aborted', () => { clearTimeout(timeout); reject(new ClientError(400, 'invalid_request', 'Request was interrupted.')); });
    });
  }
  async handle(req: IncomingMessage, res: ServerResponse) {
    const requestId = newId('request');
    const json = (status: number, value: unknown) => { res.writeHead(status, { ...headers, 'X-Request-ID': requestId, ...(status === 429 ? { 'Retry-After': '60' } : {}) }); res.end(JSON.stringify(value)); };
    try {
      this.trust.rates.take('all', 600, this.trust.clock());
      check(!req.headers.origin && !req.headers.cookie && !req.headers['x-botsquad-token'] && !req.headers['sec-fetch-site'], 403, 'browser_context_denied', 'Use the local browser API for browser sessions.');
      check((req.url?.length ?? 0) <= 2048);
      for (const name of ['authorization', 'idempotency-key', 'last-event-id', 'content-type']) check(req.rawHeaders.filter((v, i) => i % 2 === 0 && v.toLowerCase() === name).length <= 1);
      const url = new URL(req.url!, 'http://client.invalid');
      check(!url.hash && !url.pathname.includes('%') && req.url!.startsWith('/api/v1/'), 404, 'unsupported_version', 'Client API version or route is not supported.');
      const path = url.pathname.slice('/api/v1'.length);
      if (req.method === 'GET') {
        check(!req.headers['transfer-encoding'] && (!req.headers['content-length'] || req.headers['content-length'] === '0'));
        if (path === '/discovery') {
          check(!url.search); json(200, this.envelope({ hq_id: this.trust.hq.hq_id, api_versions: ['v1'], server_version: '0.1.0', commit: /^[0-9a-f]{40}$/.test(this.commit) ? this.commit : 'unknown', authentication: 'Ed25519-challenge-opaque-token-v1' }, requestId)); return;
        }
        const resourceMatch = /^\/(workers|tasks|executions|projects|repositories|messages|artifacts)(?:\/([^/]+))?$/.exec(path);
        if (resourceMatch) {
          const resource = resourceMatch[1] as Resource;
          const auth = this.trust.authenticate(req.headers.authorization, resourceScope[resource]); this.readRate(auth);
          if (resourceMatch[2]) { check(!url.search); json(200, this.envelope(this.dto.one(resource, resourceMatch[2]), requestId)); }
          else json(200, this.envelope(this.dto.page(resource, url.searchParams), requestId));
          return;
        }
        const repositories = /^\/projects\/([^/]+)\/repositories$/.exec(path);
        if (repositories) {
          const auth = this.trust.authenticate(req.headers.authorization, 'projects:read'); this.readRate(auth);
          this.dto.one('projects', repositories[1]!); json(200, this.envelope(this.dto.page('repositories', url.searchParams, repositories[1]!), requestId)); return;
        }
        check(!url.search);
        const auth = this.trust.authenticate(req.headers.authorization, path === '/capabilities' ? undefined : 'state:read'); this.readRate(auth);
        if (path === '/capabilities') {
          json(200, this.envelope({ api_version: 'v1', hq_id: this.trust.hq.hq_id, device_id: auth.device.device_id, owner_principal_id: auth.device.owner_principal_id,
            capabilities: JSON.parse(auth.device.capabilities), features: { projects: true, artifact_metadata: true, artifact_content: false, reconnectable_events: true, interrupt: this.dispatcher.adapter.supportsInterrupt, remote_approvals: false, device_administration: false },
            limits: { page_default: 50, page_max: 100, body_bytes: LIMITS.bodyBytes, event_retention_count: LIMITS.events, streams_per_device: LIMITS.streamsPerDevice, idempotency_retention_ms: LIMITS.retryMs },
            limitations: ['single-human', 'single-company', 'private-transport-required', 'local-only-protected-approvals', 'artifact-metadata-only'] }, requestId)); return;
        }
        if (path === '/overview') {
          const count = (table: string, where = '1') => this.company.store.get<{ n: number }>(`SELECT count(*) n FROM ${table} WHERE ${where} ${privateStrategyFilter(table)}`)!.n;
          json(200, this.envelope({ hq_id: this.trust.hq.hq_id, paused: this.company.paused, runtime_status: this.dispatcher.runtimeState,
            workers: count('workers'), tasks: count('tasks'), queued_tasks: count('tasks', "status='queued'"), active_executions: count('executions', "origin='task' AND status='running'"),
            pending_approvals: count('approvals', "status='pending'") + count('project_approvals', "status='pending'"), event_cursor: this.cursor(this.currentCursor()) }, requestId)); return;
        }
        if (path === '/runtime') {
          const catalog = await this.dispatcher.runtimeCatalog(); this.trust.authenticate(req.headers.authorization, 'state:read');
          json(200, this.envelope({ default_model: catalog.defaultModel, models: catalog.models.slice(0, 100).map(m => ({ id: m.id, model: m.model, display_name: m.displayName, default_reasoning_effort: m.defaultReasoningEffort, reasoning_efforts: m.supportedReasoningEfforts.map(e => e.reasoningEffort) })) }, requestId)); return;
        }
        if (path === '/events') { this.events(req, res, auth, requestId); return; }
        throw new ClientError(404, 'not_found', 'Client API route was not found.');
      }
      check(req.method === 'POST', 405, 'method_not_allowed', 'Method is not supported.'); check(!url.search);
      if (['/pairings/claim', '/auth/challenge', '/auth/token'].includes(path)) {
        const value = await this.body(req);
        const result = path === '/pairings/claim' ? this.trust.claim(value) : path === '/auth/challenge' ? this.trust.challenge(value) : this.trust.token(value);
        json(path === '/pairings/claim' ? 201 : 200, this.envelope(result, requestId)); return;
      }
      const operation = this.operation(path); const auth = this.trust.authenticate(req.headers.authorization, operation.scope);
      this.trust.rates.take(`mutate:${auth.device.device_id}`, 60, this.trust.clock());
      const key = requestKey(req.headers['idempotency-key'], this.trust.clock()); const value = await this.body(req);
      const requestHash = hash(canonical(value));
      // An exact retry does not depend on today's runtime catalog or target state.
      const prior = this.receipt(auth, key, path, requestHash);
      if (prior) { this.trust.authenticate(req.headers.authorization, operation.scope); json(prior.status, JSON.parse(prior.response)); return; }
      let catalog: RuntimeCatalog | undefined;
      if (operation.kind === 'profile') { const a = object(value, ['profile', 'expected_profile']); try { parseAIProfile(a.profile); parseAIProfile(a.expected_profile); } catch { throw new ClientError(400, 'invalid_profile', 'Profile does not match the contract.'); } catalog = await this.dispatcher.runtimeCatalog(); }
      this.trust.cleanup();
      const result = this.company.store.transaction(() => {
        const current = this.trust.authenticate(req.headers.authorization, operation.scope); requestKey(key, this.trust.clock());
        const existing = this.receipt(current, key, path, requestHash); if (existing) return existing;
        const total = this.company.store.get<{ n: number }>('SELECT count(*) n FROM client_receipts')!.n;
        const own = this.company.store.get<{ n: number }>('SELECT count(*) n FROM client_receipts WHERE device_id=?', current.device.device_id)!.n;
        check(total < LIMITS.receipts && own < LIMITS.receiptsPerDevice, 429, 'receipt_limit', 'Retry receipt capacity reached.');
        const data = this.mutate(operation, value, catalog);
        const status = ['message', 'objective', 'project_objective'].includes(operation.kind) ? 201 : 200;
        const response = JSON.stringify(this.envelope(data, requestId));
        this.company.store.run('INSERT INTO client_receipts VALUES (?,?,?,\'POST\',?,?,?,?,?,?,?)', current.device.device_id, current.device.owner_principal_id, key, path, requestHash, status, response, this.trust.now(), new Date(Number(key.split('.')[0]) + LIMITS.retryMs).toISOString(), operation.kind === 'interrupt' ? operation.target! : null);
        this.company.audit('remote_mutation_accepted', current.device.owner_principal_id, { device_id: current.device.device_id, client_request_id: key, request_id: requestId, operation: operation.kind, target: operation.target ?? null, result_id: data.message_id ?? data.task_id ?? data.execution_id ?? data.worker_id ?? null });
        return { status, response, interrupt_execution_id: operation.kind === 'interrupt' ? operation.target! : null };
      });
      // Durable intent/result precedes the non-transactional runtime signal. Restart
      // already blocks orphaned executions; no new execution is ever started here.
      if (result.interrupt_execution_id && this.dispatcher.canInterrupt(result.interrupt_execution_id)) this.dispatcher.interrupt(result.interrupt_execution_id);
      json(result.status, JSON.parse(result.response));
    } catch (error) {
      const safe = error instanceof ClientError ? error : error instanceof DomainError ? new ClientError(409, 'invalid_state', 'Current state does not permit this operation. Inspect authoritative state.') : new ClientError(500, 'internal_error', 'Client operation failed.');
      this.trust.failure(safe.code);
      if (!res.headersSent) json(safe.status, { error: { code: safe.code, message: safe.message }, request_id: requestId }); else res.end();
      req.resume();
    }
  }
  private readRate(auth: Authentication) { this.trust.rates.take(`read:${auth.device.device_id}`, 300, this.trust.clock()); }
  private receipt(auth: Authentication, key: string, path: string, requestHash: string) {
    const r = this.company.store.get<Receipt & { principal_id: string }>('SELECT * FROM client_receipts WHERE device_id=? AND client_request_id=?', auth.device.device_id, key);
    if (r) check(r.method === 'POST' && r.path === path && r.request_hash === requestHash && r.principal_id === auth.device.owner_principal_id, 409, 'idempotency_conflict', 'Request key was already used for a different request.');
    return r;
  }
  private operation(path: string): { kind: string; scope: Scope; target?: string; project?: string } {
    if (path === '/messages') return { kind: 'message', scope: 'messages:send' };
    if (path === '/objectives') return { kind: 'objective', scope: 'objectives:create' };
    if (path === '/dispatch') return { kind: 'dispatch', scope: 'dispatch:control' };
    const profile = /^\/workers\/([^/]+)\/profile$/.exec(path);
    if (profile) return { kind: 'profile', scope: 'profiles:update', target: identifier(profile[1], 'worker') };
    const interrupt = /^\/executions\/([^/]+)\/interrupt$/.exec(path);
    if (interrupt) return { kind: 'interrupt', scope: 'executions:interrupt', target: identifier(interrupt[1], 'execution') };
    const project = /^\/projects\/([^/]+)\/repositories\/([^/]+)\/objectives$/.exec(path);
    if (project) return { kind: 'project_objective', scope: 'objectives:create', target: identifier(project[2], 'repository'), project: identifier(project[1], 'project') };
    throw new ClientError(404, 'not_found', 'Client API route was not found.');
  }
  private mutate(op: { kind: string; target?: string; project?: string }, value: unknown, catalog?: RuntimeCatalog): Record<string, unknown> {
    if (op.kind === 'message') {
      const a = object(value, ['body']); const message = this.company.sendHumanMessage(text(a.body)); return this.dto.one('messages', message.message_id);
    }
    if (op.kind === 'objective' || op.kind === 'project_objective') {
      const a = object(value, ['objective', 'acceptance_criteria', 'constraints']);
      const input = { objective: text(a.objective), acceptance_criteria: text(a.acceptance_criteria), constraints: text(a.constraints) };
      check(this.company.store.get("SELECT 1 FROM workers WHERE role='ceo' AND enabled=1"), 409, 'initialization_required', 'Initialize Atlas through the local Web UI first.');
      const task = op.kind === 'objective' ? this.company.assignObjective(input) : this.company.assignProjectObjective(op.project!, op.target!, input);
      return this.dto.one('tasks', task.task_id);
    }
    if (op.kind === 'dispatch') {
      const a = object(value, ['paused', 'expected_paused']); check(typeof a.paused === 'boolean' && typeof a.expected_paused === 'boolean');
      check(this.company.paused === a.expected_paused, 409, 'state_conflict', 'Dispatch state changed; refetch before retrying with a new key.');
      this.company.pause(a.paused); return { paused: this.company.paused };
    }
    if (op.kind === 'profile') {
      const a = object(value, ['profile', 'expected_profile']); const worker = this.dto.one('workers', op.target!);
      check(canonical(worker.configured_profile) === canonical(a.expected_profile), 409, 'state_conflict', 'Worker profile changed; refetch before submitting a new request.');
      this.company.updateWorkerAIProfile(op.target!, a.profile, catalog!); return this.dto.one('workers', op.target!);
    }
    object(value, []); this.dto.one('executions', op.target!);
    check(this.dispatcher.canInterrupt(op.target!), 409, 'invalid_state', 'Execution cannot currently be interrupted.');
    return { execution_id: op.target, requested: true };
  }
}
