// Validation-only transport: the operator supplies an explicit identity -> bare
// fixture map. Production HTTP and model tools cannot configure this transport.
import {realpathSync} from 'node:fs';
import {boundedGit,publicationPacket,type RemoteEnvelope,type RemoteTransport} from '../../src/control/remote-git.js';
import {localGit,isSha} from '../../src/control/repository-git.js';
import {requireThat} from '../../src/domain/model.js';
import type {Repository} from '../../src/domain/engineering.js';
export class FixtureRemote implements RemoteTransport {
  publishes=0;
  beforePublish?:()=>void;
  loseResponse=false;
  unavailable=false;
  constructor(readonly sourceRoot:string,readonly fixtures:ReadonlyMap<string,string>){this.fixtures=new Map([...fixtures].map(([identity,path])=>[identity,realpathSync(path)]));}
  private path(repo:Repository){const p=this.fixtures.get(repo.remote_identity??'');requireThat(p&&realpathSync(p)===p,'Unregistered validation remote');return p;}
  inspect(repo:Repository){requireThat(!this.unavailable,'Fixture transport unavailable');const p=this.path(repo);requireThat(localGit(p,['symbolic-ref','HEAD'])===`refs/heads/${repo.default_branch}`,'Fixture default branch changed');const head=localGit(p,['rev-parse',`refs/heads/${repo.default_branch}`]);requireThat(isSha(head),'Fixture branch missing');return head;}
  fetch(repo:Repository,ref:string){boundedGit(this.sourceRoot,repo.canonical_root,['-c','protocol.file.allow=always','fetch','--no-tags','--no-write-fetch-head',this.path(repo),`refs/heads/${repo.default_branch}:${ref}`]);}
  publish(repo:Repository,e:RemoteEnvelope){
    this.publishes++;this.beforePublish?.();const p=this.path(repo);const packet=publicationPacket(this.sourceRoot,repo,e);
    const response=boundedGit(this.sourceRoot,p,['-c','receive.denyNonFastForwards=true','receive-pack','--stateless-rpc',p],packet).toString();
    requireThat(response.includes('unpack ok\n')&&response.includes(`ok refs/heads/${e.target_branch}\n`)&&!response.includes(`ng refs/heads/${e.target_branch}`),'Fixture receiver rejected exact old SHA');
    if(this.loseResponse)throw new Error('Validation-only lost response');
  }
}
