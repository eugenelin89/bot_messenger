import {requireThat,strictObject} from '../model.js';
export interface IncludedActivityPolicy {mode:'subscription_activity_capped';maxRolling24h:number;maxRun:number;maxDurationMs:number;maxConcurrent:1;uncertainRetries:0}
export interface CreditPilotPolicy extends Omit<IncludedActivityPolicy,'mode'> {mode:'credit_approved_private_pilot';pilotId:string;maxPilot:4;existingCreditsApproved:true;providerRetriesAccepted:true}
export interface FiniteHQPolicy extends Omit<IncludedActivityPolicy,'mode'> {mode:'credit_approved_finite_hq';authorityId:string;maxWorker:number;maxCycle:number;maxDay:number;existingCreditsApproved:true;providerRetriesAccepted:true}
export interface FiniteAIProfile {model:string;reasoningEffort:string;serviceTier:'default';cliVersion:'0.157.0'}
export type ActivityPolicy=IncludedActivityPolicy|CreditPilotPolicy|FiniteHQPolicy;
export const ACTIVITY_MAX:IncludedActivityPolicy=Object.freeze({mode:'subscription_activity_capped',maxRolling24h:8,maxRun:24,maxDurationMs:900000,maxConcurrent:1,uncertainRetries:0});
export type ExecutionPolicy={mode:'strict_provider_enforced'}|ActivityPolicy;
export function executionPolicy(v:unknown):ExecutionPolicy{
 if(v===undefined)return {mode:'strict_provider_enforced'};
 requireThat(!!v&&typeof v==='object','Execution policy required');
 if((v as {mode?:unknown}).mode==='strict_provider_enforced'){strictObject(v,['mode']);return {mode:'strict_provider_enforced'};}
 const credit=(v as {mode?:unknown}).mode==='credit_approved_private_pilot';
 const finite=(v as {mode?:unknown}).mode==='credit_approved_finite_hq';
 const p=strictObject(v,[...(credit?['pilotId','maxPilot','existingCreditsApproved','providerRetriesAccepted']:finite?['authorityId','maxWorker','maxCycle','maxDay','existingCreditsApproved','providerRetriesAccepted']:[]),'mode','maxRolling24h','maxRun','maxDurationMs','maxConcurrent','uncertainRetries']);
 requireThat((p.mode==='subscription_activity_capped'||credit||finite)&&p.maxConcurrent===1&&p.uncertainRetries===0,'Unsupported investment activity policy');
 for(const k of ['maxRolling24h','maxRun','maxDurationMs'] as const)requireThat(typeof p[k]==='number'&&Number.isSafeInteger(p[k])&&p[k]>0&&p[k]<=ACTIVITY_MAX[k],'Activity limit exceeds approved maximum');
 if(credit)requireThat(typeof p.pilotId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.pilotId)&&p.maxPilot===4&&p.existingCreditsApproved===true&&p.providerRetriesAccepted===true&&Number(p.maxDurationMs)<=300000,'Invalid private credit pilot policy');
 if(finite){requireThat(typeof p.authorityId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.authorityId)&&p.existingCreditsApproved===true&&p.providerRetriesAccepted===true,'Invalid finite HQ authority');for(const k of ['maxWorker','maxCycle','maxDay'])requireThat(Number.isSafeInteger(p[k])&&Number(p[k])>0&&Number(p[k])<=Number(p.maxRun),'Invalid finite allocation');}
 return p as unknown as ActivityPolicy;
}
export function finiteProfile(v:unknown):FiniteAIProfile {const p=strictObject(v,['model','reasoningEffort','serviceTier','cliVersion']);requireThat(typeof p.model==='string'&&/^[a-zA-Z0-9._-]{1,100}$/.test(p.model)&&typeof p.reasoningEffort==='string'&&/^[a-z]{1,20}$/.test(p.reasoningEffort)&&p.serviceTier==='default'&&p.cliVersion==='0.157.0','Exact supported scoped AI profile required');return p as unknown as FiniteAIProfile;}
export interface IncludedSubscriptionEligibility {authMode:'chatgpt';planType:'plus'|'pro'|'prolite';ordinaryUsageAllowed:true;paidCredits:false;provider:'openai'}
export interface CreditSubscriptionEligibility extends Omit<IncludedSubscriptionEligibility,'paidCredits'|'ordinaryUsageAllowed'> {paidCredits:'existing_approved';ordinaryUsageAllowed:boolean;creditUsageAllowed:boolean}
export type SubscriptionEligibility=IncludedSubscriptionEligibility|CreditSubscriptionEligibility;
export function eligibleSubscription(account:unknown,limits:unknown):SubscriptionEligibility{
 const a=account as {account?:{type?:string;planType?:string};requiresOpenaiAuth?:boolean};
 const l=limits as {ordinaryUsageAllowed?:unknown;rateLimits?:{credits?:{hasCredits?:unknown;unlimited?:unknown;balance?:unknown};planType?:string;spendControlReached?:boolean|null;rateLimitReachedType?:unknown};rateLimitsByLimitId?:Record<string,{credits?:{hasCredits?:unknown;unlimited?:unknown;balance?:unknown};planType?:string;spendControlReached?:boolean|null;rateLimitReachedType?:unknown}>};
 requireThat(a?.account?.type==='chatgpt'&&['plus','pro','prolite'].includes(a.account.planType??'')&&a.requiresOpenaiAuth===true,'Verified personal subscription authentication required');
 requireThat(l?.ordinaryUsageAllowed===true,'Included subscription usage eligibility unavailable or denied');
 const buckets=l.rateLimitsByLimitId?Object.values(l.rateLimitsByLimitId):l.rateLimits?[l.rateLimits]:[];
 requireThat(buckets.length>0&&buckets.every(b=>b.planType===a.account!.planType&&b.spendControlReached!==true&&b.rateLimitReachedType==null&&b.credits?.hasCredits===false&&b.credits.unlimited===false&&(b.credits.balance===null||b.credits.balance==='0'||b.credits.balance==='0.00')),'Metered credits or ambiguous subscription rate limits denied');
 return {authMode:'chatgpt',planType:a.account.planType as IncludedSubscriptionEligibility['planType'],ordinaryUsageAllowed:true,paidCredits:false,provider:'openai'};
}

/** Supported account observations are current eligibility, never a credit ceiling. */
export function eligibleCreditSubscription(account:unknown,limits:unknown):CreditSubscriptionEligibility {
 const a=account as {account?:{type?:string;planType?:string};requiresOpenaiAuth?:boolean};
 const l=limits as {ordinaryUsageAllowed?:unknown;rateLimits?:{credits?:{hasCredits?:unknown;unlimited?:unknown};planType?:string;spendControlReached?:boolean|null};rateLimitsByLimitId?:Record<string,{credits?:{hasCredits?:unknown;unlimited?:unknown};planType?:string;spendControlReached?:boolean|null}>};
 requireThat(a?.account?.type==='chatgpt'&&['plus','pro','prolite'].includes(a.account.planType??'')&&a.requiresOpenaiAuth===true,'Verified personal ChatGPT authentication required; API-key mode denied');
 const buckets=l?.rateLimitsByLimitId?Object.values(l.rateLimitsByLimitId):l?.rateLimits?[l.rateLimits]:[];
 requireThat(typeof l?.ordinaryUsageAllowed==='boolean'&&buckets.length>0&&buckets.every(b=>b.planType===a.account!.planType&&b.spendControlReached!==true&&typeof b.credits?.hasCredits==='boolean'),'Current subscription eligibility unavailable or blocked');
 const credit=buckets.every(b=>b.credits?.hasCredits===true);
 requireThat(l.ordinaryUsageAllowed||credit,'No included allowance or existing credits available');
 return {authMode:'chatgpt',planType:a.account.planType as CreditSubscriptionEligibility['planType'],ordinaryUsageAllowed:l.ordinaryUsageAllowed,paidCredits:'existing_approved',creditUsageAllowed:credit,provider:'openai'};
}
