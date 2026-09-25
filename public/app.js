const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const short = id => id?.split('_')[1]?.slice(0, 8) ?? id ?? '—';
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const status = value => `<span class="status ${escape(value)}">${escape(value.replaceAll('_', ' '))}</span>`;
const avatar = name => `<span class="avatar ${escape(name.toLowerCase())}">${escape(name.slice(0, 2).toUpperCase())}</span>`;
let state, token, activeTab = 'conversation', draft = '', loading = false, refreshAgain = false, submitting = false;
const titles = { conversation: ['Executive channel', 'The executive channel', 'Give Atlas a direction. Follow the work from assignment to evidence.'], organization: ['Organization', 'A team with clear ownership', 'Persistent identities. Bounded authority. Runtime on demand.'], tasks: ['Tasks', 'Work, with evidence', 'Explicit assignments and their outcomes, from first attempt to final result.'], executions: ['Executions', 'Every attempt, accounted for', 'Runtime starts, resumes, interruptions and failures.'], audit: ['Audit history', 'The record of what happened', 'Durable events recorded by the control plane.'] };
const worker = id => state.workers.find(w => w.worker_id === id);
const principal = id => state.principals.find(p => p.principal_id === id);
const artifacts = taskId => state.artifacts.filter(a => a.task_id === taskId);
function showError(error) { $('#error').textContent = error.message; $('#error').hidden = false; }
async function request(path, data) {
  const response = await fetch(`/api/${path}`, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': token }, body: JSON.stringify(data) });
  const body = await response.json(); if (!response.ok) throw new Error(body.error ?? 'Request failed'); return body;
}
async function mutate(path, body) { $('#error').hidden = true; try { const result = await request(path, body); await refresh(); return result; } catch (error) { showError(error); throw error; } }
async function refresh() {
  if (loading) { refreshAgain = true; return; }
  loading = true;
  try { state = await request('state'); render(); }
  catch (error) { showError(error); }
  finally { loading = false; if (refreshAgain) { refreshAgain = false; void refresh(); } }
}
function render() {
  const composer = $('#objective'); if (composer) draft = composer.value;
  const selection = composer && document.activeElement === composer ? [composer.selectionStart, composer.selectionEnd] : null;
  const messages = $('.messages'); const wasAtBottom = !messages || messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80; const scroll = messages?.scrollTop;
  const atlas = state.workers.find(w => w.role === 'ceo');
  $('#initialize').hidden = !!atlas;
  $('#pause').textContent = state.paused ? 'Resume dispatch' : 'Pause new dispatch';
  $('#pause-banner').hidden = !state.paused;
  $('#worker-count').textContent = state.workers.length;
  $('#task-count').textContent = state.tasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length;
  $('#workers').innerHTML = state.workers.length ? state.workers.map(w => `<button class="worker-button" data-worker="${escape(w.worker_id)}">${avatar(w.display_name)}<span>${escape(w.display_name)}<small>${escape(w.title)}</small></span><span class="dot ${escape(w.status)}" title="${escape(w.status)}"></span></button>`).join('') : '<p class="muted">Initialize Atlas to begin.</p>';
  const active = state.executions.filter(e => e.status === 'running').length;
  $('#metrics').innerHTML = [['Team members', state.workers.length, 'persistent identities'], ['Active now', active, 'executions'], ['Queued work', state.tasks.filter(t => t.status === 'queued').length, 'assignments'], ['Evidence saved', state.artifacts.length, 'artifacts']].map(([label, value, note]) => `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${note}</small></div></div>`).join('');
  const title = titles[activeTab]; $('#view-title').textContent = title[0]; $('#heading').textContent = title[1]; $('#subtitle').textContent = title[2];
  document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('selected', button.dataset.tab === activeTab));
  $('#view').innerHTML = ({ conversation: renderConversation, organization: renderOrganization, tasks: renderTasks, executions: renderExecutions, audit: renderAudit })[activeTab]();
  $('#context-panel').innerHTML = `<div class="panel"><div class="panel-title">The first workflow <span>01</span></div><div class="context-content"><div class="tiny-label">FROM DIRECTION TO EVIDENCE</div>${['Human sets an objective', 'Atlas creates a specialist', 'Scout researches & reports', 'Atlas evaluates & responds'].map((s, i) => `<div class="flow-step"><span>${i + 1}</span>${s}</div>`).join('')}</div></div><div class="panel"><div class="panel-title">Runtime & authority</div><div class="context-content"><h3>Codex · event-driven</h3><p>Workers run when assigned work. A result wakes their manager. Nothing runs just to check for messages.</p><p>Research is limited to approved local documents and saved reports.</p><span class="status ${state.paused ? 'blocked' : 'completed'}">${state.paused ? 'New dispatch paused' : 'Dispatch enabled'}</span></div></div><p class="context-note">Messages are communication. Use <strong>Assign objective</strong> to create work.<br><br>Pause stops new dispatch. Interrupt stops an active execution. Neither removes history.</p>`;
  if ($('#objective')) { $('#objective').value = draft; if (selection) { $('#objective').focus(); $('#objective').setSelectionRange(...selection); } }
  document.querySelectorAll('#compose button').forEach(button => { button.disabled = submitting; });
  if ($('.messages')) $('.messages').scrollTop = wasAtBottom ? $('.messages').scrollHeight : scroll ?? 0;
  wireView();
}
function renderConversation() {
  return `<div class="panel"><div class="panel-title"># executive <span>${state.messages.length} messages · durable history</span></div><div class="messages">${state.messages.length ? state.messages.map(m => {
    const p = principal(m.sender_principal_id); const name = p?.display_name ?? 'Unknown';
    return `<article class="message">${avatar(name)}<div class="message-main"><div class="message-meta"><strong>${escape(name)}</strong><span class="message-role">${escape(p?.type ?? '')}</span><time title="${escape(m.created_at)}">${time(m.created_at)}</time></div><div class="message-body">${escape(m.body)}</div>${m.related_task_id ? `<button class="task-link" data-task="${escape(m.related_task_id)}">↗ Task ${short(m.related_task_id)}</button>` : ''}</div></article>`;
  }).join('') : '<div class="empty"><strong>A direction is all it takes.</strong>Initialize Atlas, then assign your first company objective.</div>'}</div><form class="composer" id="compose"><label for="objective">TO ATLAS · CEO</label><textarea id="objective" maxlength="8000" required placeholder="What should the company work on?"></textarea><div class="composer-footer"><small>Assigning an objective starts real Codex work.</small><div class="composer-actions"><button type="button" id="send-message" class="button secondary">Send message only</button><button class="button primary" type="submit">Assign objective ↗</button></div></div></form></div>`;
}
function renderOrganization() {
  const node = w => `<div class="org-node">${avatar(w.display_name)}<div><strong>${escape(w.display_name)} — ${escape(w.title)}</strong><small>${escape(w.lifecycle)} · ${w.enabled ? 'enabled' : 'retired'}</small></div><button class="task-link" data-worker="${escape(w.worker_id)}">Inspect</button>${status(w.status)}</div>${state.workers.some(c => c.manager_worker_id === w.worker_id) ? `<div class="org-children">${state.workers.filter(c => c.manager_worker_id === w.worker_id).map(node).join('')}</div>` : ''}`;
  return `<div class="panel"><div class="panel-title">Reporting hierarchy <span>Authority enforced by the control plane</span></div><div class="org-tree"><div class="org-node">${avatar('Human')}<div><strong>Human owner</strong><small>Company objective & authority</small></div></div><div class="org-children">${state.workers.filter(w => !w.manager_worker_id).map(node).join('') || '<p class="muted">Atlas has not been initialized.</p>'}</div></div></div>`;
}
function artifactLinks(taskId) { return artifacts(taskId).map(a => `<button class="artifact-link" data-artifact="${escape(a.artifact_id)}">▧ ${escape(a.description)}</button>`).join(''); }
function renderTasks() {
  return state.tasks.length ? `<div class="card-list">${[...state.tasks].reverse().map(t => `<article class="panel task-card"><header><span>${short(t.task_id)} · ${escape(principal(t.requester)?.display_name)} → ${escape(worker(t.assignee_worker_id)?.display_name)}</span>${status(t.status)}</header><h3>${escape(t.objective)}</h3>${t.blocking_reason ? `<p>${escape(t.blocking_reason)}</p>` : ''}${t.result_summary ? `<p>${escape(t.result_summary.slice(0, 350))}${t.result_summary.length > 350 ? '…' : ''}</p>` : ''}<div class="card-actions"><button class="button secondary small" data-task="${escape(t.task_id)}">Inspect task</button>${artifactLinks(t.task_id)}</div></article>`).join('')}</div>` : '<div class="panel empty"><strong>No assignments yet.</strong>Send an explicit objective from the executive channel.</div>';
}
function renderExecutions() {
  return `<div class="panel"><div class="panel-title">Execution history <span>${state.executions.length} attempts</span></div><div class="table-wrap"><table><thead><tr><th>EXECUTION / TASK</th><th>WORKER</th><th>RUNTIME STATE</th><th>START / END</th><th>ACTION</th></tr></thead><tbody>${[...state.executions].reverse().map(e => `<tr><td>${short(e.execution_id)}<small><button class="task-link" data-task="${escape(e.task_id)}">${short(e.task_id)}</button></small></td><td>${escape(worker(e.worker_id)?.display_name)}</td><td>${status(e.status)}${e.error || e.interruption_reason ? `<small>${escape(e.error ?? e.interruption_reason)}</small>` : ''}</td><td>${time(e.started_at)}<small>${time(e.finished_at)}</small></td><td>${e.status === 'running' && state.supportsInterrupt ? `<button class="button danger small" data-interrupt="${escape(e.execution_id)}">Interrupt</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>${!state.executions.length ? '<div class="empty">No runtime executions. Idle workers consume no model calls.</div>' : ''}</div>`;
}
function renderAudit() {
  return `<div class="panel"><div class="panel-title">Append-only event history <span>${state.audit.length} events</span></div>${[...state.audit].reverse().map(e => `<div class="audit-row"><span class="audit-marker">◇</span><div><strong>${escape(e.type.replaceAll('_', ' '))}</strong><p>${escape(principal(e.actor_principal_id)?.display_name)}${e.worker_id ? ` · ${escape(worker(e.worker_id)?.display_name)}` : ''}${e.task_id ? ` · task ${short(e.task_id)}` : ''}</p><p>${escape(e.detail)}</p></div><time title="${escape(e.created_at)}">${time(e.created_at)}</time></div>`).join('') || '<div class="empty">Company lifecycle events will appear here.</div>'}</div>`;
}
function details(object) { return `<dl class="inspect-grid">${Object.entries(object).map(([k, v]) => `<dt>${escape(k.replaceAll('_', ' '))}</dt><dd>${escape(Array.isArray(v) ? v.join(', ') : v ?? '—')}</dd>`).join('')}</dl>`; }
function inspect(title, html) { $('#inspect-title').textContent = title; $('#inspect-content').innerHTML = html; if (!$('#inspect').open) $('#inspect').showModal(); wireActions($('#inspect')); }
function inspectTask(id) {
  const t = state.tasks.find(t => t.task_id === id); if (!t) return;
  const parent = state.tasks.find(p => p.task_id === t.parent_task_id);
  const retryEligible = ['blocked', 'failed', 'awaiting_approval'].includes(t.status) && t.blocking_reason !== 'waiting_children';
  const retryLimit = !worker(t.assignee_worker_id)?.enabled ? 'This worker has retired. Assign a new objective for further work.'
    : parent && (parent.dispatch_reason === 'child_results' || ['completed', 'failed', 'cancelled'].includes(parent.status)) ? 'This result has been handed back to the manager. Assign a new objective for further work.'
    : state.tasks.some(child => child.parent_task_id === id && !['completed', 'failed', 'cancelled'].includes(child.status)) ? 'Resolve the child assignment before retrying this task.' : '';
  const retryControls = !retryEligible ? '' : retryLimit ? `<p class="muted">${escape(retryLimit)}</p>` : `<label class="check-review"><input type="checkbox" id="reviewed"> I inspected prior attempts, artifacts and child tasks. Retry the existing assignment without granting new authority.</label><button class="button primary" id="retry" data-id="${escape(id)}" disabled>Retry inspected task</button>`;
  inspect(`Task ${short(id)}`, `${details(t)}<h3>Artifacts</h3>${artifactLinks(id) || '<p class="muted">No artifacts recorded.</p>'}<h3>Execution attempts</h3>${state.executions.filter(e => e.task_id === id).map(e => `<pre>${escape(JSON.stringify(e, null, 2))}</pre>`).join('') || '<p class="muted">No execution attempts.</p>'}${retryControls}${['queued', 'blocked', 'failed', 'awaiting_approval'].includes(t.status) ? `<button class="button danger" data-cancel="${escape(id)}">Cancel task</button>` : ''}`);
  if ($('#reviewed')) $('#reviewed').onchange = () => { $('#retry').disabled = !$('#reviewed').checked; };
  if ($('#retry')) $('#retry').onclick = async () => { try { await mutate('retry', { task_id: id, inspected: $('#reviewed').checked }); $('#inspect').close(); } catch {} };
}
function wireActions(root) {
  root.querySelectorAll('[data-artifact]').forEach(b => b.onclick = async () => {
    try {
      const response = await fetch(`/api/artifacts/${encodeURIComponent(b.dataset.artifact)}`);
      if (!response.ok) throw new Error((await response.json()).error ?? 'Could not read artifact');
      const content = await response.text(); const artifact = state.artifacts.find(a => a.artifact_id === b.dataset.artifact);
      inspect(artifact.description, `${details(artifact)}<h3>Report</h3><pre>${escape(content)}</pre>`);
    } catch (error) { showError(error); }
  });
  root.querySelectorAll('[data-worker]').forEach(b => b.onclick = () => { const w = worker(b.dataset.worker); inspect(`${w.display_name} — ${w.title}`, details({ ...w, runtime_binding: state.bindings.find(r => r.worker_id === w.worker_id)?.runtime_reference ?? 'Not started' })); });
  root.querySelectorAll('[data-task]').forEach(b => b.onclick = () => inspectTask(b.dataset.task));
  root.querySelectorAll('[data-interrupt]').forEach(b => b.onclick = async () => { b.disabled = true; try { await mutate('interrupt', { execution_id: b.dataset.interrupt }); } catch { b.disabled = false; } });
  root.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => { try { await mutate('cancel', { task_id: b.dataset.cancel }); $('#inspect').close(); } catch {} });
}
function wireView() {
  wireActions(document);
  if ($('#compose')) {
    $('#objective').oninput = event => { draft = event.target.value; };
    const submit = async path => {
      const value = $('#objective').value.trim(); if (!value || submitting) return;
      submitting = true; document.querySelectorAll('#compose button').forEach(button => { button.disabled = true; });
      try { await mutate(path, path === 'objectives' ? { objective: value } : { body: value }); draft = ''; if ($('#objective')) $('#objective').value = ''; }
      catch {} finally { submitting = false; document.querySelectorAll('#compose button').forEach(button => { button.disabled = false; }); }
    };
    $('#compose').onsubmit = event => { event.preventDefault(); void submit('objectives'); };
    $('#send-message').onclick = () => void submit('messages');
  }
}
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => { activeTab = button.dataset.tab; render(); });
$('#close-inspect').onclick = () => $('#inspect').close();
$('#initialize').onclick = async () => { try { await mutate('initialize', {}); } catch {} };
$('#pause').onclick = async () => { try { await mutate('pause', { paused: !state.paused }); } catch {} };
try {
  const session = await request('session'); token = session.csrfToken; draft = session.defaultObjective; await refresh();
  const events = new EventSource('/api/events');
  events.addEventListener('ready', async () => {
    try { token = (await request('session')).csrfToken; $('#connection').textContent = 'Connected to local service'; $('#connection-dot').classList.add('online'); await refresh(); }
    catch (error) { showError(error); }
  });
  events.addEventListener('changed', () => void refresh());
  events.onerror = () => { $('#connection').textContent = 'Reconnecting to local service…'; $('#connection-dot').classList.remove('online'); };
} catch (error) { showError(error); }
