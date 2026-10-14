import {realpathSync} from 'node:fs';
import {canonicalHash,requireContract as need} from '../../../scripts/investment-contracts/schema.js';
import {readAskProtectedFile} from '../../runtime/openai-ask.js';
import {existingFiniteJournal} from '../usage/finite-journal.js';
import type {Company} from '../company.js';
import type {CleanRestartFiles} from './clean-restart.js';
export interface ProductionRestartConfiguration {version:1;directory:string;channelId:string;targetSha:string;publicationConfig:string}
export function readProductionRestart(path:string):ProductionRestartConfiguration {
 const value=JSON.parse(readAskProtectedFile(path,16384)) as ProductionRestartConfiguration;
 need(Object.keys(value).sort().join(',')==='channelId,directory,publicationConfig,targetSha,version'&&value.version===1
  &&/^[a-f0-9]{40}$/.test(value.targetSha),'INVALID_SCHEMA');return value;
}
/** Actual service-user finite custody, never a caller-selected replacement journal. */
export function currentRestartFiles(publicationConfig:string,at:string):CleanRestartFiles {
 const j=existingFiniteJournal();need(j,'OUTCOME_UNKNOWN');
 try{need(!j.exposure(at).active,'OUTCOME_UNKNOWN');return{publicationConfig:realpathSync(publicationConfig),finiteAuthority:j.path,finiteCheckpoint:j.custodyPath};}
 finally{j.close();}
}
export async function reconcileProductionRestart(company:Company,path:string,publicationConfig:string,targetSha:string):Promise<void> {
 const c=readProductionRestart(path);need(c.targetSha===targetSha&&realpathSync(c.publicationConfig)===realpathSync(publicationConfig),'CONFLICT');
 const files=currentRestartFiles(publicationConfig,new Date().toISOString());
 await company.publication.reconcileCleanRestart(c.directory,[company.dataDir,company.engineering.sourceRoot],targetSha,files,()=>need(canonicalHash(readProductionRestart(path))===canonicalHash(c),'CONFLICT'));
}
export function armProductionRestart(company:Company,path:string,publicationConfig:string):void {
 const c=readProductionRestart(path);need(realpathSync(c.publicationConfig)===realpathSync(publicationConfig),'CONFLICT');
 const files=currentRestartFiles(publicationConfig,new Date().toISOString());
 company.publication.prepareCleanShutdown(c.directory,[company.dataDir,company.engineering.sourceRoot],c.targetSha,c.channelId,files);
}
