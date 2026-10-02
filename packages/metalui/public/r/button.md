# Button

A press-in pill button. React: `Button` from `@unlocalhosted/metalui`, built on Base UI `Button`. SwiftUI: `MetalButton`, or `.buttonStyle(MetalButtonStyle(cap:))`.

## Use it for

- An action that happens right away when the user activates it: Save, New Canvas, Cancel, Delete, Export.
- A dialog footer, form submit, or row action that needs a visible, labelled control.

## Don't use it for

- Navigation to another page. Use a link.
- On/off or latched tool state. Use `Toggle` / `ToolButton`, which carry the pressed state and LED.
- Icon-only toolbar controls. Use `ToolButton` inside `Toolbar`.

## Anatomy

- The **cap** is a 32px-tall pill: 15px horizontal padding, Geist 12.5 medium (the `ui` type role), tracking −0.005em.
- The **icon** (`icon` prop) leads the label: 16 in the 32 cap, 6 before the label; 14 and 7 in the compact cap. Link, graphite and strip caps use the compact 14 glyph. The cap sizes it, so pass the glyph without a size.
- The **label** is text: a verb, or a verb and its object.
- **Compact** (`size="compact"`, including primary and destructive): 26 tall, 11 padding, 12 pt, a 14 glyph 7 before the label, the button fill on `raise-sm`, ink2 until hover. The canvas pills: "seed a sample day", "lenses ⌘K", a lens row's "Open".
- The **press** moves the cap down 1px (50 ms, linear), and its shadow collapses into an inner well. The release rides the `release` spring (stiffness 500, damping 40; half 71ms, near-settled 178ms). Shadows and fills cross-fade over 180ms.

## Caps that set their own size

- `link`: a mono word in green, 9 pt, tracked 0.1em, no cap and no press (READ ALL beside a readout).
- `graphite`: a 24 tall quiet light cap on graphite chrome (a banner's Back to now).
- `strip` / `strip-danger`: a 28 tall flat cap (radius 11) in a graphite tool strip; lights on hover, sinks into a dark well on press; focus is a 1.5 green ring. `strip-danger` is red.

## API

| React prop | SwiftUI | Values | Default |
|---|---|---|---|
| `cap` | `cap:` | `standard`, `primary`, `destructive`, `link`, `graphite`, `strip`, `strip-danger` | `standard` |
| `size` | `size:` | `default` (32), `compact` (26); ignored by the link, graphite and strip caps | `default` |
| `icon` | `icon:` (a `MetalIconName`), or the `icon:` view builder | a glyph element, such as `<ShareIcon />` or `<MorphIcon name=… />`; leads the label, sized by the cap (16, compact 14) | – |
| `hold` | `hold:` | boolean, or custom milliseconds (React); destructive cap only | `false` |
| `disabled` | `.disabled(_:)` | boolean | `false` |
| `focusableWhenDisabled` | – | boolean | `false` |
| `render` | – | Base UI render prop, for `<a>` or custom elements (set `nativeButton={false}`) | – |
| any `<button>` attribute | – | `type`, `onClick`, `aria-*` | – |

```tsx
import { Button } from '@unlocalhosted/metalui';
import { ShareIcon, TrashIcon } from '@unlocalhosted/metalui/icons';
import '@unlocalhosted/metalui/styles.css';

<Button cap="primary" onClick={create}>New Canvas</Button>
<Button onClick={close}>Cancel</Button>
<Button size="compact" onClick={seed}>seed a sample day</Button>
<Button icon={<ShareIcon />} onClick={share}>Share</Button>
<Button cap="destructive" icon={<TrashIcon />} onClick={remove}>Delete</Button>
```

```swift
import MetalUI

MetalButton("New Canvas", cap: .primary) { create() }
MetalButton("Cancel") { close() }
MetalButton("seed a sample day", size: .compact) { seed() }
MetalButton("Share", icon: .share) { share() }
MetalButton("Delete", icon: .trash, cap: .destructive) { remove() }
```

## Rules

- Use at most **one** `primary` or `destructive` cap per group. Everything else is `standard`.
- `destructive` is only for actions that remove or discard data. Pair it with confirmation when the action can't be undone.
- The label is a verb, or a verb + object, in title case. The button text itself says what happens.
- **An action names itself with a glyph and a verb.** A button that does something (save, share, export, delete, send, attach, copy, new) passes its glyph as `icon`: `<Button icon={<ShareIcon />}>Share</Button>`. A plain choice (Cancel, Done, Close as a word, OK) stays words only. Use the glyph whose act is that verb (`share`, `trash` or `send-away`, `duplicate`, `plus`, `pen` for Rename); don't borrow one that means something else.
- Pass the glyph as `icon`, not as a child, and don't give it a size: the cap sets it (16, compact 14). Children still take a glyph for compatibility, but `icon` is the documented slot. The button is the icon's trigger: it plays its act when the button is hovered, focused from the keyboard or clicked, so don't wire up animation yourself.
- Don't restyle the cap with custom backgrounds, borders, or shadows. Colorway comes from `data-mu-colorway` (`bone` | `graphite`) on any ancestor. When no ancestor sets it, `prefers-color-scheme` decides.
- Don't signal success with the press motion. Show the real result: a toast, a state change, or an error.
- **A state change of the same control morphs, never swaps** (Transitions T1–T3, `docs/MORPH.md`). When one control's meaning changes (Copy → Copied, Pin → Unpin, Collapse → Expand), its glyph morphs with `MorphIcon` (from `@unlocalhosted/metalui/icons`) on the settle spring, and its label turns on the drum with `SwapText` (from `@unlocalhosted/metalui`), together: `<Button icon={<MorphIcon name={copied ? 'check' : 'paste'} />}><SwapText value={copied ? 'Copied' : 'Copy'} /></Button>`. The width settles to the new label. Only a glyph outside the morph family (a solid character glyph) turns on the drum with `SwapIcon` instead.

## Accessibility

- It renders a native `<button>`. Enter and Space activate it, and it takes part in form submission. Base UI handles the disabled state and `focusableWhenDisabled`.
- The focus ring is a 2px `--mu-focus` outline at a 2px offset, shown only for keyboard focus (`:focus-visible`).
- An icon-only Button needs `aria-label`. Icons inside labelled buttons are decorative (`aria-hidden`).
- Disabled buttons render at 40% opacity and don't play their icon motion.
- Under reduced motion, transitions are instant. The 1px press travel stays, because it is feedback, not decoration.

## Tokens

`--mu-button-*` (sizes, press, fade, focus), `--mu-raise-sm` (compact), `--mu-btn-bg`, `--mu-btn-sh`, `--mu-pressed-bg`, `--mu-pressed-sh`, `--mu-primary-*`, `--mu-destructive-*`, `--mu-spring-release`, `--mu-focus`. Swift: `MetalButtonMetrics`, `MetalTokens.<colorway>.btnBg/btnSh/pressedBg/pressedSh`, `MetalCaps.primary/destructive`, `MetalSprings.release`.

## Irreversible confirmation

`<Button cap="destructive" hold icon={<TrashIcon />} onClick={removeForever}>Delete forever</Button>` requires an 800ms hold. Pointer, Space and Enter share one clock. Release early, leave the cap, blur, Escape, a hidden tab or disabling the key cancels without invoking the action. A short tap reveals “Hold to confirm”; the button always has that accessible description. Repeated keydown does not restart the clock. Completion invokes one click and gives one material-depth settle on the object spring.

The darker red fill scales from the leading edge with linear time; release drains it on the release spring. It remains informational under Reduce Motion, while the completion settle and trash lid motion stop. Trash's authored act pauses at its open-lid checkpoint: preparation stretches over the hold, cancellation reverses it, confirmation continues the same act through closure. No frame loop runs at rest.

Use hold only for permanent loss, inside a question naming the consequence. Undoable deletion stays a plain press. Hosts must offer `hold={false}` for pointers that cannot hold; the Alert dialog page demonstrates that setting. Swift offers the same timing and fill through `MetalButton(..., hold: true)`, long press and held Space/Return, plus an accessible Confirm action.

A custom rendered element must forward Button's ref and input events. Without loaded tokens an unspecified hold refuses activation rather than firing immediately. An async host owns completion/error reporting; holding is confirmation, not evidence of success.
