'use client';

import * as React from 'react';
import './swap.css';

/* ─────────────────────────────────────────────────────────
 * SWAP TEXT STORYBOARD (value changes A → B)
 *
 * B wider than A (the surface makes room first):
 *      0ms   footprint springs from A's width to B's (spring-morph, no overshoot)
 *      0ms   A leaves: up 4, blur 2, fades out            (120ms, ease-out)
 *    120ms   B arrives from 4 below, blur 2 → sharp        (180ms, ease-out)
 * B narrower than A (the content leaves first):
 *      0ms   A leaves                                      (120ms)
 *    120ms   footprint springs to B's width; B arrives     (180ms)
 * Reduced motion: an opacity cross-fade only; no travel, blur or size spring.
 * Every value is a --mu-swap-* token.
 * ───────────────────────────────────────────────────────── */

type Phase = 'idle' | 'exit' | 'enter-start';

const readMs = (el: Element, name: string, fallback: number) => {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? (raw.endsWith('s') && !raw.endsWith('ms') ? n * 1000 : n) : fallback;
};

export interface SwapTextProps {
  /** The text to show. Changing it plays the swap. */
  value: string;
  className?: string;
}

/**
 * A label that changes without snapping: the old text leaves, the footprint
 * springs to the new width, and the new text arrives. Use it for any label
 * inside a control that changes in place (Copy → Copied, Save → Saving…).
 */
export function SwapText({ value, className }: SwapTextProps) {
  const [shown, setShown] = React.useState(value);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [width, setWidth] = React.useState<number>();
  const root = React.useRef<HTMLSpanElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const timers = React.useRef<number[]>([]);
  const settled = React.useRef(true);

  const target = () => measure.current?.getBoundingClientRect().width ?? 0;

  // Size the footprint to the text before first paint, and follow late font loads while idle.
  React.useLayoutEffect(() => {
    setWidth(target());
    const el = measure.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (settled.current) setWidth(target()); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (value === shown || !root.current) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    settled.current = false;

    const el = root.current;
    const exitMs = readMs(el, '--mu-swap-text-exit', 120);
    const next = target();
    const growing = next >= (width ?? 0);

    setPhase('exit');
    if (growing) setWidth(next);
    timers.current.push(
      window.setTimeout(() => {
        setShown(value);
        if (!growing) setWidth(next);
        setPhase('enter-start');
        // Two frames: let "enter-start" paint without a transition, then release it.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setPhase('idle');
          settled.current = true;
        }));
      }, exitMs),
    );
    return () => timers.current.forEach(clearTimeout);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={root} className={className ? `mu-swap-text ${className}` : 'mu-swap-text'} style={{ width }}>
      <span className="mu-swap-text-slot" data-phase={phase}>{shown}</span>
      <span ref={measure} className="mu-swap-text-measure" aria-hidden="true">{value}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
 * SWAP ICON STORYBOARD (icon A → B, same slot)
 *
 *      0ms   A shrinks to 0.25, blurs 2, fades out   (250ms)
 *      0ms   B grows from 0.25, blur 2 → sharp        (250ms)
 *    250ms   A is removed
 * Reduced motion: an opacity cross-fade only.
 * ───────────────────────────────────────────────────────── */

type Layer = { key: string; node: React.ReactNode; state: 'enter' | 'in' | 'out' };

export interface SwapIconProps {
  /** Identifies the icon; changing it plays the swap. */
  swapKey: string;
  /** The icon for the current key. */
  children: React.ReactNode;
  className?: string;
}

/** Swaps one icon for another in place: a scale-and-blur cross-fade. */
export function SwapIcon({ swapKey, children, className }: SwapIconProps) {
  const [layers, setLayers] = React.useState<Layer[]>([{ key: swapKey, node: children, state: 'in' }]);
  const root = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    setLayers((prev) => {
      const current = prev.find((l) => l.state !== 'out');
      if (current?.key === swapKey) return prev.map((l) => (l === current ? { ...l, node: children } : l));
      return [...prev.filter((l) => l.key !== swapKey).map((l) => ({ ...l, state: 'out' as const })), { key: swapKey, node: children, state: 'enter' }];
    });
  }, [swapKey, children]);

  React.useEffect(() => {
    if (!layers.some((l) => l.state !== 'in')) return;
    // Only produce a new array when something changes, or this effect would re-run forever.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() =>
      setLayers((prev) => (prev.some((l) => l.state === 'enter') ? prev.map((l) => (l.state === 'enter' ? { ...l, state: 'in' } : l)) : prev)),
    ));
    const ms = root.current ? readMs(root.current, '--mu-swap-icon-dur', 250) : 250;
    const t = window.setTimeout(() => setLayers((prev) => (prev.some((l) => l.state === 'out') ? prev.filter((l) => l.state !== 'out') : prev)), ms);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [layers]);

  return (
    <span ref={root} className={className ? `mu-swap-icon ${className}` : 'mu-swap-icon'}>
      {layers.map((l) => (
        <span key={l.key} className="mu-swap-icon-layer" data-state={l.state} aria-hidden={l.state === 'out' || undefined}>
          {l.node}
        </span>
      ))}
    </span>
  );
}
