'use client';

import * as React from 'react';

/* GLASS FACE: a dark glass object: a bezel around a screen with a glare, a shaded rim and an inner
 * shadow. What is on the screen is the caller's. Slots: GlassFace.Root, GlassFace.Screen.
 * Styled with the theme's utilities (the glass-face recipe and its glare). */

const FACE = 'mu-glass-face box-border p-glass-face-pad rounded-glass-face-radius recipe-glass-face';
const SCREEN = 'mu-glass-screen relative overflow-hidden rounded-glass-face-screen-radius recipe-glass-face-screen glass-face-glare';

const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function GlassFaceRoot({ className, ...props }, ref) {
  return <div ref={ref} className={className ? `${FACE} ${className}` : FACE} {...props} />;
});
const Screen = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function GlassFaceScreen({ className, ...props }, ref) {
  return <div ref={ref} className={className ? `${SCREEN} ${className}` : SCREEN} {...props} />;
});

export const GlassFace = Object.assign(Root, { Root, Screen });
