# Run only after the isolated stage command exits successfully; no deployment action.
import pathlib,json,hashlib,datetime,subprocess
root=pathlib.Path('/var/tmp/botsquad-investment-audit-20261014')
sha='0fabbbac0a1bb8e180556bcbe837076ca341f9c3'
paths=subprocess.check_output(['git','-C','/opt/botsquad','ls-tree','-r','--name-only',sha],text=True).splitlines()
selected=[p for p in paths if p.startswith(('src/','scripts/','public/','contracts/','adapters/')) or p in ['package.json','package-lock.json','tsconfig.json']]
for p in selected:assert (root/p).read_bytes()==subprocess.check_output(['git','-C','/opt/botsquad','show',sha+':'+p]),p
artifacts={folder:{str(p.relative_to(root/folder)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/folder).rglob('*') if p.is_file()} for folder in ['dist','public']}
r={'candidate':sha,'attestedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'stageExitCode':0,'productionInputs':len(selected),'artifacts':artifacts}
p=root/'validated.json';assert not p.exists();p.write_text(json.dumps(r,indent=2));p.chmod(0o600)
print(json.dumps({'candidate':sha,'attestedAt':r['attestedAt'],'productionInputs':len(selected),'artifacts':{k:len(v) for k,v in artifacts.items()},'manifestSha256':hashlib.sha256(p.read_bytes()).hexdigest()},indent=2))
