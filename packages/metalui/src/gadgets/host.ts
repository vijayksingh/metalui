'use client';
// Which world a gadget sits in: the nearest data-mu-colorway, else the system's light or dark,
// and whether the person asked for more contrast. Gadget bodies are pigment, so the host changes
// only the world around them (tokens gadgets.host).
import * as React from 'react';
import type { Host } from './light';

function read(el: Element | null): { host: Host; contrast: boolean } {
  const attr = el?.closest('[data-mu-colorway]')?.getAttribute('data-mu-colorway');
  const dark = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const contrast = !!el?.closest('[data-mu-contrast="more"]') || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-contrast: more)').matches);
  return { host: attr === 'graphite' || (!attr && dark) ? 'graphite' : 'bone', contrast };
}

/** The host of the element `ref` points at, kept current as colorway attributes and media change. */
export function useHost(ref: React.RefObject<Element | null>, override?: Host) {
  const [state, set] = React.useState<{ host: Host; contrast: boolean }>({ host: override ?? 'bone', contrast: false });
  React.useEffect(() => {
    const update = () => { const r = read(ref.current); set((s) => (s.host === (override ?? r.host) && s.contrast === r.contrast ? s : { host: override ?? r.host, contrast: r.contrast })); };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-mu-colorway', 'data-mu-contrast'] });
    const qs = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => matchMedia(q));
    qs.forEach((q) => q.addEventListener('change', update));
    return () => { mo.disconnect(); qs.forEach((q) => q.removeEventListener('change', update)); };
  }, [ref, override]);
  return state;
}
