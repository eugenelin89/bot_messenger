import {observedPublicationOptions} from './control/publication/observed-config.js';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { Store } from './persistence/store.js';
import { acquireDataLock } from './persistence/lock.js';
import { Company } from './control/company.js';
import { Dispatcher } from './control/dispatcher.js';
import { CodexRuntime } from './runtime/codex.js';
import { createHttpServer } from './http/server.js';
import { GithubMarkdownAdapter } from './business/github-markdown.js';
import {loadOperationalAsk} from './control/ask/operational.js';
import {reconcileProductionRestart,armProductionRestart} from './control/publication/operational-restart.js';

// Compiled entrypoint is dist/src/main.js.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = resolve(process.env.BOT_DATA_DIR ?? join(projectRoot, '.data'));
const port = Number(process.env.PORT ?? 4310);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const unlock = acquireDataLock(dataDir);
const store = new Store(join(dataDir, 'company.sqlite'));
const company = new Company(store, dataDir, projectRoot,'codex-app-server',undefined,undefined,process.env.BOTSQUAD_OBSERVED_PUBLICATION?observedPublicationOptions(store,process.env.BOTSQUAD_OBSERVED_PUBLICATION):undefined);
if(process.env.BOTSQUAD_BUSINESS_CONFIG) company.business.adapter=new GithubMarkdownAdapter(process.env.BOTSQUAD_BUSINESS_CONFIG);
// Before finite recovery, Dispatcher or HTTP admission can change bound custody/state.
if(process.env.BOTSQUAD_PUBLICATION_RESTART&&process.env.BOTSQUAD_OBSERVED_PUBLICATION){
 try{await reconcileProductionRestart(company,process.env.BOTSQUAD_PUBLICATION_RESTART,process.env.BOTSQUAD_OBSERVED_PUBLICATION,process.env.BOT_DEPLOYED_SHA??'');}
 catch{console.error('Publication clean restart remains fenced; inspect independent handoff custody.');}
}
company.finiteHQ.discover();
const finiteHQ=process.env.BOTSQUAD_FINITE_HQ_AUTHORITY?company.finiteHQ.loadRuntime(process.env.BOTSQUAD_FINITE_HQ_AUTHORITY):undefined;
const runtime = new CodexRuntime({finiteHQ});
const ask=loadOperationalAsk(company,process.env.BOTSQUAD_ASK_CONFIG);
const dispatcher = new Dispatcher(company, runtime,2,ask.runtime??runtime);
const http = createHttpServer(company, dispatcher, join(projectRoot, 'public'));
let stopping = false;
async function shutdown() {
  if (stopping) return; stopping = true;
  await dispatcher.stop(); await http.close();
  if(process.env.BOTSQUAD_PUBLICATION_RESTART&&process.env.BOTSQUAD_OBSERVED_PUBLICATION){
   try{armProductionRestart(company,process.env.BOTSQUAD_PUBLICATION_RESTART,process.env.BOTSQUAD_OBSERVED_PUBLICATION);}
   catch{console.error('Publication clean restart checkpoint not armed; next startup remains fenced.');}
  }
  ask.close();company.finiteHQ.close(); store.close(); unlock();
}
http.server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(`Cannot start local HTTP server (${error.code ?? 'unknown'}).`);
  ask.close();store.close(); unlock(); process.exitCode = 1;
});
http.server.listen(port, '127.0.0.1', () => {
  dispatcher.start();
  void dispatcher.runtimeCatalog().catch(() => console.error('Codex runtime degraded: run codex:preflight as the service account.'));
  console.log(`BotSquad: http://127.0.0.1:${port}`);
  console.log(`Local data: ${dataDir}`);
});
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
