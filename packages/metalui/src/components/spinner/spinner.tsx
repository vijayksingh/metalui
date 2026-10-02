'use client';

import * as React from 'react';
import { useAwake } from '../../motion/awake';
import { useWaiting, type WaitingTiming } from '../../motion/waiting';

/* WAITING SLOT STORYBOARD
 * request       host says busy immediately; its glyph keeps its footprint and ink
 * <400ms        nothing changes visually; fast completion goes straight to the host result
 * 400ms         the glyph slot fades to an arc; steady work turns linearly, 900ms/turn
 * shown+300ms   earliest result; the host shows check or error, never a fictitious percentage
 * 10s           the host may explain what remains once (useWaiting.long)
 * background/offscreen/hidden tab: no arc clock; Reduce Motion: a stationary opacity pulse
 * Large items and places reserve their content shape. Background work belongs to its lamp.
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement>, WaitingTiming {
  /** Keep mounted and set active from the actual request. False stops all work after the minimum. */
  active?: boolean;
  /** 16/12 from the recipe, or a host's glyph diameter in px. Ink always comes from the host. */
  size?: 'regular' | 'small' | number;
  label?: string;
  /** False inside a host that already announces start/result. */
  announce?: boolean;
}

/** Unknown work in the host's glyph slot. Use Progress when the amount is known. */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { active = true, size = 'regular', label = 'Loading', announce = true, showDelay, minVisible, longAfter, className, style, ...props }, ref,
) {
  const root = React.useRef<HTMLSpanElement>(null);
  const [watch, awake] = useAwake();
  const { phase } = useWaiting(active ? 'waiting' : 'done', root, { showDelay, minVisible, longAfter });
  const visible = phase === 'waiting';
  const setRef = React.useCallback((node: HTMLSpanElement | null) => {
    root.current = node; watch(node);
    if (typeof ref === 'function') ref(node); else if (ref) ref.current = node;
  }, [ref, watch]);
  const dimensions = typeof size === 'number' ? { width: size, height: size } : undefined;
  const own = `mu-spinner relative inline-block flex-none rounded-full ${typeof size === 'number' ? '' : size === 'small' ? 'size-spinner-small' : 'size-spinner-size'}`;
  return (
    <span ref={setRef} role={announce && visible ? 'status' : undefined} aria-label={announce && visible ? label : undefined}
      aria-hidden={!announce || !visible ? true : undefined} data-size={size} data-visible={visible ? '' : undefined}
      className={[own, visible ? 'spinner-arrive' : '', className].filter(Boolean).join(' ')} style={{ ...dimensions, ...style, visibility: visible ? 'visible' : 'hidden' }} {...props}>
      {visible && <span aria-hidden className="mu-spinner-arc spinner-arc" style={{ animationPlayState: awake ? 'running' : 'paused' }} />}
    </span>
  );
});
