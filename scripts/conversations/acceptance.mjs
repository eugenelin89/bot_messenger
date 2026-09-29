// Actual Chrome UI + real Ubuntu provider validation. Never manufactures model replies.
// The operator supplies a copied fixture manifest and an SSH tunnel to validation 4311.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const base=process.env.BOT_CONVERSATIONS_URL;
assert.equal(base,'http://127.0.0.1:4311','Use the explicit private validation tunnel');
const dir=resolve(process.env.BOT_CONVERSATIONS_EVIDENCE??'.validation/prompt07-real');
mkdirSync(dir,{recursive:true});
const fixture=JSON.parse(readFileSync(join(dir,'fixture.json'),'utf8'));
assert.equal(fixture.roster_fixture,true);
const phase=process.argv[2]??'direct';
const recordPath=join(dir,'browser-evidence.json');
const record=existsSync(recordPath)?JSON.parse(readFileSync(recordPath,'utf8')):{started:new Date().toISOString(),phases:{},ids:{}};
assert.ok(!record.phases[phase],`Phase ${phase} already completed; inspect retained evidence`);
const save=()=>writeFileSync(recordPath,JSON.stringify(record,null,2));
const raw=async path=>{const r=await fetch(`${base}/api/${path}`);assert.ok(r.ok,`${path}: ${r.status}`);return r.json();};
async function verifyTarget(){
  const s=await raw('state');assert.equal(s.workers.find(w=>w.worker_id===fixture.maya)?.display_name,'Maya');
  assert.ok(s.workers.every(w=>w.workspace_path.startsWith('/var/lib/botsquad/validation/conversations-20260929-prompt07/workspaces/')),'Wrong validation data root');
  const hq=await raw('devices');if(record.hq_id)assert.equal(hq.hq_id,record.hq_id);else {assert.ok(hq.hq_id);record.hq_id=hq.hq_id;save();}return s;
}
await verifyTarget();
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function observe(get,predicate,label,timeout=240000){
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){const value=await get();if(predicate(value))return value;await sleep(500);}
  throw new Error(`Timed out: ${label}`);
}
async function ready(){await verifyTarget();await page.goto(base);await page.getByText('Connected to headquarters',{exact:true}).waitFor();}
async function workerView(id){await verifyTarget();await page.locator(`[data-worker="${id}"]`).first().click();await page.getByRole('button',{name:'Open conversations',exact:true}).click();await page.waitForFunction(id=>document.querySelector('#conversation-worker')?.value===id,id);}
async function open(id,key){await workerView(id);const pending=page.waitForResponse(r=>r.url()===`${base}/api/conversations/open`&&r.request().method()==='POST');await page.locator('#new-conversation').click();const response=await pending;assert.ok(response.ok());const created=await response.json();record.ids[key]=created.conversation_id;save();await page.locator(`#chat-compose[data-conversation-id="${created.conversation_id}"]`).waitFor();return record.ids[key];}
async function select(id,workerId){await workerView(workerId);await page.locator(`[data-conversation="${id}"]`).click();await page.locator(`#chat-compose[data-conversation-id="${id}"]`).waitFor();}
async function send(c,body,reply=true){
  await verifyTarget();await page.locator(`#chat-compose[data-conversation-id="${c}"]`).waitFor();await page.locator('#chat-body').fill(body);
  const response=page.waitForResponse(r=>r.url()===`${base}/api/conversations/send`&&r.request().method()==='POST');
  await page.getByRole('button',{name:reply?'Send & request reply':'Send passive message',exact:true}).click();
  const r=await response;assert.ok(r.ok(),await r.text());const result=await r.json();assert.equal(result.message.conversation_id,c);return result;
}
async function settled(c,rid){
  const d=await observe(()=>raw(`conversations/${c}`),d=>{const r=d.requests.find(r=>r.request_id===rid);return r&&r.status!=='queued'&&r.status!=='replying'&&!d.executions.some(e=>e.request_id===rid&&e.status==='running');},'reply settlement');
  writeFileSync(join(dir,`${rid}.json`),JSON.stringify(d,null,2));
  assert.equal(d.requests.find(r=>r.request_id===rid).status,'completed',JSON.stringify(d.requests));
  assert.ok(d.history.items.find(m=>m.response_to===rid)?.body.length>80,'Expected substantive real reply');return d;
}
async function screenshot(name){await sleep(500);await page.screenshot({path:join(dir,`${name}.png`),fullPage:true});}
try{
  await ready();
  if(phase==='direct'){
    const start=await verifyTarget();assert.equal(start.paused,true);assert.equal(start.tasks.length,3);
    const privateId=await open(fixture.ada,'private');
    await send(privateId,'Unrelated private test marker: PRIVATE_ADA_ONLY_P07. This passive conversation is unrelated to retention design. Do not dispatch a reply.',false);
    const c=await open(fixture.maya,'maya');
    await send(c,'Product constraints: raw diagnostic logs must be deleted after 48 hours; aggregated operational counts may persist. Unresolved question: should expired message identifiers remain as opaque tombstones for deduplication? We have not decided that yet.',false);
    const passive=await verifyTarget();assert.equal(passive.executions.length,start.executions.length);assert.equal(passive.tasks.length,start.tasks.length);
    const result=await send(c,'Discuss a sensible retention and idempotency policy for a small support team. Explain one tradeoff and preserve the unresolved question for a later decision. No implementation assignment.');
    record.ids.maya_first=result.request.request_id;save();await screenshot('01-passive-and-paused-reply');
    assert.equal((await raw(`conversations/${c}`)).requests[0].status,'queued');
    await page.locator('#pause').click();
    await observe(()=>raw('state'),s=>s.executions.some(e=>e.task_id===fixture.initial_task_id&&e.status==='running'),'initial task running',60000);
    const linus=await open(fixture.linus,'linus');
    const chat=await send(linus,'Explain the practical difference between idempotent response persistence and exactly-once model invocation. Discuss uncertainty without changing code or assigning anyone.');
    record.ids.linus_first=chat.request.request_id;save();
    const queued=await raw(`conversations/${linus}`);assert.equal(queued.requests.find(r=>r.request_id===chat.request.request_id).status,'queued','Busy worker chat must queue');
    await screenshot('02-busy-worker-queue');
    await settled(c,result.request.request_id);await settled(linus,chat.request.request_id);
    const after=await verifyTarget();assert.equal(after.tasks.length,3);assert.equal(after.tasks.find(t=>t.task_id===fixture.initial_task_id).status,'completed');
    record.legacy_binding=after.bindings.find(b=>b.worker_id===fixture.linus);assert.ok(record.legacy_binding);
    record.direct={passive_no_execution:true,paused_queued:true,busy_worker_queued:true,no_task_creation:true};
    await select(c,fixture.maya);await screenshot('03-maya-real-response');
  }else if(phase==='peer'){
    const c=record.ids.linus;assert.ok(c);await select(c,fixture.linus);
    const r=await send(c,'Ask Ada one bounded technical question about how to reconcile a lost acknowledgement after a reply was durably committed. Compare the tradeoff once her answer arrives. You may communicate with her, but cannot assign her a Task or change a repository.');
    record.ids.peer_parent=r.request.request_id;save();await settled(c,r.request.request_id);
    const list=await observe(()=>raw(`conversations?worker_id=${fixture.linus}`),l=>l.items.some(c=>c.participants.every(p=>p.principal_id!=='human')),'peer conversation');
    const peer=list.items.find(c=>c.participants.every(p=>p.principal_id!=='human'));record.ids.peer=peer.conversation_id;save();
    const d=await observe(()=>raw(`conversations/${peer.conversation_id}`),d=>d.requests.length===2&&d.requests.every(r=>r.status==='completed')&&!d.executions.some(e=>e.status==='running'),'peer answer and continuation');
    assert.ok(d.history.items.some(m=>m.sender_worker_id===fixture.ada&&m.response_to));assert.ok(d.history.items.some(m=>m.sender_worker_id===fixture.linus&&m.response_to));
    writeFileSync(join(dir,'peer-exchange.json'),JSON.stringify(d,null,2));assert.equal((await verifyTarget()).tasks.length,3);
    await workerView(fixture.linus);await page.locator(`[data-conversation="${peer.conversation_id}"]`).click();await screenshot('04-peer-exchange');
  }else if(phase==='rollover'){
    const c=record.ids.maya;assert.ok(c);await select(c,fixture.maya);
    const before=await raw(`conversations/${c}`);record.pre_rollover=before.sessions;save();
    await page.getByRole('button',{name:'Replace Maya’s context',exact:true}).click();
    await page.locator('#pause').click();assert.equal((await verifyTarget()).paused,true);
    const first=await send(c,'Continue our earlier policy discussion after context replacement. State the retention constraint and the unresolved question from our original conversation. Explain what remains uncertain.');
    const pending=await send(c,'Pending obligation: after the policy recap, propose two criteria the human should use to resolve the outstanding tombstone question. Do not decide it on the human’s behalf.');
    record.ids.rollover_reply=first.request.request_id;record.ids.pending_reply=pending.request.request_id;save();
    await page.locator('#pause').click();await settled(c,first.request.request_id);const after=await settled(c,pending.request.request_id);
    assert.ok(after.sessions.some(s=>s.generation===2&&s.state==='active'));assert.ok(after.sessions.some(s=>s.generation===1&&s.state==='superseded'));
    const recap=after.history.items.find(m=>m.response_to===first.request.request_id).body;
    assert.match(recap,/48/);assert.match(recap,/tombstone|identifier/i);assert.ok(!JSON.stringify(after).includes('PRIVATE_ADA_ONLY_P07'));
    await screenshot('05-context-replaced-continuation');
  }else if(phase==='controls'){
    const c=record.ids.maya;await select(c,fixture.maya);
    await page.locator('#pause').click();assert.equal((await verifyTarget()).paused,true);
    const cancelled=await send(c,'This queued validation request will be cancelled before dispatch.');record.ids.cancelled=cancelled.request.request_id;save();
    await page.locator(`[data-cancel-reply="${cancelled.request.request_id}"]`).click();
    await observe(()=>raw(`conversations/${c}`),d=>d.requests.find(r=>r.request_id===cancelled.request.request_id)?.status==='cancelled','cancel');
    await page.getByRole('button',{name:'Mute reply dispatch',exact:true}).click();await page.getByRole('button',{name:'Resume conversation',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Send & request reply',exact:true}).isDisabled(),true);
    await page.getByRole('button',{name:'Resume conversation',exact:true}).click();await page.getByRole('button',{name:'Mute reply dispatch',exact:true}).waitFor();
    const r=await send(c,'Reason carefully about six distinct failure windows for context replacement, with concrete evidence requirements and recovery tradeoffs. The operator may interrupt this validation turn.');record.ids.interrupted=r.request.request_id;save();
    await page.locator('#pause').click();
    await observe(()=>raw('state'),s=>s.audit.some(e=>e.type==='conversation_runtime_turn_started'&&s.executions.some(x=>x.execution_id===e.execution_id&&x.request_id===r.request.request_id)),'actual turn started',60000);
    await page.getByRole('button',{name:'Interrupt reply',exact:true}).click();
    await observe(()=>raw(`conversations/${c}`),d=>d.requests.find(q=>q.request_id===r.request.request_id)?.status==='interrupted','provider confirmed interruption',60000);
    await screenshot('06-interrupted-history');
    await select(record.ids.linus,fixture.linus);await page.getByRole('button',{name:'Archive',exact:true}).click();
    await observe(()=>raw('state'),s=>s.tasks.length===4&&s.tasks[3].status==='completed','return to original task context');
    const after=await verifyTarget();assert.equal(after.bindings.find(b=>b.worker_id===fixture.linus).runtime_reference,record.legacy_binding.runtime_reference);
    await page.getByRole('button',{name:'Resume conversation',exact:true}).click();await page.locator('#chat-body').waitFor();
    await screenshot('07-history-after-resume-and-task-return');record.task_return=true;
  }else if(phase==='crash'){
    // Operator must arm only this validation root before invoking this phase.
    const c=record.ids.maya;await select(c,fixture.maya);
    await page.getByRole('button',{name:'Replace Maya’s context',exact:true}).click();
    const r=await send(c,'Continue our retention discussion. This request exercises a controlled application restart before a provider turn begins; preserve the unresolved policy question.');
    record.ids.crash_request=r.request.request_id;save();
    await sleep(1000);
  }else if(phase==='recovery'){
    const c=record.ids.maya;await select(c,fixture.maya);
    const before=await raw(`conversations/${c}`);assert.equal(before.requests.find(r=>r.request_id===record.ids.crash_request).status,'blocked');
    assert.ok(before.sessions.some(s=>s.state==='blocked'));const n=before.executions.length;
    await sleep(2500);assert.equal((await raw(`conversations/${c}`)).executions.length,n,'No blind replay');
    const r=await send(c,'After the restart, give a concise recap of the original 48-hour retention constraint and the still-open tombstone decision. Distinguish known facts from unresolved outcomes; this is a new explicit reply request.');
    record.ids.recovery_reply=r.request.request_id;save();const after=await settled(c,r.request.request_id);
    assert.ok(after.history.items.some(m=>m.response_to===record.ids.maya_first));await screenshot('08-history-after-service-restart');
  }else if(phase==='idle'){
    const before=await verifyTarget();assert.equal(before.paused,false);assert.ok(!before.executions.some(e=>e.status==='running'));
    const n=before.executions.length;await sleep(10000);assert.equal((await verifyTarget()).executions.length,n);
    record.idle_interval_ms=10000;await page.locator('#pause').click();
  }else throw new Error('Unknown phase');
  assert.deepEqual(errors,[]);record.phases[phase]={completed:new Date().toISOString()};save();
  writeFileSync(join(dir,`state-${phase}.json`),JSON.stringify(await verifyTarget(),null,2));
  console.log(`PASS: ${phase}; evidence ${dir}`);
}catch(error){await page.screenshot({path:join(dir,`failure-${phase}.png`),fullPage:true}).catch(()=>{});record.last_failure={phase,error:String(error),at:new Date().toISOString()};save();throw error;}
finally{await context.close();await browser.close();}
