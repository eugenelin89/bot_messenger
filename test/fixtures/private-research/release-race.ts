import {FiniteJournal} from '../../../src/control/usage/finite-journal.js';
import {hash} from '../../../src/domain/investment/identity.js';
const [path,custody,authorityId,release,at]=process.argv.slice(2) as [string,string,string,string,string];
const j=new FiniteJournal(path,custody);process.send!('ready');
process.once('message',()=>{try{const input=JSON.parse(release);j.releaseResearchRecovery(authorityId,input.digest,input.receiptId,hash(input),at);process.exitCode=0;}catch{process.exitCode=2;}finally{j.close();process.disconnect();}});
