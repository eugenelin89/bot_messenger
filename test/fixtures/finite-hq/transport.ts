import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {finiteFixture} from './support.js';
import {transport} from '../credit-transport.js';
import {creditAccountFingerprint} from '../../../src/runtime/credit-policy.js';
import {CodexRuntime} from '../../../src/runtime/codex.js';
import type {RuntimeInput} from '../../../src/runtime/adapter.js';
import type {VerifiedCreditAccount} from '../../../src/runtime/credit-account.js';
import type {CreditPilotPolicy} from '../../../src/domain/usage/policy.js';
/** Only this generated fake stdio executable can bypass the genuine-journal permit check. */
class FakeFiniteTransport extends CodexRuntime {
 authorizeWith!:(i:RuntimeInput,a?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>&{threadId:string;model:string})=>void;
 protected override authorizeFinite(input:RuntimeInput,account?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>&{threadId:string;model:string}){assert.ok(this.command.endsWith('/fake-codex.mjs'));assert.ok(readFileSync(this.command,'utf8').includes("from 'node:readline'"));this.authorizeWith(input,account);}
}
export function finiteTransport(mode='success',t?:Parameters<typeof finiteFixture>[0]){
 const f=finiteFixture(t);f.input.aiProfile.model='test-model';f.input.aiProfile.reasoningEffort='low';f.store.run("UPDATE workers SET runtime_type='codex-app-server'");
 const result=f.consent(),account={account:{type:'chatgpt',planType:'pro',email:'fixture@example.invalid'},requiresOpenaiAuth:true,workspaceRouting:{chatgptAccountId:'fixture-account',backendOrigin:'https://chatgpt.com',accountRoutingOverride:'NO_CONSTRAINT'}};
 const approved={accountFingerprint:creditAccountFingerprint(account,f.policy.authorityId),routingFingerprint:createHash('sha256').update(JSON.stringify({pilotId:f.policy.authorityId,routing:{requiredProvider:'openai',requiredBackend:null,residency:null,workspaces:null,routingOverride:'NO_CONSTRAINT',mcpServers:['inherited']}})).digest('hex')},a=f.authorize(result,approved);
 // Reuse the existing fake executable generator. Its unused constructor has no pilot grant/reservation.
 const generated=transport(mode,{root:f.company.dataDir,policy:{mode:'credit_approved_private_pilot',pilotId:'unused-fixture',maxPilot:4,maxRun:4,maxRolling24h:4,maxDurationMs:300000,maxConcurrent:1,uncertainRetries:0,existingCreditsApproved:true,providerRetriesAccepted:true} satisfies CreditPilotPolicy});
 const runtime=new FakeFiniteTransport({command:generated.runtime.command,finiteHQ:{authorityId:f.policy.authorityId,profile:result.scope.envelope.aiProfile,permit:{kind:'finite-hq-runtime'}}});
 runtime.authorizeWith=(input,verified)=>verified?f.company.finiteHQ.transmit(f.policy.authorityId,input,verified):f.company.finiteHQ.verifyInput(f.policy.authorityId,input);
 f.company.investmentTeam.runtime=runtime;f.company.investmentLoop.control({loopId:result.loop.loopId,action:'start',digest:result.loop.digest,receiptId:randomUUID(),orderId:null});const occurrence=f.company.investmentLoop.occurrences(f.company.investmentLoop.get(result.loop.loopId)).find(o=>o.stage==='research')!;f.clock.set(occurrence.due_at);a.attestation.confirmedAt=f.clock.now();f.company.finiteHQ.renew(a.attestation);f.company.investmentLoop.tick();
 const x=f.company.claimWorkNext();assert.ok(x?.origin==='conversation');const r=f.company.finiteHQ.reservation(x.execution.execution_id)!;
 const input:RuntimeInput={mode:'conversation',worker:{...x.worker,ai_model:r.profile.model,reasoning_effort:r.profile.reasoningEffort},request:x.request,execution:x.execution,investment:{scopeId:r.scopeId,authorityId:r.authorityId,policy:f.policy.mode},localDeadline:r.deadline,context:f.company.conversations.context(x.context),tools:f.company.conversations.tools(x.context),binding:f.company.conversations.binding(x.context),prepareBinding:b=>f.company.conversations.prepareBinding(x.context,b),bind:b=>{f.company.conversations.prepareBinding(x.context,b);f.company.conversations.activateBinding(x.context);},configured:c=>f.company.recordRuntimeConfig(x.context,c),event:(type,detail)=>f.company.conversations.event(x.context,type,detail),callTool:(id,name,args)=>f.company.conversations.callTool(x.context,id,name,args),usage:o=>{f.company.aiUsage.observe(x.execution.execution_id,o);if(o.kind==='turn')f.company.investmentActivity.turn(x.execution.execution_id,o.turnId);},admitSubscription:i=>f.company.investmentActivity.admit(x.context,i)};
 return {...f,result,authority:a,input,runtime,x,methods:generated.methods,close:()=>{a.journal.close();f.close();}};
}
