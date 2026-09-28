// Fixed CLI reporter, loaded by Node before repository test modules. Repository
// stdout is diagnostic text, never a validation verdict. A one-use native HMAC
// context binds completion to this invocation without exposing the key in argv,
// environment, files, exports or test output. The input buffer is erased immediately.
import { createHmac } from 'node:crypto';
import { readFileSync, writeSync } from 'node:fs';
import { tap } from 'node:test/reporters';

const key = readFileSync(0);
if (key.length !== 32) throw new Error('Missing trusted validation invocation');
const signer = createHmac('sha256', key);
key.fill(0);
const update = signer.update.bind(signer);
const digest = signer.digest.bind(signer);
const encode = JSON.stringify;
const create = Object.create;
const write = writeSync;
let claimed = false;
type Summary = { success: boolean; tests: number; passed: number; failed: number; cancelled: number };
type Event = { type: string; data: { file?: string; success?: boolean; counts?: Record<string, number> } };

const reporter = (source: AsyncIterable<Event>) => {
  // Claim synchronously when Node composes its reporter, before tests execute.
  // An async generator here would defer the claim and let source race it.
  // Importing/calling this reporter from source cannot obtain a second signer.
  if (claimed) throw new Error('Validation reporter already claimed');
  claimed = true;
  async function* events() {
    let summary: Summary | undefined;
    for await (const event of source) {
      if (event.type === 'test:summary' && event.data.file === undefined) {
        if (summary) throw new Error('Duplicate validation summary');
        const counts = event.data.counts;
        // No inherited toJSON hook from repository code may rewrite the verdict.
        summary = create(null) as Summary;
        summary.success = event.data.success === true;
        summary.tests = counts?.tests ?? 0;
        summary.passed = counts?.passed ?? 0;
        summary.failed = counts?.failed ?? 0;
        summary.cancelled = counts?.cancelled ?? 0;
      }
      yield event;
    }
    // An exit during module import/tests never reaches stream completion.
    if (!summary) return;
    const payload = encode(summary);
    update(payload);
    const receipt = create(null) as {payload:string;signature:string};
    receipt.payload = payload;
    receipt.signature = digest('hex');
    write(4, encode(receipt));
  }
  return tap(events() as Parameters<typeof tap>[0]);
};
export default reporter;
