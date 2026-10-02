'use client';

import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

/**
 * Which cap the button wears. `standard` is soft-touch in the colorway,
 * `primary` is the dark cap, and `destructive` is the one red cap. Use at
 * most one primary or destructive cap per group. `link`, `graphite`, `strip`
 * and `strip-danger` set their own size.
 */
export type ButtonCap = 'standard' | 'primary' | 'destructive' | 'link' | 'graphite' | 'strip' | 'strip-danger';

export interface ButtonProps extends BaseButton.Props {
  cap?: ButtonCap;
  /** default: 32 tall. compact: 26, 12 pt, raise-sm (the canvas pills: "seed a sample day", "lenses ⌘K"). The link, graphite and strip caps set their own size. */
  size?: 'default' | 'compact';
  /**
   * The action's glyph, placed before the label and sized by the cap (16 in a 32 cap, 14 in a
   * compact one; pass it without a size). An action names itself with a glyph and a verb:
   * `<Button icon={<ShareIcon />}>Share</Button>`. A plain choice (Cancel, Done) has none. When
   * the same control changes meaning, pass a `MorphIcon` whose name changes, and turn the label
   * with `SwapText`. The button is the icon's trigger, so it plays its act on hover and press.
   */
  icon?: React.ReactNode;
}

/* Styled with the theme's utilities: the button recipe's sizes, type and layered looks
 * (recipe-button[-<part>][-pressed]). While held it sinks by the recipe's travel in the press time,
 * linear, into its pressed look; it springs back on release. */
const FRAME = 'box-border inline-flex items-center justify-center m-0 border-0 whitespace-nowrap cursor-pointer select-none antialiased tap-highlight-none [&>svg]:flex-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-deep data-disabled:cursor-default data-disabled:opacity-button-disabled';
const PRESS = 'not-data-disabled:active:translate-y-button-travel not-data-disabled:active:duration-button-press not-data-disabled:active:ease-linear';
const REGULAR = 'gap-button-gap h-button-height px-button-pad rounded-pill type-ui transition-button [&>svg]:size-button-glyph';

const CAPS: Record<ButtonCap, string> = {
  standard: `${REGULAR} text-ink recipe-button ${PRESS} not-data-disabled:active:recipe-button-pressed`,
  primary: `${REGULAR} text-button-primary-ink recipe-button-primary ${PRESS} not-data-disabled:active:recipe-button-primary-pressed`,
  destructive: `${REGULAR} text-button-destructive-ink recipe-button-destructive ${PRESS} not-data-disabled:active:recipe-button-destructive-pressed`,
  link: 'gap-button-gap [&>svg]:size-button-compact-glyph h-auto p-0 rounded-none bg-transparent type-button-link text-button-link-ink transition-button',
  graphite: `[&>svg]:size-button-compact-glyph gap-button-gap h-button-graphite-height px-button-graphite-pad rounded-pill type-button-graphite text-button-graphite-ink recipe-button-graphite transition-button ${PRESS}`,
  strip: `[&>svg]:size-button-compact-glyph gap-button-gap h-button-strip-height px-button-strip-pad rounded-button-strip-radius type-button-strip text-button-strip-ink bg-transparent transition-button hover:text-button-strip-ink-hover hover:recipe-button-strip-hover ${PRESS} not-data-disabled:active:recipe-button-strip-pressed focus-visible:outline-none focus-visible:recipe-button-strip-focus`,
  'strip-danger': `[&>svg]:size-button-compact-glyph gap-button-gap h-button-strip-height px-button-strip-pad rounded-button-strip-radius type-button-strip text-button-strip-danger-ink bg-transparent transition-button hover:recipe-button-strip-hover ${PRESS} not-data-disabled:active:recipe-button-strip-pressed focus-visible:outline-none focus-visible:recipe-button-strip-focus`,
};
const COMPACT = `gap-button-compact-gap h-button-compact-height px-button-compact-pad rounded-pill type-button-compact text-ink2 hover:text-ink recipe-button-compact transition-button-compact [&>svg]:size-button-compact-glyph ${PRESS} not-data-disabled:active:recipe-button-compact-pressed`;

/** The cap's frame and regular size without its press, for keys that travel their own way (Toggle). */
export const buttonParts = { FRAME, REGULAR } as const;

/** The utilities for a cap and size: the caps that set their own size ignore `size`. */
export function buttonClasses(cap: ButtonCap = 'standard', size: 'default' | 'compact' = 'default') {
  const compact = size === 'compact' && ['standard', 'primary', 'destructive'].includes(cap);
  if (compact && cap !== 'standard') {
    const dimensions = 'gap-button-compact-gap h-button-compact-height px-button-compact-pad rounded-pill type-button-compact [&>svg]:size-button-compact-glyph transition-button';
    return `${FRAME} ${dimensions} ${cap === 'primary' ? 'text-button-primary-ink recipe-button-primary not-data-disabled:active:recipe-button-primary-pressed' : 'text-button-destructive-ink recipe-button-destructive not-data-disabled:active:recipe-button-destructive-pressed'} ${PRESS}`;
  }
  return `${FRAME} ${compact ? COMPACT : CAPS[cap]}`;
}

/**
 * A press-in pill button. While held it sinks 1px and its shadow
 * collapses into a well; on release it springs back. Its `icon` leads the label, and
 * MetalUI icons inside it play their act from the whole button.
 */
export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { cap = 'standard', size = 'default', icon, className, children, ...props },
  ref,
) {
  const own = `mu-button mu-icon-trigger ${buttonClasses(cap, size)}`;
  return (
    <BaseButton
      ref={ref}
      data-cap={cap}
      data-size={size}
      className={(state) => {
        const extra = typeof className === 'function' ? className(state) : className;
        return extra ? `${own} ${extra}` : own;
      }}
      {...props}
    >
      {icon}
      {children}
    </BaseButton>
  );
});
