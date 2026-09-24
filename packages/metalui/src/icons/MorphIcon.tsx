'use client';

import * as React from 'react';
import { SPRINGS } from '../motion/springs.generated';
import { morphAt, morphOutline, morphParts, morphPath, planMorph, springAt, type MorphFrame, type MorphPart } from './morph';
import type { MorphIconName } from './morph.generated';

/* ─────────────────────────────────────────────────────────
 * GLYPH MORPH STORYBOARD (icon A → icon B, both from the set; docs/MORPH.md)
 *
 *      0ms   every part of A pairs with the part of B it travels least to become
 *            each pair rides its carriage: rigid turn, scale and travel, bends in place
 *            beads draw out into wires (thinning), wires gather into beads
 *            a ring opens where it is nearest to its new ends; tint drains or fills
 *            clearances travel with the parts that cast them, gaps lerp
 *            parts B lacks tuck behind a body or gather into a staying wire (done by ⅔)
 *            parts B gains emerge from behind a body or bud from a staying wire (from ⅓)
 *            a mirror pair turns over on its axis, edge-on at the half turn
 *    ~214ms  reads as done                     (settle k380 c36, one spring for all)
 *    ~440ms  at rest: the authored icon, exactly
 * Interrupted: the next morph starts from the in-between glyph on screen.
 * Reduced motion: the glyph changes in place.
 * ───────────────────────────────────────────────────────── */

export interface MorphIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'children'> {
  /** Any icon of the morph family (the wire-based set; a solid character glyph such as keeper is
   *  not one, it changes by the drum, SwapIcon). Changing it morphs from whatever is on screen. */
  name: MorphIconName;
  /** Rendered size in px. */
  size?: number;
  /** Wire width in 24-grid units. Defaults to the set's 1.7; beads and plates keep their size. */
  strokeWidth?: number;
  /** Accessible name. Without it the glyph is decorative. */
  title?: string;
}

const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The mask for one depth relation: what a caster's body hides (behind) or shows (inside), live. */
function DepthMask({ id, caster, r, inside }: { id: string; caster: MorphPart; r: number; inside: boolean }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      {!inside && <rect width="24" height="24" fill="#fff" stroke="none" />}
      <path d={morphOutline(caster)} fill={inside ? '#fff' : caster.body ? '#000' : 'none'} stroke="#000" strokeWidth={Math.max(0, 2 * r)} />
    </mask>
  );
}

/** Draws one frame of parts. Shared by MorphIcon and static filmstrips. */
export function MorphGlyph({ frame }: { frame: MorphFrame }) {
  const id = React.useId().replace(/[^\w-]/g, '_');
  const relations = frame.flatMap((part, i) => [
    ...part.inside.map((rel, k) => ({ key: `${id}i${i}-${k}`, caster: frame[rel.part], r: rel.r, inside: true, part: i })),
    ...part.behind.map((rel, k) => ({ key: `${id}b${i}-${k}`, caster: frame[rel.part], r: rel.r, inside: false, part: i })),
  ]);
  return (
    <>
      {relations.length > 0 && (
        <defs>
          {relations.map((rel) => <DepthMask key={rel.key} id={rel.key} caster={rel.caster} r={rel.r} inside={rel.inside} />)}
        </defs>
      )}
      {frame.map((part, i) => {
        let node: React.ReactNode = (
          <path
            d={morphPath(part)}
            strokeWidth={part.weight}
            fillRule={part.holes.length ? 'evenodd' : 'nonzero'}
            opacity={part.opacity < 1 ? part.opacity : undefined}
            style={{ fillOpacity: `calc(${part.tint.toFixed(4)} * var(--mu-duo-k, 1) + ${part.solid.toFixed(4)})` }}
          />
        );
        // Each relation wraps the part in its own mask, innermost first.
        for (const rel of relations) if (rel.part === i) node = <g mask={`url(#${rel.key})`}>{node}</g>;
        return <React.Fragment key={i}>{node}</React.Fragment>;
      })}
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
