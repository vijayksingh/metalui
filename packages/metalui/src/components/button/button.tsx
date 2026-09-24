'use client';

import * as React from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import './button.css';

/**
 * Which cap the button wears. `standard` is soft-touch in the colorway,
 * `primary` is the dark cap, and `destructive` is the one red cap. Use at
 * most one primary or destructive cap per group.
 */
export type ButtonCap = 'standard' | 'primary' | 'destructive';

export interface ButtonProps extends BaseButton.Props {
  cap?: ButtonCap;
  /** default: 32 tall. compact: 28, 12 pt, raise-sm (the medium's pills: "seed a sample day", "lenses ⌘K"). */
  size?: 'default' | 'compact';
}

/**
 * A press-in pill button (KAMUI-15). While held it sinks 1px and its shadow
 * collapses into a well; on release it springs back. MetalUI icons inside it
 * play their hover pose and press one-shot from the whole button.
 */
export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { cap = 'standard', size = 'default', className, ...props },
  ref,
) {
  return (
    <BaseButton
      ref={ref}
      data-cap={cap}
      data-size={size}
      className={(state) => {
        const extra = typeof className === 'function' ? className(state) : className;
        return extra ? `mu-button mu-icon-trigger ${extra}` : 'mu-button mu-icon-trigger';
      }}
      {...props}
    />
  );
});
