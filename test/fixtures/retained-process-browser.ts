/** Optional authored desktop/mobile UI acceptance against the real retained-history Company. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {chromium} from 'playwright';
import type {Company} from '../../src/control/company.js';
import type {Dispatcher} from '../../src/control/dispatcher.js';
import {createHttpServer} from '../../src/http/server.js';
export async function retainedProcessBrowser(c:Company,d:Dispatcher,scopeId:string){
 const http=createHttpServer(c,d,join(process.cwd(),'public'));await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BOTSQUAD_BROWSER_CHANNEL??'chrome',headless:true}),errors:string[]=[];
 try{for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  const address=http.server.address();assert.ok(address&&typeof address!=='string');await page.goto(`http://127.0.0.1:${address.port}/investment-run`);
  const root=page.locator('#observed-investment');await root.getByRole('button',{name:'Prepare retained-portfolio process upgrade or renewal',exact:true}).click();
  for(const name of ['objective','evaluationStart','evaluationEnd','sessions','maxRun','maxDay','maxCycle','maxWorker','maxRolling24h'])assert.equal(await root.locator(`[name=${name}]`).inputValue(),'');
  assert.equal(await root.locator('[name=historyDays]').inputValue(),'120');assert.equal(await root.locator('[name=cashReviewThreshold]').inputValue(),'3');assert.equal(await root.locator('[name=model]').isDisabled(),true);
  await page.reload();await root.getByText('Exact independent process approval binding',{exact:true}).click();
  const approve=root.getByRole('button',{name:'Approve this exact finite process transition',exact:true});
  if(width===390){await approve.click();await page.waitForFunction(()=>document.querySelector('#observed-investment')?.textContent?.includes('independently approved; schedule draft'));await root.getByText('Exact independent process approval binding',{exact:true}).click();}
  assert.equal(await approve.isDisabled(),true);assert.equal(await root.getByRole('button',{name:'Activate this approved process schedule',exact:true}).isVisible(),true);
  assert.equal(c.investmentLoop.forScope(scopeId)?.state,'draft');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const out=join(tmpdir(),'botsquad-inv114-browser');mkdirSync(out,{recursive:true});await root.locator('section.panel').first().screenshot({path:join(out,`retained-${width}.png`)});await page.close();
 }assert.deepEqual(errors,[]);}finally{await browser.close();await http.close();}
}
