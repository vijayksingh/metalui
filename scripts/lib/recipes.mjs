// Object recipes as data (tokens.json `recipes`): every layer of an object's look — fills
// (gradients, solid colors, the object's own color), shadow stacks (inset and outer), text-shadow
// lips — and its sizes, radii and type, per part and per state, taken from the reference design's CSS.
// One source generates both platforms:
//
//   CSS    custom properties --mu-r-<object>-<part>[-<state>]-<prop>, one line per layer, each
//          marked /* mu-recipe:<object>:<index> */ (scripts/check-recipe-parity.mjs reads them)
//   Swift  MetalRecipes.<object>: a MetalObjectRecipe of typed layers, each line marked
//          // mu-recipe:<object>:<index> with the same layer text, so both sides carry the same numbers
//
// A layer: { part, prop: background|shadow|text-shadow, value, state?, colorway? }. `value` is CSS
// as the demo wrote it; a color may be `self/<alpha>` (the object's own color, --mu-self, at alpha).
// A group (part, state, prop) with any colorway-specific layer is emitted per colorway.
// Props: { <part>: { <key>: number (px) | string } }, emitted as --mu-r-<object>-<part>-<key>;
// strings may name the families `sans` / `mono` in a font shorthand.

const PROP_CSS = { background: 'background', shadow: 'shadow', 'text-shadow': 'text-shadow' };

function splitTop(s, sep = ',') {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const num = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(+(+n).toFixed(4)));

// color → { rgba: [r,g,b,a] } | { self: alpha }
function color(s) {
  s = s.trim();
  if (s === 'transparent') return { rgba: [0, 0, 0, 0] };
  if (s === 'white' || s === '#fff' || s === '#FFF') return { rgba: [255, 255, 255, 1] };
  if (s === 'black') return { rgba: [0, 0, 0, 1] };
  let m = s.match(/^self(?:\/([\d.]+))?$/);
  if (m) return { self: m[1] !== undefined ? +m[1] : 1 };
  m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return { rgba: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) };
  }
  m = s.match(/^rgba?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgba: [p[0], p[1], p[2], p[3] ?? 1] };
  }
  throw new Error(`recipes: unparsed color "${s}"`);
}

const cssColor = (c) => (c.self !== undefined ? `color-mix(in srgb, var(--mu-self) ${+(c.self * 100).toFixed(2)}%, transparent)` : `rgba(${c.rgba.slice(0, 3).join(', ')}, ${+c.rgba[3].toFixed(4)})`);
const swiftPaintColor = (c) => (c.self !== undefined ? `.selfColor(alpha: ${num(c.self)})` : `.color(MetalRGBA(${c.rgba.slice(0, 3).map(num).join(', ')}, ${num(c.rgba[3])}))`);

// a color inside a value, rewritten for CSS (self → --mu-self)
// `self` as a colour token only: never inside a name (--mu-r-button-self-fade)
const SELF = /(?<![\w-])self(?:\/([\d.]+))?(?![\w-])/g;
const cssValue = (v) => v.replace(SELF, (_, a) => cssColor({ self: a !== undefined ? +a : 1 }));

function shadow(layer) {
  const inset = /\binset\b/.test(layer);
  const rest = layer.replace(/\binset\b/, '').trim();
  const at = rest.search(/(#|rgba?\(|self|transparent|white|black)/);
  const lengths = rest.slice(0, at).trim().split(/\s+/).filter(Boolean).map((x) => parseFloat(x));
  const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
  return { inset, x, y, blur, spread, color: color(rest.slice(at)) };
}

function gradient(v) {
  const kind = v.startsWith('radial') ? 'radial' : v.startsWith('conic') ? 'conic' : 'linear';
  const inner = v.slice(v.indexOf('(') + 1, v.lastIndexOf(')'));
  const parts = splitTop(inner);
  let angle = 180;
  let center = null;
  if (kind === 'linear' && /deg$/.test(parts[0])) angle = parseFloat(parts.shift());
  else if (kind === 'linear' && /^to /.test(parts[0])) {
    const dir = parts.shift();
    angle = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[dir] ?? 180;
  }
  if (kind === 'conic') {
    const m = parts[0].match(/from ([-\d.]+)deg/);
    if (m) {
      angle = parseFloat(m[1]);
      parts.shift();
    } else angle = 0;
  }
  if (kind === 'radial') {
    const head = parts[0];
    if (!/^(#|rgba?\(|self|transparent|white|black)/.test(head)) {
      parts.shift();
      const m = head.match(/at ([\d.]+)%? ([\d.]+)%?/);
      center = m ? [+m[1] / 100, +m[2] / 100] : [0.5, 0.5];
    } else center = [0.5, 0.5];
  }
  const stops = parts.map((p, i) => {
    const m = p.match(/^(#[0-9a-f]+|rgba?\([^)]*\)|self(?:\/[\d.]+)?|transparent|white|black)(.*)$/i);
    const pcts = (m[2].match(/([\d.]+)%/g) ?? []).map((x) => parseFloat(x) / 100);
    const px = m[2].match(/(^|\s)0(\s|$)/) ? [0] : [];
    const loc = pcts.length ? pcts.at(-1) : px.length ? 0 : i / Math.max(1, parts.length - 1);
    return { color: color(m[1]), loc };
  });
  return { kind, angle, center, stops };
}

function swiftFill(v) {
  if (/^(linear|radial|conic)-gradient/.test(v)) {
    const g = gradient(v);
    const stops = g.stops.map((s) => `.init(${swiftPaintColor(s.color)}, ${num(s.loc)})`).join(', ');
    if (g.kind === 'conic') return `.conic(from: ${num(g.angle)}, stops: [${stops}])`;
    return g.kind === 'linear' ? `.linear(angle: ${num(g.angle)}, stops: [${stops}])` : `.radial(center: .init(x: ${num(g.center[0])}, y: ${num(g.center[1])}), stops: [${stops}])`;
  }
  return `.solid(${swiftPaintColor(color(v))})`;
}

function swiftLayer(l) {
  const head = `part: "${l.part}", state: ${l.state ? `"${l.state}"` : 'nil'}, colorway: ${l.colorway ? `.${l.colorway}` : 'nil'}`;
  if (l.prop === 'background') return `.init(${head}, fill: ${swiftFill(l.value)})`;
  const s = shadow(l.value);
  const kind = l.prop === 'text-shadow' ? 'textShadow' : 'shadow';
  return `.init(${head}, ${kind}: .init(inset: ${s.inset}, x: ${num(s.x)}, y: ${num(s.y)}, blur: ${num(s.blur)}, spread: ${num(s.spread)}, paint: ${swiftPaintColor(s.color)}))`;
}

const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const varName = (obj, part, state, prop) => `--mu-r-${obj}-${part}${state ? '-' + state : ''}-${prop}`;

function propValue(v) {
  if (typeof v === 'number') return `${+v.toFixed(4)}px`;
  return String(v)
    .replace(/\bsans\b/, 'var(--mu-sans)')
    .replace(/\bmono\b/, 'var(--mu-mono)')
    .replace(SELF, (_, a) => cssColor({ self: a !== undefined ? +a : 1 }));
}

/** Validates and returns { css: { root, bone, graphite }, swift } for tokens.recipes. */
export function buildRecipes(recipes) {
  const root = [];
  // groups that paint with the object's own colour (--mu-self) resolve on the element that sets it
  const selfish = [];
  const cw = { bone: [], graphite: [] };
  const swift = [];
  // Tailwind v4: every recipe as theme values (sizes, inks, tracking) and utilities (its layered looks,
  // its type, durations, opacities), all reading the --mu-r-* variables so they follow the colorway.
  const themeVars = [];
  const utilities = [];
  const keyframes = [];
  for (const [obj, r] of Object.entries(recipes ?? {})) {
    if (obj.startsWith('$')) continue;
    if (!Array.isArray(r.layers)) throw new Error(`recipes.${obj}: needs an ordered layers array`);
    // groups in first-seen order
    const groups = new Map();
    r.layers.forEach((l, i) => {
      if (!PROP_CSS[l.prop]) throw new Error(`recipes.${obj}.layers[${i}]: prop ${l.prop}`);
      const key = `${l.part}|${l.state ?? ''}|${l.prop}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ...l, index: i });
    });
    root.push(`  /* ${obj}: ${r.$source ?? ''} */`);
    for (const list of groups.values()) {
      const { part, state, prop } = list[0];
      const name = varName(obj, part, state, PROP_CSS[prop]);
      const perColorway = list.some((l) => l.colorway);
      // each layer is marked once: a shared layer in a per-colorway group carries its marker in Bone only
      const emitTo = (target, layers, c) => {
        target.push(`  ${name}:`);
        layers.forEach((l, k) => {
          const mark = !c || l.colorway || c === 'bone' ? `/* mu-recipe:${obj}:${l.index} */ ` : '';
          target.push(`    ${mark}${cssValue(l.value)}${k < layers.length - 1 ? ',' : ';'}`);
        });
      };
      const usesSelf = list.some((l) => /(?<![\w-])self(?![\w-])/.test(l.value));
      if (!perColorway) {
        emitTo(root, list);
        if (usesSelf) emitTo(selfish, list);
      }
      else for (const c of ['bone', 'graphite']) emitTo(cw[c], list.filter((l) => !l.colorway || l.colorway === c), c);
    }
    const stem = (part) => `${obj}${part === 'self' ? '' : '-' + part}`;
    // the layered looks: recipe-<object>[-<part>][-<state>]
    const looks = new Map();
    for (const list of groups.values()) {
      const { part, state, prop } = list[0];
      const u = `recipe-${stem(part)}${state ? '-' + state : ''}`;
      if (!looks.has(u)) looks.set(u, []);
      const css = { background: 'background', shadow: 'box-shadow', 'text-shadow': 'text-shadow' }[prop];
      looks.get(u).push(`  ${css}: var(${varName(obj, part, state, PROP_CSS[prop])});`);
    }
    for (const [u, decls] of looks) utilities.push(`@utility ${u} {\n${decls.join('\n')}\n}`);
    // a recipe's own drawings (a tick, an LED, a doing mark) and motions, written against its variables
    for (const [u, decls] of Object.entries(r.$utilities ?? {})) utilities.push(`@utility ${u} {\n  ${decls}\n}`);
    for (const [k, frames] of Object.entries(r.$keyframes ?? {})) keyframes.push(`@keyframes ${k} {\n  ${frames}\n}`);
    for (const [part, props] of Object.entries(r.props ?? {})) {
      const v0 = (v) => (v && typeof v === 'object' ? v.bone ?? v.graphite : v);
      const ref = (k) => `var(--mu-r-${obj}-${part}-${k})`;
      if (props.font !== undefined) {
        const decls = [`  font: ${ref('font')};`];
        if (props.tracking !== undefined) decls.push(`  letter-spacing: ${ref('tracking')};`);
        if (props.transform !== undefined) decls.push(`  text-transform: ${ref('transform')};`);
        utilities.push(`@utility type-${stem(part)} {\n${decls.join('\n')}\n}`);
      }
      for (const [k, raw] of Object.entries(props)) {
        if (k.startsWith('$')) continue;
        const v = v0(raw);
        const n = `${stem(part)}-${k}`;
        if (typeof v === 'number') {
          themeVars.push(`  --spacing-${n}: ${ref(k)};`);
          if (/radius/.test(k) || /radius/.test(part)) themeVars.push(`  --radius-${n}: ${ref(k)};`);
          if (/^(width|stroke)$/.test(k)) utilities.push(`@utility stroke-width-${n} {\n  stroke-width: ${ref(k)};\n}`);
          if (/^r(-|$)/.test(k)) utilities.push(`@utility r-${n} {\n  r: ${ref(k)};\n}`);
          if (k === 'font-size') utilities.push(`@utility font-size-${n} {\n  font-size: ${ref(k)};\n}`);
          continue;
        }
        const str = String(v);
        if (k === 'font' || k === 'transform') continue;
        if (k === 'dash') { utilities.push(`@utility dash-${n} {\n  stroke-dasharray: ${ref(k)};\n}`); continue; }
        if (k === 'tracking') themeVars.push(`  --tracking-${n}: ${ref(k)};`);
        else if (/^\d+(\.\d+)?ms$/.test(str)) utilities.push(`@utility duration-${n} {\n  --tw-duration: ${ref(k)};\n  transition-duration: ${ref(k)};\n}`);
        else if (/^(#|rgba?\(|hsla?\(|transparent$|white$|black$)/.test(str)) themeVars.push(`  --color-${n}: ${ref(k)};`);
        else if (/^blur\(/.test(str)) utilities.push(`@utility backdrop-${n} {\n  -webkit-backdrop-filter: ${ref(k)};\n  backdrop-filter: ${ref(k)};\n}`);
        else if (k === 'transition') utilities.push(`@utility transition-${stem(part)} {\n  transition: ${ref(k)};\n}`);
        else if (/^-?\d*\.?\d+$/.test(str)) {
          if (k === 'z' || /-z$/.test(k)) utilities.push(`@utility z-${n} {\n  z-index: ${ref(k)};\n}`);
          else if (/weight/.test(k)) utilities.push(`@utility weight-${n} {\n  font-weight: ${ref(k)};\n}`);
          else utilities.push(`@utility opacity-${n} {\n  opacity: ${ref(k)};\n}`);
        }
      }
    }
    for (const [part, props] of Object.entries(r.props ?? {}))
      for (const [k, v] of Object.entries(props)) {
        if (k.startsWith('$')) continue;
        if (v && typeof v === 'object' && ('bone' in v || 'graphite' in v)) {
          for (const c of ['bone', 'graphite']) if (v[c] !== undefined) cw[c].push(`  --mu-r-${obj}-${part}-${k}: ${propValue(v[c])};`);
        } else root.push(`  --mu-r-${obj}-${part}-${k}: ${propValue(v)};`);
      }
    // Swift
    const props = Object.entries(r.props ?? {}).flatMap(([part, p]) =>
      Object.entries(p)
        .filter(([k]) => !k.startsWith('$'))
        .map(([k, v]) => {
          const key = `${part}.${k}`;
          if (typeof v === 'number') return `            "${key}": .number(${num(v)}),`;
          if (v && typeof v === 'object') return `            "${key}": .perColorway(bone: ${JSON.stringify(String(v.bone ?? ''))}, graphite: ${JSON.stringify(String(v.graphite ?? v.bone ?? ''))}),`;
          return `            "${key}": .text(${JSON.stringify(String(v))}),`;
        }),
    );
    swift.push(`    /// ${r.$use ?? obj}${r.$source ? ` (${r.$source})` : ''}
    public static let ${camel(obj)} = MetalObjectRecipe(
        name: "${obj}",
        layers: [
${r.layers.map((l, i) => `            ${swiftLayer(l)}, // mu-recipe:${obj}:${i} ${cssValue(l.value)}`).join('\n')}
        ],
        props: [
${props.join('\n') || '            :'}
        ]
    )`);
  }
  return {
    theme: { vars: themeVars.join('\n'), utilities: utilities.join('\n'), keyframes: keyframes.join('\n') },
    css: { root: root.join('\n'), self: selfish.join('\n').replace(/\/\* mu-recipe:[^*]+\*\/ /g, ''), bone: cw.bone.join('\n'), graphite: cw.graphite.join('\n') },
    swift: `
/// Object recipes (tokens.json \`recipes\`): every layer of each object's look, per part and state,
/// from the reference design's CSS. Render with MetalObjectRecipe's helpers (Foundation/MetalObjectRecipe.swift).
public enum MetalRecipes {
${swift.join('\n\n')}
}
`,
  };
}
