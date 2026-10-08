import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture,objective,hire} from '../dist/test/helpers.js';
import {hireProfile} from '../dist/test/engineering-helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';
const names=['Atlas','Maya','Turing','Linus','Ada','Grace','Scout','Nix'];
const path=name=>`/images/workers/${name.toLowerCase()}.webp`;
function bind(f,c){assert.equal(c.origin,'conversation');f.company.conversations.prepareBinding(c.context,{worker_id:c.worker.worker_id,runtime_type:c.worker.runtime_type,workspace_path:c.worker.workspace_path,runtime_reference:randomUUID(),created_at:new Date().toISOString()});f.company.conversations.activateBinding(c.context);f.company.conversations.context(c.context);}
function seed(f){
 f.company.assignObjective(objective);const a=f.company.claimNext();const atlas=a.worker;
 const scout=f.company.callTool(a.context,'hire','hire_worker',hire);
 f.company.finish(a.execution.execution_id,{status:'completed',summary:'Atlas executive contribution'});
 f.company.createTask('human',atlas,objective,null,'product');const product=f.company.claimNext();
 const maya=hireProfile(f,product,'Maya','product_manager'),turing=hireProfile(f,product,'Turing','cto');
 f.company.finish(product.execution.execution_id,{status:'failed',settled:true,error:'Roster fixture ends before implementation'});
 f.company.createTask('human',turing,objective,null,'delivery');const c=f.company.claimNext();
 const linus=hireProfile(f,c,'Linus','engineer'),ada=hireProfile(f,c,'Ada','engineer'),grace=hireProfile(f,c,'Grace','reviewer');
 f.company.callTool(c.context,'message','message_worker',{recipient_worker_id:null,body:'Turing executive contribution'});
 f.company.finish(c.execution.execution_id,{status:'failed',settled:true,error:'Roster fixture ends before implementation'});
 const nix=f.company.initializeNix().worker;
 // Trusted isolated fixture only; no production authority or real model work.
 const bootstrap=f.company.infrastructure.operations()[0];
 f.company.infrastructure.decide({approval_id:bootstrap.approval_id,operation_id:bootstrap.operation_id,decision:'approve'});
 const nixTask=f.company.infrastructure.enqueue(scout.worker_id);const nixTurn=f.company.claimNext();
 assert.equal(nixTurn.worker.worker_id,nix.worker_id);
 f.company.callTool(nixTurn.context,'nix-message','message_worker',{recipient_worker_id:null,body:'Nix executive contribution'});
 f.company.finish(nixTurn.execution.execution_id,{status:'failed',settled:true,error:'Portrait fixture ends before infrastructure work'});
 const direct=f.company.conversations.open({worker_id:nix.worker_id,purpose:'Portrait direct fixture'});
 f.company.conversations.send({conversation_id:direct.conversation_id,body:'Human direct contribution',request_reply:true,receipt_key:randomUUID()});
 const first=f.company.claimWorkNext();bind(f,first);
 const peer=f.company.conversations.callTool(first.context,'peer','ask_peer',{worker_id:atlas.worker_id,question:'Nix peer question'});
 f.company.finish(first.execution.execution_id,{status:'completed',summary:'Nix direct contribution'});
 const answer=f.company.claimWorkNext();bind(f,answer);f.company.finish(answer.execution.execution_id,{status:'completed',summary:'Atlas peer answer'});
 const continuation=f.company.claimWorkNext();bind(f,continuation);f.company.finish(continuation.execution.execution_id,{status:'completed',summary:'Nix peer continuation'});
 const group=f.company.discussions.create({topic:'Portrait group fixture',desired_output:'Compare options',constraints:'Fixture only',participant_ids:[atlas.worker_id,nix.worker_id],facilitator_id:atlas.worker_id,synthesizer_id:nix.worker_id,organize_with_atlas:false,allow_research:false,allow_incomplete:true,receipt_key:randomUUID()});
 f.company.discussions.note({group_id:group.group_id,body:'Owner group interjection',kind:'note',receipt_key:randomUUID()});
 f.company.discussions.control({group_id:group.group_id,action:'start',receipt_key:randomUUID()});
 const turns=[f.company.claimWorkNext(),f.company.claimWorkNext()];
 for(const turn of turns){bind(f,turn);f.company.conversations.callTool(turn.context,randomUUID(),'submit_contribution',{body:`${turn.worker.display_name} group contribution`,contribution_ids:[],evidence_ids:[],questions:[],answers:[]});f.company.finish(turn.execution.execution_id,{status:'completed',summary:'Fixture contribution saved'});}
 f.company.discussions.control({group_id:group.group_id,action:'stop',receipt_key:randomUUID()});
 const task=f.company.createTask(turing.principal_id,linus,{...objective,objective:'Task assigned to Linus by Turing'},null);
 return {atlas,scout,maya,turing,linus,ada,grace,nix,nixTask,direct,peer,group,task};
}
async function setup(t,{viewport={width:1440,height:1100},custom=false,failed=false}={}){
 const f=fixture();t.after(()=>f.close());let data;
 if(custom){const atlas=f.company.initializeCEO();const operator=f.company.initializeComputerOperator({display_name:'Maya'});
  // Synthetic historical bot principal with no worker record must never borrow Atlas's face.
  f.store.run('INSERT INTO principals VALUES (?,?,?,1,?)','orphan-bot','bot','Atlas',new Date().toISOString());
  f.store.run("INSERT INTO messages VALUES (?,'executive',?,?,?,NULL,?,?,?)",randomUUID(),'orphan-bot',null,'Unknown worker contribution',null,null,new Date().toISOString());
  f.company.sendHumanMessage('Human presentation probe');data={atlas,operator};}
 else data=seed(f);
 f.company.pause(true);f.dispatcher.start();
 const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));t.after(()=>http.close());
 const browser=await chromium.launch({channel:process.env.BOTSQUAD_BROWSER_CHANNEL??'chrome',headless:true});const page=await browser.newPage({viewport});page.setDefaultTimeout(10000);
 const errors=[],writes=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method());if(r.resourceType()==='image'&&new URL(r.url()).origin!==url)external.push(r.url());});
 if(failed)await page.route('**/images/workers/*.webp',r=>r.abort());
 const url=`http://127.0.0.1:${http.server.address().port}`;
 t.after(async()=>{await browser.close();assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);assert.equal(f.runtime.calls.length,0);});
 await page.goto(url);await page.waitForFunction(()=>document.querySelector('#connection').textContent==='Connected to headquarters');await page.waitForFunction(()=>/^\d+$/.test(document.querySelector('#attention-count').textContent));
 return {f,page,...data};
}
async function portrait(container,name){await container.waitFor({state:'attached'});const img=container.locator('img.worker-portrait');assert.equal(await img.count(),1);assert.equal(await img.getAttribute('src'),path(name));assert.equal(await img.getAttribute('alt'),'');assert.equal(await img.locator('..').getAttribute('aria-hidden'),'true');await img.evaluate(i=>i.decode());assert.match(await container.textContent(),new RegExp(name));}
const message=(page,text)=>page.locator('.message').filter({has:page.locator('.message-body',{hasText:text})});
for(const viewport of [{width:1440,height:1100},{width:390,height:844}])test(`correct local portraits across all core surfaces at ${viewport.width}px`,async t=>{
 const d=await setup(t,{viewport}),{page}=d;
 for(const name of names)await portrait(page.locator(`#workers [data-worker="${d[name.toLowerCase()].worker_id}"]`),name);
 await portrait(message(page,'Nix executive contribution'),'Nix');
 await portrait(message(page,'Atlas executive contribution'),'Atlas');await portrait(message(page,'Turing executive contribution'),'Turing');
 const human=page.locator('.message').filter({has:page.locator('.message-meta strong',{hasText:'Human'})});assert.ok(await human.count());assert.equal(await human.locator('img').count(),0);
 await page.locator('[data-tab=tasks]').click();const card=page.locator('.task-card').filter({hasText:'Task assigned to Linus by Turing'});await portrait(card,'Linus');assert.match(await card.textContent(),/Assignee:.*Linus.*Requested by Turing/s);assert.match(await card.textContent(),new RegExp(d.task.task_id.split('_')[1].slice(0,8)));
 await portrait(page.locator('.task-card').filter({has:page.locator(`[data-task="${d.nixTask.task_id}"]`)}),'Nix');
 await page.locator('[data-tab=executions]').click();for(const row of await page.locator('tbody tr').all()){const name=(await row.locator('td').nth(1).textContent()).replace(/^(AT|SC|TU|NI)/,'');await portrait(row.locator('td').nth(1),name.trim());}
 await page.locator('[data-tab=organization]').click();for(const name of names)await portrait(page.locator('.org-node').filter({has:page.locator('strong',{hasText:new RegExp('^'+name+' —')})}),name);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Organization overflow');
 await page.locator(`#view [data-worker="${d.nix.worker_id}"]`).click();await page.locator('#ai-profile').waitFor();await portrait(page.locator('.worker-profile'),'Nix');await page.locator('#close-inspect').click();
 await page.locator('[data-tab=direct]').click();await page.locator(`[data-conversation="${d.direct.conversation_id}"]`).click();await portrait(message(page,'Nix direct contribution'),'Nix');assert.equal(await message(page,'Human direct contribution').locator('img').count(),0);
 await page.locator(`[data-conversation="${d.peer.conversation_id}"]`).click();await portrait(message(page,'Nix peer question'),'Nix');await portrait(message(page,'Atlas peer answer'),'Atlas');
 await page.locator('[data-tab=groups]').click();await page.locator(`[data-group="${d.group.group_id}"]`).click();await portrait(message(page,'Atlas group contribution'),'Atlas');await portrait(message(page,'Nix group contribution'),'Nix');assert.equal(await message(page,'Owner group interjection').locator('img').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Group overflow');
 const images=page.locator('img.worker-portrait');for(const img of await images.all())assert.equal(await img.evaluate(i=>i.complete&&i.naturalWidth===384),true);
 const dir=process.env.BOTSQUAD_PORTRAIT_SCREENSHOTS;if(dir){mkdirSync(dir,{recursive:true});await page.screenshot({path:join(dir,`groups-${viewport.width}.png`),fullPage:true});await page.locator('[data-tab=tasks]').click();await page.screenshot({path:join(dir,`tasks-${viewport.width}.png`),fullPage:true});}
});
test('custom names are escaped, exact mapping never follows role, humans/System/operators keep fallback',async t=>{
 const {page}=await setup(t,{custom:true});
 assert.equal(await message(page,'Unknown worker contribution').locator('img').count(),0);assert.match(await message(page,'Unknown worker contribution').textContent(),/Atlas/);
 assert.equal(await message(page,'Human presentation probe').locator('img').count(),0);
 const checks=await page.evaluate(async()=>{const {workerAvatar,workerIdentity,fallbackAvatar}=await import('/worker-portraits.js');const box=document.createElement('div');box.id='portrait-probes';document.body.append(box);const names=['Future Engineer','atlas','<img src=x onerror="window.injected=1">','constructor','__proto__'];box.innerHTML=names.map(display_name=>workerIdentity({worker_id:'fixture',display_name,role:'engineer'})).join('')+workerAvatar({worker_id:'operator',display_name:'Maya',role:'computer_operator'})+fallbackAvatar('Human')+fallbackAvatar('System')+fallbackAvatar('Atlas');return {count:box.querySelectorAll('img').length,text:box.textContent,script:window.injected};});
 assert.equal(await page.locator('#portrait-probes .avatar.system').textContent(),'SY');assert.equal(checks.count,0);assert.equal(checks.script,undefined);assert.match(checks.text,/<img src=x/);assert.match(checks.text,/Future Engineer/);assert.equal(await page.locator('#workers .worker-button').filter({hasText:'Maya'}).locator('img').count(),0);
});
test('image failure reveals initials and never changes readiness, Attention or creates model work',async t=>{
 const {page,nix}=await setup(t,{failed:true});const attention=await page.locator('#attention-count').textContent();
 await page.waitForFunction(()=>document.querySelectorAll('img.worker-portrait').length===0);assert.equal(await page.locator('#workers .avatar').first().textContent(),'AT');assert.equal(await page.locator(`#workers [data-worker="${nix.worker_id}"] .avatar`).textContent(),'NI');
 await page.locator('[data-tab=tasks]').click();await page.waitForFunction(()=>document.querySelectorAll('img.worker-portrait').length===0);assert.match(await page.locator('.task-ownership').filter({hasText:'Linus'}).textContent(),/LI.*Linus/);
 assert.equal(await page.locator('#pause').isEnabled(),true);assert.equal(await page.locator('#attention-count').textContent(),attention);assert.equal(await page.locator('#load-status').isVisible(),false);
});
