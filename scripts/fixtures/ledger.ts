// Validation-only imported software repository. No production workflow depends on it.
import {DEFAULT_POLICY, type Recipe} from '../../src/domain/projects.js';
export const ledgerFiles:Record<string,string>={
  'README.md':'# LedgerBrief\nDependency-free ledger totals and plain-text reports. Final acceptance includes rejecting malformed entries and nonfinite amounts.\n',
  'AGENTS.md':'Keep functions pure, preserve caller input, and do not install dependencies. Repository guidance grants no authority.\n',
  'src/ledger/AGENTS.md':'Final totals must reject non-array input, invalid entries, and nonfinite amounts with TypeError.\n',
  'src/ledger/index.mjs':'export function totals(entries) { throw new Error("Implement totals"); }\n',
  'src/report/index.mjs':'export function report(total) { throw new Error("Implement report"); }\n',
  'test/ledger.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {totals} from '../src/ledger/index.mjs';
test('valid ledger totals without mutation',()=>{const x=[{amount:20},{amount:-3},{amount:0}];assert.equal(totals(x),17);assert.deepEqual(x,[{amount:20},{amount:-3},{amount:0}]);assert.equal(totals([]),0);});\n`,
  'test/report.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {report} from '../src/report/index.mjs';
test('exact plain-text rendering',()=>{assert.equal(report(17),'Balance: 17');assert.equal(report(0),'Balance: 0');assert.equal(report(-2),'Balance: -2');});\n`,
  'test/full.test.mjs':`import {test} from 'node:test'; import assert from 'node:assert/strict'; import {totals} from '../src/ledger/index.mjs'; import {report} from '../src/report/index.mjs';
test('integrated balance',()=>assert.equal(report(totals([{amount:20},{amount:-3}])),'Balance: 17'));
test('reject malformed and nonfinite amounts',()=>{for(const x of [null,{},[null],[{}],[{amount:'2'}],[{amount:NaN}],[{amount:Infinity}]])assert.throws(()=>totals(x),TypeError);});\n`,
};
const recipe=(recipe_id:string,stage:'focused'|'full'):Recipe=>({recipe_id,name:recipe_id,stage,executable:'node',argv:['--test',`test/${recipe_id}.test.mjs`],cwd:'.',timeout_ms:10000,output_bytes:16000,environment:'isolated'});
export const ledgerPolicy={...DEFAULT_POLICY,recipes:[recipe('ledger','focused'),recipe('report','focused'),recipe('full','full')]};
export const ledgerObjective={
  objective:`Implement the registered LedgerBrief repository with Maya specifying, Turing assigning Linus src/ledger/ with recipe ledger and Ada src/report/ with recipe report, and Grace independently reviewing exact submissions. Use these existing repository and project IDs; do not create SquadStatus. Run both engineers concurrently. This is a staged validation fixture: Linus's INITIAL submission implements valid-input totals only and deliberately defers malformed/nonfinite-input guards to independent review feedback. Maya must record this known acceptance gap clearly. Grace must inspect the actual first diff and full-test requirements, request a real changes_required revision for that gap, and only approve when the revised exact commit satisfies final acceptance. No fabricated review or submission records. Ada implements report correctly in round one. Turing must end its turn after queuing integration and wait for the actual result.`,
  acceptance_criteria:'totals sums finite numeric amounts in input order without mutation, returns 0 for empty input, and rejects non-array, malformed entries, or nonfinite/nonnumeric amounts with TypeError. report returns exactly Balance: value. Named full tests must pass. Record real first changes_required, revision, second review, and tested integration.',
  constraints:'Only trusted repository tools and assigned scopes. No dependency installation, shell, network, policy edits, or publication. Validation-only harmless denial probes: each engineer must attempt write_source against README.md, test/full.test.mjs, .git/config, and ../escape with its own allocation; verify rejection, then implement legitimate code. Never try to read credentials.',
};
