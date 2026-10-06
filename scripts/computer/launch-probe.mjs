// Operator-run Linux confinement feasibility probe, not worker C10-1 acceptance.
import { chromium } from 'playwright-core';
import { performance } from 'node:perf_hooks';
const start=performance.now();
const browser=await chromium.launch({executablePath:'/opt/botsquad-browser/launch.py',headless:true,chromiumSandbox:true,timeout:20000,
  args:['--disable-background-networking','--disable-extensions','--disable-component-update','--disable-features=WebRtcHideLocalIpsWithMdns','--force-webrtc-ip-handling-policy=disable_non_proxied_udp']});
try {
  const context=await browser.newContext({viewport:{width:1024,height:768},acceptDownloads:false,serviceWorkers:'block'});
  const page=await context.newPage();
  await page.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Bounded Chromium probe</title><h1>Real rendered browser</h1><label>Name <input id="name"></label><button onclick="document.querySelector(\'h1\').textContent=\'Hello \'+document.querySelector(\'input\').value">Continue</button>'}));
  await page.goto('http://fixture.invalid/');
  await page.getByLabel('Name').fill('BotSquad');
  await page.getByRole('button',{name:'Continue'}).click();
  const screenshot=await page.screenshot();
  console.log(JSON.stringify({kind:'operator_feasibility_probe',browser:browser.version(),startup_and_actions_ms:Math.round(performance.now()-start),heading:await page.locator('h1').innerText(),screenshot_bytes:screenshot.length}));
  const sandbox=await context.newPage();
  await sandbox.goto('chrome://sandbox');
  console.log('SANDBOX_STATUS',await sandbox.locator('body').innerText());
} finally { await browser.close(); }
