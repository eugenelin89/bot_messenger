/** Dedicated local owner CLI. Never imported by main, a worker tool or a scheduler. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensure } from '../src/domain/investment/arithmetic.js';
import { hash } from '../src/domain/investment/identity.js';
import { Store } from '../src/persistence/store.js';
import { MarketStore } from '../src/control/market/store.js';
import { FinancialStore } from '../src/control/market/financial-store.js';
import { FinancialDataGateway } from '../src/control/market/financial-gateway.js';
import { PythonYahooAdapter } from '../src/control/market/yahoo-python.js';
import { yahooProbeTransport } from '../src/control/market/yahoo-https.js';
import { probeManifest } from '../src/control/market/yahoo-probe-manifest.js';
import { inspectYahooObservation, probeMayContinue } from '../src/control/market/yahoo-probe-report.js';
import { prepareOwnerProbe, YahooProbeCustody, ownerCapsuleRoot, ownerProbeRoot, cleanupOwnerProbe } from '../src/control/market/yahoo-probe-custody.js';

import { probeSourceIdentity } from '../src/control/market/yahoo-probe-host.js';

async function main(): Promise<void> {
  const command = process.argv[2];
  ensure(process.argv.length === 3 && ['prepare', 'run', 'status', 'cleanup'].includes(command!), 'probe_cli_command');
  if (command === 'status') {
    console.log(JSON.stringify({ prepared: existsSync(join(ownerProbeRoot(), 'approval.json')), spent: existsSync(join(ownerProbeRoot(), 'spent.json')),
      capsulePresent: existsSync(ownerCapsuleRoot()), cleanup: existsSync(join(ownerProbeRoot(), 'cleanup.json')) ? JSON.parse(readFileSync(join(ownerProbeRoot(), 'cleanup.json'), 'utf8')) : null })); return;
  }
  if (command === 'cleanup') {
    console.log(JSON.stringify(cleanupOwnerProbe())); return;
  }
  const source = probeSourceIdentity();
  if (command === 'prepare') {
    const manifest = probeManifest(new Date().toISOString(), source.sourceHash);
    prepareOwnerProbe(manifest);
    console.log(JSON.stringify({ command, ...source, manifestHash: hash(manifest), expiresAt: manifest.expiresAt, reads: manifest.reads, wire: manifest.wire,
      permission: manifest.permission, retention: manifest.retention })); return;
  }
  // A run can only consume the existing owner-issued authorization; no implicit provisioning.
  const custody = YahooProbeCustody.consumeOwner();
  let database: Store | undefined;
  const results: unknown[] = []; const startedAt = new Date().toISOString();
  const interrupt = () => custody.abort.abort();
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    database = new Store(':memory:');
    const market = new MarketStore(database), store = new FinancialStore(market, custody), manifest = custody.manifest;
    for (const [kind, value] of [['policy', manifest.policy], ['instrument', manifest.instrument], ['calendar', manifest.calendar]] as const)
      market.register(value, kind, manifest.preparedAt);
    store.initialize(manifest.scope);
    const gateway = new FinancialDataGateway(store, { now: () => new Date().toISOString() }, new PythonYahooAdapter(custody.capsulePath), yahooProbeTransport(custody));
    for (const [index, request] of manifest.reads.entries()) {
      const result = await gateway.collect(manifest.policy.id, request, `HQ-READY-03B-${index + 1}`, custody.signal);
      const observation = result.observationId ? store.observation(result.observationId) : null;
      const quality = observation ? inspectYahooObservation(observation) : null;
      custody.finish(result, observation); results.push({ ordinal: index + 1, dataClass: request.dataClass, statement: request.statement, frequency: request.frequency, result, quality });
      console.log(JSON.stringify({ type: 'quality', ordinal: index + 1, result, quality }));
      if (!probeMayContinue(result, observation)) break;
    }
    custody.seal({ type: 'private_report', startedAt, completedAt: new Date().toISOString(), source, results });
  } finally {
    database?.close();
    const cleanup = custody.destroy();
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    // Safe accounting only. No body, credentials, prices, metrics or statement values are logged.
    const accounting = readFileSync(join(ownerProbeRoot(), 'accounting.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
    console.log(JSON.stringify({ type: 'completion', startedAt, completedAt: new Date().toISOString(), source, accounting, cleanup }));
  }
}
await main().catch(() => { console.error('HQ-READY-03B stopped; inspect private non-data accounting/status. No automatic retry.'); process.exitCode = 1; });
