// Separate fake processes contend on the same disposable authority. No provider calls.
import {FiniteJournal} from '../../../src/control/usage/finite-journal.js';
const [path,custody,operation,payload,at]=process.argv.slice(2) as [string,string,string,string,string];
let j:FiniteJournal|undefined;try{j=new FiniteJournal(path,custody);const p=JSON.parse(payload);if(operation==='reserve')j.reserve(p,at);else j.admit(p.reservation,p.identity,at);process.exitCode=0;}catch{process.exitCode=2;}finally{j?.close();}
