import { createConnection } from 'node:net';
import { ComputerRPC } from './ipc.js';
import type { BrowserRequest,BrowserResponse,PageSnapshot,CanonicalRequest } from '../domain/computer.js';

export interface BrowserEnvironment {
  launch(sessionId:string,seconds:number,onNetwork:(request:BrowserRequest)=>Promise<BrowserResponse|null>,onLost:()=>void):Promise<{epoch:string;browser:string;viewport:{width:number;height:number}}>;
  action(sessionId:string,action:string,args:Record<string,unknown>):Promise<{snapshot:PageSnapshot;screenshot?:string;mutation?:unknown}>;
  close():Promise<boolean>;
  confirmIdle():Promise<boolean>;
}
export class BrowserClient implements BrowserEnvironment {
  private rpc?:ComputerRPC;
  private expectedClose=false;
  private closing?:Promise<boolean>;
  private connecting?:Promise<ComputerRPC>;
  private launchRequested=false;
  constructor(readonly socketPath=process.env.BOT_BROWSER_SOCKET??'/run/botsquad-browser/control.sock'){}
  private async connect() {
    const socket=createConnection(this.socketPath);const rpc=new ComputerRPC(socket);
    await new Promise<void>((resolve,reject)=>{const t=setTimeout(()=>{socket.destroy();reject(new Error('Browser broker unavailable'));},3000);
      socket.once('connect',()=>{clearTimeout(t);resolve();});socket.once('error',()=>{clearTimeout(t);reject(new Error('Browser broker unavailable'));});});
    return rpc;
  }
  async launch(sessionId:string,seconds:number,onNetwork:(request:BrowserRequest)=>Promise<BrowserResponse|null>,onLost:()=>void) {
    this.expectedClose=false;this.closing=undefined;this.launchRequested=false;this.connecting=this.connect();const rpc=await this.connecting;
    if(this.expectedClose){rpc.close();throw new Error('Browser connection cancelled');}this.rpc=rpc;
    this.rpc.handler=async(method,a)=>{if(method!=='network'||a.session_id!==sessionId)throw new Error('Unknown browser callback');return onNetwork(a);};
    this.rpc.on('closed',()=>{if(!this.expectedClose)onLost();});
    this.launchRequested=true;return this.rpc.call<{epoch:string;browser:string;viewport:{width:number;height:number}}>('launch',{session_id:sessionId,maxRuntimeSeconds:seconds});
  }
  action(sessionId:string,action:string,args:Record<string,unknown>) {
    if(!this.rpc)throw new Error('Browser is unavailable');
    return this.rpc.call<{snapshot:PageSnapshot;screenshot?:string;mutation?:unknown}>('action',{session_id:sessionId,action,...args});
  }
  close():Promise<boolean>{
    this.expectedClose=true;if(this.closing)return this.closing;
    this.closing=(async()=>{let rpc:ComputerRPC|undefined;try{rpc=this.rpc??await this.connecting;this.rpc=undefined;if(!rpc||!this.launchRequested)return true;return (await rpc.call('close',{},6000)).shutdown_confirmed===true;}catch{return false;}finally{rpc?.close();}})();return this.closing;
  }
  async confirmIdle(){let rpc:ComputerRPC|undefined;try{rpc=await this.connect();const s=await rpc.call('status');return s.active===false&&s.session===null;}catch{return false;}finally{rpc?.close();}}
}
export type {CanonicalRequest};
