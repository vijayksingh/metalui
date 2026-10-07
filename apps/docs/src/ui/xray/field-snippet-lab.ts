import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Field, Kbd } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';

/* The field x-ray's code, run. A feature slice (e2e/xray-field-code.spec.ts) compiles the snippet the
 * panel shows and runs it here, in the page, with the page's own React and library, so the proof is
 * the snippet itself rendering next to the specimen. Only the dev server serves this module: nothing
 * in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const make = new Function('React', 'useState', 'Field', 'Kbd', 'Icon', `${body}\nreturn LensField;`) as (R: typeof React, u: typeof React.useState, F: typeof Field, K: typeof Kbd, I: typeof Icon) => React.ComponentType;
  const LensField = make(React, React.useState, Field, Kbd, Icon);
  createRoot(mount).render(React.createElement(LensField));
}
