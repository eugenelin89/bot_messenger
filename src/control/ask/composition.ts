/** Explicit composition. Startup/migrations never create keys, grants, content or service scope. */
import {requireContract as need} from '../../../scripts/investment-contracts/schema.js';
import type {Company} from '../company.js';
import type {RuntimeAdapter} from '../../runtime/adapter.js';
import {AskService,type AskServiceOptions} from './service.js';
import {AskCoordinator,type AskCoordinatorOptions} from './coordinator.js';
import {AskPublicProjection,type AskPublicProjectionOptions} from './public-context.js';
export interface InstallAskOptions extends Omit<AskCoordinatorOptions,'service'|'assertRuntimeAvailable'> {
 grantId:string;workers:AskServiceOptions['workers'];projection:AskPublicProjectionOptions;
}
export function installAsk(company:Company,runtime:RuntimeAdapter,options:InstallAskOptions):{service:AskService;coordinator:AskCoordinator} {
 need(!company.ask&&!company.askCoordinator&&runtime.runAsk&&runtime.assertAskAvailable,'CONFLICT');
 // The concrete Codex adapter currently rejects here: no private-login/public-service equivalence.
 // This occurs before composition, claiming, new finite reservation or network transmission.
 runtime.assertAskAvailable();
 const projection=new AskPublicProjection(company.store,options.projection);let coordinator:AskCoordinator|undefined;
 const service=new AskService(company,{current:()=>options.approved,assertReady:purpose=>{need(coordinator,'UNAVAILABLE');coordinator.configuration(purpose);},grantId:options.grantId,
  authority:options.authority,controls:options.controls,content:options.content,workers:options.workers,
  publicContext:q=>projection.context(q),visible:c=>projection.visible(c),visibleReferences:(r,s,d)=>projection.visibleReferences(r,s,d),now:()=>options.current().now});
 try{coordinator=new AskCoordinator(company.store,{...options,service,assertRuntimeAvailable:()=>runtime.assertAskAvailable!()});company.askCoordinator=coordinator;return{service,coordinator};}
 catch(error){service.close();company.ask=undefined;throw error;}
}
