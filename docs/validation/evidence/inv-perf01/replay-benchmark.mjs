// Authored mechanical replay benchmark. Not a workflow/model acceptance receipt.
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const next='/var/tmp/botsquad-perf-candidate-OXqfQg',base='/var/tmp/botsquad-ask-clock-SXDokc';
const {setup}=await import(pathToFileURL(next+'/dist/test/fixtures/investment/support.js'));
const {scheduledCalendar2026}=await import(pathToFileURL(next+'/dist/src/domain/market/calendar.js'));
const {FixtureSimulator:Baseline}=await import(pathToFileURL(base+'/dist/src/control/investment.js'));
const {hash}=await import(pathToFileURL(next+'/dist/src/domain/investment/identity.js'));
const f=setup({calendar:scheduledCalendar2026().calendar});
try{
 for(let i=0;i<24;i++)f.call({type:'control',state:i%2?'active':'paused'},'benchmark-'+i);
 const old=new Baseline(f.store,f.clock,'fixture-owner');
 const expected={configuration:old.configuration(f.config.runId),state:old.inspect(f.config.runId)};
 assert.deepEqual(f.sim.readSnapshot(f.config.runId),expected);
 const rounds=[];
 for(let i=0;i<4;i++){
  const row={round:i+1};
  for(const name of i%2?['snapshot','baselinePair']:['baselinePair','snapshot']){
   const start=performance.now();
   for(let j=0;j<20;j++){
    const actual=name==='snapshot'?f.sim.readSnapshot(f.config.runId):{configuration:old.configuration(f.config.runId),state:old.inspect(f.config.runId)};
    assert.equal(hash(actual),hash(expected));
   }
   row[name+'Ms']=performance.now()-start;
  }
  rounds.push(row);
 }
 console.log(JSON.stringify({synthetic:true,kind:'mechanical_replay_only',journals:25,sessions:f.config.calendar.sessions.length,iterationsPerRound:20,rounds,resultDigest:hash(expected)},null,2));
}finally{f.close();rmSync(f.dir,{recursive:true,force:true});}
