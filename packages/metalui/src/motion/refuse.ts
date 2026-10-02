/* ─────────────────────────────────────────────────────────
 * THE REFUSAL (a thing that will not do what was asked)
 *
 *    0 ms   the thing is one nest (6) aside
 *   ~38 ms  half way back; it swings past where it stands (the refusal spring rings, ζ 0.2)
 *  1.1 s    at rest where it was
 * Only the thing that refused moves. Reduce Motion: nothing moves (the refusal travel is zero).
 * direction −1 starts it a nest the other way (a slider pushed past its start moves left).
 * ───────────────────────────────────────────────────────── */

const ID = 'mu-refusal';

/** Shake `el` once on the refusal spring, a nest aside (to the right, or left with direction −1);
 *  restarts if it is already shaking. */
export function refuse(el: Element | null, direction: 1 | -1 = 1, axis: 'x' | 'y' = 'x') {
  if (!el || typeof (el as HTMLElement).animate !== 'function') return;
  const style = getComputedStyle(el);
  const reach = direction * parseFloat(style.getPropertyValue('--mu-motion-nest')) * (parseFloat(style.getPropertyValue('--mu-travel-refusal')) || 0);
  const duration = parseFloat(style.getPropertyValue('--mu-spring-refusal-d')) * 1000;
  if (!reach || !duration) return;
  el.getAnimations().filter((a) => a.id === ID).forEach((a) => a.cancel());
  const easing = style.getPropertyValue('--mu-spring-refusal').trim() || 'ease-out';
  (el as HTMLElement).animate([{ transform: `translate${axis === 'x' ? 'X' : 'Y'}(${reach}px)` }, { transform: `translate${axis === 'x' ? 'X' : 'Y'}(0)` }], { duration, easing, id: ID });
}
