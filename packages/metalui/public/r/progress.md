# Progress

Task amount and state. React `Progress` wraps Base UI Progress; Swift `MetalProgress` renders the same switch material and progress recipe. The host reports the amount and owns pause, resume, retry, cancellation and reset.

## Use

Use for an export, upload or sync with a known amount or honest unknown work (`value={null}`). Use Spinner for a short action wait, and a meter for a measurement unrelated to a task. Label what is happening. The control receives no focus; the host announces start/end state changes separately.

## Contract

React `value`, `min` (0), `max` (100) are clamped and normalized for every shape. Swift uses `value: Double?` and `total:`. State defaults to running, or complete at the maximum. Explicit states: `idle`, `running`, `paused`, `failed`, `cancelled`, `complete`.

- Running: known fill follows the amount on settle, with no predicted progress. Unknown work sweeps only while running and on screen.
- Paused: amount holds and fill dims. The host provides Resume.
- Failed: amount holds in invalid ink, with sync-error in the head. The host provides Try again.
- Cancelled or idle: when the host resets the amount to zero, the fill drains on release and the value turns back on the drum.
- Complete: finish the fill first, then show check and `completeLabel` (otherwise keep the supplied task label).

`shape="bar" | "slim" | "ring" | "segmented" | "buffered"`; `size="compact" | "regular"`. Slim has no head or detail: supply `aria-label`. Segmented is for known steps (`segments`, Swift `steps:`); unknown segmented work falls back to a single unknown bar. `buffer` uses the same units and is clamped ahead of the primary amount. Ring geometry changes only when the host reports an amount; it does not rotate for known work.

`detail` can show items done or time left; it uses tabular meta type. `showValue` turns the formatted amount on the drum. React `format` uses Base UI's Intl formatting. Give string details or custom `aria-valuetext` so the amount, state and detail remain available independently of the glyph.

## Composition

`Progress.Root`, `Progress.Label`, `Progress.Value`, `Progress.Track` expose Base UI's naming/value parts. Track obtains the same normalized shape/state contract. Swift `MetalProgress(label, value:, total:, state:, shape:, size:, steps:, buffer:, detail:, completeLabel:, showValue:)` exposes the same task states.

## Motion and lifecycle

Only transform and opacity animate for bar fills and unknown waits. Known ring geometry changes on reported amount. Reset uses release; arrival uses settle. Unknown web waits pause off screen, on inactive states, and under document removal; native waits exist only while mounted and running. Both system and scoped/site reduced motion remove travel: known amounts snap; unknown work breathes in place. A pause freezes the wait. No task clock lives inside Progress.

## Accessibility

React retains Base UI's `progressbar`, label association, clamped amount and missing numeric amount for unknown work. State and details appear in `aria-valuetext`; running and finishing set `aria-busy`. Swift supplies task label and amount/state/detail as one spoken value. A completion announcement belongs to the host, once, not every percentage update.
