# MetalUI: agent integration guide

MetalUI is a set of Soft Hardware components: bone and graphite soft-touch plastic, smoked glass, knurled metal, LEDs, and press-in mechanics. Each component exists as React on Base UI (`@unlocalhosted/metalui`) and as SwiftUI (the `MetalUI` Swift package), and the two render the same material recipes.

## Setup

React:

```sh
npm install @unlocalhosted/metalui
```

```tsx
import '@unlocalhosted/metalui/styles.css'; // once, at the app root
import '@unlocalhosted/metalui/icons.css';  // once, if you use icons
```

Or copy the source into your project with the shadcn CLI: `npx shadcn@latest add https://metalui.dev/r/<name>.json`.

SwiftUI: add the package `https://github.com/vijayksingh/metalui` and `import MetalUI`. It needs macOS 14 or iOS 17.

## Global rules

- **Colorway:** set `data-mu-colorway="bone" | "graphite"` on any ancestor, or use `.metalColorway(.bone)` in SwiftUI. Without it, the system color scheme decides. Don't restyle materials with custom backgrounds, borders or shadows.
- **Signal color:** one per object, at most. Phosphor green marks intent (focus, selection, live state), never a call to action. Red is destructive only. `--mu-success` always sits beside a check glyph and `--mu-warning` beside a label or glyph, never hue alone. `--mu-photon` is for its listed places only. Status LEDs: green on, amber waiting, red failed, blue capture or link kind, off idle.
- **Feelings tints** (`.mu-tint-ember | blush | tide | spark | graphite | dusk | iris`, SwiftUI `.metalTint(.blush)`): only on glyphs that carry a feeling, or a moment with an unmistakable one (a date is affection, a party is joy). The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength, which the glyph's shape shows. The tint colors the glyph's stroke, so the line itself evokes the feeling; a tinted glyph's vessel is not filled. Never red or green, never on words, never for status or intent. Off under Increase Contrast and inside `data-mu-untinted` (`.metalUntinted()`), so the glyph must read without it.
- **Motion:** it comes from the component, and reduced motion is built in. Don't add your own transitions on top. Under Reduce Motion each spring class resolves one way (`tokens.json` `springs.*.reduced`): part, object, hinge and refusal apply at once; surface and settle lose travel and fade in place; release (the press) plays as authored. Lift is two motions (T5): a hover lift rides `settle` (one step, no overshoot, still by the time the pointer leaves); a land (a drop into place) rides `object`, a stop, and rare. Web: ride `--mu-spring-<class>-d` and multiply enter or exit offsets by `--mu-travel-<class>`; `data-mu-motion="reduce"` on any ancestor forces the policy. SwiftUI: `.metalAnimation(.settle, value:)` or `MetalMotion.resolve(_:reduceMotion:)`, never `accessibilityReduceMotion` directly.
- **Choose by component name.** Only use exports listed in `components.json` and `icons.json`. Never invent names.
- **Show real outcomes.** An animation never stands in for a real result such as a save, delete or sync.

## Components

# Button

A press-in pill button. React: `Button` from `@unlocalhosted/metalui`, built on Base UI `Button`. SwiftUI: `MetalButton`, or `.buttonStyle(MetalButtonStyle(cap:))`. Sheet reference: KAMUI-15.

## Use it for

- An action that happens right away when the user activates it: Save, New Canvas, Cancel, Delete, Export.
- A dialog footer, form submit, or row action that needs a visible, labelled control.

## Don't use it for

- Navigation to another page. Use a link.
- On/off or latched tool state. Use `Toggle` / `ToolButton`, which carry the pressed state and LED.
- Icon-only toolbar controls. Use `ToolButton` inside `Toolbar`.

## Anatomy

- The **cap** is a 32px-tall pill: 15px horizontal padding, Geist 12.5 medium (the `ui` type role), tracking −0.005em.
- The **label** is text, optionally with a leading MetalUI icon at 16px and a 6px gap.
- The **press** moves the cap down 1px, and its shadow collapses into an inner well. The release rides the `release` spring (stiffness 500, damping 40; half 71ms, near-settled 178ms). Shadows and fills cross-fade over 180ms.

## API

| React prop | SwiftUI | Values | Default |
|---|---|---|---|
| `cap` | `cap:` | `standard`, `primary`, `destructive` | `standard` |
| `disabled` | `.disabled(_:)` | boolean | `false` |
| `focusableWhenDisabled` | – | boolean | `false` |
| `render` | – | Base UI render prop, for `<a>` or custom elements (set `nativeButton={false}`) | – |
| any `<button>` attribute | – | `type`, `onClick`, `aria-*` | – |

```tsx
import { Button } from '@unlocalhosted/metalui';
import { SendAwayIcon } from '@unlocalhosted/metalui/icons';
import '@unlocalhosted/metalui/styles.css';

<Button cap="primary" onClick={create}>New Canvas</Button>
<Button onClick={close}>Cancel</Button>
<Button cap="destructive" onClick={remove}><SendAwayIcon size={16} />Delete</Button>
```

```swift
import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }
MetalButton("Cancel") { close() }
MetalButton("Delete", cap: .destructive) { remove() }
```

## Rules

- Use at most **one** `primary` or `destructive` cap per group. Everything else is `standard`.
- `destructive` is only for actions that remove or discard data. Pair it with confirmation when the action can't be undone.
- The label is a verb, or a verb + object, in title case. The button text itself says what happens.
- Put icons **before** the label, at `size={16}`. An icon inside a Button plays its hover pose and press motion from the whole button (the button is the icon's trigger), so don't wire up animation yourself.
- Don't restyle the cap with custom backgrounds, borders, or shadows. Colorway comes from `data-mu-colorway` (`bone` | `graphite`) on any ancestor. When no ancestor sets it, `prefers-color-scheme` decides.
- Don't signal success with the press motion. Show the real result: a toast, a state change, or an error.
- **A label that changes in place must morph, never snap** (Transitions T1–T3). Wrap it in `SwapText` and the icon in `SwapIcon` (both from `@unlocalhosted/metalui`): the button's face turns one step on a drum: old and new labels and icons overlap with a small defocus (no blank frame), and the width settles to the new label. If the icon changes too, use `MorphIcon` from `@unlocalhosted/metalui/icons` with the next icon's name: any icon in the set morphs into any other instead of swapping. Example: `<Button><MorphIcon name={copied ? 'check' : 'paste'} size={14} /><SwapText value={copied ? 'Copied' : 'Copy'} /></Button>`.

## Accessibility

- It renders a native `<button>`. Enter and Space activate it, and it takes part in form submission. Base UI handles the disabled state and `focusableWhenDisabled`.
- The focus ring is a 2px `--mu-focus` outline at a 2px offset, shown only for keyboard focus (`:focus-visible`).
- An icon-only Button needs `aria-label`. Icons inside labelled buttons are decorative (`aria-hidden`).
- Disabled buttons render at 40% opacity and don't play their icon motion.
- Under reduced motion, transitions are instant. The 1px press travel stays, because it is feedback, not decoration.

## Tokens

`--mu-btn-bg`, `--mu-btn-sh`, `--mu-pressed-bg`, `--mu-pressed-sh`, `--mu-primary-*`, `--mu-destructive-*`, `--mu-spring-release`, `--mu-focus`. Swift: `MetalTokens.<colorway>.btnBg/btnSh/pressedBg/pressedSh`, `MetalCaps.primary/destructive`, `MetalSprings.release`.

---

# Cue family

Recognition made visible on the text. React: `Cue`, `CueUrl`, `CueInferred`, `Dimple` (Base UI Checkbox), `CueUrgency`, `CueLife` from `@unlocalhosted/metalui`. SwiftUI: `Text.metalCue(_:colorway:)`, `MetalCueTag`, `MetalDimple`, `MetalCueURLPill`, `MetalCueInferred`, `MetalCueUrgency`, `MetalCueLife`. Kamui brief: 03 §3 and the medium demo.

## Use it for

- Marking what a recognizer understood in a person's own writing: a date, a duration, an amount, a measurement, a tag, a colour, a link.
- A task's checkbox in the margin (`Dimple`), a task the model inferred (`Dimple ghost`), and urgency (`CueUrgency`).
- The one life glyph trailing a block (`CueLife` around a `Life*Icon` at 16).

## Don't use it for

- Changing the text. A cue never rewrites, reflows or recolours the words (tags are ink2, derived tags ink3, never a hue).
- Anything the person did not write: a value the model read that is not in the text is a `CueInferred` pill after the words, never an underline.
- Status, errors or calls to action. Cues are quiet and have no toast, badge or sound.

## Anatomy

| Cue | Rest | While writing |
|---|---|---|
| date | dotted underline green .7, 1.5 thick, offset 3.5; hover chip with the resolved date | same |
| duration · amount | solid quiet underline 1, offset 3.5 (the text's own figures: tabular digits would change the advance) | same |
| measurement | solid green .42 underline 1.5, offset 4 | same |
| tag | soft pill: padding 1/4 paid back by margin 0/−4, ink2 | same |
| derived tag | hollow pill (.5 ring), ink3 | same |
| hex | 3 pt underline in the colour at 78 %, skip-ink off; the 11 pt swatch before it at rest | underline only |
| URL | a 20 tall host pill with the link glyph at 11 | the raw URL, plain |
| inferred | a 17 tall hollow pill in the label role after the last word | hidden |
| dimple | 16 pt well, radius 6, hanging at −25 in the gutter; checked: dark with a white tick | the raw `[ ] ` sits in the gutter |
| ghost dimple | 14 pt hollow, radius 5; the band grows left by 36 instead of indenting the words | hidden |
| urgency | 5 pt amber LED at −35 | hidden |
| life glyph | after a middle dot, 16 tuned cut, ink3 → ink2 on the host's hover, tint for feelings | hidden |

## Motion

The resolved-value chip rises 3 pt on the part spring (instant under Reduce Motion). The dimple's tick draws on in 220 ms after a 40 ms beat on an ease-out, not sprung (DS-21); instant under Reduce Motion. The life glyph fades in 120 ms when recognised; its hover is the glyph's own. Nothing else moves.

## API

```tsx
import { Cue, CueUrl, CueInferred, CueLife, Dimple, CueUrgency } from '@unlocalhosted/metalui';
import { LinkIcon } from '@unlocalhosted/metalui/icons';
import { LifeCoffeeIcon } from '@unlocalhosted/metalui/icons/life';

<Dimple checked={done} onCheckedChange={tick} aria-label="Poster task" />
Send the poster <Cue kind="date" resolved="TUE 30 SEP · 16:00">tomorrow 4pm</Cue> for <Cue kind="tag">#poster</Cue>
<CueUrl host="figma.com" href={url} glyph={<LinkIcon size={11} />} />
<CueInferred resolved="FRI 3 OCT · JEV 0.82">fri</CueInferred>
<CueLife><LifeCoffeeIcon size={16} /></CueLife>
```

| Component | Props |
|---|---|
| `Cue` | `kind` (`date`, `duration`, `amount`, `measurement`, `tag`, `derived-tag`, `hex`), `resolved` (hover chip), `color` and `swatch` (hex) |
| `CueUrl` | `host`, `glyph`, any anchor attribute |
| `CueInferred` | `resolved` |
| `Dimple` | Base UI Checkbox props (`checked`, `onCheckedChange`, `disabled`), `doing`, `ghost` |
| `CueUrgency` | – |
| `CueLife` | the glyph as children |

## Rules

- Metric-neutral: every in-flow cue has the same advance as the plain text it marks (measured width delta 0.00 pt). Never add padding without paying it back.
- One life glyph per block, trailing; never a chip for a glyph; never while writing.
- Ticking a dimple is a person's action: the host writes `[x]` into the text and offers Undo. Applying a cue never rewrites text.
- Hidden confidence is a bug: an inferred value shows where it came from (`JEV 0.82`) in its chip.

## Accessibility

- The dimple is a real checkbox (Base UI): Space toggles it, it has a focus ring, and `doing` is announced as mixed. Give it a label that names the task.
- The resolved-value chip also shows on keyboard focus. The hover chip repeats what the text already says, so it is not the only carrier.
- The URL pill is a link with its host as its name; the urgency LED has the label "Due soon".
- Colour is never the only cue: underline patterns differ (dotted date, solid values), and tags are shapes.

## Tokens

`--mu-cue-*`; per colorway `--mu-cue-quiet`, `--mu-cue-tag-bg`, `--mu-cue-tag-sh`, `--mu-cue-derived-sh`, `--mu-cue-ghost-sh`, `--mu-cue-url-ink`; `--mu-well*`, `--mu-led-amber`, `--mu-led-ring`, `--mu-frost-graphite-*`, `--mu-type-label`. Swift: `MetalCue`, `MetalTokens.<colorway>.cue*`.

---

# Hover engraving

A block's identity, shown on a dwell, never on a pass. React: `HoverEngraving` from `@unlocalhosted/metalui`. SwiftUI: `.metalHoverEngraving(...)` or `MetalHoverEngraving`. Kamui brief: 03 §5, DS-31.

## Use it for

- Telling what a block is and where it came from, without a card: `LOG · 07:40 · SLEEP 6 H · ALSO TIRED`, `TASK · TOMORROW 16:00 · #POSTER · JEV ✓`, `LUNCH? 0.71`, `NOT SENT · LOOKS LIKE A SECRET`.

## Don't use it for

- Anything a person must read to act. The engraving repeats or names what the block already shows (the label role never carries information alone).
- Controls. It is not interactive and ignores the pointer.
- Tooltips on chrome. Those are tooltips; the provenance of a single cue is the provenance tooltip.

## Anatomy

A 22 tall frosted pill (`engraving-bg`, blur 12, `raise-sm`) with 10 padding and 8 gaps: the text in the `label` role, engraved with the lip, the kind emphasised; derived tags as hollow 15 tall pills; the recognizer's status after a 5 pt LED (green live, amber waiting, red failed, off). Beside the first line of a text block (4 to the right, 9 down); below a material block (8 under). It never covers the next line of a stacked list.

## States and motion

| State | Look | Motion |
|---|---|---|
| pass | hidden | – |
| dwell 420 ms | shown | settle fade, sliding 3 in (beside) or 2 down (below) |
| leave | hidden at once | settle, no delay |
| selected, writing | hidden (`open={false}`) | – |
| Reduce Transparency | opaque `frost-opaque` fill, no blur | – |

Reduce Motion: settle is a crossfade, so it fades in place.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `kind` | `kind:` | emphasised first |
| `details` | `details:` | joined with ` · ` |
| `tags` | `tags:` | derived tags only |
| `status` | `status:` | `{ led, text }`; `MetalEngravingStatus` |
| `placement` | `placement:` | `beside`, `below` |
| `open`, `immediate` | `isPresented:` | controlled; the dwell still applies unless `immediate` |

```tsx
<div className="mu-icon-trigger block" aria-describedby="eng-1">
  slept badly, up at 5
  <HoverEngraving id="eng-1" kind="LOG" details={['07:40', 'SLEEP 6 H', 'ALSO TIRED']} status={{ led: 'live', text: 'JEV ✓' }} open={selected || editing ? false : undefined} />
</div>
```

## Rules

- A dwell, never a pass: 420 ms before it shows, nothing on the way out.
- Beside the first line, never under a text block (it would cover the next line of a list).
- Hidden while selected or writing.
- Status carries its LED and its words; never colour alone.

## Accessibility

- It is a `note`; point the block's `aria-describedby` at its `id` so assistive tech reads the identity with the block.
- It never takes the pointer or focus.

## Tokens

`--mu-engraving-*`, per colorway `--mu-engraving-bg`, `--mu-engraving-emphasis`, `--mu-engraving-tag-ring`; `--mu-engrave`, `--mu-lip`, `--mu-raise-sm`, `--mu-led-*`, `--mu-type-label`. Swift: `MetalEngraving`.

---

# Lens bar

Names the question a lens asks and switches how the answer is shown. React: `LensBar` from `@unlocalhosted/metalui` (Base UI Toolbar, with the `Segmented` control inside). SwiftUI: `MetalLensBar`. Kamui brief: 04 §4, 03 §8.

## Use it for

- While a lens is open: `open tasks about the poster · 6 MATCHES · VIA JEV`, with its views (In Place, List, Table, Timeline, Gallery), pin and close.

## Don't use it for

- Search fields or command entry. The palette asks; the lens bar names what was asked.
- Filtering that moves or hides content permanently. A lens never moves anything.

## Anatomy

A 36 tall frosted pill (the plate frost recipe, `raise`), padding 0 6 0 14, gap 8, at the top centre: the lens glyph at 14 in ink2; the query in the `title` role, ellipsised at 340; `N MATCHES` engraved; the source (`ASKING JEV` after an amber LED while pending, `VIA JEV` or `LOCAL` when words beyond the rules were judged); a compact segmented control; two 28 round icon buttons, pin and close.

## States and motion

| State | Look | Motion |
|---|---|---|
| open | the bar | drops in 8 from above, from .98, on surface; Reduce Motion: fades in place |
| asking | amber LED + ASKING JEV | – |
| view change | the thumb glides | part |
| icon hover | a 5 % ink well, ink | settle |
| close | removed | the host fades it out on release |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `query`, `count`, `source` | same | |
| `mode`, `onModeChange`, `modes` | `mode:` (Binding), `modes:` | the me lens passes `[]` |
| `onPin` | `onPin:` | omit for a selection lens |
| `onClose` | `onClose:` | also ⎋ in the host |
| `glyphs` | (MetalIcon built in) | `{ lens, pin, close }` at 14, so the main entry stays free of the icon catalog |

```tsx
import { LensBar } from '@unlocalhosted/metalui';
import { SearchIcon, PinIcon, CloseIcon } from '@unlocalhosted/metalui/icons';

<LensBar query="open tasks about the poster" count={6} source="jev" mode={mode} onModeChange={setMode}
  onPin={pin} onClose={close} glyphs={{ lens: <SearchIcon size={14} />, pin: <PinIcon size={14} />, close: <CloseIcon size={14} /> }} />
```

## Rules

- A lens never moves anything. In place dims non-matches; the other views gather matches in a panel without moving them.
- Pinning makes a live region with the toast "Pinned as a live region · it updates as you write".
- Hidden confidence is a bug: when words were judged by the recognizer, say so (VIA JEV).

## Accessibility

- A Base UI toolbar named "Lens: …": one tab stop with arrow navigation; the view switcher is a radio group; pin and close have labels and titles.
- The match count is announced politely when it changes.

## Tokens

`--mu-lensbar-*`, `.mu-frost-plate`, `--mu-segmented-*`, `--mu-led-amber`, `--mu-spring-surface`, `--mu-travel-surface`. Swift: `MetalLensBarMetrics`, `MetalFrost.plate`.

---

# Memory scrubber

Time as a dimension of the surface: drag or step back through what was written. React: `MemoryScrubber` from `@unlocalhosted/metalui` (Base UI Slider). SwiftUI: `MetalMemoryScrubber`. Kamui brief: 04 §5, 03 §9.

## Use it for

- Viewing the canvas as it was: blocks that did not exist yet fade out, edited ones show their old text, the world takes a faint sepia (the host's), and the past banner appears.

## Don't use it for

- Undo. Scrubbing only looks; it changes nothing.
- Picking a date for data (a due date, a range). Use a date field.

## Anatomy

330 × 50, bottom left of the canvas:
- a **readout** above in the `label` role, engraved: the clock glyph at 10, `MEMORY · NOW` or `MEMORY · TUE 23 SEP · 14:10`, and a green `NOW` button while in the past;
- a 10 tall pill **track** (`well`), with the **intent fill** (`#9BE6BF → #5FC894` at .55) up to the knob;
- **tick marks** (2 × 4) for blocks and edits;
- **day labels** beneath (`MON` … `TODAY`, at most seven), each with a 1 × 5 tick;
- a 22 pt knurled anodized **knob** (a conic sweep from 200°, an inner ring, a contact shadow; grab cursor).

## States and motion

| State | Look | Motion |
|---|---|---|
| now | knob at the right end, `MEMORY · NOW` | – |
| dragging | the knob under the pointer, grabbing cursor | follows exactly; within 1 % of now it snaps to now |
| a click on the track, ← →, ⇧ ← → | the knob jumps an hour, or a day | part spring (instant under Reduce Motion) |
| past | the readout names the moment; `NOW` shows | – |
| focus | the 2 pt focus ring around the knob | – |

The knob is the one place the scrubber's own arrows win over selection nudges: the host must not nudge while it has focus.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `start`, `end` | `range:` | ms / `ClosedRange<Date>` |
| `value`, `onValueChange` | `selection:` (Binding<Date?>) | `null`/`nil` is now |
| `marks` | `marks:` | block and edit moments |
| `format` | `format:` | the readout for a past moment |
| `glyph` | (MetalIcon built in) | the clock at 10 |

## Rules

- Scrubbing never changes anything. ⎋ or NOW returns to the present.
- The readout always names the moment; the aria value text says it too.
- Only chrome that changes while in the past is the past banner.

## Accessibility

- A Base UI slider labelled "Scrub through time": ← → step an hour, Shift a day, Home and End jump to the start and now; its value text reads the moment ("TUE 23 SEP · 14:10", or "Now").
- NOW is a real button.

## Tokens

`--mu-scrubber-*`, per colorway `--mu-scrubber-mark`, `--mu-scrubber-day-tick`; `--mu-well*`, `--mu-green-deep`, `--mu-spring-part`, `--mu-type-label`. Swift: `MetalScrubberMetrics`.

---

# Past banner

Says the canvas is showing the past, and brings it back. React: `PastBanner` from `@unlocalhosted/metalui`. SwiftUI: `MetalPastBanner`. Kamui brief: 04 §13, 03 §9.

## Use it for

- While the memory scrubber views a past moment: `MEMORY · viewing Tue 23 Sep · 14:10 · [Back to Now ⎋]`.

## Don't use it for

- Notifications, errors or any other status. It is the only chrome that changes in the past, and only then.

## Anatomy

A 34 tall graphite frosted pill at the top centre (the graphite frost recipe), padding 0 6 0 14, gap 10: `MEMORY` in the `label` role, white at .4 with a dark lip; the moment in the `ui` role (`#EDEDEF`); a 24 tall Back to Now cap (`rgba(255,255,255,.09)`, hover .15) with the ⎋ key.

## States and motion

| State | Motion |
|---|---|
| scrubbed into the past | drops one nest from above on surface (a crossfade under Reduce Motion) |
| Back to Now pressed | the cap presses 1; the host returns and removes the banner (release) |

## API

| React | SwiftUI |
|---|---|
| `moment` | `moment:` |
| `onBack` | `onBack:` |

## Rules

- Shown only while in the past; ⎋ does the same as the cap.
- The moment reads like a sentence: "viewing Tue 23 Sep · 14:10".

## Accessibility

- A `status` region, so arriving in the past is announced. Back to Now is a real button with its shortcut (`aria-keyshortcuts="Escape"`).

## Tokens

`--mu-pastbanner-*`, `.mu-frost-graphite`, `--mu-spring-surface`, `--mu-motion-nest`. Swift: `MetalPastBannerMetrics`.

---

# Provenance tooltip

One hover away from every cue: where it came from. React: `ProvenanceTooltip` (and `ProvenanceProvider` around a canvas) from `@unlocalhosted/metalui`, on Base UI Tooltip. SwiftUI: `.metalProvenance(_:detail:)` or `MetalProvenanceTooltip`. Kamui brief: 03 §5.

## Use it for

- Every cue the app applied: `RULE · DATE PARSER`, `JEV · 0.82`, `REGION · DONE`, `CLUSTER · POSTER`, `FORMULA`, `YOU` (a correction).

## Don't use it for

- Tooltips on chrome (a tool's name and key). Those are the toolbar's tooltips.
- Long explanations. One line: the source, then the detail.
- Hiding confidence. If the app guessed, the number is shown.

## Anatomy

A graphite frosted tag (the graphite frost recipe), radius 11, padding 6 / 10, max 280 wide, in the `readout` role (10.5 mono) uppercase, tracked .05em: the source in `ink`, the detail after a middle dot in `dim`. It sits 8 above the cue, or 34 above a cue that shows its own value chip on hover, and flips below near the top of the view.

The readout role, not the label role: provenance carries information on its own, and the label role never does (DS-06).

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hovered or focused 380 ms | the tooltip | fade on settle |
| next cue within the group | the next tooltip at once | – |
| leave, Escape | hidden | fade on settle |
| Reduce Transparency | opaque graphite | – |

## API

```tsx
<ProvenanceProvider>
  <ProvenanceTooltip source="Jev" detail={['0.82']} clearsChip>
    <Cue kind="date" resolved="TUE 30 SEP">tomorrow</Cue>
  </ProvenanceTooltip>
</ProvenanceProvider>
```

| Prop | Notes |
|---|---|
| `source` | first, in ink |
| `detail` | dimmed, after a middle dot |
| `clearsChip` | the cue has its own value chip: sit above it |
| `open` | controlled |

## Rules

- Every applied cue has provenance, and a guess shows its number.
- One line, the source first.
- It never covers the cue's own value chip.

## Accessibility

- Base UI Tooltip: it opens on hover and on keyboard focus and closes on Escape. Base UI tooltips are visual only, so the component also sets the cue's `aria-description` to the provenance ("Jev, 0.82"). The cue stays the focusable element.
- It never holds interactive content.

## Tokens

`--mu-provenance-*`, `--mu-frost-graphite-*`, `--mu-backdrop`, `--mu-type-readout`, `--mu-spring-settle`. Swift: `MetalProvenance`, `MetalFrost.graphite`.

---

# Region

A drawn rectangle with a name that carries a rule. React: `Region` and `RegionRow` from `@unlocalhosted/metalui`. SwiftUI: `MetalRegionView` and `MetalRegionRow`. Kamui brief: 04 §7, 03 §6.

## Use it for

- Arrangement that means something: `Done` ticks what lands, `To do` and `Doing` make tasks or reopen them, `This week`, `friday` or `tomorrow` date what lands, any other name tags what lands.
- Kanban (three adjacent regions), a pipeline (N in a row), an inbox (a pinned lens that makes tasks).
- A pinned lens: a live query kept on the canvas as a frosted plate of rows (`lens`).

## Don't use it for

- Grouping chrome, cards in a settings page or a list. It is a canvas object.
- A container that owns its blocks: blocks sit in it by position only, and dragging them out undoes the rule unless the rule says otherwise.

## Anatomy

- **Well**: a sunk rectangle (`region-fill`, `region-sh`), radius from the ladder by size: 30 when the short side is at least 240, else 24.
- **Head**, 44 tall (padding 14 / 18, grab cursor): the **name** in the `title` role (empty: "name this region" in ink3), the **rule** in the `label` role, engraved (`marks tasks done`, `tags them #poster`, `dates them friday`), and the **count** in the `readout` role, ink3.
- **Lens**: a frosted plate (`region-lens-fill`, blur 10, `raise-lite`) with its rows inset 12 under the head: `RegionRow` (padding 5 / 8, radius 12, a 14 pt dimple, the day engraved at the right; hover raises `row-hover` + `raise-sm`; checked rows are struck in ink3).

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | the well | – |
| over (a block is dragged above) | green fill, 1 pt green ring, the rule reads `drop to mark tasks done` in green | fill and ring on settle |
| drop | the block settles inside its edges, never on a neighbour | the host lands it on the `object` spring (a stop) |
| dim (an in-place lens has no match inside) | .35 | settle |
| past (did not exist at the scrubbed time) | 0, no pointer | settle |
| rename | the name is a field; Enter commits, Escape restores | – |
| selected | the Selection frame at the region's radius | – |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `name`, `rule`, `dropRule`, `count` | same | the host derives the rule from the name |
| `over`, `dim`, `past` | `state:` | |
| `lens` + children (`RegionRow`) | `lens:` + `rows:` | |
| `renaming`, `onRename`, `onRenameCancel` | `renaming:`, `onRename:` | |
| `width`, `height` | (its frame) | picks the radius |

```tsx
<Region name="Done" rule="marks tasks done" dropRule="drop to mark tasks done" count={3} over={dragOver === 'done'} width={320} height={260} />
<Region name="open tasks" rule="lens · live" lens width={300} height={220}>
  <RegionRow lead={<Dimple aria-label="Send the poster" />} meta="FRI">Send the poster</RegionRow>
</Region>
```

## Rules

- Placement is meaning, and reversible. A drop applies the rule with a toast that names it and offers Undo; dragging out undoes it unless the rule says otherwise.
- A dropped block settles inside the edges on `object` and never lands on a neighbour.
- The head says the rule in words; the over state says what the drop will do.
- A lens region holds nothing: its rows are the real blocks, and ticking a row ticks the block.

## Accessibility

- A region is a group named "Region Done, marks tasks done". Its rows are focusable and its dimples are real checkboxes.
- The drop is a pointer gesture; the keyboard path is the tool strip's Region verb and the palette.
- Colour is never alone: the over state also rewrites the rule in words.

## Tokens

`--mu-region-*`, per colorway `--mu-region-fill`, `--mu-region-sh`, `--mu-region-over-shade`, `--mu-region-lens-fill`, `--mu-raise-lite`, `--mu-row-hover`; `--mu-radius-card`, `--mu-radius-hero`, `--mu-type-*`. Swift: `MetalRegion`, `MetalTokens.<colorway>.region*`.

---

# Segmented control

A pill of pills: one of a few options, always visible. React: `Segmented` from `@unlocalhosted/metalui` (Base UI RadioGroup + Radio). SwiftUI: `MetalSegmented`. Sheet reference: KAMUI-04.

## Use it for

- Two to five mutually exclusive views or modes that are switched often: a lens's view (place · list · table · timeline · gallery), a colorway, a scale.

## Don't use it for

- More than five options, or options that need explaining. Use a select or a menu.
- Navigation between pages (use tabs or links) or on/off (use a switch).
- Actions. Each segment is a state, not a command.

## Anatomy

- **Track**: a pill well (`well-top → well-bot`, `well`), padding 3.
- **Segments**: 28 tall (regular) or 24 (compact, in a lens bar or strip), padded by the pill rule `h/2 − 1`, the `ui` role in ink2; an optional leading glyph at the control's icon size.
- **Thumb**: a raised cap (`thumb-hi → thumb-lo`, `raise-sm`) under the selected segment, which reads in ink.

## States and motion

| State | Look | Motion |
|---|---|---|
| rest | ink2 labels, the thumb under the selection | – |
| hover | the label turns ink | settle |
| selected | the thumb glides to it | part spring (a track with ends: may overshoot against the stop) |
| focus | a 1.5 ring with no offset | – |
| disabled | 40 % | – |

First paint and resizes place the thumb without motion. Reduce Motion: the thumb moves at once; labels still recolour.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `options` | `options:` | `{ value, label, icon?, disabled? }` |
| `value` / `defaultValue` / `onValueChange` | `selection:` (Binding) | |
| `size` | `size:` | `compact` (24), `regular` (28) |
| `aria-label` | `label:` | required |

```tsx
<Segmented aria-label="View" size="compact" value={mode} onValueChange={setMode}
  options={[{ value: 'place', label: 'place' }, { value: 'list', label: 'list' }, { value: 'table', label: 'table' }]} />
```

## Rules

- Two to five options, short labels, one word each where possible.
- The selection is the thumb, never a colour.
- A segment switches a view instantly; if the change is slow, show progress in the view, not in the control.

## Accessibility

- Base UI RadioGroup: one tab stop, arrows move and select, Space selects; each segment is a radio with its label.
- Give the group an `aria-label` that names what it switches.

## Tokens

`--mu-segmented-*`, `--mu-well*`, `--mu-thumb-hi`, `--mu-thumb-lo`, `--mu-raise-sm`, `--mu-spring-part`, `--mu-spring-settle`. Swift: `MetalSegmentedMetrics`.

---

# Selection frame

KAMUI-14: the one selection for every kind of object. React: `SelectionFrame` from `@unlocalhosted/metalui`. SwiftUI: `.metalSelectionFrame(_:)` on the object, or `MetalSelectionFrame(size:)` for an overlay drawn apart from it. Sheet reference: KAMUI-14. There is no Base UI part: it is an object, and the host carries the selection semantics.

## Use it for

- Showing which object on a canvas or board is selected: a text block, an image, a card, a region, a file.
- The hover presence of a borderless object: faint corner dots so its invisible boundary is discoverable, and the edge light where the pointer enters its band.
- A multi-selection: `variant="lite"` on each member and one `SelectionFrame` around the bounding box with `count`.

## Don't use it for

- Selected rows, tabs, menu items or segments. They have their own selected state (a raised thumb, a pressed cap, a green bar).
- Keyboard focus. Focus is the 2 pt focus ring on `:focus-visible`; selection and focus can both show.
- A marquee while dragging. The marquee is a plain precision rectangle, drawn by the host.

## Anatomy

- **Ring**: 1.25 pt green-deep (green on graphite) at offset 6 from the object, so its radius is the object's plus 6 (a plate at 18 gets a ring at 24). A flat 3.5 pt collar `rgba(120,214,165,.16)` sits outside it: a band, never a blur.
- **Handles**: eight on the ring line. 10 pt round soft caps at the corners, 6 × 18 capsules at the edge midpoints. With `handles="text"` the n and s capsules are grips (grab cursor, move the object); the corners and e/w set the width. Each handle's hit area reaches 7 pt past its drawn shape.
- **Readout**: a graphite pill 24 tall, 16 under the object: a 4 pt green LED, then `W × H` in the readout role (Martian Mono 10.5, tabular), the `×` dimmed. It reads the measured frame, never a constant: `● 320 × 214`; `● 3 · 540 × 180` for a multi-selection; `● COPIED · PNG 130 × 215` for 900 ms after a copy.
- **Hover**: only the four corner dots, 5 pt, where the handles will be; the edge light (1.5 pt, fading at both ends) on the band edge under the pointer.

## States and motion

| State | What shows | Motion |
|---|---|---|
| rest | nothing | – |
| hover | corner dots; edge light on one edge | fade on settle |
| selected | ring, collar, handles, readout | ring and handles enter from 1.02 on the part spring, once |
| selected · writing | the same; readout at .78 | re-measures in the same frame as each keystroke; never replays its entrance |
| selected · moving | readout at 1 | – |
| lite | a 1 pt quiet ring, no collar, no handles | none |

Reduce Motion: part resolves instant, so the ring appears without its entrance; the dots and readout still fade (settle crossfades).

## API

| React prop | SwiftUI | Values | Default |
|---|---|---|---|
| `state` | first argument | `rest`, `hover`, `selected` | `rest` |
| `variant` | `variant:` | `ring`, `lite` | `ring` |
| `mode` | `mode:` | `idle`, `writing`, `moving` | `idle` |
| `radius` | `radius:` | the object's corner radius | `0` |
| `handles` | `handles:` | `object`, `text`, `none` | `object` |
| `readout` | `readout:` | boolean | `true` |
| `count` | `count:` | blocks in a multi-selection | – |
| `size` | (the view's own frame) | `{ width, height }` to override the measured box | measured |
| `copied` | `copied:` | a format, e.g. `"PNG"` | – |
| `edge` | `edge:` | `n`, `e`, `s`, `w` | – |
| `onHandlePointerDown(handle, event)` | `onHandleDrag:` | the host resizes or moves the object | – |

```tsx
import { SelectionFrame } from '@unlocalhosted/metalui';

<div className="block" style={{ position: 'relative', borderRadius: 18 }} aria-selected={selected}>
  {text}
  <SelectionFrame state={selected ? 'selected' : hovered ? 'hover' : 'rest'} radius={18} handles="text" mode={editing ? 'writing' : 'idle'} />
</div>
```

```swift
import MetalUI

note
    .metalSelectionFrame(isSelected ? .selected : isHovered ? .hover : .rest, radius: MetalRadius.plate, handles: .text)
    .accessibilityAddTraits(isSelected ? .isSelected : [])
```

## Rules

- One selection for every kind: never restyle the ring per object type. For a borderless object the ring and dots are its boundary.
- The readout reads the measured frame (fractional layout size, rounded for display). Never type a size into it.
- A selection made by finishing (⎋, ⌘↩) is quiet: ring and readout, no tool strip. A click selection raises the tool strip.
- Handles sit on the ring line, not on the object's edge. Their hit area is larger than their drawing.
- Hover never changes layout: the dots and the edge light are overlays.

## Accessibility

- The frame is decoration (`aria-hidden`). The object carries the semantics: `aria-selected` (web) or `.isSelected` (SwiftUI) while selected, and its own label.
- Keyboard: arrows nudge the selection (1 pt, ⇧ 10 pt) and are the host's; the handles are pointer affordances with titles.
- Increase Contrast: the lite ring becomes the full-weight ring.
- Colour is never the only cue: the ring's shape and handles carry the state in both colorways.

## Tokens

`--mu-presence-*` (ring, collar, lite, handle, capsule, grip, readout, hover dot, edge light), `--mu-presence-dot` per colorway, `--mu-select-offset`, `--mu-led-green`, `--mu-led-ring`, `--mu-spring-part`, `--mu-spring-settle`. Swift: `MetalPresence`, `MetalRing.selectOffset`, `MetalTokens.<colorway>.presenceDot`.

---

# Suggestion chip

One question the recognizer asks at middle confidence, beside its block. React: `SuggestionChip` from `@unlocalhosted/metalui` (Base UI Button for accept and dismiss). SwiftUI: `MetalSuggestionChip`. Kamui brief: 03 §4, DS-30.

## Use it for

- A cue that would change behaviour, found at middle confidence: `Task?`, `Date friday?`, `Track as sleep?`, `Move to Done?`.

## Don't use it for

- A kind, a life glyph or anything decorative. Chips exist only for cues that change behaviour.
- High confidence (the cue applies quietly, with provenance on hover) or low confidence (nothing happens).
- More than one per block. Ask the most valuable question first; the rest wait.

## Confidence routing (a docs table, not props)

| Confidence | Nouls (p) | Choices | Life glyph | Lens | The surface |
|---|---|---|---|---|---|
| Apply (quiet) | p ≥ .85 | ≥ .70 | Layer 1, or ≥ .85 | p ≥ .5 | the cue appears, provenance on hover |
| Suggest | .60 ≤ p < .85 | .40 ≤ c < .70 | named in the engraving only | .3–.5: "maybe" at .5 | one suggestion chip |
| Nothing | p < .60 | < .40 | < .40 | < .3 | no change |

## Anatomy

A 20 tall pill: `suggestion-bg` with a .5 green-deep ring at .4 over `raise-sm`; the label in the `ui` role, ink2; the confidence in the `label` role (`0.72`); ✓ and × as 18 × 16 round buttons (✓ turns green-deep on hover). It sits beside the first line of its block (`offset-x` −2, `offset-y` 10 from the block's right edge).

## States and motion

| State | Look | Motion |
|---|---|---|
| arriving | from 3 above and .96, transparent | settle (no overshoot); Reduce Motion: fades in place |
| rest | opacity .62 | – |
| block hovered, or focus inside | opacity 1 | settle |
| button hover | a soft well, ink (✓: green-deep) | settle |
| button pressed | down 1 | – |
| writing | hidden (the host unmounts it) | – |

## API

| React | SwiftUI | Notes |
|---|---|---|
| `label` | `label:` | the question |
| `confidence` | `confidence:` | 0–1, printed to two places |
| `onAccept` / `onDismiss` | `onAccept:` / `onDismiss:` | the host applies or stores the correction |
| `hostHovered` | `hostHovered:` | force full opacity |

```tsx
<div className="mu-icon-trigger block">
  {text}
  <SuggestionChip label="Task?" confidence={0.72} onAccept={makeTask} onDismiss={notATask} />
</div>
```

## Rules

- Accepting finishes the block first, then applies, with Undo. Dismissing stores a correction for the exact text; the chip is never asked again.
- Never while writing, never for kinds or glyphs, at most one per block.
- The confidence is always shown. Hidden confidence is a bug.

## Accessibility

- The chip is a group named "Suggestion: Task? Confidence 0.72"; ✓ is "Accept" and × is "Dismiss", real buttons in the tab order with a 1.5 pt focus ring (dense strip).
- Focus inside the chip brightens it like hover.

## Tokens

`--mu-suggestion-*`, per colorway `--mu-suggestion-bg`, `--mu-suggestion-button-hover`; `--mu-raise-sm`, `--mu-spring-settle`, `--mu-travel-settle`. Swift: `MetalSuggestion`, `MetalTokens.<colorway>.suggestionBg`.

---

# Tool strip

Verbs over a selection. React: `ToolStrip` from `@unlocalhosted/metalui` (Base UI Toolbar). SwiftUI: `MetalToolStrip`. Kamui brief: 04 §11, 03 §11.

## Use it for

- A click selection on the canvas: **Tasks** (adds `[ ]`), **Summarise** (counts, next dated task, totals, tags), **Gather** (a lens of the selection), **Region** (wraps it), **Export** (copies Markdown), **Send away** (with Undo).

## Don't use it for

- A selection made by finishing (⎋, ⌘↩): that selection is quiet.
- While dragging, resizing, in the past, or with the palette open.
- App-level tools (select, write, region, ink). Those are the toolbar.

## Anatomy

A graphite frosted strip (the graphite frost recipe), padding 4, radius 18 (`plate`), floating 12 above the selection's top centre; buttons 28 tall, radius 12 (`row`), padding 10, the `ui` role in `#D6D6D8`; an engraved separator (1 × 16, dark with a light lip) before the destructive verb in `#FF8A7E`.

## States and motion

| State | Look | Motion |
|---|---|---|
| appears (click selection) | the strip | rises 4 on part (instant under Reduce Motion) |
| button hover | `rgba(255,255,255,.08)`, white | settle |
| button pressed | down 1 on `rgba(0,0,0,.35)` | 50 ms, back on release |
| disabled | 40 % | – |

## API

| React | SwiftUI |
|---|---|
| `items: { label, onSelect, destructive?, disabled?, shortcut? }[]` | `items: [MetalToolStripItem]` |
| `label` (what they act on) | `label:` |

## Rules

- Verbs compose, and never own the data before or after.
- Every verb confirms with a toast that says what happened and offers Undo ("Made 3 tasks", "Sent away 3 blocks").
- One destructive verb, last, after the separator. Canvas delete is send away (DS-33).

## Accessibility

- A Base UI toolbar named "Tools for 3 blocks": one tab stop, arrows between verbs; destructive is named, not only coloured.

## Tokens

`--mu-toolstrip-*`, `.mu-frost-graphite`, `--mu-radius-plate`, `--mu-radius-row`, `--mu-spring-part`, `--mu-travel-part`. Swift: `MetalToolStripMetrics`.

---

# Icons

`@unlocalhosted/metalui/icons` has 40 Soft Hardware glyphs: monoline + duotone on a 24×24 grid, with a 1.7 stroke. Each glyph has an authored **hover pose** (a reversible spring) and a **press one-shot**. Icons inherit `currentColor`. A static icon (`animate={false}`) at 16px or below uses a tuned small cut with a heavier stroke.

```tsx
import { SendAwayIcon, Icon } from '@unlocalhosted/metalui/icons';

<Button cap="destructive"><SendAwayIcon size={16} />Delete</Button>
<Icon name="synced" size={13} title="Synced" />
```

- **Triggering:** an icon inside any element with the class `mu-icon-trigger` plays from that element, and MetalUI Buttons already have it. Otherwise the icon plays from its own hover and press.
- **Accessibility:** icons without `title` are decorative (`aria-hidden`). Give icon-only controls an `aria-label`.
- **State glyphs morph:** `MorphIcon` (copy, check, plus, close, minus, menu, arrows, chevrons, play/pause, download/upload) transforms into another state glyph instead of being replaced: `<MorphIcon name={copied ? 'check' : 'copy'} size={14} />`.
- **Static:** `animate={false}` keeps a glyph static. Reduced motion does this automatically.
- **SwiftUI and SVG:** the same glyphs ship as SF Symbols (planned), plus static and animated SVGs at `https://metalui.dev/icons/svg/<name>.svg`.

| Component | Name | Category | Hover | Press |
|---|---|---|---|---|
| `SelectIcon` | `select` | Tools | tilts onto its tip | clicks: tip dips, a ring leaves the point |
| `TextIcon` | `text` | Tools | glyph steps aside, caret appears and blinks | glyph stamps down |
| `NoteIcon` | `note` | Tools | corner curls up | lines write themselves in |
| `ImageIcon` | `image` | Tools | sun rises behind the ridge | frame breathes, sun flares |
| `LinkIcon` | `link` | Tools | links pull apart, bar thins | snap together |
| `DrawIcon` | `draw` | Tools | tip slides and draws a stroke | taps the paper |
| `LayoutIcon` | `layout` | Tools | tiles swap sides | tiles settle together |
| `TidyIcon` | `tidy` | Tools | loose tiles snap to the guide | guide pulses, tiles click home |
| `SearchIcon` | `search` | Tools | lens sweeps, glint crosses glass | lens focuses |
| `ZoomInIcon` | `zoom-in` | Tools | plus turns a quarter | lens swells |
| `ZoomOutIcon` | `zoom-out` | Tools | minus narrows, lens recedes | lens shrinks |
| `FitIcon` | `fit` | Tools | content grows to the frame | corners clamp |
| `DuplicateIcon` | `duplicate` | Actions | copy slides off the original | copy stamps back and out |
| `SendAwayIcon` | `send-away` | Actions | well turns, dot is drawn in | dot is pulled into the centre and vanishes |
| `TrashIcon` | `trash` | Actions | lid lifts on its hinge | lid closes with a small settle |
| `GroupIcon` | `group` | Actions | cards rise and fan above the flap | cards drop into the folder |
| `UngroupIcon` | `ungroup` | Actions | cards spread wider | cards pop out and separate |
| `PinIcon` | `pin` | Actions | pin lifts, its contact shadow fades | pushes in |
| `BoardIcon` | `board` | Actions | ribbon lengthens | drops into place |
| `ShareIcon` | `share` | Actions | arrow lifts out of the tray | arrow leaves, a new one rises |
| `UndoIcon` | `undo` | Actions | head reaches back | arrow arcs back and returns |
| `RedoIcon` | `redo` | Actions | head reaches forward | arrow arcs forward and returns |
| `MoreIcon` | `more` | Actions | dots swell in sequence | dots gather and part |
| `CloseIcon` | `close` | Actions | turns a quarter and softens | pinches closed |
| `CheckIcon` | `check` | Actions | tick lifts | tick redraws |
| `SyncedIcon` | `synced` | Status | satellite advances along its orbit | orbit completes a full turn |
| `OfflineIcon` | `offline` | Status | satellite drifts further out | tries to return, drifts away |
| `SyncErrorIcon` | `sync-error` | Status | mark nudges | orbit shivers once |
| `CaptureIcon` | `capture` | Status | viewfinder focuses in | shutter blinks |
| `PasteIcon` | `paste` | Status | clip lifts | contents land on the board |
| `KeeperIcon` | `keeper` | Status | blinks | ring tips, eyes look up |
| `PlusIcon` | `plus` | Actions | the plus turns a quarter | the tile presses in |
| `RegionIcon` | `region` | Tools | the name writes across the head | the frame settles |
| `TaskIcon` | `task` | Tools | the tick lifts | the tick redraws |
| `TagIcon` | `tag` | Tools | the tag swings on its eyelet | the tag stamps |
| `CalendarIcon` | `calendar` | Tools | the rings lift | the page turns in |
| `DocumentIcon` | `document` | Tools | the second line writes on | the lines redraw |
| `ClockIcon` | `clock` | Status | the minute hand sweeps on | the face ticks |
| `MeIcon` | `me` | Tools | the trend redraws to its last point | the last point pulses |
| `SeedIcon` | `seed` | Actions | the sprout grows | the seed settles |
