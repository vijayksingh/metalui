#!/usr/bin/env node
// check:utilities: a component or block styled with Tailwind v4 uses utilities from MetalUI's theme
// only. Once its meta.json lists no stylesheet it has no .css file, every class it writes compiles
// against theme.css (scripts/lib/tw.mjs), and none carries an arbitrary value (h-[13px],
// bg-[#fff]) or a variable shorthand (h-(--x)): values come from tokens.json through the theme.
// Arbitrary variants (data-[size=compact]:, [&>svg]:) select, they do not set values, and are allowed.
// check:composition keeps a composition block's utilities to arranging.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { components } from './lib/components.mjs';
import { root } from './lib/emit.mjs';
import { classTokens, utilityOf } from './lib/classes.mjs';
import { compileCandidates } from './lib/tw.mjs';

const src = root('packages/metalui/src');
const errors = [];
const pending = [];
const all = [];

for (const meta of components()) {
  const dir = join(src, meta.dir);
  const files = meta.react?.files ?? [];
  const css = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.css')) : [];
  if (files.some((f) => f.endsWith('.css'))) {
    pending.push(meta.dir);
    continue;
  }
  for (const f of css) errors.push(`${meta.dir}/${f}: a converted ${meta.layer} keeps a stylesheet`);
  for (const { file, token } of classTokens(dir)) {
    const u = utilityOf(token);
    if (/[[(]/.test(u)) errors.push(`${meta.dir}/${file}: ${token}: an arbitrary value; take it from the theme`);
    if (/^(group|peer)(\/[\w-]+)?$/.test(token)) continue; // a marker that names a group for group-*: variants
    all.push({ where: `${meta.dir}/${file}`, token });
  }
}

const { unknown } = await compileCandidates([...new Set(all.map((a) => a.token))]);
const bad = new Set(unknown);
for (const a of all) if (bad.has(a.token)) errors.push(`${a.where}: ${a.token}: not a utility of the theme`);

for (const e of [...new Set(errors)]) console.log(e);
console.log(`Utilities: ${new Set(errors).size} finding(s); ${pending.length} still on a stylesheet`);
process.exitCode = errors.length ? 1 : 0;
