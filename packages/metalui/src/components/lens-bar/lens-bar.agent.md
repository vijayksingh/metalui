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
