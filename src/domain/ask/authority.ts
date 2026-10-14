/** Ask-only finite metadata. Validation is not account eligibility or a runtime permit. */
import { canonicalHash, canonicalJson, requireContract as need, validate } from '../../../scripts/investment-contracts/schema.js';
import type { AskLimits, AskRoster, AskServiceScope, AskSubscriptionActivityPolicy } from '../../../contracts/investment/v1/types.js';
import {checkApiUsage,type AskApiUsage} from './api-policy.js';

export interface AskGrantConfiguration {scope:AskServiceScope;limits:AskLimits;roster:AskRoster}

export type AskMonetaryMode='included_only'|'verified_cap'|'activity_capped_subscription';
export interface AskGrant {
  id:string; hqId:string; serviceId:string; generation:string;
  scopeDigest:string; limitsDigest:string; rosterDigest:string; workerIds:string[];
  adapterId:string; model:string; profileDigest:string; accountDigest:string;
  routingDigest:string; eligibilityDigest:string; costPolicyDigest:string;
  contextPolicyDigest:string; toolPolicyDigest:string;
  approvalDigest:string; approvedAt:string; expiresAt:string;
  maxExecutions:number; dailyExecutions:number; maxInputTokens:number; maxOutputTokens:number;
  totalTokens:number; dailyTokens:number; maxDurationMs:number;
  maxChargeMicros:string|null; totalChargeMicros:string|null; dailyChargeMicros:string|null;
  monetaryMode:AskMonetaryMode; subscriptionActivityPolicy?:AskSubscriptionActivityPolicy; routerExecutions:0; researchCalls:0;
}
export interface AskReservation {
  id:string; grantId:string; serviceId:string; generation:string;
  questionId:string; questionHash:string; conversationId:string;
  workerId:string; workerSessionId:string; providerGeneration:number;
  contextDigest:string; claimDigest:string; requestDigest:string;
  reservedAt:string; deadline:string; questionExpiresAt:string;
}
/** Supplied by a future trusted adapter, never by a model. This module issues no permit. */
export interface AskAdmissionProof {
  adapterId:string; model:string; profileDigest:string; accountDigest:string;
  routingDigest:string; eligibilityDigest:string; costPolicyDigest:string;
  contextPolicyDigest:string; toolPolicyDigest:string;
  scopeDigest:string; limitsDigest:string; rosterDigest:string;
  checkedAt:string; expiresAt:string; providerSessionId:string; reservationDigest:string;
  publicServiceAllowed:true; inputBoundEnforced:boolean; outputBoundEnforced:boolean;
  monitoredUsage?:true; subscriptionActivityPolicy?:AskSubscriptionActivityPolicy;
  monetaryMode:AskMonetaryMode; maxChargeMicros:string|null;
}
export interface AskUsageReceipt {
  providerSessionId:string; responseDigest:string; usageDigest:string;
  inputTokens:number; outputTokens:number; chargeMicros:string|null; complete:true;
  api?:AskApiUsage;
}
export function exact(value:unknown,keys:string):asserts value is Record<string,unknown> {
  need(value!==null&&typeof value==='object'&&!Array.isArray(value)
    &&Object.keys(value).sort().join(',')===keys.split(' ').sort().join(','),'INVALID_SCHEMA');
}
export function integer(value:number,min=0,max=1000000000):void {
  need(Number.isSafeInteger(value)&&value>=min&&value<=max,'INVALID_SCHEMA');
}
export function micros(value:string):bigint {
  need(typeof value==='string'&&/^(0|[1-9][0-9]{0,14})$/.test(value),'INVALID_SCHEMA');return BigInt(value);
}
export function instant(value:string):number {
  need(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    &&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value,'INVALID_SCHEMA');return Date.parse(value);
}
export function id(value:string):void { validate('Id',value); }
export function digest(value:string):void { validate('Hash',value); }
export function grant(value:AskGrant):AskGrant {
  exact(value,'id hqId serviceId generation scopeDigest limitsDigest rosterDigest workerIds adapterId model profileDigest accountDigest routingDigest eligibilityDigest costPolicyDigest contextPolicyDigest toolPolicyDigest approvalDigest approvedAt expiresAt maxExecutions dailyExecutions maxInputTokens maxOutputTokens totalTokens dailyTokens maxDurationMs maxChargeMicros totalChargeMicros dailyChargeMicros monetaryMode routerExecutions researchCalls'+(value?.monetaryMode==='activity_capped_subscription'?' subscriptionActivityPolicy':''));
  for(const key of ['id','hqId','serviceId','adapterId'] as const)id(value[key]);
  need(typeof value.model==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value.model),'INVALID_SCHEMA');
  validate('Sequence',value.generation);
  for(const key of ['scopeDigest','limitsDigest','rosterDigest','profileDigest','accountDigest','routingDigest','eligibilityDigest','costPolicyDigest','contextPolicyDigest','toolPolicyDigest','approvalDigest'] as const)digest(value[key]);
  need(Array.isArray(value.workerIds)&&value.workerIds.length>0&&value.workerIds.length<=8
    &&new Set(value.workerIds).size===value.workerIds.length,'INVALID_SCHEMA');value.workerIds.forEach(id);
  const duration=instant(value.expiresAt)-instant(value.approvedAt);
  need(duration>0&&duration<=86400000,'INVALID_SCHEMA');
  for(const key of ['maxExecutions','dailyExecutions','maxInputTokens','maxOutputTokens','totalTokens','dailyTokens','maxDurationMs'] as const)integer(value[key],1);
  need(value.maxExecutions<=1000&&value.dailyExecutions<=1000&&value.maxDurationMs<=240000
    &&value.routerExecutions===0&&value.researchCalls===0,'INVALID_SCHEMA');
  const tokens=value.maxInputTokens+value.maxOutputTokens;
  need(tokens<=value.totalTokens&&tokens<=value.dailyTokens,'INVALID_SCHEMA');
  if(value.monetaryMode==='activity_capped_subscription'){
    validate('AskSubscriptionActivityPolicy',value.subscriptionActivityPolicy);
    need(value.maxChargeMicros===null&&value.totalChargeMicros===null&&value.dailyChargeMicros===null,'INVALID_SCHEMA');
  }else{
    need(value.maxChargeMicros!==null&&value.totalChargeMicros!==null&&value.dailyChargeMicros!==null,'INVALID_SCHEMA');
    const per=micros(value.maxChargeMicros),total=micros(value.totalChargeMicros),daily=micros(value.dailyChargeMicros);
    need(per<=total&&per<=daily&&(value.monetaryMode==='verified_cap'||value.monetaryMode==='included_only'&&per===0n&&total===0n&&daily===0n),'INVALID_SCHEMA');
  }
  return JSON.parse(canonicalJson(value)) as AskGrant;
}
export function configuration(g:AskGrant,c:AskGrantConfiguration):void {
  exact(c,'scope limits roster');validate('AskServiceScope',c.scope);validate('AskLimits',c.limits);validate('AskRoster',c.roster);
  need(canonicalHash(c.scope)===g.scopeDigest&&canonicalHash(c.limits)===g.limitsDigest&&canonicalHash(c.roster)===g.rosterDigest,'CONFLICT');
  need(c.scope.enabled&&c.scope.serviceId===g.serviceId&&c.scope.consumerGeneration===g.generation
    &&instant(g.expiresAt)<=Date.parse(c.scope.expiresAt)&&c.scope.permissions.includes('claim')&&c.scope.permissions.includes('answer')
    &&c.roster.serviceId===g.serviceId&&g.workerIds.every(w=>c.roster.workers.some(x=>x.worker.workerId===w)),'FORBIDDEN');
  const l=c.limits;
  need(g.maxDurationMs<=l.executionDeadlineSeconds*1000&&g.dailyExecutions<=l.dailyExecutions
    &&g.dailyTokens<=l.dailyTokens&&g.maxInputTokens<=l.maxInputTokens&&g.maxOutputTokens<=l.maxOutputTokens,'BUDGET_EXHAUSTED');
  if(g.monetaryMode==='activity_capped_subscription'){
    need(l.monetaryEnforcement==='activity_capped_subscription'&&l.dailyBudgetUsd===null
      &&canonicalJson(l.subscriptionActivityPolicy)===canonicalJson(g.subscriptionActivityPolicy),'FORBIDDEN');
  }else need(l.monetaryEnforcement!=='activity_capped_subscription','FORBIDDEN');
  if(g.monetaryMode==='verified_cap'){
    need(l.monetaryEnforcement==='verified_cap'&&l.dailyBudgetUsd!==null,'FORBIDDEN');
    const [whole,fraction='']=l.dailyBudgetUsd.split('.');
    need(micros(g.dailyChargeMicros!)<=BigInt(whole!)*1000000n+BigInt(fraction.padEnd(6,'0')),'BUDGET_EXHAUSTED');
  }
}
export function reservation(value:AskReservation):AskReservation {
  exact(value,'id grantId serviceId generation questionId questionHash conversationId workerId workerSessionId providerGeneration contextDigest claimDigest requestDigest reservedAt deadline questionExpiresAt');
  for(const key of ['id','grantId','serviceId','questionId','conversationId','workerId','workerSessionId'] as const)id(value[key]);
  validate('Sequence',value.generation);integer(value.providerGeneration,1);
  for(const key of ['questionHash','contextDigest','claimDigest','requestDigest'] as const)digest(value[key]);
  need(instant(value.deadline)>instant(value.reservedAt)&&instant(value.deadline)<=instant(value.questionExpiresAt),'INVALID_SCHEMA');
  return JSON.parse(canonicalJson(value)) as AskReservation;
}
export function admission(value:AskAdmissionProof,g:AskGrant,r:AskReservation,at:string):void {
  exact(value,'adapterId model profileDigest accountDigest routingDigest eligibilityDigest costPolicyDigest contextPolicyDigest toolPolicyDigest scopeDigest limitsDigest rosterDigest checkedAt expiresAt providerSessionId reservationDigest publicServiceAllowed inputBoundEnforced outputBoundEnforced monetaryMode maxChargeMicros'+(g.monetaryMode==='activity_capped_subscription'?' subscriptionActivityPolicy monitoredUsage':''));
  for(const key of ['adapterId','model','profileDigest','accountDigest','routingDigest','eligibilityDigest','costPolicyDigest','contextPolicyDigest','toolPolicyDigest','scopeDigest','limitsDigest','rosterDigest','monetaryMode','maxChargeMicros'] as const)need(value[key]===g[key],'FORBIDDEN');
  id(value.providerSessionId);
  need(value.reservationDigest===canonicalHash(r),'CONFLICT');
  need(value.publicServiceAllowed===true,'FORBIDDEN');
  if(g.monetaryMode==='activity_capped_subscription'){
    need(value.inputBoundEnforced===false&&value.outputBoundEnforced===false&&value.monitoredUsage===true
      &&canonicalJson(value.subscriptionActivityPolicy)===canonicalJson(g.subscriptionActivityPolicy),'FORBIDDEN');
  }else need(value.inputBoundEnforced===true&&value.outputBoundEnforced===true,'FORBIDDEN');
  const now=instant(at),checked=instant(value.checkedAt),expires=instant(value.expiresAt);
  need(checked<=now&&now-checked<=60000&&now<expires&&expires<=checked+60000,'EXPIRED');
}
export function usage(value:AskUsageReceipt,g:AskGrant,providerSessionId:string):'within_limits'|'threshold_exceeded' {
  exact(value,'providerSessionId responseDigest usageDigest inputTokens outputTokens chargeMicros complete'+(value.api?' api':''));
  need(value.providerSessionId===providerSessionId&&value.complete===true,'CONFLICT');
  digest(value.responseDigest);digest(value.usageDigest);integer(value.inputTokens);integer(value.outputTokens);
  if(value.api){checkApiUsage(value.api);need(g.monetaryMode==='verified_cap'&&g.model===value.api.model
    &&value.inputTokens===value.api.tokens.inputTokens&&value.outputTokens===value.api.tokens.outputTokens
    &&value.chargeMicros===value.api.chargeMicros,'CONFLICT');}
  const within=value.inputTokens<=g.maxInputTokens&&value.outputTokens<=g.maxOutputTokens;
  if(g.monetaryMode==='activity_capped_subscription'){
    need(value.chargeMicros===null,'INVALID_SCHEMA');
    // Complete measured usage must be retained even when it breaches a threshold.
    return within?'within_limits':'threshold_exceeded';
  }
  need(value.chargeMicros!==null&&g.maxChargeMicros!==null,'INVALID_SCHEMA');
  need(within&&micros(value.chargeMicros)<=micros(g.maxChargeMicros),'BUDGET_EXHAUSTED');
  return 'within_limits';
}
