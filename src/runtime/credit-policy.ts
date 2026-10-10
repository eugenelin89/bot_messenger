import {createHash} from 'node:crypto';
import {requireThat} from '../domain/model.js';
import {verifyPilotRoot} from '../control/usage/credit-pilot.js';
import type {ActivityPolicy} from '../domain/usage/policy.js';
import type {RuntimeInput} from './adapter.js';
import {relative,sep,join,isAbsolute} from 'node:path';
import {statSync} from 'node:fs';
import {homedir} from 'node:os';
export interface CreditRuntimeOptions {pilotId:string;disposableRoot:string;model:string}
export const CREDIT_DISABLED_FEATURES=['multi_agent_v2','respect_system_proxy','system_proxy_fallback','skill_search'] as const;
export const CREDIT_CONFIG={model_provider:'openai',openai_base_url:'https://chatgpt.com/backend-api/codex',chatgpt_base_url:'https://chatgpt.com/backend-api/',forced_login_method:'chatgpt','agents.enabled':false,'otel.exporter':'none','otel.trace_exporter':'none','otel.metrics_exporter':'none','otel.log_user_prompt':false,'analytics.enabled':false,service_tier:'default','skills.include_instructions':false,'skills.bundled.enabled':false,compact_prompt:'Summarize only the supplied private synthetic BotSquad discussion, its exact references, unresolved questions and remaining local limits. Never add external context or authority.'} as const;
export function creditEnvironment(source:NodeJS.ProcessEnv=process.env):NodeJS.ProcessEnv {
 return Object.fromEntries(['HOME','PATH','CODEX_HOME','TMPDIR','TMP','TEMP','LANG','LC_ALL','LC_CTYPE'].filter(k=>source[k]!==undefined).map(k=>[k,source[k]]));
}
export function validateCreditConfig(config:Record<string,unknown>){
 for(const [key,value] of Object.entries(CREDIT_CONFIG)){const actual=key.split('.').reduce<unknown>((o,k)=>o&&typeof o==='object'?(o as Record<string,unknown>)[k]:undefined,config);requireThat(actual===value,'Credit pilot runtime configuration mismatch: '+key);}
 const features=config.features as Record<string,unknown>|undefined;requireThat(CREDIT_DISABLED_FEATURES.every(f=>features?.[f]===false),'Credit pilot native-agent/proxy confinement missing');
}
export function validateCreditInput(options:CreditRuntimeOptions,input:RuntimeInput,policy:ActivityPolicy){
 requireThat(policy.mode==='credit_approved_private_pilot'&&policy.pilotId===options.pilotId&&policy.maxPilot===4&&policy.maxDurationMs<=300000&&policy.existingCreditsApproved&&policy.providerRetriesAccepted,'Exact approved credit pilot policy required');
 verifyPilotRoot(options.disposableRoot,options.pilotId);
 const r=relative(options.disposableRoot,input.worker.workspace_path);requireThat(r.startsWith('workspaces'+sep)&&!r.split(sep).includes('..'),'Worker outside disposable pilot root');
 requireThat(input.mode==='conversation'&&input.admitSubscription&&input.usage&&input.localDeadline&&Date.parse(input.localDeadline)>Date.now()&&Date.parse(input.localDeadline)<=Date.now()+policy.maxDurationMs,'Durable pilot admission, usage and absolute deadline required');
 requireThat(input.worker.ai_model===options.model,'Exact pilot model required');
 const allowed=['read_discussion','read_group_history','read_group_record','submit_contribution','facilitate_discussion','submit_synthesis','paper_inspect'];
 requireThat(input.tools.some(t=>t.name==='read_discussion')&&input.tools.every(t=>allowed.includes(t.name)),'Private pilot tools exceed reviewed surface');
}

/** Salt to this private pilot; retain neither account email nor routing identifier. */
export function creditAccountFingerprint(value:unknown,pilotId:string){
 const v=value as {account?:{type?:string;email?:unknown;planType?:unknown};workspaceRouting?:{chatgptAccountId?:unknown;backendOrigin?:unknown}|null};
 const email=v?.account?.email,accountId=v?.workspaceRouting?.chatgptAccountId;
 requireThat(v?.account?.type==='chatgpt'&&(typeof email==='string'&&email.length>0||typeof accountId==='string'&&accountId.length>0),'Stable supported ChatGPT account identity unavailable');
 if(v.workspaceRouting)requireThat(v.workspaceRouting.backendOrigin==='https://chatgpt.com','Unsupported account backend routing');
 return createHash('sha256').update(JSON.stringify({pilotId,email:email??null,accountId:accountId??null,planType:v.account.planType,backendOrigin:v.workspaceRouting?.backendOrigin??null})).digest('hex');
}

/** Pinned v0.157.0 requirements. Null means unrestricted; missing/error is not null. */
export function validateCreditRequirements(value:unknown,account:unknown,config:Record<string,unknown>){
 const response=value as {requirements?:Record<string,unknown>|null};
 requireThat(response&&typeof response==='object'&&!Array.isArray(response)&&Object.hasOwn(response,'requirements'),'Account requirements unavailable');
 const r=response.requirements;
 requireThat(r===null||!!r&&typeof r==='object'&&!Array.isArray(r),'Account requirements malformed');
 const requirement=r??{};
 requireThat(requirement.modelProvider==null||requirement.modelProvider==='openai','Required model provider denied');
 const providers=requirement.modelProviders;
 requireThat(providers==null||typeof providers==='object'&&!Array.isArray(providers)&&Object.keys(providers).length===0,'Managed provider definitions unsupported in private pilot');
 for(const [key,required] of [['allowedLoginMethods','chatgpt'],['allowedApprovalPolicies','never'],['allowedSandboxModes','read-only'],['allowedWebSearchModes','disabled']] as const){
  const values=requirement[key];requireThat(values==null||Array.isArray(values)&&values.includes(required),'Required account/confinement policy denied');
 }
 requireThat(requirement.additionalDeveloperInstructions==null||requirement.additionalDeveloperInstructions==='','Managed instructions prevent synthetic-only pilot context');
 requireThat(requirement.models==null&&requirement.modelCatalogJson==null,'Managed model overrides unsupported in private pilot');
 requireThat(requirement.enforceResidency==null||requirement.enforceResidency==='us','Required residency unsupported');
 const base=requirement.chatgptBaseUrl;
 if(base!=null){let url:URL|undefined;try{if(typeof base==='string')url=new URL(base);}catch{}requireThat(url?.origin==='https://chatgpt.com'&&!url.username&&!url.password&&!url.search&&!url.hash,'Required account backend denied');}
 const requiredFeatures=requirement.featureRequirements;
 if(requiredFeatures!=null){requireThat(typeof requiredFeatures==='object'&&!Array.isArray(requiredFeatures),'Feature requirements malformed');const actual=config.features as Record<string,unknown>|undefined;for(const [key,v] of Object.entries(requiredFeatures))requireThat(typeof v==='boolean'&&actual?.[key]===v,'Required feature policy not applied');}
 const a=account as {workspaceRouting?:{chatgptAccountId?:unknown;backendOrigin?:unknown;accountRoutingOverride?:unknown}|null};
 const route=a?.workspaceRouting;
 requireThat(route==null||typeof route==='object'&&!Array.isArray(route)&&typeof route.chatgptAccountId==='string'&&route.chatgptAccountId.length>0&&route.backendOrigin==='https://chatgpt.com'&&['NO_CONSTRAINT','us','us_cr'].includes(String(route.accountRoutingOverride)),'Account routing unavailable or unsupported');
 const forced=config.forced_chatgpt_workspace_id;
 requireThat(forced==null||typeof forced==='string'&&forced.length>0||Array.isArray(forced)&&forced.length>0&&forced.every(x=>typeof x==='string'&&x.length>0),'Required workspace malformed');
 const workspaces=forced==null?null:typeof forced==='string'?[forced]:forced as string[];
 requireThat(!workspaces||typeof route?.chatgptAccountId==='string'&&workspaces.includes(route.chatgptAccountId),'Required workspace mismatch');
 // Separate salted digest preserves the historical identity fingerprint format.
 return {requiredProvider:requirement.modelProvider??null,requiredBackend:base??null,residency:requirement.enforceResidency??null,workspaces:workspaces?[...workspaces].sort():null,routingOverride:route?.accountRoutingOverride??null,mcpServers:Object.keys(config.mcp_servers??{}).sort()};
}

export interface DisabledSkill {path:string;enabled:false}
export function rejectGlobalInstructions(env:NodeJS.ProcessEnv=process.env){
 const home=env.CODEX_HOME??join(env.HOME??homedir(),'.codex');requireThat(isAbsolute(home),'Absolute existing Codex authentication home required');
 for(const name of ['AGENTS.md','AGENTS.override.md']){let info;try{info=statSync(join(home,name));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')continue;throw Error('Cannot establish global instruction isolation');}requireThat(info.isFile()&&info.size===0,'Global Codex instructions prevent synthetic-only pilot context');}
}
export function disabledSkills(value:unknown,workspace:string,expected?:DisabledSkill[]):DisabledSkill[]{
 const v=value as {data?:{cwd?:unknown;skills?:{path?:unknown;enabled?:unknown}[];errors?:unknown[]}[]};
 requireThat(v?.data?.length===1&&v.data[0]?.cwd===workspace&&Array.isArray(v.data[0].skills)&&v.data[0].skills.length<=512&&Array.isArray(v.data[0].errors)&&v.data[0].errors.length===0,'Cannot establish exact workspace skill isolation');
 const skills=v.data[0].skills.map(s=>{requireThat(typeof s.path==='string'&&isAbsolute(s.path)&&s.path.length<=2048&&typeof s.enabled==='boolean'&&(!expected||s.enabled===false),'Inherited skill remains enabled or malformed');return {path:s.path,enabled:false as const};});
 requireThat(new Set(skills.map(s=>s.path)).size===skills.length&&JSON.stringify(skills).length<=48000,'Skill isolation metadata bound exceeded');
 if(expected)requireThat(JSON.stringify(skills.map(s=>s.path).sort())===JSON.stringify(expected.map(s=>s.path).sort()),'Inherited skill inventory changed');return skills;
}
export function skillOverride(skills:DisabledSkill[]){return '['+skills.map(s=>`{path=${JSON.stringify(s.path)},enabled=false}`).join(',')+']';}
export function privateContext(value:unknown){return JSON.stringify(value).replaceAll('$','\\u0024');}
