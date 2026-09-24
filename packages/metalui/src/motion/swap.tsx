'use client';

import * as React from 'react';
import './swap.css';

/* ─────────────────────────────────────────────────────────
 * THE DRUM (a control's face changes: label, icon, digits)
 *
 * The face turns one grid step. The drum is one object, so both faces ride
 * one spring (settle, k380 c36) from the same frame:
 *      0ms   outgoing turns up 4 and defocuses 2
 *      0ms   incoming turns up from 4 below and comes into focus
 *     83ms   half turned (settle half); both faces half visible
 *    214ms   reads as done (settle near)
 * Outgoing + incoming visibility is S + (1 − S) = 1 at every instant: the
 * window is never empty and never doubled.
 * Footprint (text)
 *   growing    0ms   width settles to the new face as the drum turns
 *   shrinking 83ms   width settles once the old face is half turned away
 * Icons ride the same drum as their label, so the whole face turns together.
 * Reduced motion: a crossfade on the same spring; no turn, focus or footprint spring.
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
 * Keeps the outgoing layer mounted while the incoming one arrives. The incoming
 * layer's start state is committed before paint and released in the same frame,
 * so both faces start turning together; outgoing layers are removed once settled.
 */
function useSwapLayers(key: string, node: React.ReactNode, root: React.RefObject<HTMLElement | null>) {
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

  // Same frame: force the "enter" styles to be computed, then release them.
  React.useLayoutEffect(() => {
    if (!layers.some((l) => l.state === 'enter')) return;
    void root.current?.offsetWidth;
    setLayers((prev) => prev.map((l) => (l.state === 'enter' ? { ...l, state: 'in' } : l)));
  }, [layers, root]);

  // Only produce a new array when something changes, or this effect would re-run forever.
  React.useEffect(() => {
    if (!layers.some((l) => l.state === 'out')) return;
    const timer = window.setTimeout(
      () => setLayers((prev) => (prev.some((l) => l.state === 'out') ? prev.filter((l) => l.state !== 'out') : prev)),
      readMs(root.current, '--mu-spring-settle-d', 440),
    );
    return () => clearTimeout(timer);
  }, [layers, root]);

  return layers;
}

export interface SwapTextProps {
  /** The text to show. Changing it plays the swap. */
  value: string;
  className?: string;
}

/**
 * A label that changes without snapping: the face turns one step on a drum,
 * old and new overlapping, and the footprint settles to the new width. Use it
 * for any label that changes in place: Copy → Copied, Save → Saving… → Saved.
 */
export function SwapText({ value, className }: SwapTextProps) {
  const root = React.useRef<HTMLSpanElement>(null);
  const measure = React.useRef<HTMLSpanElement>(null);
  const [width, setWidth] = React.useState<number>();
  const layers = useSwapLayers(value, value, root);
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
        shrinkTimer.current = window.setTimeout(() => setWidth(next), readMs(root.current, '--mu-swap-shrink-delay', 83));
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

/** Swaps one icon for another in the same slot, turning on the same drum as its label. */
export function SwapIcon({ swapKey, children, className }: SwapIconProps) {
  const root = React.useRef<HTMLSpanElement>(null);
  const layers = useSwapLayers(swapKey, children, root);
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
