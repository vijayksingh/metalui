import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, LAYERS, P, TOOLS, toolbarLook, type ToolbarConfig } from './ToolbarSpecimens';

/* ─────────────────────────────────────────────────────────
 * X-RAY · TOOLBAR · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the graphite strip, the tools
 *   with the pressed one as state, the groove between the groups). Everything you tune reaches the
 *   toolbar the way the library supports from a host: its --mu-r-toolbar-* variables, and only the ones
 *   that differ from the recipe. Values that are the same in every colorway (the spaces, the corners)
 *   go inline on a wrapper. The strip's fill and shadow stack are colours, so they go in a stylesheet;
 *   the graphite strip is the same in both colorways, so it gets one block.
 *   At defaults the snippet is the agent guide's example, nothing more.
 *   SwiftUI takes the props only and says so.
 * ───────────────────────────────────────────────────────── */

// ToolbarSpecimens is read only inside the functions: ToolbarXray imports this file, and this one its constants
const NAME = 'CanvasTools';
const CLASS = 'canvas-tools';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values can differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The icon component for a tool, as the icon set exports it. */
const iconOf = (id: string) => `${cap(id)}Icon`;

/** The values the shadow stack was derived from, for the one line that says where it came from. */
function derivedFrom(m: ToolbarConfig) {
  const parts: string[] = [];
  if (m.lift !== INITIAL.lift) parts.push(`height ${m.lift}`);
  const off = LAYERS.filter((_, i) => !m.on[i]).map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or in the stylesheet. */
function overrides(m: ToolbarConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, toolbarLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

const tools = () => TOOLS.filter(Boolean) as { id: string; label: string }[];

/** The React code for a config. */
export function toolbarReact(m: ToolbarConfig) {
  const { inline, sheet } = overrides(m);
  const icons = tools().map((t) => iconOf(t.id)).sort();
  const lines = [`import { useState${inline.length ? ', type CSSProperties' : ''} } from 'react';`, `import { Toolbar, ToolButton${m.sep ? ', ToolbarSeparator' : ''} } from '@unlocalhosted/metalui';`, `import { ${icons.join(', ')} } from '@unlocalhosted/metalui/icons';`];
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', `export function ${NAME}() {`, `  const [tool, setTool] = useState(${q(m.active)});`);
  const wrapped = inline.length > 0 || sheet.length > 0;
  const pad = wrapped ? '      ' : '    ';
  const strip: string[] = [`${pad}<Toolbar aria-label="Tools" variant="${m.variant}">`];
  TOOLS.forEach((t) => {
    if (t) strip.push(`${pad}  <ToolButton label="${t.label}" icon={<${iconOf(t.id)} size={${P.tool.glyph}} />} pressed={tool === ${q(t.id)}} onPressedChange={() => setTool(${q(t.id)})} />`);
    else if (m.sep) strip.push(`${pad}  <ToolbarSeparator />`);
  });
  strip.push(`${pad}</Toolbar>`);
  lines.push('  return (');
  if (!wrapped) lines.push(...strip);
  else {
    lines.push('    // the toolbar reads its recipe through these variables, so a wrapper sets them for this one');
    if (sheet.length) lines.push(`    // its fill and shadow stack are colours, so they are in ${SHEET}`);
    const cls = sheet.length ? ` className="${CLASS}"` : '';
    if (inline.length) {
      lines.push(`    <div${cls} style={{`);
      inline.forEach(([k, v]) => lines.push(`      ${q(k)}: ${q(v)},`));
      lines.push('    } as CSSProperties}>');
    } else lines.push(`    <div${cls}>`);
    lines.push(...strip, '    </div>');
  }
  lines.push('  );', '}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stack, scoped the way the library scopes its colorways. */
export function toolbarCss(m: ToolbarConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the strip's fill and shadow stack, derived from the toolbar recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  // the graphite strip's colours are the same in every colorway, so one block; a colorway that differed would get its own
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
export function toolbarSwift(m: ToolbarConfig) {
  const tuned = Object.keys(toolbarLook(m, COLORWAYS[0]).style).length > 0;
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${NAME}: View {`, `    @State private var tool = "${m.active}"`, '', '    var body: some View {'];
  if (tuned) lines.push('        // MetalToolbar draws from the recipe: the spaces, corners, height and layers tuned here are not per-instance props in SwiftUI');
  lines.push(`        MetalToolbar("Tools", variant: .${m.variant}) {`);
  TOOLS.forEach((t) => {
    if (t) lines.push(`            MetalToolButton("${t.label}", icon: .${t.id}, latched: tool == "${t.id}") { tool = "${t.id}" }`);
    else if (m.sep) lines.push('            MetalToolbarSeparator()');
  });
  lines.push('        }', '    }', '}', '');
  return lines.join('\n');
}

export function ToolbarCodePanel({ config }: { config: ToolbarConfig }) {
  const tabs = React.useMemo(() => {
    const css = toolbarCss(config);
    return [
      { id: 'react', label: 'React', code: toolbarReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: toolbarSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
