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
    face: { L: round(r.face.L), C: round(r.face.C), H: round(r.face.H), srgb: r.face.pigment.srgb },
  };
}
emit('packages/metalui/src/gadgets/fixtures/placements.resolved.json', JSON.stringify(resolved, null, 2) + '\n');
// The beeper's flex envelope for every earcon, from the web Part: SwiftUI's twin must sample the same.
const { beeperEnvelope } = await import(pathToFileURL(`${dir}/parts/beeper.ts`).href);
const { SOUND } = await import(pathToFileURL(root('packages/metalui/src/sound/recipes.generated.ts')).href);
emit('packages/metalui/src/gadgets/fixtures/beeper-envelopes.json', JSON.stringify(Object.fromEntries(Object.keys(SOUND.beeper.earcons).filter((k) => !k.startsWith('$')).map((e) => [e, beeperEnvelope(e).map((x) => [x.at, x.v])]))) + '\n');

// The held drive through scripted scenes, from the web model: SwiftUI's twin must land on the same.
const { DriveModel } = await import(pathToFileURL(`${dir}/drive.ts`).href);
const scenes = {
  'new-mix': { start: [0.5, 0.5, 0.5], steps: [[0, [0.2, 0.9, 1]]] },
  'changed-mid-flight': { start: [0, 0, 0], steps: [[0, [1, 1, 1]], [150, [0.3, 0.3, 0.3]]] },
};
const drives = {};
for (const [name, scene] of Object.entries(scenes)) {
  const m = new DriveModel('slide', scene.start), samples = [], events = [];
  let next = 0;
  for (let t = 0; t <= 1200; t += 20) {
    while (next < scene.steps.length && scene.steps[next][0] <= t) { m.advance(scene.steps[next][0]); m.retarget(scene.steps[next][1]); next++; }
    for (const e of m.advance(t)) events.push([e.kind, e.actor, +e.at.toFixed(6), +e.level.toFixed(6), e.kind === 'stop' ? e.end : null]);
    samples.push([t, ...m.x.map((x) => +x.toFixed(9))]);
  }
  drives[name] = { ...scene, samples, events };
}
emit('packages/metalui/src/gadgets/fixtures/drive-samples.json', JSON.stringify(drives) + '\n');
// The roll through scripted scenes, from the web model: SwiftUI's twin must land on the same.
const { RollModel } = await import(pathToFileURL(`${dir}/drive.ts`).href);
const rollScenes = {
  'carry-up': { actors: 3, start: 199, steps: [[0, 200]] },
  'carry-down': { actors: 3, start: 200, steps: [[0, 199]] },
  'far': { actors: 3, start: 0, steps: [[0, 999]] },
  'changed-mid-roll': { actors: 2, start: 5, steps: [[0, 7], [60, 9]] },
};
const rolls = {};
for (const [name, sc] of Object.entries(rollScenes)) {
  const m = new RollModel('roll', sc.actors, sc.start), samples = [], events = [];
  let next = 0;
  for (let t = 0; t <= 1000; t += 20) {
    while (next < sc.steps.length && sc.steps[next][0] <= t) { m.advance(sc.steps[next][0]); m.retarget(sc.steps[next][1]); next++; }
    for (const e of m.advance(t)) events.push([e.kind, e.actor, +e.at.toFixed(6), +e.level.toFixed(6)]);
    samples.push([t, ...m.x.map((x) => +x.toFixed(9))]);
  }
  rolls[name] = { ...sc, samples, events };
}
emit('packages/metalui/src/gadgets/fixtures/roll-samples.json', JSON.stringify(rolls) + '\n');
// The whole catalog resolves (every state).
for (const g of Object.values(catalog)) resolve(g);

if (failed) process.exit(1);
finish(`gadgets check (${Object.keys(catalog).length} gadgets, ${fixtures.filter((f) => f.endsWith('.rig.json')).length} rig)`);
