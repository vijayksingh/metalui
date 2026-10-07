import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, checkboxLook, type CheckboxConfig } from './CheckboxXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · CHECKBOX · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props: the state is a checked state
 *   the host keeps (rest, done), or a prop (mixed, doing, ghost); hover is the pointer's, so it is rest.
 *   The size is a prop. Everything you tune reaches the checkbox the way the library supports from a
 *   host: its --mu-r-checkbox-* variables, and only the ones that differ from the recipe. Values that
 *   are the same in every colorway (corners, the tick's angle) go inline on the checkbox. Fill and
 *   shadow stacks are colours, so they go in a stylesheet scoped the way the library scopes its own:
 *   the default, then [data-mu-colorway="graphite"]; a stack that is the same in every colorway gets
 *   one block. At defaults the snippet is the checkbox with its name and its state, nothing more.
 *   SwiftUI takes the props only and says so.
 * ───────────────────────────────────────────────────────── */

// CheckboxXray imports this file back, so its constants are read only inside the functions
const CLASS = 'task-check';
const SHEET = `${CLASS}.css`;
const NAME = 'Call the printer';
/** The variables that hold colours: their values can differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
/** A state the host keeps as checked or not: rest, hover (rest with the pointer on it), done, and mixed, which is done or not with a dash. */
const toggles = (m: CheckboxConfig) => m.state !== 'doing' && m.state !== 'ghost';

/** The values the shadow stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: CheckboxConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.state !== 'ghost' && m.depth !== INITIAL.depth) parts.push(`well depth ${m.depth}`);
  const groups = m.state === 'ghost' ? ['ghost' as const] : ['rest' as const, 'on' as const];
  const off = groups.flatMap((g) => LAYERS[g].filter((_, i) => !m.on[g][i])).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: CheckboxConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, checkboxLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The checkbox's props for a config, as JSX attributes. */
function attrsOf(m: CheckboxConfig, sheet: boolean) {
  return [
    `aria-label="${NAME}"`,
    ...(m.state === 'mixed' ? ['mixed'] : []),
    ...(m.state === 'doing' ? ['doing'] : []),
    ...(m.state === 'ghost' ? ['ghost'] : []),
    ...(toggles(m) ? ['checked={done}', 'onCheckedChange={setDone}'] : []),
    ...(m.size === INITIAL.size ? [] : [`size="${m.size}"`]),
    ...(sheet ? [`className="${CLASS}"`] : []),
  ];
}

/** The React code for a config. */
export function checkboxReact(m: CheckboxConfig) {
  const { inline, sheet } = overrides(m);
  const attrs = attrsOf(m, sheet.length > 0);
  const lines: string[] = [];
  if (toggles(m)) lines.push(`import { useState${inline.length ? ', type CSSProperties' : ''} } from 'react';`);
  else if (inline.length) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { Checkbox } from '@unlocalhosted/metalui';`);
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', 'export function TaskCheck() {');
  if (toggles(m)) lines.push(`  const [done, setDone] = useState(${m.state === 'on'});`);
  if (!inline.length) lines.push(`  return <Checkbox ${attrs.join(' ')} />;`);
  else {
    lines.push('  // the checkbox reads its recipe through these variables, so setting them on it sets this one');
    if (sheet.length) lines.push(`  // its fill and shadow stacks are colours, so they are in ${SHEET}, one set per colorway`);
    lines.push('  return (', '    <Checkbox', ...attrs.map((a) => `      ${a}`), '      style={{');
    inline.forEach(([k, v]) => lines.push(`        '${k}': '${v}',`));
    lines.push('      } as CSSProperties}', '    />', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function checkboxCss(m: CheckboxConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the checkbox's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
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
export function checkboxSwift(m: CheckboxConfig) {
  const tuned = Object.keys(checkboxLook(m, COLORWAYS[0]).style).length > 0;
  const args = [
    toggles(m) ? 'isOn: $done' : 'isOn: .constant(false)',
    ...(m.state === 'doing' ? ['doing: true'] : []),
    ...(m.state === 'ghost' ? ['ghost: true'] : []),
    ...(m.state === 'mixed' ? ['mixed: true'] : []),
    ...(m.size === INITIAL.size ? [] : [`size: .${m.size}`]),
    `label: "${NAME}"`,
  ];
  const lines = ['import SwiftUI', 'import MetalUI', '', 'struct TaskCheck: View {'];
  if (toggles(m)) lines.push(`    @State private var done = ${m.state === 'on'}`, '');
  lines.push('    var body: some View {');
  if (tuned) lines.push('        // MetalDimple draws from the recipe: the corners, tick angle, fills and shadows tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalDimple(${args.join(', ')})`, '    }', '}', '');
  return lines.join('\n');
}

export function CheckboxCodePanel({ config }: { config: CheckboxConfig }) {
  const tabs = React.useMemo(() => {
    const css = checkboxCss(config);
    return [
      { id: 'react', label: 'React', code: checkboxReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: checkboxSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
