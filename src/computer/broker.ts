// Dedicated non-root service. It has no network and no HQ state/credentials.
// The private HQ controller forwards individually authorized requests over this
// Unix connection. The broker never interprets model-authored JS/CDP/paths/flags.
import { createServer } from 'node:net';
import { chmodSync, existsSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { chromium,type Browser,type BrowserContext,type Page,type ElementHandle } from 'playwright-core';
import { ComputerRPC } from './ipc.js';
import { computerHash,type PageSnapshot,type BrowserResponse } from '../domain/computer.js';
import { requireThat,strictObject } from '../domain/model.js';

const socketPath=process.env.BOT_BROWSER_SOCKET??'/run/botsquad-browser/control.sock';
const epoch=randomUUID();let occupied=false;
requireThat(process.platform==='linux'&&process.getuid?.()!==0,'Browser broker requires non-root Linux');
requireThat(socketPath.startsWith('/run/botsquad-browser/')&&socketPath.endsWith('.sock'),'Invalid broker socket path');
if(existsSync(socketPath))unlinkSync(socketPath);
const server=createServer(socket=>{
  if(occupied){socket.destroy();return;}occupied=true;
  const rpc=new ComputerRPC(socket);let browser:Browser|undefined;let context:BrowserContext|undefined;let page:Page|undefined;
  let launching:Promise<Browser>|undefined;let cleanup:Promise<void>|undefined;
  let session:string|undefined;let closing=false;let expectedShutdown=false;let busy=false;let deadline:NodeJS.Timeout|undefined;
  let handles=new Map<string,ElementHandle<HTMLElement|SVGElement>>();let snapshotHash='';let sequence=0;
  const close=():Promise<void>=>{
    if(cleanup)return cleanup;closing=true;expectedShutdown=true;if(deadline)clearTimeout(deadline);
    cleanup=(async()=>{
      // If provisioning cannot settle promptly, exiting this service forces
      // systemd KillMode=control-group to terminate every launch descendant.
      const timer=setTimeout(()=>process.exit(1),5000);
      try{const candidate=browser??await launching?.catch(()=>undefined);if(candidate)await candidate.close();browser=undefined;launching=undefined;occupied=false;}
      finally{clearTimeout(timer);}
    })();return cleanup;
  };
  const disconnect=()=>{void close().finally(()=>rpc.close());};
  rpc.on('closed',disconnect);
  const snapshot=async(replaceRefs=true):Promise<PageSnapshot>=>{
    requireThat(page&&!page.isClosed(),'Browser page is closed');
    if(replaceRefs){for(const h of handles.values())void h.dispose();handles=new Map();}
    const title=(await page.title()).slice(0,300);const text=(await page.locator('body').innerText({timeout:2000})).slice(0,18000);
    const elements:PageSnapshot['elements']=[];
    const candidates=await page.$$('a,button,input,select,textarea,[role="button"],[role="checkbox"]');
    for(const h of candidates.slice(100))void h.dispose();
    for(const h of candidates.slice(0,100)) {
      if(!await h.isVisible()){await h.dispose();continue;}
      const item=await h.evaluate((el:any)=>({tag:el.tagName.toLowerCase(),role:el.getAttribute('role')??'',name:(el.getAttribute('aria-label')??el.labels?.[0]?.innerText??el.innerText??el.getAttribute('placeholder')??'').slice(0,200),type:el.getAttribute('type')??'',value:el.type==='password'||el.type==='file'?'':(el.value??'').slice(0,1000),checked:!!el.checked,href:el.getAttribute('href')??''}));
      const ref=`e${sequence}-${elements.length}`;if(replaceRefs)handles.set(ref,h);else void h.dispose();elements.push({ref,...item});
    }
    const data={url:page.url(),title,text,elements};snapshotHash=computerHash(JSON.stringify({...data,elements:elements.map(({ref:_,...v})=>v)}));
    return {...data,hash:snapshotHash};
  };
  const stablePage=async()=>{
    requireThat(page,'No browser page');
    const old=snapshotHash;const current=await snapshot(false);requireThat(current.hash===old,'Page changed; take a fresh snapshot');return current;
  };
  rpc.handler=async(method,args)=>{
    if(method==='status')return {epoch,session:session??null,active:!!browser||!!launching};
    if(method==='close'){await close();return {shutdown_confirmed:true,epoch};}
    requireThat(!closing&&!busy,'Browser action is already running');busy=true;
    try {
      if(method==='launch') {
        const a=strictObject(args,['session_id','maxRuntimeSeconds']);requireThat(!session&&typeof a.session_id==='string'&&Number.isInteger(a.maxRuntimeSeconds)&&Number(a.maxRuntimeSeconds)>=10&&Number(a.maxRuntimeSeconds)<=900,'Invalid browser launch');session=a.session_id;
        deadline=setTimeout(disconnect,Number(a.maxRuntimeSeconds)*1000);
        launching=chromium.launch({executablePath:'/opt/botsquad-browser/launch.py',chromiumSandbox:true,headless:true,timeout:20000,
          env:{LANG:'C.UTF-8',TZ:'UTC'},args:['--disable-background-networking','--disable-extensions','--disable-component-update','--force-webrtc-ip-handling-policy=disable_non_proxied_udp']});
        browser=await launching;requireThat(!closing,'Browser provisioning was cancelled');
        browser.on('disconnected',()=>{if(!expectedShutdown)rpc.close();});
        context=await browser.newContext({viewport:{width:1024,height:768},acceptDownloads:false,serviceWorkers:'block',permissions:[],javaScriptEnabled:true});
        await context.routeWebSocket('**/*',ws=>ws.close());
        await context.route('**/*',async route=>{
          try {
            const r=route.request();if(!page||r.frame().page()!==page){await route.abort('blockedbyclient');return;}const result=await rpc.call<BrowserResponse>('network',{session_id:session,url:r.url(),method:r.method(),headers:r.headers(),body:r.postDataBuffer()?.toString('base64')??'',resourceType:r.resourceType()},15000);
            if(result)await route.fulfill({status:result.status,headers:result.headers,body:Buffer.from(result.body,'base64')});else await route.abort('blockedbyclient');
          } catch {await route.abort('blockedbyclient').catch(()=>{});}
        });
        page=await context.newPage();context.on('page',p=>{if(p!==page)void p.close();});
        page.on('dialog',dialog=>void dialog.dismiss());page.on('filechooser',()=>{});
        page.on('download',d=>void d.cancel());
        page.on('framenavigated',frame=>{if(frame===page?.mainFrame()&&frame.url()!=='about:blank'&&!/^https?:\/\//.test(frame.url()))disconnect();});
        return {epoch,browser:browser.version(),viewport:{width:1024,height:768}};
      }
      requireThat(page&&browser&&context,'Browser is not active');
      const a=strictObject(args,['session_id','action','url','ref','text','key','delta','page_hash','request','allowed_origins']);requireThat(a.session_id===session,'Browser session mismatch');
      const action=a.action;requireThat(typeof action==='string','Missing browser action');
      if(action==='snapshot')sequence++;
      else if(action==='navigate') {requireThat(typeof a.url==='string'&&/^https?:\/\//.test(a.url),'Navigation scheme denied');await page.goto(a.url,{waitUntil:'domcontentloaded',timeout:10000});sequence++;}
      else if(action==='execute_approved') {
        // Freeze page timers before measuring the exact approved checkpoint.
        // No page-world fetch may consume authority or supply the effect receipt.
        const cdp=await context.newCDPSession(page);try{await cdp.send('Page.setWebLifecycleState',{state:'frozen'});}finally{await cdp.detach();}
        const before=await stablePage();requireThat(a.page_hash===before.hash,'Approved page has changed');
        return {snapshot:before};
      } else if(action==='resume_approved') {
        const cdp=await context.newCDPSession(page);try{await cdp.send('Page.setWebLifecycleState',{state:'active'});}finally{await cdp.detach();}sequence++;
      } else {
        const ref=String(a.ref??'');const handle=handles.get(ref);
        // Retain the handle across freshness measurement; it cannot be substituted
        // by a page-authored CSS selector. Rebuild refs only after the action.
        const current=await stablePage();requireThat(a.page_hash===current.hash,'Element observation is stale; take a new snapshot');
        if(action==='scroll') {requireThat(Number.isInteger(a.delta)&&Math.abs(Number(a.delta))<=1500,'Invalid scroll');await page.mouse.wheel(0,Number(a.delta));}
        else {
          requireThat(handle,'Unknown or stale element reference');
          const href=await handle.getAttribute('href');if(href){const target=new URL(href,page.url());requireThat(/^https?:$/.test(target.protocol)&&Array.isArray(a.allowed_origins)&&a.allowed_origins.includes(target.origin),'Element navigation is outside approved origins');}
          const type=(await handle.getAttribute('type'))?.toLowerCase();requireThat(type!=='file'&&type!=='password','File and credential controls are unavailable');
          if(action==='click')await handle.click({timeout:5000});
          else if(action==='type'){requireThat(typeof a.text==='string'&&a.text.length<=2000,'Invalid typed text');await handle.fill(a.text,{timeout:3000});}
          else if(action==='press'){requireThat(['Tab','Enter','Space','ArrowDown','ArrowUp','Escape'].includes(String(a.key)),'Key denied');await handle.press(String(a.key),{timeout:3000});}
          else throw new Error('Browser action unavailable');
        }
        sequence++;
      }
      const result=await snapshot();
      const screenshot=action==='snapshot'?(await page.screenshot({type:'png',timeout:5000})).toString('base64'):undefined;
      requireThat(!screenshot||screenshot.length<=2796204,'Screenshot exceeds two MiB');return {snapshot:result,screenshot};
    } finally {busy=false;}
  };
});
server.listen(socketPath,()=>chmodSync(socketPath,0o660));
process.on('SIGTERM',()=>{server.close();process.exit(0);});
