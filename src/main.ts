import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { Store } from './persistence/store.js';
import { acquireDataLock } from './persistence/lock.js';
import { Company } from './control/company.js';
import { Dispatcher } from './control/dispatcher.js';
import { CodexRuntime } from './runtime/codex.js';
import { createHttpServer } from './http/server.js';

// Compiled entrypoint is dist/src/main.js.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const dataDir = resolve(process.env.BOT_DATA_DIR ?? join(projectRoot, '.data'));
const port = Number(process.env.PORT ?? 4310);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const unlock = acquireDataLock(dataDir);
const store = new Store(join(dataDir, 'company.sqlite'));
const company = new Company(store, dataDir, projectRoot);
const runtime = new CodexRuntime();
const dispatcher = new Dispatcher(company, runtime);
const http = createHttpServer(company, dispatcher, join(projectRoot, 'public'));
let stopping = false;
async function shutdown() {
  if (stopping) return; stopping = true;
  await dispatcher.stop(); await http.close(); store.close(); unlock();
}
http.server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(`Cannot start local HTTP server (${error.code ?? 'unknown'}).`);
  store.close(); unlock(); process.exitCode = 1;
});
http.server.listen(port, '127.0.0.1', () => {
  dispatcher.start();
  console.log(`Bot Messenger: http://127.0.0.1:${port}`);
  console.log(`Local data: ${dataDir}`);
});
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
