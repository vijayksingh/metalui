import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { tokens } from '../../lib/tokens';
import { HEADING, INITIAL, LAYERS, ROWS, TRIGGER, menuLook, type MenuConfig } from './MenuXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · MENU · THE CODE
 *
 *   The code for exactly the config in the x-ray: how a person really builds this menu, a trigger
 *   and a plate of rows, not the still. What is there is in the code: the heading as the `heading`
 *   prop, the line as a MenuSeparator, each row a MenuItem with its glyph, key and handler, the red
 *   one `danger`. The lit row is where the pointer or the keys are, so it has no code.
 *   A Menu opens in a portal and takes no className or style, so what you tune reaches it only the
 *   way the library supports from a host: its --mu-r-menu-* variables set on its own class in a
 *   stylesheet, for every menu in the document, and the gap to its button from --mu-menu-offset at
 *   the root, where the library reads it. Only what differs from the recipe is written. The plate's
 *   fill and shadow stacks are colours, one set per colorway, scoped the way the library scopes its
 *   own: the default, then [data-mu-colorway="graphite"]. At defaults there is no stylesheet.
 *   SwiftUI takes what is there (heading, rows, a separator) and says so when tunables do not reach it.
 * ───────────────────────────────────────────────────────── */

// MenuXray imports this file back, so its constants are read only inside the functions
const P = tokens.recipes.menu.props as { row: { glyph: number } };
const COMPONENT = 'NoteActions';
const SHEET = 'note-actions.css';
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
const rows = () => ROWS.filter((r) => r !== null);

/** What the plate's stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: MenuConfig) {
  return LAYERS.filter((_, i) => !m.on[i]).map((l) => `${l.name.toLowerCase()} off`).join(', ');
}

/** What a config sets, split by where it belongs: the plate's shape (one value everywhere), its colours (per colorway), and the gap at the root. */
function overrides(m: MenuConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, menuLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const shape = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  const offset = menuLook(m, COLORWAYS[0]).offset;
  return { shape, sheet, by, offset, any: shape.length > 0 || sheet.length > 0 || offset !== undefined };
}

/** The React code for a config. */
export function menuReact(m: MenuConfig) {
  const { any } = overrides(m);
  const handlers = rows().map((r) => r.act);
  const lines = [`import { Button, Menu, MenuItem${m.sep ? ', MenuSeparator' : ''} } from '@unlocalhosted/metalui';`, `import { Icon } from '@unlocalhosted/metalui/icons';`];
  if (any) lines.push(`import './${SHEET}';`);
  lines.push('', `export function ${COMPONENT}({ ${handlers.join(', ')} }: { ${handlers.map((h) => `${h}: () => void`).join('; ')} }) {`, '  return (');
  if (any) lines.push(`    // the menu opens in a portal and takes no className or style: what you tuned is in ${SHEET}, for every menu`);
  lines.push(`    <Menu trigger={<Button>${TRIGGER}</Button>}${m.heading ? ` heading="${HEADING}"` : ''}>`);
  ROWS.forEach((r) => {
    if (!r) { if (m.sep) lines.push('      <MenuSeparator />'); return; }
    lines.push(`      <MenuItem onSelect={${r.act}} icon={<Icon name="${r.icon}" size={${P.row.glyph}} />} shortcut="${r.key}"${'danger' in r ? ' danger' : ''}>${r.label}</MenuItem>`);
  });
  lines.push('    </Menu>', '  );', '}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the gap at the root, the plate's shape on its class, its colour stacks per colorway. */
export function menuCss(m: MenuConfig) {
  const { shape, sheet, by, offset, any } = overrides(m);
  if (!any) return '';
  const lines = [`/* Menu renders in a portal and takes no className or style, so this reaches it through its own class: every menu in the document */`];
  if (offset !== undefined) lines.push('/* the gap to the button: the library reads it from the root */', ':root {', `  --mu-menu-offset: ${offset};`, '}');
  if (shape.length) {
    lines.push('.mu-menu {');
    shape.forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
    lines.push('}');
  }
  if (sheet.length) {
    const derived = derivedFrom(m);
    lines.push(`/* the plate's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`);
    for (const c of COLORWAYS) {
      lines.push(c === COLORWAYS[0] ? `.mu-menu, [data-mu-colorway="${c}"] .mu-menu {` : `[data-mu-colorway="${c}"] .mu-menu {`);
      sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
      lines.push('}');
    }
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: a button that presents the panel, with what is there. The recipe is not overridable per instance there. */
export function menuSwift(m: MenuConfig) {
  const { any } = overrides(m);
  const handlers = rows().map((r) => r.act);
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${COMPONENT}: View {`, ...handlers.map((h) => `    var ${h}: () -> Void`), '    @State private var open = false', '', '    var body: some View {'];
  if (any) lines.push('        // MetalMenuPanel draws from the recipe: the gap, space, corners and plate tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalButton("${TRIGGER}") { open = true }`, `            .metalMenu(isPresented: $open, ${m.heading ? `heading: "${HEADING}", ` : ''}items: [`);
  ROWS.forEach((r) => {
    if (!r) { if (m.sep) lines.push('                .separator,'); return; }
    lines.push(`                MetalMenuItem("${r.label}", icon: .${r.icon}, shortcut: "${r.key}", ${'danger' in r ? 'danger: true, ' : ''}action: ${r.act}),`);
  });
  lines.push('            ])', '    }', '}', '');
  return lines.join('\n');
}

export function MenuCodePanel({ config }: { config: MenuConfig }) {
  const tabs = React.useMemo(() => {
    const css = menuCss(config);
    return [
      { id: 'react', label: 'React', code: menuReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: menuSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
