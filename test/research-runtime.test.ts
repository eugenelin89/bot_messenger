import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers.js';
import {CodexResearchProvider} from '../src/runtime/research.js';
import {DISABLED_FEATURES} from '../src/runtime/codex.js';

test('isolated broker keeps later opened source evidence within bounded native result collection',async t=>{
  const f=fixture();t.after(()=>f.close());const command=join(f.dir,'research-protocol.mjs');
  writeFileSync(command,`#!${process.execPath}
import {createInterface} from 'node:readline';
if(process.argv.includes('--version')){console.log('codex-cli 0.157.0');process.exit(0)}
const send=x=>console.log(JSON.stringify(x));const cwd=process.cwd();
createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line),p=m.params??{};
if(m.method==='initialize')send({id:m.id,result:{}});
else if(m.method==='account/read')send({id:m.id,result:{account:{type:'chatgpt'}}});
else if(m.method==='config/read')send({id:m.id,result:{config:{web_search:'live',features:${JSON.stringify(Object.fromEntries(DISABLED_FEATURES.map(f=>[f,false])))},mcp_servers:{inherited:{}}}}});
else if(m.method==='model/list')send({id:m.id,result:{data:[{model:'test-model',isDefault:true,supportedReasoningEfforts:[{reasoningEffort:'low'}],defaultReasoningEffort:'low'}]}});
else if(m.method==='thread/start'){
if(p.config['mcp_servers.inherited.enabled']!==false||p.dynamicTools.length||p.environments.length||p.approvalPolicy!=='never'||p.sandbox!=='read-only')throw new Error('Unsafe broker settings');
send({id:m.id,result:{thread:{id:'public-only-thread',cwd},approvalPolicy:'never',sandbox:{type:'readOnly',networkAccess:false},model:'test-model'}});
}else if(m.method==='turn/start'){
if(!p.input[0].text.includes('Public query only')||p.environments.length||p.sandboxPolicy.networkAccess)throw new Error('Unexpected broker brief');
send({id:m.id,result:{turn:{id:'public-turn'}}});
for(let page=0;page<3;page++)send({method:'item/completed',params:{threadId:'public-only-thread',turnId:'public-turn',item:{type:'webSearch',results:Array.from({length:30},(_,i)=>({url:'https://docs.python.org/'+(page*30+i),title:'Returned source',snippet:'Actual protocol fixture result'}))}}});
send({method:'item/completed',params:{threadId:'public-only-thread',turnId:'public-turn',item:{type:'webSearch',results:[{url:'https://docs.python.org/latest-opened',title:'Opened at end',snippet:'Most recent actual source'}]}}});
send({method:'item/completed',params:{threadId:'public-only-thread',turnId:'public-turn',item:{type:'agentMessage',phase:'final_answer',text:'Separately generated summary'}}});
send({method:'turn/completed',params:{threadId:'public-only-thread',turn:{id:'public-turn',status:'completed'}}});
}});`,{mode:0o700});
  const events:string[]=[];const response=await new CodexResearchProvider(command,realpathSync(f.dir)).search('Public query only',new AbortController().signal,{prepared:r=>events.push(r),invoking:()=>events.push('invoking'),settled:()=>events.push('settled')});
  assert.equal(response.outcome,'succeeded');assert.equal(response.sources.length,12);assert.equal(response.sources.at(-1)!.url,'https://docs.python.org/latest-opened');assert.equal(response.sources.at(-1)!.kind,'search_snippet');assert.equal(response.sources.at(-1)!.observed_at,null);assert.equal(response.summary,'Separately generated summary');assert.deepEqual(events,['public-only-thread','invoking','settled']);
});
