import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* ── SPARK / the committed edit opens its acknowledgement ────
 * Verb, object   acknowledge an edit that the host has committed. Source call site: Mark's
 *                edit receipt. The glint is the receipt, never the operation or its trigger.
 * Invariant      four concave points, an enclosed centre, full ink at rest and under reduction.
 * Causal parts   a brief vertical contact narrows the centre; its release opens the points.
 * Neighbours     not Plus (curved closed waist), not Brightness (no lamp or rays), not Warning.
 * Forbidden      idle twinkling, a disappearing receipt, a success claim before the host commits.
 *
 *    0ms   the completed edit already has its whole receipt
 *  100ms   contact compresses the vertical pair to .68 of their reach
 *  180ms   contact releases; the part spring opens the points to exact rest
 * ────────────────────────────────────────────────────────── */
const opening = [pose(0, T(), ease.smooth), pose(100, T({ sy: .68 }), ease.strike),
  ...spring(180, { sy: .68 }, {}, 'part')];
export const act = {
  body: `<path class="f" style="--duo:.16" data-part="glint" d="M12 4.5C13 9.5 14.5 11 19.5 12C14.5 13 13 14.5 12 19.5C11 14.5 9.5 13 4.5 12C9.5 11 11 9.5 12 4.5Z"/>`,
  study: motion(opening.at(-1).at, 'The committed edit makes one contact, then its four-point receipt opens to rest.',
    ['Receipt', 'Contact', 'Open'], [actor('glint', '12px 12px', opening)]),
  shape: 'One closed four-point glint with concave cubic shoulders, cardinal reach7.5u and enclosed waist. Full-ink contour with .16 duotone centre. Compact cut keeps the same open waist and uses shared1.85 stroke;14px,16px and24px retain all four points.',
};
