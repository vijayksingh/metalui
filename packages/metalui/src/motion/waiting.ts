'use client';

import * as React from 'react';
import { WAITING_TIMING } from './waiting.generated';

export type WaitingState = 'idle' | 'waiting' | 'done' | 'error';
export interface WaitingTiming {
  showDelay?: number;
  minVisible?: number;
  longAfter?: number;
}

/** Host-owned work, presentation-owned timing. No frame loop; a new request cancels stale results. */
export function useWaiting(state: WaitingState, root: React.RefObject<Element | null>, timing: WaitingTiming = {}) {
  const [phase, setPhase] = React.useState<WaitingState>(state === 'waiting' ? 'idle' : state);
  const [long, setLong] = React.useState(false);
  const visibleAt = React.useRef<number | undefined>(undefined);
  const requestedAt = React.useRef<number | undefined>(undefined);
  const previous = React.useRef<WaitingState | undefined>(undefined);
  React.useEffect(() => {
    const css = root.current ? getComputedStyle(root.current) : undefined;
    const ms = (override: number | undefined, key: string, fallback: number) => {
      const parsed = parseFloat(css?.getPropertyValue(key) ?? '');
      const value = override ?? (Number.isFinite(parsed) ? parsed : fallback);
      return Number.isFinite(value) ? Math.max(0, value) : fallback;
    };
    const delay = ms(timing.showDelay, '--mu-waiting-show-delay', WAITING_TIMING.showDelay);
    const minimum = ms(timing.minVisible, '--mu-waiting-minimum-visible', WAITING_TIMING.minimumVisible);
    const explain = ms(timing.longAfter, '--mu-waiting-long-after', WAITING_TIMING.longAfter);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let longTimer: ReturnType<typeof setTimeout> | undefined;
    if (state === 'waiting') {
      if (previous.current !== 'waiting') { requestedAt.current = performance.now(); setLong(false); }
      if (visibleAt.current === undefined) {
        setPhase('idle');
        timer = setTimeout(() => { visibleAt.current = performance.now(); setPhase('waiting'); }, delay);
      }
      longTimer = setTimeout(() => setLong(true), Math.max(0, explain - (performance.now() - (requestedAt.current ?? performance.now()))));
    } else {
      const remaining = state === 'idle' || visibleAt.current === undefined ? 0 : minimum - (performance.now() - visibleAt.current);
      const finish = () => { visibleAt.current = undefined; requestedAt.current = undefined; setLong(false); setPhase(state); };
      if (remaining > 0) timer = setTimeout(finish, remaining); else finish();
    }
    previous.current = state;
    return () => { clearTimeout(timer); clearTimeout(longTimer); };
  }, [state, root, timing.showDelay, timing.minVisible, timing.longAfter]);
  return { phase, long };
}
