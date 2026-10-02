import { SPRINGS, type SpringName } from '../../../../packages/metalui/src/motion/springs.generated';

/** Physical hard stops clip sampled progress; they preserve the authored curve's timing. */
export const clampSpringCurve = (curve: string) => curve.replace(/-?\d*\.?\d+/g, value => String(Math.max(0, Math.min(1, Number(value)))));

/** The system's spring classes, for a DialKit select. */
export const SPRING_NAMES = Object.keys(SPRINGS) as SpringName[];

/**
 * CSS variables that play the `slot` spring (a class a component reads, like `part` or `settle`) with the
 * curve of the class `use`, stretched by `slow`. The curve is only redirected when `use` differs from
 * `slot`: `--mu-spring-part: var(--mu-spring-part)` would be a cycle, and the browser would drop it.
 */
export function springVars(slot: SpringName, use: SpringName, slow = 1): Record<string, string> {
  const vars: Record<string, string> = { [`--mu-spring-${slot}-d`]: `${SPRINGS[use].duration * slow}s` };
  if (use !== slot) vars[`--mu-spring-${slot}`] = `var(--mu-spring-${use})`;
  return vars;
}
