#!/usr/bin/env node
// check:slots (docs/COMPOSITION.md §6): the compound parts a component or block declares in
// meta.json `slots` exist in React (`Name.Slot`, assigned on the exported namespace) and in Swift
// (a `@ViewBuilder` parameter or init label per slot, lower camel case) when the Swift file exists.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { components } from './lib/components.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = join(root, 'packages/metalui/src');
const errors = [];
const pending = [];
const lowerCamel = (s) => s[0].toLowerCase() + s.slice(1);

for (const meta of components()) {
  if (!meta.slots) continue;
  for (const [exportName, slots] of Object.entries(meta.slots)) {
    const tsx = readdirSync(join(src, meta.dir)).filter((f) => f.endsWith('.tsx')).map((f) => readFileSync(join(src, meta.dir, f), 'utf8')).join('\n');
    for (const slot of slots) {
      const has = new RegExp(`\\b${exportName}\\.${slot}\\b|\\b${slot}\\s*[:,]|\\b${exportName}${slot}\\b`).test(tsx) && new RegExp(`\\b${slot}\\b`).test(tsx);
      if (!has) errors.push(`${meta.dir}: React ${exportName}.${slot} missing`);
    }
    const swiftPath = meta.swift?.file ? join(root, meta.swift.file) : null;
    if (!swiftPath || !existsSync(swiftPath)) { pending.push(`${meta.dir}: Swift file not present yet (${meta.swift?.file ?? 'none'})`); continue; }
    const swift = readFileSync(swiftPath, 'utf8');
    for (const slot of slots) {
      if (slot === 'Root') continue;
      if (!new RegExp(`\\b${lowerCamel(slot)}\\s*:`).test(swift)) pending.push(`${meta.dir}: Swift slot ${lowerCamel(slot)} not mirrored yet`);
    }
  }
}

for (const e of errors) console.log(e);
for (const p of pending) console.log(`pending (Swift): ${p}`);
console.log(`Slots: ${errors.length} finding(s), ${pending.length} Swift slot(s) pending`);
process.exitCode = errors.length ? 1 : 0;
