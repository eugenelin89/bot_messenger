import {execFileSync} from 'node:child_process';
import {expireResearchContent} from '../src/control/investment-team/research-retention.js';
/** Cold retention pass after the independent supervisor has stopped and joined HQ. */
import {readFileSync,lstatSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {acquireDataLock} from '../src/persistence/lock.js';
import {researchHostPaths,purgeResearchRuntime,type ResearchHostManifest} from '../src/control/market/research-host.js';
import {requireThat} from '../src/domain/model.js';
const authorityId=process.argv[2]??'',paths=researchHostPaths(authorityId),st=lstatSync(paths.manifest),m=JSON.parse(readFileSync(paths.manifest,'utf8')) as ResearchHostManifest;
requireThat(process.platform==='linux'&&process.getuid?.()===m.hqUid&&st.uid===0&&(st.mode&0o022)===0&&m.authorityId===authorityId&&Date.now()>=Date.parse(m.retainUntil),'Exact expired research host required');
const service=Object.fromEntries(execFileSync('/usr/bin/systemctl',['show',m.service,'-p','ActiveState','-p','MainPID','-p','KillMode','-p','ControlGroup'],{encoding:'utf8',timeout:2000}).trim().split('\n').map(l=>l.split('=')));
requireThat(['inactive','failed'].includes(service.ActiveState??'')&&service.MainPID==='0'&&service.KillMode==='control-group','Cold research purge requires a stopped and joined HQ service');
if(service.ControlGroup)requireThat(/^populated 0$/m.test(readFileSync('/sys/fs/cgroup'+service.ControlGroup+'/cgroup.events','utf8')),'HQ descendants have not terminated');
const unlock=acquireDataLock(m.hqRoot),store=new Store(join(m.hqRoot,'company.sqlite'));
try{const company=new Company(store,m.hqRoot,fileURLToPath(new URL('../../',import.meta.url)));company.finiteHQ.discover();try{company.recover();expireResearchContent(company,new Date().toISOString(),true);purgeResearchRuntime(authorityId);requireThat(!store.get("SELECT 1 FROM private_research_runs r WHERE json_extract(configuration,'$.policy.authorityId')=? AND NOT EXISTS(SELECT 1 FROM private_research_purges p WHERE p.run_id=r.run_id)",authorityId),'Research purge remains incomplete');}finally{company.finiteHQ.close();}}finally{store.close();unlock();}
