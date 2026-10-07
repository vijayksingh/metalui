import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, OPTIONS, THUMB_LAYERS, WELL_LAYERS, switcherLook, type SwitcherConfig } from './SwitcherXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SWITCHER · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the value, the size).
 *   Everything you tune reaches the control the way the library supports from a host: its
 *   --mu-r-switcher-* and spring variables, and only the ones that differ from the recipe.
 *   Values that are the same in every colorway (padding, the spring) go inline on a wrapper.
 *   Fill and shadow stacks are colours, one set per colorway, so they go in a stylesheet scoped
 *   the way the library scopes its own: the default, then [data-mu-colorway="graphite"].
 *   At defaults the snippet is the agent guide's example, nothing more.
 *   SwiftUI reads the recipe, so its tab carries the props and says so.
 * ───────────────────────────────────────────────────────── */

// SwitcherXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const options = () => ['const OPTIONS = [', ...OPTIONS.map((o) => `  { value: ${q(o.value)}, label: ${q(o.label)} },`), '];'];
const swiftOptions = () => ['    let options = [', ...OPTIONS.map((o) => `        (value: "${o.value}", title: "${o.label}"),`), '    ]'];
const CLASS = 'view-picker';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the shadow stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: SwitcherConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.depth !== INITIAL.depth) parts.push(`well depth ${m.depth}`);
  if (m.lift !== INITIAL.lift) parts.push(`thumb lift ${m.lift}`);
  const off = [...WELL_LAYERS.filter((_, i) => !m.well[i]), ...THUMB_LAYERS.filter((_, i) => !m.thumb[i])].map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: SwitcherConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, switcherLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The React code for a config. */
export function switcherReact(m: SwitcherConfig) {
  const { inline, sheet } = overrides(m);
  const size = m.size === INITIAL.size ? '' : ` size="${m.size}"`;
  const control = `<Switcher aria-label="View"${size} value={view} onValueChange={setView} options={OPTIONS} />`;
  const lines = [`import { useState${inline.length ? ', type CSSProperties' : ''} } from 'react';`, `import { Switcher } from '@unlocalhosted/metalui';`];
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', ...options(), '', 'export function ViewPicker() {', `  const [view, setView] = useState(${q(m.value)});`);
  if (!inline.length && !sheet.length) lines.push(`  return ${control};`);
  else {
    lines.push('  return (', '    // the switcher reads its recipe through these variables, so a wrapper sets them for this one');
    if (sheet.length) lines.push(`    // its fill and shadow stacks are colours, so they are in ${SHEET}, one set per colorway`);
    const cls = sheet.length ? ` className="${CLASS}"` : '';
    if (inline.length) {
      lines.push(`    <div${cls} style={{`);
      inline.forEach(([k, v]) => lines.push(`      ${q(k)}: ${q(v)},`));
      lines.push('    } as CSSProperties}>');
    } else lines.push(`    <div${cls}>`);
    lines.push(`      ${control}`, '    </div>', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function switcherCss(m: SwitcherConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the switcher's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: its props. The recipe is not overridable per instance there. */
export function switcherSwift(m: SwitcherConfig) {
  const tuned = Object.keys(switcherLook(m, COLORWAYS[0]).style).length > 0;
  const size = m.size === INITIAL.size ? '' : `, size: .${m.size}`;
  const lines = ['import SwiftUI', 'import MetalUI', '', 'struct ViewPicker: View {', `    @State private var view = "${m.value}"`, ...swiftOptions(), '', '    var body: some View {'];
  if (tuned) lines.push('        // MetalSwitcher draws from the recipe: the padding, fill, shadows and spring tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalSwitcher("View", selection: $view, options: options${size})`, '    }', '}', '');
  return lines.join('\n');
}

export function SwitcherCodePanel({ config }: { config: SwitcherConfig }) {
  const tabs = React.useMemo(() => {
    const css = switcherCss(config);
    return [
      { id: 'react', label: 'React', code: switcherReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: switcherSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
