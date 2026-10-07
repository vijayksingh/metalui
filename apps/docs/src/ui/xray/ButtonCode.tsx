import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, buttonLook, sizeOf, type ButtonConfig } from './ButtonXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · BUTTON · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the label, the cap, the
 *   size, the icon, disabled). Everything you tune reaches the button the way the library supports
 *   from a host: its --mu-r-button-* variables on the button's own style, and only the ones that
 *   differ from the recipe. The corners and the label's type have no recipe variable: they go on
 *   the same style, and the code says what that means. Fill and shadow stacks are colours, one
 *   set per colorway, so they go in a stylesheet scoped the way the library scopes its own: the
 *   default, then [data-mu-colorway="graphite"]. At defaults the snippet is the agent guide's
 *   example, nothing more. SwiftUI reads the recipe, so its tab carries the props and says so.
 * ───────────────────────────────────────────────────────── */

// ButtonXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
/** Style keys that are the button's own, not a recipe variable. */
const own = (name: string) => !name.startsWith('--');
const TYPE_KEYS = ['fontSize', 'fontWeight', 'letterSpacing'];

/** The component, class and sheet names, from the label: "Get started" → GetStarted, get-started. */
export function names(label: string) {
  const words = label.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('') || 'Action';
  const component = /^\d/.test(pascal) ? `Action${pascal}` : pascal;
  const cls = (words.join('-').toLowerCase() || 'action').replace(/^(\d)/, 'action-$1');
  return { component, cls, sheet: `${cls}.css` };
}
const iconComponent = (icon: string) => icon.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Icon';
const swiftIcon = (icon: string) => icon.split('-').map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');

/** The values the stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: ButtonConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.lift !== INITIAL.lift) parts.push(`height ${m.lift.toFixed(1)}`);
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: on the button (one value everywhere) or per colorway. */
function overrides(m: ButtonConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, buttonLook(m, c).style as Record<string, string | number>])) as Record<Colorway, Record<string, string | number>>;
  const keys = Object.keys(by[COLORWAYS[0]]);
  const inline = keys.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = keys.filter(coloured);
  return { inline, sheet, by };
}

/** The React code for a config. */
export function buttonReact(m: ButtonConfig) {
  const { inline, sheet } = overrides(m);
  const { component, cls, sheet: sheetName } = names(m.label);
  const vars = inline.some(([k]) => !own(k));
  const type = inline.some(([k]) => TYPE_KEYS.includes(k));
  const corners = inline.some(([k]) => k === 'borderRadius');
  const props: string[] = [];
  if (m.cap !== 'standard') props.push(`cap="${m.cap}"`);
  if (sizeOf(m) === 'compact') props.push('size="compact"');
  if (m.icon !== 'none') props.push(`icon={<${iconComponent(m.icon)} />}`);
  if (m.disabled) props.push('disabled');
  const lines: string[] = [];
  if (vars) lines.push(`import type { CSSProperties } from 'react';`);
  lines.push(`import { Button } from '@unlocalhosted/metalui';`);
  if (m.icon !== 'none') lines.push(`import { ${iconComponent(m.icon)} } from '@unlocalhosted/metalui/icons';`);
  if (sheet.length) lines.push(`import './${sheetName}';`);
  lines.push('', `export function ${component}({ onClick }: { onClick: () => void }) {`);
  const label = m.label.replace(/[{}<>]/g, '');
  if (!inline.length && !sheet.length) lines.push(`  return <Button ${[...props, 'onClick={onClick}'].join(' ')}>${label}</Button>;`);
  else {
    lines.push('  return (');
    if (vars) lines.push('    // the button reads its recipe through these variables, so they are set on this one');
    if (corners) lines.push('    // the cap has no corner variable: its corners are its own style');
    if (type) lines.push('    // the label leaves the ui type role: its type is the button\'s own style');
    if (sheet.length) lines.push(`    // its fill and shadow stack are colours, so they are in ${sheetName}, one set per colorway`);
    lines.push('    <Button');
    props.forEach((p) => lines.push(`      ${p}`));
    if (sheet.length) lines.push(`      className="${cls}"`);
    if (inline.length) {
      lines.push('      style={{');
      inline.forEach(([k, v]) => lines.push(`        ${own(k) ? k : q(k)}: ${typeof v === 'number' ? v : q(String(v))},`));
      lines.push(vars ? '      } as CSSProperties}' : '      }}');
    }
    lines.push('      onClick={onClick}', '    >', `      ${label}`, '    </Button>', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function buttonCss(m: ButtonConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const { cls } = names(m.label);
  const derived = derivedFrom(m);
  const lines = [`/* the button's fill and shadow stack, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${cls}, [data-mu-colorway="${c}"] .${cls} {` : `[data-mu-colorway="${c}"] .${cls} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

const SWIFT_CAPS: Partial<Record<ButtonConfig['cap'], string>> = { standard: '.standard', primary: '.primary', destructive: '.destructive', strip: '.strip', 'strip-danger': '.stripDanger' };

/** The SwiftUI code for a config: its props. The recipe is not overridable per instance there. */
export function buttonSwift(m: ButtonConfig) {
  const { inline, sheet } = overrides(m);
  const { component } = names(m.label);
  const cap = SWIFT_CAPS[m.cap];
  const args = [`"${m.label.replace(/"/g, '\\"')}"`];
  if (m.icon !== 'none') args.push(`icon: .${swiftIcon(m.icon)}`);
  if (cap && m.cap !== 'standard') args.push(`cap: ${cap}`);
  if (sizeOf(m) === 'compact') args.push('size: .compact');
  args.push('action: action');
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${component}: View {`, '    let action: () -> Void', '', '    var body: some View {'];
  if (!cap) lines.push(`        // SwiftUI has no ${m.cap} cap: this is the standard one`);
  if (inline.length || sheet.length) lines.push('        // MetalButton draws from the recipe: the size, padding, corners, type, height and layers tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalButton(${args.join(', ')})${m.disabled ? '\n            .disabled(true)' : ''}`, '    }', '}', '');
  return lines.join('\n');
}

export function ButtonCodePanel({ config }: { config: ButtonConfig }) {
  const tabs = React.useMemo(() => {
    const css = buttonCss(config);
    return [
      { id: 'react', label: 'React', code: buttonReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: buttonSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
