/** UX-01 uses a disposable backend, explicit synthetic outcomes and zero external providers. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture,hire,assignment} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';
import {go,aiSettings} from './hq-navigation.mjs';
export const tutorial='Read this text and summarize it in three plain-English bullet points: “BotSquad keeps tasks, messages and results. Atlas coordinates assignments. The owner reviews outcomes and controls permissions.” Use only the text in this request. Do not browse, change software or publish anything.';
const report='• BotSquad saves tasks, messages and results.\n• Atlas coordinates the team’s assignments.\n• The owner checks the work and controls permissions.';
const captures=process.env.BOTSQUAD_UX_SCREENSHOTS;
async function setup(t,{width=1440,seed=()=>{},run=false}={}){
 const f=fixture();await seed(f);f.company.pause(!run);
 if(run){f.runtime.gate=async input=>{assert.equal(input.task.objective,tutorial);input.callTool('save-tutorial-result','submit_artifact',{description:'Three-point summary — sample result',content:report});return {status:'completed',settled:true,summary:report};};f.dispatcher.start();}
 const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width,height:1000},locale:'en-US',timezoneId:'America/Vancouver',reducedMotion:'reduce'});page.setDefaultTimeout(10000);
 const errors=[],writes=[],runtimeReads=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(new URL(r.url()).pathname);if(r.url().endsWith('/api/runtime'))runtimeReads.push(r.url());});
 t.after(async()=>{await browser.close();await http.close();await f.close();rmSync(f.dir,{recursive:true,force:true});assert.deepEqual(errors,[]);});
 const origin=`http://127.0.0.1:${http.server.address().port}`;
 await page.goto(origin);await page.getByText('Connected to headquarters',{exact:true}).waitFor();
 const capture=async name=>{if(captures){mkdirSync(captures,{recursive:true});await page.screenshot({path:join(captures,`${name}-${width}.png`),fullPage:true});}};
 return {f,page,writes,runtimeReads,origin,capture};
}
function seedOverview(f){
 const done=f.company.assignObjective({objective:'Sample: prepare the team introduction',acceptance_criteria:'A short report',constraints:'Isolated fixture only'}),x=f.company.claimNext();f.company.callTool(x.context,'sample-artifact','submit_artifact',{description:'Sample team introduction',content:'Sample report: Atlas coordinates work; the owner reviews results.'});f.company.finish(x.execution.execution_id,{status:'completed',settled:true,summary:'Prepared a short introduction to the team.'});
 const failed=f.company.assignObjective({objective:'Sample: summarize a local note',acceptance_criteria:'A summary',constraints:'Fixture only'}),y=f.company.claimNext();f.company.finish(y.execution.execution_id,{status:'failed',settled:true,error:'Simulated AI service interruption. No external request was made.'});
 const parent=f.company.assignObjective({objective:'Sample: review the project notes',acceptance_criteria:'Review related research',constraints:'Fixture only'}),z=f.company.claimNext();const scout=f.company.callTool(z.context,'sample-hire','hire_worker',hire);const child=f.company.callTool(z.context,'sample-delegate','assign_task',{worker_id:scout.worker_id,...assignment});f.company.finish(z.execution.execution_id,{status:'completed',settled:true,summary:'Research has been delegated; the overall task is not complete.'});
 return {done,failed,parent,child,scout};
}
for(const width of [1440,390])test(`Home, employee, problem, result and advanced records (${width}px)`,async t=>{
 let seeded;const {f,page,writes,runtimeReads,capture}=await setup(t,{width,seed:f=>{seeded=seedOverview(f);}});
 await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='1');
 assert.equal(await page.locator('.rail [data-tab]').count(),6);
 assert.equal(await page.locator('#heading').innerText(),'Your team at a glance');
 assert.match(await page.locator('#view').innerText(),/Current work|Needs your attention|Recently completed|Your AI team/);
 const recent=page.locator('section[aria-labelledby=recent-work-title]');assert.match(await recent.innerText(),/Sample: prepare the team introduction/);assert.doesNotMatch(await recent.innerText(),/Sample: review the project notes/);
 assert.match(await page.locator('section[aria-labelledby=current-work-title]').innerText(),/Waiting for related tasks/);
 await capture('home');
 await page.locator(`[data-task="${seeded.done.task_id}"]`).first().click();await page.getByRole('dialog',{name:'Task details'}).waitFor();assert.match(await page.locator('.task-results').innerText(),/Prepared a short introduction/);await page.locator('#inspect [data-artifact]').click();assert.equal(await page.locator('.result-content').innerText(),'Sample report: Atlas coordinates work; the owner reviews results.');await page.keyboard.press('Escape');
 await go(page,'organization');await page.locator('#view [data-worker]').first().click();assert.match(await page.locator('#inspect').innerText(),/Current assignments|Recent completed work/);assert.equal(runtimeReads.length,0);await page.locator('#inspect summary').click();await page.locator('[data-ai-settings]').click();await page.locator('#ai-profile').waitFor();assert.equal(runtimeReads.length,1);await page.keyboard.press('Escape');
 await go(page,'attention');await page.locator('.attention-item [data-attention]').click();assert.match(await page.locator('#inspect').innerText(),/Simulated AI service interruption/);assert.equal(await page.locator('#retry').isDisabled(),true);await page.locator('#inspect summary').filter({hasText:'Advanced details'}).click();assert.match(await page.locator('#inspect').innerText(),new RegExp(seeded.failed.task_id));await page.keyboard.press('Escape');
 await go(page,'activity');assert.ok(await page.locator('.timeline li').count()>0);await page.locator('[data-event]').first().click();assert.match(await page.locator('#inspect').innerText(),/Original event evidence/);await page.keyboard.press('Escape');
 assert.equal(f.company.task(seeded.parent.task_id).status,'blocked');assert.equal(f.runtime.calls.length,0);assert.deepEqual(writes,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
for(const width of [1440,390])test(`Follow exact beginner exercise, keyboard controls and real saved result via fake runtime (${width}px)`,async t=>{
 const {f,page,writes,runtimeReads,capture}=await setup(t,{width,run:true});
 await page.locator('#new-task').focus();await page.keyboard.press('Enter');await page.getByRole('dialog',{name:'New task',exact:true}).waitFor();assert.equal(await page.locator('#new-task-objective').evaluate(e=>e===document.activeElement),true);await page.locator('#new-task-objective').fill(tutorial);await capture('new-task');await page.getByRole('button',{name:'Start task',exact:true}).focus();await page.keyboard.press('Enter');
 await page.getByRole('dialog',{name:'Task details'}).waitFor();await page.locator('#inspect .status.completed').waitFor();assert.equal(f.company.snapshot().tasks.length,1);assert.equal(f.runtime.calls.length,1);assert.equal(await page.locator('.task-results .message-body').innerText(),report);await capture('task-result');
 await page.locator('#inspect [data-artifact]').focus();await page.keyboard.press('Enter');await page.locator('.result-content').waitFor();assert.equal(await page.locator('.result-content').innerText(),report);await capture('saved-result');await page.keyboard.press('Escape');assert.equal(await page.locator('#inspect').evaluate(e=>e.open),false);
 await go(page,'organization');await page.locator('#view [data-worker]').first().click();assert.match(await page.locator('#inspect').innerText(),/Recent completed work/);await capture('employee');assert.equal(runtimeReads.length,0);await page.keyboard.press('Escape');
 assert.deepEqual(writes,['/api/objectives']);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
test('Lost creation response is uncertain, preserves draft and prevents immediate duplicate',async t=>{
 const {f,page,writes}=await setup(t);
 await page.route('**/api/objectives',async route=>{await route.fetch();await route.abort('connectionfailed');},{times:1});
 await page.locator('#new-task').click();await page.locator('#new-task-objective').fill(tutorial);await page.getByRole('button',{name:'Start task',exact:true}).click();await page.locator('#task-submit-error').waitFor();assert.match(await page.locator('#task-submit-error').innerText(),/could not confirm whether your task was created/);assert.equal(await page.locator('#new-task-objective').inputValue(),tutorial);assert.equal(await page.getByRole('button',{name:'Start task',exact:true}).isDisabled(),true);assert.equal(f.company.snapshot().tasks.length,1);assert.deepEqual(writes,['/api/objectives']);await page.getByRole('button',{name:'Check Tasks',exact:true}).click();await page.locator('[data-task-card]').waitFor();assert.equal(await page.locator('[data-task-card]').count(),1);assert.equal(f.runtime.calls.length,0);
});
test('Navigation, URL history, focus, text reflow and non-mutating profile/help',async t=>{
 const {f,page,writes,runtimeReads,origin}=await setup(t,{seed:seedOverview});
 for(const tab of ['home','tasks','attention','computers','organization','direct','groups','activity','conversation','executions','audit','products','mandates','settings','approvals','infrastructure','devices']){await go(page,tab);await page.waitForFunction(()=>document.querySelector('#view').getAttribute('aria-busy')==='false');assert.equal(new URL(page.url()).hash,`#${tab}`);}
 await go(page,'tasks');await page.locator('#task-search').fill('Sample');await page.locator('#task-search').evaluate(e=>e.setSelectionRange(2,4));f.company.sendHumanMessage('Isolated update for focus verification');await page.waitForResponse(r=>r.url().endsWith('/api/state'));await page.waitForFunction(()=>document.activeElement.id==='task-search');assert.equal(await page.locator('#task-search').inputValue(),'Sample');assert.deepEqual(await page.locator('#task-search').evaluate(e=>[e.selectionStart,e.selectionEnd]),[2,4]);
 await page.locator('[data-task-card] [data-task]').first().click();await page.locator('#inspect summary').filter({hasText:'Advanced details'}).click();const selected=f.company.snapshot().tasks.at(-1);f.store.run("UPDATE tasks SET result_summary='Updated sample progress' WHERE task_id=?",selected.task_id);f.company.changed();await page.waitForResponse(r=>r.url().endsWith('/api/state'));assert.equal(await page.locator('#inspect details').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
 await go(page,'organization');await page.goBack();await page.waitForFunction(()=>document.querySelector('.rail [data-tab=tasks]').getAttribute('aria-current')==='page');await page.goto(origin+'/#organization');await page.locator('.team-profile-grid').waitFor();assert.equal(await page.locator('#heading').innerText(),'Meet your AI team');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});await go(page,'home');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Home reflow ${width}`);await go(page,'tasks');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Tasks reflow ${width}`);}
 await page.setViewportSize({width:768,height:1000});await page.evaluate(()=>{const measured=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of measured)e.style.fontSize=`${size*2}px`;});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'200% text-size reflow at tablet width');
 assert.equal(f.runtime.calls.length,0);assert.deepEqual(writes,[]);assert.equal(runtimeReads.length,0);
});

test('Confirmed task creation survives a failed state refresh without a second submit',async t=>{
 const {f,page,writes}=await setup(t);
 await page.route('**/api/state',r=>r.fulfill({status:503,json:{error:'Controlled refresh outage'}}));
 await page.locator('#new-task').click();await page.locator('#new-task-objective').fill(tutorial);await page.getByRole('button',{name:'Start task',exact:true}).click();
 await page.getByRole('dialog',{name:'Task created',exact:true}).waitFor();assert.match(await page.locator('#inspect').innerText(),/Do not submit it again/);assert.equal(f.company.snapshot().tasks.length,1);assert.deepEqual(writes,['/api/objectives']);
 await page.getByRole('link',{name:'Open Tasks',exact:true}).click();assert.equal(await page.locator('#inspect').evaluate(e=>e.open),false);await page.unroute('**/api/state');await page.reload();await page.locator('.task-card').waitFor();assert.match(await page.locator('.task-card').innerText(),/Read this text/);assert.equal(f.runtime.calls.length,0);
});

test('Open employee profile follows real state changes without losing focus or disclosures',async t=>{
 let task,work;const {f,page,runtimeReads}=await setup(t,{seed:f=>{task=f.company.assignObjective({objective:'Sample in-progress profile task',acceptance_criteria:'A result',constraints:'Synthetic fixture'});work=f.company.claimNext();}});
 await go(page,'organization');await page.locator('.team-profile-grid [data-worker]').first().click();assert.match(await page.locator('#inspect .profile-intro').innerText(),/Working now/);
 const summary=page.locator('#inspect summary').filter({hasText:'Advanced employee details'});await summary.click();await summary.focus();
 f.company.finish(work.execution.execution_id,{status:'completed',settled:true,summary:'Synthetic completion observed through real SSE'});
 await page.locator('#inspect .status.completed').waitFor();assert.match(await page.locator('#inspect .profile-intro').innerText(),/No session running/);assert.equal(await page.locator('#inspect details').evaluate(e=>e.open),true);assert.equal(await summary.evaluate(e=>e===document.activeElement),true);assert.equal(runtimeReads.length,0);assert.equal(f.runtime.calls.length,0);
});

test('Contextual navigation preserves Back and late result reads cannot replace a newer inspector',async t=>{
 let seeded;const {page,runtimeReads}=await setup(t,{seed:f=>{seeded=seedOverview(f);}});
 await go(page,'organization');await page.locator('.team-profile-grid [data-worker]').first().click();await page.getByRole('button',{name:'Open conversations',exact:true}).click();await page.locator('#conversation-worker').waitFor();await page.goBack();await page.locator('.team-profile-grid').waitFor();
 await go(page,'attention');await page.locator('.attention-item [data-attention]').click();await page.getByRole('dialog',{name:'Task details'}).waitFor();await page.goBack();await page.locator('.attention-item').waitFor();assert.equal(await page.locator('#inspect').evaluate(e=>e.open),false);
 await go(page,'home');const entered=Promise.withResolvers(),release=Promise.withResolvers();t.after(()=>release.resolve());
 await page.route('**/api/artifacts/*',async route=>{const response=await route.fetch();entered.resolve();await release.promise;await route.fulfill({response});},{times:1});
 await page.locator('[data-artifact]').first().click();await entered.promise;await page.getByRole('dialog',{name:'Loading result'}).waitFor();await page.keyboard.press('Escape');await go(page,'organization');await page.locator('.team-profile-grid [data-worker]').first().click();
 const arrived=page.waitForResponse(r=>new URL(r.url()).pathname.startsWith('/api/artifacts/'));release.resolve();await arrived;await page.locator('#inspect summary').click();assert.match(await page.locator('#inspect').innerText(),/Advanced employee details/);assert.equal(await page.locator('.result-content').count(),0);assert.equal(runtimeReads.length,0);
});

test('Task refresh restores the focused employee button inside its dialog, not duplicate rail controls',async t=>{
 let task,work;const {f,page}=await setup(t,{seed:f=>{task=f.company.assignObjective({objective:'Sample task focus',acceptance_criteria:'A result',constraints:'Fixture'});work=f.company.claimNext();}});
 await page.locator(`[data-task="${task.task_id}"]`).first().click();await page.locator('#inspect .task-detail-lead [data-worker]').focus();f.company.finish(work.execution.execution_id,{status:'completed',settled:true,summary:'Sample result for focus verification'});await page.locator('#inspect .status.completed').waitFor();assert.equal(await page.locator('#inspect .task-detail-lead [data-worker]').evaluate(e=>e===document.activeElement),true);
});

test('Long retained requests stay compact on Home and remain complete in Task details',async t=>{
 const objective='Review the complete retained project evidence and explain the outcome. '.repeat(18),outcome='This is a retained outcome with supporting context. '.repeat(12);
 const {page}=await setup(t,{width:390,seed:f=>{f.company.assignObjective({objective,acceptance_criteria:'Preserve the full request',constraints:'Synthetic long-record regression'});const work=f.company.claimNext();f.company.finish(work.execution.execution_id,{status:'completed',settled:true,summary:outcome});}});
 const title=page.locator('[aria-labelledby="recent-work-title"] .title-link'),summary=page.locator('[aria-labelledby="recent-work-title"] .task-summary');
 for(const [element,lines] of [[title,4],[summary,3]]){const measured=await element.evaluate(e=>({height:e.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(e).lineHeight),clamp:getComputedStyle(e).webkitLineClamp,display:getComputedStyle(e).display,padding:parseFloat(getComputedStyle(e).paddingTop)+parseFloat(getComputedStyle(e).paddingBottom)}));assert.ok(measured.height<=measured.lineHeight*lines+measured.padding+1,JSON.stringify(measured));}
 await title.click();await page.getByRole('dialog',{name:'Task details'}).waitFor();assert.equal((await page.locator('.task-detail-lead h3').innerText()).trim(),objective.trim());assert.equal((await page.locator('.task-results .message-body').innerText()).trim(),outcome.trim());
});
