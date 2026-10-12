import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { ClientRequest,IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import { yahooOfflineWire,YahooHttpsTransport,type YahooWire } from '../src/control/market/yahoo-https.js';
import { qualifyYahooQuery } from '../src/domain/market/yahoo-transport.js';
import { request } from './fixtures/yahoo/support.js';
import type { YahooQuery } from '../src/domain/market/financial.js';
const query:YahooQuery={method:'GET',url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME',params:{range:'1d',interval:'1d'}};
function fakeWire(options:{addresses?:string[];status?:number;headers?:IncomingMessage['headers'];body?:string;pending?:boolean}={}) {
 let dns=0,sockets=0,destroyed=0;const requests:{url:string;options:RequestOptions}[]=[];
 const wire:YahooWire={lookup:(async()=>{dns++;return (options.addresses??['1.1.1.1']).map(address=>({address,family:4}));}) as unknown as typeof lookup,
  request:((url:URL,opts:RequestOptions,callback:(res:IncomingMessage)=>void)=>{
   sockets++;requests.push({url:url.href,options:opts});const req=new EventEmitter() as ClientRequest;
   req.destroy=(()=>{destroyed++;return req;}) as ClientRequest['destroy'];
   opts.signal?.addEventListener('abort',()=>{req.destroy();req.emit('error',new Error('fixture_abort'));},{once:true});
   req.end=(()=>{queueMicrotask(()=>{const res=new PassThrough() as unknown as IncomingMessage;res.statusCode=options.status??200;res.headers=options.headers??{'content-type':'application/json'};callback(res);if(!options.pending)(res as unknown as PassThrough).end(options.body??'{}');});return req;}) as ClientRequest['end'];return req;
  }) as typeof httpsRequest};return {wire,requests,get dns(){return dns;},get sockets(){return sockets;},get destroyed(){return destroyed;}};
}
test('production transport is inactive before DNS even for a valid endpoint; real drivers are forbidden in offline factory',async()=>{
 await assert.rejects(()=>new YahooHttpsTransport().exchange(query,new AbortController().signal,1024),/not_approved/);
 assert.throws(()=>yahooOfflineWire(request(),'ACME',{lookup,request:httpsRequest}),/requires_fakes/);
});
for(const bad of [
 {...query,url:'http://query2.finance.yahoo.com/v8/finance/chart/ACME'},
 {...query,url:'https://query2.finance.yahoo.com.evil.test/v8/finance/chart/ACME'},
 {...query,url:'https://u:p@query2.finance.yahoo.com/v8/finance/chart/ACME'},
 {...query,url:'https://127.0.0.1/v8/finance/chart/ACME'},
 {...query,url:'https://guce.yahoo.com/consent'},
 {...query,url:'https://query2.finance.yahoo.com/v8/finance/chart/MSFT'},
 {...query,url:'https://query2.finance.yahoo.com/v8/finance/chart/ACME?range=1d'},
 {...query,method:'POST' as never},
 {...query,params:{range:'max',interval:'1d'}},
 {...query,params:{range:'1d',interval:'1m'}},
 {...query,params:{range:'1d',interval:'1d',callback:'http://evil.test'}},
 {...query,params:{period1:1,period2:9999999999,interval:'1d'}},
])test(`deny endpoint/parameter before DNS ${JSON.stringify(bad)}`,async()=>{
 const f=fakeWire();await assert.rejects(()=>yahooOfflineWire(request(),'ACME',f.wire).exchange(bad,new AbortController().signal,1024));assert.equal(f.dns,0);assert.equal(f.sockets,0);
});
test('DNS rejects private/mixed answers and TLS pins a public address with verification',async()=>{
 for(const addresses of [['127.0.0.1'],['1.1.1.1','10.0.0.1'],['169.254.169.254']]){const f=fakeWire({addresses});await assert.rejects(()=>yahooOfflineWire(request(),'ACME',f.wire).exchange(query,new AbortController().signal,1024),/protected_address/);assert.equal(f.sockets,0);}
 const f=fakeWire();await yahooOfflineWire(request(),'ACME',f.wire).exchange(query,new AbortController().signal,1024);const opts=f.requests[0]!.options;assert.equal(opts.rejectUnauthorized,true);assert.equal(opts.agent,false);assert.equal(opts.servername,'query2.finance.yahoo.com');assert.equal((opts.headers as Record<string,string>)['Accept-Encoding'],'identity');
});
test('redirect is returned once without following Location; bodies and encodings are bounded',async()=>{
 const redirect=fakeWire({status:302,headers:{location:'https://evil.test'}});assert.equal((await yahooOfflineWire(request(),'ACME',redirect.wire).exchange(query,new AbortController().signal,1024)).status,302);assert.equal(redirect.sockets,1);
 for(const options of [{headers:{'content-length':'2048'}},{headers:{'content-encoding':'gzip'}},{body:'x'.repeat(1025)}]){const f=fakeWire(options);await assert.rejects(()=>yahooOfflineWire(request(),'ACME',f.wire).exchange(query,new AbortController().signal,1024),/size|compressed/);assert.ok(f.destroyed>0);}
});
test('cookies are ephemeral, secure, bounded and scoped to Yahoo; crumb is excluded from request receipts',async()=>{
 const f=fakeWire({headers:{'content-type':'text/plain','set-cookie':['A3=fixture-secret; Domain=.yahoo.com; Path=/; Secure; HttpOnly']}});const wire=yahooOfflineWire(request(),'ACME',f.wire);
 await wire.exchange({method:'GET',url:'https://fc.yahoo.com',params:{}},new AbortController().signal,1024);
 await wire.exchange({method:'GET',url:'https://query1.finance.yahoo.com/v1/test/getcrumb',params:{}},new AbortController().signal,1024);
 assert.equal((f.requests[1]!.options.headers as Record<string,string>).Cookie,'A3=fixture-secret');
 const second=fakeWire();await yahooOfflineWire(request(),'ACME',second.wire).exchange(query,new AbortController().signal,1024);assert.equal((second.requests[0]!.options.headers as Record<string,string>).Cookie,undefined);
 assert.equal(qualifyYahooQuery({...query,params:{...query.params,crumb:'fixture-secret'}},request(),'ACME').params.crumb,undefined);
 for(const cookie of ['x=y; Domain=.evil.test; Secure','x=y; Domain=.yahoo.com','x=y\r\nz']){const bad=fakeWire({headers:{'set-cookie':[cookie]}});await assert.rejects(()=>yahooOfflineWire(request(),'ACME',bad.wire).exchange(query,new AbortController().signal,1024),/cookie/);}
});
test('cancellation destroys pending wire and no second simultaneous request is admitted',async()=>{
 const f=fakeWire({pending:true}),wire=yahooOfflineWire(request(),'ACME',f.wire),abort=new AbortController();const pending=wire.exchange(query,abort.signal,1024);await new Promise(r=>setImmediate(r));
 await assert.rejects(()=>wire.exchange(query,new AbortController().signal,1024),/concurrent/);abort.abort();await assert.rejects(()=>pending,/abort/);assert.ok(f.destroyed>0);
});
