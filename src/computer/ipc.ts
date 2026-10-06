import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { Socket } from 'node:net';
import { requireThat } from '../domain/model.js';

// Private Unix socket only. No provider, worker or webpage controls the protocol.
// Both endpoints enforce framing, pending-call bounds and disconnect rejection.
export class ComputerRPC extends EventEmitter {
  private buffer='';
  private pending=new Map<string,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:NodeJS.Timeout}>();
  private incoming=0;
  handler:(method:string,args:any)=>Promise<unknown>=async()=>{throw new Error('No request handler');};
  constructor(readonly socket:Socket) {
    super();socket.setEncoding('utf8');
    socket.on('data',(part:string)=>{
      this.buffer+=part;if(Buffer.byteLength(this.buffer)>4194304){socket.destroy();return;}
      let end:number;while((end=this.buffer.indexOf('\n'))>=0){const line=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+1);void this.receive(line);}
    });
    socket.on('error',()=>socket.destroy());
    socket.on('close',()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Browser control connection closed'));}this.pending.clear();this.emit('closed');});
  }
  private send(value:unknown) {
    const text=JSON.stringify(value);requireThat(Buffer.byteLength(text)<=4194303,'Browser protocol message too large');
    requireThat(!this.socket.destroyed&&this.socket.writableLength<4194304,'Browser connection unavailable or congested');this.socket.write(text+'\n');
  }
  async call<T=any>(method:string,args:unknown={},timeout=25000):Promise<T> {
    requireThat(this.pending.size<16,'Too many outstanding browser requests');const id=randomUUID();
    return new Promise<T>((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Browser control timed out'));this.socket.destroy();},timeout);
      this.pending.set(id,{resolve,reject,timer});
      try{this.send({v:1,id,method,args});}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e as Error);}
    });
  }
  private async receive(line:string) {
    try {
      const m=JSON.parse(line);requireThat(m&&m.v===1&&typeof m.id==='string'&&m.id.length<=100,'Invalid browser protocol');
      if(typeof m.method==='string') {
        requireThat(++this.incoming<=16,'Too many browser callbacks');
        try {const result=await this.handler(m.method,m.args);this.send({v:1,id:m.id,result});}
        catch(e){if(!this.socket.destroyed)this.send({v:1,id:m.id,error:e instanceof Error?e.message.slice(0,300):'Browser request failed'});}
        finally{this.incoming--;}
      } else {
        const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);
        if(typeof m.error==='string')p.reject(new Error(m.error));else p.resolve(m.result);
      }
    } catch {this.socket.destroy();}
  }
  close(){this.socket.destroy();}
}
