import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { FROST, LAYERS, chipLook, type ChipConfig } from './ChipXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SUGGESTION CHIP · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the question, how sure the
 *   app is, whether its line is pointed at). What you tune about the chip's size and plate reaches
 *   it the way the library supports from a host: its --mu-r-chip-suggestion-* variables, and only
 *   the ones that differ from the recipe. Values that are the same in every colorway (height, the
 *   space on the left) go inline on the chip's own style. The plate's fill and shadow stacks are
 *   colours, one set per colorway, so they go in a stylesheet scoped the way the library scopes
 *   its own: the default, then [data-mu-colorway="graphite"]. At defaults the snippet is the one
 *   the agent guide shows. Every tunable has a code form here; the model's pulled-apart layers are
 *   a picture of the same variables, not more code. SwiftUI takes only the props.
 * ───────────────────────────────────────────────────────── */

// ChipXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const COMPONENT = 'BlockSuggestion';
const CLASS = 'block-suggestion';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** What the plate's stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: ChipConfig) {
  const parts: string[] = [];
  if (m.on[0] && m.frost !== FROST) parts.push(`frost at ${Math.round(m.frost * 100)}%`);
  LAYERS.forEach((l, i) => { if (!m.on[i]) parts.push(`${l.name.toLowerCase()} off`); });
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: ChipConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, chipLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

const words = (label: string) => label.replace(/"/g, '&quot;');

/** The React code for a config. */
export function chipReact(m: ChipConfig) {
  const { inline, sheet } = overrides(m);
  const lines = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { SuggestionChip } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', `export function ${COMPONENT}({ onAccept, onDismiss }: { onAccept: () => void; onDismiss: () => void }) {`);
  const props = [`label="${words(m.label)}"`, `confidence={${m.conf}}`];
  if (m.host) props.push('hostHovered');
  props.push('onAccept={onAccept}', 'onDismiss={onDismiss}');
  if (!inline.length && !sheet.length) lines.push(`  return <SuggestionChip ${props.join(' ')} />;`);
  else {
    lines.push('  return (');
    if (inline.length) lines.push('    // the chip reads its recipe through these variables, so its own style sets them for this one');
    if (sheet.length) lines.push(`    // its plate is a colour stack, so it is in ${SHEET}, one set per colorway`);
    lines.push('    <SuggestionChip');
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

/** The stylesheet for a config: the plate's colour stacks, scoped the way the library scopes its colorways. */
export function chipCss(m: ChipConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the chip's plate: its fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: the question, how sure, whether its line is pointed at. The recipe is not overridable per instance there. */
export function chipSwift(m: ChipConfig) {
  const tuned = Object.keys(chipLook(m, COLORWAYS[0]).style).length > 0;
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${COMPONENT}: View {`, '    var onAccept: () -> Void', '    var onDismiss: () -> Void', '', '    var body: some View {'];
  if (tuned) lines.push('        // MetalSuggestionChip draws from the recipe: the height, space and plate tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalSuggestionChip(label: "${m.label.replace(/"/g, '\\"')}", confidence: ${m.conf}${m.host ? ', hostHovered: true' : ''}, onAccept: onAccept, onDismiss: onDismiss)`, '    }', '}', '');
  return lines.join('\n');
}

export function ChipCodePanel({ config }: { config: ChipConfig }) {
  const tabs = React.useMemo(() => {
    const css = chipCss(config);
    return [
      { id: 'react', label: 'React', code: chipReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: chipSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
