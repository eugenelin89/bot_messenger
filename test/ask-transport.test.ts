import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createServer, request as httpsRequest } from 'node:https';
import { createSecureContext } from 'node:tls';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Duplex } from 'node:stream';
import { askOfflineClient, createAskHttpsClient, type AskRequestWire, type AskTransportOptions } from '../src/control/ask/transport.js';
import { prepareAskRequest, askReceiptIdentity, type AskOperation, type AskBoundaryContext } from '../src/domain/ask/contract.js';
import { verifySignedRequest, type SignedMessage } from '../scripts/investment-contracts/signatures.js';
import { problem } from '../scripts/investment-contracts/schema.js';
const examples=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
const fixture=<T>(name:string):T=>structuredClone(examples[name]);
const context=():AskBoundaryContext=>({scope:fixture('AskServiceScope'),limits:fixture('AskLimits'),now:'2026-01-05T21:32:00Z'});
const operations=():AskOperation[]=>[
  {kind:'claim',input:fixture('AskClaimInput')},
  {kind:'renew',requestId:'fixture-renew',claim:fixture('AskClaim'),input:fixture('AskRenewInput')},
  {kind:'status',requestId:'fixture-status',claim:fixture('AskClaim'),input:fixture('AskStatusDelivery')},
  {kind:'answer',requestId:'fixture-delivery',claim:fixture('AskClaim'),input:fixture('AskAnswerDelivery')},
  {kind:'receipt',identity:askReceiptIdentity(fixture('AskAnswer'))},
  {kind:'control_sync',input:fixture('AskControlSyncInput')},
];
const responseName=(kind:AskOperation['kind'])=>({claim:'AskClaimPage',renew:'AskClaim',status:'AskStatus',answer:'AskAnswerReceipt',receipt:'AskAnswerReceipt',control_sync:'AskControlSync'})[kind];
const signal=()=>new AbortController().signal;
function keys(){
  const pair=generateKeyPairSync('ed25519');let signs=0,enabled=true;
  return {pair,get signs(){return signs;},disable(){enabled=false;},enable(){enabled=true;},ring:{has:()=>enabled,sign:(_id:string,bytes:Buffer)=>{signs++;return sign(null,bytes,pair.privateKey);}}};
}

test('structural forged intents, revoked authority and missing keys cannot reach I/O or signer',async()=>{
  const k=keys(),ctx=context(),options:AskTransportOptions={keys:k.ring,current:()=>ctx};let calls=0;
  const client=askOfflineClient(options,(()=>{calls++;throw new Error('must not connect');}) as AskRequestWire);
  const op=operations()[3]!,intent=prepareAskRequest(op,ctx);
  for(const change of [{path:'/api/experiments/v1/private'},{origin:'https://evil.test'},{method:'PUT'},{body:'{}'},{bodyHash:'a'.repeat(64)},{permission:'claim'},{requestId:'other'},{binding:{...intent.binding,answerId:'other'}},{extra:'forged'}]){
    const result=await client.exchange(op,{...intent,...change} as typeof intent,signal());
    assert.deepEqual(result,{kind:'not_sent',code:'invalid_intent',status:null});
  }
  ctx.scope.enabled=false;assert.equal((await client.exchange(op,intent,signal())).kind,'not_sent');
  ctx.scope.enabled=true;k.disable();assert.deepEqual(await client.exchange(op,intent,signal()),{kind:'not_sent',code:'key_unavailable',status:null});
  assert.equal(calls,0);assert.equal(k.signs,0);
  assert.throws(()=>askOfflineClient(options,httpsRequest),/offline_wire/);
  // Production factory stays inert until explicitly called, even with absent authority.
  createAskHttpsClient(options);assert.equal(calls,0);
});

test('real local TLS exercises the fixed Ask transport without external DNS or sockets',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'ask-local-tls-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  execFileSync('/usr/bin/openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-days','1','-subj','/CN=asymmetri.co','-addext','subjectAltName=DNS:asymmetri.co'],{stdio:'ignore',timeout:10000});
  const cert=readFileSync(join(dir,'cert.pem')),key=readFileSync(join(dir,'key.pem')),secure=createSecureContext({key,cert}),k=keys();
  let ctx=context(),op=operations()[0]!,reply:unknown=fixture(responseName(op.kind)),mode='ok',trust=true,wrongHostname=false;
  let onSign:(()=>void)|undefined;
  let holdTls=false,releaseTls:(()=>void)|undefined,onTls:(()=>void)|undefined,onRequest:(()=>void)|undefined;
  const requests:SignedMessage[]=[],sockets=new Set<Duplex>();let connections=0,wireCalls=0,requestHeaders=0,decryptedBytes=0;
  const server=createServer({key,cert,SNICallback:(_name,callback)=>{
    if(holdTls){releaseTls=()=>callback(null,secure);onTls?.();}else callback(null,secure);
  }},(req,res)=>{
    requestHeaders++;
    const chunks:Buffer[]=[];req.on('data',part=>chunks.push(part));req.on('end',()=>{
      const body=Buffer.concat(chunks),headers:[string,string][]=[];
      for(let i=0;i<req.rawHeaders.length;i+=2)headers.push([req.rawHeaders[i]!,req.rawHeaders[i+1]!]);
      requests.push({method:req.method as SignedMessage['method'],authority:req.headers.host!,path:req.url!,headers,body});onRequest?.();
      const h={'Content-Type':'application/json','Cache-Control':'private, no-store'};
      if(mode==='hang')return;
      if(mode==='drop'){res.destroy();return;}
      if(mode==='redirect'){res.writeHead(302,{...h,Location:'https://evil.test/'});res.end('{}');return;}
      if(mode==='large'){res.writeHead(200,h);res.end('x'.repeat(262145));return;}
      if(mode==='problem-large'){res.writeHead(500,{...h,'Content-Type':'application/problem+json'});res.end('x'.repeat(8193));return;}
      if(mode==='declared-large'){res.writeHead(200,{...h,'Content-Length':'262145'});res.flushHeaders();return;}
      if(mode==='truncated'){res.writeHead(200,{...h,'Content-Length':'10000'});res.write('{}');setImmediate(()=>res.destroy());return;}
      if(mode==='headers-large'){res.writeHead(200,{...h,'X-Padding':'x'.repeat(20000)});res.end('{}');return;}
      if(mode==='duplicate'){res.writeHead(200,[...Object.entries(h).flat(),'Content-Type','application/json']);res.end('{}');return;}
      if(mode==='cookie'){res.writeHead(200,{...h,'Set-Cookie':'private-session=forbidden'});res.end('{}');return;}
      if(mode==='encoded'){res.writeHead(200,{...h,'Content-Encoding':'gzip'});res.end('{}');return;}
      if(mode==='public'){res.writeHead(200,{...h,'Cache-Control':'public, max-age=300'});res.end(JSON.stringify(reply));return;}
      if(mode==='bad-json'){res.writeHead(200,h);res.end('{"claim":null,"claim":null}');return;}
      if(mode==='bad-binding'){res.writeHead(200,h);res.end(JSON.stringify({...reply as object,claimRequestId:'wrong'}));return;}
      if(mode==='late')ctx={...ctx,now:'2026-01-05T21:41:00Z'};
      if(mode==='problem'){res.writeHead(401,{...h,'Content-Type':'application/problem+json'});res.end(JSON.stringify(problem('UNAUTHENTICATED','fixture-problem')));return;}
      res.writeHead(200,h);res.end(JSON.stringify(reply));
    });
  });
  server.on('secureConnection',socket=>socket.on('data',part=>{decryptedBytes+=part.length;}));
  server.on('connection',socket=>{connections++;sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  t.after(async()=>{for(const socket of sockets)socket.destroy();await new Promise<void>(r=>server.close(()=>r()));});
  const port=(server.address() as {port:number}).port;
  const wire:AskRequestWire=(options,callback)=>{
    wireCalls++;assert.equal(options.protocol,'https:');assert.equal(options.hostname,'asymmetri.co');assert.equal(options.port,443);
    assert.equal(options.servername,'asymmetri.co');assert.equal(options.rejectUnauthorized,true);assert.equal(options.agent,false);
    assert.equal(options.maxHeaderSize,16384);assert.equal(options.insecureHTTPParser,false);
    const request=httpsRequest({...options,hostname:'127.0.0.1',port,servername:wrongHostname?'wrong.invalid':'asymmetri.co',...(trust?{ca:cert}:{})},callback);
    if(mode==='end-throw')request.end=(()=>{throw new Error('private test failure');}) as typeof request.end;
    return request;
  };
  const client=askOfflineClient({keys:{has:k.ring.has,sign:(id,bytes)=>{const signature=k.ring.sign(id,bytes);onSign?.();return signature;}},current:()=>ctx},wire);
  const reset=(kind:AskOperation['kind']='claim')=>{ctx=context();op=operations().find(v=>v.kind===kind)!;reply=fixture(responseName(kind));mode='ok';trust=true;wrongHostname=false;holdTls=false;k.enable();releaseTls=undefined;onTls=undefined;onRequest=undefined;onSign=undefined;};
  const exchange=()=>client.exchange(op,prepareAskRequest(op,ctx),signal());
  for(const kind of ['claim','renew','status','answer','receipt','control_sync'] as const)await t.test(`${kind} signs exact fixed target and decodes its canonical response`,async()=>{
    reset(kind);const before=wireCalls,result=await exchange();assert.equal(result.kind,'response');assert.equal(wireCalls,before+1);
    const sent=requests.at(-1)!;verifySignedRequest(sent,{authority:'asymmetri.co',generation:ctx.scope.consumerGeneration,keyId:ctx.scope.keyId,publicKey:k.pair.publicKey,enabled:true,notBefore:0,notAfter:2000000000,now:Date.parse(ctx.now)/1000,usedNonces:new Set(),targets:new Set([`${sent.method} ${prepareAskRequest(op,ctx).path}`])});
    assert.equal(Buffer.from(sent.body).toString(),prepareAskRequest(op,ctx).body);
    if(kind==='receipt'){assert.equal(sent.body.length,0);assert.ok(!sent.headers.some(([n])=>['content-type','content-digest','idempotency-key','content-length'].includes(n.toLowerCase())));}
  });
  await t.test('explicit retry keeps exact bytes/key but uses a fresh signature nonce',async()=>{
    reset('answer');const frozen=prepareAskRequest(op,ctx);await client.exchange(op,frozen,signal());await client.exchange(op,frozen,signal());
    const [a,b]=requests.slice(-2);assert.deepEqual(a!.body,b!.body);
    const header=(m:SignedMessage,n:string)=>m.headers.find(([h])=>h.toLowerCase()===n)?.[1];
    assert.equal(header(a!,'idempotency-key'),header(b!,'idempotency-key'));assert.notEqual(header(a!,'signature-input'),header(b!,'signature-input'));
  });
  for(const failure of ['untrusted','hostname'])await t.test(`${failure} certificate fails before HTTP transmission`,async()=>{
    reset();trust=failure!=='untrusted';wrongHostname=failure==='hostname';const before=requests.length,headerCount=requestHeaders,bytes=decryptedBytes;
    const result=await exchange();assert.equal(result.kind,'not_sent');assert.equal(requests.length,before);assert.equal(requestHeaders,headerCount);assert.equal(decryptedBytes,bytes);
  });
  for(const change of ['scope','lease','key','same-key-revocation','abort'] as const)await t.test(`held TLS ${change} rechecks before any HTTP headers or private body`,async()=>{
    reset('answer');holdTls=true;const waiting=new Promise<void>(r=>{onTls=r;}),abort=new AbortController(),before=requests.length,headerCount=requestHeaders,bytes=decryptedBytes,signs=k.signs;
    const pending=client.exchange(op,prepareAskRequest(op,ctx),abort.signal);await waiting;
    if(change==='scope')ctx.scope.enabled=false;if(change==='lease')ctx.now='2026-01-05T21:35:00Z';
    if(change==='key')ctx.scope.keyId='new-key';if(change==='same-key-revocation')k.disable();if(change==='abort')abort.abort();
    if(change!=='abort')releaseTls!();
    assert.equal((await pending).kind,'not_sent');assert.equal(requests.length,before);assert.equal(requestHeaders,headerCount);assert.equal(decryptedBytes,bytes);assert.equal(k.signs,signs);
  });
  for(const change of ['clock','key'] as const)await t.test(`post-sign ${change} fence prevents all HTTP bytes`,async()=>{
    reset('answer');const headerCount=requestHeaders,bytes=decryptedBytes,signs=k.signs;
    onSign=()=>{if(change==='clock')ctx.now='2026-01-05T21:35:00Z';else k.disable();};
    assert.equal((await exchange()).kind,'not_sent');assert.equal(k.signs,signs+1);
    assert.equal(requestHeaders,headerCount);assert.equal(decryptedBytes,bytes);
  });
  await t.test('operation snapshot resists caller mutation while TLS is held',async()=>{
    reset('answer');holdTls=true;const waiting=new Promise<void>(r=>{onTls=r;}),frozen=prepareAskRequest(op,ctx);
    const pending=client.exchange(op,frozen,signal());await waiting;
    (op as Extract<AskOperation,{kind:'answer'}>).input.answer.text='mutated after call';releaseTls!();
    assert.equal((await pending).kind,'response');assert.equal(Buffer.from(requests.at(-1)!.body).toString(),frozen.body);
  });
  for(const responseMode of ['end-throw','drop','redirect','large','problem-large','declared-large','truncated','headers-large','duplicate','cookie','encoded','public','bad-json','bad-binding'])await t.test(`${responseMode} leaves one uncertain HTTP delivery and never retries`,async()=>{
    reset();mode=responseMode;const before=wireCalls,result=await exchange();assert.equal(result.kind,'unknown');assert.equal(wireCalls,before+1);assert.ok(!JSON.stringify(result).includes('forbidden'));
  });
  await t.test('valid 401 is a remote problem, never an automatic authentication retry',async()=>{
    reset();mode='problem';const before=wireCalls,result=await exchange();assert.equal(result.kind,'response');
    if(result.kind==='response')assert.deepEqual(result.response,{kind:'problem',code:'UNAUTHENTICATED',status:401,retryAfterSeconds:null});assert.equal(wireCalls,before+1);
  });
  await t.test('late answer receipts decode after claim expiry',async()=>{reset('answer');mode='late';assert.equal((await exchange()).kind,'response');});
  await t.test('abort before call sends nothing; abort after write retains uncertainty; concurrent call is rejected',async()=>{
    reset();const abort=new AbortController();abort.abort();const before=wireCalls;
    assert.deepEqual(await client.exchange(op,prepareAskRequest(op,ctx),abort.signal),{kind:'not_sent',code:'cancelled',status:null});assert.equal(wireCalls,before);
    mode='hang';const after=new AbortController(),received=new Promise<void>(r=>{onRequest=r;});
    const pending=client.exchange(op,prepareAskRequest(op,ctx),after.signal);await received;
    assert.deepEqual(await exchange(),{kind:'not_sent',code:'busy',status:null});after.abort();
    assert.deepEqual(await pending,{kind:'unknown',code:'cancelled',status:null});
  });
  await t.test('total deadline terminates a stalled response and keeps delivery unknown',async()=>{
    reset();mode='hang';const before=wireCalls,result=await exchange();assert.deepEqual(result,{kind:'unknown',code:'timeout',status:null});assert.equal(wireCalls,before+1);
  });
  await t.test('total deadline also bounds TLS setup without sending HTTP',async()=>{
    reset('answer');holdTls=true;const before=wireCalls,headerCount=requestHeaders,bytes=decryptedBytes;
    const result=await exchange();assert.deepEqual(result,{kind:'not_sent',code:'timeout',status:null});
    assert.equal(wireCalls,before+1);assert.equal(requestHeaders,headerCount);assert.equal(decryptedBytes,bytes);
  });
  assert.ok(connections>=requests.length);
});
