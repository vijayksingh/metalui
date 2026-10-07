import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { tokens } from '../../lib/tokens';
import { SourceTabs } from '../doc';
import { INITIAL, KEY, PLACEHOLDER, TRAY, fieldLook, type FieldConfig } from './FieldXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · FIELD · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (what is typed in it, and
 *   whether a key sits at its end). Everything you tune reaches the field the way the library
 *   supports from a host: its --mu-r-field-field-* variables, the well's and the key's fill and
 *   shadow variables, and only the ones that differ from the recipe. Values that are the same in
 *   every colorway (height, corners, the space on the left, the caret) go inline on a wrapper. Fill
 *   and shadow stacks are colours, one set per colorway, so they go in a stylesheet scoped the way
 *   the library scopes its own: the default, then [data-mu-colorway="graphite"].
 *   At defaults the snippet is the field as the docs page writes it, nothing more.
 *   SwiftUI has no MetalField (the field is its parts there), so its tab composes them from the
 *   recipe, takes the height, corners and space on the left as plain values, and says what it leaves.
 * ───────────────────────────────────────────────────────── */

// FieldXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const dq = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const CLASS = 'lens-field';
const SHEET = `${CLASS}.css`;
const glyph = () => (tokens.recipes.field.props.field as { glyph: number }).glyph;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the shadow stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: FieldConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.depth !== INITIAL.depth) parts.push(`well depth ${m.depth}`);
  const off = [...TRAY.filter((_, i) => !m.tray[i]), ...(m.showKey ? KEY.filter((_, i) => !m.key[i]) : [])].map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: FieldConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, fieldLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The React code for a config. */
export function fieldReact(m: FieldConfig) {
  const { inline, sheet } = overrides(m);
  const wrapped = inline.length > 0 || sheet.length > 0;
  const pad = wrapped ? '      ' : '    ';
  const field = [
    `${pad}<Field>`,
    `${pad}  <Field.Icon><Icon name="search" size={${glyph()}} /></Field.Icon>`,
    `${pad}  <Field.Input placeholder=${dq(PLACEHOLDER)} aria-label=${dq(PLACEHOLDER)} value={query} onChange={(e) => setQuery(e.target.value)} />`,
    ...(m.showKey ? [`${pad}  <Field.Trail><Kbd>⌘K</Kbd></Field.Trail>`] : []),
    `${pad}</Field>`,
  ];
  const lines = [`import { useState${inline.length ? ', type CSSProperties' : ''} } from 'react';`, `import { Field${m.showKey ? ', Kbd' : ''} } from '@unlocalhosted/metalui';`, `import { Icon } from '@unlocalhosted/metalui/icons';`];
  if (sheet.length) lines.push(`import './${SHEET}';`);
  lines.push('', 'export function LensField() {', `  const [query, setQuery] = useState(${q(m.value)});`, '  return (');
  if (wrapped) {
    lines.push('    // the field reads its recipe through these variables, so a wrapper sets them for this one');
    if (sheet.length) lines.push(`    // its fill and shadow stacks are colours, so they are in ${SHEET}, one set per colorway`);
    const cls = sheet.length ? ` className="${CLASS}"` : '';
    if (inline.length) {
      lines.push(`    <div${cls} style={{`);
      inline.forEach(([k, v]) => lines.push(`      ${q(k)}: ${q(v)},`));
      lines.push('    } as CSSProperties}>');
    } else lines.push(`    <div${cls}>`);
    lines.push(...field, '    </div>');
  } else lines.push(...field);
  lines.push('  );', '}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function fieldCss(m: FieldConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the field's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config. There is no MetalField there, so it is the field's parts, sized by the recipe. */
export function fieldSwift(m: FieldConfig) {
  const field = tokens.recipes.field.props.field as { height: number; radius: number; 'pad-left': number };
  // a size that is the recipe's is read from the recipe; one you tuned is a plain number
  const size = (v: number, at: number, key: string) => (v === at ? `field.points("field.${key}")` : `${v}`);
  const unreached = [
    m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK ? 'light' : '',
    m.depth !== INITIAL.depth ? 'depth' : '',
    m.tray.some((v, i) => v !== INITIAL.tray[i]) || (m.showKey && m.key.some((v, i) => v !== INITIAL.key[i])) ? 'layers' : '',
    m.caret ? '' : 'caret',
  ].filter(Boolean);
  const lines = [
    'import SwiftUI', 'import MetalUI', '', 'struct LensField: View {', `    @State private var query = ${dq(m.value)}`, '    @Environment(\\.metalColorway) private var colorway', '', '    var body: some View {',
    '        // MetalUI has no MetalField for SwiftUI yet: the field is its parts, a well, a glyph, a text field and a key, sized by the field recipe',
  ];
  if (unreached.length) lines.push(`        // the ${unreached.join(', ')} you tuned come from the recipe: they are not per-instance props in SwiftUI`);
  lines.push(
    '        let field = MetalRecipes.field',
    `        MetalWell(.field, radius: ${size(m.radius, field.radius, 'radius')}) {`,
    '            HStack(spacing: field.points("field.gap")) {',
    '                MetalIcon(.search, size: field.points("field.glyph")).foregroundStyle(colorway.tokens.ink3.color)',
    `                TextField("", text: $query, prompt: Text(${dq(PLACEHOLDER)}).foregroundColor(colorway.tokens.ink3.color))`,
    '                    .textFieldStyle(.plain)',
    '                    .font(.metal(MetalType.content))',
    '                    .foregroundColor(colorway.tokens.ink.color)',
    '                    .tint(MetalShared.greenDeep.color)',
    `                    .accessibilityLabel(${dq(PLACEHOLDER)})`,
    ...(m.showKey ? ['                MetalKbd("⌘K")'] : []),
    '            }',
    `            .padding(.leading, ${size(m.padL, field['pad-left'], 'pad-left')})`,
    '            .padding(.trailing, field.points("field.pad-right"))',
    `            .frame(height: ${size(m.h, field.height, 'height')})`,
    '        }', '    }', '}', '',
  );
  return lines.join('\n');
}

export function FieldCodePanel({ config }: { config: FieldConfig }) {
  const tabs = React.useMemo(() => {
    const css = fieldCss(config);
    return [
      { id: 'react', label: 'React', code: fieldReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: fieldSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
