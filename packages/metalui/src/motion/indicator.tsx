'use client';

import * as React from 'react';
import './indicator.css';

/* ─────────────────────────────────────────────────────────
 * SLIDING INDICATOR STORYBOARD (selection A → B in a group)
 *
 *      0ms   the thumb leaves A and travels to B's box
 *            in a track with ends (segments, tabs, switch): part spring
 *              k170 c16, near 198ms, overshoots ~9% against the stop
 *            free travel (lists, navigation): settle spring k380 c36,
 *              near 214ms, no overshoot: nothing to bounce against
 *      0ms   A's label fades to ink2, B's to ink
 * First paint, resize and font load: the thumb is placed without motion.
 * Reduced motion: the thumb moves instantly; labels still recolor.
 * ───────────────────────────────────────────────────────── */

const ACTIVE = '[aria-checked="true"],[aria-selected="true"],[aria-current="page"]';

export interface SlidingIndicatorProps {
  /** Selects the active item inside the group. Defaults to ARIA checked/selected/current. */
  activeSelector?: string;
  /** The indicator's material and shape, e.g. "material-thumb rounded-pill". */
  className?: string;
  /**
   * "part" when the thumb rides a track with ends (segmented, tabs, switch): it may
   * overshoot against the stop. "settle" for free travel (lists, navigation).
   */
  spring?: 'part' | 'settle';
}

/**
 * A thumb that glides to the active item of its parent group: segmented
 * controls, tabs, navigation. Place it as the first child of a positioned
 * group; it follows ARIA state, so the items stay ordinary buttons or links.
 */
export function SlidingIndicator({ activeSelector = ACTIVE, className, spring = 'part' }: SlidingIndicatorProps) {
  const self = React.useRef<HTMLSpanElement>(null);
  const [box, setBox] = React.useState<{ x: number; y: number; w: number; h: number; animate: boolean } | null>(null);

  React.useLayoutEffect(() => {
    const el = self.current?.parentElement;
    if (!el) return;
    const place = (animate: boolean) => {
      const active = el.querySelector<HTMLElement>(activeSelector);
      if (!active) return setBox(null);
      // offset* ignore transforms, so the measurement is stable mid-animation.
      let x = 0, y = 0, node: HTMLElement | null = active;
      while (node && node !== el) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
      setBox({ x, y, w: active.offsetWidth, h: active.offsetHeight, animate });
    };
    place(false);
    const mo = new MutationObserver(() => place(true));
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-selected', 'aria-current'] });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => place(false)) : null;
    ro?.observe(el);
    return () => { mo.disconnect(); ro?.disconnect(); };
  }, [activeSelector]);

  return (
    <span
      ref={self}
      aria-hidden="true"
      className={className ? `mu-indicator ${className}` : 'mu-indicator'}
      data-animate={box?.animate || undefined}
      data-spring={spring}
      style={box ? { width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` } : { visibility: 'hidden' }}
    />
  );
}
