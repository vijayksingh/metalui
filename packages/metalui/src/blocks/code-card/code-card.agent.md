# Code card

Code as a glass object. A custom block: `GlassFace` with a dark screen of numbered, tinted lines and a `Chip` tag. React: `CodeCard` (and `tintCode`) from `@unlocalhosted/metalui`. SwiftUI: `MetalCodeCard`.

## Use it for

- A fenced block of code placed on a canvas: `● CODE · SWIFT · 6 LINES` over the lines.

## Don't use it for

- Inline code in prose, or an editor. It shows code; it does not edit it.

## Anatomy

260 to 460 wide: `GlassFace` (bezel 6, radius 22; screen radius 16 with its glare). The screen pads 30 / 14 / 12 over a radial of `#26282C` into `#0F1011`. `Chip variant="glass"` with a code `Led` at 10 / 10. The code is 11 mono at 1.62, tracked -.01em, `#D7D8DB`; numbers 18 wide in `#48494E`; keywords `#E7A6D9`, types `#E7C98A`, strings `#9FE3BF`, comments `#6D6E73`, numbers `#9EC2FF`. At most 18 lines show; the tag counts all.

## Why custom

The tinted code is drawn by no component. The bezel, glare and tag are `GlassFace` and `Chip`.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `code` | `code:` | |
| `lang` | `lang:` | in the tag, uppercase |
| `maxLines` | `maxLines:` | default 18 |
| `tag` | `tag:` | the host's words; default CODE · LANG · N LINES |

`tintCode(code, maxLines)` returns the escaped, tinted HTML the card renders.

## Tokens

The code-card recipe (screen, code, tint, chip inset), the glass-face and chip recipes.
