import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CodexRuntime } from '../src/runtime/codex.js';

const workspace = mkdtempSync(join(tmpdir(), 'bot-messenger-preflight-'));
try { console.log(JSON.stringify(await new CodexRuntime().preflight(workspace), null, 2)); }
catch (error) { console.error(error instanceof Error ? error.message : 'Preflight failed'); process.exitCode = 1; }
