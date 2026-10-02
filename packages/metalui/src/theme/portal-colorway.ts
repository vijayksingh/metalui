'use client';

import * as React from 'react';

/** Carry an anchor's nearest explicit colorway across a DOM portal.
 * Copy the result onto the portal's positioner; never move a popup inside a clipped host.
 * Ancestor changes update open popups, while an absent override keeps normal CSS inheritance.
 */
export function usePortalColorway(anchor?: Element | null): string | undefined {
  const snapshot = React.useCallback(() => {
    if (typeof document === 'undefined') return undefined;
    return (anchor ?? document.documentElement).closest('[data-mu-colorway]')?.getAttribute('data-mu-colorway') ?? undefined;
  }, [anchor]);
  const subscribe = React.useCallback((notify: () => void) => {
    if (typeof document === 'undefined') return () => {};
    const observer = new MutationObserver(notify);
    for (let element: Element | null = anchor ?? document.documentElement; element; element = element.parentElement) {
      observer.observe(element, { attributes: true, attributeFilter: ['data-mu-colorway'] });
    }
    return () => observer.disconnect();
  }, [anchor]);
  return React.useSyncExternalStore(subscribe, snapshot, () => undefined);
}
