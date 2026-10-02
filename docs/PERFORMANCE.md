# Performance rules

MetalUI is fast by design: a page at rest costs nothing, motion runs on the compositor, and one switch turns the expensive effects off. A laptop battery pays for work done while nobody is looking, so the rules are about what runs when nothing is happening.

Each rule says how it is enforced. A rule with no check is a promise, not a rule.

## At rest

1. **Nothing runs at rest.** No frame loop, interval or infinite animation on a page that is idle. A loop is allowed only while its state is active (a spinner while loading, a lamp while waiting) and stops when the state ends.
   *Enforced:* `npm run bench:gate` fails on a new running infinite animation, or more layouts or style recalcs per second at rest than `bench/budgets.json` allows.
2. **Everything that ticks sleeps when it cannot be seen.** Hidden tab or off-screen: the clock stops, and catches up when it wakes. Use `useAwake` (`motion/awake.ts`); a frame loop that must keep a spring honest listens to `visibilitychange` itself.
   *Enforced:* `e2e/clocks-sleep.spec.ts` (Weather, Day, LED), `e2e/connector-idle.spec.ts`.
3. **A settled thing asks for no frames.** An elastic connector at rest requests none; it wakes when its ends move.
   *Enforced:* `e2e/connector-idle.spec.ts`.

## While moving

4. **Only `transform` and `opacity` animate.** Width, height, top, left, margin, padding, grid sizes and font size force layout on every frame; shadows, backgrounds, filters and colours force paint. A hover shadow belongs on a pseudo-element faded by opacity.
   *Enforced:* `npm run lint:transitions` (part of `npm run check`) fails on a new transition of a non-composited property. Existing ones are listed in `scripts/lint-transitions.allow.json` and only ever shrink: fix one, then `node scripts/lint-transitions.mjs --ratchet`.
5. **No layout reads in pointer, scroll or resize handlers.** Measure on pointer down, write custom properties directly, commit React state on release.
6. **`will-change` only while a motion is in flight**, never static. Static promotion holds GPU memory per element.

## Blur and shadow

7. **A backdrop blur is re-rendered every frame anything moves under it.** Use it on small, settled surfaces. Every frosted surface has an opaque twin.
8. **One switch.** `prefers-reduced-transparency`, `prefers-reduced-data` or `data-mu-power="low"` on any ancestor turns every frosted surface opaque and drops its blur. An app sets `data-mu-power="low"` from Save-Data or a low battery.
   *Enforced:* `e2e/low-power.spec.ts`.
9. **Shadow stacks stay short.** Four layers at rest is plenty; more is a pre-rendered asset.

## What ships

10. **One import ships one component.** Component factories are marked pure in the build (`packages/metalui/tsup.config.ts`), so a bundler drops what an app does not use.
    *Enforced:* `npm run bench:bundle:gate` holds a single-component import under 40 KB gzip.
11. **Icons are imported by name**, never as the whole catalog. CSS is imported in entry files, not inside components.
12. **SwiftUI follows the same rules.** No clock that runs at rest, `TimelineView` always has a `paused:` that includes `scenePhase`, shadow stacks render through `drawingGroup` or a cached image, no `.saturation` on a material, Low Power Mode drops the material.

## Measuring

Numbers come from the benchmark harness, run on a separate machine, never a laptop.

| Command | What it does |
|---|---|
| `npm run bench:bundle` | bytes per file (raw, gzip, brotli) and what each export costs a consumer |
| `npm run bench:bundle:gate` | fails if a single-component import grows past its ceiling |
| `npm run bench:web` | idle counters for every docs page (`BENCH_PAGES=all`), on the built site |
| `npm run bench:idle-report` | pages that do more than the docs chrome at rest |
| `npm run bench:gate` | fails on a new loop, or more layouts and style recalcs than the budget |
| `bench/run.sh` | the web run, pinned to its own cores, with host load recorded; a busy host marks the run invalid |

Counters (animations, layouts per second, style recalcs per second, bytes) hold on any machine. Durations (CPU milliseconds per second) hold only when `bench/results/env.json` says the run was valid. These are proxies for power: they measure work, not joules.

### Native scope policy

SwiftUI reads `@MetalMotionPreference` for the effective policy instead of reading the OS flag in each component. `.metalReduceMotion(true)` adds a reduced-motion scope, including the shared animation modifier, glyph acts, drawing glyphs and component interactions. The policy ORs the OS preference with every ancestor scope: an inner `false` cannot re-enable motion. A dynamic scope change cancels active glyph hold/act/cancel clocks; returning to full motion starts no new act until the next interaction. The default remains the OS preference.

The real app fixture `e2e/native/motion-policy-proof.swift` compares an outside glyph with a scoped glyph receiving the same hold. It toggles reduction during the hold, checks an inner `false` stays reduced and restores the scope without resuming a cancelled clock.
