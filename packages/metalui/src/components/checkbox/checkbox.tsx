'use client';

import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { TickGlyph } from '../../icons/TickGlyph';

/* ─────────────────────────────────────────────────────────
 * CHECKBOX, the dimple (the reference design's .dimple) on Base UI Checkbox
 *
 *   rest     a recessed well in the margin
 *   hover    the well darkens a step
 *   on       a dark pressed key; a pen draws the check glyph's tick on it in white
 *   doing    a half-filled green square (announced as mixed)
 *   mixed    a group parent with some rows ticked: the dark key with a white dash (the tick laid flat)
 *   ghost    a hollow ring: a task that was inferred, not written; green ring on hover
 *   row      size="row": 14 with radius 5; the same tick at 14 (in flow at the start of a list row)
 *   pressed  the press points at the result (the radio's press language): unticked, the well takes the
 *            dark on look at once (self.press, 50 ms); release commits, dragging off cancels
 *
 * THE TICK, a pen stroke along the check glyph's own route (icons/src/acts/check.mjs), never a shape
 * that fades or wipes in. The drawn length is stroke-dashoffset on the route; the key's cascade
 * delay (the group) comes first.
 *    0 ms   release: the key is dark (it went dark at press)
 *   40 ms   tick.delay, a beat: the pen touches down at the short leg's start
 *  130 ms   tick.down (90), easing into the corner (ease-press): the short leg is drawn
 *  160 ms   tick.pace (30), a dwell at the corner: the pen changes direction
 *  160 ms+  the long leg up and out on the part spring; the tail runs a little past the tip
 *           (the spring's overshoot, ~9 %) and comes back to it
 *  760 ms   exact rest (the part spring's 600 ms)
 * UNTICK, the same route backwards, then the key lets go.
 *    0 ms   release: the key stays dark
 *  ~95 ms   the tail withdraws to the corner (tick.withdraw, 140, shared by the legs' lengths, ease-press)
 *  125 ms   tick.pace at the corner
 *  170 ms   the short leg withdraws to the pen's start; the tick is gone
 *  170 ms+  the key goes light (self.fade, 160)
 * MIXED, the dash (the tick laid flat across its own width, the corner at the same share of the way).
 *   draws  left to right in one stroke on the part spring (the pen only dwells where it turns)
 *   → on   the dash bends into the tick on the settle spring: the same stroke, its corner dropping
 *          and its tail rising; nothing is swapped. On → mixed bends it back.
 *   → off  it withdraws right to left, then the key goes light
 * Interrupted, the next stroke starts from the length (or the bend) on screen.
 * Reduce Motion (--mu-travel-part 0): the tick or dash is whole, or gone, at once.
 * Styled with the theme's utilities (the checkbox recipe, its tick and doing drawings).
 * ───────────────────────────────────────────────────────── */

export interface CheckboxProps extends Omit<BaseCheckbox.Root.Props, 'className' | 'indeterminate'> {
  /** The task is in progress: a half-filled green square (announced as mixed). */
  doing?: boolean;
  /** A select-all or parent with some children checked: the shared dash on the dark key. */
  mixed?: boolean;
  /** A task the recognizer inferred and nobody wrote: the hollow ghost dimple, hanging in the margin. */
  ghost?: boolean;
  /** margin (16, the default) beside a block; row (14) at the start of a list row. */
  size?: 'margin' | 'row';
  className?: string;
}

const SLOT = 'mu-dimple-slot inline-flex w-max h-max leading-none';
const WELL = 'mu-dimple relative box-border inline-block p-0 border-0 cursor-pointer tap-highlight-none transition-checkbox focus-visible:focus-ring data-disabled:opacity-checkbox-disabled data-disabled:cursor-default data-doing:checkbox-doing';
const PRESS = 'not-data-disabled:active:duration-checkbox-press not-data-disabled:not-data-checked:active:recipe-checkbox-on';
// The key is dark while it is ticked, while a mixed parent shows its dash, and while a tick is still withdrawing.
const KEY = 'recipe-checkbox pointer-hover:not-data-checked:not-data-inked:recipe-checkbox-hover data-checked:recipe-checkbox-on data-indeterminate:not-data-doing:recipe-checkbox-on data-inked:recipe-checkbox-on';
const LOOKS = {
  margin: `size-checkbox-size rounded-checkbox-radius ${KEY} ${PRESS}`,
  row: `size-checkbox-row-size rounded-checkbox-row-radius ${KEY} ${PRESS}`,
  ghost: 'size-checkbox-ghost-size rounded-checkbox-ghost-radius recipe-checkbox-ghost pointer-hover:recipe-checkbox-ghost-hover',
};
const TICK_CLASS = 'mu-dimple-tick checkbox-tick';

/**
 * A task's checkbox: a 16 pt well in the margin. Checked, it turns dark and a pen draws the tick on.
 * Ticking it is a person's action: the host writes `[x]` into the text, with Undo.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox({ doing, mixed, ghost, size, className, ...props }, ref) {
  // The slot carries placement (the margin at −25): Base UI renders a hidden form input beside the
  // checkbox, and the slot keeps both out of the line's flow.
  const look = ghost ? LOOKS.ghost : LOOKS[size === 'row' ? 'row' : 'margin'];
  // The key stays dark until the pen has taken the tick away.
  const [inked, setInked] = React.useState(false);
  return (
    <span className={className ? `${SLOT} ${className}` : SLOT}>
      <BaseCheckbox.Root ref={ref} indeterminate={(mixed || doing) && !props.checked ? true : undefined} data-ghost={ghost ? '' : undefined} data-doing={doing && !props.checked ? '' : undefined} data-inked={inked ? '' : undefined} data-size={size === 'row' ? 'row' : undefined} className={`${WELL} ${look}`} {...props}>
        <BaseCheckbox.Indicator keepMounted render={(p, state) => (
          <TickGlyph {...(p as unknown as React.SVGProps<SVGSVGElement>)} className={TICK_CLASS} mark={state.checked ? 'tick' : state.indeterminate && !doing ? 'dash' : null} onInk={setInked} />
        )} />
      </BaseCheckbox.Root>
    </span>
  );
});

/** The earlier name (kept for existing hosts). */
export const Dimple = Checkbox;
export type DimpleProps = CheckboxProps;
