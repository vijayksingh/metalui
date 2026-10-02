# Spinner and waiting hosts

React `Spinner`, `useWaiting`; Swift `MetalSpinner`, `MetalWaitingPresentation`, `MetalWaitingShape`. An unknown task's arc takes the host's ink and glyph diameter. No well and no fixed green. The shared waiting foundation defines 400ms arrival, 300ms minimum visibility and a useful explanation after 10s.

## Placement

- Action: Button `state`, with waiting/done/error labels and its retained glyph slot. It refuses another request while busy.
- Small item: a ring in its glyph/trailing slot; dim and disable only that item. Completion shows check and fades; failure offers Try again.
- Large item: matching skeletons in the item's actual image/text areas, operation words, real Progress when the count is known.
- Field: trailing ring replaces clear; typing remains possible. Abort or ignore stale searches before publishing results.
- Place: reserve the incoming structure with skeletons and a thin route Progress bar. No central spinner.
- Background: Led waiting/breathe plus words, leaving other actions enabled. Live is steady; error has words and retry.

## API

| React | Swift |
|---|---|
| `active` (default true), keep mounted | `active:` |
| `size`: regular16, small12, or host diameter | `size:`, `diameter:` |
| `label` | `label:` |
| `announce=false` inside a host with its own status | `announce: false` |
| `showDelay`, `minVisible` in ms | same names in seconds |
| `useWaiting(state, ref, timing)` returns `phase`, `long` | `MetalWaitingPresentation(state:…) { phase, long in … }` |

A host clock owns the whole displayed phase. Pass zero delay/minimum to a nested arc to avoid timing twice. The host owns actual requests, data, errors and progress; the clock never makes a request or invents a percentage.

## Motion, accessibility and lifecycle

`aria-busy` follows the real request immediately, even while the visual face stays unchanged. Announce start and outcome once in one polite host status. Do not live-announce percentages or every phase. A 10s explanation is optional and occurs once when useful. Preserve focus; don't disable a whole region to disable one row. Known work uses Progress as soon as the amount is available.

The arc turns linearly at 900ms/turn and inherits currentColor. Reduce Motion keeps it stationary and pulses opacity using the shared Progress breathing recipe. Offscreen/hidden tabs pause the arc; inactive hosts contain no arc animation. Native clocks cancel when the request changes or the view disappears; the arc pauses outside an active scene. Web shapes use the Skeleton recipe and stop their sheen under reduced motion. Native MetalWaitingShape uses the same field-well material and reserves the incoming geometry without a loop. Hosts must gate skeleton sheen with `--mu-waiting-play-state` while offscreen.

See `docs/WAITING.md` for research, each placement's storyboard and timing ownership. The docs page provides real host compositions, simulated network work, retry, counted batches, and DialKit latency/presentation controls.
