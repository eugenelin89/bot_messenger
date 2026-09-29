import type { SQLInputValue } from 'node:sqlite';
import type { Company } from '../control/company.js';
import { check, identifier, object } from './protocol.js';

type Row = Record<string, SQLInputValue>;
const fields = (row: Row, names: string[]) => Object.fromEntries(names.map(k => [k, row[k] ?? null]));
const resources = {
  workers: 'worker', tasks: 'task', executions: 'execution', projects: 'project',
  repositories: 'repository', messages: 'message', artifacts: 'artifact',
} as const;
export type Resource = keyof typeof resources;
export class ClientDTOs {
  constructor(readonly company: Company, readonly hqId: string) {}
  one(resource: Resource, id: string) {
    identifier(id, resources[resource]);
    const row = this.company.store.get<Row>(`SELECT * FROM ${resource} WHERE ${resources[resource]}_id=?`, id);
    check(row, 404, 'not_found', 'Resource was not found.'); return this.convert(resource, row);
  }
  page(resource: Resource, query: URLSearchParams, projectId?: string) {
    check([...query.keys()].every(k => ['limit', 'cursor'].includes(k)) && new Set(query.keys()).size === [...query.keys()].length);
    const rawLimit = query.get('limit') ?? '50'; check(/^[1-9]\d{0,2}$/.test(rawLimit));
    const limit = Number(rawLimit); check(limit <= 100);
    let after = 0; let through = this.company.store.get<{ n: number }>(`SELECT coalesce(max(rowid),0) n FROM ${resource}`)!.n;
    const cursor = query.get('cursor');
    if (cursor !== null) {
      check(cursor.length <= 600 && /^[A-Za-z0-9_-]+$/.test(cursor));
      let decoded: unknown; try { decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); } catch { check(false); }
      const c = object(decoded, ['v', 'hq_id', 'resource', 'project_id', 'after', 'through']);
      check(c.v === 1 && c.hq_id === this.hqId && c.resource === resource && c.project_id === (projectId ?? null));
      check(Number.isSafeInteger(c.after) && Number.isSafeInteger(c.through) && (c.after as number) >= 0 && (c.through as number) >= (c.after as number) && (c.through as number) <= through);
      after = c.after as number; through = c.through as number;
    }
    const rows = this.company.store.all<Row>(`SELECT rowid AS page_rowid,* FROM ${resource} WHERE rowid>? AND rowid<=? ${projectId ? 'AND project_id=?' : ''} ORDER BY rowid LIMIT ?`, after, through, ...(projectId ? [projectId] : []), limit + 1);
    const more = rows.length > limit; const selected = rows.slice(0, limit);
    return { items: selected.map(row => this.convert(resource, row)), next_cursor: more ? Buffer.from(JSON.stringify({ v: 1, hq_id: this.hqId, resource, project_id: projectId ?? null, after: selected.at(-1)!.page_rowid, through })).toString('base64url') : null };
  }
  convert(resource: Resource, row: Row): Record<string, unknown> {
    switch (resource) {
      case 'workers': {
        const last = this.company.store.get<Row>('SELECT model,reasoning_effort,execution_priority,runtime_version,runtime_adapter FROM executions WHERE worker_id=? AND provenance_status=\'recorded\' ORDER BY rowid DESC LIMIT 1', row.worker_id!);
        return { ...fields(row, ['worker_id', 'display_name', 'title', 'role', 'manager_worker_id', 'status', 'lifecycle', 'created_at', 'updated_at']), enabled: row.enabled === 1,
          configured_profile: { ...fields(row, ['ai_model', 'reasoning_effort', 'execution_priority']), ai_profile_locked: row.ai_profile_locked === 1 },
          last_execution_profile: last ? fields(last, ['model', 'reasoning_effort', 'execution_priority', 'runtime_version', 'runtime_adapter']) : null,
          current_task_id: this.company.store.get<{ task_id: string }>("SELECT task_id FROM executions WHERE worker_id=? AND status='running'", row.worker_id!)?.task_id ?? null };
      }
      case 'tasks': return { ...fields(row, ['task_id', 'requester', 'assignee_worker_id', 'objective', 'acceptance_criteria', 'constraints', 'parent_task_id', 'status', 'kind', 'created_at', 'updated_at']),
        attention_required: ['blocked', 'failed', 'awaiting_approval'].includes(String(row.status)),
        has_result: Boolean(row.result_summary),
        repository_id: this.company.store.get<{ repository_id: string }>('SELECT repository_id FROM task_scopes WHERE task_id=?', row.task_id!)?.repository_id ?? null };
      case 'executions': return { ...fields(row, ['execution_id', 'task_id', 'worker_id', 'status', 'model', 'reasoning_effort', 'execution_priority', 'runtime_version', 'runtime_adapter', 'provenance_status', 'started_at', 'finished_at']),
        has_error: Boolean(row.error), interrupted: row.status === 'interrupted' };
      case 'projects': return { ...fields(row, ['project_id', 'name', 'description', 'status', 'created_at', 'updated_at']),
        repository_count: this.company.store.get<{ n: number }>('SELECT count(*) n FROM repositories WHERE project_id=?', row.project_id!)!.n };
      case 'repositories': {
        const integration = this.company.store.get<Row>('SELECT integration_id,status,final_commit FROM integrations WHERE repository_id=? ORDER BY rowid DESC LIMIT 1', row.repository_id!);
        const review = this.company.store.get<Row>('SELECT review_id,status FROM reviews WHERE repository_id=? ORDER BY rowid DESC LIMIT 1', row.repository_id!);
        return { ...fields(row, ['repository_id', 'project_id', 'default_branch', 'current_commit', 'status', 'source_kind', 'remote_policy', 'remote_state', 'created_at', 'updated_at']), name: row.product_name,
          latest_integration: integration ? fields(integration, ['integration_id', 'status', 'final_commit']) : null,
          latest_review: review ? fields(review, ['review_id', 'status']) : null };
      }
      case 'messages': return fields(row, ['message_id', 'channel_id', 'sender_principal_id', 'recipient_worker_id', 'body', 'reply_to_message_id', 'related_task_id', 'execution_id', 'created_at']);
      case 'artifacts': return { ...fields(row, ['artifact_id', 'task_id', 'execution_id', 'type', 'description', 'sha256', 'created_at']), content_available: false };
    }
  }
}
