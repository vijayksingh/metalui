'use client';

import * as React from 'react';
import './swatch.css';

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

export const Swatch = React.forwardRef<HTMLDivElement, SwatchProps>(function Swatch({ hex, label, className, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      role={props.onClick ? 'button' : undefined}
      tabIndex={props.onClick ? 0 : undefined}
      aria-label={props['aria-label'] ?? `Colour ${hex}`}
      data-ink={swatchInk(hex)}
      className={className ? `mu-swatch ${className}` : 'mu-swatch'}
      style={{ '--mu-self': hex, ...style } as React.CSSProperties}
      {...props}
    >
      <span className="mu-swatch-label">{label ?? hex}</span>
      <span aria-hidden className="mu-swatch-led" />
    </div>
  );
});
