import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync,realpathSync,statfsSync,rmSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from '../../domain/investment/identity.js';
import {requireThat} from '../../domain/model.js';
import type {Company} from '../company.js';

export const researchHostPaths=(authorityId:string)=>{requireThat(/^[a-zA-Z0-9_-]{1,100}$/.test(authorityId),'Invalid research authority');return {manifest:`/etc/botsquad/private-research/${authorityId}.json`,lease:`/run/botsquad-research-guard/${authorityId}.json`,runtime:`/run/botsquad-private-research/${authorityId}`};};
export interface ResearchHostManifest {schema:1;authorityId:string;hqRoot:string;hqUid:number;bootId:string;sourceCommit:string;sourceHash:string;expiresAt:string;retainUntil:string;backupsExcluded:true;guardPid:number;guardStart:string;service:'botsquad.service'}
export interface ResearchHostSnapshot {manifest:ResearchHostManifest;manifestHash:string;expectedHash:string;authorityId:string;hqRoot:string;hqUid:number;bootId:string;sourceCommit:string;sourceHash:string;expiresAt:string;retainUntil:string;lease:{authorityId:string;pid:number;start:string;at:string};now:string;noSwap:boolean;noCore:boolean;tmpfs:boolean;guardRoot:boolean;serviceMembership:boolean}
/** Pure validation also exercised offline. Root-owned files alone do not establish a live guard. */
export function validateResearchHost(s:ResearchHostSnapshot){const m=s.manifest;
 requireThat(m.schema===1&&s.manifestHash===s.expectedHash&&m.authorityId===s.authorityId&&m.hqRoot===s.hqRoot&&m.hqUid===s.hqUid&&m.bootId===s.bootId&&m.sourceCommit===s.sourceCommit&&m.sourceHash===s.sourceHash&&m.expiresAt===s.expiresAt&&m.retainUntil===s.retainUntil&&m.backupsExcluded===true&&m.service==='botsquad.service','Exact protected research host evidence required');
 requireThat(s.noSwap&&s.noCore&&s.tmpfs&&s.guardRoot&&s.serviceMembership,'Research requires no swap/core and supervised tmpfs runtime storage');
 requireThat(s.lease.authorityId===m.authorityId&&s.lease.pid===m.guardPid&&s.lease.start===m.guardStart&&Date.parse(s.lease.at)<=Date.parse(s.now)&&Date.parse(s.now)-Date.parse(s.lease.at)<3000&&Date.parse(s.now)<Date.parse(m.expiresAt),'Independent research supervisor unavailable or expired');
}
function rootFile(path:string){for(let p=path;p!=='/';p=dirname(p)){const s=lstatSync(p);requireThat(realpathSync(p)===p&&!s.isSymbolicLink()&&s.uid===0&&(s.mode&0o022)===0,'Research host custody is not root protected');}return readFileSync(path,'utf8');}
function processStart(pid:number){const raw=readFileSync(`/proc/${pid}/stat`,'utf8');return raw.slice(raw.lastIndexOf(')')+2).split(' ')[19]!;}
const repository=fileURLToPath(new URL('../../../../',import.meta.url));
/** Hash current installed source and emitted runtime. No network, writes or deployment. */
export function researchSourceIdentity(){const git=(...a:string[])=>execFileSync('git',a,{cwd:repository,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();const commit=git('rev-parse','HEAD');requireThat(git('status','--porcelain')===''&&git('branch','--show-current')==='main','Research requires reviewed clean installed main');const files=git('ls-files','src','scripts','adapters/yahoo','package.json','package-lock.json','tsconfig.json').split('\n');return {commit,sourceHash:hash(files.map(f=>({path:f,source:readFileSync(join(repository,f),'utf8'),runtime:f.endsWith('.ts')?readFileSync(join(repository,'dist',f.replace(/\.ts$/,'.js')),'utf8'):null})))};}
export function verifyResearchHost(company:Company,scopeId:string){
 requireThat(process.platform==='linux'&&process.getuid?.()!==0,'Research requires verified Linux service custody');
 const {s,c}=company.privateResearch.assertScope(scopeId,false),authorityId=c.policy.authorityId,paths=researchHostPaths(authorityId),m=JSON.parse(rootFile(paths.manifest)) as ResearchHostManifest,lease=JSON.parse(rootFile(paths.lease)),source=researchSourceIdentity(),runtime=lstatSync(paths.runtime);
 requireThat(realpathSync(paths.runtime)===paths.runtime&&runtime.isDirectory()&&runtime.uid===process.getuid?.()&&(runtime.mode&0o077)===0,'Private research runtime ownership changed');
 for(const name of ['codex','tmp']){const p=join(paths.runtime,name),st=lstatSync(p);requireThat(realpathSync(p)===p&&st.isDirectory()&&st.uid===process.getuid?.()&&(st.mode&0o077)===0,'Private runtime child custody changed');}
 const service=Object.fromEntries(execFileSync('/usr/bin/systemctl',['show','botsquad.service','-p','ControlGroup','-p','KillMode','-p','ActiveState'],{encoding:'utf8',timeout:2000}).trim().split('\n').map(l=>l.split('='))),member=readFileSync('/proc/self/cgroup','utf8').trim().split('\n').some(l=>l==='0::'+service.ControlGroup||!!service.ControlGroup&&l.startsWith('0::'+service.ControlGroup+'/'));
 const guardStatus=readFileSync(`/proc/${m.guardPid}/status`,'utf8'),cmdline=readFileSync(`/proc/${m.guardPid}/cmdline`,'utf8').split('\0');
 requireThat(cmdline.includes(join(repository,'dist/scripts/private-research-guard.js'))&&cmdline.includes(authorityId)&&processStart(m.guardPid)===m.guardStart,'Independent supervisor identity changed');
 validateResearchHost({manifest:m,manifestHash:hash(m),expectedHash:c.retention.hostEvidenceHash,authorityId,hqRoot:realpathSync(company.dataDir),hqUid:process.getuid!(),bootId:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),sourceCommit:source.commit,sourceHash:source.sourceHash,expiresAt:c.expiresAt,retainUntil:c.retainUntil,lease,now:company.privateResearch.now(),noSwap:readFileSync('/proc/swaps','utf8').trim().split('\n').length===1,noCore:/^Max core file size\s+0\s+0\s/m.test(readFileSync('/proc/self/limits','utf8')),tmpfs:Number(statfsSync(paths.runtime).type)===0x01021994,serviceMembership:service.ActiveState==='active'&&service.KillMode==='control-group'&&!!service.ControlGroup&&member,guardRoot:/^Uid:\s+0\s+0\s+0\s+0\s*$/m.test(guardStatus)});
 requireThat(s.run_id.length>0&&!process.env.NODE_OPTIONS&&!process.env.NODE_EXTRA_CA_CERTS&&process.env.NODE_TLS_REJECT_UNAUTHORIZED!=='0','Research environment override denied');
 company.store.run('INSERT OR IGNORE INTO private_research_host_claims VALUES(?,?,?)',s.run_id,hash(m),company.privateResearch.now());
 return paths;
}
/** Called only after all local run executions have terminated. Never follows symlinks. */
export function purgeResearchRuntime(authorityId:string){const root=researchHostPaths(authorityId).runtime;if(!existsSync(root))return;const st=lstatSync(root);requireThat(realpathSync(root)===root&&st.isDirectory()&&st.uid===process.getuid?.()&&(st.mode&0o077)===0&&Number(statfsSync(root).type)===0x01021994,'Cannot safely purge research runtime');rmSync(root,{recursive:true});requireThat(!existsSync(root),'Research runtime purge failed');}
