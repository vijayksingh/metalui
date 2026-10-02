import { motionReduced, subscribeMotionPreference } from './reduced';

export interface RowLeaveOptions {
  /** Capture the list's layout before the row leaves. Called once, including under Reduce Motion. */
  onStart?: () => void;
}

const pending = new WeakMap<HTMLElement, () => void>();

/** Leave one nest down on the release spring, then let the host remove the row.
 * Reduced motion removes it at once. Return the cancellation for an effect cleanup.
 * Repeated calls while leaving share the original operation and never call its completion twice.
 */
export function leaveRow(element: HTMLElement | null, onLeft: () => void, options: RowLeaveOptions = {}): () => void {
  if (!element) { options.onStart?.(); onLeft(); return () => {}; }
  const current = pending.get(element);
  if (current) return current;
  const style = getComputedStyle(element);
  const durationText = style.getPropertyValue('--mu-spring-release-d').trim();
  const duration = parseFloat(durationText) * (durationText.endsWith('ms') ? 1 : 1000);
  const travel = parseFloat(style.getPropertyValue('--mu-motion-nest')) * (parseFloat(style.getPropertyValue('--mu-travel-settle')) || 0);
  let animation: Animation | undefined;
  let unsubscribe = () => {};
  let finished = false;
  const finish = (complete: boolean) => {
    if (finished) return;
    finished = true;
    unsubscribe();
    animation?.cancel();
    pending.delete(element);
    if (complete) onLeft();
  };
  const cancel = () => finish(false);
  pending.set(element, cancel);
  options.onStart?.();
  if (motionReduced(element) || !Number.isFinite(duration) || duration <= 0 || typeof element.animate !== 'function') {
    finish(true);
    return cancel;
  }
  animation = element.animate(
    [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${Number.isFinite(travel) ? travel : 0}px)` }],
    { duration, easing: style.getPropertyValue('--mu-spring-release').trim() || 'ease-out', fill: 'forwards', id: 'mu-row-leave' },
  );
  animation.onfinish = () => finish(true);
  animation.oncancel = () => finish(false);
  unsubscribe = subscribeMotionPreference(element, () => { if (motionReduced(element)) finish(true); });
  return cancel;
}
