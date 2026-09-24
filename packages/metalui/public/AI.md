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
- **Feelings tints** (`.mu-tint-ember | blush | tide | spark | graphite | dusk | iris`, SwiftUI `.metalTint(.blush)`): only on glyphs that carry a feeling, or a moment with an unmistakable one (a date is affection, a party is joy). The tint names the kind of feeling (joy, affection, calm, wonder, neutral, low, tension), never its strength, which the glyph's shape shows. The colorway decides how it sits: enamel body with an ink line on bone, a glowing line on graphite. Never red or green, never on words, never for status or intent. Off under Increase Contrast and inside `data-mu-untinted` (`.metalUntinted()`), so the glyph must read without it.
- **Motion:** it comes from the component, and reduced motion is built in. Don't add your own transitions on top. Under Reduce Motion each spring class resolves one way (`tokens.json` `springs.*.reduced`): part, object, hinge and refusal apply at once; surface and settle lose travel and fade in place; release (the press) plays as authored. Web: ride `--mu-spring-<class>-d` and multiply enter or exit offsets by `--mu-travel-<class>`; `data-mu-motion="reduce"` on any ancestor forces the policy. SwiftUI: `.metalAnimation(.settle, value:)` or `MetalMotion.resolve(_:reduceMotion:)`, never `accessibilityReduceMotion` directly.
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

- The **cap** is a 32px-tall pill: 15px horizontal padding, SF Pro 12.5 medium, tracking −0.005em.
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

# Icons

`@unlocalhosted/metalui/icons` has 31 Soft Hardware glyphs: monoline + duotone on a 24×24 grid, with a 1.7 stroke. Each glyph has an authored **hover pose** (a reversible spring) and a **press one-shot**. Icons inherit `currentColor`. A static icon (`animate={false}`) at 16px or below uses a tuned small cut with a heavier stroke.

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
