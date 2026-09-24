# Past banner

Says the canvas is showing the past, and brings it back. A composition block. React: `PastBanner` from `@unlocalhosted/metalui`. SwiftUI: `MetalPastBanner`.

## Use it for

- While the time scrubber views a past moment: `MEMORY · viewing Tue 23 Sep · 14:10 · [Back to Now ⎋]`.

## Don't use it for

- Notifications, errors or any other status. It is the only chrome that changes in the past, and only then.

## Anatomy

`Surface material="graphite-plain" radius="pill"`, 34 tall at the top centre, padding 0 6 0 14, gap 10: `Label variant="dark"` MEMORY; `Label variant="on-graphite"` the moment; `Button cap="graphite"` Back to Now with a `Kbd` ⎋ 7 after it.

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

Layout: `--mu-pastbanner-*`. Look: the surface, label, button and kbd recipes. Motion: `--mu-spring-surface`, `--mu-motion-nest`. Swift: `MetalPastBannerMetrics`.
