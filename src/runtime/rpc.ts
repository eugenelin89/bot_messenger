import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { EventEmitter } from 'node:events';

export type RpcMessage = { id?: string | number; method?: string; params?: Record<string, unknown>; result?: unknown; error?: { code: number; message: string } };
export class AppServerRpc extends EventEmitter {
  private nextId = 0;
  private ended = false;
  readonly process: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<number, { resolve(value: unknown): void; reject(error: Error): void; timer: NodeJS.Timeout }>();
  constructor(command: string, args: string[], cwd: string) {
    super();
    // Credentials stay inside the official runtime; never read auth files or log env/stderr.
    this.process = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    this.process.stderr.resume();
    const lines = createInterface({ input: this.process.stdout });
    lines.on('line', line => {
      if (line.length > 2_000_000) { this.fail(new Error('Oversized runtime event')); this.close(); return; }
      let message: RpcMessage;
      try { message = JSON.parse(line) as RpcMessage; }
      catch { this.fail(new Error('Malformed runtime event')); this.close(); return; }
      if (message.method) { this.emit(message.id === undefined ? 'notification' : 'request', message); return; }
      const pending = this.pending.get(message.id as number);
      if (!pending) return;
      this.pending.delete(message.id as number); clearTimeout(pending.timer);
      // Raw runtime errors can contain account/transport data. Keep persistent errors generic.
      if (message.error) pending.reject(new Error(`Codex request rejected (code ${message.error.code})`));
      else pending.resolve(message.result);
    });
    this.process.on('error', () => this.fail(new Error('Could not launch Codex App Server; check CODEX_BIN and installation')));
    this.process.on('exit', (code, signal) => this.fail(new Error(`Codex App Server exited (${code ?? signal})`)));
    this.process.stdin.on('error', () => this.fail(new Error('Codex transport closed')));
  }
  private fail(error: Error) {
    if (this.ended) return;
    this.ended = true;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear(); this.emit('closed', error);
  }
  send(message: RpcMessage) {
    if (this.ended) throw new Error('Codex transport is closed');
    this.process.stdin.write(`${JSON.stringify(message)}\n`);
  }
  request<T>(method: string, params: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
    if (this.ended) return Promise.reject(new Error('Codex transport is closed'));
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Codex ${method} timed out`)); }, timeoutMs);
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer });
      this.send({ id, method, params });
    });
  }
  close() { this.process.kill('SIGTERM'); this.fail(new Error('Codex transport closed')); }
}
