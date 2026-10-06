// Deterministic forwarder contracts. Transport/DNS are mocked here; actual Chromium
// and loopback exhaustion/redirect fixtures are covered separately on Ubuntu.
import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {forwardBrowserRequest} from '../src/computer/network.js';
import {parseComputerPolicy,canonicalBrowserRequest} from '../src/domain/computer.js';
const policy=parseComputerPolicy({origins:['https://example.com'],expiresAt:new Date(Date.now()+600000).toISOString()});
const request=canonicalBrowserRequest({url:'https://example.com/docs',method:'GET',body:'',headers:{},resourceType:'document'},policy);
function transport(t:TestContext,addresses:{address:string;family:number}[],headers:Record<string,string>={},chunks:Buffer[]=[Buffer.from('public document')]){
 let calls=0,lookups=0,options:any,target:URL|undefined;
 t.mock.method(dns,'lookup',async()=>{lookups++;return addresses as any;});
 t.mock.method(https,'request',((url:URL,opts:any,callback:any)=>{calls++;options=opts;target=url;const req:any=new EventEmitter();req.end=()=>queueMicrotask(()=>{const res:any=new EventEmitter();res.statusCode=headers.location?302:200;res.headers=headers;res.destroyed=false;res.destroy=()=>{res.destroyed=true;};callback(res);for(const chunk of chunks){if(res.destroyed)break;res.emit('data',chunk);}if(!res.destroyed)res.emit('end');});return req;}) as any);
 syncBuiltinESMExports();t.after(()=>{t.mock.restoreAll();syncBuiltinESMExports();});
 return {get calls(){return calls;},get lookups(){return lookups;},get options(){return options;},get target(){return target;}};
}
test('forwarder pins validated DNS answers into the actual socket lookup callback',async t=>{
 const addresses=[{address:'93.184.216.34',family:4},{address:'2606:4700:4700::1111',family:6}],mock=transport(t,addresses);let rechecks=0;
 const result=await forwardBrowserRequest(request,policy,new AbortController().signal,()=>rechecks++);assert.equal(result.status,200);assert.equal(mock.lookups,1);assert.equal(mock.calls,1);assert.equal(mock.target?.hostname,'example.com');assert.equal(mock.options.agent,false);assert.equal(rechecks,1);
 mock.options.lookup('example.com',{all:false},(err:unknown,address:string,family:number)=>{assert.equal(err,null);assert.equal(address,addresses[0]!.address);assert.equal(family,4);});
 mock.options.lookup('example.com',{all:true},(err:unknown,result:unknown)=>{assert.equal(err,null);assert.deepEqual(result,addresses);});assert.equal(mock.lookups,1);
});
test('mixed public/private DNS answers deny before authority consumption or HTTP invocation',async t=>{
 const mock=transport(t,[{address:'93.184.216.34',family:4},{address:'127.0.0.1',family:4}]);let consumed=false;
 await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal,()=>{consumed=true;}),/protected address/);assert.equal(mock.calls,0);assert.equal(consumed,false);
});
test('private IPv6 DNS and revoked pre-send authority fail without network transmission',async t=>{
 const mock=transport(t,[{address:'::ffff:169.254.169.254',family:6}]);await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal),/protected address/);assert.equal(mock.calls,0);
});
test('pre-send recheck can revoke after successful DNS and before any socket request',async t=>{
 const mock=transport(t,[{address:'93.184.216.34',family:4}]);await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal,()=>{throw Error('Owner revoked after DNS');}),/revoked/);assert.equal(mock.lookups,1);assert.equal(mock.calls,0);
});
test('same-origin credential/control redirect is denied before a second request',async t=>{
 const mock=transport(t,[{address:'93.184.216.34',family:4}],{location:'https://example.com/admin/users?access_token=fixture'});await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal),/Redirect origin denied/);assert.equal(mock.calls,1);
});
test('declared and streamed oversized responses both fail the two-MiB response ceiling',async t=>{
 const mock=transport(t,[{address:'93.184.216.34',family:4}],{},[Buffer.alloc(2097152),Buffer.from('overflow')]);await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal),/two MiB/);assert.equal(mock.calls,1);
});
test('untrusted content-length cannot admit a declared oversized response',async t=>{
 const mock=transport(t,[{address:'93.184.216.34',family:4}],{'content-length':'2097153'});await assert.rejects(()=>forwardBrowserRequest(request,policy,new AbortController().signal),/two MiB/);assert.equal(mock.calls,1);
});
