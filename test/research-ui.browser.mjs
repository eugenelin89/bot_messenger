import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {fixture} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';

test('browser grants public and knowledge separately, runs bounded research, inspects safe links and revokes',async t=>{
  const f=fixture();const atlas=f.company.initializeCEO();let lookups=0;
  f.company.research.provider={name:'synthetic-browser-fixture',async search(_q,_s,h){lookups++;h.invoking();h.settled();return {provider:'synthetic-browser-fixture',outcome:'succeeded',sources:[{url:'https://docs.python.org/3/tutorial/',title:'Python <img src=x onerror="window.injected=1">',kind:'search_snippet',content:'Synthetic snippet, not real provider acceptance.',retrieved_at:'2026-01-01T00:00:00.000Z',observed_at:null,published_at:null,freshness:'unknown',omissions:'Synthetic browser fixture.'}],summary:'A clearly labeled synthetic summary.'};}};
  f.runtime.gate=async input=>{
    if(input.mode!=='conversation')throw new Error('No Tasks authorized by this browser fixture');
    let body;try{const r=await input.callTool('lookup','research_search',{query:'Python documentation'});body=`Fixture source [Python tutorial](${r.sources[0].url}). Retrieved 2026-01-01; observation time unknown. <img src=x onerror="window.injected=1"> [unsafe](javascript:alert(1))`;}catch(e){body=e.message;}
    await input.callTool('reply','submit_reply',{body});return {status:'completed',settled:true};
  };
  f.dispatcher.start();const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});
  t.after(async()=>{await browser.close();await http.close();await f.close();});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const dir=join(process.cwd(),'.validation','we01-browser');mkdirSync(dir,{recursive:true});
  await page.goto(`http://127.0.0.1:${http.server.address().port}`);await page.getByText('Connected to headquarters',{exact:true}).waitFor();
  const capabilities=async()=>{await page.locator(`[data-worker="${atlas.worker_id}"]`).first().click();await page.getByRole('button',{name:'Capabilities & research',exact:true}).click();await page.locator('#grant-public, [data-revoke-research]').first().waitFor();};
  await capabilities();await page.locator('#grant-public').click();await page.getByRole('button',{name:'Revoke Public Research',exact:true}).waitFor();
  assert.equal(f.store.get('SELECT count(*) n FROM standing_grants').n,1);
  await page.locator('#grant-knowledge input[value="README.md"]').check();await page.getByRole('button',{name:'Confirm selected document access',exact:true}).click();await page.getByRole('button',{name:'Revoke Company Knowledge',exact:true}).waitFor();
  assert.equal(f.store.get('SELECT count(*) n FROM standing_grants').n,2);await page.screenshot({path:join(dir,'standing-permissions.png')});
  await page.keyboard.press('Escape');await page.locator(`[data-worker="${atlas.worker_id}"]`).first().click();await page.getByRole('button',{name:'Open conversations',exact:true}).click();await page.locator('#new-conversation').click();
  await page.locator('#chat-body').fill('Synthetic UI research fixture');await page.getByRole('button',{name:'Send & request reply',exact:true}).click();await page.locator('.conversation-request .status.completed').waitFor();
  assert.equal(lookups,1);assert.equal(f.company.snapshot().tasks.length,0);
  const link=page.locator('.message-body a');assert.equal(await link.count(),1);assert.equal(await link.getAttribute('href'),'https://docs.python.org/3/tutorial/');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.equal(await page.locator('.message-body img').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
  await page.screenshot({path:join(dir,'source-reply.png')});
  await capabilities();await page.locator('[data-research-operation]').first().click();await page.locator('.research-source').waitFor();assert.match(await page.locator('#inspect-content').innerText(),/search_snippet/);assert.match(await page.locator('#inspect-content').innerText(),/2026-01-01/);assert.equal(await page.locator('#inspect-content img').count(),0);await page.screenshot({path:join(dir,'source-inspection.png')});
  await page.keyboard.press('Escape');await capabilities();await page.getByRole('button',{name:'Revoke Public Research',exact:true}).click();await page.locator('#grant-public').waitFor();await page.screenshot({path:join(dir,'revoked.png')});await page.keyboard.press('Escape');
  await page.locator('#chat-body').fill('Try public research after revocation');await page.getByRole('button',{name:'Send & request reply',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.conversation-request .status.completed').length===2);assert.equal(lookups,1);assert.match(await page.locator('#view').innerText(),/No active Public Research/);assert.deepEqual(errors,[]);
});
