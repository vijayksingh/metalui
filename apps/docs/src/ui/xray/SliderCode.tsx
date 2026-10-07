import * as React from 'react';
import { COLORWAYS, type Colorway } from '../../app/colorway';
import { SourceTabs } from '../doc';
import { INITIAL, KNOB_LAYERS, MARKS, MAX, MIN, SHINE_FROM, TICKS, TRACK_LAYERS, WIDTH, fraction, sliderLook, type SliderConfig } from './SliderXray';

/* ─────────────────────────────────────────────────────────
 * X-RAY · SLIDER · THE CODE
 *
 *   The code for exactly the config in the x-ray. Real props are props (the value, its marks and
 *   ticks). Everything you tune reaches the slider the way the library supports from a host: the
 *   track well's and the slider's own --mu-r-* variables and the part spring it jumps on, and only
 *   the ones that differ from the recipe. Values that are the same in every colorway (the spring)
 *   go inline on a wrapper. Fill and shadow stacks are colours, one set per colorway, so they go in
 *   a stylesheet scoped the way the library scopes its own: the default, then [data-mu-colorway="graphite"].
 *   At defaults the snippet is the slider as it ships, nothing more.
 *   SwiftUI reads the recipe, so its tab carries the props and says so.
 * ───────────────────────────────────────────────────────── */

// SliderXray imports this file back, so its constants are read only inside the functions
const q = (s: string) => `'${s.replace(/'/g, "\\'")}'`;
const NAME = 'AmountSlider';
const CLASS = 'amount-slider';
const SHEET = `${CLASS}.css`;
/** The variables that hold colours: their values differ per colorway. */
const coloured = (name: string) => /-(background|shadow)$/.test(name);

/** The values the stacks were derived from, for the one line that says where they came from. */
function derivedFrom(m: SliderConfig) {
  const parts: string[] = [];
  if (m.lightDeg !== INITIAL.lightDeg || m.lightK !== INITIAL.lightK) parts.push(`light ${m.lightDeg === 0 ? 'top' : `${Math.abs(m.lightDeg)}° ${m.lightDeg < 0 ? 'left' : 'right'}`} at ${Math.round(m.lightK * 100)}%`);
  if (m.shine !== INITIAL.shine) parts.push(`shine ${SHINE_FROM + m.shine}°`);
  if (m.depth !== INITIAL.depth) parts.push(`groove depth ${m.depth}`);
  const off = [...TRACK_LAYERS.filter((_, i) => !m.track[i]), ...KNOB_LAYERS.filter((_, i) => !m.knob[i])].map((l) => l.name.toLowerCase());
  if (off.length) parts.push(`${off.join(', ')} off`);
  return parts.join(', ');
}

/** What a config sets, split by where it belongs: inline (one value everywhere) or per colorway. */
function overrides(m: SliderConfig) {
  const by = Object.fromEntries(COLORWAYS.map((c) => [c, sliderLook(m, c).style as Record<string, string>])) as Record<Colorway, Record<string, string>>;
  const names = Object.keys(by[COLORWAYS[0]]);
  const inline = names.filter((n) => !coloured(n)).map((n) => [n, by[COLORWAYS[0]][n]] as const);
  const sheet = names.filter(coloured);
  return { inline, sheet, by };
}

/** The slider's fixed props as code: its marks at every large step, its labelled ticks. */
const marks = () => `const MARKS = [${MARKS.join(', ')}];`;
const ticks = () => `const TICKS = [${TICKS.map((t) => t.value).join(', ')}].map((value) => ({ value, label: value }));`;

/** The React code for a config. */
export function sliderReact(m: SliderConfig) {
  const { inline, sheet } = overrides(m);
  const scale = `${m.marks ? ' marks={MARKS}' : ''}${m.ticks ? ' ticks={TICKS}' : ''}`;
  const control = `<Slider aria-label="Amount" width={${WIDTH}} value={amount} min={${MIN}} max={${MAX}} onValueChange={setAmount}${scale} />`;
  const lines = [`import { useState${inline.length ? ', type CSSProperties' : ''} } from 'react';`, `import { Slider } from '@unlocalhosted/metalui';`];
  if (sheet.length) lines.push(`import './${SHEET}';`);
  const consts = [...(m.marks ? [marks()] : []), ...(m.ticks ? [ticks()] : [])];
  if (consts.length) lines.push('', ...consts);
  lines.push('', `export function ${NAME}() {`, `  const [amount, setAmount] = useState(${m.value});`);
  if (!inline.length && !sheet.length) lines.push(`  return ${control};`);
  else {
    lines.push('  return (', '    // the slider reads its recipe through these variables, so a wrapper sets them for this one');
    if (sheet.length) lines.push(`    // its fill and shadow stacks are colours, so they are in ${SHEET}, one set per colorway`);
    const cls = sheet.length ? ` className="${CLASS}"` : '';
    if (inline.length) {
      lines.push(`    <div${cls} style={{`);
      inline.forEach(([k, v]) => lines.push(`      ${q(k)}: ${q(v)},`));
      lines.push('    } as CSSProperties}>');
    } else lines.push(`    <div${cls}>`);
    lines.push(`      ${control}`, '    </div>', '  );');
  }
  lines.push('}', '');
  return lines.join('\n');
}

/** The stylesheet for a config: the colour stacks, scoped the way the library scopes its colorways. */
export function sliderCss(m: SliderConfig) {
  const { sheet, by } = overrides(m);
  if (!sheet.length) return '';
  const derived = derivedFrom(m);
  const lines = [`/* the slider's fill and shadow stacks, derived from its recipe${derived ? ` for ${derived}` : ''}; the library sets its own the same way */`];
  for (const c of COLORWAYS) {
    lines.push(c === COLORWAYS[0] ? `.${CLASS}, [data-mu-colorway="${c}"] .${CLASS} {` : `[data-mu-colorway="${c}"] .${CLASS} {`);
    sheet.forEach((n) => lines.push(`  ${n}: ${by[c][n]};`));
    lines.push('}');
  }
  lines.push('');
  return lines.join('\n');
}

/** The SwiftUI code for a config: its props. The recipe is not overridable per instance there. */
export function sliderSwift(m: SliderConfig) {
  const tuned = Object.keys(sliderLook(m, COLORWAYS[0]).style).length > 0;
  const lines = ['import SwiftUI', 'import MetalUI', '', `struct ${NAME}: View {`, `    @State private var amount: Double = ${m.value}`];
  // marks and ticks are fractions of the range in SwiftUI
  if (m.marks) lines.push(`    let marks: [Double] = [${MARKS.map((v) => fraction(v)).join(', ')}]`);
  if (m.ticks) lines.push(`    let ticks = [${TICKS.map((t) => fraction(t.value)).join(', ')}].map { MetalSliderTick(at: $0, label: "\\(Int($0 * ${MAX - MIN}))") }`);
  lines.push('', '    var body: some View {');
  if (tuned) lines.push('        // MetalSlider draws from the recipe: the shine, depth, light, layers and spring tuned here are not per-instance props in SwiftUI');
  const scale = `${m.marks ? ', marks: marks' : ''}${m.ticks ? ', ticks: ticks' : ''}`;
  lines.push(`        MetalSlider(value: $amount, in: ${MIN}...${MAX}, step: 1, largeStep: 10${scale}, label: "Amount", valueText: { "\\(Int($0))" })`, `            .frame(width: ${WIDTH})`, '    }', '}', '');
  return lines.join('\n');
}

export function SliderCodePanel({ config }: { config: SliderConfig }) {
  const tabs = React.useMemo(() => {
    const css = sliderCss(config);
    return [
      { id: 'react', label: 'React', code: sliderReact(config) },
      ...(css ? [{ id: 'css', label: 'CSS', code: css }] : []),
      { id: 'swift', label: 'SwiftUI', code: sliderSwift(config) },
    ];
  }, [config]);
  // the tab strip keeps its place by id, so a CSS tab coming and going never loses the one you chose
  return <div className="xr-code" data-xray-code><SourceTabs key={tabs.length} tabs={tabs} /></div>;
}
