import {usageHTML,getUsage} from './usage.js';
import {workerAvatar, workerIdentity, fallbackAvatar, installPortraitFallback} from './worker-portraits.js';
installPortraitFallback();
import {computerSessions} from './computers.js';
import {companyOperations} from './mandates.js';
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
  inspect('Research sources and outcome',`${workerIdentity(worker(d.worker_id))}${details({operation:d.operation_id,worker:worker(d.worker_id)?.display_name,work_mode:d.origin,state:d.state,requested:JSON.stringify(JSON.parse(d.request)),grant:d.grant_id,policy:d.policy_version,started:d.created_at,finished:d.finished_at,provider:d.provider})}${d.result?.error?`<p role="alert">${escape(d.result.error)}</p>`:''}${d.result?.provider_summary?`<h3>Provider summary</h3><p class="message-body">${linkedText(d.result.provider_summary)}</p><p class="muted">Generated summary; the source evidence below records what was returned or read.</p>`:''}<h3>Source evidence</h3>${d.sources.map(s=>`<article class="research-source"><h4>${safeLink(s.url,s.title)}</h4>${details({kind:s.kind,retrieved_at:s.retrieved_at,observation_time:s.observed_at??'Unknown — inspect the source text',publication_time:s.published_at??'Unknown',freshness:s.freshness,omissions:s.omissions,sha256:s.sha256})}<details><summary>Bounded source excerpt</summary><pre>${escape(s.content)}</pre></details></article>`).join('')||'<p>No source content committed.</p>'}`);
}
const short = id => id?.split('_')[1]?.slice(0, 8) ?? id ?? '—';
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const messageTime = value => `<time datetime="${escape(value)}" title="${escape(value)}">${escape(value ? new Date(value).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')}</time>`;
const status = value => `<span class="status ${escape(value)}">${escape(value.replaceAll('_', ' '))}</span>`;

let selectedProject = null;
const chatDrafts = new Map(); let renderedChatConversation = null;
let conversationList = {items:[]}, conversationListWorker = null, selectedConversation = null, conversationDetail = null, conversationWorker = '', chatDraft = '', chatSending = false, chatReceipt = null;
let attentionVersion = -1;
let attentionState = null, attentionPending = false, attentionFocus = null;
let state, token, activeTab = 'home', draft = '', loading = null, refreshAgain = false, submitting = false;
// An absent snapshot is loading, never an empty company. Keep the last snapshot on failure.
let phase = 'booting', connection = 'connecting', loadError = null;
let sessionNeeded = true, connectionVersion = 0, defaultDraftLoaded = false, refreshController;
const auxiliaryLoaded = new Set(), auxiliaryErrors = new Map();
class RequestError extends Error {}
const canMutate = () => phase === 'ready' && !!state && !!token && !sessionNeeded && !auxiliaryErrors.has(activeTab);
function syncControls() {
  $('#pause').disabled = !canMutate();
  $('#initialize').disabled = !canMutate();
  $('#new-task').disabled = !canMutate();
  $('#inspect-stale').hidden = phase==='ready';
  for (const controls of document.querySelectorAll('.load-controls')) controls.disabled = !canMutate();
}
function loadingView(message) { return `<div class="panel empty" role="status"><strong>${escape(message)}</strong>Your selected section will appear when its data is available.</div>`; }
function renderReadiness() {
  renderNavigation();
  const title = titles[activeTab];
  document.title = `BotSquad HQ · ${title[0]}`;
  const attentionStale = attentionState && (phase !== 'ready' || attentionVersion !== connectionVersion || auxiliaryErrors.has('attention'));
  $('#attention-count').textContent = attentionState ? `${attentionState.total > 9 ? '9+' : attentionState.total}${attentionStale ? '*' : ''}` : auxiliaryErrors.has('attention') ? '?' : '…';
  $('#attention-count').title = attentionStale ? 'Last loaded count; refresh unavailable' : attentionState ? `${attentionState.total} need attention` : 'Owner attention has not loaded';
  $('#view-title').textContent = title[0]; $('#heading').textContent = title[1]; $('#subtitle').textContent = title[2];
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.classList.toggle('selected', button.dataset.tab === activeTab);
    if (button.dataset.tab === activeTab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const error = loadError ?? auxiliaryErrors.get(activeTab);
  $('#connection').textContent = !state ? (loadError ? 'Could not load headquarters' : 'Loading headquarters…')
    : connection === 'reconnecting' ? 'Reconnecting to headquarters…'
    : phase === 'degraded' ? (loadError ? 'Could not refresh headquarters' : 'Reconnecting to headquarters…')
    : connection === 'connected' ? 'Connected to headquarters' : 'Connecting to headquarters…';
  $('#connection-dot').classList.toggle('online', phase === 'ready' && connection === 'connected');
  $('#load-status').hidden = !error && phase !== 'degraded';
  $('#load-status').setAttribute('role', error ? 'alert' : 'status');
  $('#load-message').textContent = error ?? (state ? 'Reconnecting to headquarters… Showing the last loaded state. Controls will recover after a successful refresh.' : 'Reconnecting to headquarters… Waiting for company state.');
  $('#view').setAttribute('aria-busy', String(Boolean(!state || ((auxiliaryLoads[activeTab] || activeTab === 'attention') && !auxiliaryLoaded.has(activeTab) && !error))));
  syncControls();
}

let renderedView = '';
let deviceState = null;
let deviceScopes = new Set(['state:read']);
function updateView(html) {
  if (html === renderedView) return;
  const expanded = new Set([...document.querySelectorAll('#view details[open]')].map(disclosureKey));
  $('#view').innerHTML = activeTab === 'attention' ? html : `<fieldset class="load-controls" aria-label="Selected section">${html}</fieldset>`;
  for (const element of document.querySelectorAll('#view details')) element.open = expanded.has(disclosureKey(element));
  renderedView = html;
}
const worker = id => state.workers.find(w => w.worker_id === id);
const groups=workingGroups({request,refresh,render,inspect,showError,escape,linkedText,safeLink,status,worker,workerAvatar,workerIdentity,fallbackAvatar,isActive:()=>activeTab==='groups'});
const computers=computerSessions({request,refresh,render,inspect,showError,escape,status,workerIdentity,workers:()=>state?.workers??[]});
const mandates=companyOperations({request,refresh,render,inspect,showError,escape,status,workerIdentity,workers:()=>state?.workers??[],openGroup:async id=>{selectTab('groups');await groups.select(id);},isActive:()=>activeTab==='mandates'});
const titles = { home:['Home','Your team at a glance','See what is happening, review results, and decide what comes next.'], activity:['Activity','What happened recently','Meaningful milestones from your team’s recorded work.'], settings:['Settings','Your preferences and controls','Manage permissions, connected devices and advanced operations.'], attention:['Needs your attention','Does anything need you right now?','Current owner decisions and unresolved work, with links to their controls.'], computers:['Browser work','Browser work','Exact owner policies, private evidence and protected fixture approvals.'], mandates:['Ongoing goals','Ongoing goals and schedules','Bounded internal work, labelled evidence and durable reviews.'], groups:['Discussions','Reason together','Bounded discussions, shared evidence and recommendations. Implementation requires a separate assignment.'], direct:['Conversations','Talk with your team','Request a bounded reply or leave a passive message. Conversations remain separate from assignments.'], devices: ['Devices', 'Your paired devices', 'Confirm each device. Choose its capabilities. Revoke access at any time.'], approvals: ['Approvals', 'Review protected host changes', 'Exact scope. One trusted decision. Durable receipts.'], infrastructure: ['Infrastructure', 'Worker identities & access', 'Nix coordinates. The human approves. Bounded host operations enforce the change.'], products: ['Projects', 'Organize your projects', 'Software projects, ongoing goals and your investment workspace.'], conversation: ['Team updates', 'The company conversation', 'Read team messages and leave a note. Use New task to assign work.'], organization: ['Team', 'Meet your AI team', 'See each employee’s responsibilities, assignments and recent work.'], tasks: ['Tasks', 'Your tasks', 'Follow assignments from the original request to the finished result.'], executions: ['Work sessions', 'Work sessions', 'One session is one attempt. A finished session does not always mean a finished task.'], audit: ['Advanced audit', 'The record of what happened', 'Durable events recorded by the control plane.'] };
// UX-01: presentation over existing authoritative records; no new work authority.
const sections = {
  home: [['home','Overview']],
  tasks: [['tasks','All tasks'],['attention','Needs your attention'],['computers','Browser work']],
  organization: [['organization','Employees'],['direct','Conversations'],['groups','Discussions']],
  activity: [['activity','Recent activity'],['conversation','Team updates'],['executions','Work sessions'],['audit','Advanced audit']],
  products: [['products','Software projects'],['mandates','Ongoing goals']],
  settings: [['settings','Overview'],['approvals','Approvals'],['infrastructure','Infrastructure'],['devices','Devices']],
};
let reflectedTab = null, taskQuery = '', taskFilter = 'all', activityFilter = 'all', newTaskDraft = '', newTaskSending = false, taskLimit = 40, activityLimit = 40, inspectedTaskId = null, inspectedTaskFingerprint = '', inspectedWorkerId = null, inspectedWorkerFingerprint = '';
function disclosureKey(e) { return e.dataset.disclosure || e.id || e.querySelector('summary')?.textContent; }
function rememberFocus() {
  const e=document.activeElement;if(!e||e===document.body)return null;
  const root=e.closest('#inspect,#view,#workers,#section-nav,.rail'),scope=root?(root.id?'#'+root.id:'.rail'):null;
  const saved={element:e,id:e.id,tag:e.tagName,scope,attributes:[...e.attributes].filter(a=>a.name.startsWith('data-')||a.name==='name').map(a=>[a.name,a.value]),text:e.textContent,selection:typeof e.selectionStart==='number'?[e.selectionStart,e.selectionEnd]:null};
  saved.ordinal=[...(root||document).querySelectorAll(saved.tag)].filter(n=>focusMatch(n,saved)).indexOf(e);return saved;
}
function focusMatch(e,saved) { return saved.attributes.length?saved.attributes.every(([k,v])=>e.getAttribute(k)===v):e.textContent===saved.text; }
function restoreFocus(saved,fallback=false) {
  if(!saved)return;const root=saved.scope?document.querySelector(saved.scope):document;
  const matches=[...(root||document).querySelectorAll(saved.tag)].filter(e=>focusMatch(e,saved));
  const target=saved.element.isConnected?saved.element:saved.id?document.getElementById(saved.id):matches[saved.ordinal]||matches[0];
  if(!target||target.closest('[hidden]')||(target.closest('dialog')&&!target.closest('dialog').open)) { if(fallback)($('#inspect').open?$('#inspect-title'):$('#heading')).focus({preventScroll:true});return; }
  if(document.activeElement!==target)target.focus({preventScroll:true});if(saved.selection&&target.setSelectionRange)target.setSelectionRange(...saved.selection);
}
function parentSection(tab) { return Object.keys(sections).find(k=>sections[k].some(([id])=>id===tab)) || 'home'; }
function locationTab() { const name=location.hash.slice(1).split('/')[0]; return Object.hasOwn(titles,name) ? name : 'home'; }
function renderNavigation() {
  const parent=parentSection(activeTab);
  document.querySelectorAll('.rail [data-tab]').forEach(b=>b.classList.toggle('active-section',b.dataset.tab===parent));
  const html=sections[parent].map(([id,label])=>`<button class="section-link ${id===activeTab?'current-section':''}" ${id===parent?'data-go':'data-tab'}="${id}" ${id===activeTab?'aria-current="page"':''}>${label}</button>`).join('')+(parent==='products'?'<a class="section-link" href="/investment-run">Investment ↗</a>':'');
  if ($('#section-nav').innerHTML !== html && reflectedTab !== activeTab) $('#section-nav').innerHTML=html;
  $('#section-nav').hidden=parent==='home';
  if(reflectedTab!==activeTab){reflectedTab=activeTab;if(locationTab()!==activeTab)history.replaceState(null,'',`#${activeTab}`);}
  wireNavigation($('#section-nav'));
}
function selectTab(tab,push=true) { activeTab=tab; if(push&&location.hash!==`#${tab}`)history.pushState(null,'',`#${tab}`); }
function navigate(tab,{focus=true,push=true}={}) {
  if(!Object.hasOwn(titles,tab))return;
  if($('#inspect').open)$('#inspect').close();
  attentionFocus=null; selectTab(tab,push);
  render();
  if(focus)$('#heading').focus({preventScroll:true});
  $('#announcer').textContent=titles[tab][0];
  if(state&&(auxiliaryLoads[tab]||tab==='attention'))void refresh();
}
function readLocation() { if(location.hash==='#main-content'){ $('#main-content').focus(); return; } navigate(locationTab(),{push:false}); }
function wireNavigation(root) {
  root.querySelectorAll('[data-tab],[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.tab||b.dataset.go));
  root.querySelectorAll('[data-new-task]').forEach(b=>b.onclick=openNewTask);
  root.querySelectorAll('[data-help]').forEach(b=>b.onclick=showHelp);
}
function attentionFresh() { return !!attentionState && phase==='ready' && attentionVersion===connectionVersion && !auxiliaryErrors.has('attention'); }
function employeeState(w) {
  if(!w.enabled)return 'Retired';
  if(state.executions.some(e=>e.worker_id===w.worker_id&&e.status==='running'))return 'Working now';
  return {idle:'No session running',queued:'Work queued',blocked:'Waiting',failed:'Needs review',awaiting_approval:'Approval pending',working:'Work recorded'}[w.status] || 'Status unknown';
}
function taskState(t) {
  if(t.blocking_reason==='waiting_children')return 'Waiting for related tasks';
  if(t.blocking_reason==='waiting_integration')return 'Waiting for project integration';
  return {queued:'Waiting to start',working:'In progress',completed:'Completed',blocked:'Waiting · review reason',failed:'Could not finish',cancelled:'Cancelled',awaiting_approval:'Waiting for approval'}[t.status]||t.status;
}
function taskStatus(t) { return `<span class="status ${escape(t.status)}">${escape(taskState(t))}</span>`; }
function taskNext(t) {
  if(t.status==='completed')return 'Review the outcome and any saved results below.';
  if(t.status==='cancelled')return 'This task is closed. Its history and any saved results remain available.';
  if(t.blocking_reason==='waiting_children')return 'The coordinator is waiting for related assignments. Follow their progress below; no new assignment is needed.';
  if(t.blocking_reason==='waiting_integration')return 'The project is waiting for integration. Open the project to review its checks and approval state.';
  if(t.status==='queued')return state.paused?'Starting queued work is paused. Review all waiting work before resuming in Settings.':'Waiting for an eligible employee work session. Existing permissions and capacity still apply.';
  if(t.status==='working')return 'Follow the recorded activity below. No completion time or percentage is available.';
  if(t.status==='awaiting_approval')return 'Review the exact pending request in Needs your attention. Approving this task does not grant unrelated permissions.';
  return 'Read the recorded reason and prior work before retrying. Needs your attention links to any required owner action.';
}
function taskCard(t,{compact=false}={}) {
  const children=state.tasks.filter(c=>c.parent_task_id===t.task_id);
  return `<article class="panel task-card" data-task-card="${escape(t.task_id)}"><header><button class="employee-link task-ownership" data-worker="${escape(t.assignee_worker_id)}">${workerIdentity(worker(t.assignee_worker_id))}</button>${taskStatus(t)}</header><h3><button class="title-link" data-task="${escape(t.task_id)}">${escape(t.objective)}</button></h3>${t.parent_task_id?`<p class="related-label">Related assignment · <button class="text-link" data-task="${escape(t.parent_task_id)}">Open parent task</button></p>`:''}${!compact&&t.result_summary?`<p class="task-summary"><strong>${t.status==='completed'?'Outcome':'Latest update'}:</strong> ${escape(t.result_summary.slice(0,320))}${t.result_summary.length>320?'…':''}</p>`:''}${!compact&&t.blocking_reason&&!['waiting_children','waiting_integration'].includes(t.blocking_reason)?`<p class="problem-reason">Recorded reason: ${escape(t.blocking_reason)}</p>`:''}<small>Last task update ${messageTime(t.updated_at)}${children.length?` · ${children.length} related assignment${children.length===1?'':'s'}`:''}</small><div class="card-actions"><button class="button secondary small" data-task="${escape(t.task_id)}">Open task</button>${t.status==='completed'?artifactLinks(t.task_id):''}</div></article>`;
}
function renderHome() {
  const current=state.tasks.filter(t=>!['completed','cancelled','failed'].includes(t.status));
  const roots=current.filter(t=>!t.parent_task_id||!current.some(p=>p.task_id===t.parent_task_id));
  const completed=state.tasks.filter(t=>t.status==='completed'&&!t.parent_task_id).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  const otherCompleted=completed.length?completed:state.tasks.filter(t=>t.status==='completed').sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  const running=state.executions.filter(e=>e.status==='running');
  const attention=attentionFresh()?attentionState.items.slice(0,3):[];
  return `<section class="home-intro"><div><h2>What would you like your team to do?</h2><p>Describe an outcome. Atlas coordinates the work, and you can follow every assignment.</p></div><button class="button primary" data-new-task>New task</button></section>
  <div class="home-columns"><section aria-labelledby="current-work-title"><div class="section-heading"><h2 id="current-work-title">Current work</h2><button class="text-link" data-go="tasks">All tasks</button></div>${running.length?`<p class="running-note">${running.length} work session${running.length===1?' is':'s are'} running now.</p>`:'<p class="muted">No employee work session is running in the loaded records.</p>'}${roots.slice(0,4).map(t=>taskCard(t,{compact:true})).join('')||'<div class="panel empty"><strong>No tasks are running or waiting.</strong>Start a new task when you have something for your team.</div>'}${roots.length>4?`<p>${roots.length-4} more active assignments in <button class="text-link" data-go="tasks">Tasks</button>.</p>`:''}${running.filter(e=>e.origin!=='task').map(e=>`<div class="panel task-card">${workerIdentity(worker(e.worker_id))}<p>${escape(e.group_id?'Discussion in progress':e.origin==='public_question'?'Recorded public-question work session':'Team work session in progress')}</p><button class="text-link" data-go="executions">View work session</button></div>`).join('')}</section>
  <section aria-labelledby="attention-title"><div class="section-heading"><h2 id="attention-title">Needs your attention</h2><button class="text-link" data-go="attention">View all</button></div><div class="panel attention-summary">${!attentionFresh()?`<h3>${attentionState?'Attention needs refreshing':'Checking what needs you…'}</h3><p>${auxiliaryErrors.has('attention')?'Could not check owner actions. Open the attention view and retry.':'The current count is not verified yet.'}</p>`:!attentionState.total?'<h3>Nothing needs your attention.</h3><p>There are no recorded owner actions to take right now.</p>':attention.map(item=>`<article><h3>${escape(item.title)}</h3><p>${escape(item.summary)}</p><button class="button secondary small" data-attention="${escape(item.attention_id)}">${escape(item.owner_action)}</button></article>`).join('')}${attentionFresh()&&attentionState.total>3?`<p>${attentionState.total-3} more owner actions. <button class="text-link" data-go="attention">View all</button></p>`:''}</div><div class="panel home-investment"><h3>Investment workspace</h3><p>Paper portfolio, research, decisions and future schedules have their own records. They are separate from these task counts.</p><a href="/investment-run">Open Investment →</a></div></section></div>
  <section aria-labelledby="recent-work-title"><div class="section-heading"><h2 id="recent-work-title">Recently completed</h2><button class="text-link" data-go="tasks">All tasks and results</button></div><div class="result-grid">${otherCompleted.slice(0,4).map(t=>taskCard(t)).join('')||'<div class="panel empty"><strong>No completed tasks yet.</strong>Finished assignments and saved results will appear here.</div>'}</div></section>
  <section aria-labelledby="home-team-title"><div class="section-heading"><h2 id="home-team-title">Your AI team</h2><button class="text-link" data-go="organization">Meet the team</button></div><div class="team-grid">${state.workers.filter(w=>w.enabled).map(w=>`<button class="panel employee-card" data-worker="${escape(w.worker_id)}">${workerAvatar(w,{size:'large'})}<span><strong>${escape(w.display_name)}</strong><small>${escape(w.title)}</small><small>${escape(employeeState(w))}</small></span></button>`).join('')||'<p>Atlas will be set up when you start your first task.</p>'}</div></section>`;
}
function openNewTask() {
  if(!canMutate()||newTaskSending)return;
  inspect('New task',`<form id="new-task-form" class="profile-form"><label for="new-task-objective">What would you like done?</label><textarea id="new-task-objective" required maxlength="8000" placeholder="Describe the result you want, with any useful context or limits.">${escape(newTaskDraft)}</textarea><p>Atlas will coordinate this task. You will see who is responsible and follow progress in Tasks.</p>${state.paused?'<p class="pause-banner">Starting queued work is paused. Your task will wait until you explicitly resume queued work in Settings.</p>':''}<details><summary>Permissions and advanced options</summary><p>This task uses existing approved tools and limits. It does not authorize spending, external accounts, outreach, publishing, browser control or arbitrary network/shell access. Public research requires an existing permission.</p><p>Software repository objectives belong in Projects. Employee model settings are available under Team → employee → AI settings. You do not need them for this task.</p></details><p id="task-submit-error" role="alert" hidden></p><button class="button primary" type="submit">Start task</button><p class="muted">Starting a task requests real AI work when the team is able to run it. No extra approval is added here.</p></form>`);
  $('#new-task-objective').focus();
  $('#new-task-objective').oninput=e=>{newTaskDraft=e.target.value;};
  const version=researchView;
  $('#new-task-form').onsubmit=async e=>{
    e.preventDefault();if(newTaskSending||!canMutate())return;
    const objective=$('#new-task-objective').value.trim();if(!objective)return;
    newTaskDraft=objective;newTaskSending=true;const submit=e.target.querySelector('button[type=submit]');submit.disabled=true;
    try{
      const result=await request('objectives',{objective});newTaskDraft='';
      await refresh();
      $('#announcer').textContent='Task created. Follow it in Tasks.';
      if(version===researchView&&$('#inspect').open){
        selectTab('tasks');render();
        if(state.tasks.some(t=>t.task_id===result.task_id))inspectTask(result.task_id);
        else inspect('Task created',`<p>Your task was created, but its details could not be refreshed yet. Do not submit it again.</p><p>Open Tasks and retry loading headquarters to follow it.</p><a class="button secondary" href="#tasks" data-go="tasks">Open Tasks</a><details><summary>Task reference</summary><code>${escape(result.task_id)}</code></details>`);
      }
    }catch(error){
      if(version===researchView&&$('#inspect').open){
        $('#task-submit-error').hidden=false;
        $('#task-submit-error').textContent=`We could not confirm whether your task was created. Check Tasks before submitting again. ${error.message}`;
        const check=document.createElement('button');check.type='button';check.className='button secondary';check.textContent='Check Tasks';check.onclick=()=>navigate('tasks');$('#task-submit-error').after(check);
        // No automatic or immediate repeat: this endpoint has no idempotency receipt.
      }else showError(error);
    }finally{newTaskSending=false;}
  };
}
function renderSettings() {
  const cards=[['approvals','Approvals','Review exact infrastructure and repository publication requests. Other approvals stay with their originating workflow.'],['organization','Employee permissions and AI settings','Open an employee profile for research/document permissions, model settings and usage.'],['devices','Connected devices','Pair a client, review its identity and access, or revoke it.'],['infrastructure','Infrastructure','Inspect Nix, host operations and employee system identities.'],['computers','Browser work','Review browser task permissions and exact session policies.'],['mandates','Ongoing goals','Manage bounded goals, schedules and their protected business actions.']];
  return `<section class="panel task-card"><h2>Starting queued work</h2><p>${state.paused?'Paused. Queued tasks and replies are waiting.':'Enabled. Eligible queued tasks and replies can start.'} Active work sessions continue when you pause new work.</p><p>Review <button class="text-link" data-go="tasks">waiting tasks</button> and <button class="text-link" data-go="executions">active sessions</button> before changing this company-wide setting.</p><p>The control below these settings applies to the whole team. Investment schedules have separate controls in Investment.</p></section><div class="settings-grid">${cards.map(([tab,title,body])=>`<section class="panel task-card"><h3>${title}</h3><p>${body}</p><button class="button secondary" data-go="${tab}">Open ${title}</button></section>`).join('')}</div><section class="panel task-card"><h3>Ask BotSquad is paused</h3><p>The public question service remains paused under the owner’s instruction.</p><a href="/investment-publication">Investment publication controls</a></section>`;
}
function showHelp() {
  inspect('Your first task with BotSquad',`<div class="help-guide"><p>BotSquad is your private workspace for a team of AI employees. Atlas coordinates tasks; each employee keeps a name, role and work history.</p><ol><li><strong>Look at Home.</strong> Current work shows unfinished assignments. Needs your attention lists actual owner actions. Recently completed opens finished tasks and results.</li><li><strong>Choose New task.</strong> Describe the result you want. For a first exercise, use the short request below.</li><li><strong>Choose Start task.</strong> The returned task shows its assignee, actual status and recorded activity. If work is paused, review the queue before resuming in Settings.</li><li><strong>Follow the work.</strong> Team shows employee responsibilities. Related assignments appear with their parent. Team → Conversations is for discussion; a message does not create a task.</li><li><strong>Review the outcome.</strong> Open Results and files when the task is completed. A finished work session alone is not a finished task.</li></ol><blockquote>Read this text and summarize it in three plain-English bullet points: “BotSquad keeps tasks, messages and results. Atlas coordinates assignments. The owner reviews outcomes and controls permissions.” Use only the text in this request. Do not browse, change software or publish anything.</blockquote><p>For a problem, open Needs your attention and inspect its reason before retrying. A lost response may still have created a task; check Tasks before submitting again.</p><details><summary>Where are advanced tools?</summary><p>Activity → Work sessions and Advanced audit retain original execution records. Task details retain IDs, logs and attempts. Team profiles have Permissions and AI settings. Settings contains infrastructure, exact approvals and device access. Projects contains software projects, ongoing goals and Investment.</p></details><button class="button primary" data-new-task>New task</button></div>`);
}
function wireTaskFilters() {
  if($('#task-search'))$('#task-search').oninput=e=>{taskQuery=e.target.value;taskLimit=40;render();};
  if($('#task-filter'))$('#task-filter').onchange=e=>{taskFilter=e.target.value;taskLimit=40;render();};
  if($('#more-tasks'))$('#more-tasks').onclick=()=>{taskLimit+=40;render();};
  if($('#activity-filter'))$('#activity-filter').onchange=e=>{activityFilter=e.target.value;activityLimit=40;render();};
  if($('#more-activity'))$('#more-activity').onclick=()=>{activityLimit+=40;render();};
}
function renderTasks() {
  const tasks=state.tasks.filter(t=>{
    const matches=taskFilter==='all'||(taskFilter==='open'?!['completed','cancelled'].includes(t.status):t.status===taskFilter);
    const text=[t.objective,t.result_summary,worker(t.assignee_worker_id)?.display_name].join(' ').toLowerCase();
    return matches&&text.includes(taskQuery.toLowerCase());
  }).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  return `<section class="panel task-toolbar"><div><label for="task-search">Find a task or employee</label><input id="task-search" type="search" value="${escape(taskQuery)}" placeholder="Search tasks, results or names"></div><div><label for="task-filter">Show</label><select id="task-filter">${[['all','All tasks'],['open','Unfinished and needs review'],['completed','Completed'],['failed','Could not finish'],['cancelled','Cancelled']].map(([id,label])=>`<option value="${id}" ${taskFilter===id?'selected':''}>${label}</option>`).join('')}</select></div><button class="button primary" data-new-task>New task</button></section><p class="muted">${tasks.length} matching task${tasks.length===1?'':'s'}. Related assignments are labelled with their parent.</p><div class="card-list">${tasks.slice(0,taskLimit).map(t=>taskCard(t)).join('')||`<div class="panel empty"><strong>${state.tasks.length?'No matching tasks.':'Your first task starts here.'}</strong>${state.tasks.length?'Try another search or status.':'Choose New task and describe what you want done.'}</div>`}</div>${tasks.length>taskLimit?'<button id="more-tasks" class="button secondary">Show more tasks</button>':''}`;
}
function renderOrganization() {
  const node=w=>`<div class="org-node">${workerAvatar(w)}<div><strong>${escape(w.display_name)} — ${escape(w.title)}</strong><small>${escape(employeeState(w))}</small></div><button class="text-link" data-worker="${escape(w.worker_id)}">Open profile</button></div>${state.workers.some(c=>c.manager_worker_id===w.worker_id)?`<div class="org-children">${state.workers.filter(c=>c.manager_worker_id===w.worker_id).map(node).join('')}</div>`:''}`;
  return `<div class="team-profile-grid">${state.workers.map(w=>{
    const current=state.tasks.filter(t=>t.assignee_worker_id===w.worker_id&&!['completed','cancelled'].includes(t.status));
    return `<article class="panel task-card"><header>${workerIdentity(w,{size:'large'})}<span class="status">${escape(employeeState(w))}</span></header><h3>${escape(w.title)}</h3><p>${escape(w.mission)}</p><h4>Current assignments</h4>${current.length?current.slice(0,3).map(t=>`<p><button class="text-link" data-task="${escape(t.task_id)}">${escape(t.objective)}</button><small>${escape(taskState(t))}</small></p>`).join(''):'<p class="muted">No unfinished task assigned. Conversations and scheduled work have separate records.</p>'}<div class="card-actions"><button class="button secondary" data-worker="${escape(w.worker_id)}">Open profile</button><button class="text-link" data-chat-worker="${escape(w.worker_id)}">Conversations</button></div></article>`;
  }).join('')||'<div class="panel empty"><strong>Meet Atlas with your first task.</strong>Your team will appear here with its responsibilities and work.</div>'}</div><details class="panel hierarchy-panel" data-disclosure="team-hierarchy"><summary>Reporting hierarchy</summary><p>Reporting lines govern responsibility and assignment authority. Employees can discuss work across these lines within their permissions.</p><div class="org-tree"><div class="org-node">${fallbackAvatar('Human')}<strong>Human owner</strong></div><div class="org-children">${state.workers.filter(w=>!w.manager_worker_id).map(node).join('')}</div></div></details>`;
}
function workerFingerprint(id) { return JSON.stringify([worker(id),state.tasks.filter(t=>t.assignee_worker_id===id),state.executions.filter(e=>e.worker_id===id),state.artifacts,phase]); }
function inspectWorker(id,updating=false) {
  const focused=updating?rememberFocus():null,scroll=$('#inspect').scrollTop,opened=new Set([...document.querySelectorAll('#inspect details[open]')].map(disclosureKey));
  const w=worker(id);if(!w)return;
  const current=state.tasks.filter(t=>t.assignee_worker_id===id&&!['completed','cancelled'].includes(t.status));
  const completed=state.tasks.filter(t=>t.assignee_worker_id===id&&t.status==='completed').sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
  const active=state.executions.filter(e=>e.worker_id===id&&e.status==='running');
  inspect(`${w.display_name} — ${w.title}`,`<div class="profile-intro">${workerAvatar(w,{size:'large'})}<div><p>${escape(w.mission)}</p><span class="status">${escape(employeeState(w))}</span></div></div><p>${w.manager_worker_id?`Reports to ${escape(worker(w.manager_worker_id)?.display_name||'recorded manager')}.`:'Reports to the human owner.'} This employee’s identity and history persist across individual AI work sessions.</p><div class="card-actions"><button class="button primary" data-chat-worker="${escape(id)}">Open conversations</button><button class="button secondary" data-research-worker="${escape(id)}">Permissions & research</button><button class="button secondary" data-worker-usage="${escape(id)}">AI usage and cost</button></div><h3>Working now</h3>${active.map(e=>`<p>${escape(sessionDescription(e))} <button class="text-link" data-execution="${escape(e.execution_id)}">Open work session</button></p>`).join('')||'<p>No work session running in the loaded records. This does not guarantee availability for a new assignment.</p>'}<h3>Current assignments</h3>${current.map(t=>taskCard(t,{compact:true})).join('')||'<p>No unfinished task assigned.</p>'}<h3>Recent completed work</h3>${completed.slice(0,5).map(t=>taskCard(t)).join('')||'<p>No completed tasks recorded for this employee.</p>'}<details><summary>Advanced employee details</summary>${details({employee_id:w.worker_id,role:w.role,status:w.status,lifecycle:w.lifecycle,enabled:!!w.enabled,manager:w.manager_worker_id})}<button class="button secondary" data-ai-settings="${escape(id)}">AI settings</button><p>Model, reasoning, priority, human lock, system identity and provider thread details. Changes affect future work sessions.</p></details>`,updating);
  inspectedWorkerId=id;inspectedWorkerFingerprint=workerFingerprint(id);
  if(updating){for(const d of document.querySelectorAll('#inspect details'))d.open=opened.has(disclosureKey(d));$('#inspect').scrollTop=scroll;restoreFocus(focused);}
}
function sessionDescription(e) {
  if(e.origin==='task')return `Task work session${state.tasks.find(t=>t.task_id===e.task_id)?': '+state.tasks.find(t=>t.task_id===e.task_id).objective:''}`;
  if(e.group_id)return 'Discussion work session';
  if(e.origin==='public_question')return 'Recorded public-question work session';
  return 'Team work session (conversation or ongoing goal)';
}
function inspectExecution(id) {
  const e=state.executions.find(e=>e.execution_id===id);if(!e)return;
  inspect('Work session details',`<p>${escape(sessionDescription(e))}</p><p>${workerIdentity(worker(e.worker_id))} ${status(e.status)}</p><p>A completed session is one finished attempt; check the task or originating workflow for the final outcome.</p>${e.task_id?`<button class="button secondary" data-task="${escape(e.task_id)}">Open task</button>`:''}<button class="button secondary" data-usage="${escape(id)}">Usage & cost</button>${e.status==='running'&&state.supportsInterrupt?`<button class="button danger" data-interrupt="${escape(id)}">Interrupt this session</button>`:''}<h3>Original execution record</h3>${details(e)}`);
}
const milestoneLabels = {
  task_assigned:'Task assigned',task_claimed:'Employee started task work',artifact_submitted:'Result saved',child_result_received:'Related assignment returned',manager_followup_queued:'Coordinator follow-up queued',retry_requested:'Inspected retry requested',execution_started:'Work session started',execution_completed:'Work session finished',execution_failed:'Work session could not finish',execution_interrupted:'Work session interrupted',execution_awaiting_approval:'Work session waiting for approval',execution_recovered:'Work session recovered for inspection',
  conversation_created:'Conversation created',conversation_message:'Conversation message recorded',conversation_queued:'Reply requested',conversation_execution_started:'Team work session started',conversation_execution_finished:'Team work session finished',conversation_state:'Conversation state changed',
  discussion_created:'Discussion drafted',discussion_owner_start:'Discussion started',discussion_contribution:'Discussion contribution saved',discussion_completed:'Discussion recommendation saved',discussion_blocked:'Discussion needs review',discussion_assignment_submitted:'Discussion recommendation assigned as a task',
  dispatch_paused:'Starting queued work paused',dispatch_resumed:'Starting queued work resumed',worker_provisioned:'Employee joined the team',worker_retired:'Employee retired',ceo_initialized:'Atlas joined the team',
};
function eventDetail(e) { try{return JSON.parse(e.detail);}catch{return {};} }
function milestone(e) {
  if(e.type==='task_transition'){const d=eventDetail(e);return Object.hasOwn({queued:1,working:1,completed:1,blocked:1,failed:1,cancelled:1,awaiting_approval:1},d.to)?`Task: ${taskState({status:d.to,blocking_reason:d.reason})}`:'Task state changed';}
  return milestoneLabels[e.type] || null;
}
function timeline(events) {
  return `<ol class="timeline">${events.map(e=>`<li><div><strong>${escape(milestone(e)||'Other recorded event')}</strong><small>${messageTime(e.created_at)}${e.worker_id?` · ${escape(worker(e.worker_id)?.display_name||'Recorded employee')}`:''}</small></div><button class="text-link" data-event="${escape(e.event_id)}">Evidence</button></li>`).join('')}</ol>`;
}
function renderActivity() {
  // Low-level tool/configuration/heartbeat records remain in Advanced audit.
  const events=state.audit.filter(e=>milestone(e)&&(activityFilter==='all'||(activityFilter==='tasks'?!!e.task_id:!e.task_id))).slice().reverse();
  return `<section class="panel task-toolbar"><div><label for="activity-filter">Activity to show</label><select id="activity-filter">${[['all','All milestones'],['tasks','Task milestones'],['team','Other team milestones']].map(([id,label])=>`<option value="${id}" ${activityFilter===id?'selected':''}>${label}</option>`).join('')}</select></div><p>Recorded assignments, state changes, results and discussions. Each milestone opens its original evidence.</p></section><section class="panel task-card">${events.length?timeline(events.slice(0,activityLimit)):'<div class="empty"><strong>No milestones yet.</strong>Recorded work will appear here.</div>'}${events.length>activityLimit?'<button class="button secondary" id="more-activity">Show earlier milestones</button>':''}</section><p class="muted">This is a selected view of recorded events. <button class="text-link" data-go="audit">Advanced audit</button> contains all original event types, including technical and unrecognized records. <button class="text-link" data-go="conversation">Team updates</button> contains company messages. Investment has its own <a href="/investment-run">research and portfolio history</a>.</p>`;
}
function inspectEvent(id) {
  const e=state.audit.find(e=>e.event_id===id);if(!e)return;
  inspect(milestone(e)||'Recorded event',`<p>${messageTime(e.created_at)}</p>${e.task_id?`<button class="button secondary" data-task="${escape(e.task_id)}">Open related task</button>`:''}${e.execution_id?`<button class="button secondary" data-execution="${escape(e.execution_id)}">Open work session</button>`:''}<h3>Original event evidence</h3>${details(e)}`);
}

async function loadConversations(signal) {
  const filter=conversationWorker, requestedConversation=selectedConversation;
  const list=await request(`conversations${filter ? `?worker_id=${encodeURIComponent(filter)}` : ''}`, undefined, signal);
  if(filter!==conversationWorker)return;
  conversationList=list; conversationListWorker=filter;
  if(requestedConversation){const detail=await request(`conversations/${encodeURIComponent(requestedConversation)}`, undefined, signal);if(filter===conversationWorker&&selectedConversation===requestedConversation)conversationDetail=detail;}

}
async function openWorkerConversations(workerId) {
  $('#inspect').close(); conversationWorker=workerId; selectedConversation=null; conversationDetail=null; chatDraft=''; chatReceipt=null; selectTab('direct');
  render(); await refresh();
}
function renderDirect() {
  const d=conversationDetail, c=d?.conversation;
  const list=conversationListWorker===conversationWorker?conversationList:null;
  const history=d?.history;
  const participants=d?.participants??[];
  const names=participants.map(p=>p.display_name).join(' ↔ ');
  const canSend=c&&c.state!=='archived'&&participants.some(p=>p.principal_id==='human'&&p.active);
  return `<div class="panel task-card"><label>Participant <select id="conversation-worker"><option value="">All conversations</option>${state.workers.map(w=>`<option value="${escape(w.worker_id)}" ${conversationWorker===w.worker_id?'selected':''}>${escape(w.display_name)} · ${escape(w.title)}</option>`).join('')}</select></label><div class="card-actions"><button id="new-conversation" class="button primary" ${!conversationWorker?'disabled':''}>New direct conversation</button></div><p class="muted">Private to current participants. The human owner can inspect all conversations, including peer exchanges.</p>${(list?.items??[]).map(item=>`<button class="conversation-entry ${selectedConversation===item.conversation_id?'selected':''}" data-conversation="${escape(item.conversation_id)}"><strong>${escape(item.purpose)}</strong><small>${escape(item.participants.map(p=>p.display_name).join(' ↔ '))} · ${escape(item.state)}</small></button>`).join('')||`<p class="muted">${list?'Choose a worker and start a conversation.':'Loading conversations…'}</p>`}${list?.next_cursor?`<button id="older-conversations" class="button secondary">Older conversations</button>`:''}</div>
    ${c?`<div class="panel"><div class="panel-title">${escape(names)} <span>${status(c.state)}</span></div><div class="context-content"><h3>${escape(c.purpose)}</h3><small>Conversation ${short(c.conversation_id)}</small>${state.paused?'<p class="pause-banner">HQ dispatch is paused. Reply requests queue until you resume dispatch.</p>':''}<div class="card-actions">${c.state!=='active'?'<button class="button secondary" data-conversation-state="active">Resume conversation</button>':'<button class="button secondary" data-conversation-state="muted">Mute reply dispatch</button>'}${c.state!=='archived'?'<button class="button secondary" data-conversation-state="archived">Archive</button>':''}${participants.filter(p=>p.worker_id&&p.active).map(p=>`<button class="button secondary" data-rollover="${escape(p.worker_id)}">Replace ${escape(p.display_name)}’s context</button>`).join('')}</div><p class="muted">Mute holds reply dispatch; archive also prevents new messages. Interrupt an active reply before either action. History is retained.</p></div>
    <div class="messages">${history.next_cursor?'<button id="older-chat" class="button secondary">Earlier messages</button>':''}${history.items.map(m=>`<article class="message">${principalAvatar(m.sender_principal_id)}<div class="message-main"><div class="message-meta"><strong>${escape(participants.find(p=>p.principal_id===m.sender_principal_id)?.display_name??'Worker')}</strong>${messageTime(m.created_at)}${m.response_to?'<span>Reply</span>':''}</div><div class="message-body">${linkedText(m.body)}</div>${m.execution_id?`<button class="task-link" data-chat-execution="${escape(m.execution_id)}">Execution ${short(m.execution_id)}</button>`:''}</div></article>`).join('')||'<div class="empty">No messages yet.</div>'}</div>
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
const principalAvatar = id => {
  const p = principal(id);
  return p?.type === 'bot' ? workerAvatar(state.workers.find(w => w.principal_id === id)) : fallbackAvatar(p?.display_name ?? 'Unknown');
};
const artifacts = taskId => state.artifacts.filter(a => a.task_id === taskId);
function showError(error) { const target = $('#inspect').open ? $('#inspect-error') : $('#error'); target.textContent = error.message; target.hidden = false; }
async function request(path, data, signal) {
  // All browser writes share this prerequisite, including module/inspector forms.
  if (data !== undefined && !canMutate()) throw new RequestError('Wait for headquarters to finish loading before making changes.');
  let response, body;
  try {
    response = await fetch(`/api/${path}`, data === undefined ? { signal } : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BotSquad-Token': token }, body: JSON.stringify(data) });
    body = await response.json();
  } catch { throw new RequestError('Could not reach headquarters or read its response.'); }
  if (!response.ok) throw new RequestError(body.error ?? 'Request failed');
  return body;
}
async function mutate(path, body) { $('#error').hidden = true; try { const result = await request(path, body); await refresh(); return result; } catch (error) { showError(error); throw error; } }
const auxiliaryLoads = {devices: async signal => { deviceState = await request('devices', undefined, signal); }, direct: loadConversations, groups: groups.load, mandates: mandates.load, computers: computers.load};
function refresh() {
  if (loading) { refreshAgain = true; return loading; }
  // A single owner loads snapshots in order. Events/navigation request one more pass.
  loading = refreshLoop().finally(() => { loading = null; });
  return loading;
}
async function refreshLoop() {
  do {
    refreshAgain = false;
    const version = connectionVersion;
    refreshController = new AbortController();
    const {signal} = refreshController;
    try {
      if (sessionNeeded) {
        const session = await request('session', undefined, signal);
        if (version !== connectionVersion) continue;
        token = session.csrfToken; sessionNeeded = false;
        if (!defaultDraftLoaded) { draft = session.defaultObjective; defaultDraftLoaded = true; }
      }
      const snapshot = await request('state', undefined, signal);
      if (version !== connectionVersion) continue;
      state = snapshot; loadError = null;
      phase = connection === 'reconnecting' ? 'degraded' : 'ready';
    } catch (error) {
      if (!(error instanceof RequestError)) throw error;
      if (version !== connectionVersion) continue;
      phase = 'degraded'; loadError = `${state ? 'Could not refresh' : 'Could not load'} headquarters. ${error.message} Retry or wait for reconnection.`;
      render(); continue;
    }
    render();
    // Refresh attention on every company refresh so the navigation badge is useful
    // before opening the section. It shares the connection generation and abort signal.
    attentionPending = true;
    const attentionRead = request('attention', undefined, signal).then(result => {
      if(version !== connectionVersion) return;
      attentionState = result; attentionVersion = version; auxiliaryLoaded.add('attention'); auxiliaryErrors.delete('attention');
    }).catch(error => {
      if(!(error instanceof RequestError)) throw error;
      if(version === connectionVersion) auxiliaryErrors.set('attention', 'Could not load owner attention. Retry to refresh this section.');
    }).finally(() => { if(version === connectionVersion) { attentionPending = false; render(); } });
    const tab = activeTab;
    if (auxiliaryLoads[tab]) {
      try {
        await auxiliaryLoads[tab](signal);
        if (version !== connectionVersion) continue;
        auxiliaryLoaded.add(tab); auxiliaryErrors.delete(tab);
      } catch (error) {
        if (!(error instanceof RequestError)) throw error;
        if (version !== connectionVersion) continue;
        auxiliaryErrors.set(tab, `Could not load ${titles[tab][0]}. ${error.message} Retry to refresh this section.`);
      }
      render(); // Always render the current destination, never the captured tab.
    }
    await attentionRead;
  } while (refreshAgain);
}
function render() {
  const focused = rememberFocus();
  renderNavigation();
  renderReadiness();
  if (!state) {
    updateView(loadingView(loadError ? 'Company state unavailable' : activeTab === 'attention' ? 'Loading owner attention…' : 'Loading company state…'));
    syncControls();
    restoreFocus(focused);
    return;
  }
  groups.capture();
  const chatComposer = $('#chat-body'); if (chatComposer && renderedChatConversation) chatDrafts.set(renderedChatConversation,chatComposer.value);
  chatDraft=chatDrafts.get(selectedConversation)??'';
  const chatSelection = chatComposer && document.activeElement === chatComposer ? [chatComposer.selectionStart,chatComposer.selectionEnd] : null;
  const composer = $('#objective'); if (composer) draft = composer.value;
  const selection = composer && document.activeElement === composer ? [composer.selectionStart, composer.selectionEnd] : null;
  const messages = $('.messages'); const wasAtBottom = !messages || messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80; const scroll = messages?.scrollTop;
  const atlas = state.workers.find(w => w.role === 'ceo');
  $('#initialize').hidden = !!atlas;
  $('#pause').textContent = state.paused ? 'Resume queued work' : 'Pause new work';
  $('#global-controls').hidden = activeTab !== 'settings';
  $('#pause-banner').hidden = !state.paused;
  $('#approval-count').textContent = state.infrastructure.approvals.filter(a => a.status === 'pending').length + (state.project_approvals ?? []).filter(a => a.status === 'pending').length;
  $('#worker-count').textContent = state.workers.length;
  $('#task-count').textContent = state.tasks.filter(t => !['completed','cancelled','failed'].includes(t.status)).length;
  $('#task-count').title = 'Unfinished tasks, including related assignments';
  $('#workers').innerHTML = state.workers.length ? state.workers.map(w => `<button class="worker-button" data-worker="${escape(w.worker_id)}">${workerAvatar(w)}<span>${escape(w.display_name)}<small>${escape(w.title)}</small></span><span class="worker-state">${escape(employeeState(w))}</span></button>`).join('') : '<p class="muted">Start a task to meet Atlas, your team coordinator.</p>';
  const active = state.executions.filter(e => e.status === 'running').length;
  $('#metrics').hidden = activeTab !== 'home';
  $('#metrics').innerHTML = [['Running now', active, 'work sessions'], ['Active or waiting tasks', state.tasks.filter(t => !['completed','cancelled','failed'].includes(t.status)).length, 'including related work'], ['Completed tasks', state.tasks.filter(t => t.status === 'completed').length, 'recorded outcomes'], ['Needs you', attentionFresh() ? attentionState.total : '—', attentionFresh() ? 'owner actions' : 'not yet verified']].map(([label, value, note]) => `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><small>${note}</small></div>`).join('');
  // Working Groups already distinguishes its unloaded roster and disables creation.
  const waiting = activeTab !== 'groups' && auxiliaryLoads[activeTab] && !auxiliaryLoaded.has(activeTab);
  updateView(waiting ? loadingView(auxiliaryErrors.has(activeTab) ? `${titles[activeTab][0]} unavailable` : `Loading ${titles[activeTab][0]}…`) : ({ home:renderHome, activity:renderActivity, settings:renderSettings, attention:renderAttention, computers:computers.render, mandates:mandates.render, groups:groups.render, direct:renderDirect, devices: renderDevices, conversation: renderConversation, organization: renderOrganization, products: renderProducts, tasks: renderTasks, executions: renderExecutions, audit: renderAudit, approvals: renderApprovals, infrastructure: renderInfrastructure })[activeTab]());
  $('#context-panel').hidden = true;
  if ($('#objective')) { $('#objective').value = draft; if (selection) { $('#objective').focus(); $('#objective').setSelectionRange(...selection); } }
  document.querySelectorAll('#compose button').forEach(button => { button.disabled = submitting; });
  if ($('.messages')) $('.messages').scrollTop = wasAtBottom ? $('.messages').scrollHeight : scroll ?? 0;
  renderedChatConversation = activeTab==='direct' ? conversationDetail?.conversation.conversation_id ?? null : null;
  if ($('#chat-body')) { $('#chat-body').value = chatDrafts.get(renderedChatConversation)??''; if(chatSelection){$('#chat-body').focus();$('#chat-body').setSelectionRange(...chatSelection);} }
  if(activeTab==='attention') $('#context-panel').innerHTML='<div class="panel task-card"><h3>Only what needs you</h3><p>Active work may still be running. This view shows conditions requiring owner intervention.</p><p>Items disappear when their source workflow is resolved. Review details and take action in the existing control surface.</p></div>';
  wireView();
  focusAttentionSource();
  syncControls();
  restoreFocus(focused);
  if(inspectedTaskId&&$('#inspect').open&&taskFingerprint(inspectedTaskId)!==inspectedTaskFingerprint)inspectTask(inspectedTaskId,true);
  if(inspectedWorkerId&&$('#inspect').open&&workerFingerprint(inspectedWorkerId)!==inspectedWorkerFingerprint)inspectWorker(inspectedWorkerId,true);
}
function renderConversation() {
  return `<div class="panel"><div class="panel-title"># executive <span>${state.messages.length} messages · durable history</span></div><div class="messages">${state.messages.length ? state.messages.map(m => {
    const p = principal(m.sender_principal_id); const name = p?.display_name ?? 'Unknown';
    return `<article class="message">${principalAvatar(m.sender_principal_id)}<div class="message-main"><div class="message-meta"><strong>${escape(name)}</strong><span class="message-role">${escape(p?.type ?? '')}</span>${messageTime(m.created_at)}</div><div class="message-body">${linkedText(m.body)}</div>${m.related_task_id ? `<button class="task-link" data-task="${escape(m.related_task_id)}">↗ Task ${short(m.related_task_id)}</button>` : ''}</div></article>`;
  }).join('') : '<div class="empty"><strong>A direction is all it takes.</strong>Initialize Atlas, then assign your first company objective.</div>'}</div><form class="composer" id="compose"><label for="objective">TO ATLAS · CEO</label><div class="objective-presets"><button type="button" class="task-link" id="preset-product">Build SquadStatus</button><button type="button" class="task-link" id="preset-research">Research coordination risks</button></div><textarea id="objective" maxlength="8000" required placeholder="What should the company work on?"></textarea><div class="composer-footer"><small>Assigning an objective starts real Codex work.</small><div class="composer-actions"><button type="button" id="send-message" class="button secondary">Send message only</button><button class="button primary" type="submit">Assign objective ↗</button></div></div></form></div>`;
}
function artifactLinks(taskId) { return artifacts(taskId).map(a => `<button class="artifact-link" data-artifact="${escape(a.artifact_id)}">▧ ${escape(a.description)}</button>`).join(''); }
function renderExecutions() {
  const running = state.executions.filter(e => e.status === 'running');
  return `${running.length ? `<div class="concurrency-banner">${running.length} running together · ${running.map(e => escape(worker(e.worker_id)?.display_name)).join(' + ')}</div>` : ''}<div class="panel"><div class="panel-title">Work session history <span>${state.executions.length} attempts</span></div><div class="table-wrap"><table><thead><tr><th>EXECUTION / ORIGIN</th><th>WORKER</th><th>RUNTIME STATE / AI PROFILE</th><th>START / END</th><th>ACTION</th></tr></thead><tbody>${[...state.executions].reverse().map(e => `<tr><td>${short(e.execution_id)}<small>${e.origin === 'task' ? `<button class="task-link" data-task="${escape(e.task_id)}">Open task</button>` : escape(sessionDescription(e))}</small></td><td>${workerIdentity(worker(e.worker_id))}</td><td>${status(e.status)}<small>${escape(e.model ?? e.provenance_status ?? 'legacy / unknown')} · ${escape(e.reasoning_effort ?? 'unknown')}<br>${escape(e.execution_priority ?? 'unknown')} · ${escape(e.runtime_version ?? 'unknown')}</small>${e.error || e.interruption_reason ? `<small>${escape(e.error ?? e.interruption_reason)}</small>` : ''}</td><td>${messageTime(e.started_at)}<small>${e.finished_at?messageTime(e.finished_at):'Not finished'}</small></td><td><button class="button secondary small" data-execution="${escape(e.execution_id)}">Original details</button><button class="button secondary small" data-usage="${escape(e.execution_id)}">Usage & cost</button>${e.status === 'running' && state.supportsInterrupt ? `<button class="button danger small" data-interrupt="${escape(e.execution_id)}">Interrupt</button>` : '—'}</td></tr>`).join('')}</tbody></table></div>${!state.executions.length ? '<div class="empty">No runtime executions. Idle workers consume no model calls.</div>' : ''}</div>`;
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
      return `<article class="allocation-card"><header><strong>${workerIdentity(worker(a.worker_id))} · round ${escape(a.revision_round)}</strong>${status(a.status)}</header><p><code>${escape(JSON.parse(a.write_scope).join(', '))}</code></p><p><code>${escape(a.branch_name)}</code></p><small>${escape(managedPath(a.worktree_path))}</small><dl><dt>Base</dt><dd><code>${escape(a.base_commit)}</code></dd><dt>Submitted</dt><dd><code>${escape(submitted?.commit_sha ?? 'Awaiting submission')}</code></dd></dl><div class="card-actions"><button class="task-link" data-task="${escape(a.task_id)}">Inspect task</button><button class="task-link" data-evidence="allocations" data-record="${escape(a.allocation_id)}">Ownership</button>${history.map(s => `<button class="task-link" data-evidence="submissions" data-record="${escape(s.submission_id)}">Submission ${escape(s.revision_round)} · ${short(s.commit_sha)}</button>`).join('')}${a.status === 'integrated' ? `<button class="task-link" data-release="${escape(a.allocation_id)}">Release clone access</button>` : ''}</div></article>`;
    }).join('')}</div><h3>Independent review</h3>${reviews.map(r => `<div class="evidence-row"><strong>${workerIdentity(worker(r.worker_id))} · round ${escape(state.review_rounds.find(x=>x.round_id===r.round_id)?.round_number ?? 'legacy')}</strong>${status(r.status)}${r.round_id ? `<button class="task-link" data-evidence="review_rounds" data-record="${escape(r.round_id)}">Exact packet</button>` : ''}<button class="artifact-link" data-artifact="${escape(r.artifact_id)}">▧ Findings & reviewed commits</button></div>`).join('') || '<p class="muted">Waiting for verified engineering submissions.</p>'}
    <h3>Integration</h3>${integrations.map(i => `<div class="integration-card"><div class="evidence-row">${status(i.status)}<span>${i.status === 'completed' ? 'Full acceptance tests passed' : 'Inspect test and Git evidence'}</span></div><dl><dt>Base</dt><dd><code>${escape(i.base_commit)}</code></dd><dt>Source commits</dt><dd><code>${escape(JSON.parse(i.source_commits).join('\n'))}</code></dd><dt>Candidate</dt><dd><code>${escape(i.candidate_commit ?? '—')}</code></dd><dt>Final</dt><dd><code>${escape(i.final_commit ?? 'Default branch not advanced')}</code></dd></dl><button class="button secondary small" data-evidence="integrations" data-record="${escape(i.integration_id)}">Inspect acceptance evidence</button></div>`).join('') || '<p class="muted">Requires independent approval, followed by passing full product tests.</p>'}</div></div>`;
  }).join('');
}
function renderApprovals() {
  return projectApprovals() + (state.infrastructure.approvals.length ? [...state.infrastructure.approvals].reverse().map(a => {
    const op = state.infrastructure.operations.find(op => op.operation_id === a.operation_id);
    const execution = state.executions.find(e => e.execution_id === op.requesting_execution_id);
    const canDecide = a.status === 'pending';
    return `<article class="panel task-card" data-attention-source="${escape(a.approval_id)}"><header><strong>${escape(op.operation_type.replaceAll('_', ' '))}</strong>${status(a.status)}</header><h3>${workerIdentity(worker(op.target_worker_id))}</h3>${details({ requester: worker(op.requester_worker_id)?.display_name ?? 'Human — initial Nix bootstrap', task: op.task_id, execution: op.requesting_execution_id, reason: op.reason, requested: a.requested_at, expires: a.expires_at, identity_now: state.infrastructure.identities.find(i => i.worker_id === op.target_worker_id), operation_status: op.status, result: op.result ? JSON.parse(op.result) : null, error: op.error })}<details data-disclosure="${escape(a.approval_id)}"><summary>Exact parameters and preconditions</summary><pre>${escape(JSON.stringify({ operation_id: op.operation_id, approval_id: a.approval_id, parameters: JSON.parse(op.parameters), parameter_hash: op.parameter_hash, preconditions: JSON.parse(op.preconditions) }, null, 2))}</pre></details>${canDecide ? `<div class="card-actions"><button class="button primary" data-approval="${escape(a.approval_id)}" data-operation="${escape(op.operation_id)}" data-decision="approve" ${execution && execution.status !== 'completed' ? 'disabled' : ''}>Approve</button><button class="button danger" data-approval="${escape(a.approval_id)}" data-operation="${escape(op.operation_id)}" data-decision="deny">Deny</button></div><p class="muted">Approval executes this exact operation once. Current preconditions are rechecked by the server.${execution && execution.status !== 'completed' ? ' Waiting for Nix to finish its request turn.' : ''}</p>` : ''}</article>`;
  }).join('') : '<div class="panel empty">No protected host operations awaiting review.</div>');
}
function renderInfrastructure() {
  const nix = state.workers.find(w => w.role === 'devops');
  return `<div class="panel task-card"><h3>${state.infrastructure.isolated ? 'Linux worker isolation' : 'Development backend — simulated identities'}</h3><p>Codex authentication remains central. Worker Unix accounts receive no credentials or privileged socket access.</p><div class="card-actions">${!nix ? '<button id="initialize-nix" class="button primary">Initialize Nix</button>' : ''}<button id="host-health" class="button secondary">Check provisioner health</button><button id="reconcile-host" class="button secondary">Reconcile interrupted operations</button></div><p id="host-health-result"></p></div>${state.infrastructure.identities.map(i => { const w = worker(i.worker_id); return `<article class="panel task-card"><header><strong>${workerIdentity(w)} — ${escape(w.title)}</strong>${status(i.state)}</header>${details({ worker_id: i.worker_id, unix_username: i.unix_username, uid: i.uid, gid: i.gid, home: i.home_path ? 'Private managed home' : null, backend: i.backend, project_access: state.infrastructure.projects.filter(p => p.worker_id === i.worker_id).map(p => ({ allocation_id: p.allocation_id, state: p.state })) })}<div class="card-actions">${nix && w.role !== 'devops' && i.state === 'unprovisioned' && w.enabled ? `<button class="button secondary" data-infra-worker="${escape(i.worker_id)}" data-infra-type="create_worker_identity">Ask Nix to provision</button>` : ''}${i.state === 'ready' && w.enabled && !['ceo','cto','devops'].includes(w.role) ? `<button class="button danger" data-infra-worker="${escape(i.worker_id)}" data-infra-type="disable_worker_identity">Ask Nix to retire worker</button>` : ''}</div></article>`; }).join('')}<div class="panel task-card"><h3>Infrastructure tasks</h3>${state.infrastructure.tasks.map(i => `<p><button class="task-link" data-task="${escape(i.task_id)}">${escape(i.operation_type)} · ${escape(worker(i.target_worker_id)?.display_name)}</button> ${status(state.tasks.find(t => t.task_id === i.task_id).status)}</p>`).join('') || '<p class="muted">No infrastructure tasks.</p>'}</div>`;
}
function renderAudit() {
  return `<div class="panel"><div class="panel-title">Append-only event history <span>${state.audit.length} events</span></div>${[...state.audit].reverse().map(e => `<div class="audit-row"><span class="audit-marker" aria-hidden="true">◇</span><div><strong>${escape(e.type.replaceAll('_', ' '))}</strong><p>${escape(principal(e.actor_principal_id)?.display_name)}${e.worker_id ? ` · ${escape(worker(e.worker_id)?.display_name)}` : ''}${e.task_id ? ` · task ${short(e.task_id)}` : ''}</p><p>${escape(e.detail)}</p></div><time title="${escape(e.created_at)}">${time(e.created_at)}</time></div>`).join('') || '<div class="empty">Company lifecycle events will appear here.</div>'}</div>`;
}
function details(object) { return `<dl class="inspect-grid">${Object.entries(object).map(([k, v]) => `<dt>${escape(k.replaceAll('_', ' '))}</dt><dd>${escape(v && typeof v === 'object' ? JSON.stringify(v, null, 2) : v ?? '—')}</dd>`).join('')}</dl>`; }
let inspectorInvoker = null;
function inspect(title, html, retainFocus=false) { inspectedWorkerId=null; inspectedTaskId=null; if (!$('#inspect').open) inspectorInvoker = rememberFocus(); researchView++; $('#inspect-error').hidden = true; $('#inspect-title').textContent = title; $('#inspect-content').innerHTML = `<fieldset class="load-controls" aria-label="Inspector details">${html}</fieldset>`; if (!$('#inspect').open) $('#inspect').showModal(); wireActions($('#inspect')); wireNavigation($('#inspect')); syncControls(); if(!retainFocus)$('#inspect-title').focus(); }
function inspectTask(id, updating=false) {
  const t = state.tasks.find(t => t.task_id === id); if (!t) return;
  const parent = state.tasks.find(p => p.task_id === t.parent_task_id);
  const retryEligible = ['blocked', 'failed', 'awaiting_approval'].includes(t.status) && t.blocking_reason !== 'waiting_children';
  const retryLimit = t.kind === 'computer' ? 'Inspect the Computer Session. Computer Tasks cannot use generic retry; an unstarted expired request can be cancelled.'
    : t.kind === 'infrastructure' ? 'Inspect Approvals for the human decision. Use Infrastructure to reconcile an interrupted host operation; runtime retry cannot grant authority.'
    : state.allocations?.some(a => a.task_id === id && a.status === 'blocked') ? 'This allocation requires Git inspection. Automatic reactivation is unavailable.'
    : !worker(t.assignee_worker_id)?.enabled ? 'This worker has retired. Assign a new objective for further work.'
    : parent && ((parent.dispatch_reason === 'child_results' && parent.blocking_reason !== 'waiting_children') || ['completed', 'failed', 'cancelled'].includes(parent.status)) ? 'This result has been handed back to the manager. Assign a new objective for further work.'
    : state.tasks.some(child => child.parent_task_id === id && !['completed', 'failed', 'cancelled'].includes(child.status)) ? 'Resolve the child assignment before retrying this task.' : '';
  const retryControls = !retryEligible ? '' : retryLimit ? `<p class="muted">${escape(retryLimit)}</p>` : `<label class="check-review"><input type="checkbox" id="reviewed"> I inspected prior attempts, artifacts and child tasks. Retry the existing assignment without granting new authority.</label><button class="button primary" id="retry" data-id="${escape(id)}" disabled>Retry inspected task</button>`;
  const attempts=state.executions.filter(e=>e.task_id===id), children=state.tasks.filter(c=>c.parent_task_id===id), events=state.audit.filter(e=>e.task_id===id&&milestone(e));
  const focused=updating?rememberFocus():null, scroll=$('#inspect').scrollTop;
  const opened=updating?new Set([...document.querySelectorAll('#inspect details[open]')].map(disclosureKey)):new Set();
  inspect('Task details', `<div class="task-detail-lead"><p class="request-label">What you asked for</p><h3>${escape(t.objective)}</h3><div class="card-actions"><button class="employee-link task-ownership" data-worker="${escape(t.assignee_worker_id)}">${workerIdentity(worker(t.assignee_worker_id),{size:'large'})}</button>${taskStatus(t)}</div><p>Requested by ${escape(principal(t.requester)?.display_name||'Recorded requester')} · ${messageTime(t.created_at)}</p></div><section class="next-step"><h3>${['failed','blocked','awaiting_approval'].includes(t.status)&&!['waiting_children','waiting_integration'].includes(t.blocking_reason)?'What needs checking':'What happens next'}</h3><p>${escape(taskNext(t))}</p>${t.blocking_reason?`<p><strong>Recorded reason:</strong> ${escape(t.blocking_reason)}</p>`:''}<button class="text-link" data-go="attention">Needs your attention</button>${t.blocking_reason==='waiting_integration'?'<button class="text-link" data-go="products">Open Projects</button>':''}</section><section class="task-results"><h3>Results and files</h3>${t.result_summary?`<h4>${t.status==='completed'?'Recorded outcome':'Latest work update · task not completed'}</h4><p class="message-body">${linkedText(t.result_summary)}</p>`:'<p>No outcome recorded yet.</p>'}${artifactLinks(id)||'<p class="muted">No saved file for this task. Related assignments may have their own results below.</p>'}</section><section><h3>Recorded progress</h3><p class="muted">Actual milestones only. No estimated percentage or invented stages.</p>${timeline(events.slice(-30))}${!events.length?'<p>No milestones recorded yet.</p>':''}${events.length>30?'<p>Showing the latest 30 milestones. All original events remain in Advanced audit.</p>':''}</section><section><h3>Related assignments</h3>${parent?`<p><button class="text-link" data-task="${escape(parent.task_id)}">Parent task: ${escape(parent.objective)}</button></p>`:''}${children.map(c=>taskCard(c,{compact:true})).join('')||(!parent?'<p>No related assignments yet.</p>':'')}</section><details data-disclosure="task-technical"><summary>Advanced details · original records and work sessions</summary><h3>Task record</h3>${details(t)}<h3>Execution attempts</h3>${attempts.map(e=>`<button class="text-link" data-execution="${escape(e.execution_id)}">${escape(e.status)} · ${escape(e.execution_id)}</button><pre>${escape(JSON.stringify(e,null,2))}</pre>`).join('')||'<p>No work session recorded.</p>'}<h3>Acceptance and permissions</h3><p>${escape(t.acceptance_criteria)}</p><p>${escape(t.constraints)}</p></details><section class="task-recovery">${retryControls}${['queued','blocked','failed','awaiting_approval'].includes(t.status)?`<button class="button danger" data-cancel="${escape(id)}">Cancel task</button>`:''}</section>`,updating);
  inspectedTaskId=id;inspectedTaskFingerprint=taskFingerprint(id);
  if(updating){for(const d of document.querySelectorAll('#inspect details'))d.open=opened.has(disclosureKey(d));$('#inspect').scrollTop=scroll;restoreFocus(focused);}
  if ($('#reviewed')) $('#reviewed').onchange = () => { $('#retry').disabled = !$('#reviewed').checked; };
  if ($('#retry')) $('#retry').onclick = async () => { try { await mutate('retry', { task_id: id, inspected: $('#reviewed').checked }); $('#inspect').close(); } catch {} };
}
async function inspectWorkerSettings(id) {
  const w = worker(id);
  const portraitHeader = `<p class="worker-profile">${workerIdentity(w, {size:'large'})}</p>`;
  const binding = state.bindings.find(r => r.worker_id === id);
  const last = [...state.executions].reverse().find(e => e.worker_id === id && e.provenance_status === 'recorded');
  inspect(`${w.display_name} — ${w.title}`, portraitHeader + '<p>Loading runtime model choices…</p>');
  const version = researchView;
  let catalog;
  try { catalog = await request('runtime'); } catch (error) { if(version!==researchView||!$('#inspect').open)return; inspect(`${w.display_name} — ${w.title}`, portraitHeader + `<button class="button secondary" data-worker-usage="${escape(id)}">AI usage and cost</button><p role="alert">Runtime discovery failed. Complete Codex sign-in on the headquarters host, then reopen these settings.</p>${details({ unix_identity:state.infrastructure.identities.find(i => i.worker_id === id), state:w.status, role:w.role, model:w.ai_model ?? "inherit", reasoning:w.reasoning_effort ?? "inherit", priority:w.execution_priority, human_lock:!!w.ai_profile_locked, last_effective_model:last?.model ?? "Not run", last_effective_reasoning:last?.reasoning_effort ?? "Not run", thread_name:binding?.thread_name ?? "Not started" })}`); showError(error); return; }
  if (version !== researchView || !$('#inspect').open) return;
  const option = (value, label, selected) => `<option value="${escape(value)}"${selected ? ' selected' : ''}>${escape(label)}</option>`;
  const models = [option('', `Inherit (${catalog.defaultModel})`, w.ai_model === null), ...catalog.models.map(m => option(m.model, m.displayName, m.model === w.ai_model))];
  if (w.ai_model && !catalog.models.some(m => m.model === w.ai_model)) models.push(option(w.ai_model, `${w.ai_model} — unavailable`, true));
  inspect(`${w.display_name} — ${w.title}`, portraitHeader + `<button class="button primary" data-chat-worker="${escape(id)}">Open conversations</button><button class="button secondary" data-research-worker="${escape(id)}">Permissions & research</button><form id="ai-profile" class="profile-form"><label>Model<select id="ai-model">${models.join('')}</select></label><label>Reasoning effort<select id="ai-reasoning"></select></label><label>Execution priority<select id="ai-priority">${['low','normal','high','critical'].map(p => option(p, p, p === w.execution_priority)).join('')}</select></label><label class="check-review"><input id="ai-lock" type="checkbox" ${w.ai_profile_locked ? 'checked' : ''}> Human lock</label><p class="muted">Changes apply to future executions. The human can always edit a locked profile. Manager profile changes are not enabled in this milestone.</p><button class="button primary" type="submit">Save AI profile</button><p id="profile-error" role="alert"></p></form><button class="button secondary" data-worker-usage="${escape(id)}">AI usage and cost</button><h3>Current worker</h3>${details({ unix_identity:state.infrastructure.identities.find(i => i.worker_id === id), state:w.status, role:w.role, model:w.ai_model ?? 'inherit', reasoning:w.reasoning_effort ?? 'inherit', priority:w.execution_priority, human_lock:!!w.ai_profile_locked, last_effective_model:last?.model ?? 'Not run', last_effective_reasoning:last?.reasoning_effort ?? 'Not run', runtime:last?.runtime_version ?? catalog.version, thread_name:binding?.thread_name ?? 'Not named', runtime_binding:binding?.runtime_reference ?? 'Not started' })}`);
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
function taskFingerprint(id) { return JSON.stringify([state.tasks.find(t=>t.task_id===id),state.executions.filter(e=>e.task_id===id),artifacts(id),state.tasks.filter(t=>t.parent_task_id===id),state.audit.filter(e=>e.task_id===id).length,state.paused]); }
function wireActions(root) {
  root.querySelectorAll('[data-ai-settings]').forEach(b=>b.onclick=()=>void inspectWorkerSettings(b.dataset.aiSettings));
  root.querySelectorAll('[data-execution]').forEach(b=>b.onclick=()=>inspectExecution(b.dataset.execution));
  root.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>inspectEvent(b.dataset.event));
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
    const artifact=state.artifacts.find(a=>a.artifact_id===b.dataset.artifact);if(!artifact)return;
    inspect('Loading result','<p role="status">Loading the saved result…</p>');const version=researchView;
    try {
      const response = await fetch(`/api/artifacts/${encodeURIComponent(b.dataset.artifact)}`);
      if (!response.ok) throw new Error((await response.json()).error ?? 'Could not read artifact');
      const content = await response.text();if(version!==researchView||!$('#inspect').open)return;
      inspect(artifact.description, `<h3>Saved result</h3><pre class="result-content">${linkedText(content)}</pre><details><summary>Advanced file details</summary>${details(artifact)}</details>`);
    } catch (error) { if(version===researchView&&$('#inspect').open)showError(error); }
  });
  root.querySelectorAll('[data-worker]').forEach(b => b.onclick = () => void inspectWorker(b.dataset.worker));
  root.querySelectorAll('[data-task]').forEach(b => b.onclick = () => inspectTask(b.dataset.task));
  root.querySelectorAll('[data-usage],[data-worker-usage]').forEach(b=>b.onclick=async()=>{inspect('Loading usage','<p role="status">Loading recorded AI usage…</p>');const version=researchView;try{const data=await getUsage(b.dataset.usage?{executionId:b.dataset.usage}:{workerId:b.dataset.workerUsage});if(version!==researchView||!$('#inspect').open)return;inspect('AI usage and cost',usageHTML(data));}catch(e){if(version===researchView&&$('#inspect').open)showError(e);}});
  root.querySelectorAll('[data-interrupt]').forEach(b => b.onclick = async () => { b.disabled = true; try { await mutate('interrupt', { execution_id: b.dataset.interrupt }); } catch { b.disabled = false; } });
  root.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => { try { await mutate('cancel', { task_id: b.dataset.cancel }); $('#inspect').close(); } catch {} });
}
function wireView() {
  wireNavigation(document);
  wireTaskFilters();
  document.querySelectorAll('[data-attention]').forEach(b => b.onclick = () => { const item=attentionState?.items.find(i=>i.attention_id===b.dataset.attention); if(item) void openAttentionSource(item); });
  if($('#refresh-attention')) $('#refresh-attention').onclick=()=>void refresh();
  wireActions(document);
  wireDevices();
  wireConversations();
  groups.wire();
  mandates.wire();
  computers.wire();
  if ($('#initialize-nix')) $('#initialize-nix').onclick = async () => { try { await mutate('initialize-nix', {}); selectTab('approvals'); render(); } catch {} };
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
wireNavigation(document);
window.addEventListener('hashchange', readLocation);
window.addEventListener('popstate', readLocation);
$('#help').onclick = showHelp;
$('#new-task').onclick = openNewTask;
$('#close-inspect').onclick = () => $('#inspect').close();
$('#inspect').addEventListener('close', () => { researchView++; inspectedTaskId=null; restoreFocus(inspectorInvoker, true); });
$('#initialize').onclick = async () => { try { await mutate('initialize', {}); } catch {} };
$('#pause').onclick = async () => { if (!canMutate()) return; try { await mutate('pause', { paused: !state.paused }); } catch {} };
$('#retry-load').onclick = () => { sessionNeeded = true; void refresh(); };
// Install recovery even when the first session/state request fails. Reconnect renews
// the session before trusting a new snapshot; late pre-disconnect responses cannot win.
const events = new EventSource('/api/events');
events.addEventListener('ready', () => {
  connection = 'connected'; connectionVersion++; sessionNeeded = true;
  refreshController?.abort();
  if (state) phase = 'degraded';
  render(); void refresh();
});
events.addEventListener('changed', () => void refresh());
events.onerror = () => {
  connection = 'reconnecting'; connectionVersion++; sessionNeeded = true; phase = 'degraded';
  refreshController?.abort();
  render();
};
activeTab = locationTab();
render();
void refresh();

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
    return `<article class="panel task-card" data-attention-source="${escape(a.approval_id)}"><header><strong>Publish integrated repository commit</strong>${status(a.status)}</header><p>Trusted service operation · no root access</p>${details({repository:e.identity,branch:e.target_branch,expected_remote_sha:e.expected_old_sha,new_integrated_sha:e.new_sha,project:e.project_id,integration:e.integration_id,review:integration?.review_id,reason:op.reason,expires:a.expires_at,status:op.status,error:op.error,result:op.result?JSON.parse(op.result):null})}<details data-disclosure="${escape(a.approval_id)}"><summary>Exact approval envelope</summary><pre>${escape(JSON.stringify(e,null,2))}</pre></details><div class="card-actions">${a.status==='pending'?`<button class="button primary" data-project-approval="${escape(a.approval_id)}" data-approved="true">Approve exact publication</button><button class="button danger" data-project-approval="${escape(a.approval_id)}" data-approved="false">Deny</button>`:''}${op.status==='running'?`<button class="button secondary" data-publication-retry="${escape(op.operation_id)}">Reconcile & retry this operation</button>`:''}</div></article>`;
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


function renderAttention() {
  if(!attentionState) return loadingView(auxiliaryErrors.has('attention') ? 'Owner attention unavailable' : 'Loading owner attention…');
  const labels={uncertain:'Uncertain outcomes',approval:'Approvals',blocked:'Blocked work',failed:'Failed work',identity:'Device identities'};
  const stale=phase!=='ready'||attentionVersion!==connectionVersion||auxiliaryErrors.has('attention');
  return `<section class="panel task-card"><header><h2>${attentionState.total ? `${attentionState.total} ${attentionState.total===1?'thing needs':'things need'} your attention` : 'Nothing needs your attention right now.'}</h2><button id="refresh-attention" class="button secondary small" ${attentionPending?'disabled':''}>Refresh</button></header><p class="muted">${stale?'Showing last loaded attention. The current count is unverified.':attentionPending?'Refreshing owner attention…':'Active work may still be running. This view only shows conditions requiring owner intervention.'}</p><small>Last checked ${escape(new Date(attentionState.as_of).toLocaleString())}</small><div class="attention-categories">${Object.entries(labels).filter(([key])=>attentionState.counts[key]).map(([key,label])=>`<span>${attentionState.counts[key]} ${label}</span>`).join('')}</div>${attentionState.truncated?`<p>Showing the first ${attentionState.limit} of ${attentionState.total}. Resolve items through their existing controls to reveal later items.</p>`:''}</section>` + attentionState.items.map(item=>`<article class="panel task-card attention-item" data-attention-id="${escape(item.attention_id)}"><header><h3>${escape(item.title)}</h3><span class="status">${escape(labels[item.category])}</span></header><p>${escape(item.summary)}</p><small>${escape(item.source_type.replaceAll('_',' '))} · ${escape(short(item.source_id))} · since ${escape(new Date(item.created_at).toLocaleString())}</small><div class="card-actions"><button class="button secondary" data-attention="${escape(item.attention_id)}">${escape(item.owner_action)}</button></div></article>`).join('');
}
async function openAttentionSource(item) {
  attentionFocus=item;
  if(item.destination==='investment-run'){window.location.assign('/investment-run');return;}
  selectTab(item.destination==='research'?'organization':item.destination);
  if(item.destination==='tasks') { attentionFocus=null; render(); inspectTask(item.destination_record_id); return; }
  if(item.destination==='executions') { attentionFocus=null; render(); const e=state.executions.find(e=>e.execution_id===item.detail_record_id); if(e)inspect('Execution evidence',details(e)); return; }
  if(item.destination==='research') { attentionFocus=null; render(); try { await inspectResearchOperation(item.destination_record_id); } catch(e) {showError(e);} return; }
  if(item.destination==='direct') {conversationWorker=''; selectedConversation=item.destination_record_id;conversationDetail=null;}
  if(item.destination==='products') selectedProject=item.destination_record_id;
  if(item.destination==='computers') { await computers.select(item.destination_record_id); return; }
  if(item.destination==='mandates') { await mandates.select(item.destination_record_id); return; }
  if(item.destination==='groups') { await groups.select(item.destination_record_id); return; }
  render(); if(auxiliaryLoads[activeTab]) await refresh();
}
function focusAttentionSource() {
  const item=attentionFocus;if(!item||activeTab!==item.destination)return;
  if(item.source_type==='external_action') { if(mandates.inspectAction(item.destination_record_id,item.detail_record_id)) attentionFocus=null; return; }
  let element;
  if(item.destination==='approvals') element=document.querySelector(`[data-attention-source="${CSS.escape(item.destination_record_id)}"]`);
  if(item.destination==='devices') element=document.querySelector(`[data-device="${CSS.escape(item.destination_record_id)}"]`);
  if(item.destination==='computers') element=document.querySelector(`[data-computer-detail="${CSS.escape(item.destination_record_id)}"]`);
  if(item.destination==='mandates') element=document.querySelector(`[data-mandate-detail="${CSS.escape(item.destination_record_id)}"]`);
  if(item.destination==='infrastructure') {
    attentionFocus=null;const op=state.infrastructure.operations.find(o=>o.operation_id===item.source_id);
    if(op)inspect('Infrastructure operation',details(op));return;
  }
  if(element) { attentionFocus=null;element.tabIndex=-1;element.focus({preventScroll:true});element.scrollIntoView({block:'center'}); }
}
