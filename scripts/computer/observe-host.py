#!/usr/bin/python3
"""Root/operator read-only evidence; no secrets or browser-control APIs exposed."""
import json,os,pathlib,subprocess,time,urllib.request
unit='botsquad-computer-browser-validation.service'
records=[]
for sample in range(45):
 props=dict(line.split('=',1) for line in subprocess.check_output(['systemctl','show',unit,'-p','MemoryCurrent','-p','MemoryPeak','-p','CPUUsageNSec','-p','TasksCurrent','-p','MemoryMax','-p','MemorySwapMax','-p','CPUQuotaPerSecUSec','-p','TasksMax'],text=True).splitlines())
 procs=[];proof=[]
 try:pids=pathlib.Path('/sys/fs/cgroup/system.slice/'+unit+'/cgroup.procs').read_text().split()
 except FileNotFoundError:pids=[]
 for pid in pids:
  try:
   status=dict(line.split(':',1) for line in pathlib.Path('/proc/'+pid+'/status').read_text().splitlines() if ':' in line)
   cmd=pathlib.Path('/proc/'+pid+'/cmdline').read_bytes().split(b'\0')
   procs.append({'pid':int(pid),'name':status['Name'].strip(),'rss_kib':int(status.get('VmRSS','0 kB').split()[0]),'seccomp':status.get('Seccomp','').strip(),'cap_effective':status.get('CapEff','').strip()})
   if cmd[0]==b'/opt/chromium/chrome' and not any(x.startswith(b'--type=') for x in cmd):
    root='/proc/'+pid+'/root';env=pathlib.Path('/proc/'+pid+'/environ').read_bytes().split(b'\0');names=[x.split(b'=',1)[0].decode(errors='replace') for x in env if x]
    proof.append({'pid':pid,'environment_keys':names,'host_paths_visible':{x:os.path.exists(root+x) for x in ['/var/lib/botsquad','/root','/home/botsquad','/etc/botsquad','/etc/passwd','/run/botsquad-provisioner.sock']},'private_home':os.path.isdir(root+'/home/browser/profile'),'namespace_differs_from_host':{n:os.readlink('/proc/'+pid+'/ns/'+n)!=os.readlink('/proc/1/ns/'+n) for n in ['mnt','pid','net','user']},'sandbox_disabled':b'--no-sandbox' in cmd,'private_proc_count':len([x for x in os.listdir(root+'/proc') if x.isdigit()])})
  except (FileNotFoundError,ProcessLookupError,PermissionError):pass
 started=time.monotonic()
 try:
  with urllib.request.urlopen('http://127.0.0.1:4310/api/health',timeout=2) as response:health=json.load(response)
  healthy=health.get('alive') and health.get('runtime')=='ready'
 except Exception:healthy=False
 records.append({'at':time.time(),'service':props,'processes':procs,'rss_sum_kib':sum(x['rss_kib'] for x in procs),'isolation':proof,'production_healthy':healthy,'production_health_ms':round((time.monotonic()-started)*1000,2)})
 pathlib.Path('/var/lib/botsquad/validation/computer-20261005-records/resources.json').write_text(json.dumps(records,indent=2))
 time.sleep(2)
print(json.dumps({'samples':len(records),'max_processes':max(len(x['processes']) for x in records),'max_rss_sum_kib':max(x['rss_sum_kib'] for x in records),'all_production_healthy':all(x['production_healthy'] for x in records)}))
