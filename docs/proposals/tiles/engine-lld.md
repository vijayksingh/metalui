# Gadget engine: low-level design

This is the build plan for the engine behind `docs/GADGETS.md`: the spec, the resolver, the two renderers, the mechanism engine, rigs, the generators and checks, the starter set, and the order to build it in. It assumes the model in `docs/proposals/tiles/model.md` (Job × Feel, seven materials, set rules) and the shipped sound foundation (`tokens.json` → `sound`, `packages/metalui/src/sound/sound.ts`, `MetalSound.swift`). Nothing here is built; it is a proposal for the owner to cut.

Vocabulary: a **Part** is a piece cut from one material; a **mechanism** is a timeline (motion, sound cues, lamp gestures, states) that a gadget plays; a **gadget** is Parts on a body with one mechanism; a **rig** is gadgets on a panel, wired. "Foundation", "Part", "mechanism": never "primitive".

---

## 1. Architecture

### 1.1 Pieces and where they sit

| Piece | Layer | Source of truth | Generated outputs |
|---|---|---|---|
| Materials, visual side (bevel, gloss, grain, flecks, translucency, shadow) | Foundations | `tokens.json` → `gadgets.materials` (keys must equal `sound.materials`) | `gadgets.generated.ts`, `MetalGadgets.generated.swift`, filter recipes |
| Materials, acoustic side | Foundations | `tokens.json` → `sound.materials` (shipped) | shipped |
| Feel model (L/C/H coefficients, material rules, f0 rule) | Foundations | `gadgets.feel` | both generated files |
| Jobs (stations, reach, allowed containers) | Foundations | `gadgets.jobs` | both |
| Accent rule | Foundations | `gadgets.accent` | both |
| Lamp gestures | Foundations | `gadgets.lamp` | `@keyframes mu-lamp-*`, Swift keyframes; the LED Part adopts them |
| Beeper earcons | Foundations | `sound.beeper.earcons` (shipped: done, failed, waiting, ready) | shipped |
| Set rules, rig grid, cable physics, sound budget | Foundations | `gadgets.set`, `gadgets.rig` | both |
| Mechanisms (timelines as data) | Foundations | `packages/metalui/gadgets/src/mechanisms/<name>.mjs` | `mechanisms.generated.ts`, `MetalMechanisms.generated.swift`, `@keyframes` |
| Parts: Slab, Bezel, Backlight, Cap, Jack, Plug, Cable, Cell, Drum, Needle, Lid, Pull, Lens, Nib, Beeper (LED, Keycap, Glass face, Label, Glyph exist) | Parts | `packages/metalui/src/components/<part>/` as today (React + CSS + meta + agent.md), Swift twin | registry |
| Part drawing functions (spec → SVG for the gadget canvas) | Parts | `packages/metalui/src/gadgets/parts/<part>.ts` (each imports its Part's recipe; nothing else) | |
| Gadget, Rig | Objects, `role: "emblem"` | `packages/metalui/src/gadgets/` runtime; catalog specs in `packages/metalui/gadgets/src/catalog/*.gadget.json`, `rigs/*.rig.json` | static SVG/PNG in `public/gadgets/`, registry, AI.md section |
| Runtime renderer | Objects | `packages/metalui/src/gadgets/{validate,resolve,layout,draw,scheduler}.ts`; Swift `MetalGadget`, `MetalRig` | |
| Build and checks | tooling | `scripts/build-gadgets.mjs`, `scripts/check-gadgets.mjs` | |
| Agent guide | docs | `packages/metalui/src/gadgets/gadgets.agent.md` + per-gadget `.agent.md` | `public/AI.md`, `llms.txt`, `gadgets.json` |

The gadget runtime imports Foundations and Parts only (`check:layers` enforces it against `meta.json` `layer: "object"`). It never imports a Component, so a gadget can never become a control.

### 1.2 Data flow

```
spec (JSON, from the catalog or the assistant)
  │
  ▼
validate(spec)          closed lists, ranges, bindings, cycles, set rules   → errors with codes and fixes
  │
  ▼
resolve(spec, host)     job + feel + pins → material, body OKLCH → sRGB/P3, accent, lamp,
  │                     finish (lighting numbers), sound (f0 per part, weight, reach, register),
  │                     per-state overrides; host = { colorway, contrast, transparency, motion }
  ▼
layout(resolved)        parts on the 400-unit canvas (or rig modules on the grid), cables routed,
  │                     draw order, filter tier for the rendered size
  ▼
draw(layout)            SVG tree: defs (one filter set per material × tier, deduplicated per
  │                     document) + parts, each a <g data-slot> with transform-origin
  ▼
animate + sound         the scheduler takes the mechanism's cue list for the current act or value
                        change and drives WAAPI (motion), CSS classes (lamp), the sound engine
                        (strikes, beeps), in one clock; SwiftUI does the same from the same list
```

`validate`, `resolve`, `layout` and `draw` are pure and synchronous; `draw` returns a React element tree or a string. Only the last box holds state.

---

## 2. The spec schema

### 2.1 Closed vocabularies

```ts
// packages/metalui/src/gadgets/spec.ts
export const JOBS = ['tune', 'command', 'link', 'keep', 'identify', 'destroy', 'take', 'find', 'make', 'signal'] as const;
export type Job = (typeof JOBS)[number];
export type Reach = 'own' | 'others' | 'world';            // the sound foundation's names
export const MATERIALS = ['clay', 'ceramic', 'resin', 'stone', 'glass', 'metal', 'rubber'] as const;
export type Material = (typeof MATERIALS)[number];
export const PARTS = ['slab', 'bezel', 'glass-face', 'backlight', 'led', 'keycap', 'cap', 'jack', 'plug', 'cable',
  'cell', 'drum', 'needle', 'lid', 'pull', 'lens', 'nib', 'beeper', 'label', 'glyph'] as const;
export type PartName = (typeof PARTS)[number];
export const MECHANISMS = ['press', 'slide', 'seat', 'turn', 'flip', 'sweep', 'roll', 'swing', 'glow', 'slide-out', 'dip'] as const;
export type MechanismName = (typeof MECHANISMS)[number];
export type Container = 'slab' | 'inset' | 'free';
export type LampSignal = 'off' | 'live' | 'waiting' | 'failed' | 'link';   // the LED Part's kinds
export type LampGesture = 'steady' | 'flicker' | 'breathe' | 'blink2' | 'rise';
export type Earcon = 'done' | 'failed' | 'waiting' | 'ready';               // sound.beeper.earcons
export interface Feel { v: number; a: number; w: number }                    // each 0..1, two decimals
```

### 2.2 Channels: what flows along a cable

```ts
export type Channel =
  | { kind: 'boolean'; default?: boolean }
  | { kind: 'number'; min: number; max: number; unit?: string; default?: number }   // continuous
  | { kind: 'count'; max: number; default?: number }                                 // integer 0..max
  | { kind: 'state'; options: readonly string[]; default?: string }                  // enum
  | { kind: 'pulse' };                                                               // an event, no value
export type Value = boolean | number | string | { pulse: true };
```

A gadget declares ports. Inputs drive its value or state; outputs are what it exposes for wiring. The catalog fixes the ports per gadget; an assistant can wire them, not add them.

### 2.3 GadgetSpec

```ts
export interface GadgetSpec {
  $schema: 'metalui/gadget@1';
  name: string;                 // kebab-case, ≤ 32 chars, unique within a rig or the catalog
  title: string;                // what it is, for people ("Sync")
  job: Job;
  reach?: Reach;                // default: gadgets.jobs[job].reach
  feel: Feel;
  container?: Container;        // default: gadgets.jobs[job].containers[0]
  material?: Material;          // a pin; else resolved from feel (§3.1)
  station?: number;             // must be in gadgets.jobs[job].stations; default: the first
  parts: PartPlacement[];       // 2..24; exactly one 'body' role unless container 'free'; exactly one 'led'
  mechanism: MechanismRef;
  ports?: { in?: Record<string, Channel>; out?: Record<string, Channel> };  // ≤ 4 each
  states: Record<string, StateSpec>;  // must include 'rest'; ≤ 8; names kebab-case
  initial?: string;             // default 'rest'
  describe?: string;            // template for the live description: "{title}: {state}, {value} of {max}"
}

export interface PartPlacement {
  id: string;                   // unique in the gadget; the mechanism binds to it
  part: PartName;
  at: [number, number];         // centre, canvas units (0..400)
  size?: [number, number];      // width, height in units; default gadgets.parts[part].size
  rotate?: number;              // degrees
  material?: Material | 'accent';   // must be in gadgets.parts[part].materials; default the first;
                                    // 'accent' only where the part allows it
  role: 'body' | 'actor' | 'lamp' | 'cut' | 'trim';   // body: the slab/bezel; actor: moves; lamp: the LED;
                                                      // cut: a hole/slot in the body; trim: static
  params?: Record<string, number | string | boolean>;  // closed per part (§8.2); validated
  z?: number;                   // draw order within a role band; default 0
}

export interface MechanismRef {
  name: MechanismName;
  bind: Record<string, string | string[]>;   // mechanism slot → part id(s); every required slot bound
  detents?: number;             // for held mechanisms with detents (slide, turn, roll): 2..60
  drive?: string;               // which input port drives a held mechanism; default the first 'in' port
}

export interface StateSpec {
  feel?: Partial<Feel>;                 // override, same ranges
  lamp?: [LampSignal, LampGesture];     // default ['off', 'steady']
  form?: Record<string, FormValue>;     // part id → a held pose or a param change
  beep?: Earcon;                        // plays on entering the state, once
  enter?: 'act' | 'none';               // play the mechanism's momentary act on entering; default 'none'
  hint?: string;                        // for the live description ("failed: check your connection")
}
export type FormValue =
  | { pose: { x?: number; y?: number; r?: number; sx?: number; sy?: number } }   // held pose, units/deg
  | { param: string; value: number | string | boolean };                        // e.g. lid open: 70
```

### 2.4 RigSpec

```ts
export interface RigSpec {
  $schema: 'metalui/rig@1';
  name: string; title: string;
  job: Job; feel: Feel;             // the panel's own job and feel
  grid: [number, number];           // columns, rows: 1..4 × 1..3
  gadgets: Record<string, RigSlot>; // key = instance name, 2..8 entries
  cables: Cable[];                  // 1..12
}
export interface RigSlot {
  gadget: string | GadgetSpec;      // a catalog name or an inline spec
  at: [number, number];             // column, row
  span?: [1 | 2, 1 | 2];            // default [1, 1]
  set?: Record<string, Value>;      // initial input values
  params?: Record<string, number | string>;   // catalog gadget params (digits, scale…)
}
export interface Cable {
  from: `${string}.${string}`;      // "instance.port" (an out port)
  to: `${string}.${string}`;        // "instance.port" (an in port)
  map?: CableMap;                   // required when the kinds differ
  jack?: 'auto' | [number, number]; // where the cable leaves the panel edge of the gadget; default auto
}
export type CableMap =
  | { kind: 'threshold'; at: number; above: string | boolean; below: string | boolean }  // number → state/boolean
  | { kind: 'scale'; from: [number, number]; to: [number, number] }                      // number → number
  | { kind: 'match'; when: string | boolean; pulse: true }                               // state/boolean → pulse
  | { kind: 'count'; step: 1 | -1 }                                                      // pulse → count
  | { kind: 'select'; table: Record<string, string> };                                   // state → state
```

Compatible kinds without a map: same kind; `count` → `number` (as-is); `boolean` → `state` with options `['on','off']`.

### 2.5 Versioning and defaults

- `$schema` carries the version. `@1` is this document. A reader refuses an unknown major; a minor adds optional fields only.
- Every optional field has a default in `gadgets.generated.ts` (`SPEC_DEFAULTS`), so two specs that differ only in defaults resolve identically; `normalize(spec)` fills them and is what `resolve` reads.
- Numbers are rounded on validation: feel to 2 decimals, positions to 0.5 units, degrees to 1.

### 2.6 What an assistant may and may not set

| May set | May not set |
|---|---|
| `title`, `job`, `feel`, `container`, `station` (from the job's list), `reach` | a material outside `gadgets.parts[part].materials`, a part or mechanism not in the catalog |
| `parts` from the Part catalog, with positions and closed params | a new param, a new part, a Component of any kind |
| `mechanism` from the catalog, its `bind` and `detents` | a timeline, a cue, a spring, a colour, a filter number |
| `states` (feel overrides, lamp, form, beep) | lamp colours other than the five signals; a beep on `rest`; more than one `failed` lamp state |
| rig `grid`, `gadgets`, `cables`, `map` | a cable to a port that does not exist, a cycle, more than 3 fan-out from one port |

Everything else (lighting, colour, sound recipes, springs, stagger) comes from Foundations. The guide says this in one table so the assistant does not try.

### 2.7 The validator

No dependency. `validate(spec: unknown): Validation` is a hand-written walk in `validate.ts` (about 250 lines) that checks types, closed lists, ranges, uniqueness, bindings and the cross-part rules, and returns every problem at once:

```ts
export interface Problem { path: string; code: ProblemCode; message: string; fix?: string }
export type Validation = { ok: true; spec: GadgetSpec | RigSpec } | { ok: false; problems: Problem[] };
export type ProblemCode =
  | 'schema.version' | 'field.missing' | 'field.type' | 'field.range' | 'field.enum'
  | 'part.unknown' | 'part.material' | 'part.param' | 'part.offCanvas' | 'part.overlap' | 'part.roles'
  | 'mechanism.unknown' | 'mechanism.unbound' | 'mechanism.bindKind' | 'mechanism.drive'
  | 'state.rest' | 'state.lamp' | 'state.beep' | 'state.form'
  | 'port.unknown' | 'port.kind' | 'cable.cycle' | 'cable.fanout' | 'cable.map' | 'cable.selfLoop'
  | 'grid.overlap' | 'grid.outside' | 'set.hue' | 'set.band' | 'set.deltaE' | 'set.container' | 'set.cvd';
```

A JSON Schema (`public/gadgets/gadget.schema.json`, `rig.schema.json`) is *generated from the same tables* by `build-gadgets.mjs` for editors and the assistant's tooling; the runtime never loads it.

### 2.8 Example: the patch bay

```json
{
  "$schema": "metalui/gadget@1",
  "name": "patch-bay", "title": "Sync",
  "job": "link", "reach": "world", "feel": { "v": 0.7, "a": 0.8, "w": 0.4 },
  "container": "slab", "station": 195,
  "parts": [
    { "id": "body",   "part": "slab",   "at": [200, 196], "size": [320, 320], "role": "body", "material": "stone" },
    { "id": "lamp",   "part": "led",    "at": [313, 78],  "role": "lamp" },
    { "id": "jackA",  "part": "jack",   "at": [128, 200], "role": "trim" },
    { "id": "jackB",  "part": "jack",   "at": [272, 200], "role": "trim" },
    { "id": "plugA",  "part": "plug",   "at": [128, 200], "role": "actor", "material": "accent" },
    { "id": "plugB",  "part": "plug",   "at": [272, 200], "role": "actor" },
    { "id": "cable",  "part": "cable",  "at": [200, 200], "role": "trim", "params": { "from": "plugA", "to": "plugB", "sag": 34 } },
    { "id": "beeper", "part": "beeper", "at": [96, 310],  "role": "trim", "params": { "slots": 5 } }
  ],
  "mechanism": { "name": "seat", "bind": { "plug": "plugA", "socket": "jackA", "lamp": "lamp", "beeper": "beeper" } },
  "ports": {
    "in":  { "state": { "kind": "state", "options": ["connected", "syncing", "done", "failed"], "default": "connected" } },
    "out": { "healthy": { "kind": "boolean" }, "done": { "kind": "pulse" } }
  },
  "states": {
    "rest":      { "lamp": ["off", "steady"] },
    "connected": { "lamp": ["live", "steady"] },
    "syncing":   { "feel": { "a": 1.0 }, "lamp": ["waiting", "breathe"], "form": { "plugA": { "pose": { "y": -7 } } } },
    "done":      { "lamp": ["live", "steady"], "beep": "done", "enter": "act" },
    "failed":    { "feel": { "v": 0.1, "w": 0.7 }, "lamp": ["failed", "blink2"], "beep": "failed",
                   "form": { "plugA": { "pose": { "x": -22, "y": -46, "r": -14 } } }, "hint": "check your connection" }
  },
  "describe": "{title}: {state}"
}
```

`healthy` is derived: `state !== 'failed'`. `done` pulses on entering `done`. Derivations for catalog gadgets are fixed in the catalog record (`derive` table in §7.3).

### 2.9 Example: the counter drum

```json
{
  "$schema": "metalui/gadget@1",
  "name": "counter-drum", "title": "Streak",
  "job": "keep", "feel": { "v": 0.8, "a": 0.3, "w": 0.3 }, "container": "slab", "station": 140,
  "parts": [
    { "id": "body", "part": "slab", "at": [200, 196], "size": [320, 320], "role": "body" },
    { "id": "lamp", "part": "led",  "at": [313, 78],  "role": "lamp" },
    { "id": "window", "part": "slab", "at": [200, 200], "size": [204, 88], "role": "cut", "params": { "cut": "tray", "depth": 14 } },
    { "id": "d2", "part": "drum", "at": [136, 200], "role": "actor", "params": { "digits": 10, "face": "ceramic" } },
    { "id": "d1", "part": "drum", "at": [200, 200], "role": "actor", "params": { "digits": 10, "face": "ceramic" } },
    { "id": "d0", "part": "drum", "at": [264, 200], "role": "actor", "params": { "digits": 10, "face": "ceramic" }, "material": "accent" }
  ],
  "mechanism": { "name": "roll", "bind": { "drums": ["d2", "d1", "d0"], "lamp": "lamp" }, "drive": "count" },
  "ports": { "in": { "count": { "kind": "count", "max": 999, "default": 0 }, "reset": { "kind": "pulse" } },
             "out": { "rolled": { "kind": "pulse" }, "count": { "kind": "count", "max": 999 } } },
  "states": {
    "rest":        { "lamp": ["off", "steady"] },
    "counting":    { "lamp": ["live", "flicker"] },
    "rolled-over": { "lamp": ["live", "blink2"], "beep": "done" },
    "reset":       { "lamp": ["off", "steady"], "enter": "act" }
  },
  "describe": "{title}: {value} days"
}
```

### 2.10 Example: a two-gadget rig

```json
{
  "$schema": "metalui/rig@1",
  "name": "reading", "title": "Reading",
  "job": "keep", "feel": { "v": 0.8, "a": 0.3, "w": 0.3 }, "grid": [2, 1],
  "gadgets": {
    "today":  { "gadget": "needle-gauge", "at": [0, 0], "params": { "min": 0, "max": 40, "threshold": 30, "unit": "min" } },
    "streak": { "gadget": "counter-drum", "at": [1, 0], "params": { "digits": 3 } }
  },
  "cables": [
    { "from": "today.over", "to": "streak.count", "map": { "kind": "count", "step": 1 } }
  ]
}
```

Reaching today's goal (the needle crosses the threshold, a pulse) rolls the streak by one.

---

## 3. Resolution

`resolve(spec, host): ResolvedGadget` in `resolve.ts`. Every number below is a token in `gadgets.feel`, `gadgets.materials`, `gadgets.accent`; the code reads them, never carries them.

### 3.1 Material

```
material(spec):
  if spec.material: return it                                       // a pin; validated against the parts used
  if jobs[job].pin: return jobs[job].pin                              // find → glass face on stone; identify → glass
  rules (gadgets.feel.material-rules, first match wins):
    W ≥ 0.8 ∧ V ≤ 0.4 → rubber;  W ≥ 0.8 → glass;  W ≥ 0.5 ∧ A ≥ 0.6 → metal;  W ≥ 0.5 → stone;
    A ≥ 0.6 → resin;  V ≥ 0.7 ∧ W ≤ 0.3 → ceramic;  else clay
```

Each Part in the spec then takes its own material: the placement's `material`, else the first of `gadgets.parts[part].materials`, else the body's. `'accent'` resolves to the accent colour on the part's default material.

### 3.2 Body colour (OKLCH), accent, lamp

```
L = clamp(0.88 − 0.56·W + 0.05·(V − 0.5), material.L[0], material.L[1])
C = clamp(0.015 + 0.20·A·(0.6 + 0.4·V), 0, material.Ccap)          // destroy: min(C, 0.02)
H = station + 12·(V − 0.5) − 8·W
accent = |H − 45| ≤ 40 (mod 360) ? accent.cool (0.75/0.13/235) : accent.warm (0.72/0.19/45)
lamp  = the LED signal recipe (status tokens); the act burst is the accent colour through the lens
```

A state's `feel` override re-runs the three lines with the merged feel (material never changes between states; if the override would pick a different material the check refuses it: a state is the same object).

Per-face tint: a `glass-face` Part uses `material.face-L` and `face-C-cap` instead of the body ranges; a `backlight` Part's colour is the lamp colour (signal or accent) multiplied by the tint of the Part in front of it (`translucency`).

### 3.3 OKLCH → sRGB and Display P3

`color.ts` (about 80 lines): OKLCH → OKLab → linear sRGB / linear P3 → gamma. Gamut mapping: if any channel is outside [0, 1], reduce C by bisection (12 steps) at constant L and H until inside, then clamp. The resolver emits both `srgb: '#rrggbb'` and `p3: 'color(display-p3 r g b)'`; the SVG uses `p3` with the `srgb` value as the fallback in a `@supports (color: color(display-p3 0 0 0))` rule. Swift gets P3 components and uses `Color(.displayP3, …)`.

### 3.4 Finish: lighting numbers per material

The material's visual record drives one filter recipe (web) and one shading pass (Swift):

| Key | clay | ceramic | resin | stone | glass | metal | rubber |
|---|---|---|---|---|---|---|---|
| `bevel` (height blur σ, body) | 6 | 5 | 7 | 8 | 3 | 4 | 9 |
| `surface-scale` | 5 | 4 | 5 | 6 | 3 | 4 | 6 |
| `diffuse` | 1.12 | 1.10 | 1.08 | 1.14 | 1.0 | 1.05 | 1.15 |
| `gloss.exponent / strength` | 0/0 | 40/0.35 | 24/0.25 | 6/0.08 | 80/0.6 | 60/0.5 | 0/0 |
| `grain.frequency / amplitude` | 1.1/0.025 | 0.6/0.008 | 0.9/0.012 | 1.6/0.04 | 0/0 | 2.4/0.02 (directional) | 1.3/0.03 |
| `flecks` (alpha slope) | 0.5 | 0 | 0.3 | 1.2 | 0 | 0 | 0 |
| `translucency` | 0 | 0.05 | 0.6 | 0 | 0.8 | 0 | 0 |
| `shadow.cast` σ / dx / dy / α | 16/6/18/.24 | 14/6/16/.22 | 14/6/16/.20 | 18/6/20/.28 | 12/5/14/.24 | 12/5/14/.26 | 20/6/22/.32 |
| `shadow.contact` σ / dx / dy / α | 3/1/4/.14 | 3/1/4/.14 | 3/1/4/.12 | 3/1/4/.16 | 2/1/3/.18 | 2/1/3/.18 | 4/1/5/.18 |

Light: one distant light, azimuth 225°, elevation 62°, white; the same on both platforms. Actor parts scale bevel and shadows by `part-scale = 0.55` (the prototype's cap: σ 3.2, shadow 9/9/13/.26). Cuts: a `hole` recipe (blur 4, offset 3/6, `out` composite, flood .55) shades the top wall; the lower lip is a 1-unit lighter stroke on the cut path at `lip` opacity from the colorway.

### 3.5 Sound record

```
f0(part)      = sound.pitch.base · sqrt(sound.pitch.ref / longest side in units) · (1 − sound.pitch.heavy · W) · material.f0x
weight        = W (the gadget's, after the state override)
reach         = spec.reach ?? jobs[job].reach
register      = W ≤ 0.33 → 84, ≤ 0.66 → 72, else 60      (beeper base MIDI; earcons transpose by register − 72)
scale         = V ≥ 0.5 → major pentatonic, else minor  (earcon degrees are re-voiced onto the scale)
```

The shipped engine already takes `size`, `weight`, `reach`, `rendered`, `key`; the resolver passes those. Register and scale are a small extension to `beep()` (`options.transpose`, `options.scale`) that defaults to the shipped behaviour.

### 3.6 Set rules within a rig and across the shipped catalog

`checkSet(resolved[])` runs in `validate` for a rig and in `check-gadgets.mjs` for the catalog:

1. Hue stations ≥ 30° apart for any two gadgets (a rig with two `keep` gadgets must use 140 and 300).
2. No two gadgets share both material and L band (bands ≥ 0.78, 0.50–0.77, ≤ 0.49); four or more span two bands.
3. No two gadgets share a mechanism *and* a body silhouette (same part multiset); within a job, count or axis differs.
4. Body ΔE_OK ≥ 0.08 for every pair (OKLab Euclidean).
5. Container modes: more than three `slab` in a row on a rig's grid is refused.
6. CVD: Machado deuteranopia and protanopia simulations (matrices in `color.ts`), ΔE_OK ≥ 0.06 for every pair.

A rig's panel takes the rig's own job and feel and is excluded from rules 1–4 (it is the floor, not a gadget), but its L must differ from every gadget body by ≥ 0.06.

### 3.7 Host: colorways, dark hosts, contrast, transparency

Bodies are pigment, so a colorway does not recolour them. What changes is the world around them:

| Host | bone | graphite / dark |
|---|---|---|
| Light colour | `#FFFFFF` | `#F2F3F6` (cooler) |
| Cast shadow α | ×1.0 | ×1.35 |
| Floor seen through cuts | `well-top → well-bot` of the colorway | same, from graphite |
| Bodies with L > 0.84 | as resolved | L −0.04 (no glare on dark) |
| Idle lamp opacity | 0.78 | 0.86 (dark bodies read as disabled otherwise) |

`prefers-contrast: more` (or `data-mu-contrast="more"`): a 1-unit `contrast-edge` rim on glass faces and cells, translucency clamped to 0.2, cast shadow α ×1.2, the lamp's off state gets a 0.5 ring. `prefers-reduced-transparency`: backlit glow becomes a flat fill at the lamp colour × 0.35 over the tint, no `mix-blend-mode`. Reduced motion is in §6.6.

---

## 4. The renderer (web)

### 4.1 Module layout

```
packages/metalui/src/gadgets/
  index.ts              exports: Gadget, Rig, GadgetDefs, validate, resolve, renderGadgetSvg, renderRigSvg, catalog
  spec.ts               types and closed lists (§2)
  validate.ts           the validator (§2.7)
  normalize.ts          defaults
  resolve.ts            §3
  color.ts              OKLCH, gamut, CVD matrices
  layout.ts             canvas placement, rig grid, draw order, filter tier
  cables.ts             routing (sag, avoidance), path strings
  light.ts              filter recipes from tokens: defsFor(material, tier) → <defs> children; ids
  draw.tsx              spec → SVG element tree (pure); also draw.string.ts for SSR strings
  parts/                one drawing function per Part: slab.ts, bezel.ts, jack.ts, plug.ts, cable.ts, cap.ts,
                        cell.ts, drum.ts, needle.ts, lid.ts, pull.ts, lens.ts, nib.ts, beeper.ts, backlight.ts,
                        led.ts (adapter over the LED Part's recipe), keycap.ts, glass-face.ts, label.ts, glyph.ts
  mechanisms.generated.ts   timelines and cues, from packages/metalui/gadgets/src/mechanisms/*.mjs
  gadgets.generated.ts      tokens (materials, feel, jobs, accent, lamp, set, rig) and the resolved catalog
  scheduler.ts          the cue scheduler (§6.7)
  player.ts             WAAPI tracks, retarget, held springs
  Gadget.tsx            'use client' component
  Rig.tsx               'use client' component; propagation (§7)
  GadgetDefs.tsx        document-level defs provider
  budget.ts             per-page filter budget (IntersectionObserver)
  gadgets.agent.md      the guide (§8.5)
  catalog/<name>/       <name>.gadget.json, <name>.agent.md, meta.json { layer: "object", role: "emblem", kind: "composed", uses: [...] }
  rigs/<name>/          <name>.rig.json, meta.json
```

Package exports: `@unlocalhosted/metalui/gadgets` (client), `@unlocalhosted/metalui/gadgets/static` (server-safe: validate, resolve, renderGadgetSvg as a string).

### 4.2 React API

```tsx
export interface GadgetProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'onChange'> {
  spec: GadgetSpec | string;                 // an inline spec or a catalog name
  params?: Record<string, number | string>;  // catalog params (digits, scale…)
  size?: number;                             // rendered px, 32..320; default 160
  state?: string;                            // controlled state name
  value?: Value | Record<string, Value>;     // controlled input port value(s); a single value goes to the drive port
  act?: number;                              // increment to play the momentary act (like a key)
  sound?: Sound | null;                      // an engine from createSound(); default: from <SoundProvider>, else silent
  announce?: boolean;                        // mirror the description into a polite live region; default false
  tier?: 'full' | 'lite' | 'flat' | 'auto';  // filter tier; default 'auto' (size and page budget)
  raster?: 'never' | 'rest' | 'always';      // rasterise when at rest; default 'never' alone, 'rest' inside a Rig
  onCue?: (cue: ScheduledCue) => void;       // every cue as it fires (tests, telemetry)
  onSettle?: (state: string, value: Value | undefined) => void;
}
export function Gadget(props: GadgetProps): JSX.Element;

export interface RigProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'onChange'> {
  spec: RigSpec | string;
  size?: number;                             // px per module; default 160
  values?: Record<string, Record<string, Value>>;   // instance → port → value (controlled inputs)
  states?: Record<string, string>;
  sound?: Sound | null;
  announce?: boolean;
  onPropagate?: (hop: { cable: Cable; value: Value; at: number }) => void;
  onCue?: GadgetProps['onCue'];
}
export function Rig(props: RigProps): JSX.Element;
export function GadgetDefs(): JSX.Element;    // renders the shared <svg><defs> once; optional
```

A gadget is never a control: no `onClick`, no focus, no keyboard. A host that wants to operate it wraps it in a Button and drives `state`/`value`/`act`.

### 4.3 How Parts draw

Each `parts/<part>.ts` exports:

```ts
export interface PartDraw {
  name: PartName;
  materials: readonly Material[];
  size: [number, number];                 // default footprint in units
  params: Record<string, ParamDef>;       // closed: { type: 'number'|'enum'|'boolean'|'ref', min?, max?, options?, default }
  slots: readonly string[];               // what a mechanism can bind: 'face', 'skirt', 'shadow', 'strip'…
  strike: { slot: string; level: number } | null;   // its sound when struck, relative to the act level
  draw(p: PlacedPart, r: ResolvedGadget, ctx: DrawContext): SvgNode;   // one <g data-slot={id}> with children
  cut?(p: PlacedPart): string;            // the path it subtracts from the body (holes, slots, trays)
}
```

`draw` returns a tree of plain objects (`{ tag, attrs, children }`), so the same function serves React (`toReact`), strings (`toString`) and the build-time rasteriser. A Part draws only with its own recipe values and the resolved record; `lint:literals` runs over `parts/`.

Filters: `light.ts` builds one filter set per (material, tier): `mu-g-body-<material>-<tier>`, `mu-g-part-<material>-<tier>`, `mu-g-hole`, `mu-g-lamp-hole`, plus the LED gradients. Ids are stable strings, so many gadgets on a page share them. Deduplication: `GadgetDefs` renders them once at the root and sets a context flag; without the provider each gadget inlines only the sets it uses, with ids suffixed by `useId()` (SSR-safe, unique per instance).

Canvas: `viewBox="0 0 400 400"`; the body is 320 square at (40, 36) with radius 76 (the prototype's numbers, `gadgets.rig.canvas`). The LED sits at (313, 78) on slab and inset. `free` containers allowed at ≥ 96 px; below, the layout substitutes a slab body with the same colours.

### 4.4 Tiers and small sizes

| Tier | Size | What draws |
|---|---|---|
| `full` | ≥ 96 px | turbulence grain, flecks, diffuse lighting, cast + contact shadows, hole walls, gloss |
| `lite` | 48–95 px | no turbulence, no flecks; bevel σ × 0.6; one cast shadow; gloss as a fixed highlight gradient |
| `flat` | < 48 px | no filters: body fill = two-stop gradient (top +0.03 L, bottom −0.035 L), two `drop-shadow`-free rect shadows as paths, lamp as a circle with the signal colour; cuts as darker fills. ≤ 3 parts drawn (body, lamp, the largest actor) |

The build rasterises `flat` and `lite` at 32 and 64 px so app icons never pay for filters.

### 4.5 Hit-testing and accessibility

- `<svg role="img" aria-labelledby="<id>-t <id>-d">` with `<title>` = `title` and `<desc>` = the resolved `describe` template ("Sync: failed, check your connection"; "Streak: 12 days").
- `announce` adds an off-screen `<output aria-live="polite">` updated on settle, throttled to one announcement per 1.5 s per gadget (the sound rate limit's `gapMs`).
- No focus, no tabindex, no pointer handlers; `pointer-events: none` on parts so a wrapping Button receives the pointer.
- Cables in a rig carry `<title>` ("today drives streak") for hover in the docs and for the agent's own description.

### 4.6 Performance budget

Measured on the prototype (Chrome, M-series): a full-tier patch bay is 5 filtered elements and about 1.8 ms to paint at 160 px; a moving plug repaints its own filter region only (each actor is in its own `<g filter>` with `x/y/width/height` padded 60 %) at about 0.4 ms per frame.

- Per page: at most 8 `full` gadgets painting at once. `budget.ts` hands out `full` to the first 8 visible (IntersectionObserver, root margin 20 %); the rest get `lite` until a slot frees. Rigs count each gadget.
- During an act only the actor's group and the lamp animate (WAAPI on `transform`/`opacity`); the body never repaints.
- `raster: 'rest'`: 2 s after the last cue settles, the SVG is serialised, drawn to an offscreen `<canvas>` at devicePixelRatio and shown as an `<img>` under the live lamp; the SVG returns on the next act. Default inside a Rig with ≥ 3 gadgets; off for a single gadget (not worth the swap).
- `will-change` is never set on filtered groups (it forces layers that the filters then re-rasterise).
- Filter regions are explicit so Safari does not blur into the whole viewBox.

### 4.7 SSR and RSC

`draw` is pure; `renderGadgetSvg(spec, { state, value, size, host })` from `@unlocalhosted/metalui/gadgets/static` returns a string with no ids that need a document (instance ids come from a counter seeded by the spec name). `Gadget.tsx` is `'use client'`; on the server it renders the same tree via `draw`, and on hydration the player attaches without re-rendering (the tree is deterministic for the same props). The scheduler starts only after `useEffect`; sound is never touched during render.

---

## 5. The renderer (SwiftUI)

### 5.1 API

```swift
public struct MetalGadget: View {
    public init(spec: MetalGadgetSpec, size: CGFloat = 160, state: String? = nil, value: MetalGadgetValue? = nil,
                act: Int = 0, sound: MetalSound? = .shared, announce: Bool = false)
    public init(_ name: String, params: [String: MetalGadgetParam] = [:], …)     // catalog
}
public struct MetalRig: View {
    public init(spec: MetalRigSpec, moduleSize: CGFloat = 160, values: [String: [String: MetalGadgetValue]] = [:],
                states: [String: String] = [:], sound: MetalSound? = .shared, announce: Bool = false)
}
public enum MetalGadgetValue: Sendable { case bool(Bool), number(Double), count(Int), state(String), pulse }
public struct MetalGadgetSpec: Codable, Sendable { … }   // the same JSON; validation via MetalGadgetValidator (ported table)
```

`swift/Sources/MetalUI/Gadgets/`: `MetalGadgetSpec.swift`, `MetalGadgetValidator.swift`, `MetalGadgetResolver.swift`, `MetalGadgetLighting.swift`, `MetalGadgetParts/*.swift` (one per Part), `MetalMechanismPlayer.swift`, `MetalGadget.swift`, `MetalRig.swift`, `MetalGadgets.generated.swift`, `MetalMechanisms.generated.swift`.

### 5.2 Lighting: recommendation

Three options were weighed:

| Option | Parity | Cost | Live composition | Verdict |
|---|---|---|---|---|
| Pre-rendered assets from the web build, live parts on top | exact for the catalog | none at runtime | none: an assistant's gadget has no asset | no |
| Metal shader (`layerEffect`) doing blur + Lambert + Phong per part per frame | good | a 2-pass blur per part per frame; fine on device, heavy on macOS with many gadgets | yes | fallback |
| **Core Image height-field pipeline, cached per part layer** | good; the pipeline is the SVG one (`CIHeightFieldFromMask` = blurred alpha, `CIShadedMaterial` = diffuse + specular against a shading image generated from the light tokens) | one render per (part, material, size, colorway, form pose) then a cached `CGImage`; actors move as whole layers | yes | **recommended** |

`MetalGadgetLighting` builds the shading image once per material from `gadgets.materials` (a 256 px sphere lit at azimuth 225°, elevation 62°, with the material's gloss), then for each part: mask → `CIHeightFieldFromMask(radius: bevel)` → `CIShadedMaterial(scale: surface-scale)` → multiply by the body fill (the same gradient-free pigment) → grain (`CIRandomGenerator` blended at `grain.amplitude`) → flecks (thresholded noise at `flecks`) → cast and contact shadows (`CIGaussianBlur` of the mask, offset, tinted). The result is drawn in a `Canvas`; actors are separate cached layers with `transform`s driven by the player; the LED is a live `MetalLED`-derived overlay (gradients, no filters). Cuts are drawn as the floor gradient under the body with the hole recipe applied to the wall.

Cache key: `(partId, material, tier, colorway, contrast, size bucket ∈ {32,64,96,160,320}, formHash)`. A rig of six gadgets warms in about 40 ms on an M-series Mac; a swap of state that changes a form pose re-renders only that actor's layer.

### 5.3 Parity

The repo already captures Swift renders (`METALUI_CAPTURES=… swift test --filter …Captures`) and web captures (`docs/captures/web/*.png`). Add `MetalGadgetCaptures`: every catalog gadget at 160 px in every state, both colorways, and every rig, to `docs/captures/swift/gadget-<name>-<state>-<colorway>.png`; `check-gadgets.mjs --parity` compares each against the web capture from the Playwright slice with a perceptual diff (ΔE_OK mean ≤ 0.03, 99th percentile ≤ 0.12, ignoring the grain layer by comparing with grain off in both). Numbers, not eyes, decide parity, and the recipe-parity check already ensures both sides carry the same tokens.

### 5.4 Motion and sound in Swift

`MetalMechanismPlayer` evaluates the same tracks as `MetalIconAct` does (keyframes at absolute ms, cubic-bezier easings, transform lists in translate/rotate/scale order) on a `TimelineView(.animation)` clock, and the same cue list drives `MetalSound.shared.strike(material, size:, weight:, reach:, rendered:, key:)` and `beep(earcon, rendered:, key:)` at `cue.at` on the same clock. Held mechanisms spring with `MetalMotion` springs (`.part`, `.hinge`, `.object`) from the current pose to the target pose; reduced motion goes through `MetalMotion.resolve(_:reduceMotion:)`, never `accessibilityReduceMotion` directly.

---

## 6. Mechanism engine

### 6.1 Format: the icon act with cues, states and a drive

A mechanism source (`packages/metalui/gadgets/src/mechanisms/<name>.mjs`) exports `mechanism = { … }` using the icon helpers from `packages/metalui/icons/src/motion.mjs` (`T`, `spring`, `pose`, `light`, `actor`, `ease`) plus new ones in `packages/metalui/gadgets/src/mechanism.mjs`:

```js
// Mechanism = Study + { mode, slots, held?, cues, states, reduced }
mechanism('seat', {
  mode: 'momentary',                              // or 'held'
  caption: 'The plug lifts, its shadow opens, and it seats again with a click.',
  stages: ['Lift', 'Hang', 'Seat'],
  slots: { plug: 'actor', socket: 'trim', lamp: 'lamp', beeper: 'trim?' },   // '?' optional
  duration: 640,
  tracks: [ actor('plug',        'centre', [ pose(0, T(), ease.accelerate), pose(140, T({ y: -14, sx: 1.04, sy: 1.04 }), ease.smooth),
                                             pose(300, T({ y: -14, sx: 1.04, sy: 1.04 }), ease.strike), ...spring(300, { y: -14, sx: 1.04, sy: 1.04 }, {}, 'part') ]),
            actor('plug.shadow', 'centre', [ light(0, 1, T()), light(140, .55, T({ x: 6, y: 10, sx: 1.25, sy: 1.25 })), light(300, .55, T({ x: 6, y: 10, sx: 1.25, sy: 1.25 })), light(420, 1, T()), light(640, 1, T()) ]) ],
  cues: [ strike(120, 'plug', { level: .2, pitch: .8 }),               // the pull: soft, a little low
          strike(420, 'plug', { level: .85 }), thump(420),              // the seat, with a thump if heavy
          lamp(420, 'flicker') ],
  states: { syncing: { hold: 'plug', pose: { y: -7 } } },              // named held poses a state may use
  reduced: ['lamp', 'sound'],                                          // what stays under reduced motion
});
```

Helpers: `strike(at, slot, { level, pitch?, material? })`, `friction(at, until, slot, level)`, `detent(slot, level)` (fires per detent crossed, so no `at`), `thump(at)`, `beep(at)` (the *state's* earcon, never a fixed one), `lamp(at, gesture)`.

Compiled record (`mechanisms.generated.ts`):

```ts
export interface Mechanism {
  name: MechanismName; mode: 'momentary' | 'held';
  duration: number; caption: string; stages: [string, string, string];
  slots: Record<string, { role: PartPlacement['role']; optional: boolean; many?: boolean }>;
  tracks: Track[];                       // { slot, sub?: 'shadow'|'face'|'strip'|'beam', origin: 'centre'|'pin'|'hinge'|'tip'|[x,y], frames: Frame[] }
  held?: Held;
  cues: Cue[];
  states: Record<string, HeldPose>;
  reduced: ('lamp' | 'sound' | 'press')[];
}
export interface Held {
  drive: Channel['kind'];                // number | count | boolean | state
  slot: string;                          // the actor
  from: Pose; to: Pose;                  // value 0 → from, value 1 → to (normalised over the port's range)
  spring: 'part' | 'hinge' | 'object';   // the spring that carries a retarget
  detents?: 'port' | number;             // 'port': one per count step; number: fixed count over the range
  overshoot?: number;                    // 0..1 scale on the spring's overshoot (needle: 1; drum: 0)
  stagger?: number;                      // ms between actors when a slot binds many (fader caps: 40)
}
export type Cue =
  | { at: number; kind: 'strike'; slot: string; level: number; pitch?: number }
  | { at: number; until: number; kind: 'friction'; slot: string; level: number }
  | { kind: 'detent'; slot: string; level: number }
  | { at: number; kind: 'thump' }
  | { at: number; kind: 'beep' }
  | { at: number; kind: 'lamp'; gesture: LampGesture };
```

Build contract (extends `validateStudy`): frames start at 0 and end at `duration`; every track returns exactly (momentary) or is absent (held; poses come from the drive); cues lie within `[0, duration]` and only name declared slots; a `beep` cue appears at most once; `held.detents` requires a `detent` cue; a momentary mechanism has no `held`; transforms use translate/rotate/scale in that order.

### 6.2 Held vs momentary

| | Momentary | Held |
|---|---|---|
| Trigger | `act` increments, or a state with `enter: 'act'` | the drive port's value changes |
| Motion | the tracks, once, from rest to rest | a spring from the current pose to `pose(value)`; the tracks (if any) are decorations (a shadow) keyed to the spring's progress |
| Cues | at absolute ms | `friction` for the spring's travel, `detent` per detent crossed, `strike` at settle if declared |
| Re-trigger mid-act | ignored (MOT-09), unless the new trigger is a state change, which retargets | retargets |

### 6.3 Interruption and retarget

- **Momentary, `act` again**: ignored until settled.
- **Momentary, state change mid-act**: the act finishes its current frame, then the new state's `form` pose is reached on the mechanism's `held.spring` (or `part`) from the *current* pose; the lamp switches at once; the pending `beep` cue is cancelled and the new state's beep plays on entry.
- **Held, new value mid-motion**: WAAPI cannot read velocity, so the player keeps its own spring integrator (`player.ts`, the token spring evaluated per frame by `requestAnimationFrame`, writing `transform` directly on the actor group). Retarget = new target with the current position *and velocity* kept, so a fast series of values reads as one motion. Detent cues fire as the integrator crosses detent positions, in either direction, at most one per 40 ms.
- **Held, value equal to the current target**: nothing.
- A `pulse` on a held gadget (drum `reset`) plays the momentary tracks then springs to `pose(value)`.

### 6.4 Stagger along cables

When a rig act propagates (§7.4), each downstream gadget starts `motion.stagger` later per hop: `--mu-spring-release-half` = 71 ms. Within a gadget that binds many actors to one slot (fader caps, drums), `held.stagger` applies between them in slot order (drums: the lower digit first, 0 ms; the next only when it rolls).

### 6.5 The lamp gestures

`gadgets.lamp`, played by the LED Part everywhere (the gadget's lamp is the LED Part with the hole recipe around it):

| Gesture | Keyframes (t s, opacity of lamp / core / spill) | Loop |
|---|---|---|
| `steady` | held at 1 / 1 / .85 (signal on) or .78 / .35 / .3 (off) | no |
| `flicker` | 0 .78 · .10 1 · .22 .5 · .34 1 · .46 .62 · .60 1 (the prototype's) over 0.8 s | no |
| `breathe` | sine .55 → 1.0 → .55 over 2.4 s | yes, while the state holds |
| `blink2` | two 90 ms flashes 140 ms apart, then the state's steady level | no |
| `rise` | 0 → 1 ease-out over 1.2 s | no |

A gesture cue inside a mechanism plays once; a state's `lamp` sets the signal and its resting gesture.

### 6.6 Reduced motion

`springs.*.reduced` already says what each class does. For mechanisms:

| Stays | Becomes instant |
|---|---|
| press travel (the `release` spring is "unchanged"), so a keycap still dips 6 units | slides, seats, turns, rolls, swings, flips, sweeps, slide-outs, dips: the actor jumps to the target pose |
| lamp gestures (opacity only; `breathe` becomes `steady` at 1.0) | stagger (all hops at once) |
| sound: strikes at their cue times collapsed to t = 0 (the seat's click still says "seated"), beeps unchanged | friction cues (no travel to hear) |
| the accent burst | the shadow opening |

The mechanism's `reduced` list names what stays; the scheduler drops everything else.

### 6.7 The cue scheduler

One list, one clock, three sinks:

```ts
// scheduler.ts
export interface ScheduledCue { at: number; cue: Cue; gadget: string; slot: string; sink: 'motion' | 'lamp' | 'sound'; skipped?: 'reduced' | 'budget' | 'rate' }
export function schedule(plan: ActPlan, sinks: Sinks, clock: Clock): Playing;
// ActPlan: { tracks (WAAPI keyframes per slot), cues (absolute ms from act start), duration, offset (stagger) }
```

- **Motion**: momentary tracks compile to WAAPI keyframes via `studyKeyframes` (the icon function) and run with `element.animate(...)`, `fill: 'both'`; held motion runs on the integrator. `document.timeline.currentTime` at start is the act's t0.
- **Sound**: every `strike`/`beep`/`thump` cue is handed to the engine at t0 with `delay = at / 1000` (the shipped `StrikeOptions.delay`), so audio scheduling is sample-accurate and independent of frame timing. `friction` becomes a `strike` at low level with `material` noise only (a new `StrikeOptions.friction: true` that skips the modes) repeated every 80 ms across `[at, until]`, at most 6 repeats.
- **Lamp**: a class swap (`data-gesture`) at `at` via one `setTimeout` per lamp cue, or the CSS keyframes when hydration has not happened.
- Cancellation returns a `Playing` handle; unmount cancels motion and lamp timers but never the already-scheduled audio (it is under 600 ms and stopping it clicks).
- `onCue` fires for every cue, with `skipped` set when the reduced-motion policy, the sound budget or the rate limit dropped it; the e2e slices read this.

Swift mirrors it: `MetalMechanismPlayer.schedule(plan:)` on a `TimelineView` clock; sound via `DispatchQueue.main.asyncAfter` into `MetalSound`, which already renders on `AVAudioSourceNode` time.

### 6.8 The starter mechanisms as data

Units are canvas units (400 per gadget; 1 unit = 0.4 px at 160 px). Springs are the token classes. Levels are relative to the act level (`sound.policy.levelDb.act`).

| Mechanism | Mode | Slots | Motion | Cues | States (held poses) |
|---|---|---|---|---|---|
| **press** | momentary, 420 ms | `keys` (many actors), `lamp` | each key: 0→70 ms `y +6, sx 1.02, sy .96` (accelerate); 70→110 hold; 110→ `spring(…, {}, 'release')`; keys staggered 60 ms (a chord) | `strike(70, key, 1.0)`; `strike(110 + release, key, .35, pitch 1.3)` per key; `lamp(70, 'flicker')` | none |
| **slide** | held, drive number, spring `part`, detents `port` or 8 | `caps` (many), `slot` (cut), `lamp` | value → `y` from `+92` to `−92` along the slot (from/to); many caps take a per-cap offset from the params; stagger 40 ms | `friction(travel, cap, .12)`; `detent(cap, .25)`; `strike(settle, cap, .8)` only when the value hits a range end (the stop) | `mix`: caps at their param positions |
| **seat** | momentary, 640 ms | `plug`, `socket`, `lamp`, `beeper?` | §6.1: lift 14 units, hang 160 ms, `spring('part')` home; shadow opens to 1.25 × at .55 α | `strike(120, plug, .2, pitch .8)`; `strike(420, plug, .85)`; `thump(420)`; `lamp(420, 'flicker')`; `beep(440)` | `half` `{ y: −7 }`; `out` `{ x: −22, y: −46, r: −14 }` |
| **turn** | held, drive number or count, spring `part`, detents 8 (45° each) | `ring`, `lamp` | value → `r` from −180° to +180° over the range; overshoot 0.6 | `detent(ring, .3)`; no friction (a ring turns clean) | `taken`: `{ r: +45 }` then back (as `act` for the shutter, §9) |
| **flip** | held, drive boolean or state, spring `hinge`, origin `hinge` (the back edge) | `lid`, `lamp`, `under?` (the red underside) | false → `r 0`, true → `r −70` about the hinge; a `pulse` on a closed lid plays open→close as momentary 900 ms | `friction(open, lid, .08)` (the creak, low-passed); `strike(close, lid, .9)`; `thump(close)` | `open` `{ r: −70 }`; `ajar` `{ r: −18 }` |
| **sweep** | momentary, 1400 ms; may loop while a state holds (`searching`) | `beam`, `face`, `blips?` (many), `lamp` | beam `r 0 → 360` linear; each blip `light` 0→1 as the beam crosses its angle, decays 600 ms | `strike(at crossing, blip, .3)` on glass, one per blip, max 3 per sweep | `stopped`: beam at `r 200`, blips dark |
| **roll** | held, drive count, spring `part`, overshoot 0, detents `port` | `drums` (many, lowest digit first), `window` (cut), `lamp` | digit `d` of value → the strip's `y = −36 · d`; only drums whose digit changed move; the next drum starts 60 ms after the lower one passes 9→0 | `detent(drum, .35)` per digit step; `strike(settle, drum, .2)` when a drum comes to rest | `zero`: all strips at 0 |
| **swing** | held, drive number, spring `part`, overshoot 1.0 (a needle overshoots) | `needle` (origin `pin`), `face`, `lamp`, `beeper?` | value → `r` −60° → +60°; a threshold crossing emits a `pulse` on the `over` port | none while moving (a needle is silent); `beep(settle)` on the state `over` | `over`: none (the value decides); `pegged`: `{ r: 66 }` |
| **glow** | held, drive number or count, spring `settle` | `light` (backlight), `cells` (many), `lamp` | value → backlight α .08 → .92 and each cell's `light` lit in order (count = value / max · n cells) | none (light is silent); `beep(peak)` for the `first-run` state's `ready` earcon | `dark` `{ α .08 }`; `full` `{ α .92 }` |
| **slide-out** | momentary, 760 ms; held pose `open` | `tray`, `pull`, `lamp` | tray `x +60` on `object` (accelerate 0→180, hold 180→420, spring home) | `friction(0–180, tray, .15)`; `strike(180, tray, .6)` (the runner's stop); `strike(home, tray, .5)` | `open` `{ x: 60 }`; `full` `{ x: 22 }` (it does not close) |
| **dip** | momentary, 320 ms | `nib`, `well` (cut), `lamp` | nib `y +10` on accelerate (0→110), `spring('release')` up | `strike(110, nib, .3)` on the well's material | `writing` `{ y: 6 }` |

Numbers to verify in the DialKit panel on Foundations → Mechanisms: press depth 6, plug lift 14, drum step 36, needle ±60°, drawer 60, nib 10, lid −70°.

---

## 7. Rig composition and wiring

### 7.1 The module grid

`gadgets.rig`: module pitch **440 units** (a 400 canvas + a 40 gutter, the spacing ladder's one nest at canvas scale), panel padding 40, panel radius 76 × 1.2, so a `[2, 1]` rig is 920 × 480 units and a `[3, 2]` rig 1360 × 920. A gadget's canvas is placed at `(40 + col · 440, 40 + row · 440)`; a `[2, 1]` span stretches its body to 760 wide (the Slab takes a `size`), with its parts laid out by the gadget's own `layout` rule for a wide body (the catalog says which gadgets allow a span: fader bank, cell grid, counter drum). Slots must not overlap (`grid.overlap`) and must lie inside the grid (`grid.outside`).

The rig's Slab is the panel: it is drawn with the rig's own resolved material and colour and carries no lamp. Each gadget keeps its own body inside the panel (a gadget on a rig is set into a tray cut 8 units deep, so bodies read as modules, not stickers).

### 7.2 Jacks and cable routing

Every rig gadget gets one jack per wired port, placed automatically (`jack: 'auto'`): out ports on the gadget's right edge, in ports on the left, spaced 44 units, starting 100 units from the top; a gadget that already has a Jack Part (the patch bay) uses it. Cables are rubber Cable Parts:

```
route(a, b):
  d = |b − a|
  sag = clamp(0.18 · d, 24, 90)                        // gadgets.rig.cable.sag
  c1 = a + (0.3·(b−a).x, sag), c2 = b − (0.3·(b−a).x, −sag)   // a cubic that droops under gravity
  for try in 0..3:
    if the sampled curve (24 samples) clears every part box except its own two jacks by ≥ 12 units: return
    sag += 30                                           // droop lower, under the parts
  return with problem 'cable.crossing' as a warning
```

Draw order on a rig: panel → trays (cuts) → gadget bodies and trims → cables (below plugs, above bodies) → plugs → actors → lamps → the spill. Cables never cross a lamp (the lamp's box is padded 30 units in the avoidance test).

### 7.3 What a cable carries and how it propagates

- **Synchronous data-flow, one tick.** The rig keeps a value table `{ instance: { port: Value } }`. On any input change (a prop, or an upstream output), it recomputes outputs in topological order (the cable graph must be a DAG: `cable.cycle` refuses otherwise) and pushes along cables with the `map`. A `pulse` is delivered once and never stored.
- **Derived outputs** are fixed per catalog gadget (`derive` table in the generated catalog): patch bay `healthy = state ≠ failed`, `done` pulses on `done`; needle gauge `over` pulses on an upward threshold crossing and `above` is boolean; counter drum `rolled` pulses at max → 0; scope `found` is a count; drawer `full` is a boolean at ≥ 90 %; cell grid `full` is a boolean.
- **Fan-out** ≤ 3 per out port; **fan-in** = 1 per in port (a port has one driver; `cable.fanin`).
- **Sync vs async**: values are synchronous; *acts* are asynchronous and staggered (§7.4). A person sees the value arrive one hop at a time even though the table is already settled.

### 7.4 Act propagation and the sound budget

When a source gadget acts or changes state, downstream gadgets that received a new value start their held motion (or their `enter: 'act'`) after `71 ms · hops`. Sound across a rig:

- **Voices**: at most 3 gadgets sound in one propagation. Rank by hop distance from the source (the source first), then by grid order; the rest move in silence (`onCue` reports `skipped: 'budget'`).
- **One loudness budget**: the rig is no louder than its loudest gadget. When `n` voices overlap within 120 ms each is scaled by `1/√n`. Beeps count as voices.
- **Rate limit**: the rig passes `key = rigName + '/' + instance` so the shipped per-key limits apply per gadget, and additionally `key = rigName` for a rig-wide cap of 6 plays per 10 s.

### 7.5 Validation errors an assistant can act on

| Code | Message (example) | Fix suggestion |
|---|---|---|
| `part.unknown` | `parts[3].part "knob" is not a Part; the catalog has: cap, jack, …` | "use cap for a knob with grip ribs" |
| `part.material` | `parts[2] jack cannot be clay; jack allows: metal` | the allowed list |
| `mechanism.unbound` | `mechanism seat needs slot "plug" bound to an actor part` | the parts with role actor in this spec |
| `mechanism.bindKind` | `slot "drums" of roll takes drum parts; "cap1" is a cap` | |
| `state.rest` | `states must include "rest"` | |
| `state.beep` | `states.rest.beep is not allowed; only a change of state plays the beeper` | |
| `cable.cycle` | `cables form a cycle: streak → today → streak` | "remove one cable; values flow one way" |
| `cable.map` | `today.value (number) → streak.count (count) needs a map; use { kind: "threshold" } or { kind: "count" }` | |
| `set.hue` | `today and streak both sit at station 140; keep's other station is 300` | the free stations |
| `set.band` | `streak and today are both clay in the ≥ 0.78 band; pin one to ceramic or lower its w` | |
| `set.container` | `four slab gadgets in a row on row 0; make one inset` | |

Every problem names a path, and `fix` is a literal the assistant can paste.

---

## 8. Assets and building blocks inventory

### 8.1 Foundation token groups to add (`tokens/tokens.json` → `gadgets`)

```json
"gadgets": {
  "$use": "Emblem objects. Job × Feel; materials carry the visual recipe (the acoustic one is sound.materials); mechanisms are data in packages/metalui/gadgets/src/mechanisms.",
  "canvas": { "size": 400, "body": [40, 36, 320, 320], "radius": 76, "lamp": [313, 78], "free-min-px": 96 },
  "light": { "azimuth": 225, "elevation": 62, "color": { "bone": "#FFFFFF", "graphite": "#F2F3F6" } },
  "materials": {
    "clay":    { "L": [0.55, 0.88], "C-cap": 0.10, "bevel": 6, "surface-scale": 5, "diffuse": 1.12, "gloss": [0, 0], "grain": [1.1, 0.025], "flecks": 0.5, "translucency": 0,
                 "shadow": { "cast": [16, 6, 18, 0.24], "contact": [3, 1, 4, 0.14] } },
    "ceramic": { "L": [0.80, 0.92], "C-cap": 0.12, "bevel": 5, "surface-scale": 4, "diffuse": 1.10, "gloss": [40, 0.35], "grain": [0.6, 0.008], "flecks": 0, "translucency": 0.05,
                 "shadow": { "cast": [14, 6, 16, 0.22], "contact": [3, 1, 4, 0.14] } },
    "resin":   { "L": [0.70, 0.90], "C-cap": 0.20, "bevel": 7, "surface-scale": 5, "diffuse": 1.08, "gloss": [24, 0.25], "grain": [0.9, 0.012], "flecks": 0.3, "translucency": 0.6,
                 "shadow": { "cast": [14, 6, 16, 0.20], "contact": [3, 1, 4, 0.12] } },
    "stone":   { "L": [0.45, 0.75], "C-cap": 0.05, "bevel": 8, "surface-scale": 6, "diffuse": 1.14, "gloss": [6, 0.08], "grain": [1.6, 0.04], "flecks": 1.2, "translucency": 0,
                 "shadow": { "cast": [18, 6, 20, 0.28], "contact": [3, 1, 4, 0.16] } },
    "glass":   { "L": [0.22, 0.45], "face-L": [0.75, 0.88], "C-cap": 0.06, "face-C-cap": 0.10, "bevel": 3, "surface-scale": 3, "diffuse": 1.0, "gloss": [80, 0.6], "grain": [0, 0], "flecks": 0, "translucency": 0.8,
                 "shadow": { "cast": [12, 5, 14, 0.24], "contact": [2, 1, 3, 0.18] } },
    "metal":   { "L": [0.40, 0.80], "C-cap": 0.08, "bevel": 4, "surface-scale": 4, "diffuse": 1.05, "gloss": [60, 0.5], "grain": [2.4, 0.02], "grain-direction": 0, "flecks": 0, "translucency": 0,
                 "shadow": { "cast": [12, 5, 14, 0.26], "contact": [2, 1, 3, 0.18] } },
    "rubber":  { "L": [0.22, 0.40], "C-cap": 0.03, "bevel": 9, "surface-scale": 6, "diffuse": 1.15, "gloss": [0, 0], "grain": [1.3, 0.03], "flecks": 0, "translucency": 0,
                 "shadow": { "cast": [20, 6, 22, 0.32], "contact": [4, 1, 5, 0.18] } }
  },
  "part-scale": { "bevel": 0.55, "shadow": 0.6 },
  "hole": { "blur": 4, "offset": [3, 6], "alpha": 0.55, "lip": 1 },
  "tiers": { "full": 96, "lite": 48, "lite-bevel": 0.6 },
  "host": { "graphite": { "shadow": 1.35, "bright-L-drop": 0.04, "bright-L-above": 0.84, "idle-lamp": 0.86 }, "bone": { "shadow": 1.0, "idle-lamp": 0.78 },
            "contrast": { "edge": 1, "translucency-max": 0.2, "shadow": 1.2 }, "reduced-transparency": { "glow-alpha": 0.35 } },
  "feel": { "L": { "base": 0.88, "W": -0.56, "V": 0.05 }, "C": { "base": 0.015, "A": 0.20, "V-mix": [0.6, 0.4] }, "H": { "V": 12, "W": -8 },
            "material-rules": [["W>=0.8&V<=0.4", "rubber"], ["W>=0.8", "glass"], ["W>=0.5&A>=0.6", "metal"], ["W>=0.5", "stone"], ["A>=0.6", "resin"], ["V>=0.7&W<=0.3", "ceramic"], ["*", "clay"]],
            "register": { "thresholds": [0.33, 0.66], "base-midi": [84, 72, 60] }, "scales": { "major": [0, 2, 4, 7, 9], "minor": [0, 3, 5, 7, 10] } },
  "jobs": {
    "tune":     { "stations": [80],       "reach": "own",    "containers": ["slab"] },
    "command":  { "stations": [95],       "reach": "own",    "containers": ["slab"], "pin": "ceramic" },
    "link":     { "stations": [195, 230], "reach": "world",  "containers": ["slab", "free"] },
    "keep":     { "stations": [140, 300], "reach": "own",    "containers": ["slab", "inset"] },
    "identify": { "stations": [260],      "reach": "others", "containers": ["inset"], "pin": "glass" },
    "destroy":  { "stations": [25],       "reach": "own",    "containers": ["slab"], "body-C-max": 0.02 },
    "take":     { "stations": [55],       "reach": "world",  "containers": ["inset"] },
    "find":     { "stations": [220],      "reach": "world",  "containers": ["inset"], "pin": "stone" },
    "make":     { "stations": [330],      "reach": "own",    "containers": ["slab", "free"] },
    "signal":   { "stations": [55, 80],   "reach": "own",    "containers": ["slab", "inset", "free"] }
  },
  "accent": { "warm": [0.72, 0.19, 45], "cool": [0.75, 0.13, 235], "flip-within-deg": 40, "min-C": 0.13 },
  "lamp": { "steady": { "on": [1, 1, 0.85], "off": [0.78, 0.35, 0.3] },
            "flicker": { "ms": 800, "keys": [[0, 0.78], [0.10, 1], [0.22, 0.5], [0.34, 1], [0.46, 0.62], [0.60, 1]] },
            "breathe": { "ms": 2400, "min": 0.55, "max": 1.0, "loop": true },
            "blink2": { "flash-ms": 90, "gap-ms": 140 },
            "rise": { "ms": 1200, "ease": "cubic-bezier(.22,1,.36,1)" } },
  "set": { "hue-gap": 30, "bands": [0.78, 0.50], "delta-e": 0.08, "cvd-delta-e": 0.06, "slab-run": 3, "panel-L-gap": 0.06 },
  "rig": { "pitch": 440, "padding": 40, "tray-depth": 8, "jack-spacing": 44, "jack-top": 100,
           "cable": { "sag": [0.18, 24, 90], "clearance": 12, "lamp-clearance": 30, "retry": 30 },
           "stagger": "var(--mu-spring-release-half)", "voices": 3, "overlap-ms": 120, "rig-burst": 6,
           "announce-gap-ms": 1500, "raster-rest-ms": 2000, "full-budget": 8 }
}
```

`sound.beeper.earcons` gains nothing; the four shipped earcons (done, failed, waiting, ready) are the whole beeper vocabulary. `check-gadgets.mjs` asserts `Object.keys(gadgets.materials) === Object.keys(sound.materials)`.

### 8.2 New Parts

Each ships as a Part today does (`components/<name>/`: React + CSS + `meta.json` `layer: "part"` + `.agent.md`; Swift twin; docs page) *and* a `parts/<name>.ts` drawing function for the gadget canvas. Materials, params and the strike are the closed lists the validator reads.

| Part | Geometry (units on the 400 canvas) | Params (closed) | Materials | Slots | States | Struck: slot / level |
|---|---|---|---|---|---|---|
| **Slab** | rounded panel, radius 76 at 320; `cut` variants subtract from the body: `slot` (w 18, r 9), `hole` (r), `tray` (rounded rect, depth), `well` | `cut: none|slot|hole|tray|well`, `depth 0..24`, `radius` | clay, stone, ceramic, rubber, metal | `body` | rest | body / .6 (knock) |
| **Bezel** | a frame 22 wide around a face; inner radius = outer − 22 | `width 16..32`, `face: glass-face|cell|backlight` | stone, metal, clay | `frame` | rest | frame / .5 |
| **Backlight** | a lamp behind a translucent part: a radial glow (r = 0.7 × the part) at the lamp colour through the tint | `alpha 0..1`, `color: signal|accent` | (lamp) | `light` | dark, lit | silent |
| **Cap** | fader/knob cap 48 × 30, three grip ribs (stroke 2.4 dark + 1.1 light, the prototype's), skirt shadow | `ribs 2..5`, `shape: fader|knob` | clay, ceramic, accent | `face` | rest, pressed | face / .8 |
| **Jack** | knurled nut r 26 around a hole r 12; 12 knurls | `knurls 8..16` | metal | `nut`, `hole` | rest, lit (a backlight in the hole) | nut / .7 |
| **Plug** | knurled plug r 22 with a cable stub; 6 knurls (the prototype's); `shadow` sub-slot for the opening shadow | `stub: up|left|right|none` | clay + accent | `body`, `shadow` | seated, lifted, out | body / .85 |
| **Cable** | a tube 14 wide from `from` to `to`, sagging (§7.2); a highlight stroke 3 at 0.35 α | `sag`, `from`, `to` (part refs) | rubber | `tube` | rest | tube / .2 (a slap) |
| **Cell** | a raised translucent block 44 × 44 r 10, gridded n × m by the placement's size | `cols 1..8`, `rows 1..8`, `gap 6..14` | resin | `cells` (many) | dark, lit per cell | cell / .5 |
| **Drum** | a numbered wheel 52 wide behind a window: a strip of 10 digits, step 36, seen through a 88-tall window, with a cylindrical shade (two dark gradients top and bottom) | `digits 10`, `face: ceramic|clay`, `glyphs: digits|ticks` | clay, ceramic, accent | `strip`, `window` | rest, rolling | strip / .35 (detent) |
| **Needle** | a pointer 96 long, 4 wide, tapered, on a pivot cap r 10; a printed scale (Label ticks) under it | `arc 90..150`, `ticks 5..21`, `threshold 0..1` | metal | `needle` (origin `pin`) | rest, over, pegged | silent |
| **Lid** | a hinged flap the size of the body's tray, hinge at the back edge; `under` sub-slot (the underside, red when `armed`) | `hinge: back|left`, `armed: boolean` | rubber, clay | `lid`, `under` | closed, ajar, open | lid / .9 (thud) |
| **Pull** | a drawer handle 96 × 14 on a tray front | `style: bar|recess` | metal, clay | `pull` | rest | pull / .5 |
| **Lens** | a domed glass r 78 in a ring 14 wide with 24 grip ticks; the ring turns | `ticks 12..36`, `iris 0..1` | glass + accent (ring) | `ring`, `dome` | ready, taken | ring / .3 (detent) |
| **Nib** | a pen tip 70 long over a well hole r 14 | `angle −30..30` | metal | `nib` (origin `tip`) | ready, writing | nib / .3 (on the well's material) |
| **Beeper** | a grille 44 × 24 of 5 slots over a piezo | `slots 3..7` | metal, clay | `grille` | rest, sounding (a 1-unit lift while a beep plays) | silent (it beeps) |

Existing Parts used unchanged: LED (adopts the lamp gestures), Keycap (gets its press strike from its material), Glass face, Label (engraved scale ticks and digits), Glyph.

### 8.3 Mechanisms, lamp gestures, earcons

Mechanisms: the eleven in §6.8, each a `.mjs` source with a card comment like the icon acts (verb, invariant, causal parts, forbidden). Lamp gestures: five (§6.5). Earcons: four shipped; the resolver transposes and re-voices by register and scale (§3.5).

### 8.4 Generators and checks

`scripts/build-gadgets.mjs` (runs inside `npm run generate`, after tokens and icons):

1. Reads `tokens.gadgets`, `tokens.sound`, `tokens.springs`, `tokens.motion`, the mechanism sources and the catalog.
2. Validates every mechanism (the extended contract) and every catalog spec and rig (the validator, in Node).
3. Resolves every catalog gadget and rig in both colorways and writes `gadgets.generated.ts` (tokens + resolved catalog: colours as sRGB and P3, finish, f0 per part, register, scale, derive tables, `SPEC_DEFAULTS`), `mechanisms.generated.ts`, `MetalGadgets.generated.swift`, `MetalMechanisms.generated.swift`, and `packages/metalui/src/components/gadgets.css` (`@keyframes mu-lamp-*`, `mu-mech-*` for the no-script players).
4. Runs the set rules and CVD check over the catalog.
5. Rasterises every catalog gadget and rig at rest: `public/gadgets/<name>[-<state>].svg` (full tier), `-64.png`, `-32.png` (lite/flat tiers), with `resvg` (already a build option for icons; otherwise Playwright's Chromium, which the repo has).
6. Emits `public/gadgets/gadget.schema.json`, `rig.schema.json`, `public/gadgets.json` (the catalog manifest for agents: parts, params, mechanisms, slots, ports, states) and the AI.md section via `build-agent-docs.mjs`.

`scripts/check-gadgets.mjs` (in `npm run check`): generated files are fresh (byte-diff against a dry run, like `build-tokens --check`); material key parity with `sound.materials`; the gadget runtime imports nothing from Components (in addition to `check:layers`); every catalog gadget has `meta.json`, `.agent.md`, a docs page and a Playwright slice; every Part named in `PARTS` has a drawing function and a Swift twin; `--parity` compares Swift and web captures (§5.3).

### 8.5 The agent guide (`gadgets.agent.md` → AI.md)

Sections, in order: (1) what a gadget is and is not (looked at, never operated; an Object); (2) the spec schema, both types, with defaults; (3) the Part catalog: geometry in one line, params, materials, slots, its sound; (4) the mechanism catalog: mode, slots, what it says; (5) the placement rubric (V/A/W questions and the job list from the model, with the hue stations per job); (6) the set rules and what to change when one fails; (7) the wiring rules (kinds, maps, no cycles, fan-out); (8) three worked examples (the patch bay, the counter drum, the reading rig) with the request that produced each; (9) what an agent cannot do (invent a Part, a mechanism, a colour, a sound) and what to say instead ("this needs a new Part; ask a person to draw it").

---

## 9. Starter gadgets and rigs

### 9.1 Gadgets

Feel is (V, A, W). "New" lists Parts that do not exist yet when the gadget is built in the sequence of §11.

| # | Gadget | Job / reach | Feel | Parts | Mechanism | States | Ports in → out | Used for | Sound | New |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Patch bay** | link / world | .7 .8 .4 → stone | Slab, Jack ×2, Plug ×2, Cable, LED, Beeper | seat | rest, connected, syncing, done, failed | state → healthy (bool), done (pulse) | Settings › Sync; the syncing and sync-failed moments; sync rigs | pull .2, seat .85 + thump; `done`, `failed` earcons | Slab, Jack, Plug, Cable, Beeper |
| 2 | **Fader bank** | tune / own | .6 .5 .3 → clay | Slab (3 slots), Cap ×3, LED | slide, 8 detents | rest, mix | mix (number 0..1) → none | Settings emblem; a settings section header | friction, detent ticks, a stop | Cap |
| 3 | **Keycap chord** | command / own | .8 .8 .1 → ceramic (pinned) | Slab (tray), Keycap ×2, LED | press | rest, chord | press (pulse) → none | Settings › Shortcuts; the command palette's empty state | two ceramic tinks, up-strokes higher | none |
| 4 | **Scope** | find / world | .7 .8 .1 → glass face on stone (pinned) | Bezel, Glass face, Backlight, Label (rings), LED | sweep; loops while `searching` | rest, searching, found, nothing | query (bool), found (count 0..99) → found (count) | the lens bar's search moment; no-results | glass ticks per blip (max 3); `waiting` on nothing | Bezel, Backlight |
| 5 | **Drawer** | keep / own | .6 .2 .4 → clay, station 140 | Slab (tray), Pull, LED | slide-out | closed, open, full | fill (number 0..1) → full (bool) | Settings › Storage; storage rig | runner friction, stop | Pull |
| 6 | **Lidded bin** | destroy / own | .3 .4 .9 → rubber | Slab, Lid, LED | flip | closed, armed, emptied | armed (bool), empty (pulse) → emptied (pulse) | trash; the delete-confirm moment | creak, rubber thud + thump | Lid |
| 7 | **Shutter lens** | take / world | .8 .9 .2 → resin, backlit, inset | Bezel, Lens, Backlight, LED | turn (an `act` turns +45° and back) | ready, taken | take (pulse) → taken (pulse) | capture; the capture toolbar's emblem | ring detents | Lens |
| 8 | **Counter drum** | keep, signal / own | .8 .3 .3 → clay, station 140 | Slab (window tray), Drum ×n (1..4), LED | roll | rest, counting, rolled-over, reset | count (count), reset (pulse) → rolled (pulse), count | streaks, block counts, tasks done today, captures | detent per digit, a soft rest | Drum |
| 9 | **Needle gauge** | signal / own | .6 .5 .4 → stone, inset | Bezel, Glass face, Needle, Label (scale), LED, Beeper | swing | rest, over, pegged | value (number min..max) → over (pulse), above (bool), value | storage used, sync health, reading minutes | silent needle; `waiting` when over | Needle |
| 10 | **Cell grid** | keep / own | .7 .3 .3 → resin, backlit, station 300 | Slab, Cell (4 × 4), Backlight, LED | glow | dark, filling, full, first-run | fill (number 0..1), first-run (pulse) → full (bool) | memory (the past); first run; a cache filling | silent; `ready` on first-run | Cell |
| 11 | **Rocker** | tune / own | .6 .4 .2 → clay | Slab, Cap (rocker shape), LED | flip (hinge at the centre, ±12°) | off, on | on (bool) → on (bool) | one setting's emblem (sync on/off, sound on/off) | a clay click each way | none (Cap `shape: rocker` param) |
| 12 | **Ink well** | make / own | .9 .9 .1 → ceramic | Slab (well), Nib, Swatch, LED | dip | ready, writing | writing (bool) → none | draw tools; the drawing moment | a soft tap on ceramic | Nib |
| 13 | **Thumbwheel** | keep / own | .6 .3 .5 → stone, station 300 | Slab (slot), Drum (`glyphs: ticks`, edge-on), Label ("NOW"), LED | turn, detents = days | now, past, far | offset (number −30..0 days) → in-past (bool) | the past (memory scrubber) emblem; the past banner | stone detents | none (Drum `glyphs` param) |
| 14 | **Glass badge** | identify / others | .6 .2 .9 → glass (pinned), inset | Bezel (metal), Glass face, Glyph, Backlight, LED | glow | signed-out, signed-in, expired | signed-in (bool) → none | Settings › Account; sign-in moments | silent; lamp `rise` on sign-in | none |

State moments compose from these rather than adding gadgets: *empty canvas* = a Slab with one screw hole (a `signal` gadget with no mechanism, `container: slab`, station 80); *first run* = the cell grid's `first-run` state; *no results* = the scope's `nothing`; *sync failed* = the patch bay's `failed`.

### 9.2 Rigs

| Rig | Grid | Gadgets | Cables (from → to, map) | What it tells at a glance |
|---|---|---|---|---|
| **Sync health** | 3 × 1 | patch bay `sync`, needle gauge `health` (0..100, threshold 40), counter drum `pending` (max 999) | `sync.healthy → health.value` (scale: false → 10, true → 90 via `select`+`scale`); `sync.done → pending.reset` | connected and healthy: needle high, drum at 0; failed: plug out, red lamp, needle drops, pending count stays |
| **Reading** | 2 × 1 | needle gauge `today` (0..40 min, threshold 30), counter drum `streak` (3 digits) | `today.over → streak.count` (count +1) | minutes today; hitting the goal rolls the streak |
| **Storage** | 3 × 1 | drawer `local` (fill), needle gauge `used` (0..100), lidded bin `trash` | `local.fill → used.value` (scale 0..1 → 0..100); `used.above → trash.armed` (threshold 90) | how full the drawer is; the needle in the red arms the bin: time to empty it |
| **Capture / first run** | 2 × 2 | shutter lens `take`, counter drum `today` (2 digits), cell grid `memory` (2 × 1 span) | `take.taken → today.count` (count +1); `today.count → memory.fill` (scale 0..20 → 0..1) | each capture ticks the count and lights another cell; on first run the grid rises |
| **Canvas status** | 3 × 1 | scope `find`, counter drum `blocks` (3 digits), thumbwheel `when` | `find.found → blocks.count`; `when.in-past → find.query` (select: true → false) | what the lens found, how many blocks, and whether you are looking at the past (the scope dims) |
| **Settings** | 2 × 2 | fader bank `prefs` (2 × 1 span), rocker `sound`, keycap chord `keys` | `sound.on → prefs.mix` (select: false → 0.2, true → 0.8) | the settings window's header: the rocker sets the mood of the faders |

Every rig satisfies the set rules by construction: check *Storage* (clay ≥ .78 / stone .50–.77 / rubber ≤ .49; stations 140 / 80 / 25; three containers slab / inset / slab).

---

## 10. Testing

Playwright feature slices only, through the docs pages (`e2e/gadgets-*.spec.ts`), using the repo's `open`, `COLORWAYS`, `emulateMedia`, `capture` helpers. Each docs page exposes `data-testid` hooks and an `<output data-testid="gadget-last">` mirroring `onCue`, like the sound page does.

| Slice | Page | Asserts |
|---|---|---|
| `gadgets-materials` | Foundations › Materials | the 7 × 3 swatch sheet renders in both colorways (captures); each swatch's `data-material`, `data-l-band`; strike buttons emit a `strike` event with the material's f0 (via the sound engine's `subscribe`, off → `silent (sound is off)`) |
| `gadgets-mechanisms` | Foundations › Mechanisms | for each mechanism: play → `gadget-last` lists the cues in order with their `at`; reduced motion (`emulateMedia prefers-reduced-motion: reduce`) → motion cues `skipped: 'reduced'`, lamp and sound cues present; a second play mid-act is ignored (momentary) or retargets (held, value slider on the page) |
| `gadgets-patch-bay` | Gadgets › Patch bay | the spec renders (`role="img"`, `<desc>` "Sync: connected"); state buttons flip lamp `data-kind` and the plug's form (`data-slot="plugA"` transform); `done` beeps `done` and the LED goes live; `failed` beeps `failed`, blinks, plug out; sizes 32/64/160/320 render tiers (`data-tier`); captures per colorway and state; increased contrast adds the rim |
| one slice per gadget | Gadgets › <name> | value changes move the actor (needle `r`, drum strip `y`, backlight α), threshold pulses appear in `gadget-last`, states and sounds as above |
| `gadgets-rig` | Gadgets › Rigs | a rig renders with cables (`<title>` per cable); setting `today.value` to 31 propagates: `onPropagate` hop logged, `streak` count +1 after the stagger (`toHaveAttribute` with timeout), at most 3 `sound` cues for a 4-gadget rig (`skipped: 'budget'` on the rest); a cyclic spec in the page's validator bench shows `cable.cycle` with its fix text |
| `gadgets-validate` | Gadgets › Compose | the spec editor: an unknown part → `part.unknown` message names the catalog; a set violation → `set.hue` with the free stations; a valid spec renders live and its resolved record (`data-material`, `data-body`) matches the table on the page |
| `gadgets-agent` | `/AI.md`, `/gadgets.json` | the guide lists every Part and mechanism; the manifest's ports match the catalog |

Swift: `MetalGadgetCaptures` (every catalog gadget × state × colorway, every rig) writes to `docs/captures/swift/`; `check-gadgets.mjs --parity` diffs against the web captures (§5.3). `swift build` and the existing recipe-parity check run in `npm run build`.

---

## 11. Build sequence

Each step is one commit-sized change, finished (every state, motion, sound, both platforms, docs page, e2e) before the next. Foundations first.

1. **`gadgets.materials` + `gadgets.light` + `gadgets.host` tokens; `build-gadgets.mjs` skeleton; `color.ts`; `light.ts`.** Done: `npm run generate` emits `gadgets.generated.ts` and `MetalGadgets.generated.swift`; Foundations › Materials shows the 7 × 3 sheet (W .1 / .5 / .9) in both colorways with a DialKit panel for bevel, gloss, grain, flecks, shadow; strike pads use the sound engine; `gadgets-materials` slice green; Swift `MetalGadgetLighting` renders the same sheet and the capture parity check passes.
2. **`gadgets.feel`, `gadgets.jobs`, `gadgets.accent`, `gadgets.set`; `spec.ts`, `normalize.ts`, `validate.ts`, `resolve.ts`.** Done: Foundations › Gadgets hosts the feel space (V/A/W sliders, job picker) and shows the resolved material, body, accent, register, scale and the sound of a strike; set rules and CVD run in `check-gadgets.mjs`; the validator reports every code in §2.7 from the page's bench; Swift validator and resolver ported, with a fixture test that both resolve the worked placements to the same numbers.
3. **`gadgets.lamp`; the LED Part adopts the gestures** (React CSS keyframes and Swift). Done: Parts › LED shows five gestures; the status badge keeps working; slice asserts `data-gesture` timing.
4. **Mechanism format and engine: `mechanism.mjs` helpers, build contract, `mechanisms.generated.*`, `scheduler.ts`, `player.ts`, `MetalMechanismPlayer`; one mechanism, `seat`.** Done: Foundations › Mechanisms plays `seat` on a stand-in plug shape with the cue list printed; reduced motion, re-trigger and retarget rules pass the `gadgets-mechanisms` slice; Swift plays the same list with the same cue times (logged in the capture test).
5. **Part: Slab** (React/CSS Part, Swift, docs, `parts/slab.ts` with cuts and the hole recipe). Done: all cut kinds at all tiers, both colorways, contrast mode; strike sound from its material.
6. **Parts: Jack, Plug, Cable** (one commit each, same bar). Cable includes the routing function and its avoidance test on a bench page.
7. **Part: Beeper.** Done: its `sounding` lift follows a beep on the Sound page.
8. **The runtime renderer, proven by the patch bay: `layout.ts`, `draw.tsx`, `Gadget.tsx`, `GadgetDefs.tsx`, `budget.ts`, the static entry; `MetalGadget`; catalog entry `patch-bay` with `meta.json`, `.agent.md`, Gadgets › Patch bay page, `gadgets-patch-bay` slice, Swift captures.** Done: every state in §2.8 at every tier and size, both colorways, reduced motion, contrast, sound on and off, SSR string equals the client tree; parity check green.
9. **Part: Cap; gadget: fader bank** (ports the prototype; first held mechanism `slide`).
10. **Gadget: keycap chord** (`press`; Keycap gets its material strike).
11. **Parts: Bezel, Backlight; gadget: scope** (`sweep`, inset container, glass).
12. **Part: Drum; gadget: counter drum** (`roll`; the first gadget with a value; `describe` templates and `announce`).
13. **Part: Needle; gadget: needle gauge** (`swing`; threshold pulses).
14. **Rigs: `RigSpec`, propagation, cables on the grid, `Rig.tsx`, `MetalRig`, raster-at-rest, sound budget; the reading rig.** Done: `gadgets-rig` slice; Gadgets › Rigs page with a live wiring bench.
15. **Part: Cell; gadget: cell grid** (`glow`; translucency; first run).
16. **Part: Lid; gadget: lidded bin** (`flip`; the heavy end; red in the lamp and under the lid).
17. **Part: Pull; gadget: drawer** (`slide-out`).
18. **Part: Lens; gadget: shutter lens** (`turn`).
19. **Gadgets: rocker, thumbwheel, glass badge** (no new Parts; one commit each).
20. **Part: Nib; gadget: ink well** (`dip`).
21. **Rigs: sync health, storage, capture/first run, canvas status, settings** (one commit each; each proves a map kind).
22. **Gadgets › Compose page, `gadgets.json`, AI.md section, JSON schemas; `gadgets-validate` and `gadgets-agent` slices.** Done: an assistant given only AI.md composes the reading rig in the bench without an error.
23. **The emotion validation run from the model (§6 there) after steps 12 and 21**; tune coefficients and material tables, never a single gadget.

Every step ends with targeted checks, then one `npm run build` and `swift build`; visual changes verified in both colorways and with reduced motion in the running site before the commit.

---

## 12. Risks and decisions for the owner

| # | Decision | Recommendation | Why it is yours |
|---|---|---|---|
| 1 | **SwiftUI lighting strategy**: Core Image height-field pipeline cached per part layer (recommended), a Metal `layerEffect` shader, or pre-rendered assets with live parts | Core Image; keep the shader as the documented fallback if cache warm-up shows on device | It fixes the parity bar and the cost of every gadget on iOS for years |
| 2 | **Does a spec-only gadget satisfy "every component ships React + SwiftUI + agent guide"?** The catalog gadget has a JSON spec, a `.agent.md`, `meta.json`, a docs page and generated outputs, but no hand-written `.tsx` or `.swift` | Yes: the renderer is the React and Swift implementation; the spec is the source. Parts keep the full three-file rule | It changes the repo's definition of "shipped" for one layer |
| 3 | **Accessibility stance**: a gadget is an image with a label and a live description, never focusable, never a control; a host wraps it to operate it | Keep it strict, and add `announce` for live values only | It rules out ever making a gadget clickable, which the emblem definition depends on |
| 4 | **How much may the assistant tune?** Free V/A/W numbers and any catalog part positions (this LLD), or only named feel presets and catalog layouts with params | Free numbers, closed catalogs: the set rules and the validator are the fence; presets can be added on top | It sets how much of the look an assistant can change in a shipped app |
| 5 | **Where sound comes from**: one engine per app via a `SoundProvider` context (recommended), or each gadget creating its own | One engine per app; a gadget takes `sound` from context and is silent without it | Sound settings, opt-in and rate limits must be app-wide, and this decides the app's integration surface |
| 6 | Module grid pitch 440 and the 40-unit gutter, versus a gutter from the spacing ladder at each rendered size | 440 fixed in canvas units; the rendered gutter scales with the module, as a rack's does | It is the rig's proportion at every size |
| 7 | Live values animating continuously (a needle following a stream) versus only on discrete changes | Discrete changes with retarget; no continuous streams, so a gadget never becomes a meter | It keeps gadgets emblems, not instruments |
| 8 | Raster-at-rest inside rigs by default | On for rigs of ≥ 3 gadgets, off for single gadgets | It trades a subtle swap for paint cost on rig-heavy pages |

Known risks: filter cost on Safari (mitigated by explicit regions, tiers and the page budget; measure on step 8 before adding gadgets); `feDiffuseLighting` and Core Image shading will not match to the pixel (hence a perceptual gate, not exact); the drum's cylindrical shading at 32 px may read as a slot (the flat tier draws a digit on a plate instead); habituation to the seat click on a sync that runs often (the shipped rate limit and session decay apply per gadget key; syncing itself is silent).
