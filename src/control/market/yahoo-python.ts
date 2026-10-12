import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { YahooChildProtocol } from './yahoo-protocol.js';
import { YAHOO_ADAPTER, type YahooAdapter, type YahooAdapterInput, type YahooQuery, type YahooResponse } from '../../domain/market/financial.js';
const adapterPath=fileURLToPath(new URL('../../../../adapters/yahoo/adapter.py',import.meta.url));
const pythonPath=fileURLToPath(new URL('../../../../adapters/yahoo/.venv/bin/python',import.meta.url));
/** Fixed executable + script; no shell, native network, inherited credentials, or arbitrary worker arguments. */
export class PythonYahooAdapter implements YahooAdapter {
  readonly kind=YAHOO_ADAPTER;
  read(input:YahooAdapterInput,exchange:(query:YahooQuery)=>Promise<YahooResponse>,signal:AbortSignal):Promise<string> {
    return new Promise((resolve,reject)=>{
      if(signal.aborted){reject(new Error('financial_cancelled'));return;}
      const directory=mkdtempSync(join(tmpdir(),'botsquad-yahoo-'));
      const child=spawn(pythonPath,['-I','-B',adapterPath],{cwd:directory,env:{PATH:'/usr/bin:/bin',HOME:directory,TMPDIR:directory,LANG:'C.UTF-8',YF_DISABLE_CURL_CFFI:'1',OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1'},stdio:['pipe','pipe','pipe']});
      let failed:Error|null=null;
      const fail=(error:unknown)=>{failed??=error instanceof Error?error:new Error('python_protocol');child.kill('SIGKILL');};
      const abort=()=>fail(new Error('financial_cancelled'));signal.addEventListener('abort',abort,{once:true});
      const hardTimeout=setTimeout(()=>fail(new Error('python_timeout')),120000);
      child.on('error',fail);child.stdin.on('error',()=>fail(new Error('python_stdin_closed')));
      // Never copy arbitrary provider diagnostics to logs/receipts.
      const protocol=new YahooChildProtocol((id,query)=>{
        void exchange(query).then(response=>{
          if(!failed&&!signal.aborted){protocol.respond(id);child.stdin.write(`${JSON.stringify({type:'response',id,response})}\n`);}
        },()=>fail(new Error('python_transport_denied'))).catch(fail);
      });
      child.stderr.on('data',(chunk:Buffer)=>{if(!failed)try{protocol.receive(chunk,true);}catch(e){fail(e);}});
      child.stdout.on('data',(chunk:Buffer)=>{if(!failed)try{protocol.receive(chunk);}catch(e){fail(e);}});
      child.once('close',(code)=>{
        clearTimeout(hardTimeout);signal.removeEventListener('abort',abort);rmSync(directory,{recursive:true,force:true});
        if(failed||code!==0)reject(failed??new Error('python_child_failed'));else try{resolve(protocol.finish());}catch(e){reject(e);}
      });
      child.stdin.write(`${JSON.stringify({protocol:YAHOO_ADAPTER,input})}\n`);
    });
  }
}
