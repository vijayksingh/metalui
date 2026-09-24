'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import './checkbox.css';

/* ─────────────────────────────────────────────────────────
 * CHECKBOX, the dimple (the reference design's .dimple) on Base UI Checkbox
 *
 *   rest     a recessed well in the margin
 *   hover    the well darkens a step
 *   on       a dark pressed key; the white tick draws on (ease-out, 220 ms after a 40 ms beat)
 *   doing    a half-filled green square (announced as mixed)
 *   ghost    a hollow ring: a task that was inferred, not written; green ring on hover
 *   row      size="row": 14 with radius 5 and a smaller tick, in a list row (in flow, not the margin)
 * Its look is the checkbox recipe (tokens.json recipes.checkbox → --mu-r-checkbox-*).
 * ───────────────────────────────────────────────────────── */

export interface CheckboxProps extends Omit<BaseCheckbox.Root.Props, 'className' | 'indeterminate'> {
  /** The task is in progress: a half-filled green square (announced as mixed). */
  doing?: boolean;
  /** A task the recognizer inferred and nobody wrote: the hollow ghost dimple, hanging in the margin. */
  ghost?: boolean;
  /** margin (16, the default) beside a block; row (14) at the start of a list row. */
  size?: 'margin' | 'row';
  className?: string;
}

/**
 * A task's checkbox: a 16 pt well in the margin. Checked, it turns dark and the tick draws on.
 * Ticking it is a person's action: the host writes `[x]` into the text, with Undo.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ doing, ghost, size, className, ...props }, ref) {
  // The slot carries placement (the margin at −25): Base UI renders a hidden form input beside the
  // checkbox, and the slot keeps both out of the line's flow.
  return (
    <span className={className ? `mu-dimple-slot ${className}` : 'mu-dimple-slot'}>
      <BaseCheckbox.Root ref={ref} indeterminate={doing && !props.checked ? true : undefined} data-ghost={ghost ? '' : undefined} data-size={size === 'row' ? 'row' : undefined} className="mu-dimple" {...props}>
        <BaseCheckbox.Indicator render={(p, state) => (state.checked ? <span {...p} className="mu-dimple-tick" /> : <span {...p} hidden />)} />
      </BaseCheckbox.Root>
    </span>
  );
});

/** The earlier name (kept for existing hosts). */
export const Dimple = Checkbox;
export type DimpleProps = CheckboxProps;
