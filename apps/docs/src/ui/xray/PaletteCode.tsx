import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';
import { SourceTabs } from '../doc';
import { ACTIONS, INITIAL, LAYERS, PLACEHOLDER, STATUS, paletteLook, type PaletteConfig } from './PaletteSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · COMMAND PALETTE · THE CODE
 *
 *   The code for exactly the config in the x-ray: how a page really builds the palette. Its rows are
 *   data (the actions with their keys, and a lens for whatever was typed), a button and ⌘K open it,
 *   the query is the state it opens with, and pinning and where answers come from are props. The
 *   chosen row is the palette's own state (the first row when it opens; ↑↓ and hover move it), so a
 *   row chosen in the x-ray is said in one line, never faked.
 *   What you tune is a stylesheet on the class the palette takes (`className`), so only this palette
 *   changes, setting only the variables that differ: the
 *   --mu-palette-* sizes and the theme radii it is built from, one rule for every colorway; its frost
 *   and raise are colours, one set per colorway, scoped the way the library scopes its own.
 *   SwiftUI's .metalCommandPalette takes the query, the rows and the status, and its sizes come from
 *   MetalPaletteMetrics, generated from the tokens: the code says so in one line when a tunable does
 *   not reach it.
 * ───────────────────────────────────────────────────────── */

const COMPONENT = 'CanvasPalette';
const SHEET = 'canvas-palette.css';
const CLASS = 'canvas-palette';
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const dq = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => name === '--mu-frost-strong' || name === '--mu-raise';
const glyph = () => ({ field: tokens.palette['field-glyph'], row: tokens.palette['row-glyph'] });

/** The layers the fill and shadow stack were derived from, for the one line that says where they came from. */
function derivedFrom(m: PaletteConfig) {
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  return off.length ? `${off.join(', ')} off` : '';
}

/** What a config sets, split by where it belongs: one rule (one value everywhere) or one per colorway. */
function overrides(m: PaletteConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, paletteLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const plain = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { plain, sheet, by };
}

/** The React code for a config. */
export function paletteReact(m: PaletteConfig) {
  const { plain, sheet } = overrides(m);
  const styled = plain.length > 0 || sheet.length > 0;
  const g = glyph();
  const props = ['open={open}', 'onOpenChange={setOpen}', 'items={items}', 'query={query}', 'onQueryChange={setQuery}', `placeholder=${dq(PLACEHOLDER)}`, `icon={<Icon name="search" size={${g.field}} />}`];
  if (m.status) props.push(`status=${dq(STATUS)}`);
  if (!m.pinnable) props.push('pinnable={false}');
  if (styled) props.push(`className="${CLASS}"`);
  const lines = [
    `import { useEffect, useState } from 'react';`,
    `import { Button, CommandPalette, Kbd, type CommandPaletteItem } from '@unlocalhosted/metalui';`,
    `import { Icon } from '@unlocalhosted/metalui/icons';`,
  ];
  if (styled) lines.push(`import './${SHEET}';`);
  lines.push('', '/** The actions, each with its key. */', 'const ACTIONS: CommandPaletteItem[] = [');
  for (const a of ACTIONS) {
    const parts = [`id: ${q(a.label.split(' ')[0].toLowerCase())}`, `section: ${q(a.sec)}`, `label: ${q(a.label)}`, `icon: <Icon name="${a.icon}" size={${g.row}} />`];
    if (a.key) parts.push(`hint: <Kbd size="small">${a.key}</Kbd>`);
    if (a.danger) parts.push('danger: true');
    lines.push(`  { ${parts.join(', ')} },`);
  }
  lines.push('];', '', `export function ${COMPONENT}() {`, '  const [open, setOpen] = useState(false);', `  const [query, setQuery] = useState(${q(m.q)});`);
  lines.push(
    '  // ⌘K opens it',
    '  useEffect(() => {',
    `    const onKey = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(true); } };`,
    `    window.addEventListener('keydown', onKey);`,
    `    return () => window.removeEventListener('keydown', onKey);`,
    '  }, []);',
    '  // the first row is a lens for what was typed; the palette filters the actions by it',
    '  const lens = query.trim();',
    '  const items: CommandPaletteItem[] = [',
    `    ...(lens ? [{ id: \`lens:\${lens}\`, section: 'LENS', label: \`See “\${lens}”\`, icon: <Icon name="search" size={${g.row}} /> }] : []),`,
    '    ...ACTIONS,',
    '  ];',
  );
  if (m.sel !== INITIAL.sel) lines.push(`  // the row you chose in the x-ray is the palette's own state: it highlights the first row when it opens, and ↑↓ or hover move it`);
  lines.push(
    '  return (',
    '    <>',
    '      <Button onClick={() => setOpen(true)}>Lenses and actions <Kbd size="small">⌘K</Kbd></Button>',
    `      <CommandPalette ${props.join(' ')}`,
    `        onRun={(item, { pin }) => console.log(item.id, pin ? 'pinned' : 'run')} />`,
    '    </>',
    '  );', '}', '',
  );
  return lines.join('\n');
}

/** The stylesheet for a config: the variables the palette reads, on its own class; the colour stacks scoped per colorway. */
export function paletteCss(m: PaletteConfig) {
  const { plain, sheet, by } = overrides(m);
  if (!plain.length && !sheet.length) return '';
  const lines: string[] = [];
  if (plain.length) {
    lines.push(`/* the palette reads its sizes through these variables: on the class it takes (className), so only this palette changes */`, `.${CLASS} {`);
    plain.forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
    lines.push('}');
  }
  if (sheet.length) {
    const derived = derivedFrom(m);
    if (plain.length) lines.push('');
    lines.push(`/* the plate's frost and raise, derived from its tokens${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`);
    for (const c of COLORWAYS) {
      lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
      sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
      lines.push('}');
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: the rows, the query it opens with, the status; presented with .metalCommandPalette. */
export function paletteSwift(m: PaletteConfig) {
  const { plain, sheet } = overrides(m);
  const args = ['isPresented: $open', 'query: $query', 'items: items'];
  if (m.status) args.push(`status: ${dq(STATUS)}`);
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${COMPONENT}: View {`, '    @State private var open = false', `    @State private var query = ${dq(m.q)}`, '', '    /// The actions, each with its key.', '    private let actions: [MetalCommandPaletteItem] = ['];
  for (const a of ACTIONS) {
    const parts = [`id: ${dq(a.label.split(' ')[0].toLowerCase())}`, `label: ${dq(a.label)}`, `section: ${dq(a.sec)}`, `icon: .${a.icon}`];
    if (a.key) parts.push(`hint: .key(${dq(a.key)})`);
    if (a.danger) parts.push('danger: true');
    lines.push(`        MetalCommandPaletteItem(${parts.join(', ')}),`);
  }
  lines.push('    ]', '', '    var body: some View {');
  if (plain.length || sheet.length) lines.push('        // the sizes and layers you tuned come from MetalPaletteMetrics and the colorway, generated from the tokens: they are not per-instance in SwiftUI');
  if (!m.pinnable) lines.push('        // pinning off: .metalCommandPalette always pins on ⇧↩; place MetalCommandPalette(pinnable: false) yourself to turn it off');
  if (m.sel !== INITIAL.sel) lines.push('        // the row you chose in the x-ray is the palette\'s own state: it selects the first row when it opens, and ↑↓ or hover move it');
  lines.push(
    '        // the first row is a lens for what was typed; the palette filters the actions by it',
    '        let lens = query.trimmingCharacters(in: .whitespaces)',
    `        let items = (lens.isEmpty ? [] : [MetalCommandPaletteItem(id: "lens:\\(lens)", label: "See “\\(lens)”", section: "LENS", icon: .search)]) + actions`,
    '        MetalButton("Lenses and actions") { open = true }',
    '            .keyboardShortcut("k", modifiers: .command)',
    `            .metalCommandPalette(${args.join(', ')}) { item, pin in`,
    '                print(item.id, pin ? "pinned" : "run")',
    '            }',
    '    }', '}', '',
  );
  return lines.join('\n');
}

export function PaletteCodePanel({ config }: { config: PaletteConfig }) {
  const tabs = React.useMemo(() => {
    const css = paletteCss(config);
    return [
      { id: 'react', label: 'React', code: paletteReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: paletteSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
