import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture,objective,hire} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';

async function setup(t){const f=fixture();f.company.assignObjective(objective);const setup=f.company.claimNext();const scout=f.company.callTool(setup.context,'hire','hire_worker',hire);f.company.finish(setup.execution.execution_id,{status:'completed',summary:'Trusted fixture roster'});f.company.pause(true);f.dispatcher.start();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(async()=>{await browser.close();await http.close();await f.close();assert.deepEqual(errors,[]);});await page.goto(`http://127.0.0.1:${http.server.address().port}`);await page.getByText('Connected to headquarters',{exact:true}).waitFor();return {...f,page,scout,atlas:setup.worker};}
const group=(f,topic)=>f.company.discussions.create({topic,desired_output:'Recommend with evidence and uncertainty',constraints:'Hypothetical. Do not implement.',participant_ids:[f.atlas.worker_id,f.scout.worker_id],facilitator_id:f.atlas.worker_id,synthesizer_id:f.atlas.worker_id,organize_with_atlas:false,allow_incomplete:true,allow_research:false,receipt_key:randomUUID()});

test('new group waits for the initial eligible roster before opening the charter',async t=>{
  const f=await setup(t),{page}=f;let release,entered;
  const intercepted=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  await page.route('**/api/groups',async route=>{const response=await route.fetch();entered();await gate;await route.fulfill({response});});
  await page.locator('[data-tab=groups]').click();await intercepted;
  try {
    await page.getByText('Loading working groups…',{exact:true}).waitFor();
    assert.equal(await page.locator('#new-group').isDisabled(),true);
    assert.equal(await page.locator('[name=participant]').count(),0);
  } finally {release();}
  await page.locator('#new-group').click();await page.locator('[name=topic]').waitFor();
  assert.equal(await page.locator('[name=participant]').count(),2);
  assert.equal(await page.locator(`[name=participant][value="${f.atlas.worker_id}"]`).count(),1);
  assert.equal(await page.locator(`[name=participant][value="${f.scout.worker_id}"]`).count(),1);
  assert.equal(f.company.discussions.list().items.length,0);
});

test('working group browser drafts, safe evidence, explicit start, pause/stop and routing isolation',async t=>{
  const f=await setup(t),{page}=f;const dir=join(process.cwd(),'.validation/prompt08/browser');mkdirSync(dir,{recursive:true});
  await page.locator('[data-tab=groups]').click();await page.locator('#new-group').click();await page.locator('[name=topic]').fill('Hypothetical onboarding decision');await page.locator('[name=desired_output]').fill('Compare options and recommend with uncertainty');
  await page.locator(`[name=participant][value="${f.atlas.worker_id}"]`).check();await page.locator(`[name=participant][value="${f.scout.worker_id}"]`).check();await page.locator('[name=facilitator]').selectOption(f.atlas.worker_id);await page.locator('[name=synthesizer]').selectOption(f.atlas.worker_id);await page.getByRole('button',{name:'Create draft',exact:true}).click();await page.locator('[data-selected-group]').waitFor();const id=await page.locator('[data-selected-group]').getAttribute('data-selected-group');
  assert.equal(f.company.discussions.group(id).state,'draft');assert.equal(f.company.claimWorkNext(),undefined);await page.screenshot({path:join(dir,'charter.png')});
  await page.locator('#share-group-material').click();await page.locator('[name=title]').fill('A shared fixture');await page.locator('[name=content]').fill('<img src=x onerror="window.injected=1"> HYPOTHETICAL_SHARED_MATERIAL');await page.locator('[name=audience]').check();await page.getByRole('button',{name:'Share selected excerpt',exact:true}).click();await page.locator('[data-group-evidence]').click();await page.getByText('Only this export is shared; private queries and producer history are excluded.',{exact:true}).waitFor();assert.equal(await page.locator('#inspect-content img').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);await page.screenshot({path:join(dir,'shared-material.png')});await page.keyboard.press('Escape');
  await page.locator('#group-note').fill('A question about keyboard-only first use');await page.getByRole('button',{name:'Save interjection',exact:true}).click();await page.getByText('A question about keyboard-only first use',{exact:true}).waitFor();
  await page.locator('[data-group-action=start]').click();await page.waitForFunction(()=>document.querySelector('[data-selected-group] .status')?.textContent==='active');assert.equal(f.company.snapshot().executions.filter(e=>e.status==='running').length,0);assert.equal(f.company.snapshot().tasks.length,1);
  await page.locator('[data-group-action=pause]').click();await page.waitForFunction(()=>document.querySelector('[data-selected-group] .status')?.textContent==='paused');await page.locator('[data-group-action=stop]').click();await page.waitForFunction(()=>document.querySelector('[data-selected-group] .status')?.textContent==='stopped');assert.equal(f.company.discussions.inspect(id).syntheses.length,0);await page.screenshot({path:join(dir,'controls.png')});
  await page.locator('[data-tab=direct]').click();await page.locator('#conversation-worker').waitFor();assert.equal(await page.locator('[data-conversation]').count(),0);
});

test('group drafts and delayed history stay attached to the original group',async t=>{const f=await setup(t),{page}=f;const a=group(f,'Group A'),b=group(f,'Group B');for(let i=0;i<31;i++)f.company.discussions.note({group_id:a.group_id,body:`PRIVATE_HISTORY_A_${i}`,kind:'note',receipt_key:randomUUID()});f.company.discussions.note({group_id:b.group_id,body:'VISIBLE_HISTORY_B',kind:'note',receipt_key:randomUUID()});
  await page.locator('[data-tab=groups]').click();await page.locator(`[data-group="${a.group_id}"]`).click();await page.locator('#older-group-history').waitFor();await page.locator('#group-note').fill('PRIVATE_DRAFT_A');
  let release,entered;const intercepted=new Promise(r=>entered=r),gate=new Promise(r=>release=r);await page.route(`**/api/groups/${a.group_id}?before=*`,async route=>{const response=await route.fetch();entered();await gate;await route.fulfill({response});});await page.locator('#older-group-history').click();await intercepted;await page.locator(`[data-group="${b.group_id}"]`).click();await page.getByText('VISIBLE_HISTORY_B',{exact:true}).waitFor();assert.equal(await page.locator('#group-note').inputValue(),'');const arrived=page.waitForResponse(r=>r.url().includes(`${a.group_id}?before=`));release();await arrived;await page.waitForTimeout(100);assert.equal(await page.locator('.message-body').filter({hasText:'PRIVATE_HISTORY_A_'}).count(),0);await page.locator(`[data-group="${a.group_id}"]`).click();await page.waitForFunction(()=>document.querySelector('#group-note')?.value==='PRIVATE_DRAFT_A');
});

test('blocked group owner selects an unfenced existing participant for explicit incomplete finish',async t=>{
  const f=await setup(t),{page}=f,g=group(f,'Incomplete finalization fixture');f.company.discussions.control({group_id:g.group_id,action:'start',receipt_key:randomUUID()});f.company.pause(false);
  const pair=[f.company.claimWorkNext(),f.company.claimWorkNext()];f.company.pause(true);
  for(const c of pair){assert.equal(c.origin,'conversation');f.company.conversations.prepareBinding(c.context,{worker_id:c.worker.worker_id,runtime_type:c.worker.runtime_type,workspace_path:c.worker.workspace_path,runtime_reference:randomUUID(),created_at:new Date().toISOString()});f.company.conversations.activateBinding(c.context);f.company.conversations.context(c.context);
    if(c.worker.worker_id===f.atlas.worker_id){f.company.conversations.event(c.context,'runtime_turn_starting',{context_chars:100});f.company.finish(c.execution.execution_id,{status:'failed',settled:false,error:'Unknown provider fixture'});}else{f.company.conversations.callTool(c.context,randomUUID(),'submit_contribution',{body:'Keyboard access remains uncertain.',contribution_ids:[],evidence_ids:[],questions:[],answers:[]});f.company.finish(c.execution.execution_id,{status:'completed',summary:'Fixture contribution'});}
  }
  f.company.discussions.progress();assert.equal(f.company.providerUnresolved(f.atlas.worker_id),true);await page.locator('[data-tab=groups]').click();await page.locator(`[data-group="${g.group_id}"]`).click();await page.locator('#group-final-synth').waitFor();assert.notEqual(await page.locator(`#group-final-synth option[value="${f.atlas.worker_id}"]`).getAttribute('disabled'),null);await page.locator('#group-final-synth').selectOption(f.scout.worker_id);
  const attempted=[];await page.route('**/api/groups/control',async route=>{const payload=route.request().postDataJSON();attempted.push(payload);if(attempted.length===1)await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Injected browser transport failure; no control committed'})});else await route.continue();});
  const rejected=page.waitForResponse(r=>r.url().endsWith('/api/groups/control')&&r.status()===503);await page.locator('[data-group-action=finish]').click();await rejected;await page.locator('#group-note').fill('Owner notes remain attached after a failed control.');await page.getByRole('button',{name:'Save interjection',exact:true}).click();await page.getByText('Owner notes remain attached after a failed control.',{exact:true}).waitFor();assert.equal(await page.locator('#group-final-synth').inputValue(),f.scout.worker_id);await page.locator('[data-group-action=finish]').click();await page.waitForFunction(()=>document.querySelector('[data-selected-group] .status')?.textContent==='active');assert.deepEqual(attempted[0],attempted[1]);assert.equal(f.company.discussions.group(g.group_id).synthesizer_id,f.scout.worker_id);assert.equal(f.company.providerUnresolved(f.atlas.worker_id),true);assert.equal(f.company.discussions.inspect(g.group_id).turns.filter(t=>t.kind==='finalize'&&t.status==='queued').length,1);
});
