import { actor, ease, motion, pose, spring, T } from '../motion.mjs';

/* COPY / pull a paper copy off its fixed source
 * Verb/object: take this content to the clipboard. A tall front paper is taken from a fixed source.
 * Invariant: two sheets remain; source never moves and its clearance follows the front paper.
 * Payoff: the copied sheet lands one offset away. No plus (Duplicate), no clip (Paste).
 * Forbidden: a whole-stack pulse or motion that implies moving the source.
 *   0ms rest; 170ms impression; 310ms copy peels off; object spring lands exactly at rest.
 */
const TIMING = { impression:170, peel:310 };
const paper = [pose(0,T(),ease.smooth),pose(TIMING.impression,T({x:1.2,y:-1.2,sy:.96}),ease.strike),
  ...spring(TIMING.peel,{x:-.7,y:.7},{},'object')];
export const act = {
  defs: `<mask id="&-copy" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><rect data-part="paper" x="3.5" y="6" width="13.8" height="15.5" rx="2.8" fill="#000" stroke="none"/></mask>`,
  body: `<rect mask="url(#&-copy)" x="8.5" y="3.5" width="11" height="13" rx="2"/><rect data-part="paper" class="f" style="--duo:.1" x="5" y="7.5" width="11" height="13" rx="2"/>`,
  study: motion(paper.at(-1).at,'The front sheet takes an impression from its fixed source and peels off as a paper copy.', ['Impression','Peel','Land'], [actor('paper','10.5px 14px',paper)]),
  shape: 'Two tall paper sheets offset3.5, one tinted .1, with a moving clearance around the front sheet. Distinct from square plus cards (Duplicate) and the clipboard (Paste).',
};
