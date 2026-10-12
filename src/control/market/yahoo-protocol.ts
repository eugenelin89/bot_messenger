import { StringDecoder } from 'node:string_decoder';
import { ensure } from '../../domain/investment/arithmetic.js';
import type { YahooQuery } from '../../domain/market/financial.js';

/** Bounded, ordered child protocol. Pure stream parser; no executable/network selection. */
export class YahooChildProtocol {
  private readonly decoder=new StringDecoder('utf8');
  private buffer='';
  private total=0;
  private result:string|null=null;
  private pending:number|null=null;
  private lastId=0;
  constructor(private readonly request:(id:number,query:YahooQuery)=>void){}
  receive(chunk:Buffer,stderr=false):void {
    this.total+=chunk.length;ensure(this.total<=1048576,'python_output_size');
    if(stderr)return;
    this.buffer+=this.decoder.write(chunk);ensure(Buffer.byteLength(this.buffer)<=600000,'python_output_size');
    let newline:number;
    while((newline=this.buffer.indexOf('\n'))>=0){
      const line=this.buffer.slice(0,newline);this.buffer=this.buffer.slice(newline+1);
      let message:{type:string;id?:number;query?:YahooQuery;body?:string;code?:string};
      try{message=JSON.parse(line) as typeof message;}catch{throw new Error('python_protocol_json');}
      ensure(message!==null&&typeof message==='object','python_protocol');
      ensure(this.result===null&&this.pending===null,'python_protocol_overlap');
      if(message.type==='request'){
        ensure(Number.isSafeInteger(message.id)&&message.id===this.lastId+1&&message.query!==undefined,'python_protocol_request');
        this.pending=message.id!;this.lastId=message.id!;this.request(message.id!,message.query);
      }else if(message.type==='result'){
        ensure(typeof message.body==='string'&&Buffer.byteLength(message.body)<=524288,'python_output_size');this.result=message.body;
      }else if(message.type==='error'){
        ensure(typeof message.code==='string'&&/^[a-z_]{1,80}$/.test(message.code),'python_protocol');throw new Error(message.code);
      }else throw new Error('python_protocol');
    }
  }
  respond(id:number):void {ensure(this.pending===id,'python_protocol_response');this.pending=null;}
  finish():string {
    ensure(this.result!==null&&this.result.length>0&&!this.buffer.length&&this.pending===null&&this.decoder.end()==='','python_child_failed');return this.result;
  }
}
