'use client';

import * as React from 'react';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';

/* ─────────────────────────────────────────────────────────
 * RADIO GROUP, one choice from a short list, on Base UI RadioGroup and Radio
 *
 * Each option is the checkbox's well made round, beside its label; the whole row is the hit area.
 *
 *   rest      a recessed round well
 *   hover     the well darkens a step (unchosen only)
 *   pressed   the well turns to the on look at once (press time): the key is already going down
 *   chosen    releasing latches a white pip in on the part spring; the pip of the one chosen
 *             before drops out on the release spring in the same frame (the preset-button interlock)
 *   cancel    press and drag off: nothing latches and the well fades back
 *   focus     the green ring on the well (keyboard only); arrows move and choose, with no press
 *   invalid   a red hairline ring (inside a Base UI Field marked invalid)
 *   disabled  the whole row at 40 %, no hover, no press
 * Reduce Motion: the pip is there or not at once; the well colour still fades.
 * The well's look is the checkbox recipe; the radio recipe adds the pip, the row and the motion.
 * ───────────────────────────────────────────────────────── */

export interface RadioGroupProps extends Omit<BaseRadioGroup.Props, 'className'> {
  /** vertical (the default) stacks the options; horizontal sets them in a line. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export interface RadioProps extends Omit<BaseRadio.Root.Props, 'className' | 'children' | 'render'> {
  /** The option's label, beside the well. */
  children?: React.ReactNode;
  className?: string;
}

const GROUP = {
  vertical: 'flex flex-col gap-radio-group-gap',
  horizontal: 'flex flex-row flex-wrap gap-x-radio-group-gap-across gap-y-radio-group-gap',
};
const ROW = 'mu-radio group/radio inline-flex items-center gap-radio-row-gap min-h-radio-row-height type-ui text-ink cursor-pointer tap-highlight-none select-none has-data-disabled:cursor-default has-data-disabled:opacity-radio-disabled';
const WELL = [
  'mu-radio-well relative box-border inline-flex flex-none items-center justify-center size-radio-size rounded-full p-0 border-0 outline-none',
  'recipe-checkbox transition-radio focus-visible:focus-ring',
  'data-checked:recipe-checkbox-on',
  // Hover and press come from the whole row, and only while the option can still be chosen.
  'not-data-checked:not-data-disabled:not-data-readonly:group-pointer-hover/radio:recipe-checkbox-hover',
  'not-data-checked:not-data-disabled:not-data-readonly:group-active/radio:recipe-checkbox-on not-data-checked:not-data-disabled:not-data-readonly:group-active/radio:duration-radio-press',
  'data-invalid:not-data-checked:invalid-ring',
].join(' ');
const PIP = 'mu-radio-pip radio-pip data-checked:radio-pip-on reduced-motion:transition-none';

/** One choice from a short list. Wrap `Radio` options; `value` and `onValueChange` hold the choice. */
function Root({ orientation = 'vertical', className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup data-orientation={orientation} className={className ? `${GROUP[orientation]} ${className}` : GROUP[orientation]} {...props} />;
}

/** One option: the round well and its label. The label is part of the hit area. */
const Item = React.forwardRef<HTMLSpanElement, RadioProps>(function Radio({ children, className, ...props }, ref) {
  return (
    <label className={className ? `${ROW} ${className}` : ROW}>
      <BaseRadio.Root ref={ref} className={WELL} {...props}>
        <BaseRadio.Indicator keepMounted className={PIP} />
      </BaseRadio.Root>
      {children != null && <span className="mu-radio-label">{children}</span>}
    </label>
  );
});

export const RadioGroup = Object.assign(Root, { Item, Root });
export const Radio = Item;
