import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Swatch } from '@unlocalhosted/metalui';

/* The swatch x-ray's code, run. A feature slice (e2e/xray-swatch-code.spec.ts) compiles the snippet
 * the panel shows and runs it here, in the page, with the page's own React and library, so the proof
 * is the snippet itself rendering next to the specimen. Only the dev server serves this module:
 * nothing in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const make = new Function('React', 'Swatch', `${body}\nreturn BrandSwatch;`) as (R: typeof React, S: typeof Swatch) => React.ComponentType;
  const BrandSwatch = make(React, Swatch);
  createRoot(mount).render(React.createElement(BrandSwatch));
}
