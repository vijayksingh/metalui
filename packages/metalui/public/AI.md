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
