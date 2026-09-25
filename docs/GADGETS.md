# Gadgets: parts, mechanisms, gadgets and rigs

A gadget is a small Soft Hardware object that stands for a feature and does one thing when it acts: a fader bank for settings, a patch bay for sync, a counter drum for a streak. Gadgets are the illustrated, sounding objects of the library, at app-icon size and up. They combine into rigs: panels of gadgets wired together with visible patch cables. This page is the catalog and the grammar. It is a proposal for the owner to reshape; nothing below is built yet except where marked.

Background: the model (Job × Feel, seven materials, sound) is in `docs/proposals/tiles/model.md`. The prototypes it grew from are in `docs/prototypes/tiles/`. The sound foundation is built (Foundations → Sound, `cea732a`).

## 1. Four levels

| Level | What it is | Invented | Example |
|---|---|---|---|
| **Part** | A piece cut from one material, with a look and no job | By hand, once | Jack, Cap, Cell, Lid, Needle, Drum |
| **Mechanism** | How a gadget moves when it acts: motion, sound cues and states as one timeline | By hand, once | *slide*, *seat*, *roll* |
| **Gadget** | Parts arranged on a body, one mechanism, a set of states | A starter set by hand; then composed | Fader bank = Slab + 3 Caps + *slide* |
| **Rig** | A panel holding several gadgets, wired so one gadget's state drives another's | Composed | A reading rig: counter drum + needle gauge, wired |

Each gadget we invent by hand adds the Parts and the mechanism it was missing. After that, any gadget built from those pieces needs no new drawing, by a person or by an agent.

### Where they sit in the six layers (`COMPOSITION.md`)

- **Parts** are Parts. New ones (Slab, Bezel, Backlight, Jack, Plug, Cable, Cap, Cell, Lid, Pull, Drum, Needle, Lens, Nib, Beeper) are defined before any gadget uses them.
- **Mechanisms** are Foundations: data only, like springs and icon acts. A mechanism names its spring, its travel and stops, its cue list (the sound events and lamp gestures at fixed points in the motion) and its states. CSS keyframes, SwiftUI animation and the sound engine read the same timeline, so motion and sound cannot drift apart. This is the icon-act format (`ICON-MOTION.md`) with sound cues added.
- **Gadgets** are Objects, sub-kind `emblem`: a body, you could hold it, it stays. They stand for a feature of the machine rather than a document; you look at them, never operate them. They use Foundations and Parts, never Components, so a gadget can never be mistaken for a control.
- **Rigs** are Objects made of Objects: one panel, several gadgets, the cables between them.

## 2. Parts

| Part | What it is | Materials | First used by |
|---|---|---|---|
| Slab | A thick panel with rolled edges and cuts (slots, holes, trays) | clay, stone, ceramic, rubber, metal | every slab gadget |
| Bezel | A frame holding a face of another material | stone, metal, clay | scope, gauge |
| Glass face *(exists)* | A dark or tinted face behind glass | glass | scope, gauge |
| Backlight | A lamp behind a translucent part; its glow is the lamp seen through the tint | lamp | cell grid, scope |
| LED *(exists)* | The status lamp every gadget carries, top right | lamp | all |
| Key | A big key: a face on its skirt, engraved with a glyph (the Keycap as a gadget draws it) | clay, ceramic | keycap chord |
| Cap | A fader or knob cap with grip ribs | clay, ceramic, accent | fader bank, rocker |
| Jack | A knurled nut around a hole | metal | patch bay, rigs |
| Plug | A knurled plug that seats in a jack | clay + accent | patch bay, rigs |
| Cable | A tube lying on a surface, sagging under gravity | rubber | patch bay, rigs |
| Cell | A raised translucent block, gridded | resin | cell grid |
| Drum | A numbered wheel behind a window | clay, ceramic | counter drum |
| Needle | A pointer on a pivot over a printed scale | metal | needle gauge |
| Lid | A hinged flap | rubber, clay | lidded bin |
| Pull | A drawer handle | metal, clay | drawer |
| Lens | A domed glass with a turning ring | glass + accent | shutter lens |
| Nib | A pen tip | metal | ink well |
| Beeper | A grille over a piezo; the only source of tones | metal, clay | gadgets that report a state |

## 3. Mechanisms

| Mechanism | Motion | Sound cues (material strikes, from Foundations → Sound) | Held or momentary |
|---|---|---|---|
| **press** | A face drops into its skirt and springs back | down on the part's material; up quieter and higher | momentary |
| **slide** | Caps travel along slots to new stops, staggered | friction under the travel; a tick per detent; a stop | held |
| **seat** | A plug lifts, its shadow opens, it seats again | a soft pull; a firm seat, with a thump if heavy | momentary |
| **turn** | A ring or knob rotates through detents | a tick per detent | held |
| **flip** | A lid or rocker swings on a hinge spring | a creak; a thud on close | held |
| **sweep** | A beam crosses a glass face | a glass tick where it crosses something | momentary |
| **roll** | A drum turns one step, the digit rolling through the window | a detent per step | momentary |
| **swing** | A needle moves to a value and settles, overshooting a little | none (a needle is silent); the beeper on a threshold | held |
| **glow** | A backlight rises or falls behind cells | none (light is silent); the beeper on first run | held |
| **slide out** | A drawer comes out on runners and back | runner friction; a stop | momentary |
| **dip** | A nib dips and lifts | a soft tap on the well | momentary |

## 4. The starter gadgets

One gadget per job, so the set covers the vocabulary. ✓ marks a prototype that exists.

| Gadget | Job | Parts | Mechanism | States | For |
|---|---|---|---|---|---|
| Fader bank ✓ | tune | Slab, Cap ×3, LED | slide | rest, new mix | settings |
| Keycap chord ✓ | command | Slab (tray), Keycap ×2, LED | press | rest, chord | shortcuts |
| Patch bay ✓ | link | Slab, Jack ×2, Plug ×2, Cable, LED, Beeper | seat | connected, syncing, done, failed | sync |
| Scope | find | Bezel, Glass face, Backlight, LED | sweep | searching, found, nothing found | search |
| Drawer | keep | Slab, Pull, LED | slide out | closed, open, full | storage |
| Lidded bin | destroy | Slab, Lid, LED | flip | closed, armed (lid up, red under it), emptied | trash |
| Shutter lens | take | Bezel, Lens, LED | turn | ready, taken | capture |
| Counter drum | keep, signal | Slab, Drum ×n, LED | roll | counting, rolled over, reset | counts, streaks, progress |
| Needle gauge | signal | Bezel, Glass face, Needle, LED, Beeper | swing | a value, over a threshold | storage used, health, progress |
| Cell grid | keep, make | Slab, Cell grid, Backlight | glow | dark, filling, full | memory, first run |
| Rocker | tune | Slab, Cap, LED | flip | on, off | a single setting |
| Ink well | make | Slab, Nib, LED | dip | ready, writing | draw |

The counter drum, needle gauge and cell grid show values, not just identity. They are what make live gadgets possible: a streak that rolls over, storage creeping toward full, a memory filling up.

## 5. Composing rigs

A rig is a panel of gadgets, wired. It follows the grammar of a modular synth rack: modules on a rack, patched.

- **The panel.** A rig is one Slab on a module grid. A gadget takes 1×1, 2×1 or 1×2 modules. The gutter is one nest from the spacing ladder, and gadgets keep their own bodies (materials, colours) inside the rig's panel.
- **Wiring.** A cable between two gadgets' jacks means one drives the other: its state or value flows along the cable. The patch bay's *failed* state can drop a gauge's needle; a counter drum can feed a cell grid. Wiring is data in the rig's spec and is always drawn, so what is connected to what is visible.
- **One act at a time, in order.** When a rig acts, the source gadget acts first and the act travels along the cables: each downstream gadget starts one step later (the stagger comes from the motion foundation). At most three gadgets sound at once; the rest move in silence.
- **Lamps.** Each gadget keeps its own lamp. The rig adds none, so a rig reads as a row of indicators, like a front panel.
- **Colour and sound across the rig.** The set rules apply inside a rig: no two gadgets share both material and lightness band, and hues sit at least 30° apart. The rig's panel takes the rig's own job and feel. Sound shares one loudness budget: the rig is no louder than its loudest gadget.
- **Composed from specs.** A rig's spec lists its gadgets (each a gadget spec or a name from the catalog), their places on the grid and the cables between them. The same runtime renderer draws a gadget alone or in a rig.

### Example: a reading rig

```js
reading: {
  job: 'keep', feel: { v: 0.8, a: 0.3, w: 0.3 },
  grid: [2, 1],
  gadgets: {
    streak: { gadget: 'counter-drum', at: [0, 0], digits: 3 },
    today:  { gadget: 'needle-gauge', at: [1, 0], scale: [0, 40] },
  },
  cables: [['today', 'streak']],   // reaching today's goal rolls the streak
}
```

## 6. Specs, and composing by agent

Every gadget and rig is a spec, and one runtime renderer draws specs in both React (`<Gadget spec />`) and SwiftUI (`MetalGadget(spec:)`). Build-time generation runs that same renderer over the shipped catalog for static assets. Because the spec is small and closed (a job from a fixed list, a feel of three numbers, parts from the catalog, a mechanism from the catalog, states, and cables), an assistant can write one from a request. The generator supplies the craft (lighting, material, sound), and the checks refuse anything off-system: a layer violation, a part that does not exist, a set that repeats itself. The spec schema, the Parts and mechanism catalogs and the placement rubric ship in the agent guide (`AI.md`, `llms.txt`) like every component.

What an agent cannot do is invent a Part or a mechanism. A request that needs one becomes a design task for a person: the new piece is drawn and tuned once, and then everyone can compose with it.

## 7. Build order

Foundations first, then one thing at a time, each finished (every state, motion, sound, both platforms, docs, e2e) before the next.

1. ~~Sound foundation~~ (built).
2. Gadget materials, visual side: ceramic, resin, stone, rubber and backlight join Foundations → Materials.
3. The model and the spec schema (Job × Feel, set rules), validated at runtime; the 3D space as the Foundations → Gadgets page, where a gadget is placed and previewed live with its sound.
4. Mechanisms as data: *seat* first.
5. Parts: Slab, Jack, Plug, Cable.
6. The runtime renderer, proven by the first gadget: the patch bay, from its spec, with every state.
7. Then one gadget at a time, inventing each with a prototype first: fader bank and keycap chord (ported), then scope, counter drum, needle gauge, cell grid, drawer, lidded bin, shutter lens, rocker, ink well.
8. Rigs, once a gadget with a value (the counter drum) and one with a jack exist.
