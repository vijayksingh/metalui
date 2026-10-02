'use client';

import * as React from 'react';
import { useAwake } from '../../motion/awake';
import { useReducedMotion } from '../../motion/reduced';

export type LedKind = 'live' | 'waiting' | 'failed' | 'link' | 'off';
export type LedGesture = 'steady' | 'flicker' | 'breathe' | 'blink2' | 'rise';
export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: LedKind;
  /** Lens diameter 8 (default) or 6 (small), plus a 1px socket on each side. */
  size?: 'default' | 'small';
  /** Defaults to waiting=breathe, failed=blink2, otherwise steady. Off always stays dark. */
  gesture?: LedGesture;
}
const GESTURES: Record<LedGesture, string> = {
  steady: '', flicker: 'animate-led-flicker', breathe: 'animate-led-breathe',
  blink2: 'animate-led-blink2', rise: 'animate-led-rise',
};
const SIZES = { default: 'size-status-lamp-size', small: 'size-status-lamp-size-small' };

/** Decorative lens inside an opaque socket. Words beside it carry the state. */
export function Led({ kind, size = 'default', gesture, className, style, ...props }: LedProps) {
  const [element, setElement] = React.useState<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion(element);
  const [watch, awake] = useAwake();
  const motion = kind === 'off' ? 'steady' : gesture ?? (kind === 'waiting' ? 'breathe' : kind === 'failed' ? 'blink2' : 'steady');
  const ref = React.useCallback((node: HTMLSpanElement | null) => { setElement(node); watch(node); }, [watch]);
  const ink = `var(--mu-r-status-ink-${kind})`;
  return (
    <span ref={ref} data-mu-self="" aria-hidden data-kind={kind} data-size={size} data-gesture={motion}
      className={`mu-led inline-flex flex-none rounded-round p-status-lamp-bezel recipe-status-socket ${className ?? ''}`}
      style={{ '--mu-self': 'var(--mu-r-status-ink-off)', ...style } as React.CSSProperties} {...props}>
      <span key={`${kind}-${motion}-${reduced}`} data-lamp data-mu-self=""
        className={`inline-block flex-none rounded-round ${SIZES[size]} ${kind === 'off' ? 'recipe-status-lamp-off' : 'recipe-status-lamp'} ${reduced ? '' : GESTURES[motion]}`}
        style={{ '--mu-self': ink, animationPlayState: awake ? 'running' : 'paused' } as React.CSSProperties} />
    </span>
  );
}
