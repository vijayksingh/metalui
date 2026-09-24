'use client';

import * as React from 'react';

/* GLYPH: a static icon at a size (10 tiny, 14 small, 16 regular) in an ink (ink, ink2, ink3, or inherit from
 * the words it sits in). It is decorative (aria-hidden) and draws nothing itself: the icon inside inherits
 * the ink. Styled with the theme's utilities (the glyph recipe). */

export interface GlyphProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'tiny' | 'small' | 'regular';
  tone?: 'ink' | 'ink2' | 'ink3' | 'inherit';
}

const FRAME = 'inline-grid place-items-center flex-none';
const SIZES = {
  tiny: '[&>svg]:size-glyph-size-tiny glyph-drop-tiny',
  small: '[&>svg]:size-glyph-size-small',
  regular: '[&>svg]:size-glyph-size-regular',
};
const TONES = {
  ink: 'text-glyph-ink-ink',
  ink2: 'text-glyph-ink-ink2',
  ink3: 'text-glyph-ink-ink3',
  inherit: '',
};

export function Glyph({ size = 'small', tone = 'ink2', className, ...props }: GlyphProps) {
  const own = `mu-glyph ${FRAME} ${SIZES[size]} ${TONES[tone]}`.trim();
  return <span aria-hidden data-size={size} data-tone={tone} className={className ? `${own} ${className}` : own} {...props} />;
}
