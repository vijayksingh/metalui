import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as lib from '@unlocalhosted/metalui';
import * as icons from '@unlocalhosted/metalui/icons';

/* The x-ray's code, run. A feature slice (e2e/xray-<name>-code.spec.ts) compiles the snippet the panel
 * shows and runs it here, in the page, with the page's own React and library, so the proof is the
 * snippet itself rendering next to the specimen. The snippet's imports are stripped, so React, every
 * library export and every icon is in scope by its name, and `name` is the component it exports.
 * Only the dev server serves this module: nothing in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement, name = 'ViewPicker', props?: Record<string, unknown>) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const valid = (n: string) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default';
  const scope: Record<string, unknown> = { React, useState: React.useState };
  for (const [n, v] of Object.entries(icons)) if (valid(n)) scope[n] = v;
  for (const [n, v] of Object.entries(lib)) if (valid(n)) scope[n] = v;
  const make = new Function(...Object.keys(scope), `${body}\nreturn ${name};`) as (...args: unknown[]) => React.ComponentType<Record<string, unknown>>;
  const Snippet = make(...Object.values(scope));
  createRoot(mount).render(React.createElement(Snippet, props));
}
