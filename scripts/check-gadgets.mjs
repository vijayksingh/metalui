// The gadget catalog's health: every fixture spec validates, the shipped catalog obeys the set rules
// (hues apart, no repeated material and band, visible difference, also for colour blindness), and the
// worked placements resolve to placements.resolved.json, which the SwiftUI resolver must match.
// Runs the library's own TypeScript (Node strips types); `--check` fails instead of writing.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { root, emit, finish } from './lib/emit.mjs';

// The package imports its modules without extensions; resolve them to .ts here.
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); } catch (e) {
      if (specifier.startsWith('.') && context.parentURL) {
        const url = new URL(`${specifier}.ts`, context.parentURL);
        if (existsSync(fileURLToPath(url))) return next(url.href, context);
      }
      throw e;
    }
  },
});

const dir = root('packages/metalui/src/gadgets');
const { validateGadget, validateRig } = await import(pathToFileURL(`${dir}/validate.ts`).href);
const { resolve, resolveFeel, checkSet } = await import(pathToFileURL(`${dir}/resolve.ts`).href);

const fixtures = readdirSync(`${dir}/fixtures`);
const read = (f) => JSON.parse(readFileSync(`${dir}/fixtures/${f}`, 'utf8'));
let failed = 0;
const report = (label, problems) => {
  failed++;
  console.error(`gadgets: ${label}`);
  for (const p of problems) console.error(`  ${p.path} [${p.code}] ${p.message}${p.fix ? ` → ${p.fix}` : ''}`);
};

// Every gadget fixture validates; together they are the shipped catalog.
const catalog = {};
for (const f of fixtures.filter((f) => f.endsWith('.gadget.json'))) {
  const spec = read(f), v = validateGadget(spec);
  if (!v.ok) report(`${f} does not validate`, v.problems);
  else catalog[spec.name] = spec;
}
for (const f of fixtures.filter((f) => f.endsWith('.rig.json'))) {
  const v = validateRig(read(f), catalog);
  if (!v.ok) report(`${f} does not validate`, v.problems);
}
const members = Object.values(catalog).map((g) => ({ name: g.name, resolved: resolveFeel(g), mechanism: g.mechanism.name, silhouette: g.parts.map((p) => p.part).sort().join(',') }));
const setProblems = checkSet(members);
if (setProblems.length) report('the catalog repeats itself', setProblems.map((p) => ({ path: p.members.join(' + '), code: p.code, message: p.message, fix: p.fix })));

// The worked placements, resolved: the numbers SwiftUI must reproduce.
const placements = read('placements.json');
const round = (x) => +x.toFixed(4);
const resolved = {};
for (const [name, p] of Object.entries(placements)) {
  if (name.startsWith('$')) continue;
  const r = resolveFeel(p);
  resolved[name] = {
    material: r.material, station: r.station, container: r.container, reach: r.reach, register: r.register, scale: r.scale, band: r.band,
    body: { L: round(r.body.L), C: round(r.body.C), H: round(r.body.H), srgb: r.body.pigment.srgb },
    accent: { L: round(r.accent.L), C: round(r.accent.C), H: round(r.accent.H), srgb: r.accent.pigment.srgb },
  };
}
emit('packages/metalui/src/gadgets/fixtures/placements.resolved.json', JSON.stringify(resolved, null, 2) + '\n');
// The whole catalog resolves (every state).
for (const g of Object.values(catalog)) resolve(g);

if (failed) process.exit(1);
finish(`gadgets check (${Object.keys(catalog).length} gadgets, ${fixtures.filter((f) => f.endsWith('.rig.json')).length} rig)`);
