'use client';

import * as React from 'react';
import { SPRINGS } from '../motion/springs.generated';
import { at, frameOf, plan, springAt, type MorphFrame, type MorphGlyphName, type MorphPlan } from './morph';

/* ─────────────────────────────────────────────────────────
 * GLYPH MORPH STORYBOARD (glyph A → B)
 *
 *   same rotation group (plus ↔ close, arrow → arrow, chevron → chevron)
 *      0ms   the shape turns the short way round like a dial   (part k170 c16)
 *    ~200ms  it reaches its detent, overshoots ~9%, settles    (near 198ms)
 *   different glyphs (copy → check, play → pause, menu → close)
 *      0ms   every stroke moves point by point to its place    (settle k380 c36)
 *            unused strokes retract into the target's nearest joint and fade;
 *            new strokes grow out of the source's nearest joint
 *    ~214ms  reads as done                                     (near 214ms)
 * Interrupted: a new target starts from the in-between shape on screen.
 * Reduced motion: the glyph changes in place.
 * ───────────────────────────────────────────────────────── */

export interface MorphIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'children'> {
  /** The glyph to show. Changing it morphs from whatever is on screen. */
  name: MorphGlyphName;
  /** Rendered size in px. */
  size?: number;
  /** Stroke width in 24-grid units. Defaults to the icon set's 1.7. */
  strokeWidth?: number;
  /** Accessible name. Without it the glyph is decorative. */
  title?: string;
}

const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** A state glyph that transforms into the next one instead of being replaced. */
export const MorphIcon = React.forwardRef<SVGSVGElement, MorphIconProps>(function MorphIcon(
  { name, size = 24, strokeWidth = 1.7, title, className, ...props },
  ref,
) {
  const [frame, setFrame] = React.useState<MorphFrame>(() => frameOf(name));
  const shown = React.useRef<{ frame: MorphFrame; name: MorphGlyphName }>({ frame: frameOf(name), name });
  const raf = React.useRef(0);

  React.useEffect(() => {
    if (shown.current.name === name) return;
    cancelAnimationFrame(raf.current);
    const p: MorphPlan = plan(shown.current.frame, shown.current.name, name);
    shown.current.name = name;
    if (prefersReduced()) {
      shown.current.frame = frameOf(name);
      setFrame(frameOf(name));
      return;
    }
    const spring = p.kind === 'turn' ? SPRINGS.part : SPRINGS.settle;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const done = t >= spring.duration;
      // At rest, hold the glyph's own form, so a later turn in its group starts cleanly.
      const next = done ? frameOf(name) : at(p, springAt(spring.stiffness, spring.damping, t));
      shown.current.frame = next;
      setFrame(next);
      if (!done) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [name]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `mu-morph-icon ${className}` : 'mu-morph-icon'}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-glyph={name}
      {...props}
    >
      {title && <title>{title}</title>}
      <g transform={`rotate(${frame.angle.toFixed(3)} 12 12)`}>
        {frame.strokes.map((s, i) => (
          <polyline
            key={i}
            points={s.points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ')}
            opacity={s.opacity}
          />
        ))}
      </g>
    </svg>
  );
});
