import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { BADGE, statusLook, type StatusConfig } from './StatusXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · STATUS BADGE · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the state, the words).
 *   What you tune about the badge's size, type and plate reaches it the way the library supports
 *   from a host: its --mu-r-status-* variables, and only the ones that differ from the recipe.
 *   Values that are the same in every colorway (height, padding, lamp size, type) go inline on the
 *   badge's own style. The plate's fill and shadow stacks are colours, one set per colorway, so
 *   they go in a stylesheet scoped the way the library scopes its own: the default, then
 *   [data-mu-colorway="graphite"]. At defaults the snippet is the one-liner the agent guide shows.
 *
 *   The lamp is the exception. Its bright spot, glow and layers are variables the library sets on
 *   the lamp's own element, so a host cannot set them from outside, and the code does not pretend
 *   it can: it says so in one line. SwiftUI takes only the state and the words.
 * ───────────────────────────────────────────────────────── */

// StatusXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const COMPONENT = 'SyncStatus';
const CLASS = 'sync-status';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the plate's stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: StatusConfig) {
  const off = BADGE.filter((_, i) => !m.badge[i]).map((l) => l.name.toLowerCase());
  return off.length ? `${off.join(', ')} off` : '';
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: StatusConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, statusLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

const LAMP_NOTE = "the lamp's bright spot, glow and layers are tuned in the x-ray only: the library sets them on the lamp itself, so they are not code";

/** The React code for a config. */
export function statusReact(m: StatusConfig) {
  const { inline, sheet } = overrides(m);
  const lamp = statusLook(m, COLORWAYS[0]).lampTuned;
  const lines = [];
  if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { StatusBadge } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', `export function ${COMPONENT}() {`);
  if (!inline.length && !sheet.length && !lamp) lines.push(`  return <StatusBadge led="${m.led}">${m.label}</StatusBadge>;`);
  else {
    const props = [`led="${m.led}"`];
    if (sheet.length) props.push(`className="${CLASS}"`);
    lines.push('  return (');
    if (inline.length) lines.push('    // the badge reads its recipe through these variables, so its own style sets them for this one');
    if (sheet.length) lines.push(`    // its plate is a colour stack, so it is in ${SHEET}, one set per colorway`);
    if (lamp) lines.push(`    // ${LAMP_NOTE}`);
    if (inline.length) {
      lines.push(`    <StatusBadge ${props.join(' ')} style={{`);
      inline.forEach(([k, v]) => lines.push(`      ${q(k)}: ${q(v)},`));
      lines.push('    } as CSSProperties}>');
    } else lines.push(`    <StatusBadge ${props.join(' ')}>`);
    lines.push(`      ${m.label}`, '    </StatusBadge>', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the plate's colour stacks, scoped the way the library scopes its colorways. */
export function statusCss(m: StatusConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the badge's plate: its fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: the state and the words. The recipe is not overridable per instance there. */
export function statusSwift(m: StatusConfig) {
  const look = statusLook(m, COLORWAYS[0]);
  const tuned = Object.keys(look.style).length > 0 || look.lampTuned;
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${COMPONENT}: View {`, '    var body: some View {'];
  if (tuned) lines.push('        // MetalStatusBadge draws from the recipe: the height, spacing, type, plate and lamp tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalStatusBadge("${m.label.replace(/"/g, '\\"')}", led: .${m.led})`, '    }', '}', '');
  return lines.join('\n');
}

export function StatusCodePanel({ config }: { config: StatusConfig }) {
  const tabs = React.useMemo(() => {
    const css = statusCss(config);
    return [
      { id: 'react', label: 'React', code: statusReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: statusSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
