import {requireThat,strictObject} from '../model.js';
export interface ActivityPolicy {mode:'subscription_activity_capped';maxRolling24h:number;maxRun:number;maxDurationMs:number;maxConcurrent:1;uncertainRetries:0}
export const ACTIVITY_MAX:ActivityPolicy=Object.freeze({mode:'subscription_activity_capped',maxRolling24h:8,maxRun:24,maxDurationMs:900000,maxConcurrent:1,uncertainRetries:0});
export type ExecutionPolicy={mode:'strict_provider_enforced'}|ActivityPolicy;
export function executionPolicy(v:unknown):ExecutionPolicy{
 if(v===undefined)return {mode:'strict_provider_enforced'};
 requireThat(!!v&&typeof v==='object','Execution policy required');
 if((v as {mode?:unknown}).mode==='strict_provider_enforced'){strictObject(v,['mode']);return {mode:'strict_provider_enforced'};}
 const p=strictObject(v,['mode','maxRolling24h','maxRun','maxDurationMs','maxConcurrent','uncertainRetries']);
 requireThat(p.mode==='subscription_activity_capped'&&p.maxConcurrent===1&&p.uncertainRetries===0,'Unsupported investment activity policy');
 for(const k of ['maxRolling24h','maxRun','maxDurationMs'] as const)requireThat(typeof p[k]==='number'&&Number.isSafeInteger(p[k])&&p[k]>0&&p[k]<=ACTIVITY_MAX[k],'Activity limit exceeds approved maximum');
 return p as unknown as ActivityPolicy;
}
export interface SubscriptionEligibility {authMode:'chatgpt';planType:'plus'|'pro'|'prolite';ordinaryUsageAllowed:true;paidCredits:false;provider:'openai'}
export function eligibleSubscription(account:unknown,limits:unknown):SubscriptionEligibility{
 const a=account as {account?:{type?:string;planType?:string};requiresOpenaiAuth?:boolean};
 const l=limits as {ordinaryUsageAllowed?:unknown;rateLimits?:{credits?:{hasCredits?:unknown;unlimited?:unknown;balance?:unknown};planType?:string;spendControlReached?:boolean|null;rateLimitReachedType?:unknown};rateLimitsByLimitId?:Record<string,{credits?:{hasCredits?:unknown;unlimited?:unknown;balance?:unknown};planType?:string;spendControlReached?:boolean|null;rateLimitReachedType?:unknown}>};
 requireThat(a?.account?.type==='chatgpt'&&['plus','pro','prolite'].includes(a.account.planType??'')&&a.requiresOpenaiAuth===true,'Verified personal subscription authentication required');
 requireThat(l?.ordinaryUsageAllowed===true,'Included subscription usage eligibility unavailable or denied');
 const buckets=l.rateLimitsByLimitId?Object.values(l.rateLimitsByLimitId):l.rateLimits?[l.rateLimits]:[];
 requireThat(buckets.length>0&&buckets.every(b=>b.planType===a.account!.planType&&b.spendControlReached!==true&&b.rateLimitReachedType==null&&b.credits?.hasCredits===false&&b.credits.unlimited===false&&(b.credits.balance===null||b.credits.balance==='0'||b.credits.balance==='0.00')),'Metered credits or ambiguous subscription rate limits denied');
 return {authMode:'chatgpt',planType:a.account.planType as SubscriptionEligibility['planType'],ordinaryUsageAllowed:true,paidCredits:false,provider:'openai'};
}
