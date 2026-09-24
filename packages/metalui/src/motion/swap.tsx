'use client';

import * as React from 'react';
import './swap.css';

/* ─────────────────────────────────────────────────────────
 * CONTENT SWAP STORYBOARD (A → B in the same slot)
 *
 * An overlapping crossfade: at no frame is the slot empty.
 *      0ms   A leaves: fades, drifts up 4, blurs to 2       (quick 150ms, in-out)
 *     40ms   B arrives: from 4 below and blur 2, sharpens   (fast 250ms, out)
 *            A and B overlap for ~110ms; the blur blends them into one change
 * Footprint (text only)
 *   growing    0ms   width springs to B (morph spring) as A starts to leave
 *   shrinking 80ms   width springs to B once A has mostly gone, so A never spills
 * Icons: A shrinks to 0.25 and B grows from it, both blurring   (fast 250ms)
 * Reduced motion: opacity only; no travel, blur or size spring.
 * Every value is a --mu-swap-* token on the motion scale.
 * ───────────────────────────────────────────────────────── */

type LayerState = 'enter' | 'in' | 'out';
type Layer = { id: number; key: string; node: React.ReactNode; state: LayerState };

/** Reads a duration custom property (resolved through var()) in ms. */
function readMs(el: Element | null, name: string, fallback: number) {
  if (!el) return fallback;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

/**
 * Keeps the outgoing layer mounted while the incoming one arrives.
 * New layers mount as "enter" (no transition), are released to "in" two frames
 * later, and outgoing layers are removed once their exit has played.
 */
function useSwapLayers(key: string, node: React.ReactNode, root: React.RefObject<HTMLElement | null>, exitVar: string) {
  const seq = React.useRef(0);
  const [layers, setLayers] = React.useState<Layer[]>(() => [{ id: seq.current, key, node, state: 'in' }]);

  React.useEffect(() => {
    setLayers((prev) => {
      const current = prev.find((l) => l.state !== 'out');
      if (current?.key === key) return current.node === node ? prev : prev.map((l) => (l === current ? { ...l, node } : l));
      seq.current += 1;
      return [...prev.map((l) => (l.state === 'out' ? l : { ...l, state: 'out' as const })), { id: seq.current, key, node, state: 'enter' }];
    });
  }, [key, node]);

  React.useEffect(() => {
    const entering = layers.some((l) => l.state === 'enter');
    const leaving = layers.some((l) => l.state === 'out');
    if (!entering && !leaving) return;
    let raf = 0;
    if (entering) {
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setLayers((prev) => prev.map((l) => (l.state === 'enter' ? { ...l, state: 'in' } : l))));
      });
    }
    // Only produce a new array when something changes, or this effect would re-run forever.
    const timer = leaving
      ? window.setTimeout(() => setLayers((prev) => (prev.some((l) => l.state === 'out') ? prev.filter((l) => l.state !== 'out') : prev)), readMs(root.current, exitVar, 150) + 40)
      : 0;
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [layers, root, exitVar]);

  return layers;
}

export interface SwapTextProps {
  /** The text to show. Changing it plays the swap. */
  value: string;
  className?: string;
}

/**
 * A label that changes without snapping. The old words leave while the new ones
 * arrive, and the footprint springs to the new width. Use it for any label that
 * changes in place: Copy → Copied, Save → Saving… → Saved.
 */
export function SwapText({ value, className }: SwapTextProps) {
  const root = React.useRef<HTMLSpanElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [width, setWidth] = React.useState<number>();
  const layers = useSwapLayers(value, value, root, '--mu-swap-out');
  const shrinkTimer = React.useRef(0);

  const target = () => measure.current?.getBoundingClientRect().width;

  // Size before first paint; follow late font loads and later value changes.
  React.useLayoutEffect(() => {
    setWidth(target());
    const el = measure.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const next = target();
      if (next === undefined) return;
      clearTimeout(shrinkTimer.current);
      setWidth((cur) => {
        if (cur === undefined || next >= cur) return next; // growing: the surface moves first
        shrinkTimer.current = window.setTimeout(() => setWidth(next), readMs(root.current, '--mu-swap-shrink-delay', 80));
        return cur; // shrinking: wait until the old words have mostly left
      });
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(shrinkTimer.current); };
  }, []);

  return (
    <span ref={root} className={className ? `mu-swap-text ${className}` : 'mu-swap-text'} style={{ width }}>
      {layers.map((l) => (
        <span key={l.id} className="mu-swap-layer" data-state={l.state} aria-hidden={l.state === 'out' || undefined}>
          {l.node}
        </span>
      ))}
      <span ref={measure} className="mu-swap-text-measure" aria-hidden="true">{value}</span>
    </span>
  );
}

export interface SwapIconProps {
  /** Identifies the icon; changing it plays the swap. */
  swapKey: string;
  /** The icon for the current key. */
  children: React.ReactNode;
  className?: string;
}

/** Swaps one icon for another in the same slot: a scale-and-blur crossfade. */
export function SwapIcon({ swapKey, children, className }: SwapIconProps) {
  const root = React.useRef<HTMLSpanElement>(null);
  const layers = useSwapLayers(swapKey, children, root, '--mu-swap-icon');
  return (
    <span ref={root} className={className ? `mu-swap-icon ${className}` : 'mu-swap-icon'}>
      {layers.map((l) => (
        <span key={l.id} className="mu-swap-layer" data-state={l.state} aria-hidden={l.state === 'out' || undefined}>
          {l.node}
        </span>
      ))}
    </span>
  );
}
