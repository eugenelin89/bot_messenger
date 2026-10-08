// Read-only real SSH-tunnel acceptance. Outputs only bounded identity/count evidence.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const [revision,out,screens,additionalManifest]=process.argv.slice(2),url='http://127.0.0.1:4310';
assert.match(revision,/^[a-f0-9]{40}$/);let tunnel,browser;
const manifest=JSON.parse(readFileSync(new URL('./portraits.json',import.meta.url)));
if(additionalManifest)manifest.portraits.push(...JSON.parse(readFileSync(additionalManifest)).portraits);
const mapping=Object.fromEntries(manifest.portraits.map(p=>[p.name,'/'+p.destination.slice(7)]));
const errors=[],writes=[],external=[],runs=[],assetChecks=[];
async function get(path){const r=await fetch(url+'/api/'+path);assert.equal(r.status,200);return r.json();}
const expected=w=>w&&w.role!=='computer_operator'?mapping[w.display_name]??null:null;
async function portraitSources(locator){return locator.evaluateAll(nodes=>nodes.map(e=>e.querySelector('img.worker-portrait')?.getAttribute('src')??null));}
async function layout(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
async function healthyImages(page){await page.locator('img.worker-portrait').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));assert.equal(await page.locator('img.worker-portrait').evaluateAll(imgs=>imgs.every(i=>i.naturalWidth===384&&i.alt===''&&i.parentElement.getAttribute('aria-hidden')==='true')),true);}
try{
 try{assert.equal((await get('health')).commit,revision);}catch{
  tunnel=spawn('ssh',['-N','-o','ExitOnForwardFailure=yes','-L','4310:127.0.0.1:4310','botsquad'],{stdio:['ignore','ignore','pipe']});
  let ready=false;for(let i=0;i<80;i++){try{assert.equal((await get('health')).commit,revision);ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.equal(ready,true);
 }
 const health=await get('health');assert.equal(health.commit,revision);assert.equal(health.runtime,'ready');
 const state=await get('state'),attention=await get('attention');const worker=id=>state.workers.find(w=>w.worker_id===id);
 const sender=id=>state.principals.find(p=>p.principal_id===id)?.type==='bot'?state.workers.find(w=>w.principal_id===id):undefined;
 for(const p of manifest.portraits){const r=await fetch(url+mapping[p.name]);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');const body=Buffer.from(await r.arrayBuffer());assert.equal(body.length,p.bytes);assert.equal(createHash('sha256').update(body).digest('hex'),p.sha256);assetChecks.push({name:p.name,path:mapping[p.name],bytes:body.length,sha256:p.sha256});}
 browser=await chromium.launch({channel:'chrome',headless:true});if(screens)mkdirSync(screens,{recursive:true});
 for(const viewport of [{width:1440,height:1100},{width:390,height:844}]){
  const page=await browser.newPage({viewport});page.setDefaultTimeout(20000);
  const imageRequests=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method()+' '+new URL(r.url()).pathname);if(r.resourceType()==='image'){if(new URL(r.url()).origin!==url)external.push(r.url());else imageRequests.add(new URL(r.url()).pathname);}});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#connection').textContent==='Connected to headquarters');await page.waitForFunction(n=>document.querySelector('#attention-count').textContent===String(n),attention.total);
  assert.deepEqual(await portraitSources(page.locator('#workers .worker-button')),state.workers.map(expected));
  assert.deepEqual(await portraitSources(page.locator('.message')),state.messages.map(m=>expected(sender(m.sender_principal_id))));await healthyImages(page);await layout(page);
  const executive=await page.locator('.message img').count();
  await page.locator('[data-tab=tasks]').click();await page.locator('.task-ownership').first().waitFor();assert.deepEqual(await portraitSources(page.locator('.task-ownership')),state.tasks.toReversed().map(t=>expected(worker(t.assignee_worker_id))));await healthyImages(page);await layout(page);
  await page.locator('[data-tab=executions]').click();assert.deepEqual(await portraitSources(page.locator('tbody tr')),state.executions.toReversed().map(e=>expected(worker(e.worker_id))));await healthyImages(page);await layout(page);
  await page.locator('[data-tab=organization]').click();assert.equal(await page.locator('.org-node').count(),state.workers.length+1);await healthyImages(page);await layout(page);
  for(const w of state.workers){const node=page.locator('.org-node').filter({has:page.locator(`[data-worker="${w.worker_id}"]`)});assert.deepEqual(await portraitSources(node),[expected(w)]);assert.ok((await node.textContent()).includes(w.display_name));}
  if(screens)await page.locator('.org-tree').screenshot({path:join(screens,`organization-${viewport.width}.png`)});
  for(const name of ['Atlas','Nix']){const w=state.workers.find(w=>w.display_name===name);if(!w)continue;await page.locator(`#view [data-worker="${w.worker_id}"]`).click();await page.locator('.worker-profile').waitFor();assert.deepEqual(await portraitSources(page.locator('.worker-profile')),[expected(w)]);await healthyImages(page);await page.locator('#close-inspect').click();}
  await page.locator('[data-tab=direct]').click();await page.locator('#conversation-worker').waitFor();const conversations=await get('conversations');let directMessages=0,peerMessages=0;
  for(const c of conversations.items){await page.locator(`[data-conversation="${c.conversation_id}"]`).click();const detail=await get('conversations/'+c.conversation_id);await page.waitForFunction(id=>document.querySelector('#view')?.textContent.includes('Conversation '+id.split('_')[1].slice(0,8)),c.conversation_id);await page.waitForFunction(n=>document.querySelectorAll('.message').length===n,detail.history.items.length);assert.deepEqual(await portraitSources(page.locator('.message')),detail.history.items.map(m=>expected(sender(m.sender_principal_id))));await healthyImages(page);await layout(page);if(detail.participants.some(p=>p.principal_id==='human'))directMessages+=detail.history.items.length;else peerMessages+=detail.history.items.length;}
  await page.locator('[data-tab=groups]').click();await page.locator('#new-group').waitFor();const groups=await get('groups');let groupMessages=0,groupWorkerMessages=0;
  for(const g of groups.items){await page.locator(`[data-group="${g.group_id}"]`).click();const detail=await get('groups/'+g.group_id);await page.locator(`[data-selected-group="${g.group_id}"]`).waitFor();assert.deepEqual(await portraitSources(page.locator('.message')),detail.history.items.map(m=>expected(worker(m.worker_id))));await healthyImages(page);await layout(page);groupMessages+=detail.history.items.length;groupWorkerMessages+=detail.history.items.filter(m=>m.worker_id).length;}
  await page.locator('[data-tab=attention]').click();await page.waitForFunction(n=>document.querySelector('#attention-count').textContent===String(n),attention.total);await layout(page);
  assert.equal(await page.locator('.attention-item').count(),attention.total);assert.equal(await page.locator('#pause').isEnabled(),true);
  assert.deepEqual([...imageRequests].sort(),Object.values(mapping).sort());
  runs.push({viewport,roster:state.workers.length,executive_worker_portraits:executive,tasks:state.tasks.length,executions:state.executions.length,organization_workers:state.workers.length,worker_inspector:true,direct_messages:directMessages,peer_messages:peerMessages,groups:groups.items.length,group_messages:groupMessages,group_worker_messages:groupWorkerMessages,attention_count:attention.total,nix_fallback:!mapping.Nix,nix_portrait:mapping.Nix??null,no_document_overflow:true,decoded_images:true,local_image_paths:[...imageRequests].sort()});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);assert.deepEqual(external,[]);
 const result={revision,health,asset_checks:assetChecks,runs,page_errors:0,mutation_requests:0,external_portrait_requests:0,screenshots:screens?'Organization only; no private messages/objectives':'none',production_data_mutated:false};writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();if(tunnel&&tunnel.exitCode===null){const exited=new Promise(r=>tunnel.once('exit',r));tunnel.kill();await exited;}}
