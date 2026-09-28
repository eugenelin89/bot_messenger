import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BrowserDriver } from './driver.js';
import { executeSteps, Recorder } from './recorder.js';
import { parseScenario, studyPlan } from './scenario.js';

const [output,expectedSha,name,scenarioFile]=process.argv.slice(2);
if(!output||!expectedSha) throw Error('Usage: npm run demo:tutorial -- NEW_ARTIFACT_DIRECTORY EXPECTED_DEPLOYED_SHA [PROJECT_NAME] [SCENARIO_JSON]');
const scenario=scenarioFile?parseScenario(JSON.parse(readFileSync(scenarioFile,'utf8'))):studyPlan(name);
const recorder=new Recorder(resolve(output));recorder.save('scenario.json',scenario);
const driver=new BrowserDriver(scenario,recorder,'http://127.0.0.1:4310',expectedSha);
let passed=false;
try {
  await driver.start();
  await executeSteps(scenario.steps,async step=>{console.log(JSON.stringify({step,at:new Date().toISOString()}));await driver.step(step);});
  passed=true;
} catch(error) {
  const message=error instanceof Error?error.message:String(error);
  recorder.record({step_id:'failure',kind:'failure',description:message,result:'fail'});
  if(driver.page) {
    try {await driver.capture('failure','Run stopped; this attempt is not a successful tutorial.','assertion');recorder.save('failed-state.json',await driver.state());await driver.pause();}
    catch(cleanupError) {recorder.record({step_id:'cleanup',kind:'failure',description:String(cleanupError),result:'fail'});}
  }
  console.error(message);process.exitCode=1;
} finally {
  try {await driver.close();} catch(error) {passed=false;process.exitCode=1;recorder.record({step_id:'recording',kind:'failure',description:String(error),result:'fail'});}
  recorder.save('run.json',{status:passed?'passed':'failed',operator:scenario.operator,version:expectedSha,project:scenario.name,finished:new Date().toISOString(),scope:driver.scope?{...driver.scope,baselineWorkers:[...driver.scope.baselineWorkers]}:null});
  console.log(JSON.stringify({result:passed?'PASS':'FAILED',artifacts:recorder.root}));
}
