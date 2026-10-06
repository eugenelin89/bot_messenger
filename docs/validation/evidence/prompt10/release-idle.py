import json,pathlib,subprocess,sys,time
sha=sys.argv[1];root=pathlib.Path(sys.argv[2]);label=sys.argv[3]
def snapshot():
 return json.loads(subprocess.check_output(['python3','/var/tmp/botsquad-prompt10-release-gates.py',sha],text=True))
before=snapshot();time.sleep(30);after=snapshot()
assert after['at']-before['at']>=30
assert {k:v for k,v in before.items() if k!='at'}=={k:v for k,v in after.items() if k!='at'}
services=subprocess.check_output(['systemctl','list-units','--state=running','--type=service','--no-legend'],text=True)
owned=[line for line in services.splitlines() if any(token in line for token in ['prompt10','computer-fixture','computer-validation','botsquad-computer-regression'])]
assert owned==[],owned
result={'before':before,'after':after,'seconds':after['at']-before['at'],'new_executions':0,'new_computer_sessions':0,'new_computer_grants':0,'chromium_processes':0,'owned_temporary_services_running':owned,'ui_inspection_started_no_work':True}
(root/(label+'.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'idle_gate':'pass','seconds':result['seconds'],'new_executions':0,'new_browser_work':0,'temporary_services_running':0}))
