import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import fs, { mkdtempSync, realpathSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import type { ClientRequest, IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { FinancialAdmission } from '../src/control/market/financial-admission.js';
import { YahooHistoryCustody, isDirectHistoryCustody, isOwnerHistory, ownerDirectRoot, removeOwnedHistoryCapsule } from '../src/control/market/yahoo-history-custody.js';
import { directManifest, directLimits, qualifyDirectQuery, verifyDirectManifest } from '../src/control/market/yahoo-direct-manifest.js';
import { historyManifest, verifyHistoryManifest } from '../src/control/market/yahoo-history-manifest.js';
import { yahooProbeTransport, type YahooWire } from '../src/control/market/yahoo-https.js';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { inspectHistory } from '../src/control/market/yahoo-history-report.js';
import { superviseHistory } from '../scripts/yahoo-history.js';
import { startHistoryWatchdog } from '../src/control/market/yahoo-history-watchdog.js';
import { chart } from './fixtures/yahoo/support.js';
import type { YahooQuery } from '../src/domain/market/financial.js';
const source='a'.repeat(64);
function fixture(t:TestContext){
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'yahoo-direct-'))),root=join(parent,'anchor');
 const m=directManifest(new Date().toISOString(),source),custody=YahooHistoryCustody.offline(root,m),db=new Store(':memory:'),market=new MarketStore(db),store=new FinancialStore(market,custody);
 for(const [kind,value] of [['policy',m.policy],['instrument',m.instrument],['calendar',m.calendar]] as const)market.register(value,kind,m.preparedAt);store.initialize(m.scope);
 const data=chart(),row=data.chart.result[0]!,sessions=m.calendar.calendar.sessions.filter(s=>s.status==='open'&&s.date>='2026-09-01'&&s.date<'2026-10-01');
 row.meta.symbol='AAPL';row.meta.exchangeName='NMS';row.timestamp=sessions.map(s=>Date.parse(s.open)/1000);
 row.indicators.quote=[{open:sessions.map(()=>10),high:sessions.map(()=>12),low:sessions.map(()=>9),close:sessions.map(()=>11),volume:sessions.map(()=>100)}];row.indicators.adjclose=[{adjclose:sessions.map(()=>8)}];row.events={dividends:{},splits:{}} as never;
 t.after(()=>{custody.destroy();db.close();rmSync(parent,{recursive:true,force:true});});
 return {parent,root,m,custody,store,db,data,accounting:()=>readFileSync(join(root,'accounting.jsonl'),'utf8').trim().split('\n').map(s=>JSON.parse(s))};
}
type Fixture=ReturnType<typeof fixture>;
function wire(f:Fixture,change:Partial<{status:number;body:string;headers:IncomingMessage['headers'];pending:boolean;information:number;upgrade:boolean}>={}){
 let dns=0,requests=0;const queries:YahooQuery[]=[];let late=()=>{};
 const driver:YahooWire={lookup:(async()=>{dns++;assert.ok(existsSync(join(f.root,'spent.json')));return [{address:'1.1.1.1',family:4}];}) as unknown as typeof lookup,
 request:((url:URL,opts:RequestOptions,cb:(res:IncomingMessage)=>void)=>{
  requests++;queries.push({method:'GET',url:url.origin+url.pathname,params:Object.fromEntries(url.searchParams)});
  assert.equal(opts.rejectUnauthorized,true);assert.equal(opts.servername,'query1.finance.yahoo.com');assert.equal(opts.family,4);assert.equal((opts as RequestOptions&{autoSelectFamily:boolean}).autoSelectFamily,false);assert.equal(opts.agent,false);assert.equal(opts.maxHeaderSize,16384);
  assert.deepEqual(opts.headers,{'User-Agent':'BotSquad/0.1 private personal research','Accept':'application/json, text/plain','Accept-Encoding':'identity'});
  const req=new EventEmitter() as ClientRequest;req.destroy=(()=>req) as ClientRequest['destroy'];req.end=(()=>{queueMicrotask(()=>{
   const res=new PassThrough() as unknown as IncomingMessage;res.statusCode=change.status??200;res.headers={'content-type':'application/json',...change.headers};
   if(change.information)req.emit('information',{statusCode:change.information,headers:{}});
   if(change.upgrade){res.statusCode=101;req.emit('upgrade',res,{destroy(){}},Buffer.alloc(0));}else cb(res);
   late=()=>{(res as unknown as PassThrough).end(change.body??JSON.stringify(f.data));};if(!change.pending)late();
  });return req;}) as ClientRequest['end'];return req;
 }) as typeof httpsRequest};
 const transport=yahooProbeTransport(f.custody,driver);
 const gateway=new FinancialDataGateway(f.store,{now:()=>new Date().toISOString()},new PythonYahooAdapter(f.custody.capsulePath,'hq-ready-03h-direct-chart'),transport);
 return {driver,transport,gateway,get dns(){return dns;},get requests(){return requests;},queries,late:()=>late(),collect:(signal?:AbortSignal)=>gateway.collect(f.m.policy.id,f.m.reads[0]!,'direct-custody',signal)};
}
test('03H manifest and opaque identity do not widen legacy authority or accept forged profiles',t=>{
 const f=fixture(t);verifyDirectManifest(f.m);assert.throws(()=>verifyHistoryManifest(f.m));assert.throws(()=>verifyDirectManifest(historyManifest(f.m.preparedAt,source)));
 assert.equal(f.m.sequence.length,1);assert.equal(f.m.scope.maxRequests,1);assert.equal(f.m.scope.maxTotalBytes,262144);assert.equal(f.m.scope.maxRetries,0);assert.deepEqual(f.m.limits,directLimits);
 assert.equal(isDirectHistoryCustody(f.custody),true);assert.equal(isOwnerHistory(f.custody),false);assert.throws(()=>yahooProbeTransport(f.custody));
 for(const value of [{direct:true},Object.create(YahooHistoryCustody.prototype),JSON.parse(JSON.stringify(f.custody))])assert.equal(isDirectHistoryCustody(value),false);
 for(const edit of [(m:typeof f.m)=>m.scope.maxRequests++,(m:typeof f.m)=>m.limits={...m.limits,requests:2},(m:typeof f.m)=>m.sequence.push(m.sequence[0]!), (m:typeof f.m)=>m.policy.rights.public_display.status='allowed']){const m=structuredClone(f.m);edit(m);assert.throws(()=>verifyDirectManifest(m));}
 const old=process.env.HOME;process.env.HOME=f.parent;assert.ok(!ownerDirectRoot().startsWith(f.parent));process.env.HOME=old;
});
test('all direct query expansions reject before DNS, including redacted crumb and duplicates',t=>{
 const f=fixture(t),q=f.m.sequence[0]!;
 const wrong:YahooQuery[]=[{...q,url:q.url.replace('query1','query2')},{...q,url:'https://fc.yahoo.com/',params:{}},{...q,url:'https://query1.finance.yahoo.com/v1/test/getcrumb',params:{}},{...q,url:q.url+'?crumb=x'},{...q,url:q.url+'?interval=1d'},{...q,url:q.url.replace('https://','https://user:pass@')},{...q,params:{...q.params,crumb:'x'}},{...q,params:{...q.params,extra:'x'}},{...q,params:{...q.params,period2:1790913600}}];
 for(const query of wrong)assert.throws(()=>qualifyDirectQuery(f.m,f.m.reads[0]!,query,1));assert.throws(()=>qualifyDirectQuery(f.m,f.m.reads[0]!,q,2));
 const w=wire(f);f.custody.begin(f.store,w.transport,f.m.reads[0]!);for(const query of wrong)assert.throws(()=>f.custody.reserve(query,262144));assert.equal(w.dns,0);
});
test('one direct wire, pinned parser, existing gateway and private custody qualify authored 21 sessions then permanently stop',async t=>{
 const f=fixture(t),w=wire(f,{headers:{'set-cookie':['malformed-cookie-not-parsed-private-canary']}}),result=await w.collect();assert.equal(result.status,'ok',result.reason);assert.equal(w.dns,1);assert.equal(w.requests,1);
 const e=f.store.observation(result.observationId!),quality=inspectHistory(e,f.m);assert.equal(e.rawResponses.length,1);assert.equal(e.rawResponses[0]!.body,JSON.stringify(f.data));assert.equal(quality.sessionCoverage.count,21);assert.equal(quality.executionQualified,false);assert.equal(quality.providerAvailableAt,null);assert.equal(quality.fields.volume!.present,21);
 assert.throws(()=>new FinancialAdmission(f.store,{now:()=>new Date().toISOString()}).deliver(e.id,'employee','delivery'),/use_denied/);
 await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));assert.equal(w.dns,1);
 f.custody.finish(result,e);f.custody.destroy();assert.equal(existsSync(f.custody.capsulePath),false);assert.throws(()=>YahooHistoryCustody.reopenOffline(f.root,source));assert.equal(JSON.parse(readFileSync(join(f.root,'spent.json'),'utf8')).noResume,true);
 assert.ok(!readFileSync(join(f.root,'accounting.jsonl'),'utf8').includes('private-canary'));
});
for(const status of [201,301,401,403,404,429,500,502,503,504])test(`direct HTTP${status} stops at headers with zero consumed body and no retry`,async t=>{
 const f=fixture(t),w=wire(f,{status,body:'private-rejected-body'}),result=await w.collect();assert.notEqual(result.status,'ok');assert.equal(w.dns,1);assert.equal(w.requests,1);
 const receipt=f.accounting().find(v=>v.type==='received');assert.equal(receipt.status,status);assert.equal(receipt.complete,false);assert.equal(receipt.receivedBytes,0);assert.equal(receipt.diagnostic.lastConfirmed.stage,'response_headers');
 await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));assert.equal(w.dns,1);assert.equal(result.observationId,null);
 assert.ok(!readFileSync(join(f.custody.capsulePath,'evidence.aes256gcm')).includes(Buffer.from('private-rejected-body')));
});
for(const header of ['location','refresh','www-authenticate','proxy-authenticate'])test(`direct 200 ${header} barrier stops before data consumption`,async t=>{
 const f=fixture(t),w=wire(f,{headers:{[header]:'private-barrier'}}),result=await w.collect();assert.equal(result.observationId,null);assert.equal(w.dns,1);assert.equal(f.accounting().find(v=>v.type==='received').receivedBytes,0);
});
for(const bytes of [262144,262145])test(`direct application byte bound ${bytes}`,async t=>{
 const f=fixture(t),body=JSON.stringify(f.data).padEnd(bytes,' '),w=wire(f,{body}),result=await w.collect();assert.equal(result.status,bytes===262144?'ok':'unknown',result.reason);assert.equal(w.dns,1);assert.ok(f.accounting().find(v=>v.type==='received').receivedBytes<=262144);
});
test('direct cancellation with late response stays spent and admits no second DNS',async t=>{
 const f=fixture(t),w=wire(f,{pending:true}),controller=new AbortController(),pending=w.collect(controller.signal);
 while(!w.requests)await new Promise(r=>setTimeout(r,10));controller.abort();const result=await pending;assert.equal(result.observationId,null);w.late();
 await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));assert.equal(w.dns,1);assert.throws(()=>YahooHistoryCustody.reopenOffline(f.root,source));
});
test('direct wire timeout blocks response and no replay after spent consumption',async t=>{
 const f=fixture(t),w=wire(f,{pending:true});f.custody.begin(f.store,w.transport,f.m.reads[0]!);
 const pending=w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144);await assert.rejects(pending,/timeout/);
 await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));assert.equal(w.dns,1);assert.equal(f.accounting().find(v=>v.type==='received').complete,false);
});
test('direct reservation fsync failure precedes DNS and permanently stops custody',async t=>{
 const f=fixture(t),w=wire(f);f.custody.begin(f.store,w.transport,f.m.reads[0]!);
 const broken=t.mock.method(fs,'fsyncSync',()=>{throw new Error('private-fsync-canary');});syncBuiltinESMExports();
 try{await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));}finally{broken.mock.restore();syncBuiltinESMExports();}
 assert.equal(w.dns,0);assert.throws(()=>f.custody.check());assert.throws(()=>YahooHistoryCustody.reopenOffline(f.root,source));
});
async function child(script:string,args:string[]){return new Promise<string>((resolve,reject)=>{const p=spawn(process.execPath,['--input-type=module','-e',script,...args],{stdio:['ignore','pipe','ignore']});let out='';p.stdout.on('data',b=>out+=String(b));p.once('error',reject);p.once('exit',()=>resolve(out.trim()));});}
test('direct two-process consumption race has one winner and cannot delete winner capsule',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-race-'))),root=join(parent,'anchor');t.after(()=>rmSync(parent,{recursive:true,force:true}));YahooHistoryCustody.prepareOffline(root,directManifest(new Date().toISOString(),source));
 const module=new URL('../src/control/market/yahoo-history-custody.js',import.meta.url).href;
 const script=`import {YahooHistoryCustody} from ${JSON.stringify(module)};import {existsSync} from 'node:fs';try{const c=YahooHistoryCustody.reopenOffline(process.argv[1],process.argv[2]);await new Promise(r=>setTimeout(r,150));console.log(existsSync(c.capsulePath)?'WIN':'DELETED');c.destroy();}catch{console.log('DENIED')}`;
 assert.deepEqual((await Promise.all([child(script,[root,source]),child(script,[root,source])])).sort(),['DENIED','WIN']);
});
test('direct SIGKILL preserves spent, ciphertext and identity-safe cleanup without replay',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-crash-'))),root=join(parent,'anchor');t.after(()=>rmSync(parent,{recursive:true,force:true}));YahooHistoryCustody.prepareOffline(root,directManifest(new Date().toISOString(),source));
 const module=new URL('../src/control/market/yahoo-history-custody.js',import.meta.url).href;
 await child(`import {YahooHistoryCustody} from ${JSON.stringify(module)};const c=YahooHistoryCustody.reopenOffline(process.argv[1],process.argv[2]);c.seal({private:'PRIVATE_DIRECT_CANARY'});process.kill(process.pid,'SIGKILL');`,[root,source]);
 assert.equal(JSON.parse(readFileSync(join(root,'spent.json'),'utf8')).noResume,true);assert.throws(()=>YahooHistoryCustody.reopenOffline(root,source));assert.ok(!readFileSync(join(root,'capsule','evidence.aes256gcm')).includes(Buffer.from('PRIVATE_DIRECT_CANARY')));
 removeOwnedHistoryCapsule(root,join(root,'capsule'));assert.equal(existsSync(join(root,'capsule')),false);assert.throws(()=>YahooHistoryCustody.reopenOffline(root,source));
});
test('direct supervisor independently refuses a second wire permit',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-supervisor-')));t.after(()=>rmSync(parent,{recursive:true,force:true}));const file=join(parent,'child.mjs');
 writeFileSync(file,`if(process.argv[2]==='cleanup')process.exit(0);process.on('message',m=>{if(m.command==='consume')process.send({wireBegin:1});if(m.wirePermit===1){process.send({wireSettled:1});process.send({wireBegin:2});}if(m.wirePermit===2)throw Error('second_permit');});process.send({ready:true});`);
 const result=await superviseHistory(file,['data'],['cleanup'],{operationMs:3000,wireMs:1000,processMs:5000,requests:1},'HQ-READY-03H');assert.equal(result.supervisedWirePermits,1);assert.equal(result.killed,true);assert.equal(result.cleanupVerified,true);
});
test('native direct watchdog independently refuses ordinal2',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-watchdog-')));t.after(()=>rmSync(parent,{recursive:true,force:true}));const file=join(parent,'child.mjs');writeFileSync(file,'process.exit(0)');
 const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});const exited=new Promise(r=>p.once('exit',r));
 const guard=await startHistoryWatchdog(file,[],{operationMs:3000,wireMs:1000,processMs:5000,requests:1});
 try{await guard.command('data',p.pid!);await guard.command('wire',1);await guard.command('settled',1);await assert.rejects(guard.command('wire',2));await exited;assert.equal(await guard.done(),1);}finally{try{process.kill(-p.pid!,'SIGKILL');}catch{}}
});

test('cancel during asynchronous watchdog startup prevents data spawn and consumption',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-startup-cancel-')));t.after(()=>rmSync(parent,{recursive:true,force:true}));const file=join(parent,'child.mjs'),marker=join(parent,'spawned');
 writeFileSync(file,`import {writeFileSync} from 'node:fs';if(process.argv[2]==='cleanup')process.exit(0);writeFileSync(${JSON.stringify(marker)},'unexpected');process.send({ready:true});`);
 const pending=superviseHistory(file,['data'],['cleanup'],{operationMs:3000,wireMs:1000,processMs:5000,requests:1},'HQ-READY-03H');
 process.emit('SIGTERM');await assert.rejects(pending,/supervisor_cancelled/);assert.equal(existsSync(marker),false);
});
test('direct response settlement fsync failure retains spent and forbids all subsequent DNS',async t=>{
 const f=fixture(t),w=wire(f),original=f.custody.received.bind(f.custody);
 t.mock.method(f.custody,'received',(...args:Parameters<typeof original>)=>{
  const broken=t.mock.method(fs,'fsyncSync',()=>{throw new Error('private-settlement-canary');});syncBuiltinESMExports();
  try{return original(...args);}finally{broken.mock.restore();syncBuiltinESMExports();}
 });
 const result=await w.collect();assert.equal(result.status,'unknown');assert.equal(result.observationId,null);
 await assert.rejects(()=>w.transport.exchange(f.m.sequence[0]!,new AbortController().signal,262144));assert.equal(w.dns,1);assert.throws(()=>YahooHistoryCustody.reopenOffline(f.root,source));
});
test('direct crash before capsule ownership receipt retains spent and refuses unproven empty-directory deletion',async t=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'direct-orphan-'))),root=join(parent,'anchor');t.after(()=>rmSync(parent,{recursive:true,force:true}));YahooHistoryCustody.prepareOffline(root,directManifest(new Date().toISOString(),source));
 const module=new URL('../src/control/market/yahoo-history-custody.js',import.meta.url).href;
 await child(`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {YahooHistoryCustody} from ${JSON.stringify(module)};const original=fs.openSync;fs.openSync=(path,...args)=>{if(String(path).endsWith('/capsule.json'))process.kill(process.pid,'SIGKILL');return original(path,...args)};syncBuiltinESMExports();YahooHistoryCustody.reopenOffline(process.argv[1],process.argv[2]);`,[root,source]);
 assert.equal(JSON.parse(readFileSync(join(root,'spent.json'),'utf8')).noResume,true);assert.deepEqual(fs.readdirSync(join(root,'capsule')),[]);assert.equal(existsSync(join(root,'accounting.jsonl')),false);assert.throws(()=>removeOwnedHistoryCapsule(root,join(root,'capsule')));assert.throws(()=>YahooHistoryCustody.reopenOffline(root,source));
});
test('direct action-bearing sample preserves provider event times and reports only quality',async t=>{
 const f=fixture(t),row=f.data.chart.result[0]!,stamp=row.timestamp[0]!+60;
 row.events={dividends:{[stamp]:{date:stamp,amount:0.125,currency:'CAD'}},splits:{[stamp]:{date:stamp,numerator:2,denominator:1,splitRatio:'2:1'}}} as never;
 const w=wire(f),result=await w.collect();assert.equal(result.status,'ok',result.reason);const e=f.store.observation(result.observationId!),q=inspectHistory(e,f.m),output=JSON.parse(e.adapterOutput);
 assert.equal(output.data.rows[0].dividend.timestamp,new Date(stamp*1000).toISOString().replace('.000Z','Z'));assert.equal(output.data.rows[0].dividend.currency,'CAD');assert.equal(q.actions.dividends.count,1);assert.equal(q.actions.splits.count,1);assert.equal(q.actions.dividends.publicationAndPaymentTimes,'unknown');assert.ok(!JSON.stringify(q).includes('0.125'));
});

for(const information of [100,102,103])test(`direct stops on HTTP${information} informational headers before following200`,async t=>{
 const f=fixture(t),w=wire(f,{information}),result=await w.collect();assert.equal(result.observationId,null);const receipt=f.accounting().find(v=>v.type==='received');assert.equal(receipt.status,information);assert.equal(receipt.complete,false);assert.equal(receipt.receivedBytes,0);assert.equal(w.dns,1);
});
test('direct rejects101 protocol upgrade without reading body',async t=>{
 const f=fixture(t),w=wire(f,{upgrade:true}),result=await w.collect();assert.equal(result.observationId,null);const receipt=f.accounting().find(v=>v.type==='received');assert.equal(receipt.status,101);assert.equal(receipt.receivedBytes,0);assert.equal(w.dns,1);
});
for(const headers of [{'content-type':'text/html'}, {location:''}, {'www-authenticate':''}])test('direct rejects HTML content type or empty barrier header at headers',async t=>{
 const f=fixture(t),w=wire(f,{headers}),result=await w.collect();assert.equal(result.observationId,null);assert.equal(f.accounting().find(v=>v.type==='received').receivedBytes,0);assert.equal(w.dns,1);
});

test('invalid first direct transport invocation burns session before any DNS and forbids valid follow-up',async t=>{
 const f=fixture(t),w=wire(f),q=f.m.sequence[0]!;f.custody.begin(f.store,w.transport,f.m.reads[0]!);
 await assert.rejects(()=>w.transport.exchange({...q,params:{...q.params,crumb:'invalid'}},new AbortController().signal,262144));
 await assert.rejects(()=>w.transport.exchange(q,new AbortController().signal,262144));assert.equal(w.dns,0);assert.equal(w.requests,0);
});
