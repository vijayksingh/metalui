'use client';

import * as React from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import './dimple.css';

/* ─────────────────────────────────────────────────────────
 * DIMPLE (the reference design's .dimple) on Base UI Checkbox
 *
 *   rest     a recessed well in the margin
 *   hover    the well darkens a step
 *   on       a dark pressed key; the white tick draws on (ease-out, 220 ms after a 40 ms beat)
 *   doing    a half-filled green square (announced as mixed)
 *   ghost    a hollow ring: a task that was inferred, not written; green ring on hover
 * Its look is the dimple recipe (tokens.json recipes.dimple → --mu-r-dimple-*).
 * ───────────────────────────────────────────────────────── */

export interface DimpleProps extends Omit<Checkbox.Root.Props, 'className' | 'indeterminate'> {
  /** The task is in progress: a half-filled green square (announced as mixed). */
  doing?: boolean;
  /** A task the recognizer inferred and nobody wrote: the hollow ghost dimple, hanging in the margin. */
  ghost?: boolean;
  className?: string;
}

/**
 * A task's checkbox: a 16 pt well in the margin. Checked, it turns dark and the tick draws on.
 * Ticking it is a person's action: the host writes `[x]` into the text, with Undo.
 */
export const Dimple = React.forwardRef<HTMLButtonElement, DimpleProps>(function Dimple({ doing, ghost, className, ...props }, ref) {
  // The slot carries placement (the margin at −25): Base UI renders a hidden form input beside the
  // checkbox, and the slot keeps both out of the line's flow.
  return (
    <span className={className ? `mu-dimple-slot ${className}` : 'mu-dimple-slot'}>
      <Checkbox.Root ref={ref} indeterminate={doing && !props.checked ? true : undefined} data-ghost={ghost ? '' : undefined} className="mu-dimple" {...props}>
        <Checkbox.Indicator render={(p, state) => (state.checked ? <span {...p} className="mu-dimple-tick" /> : <span {...p} hidden />)} />
      </Checkbox.Root>
    </span>
  );
});
