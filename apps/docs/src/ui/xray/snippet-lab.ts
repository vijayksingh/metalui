import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as lib from '@unlocalhosted/metalui';

/* The x-ray's code, run. A feature slice (e2e/xray-switcher-code.spec.ts, e2e/xray-slider-code.spec.ts)
 * compiles the snippet the panel shows and runs it here, in the page, with the page's own React and
 * library, so the proof is the snippet itself rendering next to the specimen. The snippet's imports
 * are stripped, so every library export is in scope by its name, and `name` is the component it
 * exports. Only the dev server serves this module: nothing in the site imports it, so it never
 * reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement, name = 'ViewPicker') {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const names = Object.keys(lib).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default');
  const make = new Function('React', 'useState', ...names, `${body}\nreturn ${name};`) as (...args: unknown[]) => React.ComponentType;
  const Snippet = make(React, React.useState, ...names.map((n) => (lib as Record<string, unknown>)[n]));
  createRoot(mount).render(React.createElement(Snippet));
}
