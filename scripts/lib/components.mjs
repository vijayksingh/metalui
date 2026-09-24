// Every component folder with a meta.json, sorted by name.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { root } from './emit.mjs';

export function components() {
  return readdirSync(root('components'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(root('components', d.name, 'meta.json')))
    .map((d) => JSON.parse(readFileSync(root('components', d.name, 'meta.json'), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}
