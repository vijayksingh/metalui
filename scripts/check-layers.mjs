#!/usr/bin/env node
// check:layers (docs/COMPOSITION.md §6): the import graph obeys the layers. Components may import
// foundations and other components, never blocks; blocks may import components and foundations,
// never other blocks' internals; a block's meta.json `uses` equals the components it imports.
// Swift: Components/ never reference a type defined in Blocks/.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { primitives, blocks } from './lib/components.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = join(root, 'packages/metalui/src');
const errors = [];

const imports = (file) => [...readFileSync(file, 'utf8').matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? m[2]);
const filesOf = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => /\.(tsx?|css)$/.test(f)).map((f) => join(dir, f)) : []);

for (const meta of primitives()) {
  for (const file of filesOf(join(src, meta.dir))) {
    for (const spec of imports(file)) if (/(^|\/)blocks\//.test(spec)) errors.push(`${meta.dir}: a component imports a block (${spec})`);
  }
  if (meta.layer !== 'component') errors.push(`${meta.dir}: meta.json layer must be "component"`);
}

for (const meta of blocks()) {
  const used = new Set();
  for (const file of filesOf(join(src, meta.dir))) {
    for (const spec of imports(file)) {
      const c = spec.match(/^\.\.\/\.\.\/components\/([\w-]+)\//);
      if (c) used.add(c[1]);
      const b = spec.match(/^\.\.\/([\w-]+)\//);
      if (b && b[1] !== meta.name) errors.push(`${meta.dir}: a block imports another block (${spec})`);
    }
  }
  if (meta.layer !== 'block') errors.push(`${meta.dir}: meta.json layer must be "block"`);
  const declared = new Set(meta.uses ?? []);
  const missing = [...used].filter((u) => !declared.has(u));
  const extra = [...declared].filter((u) => !used.has(u) && !(meta.usesNative ?? []).includes(u));
  if (missing.length) errors.push(`${meta.dir}: imports ${missing.join(', ')} but meta.json uses does not list them`);
  if (extra.length) errors.push(`${meta.dir}: meta.json uses lists ${extra.join(', ')} but the block does not import them`);
}

// Swift: Components/ must not name a type that is defined under Blocks/
const swiftBlocks = join(root, 'swift/Sources/MetalUI/Blocks');
const swiftComponents = join(root, 'swift/Sources/MetalUI/Components');
if (existsSync(swiftBlocks) && existsSync(swiftComponents)) {
  const blockTypes = readdirSync(swiftBlocks).filter((f) => f.endsWith('.swift')).flatMap((f) => [...readFileSync(join(swiftBlocks, f), 'utf8').matchAll(/(?:struct|enum|class)\s+(Metal\w+)/g)].map((m) => m[1]));
  for (const f of readdirSync(swiftComponents).filter((f) => f.endsWith('.swift'))) {
    const s = readFileSync(join(swiftComponents, f), 'utf8');
    for (const t of blockTypes) if (new RegExp(`\\b${t}\\b`).test(s)) errors.push(`swift Components/${f}: references block type ${t}`);
  }
}

for (const e of errors) console.log(e);
console.log(`Layers: ${errors.length} finding(s)`);
process.exitCode = errors.length ? 1 : 0;
