/** A private code deployment cannot spend an old publication restart permit. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {Company} from '../src/control/company.js';
import {reconcileProductionRestart} from '../src/control/publication/operational-restart.js';

test('changed deployment SHA fences publication before custody, permit claim or transport',async t=>{
 const directory=realpathSync(mkdtempSync(join(tmpdir(),'publication-deployment-fence-')));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const path=join(directory,'restart.json'),publicationConfig=join(directory,'not-accessed.json');
 const config=JSON.stringify({version:1,directory:join(directory,'custody-not-accessed'),channelId:'authored-channel',targetSha:'a'.repeat(40),publicationConfig});
 writeFileSync(path,config,{mode:0o600});
 let publicationAccess=0;
 const company=Object.defineProperty({},'publication',{get(){publicationAccess++;throw Error('No publication access before the deployment fence');}}) as Company;
 await assert.rejects(reconcileProductionRestart(company,path,publicationConfig,'b'.repeat(40)),{message:'CONFLICT'});
 assert.equal(publicationAccess,0);
 assert.equal(readFileSync(path,'utf8'),config);
 // No valid finite journal, publication config or custody directory exists in this
 // fixture. Reaching any of them would produce a different error, never CONFLICT.
});
