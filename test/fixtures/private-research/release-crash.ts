// SIGKILL boundaries in disposable authored state; never a provider connection.
import {writeFileSync} from 'node:fs';
import {recoveryFixture} from './recovery.js';
const [phase,report]=process.argv.slice(2),f=recoveryFixture(),j=f.authority.journal;
writeFileSync(report!,JSON.stringify({root:f.dir,journal:j.path,custody:j.custodyPath,authorityId:f.policy.authorityId,at:f.clock.now(),scopeId:f.result.scopeId,release:f.release}));
const kill=()=>{process.kill(process.pid,'SIGKILL');throw Error('SIGKILL failed');};
const internals=j as unknown as {custody:(head:unknown)=>void;append:(...args:unknown[])=>void};
if(phase==='before_commit'){const original=internals.append.bind(j);internals.append=(...args)=>{original(...args);if(args[1]==='resume')kill();};}
if(phase==='before_custody')internals.custody=kill;
if(phase==='after_custody'){const original=internals.custody.bind(j);internals.custody=head=>{original(head);kill();};}
await f.company.finiteHQ.releaseResearchRecovery(f.release);kill();
