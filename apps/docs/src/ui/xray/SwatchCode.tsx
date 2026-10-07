import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, swatchLook, type SwatchConfig } from './SwatchXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SWATCH · THE CODE
 *
 *   The code for exactly the config in the x-ray. The colour and what is engraved are props.
 *   Everything you tune reaches the chip the way the library supports from a host: its
 *   --mu-r-swatch-* variables, and only the ones that differ from the recipe.
 *   The chip sets its own fill and shadow stacks on itself (the [data-mu-self] rule, because
 *   they are written in its colour), so these variables are set on the chip, never a wrapper:
 *   sizes inline through `style`, the two stacks in a stylesheet whose selector outranks the
 *   library's. The recipe's stacks are the same in every colorway, so there is one block; if a
 *   config ever differed per colorway it would get one block each, scoped like tokens.css.
 *   At defaults the snippet is the bare component, nothing more.
 *   SwiftUI reads the recipe, so its tab carries the props and says so.
 * ───────────────────────────────────────────────────────── */

// SwatchXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const CLASS = 'brand-swatch';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: a stylesheet carries them. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
/** A stack one layer to a line, so a long shadow reads. */
const layers = (v: string) => v.split(/,\s*(?![^(]*\))/);

/** What a config sets, split by where it belongs: inline (one value everywhere) or in the stylesheet. */
function overrides(m: SwatchConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, swatchLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The values the stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: SwatchConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK || m.sheen !== INITIAL.sheen) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.sheen * 100)}%`);
  if (m.lift !== INITIAL.lift) parts.push(`shadow blur ${Math.round(m.lift * 100)}%`);
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** The React code for a config. */
export function swatchReact(m: SwatchConfig) {
  const { inline, sheet } = overrides(m);
  const lines: string[] = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { Swatch } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', 'export function BrandSwatch() {');
  const props = [`hex=${JSON.stringify(m.hex)}`, ...(m.label === undefined ? [] : [`label=${JSON.stringify(m.label)}`])];
  if (!inline.length && !sheet.length) lines.push(`  return <Swatch ${props.join(' ')} />;`);
  else {
    lines.push('  return (', '    // the swatch sets its own colours on itself, so the variables it reads go on the swatch, not a wrapper');
    if (sheet.length) lines.push(`    // its fill and shadow stacks are written in its colour, so they are in ${SHEET}`);
    lines.push('    <Swatch');
    if (sheet.length) lines.push(`      className="${CLASS}"`);
    props.forEach((p) => lines.push(`      ${p}`));
    if (inline.length) {
      lines.push('      style={{');
      inline.forEach(([k, v]) => lines.push(`        ${q(k)}: ${q(v)},`));
      lines.push('      } as CSSProperties}');
    }
    lines.push('    />', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the two stacks, on a selector that outranks the library's own. */
export function swatchCss(m: SwatchConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const out = [`/* the swatch's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own on the swatch itself, so this selector outranks its [data-mu-self] */`];
  const same = COLORWAYS.every((c) => sheet.every((n) => by[c][n] === by[COLORWAYS[0]][n]));
  for (const c of same ? [COLORWAYS[0]] : COLORWAYS) {
    out.push(same ? `.${CLASS}[data-mu-self] {` : c === COLORWAYS[0] ? `:root .${CLASS}[data-mu-self], [data-mu-colorway="${c}"] .${CLASS}[data-mu-self] {` : `[data-mu-colorway="${c}"] .${CLASS}[data-mu-self] {`);
    for (const n of sheet) {
      const parts = layers(by[c][n]);
      if (parts.length === 1) out.push(`  ${n}: ${parts[0]};`);
      else out.push(`  ${n}:`, ...parts.map((p, i) => `    ${p}${i === parts.length - 1 ? ';' : ','}`));
    }
    out.push('}');
  }
  out.push('');
  return out.join('\n');
}

/** The SwiftUI code for a config: its props. The recipe is not overridable per instance there. */
export function swatchSwift(m: SwatchConfig) {
  const tuned = Object.keys(swatchLook(m, COLORWAYS[0]).style).length > 0;
  const args = [`hex: ${JSON.stringify(m.hex)}`, ...(m.label === undefined ? [] : [`label: ${JSON.stringify(m.label)}`])];
  const lines = ['import SwiftUI', 'import MetalUI', '', 'struct BrandSwatch: View {', '    var body: some View {'];
  if (tuned) lines.push('        // MetalSwatch draws from the recipe: the size, corners, dimple, light and shadow tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalSwatch(${args.join(', ')})`, '    }', '}', '');
  return lines.join('\n');
}

export function SwatchCodePanel({ config }: { config: SwatchConfig }) {
  const tabs = React.useMemo(() => {
    const css = swatchCss(config);
    return [
      { id: 'react', label: 'React', code: swatchReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: swatchSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
