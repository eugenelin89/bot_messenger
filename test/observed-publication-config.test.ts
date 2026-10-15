import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,realpathSync,writeFileSync,rmSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readObservedPublicationConfiguration} from '../src/control/publication/observed-config.js';

test('protected publication configuration supports bounded overlapping keys without changing old intervals',t=>{
 const dir=realpathSync(mkdtempSync(join(tmpdir(),'publication-keys-')));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const path=join(dir,'configuration.json'),oldPath=join(dir,'old.pem'),newPath=join(dir,'new.pem');
 for(const p of [oldPath,newPath])writeFileSync(p,generateKeyPairSync('ed25519').privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});
 const old={keyId:'old',privateKeyPath:oldPath,notBefore:'2026-10-15T00:00:00Z',notAfter:'2026-10-15T23:40:00Z'},extra={keyId:'next',privateKeyPath:newPath,notBefore:'2026-10-15T23:00:00Z',notAfter:'2026-10-16T23:40:00Z'};
 const config={runId:'run',sourceId:'source',destinationId:'destination',publisherId:'publisher',generation:'1',methodologyUrl:'https://asymmetri.co/botsquad/trade/methodology',...old};
 const load=(value:unknown)=>{writeFileSync(path,JSON.stringify(value),{mode:0o600});return readObservedPublicationConfiguration(path);};
 let result=load(config);assert.equal(result.keys.has('old',Date.parse(old.notBefore)/1000),true);assert.equal(result.keys.has('next',Date.parse(extra.notBefore)/1000),false);
 result=load({...config,additionalKey:extra});const at=Date.parse(extra.notBefore)/1000;assert.equal(result.keys.has('old',at),true);assert.equal(result.keys.has('next',at),true);assert.equal(result.keys.has('next',at-1),false);assert.equal(result.keys.has('old',Date.parse(old.notAfter)/1000),false);assert.equal(result.keys.has('next',Date.parse(old.notAfter)/1000),true);assert.equal(result.keys.has('next',Date.parse(extra.notAfter)/1000),false);
 for(const value of [{...config,additionalKey:{...extra,keyId:'old'}},{...config,additionalKey:[extra]},{...config,additionalKey:{...extra,third:extra}},{...config,additionalKey:{...extra,notAfter:extra.notBefore}},{...config,additionalKey:{...extra,keyId:'bad key'}},{...config,additionalKey:{...extra,privateKeyPath:undefined}},{...config,runId:undefined},{...config,anotherKey:extra}])assert.throws(()=>load(value));
 chmodSync(newPath,0o644);assert.throws(()=>load({...config,additionalKey:extra}),/Private publication/);chmodSync(newPath,0o600);
 const link=join(dir,'linked.pem');symlinkSync(newPath,link);assert.throws(()=>load({...config,additionalKey:{...extra,privateKeyPath:link}}),/Canonical publication/);
 writeFileSync(newPath,generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'}));assert.throws(()=>load({...config,additionalKey:extra}),/Ed25519/);
});
