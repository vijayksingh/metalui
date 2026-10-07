import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as lib from '@unlocalhosted/metalui';
import { DrawIcon, NoteIcon, SelectIcon, TidyIcon } from '@unlocalhosted/metalui/icons';

/* The toolbar x-ray's code, run. A feature slice (e2e/xray-toolbar-code.spec.ts) compiles the snippet
 * the panel shows and runs it here, in the page, with the page's own React, library and icons, so the
 * proof is the snippet itself rendering next to the specimen. The snippet's imports are stripped, so
 * every library export and the four tools' icons are in scope by their names. Only the dev server
 * serves this module: nothing in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const icons = { DrawIcon, NoteIcon, SelectIcon, TidyIcon };
  const names = Object.keys(lib).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== 'default');
  const make = new Function('React', 'useState', ...names, ...Object.keys(icons), `${body}\nreturn CanvasTools;`) as (...args: unknown[]) => React.ComponentType;
  const CanvasTools = make(React, React.useState, ...names.map((n) => (lib as Record<string, unknown>)[n]), ...Object.values(icons));
  createRoot(mount).render(React.createElement(CanvasTools));
}
