import {createHash} from 'node:crypto';
import type {Tokens} from './tokens.js';
export interface Price {model:string;source:string;checked:string;currency:'USD';tier:'standard';input:string;cached:string;output:string;restrictions:string;completeBase:boolean}
const source='https://developers.openai.com/api/docs/pricing';
// Exact official model IDs only. No alias/display-name heuristics. Decimal USD per million.
export const PRICES:readonly Price[]=[
 {model:'gpt-5.3-codex',input:'1.75',cached:'0.175',output:'14',completeBase:true},
 {model:'gpt-6-astra',input:'10',cached:'1',output:'50',completeBase:false},
 {model:'gpt-6.1-sol',input:'2',cached:'0.10',output:'10',completeBase:false},
 {model:'gpt-6-luna',input:'0.10',cached:'0.01',output:'0.50',completeBase:false},
 {model:'gpt-5.6-sol',input:'4',cached:'0.40',output:'20',completeBase:false},
].map(p=>({...p,source,checked:'2026-10-10',currency:'USD',tier:'standard',restrictions:'Standard base token equivalent only; excludes tool fees, regional processing, cache writes and long-context multipliers. Not subscription billing.'}));
export const PRICING_VERSION='openai-2026-10-10-'+createHash('sha256').update(JSON.stringify(PRICES)).digest('hex').slice(0,16);
export function priceFor(model:string,provider:string):Price|null{return provider==='openai'?PRICES.find(p=>p.model===model)??null:null;}
function rate(v:string){if(!/^\d+(\.\d{1,6})?$/.test(v))throw new Error('Invalid reviewed decimal rate');const [whole,fraction='']=v.split('.');return BigInt(whole!)*1000000n+BigInt(fraction.padEnd(6,'0'));}
export function usd(picos:bigint){const fraction=(picos%1000000000000n).toString().padStart(12,'0');return `${picos/1000000000000n}.${fraction}`;}
export interface Estimate {usd:string|null;picoUsd:string|null;state:'available'|'partial'|'unavailable';reasons:string[]}
export function estimate(tokens:Tokens|null,price:Price|null,tier:string|null,complete:boolean,changed=false):Estimate{
 const reasons:string[]=[];
 if(!tokens||!price||changed||tier!=='standard'||(tokens.cacheWriteInputTokens??0)>0)return {usd:null,picoUsd:null,state:'unavailable',reasons:[!tokens?'Usage incomplete':!price?'Exact model price unavailable':changed?'Model changed during execution':tier!=='standard'?'Service tier unverified':'Cache-write pricing unsupported']};
 if(!complete)reasons.push('Usage incomplete');
 if(tokens.cachedInputTokens===null)reasons.push('Cached input unknown; conservative uncached-input rate');
 if(!price.completeBase)reasons.push('Base token estimate; long-context and additional pricing dimensions unverified');
 const cached=BigInt(tokens.cachedInputTokens??0),uncached=BigInt(tokens.inputTokens)-cached;
 const picos=uncached*rate(price.input)+cached*rate(price.cached)+BigInt(tokens.outputTokens)*rate(price.output);
 return {usd:usd(picos),picoUsd:String(picos),state:reasons.length?'partial':'available',reasons};
}
