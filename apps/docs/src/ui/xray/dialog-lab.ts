import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { DialogFace, INITIAL, dialogLook, type DialogConfig } from './DialogXray';

/* The dialog x-ray's face, mounted for a proof. A feature slice (e2e/xray-dialog-code.spec.ts) compiles the
 * snippet the panel shows, runs it in the page (snippet-lab.ts) and opens the real dialog from its trigger;
 * then it mounts the face the specimen is built from here, at full size and the page's colorway, and compares
 * the two plates pixel for pixel. Only the dev server serves this module: nothing in the site imports it, so
 * it never reaches the build. */
export function mountFace(seed: Partial<DialogConfig>, host: HTMLElement) {
  const m: DialogConfig = { ...INITIAL, ...seed };
  const colorway = document.documentElement.dataset.muColorway === 'graphite' ? 'graphite' : 'bone';
  createRoot(host).render(React.createElement(DialogFace, { m, look: dialogLook(m, colorway) }));
}
