import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {researchFixture} from './fixtures/private-research/support.js';
import {transport} from './fixtures/credit-transport.js';
import {CodexRuntime} from '../src/runtime/codex.js';
import {creditAccountFingerprint} from '../src/runtime/credit-policy.js';
import type {CreditPilotPolicy} from '../src/domain/usage/policy.js';

for(const mode of ['success','startup-snapshot','preflight-account-change','preflight-routing-change','preflight-closing-notification','notification-storm','api-key','foreign-backend','unsafe-config','unsafe-skills','no-credits','unknown-eligibility','requirements-api','requirements-provider','preflight-earlier-close','preflight-earlier-notification'])test('non-inference research identity preflight: '+mode,async t=>{
 const f=researchFixture();f.input.aiProfile.model='test-model';f.input.aiProfile.reasoningEffort='low';const result=f.consent();const j=f.authorize(result).journal;t.after(async()=>{await f.close();rmSync(f.dir,{recursive:true,force:true});});
 const generated=transport(mode,{root:f.dir,policy:{mode:'credit_approved_private_pilot',pilotId:'unused-fixture',maxPilot:4,maxRun:4,maxRolling24h:4,maxDurationMs:300000,maxConcurrent:1,uncertainRetries:0,existingCreditsApproved:true,providerRetriesAccepted:true} satisfies CreditPilotPolicy});
 assert.match(readFileSync(generated.runtime.command,'utf8'),/from 'node:readline'/);
 if(mode==='preflight-earlier-close'||mode==='preflight-earlier-notification'){
  const script=readFileSync(generated.runtime.command,'utf8').replace(" reads++;",` reads++;
   if(cwd===${JSON.stringify(f.second.workspace_path)}&&reads===1){setTimeout(()=>send({id:m.id,result:account}),400);return;}
   if(cwd===${JSON.stringify(f.first.workspace_path)}&&reads===4)setTimeout(()=>${mode==='preflight-earlier-close'?'process.exit(0)':'notify()'},100);`);
  writeFileSync(generated.runtime.command,script);
 }

 const runtime=new CodexRuntime({command:generated.runtime.command,finiteHQ:{authorityId:f.policy.authorityId,profile:f.input.aiProfile,permit:{kind:'finite-hq-runtime'}}});
 const account={account:{type:'chatgpt',planType:'pro',email:'fixture@example.invalid'},requiresOpenaiAuth:true,workspaceRouting:{chatgptAccountId:'fixture-account',backendOrigin:'https://chatgpt.com',accountRoutingOverride:'NO_CONSTRAINT'}};
 const request={authorityId:f.policy.authorityId,profile:f.input.aiProfile,workspaces:[f.first.workspace_path,f.second.workspace_path],accountFingerprint:creditAccountFingerprint(account,f.policy.authorityId),routingFingerprint:createHash('sha256').update(JSON.stringify({pilotId:f.policy.authorityId,routing:{requiredProvider:'openai',requiredBackend:null,residency:null,workspaces:null,routingOverride:'NO_CONSTRAINT',mcpServers:['inherited']}})).digest('hex')};
 let commits=0;const pending=runtime.withFiniteHQAccount(request,()=>{commits++;return 'verified';});
 if(['success','startup-snapshot'].includes(mode)){assert.equal(await pending,'verified');assert.equal(commits,1);assert.ok(generated.methods().filter(m=>m==='account/read').length>=12);}else {await assert.rejects(()=>pending);assert.equal(commits,0);}
 assert.ok(generated.methods().every(m=>!m?.startsWith('thread/')&&!m?.startsWith('turn/')));assert.equal(j.counts(f.policy.authorityId,f.clock.now()).run,0);assert.equal(j.counts(f.policy.authorityId,f.clock.now()).collections.length,0);
});
