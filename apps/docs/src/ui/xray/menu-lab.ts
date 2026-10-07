import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as lib from '@unlocalhosted/metalui';
import * as icons from '@unlocalhosted/metalui/icons';

/* The menu x-ray's code, run. A feature slice (e2e/xray-menu-code.spec.ts) compiles the snippet the
 * panel shows and runs it here, in the page, with the page's own React and library, so the proof is
 * the snippet itself opening a real menu next to the specimen. It is snippet-lab with the icons in
 * scope too, since a menu's rows carry glyphs from '@unlocalhosted/metalui/icons'. Only the dev
 * server serves this module: nothing in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement, name = 'NoteActions') {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const scope: Record<string, unknown> = { ...lib, ...icons };
  const names = Object.keys(scope).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default');
  const make = new Function('React', 'useState', ...names, `${body}\nreturn ${name};`) as (...args: unknown[]) => React.ComponentType<Record<string, () => void>>;
  const Snippet = make(React, React.useState, ...names.map((n) => scope[n]));
  createRoot(mount).render(React.createElement(Snippet, { onTask: () => {}, onPin: () => {}, onDelete: () => {} }));
}
