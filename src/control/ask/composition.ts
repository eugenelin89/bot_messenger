/** Explicit composition. Startup/migrations never create keys, grants, content or service scope. */
import {requireContract as need} from '../../../scripts/investment-contracts/schema.js';
import type {Company} from '../company.js';
import type {AskRuntimeAdapter} from '../../runtime/adapter.js';
import {AskService,type AskServiceOptions} from './service.js';
import {AskCoordinator,type AskCoordinatorOptions} from './coordinator.js';
import {AskPublicProjection,type AskPublicProjectionOptions} from './public-context.js';
export interface InstallAskOptions extends Omit<AskCoordinatorOptions,'service'|'assertRuntimeAvailable'> {
 grantId:string;workers:AskServiceOptions['workers'];projection:AskPublicProjectionOptions;
 /** Operational route/config permission; independent of retained custody cleanup. */
 assertOperational?():void;
}
export function installAsk(company:Company,runtime:AskRuntimeAdapter,options:InstallAskOptions):{service:AskService;coordinator:AskCoordinator} {
 need(!company.ask&&!company.askCoordinator&&runtime.runAsk&&runtime.assertAskAvailable,'CONFLICT');
 // The concrete Codex adapter currently rejects here: no private-login/public-service equivalence.
 // This occurs before composition, claiming, new finite reservation or network transmission.
 runtime.assertAskAvailable();
 const result=composeAskCustody(company,runtime,options);need(result.coordinator,'UNAVAILABLE');return{service:result.service,coordinator:result.coordinator};
}
/** Retained API custody only: no model fallback. Privacy cleanup survives backend shutdown. */
export function installAskApiCustody(company:Company,runtime:import('../../runtime/openai-ask.js').OpenAiAskRuntime,options:InstallAskOptions,wireAvailable=true){
 need(!company.ask&&!company.askCoordinator,'CONFLICT');return composeAskCustody(company,runtime,options,wireAvailable);
}
function composeAskCustody(company:Company,runtime:AskRuntimeAdapter,options:InstallAskOptions,wireAvailable=true):{service:AskService;coordinator:AskCoordinator|undefined} {
 const projection=new AskPublicProjection(company.store,options.projection);let coordinator:AskCoordinator|undefined;
 const service=new AskService(company,{current:()=>options.approved,assertReady:purpose=>{options.assertOperational?.();need(coordinator,'UNAVAILABLE');coordinator.configuration(purpose);},grantId:options.grantId,
  authority:options.authority,controls:options.controls,content:options.content,workers:options.workers,
  publicContext:q=>projection.context(q),visible:c=>projection.visible(c),visibleReferences:(r,s,d)=>projection.visibleReferences(r,s,d),now:()=>options.current().now});
 if(!wireAvailable){service.recover();return{service,coordinator:undefined};}
 try{coordinator=new AskCoordinator(company.store,{...options,service,assertRuntimeAvailable:()=>runtime.assertAskAvailable!(),bodyOperationsReady:()=>{try{options.assertOperational?.();runtime.assertAskAvailable!();return !service.ownerPaused;}catch{return false;}}});company.askCoordinator=coordinator;return{service,coordinator};}
 catch(error){service.close();company.ask=undefined;throw error;}
}
