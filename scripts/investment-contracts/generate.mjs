import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compile } from 'json-schema-to-typescript';
import path from 'node:path';
const root = 'contracts/investment/v1';
const check = process.argv.includes('--check');
const schema = JSON.parse(await readFile(`${root}/schema.json`, 'utf8'));
const types = await compile(schema, 'InvestmentShowcaseContract', {
  bannerComment: '/* Generated from schema.json by npm run contracts:generate. Do not edit. */',
  unreachableDefinitions: true, additionalProperties: false, maxItems: -1,
});
async function output(file, value) {
  if (check) {
    if (await readFile(file, 'utf8') !== value) throw new Error(`Generated contract drift: ${file}`);
  } else await writeFile(file, value);
}
await output(`${root}/types.d.ts`, types);
const files = (await readdir(root)).filter(n => n !== 'manifest.json').sort();
const hashes = {};
for (const name of files) hashes[name] = createHash('sha256').update(await readFile(path.join(root, name))).digest('hex');
await output(`${root}/manifest.json`, JSON.stringify({
  contractVersion: '1.0', format: 'JSON Schema 2020-12 + OpenAPI 3.1',
  files: hashes,
}, null, 2) + '\n');
console.log(`Contract 1.0: ${check ? 'verified' : 'generated'} types and ${files.length} file digests`);
