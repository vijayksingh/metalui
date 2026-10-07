import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, KEY, LAYERS, NAME, NOTE, NOTE_DIM, tooltipLook, type TooltipConfig } from './TooltipXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLTIP · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props: the side, the offset, the
 *   delay, the shortcut, and wrap with the detail in Tooltip.Dim. The chip lives in a portal, so
 *   nothing on a wrapper reaches it: what you tune about its shape and stack goes through the one
 *   hook the library gives a host, className on the popup, and a stylesheet that sets its
 *   --mu-r-tooltip-self-* variables on that class, only the ones that differ from the recipe.
 *   Values that are the same in every colorway (padding, corners) are one rule; the fill and shadow
 *   stacks are colours, one set per colorway, scoped the way the library scopes its own: the
 *   default, then [data-mu-colorway="graphite"]. At defaults the snippet is the agent guide's shape,
 *   a provider, the tooltip and its trigger, nothing more.
 *   SwiftUI's .metalTooltip takes a label, a key and a top or bottom edge, and says so in one line
 *   when a side beside, the gap, the wait, a wrapped note or the recipe do not reach it.
 * ───────────────────────────────────────────────────────── */

// TooltipXray imports this file back, so its constants are read only inside the functions
const COMPONENT = 'SelectTool';
const CLASS = 'select-tip';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the shadow stack was derived from, for the one line that says where it came from. */
function derivedFrom(m: TooltipConfig) {
  const parts: string[] = [];
  if (m.lift !== INITIAL.lift) parts.push(`height ${m.lift.toFixed(1)}`);
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: one rule (one value everywhere) or one per colorway. */
function overrides(m: TooltipConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, tooltipLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const plain = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { plain, sheet, by };
}

/** The React code for a config. */
export function tooltipReact(m: TooltipConfig) {
  const { plain, sheet } = overrides(m);
  const styled = plain.length > 0 || sheet.length > 0;
  const props = [m.long ? `label={<>${NOTE}<Tooltip.Dim>${NOTE_DIM}</Tooltip.Dim></>}` : `label="${NAME}"`];
  if (m.showKey && !m.long) props.push(`shortcut="${KEY}"`);
  if (m.side !== INITIAL.side) props.push(`side="${m.side}"`);
  if (m.gap !== INITIAL.gap) props.push(`offset={${m.gap}}`);
  if (m.delay !== INITIAL.delay) props.push(`delay={${m.delay}}`);
  if (m.long) props.push('wrap');
  if (styled) props.push(`className="${CLASS}"`);
  const lines = [`import { IconButton, Tooltip, TooltipProvider } from '@unlocalhosted/metalui';`, `import { Icon } from '@unlocalhosted/metalui/icons';`];
  if (styled) lines.push(`import './${SHEET}';`);
  lines.push('', `export function ${COMPONENT}() {`, '  return (', '    <TooltipProvider>');
  if (styled) lines.push(`      {/* the chip is in a portal, so its class is the hook: ${SHEET} sets the recipe variables it reads */}`);
  lines.push(
    `      <Tooltip ${props.join(' ')}>`,
    `        <IconButton variant="tool" label="${NAME}" icon={<Icon name="select" size={16} />} />`,
    '      </Tooltip>',
    '    </TooltipProvider>',
    '  );', '}', '',
  );
  return lines.join('\n');
}

/** The stylesheet for a config: the recipe variables on the popup's class, the colour stacks scoped per colorway. */
export function tooltipCss(m: TooltipConfig) {
  const { plain, sheet, by } = overrides(m);
  if (!plain.length && !sheet.length) return '';
  const lines: string[] = [];
  if (plain.length) {
    lines.push(`/* the tooltip's chip reads its recipe through these variables; the popup carries the class, so they reach it in its portal */`, `.${CLASS} {`);
    plain.forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
    lines.push('}');
  }
  if (sheet.length) {
    const derived = derivedFrom(m);
    if (plain.length) lines.push('');
    lines.push(`/* the chip's fill and shadow stack, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`);
    for (const c of COLORWAYS) {
      lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
      sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
      lines.push('}');
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: the label, the key and a top or bottom edge. That is all its API takes. */
export function tooltipSwift(m: TooltipConfig) {
  const beside = m.side === 'left' || m.side === 'right';
  const unreached = [
    beside ? 'a side beside the tool (SwiftUI tooltips sit above or below)' : '',
    m.gap !== INITIAL.gap ? 'the gap' : '',
    m.delay !== INITIAL.delay ? 'the wait' : '',
    m.long ? 'a wrapped note' : '',
    Object.keys(tooltipLook(m, COLORWAYS[0]).style).length ? 'the chip\'s recipe' : '',
  ].filter(Boolean);
  const label = m.long ? `${NOTE}${NOTE_DIM}` : NAME;
  const args = [`"${label.replace(/"/g, '\\"')}"`];
  if (m.showKey && !m.long) args.push(`shortcut: "${KEY}"`);
  if (m.side === 'bottom') args.push('edge: .bottom');
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${COMPONENT}: View {`, '    var body: some View {'];
  if (unreached.length) lines.push(`        // ${unreached.join(', ')}: not per-instance in SwiftUI, where .metalTooltip takes a label, a key and a top or bottom edge`);
  lines.push(
    '        Button(action: {}) { MetalIcon(.select, size: 16) }',
    `            .accessibilityLabel("${NAME}")`,
    `            .metalTooltip(${args.join(', ')})`,
    '    }', '}', '',
  );
  return lines.join('\n');
}

export function TooltipCodePanel({ config }: { config: TooltipConfig }) {
  const tabs = React.useMemo(() => {
    const css = tooltipCss(config);
    return [
      { id: 'react', label: 'React', code: tooltipReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: tooltipSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
