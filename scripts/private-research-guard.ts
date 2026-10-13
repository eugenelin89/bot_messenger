/** Inert source for a separately authorized root systemd supervisor. Never invoked by
 * HQ startup/HTTP. Provisioning/authentication and host acceptance are operator gates. */
import {readFileSync,writeFileSync,renameSync,rmSync,lstatSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {researchHostPaths,researchSourceIdentity,type ResearchHostManifest} from '../src/control/market/research-host.js';
import {requireThat} from '../src/domain/model.js';
const authorityId=process.argv[2]??'',paths=researchHostPaths(authorityId),root=fileURLToPath(new URL('../../',import.meta.url));
requireThat(process.platform==='linux'&&process.getuid?.()===0,'Independent root supervisor only');
const st=lstatSync(paths.manifest);requireThat(st.uid===0&&(st.mode&0o022)===0&&!st.isSymbolicLink(),'Protected manifest required');
let m=JSON.parse(readFileSync(paths.manifest,'utf8')) as ResearchHostManifest;
requireThat(m.authorityId===authorityId&&m.service==='botsquad.service'&&Date.parse(m.retainUntil)-Date.parse(m.expiresAt)>=0&&Date.parse(m.retainUntil)-Date.now()<=86400000,'Exact bounded host manifest required');
const stop=()=>execFileSync('/usr/bin/systemctl',['stop',m.service],{stdio:'ignore',timeout:30000});
const source=researchSourceIdentity(),raw=readFileSync('/proc/self/stat','utf8'),start=raw.slice(raw.lastIndexOf(')')+2).split(' ')[19]!;
if(m.guardPid===0){requireThat(Date.now()<Date.parse(m.expiresAt),'Cannot initialize expired supervisor');m={...m,guardPid:process.pid,guardStart:start,bootId:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),sourceCommit:source.commit,sourceHash:source.sourceHash};writeFileSync(paths.manifest,JSON.stringify(m),{mode:0o644});}
// A restarted guard never changes approved evidence or restores model/network work.
const bound=m.guardPid===process.pid&&m.guardStart===start;
const heartbeat=()=>{if(bound&&Date.now()<Date.parse(m.expiresAt)){writeFileSync(paths.lease+'.next',JSON.stringify({authorityId,pid:process.pid,start,at:new Date().toISOString()}),{mode:0o644});renameSync(paths.lease+'.next',paths.lease);}};
let stopping=false;const fail=()=>{if(stopping)return;stopping=true;rmSync(paths.lease,{force:true});try{stop();}finally{process.exitCode=1;}};
process.on('SIGTERM',fail);process.on('SIGINT',fail);
let hqStopped=false;
try{
 while(Date.now()<Date.parse(m.retainUntil)){
  if(!bound||stopping||Date.now()>=Date.parse(m.expiresAt)){rmSync(paths.lease,{force:true});if(!hqStopped){stop();hqStopped=true;}}
  else heartbeat();
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 rmSync(paths.lease,{force:true});stop();hqStopped=true;
 // systemd must use KillMode=control-group; verify the entire cgroup is empty before
 // offline cleanup. MainPID=0 alone is insufficient for descendant settlement.
 const cgroup=execFileSync('/usr/bin/systemctl',['show',m.service,'-p','ControlGroup','--value'],{encoding:'utf8'}).trim();
 if(cgroup){const p='/sys/fs/cgroup'+cgroup+'/cgroup.events';const events=readFileSync(p,'utf8');requireThat(/^populated 0$/m.test(events),'HQ descendant cgroup still populated');}
 const account=execFileSync('/usr/bin/getent',['passwd',String(m.hqUid)],{encoding:'utf8'}).trim().split(':');requireThat(account[2]===String(m.hqUid)&&/^[a-z_][a-z0-9_-]*$/.test(account[0]??''),'HQ account identity changed');
 execFileSync('/usr/sbin/runuser',['-u',account[0]!,'--',process.execPath,join(root,'dist/scripts/private-research-expire.js'),authorityId],{stdio:'ignore',timeout:60000});
}catch{fail();throw Error('Private research guard requires operator inspection; no data emitted');}
