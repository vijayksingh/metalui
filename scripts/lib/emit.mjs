// Shared writer for generators: writes files, or with `--check` reports stale ones.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');
const stale = [];
let written = 0;

export const root = (...p) => join(ROOT, ...p);

export function emit(rel, content) {
  const path = root(rel);
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === content) return;
  if (CHECK) { stale.push(rel); return; }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  written++;
}

export function finish(label) {
  if (CHECK && stale.length) {
    console.error(`${label}: stale generated files (run npm run generate):\n  ${stale.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`${label}: ${CHECK ? 'up to date' : `${written} file(s) written`}`);
}
