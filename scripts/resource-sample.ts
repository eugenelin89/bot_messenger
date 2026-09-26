import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

// Lightweight, bounded Linux acceptance instrumentation; never captures argv/env.
const output = process.argv[2];
if (!output || process.platform !== 'linux') throw new Error('Usage: resource-sample OUTPUT.jsonl (Linux)');
const sample = () => {
  const mem = Object.fromEntries(readFileSync('/proc/meminfo','utf8').split('\n').filter(Boolean).map(line => {
    const [key,value] = line.split(':'); return [key,Number(value?.trim().split(/\s/)[0])];
  }));
  const processes = execFileSync('/usr/bin/ps',['-u',String(process.getuid!()),'-o','pid=,comm=,rss=,pcpu='],{encoding:'utf8',timeout:2000})
    .trim().split('\n').map(line=>{const [pid,command,rss,cpu]=line.trim().split(/\s+/);return {pid:Number(pid),command,rss_kib:Number(rss),cpu_percent:Number(cpu)};});
  appendFileSync(output, JSON.stringify({at:new Date().toISOString(),memory_total_kib:mem.MemTotal,memory_available_kib:mem.MemAvailable,
    swap_total_kib:mem.SwapTotal,swap_free_kib:mem.SwapFree,load:readFileSync('/proc/loadavg','utf8').trim(),
    service_user_rss_kib:processes.reduce((sum,p)=>sum+p.rss_kib,0),processes})+'\n',{mode:0o600});
};
sample();const timer=setInterval(sample,2000);const deadline=setTimeout(()=>{clearInterval(timer);},30*60*1000);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{clearInterval(timer);clearTimeout(deadline);sample();process.exit(0);});
