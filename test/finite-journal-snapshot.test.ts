import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {copyFileSync,mkdtempSync,mkdirSync,readFileSync,realpathSync,renameSync,rmSync,symlinkSync,unlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {FiniteJournal} from '../src/control/usage/finite-journal.js';
import {runningFiniteFixture} from './fixtures/finite-hq/support.js';

test('verified journal snapshots isolate caller mutations and see another writer immediately',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const j=f.authority.journal,id=f.policy.authorityId,at=f.clock.now();
 const s=j.check(id,at);s.authorities.get(id)!.policy.maxRun=999;s.stopped.add(id);s.holds.set(id,'forged');
 assert.equal(j.envelope(id).policy.maxRun,10);assert.equal(j.counts(id,at).hold,null);assert.equal(j.counts(id,at).stopped,false);
 const other=new FiniteJournal(j.path,j.custodyPath);try{other.ownerControl(id,'pause','other-writer','request-hash',undefined,at);}finally{other.close();}
 assert.match(j.counts(id,at).hold!,/Owner/);assert.throws(()=>j.check(id,at),/Owner/);
});

test('warm snapshot detects changed historical payload with identical head and custody',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const j=f.authority.journal,id=f.policy.authorityId,at=f.clock.now();j.counts(id,at);
 const db=new DatabaseSync(j.path);try{db.exec('DROP TRIGGER immutable');db.prepare("UPDATE events SET payload=? WHERE kind='approve'").run('{}');}finally{db.close();}
 assert.throws(()=>j.counts(id,at),/history discontinuity/);
});

test('warm snapshot rechecks independent custody and does not poison a later exact restore',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const j=f.authority.journal,id=f.policy.authorityId,at=f.clock.now(),custody=readFileSync(j.custodyPath,'utf8'),before=j.counts(id,at);
 writeFileSync(j.custodyPath,'{}');assert.throws(()=>j.counts(id,at),/custody mismatch/);writeFileSync(j.custodyPath,custody);assert.deepEqual(j.counts(id,at),before);
});

test('warm snapshot still checks canonical HQ root independently of authority file paths',t=>{
 const f=runningFiniteFixture(t),dir=realpathSync(mkdtempSync(join(tmpdir(),'finite-cache-root-')));mkdirSync(join(dir,'journal'),{mode:0o700});mkdirSync(join(dir,'custody'),{mode:0o700});const path=join(dir,'journal','authority.sqlite'),custody=join(dir,'custody','checkpoint.json');copyFileSync(f.authority.journal.path,path);copyFileSync(f.authority.journal.custodyPath,custody);const j=new FiniteJournal(path,custody),root=f.company.dataDir,moved=root+'-moved';let relocated=false;
 t.after(()=>{j.close();if(relocated){unlinkSync(root);renameSync(moved,root);}f.close();rmSync(dir,{recursive:true,force:true});});j.counts(f.policy.authorityId,f.clock.now());renameSync(root,moved);symlinkSync(moved,root);relocated=true;
 assert.throws(()=>j.counts(f.policy.authorityId,f.clock.now()),/canonical HQ/);
});

test('failed transaction after an appended hold cannot poison the verified snapshot',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const j=f.authority.journal,id=f.policy.authorityId,at=f.clock.now(),before=j.counts(id,at),db=new DatabaseSync(j.path);
 try{db.exec("CREATE TRIGGER cache_abort BEFORE INSERT ON events WHEN NEW.kind='owner_receipt' BEGIN SELECT RAISE(ABORT,'fixture rollback'); END;");assert.throws(()=>j.ownerControl(id,'pause','rollback','rollback',undefined,at),/fixture rollback/);db.exec('DROP TRIGGER cache_abort');}finally{db.close();}
 assert.deepEqual(j.counts(id,at),before);assert.doesNotThrow(()=>j.check(id,at));
});

test('warm snapshot rejects database commit when independent custody write fails',t=>{
 const f=runningFiniteFixture(t);t.after(f.close);const j=f.authority.journal,id=f.policy.authorityId,at=f.clock.now();j.counts(id,at);
 const fault=j as unknown as {custody:(head:unknown)=>void},original=fault.custody;fault.custody=()=>{throw Error('fixture custody write failed');};
 try{assert.throws(()=>j.ownerControl(id,'pause','partial','partial',undefined,at),/fixture custody write failed/);}finally{fault.custody=original;}
 assert.throws(()=>j.counts(id,at),/custody mismatch/);assert.throws(()=>j.check(id,at),/custody mismatch/);
});
