import { createInterface } from 'node:readline';
import { APIError, ClientV1, generatePrivateKey, newRequestKey } from './client.js';

const safeError = (error: unknown) => error instanceof APIError ? error.message : 'Client input or transport failed. Check the documented command, private directory and connection.';

// Pairing URI and mutation JSON enter through stdin, never shell arguments/logs.
const [base, directory, command, path, requestKey] = process.argv.slice(2);
try {
  if (!base || !directory || !command) throw new Error('Usage: client-v1/cli.js BASE_URL PRIVATE_DIRECTORY key|pair|get|post|events|session [API_PATH_OR_CURSOR] [REQUEST_KEY]');
  if (command === 'key') console.log(JSON.stringify(generatePrivateKey(directory)));
  else {
    const client = new ClientV1(base, directory);
    if (command === 'get') console.log(JSON.stringify(await client.get(path ?? '/overview')));
    else if (command === 'events') { for await (const event of client.events(path)) console.log(JSON.stringify(event)); }
    else if (command === 'session') {
      // One process reuses its in-memory short-lived token; no bearer token file.
      const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
      for await (const line of lines) {
        try {
          const input = JSON.parse(line) as { method: string; path: string; body?: unknown; key?: string };
          if (input.method !== 'GET' && input.method !== 'POST') throw new Error('Method must be GET or POST.');
          const key = input.key ?? newRequestKey();
          const response = input.method === 'GET' ? await client.get(input.path) : await client.post(input.path, input.body, key);
          console.log(JSON.stringify({ ...(input.method === 'POST' ? { client_request_id: key } : {}), ...response }));
        } catch (error) { console.log(JSON.stringify({ error: safeError(error) })); }
      }
    } else {
      let input = ''; for await (const chunk of process.stdin) { input += String(chunk); if (input.length > 32_768) throw new Error('Input too large.'); }
      if (command === 'pair') console.log(JSON.stringify(await client.claim(input)));
      else if (command === 'post') {
        if (!path || !requestKey) throw new Error('POST requires an API path and a retained timestamp.UUIDv4 request key.');
        console.log(JSON.stringify(await client.post(path, JSON.parse(input), requestKey)));
      } else throw new Error('Unknown client command.');
    }
  }
} catch (error) { console.error(safeError(error)); process.exitCode = 1; }
