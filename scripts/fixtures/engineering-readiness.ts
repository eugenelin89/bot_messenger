// Operator-only admission for the real concurrency acceptance, never production policy.
// Nix must settle before both engineers compete for the unchanged two dispatcher slots.
import {existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {Company} from '../../src/control/company.js';

export function installEngineeringReadinessGate(company:Company) {
  if(process.env.BOT_VALIDATION_ENGINEERING_BARRIER!=='1')return;
  if(!company.infrastructure.linux||!/^\/var\/lib\/botsquad\/validation\/(identity|projects)-/.test(company.dataDir)
    ||!['legacy-denial-fixture.json','validation-fixture.json'].some(name=>existsSync(join(company.dataDir,name))))throw new Error('Explicit isolated Linux engineering fixture required');
  const eligible=company.infrastructure.eligible.bind(company.infrastructure);
  company.infrastructure.eligible=task=>{
    if(!eligible(task))return false; // Never replace or relax normal identity/scope checks.
    if(task.kind!=='engineering')return true;
    if(company.store.get<{n:number}>("SELECT count(*) n FROM tasks WHERE kind='infrastructure' AND status!='completed'")!.n
      ||company.store.get<{n:number}>("SELECT count(*) n FROM executions e JOIN tasks t USING(task_id) WHERE t.kind='infrastructure' AND e.status='running'")!.n)return false;
    const receipt=join(company.dataDir,'engineering-readiness.json');
    if(!existsSync(receipt))writeFileSync(receipt,JSON.stringify({
      purpose:'Operator-controlled readiness admission before real overlap acceptance; not unconstrained production priority ordering',
      released_at:new Date().toISOString(),
      infrastructure_tasks:company.store.all("SELECT task_id,status FROM tasks WHERE kind='infrastructure'"),
      infrastructure_executions:company.store.all("SELECT e.execution_id,e.status,e.finished_at FROM executions e JOIN tasks t USING(task_id) WHERE t.kind='infrastructure'"),
      original_eligibility_preserved:true,max_employee_slots:2,
    },null,2),{flag:'wx',mode:0o600});
    return true;
  };
}
