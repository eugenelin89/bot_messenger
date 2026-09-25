// Trusted, immutable acceptance tests. Engineers edit their module and optional extra tests only.
export const SQUAD_FILES: Record<string, string> = {
  'package.json': JSON.stringify({ name: 'squad-status', version: '0.0.1', private: true, type: 'module', scripts: { test: 'node --test test/*.test.mjs' } }, null, 2) + '\n',
  'README.md': '# SquadStatus\n\nDependency-free worker status summary. Run `node cli.mjs`; test with `node --test test/*.test.mjs`.\n',
  'src/calculate.mjs': 'export function calculateStatusSummary(workers) { throw new Error("Implement calculation"); }\n',
  'src/format.mjs': 'export function formatStatusSummary(summary) { throw new Error("Implement formatting"); }\n',
  'src/index.mjs': 'import { calculateStatusSummary } from "./calculate.mjs";\nimport { formatStatusSummary } from "./format.mjs";\nexport const summarizeWorkers = workers => formatStatusSummary(calculateStatusSummary(workers));\n',
  'cli.mjs': 'import { summarizeWorkers } from "./src/index.mjs";\nconsole.log(summarizeWorkers([{name:"Atlas",status:"idle"},{name:"Linus",status:"working"},{name:"Ada",status:"working"},{name:"Grace",status:"blocked"}]));\n',
  'test/calculate.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateStatusSummary} from '../src/calculate.mjs';
test('counts workers without changing input', () => {
  const workers = Object.freeze([Object.freeze({name:'Atlas',status:'idle'}),Object.freeze({name:'Linus',status:'working'}),Object.freeze({name:'Ada',status:'working'}),Object.freeze({name:'Grace',status:'blocked'})]);
  assert.deepEqual(calculateStatusSummary(workers), {total:4,working:2,idle:1,blocked:1,failed:0});
  assert.deepEqual(calculateStatusSummary([]), {total:0,working:0,idle:0,blocked:0,failed:0});
  assert.deepEqual(calculateStatusSummary([{status:'failed'},{status:'idle'}]), {total:2,working:0,idle:1,blocked:0,failed:1});
});
test('rejects invalid workers/statuses with TypeError', () => {
  for (const value of [null, {}, 'workers', [null], [{}], [{status:'unknown'}], [{status:1}]]) assert.throws(() => calculateStatusSummary(value), TypeError);
});
`,
  'test/format.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import {formatStatusSummary} from '../src/format.mjs';
test('stable labels, order and no trailing newline', () => {
  assert.equal(formatStatusSummary(Object.freeze({total:4,working:2,idle:1,blocked:1,failed:0})), 'Total: 4\\nWorking: 2\\nIdle: 1\\nBlocked: 1\\nFailed: 0');
  assert.equal(formatStatusSummary({total:0,working:0,idle:0,blocked:0,failed:0}), 'Total: 0\\nWorking: 0\\nIdle: 0\\nBlocked: 0\\nFailed: 0');
});
test('rejects missing, negative, noninteger and inconsistent counts', () => {
  for (const value of [null, {}, {total:1,working:0,idle:0,blocked:0,failed:0}, {total:-1,working:-1,idle:0,blocked:0,failed:0}, {total:1.5,working:1.5,idle:0,blocked:0,failed:0}, {total:'0',working:0,idle:0,blocked:0,failed:0}]) assert.throws(() => formatStatusSummary(value), TypeError);
});
`,
  'test/integrated.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeWorkers} from '../src/index.mjs';
test('complete product example', () => assert.equal(summarizeWorkers([{name:'Atlas',status:'idle'},{name:'Linus',status:'working'},{name:'Ada',status:'working'},{name:'Grace',status:'blocked'}]), 'Total: 4\\nWorking: 2\\nIdle: 1\\nBlocked: 1\\nFailed: 0'));
test('empty product input', () => assert.equal(summarizeWorkers([]), 'Total: 0\\nWorking: 0\\nIdle: 0\\nBlocked: 0\\nFailed: 0'));
`,
};
export const PRODUCT_CONTRACT = `SquadStatus is a dependency-free Node ESM product. Input is an array of worker objects with status exactly working, idle, blocked or failed (name optional). calculateStatusSummary(workers) in src/calculate.mjs returns {total,working,idle,blocked,failed}, with counts, no input mutation, empty array yields zeros; invalid input/status throws TypeError. formatStatusSummary(summary) in src/format.mjs accepts an object of five nonnegative safe integer counts with total equal to the sum, returns exactly Total: N\\nWorking: N\\nIdle: N\\nBlocked: N\\nFailed: N (no trailing newline); invalid/missing/inconsistent counts throw TypeError. Linus owns calculate; Ada owns format. Trusted composition/CLI and immutable tests already define acceptance. Each may add test/<module>.extra.test.mjs. Both focused tests and full integrated tests must pass. Grace must review exact submitted commits, spec alignment, validation and integration risk.`;
