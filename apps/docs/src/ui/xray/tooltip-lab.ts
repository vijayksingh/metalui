import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { IconButton, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';
import { Icon } from '@unlocalhosted/metalui/icons';

/* The tooltip x-ray's code, run. A feature slice (e2e/xray-tooltip-code.spec.ts) compiles the snippet
 * the panel shows and runs it here, in the page, with the page's own React and library, so the proof
 * is the snippet itself rendering next to the specimen: a real tool whose real tooltip, pointed at,
 * is the specimen's chip. Only the dev server serves this module: nothing in the site imports it, so
 * it never reaches the build. */
export function runSnippet(body: string, css: string, mount: HTMLElement) {
  // beside the mount, not in it: a root's render replaces the mount's children
  if (css) { const sheet = document.createElement('style'); sheet.textContent = css; mount.before(sheet); }
  const make = new Function('React', 'IconButton', 'Tooltip', 'TooltipProvider', 'Icon', `${body}\nreturn SelectTool;`) as (R: typeof React, B: typeof IconButton, T: typeof Tooltip, P: typeof TooltipProvider, I: typeof Icon) => React.ComponentType;
  const SelectTool = make(React, IconButton, Tooltip, TooltipProvider, Icon);
  createRoot(mount).render(React.createElement(SelectTool));
}
