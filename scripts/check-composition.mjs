#!/usr/bin/env node
// check:composition (docs/COMPOSITION.md §6): a composition block draws nothing itself. Its CSS may
// only arrange (layout, placement, and the motion and visibility of its parts: transform, opacity);
// every paint (fill, shadow, colour, type, radius, border, filter) comes from the components it uses;
// it has no recipe of its own.
// A custom block says so (`kind: "custom"`) with a `reason`.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks } from './lib/components.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = join(root, 'packages/metalui/src');
const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
const recipes = new Set(Object.keys(tokens.recipes ?? {}).filter((k) => !k.startsWith('$')));
const PAINT = /^\s*(background(?:-[\w-]+)?|box-shadow|color|font(?:-[\w-]+)?|letter-spacing|line-height|text-shadow|text-decoration(?:-[\w-]+)?|text-transform|border(?:-[\w-]+)?|outline(?:-[\w-]+)?|filter|backdrop-filter|-webkit-backdrop-filter|fill|stroke(?:-[\w-]+)?|caret-color)\s*:/;
const errors = [];

for (const meta of blocks()) {
  const kind = meta.kind;
  if (kind !== 'composition' && kind !== 'custom') { errors.push(`${meta.dir}: meta.json kind must be "composition" or "custom"`); continue; }
  if (kind === 'custom') {
    if (!meta.reason || !String(meta.reason).trim()) errors.push(`${meta.dir}: a custom block needs a reason`);
    continue;
  }
  if (recipes.has(meta.name)) errors.push(`${meta.dir}: a composition block has its own recipe (tokens.json recipes.${meta.name})`);
  for (const f of readdirSync(join(src, meta.dir)).filter((f) => f.endsWith('.css'))) {
    readFileSync(join(src, meta.dir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
      .split('\n')
      .forEach((line, i) => {
        if (PAINT.test(line)) errors.push(`${meta.dir}/${f}:${i + 1}: a composition block paints (${line.trim()})`);
      });
  }
}

for (const e of errors) console.log(e);
console.log(`Composition: ${errors.length} finding(s)`);
process.exitCode = errors.length ? 1 : 0;
