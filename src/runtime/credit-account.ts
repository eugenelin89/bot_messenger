import {createHash} from 'node:crypto';
import {requireThat} from '../domain/model.js';
import {eligibleCreditSubscription,type CreditSubscriptionEligibility} from '../domain/usage/policy.js';
import {creditAccountFingerprint,validateCreditConfig,validateCreditRequirements} from './credit-policy.js';
import type {AppServerRpc,RpcMessage} from './rpc.js';

export interface VerifiedCreditAccount {
  generation:number;
  fingerprint:string;
  routingFingerprint:string;
  eligibility:CreditSubscriptionEligibility;
  mcpNames:string[];
}

/** A notification is invalidation, never identity. Raw account data stays in this read scope. */
export class CreditAccountVerifier {
  private generation=0;
  private verifiedGeneration=-1;
  private expected?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>;
  private pending?:Promise<VerifiedCreditAccount>;
  constructor(private readonly rpc:AppServerRpc,private readonly options:{
    pilotId:string; workspace:string; deadline:number; disabledFeatures:readonly string[];
    checkOpen():void; invalidated?(generation:number):void;
    expected?:Pick<VerifiedCreditAccount,'fingerprint'|'routingFingerprint'>;
  }) {
    this.expected=options.expected;
    // Installed before initialize, including on the skill-isolation connection.
    rpc.on('notification',this.notification);
  }
  private notification=(message:RpcMessage)=>{
    if(message.method!=='account/updated')return;
    this.verifiedGeneration=-1;
    this.generation++;
    this.options.invalidated?.(this.generation);
  };
  current(value:VerifiedCreditAccount){return value.generation===this.generation&&this.verifiedGeneration===this.generation;}
  verify():Promise<VerifiedCreditAccount>{
    // Coalesce callers, but never reuse a completed read as fresh admission evidence.
    return this.pending??=(this.read().finally(()=>{this.pending=undefined;}));
  }
  private async request(method:string,params:Record<string,unknown>){
    this.options.checkOpen();
    const remaining=this.options.deadline-Date.now();
    requireThat(remaining>0,'Account verification deadline expired');
    return this.rpc.request<unknown>(method,params,Math.min(10000,remaining));
  }
  private async read():Promise<VerifiedCreditAccount>{
    for(let attempts=0;attempts<8;attempts++){
      const generation=this.generation;
      // account/read waits for saved-workspace routing; requirements/config may reload then.
      const account=await this.request('account/read',{refreshToken:false});
      const requirements=await this.request('configRequirements/read',{});
      const configResponse=await this.request('config/read',{cwd:this.options.workspace}) as {config?:Record<string,unknown>};
      const limits=await this.request('account/rateLimits/read',{});
      // A closing account round trip also drains snapshots queued behind the eligibility response.
      const closingAccount=await this.request('account/read',{refreshToken:false});
      this.options.checkOpen();
      if(generation!==this.generation)continue; // An older response cannot clear a newer notification.
      const config=configResponse?.config;
      requireThat(config&&typeof config==='object'&&!Array.isArray(config),'Account configuration unavailable');
      validateCreditConfig(config);
      const features=config.features as Record<string,unknown>|undefined;
      requireThat(this.options.disabledFeatures.every(f=>features?.[f]===false),'Account tool confinement changed');
      const routing=validateCreditRequirements(requirements,account,config);
      const fingerprint=creditAccountFingerprint(account,this.options.pilotId);
      requireThat(creditAccountFingerprint(closingAccount,this.options.pilotId)===fingerprint&&JSON.stringify(validateCreditRequirements(requirements,closingAccount,config))===JSON.stringify(routing),'Account changed during verification');
      const routingFingerprint=createHash('sha256').update(JSON.stringify({pilotId:this.options.pilotId,routing})).digest('hex');
      eligibleCreditSubscription(account,limits);
      const eligibility=eligibleCreditSubscription(closingAccount,limits);
      const mcpNames=Object.keys(config.mcp_servers??{});
      requireThat(mcpNames.every(n=>/^[a-zA-Z0-9_-]+$/.test(n)),'Unsupported inherited MCP identifier; pilot blocked');
      requireThat(!this.expected||(fingerprint===this.expected.fingerprint&&routingFingerprint===this.expected.routingFingerprint),'Pilot authentication identity or routing policy changed');
      this.expected??={fingerprint,routingFingerprint};
      this.verifiedGeneration=generation;
      return {generation,fingerprint,routingFingerprint,eligibility,mcpNames};
    }
    throw Error('Account verification did not stabilize');
  }
  close(){this.rpc.off('notification',this.notification);this.verifiedGeneration=-1;}
}
