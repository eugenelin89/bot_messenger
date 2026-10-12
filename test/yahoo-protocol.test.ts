import test from 'node:test';
import assert from 'node:assert/strict';
import { YahooChildProtocol } from '../src/control/market/yahoo-protocol.js';
const frame=(value:unknown)=>Buffer.from(JSON.stringify(value)+'\n');
const request={type:'request',id:1,query:{method:'GET',url:'https://fc.yahoo.com/',params:{}}};
test('child protocol handles split UTF-8, ordered responses and exact completion',()=>{
 const ids:number[]=[];const p=new YahooChildProtocol(id=>ids.push(id));p.receive(frame(request));assert.deepEqual(ids,[1]);p.respond(1);
 const bytes=frame({type:'result',body:'{"company":"Éclair"}'}),index=bytes.indexOf(Buffer.from('É'))+1;
 p.receive(bytes.subarray(0,index));p.receive(bytes.subarray(index));assert.equal(p.finish(),'{"company":"Éclair"}');
});
test('child rejects malformed JSON, unknown messages, credential diagnostics and request IDs',()=>{
 for(const bytes of [Buffer.from('{bad\n'),frame(null),frame({type:'arbitrary'}),frame({...request,id:2}),frame({type:'error',code:'secret=https://example.test'})]){
  const p=new YahooChildProtocol(()=>{});assert.throws(()=>p.receive(bytes),/python_protocol/);
 }
});
test('child cannot overlap requests or finish before its HTTP response',()=>{
 for(const second of [request,{type:'result',body:'{}'}]){const p=new YahooChildProtocol(()=>{});p.receive(frame(request));assert.throws(()=>p.receive(frame(second)),/overlap/);}
 const p=new YahooChildProtocol(()=>{});p.receive(frame(request));assert.throws(()=>p.respond(2),/response/);assert.throws(()=>p.finish(),/child_failed/);
});
test('child output caps apply to results, unfinished lines, stderr and combined bytes',()=>{
 for(const bytes of [frame({type:'result',body:'x'.repeat(524289)}),Buffer.alloc(600001,120)])assert.throws(()=>new YahooChildProtocol(()=>{}).receive(bytes),/output_size/);
 const p=new YahooChildProtocol(()=>{});p.receive(Buffer.alloc(600000),true);assert.throws(()=>p.receive(Buffer.alloc(448577),true),/output_size/);
 const tail=new YahooChildProtocol(()=>{});tail.receive(Buffer.from('{'));assert.throws(()=>tail.finish(),/child_failed/);
 const extra=new YahooChildProtocol(()=>{});extra.receive(frame({type:'result',body:'{}'}));assert.throws(()=>extra.receive(frame(request)),/overlap/);
});
