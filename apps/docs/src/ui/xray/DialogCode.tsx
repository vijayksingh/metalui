import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, dialogLook, type DialogConfig } from './DialogXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · DIALOG · THE CODE
 *
 *   The code for exactly the dialog in the x-ray, as a person really opens one: a trigger, the
 *   Dialog with its Popup, Title, the field and the Actions, every word a prop. Nothing here is the
 *   still. What you tune reaches the dialog the way the library supports from a host:
 *     - where it sits and how far it drops in are the popup's own variables (--mu-r-dialog-self-top,
 *       --mu-r-dialog-self-enter-y), one value in every colorway, so they go on the popup's style;
 *     - the plate's fill and shadow stack (its height, its layers) are colours, one set per colorway,
 *       so they go in a stylesheet on the popup's class, scoped the way the library scopes its own;
 *     - how much the sheet dims is the scrim's colour, and the library portals the scrim to the body,
 *       so it has no per-instance form: the stylesheet sets it on the root, and says that it is page-wide.
 *   At defaults the snippet is the dialog as the agent guide composes it, nothing more. SwiftUI
 *   presents a native sheet from the recipe, so its tab carries the words and says so.
 * ───────────────────────────────────────────────────────── */

// DialogXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const jsx = (s: string) => s.replace(/[{}<>]/g, '');
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
/** A stack one layer to a line, so a long shadow reads. */
const layers = (v: string) => v.split(/,\s*(?![^(]*\))/);

/** The component, class and sheet names, from the title: "Rename canvas" → RenameCanvas, rename-canvas. */
export function names(title: string) {
  const words = title.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('') || 'Ask';
  const component = /^\d/.test(pascal) ? `Ask${pascal}` : pascal;
  const cls = (words.join('-').toLowerCase() || 'ask').replace(/^(\d)/, 'ask-$1');
  return { component, cls, sheet: `${cls}.css` };
}

/** What a config sets, split by where it belongs: on the popup (one value everywhere), per colorway on its class, or page-wide. */
function overrides(m: DialogConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => { const l = dialogLook(m, c); return [c, { ...(l.style as Record<string, string>), ...l.page }]; })) as Record<Colorway, Record<string, string>>;
  const popup = Object.keys(dialogLook(m, COLORWAYS[0]).style);
  const inline = popup.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = popup.filter(coloured);
  const page = Object.keys(dialogLook(m, COLORWAYS[0]).page);
  return { inline, sheet, page, by };
}

/** The values the plate's colours were derived from, for the one line that says where they came from. */
function derivedFrom(m: DialogConfig) {
  const parts: string[] = [];
  if (m.lift !== INITIAL.lift) parts.push(`height ${m.lift.toFixed(1)}`);
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** The React code for a config: the dialog as a person opens it. */
export function dialogReact(m: DialogConfig) {
  const { inline, sheet, page } = overrides(m);
  const { component, cls, sheet: sheetName } = names(m.title);
  const styled = sheet.length > 0 || page.length > 0;
  const lines: string[] = [];
  lines.push(inline.length ? `import { useState, type CSSProperties } from 'react';` : `import { useState } from 'react';`);
  lines.push(`import { Button, Dialog, Field } from '@unlocalhosted/metalui';`);
  if (styled) lines.push(`import './${sheetName}';`);
  lines.push('', `export function ${component}() {`, '  const [open, setOpen] = useState(false);', '  return (', '    <>');
  lines.push(`      <Button onClick={() => setOpen(true)}>${jsx(m.title)}…</Button>`);
  lines.push('      <Dialog open={open} onOpenChange={setOpen}>');
  if (inline.length) lines.push('        {/* the popup reads its place and its drop through these variables, so they are set on this one */}');
  if (sheet.length) lines.push(`        {/* its plate's fill and shadow stack are colours, so they are in ${sheetName}, one set per colorway */}`);
  if (page.length && !sheet.length) lines.push(`        {/* the sheet it dims the page with is the page's: ${sheetName} sets it on the root */}`);
  const props = [`aria-label="${jsx(m.title)}"`];
  if (sheet.length) props.push(`className="${cls}"`);
  if (!inline.length) lines.push(`        <Dialog.Popup ${props.join(' ')}>`);
  else {
    lines.push('        <Dialog.Popup');
    props.forEach((p) => lines.push(`          ${p}`));
    lines.push('          style={{');
    inline.forEach(([k, v]) => lines.push(`            ${q(k)}: ${q(v)},`));
    lines.push('          } as CSSProperties}', '        >');
  }
  lines.push(`          <Dialog.Title>${jsx(m.title)}</Dialog.Title>`);
  lines.push(`          <Field size="regular"><Field.Input defaultValue="${jsx(m.value)}" aria-label="${jsx(m.label)}" /></Field>`);
  lines.push('          <Dialog.Actions>');
  lines.push(`            <Button onClick={() => setOpen(false)}>${jsx(m.cancel)}</Button>`);
  lines.push(`            <Button cap="primary" onClick={() => setOpen(false)}>${jsx(m.confirm)}</Button>`);
  lines.push('          </Dialog.Actions>', '        </Dialog.Popup>', '      </Dialog>', '    </>', '  );', '}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the plate's colours on the popup's class, and the sheet's on the root, a block per colorway. */
export function dialogCss(m: DialogConfig) {
  const { sheet, page, by } = overrides(m);
  if (!sheet.length && !page.length) return '';
  const { cls } = names(m.title);
  const out: string[] = [];
  const block = (head: string, keys: string[], c: Colorway) => {
    out.push(head);
    for (const n of keys) {
      const parts = layers(by[c][n]);
      if (parts.length === 1) out.push(`  ${n}: ${parts[0]};`);
      else out.push(`  ${n}:`, ...parts.map((p, i) => `    ${p}${i === parts.length - 1 ? ';' : ','}`));
    }
    out.push('}');
  };
  if (sheet.length) {
    const derived = derivedFrom(m);
    out.push(`/* the dialog's plate, derived from the surface recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`);
    for (const c of COLORWAYS) block(c === COLORWAYS[0] ? `.${cls}, [data-mu-colorway="${c}"] .${cls} {` : `[data-mu-colorway="${c}"] .${cls} {`, sheet, c);
  }
  if (page.length) {
    if (sheet.length) out.push('');
    out.push(`/* the sheet dims ${Math.round(m.dim * 100)}%. The library portals the scrim to the body, so it has no per-instance form: this is page-wide, under every dialog */`);
    for (const c of COLORWAYS) block(c === COLORWAYS[0] ? `:root, [data-mu-colorway="${c}"] {` : `[data-mu-colorway="${c}"] {`, page, c);
  }
  out.push('');
  return out.join('\n');
}

/** The SwiftUI code for a config: the words. MetalDialog presents a native sheet from the recipe. */
export function dialogSwift(m: DialogConfig) {
  const { inline, sheet, page } = overrides(m);
  const { component } = names(m.title);
  const s = (v: string) => `"${v.replace(/"/g, '\\"')}"`;
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${component}: View {`, '    @State private var open = false', `    @State private var name = ${s(m.value)}`, '', '    var body: some View {'];
  lines.push(`        MetalButton(${s(`${m.title}…`)}) { open = true }`);
  if (inline.length || sheet.length || page.length) lines.push('        // MetalDialog presents a native sheet from the recipe: the dim, where it sits, how far it drops in, its height and layers are not per-instance props in SwiftUI');
  lines.push(`        MetalDialog(isPresented: $open, title: ${s(m.title)}) {`);
  lines.push('            // MetalUI has no field in SwiftUI yet: the system one, named for assistive tech');
  lines.push(`            TextField(${s(m.label)}, text: $name)`);
  lines.push('        } actions: {');
  lines.push(`            MetalButton(${s(m.cancel)}) { open = false }`);
  lines.push(`            MetalButton(${s(m.confirm)}, cap: .primary) { open = false }`);
  lines.push('        }', '    }', '}', '');
  return lines.join('\n');
}

export function DialogCodePanel({ config }: { config: DialogConfig }) {
  const tabs = React.useMemo(() => {
    const css = dialogCss(config);
    return [
      { id: 'react', label: 'React', code: dialogReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: dialogSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
