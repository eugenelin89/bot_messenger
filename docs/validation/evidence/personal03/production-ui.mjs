import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
const revision=process.argv[2],out=process.argv[3],port=4310,url=`http://127.0.0.1:${port}`;
const taskId='task_cae78898-23c9-4e76-b6e5-4440e4fa8fdf';
let tunnel,browser;const errors=[],writes=[],runs=[];
async function startTunnel(){tunnel=spawn('ssh',['-N','-o','ExitOnForwardFailure=yes','-L',`${port}:127.0.0.1:4310`,'botsquad'],{stdio:['ignore','ignore','pipe']});for(let i=0;i<80;i++){try{const h=await fetch(url+'/api/health').then(r=>r.json());assert.equal(h.commit,revision);return;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Tunnel unavailable');}
async function stopTunnel(){if(!tunnel||tunnel.exitCode!==null)return;const ended=new Promise(r=>tunnel.once('exit',r));tunnel.kill('SIGTERM');await ended;}
try{
 await startTunnel();browser=await chromium.launch({channel:'chrome',headless:true});
 for(const viewport of [{width:1440,height:1100},{width:390,height:844}]){
  const page=await browser.newPage({viewport});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET')writes.push(r.method()+' '+new URL(r.url()).pathname);});
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='1');
  let release;const gate=new Promise(r=>release=r);
  await page.route('**/api/state',async route=>{await gate;if(!route.request().failure())await route.continue();});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-tab=attention]').click();
  assert.equal(await page.locator('#attention-count').textContent(),'…');assert.match(await page.locator('#view').textContent(),/Loading owner attention/);release();await page.unroute('**/api/state');
  await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='1');
  const state=await page.evaluate(async()=>fetch('/api/attention').then(r=>r.json()));assert.equal(state.total,1);assert.deepEqual(state.items.map(i=>({id:i.source_id,kind:i.kind,category:i.category})),[{id:taskId,kind:'infrastructure_task',category:'blocked'}]);
  await page.locator(`[data-attention-id="task:${taskId}"] [data-attention]`).click();await page.locator('#inspect[open]').waitFor();assert.equal(await page.locator('[data-tab=tasks]').evaluate(e=>e.classList.contains('selected')),true);assert.ok((await page.locator('#inspect-content').textContent()).includes('worker remains unprovisioned/blocked'),'Retained coordination reason missing');assert.equal(await page.locator('[data-cancel]').isVisible(),true);assert.equal(await page.locator('#retry').count(),0);
  await page.locator('#close-inspect').click();await page.locator('[data-tab=attention]').click();await page.locator('.attention-item').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await stopTunnel();await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='1*');assert.match(await page.locator('#view').textContent(),/current count is unverified/);assert.equal(await page.locator('.attention-item').count(),1);
  await startTunnel();await page.waitForFunction(()=>document.querySelector('#attention-count').textContent==='1');await page.waitForFunction(()=>document.querySelector('#connection').textContent==='Connected to headquarters');assert.equal(await page.locator('.attention-item').count(),1);
  runs.push({viewport,hard_reload:true,held_real_company_read:true,boot_count:'…',verified_count:1,exact_task_inspected:true,cancel_supported:true,generic_retry_absent:true,source_and_back:true,no_horizontal_overflow:true,native_tunnel_reconnect:true,stale_count:'1*',recovered_count:1});await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);const result={revision,production_attention_count:1,source_id:taskId,runs,page_errors:0,mutation_requests:0,private_screenshots:false,real_sse:true};writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser?.close();await stopTunnel();}
