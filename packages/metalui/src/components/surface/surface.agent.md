# Surface

A raised plate or card from a material. React: `Surface` from `@unlocalhosted/metalui`. SwiftUI: `MetalSurface`.

## Use it for

- Anything that floats or is raised: pills, cards, panels, popovers, strips, banners, readouts.

## Don't use it for

- Sunk fields and tracks: use `Well`. Pressable caps: use `Button` or `IconButton`.

## Props

- `material`: `raise` (a card), `raise-lite` (a lighter card), `raise-sm` (a pill), `frost` (a floating bar), `plate` (a palette), `panel` (a gathered panel), `pop` (a menu), `tip` (a hover label), `lens` (a pinned query plate), `graphite` (dark chrome over a blurred, saturated backdrop), `graphite-plain` (the same with no backdrop: a banner, a tip), `graphite-strip` (the same over a plain blur: a tool strip), `graphite-deep` (a readout), `graphite-glass` (a notice).
- `radius`: `pill`, `hero` (30), `card` (24), `plate` (18), `strip` (16), `region` (26), `tip` (11), `row` (12).
- `as`: the element (default `div`).

## Behaviour

- No role, no focus: it is a surface. Give it the role its content needs (`role="dialog"`, `role="status"`).
- Reduce Transparency: frosted materials turn opaque and lose their backdrop blur.
