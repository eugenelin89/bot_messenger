import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { publicAddress,publicUrl } from '../research/public-fetch.js';
import { requireThat, strictObject } from './model.js';

export const COMPUTER_VERSION = 'computer-v1';
export const COMPUTER_ACTIONS = ['snapshot','navigate','click','type','press','scroll','request_protected_action','execute_approved','finish'] as const;
export type ComputerAction = typeof COMPUTER_ACTIONS[number];
export interface ComputerPolicy {
  version: typeof COMPUTER_VERSION; environment: 'isolated-chromium';
  origins: string[]; fixtureOrigins: string[]; mutationPaths: string[];
  actions: ComputerAction[]; uploads: 'deny'; downloads: 'deny';
  maxRuntimeSeconds: number; idleSeconds: number; maxActions: number; maxNavigations: number;
  maxScreenshots: number; maxScreenshotBytes: number; maxRequests: number; maxNetworkBytes: number;
  expiresAt: string;
}
export type ComputerState = 'requested'|'ready'|'provisioning'|'active'|'awaiting_approval'|'completed'|'denied'|'interrupted'|'expired'|'failed'|'unknown';
export interface ComputerSession {
  session_id: string; worker_id: string; task_id: string; policy: string; policy_hash: string;
  state: ComputerState; generation: number; active_execution_id: string|null;
  process_identity: string|null; created_at: string; started_at: string|null; stopped_at: string|null;
  deadline: string|null; last_action_at: string|null; actions: number; navigations: number;
  screenshots: number; screenshot_bytes: number; requests: number; network_bytes: number;
  current_url: string|null; page_hash: string|null; error: string|null; shutdown_confirmed: number;
}
export interface ComputerGrant { grant_id:string; session_id:string; worker_id:string; task_id:string; policy_hash:string; issued_by:string; created_at:string; expires_at:string; revoked_at:string|null }
export interface ComputerIntent {
  intent_id:string; session_id:string; worker_id:string; task_id:string; execution_id:string; generation:number;
  policy_hash:string; request:string; request_hash:string; page_hash:string; state:'captured'|'pending'|'approved'|'denied'|'transmitting'|'completed'|'failed'|'unknown'|'cancelled';
  reason:string|null; created_at:string; expires_at:string; decided_at:string|null; decided_by:string|null;
  consumed_execution_id:string|null; result:string|null;
}
export interface BrowserRequest { url:string; method:string; headers:Record<string,string>; body:string; resourceType:string }
export interface CanonicalRequest { url:string; method:'GET'|'HEAD'|'POST'; headers:Record<string,string>; body:string }
export interface BrowserResponse { status:number; headers:Record<string,string>; body:string }
export interface PageSnapshot { url:string; title:string; text:string; elements:{ref:string;tag:string;role:string;name:string;type:string;value:string;checked:boolean;href:string}[]; hash:string }
export const computerHash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');

function integer(v:unknown, name:string, fallback:number, min:number, max:number) {
  const n=v===undefined?fallback:v; requireThat(Number.isInteger(n)&&Number(n)>=min&&Number(n)<=max,`Invalid ${name}`);return Number(n);
}
function list(v:unknown,name:string,max:number):string[] {
  requireThat(Array.isArray(v)&&v.length<=max&&v.every(x=>typeof x==='string')&&new Set(v).size===v.length,`Invalid ${name}`);return [...v];
}
export function parseComputerPolicy(input:unknown, fixtureCeiling:readonly string[]=[], time=Date.now()):ComputerPolicy {
  const a=strictObject(input,['version','environment','origins','fixtureOrigins','mutationPaths','actions','uploads','downloads','maxRuntimeSeconds','idleSeconds','maxActions','maxNavigations','maxScreenshots','maxScreenshotBytes','maxRequests','maxNetworkBytes','expiresAt']);
  requireThat(a.version===undefined||a.version===COMPUTER_VERSION,'Unsupported Computer Use policy');
  requireThat(a.environment===undefined||a.environment==='isolated-chromium','Only isolated Chromium is supported');
  requireThat((a.uploads===undefined||a.uploads==='deny')&&(a.downloads===undefined||a.downloads==='deny'),'Uploads and downloads are disabled');
  const fixtures=list(a.fixtureOrigins??[],'fixture origins',2);
  requireThat(fixtures.every(x=>fixtureCeiling.includes(x)),'Fixture origin exceeds trusted deployment ceiling');
  const origins=list(a.origins,'origins',8);requireThat(origins.length>0,'At least one explicit origin required');
  for(const value of origins) {
    const u=new URL(value);requireThat(u.origin===value&&!u.username&&!u.password,'Use exact canonical origins');
    if(fixtures.includes(value))requireThat(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&Number(u.port)>=1024&&u.port!=='4310','Fixture must be an isolated loopback service');
    else {requireThat(u.protocol==='https:'&&(u.port===''||u.port==='443'),'Public browser origins require HTTPS port 443');publicComputerHost(u);}
  }
  requireThat(fixtures.every(x=>origins.includes(x)),'Fixture must also be an allowed origin');
  const paths=list(a.mutationPaths??[],'fixture mutation paths',4);
  requireThat(!paths.length||fixtures.length>0,'Protected mutations are supported only on explicit disposable fixtures');
  requireThat(paths.every(x=>/^\/[a-zA-Z0-9_/-]{1,100}$/.test(x)&&!x.includes('..')),'Invalid fixture mutation path');
  const actions=list(a.actions??[...COMPUTER_ACTIONS],'actions',COMPUTER_ACTIONS.length) as ComputerAction[];
  requireThat(actions.every(x=>(COMPUTER_ACTIONS as readonly string[]).includes(x)),'Unsupported action');
  requireThat(typeof a.expiresAt==='string'&&new Date(a.expiresAt).toISOString()===a.expiresAt&&Date.parse(a.expiresAt)>time&&Date.parse(a.expiresAt)<=time+86400000,'Policy expiry must be within 24 hours');
  return {version:COMPUTER_VERSION,environment:'isolated-chromium',origins,fixtureOrigins:fixtures,mutationPaths:paths,actions,uploads:'deny',downloads:'deny',
    maxRuntimeSeconds:integer(a.maxRuntimeSeconds,'runtime',600,10,900),idleSeconds:integer(a.idleSeconds,'idle timeout',120,5,300),
    maxActions:integer(a.maxActions,'actions',80,1,100),maxNavigations:integer(a.maxNavigations,'navigations',20,1,30),
    maxScreenshots:integer(a.maxScreenshots,'screenshots',12,1,20),maxScreenshotBytes:integer(a.maxScreenshotBytes,'screenshot bytes',10485760,1024,20971520),
    maxRequests:integer(a.maxRequests,'requests',200,1,400),maxNetworkBytes:integer(a.maxNetworkBytes,'network bytes',16777216,1024,33554432),expiresAt:a.expiresAt};
}
function publicComputerHost(u:URL) {
  const host=u.hostname.replace(/^\[|\]$/g,'');
  if(isIP(host))requireThat(publicAddress(host),'Protected network address');
  else requireThat(host.includes('.')&&!/(?:^|\.)(?:localhost|local|internal|intranet|lan|home|test|invalid|example|onion)$/.test(host),'Protected hostname');
}
export function computerUrl(value:string,policy:ComputerPolicy):URL {
  requireThat(typeof value==='string'&&value.length<=2048&&!/[\u0000-\u0020\u007f\\]/.test(value),'Invalid browser URL');
  const u=new URL(value);requireThat(!u.username&&!u.password&&policy.origins.includes(u.origin),'URL origin is outside the approved policy');
  requireThat(u.protocol==='https:'||policy.fixtureOrigins.includes(u.origin)&&u.protocol==='http:','URL scheme denied');
  if(!policy.fixtureOrigins.includes(u.origin))publicUrl(value);
  u.hash='';return u;
}
export function canonicalBrowserRequest(raw:BrowserRequest,policy:ComputerPolicy):CanonicalRequest {
  const url=computerUrl(raw.url,policy);requireThat(['GET','HEAD','POST'].includes(raw.method),'Request method denied');
  requireThat(typeof raw.body==='string'&&Buffer.byteLength(raw.body,'base64')<=16384,'Request body exceeds bound');
  const headers:Record<string,string>={'user-agent':'BotSquad/0.1 bounded-browser','accept':'*/*','accept-encoding':'identity'};
  if(raw.method==='POST') {
    requireThat(policy.fixtureOrigins.includes(url.origin)&&policy.mutationPaths.includes(url.pathname)&&!url.search,'Mutation is outside the disposable fixture policy');
    const contentType=raw.headers['content-type']??'';
    requireThat(/^(application\/(?:json|x-www-form-urlencoded)|text\/plain)(?:; ?charset=[\w-]+)?$/i.test(contentType),'Unsupported protected request content type');
    headers['content-type']=contentType;headers.origin=url.origin;
  } else requireThat(raw.body==='','Read requests cannot have a body');
  // Cookies, auth, method overrides, arbitrary Origin/Referer and custom headers
  // are never forwarded. This complete canonical request is the approval envelope.
  return {url:url.href,method:raw.method as CanonicalRequest['method'],headers,body:raw.body};
}
