import {PROCESS_TOOLS} from '../domain/investment/process.js';
import type {RuntimeInput} from './adapter.js';
import {requireThat} from '../domain/model.js';
import {executionPolicy,finiteProfile,type FiniteHQPolicy,type FiniteAIProfile} from '../domain/usage/policy.js';
import type {FiniteRuntimePermit} from '../control/usage/finite-hq.js';
export interface FiniteRuntimeOptions {authorityId:string;profile:FiniteAIProfile;permit:FiniteRuntimePermit}
export function validateFiniteInput(options:FiniteRuntimeOptions,input:RuntimeInput,policy:FiniteHQPolicy){
 requireThat(executionPolicy(policy).mode==='credit_approved_finite_hq'&&policy.authorityId===options.authorityId,'Exact finite HQ policy required');finiteProfile(options.profile);
 requireThat(!input.binding,'Finite telemetry requires a fresh provider context; cold resume is unsupported');
 requireThat(input.mode==='conversation'&&input.admitSubscription&&input.usage&&input.localDeadline&&Date.parse(input.localDeadline)>Date.now()&&Date.parse(input.localDeadline)<=Date.now()+policy.maxDurationMs,'Finite scoped conversation, usage, admission and deadline required');
 requireThat(input.worker.ai_model===options.profile.model&&input.worker.reasoning_effort===options.profile.reasoningEffort,'Exact finite model/reasoning required');
 const allowed=['read_discussion','read_group_history','read_group_record','submit_contribution','facilitate_discussion','submit_synthesis',...(input.investment?.purpose==='private_research'?['read_financial_evidence']:['paper_inspect','paper_propose','paper_read_proposal','paper_review','paper_submit',...PROCESS_TOOLS])];
 requireThat(input.tools.length>0&&input.tools.every(t=>allowed.includes(t.name)),'Tool outside private paper allowlist');
}
