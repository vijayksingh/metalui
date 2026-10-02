'use client';

import * as React from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Read the OS preference and MetalUI's motion switch at an element. Safe during SSR. */
export function motionReduced(element?: Element | null): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return window.matchMedia(QUERY).matches
    || !!(element ?? document.documentElement).closest('.rm, [data-mu-motion="reduce"]');
}

/** Subscribe to both motion switches, including live changes on a scoped ancestor. */
export function useReducedMotion(element?: Element | null): boolean {
  const subscribe = React.useCallback((notify: () => void) => {
    const media = window.matchMedia(QUERY);
    const observer = new MutationObserver(notify);
    media.addEventListener('change', notify);
    for (let ancestor: Element | null = element ?? document.documentElement; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['class', 'data-mu-motion'] });
    }
    return () => {
      media.removeEventListener('change', notify);
      observer.disconnect();
    };
  }, [element]);
  const snapshot = React.useCallback(() => motionReduced(element), [element]);
  return React.useSyncExternalStore(subscribe, snapshot, () => false);
}
