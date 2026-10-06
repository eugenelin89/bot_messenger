#!/usr/bin/python3
"""Explicit test-only operator fault; never worker-accessible or a production action."""
import json,os,pathlib,pwd,signal,time
root=pathlib.Path('/var/lib/botsquad/validation/computer-20261005-worker2')
assert os.geteuid()==0
assert json.loads((root/'validation-manifest.json').read_text())['purpose']=='C10-1 isolated real worker'
marker=root/'kill-browser.json'
for attempt in range(120):
 if marker.exists():break
 time.sleep(1)
assert marker.exists(),'No armed worker-browser fault'
assert not (root/'browser-killed.json').exists(),'Fault already performed'
uid=pwd.getpwnam('botsquad-browser').pw_uid
pids=pathlib.Path('/sys/fs/cgroup/system.slice/botsquad-computer-browser-validation.service/cgroup.procs').read_text().split()
chosen=[]
for pid in pids:
 try:
  p=pathlib.Path('/proc')/pid;cmd=(p/'cmdline').read_bytes().split(b'\0')
  if cmd[0]==b'/opt/chromium/chrome' and not any(x.startswith(b'--type=') for x in cmd):
   assert p.stat().st_uid==uid
   chosen.append(int(pid))
 except FileNotFoundError:pass
assert len(chosen)==1,chosen
os.kill(chosen[0],signal.SIGKILL)
(root/'browser-killed.json').write_text(json.dumps({'label':'Deliberate SIGKILL of isolated Chromium after real navigation/screenshot','pid':chosen[0],'scope':json.loads(marker.read_text()),'at':time.time()},indent=2))
print('Killed only the armed isolated validation Chromium',chosen[0])
