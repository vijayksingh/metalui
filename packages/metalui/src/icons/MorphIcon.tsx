'use client';

import * as React from 'react';
import { SPRINGS } from '../motion/springs.generated';
import type { IconName } from './catalog.generated';
import { morphAt, morphParts, morphPath, planMorph, springAt, type MorphFrame } from './morph';

/* ─────────────────────────────────────────────────────────
 * GLYPH MORPH STORYBOARD (icon A → icon B, both from the set)
 *
 *      0ms   every part of A pairs with the part of B it travels least to become
 *            wires bend to their new line at constant weight
 *            beads draw out into wires (thinning), wires gather into beads
 *            a ring opens where it is nearest to its new ends; tint drains or fills
 *            parts B lacks gather into the nearest staying wire and vanish into it
 *            parts B gains bud from the nearest staying wire and grow out of it
 *    ~214ms  reads as done                     (settle k380 c36, one spring for all)
 *    ~400ms  at rest: the authored icon, exactly
 * Interrupted: the next morph starts from the in-between glyph on screen.
 * Reduced motion: the glyph changes in place.
 * ───────────────────────────────────────────────────────── */

export interface MorphIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'children'> {
  /** Any icon in the set. Changing it morphs from whatever is on screen. */
  name: IconName;
  /** Rendered size in px. */
  size?: number;
  /** Wire width in 24-grid units. Defaults to the set's 1.7; beads and plates keep their size. */
  strokeWidth?: number;
  /** Accessible name. Without it the glyph is decorative. */
  title?: string;
}

const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Draws one frame of parts. Shared by MorphIcon and static filmstrips. */
export function MorphGlyph({ frame }: { frame: MorphFrame }) {
  return (
    <>
      {frame.map((part, i) => (
        <path
          key={i}
          d={morphPath(part)}
          strokeWidth={part.weight}
          fillRule={part.holes.length ? 'evenodd' : 'nonzero'}
          opacity={part.opacity < 1 ? part.opacity : undefined}
          style={{ fillOpacity: `calc(${part.tint.toFixed(4)} * var(--mu-duo-k, 1) + ${part.solid.toFixed(4)})` }}
        />
      ))}
    </>
  );
}

/** An icon that becomes the next icon instead of being replaced by it. */
export const MorphIcon = React.forwardRef<SVGSVGElement, MorphIconProps>(function MorphIcon(
  { name, size = 24, strokeWidth = 1.7, title, className, ...props },
  ref,
) {
  const [frame, setFrame] = React.useState<MorphFrame>(() => morphParts(name, strokeWidth));
  const shown = React.useRef({ frame, name });
  const raf = React.useRef(0);

  React.useEffect(() => {
    if (shown.current.name === name) return;
    cancelAnimationFrame(raf.current);
    shown.current.name = name;
    const rest = morphParts(name, strokeWidth);
    if (prefersReduced()) {
      shown.current.frame = rest;
      setFrame(rest);
      return;
    }
    const plan = planMorph(shown.current.frame, name, strokeWidth);
    const { stiffness, damping, duration } = SPRINGS.settle;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      // At rest, draw the authored icon itself.
      const next = t >= duration ? rest : morphAt(plan, springAt(stiffness, damping, t));
      shown.current.frame = next;
      setFrame(next);
      if (t < duration) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [name, strokeWidth]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      stroke="currentColor"
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
      <MorphGlyph frame={frame} />
    </svg>
  );
});
