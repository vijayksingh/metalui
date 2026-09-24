# Link card

A link as a glass object. A custom block: `GlassFace` with a screen tinted by the host, a `Chip` tag and a `Chip` action. React: `LinkCard` (and `linkHueDegrees`) from `@unlocalhosted/metalui`. SwiftUI: `MetalLinkCard`.

## Use it for

- A lone URL placed on a canvas: `figma.com` over `/FILE/POSTER-V3`, with `● LINK` and `OPEN ↗`.

## Don't use it for

- A link inside text: that is a `MarkUrl` host pill. A navigation control: a link or a button.

## Anatomy

250 wide: `GlassFace` (bezel 6, radius 22; screen radius 16 with its glare). The screen is 92 tall, padding 12 / 14, the host and path set at its foot; its tint is a radial of the host's hue into `#121316`. `Chip variant="glass"` with a link `Led` and LINK at 10 / 10; `Chip variant="glass-action"` OPEN ↗ at 10 from the top right. The host is 620 15 / 1.2 in `#EDEDEF`; the path 9.5 mono uppercase at .5 white, ellipsised.

## Why custom

The tinted screen and its type are drawn by no component. Everything else is `GlassFace` and `Chip`.

## Behaviour

- The card is not a click target. Only OPEN is: a real link, `target="_blank"`, `rel="noopener noreferrer"`.
- The host lifts it on hover (2, on part); the card itself does not move.

## API

| React | SwiftUI | Notes |
|---|---|---|
| `href` | `url:` | |
| `host`, `path` | `host:`, `path:` | default from the URL |
| `hue` | `hue:` | any colour; default the recipe's tint. The reference tints by host: `hsl(linkHueDegrees(host), 38%, 32%)` (the recipe's tint-saturation and tint-lightness) |
| `tag`, `openLabel` | `tag:`, `openLabel:` | the host's words (LINK, OPEN ↗) |

## Tokens

The link-card recipe (screen, host, path, chip inset), the glass-face and chip recipes.

## Preview

Pass `preview` (the backend's `GET /preview` result: `title`, `description`, `image`, `icon`) once it arrives. With a title, the title becomes the big line (2 lines at most); the host and path move into a small line with the site icon; the image sits behind the tinted glow, shaded to the bottom; the card grows from 92 to 128 on settle and the preview fades in. Never request or pass a preview for a secret block or while looking at the past. Without a title the card stays as it was: the preview is decoration, the URL is the text.
