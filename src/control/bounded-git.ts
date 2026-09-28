import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {HARD_BOUNDS} from '../domain/projects.js';

const gitEnv={PATH:'/usr/bin:/bin',LANG:'C',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',GIT_NO_REPLACE_OBJECTS:'1',GIT_LFS_SKIP_SMUDGE:'1'};
export function boundedGit(sourceRoot:string,cwd:string,args:string[],input?:Buffer|string,maxBuffer:number=HARD_BOUNDS.diff_bytes):Buffer {
  return execFileSync('/usr/bin/python3',[join(sourceRoot,'deploy/bounded-git.py'),'-c',`safe.directory=${cwd}`,'-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c','core.attributesFile=/dev/null','-c','credential.helper=','-c','credential.interactive=false','-c','protocol.allow=never','-c','protocol.https.allow=always','-c','http.followRedirects=false','-c','http.proxy=','-c','http.sslVerify=true','-c','fetch.unpackLimit=0',...args],{cwd,env:gitEnv,input,timeout:30000,maxBuffer,stdio:['pipe','pipe','pipe']});
}
