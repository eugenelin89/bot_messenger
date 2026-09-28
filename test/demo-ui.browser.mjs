// Explicit browser regression: npm run build && node --test test/demo-ui.browser.mjs
// Uses only a fresh local test fixture; never the development HQ.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {fixture} from '../dist/test/helpers.js';
import {createHttpServer} from '../dist/src/http/server.js';

test('live updates preserve the approval being inspected and expanded exact scope',async t=>{
 const f=fixture();f.company.initializeCEO();f.company.pause(true);f.company.initializeNix();
 const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));
 await new Promise(r=>http.server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext();
 t.after(async()=>{await context.close();await browser.close();await http.close();await f.close();});
 const page=await context.newPage();await page.goto(`http://127.0.0.1:${http.server.address().port}`);await page.locator('[data-tab=approvals]').click();
 const approval=f.company.infrastructure.approvals()[0];const button=page.locator(`[data-approval="${approval.approval_id}"][data-decision=approve]`);
 const article=page.locator('#view article').first();await article.locator('summary').click();
 const original=await button.elementHandle();
 f.company.audit('demo_regression_progress','system',{});f.company.emit('changed');
 await page.waitForTimeout(250);
 assert.equal(await original.evaluate(el=>el.isConnected),true,'Unchanged approval DOM should remain attached during unrelated progress');
 assert.equal(await article.locator('details').evaluate(el=>el.open),true,'Exact scope must remain expanded');
 // A terminal decision genuinely changes the view. Existing scope must remain open.
 f.company.infrastructure.decide({approval_id:approval.approval_id,operation_id:approval.operation_id,decision:'deny'});
 f.company.emit('changed');await page.waitForTimeout(250);
 assert.equal(await article.locator('details').evaluate(el=>el.open),true,'Disclosure state survives a changed view');
});
