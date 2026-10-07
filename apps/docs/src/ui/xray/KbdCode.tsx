import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, kbdLook, type KbdConfig } from './KbdXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · KEYCAP · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the glyph, the size, the
 *   surface). Everything you tune reaches the keycap the way the library supports from a host: its
 *   --mu-r-kbd-* variables, and only the ones that differ from the recipe. Values that are the same
 *   in every colorway (padding, corners, the glyph's size and spacing) go inline on the keycap.
 *   Fill and shadow stacks are colours, so they go in a stylesheet scoped the way the library scopes
 *   its own: the default, then [data-mu-colorway="graphite"]. A surface whose colours are the same in
 *   every colorway (the strip, the sunk key) gets one block.
 *   At defaults the snippet is the agent guide's example, nothing more.
 *   SwiftUI takes the props only (size, surface) and says so.
 * ───────────────────────────────────────────────────────── */

// KbdXray imports this file back, so its constants are read only inside the functions
const CLASS = 'search-key';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values can differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the shadow stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: KbdConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.surface === 'default' && m.lift !== INITIAL.lift) parts.push(`height ${m.lift}`);
  const off = LAYERS[m.surface].filter((_, i) => !m.on[m.surface][i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: KbdConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, kbdLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The React code for a config. */
export function kbdReact(m: KbdConfig) {
  const { inline, sheet } = overrides(m);
  const attrs = [
    ...(m.size === INITIAL.size ? [] : [`size="${m.size}"`]),
    ...(m.surface === INITIAL.surface ? [] : [`surface="${m.surface}"`]),
    ...(sheet.length ? [`className="${CLASS}"`] : []),
  ];
  const lines: string[] = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { Kbd } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', 'export function SearchKey() {');
  if (!inline.length) lines.push(`  return <Kbd${attrs.map((a) => ` ${a}`).join('')}>${m.glyph}</Kbd>;`);
  else {
    lines.push('  // the keycap reads its recipe through these variables, so setting them on it sets this one');
    if (sheet.length) lines.push(`  // its fill and shadow stacks are colours, so they are in ${SHEET}, one set per colorway`);
    lines.push('  return (', '    <Kbd', ...attrs.map((a) => `      ${a}`), '      style={{');
    inline.forEach(([k, v]) => lines.push(`        '${k}': '${v}',`));
    lines.push('      } as CSSProperties}', '    >', `      ${m.glyph}`, '    </Kbd>', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function kbdCss(m: KbdConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the keycap's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  // colours that are the same in every colorway need one block
  const alike = sheet.every((n) => COLORWAYS.every((c) => by[c][n] === by[COLORWAYS[0]][n]));
  const blocks = alike ? [[COLORWAYS[0], `.${CLASS} {`] as const] : COLORWAYS.map((c) => [c, c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`] as const);
  for (const [c, open] of blocks) {
    lines.push(open);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: its props. The recipe is not overridable per instance there. */
export function kbdSwift(m: KbdConfig) {
  const tuned = Object.keys(kbdLook(m, COLORWAYS[0]).style).length > 0;
  const args = `"${m.glyph}"${m.size === INITIAL.size ? '' : `, size: .${m.size}`}${m.surface === INITIAL.surface ? '' : `, surface: .${m.surface}`}`;
  const lines = ['import SwiftUI', 'import MetalUI', '', 'struct SearchKey: View {', '    var body: some View {'];
  if (tuned) lines.push('        // MetalKbd draws from the recipe: the padding, corners, type, fill and shadows tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalKbd(${args})`, '    }', '}', '');
  return lines.join('\n');
}

export function KbdCodePanel({ config }: { config: KbdConfig }) {
  const tabs = React.useMemo(() => {
    const css = kbdCss(config);
    return [
      { id: 'react', label: 'React', code: kbdReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: kbdSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
