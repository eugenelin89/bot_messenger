/** Separate03H owner command; reuses reviewed history supervision/custody, never app startup. */
import { fileURLToPath } from 'node:url';
import { historyCli } from './yahoo-history.js';
if (process.argv[1] === fileURLToPath(import.meta.url)) await historyCli(true, fileURLToPath(import.meta.url)).catch(() => {
  console.error('HQ-READY-03H stopped. Inspect private non-data receipts; never retry.');
  if (process.connected) process.disconnect(); process.exitCode = 1;
});
