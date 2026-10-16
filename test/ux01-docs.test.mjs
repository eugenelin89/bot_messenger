import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {dirname,resolve,extname} from 'node:path';
export const guides=['README.md','docs/tutorials/README.md','docs/tutorials/first-assignment.md','docs/tutorials/working-groups.md','docs/tutorials/demo-01-studyplan/README.md','docs/operations/ACCESS_AND_OPERATIONS.md','docs/operations/PUBLIC_RESEARCH_TUTORIAL.md','docs/operations/COMPUTER_USE_TUTORIAL.md','docs/operations/COMPANY_OPERATING_LOOP_TUTORIAL.md','docs/operations/BUSINESS_OPERATIONS_TUTORIAL.md','docs/operations/INVESTMENT_RUN_TUTORIAL.md','docs/operations/AI_USAGE.md','docs/operations/INV-REAL-01.md','docs/operations/CURRENT_STATE.md','docs/guides/BOTSQUAD_ENGINEER_PRIMER.md','docs/product/AI_ORGANIZATION_MODEL.md','docs/product/WORKER_PORTRAITS.md','docs/product/DEMO_OPERATOR.md','docs/product/ROADMAP.md','docs/architecture/CONVERSATIONS_AND_CONTINUITY.md','docs/architecture/SYSTEM_ARCHITECTURE.md','docs/operations/INVESTMENT_OPERATIONAL_DESIGN.md',...readdirSync('docs/ux/hq-redesign').filter(x=>x.endsWith('.md')).map(x=>'docs/ux/hq-redesign/'+x)];
const slug=s=>s.toLowerCase().replace(/<[^>]+>/g,'').replace(/[`*_~]/g,'').replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/\s/g,'-');
test('Current HQ guides have local link targets, anchors and screenshot assets',()=>{
 const failures=[];let checked=0;
 for(const file of guides){const text=readFileSync(file,'utf8').replace(/```[\s\S]*?```/g,'');for(const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const ref=m[1].replace(/^<|>$/g,'').split(/\s+"/)[0];if(/^(https?:|mailto:|data:)/.test(ref))continue;
  const [path,anchor]=ref.split('#'),target=path?resolve(dirname(file),decodeURIComponent(path)):resolve(file);checked++;
  if(!existsSync(target)){failures.push(`${file}: missing ${ref}`);continue;}
  if(anchor&&extname(target)==='.md'){const source=readFileSync(target,'utf8'),headings=[...source.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m=>slug(m[1]));const explicit=[...source.matchAll(/(?:id|name)=["']([^"']+)["']/g)].map(m=>m[1]);if(!headings.includes(decodeURIComponent(anchor))&&!explicit.includes(anchor))failures.push(`${file}: missing anchor ${ref}`);}
 }}assert.ok(checked>100);assert.deepEqual(failures,[]);
});
test('Beginner instructions use the actual current controls and labelled sample evidence',()=>{
 const guide=readFileSync('docs/tutorials/first-assignment.md','utf8'),app=readFileSync('public/app.js','utf8');
 for(const label of ['New task','Start task','Open task','Results and files','Recorded progress','Open conversations','Send passive message','Send & request reply','Retry loading'])assert.ok((app+readFileSync('public/index.html','utf8')).includes(label),label);
 for(const old of ['**Executive channel**','**Inspect task**','**Initialize Atlas**','**Pause new dispatch**','**Resume dispatch**'])assert.ok(!guide.includes(old),old);
 assert.match(guide,/explicitly fake runtime/);assert.match(guide,/Lost|lost/);assert.match(guide,/not live investment/);assert.match(guide,/does not necessarily finish/);
});
