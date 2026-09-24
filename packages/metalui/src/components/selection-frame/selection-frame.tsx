'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';
import './selection-frame.css';

/* ─────────────────────────────────────────────────────────
 * SELECTION FRAME · KAMUI-14 (the demo's renderSelection, as one object)
 *
 * rest      nothing: a borderless object has no edge at rest
 * hover     faint corner dots where the handles will be (settle fade);
 *           an edge light on the side the pointer entered the band
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
  /** Play the ring's entrance when it becomes selected (default true). */
  entrance?: boolean;
  /** A handle was pressed. The host resizes or moves the object; the frame follows its box. */
  onHandlePointerDown?: (handle: SelectionHandle, event: React.PointerEvent<HTMLSpanElement>) => void;
}

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
 * KAMUI-14: the one selection for every kind of object. Place it as the last child of the object
 * (position: relative). For a borderless object the ring and its handles are the boundary.
 */
export const SelectionFrame = React.forwardRef<HTMLDivElement, SelectionFrameProps>(function SelectionFrame(
  {
    state = 'rest', variant = 'ring', mode = 'idle', radius = 0, handles = 'object', readout = true, count, size,
    copied, edge = null, entrance = true, onHandlePointerDown, className, style, ...props
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

  const w = box ? Math.round(box.width) : 0;
  const h = box ? Math.round(box.height) : 0;

  return (
    <div
      ref={ref}
      aria-hidden
      data-state={state}
      data-variant={variant}
      data-mode={mode}
      data-entrance={entrance ? '' : undefined}
      className={className ? `mu-selection-frame ${className}` : 'mu-selection-frame'}
      style={{ '--mu-sf-radius': `${radius}px`, ...style } as React.CSSProperties}
      {...props}
    >
      <span className="mu-sf-ring" />
      {state === 'hover' || state === 'rest'
        ? (['nw', 'ne', 'se', 'sw'] as SelectionHandle[]).map((c) => <span key={c} className="mu-sf-dot" style={place(c)} />)
        : null}
      {(['n', 'e', 's', 'w'] as SelectionEdge[]).map((e) => (
        <span key={e} className="mu-sf-edge" data-edge={e} data-on={edge === e && state !== 'selected' ? '' : undefined} />
      ))}
      {showHandles &&
        HANDLES.map((k) => {
          const grip = handles === 'text' && (k === 'n' || k === 's');
          return (
            <span
              key={k}
              className="mu-sf-handle"
              data-handle={k}
              data-grip={grip ? '' : undefined}
              title={grip ? 'Drag to move' : handles === 'text' ? 'Drag to set the width · double-click to fit the text' : undefined}
              style={place(k)}
              onPointerDown={onHandlePointerDown ? (e) => onHandlePointerDown(k, e) : undefined}
            />
          );
        })}
      {selected && readout && box && (
        <span className="mu-sf-readout mu-type-readout">
          <span className="mu-sf-led" />
          {copiedShown ? (
            <>COPIED <span className="mu-sf-x">·</span> {copiedShown} {w} <span className="mu-sf-x">×</span> {h}</>
          ) : count && count > 1 ? (
            <>{count} <span className="mu-sf-x">·</span> {w} <span className="mu-sf-x">×</span> {h}</>
          ) : (
            <>{w} <span className="mu-sf-x">×</span> {h}</>
          )}
        </span>
      )}
    </div>
  );
});
