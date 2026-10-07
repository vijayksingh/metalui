import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, PILL, SUB, TITLE, UNDO, ownStay, toastLook, type ToastConfig } from './ToastXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOAST · THE CODE
 *
 *   The code for exactly the toast in the x-ray: not a still, but how it is raised. The provider
 *   once near the root, then the call, with the options the config sets (the detail, the kind,
 *   Undo and its key, how long it stays) and none it leaves at the kind's own.
 *   Everything you tune reaches the toast the way the library supports from a host: its
 *   --mu-r-toast-* variables, and only the ones that differ from the recipe. The deck is drawn
 *   in a portal at the root, so no wrapper can hand them down: they all go in a stylesheet,
 *   scoped the way the library scopes its own. Values that are the same in every colorway on
 *   :root; the fill and shadow stacks, which are colours, once per colorway (the default, then
 *   [data-mu-colorway="graphite"]).
 *   At defaults the snippet is the agent guide's example, nothing more.
 *   SwiftUI takes the same options; the recipe is not per instance there, and its tab says so.
 * ───────────────────────────────────────────────────────── */

// ToastXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const NAME = 'UndoToast';
const SHEET = 'undo-toast.css';
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: ToastConfig) {
  const parts: string[] = [];
  if (m.lift !== INITIAL.lift) parts.push(`lift ${m.lift}`);
  const off = [...PILL.filter((_, i) => !m.pill[i]), ...UNDO.filter((_, i) => !m.cap[i])].map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: one value everywhere, or one per colorway. */
function overrides(m: ToastConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, toastLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const shared = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { shared, sheet, by };
}

/** The call's options for a config: what the toast says, and what it leaves at the kind's own. */
function options(m: ToastConfig, lang: 'tsx' | 'swift') {
  const out: string[] = [];
  const stays = m.timeout !== null && m.timeout !== ownStay(m) ? m.timeout : null;
  if (lang === 'tsx') {
    out.push(`title: ${q(TITLE)}`);
    if (m.sub) out.push(`sub: ${q(SUB)}`);
    if (m.tone !== 'default') out.push(`tone: ${q(m.tone)}`);
    if (m.undo) out.push('undo: () => { /* put the blocks back */ }');
    if (m.undo && !m.key) out.push('undoShortcut: false');
    if (stays !== null) out.push(`timeout: ${stays}`);
  } else {
    out.push(`"${TITLE}"`);
    if (m.sub) out.push(`sub: "${SUB}"`);
    if (m.tone !== 'default') out.push(`tone: .${m.tone}`);
    if (m.undo) out.push('undo: { /* put the blocks back */ }');
    if (m.undo && !m.key) out.push('undoShortcut: false');
    if (stays !== null) out.push(`timeout: ${stays}`);
  }
  return out;
}

/** The React code for a config. */
export function toastReact(m: ToastConfig) {
  const { shared, sheet } = overrides(m);
  const tuned = shared.length > 0 || sheet.length > 0;
  const opts = options(m, 'tsx');
  const lines = [`import { Button, ToastProvider, useToast } from '@unlocalhosted/metalui';`];
  if (tuned) lines.push(`import './${SHEET}';`);
  lines.push('', '/** Does the thing, then says so: the toast is the result, with its way back. */', 'function MoveBlocks() {', '  const toast = useToast();');
  if (opts.length <= 2) lines.push(`  const move = () => toast.show({ ${opts.join(', ')} });`);
  else {
    lines.push('  const move = () => toast.show({');
    opts.forEach((o) => lines.push(`    ${o},`));
    lines.push('  });');
  }
  lines.push('  return <Button onClick={move}>Move 3 blocks</Button>;', '}', '');
  if (tuned) lines.push('// the toast reads its recipe through the variables in the stylesheet: the deck is drawn at the root, so they are set there');
  lines.push('// the provider once, near the root: the deck is drawn at the bottom of the page', `export function ${NAME}() {`, '  return (', '    <ToastProvider>', '      <MoveBlocks />', '    </ToastProvider>', '  );', '}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the recipe's variables at the root, the colour stacks once per colorway. */
export function toastCss(m: ToastConfig) {
  const { shared, sheet, by } = overrides(m);
  if (!shared.length && !sheet.length) return '';
  const lines: string[] = [];
  if (shared.length) {
    lines.push('/* the toast is drawn in a portal at the root, so its recipe is set there, the way the library sets its own */', ':root {');
    shared.forEach(([n, v]) => lines.push(`  ${n}: ${v};`));
    lines.push('}');
  }
  if (sheet.length) {
    const derived = derivedFrom(m);
    if (shared.length) lines.push('');
    lines.push(`/* the toast's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}: colours, so one set per colorway */`);
    for (const c of COLORWAYS) {
      lines.push(c === COLORWAYS[0] ? `:root, [data-mu-colorway="${c}"] {` : `[data-mu-colorway="${c}"] {`);
      sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
      lines.push('}');
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: the deck, and the same call. The recipe is not overridable per instance there. */
export function toastSwift(m: ToastConfig) {
  const tuned = Object.keys(toastLook(m, COLORWAYS[0]).style).length > 0;
  const opts = options(m, 'swift');
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${NAME}: View {`, '    @State private var deck = MetalToastDeck()', '', '    var body: some View {'];
  if (tuned) lines.push('        // MetalToast draws from the recipe: the spacing, rise, lift and layers tuned here are not per-instance values in SwiftUI');
  lines.push('        MetalButton("Move 3 blocks") {', '            // move the blocks, then say so');
  if (opts.length <= 2) lines.push(`            deck.show(.init(${opts.join(', ')}))`);
  else {
    lines.push('            deck.show(.init(');
    opts.forEach((o, i) => lines.push(`                ${o}${i < opts.length - 1 ? ',' : ''}`));
    lines.push('            ))');
  }
  lines.push('        }', '        .metalToastDeck(deck)', '    }', '}', '');
  return lines.join('\n');
}

export function ToastCodePanel({ config }: { config: ToastConfig }) {
  const tabs = React.useMemo(() => {
    const css = toastCss(config);
    return [
      { id: 'react', label: 'React', code: toastReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: toastSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
