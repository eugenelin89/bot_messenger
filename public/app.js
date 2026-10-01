import {workingGroups} from './groups.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function safeLink(url,label=url) {
  try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)return escape(label);return `<a href="${escape(u.href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;}catch{return escape(label);}
}
function linkedText(value) {
  const text=String(value??'');let end=0;let result='';
  for(const m of text.matchAll(/\[([^\]\n]{1,200})\]\((https:\/\/[^\s)]+)\)|(https:\/\/[^\s<>"']+)/g)) {
    result+=escape(text.slice(end,m.index))+safeLink(m[2]??m[3],m[1]??m[3]);end=m.index+m[0].length;
  }
  return result+escape(text.slice(end));
}
let researchView=0;
async function inspectResearch(workerId) {
  const w=worker(workerId);inspect(`${w.display_name} · Capabilities`,'<p>Loading standing permissions…</p>');const version=researchView;
  try{
    const d=await request(`research/workers/${encodeURIComponent(workerId)}`);if(version!==researchView||!$('#inspect').open)return;
    const current=cap=>d.grants.find(g=>g.capability===cap&&g.status==='active');
    const publicGrant=current('public_research'),knowledge=current('company_knowledge');
    inspect(`${w.display_name} · Capabilities`,`<h3>Public Research</h3><p>Search public information and read public pages during research Tasks and conversations. Sending messages, publishing, purchases and private accounts require separate authority.</p>${details({capability:'Available in this build',provider:d.configured?d.provider:'Not configured',worker:d.eligible?'Eligible':'Not eligible under current policy',company_policy:d.policy_enabled?'Enabled':'Disabled',permission:publicGrant?'Granted':d.grants.find(g=>g.capability==='public_research')?.status??'Not granted'})}<p>Up to ${d.limits.callsPerWork} research operations per assignment or conversation, ${d.limits.searchesPerWork} search sessions per work scope, ${d.limits.callsPerDay} operations per worker each UTC day and ${d.limits.callsPerMinute} per minute. Search deadline ${d.limits.searchTimeoutMs/1000}s; page deadline ${d.limits.fetchTimeoutMs/1000}s. These limits count our operations; the search provider may do several lookups internally.</p>${publicGrant?`<button class="button danger" data-revoke-research="${escape(publicGrant.grant_id)}">Revoke Public Research</button>`:`<p>One confirmation enables repeated permitted lookups without individual approvals. No expiry; revoke here at any time.</p><label class="check-review"><input id="grant-discussions" type="checkbox"> Also authorize public research during explicitly started working groups</label><button class="button primary" id="grant-public" ${!d.eligible||!d.policy_enabled?'disabled':''}>Confirm & enable Public Research</button>`}<p class="muted">Working-group research: ${publicGrant?.modes.includes('discussion')?'Authorized within each group charter':'Not authorized. To extend an existing grant, revoke it and explicitly enable the group option when granting again.'}</p><h3>Company Knowledge</h3><p>Internal reading is a separate permission. Document content must not be sent in public searches.</p>${knowledge?`<p>${knowledge.resources.map(escape).join('<br>')}</p><button class="button danger" data-revoke-research="${escape(knowledge.grant_id)}">Revoke Company Knowledge</button>`:`<form id="grant-knowledge">${d.approved_documents.map(p=>`<label class="check-review"><input type="checkbox" name="document" value="${escape(p)}"> ${escape(p)}</label>`).join('')}<button class="button secondary" ${!d.eligible||!d.policy_enabled?'disabled':''}>Confirm selected document access</button></form>`}<h3>Recent research</h3>${d.activity.map(a=>`<div class="research-operation"><button class="task-link" data-research-operation="${escape(a.operation_id)}">${escape(a.tool.replaceAll('_',' '))} · ${escape(a.state)}</button><small>${escape(a.created_at)} · ${escape(a.origin)} · ${a.output_chars} returned characters${a.unresolved?' · provider outcome unresolved':''}</small></div>`).join('')||'<p>No research operations yet.</p>'}<details><summary>Permission history and exact limits</summary><pre>${escape(JSON.stringify(d.grants,null,2))}</pre></details><p class="muted">Revocation stops further actions and prevents late delivery. A query already transmitted cannot be withdrawn. Existing task reference-document access remains governed by its original approved scope.</p>`);
    const change=async(path,body)=>{try{await request(path,body);await inspectResearch(workerId);}catch(e){showError(e);}};
    if($('#grant-public'))$('#grant-public').onclick=()=>void change('research/grant',{worker_id:workerId,preset:'public_research',expires_at:null,document_paths:[],allow_discussions:$('#grant-discussions')?.checked??false});
    if($('#grant-knowledge'))$('#grant-knowledge').onsubmit=e=>{e.preventDefault();void change('research/grant',{worker_id:workerId,preset:'company_knowledge',expires_at:null,document_paths:[...document.querySelectorAll('#grant-knowledge input:checked')].map(x=>x.value)});};
    document.querySelectorAll('[data-revoke-research]').forEach(b=>b.onclick=()=>void change('research/revoke',{grant_id:b.dataset.revokeResearch}));
  }catch(e){showError(e);}
}
async function inspectResearchOperation(operationId) {
  inspect('Research sources and outcome','<p>Loading source evidence…</p>');const version=researchView;
  const d=await request(`research/operations/${encodeURIComponent(operationId)}`);if(version!==researchView||!$('#inspect').open)return;
  inspect('Research sources and outcome',`${details({operation:d.operation_id,worker:worker(d.worker_id)?.display_name,work_mode:d.origin,state:d.state,requested:JSON.stringify(JSON.parse(d.request)),grant:d.grant_id,policy:d.policy_version,started:d.created_at,finished:d.finished_at,provider:d.provider})}${d.result?.error?`<p role="alert">${escape(d.result.error)}</p>`:''}${d.result?.provider_summary?`<h3>Provider summary</h3><p class="message-body">${linkedText(d.result.provider_summary)}</p><p class="muted">Generated summary; the source evidence below records what was returned or read.</p>`:''}<h3>Source evidence</h3>${d.sources.map(s=>`<article class="research-source"><h4>${safeLink(s.url,s.title)}</h4>${details({kind:s.kind,retrieved_at:s.retrieved_at,observation_time:s.observed_at??'Unknown — inspect the source text',publication_time:s.published_at??'Unknown',freshness:s.freshness,omissions:s.omissions,sha256:s.sha256})}<details><summary>Bounded source excerpt</summary><pre>${escape(s.content)}</pre></details></article>`).join('')||'<p>No source content committed.</p>'}`);
}
const short = id => id?.split('_')[1]?.slice(0, 8) ?? id ?? '—';
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const status = value => `<span class="status ${escape(value)}">${escape(value.replaceAll('_', ' '))}</span>`;
const avatar = name => `<span class="avatar ${escape(name.toLowerCase())}">${escape(name.slice(0, 2).toUpperCase())}</span>`;
let selectedProject = null;
const chatDrafts = new Map(); let renderedChatConversation = null;
let conversationList = {items:[]}, selectedConversation = null, conversationDetail = null, conversationWorker = '', chatDraft = '', chatSending = false, chatReceipt = null;
let state, token, activeTab = 'conversation', draft = '', loading = false, refreshAgain = false, submitting = false;
let renderedView = '';
let deviceState = null;
let deviceScopes = new Set(['state:read']);
function updateView(html) {
  if (html === renderedView) return;
  const expanded = new Set([...document.querySelectorAll('#view details[open][data-disclosure]')].map(element => element.dataset.disclosure));
  $('#view').innerHTML = html;
  for (const element of document.querySelectorAll('#view details[data-disclosure]')) element.open = expanded.has(element.dataset.disclosure);
  renderedView = html;
}
const worker = id => state.workers.find(w => w.worker_id === id);
const groups=workingGroups({request,refresh,render,inspect,showError,escape,linkedText,safeLink,status,worker,isActive:()=>activeTab==='groups'});
const titles = { groups:['Working Groups','Reason together','Bounded discussions, shared evidence and recommendations. Implementation requires a separate assignment.'], direct:['Conversations','Talk with your team','Request a bounded reply or leave a passive message. Conversations remain separate from assignments.'], devices: ['Devices / Remote Clients', 'Your paired devices', 'Confirm each device. Choose its capabilities. Revoke access at any time.'], approvals: ['Approvals', 'Review protected host changes', 'Exact scope. One trusted decision. Durable receipts.'], infrastructure: ['Infrastructure', 'Worker identities & access', 'Nix coordinates. The human approves. Bounded host operations enforce the change.'], products: ['Projects & repositories', 'Software projects, with evidence', 'Explicit scopes. Revision rounds. Tested integration.'], conversation: ['Executive channel', 'The executive channel', 'Give Atlas a direction. Follow the work from assignment to evidence.'], organization: ['Organization', 'A team with clear ownership', 'Persistent identities. Bounded authority. Runtime on demand.'], tasks: ['Tasks', 'Work, with evidence', 'Explicit assignments and their outcomes, from first attempt to final result.'], executions: ['Executions', 'Every attempt, accounted for', 'Runtime starts, resumes, interruptions and failures.'], audit: ['Audit history', 'The record of what happened', 'Durable events recorded by the control plane.'] };
async function loadConversations() {
  conversationList = await request(`conversations${conversationWorker ? `?worker_id=${encodeURIComponent(conversationWorker)}` : ''}`);
  const requestedConversation=selectedConversation;
  if(requestedConversation){const detail=await request(`conversations/${encodeURIComponent(requestedConversation)}`);if(selectedConversation===requestedConversation)conversationDetail=detail;}
}
async function openWorkerConversations(workerId) {
  $('#inspect').close(); conversationWorker=workerId; selectedConversation=null; conversationDetail=null; chatDraft=''; chatReceipt=null; activeTab='direct';
  render(); await refresh();
}
function renderDirect() {
  const d=conversationDetail, c=d?.conversation;
  const history=d?.history;
  const participants=d?.participants??[];
  const names=participants.map(p=>p.display_name).join(' ↔ ');
  const canSend=c&&c.state!=='archived'&&participants.some(p=>p.principal_id==='human'&&p.active);
  return `<div class="panel task-card"><label>Participant <select id="conversation-worker"><option value="">All conversations</option>${state.workers.map(w=>`<option value="${escape(w.worker_id)}" ${conversationWorker===w.worker_id?'selected':''}>${escape(w.display_name)} · ${escape(w.title)}</option>`).join('')}</select></label><div class="card-actions"><button id="new-conversation" class="button primary" ${!conversationWorker?'disabled':''}>New direct conversation</button></div><p class="muted">Private to current participants. The human owner can inspect all conversations, including peer exchanges.</p>${conversationList.items.map(item=>`<button class="conversation-entry ${selectedConversation===item.conversation_id?'selected':''}" data-conversation="${escape(item.conversation_id)}"><strong>${escape(item.purpose)}</strong><small>${escape(item.participants.map(p=>p.display_name).join(' ↔ '))} · ${escape(item.state)}</small></button>`).join('')||'<p class="muted">Choose a worker and start a conversation.</p>'}${conversationList.next_cursor?`<button id="older-conversations" class="button secondary">Older conversations</button>`:''}</div>
    ${c?`<div class="panel"><div class="panel-title">${escape(names)} <span>${status(c.state)}</span></div><div class="context-content"><h3>${escape(c.purpose)}</h3><small>Conversation ${short(c.conversation_id)}</small>${state.paused?'<p class="pause-banner">HQ dispatch is paused. Reply requests queue until you resume dispatch.</p>':''}<div class="card-actions">${c.state!=='active'?'<button class="button secondary" data-conversation-state="active">Resume conversation</button>':'<button class="button secondary" data-conversation-state="muted">Mute reply dispatch</button>'}${c.state!=='archived'?'<button class="button secondary" data-conversation-state="archived">Archive</button>':''}${participants.filter(p=>p.worker_id&&p.active).map(p=>`<button class="button secondary" data-rollover="${escape(p.worker_id)}">Replace ${escape(p.display_name)}’s context</button>`).join('')}</div><p class="muted">Mute holds reply dispatch; archive also prevents new messages. Interrupt an active reply before either action. History is retained.</p></div>
    <div class="messages">${history.next_cursor?'<button id="older-chat" class="button secondary">Earlier messages</button>':''}${history.items.map(m=>`<article class="message">${avatar(participants.find(p=>p.principal_id===m.sender_principal_id)?.display_name??'Worker')}<div class="message-main"><div class="message-meta"><strong>${escape(participants.find(p=>p.principal_id===m.sender_principal_id)?.display_name??'Worker')}</strong><time>${time(m.created_at)}</time>${m.response_to?'<span>Reply</span>':''}</div><div class="message-body">${linkedText(m.body)}</div>${m.execution_id?`<button class="task-link" data-chat-execution="${escape(m.execution_id)}">Execution ${short(m.execution_id)}</button>`:''}</div></article>`).join('')||'<div class="empty">No messages yet.</div>'}</div>
    ${canSend?`<form id="chat-compose" data-conversation-id="${escape(c.conversation_id)}" class="composer"><label for="chat-body">TO ${escape(participants.find(p=>p.worker_id)?.display_name??'WORKER')}</label><textarea id="chat-body" maxlength="8000" required placeholder="Discuss a question with this worker"></textarea><div class="composer-footer"><small>Send & request reply invokes one bounded worker turn. Passive message invokes no model.</small><div class="composer-actions"><button id="chat-passive" type="button" class="button secondary" ${chatSending?'disabled':''}>Send passive message</button><button type="submit" class="button primary" ${chatSending||c.state!=='active'?'disabled':''}>Send & request reply</button></div></div></form>`:'<p class="context-content muted">Owner oversight: peer transcripts are read-only. Resume an archived direct conversation to send.</p>'}</div>
    <div class="panel task-card"><h3>Reply requests</h3>${d.requests.map(r=>`<div class="conversation-request">${status(r.status)} <strong>${escape(worker(r.target_worker_id)?.display_name)}</strong> · ${escape(r.kind)} <small>${short(r.request_id)}</small>${r.error?`<p>${escape(r.error)}</p>`:''}${r.status==='replying'?d.executions.filter(e=>e.request_id===r.request_id&&e.status==='running').map(e=>`<button class="button danger small" data-interrupt="${escape(e.execution_id)}">Interrupt reply</button>`).join(''):!['completed','cancelled'].includes(r.status)?`<button class="button secondary small" data-cancel-reply="${escape(r.request_id)}">Cancel request</button>`:''}</div>`).join('')||'<p class="muted">Passive messages create no reply work.</p>'}<h3>Context continuity</h3>${d.sessions.map(s=>`<p>${escape(worker(s.worker_id)?.display_name)} · generation ${s.generation} · ${status(s.state)} · ${escape(s.reason.replaceAll('_',' '))} · ${s.completed_turns} turns</p>`).join('')||'<p class="muted">A separate context starts with the first reply.</p>'}<p class="muted">Replacement takes effect at the next authorized reply. Worker identity and this transcript stay the same. Blocked or ambiguous attempts never replay automatically.</p></div>`:''}`;
}
function wireConversations() {
  const conversationId=conversationDetail?.conversation.conversation_id;
  const act=fn=>async()=>{try{await fn();}catch(e){showError(e);}};
  if($('#conversation-worker'))$('#conversation-worker').onchange=act(async()=>{conversationWorker=$('#conversation-worker').value;selectedConversation=null;conversationDetail=null;chatDraft='';render();await refresh();});
  if($('#new-conversation'))$('#new-conversation').onclick=act(async()=>{
    const w=worker(conversationWorker);selectedConversation=null;conversationDetail=null;render();const c=await request('conversations/open',{worker_id:w.worker_id,purpose:`Conversation with ${w.display_name}`});
    selectedConversation=c.conversation_id;chatDraft='';await refresh();
  });
  document.querySelectorAll('[data-conversation]').forEach(b=>b.onclick=act(async()=>{selectedConversation=b.dataset.conversation;conversationDetail=null;chatDraft='';chatReceipt=null;render();await refresh();}));
  if($('#older-conversations'))$('#older-conversations').onclick=act(async()=>{const filter=conversationWorker,cursor=conversationList.next_cursor;const page=await request(`conversations?before=${cursor}${filter?`&worker_id=${encodeURIComponent(filter)}`:''}`);if(conversationWorker!==filter||conversationList.next_cursor!==cursor)return;conversationList={items:[...conversationList.items,...page.items],next_cursor:page.next_cursor};render();});
  if($('#older-chat'))$('#older-chat').onclick=act(async()=>{const cursor=conversationDetail.history.next_cursor;const page=await request(`conversations/${encodeURIComponent(conversationId)}?before=${cursor}`);if(selectedConversation!==conversationId||conversationDetail?.conversation.conversation_id!==conversationId||conversationDetail.history.next_cursor!==cursor)return;conversationDetail.history={items:[...page.history.items,...conversationDetail.history.items],next_cursor:page.history.next_cursor};render();});
  document.querySelectorAll('[data-conversation-state]').forEach(b=>b.onclick=act(async()=>{await mutate('conversations/control',{conversation_id:conversationId,state:b.dataset.conversationState});}));
  document.querySelectorAll('[data-rollover]').forEach(b=>b.onclick=act(async()=>{await mutate('conversations/rollover',{conversation_id:conversationId,worker_id:b.dataset.rollover});}));
  document.querySelectorAll('[data-cancel-reply]').forEach(b=>b.onclick=act(async()=>{await mutate('conversations/cancel',{request_id:b.dataset.cancelReply});}));
  document.querySelectorAll('[data-chat-execution]').forEach(b=>b.onclick=()=>inspect('Conversation execution evidence',`<pre>${escape(JSON.stringify(conversationDetail.executions.find(e=>e.execution_id===b.dataset.chatExecution)??{execution_id:b.dataset.chatExecution},null,2))}</pre>`));
  if($('#chat-compose')) {
    $('#chat-body').oninput=e=>{chatDraft=e.target.value;chatDrafts.set(conversationId,chatDraft);chatReceipt=null;};
    const submit=async(reply)=>{
      const body=$('#chat-body').value.trim();if(!body||chatSending)return;
      chatSending=true;
      const signature=JSON.stringify([conversationId,body,reply]);
      if(chatReceipt?.signature!==signature)chatReceipt={signature,key:crypto.randomUUID()};
      try{await request('conversations/send',{conversation_id:conversationId,body,request_reply:reply,receipt_key:chatReceipt.key});chatDrafts.set(conversationId,'');chatDraft='';if(renderedChatConversation===conversationId&&$('#chat-body'))$('#chat-body').value='';chatReceipt=null;await refresh();}
      catch(error){showError(error);}finally{chatSending=false;render();}
    };
    $('#chat-compose').onsubmit=e=>{e.preventDefault();void submit(true);};$('#chat-passive').onclick=()=>void submit(false);
  }
}
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
  try { state = await request('state'); if (activeTab === 'devices') deviceState = await request('devices'); if (activeTab === 'direct') await loadConversations(); if(activeTab==='groups')await groups.load(); render(); }
  catch (error) { showError(error); }
  finally { loading = false; if (refreshAgain) { refreshAgain = false; void refresh(); } }
}
function render() {
  groups.capture();
  const chatComposer = $('#chat-body'); if (chatComposer && renderedChatConversation) chatDrafts.set(renderedChatConversation,chatComposer.value);
  chatDraft=chatDrafts.get(selectedConversation)??'';
  const chatSelection = chatComposer && document.activeElement === chatComposer ? [chatComposer.selectionStart,chatComposer.selectionEnd] : null;
  const composer = $('#objective'); if (composer) draft = composer.value;
  const selection = composer && document.activeElement === composer ? [composer.selectionStart, composer.selectionEnd] : null;
  const messages = $('.messages'); const wasAtBottom = !messages || messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80; const scroll = messages?.scrollTop;
  const atlas = state.workers.find(w => w.role === 'ceo');
  $('#initialize').hidden = !!atlas;
  $('#pause').textContent = state.paused ? 'Resume dispatch' : 'Pause new dispatch';
  $('#pause-banner').hidden = !state.paused;
  $('#approval-count').textContent = state.infrastructure.approvals.filter(a => a.status === 'pending').length + (state.project_approvals ?? []).filter(a => a.status === 'pending').length;
  $('#worker-count').textContent = state.workers.length;
  $('#task-count').textContent = state.tasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length;
  $('#workers').innerHTML = state.workers.length ? state.workers.map(w => `<button class="worker-button" data-worker="${escape(w.worker_id)}">${avatar(w.display_name)}<span>${escape(w.display_name)}<small>${escape(w.title)}</small></span><span class="dot ${escape(w.status)}" title="${escape(w.status)}"></span></button>`).join('') : '<p class="muted">Initialize Atlas to begin.</p>';
  const active = state.executions.filter(e => e.status === 'running').length;
  $('#metrics').innerHTML = [['Team members', state.workers.length, 'persistent identities'], ['Active now', active, 'executions'], ['Queued tasks', state.tasks.filter(t => t.status === 'queued').length, 'assignments'], ['Evidence saved', state.artifacts.length+(state.group_synthesis_count??0), (state.group_synthesis_count??0)?'Task + group results':'artifacts']].map(([label, value, note]) => `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${note}</small></div></div>`).join('');
  const title = titles[activeTab]; $('#view-title').textContent = title[0]; $('#heading').textContent = title[1]; $('#subtitle').textContent = title[2];
  document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('selected', button.dataset.tab === activeTab));
  updateView(({ groups:groups.render, direct:renderDirect, devices: renderDevices, conversation: renderConversation, organization: renderOrganization, products: renderProducts, tasks: renderTasks, executions: renderExecutions, audit: renderAudit, approvals: renderApprovals, infrastructure: renderInfrastructure })[activeTab]());
  $('#context-panel').innerHTML = `<div class="panel"><div class="panel-title">The engineering workflow <span>05</span></div><div class="context-content"><div class="tiny-label">FROM DIRECTION TO EVIDENCE</div>${['Human gives Atlas a goal', 'Maya specifies the product', 'Turing assigns Linus & Ada', 'Grace reviews and requests revisions', 'Full recipes gate queued integration', 'Atlas reports the evidence'].map((s, i) => `<div class="flow-step"><span>${i + 1}</span>${s}</div>`).join('')}</div></div><div class="panel"><div class="panel-title">Runtime & authority</div><div class="context-content"><h3>Codex · event-driven</h3><p>Workers run for assignments or explicit conversation reply requests. Task results can wake their manager. Passive messages never invoke a model.</p><p>Engineering uses assigned private clones on Linux, development worktrees, and confined tests. Public research and company documents require separate standing permissions. General browser and Computer Use remain disabled.</p><span class="status ${state.paused ? 'blocked' : 'completed'}">${state.paused ? 'New dispatch paused' : 'Dispatch enabled'}</span></div></div><p class="context-note">Use <strong>Assign objective</strong> for a Task or <strong>Send &amp; request reply</strong> for one conversation turn. Passive messages remain communication.<br><br>Pause stops new dispatch. Interrupt stops an active execution. Neither removes history.</p>`;
  if(activeTab==='groups')$('#context-panel').innerHTML=`<div class="panel"><div class="panel-title">A bounded discussion <span>08</span></div><div class="context-content">${['Owner reviews charter and audience','Explicit start invokes the team','Employees contribute and respond','Facilitator chooses useful follow-ups','Draft synthesis gets one review','Owner reads the recommendation'].map((s,i)=>`<div class="flow-step"><span>${i+1}</span>${s}</div>`).join('')}</div></div><div class="panel"><div class="panel-title">Scope and authority</div><div class="context-content"><p>Only the group transcript and selected evidence packet are shared. Each employee speaks through their own execution.</p><p>Membership grants no research, implementation or approval powers. Public research needs an explicit individual grant and charter permission.</p><p>A saved recommendation becomes a Task only after a separate owner preview and submission.</p><span class="status ${state.paused?'blocked':'completed'}">${state.paused?'HQ dispatch paused':'HQ dispatch enabled'}</span></div></div>`;
  if ($('#objective')) { $('#objective').value = draft; if (selection) { $('#objective').focus(); $('#objective').setSelectionRange(...selection); } }
  document.querySelectorAll('#compose button').forEach(button => { button.disabled = submitting; });
  if ($('.messages')) $('.messages').scrollTop = wasAtBottom ? $('.messages').scrollHeight : scroll ?? 0;
  renderedChatConversation = activeTab==='direct' ? conversationDetail?.conversation.conversation_id ?? null : null;
  if ($('#chat-body')) { $('#chat-body').value = chatDrafts.get(renderedChatConversation)??''; if(chatSelection){$('#chat-body').focus();$('#chat-body').setSelectionRange(...chatSelection);} }
  wireView();
}
function renderConversation() {
  return `<div class="panel"><div class="panel-title"># executive <span>${state.messages.length} messages · durable history</span></div><div class="messages">${state.messages.length ? state.messages.map(m => {
    const p = principal(m.sender_principal_id); const name = p?.display_name ?? 'Unknown';
    return `<article class="message">${avatar(name)}<div class="message-main"><div class="message-meta"><strong>${escape(name)}</strong><span class="message-role">${escape(p?.type ?? '')}</span><time title="${escape(m.created_at)}">${time(m.created_at)}</time></div><div class="message-body">${linkedText(m.body)}</div>${m.related_task_id ? `<button class="task-link" data-task="${escape(m.related_task_id)}">↗ Task ${short(m.related_task_id)}</button>` : ''}</div></article>`;
  }).join('') : '<div class="empty"><strong>A direction is all it takes.</strong>Initialize Atlas, then assign your first company objective.</div>'}</div><form class="composer" id="compose"><label for="objective">TO ATLAS · CEO</label><div class="objective-presets"><button type="button" class="task-link" id="preset-product">Build SquadStatus</button><button type="button" class="task-link" id="preset-research">Research coordination risks</button></div><textarea id="objective" maxlength="8000" required placeholder="What should the company work on?"></textarea><div class="composer-footer"><small>Assigning an objective starts real Codex work.</small><div class="composer-actions"><button type="button" id="send-message" class="button secondary">Send message only</button><button class="button primary" type="submit">Assign objective ↗</button></div></div></form></div>`;
}
function renderOrganization() {
  const node = w => `<div class="org-node">${avatar(w.display_name)}<div><strong>${escape(w.display_name)} — ${escape(w.title)}</strong><small>${escape(w.lifecycle)} · ${w.enabled ? 'enabled' : 'retired'}</small></div><button class="task-link" data-worker="${escape(w.worker_id)}">Inspect</button><button class="task-link" data-chat-worker="${escape(w.worker_id)}">Conversations</button><button class="task-link" data-research-worker="${escape(w.worker_id)}">Capabilities</button>${status(w.status)}</div>${state.workers.some(c => c.manager_worker_id === w.worker_id) ? `<div class="org-children">${state.workers.filter(c => c.manager_worker_id === w.worker_id).map(node).join('')}</div>` : ''}`;
  return `<div class="panel"><div class="panel-title">Reporting hierarchy <span>Authority enforced by the control plane</span></div><div class="org-tree"><div class="org-node">${avatar('Human')}<div><strong>Human owner</strong><small>Company objective & authority</small></div></div><div class="org-children">${state.workers.filter(w => !w.manager_worker_id).map(node).join('') || '<p class="muted">Atlas has not been initialized.</p>'}</div></div></div>`;
}
function artifactLinks(taskId) { return artifacts(taskId).map(a => `<button class="artifact-link" data-artifact="${escape(a.artifact_id)}">▧ ${escape(a.description)}</button>`).join(''); }
function renderTasks() {
  return state.tasks.length ? `<div class="card-list">${[...state.tasks].reverse().map(t => `<article class="panel task-card"><header><span>${short(t.task_id)} · ${escape(principal(t.requester)?.display_name)} → ${escape(worker(t.assignee_worker_id)?.display_name)}</span>${status(t.status)}</header><h3>${escape(t.objective)}</h3>${t.blocking_reason ? `<p>${escape(t.blocking_reason)}</p>` : ''}${t.result_summary ? `<p>${escape(t.result_summary.slice(0, 350))}${t.result_summary.length > 350 ? '…' : ''}</p>` : ''}<div class="card-actions"><button class="button secondary small" data-task="${escape(t.task_id)}">Inspect task</button>${artifactLinks(t.task_id)}</div></article>`).join('')}</div>` : '<div class="panel empty"><strong>No assignments yet.</strong>Send an explicit objective from the executive channel.</div>';
}
function renderExecutions() {
  const running = state.executions.filter(e => e.status === 'running');
  return `${running.length ? `<div class="concurrency-banner">${running.length} running together · ${running.map(e => escape(worker(e.worker_id)?.display_name)).join(' + ')}</div>` : ''}<div class="panel"><div class="panel-title">Execution history <span>${state.executions.length} attempts</span></div><div class="table-wrap"><table><thead><tr><th>EXECUTION / ORIGIN</th><th>WORKER</th><th>RUNTIME STATE / AI PROFILE</th><th>START / END</th><th>ACTION</th></tr></thead><tbody>${[...state.executions].reverse().map(e => `<tr><td>${short(e.execution_id)}<small>${e.origin === 'conversation' ? `${e.group_id?'Working group · '+escape(e.discussion_kind):'Conversation reply'} · ${short(e.request_id)}` : `<button class="task-link" data-task="${escape(e.task_id)}">${short(e.task_id)}</button>`}</small></td><td>${escape(worker(e.worker_id)?.display_name)}</td><td>${status(e.status)}<small>${escape(e.model ?? e.provenance_status ?? 'legacy / unknown')} · ${escape(e.reasoning_effort ?? 'unknown')}<br>${escape(e.execution_priority ?? 'unknown')} · ${escape(e.runtime_version ?? 'unknown')}</small>${e.error || e.interruption_reason ? `<small>${escape(e.error ?? e.interruption_reason)}</small>` : ''}</td><td>${time(e.started_at)}<small>${time(e.finished_at)}</small></td><td>${e.status === 'running' && state.supportsInterrupt ? `<button class="button danger small" data-interrupt="${escape(e.execution_id)}">Interrupt</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>${!state.executions.length ? '<div class="empty">No runtime executions. Idle workers consume no model calls.</div>' : ''}</div>`;
}
const managedPath = path => path?.includes('/products/') ? `products/${path.split('/products/')[1]}` : 'Managed workspace';
function renderProducts() {
  const header = projectHeader();
  const repositories = state.repositories.filter(r => r.project_id === selectedProject);
  if (!repositories.length) return header + '<div class="panel empty"><strong>No repository yet.</strong>Create a managed repository, import a Git bundle, or register a public GitHub source.</div>';
  return header + repositories.map(repo => {
    const allocations = state.allocations.filter(a => a.repository_id === repo.repository_id);
    const submissions = state.submissions.filter(s => s.repository_id === repo.repository_id);
    const reviews = state.reviews.filter(r => r.repository_id === repo.repository_id);
    const integrations = state.integrations.filter(i => i.repository_id === repo.repository_id);
    const running = state.executions.filter(e => e.status === 'running' && allocations.some(a => a.task_id === e.task_id));
    return `<div class="panel product-card"><div class="panel-title">${escape(repo.product_name)} ${status(repo.status)}</div><div class="product-body"><p class="muted">${escape(repo.repository_id)} · ${escape(repo.source_kind)} · remote ${escape(repo.remote_policy)} / ${escape(repo.remote_state)}</p><div class="product-commit"><strong>${escape(repo.default_branch)}</strong><code>${escape(repo.current_commit ?? 'Creating scaffold')}</code></div><div class="card-actions"><button class="button secondary small" data-evidence="repositories" data-record="${escape(repo.repository_id)}">Inspect repository</button>${repo.spec_artifact_id ? `<button class="artifact-link" data-artifact="${escape(repo.spec_artifact_id)}">▧ Product specification</button>` : ''}${repositoryControls(repo)}</div>
    ${running.length ? `<div class="concurrency-banner">${running.length} engineers active · ${running.map(e => escape(worker(e.worker_id)?.display_name)).join(' + ')}</div>` : ''}
    <h3>Engineering allocations</h3><div class="allocation-grid">${allocations.map(a => {
      const history = submissions.filter(s => s.allocation_id === a.allocation_id); const submitted = history.at(-1);
      return `<article class="allocation-card"><header><strong>${escape(worker(a.worker_id)?.display_name)} · round ${escape(a.revision_round)}</strong>${status(a.status)}</header><p><code>${escape(JSON.parse(a.write_scope).join(', '))}</code></p><p><code>${escape(a.branch_name)}</code></p><small>${escape(managedPath(a.worktree_path))}</small><dl><dt>Base</dt><dd><code>${escape(a.base_commit)}</code></dd><dt>Submitted</dt><dd><code>${escape(submitted?.commit_sha ?? 'Awaiting submission')}</code></dd></dl><div class="card-actions"><button class="task-link" data-task="${escape(a.task_id)}">Inspect task</button><button class="task-link" data-evidence="allocations" data-record="${escape(a.allocation_id)}">Ownership</button>${history.map(s => `<button class="task-link" data-evidence="submissions" data-record="${escape(s.submission_id)}">Submission ${escape(s.revision_round)} · ${short(s.commit_sha)}</button>`).join('')}${a.status === 'integrated' ? `<button class="task-link" data-release="${escape(a.allocation_id)}">Release clone access</button>` : ''}</div></article>`;
    }).join('')}</div><h3>Independent review</h3>${reviews.map(r => `<div class="evidence-row"><strong>${escape(worker(r.worker_id)?.display_name)} · round ${escape(state.review_rounds.find(x=>x.round_id===r.round_id)?.round_number ?? 'legacy')}</strong>${status(r.status)}${r.round_id ? `<button class="task-link" data-evidence="review_rounds" data-record="${escape(r.round_id)}">Exact packet</button>` : ''}<button class="artifact-link" data-artifact="${escape(r.artifact_id)}">▧ Findings & reviewed commits</button></div>`).join('') || '<p class="muted">Waiting for verified engineering submissions.</p>'}
    <h3>Integration</h3>${integrations.map(i => `<div class="integration-card"><div class="evidence-row">${status(i.status)}<span>${i.status === 'completed' ? 'Full acceptance tests passed' : 'Inspect test and Git evidence'}</span></div><dl><dt>Base</dt><dd><code>${escape(i.base_commit)}</code></dd><dt>Source commits</dt><dd><code>${escape(JSON.parse(i.source_commits).join('\n'))}</code></dd><dt>Candidate</dt><dd><code>${escape(i.candidate_commit ?? '—')}</code></dd><dt>Final</dt><dd><code>${escape(i.final_commit ?? 'Default branch not advanced')}</code></dd></dl><button class="button secondary small" data-evidence="integrations" data-record="${escape(i.integration_id)}">Inspect acceptance evidence</button></div>`).join('') || '<p class="muted">Requires independent approval, followed by passing full product tests.</p>'}</div></div>`;
  }).join('');
}
function renderApprovals() {
  return projectApprovals() + (state.infrastructure.approvals.length ? [...state.infrastructure.approvals].reverse().map(a => {
    const op = state.infrastructure.operations.find(op => op.operation_id === a.operation_id);
    const execution = state.executions.find(e => e.execution_id === op.requesting_execution_id);
    const canDecide = a.status === 'pending';
    return `<article class="panel task-card"><header><strong>${escape(op.operation_type.replaceAll('_', ' '))}</strong>${status(a.status)}</header><h3>${escape(worker(op.target_worker_id)?.display_name)}</h3>${details({ requester: worker(op.requester_worker_id)?.display_name ?? 'Human — initial Nix bootstrap', task: op.task_id, execution: op.requesting_execution_id, reason: op.reason, requested: a.requested_at, expires: a.expires_at, identity_now: state.infrastructure.identities.find(i => i.worker_id === op.target_worker_id), operation_status: op.status, result: op.result ? JSON.parse(op.result) : null, error: op.error })}<details data-disclosure="${escape(a.approval_id)}"><summary>Exact parameters and preconditions</summary><pre>${escape(JSON.stringify({ operation_id: op.operation_id, approval_id: a.approval_id, parameters: JSON.parse(op.parameters), parameter_hash: op.parameter_hash, preconditions: JSON.parse(op.preconditions) }, null, 2))}</pre></details>${canDecide ? `<div class="card-actions"><button class="button primary" data-approval="${escape(a.approval_id)}" data-operation="${escape(op.operation_id)}" data-decision="approve" ${execution && execution.status !== 'completed' ? 'disabled' : ''}>Approve</button><button class="button danger" data-approval="${escape(a.approval_id)}" data-operation="${escape(op.operation_id)}" data-decision="deny">Deny</button></div><p class="muted">Approval executes this exact operation once. Current preconditions are rechecked by the server.${execution && execution.status !== 'completed' ? ' Waiting for Nix to finish its request turn.' : ''}</p>` : ''}</article>`;
  }).join('') : '<div class="panel empty">No protected host operations awaiting review.</div>');
}
function renderInfrastructure() {
  const nix = state.workers.find(w => w.role === 'devops');
  return `<div class="panel task-card"><h3>${state.infrastructure.isolated ? 'Linux worker isolation' : 'Development backend — simulated identities'}</h3><p>Codex authentication remains central. Worker Unix accounts receive no credentials or privileged socket access.</p><div class="card-actions">${!nix ? '<button id="initialize-nix" class="button primary">Initialize Nix</button>' : ''}<button id="host-health" class="button secondary">Check provisioner health</button><button id="reconcile-host" class="button secondary">Reconcile interrupted operations</button></div><p id="host-health-result"></p></div>${state.infrastructure.identities.map(i => { const w = worker(i.worker_id); return `<article class="panel task-card"><header><strong>${escape(w.display_name)} — ${escape(w.title)}</strong>${status(i.state)}</header>${details({ worker_id: i.worker_id, unix_username: i.unix_username, uid: i.uid, gid: i.gid, home: i.home_path ? 'Private managed home' : null, backend: i.backend, project_access: state.infrastructure.projects.filter(p => p.worker_id === i.worker_id).map(p => ({ allocation_id: p.allocation_id, state: p.state })) })}<div class="card-actions">${nix && w.role !== 'devops' && i.state === 'unprovisioned' && w.enabled ? `<button class="button secondary" data-infra-worker="${escape(i.worker_id)}" data-infra-type="create_worker_identity">Ask Nix to provision</button>` : ''}${i.state === 'ready' && w.enabled && !['ceo','cto','devops'].includes(w.role) ? `<button class="button danger" data-infra-worker="${escape(i.worker_id)}" data-infra-type="disable_worker_identity">Ask Nix to retire worker</button>` : ''}</div></article>`; }).join('')}<div class="panel task-card"><h3>Infrastructure tasks</h3>${state.infrastructure.tasks.map(i => `<p><button class="task-link" data-task="${escape(i.task_id)}">${escape(i.operation_type)} · ${escape(worker(i.target_worker_id)?.display_name)}</button> ${status(state.tasks.find(t => t.task_id === i.task_id).status)}</p>`).join('') || '<p class="muted">No infrastructure tasks.</p>'}</div>`;
}
function renderAudit() {
  return `<div class="panel"><div class="panel-title">Append-only event history <span>${state.audit.length} events</span></div>${[...state.audit].reverse().map(e => `<div class="audit-row"><span class="audit-marker">◇</span><div><strong>${escape(e.type.replaceAll('_', ' '))}</strong><p>${escape(principal(e.actor_principal_id)?.display_name)}${e.worker_id ? ` · ${escape(worker(e.worker_id)?.display_name)}` : ''}${e.task_id ? ` · task ${short(e.task_id)}` : ''}</p><p>${escape(e.detail)}</p></div><time title="${escape(e.created_at)}">${time(e.created_at)}</time></div>`).join('') || '<div class="empty">Company lifecycle events will appear here.</div>'}</div>`;
}
function details(object) { return `<dl class="inspect-grid">${Object.entries(object).map(([k, v]) => `<dt>${escape(k.replaceAll('_', ' '))}</dt><dd>${escape(v && typeof v === 'object' ? JSON.stringify(v, null, 2) : v ?? '—')}</dd>`).join('')}</dl>`; }
function inspect(title, html) { researchView++; $('#inspect-title').textContent = title; $('#inspect-content').innerHTML = html; if (!$('#inspect').open) $('#inspect').showModal(); wireActions($('#inspect')); }
function inspectTask(id) {
  const t = state.tasks.find(t => t.task_id === id); if (!t) return;
  const parent = state.tasks.find(p => p.task_id === t.parent_task_id);
  const retryEligible = ['blocked', 'failed', 'awaiting_approval'].includes(t.status) && t.blocking_reason !== 'waiting_children';
  const retryLimit = t.kind === 'infrastructure' ? 'Inspect Approvals for the human decision. Use Infrastructure to reconcile an interrupted host operation; runtime retry cannot grant authority.'
    : state.allocations?.some(a => a.task_id === id && a.status === 'blocked') ? 'This allocation requires Git inspection. Automatic reactivation is unavailable.'
    : !worker(t.assignee_worker_id)?.enabled ? 'This worker has retired. Assign a new objective for further work.'
    : parent && ((parent.dispatch_reason === 'child_results' && parent.blocking_reason !== 'waiting_children') || ['completed', 'failed', 'cancelled'].includes(parent.status)) ? 'This result has been handed back to the manager. Assign a new objective for further work.'
    : state.tasks.some(child => child.parent_task_id === id && !['completed', 'failed', 'cancelled'].includes(child.status)) ? 'Resolve the child assignment before retrying this task.' : '';
  const retryControls = !retryEligible ? '' : retryLimit ? `<p class="muted">${escape(retryLimit)}</p>` : `<label class="check-review"><input type="checkbox" id="reviewed"> I inspected prior attempts, artifacts and child tasks. Retry the existing assignment without granting new authority.</label><button class="button primary" id="retry" data-id="${escape(id)}" disabled>Retry inspected task</button>`;
  inspect(`Task ${short(id)}`, `${details(t)}<h3>Artifacts</h3>${artifactLinks(id) || '<p class="muted">No artifacts recorded.</p>'}<h3>Execution attempts</h3>${state.executions.filter(e => e.task_id === id).map(e => `<pre>${escape(JSON.stringify(e, null, 2))}</pre>`).join('') || '<p class="muted">No execution attempts.</p>'}${retryControls}${['queued', 'blocked', 'failed', 'awaiting_approval'].includes(t.status) ? `<button class="button danger" data-cancel="${escape(id)}">Cancel task</button>` : ''}`);
  if ($('#reviewed')) $('#reviewed').onchange = () => { $('#retry').disabled = !$('#reviewed').checked; };
  if ($('#retry')) $('#retry').onclick = async () => { try { await mutate('retry', { task_id: id, inspected: $('#reviewed').checked }); $('#inspect').close(); } catch {} };
}
async function inspectWorker(id) {
  const w = worker(id);
  const binding = state.bindings.find(r => r.worker_id === id);
  const last = [...state.executions].reverse().find(e => e.worker_id === id && e.provenance_status === 'recorded');
  inspect(`${w.display_name} — ${w.title}`, '<p>Loading runtime model choices…</p>');
  let catalog;
  try { catalog = await request('runtime'); } catch (error) { inspect(`${w.display_name} — ${w.title}`, `<p role="alert">Runtime discovery failed. Complete Codex sign-in on the headquarters host, then reopen these settings.</p>${details({ unix_identity:state.infrastructure.identities.find(i => i.worker_id === id), state:w.status, role:w.role, model:w.ai_model ?? "inherit", reasoning:w.reasoning_effort ?? "inherit", priority:w.execution_priority, human_lock:!!w.ai_profile_locked, last_effective_model:last?.model ?? "Not run", last_effective_reasoning:last?.reasoning_effort ?? "Not run", thread_name:binding?.thread_name ?? "Not started" })}`); showError(error); return; }
  if (!$('#inspect').open) return;
  const option = (value, label, selected) => `<option value="${escape(value)}"${selected ? ' selected' : ''}>${escape(label)}</option>`;
  const models = [option('', `Inherit (${catalog.defaultModel})`, w.ai_model === null), ...catalog.models.map(m => option(m.model, m.displayName, m.model === w.ai_model))];
  if (w.ai_model && !catalog.models.some(m => m.model === w.ai_model)) models.push(option(w.ai_model, `${w.ai_model} — unavailable`, true));
  inspect(`${w.display_name} — ${w.title}`, `<button class="button primary" data-chat-worker="${escape(id)}">Open conversations</button><button class="button secondary" data-research-worker="${escape(id)}">Capabilities & research</button><form id="ai-profile" class="profile-form"><label>Model<select id="ai-model">${models.join('')}</select></label><label>Reasoning effort<select id="ai-reasoning"></select></label><label>Execution priority<select id="ai-priority">${['low','normal','high','critical'].map(p => option(p, p, p === w.execution_priority)).join('')}</select></label><label class="check-review"><input id="ai-lock" type="checkbox" ${w.ai_profile_locked ? 'checked' : ''}> Human lock</label><p class="muted">Changes apply to future executions. The human can always edit a locked profile. Manager profile changes are not enabled in this milestone.</p><button class="button primary" type="submit">Save AI profile</button><p id="profile-error" role="alert"></p></form><h3>Current worker</h3>${details({ unix_identity:state.infrastructure.identities.find(i => i.worker_id === id), state:w.status, role:w.role, model:w.ai_model ?? 'inherit', reasoning:w.reasoning_effort ?? 'inherit', priority:w.execution_priority, human_lock:!!w.ai_profile_locked, last_effective_model:last?.model ?? 'Not run', last_effective_reasoning:last?.reasoning_effort ?? 'Not run', runtime:last?.runtime_version ?? catalog.version, thread_name:binding?.thread_name ?? 'Not named', runtime_binding:binding?.runtime_reference ?? 'Not started' })}`);
  const reasons = (selected = '') => {
    const model = catalog.models.find(m => m.model === ($('#ai-model').value || catalog.defaultModel));
    const efforts = model?.supportedReasoningEfforts ?? [];
    $('#ai-reasoning').innerHTML = option('', `Inherit (${model?.defaultReasoningEffort ?? 'unavailable'})`, !selected) + efforts.map(e => option(e.reasoningEffort,e.reasoningEffort,e.reasoningEffort === selected)).join('') + (selected && !efforts.some(e => e.reasoningEffort === selected) ? option(selected, `${selected} — unavailable`, true) : '');
  };
  reasons(w.reasoning_effort); $('#ai-model').onchange = () => reasons();
  $('#ai-profile').onsubmit = async event => {
    event.preventDefault(); const button = $('#ai-profile button'); button.disabled = true;
    try { await mutate('worker-profile', { worker_id:id, profile:{ ai_model:$('#ai-model').value || null, reasoning_effort:$('#ai-reasoning').value || null, execution_priority:$('#ai-priority').value, ai_profile_locked:$('#ai-lock').checked } }); $('#inspect').close(); }
    catch (error) { $('#profile-error').textContent = error.message; button.disabled = false; }
  };
}
function wireActions(root) {
  wireProjectActions(root);
  root.querySelectorAll('[data-research-worker]').forEach(b=>b.onclick=()=>void inspectResearch(b.dataset.researchWorker));
  root.querySelectorAll('[data-research-operation]').forEach(b=>b.onclick=()=>void inspectResearchOperation(b.dataset.researchOperation).catch(showError));
  root.querySelectorAll('[data-chat-worker]').forEach(b=>b.onclick=()=>void openWorkerConversations(b.dataset.chatWorker));
  root.querySelectorAll('[data-approval]').forEach(b => b.onclick = async () => { b.disabled = true; try { await mutate('approvals/decide', { approval_id: b.dataset.approval, operation_id: b.dataset.operation, decision: b.dataset.decision }); } catch { b.disabled = false; } });
  root.querySelectorAll('[data-infra-worker]').forEach(b => b.onclick = async () => { b.disabled = true; try { await mutate('infrastructure/request', { worker_id: b.dataset.infraWorker, operation_type: b.dataset.infraType, allocation_id: null }); } catch { b.disabled = false; } });
  root.querySelectorAll('[data-evidence]').forEach(b => b.onclick = () => {
    const category = b.dataset.evidence;
    const key = { repositories: 'repository_id', allocations: 'allocation_id', submissions: 'submission_id', integrations: 'integration_id', review_rounds:'round_id' }[category];
    const record = state[category].find(r => r[key] === b.dataset.record);
    const display = { ...record };
    for (const name of ['canonical_root', 'worktree_path']) if (display[name]) display[name] = managedPath(display[name]);
    for (const name of ['validation', 'changed_paths', 'source_commits','write_scope','protected_paths','recipe_ids','policy_snapshot','commit_list','submission_ids','packet']) if (display[name]) display[name] = JSON.parse(display[name]);
    inspect('Engineering evidence', `<pre>${escape(JSON.stringify(display, null, 2))}</pre>`);
  });
  root.querySelectorAll('[data-artifact]').forEach(b => b.onclick = async () => {
    try {
      const response = await fetch(`/api/artifacts/${encodeURIComponent(b.dataset.artifact)}`);
      if (!response.ok) throw new Error((await response.json()).error ?? 'Could not read artifact');
      const content = await response.text(); const artifact = state.artifacts.find(a => a.artifact_id === b.dataset.artifact);
      inspect(artifact.description, `${details(artifact)}<h3>Report</h3><pre>${linkedText(content)}</pre>`);
    } catch (error) { showError(error); }
  });
  root.querySelectorAll('[data-worker]').forEach(b => b.onclick = () => void inspectWorker(b.dataset.worker));
  root.querySelectorAll('[data-task]').forEach(b => b.onclick = () => inspectTask(b.dataset.task));
  root.querySelectorAll('[data-interrupt]').forEach(b => b.onclick = async () => { b.disabled = true; try { await mutate('interrupt', { execution_id: b.dataset.interrupt }); } catch { b.disabled = false; } });
  root.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => { try { await mutate('cancel', { task_id: b.dataset.cancel }); $('#inspect').close(); } catch {} });
}
function wireView() {
  wireActions(document);
  wireDevices();
  wireConversations();
  groups.wire();
  if ($('#initialize-nix')) $('#initialize-nix').onclick = async () => { try { await mutate('initialize-nix', {}); activeTab = 'approvals'; render(); } catch {} };
  if ($('#host-health')) $('#host-health').onclick = async () => { try { const result = await request('infrastructure/health', {}); $('#host-health-result').textContent = JSON.stringify(result); } catch (error) { showError(error); } };
  if ($('#reconcile-host')) $('#reconcile-host').onclick = async () => { try { await mutate('infrastructure/reconcile', {}); } catch {} };
  if ($('#compose')) {
    $('#preset-product').onclick = () => { draft = 'Build the SquadStatus validation product using a product and engineering team. Require a product specification, two concurrent engineers in separate managed worktrees, independent review, passing full tests and a final evidence report. Keep the product local.'; $('#objective').value = draft; };
    $('#preset-research').onclick = () => { draft = 'Assess the three largest risks to reliable BotSquad coordination. Delegate bounded local research to Scout, then evaluate the report. No external actions.'; $('#objective').value = draft; };
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
document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => { activeTab = button.dataset.tab; render(); if (['devices','direct','groups'].includes(activeTab)) void refresh(); });
$('#close-inspect').onclick = () => $('#inspect').close();
$('#initialize').onclick = async () => { try { await mutate('initialize', {}); } catch {} };
$('#pause').onclick = async () => { try { await mutate('pause', { paused: !state.paused }); } catch {} };
try {
  const session = await request('session'); token = session.csrfToken; draft = session.defaultObjective; await refresh();
  const events = new EventSource('/api/events');
  events.addEventListener('ready', async () => {
    try { token = (await request('session')).csrfToken; $('#connection').textContent = 'Connected to headquarters'; $('#connection-dot').classList.add('online'); await refresh(); }
    catch (error) { showError(error); }
  });
  events.addEventListener('changed', () => void refresh());
  events.onerror = () => { $('#connection').textContent = 'Reconnecting to headquarters…'; $('#connection-dot').classList.remove('online'); };
} catch (error) { showError(error); }

function projectHeader() {
  const projects=state.projects??[];
  if(!projects.some(p=>p.project_id===selectedProject)) selectedProject=projects[0]?.project_id??null;
  const p=projects.find(p=>p.project_id===selectedProject);
  return `<div class="panel task-card"><header><h3>Projects</h3><button class="button primary" data-project-action="create">New Project</button></header><div class="project-selector">${projects.map(p=>`<button class="button ${p.project_id===selectedProject?'primary':'secondary'} small" data-select-project="${escape(p.project_id)}">${escape(p.name)} · ${escape(p.status)}</button>`).join('')}</div>${p?`<h3>${escape(p.name)} ${status(p.status)}</h3><p>${escape(p.description)}</p><p class="muted">${escape(p.project_id)}</p><div class="card-actions"><button class="button secondary small" data-project-action="policy">Instructions & validation policy</button>${p.status==='active'?`<button class="button secondary small" data-project-action="local">New repository</button><button class="button secondary small" data-project-action="import">Import bundle</button><button class="button secondary small" data-project-action="remote">Register GitHub repository</button><button class="button danger small" data-project-action="archive">Archive Project</button>`:''}</div>`:'<p>Create a software Project to register repositories and configure trusted validation.</p>'}</div>`;
}
function repositoryControls(repo) {
  if(state.projects.find(p=>p.project_id===repo.project_id)?.status!=='active')return '';
  const latest=state.integrations.filter(i=>i.repository_id===repo.repository_id&&i.status==='completed'&&i.final_commit===repo.current_commit).at(-1);
  return `<button class="button primary small" data-repo-action="objective" data-repository="${escape(repo.repository_id)}">Assign objective</button><button class="button secondary small" data-repo-action="remote" data-repository="${escape(repo.repository_id)}">Remote policy</button>${repo.remote_policy!=='none'?`<button class="button secondary small" data-repo-action="fetch" data-repository="${escape(repo.repository_id)}">Fetch & inspect remote</button>`:''}${latest&&repo.remote_policy==='approved_push'?`<button class="button secondary small" data-repo-action="publish" data-repository="${escape(repo.repository_id)}">Request publication approval</button>`:''}`;
}
function projectApprovals() {
  return [...(state.project_approvals??[])].reverse().map(a=>{
    const op=state.project_operations.find(o=>o.operation_id===a.operation_id);const e=JSON.parse(op.envelope);const integration=state.integrations.find(i=>i.integration_id===e.integration_id);
    return `<article class="panel task-card"><header><strong>Publish integrated repository commit</strong>${status(a.status)}</header><p>Trusted service operation · no root access</p>${details({repository:e.identity,branch:e.target_branch,expected_remote_sha:e.expected_old_sha,new_integrated_sha:e.new_sha,project:e.project_id,integration:e.integration_id,review:integration?.review_id,reason:op.reason,expires:a.expires_at,status:op.status,error:op.error,result:op.result?JSON.parse(op.result):null})}<details data-disclosure="${escape(a.approval_id)}"><summary>Exact approval envelope</summary><pre>${escape(JSON.stringify(e,null,2))}</pre></details><div class="card-actions">${a.status==='pending'?`<button class="button primary" data-project-approval="${escape(a.approval_id)}" data-approved="true">Approve exact publication</button><button class="button danger" data-project-approval="${escape(a.approval_id)}" data-approved="false">Deny</button>`:''}${op.status==='running'?`<button class="button secondary" data-publication-retry="${escape(op.operation_id)}">Reconcile & retry this operation</button>`:''}</div></article>`;
  }).join('');
}
const field=(label,name,value='',type='text')=>`<label>${escape(label)}${type==='textarea'?`<textarea name="${name}" required>${escape(value)}</textarea>`:`<input name="${name}" type="${type}" value="${escape(value)}" required>`}</label>`;
function projectForm(title,fields,action,submit='Save') {
  inspect(title,`<form id="project-form" class="profile-form">${fields}<p id="project-form-error" role="alert"></p><button class="button primary" type="submit">${escape(submit)}</button></form>`);
  $('#project-form').onsubmit=async event=>{
    event.preventDefault();const button=event.target.querySelector('button[type=submit]');button.disabled=true;
    try{await action(new FormData(event.target));$('#inspect').close();await refresh();}
    catch(error){$('#project-form-error').textContent=error.message;button.disabled=false;}
  };
}
async function projectAction(kind) {
  const project=state.projects.find(p=>p.project_id===selectedProject);
  if(kind==='create'){
    const defaults=await request('projects/defaults');
    projectForm('Create a software Project',field('Name','name')+field('Description','description','','textarea')+field('Instructions','instructions','Use bounded source changes and independent review.','textarea'),async f=>{const p=await request('projects/create',{name:f.get('name'),description:f.get('description'),instructions:f.get('instructions'),policy:defaults.policy});selectedProject=p.project_id;},'Create Project');return;
  }
  if(kind==='policy'){
    const parsed=JSON.parse(project.policy);
    const instructions=field('Project instructions','instructions',project.instructions,'textarea');
    const help='<p>Named recipes use the Node test runner with explicit repository-relative test files. Configure focused and full stages before assigning work. Maximum runtime: 30 seconds. Tests may write only in the disposable build directory. Linux limits that directory to 64 MiB. The runtime disables JIT and WebAssembly. Dependency installation is unavailable.</p>';
    const example={recipe_id:'unit',name:'Unit tests',stage:'focused',executable:'node',argv:['--test','test/unit.test.mjs'],cwd:'.',timeout_ms:10000,output_bytes:8000,environment:'isolated'};
    if(project.status!=='active'){inspect('Archived Project policy',`<pre>${escape(JSON.stringify({instructions:project.instructions,policy:parsed},null,2))}</pre>`);return;}
    projectForm('Project instructions & validation policy',instructions+help+`<details><summary>Recipe example</summary><pre>${escape(JSON.stringify(example,null,2))}</pre><p>Add a second named recipe with stage “full” for integration acceptance.</p></details>`+field('Trusted policy (JSON)','policy',JSON.stringify(parsed,null,2),'textarea'),f=>request('projects/update',{project_id:project.project_id,instructions:f.get('instructions'),policy:JSON.parse(f.get('policy'))}));return;
  }
  if(kind==='archive'){
    projectForm('Archive '+project.name,`<p>Archive releases worker clone access and blocks new Project work. Canonical Git, clones, submissions, review rounds and integration history are retained. Outstanding work or publication must be resolved first.</p>${details({project_id:project.project_id,name:project.name})}`,()=>request('projects/archive',{project_id:project.project_id}),'Archive & release access');return;
  }
  const fields=field('Repository name','name')+field('Default branch','default_branch','main')+(kind==='import'?'<label>Git bundle (maximum 4 MiB)<input type="file" name="bundle" required></label>':kind==='remote'?field('Public GitHub HTTPS URL','url','https://github.com/owner/repository.git'):'<p>The service creates a managed repository with a minimal README commit.</p>');
  projectForm(kind==='import'?'Import a repository bundle':kind==='remote'?'Register a public GitHub repository':'Create managed repository',fields,async f=>{
    const repository={name:f.get('name'),default_branch:f.get('default_branch')};
    if(kind==='import'){
      const file=f.get('bundle');if(file.size>4*1024*1024)throw Error('Bundle exceeds 4 MiB');
      repository.bundle=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read bundle'));reader.readAsDataURL(file);});
    }
    if(kind==='remote'){repository.url=f.get('url');repository.policy='fetch_only';}
    await request('projects/repositories/'+kind,{project_id:project.project_id,repository});
  },'Register repository');
}
function repoAction(kind,id) {
  const repo=state.repositories.find(r=>r.repository_id===id);
  if(kind==='objective')projectForm('Assign a Project objective',field('Objective','objective','','textarea')+field('Acceptance criteria','acceptance_criteria','','textarea')+field('Constraints','constraints','Stay within assigned scopes and named recipes. No external publication by workers.','textarea'),f=>request('projects/objective',{project_id:repo.project_id,repository_id:id,objective:f.get('objective'),acceptance_criteria:f.get('acceptance_criteria'),constraints:f.get('constraints')}),'Assign to Atlas');
  if(kind==='remote')projectForm('Repository remote policy',field('Credential-free GitHub HTTPS URL','url',repo.remote_url??'https://github.com/owner/repository.git')+`<label>Remote policy<select name="policy">${['none','fetch_only','approved_push'].map(p=>`<option value="${p}" ${p===repo.remote_policy?'selected':''}>${p.replaceAll('_',' ')}</option>`).join('')}</select></label><p>Workers receive no remote credentials. Publication requires a separate exact human approval. Authenticated publication needs an operator-configured credential on the HQ host.</p>`,f=>request('projects/remote/configure',{repository_id:id,url:f.get('url'),policy:f.get('policy')}));
  if(kind==='fetch')void mutate('projects/remote/fetch',{repository_id:id}).catch(()=>{});
  if(kind==='publish'){
    const integration=state.integrations.filter(i=>i.repository_id===id&&i.status==='completed'&&i.final_commit===repo.current_commit).at(-1);
    projectForm('Request exact publication approval',details({remote:repo.remote_identity,branch:repo.default_branch,integrated_sha:integration.final_commit})+field('Reason','reason','Publish the tested integrated change.','textarea'),f=>request('projects/remote/request-push',{repository_id:id,integration_id:integration.integration_id,reason:f.get('reason')}),'Create approval request');
  }
}
function wireProjectActions(root) {
  root.querySelectorAll('[data-select-project]').forEach(b=>b.onclick=()=>{selectedProject=b.dataset.selectProject;render();});
  root.querySelectorAll('[data-project-action]').forEach(b=>b.onclick=()=>void projectAction(b.dataset.projectAction).catch(showError));
  root.querySelectorAll('[data-repo-action]').forEach(b=>b.onclick=()=>repoAction(b.dataset.repoAction,b.dataset.repository));
  root.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>{projectForm('Release completed allocation access',details({allocation_id:b.dataset.release,action:'Revoke access; retain clone and evidence'}),()=>request('projects/release',{allocation_id:b.dataset.release}),'Release access');});
  root.querySelectorAll('[data-project-approval]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await mutate('projects/approvals/decide',{approval_id:b.dataset.projectApproval,approved:b.dataset.approved==='true'});}catch{b.disabled=false;}});
  root.querySelectorAll('[data-publication-retry]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await mutate('projects/remote/retry',{operation_id:b.dataset.publicationRetry});}catch{b.disabled=false;}});
}


function renderDevices() {
  if (!deviceState) return '<div class="panel empty">Loading device identities…</div>';
  const labels = { 'state:read': 'Read dashboard, workers, tasks and messages', 'projects:read': 'Read Projects and repositories', 'artifacts:read': 'Read artifact metadata', 'messages:send': 'Send messages', 'objectives:create': 'Assign objectives', 'dispatch:control': 'Pause / resume dispatch', 'executions:interrupt': 'Interrupt executions', 'profiles:update': 'Update worker AI profiles' };
  const intro = `<section class="panel task-card"><h3>HQ identity</h3><p><code>${escape(deviceState.hq_id)}</code></p><p>This HQ stays private. The reference client currently connects through an SSH tunnel. Protected infrastructure and publication approvals remain in this Web UI.</p><h3>Add a device</h3><p>Select its maximum capabilities. Read-only access is selected by default.</p><div class="device-scopes">${deviceState.scope_allowlist.map(scope => `<label class="check-review"><input type="checkbox" data-device-scope="${escape(scope)}" ${deviceScopes.has(scope) ? 'checked' : ''}> ${escape(labels[scope])} <small>${escape(scope)}</small></label>`).join('')}</div><button id="create-pairing" class="button primary">Create pairing</button><p class="muted">Pairing expires in ten minutes and can be claimed once. Compare fingerprints before confirming.</p></section>`;
  const devices = deviceState.devices.map(d => {
    const p = deviceState.pairings.find(p => p.device_id === d.device_id);
    return `<article class="panel task-card" data-device="${escape(d.device_id)}"><header><strong>${escape(d.display_name)}</strong>${status(d.state)}</header>${details({ device_id: d.device_id, owner: d.owner_principal_id, platform: d.platform, app_version: d.app_version, public_key_fingerprint: d.fingerprint, capabilities: d.capabilities, hq_id: deviceState.hq_id, pairing_id: p?.pairing_id, pairing_expires: p?.expires_at, created: d.created_at, confirmed: d.confirmed_at, last_seen: d.last_seen_at, revoked: d.revoked_at })}<div class="card-actions">${d.state === 'pending' ? `<button class="button primary" data-device-confirm="${escape(d.device_id)}">Inspect and confirm</button><button class="button danger" data-device-deny="${escape(d.device_id)}">Deny device</button>` : d.state === 'active' ? `<button class="button danger" data-device-revoke="${escape(d.device_id)}">Revoke device</button>` : ''}</div></article>`;
  }).join('');
  const open = deviceState.pairings.filter(p => p.state === 'open').map(p => `<p>Waiting for claim · ${escape(p.pairing_id)} · expires ${escape(p.expires_at)}</p>`).join('');
  return intro + (open ? `<section class="panel task-card">${open}</section>` : '') + (devices || '<div class="panel empty">No devices have been paired.</div>');
}
function wireDevices() {
  document.querySelectorAll('[data-device-scope]').forEach(input => input.onchange = () => { if (input.checked) deviceScopes.add(input.dataset.deviceScope); else deviceScopes.delete(input.dataset.deviceScope); });
  if ($('#create-pairing')) $('#create-pairing').onclick = async () => {
    const button = $('#create-pairing'); button.disabled = true;
    try {
      const pairing = await mutate('devices/pairings', { capabilities: [...deviceScopes] });
      inspect('One-time pairing payload', `<p>Transfer this payload privately to your device. It expires at ${escape(pairing.expires_at)}. The device must still be confirmed here before it can connect.</p><label for="pairing-payload">Pairing payload</label><textarea id="pairing-payload" readonly rows="5">${escape(pairing.pairing_uri)}</textarea><p>This secret is shown once. Close this dialog after transferring it.</p><button id="dismiss-pairing" class="button primary">I have transferred the payload</button>`);
      const dialog = $('#inspect'); const clear = () => { const payload = $('#pairing-payload'); if (payload) { payload.value = ''; payload.textContent = ''; } };
      dialog.addEventListener('close', clear, { once: true });
      $('#dismiss-pairing').onclick = () => { clear(); dialog.close(); };
    } catch {} finally { if (button.isConnected) button.disabled = false; }
  };
  document.querySelectorAll('[data-device-confirm]').forEach(button => button.onclick = () => {
    const d = deviceState.devices.find(d => d.device_id === button.dataset.deviceConfirm);
    inspect('Confirm device identity', `<p>Compare this fingerprint with the one shown by your client. Confirm only if they match.</p>${details({ name: d.display_name, platform: d.platform, fingerprint: d.fingerprint, capabilities: d.capabilities, hq_id: deviceState.hq_id, device_id: d.device_id })}<button id="confirm-device" class="button primary">Fingerprints match — confirm device</button>`);
    $('#confirm-device').onclick = async () => { $('#confirm-device').disabled = true; try { await mutate('devices/decide', { device_id: d.device_id, decision: 'confirm' }); $('#inspect').close(); } catch { if ($('#confirm-device')) $('#confirm-device').disabled = false; } };
  });
  document.querySelectorAll('[data-device-deny]').forEach(button => button.onclick = async () => { button.disabled = true; try { await mutate('devices/decide', { device_id: button.dataset.deviceDeny, decision: 'deny' }); } catch { button.disabled = false; } });
  document.querySelectorAll('[data-device-revoke]').forEach(button => button.onclick = async () => { button.disabled = true; try { await mutate('devices/revoke', { device_id: button.dataset.deviceRevoke }); } catch { button.disabled = false; } });
}
