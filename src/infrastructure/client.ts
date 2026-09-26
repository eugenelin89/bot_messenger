import { spawnSync } from 'node:child_process';
import { requireThat } from '../domain/model.js';
import { identityName, type OSIdentity } from '../domain/infrastructure.js';

export interface HostClient {
  readonly backend: 'linux' | 'development';
  request(request: Record<string, unknown>): Record<string, unknown>;
}
// Explicit regression backend: no Linux security claim and no host account mutations.
export class DevelopmentHost implements HostClient {
  readonly backend = 'development' as const;
  request(request: Record<string, unknown>): Record<string, unknown> {
    if (request.type === 'inspect_host_health') return { backend: this.backend, ready: true, isolated: false };
    requireThat(['create_worker_identity','disable_worker_identity'].includes(request.type as string), 'Development backend has no privileged project operations');
    const name = identityName(request.worker_id as string);
    return { worker_id: request.worker_id, backend: this.backend, state: request.type === 'create_worker_identity' ? 'ready' : 'disabled', unix_username: name, uid: null, gid: null, home_path: null, simulated: true };
  }
}
export class LinuxHost implements HostClient {
  readonly backend = 'linux' as const;
  request(request: Record<string, unknown>): Record<string, unknown> {
    requireThat(process.platform === 'linux', 'Linux identity backend requires Linux');
    const result = spawnSync('/usr/bin/python3', ['/opt/botsquad-provisioner/client.py'], {
      input: JSON.stringify(request), encoding: 'utf8', env: { PATH: '/usr/bin:/bin', LANG: 'C' },
      timeout: 25000, maxBuffer: 2000000, stdio: ['pipe','pipe','pipe'],
    });
    requireThat(result.status === 0 && !result.error, 'Provisioner transport unavailable; operation remains recoverable');
    let response: { ok: boolean; result?: Record<string, unknown>; error?: string };
    try { response = JSON.parse(result.stdout); } catch { throw new Error('Invalid provisioner response'); }
    requireThat(response.ok && response.result, response.error ?? 'Provisioner rejected request');
    return response.result;
  }
}
export function defaultHost(): HostClient {
  const backend = process.env.BOT_IDENTITY_BACKEND ?? (process.env.NODE_ENV === 'production' && process.platform === 'linux' ? 'linux' : 'development');
  requireThat(backend === 'linux' || backend === 'development', 'Unknown identity backend');
  return backend === 'linux' ? new LinuxHost() : new DevelopmentHost();
}
export function verifyIdentity(result: Record<string, unknown>, workerId: string, backend: HostClient['backend']) {
  requireThat(result.worker_id === workerId && result.backend === backend && result.unix_username === identityName(workerId), 'Provisioner identity mismatch');
  if (backend === 'linux') requireThat(Number.isInteger(result.uid) && Number(result.uid) >= 1000 && Number.isInteger(result.gid) && Number(result.gid) >= 1000 && result.home_path === `/var/lib/botsquad-workers/${identityName(workerId)}`, 'Unsafe Unix binding');
  return result as unknown as OSIdentity;
}
