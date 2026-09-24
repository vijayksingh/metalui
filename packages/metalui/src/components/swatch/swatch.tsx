'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * SWATCH (the reference design's .swatchobj)
 *
 * A lone hex on the canvas becomes a hard, glossy chip in its own colour: a 135° sheen, a bright
 * top edge and a dark bottom rim, an inner glow, a contact shadow and a drop shadow in its own
 * colour; the hex engraved in the corner in dark or light ink by the colour's luminance; a recessed
 * LED dimple top right. A click opens the host's colour picker. Its look is the swatch recipe.
 * ───────────────────────────────────────────────────────── */

export interface SwatchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  /** The colour: #RGB or #RRGGBB. */
  hex: string;
  /** What is engraved: the hex as written (default `hex`). */
  label?: string;
}

/** Luma as the demo computes it (Rec. 601); above 150 the engraving is dark. */
export function swatchInk(hex: string): 'dark' | 'light' {
  const v = hex.replace('#', '');
  const n = parseInt(v.length === 3 ? v.replace(/./g, '$&$&') : v, 16);
  const luma = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return luma > 150 ? 'dark' : 'light';
}

/* Styled with the theme's utilities (the swatch recipe, in the object's own colour, --mu-self). */
const SWATCH = 'mu-swatch relative box-border size-swatch-size rounded-swatch-radius recipe-swatch cursor-pointer focus-visible:focus-ring';
const LABEL = {
  dark: 'mu-swatch-label absolute left-swatch-label-x bottom-swatch-label-y type-swatch-label whitespace-nowrap text-swatch-label-ink-dark',
  light: 'mu-swatch-label absolute left-swatch-label-x bottom-swatch-label-y type-swatch-label whitespace-nowrap text-swatch-label-ink-light',
};
const LED = 'mu-swatch-led absolute right-swatch-led-inset top-swatch-led-inset size-swatch-led-size rounded-full recipe-swatch-led';

export const Swatch = React.forwardRef<HTMLDivElement, SwatchProps>(function Swatch({ hex, label, className, style, ...props }, ref) {
  const ink = swatchInk(hex);
  return (
    <div
      ref={ref}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      aria-label={props['aria-label'] ?? `Colour ${hex}`}
      data-ink={ink}
      data-mu-self=""
      className={className ? `${SWATCH} ${className}` : SWATCH}
      style={{ '--mu-self': hex, ...style } as React.CSSProperties}
      {...props}
    >
      <span className={LABEL[ink]}>{label ?? hex}</span>
      <span aria-hidden className={LED} />
    </div>
  );
});
