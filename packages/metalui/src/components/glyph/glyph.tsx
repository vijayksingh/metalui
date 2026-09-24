'use client';

import * as React from 'react';
import './glyph.css';

/* GLYPH: a static icon at a size (14 small, 16 regular) in an ink (ink, ink2, ink3).
 * It is decorative (aria-hidden) and draws nothing itself: the icon inside inherits the ink. */

export interface GlyphProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'small' | 'regular';
  tone?: 'ink' | 'ink2' | 'ink3';
}

export function Glyph({ size = 'small', tone = 'ink2', className, ...props }: GlyphProps) {
  return <span aria-hidden data-size={size} data-tone={tone} className={className ? `mu-glyph ${className}` : 'mu-glyph'} {...props} />;
}
