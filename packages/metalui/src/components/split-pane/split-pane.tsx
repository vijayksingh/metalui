'use client';

import * as React from 'react';

/* ─────────────────────────────────────────────────────────
 * SPLIT PANE, two places side by side (or stacked) with a divider you can move
 *
 *   rest      an engraved hairline with a small raised grip at its middle (the switch thumb)
 *   hover     the grip lifts; the cursor says it moves
 *   drag      the panes follow the pointer one to one (no spring while held)
 *   let go    near the default size it snaps there on the part spring (a detent); a collapsible pane
 *             dragged past half its minimum snaps shut the same way; below its minimum it returns
 *             to it
 *   keys      the divider is a focusable separator: arrows step 8 on the settle spring, Home and
 *             End go to the limits (Home collapses a collapsible pane), Enter restores the default
 *   twice     a double-click restores the default
 * Reduce Motion: snaps and steps land at once.
 * A place: it divides area between places. It uses the rule and the switch thumb.
 * Slots: SplitPane.Root, SplitPane.Pane.
 * ───────────────────────────────────────────────────────── */

const ROOT = 'mu-split-pane relative flex h-full w-full min-h-0 min-w-0 data-[orientation=vertical]:flex-col';
const FIRST = 'mu-split-pane-first relative flex-none min-w-0 min-h-0 overflow-auto split-pane-size overscroll-contain';
const SECOND = 'mu-split-pane-second relative flex-1 min-w-0 min-h-0 overflow-auto overscroll-contain';
const DIVIDER = 'mu-split-pane-divider relative z-1 flex-none grid place-items-center outline-none touch-none split-pane-divider split-pane-line focus-visible:focus-ring';
const GRIP = 'mu-split-pane-grip relative rounded-pill recipe-switch-thumb split-pane-grip reduced-motion:transition-none';

export interface SplitPaneProps {
  /** Side by side (horizontal, the default) or stacked (vertical). */
  orientation?: 'horizontal' | 'vertical';
  /** The first pane's share, in percent. */
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  /** The first pane's smallest and largest share, in percent. */
  min?: number;
  max?: number;
  /** The first pane may be closed by dragging past half its minimum, or with Home. */
  collapsible?: boolean;
  /** Names the divider: "Resize the sidebar". */
  label: string;
  /** Exactly two panes. */
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}

function Pane({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function Root({ orientation = 'horizontal', size, defaultSize = 30, onSizeChange, min = 15, max = 85, collapsible, label, children, className }: SplitPaneProps) {
  const [own, setOwn] = React.useState(defaultSize);
  const current = size ?? own;
  const [dragging, setDragging] = React.useState(false);
  const [snapping, setSnapping] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const box = React.useRef<DOMRect | null>(null); // measured once at pointer down: the pane does not move under the pointer
  const firstId = React.useId();
  const horizontal = orientation === 'horizontal';

  const set = (v: number, snap = false) => {
    const next = Math.round(Math.min(max, Math.max(0, v)) * 10) / 10;
    setSnapping(snap);
    if (size === undefined) setOwn(next);
    onSizeChange?.(next);
  };
  const extent = () => {
    const r = root.current!.getBoundingClientRect();
    return horizontal ? r.width : r.height;
  };
  const read = (name: string, fallback: number) => {
    const el = root.current;
    return el ? parseFloat(getComputedStyle(el).getPropertyValue(`--mu-r-split-pane-self-${name}`)) || fallback : fallback;
  };

  const settle = (v: number) => {
    const detent = read('detent', 3);
    if (collapsible && v < min / 2) return set(0, true);
    if (v < min) return set(min, true);
    if (Math.abs(v - defaultSize) <= detent) return set(defaultSize, true);
    set(v);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    box.current = root.current!.getBoundingClientRect();
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !box.current) return;
    const r = box.current;
    const v = horizontal ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100;
    set(Math.min(max, Math.max(collapsible ? 0 : min, v)));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    box.current = null;
    setDragging(false);
    settle(current);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = (read('step', 8) / extent()) * 100;
    const back = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const on = horizontal ? 'ArrowRight' : 'ArrowDown';
    let next: number | null = null;
    if (e.key === back) next = Math.max(collapsible && current <= min ? 0 : min, current - step);
    if (e.key === on) next = Math.min(max, Math.max(current <= 0 ? min : current, current + step));
    if (e.key === 'Home') next = collapsible ? 0 : min;
    if (e.key === 'End') next = max;
    if (e.key === 'Enter') { set(defaultSize, true); e.preventDefault(); return; }
    if (next != null) { e.preventDefault(); set(next); }
  };

  return (
    <div ref={root} data-orientation={orientation} data-dragging={dragging ? '' : undefined} data-snapping={snapping ? '' : undefined} className={className ? `${ROOT} ${className}` : ROOT}>
      <div id={firstId} className={FIRST} style={{ flexBasis: `${current}%` }}>
        {children[0]}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-controls={firstId}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(current)}
        aria-valuemin={collapsible ? 0 : min}
        aria-valuemax={max}
        data-orientation={orientation}
        data-dragging={dragging ? '' : undefined}
        className={DIVIDER}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => set(defaultSize, true)}
      >
        <span aria-hidden data-orientation={orientation} className={GRIP} />
      </div>
      <div className={SECOND}>{children[1]}</div>
    </div>
  );
}

export const SplitPane = Object.assign(Root, { Pane, Root });
