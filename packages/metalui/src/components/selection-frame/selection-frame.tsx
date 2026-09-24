'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';
import { SizeReadout } from '../size-readout/size-readout';

/* ─────────────────────────────────────────────────────────
 * SELECTION FRAME (the reference's renderSelection, as one object)
 *
 * rest      nothing: a borderless object has no edge at rest
 * hover     faint corner dots where the handles will be (settle fade);
 *           an edge light on the side the pointer entered the band
 *           a soft glow behind the corner under the pointer (also while selected:
 *           it says "resize from here" behind the handle)
 * selected  ring 1.25 + collar 3.5 at offset 6 (radius + 6)
 *     0ms   ring and handles enter from 1.02, opacity 0, on the part spring
 *           (Reduce Motion: part resolves instant)
 *           the readout reads the measured frame: ● W × H
 *   typing  ring, handles and readout re-measure in the same frame as the
 *           host's layout (ResizeObserver runs before paint); the entrance
 *           never replays; the readout sits at .78
 *   moving  the readout returns to 1
 *   copied  the readout reads COPIED · PNG W × H for 900 ms
 * lite      one quiet 1 pt ring, no collar, no handles, no entrance: a
 *           member of a multi-selection, or a selection made by finishing
 * ───────────────────────────────────────────────────────── */

export type SelectionHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export type SelectionEdge = 'n' | 'e' | 's' | 'w';

export interface SelectionFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** rest (nothing), hover (corner dots) or selected (ring, handles, readout). */
  state?: 'rest' | 'hover' | 'selected';
  /** ring: the one selection. lite: a quiet ring (multi-selection member, or a selection made by finishing). */
  variant?: 'ring' | 'lite';
  /** writing dims the readout to .78; moving returns it to 1. */
  mode?: 'idle' | 'writing' | 'moving';
  /** The object's corner radius. The ring's is this plus the selection offset (6). */
  radius?: number;
  /**
   * Which handles show. object: eight, all resize. text: corners and e/w set the width, n and s are
   * grips that move the object. none: no handles.
   */
  handles?: 'object' | 'text' | 'none';
  /** Show the readout under the object (default true while selected). */
  readout?: boolean;
  /** Blocks in a multi-selection: the readout reads "● N · W × H". */
  count?: number;
  /** The frame to read. Default: the host's measured border box, fractional, rounded for display. */
  size?: { width: number; height: number };
  /** Set to a format (e.g. "PNG") after a copy: the readout says so for 900 ms. */
  copied?: string | null;
  /** The band edge under the pointer: its edge light shows. */
  edge?: SelectionEdge | null;
  /** The band corner under the pointer: a soft glow shows behind it. */
  corner?: 'nw' | 'ne' | 'se' | 'sw' | null;
  /** Play the ring's entrance when it becomes selected (default true). */
  entrance?: boolean;
  /** A handle was pressed. The host resizes or moves the object; the frame follows its box. */
  onHandlePointerDown?: (handle: SelectionHandle, event: React.PointerEvent<HTMLSpanElement>) => void;
}

/* Every value is the presence group. The frame fills its host (the host is position: relative) and
 * every part is placed from the host's box, so the ring tracks the object in the same frame; the parts
 * read the frame's state, variant and mode through the sf group. */
const FRAME = 'mu-selection-frame group/sf absolute inset-0 pointer-events-none presence-frame';
/* 1.25 green at offset 6 and a flat 3.5 collar outside it, never a blur; lite is one quiet ring. It
 * enters once, from 1.02 on the part spring; resizing never replays it. */
const RING = 'mu-sf-ring absolute presence-ring opacity-0 group-data-[state=selected]/sf:opacity-100 group-data-[variant=lite]/sf:presence-ring-lite group-data-[state=selected]/sf:group-data-[variant=ring]/sf:group-data-entrance/sf:animate-sf-in';
/* Hover: only the faint corner dots, where the handles will be. */
const DOT = 'mu-sf-dot absolute size-presence-hover-dot -translate-1/2 rounded-round bg-presence-dot opacity-0 transition-opacity duration-settle ease-settle group-data-[state=hover]/sf:opacity-100';
/* The edge light: the pointer entered the band on one edge. */
const EDGE = 'mu-sf-edge absolute opacity-0 transition-opacity duration-settle ease-settle data-on:opacity-100';
const EDGE_AT = { n: 'presence-edge-n', e: 'presence-edge-e', s: 'presence-edge-s', w: 'presence-edge-w' };
/* The corner glow: the pointer is over a corner of the band, selected or not. */
const GLOW = 'mu-sf-glow absolute -translate-1/2 presence-corner-glow opacity-0 transition-opacity duration-settle ease-settle data-on:opacity-presence-corner-glow';
/* Handles on the ring line: round caps at the corners, capsules at the edge midpoints, each with a hit
 * area 7 wider; on text the n and s capsules are grips. */
const HANDLE = 'mu-sf-handle absolute -translate-1/2 rounded-pill pointer-events-auto touch-none after:absolute after:-inset-presence-handle-hit after:rounded-pill group-data-[state=selected]/sf:group-data-[variant=ring]/sf:group-data-entrance/sf:animate-sf-fade';
const SHAPE = {
  nw: 'size-presence-handle', ne: 'size-presence-handle', se: 'size-presence-handle', sw: 'size-presence-handle',
  e: 'w-presence-capsule-thickness h-presence-capsule-length', w: 'w-presence-capsule-thickness h-presence-capsule-length',
  n: 'w-presence-capsule-length h-presence-capsule-thickness', s: 'w-presence-capsule-length h-presence-capsule-thickness',
};
const RESIZE = {
  nw: 'presence-handle cursor-nwse-resize', se: 'presence-handle cursor-nwse-resize',
  ne: 'presence-handle cursor-nesw-resize', sw: 'presence-handle cursor-nesw-resize',
  e: 'presence-handle cursor-ew-resize', w: 'presence-handle cursor-ew-resize',
  n: 'presence-handle cursor-ns-resize', s: 'presence-handle cursor-ns-resize',
};
const GRIP = 'presence-grip cursor-grab';
/* The readout sits 16 under the object, centred; .78 while writing, 1 while moving. */
const READOUT = 'absolute presence-readout-at group-data-[mode=writing]/sf:opacity-presence-readout-writing group-data-[mode=moving]/sf:opacity-100';

const HANDLES: SelectionHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
// Handle centres on the ring line, as fractions of the host box plus the offset outward.
const AT: Record<SelectionHandle, [number, number, number, number]> = {
  nw: [0, 0, -1, -1], n: [0.5, 0, 0, -1], ne: [1, 0, 1, -1], e: [1, 0.5, 1, 0],
  se: [1, 1, 1, 1], s: [0.5, 1, 0, 1], sw: [0, 1, -1, 1], w: [0, 0.5, -1, 0],
};
const place = (h: SelectionHandle): React.CSSProperties => {
  const [fx, fy, ox, oy] = AT[h];
  return { left: `calc(${fx * 100}% + var(--o) * ${ox})`, top: `calc(${fy * 100}% + var(--o) * ${oy})` };
};

/**
 * The host's border box, fractional and untransformed (a lifted or zoomed host reads its layout size),
 * re-read in the same frame as the host's layout: ResizeObserver runs after layout and before paint,
 * and flushSync commits the new numbers before that paint.
 */
function useHostSize(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  React.useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || !enabled) return;
    const same = (a: { width: number; height: number } | null, w: number, h: number) => !!a && a.width === w && a.height === h;
    setSize((s) => (same(s, host.offsetWidth, host.offsetHeight) ? s : { width: host.offsetWidth, height: host.offsetHeight }));
    const ro = new ResizeObserver(([entry]) => {
      const b = entry.borderBoxSize?.[0];
      const w = b ? b.inlineSize : host.offsetWidth, h = b ? b.blockSize : host.offsetHeight;
      flushSync(() => setSize((s) => (same(s, w, h) ? s : { width: w, height: h })));
    });
    ro.observe(host, { box: 'border-box' });
    return () => ro.disconnect();
  }, [ref, enabled]);
  return size;
}

/**
 * The one selection for every kind of object. Place it as the last child of the object
 * (position: relative). For a borderless object the ring and its handles are the boundary.
 */
export const SelectionFrame = React.forwardRef<HTMLDivElement, SelectionFrameProps>(function SelectionFrame(
  {
    state = 'rest', variant = 'ring', mode = 'idle', radius = 0, handles = 'object', readout = true, count, size,
    copied, edge = null, corner = null, entrance = true, onHandlePointerDown, className, style, ...props
  },
  forwardedRef,
) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
  const selected = state === 'selected';
  const measured = useHostSize(ref, selected && readout && !size);
  const box = size ?? measured;
  const showHandles = selected && variant === 'ring' && handles !== 'none';

  // "COPIED" holds for the token's 900 ms, then the readout reads the frame again.
  const [copiedShown, setCopiedShown] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!copied) return;
    setCopiedShown(copied);
    const ms = parseFloat(getComputedStyle(ref.current ?? document.documentElement).getPropertyValue('--mu-presence-copied-ms')) || 900;
    const t = setTimeout(() => setCopiedShown(null), ms);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-state={state}
      data-variant={variant}
      data-mode={mode}
      data-entrance={entrance ? '' : undefined}
      className={className ? `${FRAME} ${className}` : FRAME}
      style={{ '--mu-sf-radius': `${radius}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <span className={RING} />
      {state === 'hover' || state === 'rest'
        ? (['nw', 'ne', 'se', 'sw'] as SelectionHandle[]).map((c) => <span key={c} className={DOT} style={place(c)} />)
        : null}
      {(['nw', 'ne', 'se', 'sw'] as const).map((c) => (
        <span key={`g-${c}`} className={GLOW} data-corner={c} data-on={corner === c ? '' : undefined} style={place(c)} />
      ))}
      {(['n', 'e', 's', 'w'] as SelectionEdge[]).map((e) => (
        <span key={e} className={`${EDGE} ${EDGE_AT[e]}`} data-edge={e} data-on={edge === e && state !== 'selected' ? '' : undefined} />
      ))}
      {showHandles &&
        HANDLES.map((k) => {
          const grip = handles === 'text' && (k === 'n' || k === 's');
          return (
            <span
              key={k}
              className={`${HANDLE} ${SHAPE[k]} ${grip ? GRIP : RESIZE[k]}`}
              data-handle={k}
              data-grip={grip ? '' : undefined}
              title={grip ? 'Drag to move' : handles === 'text' ? 'Drag to set the width · double-click to fit the text' : undefined}
              style={place(k)}
              onPointerDown={onHandlePointerDown ? (e) => onHandlePointerDown(k, e) : undefined}
            />
          );
        })}
      {selected && readout && box && <SizeReadout className={READOUT} width={box.width} height={box.height} count={count} copied={copiedShown} />}
    </div>
  );
});
