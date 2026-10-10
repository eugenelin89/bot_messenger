import { requireThat } from '../model.js';
export interface Tokens {
 inputTokens:number; cachedInputTokens:number|null; cacheWriteInputTokens:number|null;
 outputTokens:number; reasoningOutputTokens:number|null; totalTokens:number;
}
export const ZERO:Tokens={inputTokens:0,cachedInputTokens:0,cacheWriteInputTokens:0,outputTokens:0,reasoningOutputTokens:0,totalTokens:0};
export function normalizeTokens(value:unknown):Tokens {
 requireThat(!!value&&typeof value==='object'&&!Array.isArray(value),'Malformed token counters');
 const v=value as Record<string,unknown>;
 const count=(key:string,optional=false):number|null=>{const n=v[key];if(optional&&(n===undefined||n===null))return null;requireThat(typeof n==='number'&&Number.isSafeInteger(n)&&n>=0,'Invalid or overflowing token counter');return n;};
 const t:Tokens={inputTokens:count('inputTokens')!,cachedInputTokens:count('cachedInputTokens',true),cacheWriteInputTokens:count('cacheWriteInputTokens',true),outputTokens:count('outputTokens')!,reasoningOutputTokens:count('reasoningOutputTokens',true),totalTokens:count('totalTokens')!};
 requireThat(BigInt(t.inputTokens)+BigInt(t.outputTokens)===BigInt(t.totalTokens),'Contradictory total tokens');
 requireThat((t.cachedInputTokens??0)<=t.inputTokens&&(t.cacheWriteInputTokens??0)<=t.inputTokens&&(t.reasoningOutputTokens??0)<=t.outputTokens,'Contradictory subset tokens');
 return t;
}
export function subtractTokens(total:Tokens,base:Tokens):Tokens {
 const out={} as Record<keyof Tokens,number|null>;
 for(const k of Object.keys(ZERO) as (keyof Tokens)[]){const a=total[k],b=base[k];out[k]=a===null||b===null?null:a-b;}
 return normalizeTokens(out);
}
export interface UsageStart {threadId:string;model:string;provider:string;serviceTier:string|null;freshThread:boolean}
export type UsageObservation =
 | {kind:'start';identity:UsageStart}
 | {kind:'turn';threadId:string;turnId:string}
 | {kind:'snapshot';threadId:string;turnId:string;total:unknown;last:unknown}
 | {kind:'response';threadId:string;turnId:string;responseId:string;usage:unknown}
 | {kind:'model_changed';threadId:string;turnId:string};
export function addTokens(a:Tokens,b:Tokens):Tokens {
 const result={} as Record<keyof Tokens,number|null>;
 for(const k of Object.keys(ZERO) as (keyof Tokens)[]){const x=a[k],y=b[k];if(x===null||y===null)result[k]=null;else {const n=BigInt(x)+BigInt(y);requireThat(n<=BigInt(Number.MAX_SAFE_INTEGER),'Token sum overflow');result[k]=Number(n);}}
 return normalizeTokens(result);
}
