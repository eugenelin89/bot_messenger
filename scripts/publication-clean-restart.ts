/** Explicit one-time offline migration handoff. No Company construction, recovery or grants. */
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {acquireDataLock} from '../src/persistence/lock.js';
import {prepareCleanRestart} from '../src/control/publication/clean-restart.js';
import {readProductionRestart,currentRestartFiles} from '../src/control/publication/operational-restart.js';
import {requireContract as need} from './investment-contracts/schema.js';
const [configPath,dataDir,sourceRoot,previousSha]=process.argv.slice(2);
need(configPath&&dataDir&&sourceRoot&&previousSha&&/^[a-f0-9]{40}$/.test(previousSha),'INVALID_SCHEMA');
const status=execFileSync('systemctl',['show','botsquad','--property=MainPID,ActiveState,SubState'],{encoding:'utf8'});
need(status.includes('MainPID=0\n')&&status.includes('ActiveState=inactive\n')&&status.includes('SubState=dead\n'),'OUTCOME_UNKNOWN');
need(execFileSync('git',['-C',sourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===previousSha,'CONFLICT');
const config=readProductionRestart(configPath),unlock=acquireDataLock(resolve(dataDir));
try{
 const db=new DatabaseSync(join(resolve(dataDir),'company.sqlite'),{readOnly:true});
 try{
  db.exec('PRAGMA query_only=ON; BEGIN;');
  need(db.prepare('PRAGMA quick_check').get()?.quick_check==='ok','OUTCOME_UNKNOWN');
  need(db.prepare('SELECT max(version) version FROM schema_migrations').get()?.version===25,'CONFLICT');
  const at=new Date().toISOString(),files=currentRestartFiles(config.publicationConfig,at);
  const reader={get<T>(sql:string,...values:SQLInputValue[]):T|undefined{return db.prepare(sql).get(...values) as T|undefined;},all<T>(sql:string,...values:SQLInputValue[]):T[]{return db.prepare(sql).all(...values) as T[];}};
  prepareCleanRestart(reader,config.directory,[resolve(dataDir),resolve(sourceRoot)],config.channelId,files,config.targetSha,at);
  console.log(JSON.stringify({prepared:true,channelId:config.channelId,targetSha:config.targetSha,at}));
 }finally{db.close();}
}finally{unlock();}
