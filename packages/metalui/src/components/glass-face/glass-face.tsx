'use client';

import * as React from 'react';
import './glass-face.css';

/* GLASS FACE: a dark glass object: a bezel around a screen with a glare, a shaded rim and an inner
 * shadow. What is on the screen is the caller's. Slots: GlassFace.Root, GlassFace.Screen. */

const Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function GlassFaceRoot({ className, ...props }, ref) {
  return <div ref={ref} className={className ? `mu-glass-face ${className}` : 'mu-glass-face'} {...props} />;
});
const Screen = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function GlassFaceScreen({ className, ...props }, ref) {
  return <div ref={ref} className={className ? `mu-glass-screen ${className}` : 'mu-glass-screen'} {...props} />;
});

export const GlassFace = Object.assign(Root, { Root, Screen });
