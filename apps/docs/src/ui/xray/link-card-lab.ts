import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { LinkCard } from '@unlocalhosted/metalui';

/* The link card x-ray's code, run. A feature slice (e2e/xray-link-code.spec.ts) compiles the snippet
 * the panel shows and runs it here, in the page, with the page's own React and library, so the proof
 * is the snippet itself rendering next to the specimen. Only the dev server serves this module:
 * nothing in the site imports it, so it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const make = new Function('React', 'LinkCard', `${body}\nreturn BrandLinkCard;`) as (R: typeof React, L: typeof LinkCard) => React.ComponentType;
  const BrandLinkCard = make(React, LinkCard);
  createRoot(mount).render(React.createElement(BrandLinkCard));
}
