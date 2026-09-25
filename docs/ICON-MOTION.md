# Icon motion: one act per icon

Every product icon performs its own act: a short timeline in which its parts do what the icon means. The format and the rules come from the owner's Dither Icons (`dither-icons/docs/MOTION-PRINCIPLES.md`, MOT-01 to MOT-16), adapted for Soft Hardware monoline and duotone. Where this page and a component's needs disagree, this page wins. Changing it is an owner decision.

This replaces the old model (a held hover pose plus a press blip, written as CSS). Icons without a study still play that model until they are converted, one at a time.

## The format

The source is data, in `packages/metalui/icons/src/icons.mjs`, with helpers from `motion.mjs`:

```js
study: motion(900, 'The pointer draws back, clicks its tip down, and a ring opens where it lands.',
  ['Draw back', 'Click', 'Release'], [
  actor('cursor', '6.1px 4.9px', [
    pose(0, 'translate(0px,0px) rotate(0deg) scale(1,1)', ease.accelerate),
    pose(150, 'translate(1.5px,1.5px) rotate(5deg) scale(1,1)', ease.strike),
    // …
    pose(900, 'translate(0px,0px) rotate(0deg) scale(1,1)'),
  ]),
  actor('click', '6.1px 4.9px', [light(0, 0, 'scale(.3)'), /* … */ light(900, 0, 'scale(.3)')]),
]),
```

- **Study:** one clock (`duration`, usually 700–1400 ms), a one-line `caption`, and three `stages`: the storyboard's beats.
- **Track (actor):** one moving part, named by `data-part` in the body, with its pivot (`origin`) in grid units.
- **Frame:** a time `at` in ms, and any of:
  - `transform` (translate, rotate, scale);
  - `opacity`;
  - `draw` (how much of the stroke is drawn, 0–1; its paths carry `pathLength="1"`);
  - `easing` (the curve leaving the frame).
- **Helpers:**
  - `pose(at, transform, easing)`
  - `light(at, opacity, transform)` for accents
  - `trace(at, draw, easing)` for draw-on
  - named curves in `ease`: `settle`, `smooth`, `accelerate`, `strike`. An icon may name its own.
- **Allowed properties:** transform, opacity and draw-on, nothing else. Path reshaping (`d`), colour and stroke width don't animate: SwiftUI can't play them from the same data.
- **Accents:** one self-closing element with class `ac`, `opacity="0"` in the body, and a `data-part`. The static glyph drops them.

One source, three players:

| Player | Where | Lifecycle |
|---|---|---|
| Web Animations | React `Icon` (`useActPlayback`) | plays once on pointer enter (not touch), focus-visible or click; finishes after the pointer leaves; ignores triggers mid-act |
| CSS keyframes | standalone `svg-animated/*.svg`, and a page before hydration | plays while hovered or focused (or with `data-state="play"`); leaving cuts it short |
| SwiftUI | `MetalIcon` (next layer) | the same tracks through `KeyframeAnimator` |

Reduced motion plays nothing, and the rest glyph is complete on its own.

The build (`scripts/build-icons.mjs`) checks every study and fails when:
- a track doesn't bind to exactly one `data-part`;
- frames don't start at 0 and end at the duration, or aren't in time order;
- a part doesn't return exactly to where it started;
- an accent isn't hidden at the start and the end;
- a property isn't transform, opacity or draw.

## The rules

These are Dither's, with its IDs, read for Soft Hardware:

| ID | Rule | Here |
|---|---|---|
| MOT-01 | Preserve identity | The glyph is recognisable at every frame. A plus never passes through ×; a check never becomes a different mark. |
| MOT-02 | Start with a verb | Write the object's action before keyframes: click, bind, copy, fold, pour. |
| MOT-03 | Parts have a relationship | A secondary part answers the primary with delay, direction or resistance. Rigid objects move as one; nothing else does. |
| MOT-04 | Choreograph energy | Prepare briefly, perform, dissipate. Most of the time belongs to the action and its recovery. |
| MOT-05 | Keep a stable reference | A tray, frame, baseline or anchor stays put so the moving part reads. Arrows keep their direction. |
| MOT-06 | Scale motion to the object | Moves are big enough to read at 16–24 px (a grid unit or more, several degrees), with restrained overshoot. No generic wiggle, spin, float or whole-icon bounce. |
| MOT-07 | Material belongs to the object | The duotone fill moves with its contour. Occluders (clearances, masks) share the track of the part they cut. |
| MOT-08 | Accents explain a response | A ring follows a click; a glint follows a catch. Hidden at the start and end, subordinate, never needed for recognition. |
| MOT-09 | Finish the gesture | Leaving or blurring doesn't cut the React act short; repeated triggers don't stack or restart it. |
| MOT-10 | Return exactly | Every part ends at its rest transform and opacity. |
| MOT-11 | Respect input and stillness | Hover, focus and click work; touch plays on tap. Reduced motion, `animate={false}` and unmount cancel. |
| MOT-12 | One source of timing | The same tracks drive web, SVG export and SwiftUI. |
| MOT-13 | Verify the whole sequence | Look at rest, anticipation, action, recovery and rest, at real size and speed, then frame by frame. |
| MOT-14 | Don't simulate app success | The act is a gesture, not a claim that something was saved, sent or deleted. |
| MOT-15 | Review meaning per icon | Each icon gets its own card and storyboard. A shared preset is not a study. |
| MOT-16 | A legible climax | The strongest beat gets a brief local response at its cause, peaking just after the action and decaying on its own. A smooth gesture with no payoff is unfinished. |

Lessons already paid for:

- **Shrinking or growing a glyph along its axes isn't an action.** Dither's owner rejected it for Close and Plus. Close crosses out with ordered diagonal strokes; Plus inserts its upright into a waiting crossbar.
- **The concept test:** remove every accent. If the primary action no longer describes the object, the concept is wrong. Don't add decoration.
- **Sub-pixel poses read as nothing.** A 7° tilt or a 0.8-unit nudge at 16 px is invisible. That's the failure this format replaces.

## The card

Every icon's entry opens with its card, as a comment above it (see `select`):

```
/* ── NAME / the verb in a phrase ─────────────────────────────
 * Verb, object   what the user does, and to what
 * Invariant      what holds on every frame
 * Causal parts   cause → receiver → payoff (the accent, if any)
 * Neighbours     the icons it must not be mistaken for, and why not
 * Forbidden      the generic performances this must not become
 *
 *    0ms  rest
 *   …ms   one line per beat, with the numbers
 *   Nms   exact rest
 * ────────────────────────────────────────────────────────── */
```

## Process, one icon at a time

1. Write the card. If you can't say why a part moves or what wrong action it would suggest, stop there.
2. Name the parts in the body (`data-part`) and set their pivots. Keep the drawn contour when it's sound.
3. Write the timeline with the icon's own numbers. Reuse the engine and the curves, never another icon's performance.
4. Film it frame by frame in bone and graphite (`svg-animated/<name>.svg` with `data-state="play"`, paused at each time), and look at it at 16 and 24 px.
5. Check the end is at rest, re-triggers, reduced motion and the SVG export. Commit that one icon, then start the next.
