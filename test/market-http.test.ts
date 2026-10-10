import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { FixtureHttpAdapter } from '../src/control/market/fixture-adapter.js';
import { OpenFigiProbe, parseFigi } from '../src/control/market/openfigi.js';
const request={instrumentId:'invented',session:'2026-03-06',field:'regular_open' as const};
test('fixture HTTP adapter confines transport to literal loopback, rejects redirects and caps actual bytes',async t=>{
 let status=200,body='{}',target='',content='application/json';const server=createServer((req,res)=>{target=req.url!;res.writeHead(status,{'content-type':content,location:'https://example.invalid/forbidden'});res.end(body);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise<void>(resolve=>server.close(()=>resolve())));
 const address=server.address();assert.ok(address&&typeof address!=='string');const url=`http://127.0.0.1:${address.port}/fixture/prices`,adapter=new FixtureHttpAdapter(url);
 assert.deepEqual(await adapter.read(request,AbortSignal.timeout(1000),100),{status:200,contentType:'application/json',body:'{}',retryAfterSeconds:null});assert.equal(target,'/fixture/prices');
 body='x'.repeat(101);await assert.rejects(adapter.read(request,AbortSignal.timeout(1000),100),/response_size/);
 status=302;await assert.rejects(adapter.read(request,AbortSignal.timeout(1000),100));status=200;body='layout';content='text/html';assert.equal((await adapter.read(request,AbortSignal.timeout(1000),100)).contentType,'text/html');
 for(const endpoint of ['http://localhost:123/fixture/prices','https://127.0.0.1/fixture/prices','http://127.0.0.1/other','https://api.example.invalid/fixture/prices',url+'?key=secret'])assert.throws(()=>new FixtureHttpAdapter(endpoint),/fixture_endpoint/);
});
test('OpenFIGI parser distinguishes FIGI levels and does not manufacture an execution venue',()=>{
 const body=JSON.stringify([{data:[{figi:'BBG000BLNNH6',compositeFIGI:'BBG000BLNNH6',shareClassFIGI:'BBG001S5S399',ticker:'IBM',name:'Documented example',exchCode:'US',securityType:'Common Stock'}]}]);
 const r=parseFigi(body,'2026-10-10T07:00:00Z');assert.deepEqual(r.publicationFields,['figi','compositeFIGI','shareClassFIGI']);assert.equal(r.identities[0]!.exchangeCode,'US');assert.equal('venue' in r.identities[0]!,false);
 for(const body of ['[]','[{"warning":"No identifier"}]','[{"data":[]}]','[{"data":[{"figi":"invalid"}]}]'])assert.throws(()=>parseFigi(body,'2026-10-10T07:00:00Z'));
});
test('OpenFIGI one-shot probe rejects a second invocation even after network failure',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('Synthetic network error');};
 try{const probe=new OpenFigiProbe();await assert.rejects(probe.mapDocumentedExample(),/Synthetic/);await assert.rejects(probe.mapDocumentedExample(),/budget_exhausted/);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
