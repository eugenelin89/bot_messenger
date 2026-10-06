// Real Unix RPC handshakes with a synthetic broker, not Chromium acceptance.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Socket} from 'node:net';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ComputerRPC} from '../src/computer/ipc.js';
import {BrowserClient} from '../src/computer/client.js';

test('idle confirmation and cancelled connect acknowledge reservation release before immediate replacement',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'bs-ipc-')),path=join(dir,'broker.sock');
 let occupied=false,acknowledgements=0,launches=0;const sockets=new Set<Socket>();const timers=new Set<NodeJS.Timeout>();
 const server=createServer(socket=>{
  sockets.add(socket);if(occupied){socket.destroy();return;}occupied=true;let released=false;const rpc=new ComputerRPC(socket);
  const release=()=>{if(!released){released=true;occupied=false;}};
  rpc.handler=async method=>{
   if(method==='status')return {active:false,session:null};
   if(method==='close'){release();acknowledgements++;return {shutdown_confirmed:true};}
   if(method==='launch'){launches++;return {epoch:'synthetic',browser:'synthetic',viewport:{width:1024,height:768}};}
   throw Error('Unexpected method');
  };
  socket.on('close',()=>{sockets.delete(socket);const timer=setTimeout(()=>{timers.delete(timer);release();},200);timers.add(timer);});
 });
 await new Promise<void>(resolve=>server.listen(path,resolve));
 t.after(async()=>{for(const s of sockets)s.destroy();for(const timer of timers)clearTimeout(timer);await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});});
 const idle=new BrowserClient(path);assert.equal(await idle.confirmIdle(),true);assert.equal(acknowledgements,1);assert.equal(occupied,false);
 const immediate=new BrowserClient(path);await immediate.launch('computer-immediate',20,async()=>null,()=>{});assert.equal(launches,1);assert.equal(await immediate.close(),true);
 const cancelled=new BrowserClient(path);const pending=cancelled.launch('computer-cancelled',20,async()=>null,()=>{});const rejection=assert.rejects(pending,/cancelled/);assert.equal(await cancelled.close(),true);await rejection;assert.equal(launches,1);assert.equal(occupied,false);
 const replacement=new BrowserClient(path);await replacement.launch('computer-replacement',20,async()=>null,()=>{});assert.equal(launches,2);assert.equal(await replacement.close(),true);assert.equal(acknowledgements,4);
});
