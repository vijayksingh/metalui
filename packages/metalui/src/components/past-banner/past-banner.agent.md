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
