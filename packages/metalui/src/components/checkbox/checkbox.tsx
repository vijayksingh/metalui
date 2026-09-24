'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';

/* ─────────────────────────────────────────────────────────
 * CHECKBOX, the dimple (the reference design's .dimple) on Base UI Checkbox
 *
 *   rest     a recessed well in the margin
 *   hover    the well darkens a step
 *   on       a dark pressed key; the white tick draws on (ease-out, 220 ms after a 40 ms beat)
 *   doing    a half-filled green square (announced as mixed)
 *   ghost    a hollow ring: a task that was inferred, not written; green ring on hover
 *   row      size="row": 14 with radius 5 and a smaller tick, in a list row (in flow, not the margin)
 * Styled with the theme's utilities (the checkbox recipe, its tick and doing drawings).
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

const SLOT = 'mu-dimple-slot inline-flex w-max h-max leading-none';
const WELL = 'mu-dimple relative box-border inline-block p-0 border-0 cursor-pointer tap-highlight-none transition-checkbox focus-visible:focus-ring data-disabled:opacity-checkbox-disabled data-disabled:cursor-default data-indeterminate:checkbox-doing';
const LOOKS = {
  margin: 'size-checkbox-size rounded-checkbox-radius recipe-checkbox hover:not-data-checked:recipe-checkbox-hover data-checked:recipe-checkbox-on',
  row: 'size-checkbox-row-size rounded-checkbox-row-radius recipe-checkbox hover:not-data-checked:recipe-checkbox-hover data-checked:recipe-checkbox-on',
  ghost: 'size-checkbox-ghost-size rounded-checkbox-ghost-radius recipe-checkbox-ghost hover:recipe-checkbox-ghost-hover',
};
const TICK = {
  margin: 'mu-dimple-tick checkbox-tick reduced-motion:animate-none',
  row: 'mu-dimple-tick checkbox-tick checkbox-tick-row reduced-motion:animate-none',
};

/**
 * A task's checkbox: a 16 pt well in the margin. Checked, it turns dark and the tick draws on.
 * Ticking it is a person's action: the host writes `[x]` into the text, with Undo.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ doing, ghost, size, className, ...props }, ref) {
  // The slot carries placement (the margin at −25): Base UI renders a hidden form input beside the
  // checkbox, and the slot keeps both out of the line's flow.
  const look = ghost ? LOOKS.ghost : LOOKS[size === 'row' ? 'row' : 'margin'];
  const tick = TICK[size === 'row' ? 'row' : 'margin'];
  return (
    <span className={className ? `${SLOT} ${className}` : SLOT}>
      <BaseCheckbox.Root ref={ref} indeterminate={doing && !props.checked ? true : undefined} data-ghost={ghost ? '' : undefined} data-size={size === 'row' ? 'row' : undefined} className={`${WELL} ${look}`} {...props}>
        <BaseCheckbox.Indicator render={(p, state) => (state.checked ? <span {...p} className={tick} /> : <span {...p} hidden />)} />
      </BaseCheckbox.Root>
    </span>
  );
});

/** The earlier name (kept for existing hosts). */
export const Dimple = Checkbox;
export type DimpleProps = CheckboxProps;
