import { actor, ease, light, motion, T, trace } from '../motion.mjs';

/* ── DOCUMENT / thumb the corner, the page turns, the lines come in ─
 * Verb, object   open a document to read it. The page is the document; its cut corner is where a
 *                thumb takes it; the lines are what it says.
 * Invariant      the page outline never moves (the stable reference); the corner flap only ever
 *                folds about the page's own diagonal edge, so the cut corner is always there.
 * Causal parts   cause: the corner folding down over the page (a dog-ear, about the diagonal).
 *                Receiver: the lines, which leave with the turned page and write in on the next.
 *                Payoff: the crease itself, held a beat, then the corner flicks back and lies flat.
 * Neighbours     not Copy (one sheet), not Calendar (no binding), not Region (no head rule).
 * Forbidden      the old stretch of the second line, a whole-page flip or spin, a pulse.
 *
 *    0ms  rest; the flap is edge-on along the cut corner, unseen
 *  200ms  the corner folds over onto the page, a touch past flat (−1.08)
 *  260ms  held on the crease; the lines erase right to left (180–300), the page has turned
 *  400ms  the corner flicks back out past its edge (+.28) … 500ms −.1 … 600ms flat and gone
 *  340ms  the first line writes on … 540ms
 *  440ms  the second line writes on … 620ms
 *  900ms  exact rest
 * ────────────────────────────────────────────────────────── */
const D = 900;
const flap = (s) => T({ r: 45, sy: s });
export const act = {
  body: `<path class="f" style="--duo:.1" d="M7.2 3.5h6.4l5 5v10a2 2 0 0 1-2 2H7.2a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path data-part="l1" pathLength="1" d="M8.6 12.4h6.8"/><path data-part="l2" pathLength="1" d="M8.6 15.8h4"/><path class="ac f" data-part="flap" opacity="0" style="--duo:.2" d="M12.564 6 19.636 6 16.1 2.464Z"/>`,
  study: motion(D, 'A thumb folds the corner down, the page turns, and the next page\'s lines write in.', ['Thumb', 'Turn', 'Read'], [
    // Drawn pre-rotated −45° about the diagonal's midpoint, so rotate(45) scale(1,s) folds it about
    // that diagonal: s = 1 is the missing corner, 0 edge-on on the cut, −1 folded onto the page.
    actor('flap', '16.1px 6px', [
      light(0, 0, flap(0), ease.smooth),
      light(40, 1, flap(-0.15), ease.strike),
      light(200, 1, flap(-1.08), ease.smooth),
      light(290, 1, flap(-1), ease.accelerate),
      light(400, 1, flap(0.28), ease.smooth),
      light(500, 1, flap(-0.1), ease.smooth),
      light(600, 0, flap(0)),
      light(D, 0, flap(0)),
    ]),
    actor('l1', '8.6px 12.4px', [trace(0, 1), trace(180, 1, ease.accelerate), trace(290, 0), trace(340, 0, ease.settle), trace(540, 1), trace(D, 1)]),
    actor('l2', '8.6px 15.8px', [trace(0, 1), trace(200, 1, ease.accelerate), trace(300, 0), trace(440, 0, ease.settle), trace(620, 1), trace(D, 1)]),
  ]),
  shape: 'Page 13.4 × 17 with a 5-unit cut corner, tinted .1; lines 6.8 and 4 on the 12.4 and 15.8 lines. Motion (study): a corner flap (accent, tinted .2) folds about the cut diagonal onto the page, holds the crease, flicks back out past the edge and lies flat; meanwhile the lines erase and write back in, first then second: the page has turned.',
};
