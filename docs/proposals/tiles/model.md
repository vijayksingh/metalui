# Hardware tiles: the foundational model

A tile is one physically plausible object standing for one feature. This proposal replaces the single-body colour cube with a two-layer model, **Job × Feel**, stored as data in `tokens.json`, that decides the object's form, material, colour, lamp, motion and sound, and that reaches dark, glassy, backlit and metallic bodies as readily as bone clay. Every choice below is one a real object could make: pigment in a material, light from a lamp, tint through glass, a part striking a stop.

## 0. Why the current cube stalls

The prototype's three axes mix two kinds of fact. *Inside/Outside* is semantic (whose stuff), *Keeping/Doing* is arousal, *Light/Heavy* is consequence. Angle-to-hue ties hue to semantics, and everything else nudges one pale clay body (L 0.78–0.87, C ≤ 0.12). The references differ in **material and construction**, not tint: a stone bezel around a lit glass face; a speckled panel with white and orange knobs; a translucent resin grid lit from behind. So material and form must be chosen first and colour second. Research backs the split: hue carries *association* (Palmer & Schloss 2010, ecological valence theory: we like the colours of things we like), while **lightness and chroma carry emotion** (Valdez & Mehrabian 1994: brightness predicts pleasure, saturation predicts arousal, darkness plus saturation predicts dominance; hue effects were small and inconsistent). Emotion rides on L, C, material, mass and motion; hue is assigned by meaning.

## 1. Where tiles live in the six layers

Run the tests from `docs/COMPOSITION.md`:

- Not a **Component**: you never operate a tile to change something else; the faders in it are not a slider.
- Not an **Instrument**: it stays when you stop.
- Not a **Place**: it has no area that holds things.
- It **has a body, you could hold it, it stays**: the Object tests pass. What it stands for is a piece of the machine the person owns (their sync, their settings), not a document. That is the only gap with the current Object wording, "stands for a person's stuff".

**Decision: tiles are Objects, sub-kind `emblem`.** No new layer; a new layer needs a new test and tiles pass the existing one. I propose one line added to COMPOSITION.md: "An emblem is an Object that stands for a feature of the machine rather than a document; it is looked at, never operated." `meta.json` gets `layer: "object", role: "emblem"`.

What a tile **may use**: Foundations and Parts only. It may not import Components (so a tile can never be mistaken for a control, and the layer check enforces it) and does not import other Objects (a tile is one thing, not a scene). Every tile is `kind: "composed"` unless an archetype needs a drawing no Part expresses, in which case the look becomes a Part first (§4.1); `custom` is reserved for a genuinely one-off act, with a reason.

The **model itself is a Foundation**: `tokens.json` gains `materials` (with acoustic recipes beside the visual ones), `feel`, `jobs`, `lamp` gestures and `beeper` earcons. Tiles are its first reader, and existing Parts read it too: the LED Part takes its gestures from `lamp`, and the Keycap, Dial and Switch Parts take their press and detent sounds from the material they are cut from. One table, both platforms.

## 2. The core model: Job × Feel

| Layer | Kind | Decides | Authored |
|---|---|---|---|
| **Job** (what the tile *means*) | one of a closed verb set | archetype (the object), hue station, reach (self / others / world), default lamp | per tile |
| **Feel** (what it should *make you feel*) | V, A, W in [0, 1] | material, lightness, chroma, finish, part mass, motion tempo, impact pitch, earcon mode | per tile; overridden per state |

They never collide because they write different outputs. Job never sets L, C or tempo; Feel never sets hue or the object. A **state** (syncing, sync failed, first run, empty, no results) is the same tile with a Feel override, a form change and a lamp signal, never a new object.

### 2.1 Axes

PAD (Mehrabian & Russell 1974) is kept because it is the only three-factor model with a colour mapping measured in its own terms (Valdez & Mehrabian) and a music mapping (Juslin & Laukka 2003; Hevner 1936). Russell's circumplex is PAD without dominance, and dominance is the axis the owner already sensed as Weight.

| Axis | 0 | 1 | PAD | Meaning for a tile |
|---|---|---|---|---|
| **V** valence | tense | pleased | pleasure | Is this a good place to be, or one to be careful in? |
| **A** arousal | still | active | arousal | Is the object doing something, or is it a thing you keep? (old Keeping/Doing) |
| **W** weight | light | heavy | *inverse* dominance | How much the act commits you. Less control felt → heavier, darker, lower object (old Light/Heavy) |

*Inside/Outside* becomes the Job's **reach** and drives only the sound's space (dry and close for self, roomy for the world), an ecological distance cue, not an emotion.

### 2.2 Placement rubric

- **V**: "After the act, is the person better off, the same, or exposed?" Better off 0.8–1.0; plain utility 0.5–0.7; risk, loss, failure 0.0–0.3.
- **A**: "Does the object move while it means something?" Vault or drawer 0.1–0.3; a dial you set 0.4–0.6; a live process 0.7–1.0.
- **W**: "Undo in one step, and does it touch anyone else?" One-step undo, self only 0.0–0.2; settings you would have to remember 0.3–0.5; identity, money, other people, irreversible 0.7–1.0.
- **Job**: `tune`, `command`, `link`, `keep`, `identify`, `destroy`, `take`, `find`, `make`, `signal` (a state moment with no feature of its own).

### 2.3 Worked placements

| Tile | Job / reach | V | A | W | Archetype | Material (§3.2) | Body OKLCH (resolved) |
|---|---|---|---|---|---|---|---|
| Settings | tune / self | 0.6 | 0.5 | 0.3 | fader bank | clay | 0.78 / 0.03 / 80 |
| Shortcuts | command / self | 0.8 | 0.8 | 0.1 | two keycaps in a tray | ceramic | 0.86 / 0.07 / 95 |
| Sync | link / world | 0.7 | 0.8 | 0.4 | two jacks, patch cable | stone | 0.62 / 0.04 / 195 |
| Storage | keep / self | 0.6 | 0.2 | 0.4 | drawer with a pull | clay | 0.72 / 0.05 / 140 |
| Account | identify / others | 0.6 | 0.2 | 0.9 | smoked-glass card in a bezel | glass | 0.30 / 0.04 / 260 |
| Trash | destroy / self | 0.3 | 0.4 | 0.9 | bin with a lid | rubber | 0.28 / 0.02 / 25 |
| Capture | take / world | 0.8 | 0.9 | 0.2 | lens with a shutter ring | resin, backlit | 0.80 / 0.16 / 55 |
| Search | find / world | 0.7 | 0.8 | 0.1 | radar face in a stone bezel | glass face on stone | face 0.82 / 0.06 / 220 |
| Share | link / others | 0.8 | 0.7 | 0.6 | one jack with a lit hole | metal | 0.58 / 0.06 / 230 |
| Memory | keep / self | 0.7 | 0.3 | 0.3 | resin cell grid | resin, backlit | 0.84 / 0.12 / 300 |
| Draw | make / self | 0.9 | 0.9 | 0.1 | nib and a swatch chip | ceramic | 0.88 / 0.10 / 330 |
| *syncing* | state of Sync | 0.6 | 1.0 | 0.4 | plug half seated | same | lamp amber `breathe`; C → 0.06 |
| *sync failed* | state of Sync | 0.1 | 0.5 | 0.7 | plug out on the panel | same, L −0.06 | lamp red `blink2`; C → 0.02; hue −10° |
| *first run* | signal / self | 0.9 | 0.6 | 0.0 | the app tile, backlight coming on | resin, backlit | 0.86 / 0.14 / 55 over 1.2 s |
| *empty canvas* | signal / self | 0.7 | 0.2 | 0.0 | clean panel, one screw hole | clay | 0.84 / 0.02 / 80 |
| *no results* | state of Search | 0.4 | 0.3 | 0.1 | sweep stops, face unlit | glass on stone | face C → 0.02 |

Trash proves the split: its hue station (25) is a whisper (C 0.02) of pigment in near-black rubber; **red belongs to the lamp and to the lid's underside when armed**, honouring the signal rule that red is destructive only. Danger reads from weight, darkness, the lamp and the lid, never from a red body.

## 3. Foundations data

### 3.1 Materials: a closed set of seven, each a visual and an acoustic recipe

Visual columns drive the existing recipe shape (fill + ordered shadow stack) plus the lighting parameters both renderers share (bevel = height-field blur, gloss = specular exponent and strength, grain = roughness turbulence, translucency = light transmitted from a backlight Part). Acoustic columns are the **modes a part of that material rings at when struck**, which is what physics gives us for free: modal synthesis of an impact, not a synthesiser voice. Bar ratios 1 : 2.76 : 5.40 : 8.93 are the free-free bar modes (Fletcher & Rossing, *The Physics of Musical Instruments*); the others are extrapolated and tunable in the docs DialKit panel.

| Material | L range | C cap | Gloss (exp, str) | Grain (freq, amp) | Flecks | Translucency | Bevel σ | Modes (ratio : gain : T60 ms) | Attack | Contact noise |
|---|---|---|---|---|---|---|---|---|---|---|
| **clay** soft-touch plastic | 0.55–0.88 | 0.10 | 0, 0 | 1.1, 0.025 | 0.5 | 0 | 6 | 1:1:180 · 1.58:0.4:90 · 2.2:0.2:60 | 3 ms | band 2.8 kHz Q2, 30 ms |
| **ceramic** glazed | 0.80–0.92 | 0.12 | 40, 0.35 | 0.6, 0.008 | 0 | 0.05 | 5 | 1:1:320 · 2.4:0.5:200 · 4.6:0.2:120 | 1.5 ms | band 4.5 kHz Q3, 20 ms |
| **resin** translucent polymer | 0.70–0.90 | 0.20 | 24, 0.25 | 0.9, 0.012 | 0.3 | 0.6 | 7 | 1:1:420 · 2.0:0.5:300 · 3.0:0.25:220 | 4 ms | low-pass 3 kHz, 25 ms |
| **stone** speckled mineral | 0.45–0.75 | 0.05 | 6, 0.08 | 1.6, 0.04 | 1.2 | 0 | 8 | 1:1:220 · 2.76:0.35:120 · 5.4:0.1:60 | 2 ms | band 1.6 kHz Q1.5, 40 ms |
| **glass** smoked | body 0.22–0.45; face 0.75–0.88 | 0.06; face 0.10 | 80, 0.6 | 0, 0 | 0 | 0.8 | 3 | 1:1:900 · 2.32:0.6:700 · 4.25:0.3:500 · 6.63:0.12:350 | 1 ms | band 7 kHz Q4, 12 ms |
| **metal** anodised, brushed | 0.40–0.80 | 0.08 | 60, 0.5, anisotropic | 2.4, 0.02 directional | 0 | 0 | 4 | 1:1:800 · 2.76:0.7:650 · 5.40:0.4:500 · 8.93:0.2:350 · 1.003:0.4:800 | 1 ms | band 5 kHz Q3, 15 ms |
| **rubber** dense matte | 0.22–0.40 | 0.03 | 0, 0 | 1.3, 0.03 | 0 | 0 | 9 | 1:1:70 | 6 ms | low-pass 600 Hz, 60 ms |

Gloss and translucency are read by people from highlight sharpness and edge light (Fleming, Dror & Adelson 2003; Fleming & Bülthoff 2005). Weight has no visual cue of its own (Klatzky & Lederman: it is haptic), so it is *implied* by darkness, thicker bevels, denser cast shadows and lower impact pitch, all of which real heavier objects have.

### 3.2 Material from Feel, Job may pin

```
material(V, A, W, job):
  if job.pin: return job.pin                    // find → glass face on stone; identify → glass
  if W >= 0.8: return V <= 0.4 ? rubber : glass
  if W >= 0.5: return A >= 0.6 ? metal : stone
  if A >= 0.6: return resin (backlit)
  if V >= 0.7 and W <= 0.3: return ceramic
  return clay
```

Regions overlap on purpose; a set author may step one neighbour over (clay ↔ ceramic, stone ↔ metal) to satisfy the set rules (§4.3), recorded in `meta.json`.

### 3.3 Lightness, chroma, hue (OKLCH)

```
L = clamp(0.88 − 0.56·W + 0.05·(V − 0.5), material.Lmin, material.Lmax)
C = clamp(0.015 + 0.20·A·(0.6 + 0.4·V), 0, material.Ccap)
H = station + 12·(V − 0.5) − 8·W
```

The body is one pigment colour (L, C, H). The gradient you see is **the one light from the upper left** shading it (top +0.03 L, bottom −0.035 L, with a 12° warm-to-cool hue drift that the diffuse lighting produces on a coloured surface); there is no gradient that the lighting does not explain. Chroma depends on A and, secondarily, V (Valdez & Mehrabian; Palmer et al. 2013, PNAS: faster, happier music maps to lighter, more saturated colours). The vivid reach comes from three physical sources: pigmented resin and ceramic up to C 0.20; **backlit** resin and glass faces (colour is the lamp's, seen through tint); and the accent part.

### 3.4 Hue stations (pigment of the body or tint of the face)

Twelve stations 30° apart, each owned by a Job or reserved for a signal, so twelve tiles are hue-distinct by construction.

| h | Owner | Ecological reason |
|---|---|---|
| 25 | destroy | ember; body C ≤ 0.02 only, red lives in the lamp |
| 55 | take, first-run signal | sunlight, a lamp coming on |
| 80 | tune, empty | warm neutral, workbench |
| 95 | command | keycap ivory |
| 140 | keep (Storage) | moss, shelf |
| 165 | reserved: `led-green` states | |
| 195 | link (Sync) | sea water |
| 220 | find | sky, the radar face |
| 230 | link (Share) | clear water; sky-blue is the most-liked hue across cultures in Palmer & Schloss |
| 260 | identify | indigo glass, night |
| 300 | keep (Memory) | dusk |
| 330 | make | pigment, rose |

Dark olive-yellow (h ≈ 100 at L < 0.6), the least-liked region in the ecological valence data, cannot occur: `command` is pinned to ceramic with L ≥ 0.80.

### 3.5 Accent, lamp, signals

- **One accent part per tile**, always the part you would touch, in pigmented plastic: house orange OKLCH 0.72 / 0.19 / 45. If the body hue is within ±40° of 45, the accent flips to 0.75 / 0.13 / 235 (Capture gets a sky-blue shutter ring). Accent chroma never drops below 0.13, so even rubber tiles carry one vivid point.
- **Lamps are the only signal colour.** The LED Part keeps its existing signals: `led-off` idle (a dark lens, 0.78 opacity), `led-green` on/synced, `led-amber` waiting/degraded, `led-red` failed, `led-blue` link or capture kind, tiny only. The act's lamp burst is the tile's *accent* colour: a lamp lit through a tinted lens. Meaning never rides on the lamp alone: each lamp state pairs with a form change (plug out, sweep stopped, lid raised).
- **Backlights** are lamps too: a resin cell or glass face glows only because a `backlight` Part sits behind it, and its glow colour is the lamp's colour seen through the material's tint (a warm lamp behind peach resin gives image 7's yellow core fading to orange).
- **Lamp gestures**, tokens read by every LED in the library: `flicker` (0.8 s, existing keyframes), `breathe` (2.4 s sine 0.55–1.0), `blink2` (two 90 ms flashes 140 ms apart, once), `rise` (1.2 s ease-out), `steady`.

## 4. Parts, form and set rules

### 4.1 Parts a tile may use

Existing Parts: Surface, Well, Glass face, Label (engraved), Glyph, Rule, LED, Keycap, Swatch, Chip. New Parts, each defined before any tile uses it, each cut from one material with the cut rule (shadowed top wall, lit lower lip):

| New Part | What it is | Material(s) | Used by |
|---|---|---|---|
| **Slab** | a thick panel with rolled edges and cuts | clay, stone, ceramic, rubber, metal | every slab-mode tile |
| **Bezel** | a frame holding a face of another material | stone, metal, clay | inset-mode tiles |
| **Backlight** | a lamp behind a translucent Part; colour from `led-*` or accent | (lamp) | resin, glass face |
| **Cell** | a raised translucent block, gridded | resin | Memory, first run |
| **Cap** | a fader or knob cap with grip ribs | clay, ceramic, pigment accent | Settings |
| **Jack** | a knurled nut around a hole | metal | Sync, Share |
| **Plug** | a knurled plug that seats in a Jack | clay + accent | Sync |
| **Cable** | a tube lying on a surface, sagging under gravity | rubber | Sync |
| **Lid** | a hinged flap with a `hinge` spring | rubber, clay | Trash |
| **Pull** | a drawer handle on a Well | metal, clay | Storage |
| **Lens** | a domed glass with a shutter ring | glass + accent | Capture |
| **Nib** | a pen tip | metal | Draw |
| **Beeper** | a tiny grille over a piezo; the only source of tonal sound | metal, clay | tiles that signal a state |

Search's radar face is *composed*: Glass face + engraved Label rings + Backlight; Account's card is Glass face + Glyph + Bezel. No `custom` tile is needed in the first twelve.

### 4.2 Form: the container

**The rounded square is a format, not the body.** Three container modes, chosen per tile:

1. **slab**: the square is the Slab (Settings, Shortcuts, Storage, Trash).
2. **inset**: a Bezel of one material holds a face of another (Search, Memory, Account, Capture). This is the mode all three references use and gives the strongest material contrast.
3. **free**: the object stands on nothing (one Jack, a Nib). Allowed at ≥ 96 px; below that the generator falls back to slab with the same colours. Used for state moments and the 404.

Silhouettes vary in count (1 / 2 / 3 / grid), axis (vertical faders, horizontal keys, radial face) and cut (slot, hole, tray, well). The LED sits top-right on slab and inset so a row of tiles keeps its rhythm, as a row of LEDs does elsewhere in the library.

### 4.3 Set rules (non-repetition, enforced by `npm run check`)

1. Hue stations ≥ 30° apart between any two tiles in a set (automatic from §3.4).
2. No two tiles share both material and L band (bands: ≥ 0.78, 0.50–0.77, ≤ 0.49); any four tiles span at least two bands.
3. No two tiles share an archetype; within a Job, count or axis differs (review rule, in `meta.json`).
4. Body ΔE_OK ≥ 0.08 between any pair (OKLab Euclidean; the worked set's minimum is 0.11, Settings vs Storage).
5. Container modes rotate: more than three `slab` tiles in a row is refused.

### 4.4 Gamut and colour vision

OKLCH is resolved at build time to sRGB and Display P3 (web: `color(display-p3)` with an sRGB fallback; Swift: P3 where available), reducing chroma at constant L and H; the caps in §3.1 need at most 0.02 of reduction in sRGB. The check runs Machado/Brettel deuteranopia and protanopia simulations and requires ΔE_OK ≥ 0.06 for every pair in a set; because identity rides on material, L band and archetype, the set survives losing the red–green axis. Increased contrast adds a 1 px `contrast-edge` rim on glass faces and drops translucency to 0.2; reduced transparency turns backlit glow into a flat lighter fill.

## 5. Sound: physics first, then one beeper

### 5.1 Two sources, both Foundations

1. **Impacts.** Every sound in an act is a Part striking, sliding or seating, rendered by modal synthesis from the material's mode table (§3.1): a bank of decaying sinusoids plus a contact-noise burst, the same sum in Web Audio (`OscillatorNode` + `GainNode` per mode) and in `AVAudioSourceNode`. The **fundamental comes from the part's size**: f0 = 2400 Hz × (16 px / part's longest dimension in the 400-unit tile) ^ 0.5, then × (1 − 0.35·W) because heavier tiles have thicker parts. Bigger and heavier rings lower, which is both physics and the best-replicated cross-modal correspondence (Spence 2011; Marks 1987; Walker et al.). A keycap tinks, a rubber lid thuds, a plug seats with a click, a glass face ticks when the sweep hits a blip. An LED makes no sound. Because the recipes sit on the material, the Keycap, Dial and Switch Parts get the same sounds without tile code.

2. **The Beeper Part.** Tonal earcons exist only where a real device has a piezo, so only tiles that *signal a state* carry a Beeper, and only state transitions play it (synced, failed, first run, done). Its timbre is a piezo's: a sine with a 3.2 kHz resonance (Q 6) and a 2 % square admixture, attack 2 ms, note length 90 ms, no material dependence. What Feel and Job set is the **melody**: root degree from the Job's station (station n → pentatonic degree n mod 5, octave floor(n / 5)), register from W (base MIDI 84 for W ≤ 0.33, 72 for ≤ 0.66, else 60; a piezo cannot go lower and stay believable), **major pentatonic for V ≥ 0.5, minor pentatonic below**, and the second note up for A ≥ 0.5, down otherwise. Major/minor and contour direction are the strongest cues in Juslin & Laukka; Hevner puts "bright, happy" on major rising lines and "dignified, heavy" on slow, low, minor. Pentatonic keeps any two beeps in a grid consonant.

### 5.2 Gestures per act (cues shared with the animation)

The act's cue list is the same data the CSS keyframes and the Swift animation read, so foley cannot drift from motion.

| Act | Cues | Impacts | Beeper |
|---|---|---|---|
| press (keys) | `down` t, `up` t + 0.28 s per key | down at 1.0; up at 0.35, f0 × 1.3 (the cap hits the upper stop) | none |
| slide (faders) | `start`, detent every 40 ms of travel, `stop` | friction: material noise −18 dB while moving; detent tick at 0.25; stop hit at 0.8 | none |
| lift-seat (plug) | `lift`, `seat` + 0.56 s | lift: soft pull 0.2; seat: hit 0.85 + thump (sine 150 → 60 Hz, 90 ms, gain 0.8·W) | on `synced`/`failed` states only |
| sweep (radar) | blip crossings | 12 ms glass tick per blip | none; `no results` plays the fall |
| glow (cells) | backlight peak | none (light is silent) | first run: three-note rising arpeggio, 60 ms apart |
| lid (bin) | `open`, `close` | rubber thud on close; hinge creak = 40 ms low-passed noise | none; armed state is silent |

### 5.3 Space, budgets, durations

- **Reach**: self → send 0.05, width 0.1, pan 0; others → send 0.22, width 0.5, pan by grid position ±0.3; world → send 0.40, width 0.8, pre-delay 18 ms. Reverb is a 1.6 s exponentially decaying noise impulse, generated identically on both platforms.
- **Envelopes**: attack per material; release is the mode's T60; hard stop at the maximum with a 30 ms fade.
- **Maximum durations**: act 600 ms; state beep 250 ms; first run 1200 ms; syncing: silent (the lamp breathes).
- **Loudness**: peaks −24 dBFS for acts, −28 for beeps, −22 for failure, under a soft limiter at −20, always below the system alert level. Master gain by rendered size: 32 px 0.55, 64 px 0.75, ≥ 160 px 1.0 (size ↔ loudness).
- **Failure vs success**: success = two beeps up (root → fifth, major pentatonic). Failure = one low beep and, 60 ms later, a minor-second dyad damped to 120 ms (roughness is the reliable negative cue) with the lamp `blink2`. Warning = one mid beep repeated once after 300 ms (rhythm as an earcon parameter, Brewster 1994).

### 5.4 Staying pleasant on the 500th play

From Gaver 1986 (auditory icons), Brewster's earcon grammar and habituation practice in product sound:

1. Sound is **off by default**, opted in once per device through a real control with an LED.
2. Only user-initiated acts and state transitions make sound; never hover, never ambient loops.
3. Per tile: at most one play per 1.5 s and three per 10 s; the fourth is silent.
4. **Micro-variation** every play: f0 ±3 %, T60 ±10 %, contact filter ±6 %, seeded by play count, as no two real strikes are identical.
5. **Session decay**: −2 dB after 20 plays of one tile, −2 dB more after 60; reset next session.
6. Nothing above 8 kHz carries meaning; every sound has a visual twin.
7. A stuck failed state is silent after its first blink.

## 6. Emotion validation

**Protocol** (one afternoon, N = 24, colour vision screened, half see-only and half see-and-hear):

1. **SAM** (Bradley & Lang 1994, 9-point pleasure / arousal / dominance) per tile at 64 and 160 px, shown 3 s with one act. Target = 1 + 8V, 1 + 8A, 9 − 8W. Pass: median within ±1 on all three for ≥ 10 of 12 tiles; none off by more than 3.
2. **Job identification**, forced choice among the ten Jobs, tile only at 64 px. Pass: ≥ 70 % per tile, no confusion pair above 20 %.
3. **Material naming**, free text coded to the seven. Pass: ≥ 60 % per tile; glass, metal and rubber ≥ 75 % (they carry the dark end).
4. **State discrimination**: synced / waiting / failed in random order. Pass: ≥ 90 % with sound, ≥ 80 % visual only, ≥ 80 % under a deuteranopia filter.
5. **Annoyance**: 30 forced plays of Shortcuts in two minutes, then "would you leave sound on" on 7 points. Pass: median ≥ 5.

**Known failure modes**: dark bodies read as disabled (keep the idle lamp brighter on dark bodies and the gloss highlight always present); backlit glow on warm stations reads as a warning (first run and Capture stay at V ≥ 0.8 with `rise`, never `flicker`); minor pentatonic reads "sad" instead of "careful" on heavy tiles (test Trash at V 0.3 against 0.45); a piezo two-note earcon can read as a notification from another app (keep it under 250 ms and always with the lamp); cultural hue variance is contained because meaning never rides on hue, but re-run test 2 with a non-Western cohort before the site ships; keycap glyphs are content (⌘ K means nothing on Windows), not part of the Job.

## 7. Scalability: the token schema and platform consumption

One new key, `tiles`, in `tokens/tokens.json`; per tile about eight authored lines.

```json
"tiles": {
  "$use": "Emblem objects. A tile is Job × Feel; states are Feel overrides. Materials carry visual and acoustic recipes.",
  "materials": {
    "glass": {
      "L": [0.22, 0.45], "face-L": [0.75, 0.88], "C-cap": 0.06, "face-C-cap": 0.10,
      "gloss": { "exponent": 80, "strength": 0.6 }, "grain": { "frequency": 0, "amplitude": 0 },
      "flecks": 0, "translucency": 0.8, "bevel": 3, "radius-scale": 0.95,
      "shadow": { "spread": 16, "offset": [6, 18], "alpha": 0.24 },
      "modes": [[1, 1, 900], [2.32, 0.6, 700], [4.25, 0.3, 500], [6.63, 0.12, 350]],
      "attack-ms": 1, "contact": { "type": "band", "hz": 7000, "q": 4, "t60-ms": 12 }
    }
  },
  "feel": {
    "L": { "base": 0.88, "W": -0.56, "V": 0.05 }, "C": { "base": 0.015, "A": 0.20, "V-mix": [0.6, 0.4] }, "H": { "V": 12, "W": -8 },
    "material-rules": [["W>=0.8&V<=0.4", "rubber"], ["W>=0.8", "glass"], ["W>=0.5&A>=0.6", "metal"], ["W>=0.5", "stone"], ["A>=0.6", "resin"], ["V>=0.7&W<=0.3", "ceramic"], ["*", "clay"]],
    "f0": { "hz": 2400, "ref-px": 16, "exponent": 0.5, "W": -0.35 }
  },
  "jobs": { "link": { "stations": [195, 230], "archetypes": ["jacks", "jack-lit"], "reach": "world" }, "destroy": { "stations": [25], "body-C-max": 0.02, "archetypes": ["bin"] } },
  "accent": { "warm": [0.72, 0.19, 45], "cool": [0.75, 0.13, 235], "flip-within-deg": 40 },
  "lamp": { "flicker": [[0, 0.78], [0.10, 1], [0.22, 0.5], [0.34, 1], [0.46, 0.62], [0.60, 1]], "breathe": {}, "blink2": {}, "rise": {}, "steady": {} },
  "beeper": { "resonance-hz": 3200, "q": 6, "square-mix": 0.02, "note-ms": 90, "register": { "thresholds": [0.33, 0.66], "base-midi": [84, 72, 60] },
              "scales": { "major": [0, 2, 4, 7, 9], "minor": [0, 3, 5, 7, 10] }, "earcons": { "success": [[0, 0], [90, 4]], "fail": [[0, -12], [60, [-12, -11]]], "warn": [[0, 2], [300, 2]] } },
  "reach": { "self": { "send": 0.05, "width": 0.1 }, "others": { "send": 0.22, "width": 0.5 }, "world": { "send": 0.40, "width": 0.8, "predelay-ms": 18 } },
  "sound": { "peak-dbfs": { "act": -24, "beep": -28, "fail": -22 }, "max-ms": { "act": 600, "beep": 250, "first-run": 1200 },
             "rate-limit": { "min-gap-ms": 1500, "per-10s": 3 }, "variation": { "f0": 0.03, "t60": 0.10, "contact": 0.06 },
             "session-decay": [[20, -2], [60, -2]], "size-gain": [[32, 0.55], [64, 0.75], [160, 1]] },
  "set": {
    "sync": {
      "job": "link", "station": 195, "archetype": "jacks", "container": "slab",
      "feel": { "V": 0.7, "A": 0.8, "W": 0.4 },
      "act": { "kind": "lift-seat", "spring": "part", "cues": [["lift", 0], ["seat", 0.56]] },
      "states": {
        "syncing": { "feel": { "A": 1.0 }, "lamp": ["led-amber", "breathe"], "form": "plug-half" },
        "failed":  { "feel": { "V": 0.1, "W": 0.7 }, "lamp": ["led-red", "blink2"], "form": "plug-out", "beep": "fail" },
        "synced":  { "lamp": ["led-green", "steady"], "beep": "success" }
      }
    }
  }
}
```

**Generated, never hand-edited**: `packages/metalui/src/tiles/tiles.generated.ts` and `swift/Sources/MetalUI/Tiles/MetalTiles.generated.swift`, holding per tile and state the *resolved* numbers: body and accent as sRGB and P3 hex, material lighting parameters, lamp keyframes, act cues, mode tables with f0 per part, register, scale and reach constants. React renders SVG (`feDiffuseLighting` + `feSpecularLighting` over the height field) and Swift shades the same height field in `Canvas` with a Lambert + Phong shader; both take `bevel`, `gloss`, `grain`, `translucency` from the record. Sound on both sides is one class, `TileVoice` (impacts) plus `Beeper`, parameterised only by the record. `npm run check` diffs both generated files against `tokens.json` and runs the §4.3 and §4.4 rules. Archetype drawings (`archetypes/jacks.tsx`, `MetalTileArchetypes/Jacks.swift`) compose Parts and take every colour and cue from the record; that geometry is the only per-platform authoring, and it is never tuning.

## 8. What to build first

Foundations, then one Part or tile at a time, each finished in every state before the next.

1. **Foundation: `tiles.materials` and `tiles.feel`.** Seven materials with visual and acoustic recipes; the generator resolves a 7 × 3 swatch sheet (each at W 0.1, 0.5, 0.9) on both platforms; a docs page "Materials" shows it in both colorways with a DialKit panel for bevel, gloss, grain, the Feel coefficients and the mode tables, with a strike button per swatch. Gate: swatches distinguishable at 32 px; glass, metal and rubber read as such by eye and by ear (six-person material naming).
2. **Foundation: lamp gestures, accent rule, set rules, CVD check, Beeper earcons.** The LED Part adopts the gestures.
3. **Parts: Slab, Bezel, Backlight, Jack, Plug, Cable.** Each with its docs page, both platforms, all states, before any tile.
4. **Tile 1: Sync** (stone slab, lift-seat). Richest state set: rest, hover, act, syncing, synced, failed, reduced motion, 32 to 320 px, both colorways, sound on and off. Playwright slice flips the state and asserts lamp signal, form change and the played cue list.
5. **Tile 2: Search** (inset: glass face on stone, sweep, no results). Proves the second container mode and glass.
6. **Parts: Cell; Tile 3: Memory** (backlit resin grid, glow). Proves translucency; first run reuses its glow.
7. **Parts: Lid; Tile 4: Trash** (rubber, dark, minor mode). Proves the heavy end and red-in-the-lamp.
8. Settings and Shortcuts (port the prototypes onto the model, adding Cap and Keycap sounds), then Account, Storage, Capture, Share, Draw, then the `signal` moments. Run §6 after tile 6 and after tile 12; tune the Feel coefficients and the material tables, never an individual tile.
