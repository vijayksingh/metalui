// tokens/tokens.json → tokens.css (--mu-* + type roles), theme.css (Tailwind v4) and the SwiftUI tokens.
// `--check` fails instead of writing when an output is stale.
import { readFileSync } from 'node:fs';
import { root, emit, finish } from './lib/emit.mjs';

const T = JSON.parse(readFileSync(root('tokens/tokens.json'), 'utf8'));

// ---------- feelings tints (foundations.tint) ----------
// One pigment per family, the same in both colorways (a finish never changes with the colorway).
// The neutral family has no pigment: its body stays ink.
const TINT = T.foundations.tint;
const TINTS = Object.keys(TINT).filter((k) => !k.startsWith('$') && k !== 'field-shift');
const PIGMENTS = TINTS.filter((t) => TINT[t].base);
const tintVars = PIGMENTS.map((t) => `  --mu-tint-${t}: ${TINT[t].base}; /* ${TINT[t].kind} */`).join('\n');

// ---------- CSS ----------
const decl = (obj, prefix = '') =>
  Object.entries(obj).map(([k, v]) => `  --mu-${prefix}${k}: ${v};`).join('\n');

// A damped spring (mass 1) sampled as a CSS linear() curve over its settle time.
function springCurve(k, c, duration, n = 48) {
  const w0 = Math.sqrt(k), z = c / (2 * Math.sqrt(k)), wd = w0 * Math.sqrt(1 - z * z);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * duration;
    const x = i === n ? 1 : 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    pts.push(+x.toFixed(4));
  }
  return `linear(${pts.join(', ')})`;
}
const springs = Object.entries(T.springs)
  .map(([k, s]) => [
    `  /* ${k}: k=${s.stiffness} c=${s.damping} ζ=${s.zeta} · ${s.use} */`,
    `  --mu-spring-${k}: ${s.css ?? springCurve(s.stiffness, s.damping, s.duration)};`,
    `  --mu-spring-${k}-d: ${s.duration}s;`,
    `  --mu-spring-${k}-half: ${s.half};`,
    `  --mu-spring-${k}-near: ${s.near};`,
  ].join('\n'))
  .join('\n');
// Reduce Motion, per spring class (foundations.reduced-motion). Components multiply enter and
// exit offsets by --mu-travel-<class>, and ride --mu-spring-<class>-d; both resolve here, from
// the media query or from data-mu-motion="reduce" on any ancestor.
const travel = Object.keys(T.springs).map((k) => `  --mu-travel-${k}: 1;`).join('\n');
const reducedDecls = Object.entries(T.springs)
  .map(([k, s]) => [
    s.reduced !== 'unchanged' ? `  --mu-travel-${k}: 0;` : null,
    s.reduced === 'instant' ? `  --mu-spring-${k}-d: 0s;` : null,
  ].filter(Boolean).join('\n'))
  .filter(Boolean)
  .join('\n');
const reducedMotion = `/* Reduce Motion: ${Object.entries(T.springs).map(([k, s]) => `${k} ${s.reduced}`).join(', ')}. */
@media (prefers-reduced-motion: reduce) {
  :root {
${reducedDecls.replace(/^/gm, '  ')}
  }
}
[data-mu-motion="reduce"] {
${reducedDecls}
}`;

const caps = Object.entries(T.caps).map(([k, c]) => decl(c, `${k}-`)).join('\n');
const motion = Object.entries(T.motion)
  .filter(([k]) => !k.startsWith('$'))
  .map(([k, v]) => `  --mu-motion-${k}: ${v.value}; /* ${v.use} */`)
  .join('\n');
const swap = Object.entries(T.swap).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `  --mu-swap-${k}: ${v};`).join('\n');

// ---------- foundations ----------
const F = T.foundations;
const FAMILY = { sans: 'var(--mu-sans)', mono: 'var(--mu-mono)', pixel: 'var(--mu-pixel)' };
const foundationVars = [
  ...Object.entries(F.radius).map(([k, v]) => `  --mu-radius-${k}: ${v}px;`),
  `  --mu-nest: ${F.nest}px;`,
  ...Object.entries(F.ring).map(([k, v]) => `  --mu-${k}: ${v}px;`),
].join('\n');

// A type role as declarations; font-stretch comes after the shorthand, which resets it.
function typeDecls(role) {
  const r = F.type[role];
  const out = [
    `font: ${r.weight} ${r.size}px/${r.line}px ${FAMILY[r.family]}`,
    `letter-spacing: ${r.tracking}`,
  ];
  if (r.family === 'mono') out.push(`font-stretch: var(--mu-${r.stretch === 'code' ? 'mono-code-stretch' : 'mono-stretch'})`);
  if (r.uppercase) out.push('text-transform: uppercase');
  if (r.tabular) out.push('font-variant-numeric: tabular-nums');
  return out;
}
// Feelings tints: how the pigment sits on a glyph comes from the colorway (tint-line, tint-body).
// Increase Contrast and [data-mu-untinted] return the glyph to ink.
const tintSel = TINTS.map((t) => `.mu-tint-${t}`).join(', ');
const tintClasses = `/* Feelings tints (foundations.tint). Bone: ink line, enamel body. Graphite: the line glows in
   the pigment (--mu-tint-line 1), the body is its duotone (--mu-tint-body 1). Glyphs only. */
${TINTS.map((t) => (TINT[t].base
    ? `.mu-tint-${t} { color: color-mix(in srgb, var(--mu-tint-${t}) calc(var(--mu-tint-line) * 100%), currentColor); --mu-duo-fill: var(--mu-tint-${t}); --mu-duo-tint: var(--mu-tint-body); }`
    : `.mu-tint-${t} { --mu-duo-fill: currentColor; --mu-duo-tint: 1; } /* ${TINT[t].kind}: no pigment, the glyph stays ink */`)).join('\n')}
[data-mu-untinted] :is(${tintSel}),
[data-mu-untinted]:is(${tintSel}) { color: inherit; --mu-duo-fill: currentColor; --mu-duo-tint: 1; }
@media (prefers-contrast: more) {
  ${tintSel} { color: inherit; --mu-duo-fill: currentColor; --mu-duo-tint: 1; }
}`;

const typeClasses = Object.keys(F.type)
  .map((role) => `.mu-type-${role} { ${typeDecls(role).join('; ')}; }`)
  .join('\n');

const css = `/* Generated by scripts/build-tokens.mjs from tokens/tokens.json. Do not edit. */
/* Materials: the approved Soft Hardware object sheet (Rev B). Foundations: FOUNDATIONS.md. */
:root {
${decl(T.shared)}
${springs}
${caps}
${motion}
${swap}
${foundationVars}
${travel}
${tintVars}
}

${reducedMotion}

/* Type roles: the only sizes, weights and trackings components use. */
${typeClasses}

:root,
[data-mu-colorway="bone"] {
  color-scheme: light;
${decl(T.colorways.bone)}
}

[data-mu-colorway="graphite"] {
  color-scheme: dark;
${decl(T.colorways.graphite)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-mu-colorway="bone"]) {
    color-scheme: dark;
${decl(T.colorways.graphite).replace(/^/gm, '  ')}
  }
}

${tintClasses}
`;
emit('packages/metalui/src/components/tokens.css', css);

// ---------- Tailwind v4 theme ----------
// Spacing is 1px per unit, so the utility number is the token value: h-32, gap-12, p-6.
// Colors and materials reference the --mu-* variables, so they follow the colorway.
const inks = ['ink', 'ink2', 'ink3', 'engrave', 'icon'];
const theme = `/* Generated by scripts/build-tokens.mjs from tokens/tokens.json. Do not edit. */
/* Tailwind v4 theme for Soft Hardware. Import after "tailwindcss" and ./tokens.css. */
@theme {
  --spacing: 1px;
  --font-sans: ${T.shared.sans};
  --font-mono: ${T.shared.mono};
  --font-pixel: ${T.shared.pixel};
${Object.entries(F.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`).join('\n')}
}

@theme inline {
${inks.map((k) => `  --color-${k}: var(--mu-${k});`).join('\n')}
  --color-page: var(--mu-page);
  --color-page-dark: var(--mu-page-dark);
  --color-green: var(--mu-green);
  --color-green-deep: var(--mu-green-deep);
  --color-red: var(--mu-red);
  --color-success: var(--mu-success);
  --color-warning: var(--mu-warning);
  --color-photon: var(--mu-photon);
${PIGMENTS.map((t) => `  --color-tint-${t}: var(--mu-tint-${t});`).join('\n')}
  --shadow-raise: var(--mu-raise);
  --shadow-raise-sm: var(--mu-raise-sm);
  --shadow-cap: var(--mu-btn-sh);
  --shadow-well: var(--mu-well);
${Object.keys(T.springs).map((k) => `  --ease-${k}: var(--mu-spring-${k});`).join('\n')}
}

/* Type roles */
${Object.keys(F.type).map((role) => `@utility type-${role} {\n  ${typeDecls(role).join(';\n  ')};\n}`).join('\n')}

/* Materials: a fill and its shadow stack, as one utility (FOUNDATIONS §8). */
@utility material-raised {
  background: linear-gradient(180deg, var(--mu-s-hi), var(--mu-s) 55%, var(--mu-s-lo));
  box-shadow: var(--mu-raise);
}
@utility material-cap {
  background: var(--mu-btn-bg);
  box-shadow: var(--mu-btn-sh);
}
@utility material-well {
  background: linear-gradient(var(--mu-well-top), var(--mu-well-bot));
  box-shadow: var(--mu-well);
}
@utility material-pressed {
  background: var(--mu-pressed-bg);
  box-shadow: var(--mu-pressed-sh);
}
@utility material-thumb {
  background: linear-gradient(var(--mu-thumb-hi), var(--mu-thumb-lo));
  box-shadow: var(--mu-raise-sm);
}
@utility material-float {
  background: var(--mu-frost-strong);
  box-shadow: var(--mu-raise);
  -webkit-backdrop-filter: blur(22px) saturate(1.6);
  backdrop-filter: blur(22px) saturate(1.6);
}
@utility engraved {
  color: var(--mu-engrave);
  text-shadow: 0 .5px 0 var(--mu-lip);
}
`;
emit('packages/metalui/src/components/theme.css', theme);

// ---------- springs for JS-driven motion (morph glyphs) ----------
emit('packages/metalui/src/motion/springs.generated.ts', `// Generated by scripts/build-tokens.mjs from tokens/tokens.json. Do not edit.
// The mass-class springs for motion driven from JS (mass 1). CSS uses the sampled curves.
export const SPRINGS = {
${Object.entries(T.springs).map(([k, s]) => `  ${k}: { stiffness: ${s.stiffness}, damping: ${s.damping}, duration: ${s.duration} },`).join('\n')}
} as const;
export type SpringName = keyof typeof SPRINGS;
`);

// ---------- CSS value parsing (for Swift) ----------
function splitTop(s, sep = ',') {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function color(s) {
  s = s.trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1);
  }
  m = s.match(/^rgba?\(([^)]*)\)$/);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  throw new Error(`unparsed color: ${s}`);
}
const num = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(+n.toFixed(4)));
const rgbaSwift = ([r, g, b, a]) => `MetalRGBA(${r}, ${g}, ${b}, ${num(a)})`;

function shadows(s) {
  return splitTop(s).map((layer) => {
    const inset = /\binset\b/.test(layer);
    const rest = layer.replace(/\binset\b/, '').trim();
    const colorStart = rest.search(/(#|rgba?\()/);
    const lengths = rest.slice(0, colorStart).trim().split(/\s+/).map((x) => parseFloat(x));
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
    return `MetalShadow(inset: ${inset}, x: ${num(x)}, y: ${num(y)}, blur: ${num(blur)}, spread: ${num(spread)}, color: ${rgbaSwift(color(rest.slice(colorStart)))})`;
  });
}
function linear(s) {
  const inner = s.match(/^linear-gradient\((.*)\)$/)[1];
  const parts = splitTop(inner);
  let angle = 180;
  if (/deg$/.test(parts[0])) angle = parseFloat(parts.shift());
  const stops = parts.map((p, i) => {
    const m = p.match(/^(.*?)(?:\s+([\d.]+)%)?$/);
    const loc = m[2] !== undefined ? +m[2] / 100 : i / Math.max(1, parts.length - 1);
    return `.init(${rgbaSwift(color(m[1]))}, ${num(loc)})`;
  });
  return `MetalGradient(angle: ${num(angle)}, stops: [${stops.join(', ')}])`;
}
function radial(s) {
  const inner = s.match(/^radial-gradient\((.*)\)$/)[1];
  const parts = splitTop(inner);
  const at = parts.shift().match(/at ([\d.]+)% ([\d.]+)%/);
  const stops = parts.map((p) => {
    const m = p.match(/^(#[0-9a-f]+|rgba?\([^)]*\))(?:\s+[\d.]+)?(?:\s+([\d.]+)%)?$/i);
    const pcts = p.match(/([\d.]+)%/g) ?? ['0%'];
    return `.init(${rgbaSwift(color(m[1]))}, ${num(parseFloat(pcts.at(-1)) / 100)})`;
  });
  return `MetalRadialGradient(center: .init(x: ${num(+at[1] / 100)}, y: ${num(+at[2] / 100)}), stops: [${stops.join(', ')}])`;
}
function swiftValue(v) {
  if (/^linear-gradient/.test(v)) return ['MetalGradient', linear(v)];
  if (/^radial-gradient/.test(v)) return ['MetalRadialGradient', radial(v)];
  if (/^-?[\d.]+$/.test(v)) return ['Double', num(+v)];
  if (/\d+px/.test(v) || /^inset|^0 /.test(v)) return ['[MetalShadow]', `[\n            ${shadows(v).join(',\n            ')},\n        ]`];
  return ['MetalRGBA', rgbaSwift(color(v))];
}
const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// ---------- Swift ----------
const cwKeys = Object.keys(T.colorways.bone);
const cwFields = cwKeys.map((k) => `    public let ${camel(k)}: ${swiftValue(T.colorways.bone[k])[0]}`).join('\n');
const cwInstance = (cw) => `MetalColorwayTokens(\n${cwKeys.map((k) => `        ${camel(k)}: ${swiftValue(T.colorways[cw][k])[1]}`).join(',\n')}\n    )`;

const swiftShared = Object.entries(T.shared)
  .filter(([, v]) => !/^cubic-bezier|"|,\s*sans-serif|monospace|%$/.test(v))
  .map(([k, v]) => { const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; })
  .join('\n');
const capKeys = Object.keys(T.caps.primary);
const swiftCaps = Object.entries(T.caps).map(([k, c]) =>
  `    public static let ${camel(k)} = MetalCapTokens(\n${capKeys.map((ck) => `        ${camel(ck)}: ${swiftValue(c[ck])[1]}`).join(',\n')}\n    )`).join('\n');
const swiftSprings = Object.entries(T.springs)
  .map(([k, s]) => `    /// ${s.use}\n    public static let ${k} = MetalSpring(stiffness: ${num(s.stiffness)}, damping: ${num(s.damping)}, duration: ${num(s.duration)})`)
  .join('\n');

const swift = `// Generated by scripts/build-tokens.mjs from tokens/tokens.json. Do not edit.
// Values are the approved Soft Hardware object sheet (Rev B); the CSS twin is components/tokens.css.

/// Every value one colorway supplies. Mirrors the \`--mu-*\` colorway custom properties.
public struct MetalColorwayTokens: Sendable {
${cwFields}
}

/// A signal cap (primary, destructive) that looks the same in both colorways.
public struct MetalCapTokens: Sendable {
${capKeys.map((k) => `    public let ${camel(k)}: ${swiftValue(T.caps.primary[k])[0]}`).join('\n')}
}

public enum MetalTokens {
    public static let bone = ${cwInstance('bone')}

    public static let graphite = ${cwInstance('graphite')}
}

public enum MetalShared {
${swiftShared}
}

public enum MetalCaps {
${swiftCaps}
}

public enum MetalSprings {
${swiftSprings}
}

/// How a spring class resolves under Reduce Motion (foundations.reduced-motion).
public enum MetalReducedMotion: String, Sendable {
    /// Plays as authored: the motion is feedback, not decoration.
    case unchanged
    /// Travel and scale go; opacity stays and rides the crossfade spring.
    case crossfade
    /// The new state applies at once.
    case instant
}

/// The mass classes. Pick the class; the spring and its Reduce Motion policy follow.
public enum MetalSpringClass: String, CaseIterable, Sendable {
${Object.entries(T.springs).map(([k, s]) => `    /// ${s.use}\n    case ${k}`).join('\n')}

    public var spring: MetalSpring {
        switch self {
${Object.keys(T.springs).map((k) => `        case .${k}: return MetalSprings.${k}`).join('\n')}
        }
    }

    public var reducedMotion: MetalReducedMotion {
        switch self {
${Object.entries(T.springs).map(([k, s]) => `        case .${k}: return .${s.reduced}`).join('\n')}
        }
    }

    /// The class whose spring carries a crossfade under Reduce Motion.
    public static let crossfade: MetalSpringClass = .${F['reduced-motion'].crossfade}
}

/// ${TINT.$use}
public enum MetalTint: String, CaseIterable, Sendable {
${TINTS.map((t) => `    /// ${TINT[t].kind}: ${[...TINT[t].feelings, ...TINT[t].moments].join(', ')}\n    case ${t}`).join('\n')}

    /// The family's pigment, the same in both colorways; nil for neutral, whose body stays ink.
    public var pigment: MetalRGBA? {
        switch self {
${TINTS.map((t) => `        case .${t}: return ${TINT[t].base ? swiftValue(TINT[t].base)[1] : 'nil'}`).join('\n')}
        }
    }

    /// The kind of feeling the tint names.
    public var kind: String {
        switch self {
${TINTS.map((t) => `        case .${t}: return ${JSON.stringify(TINT[t].kind)}`).join('\n')}
        }
    }

    public var valence: String {
        switch self {
${TINTS.map((t) => `        case .${t}: return ${JSON.stringify(TINT[t].valence)}`).join('\n')}
        }
    }
}
`;
emit('swift/Sources/MetalUI/Tokens/MetalTokens.generated.swift', swift);

// ---------- Swift foundations ----------
const em = (v) => num(parseFloat(v));
const STRETCH = { mono: parseFloat(T.shared['mono-stretch']) / 100, code: parseFloat(T.shared['mono-code-stretch']) / 100 };
const role = ([name, r]) => {
  const stretch = r.family === 'mono' ? (r.stretch === 'code' ? STRETCH.code : STRETCH.mono) : 1;
  return `    /// ${r.size}/${r.line} · ${r.weight}${r.max ? ` · scales with the host's text size up to ${r.max} pt` : ''}
    public static let ${name} = MetalTypeRole(
        name: ${JSON.stringify(name)}, family: .${r.family}, size: ${num(r.size)}, line: ${num(r.line)}, weight: ${r.weight},
        tracking: ${em(r.tracking)}, stretch: ${num(stretch)}, uppercase: ${!!r.uppercase}, tabular: ${!!r.tabular}, maxSize: ${r.max ? num(r.max) : 'nil'}
    )`;
};
const foundationsSwift = `// Generated by scripts/build-tokens.mjs from tokens/tokens.json (foundations). Do not edit.
// The same ladders the CSS reads: FOUNDATIONS.md §1–7.

/// The radius ladder in points. Nest a radius inside another by subtracting \`nest\`.
public enum MetalRadius {
${Object.entries(F.radius).map(([k, v]) => `    public static let ${camel(k)}: Double = ${num(v)}`).join('\n')}
    /// The inset between a radius and the one nested inside it.
    public static let nest: Double = ${num(F.nest)}
}

/// The spacing ladder in points (4 pt base, with 2 and 6 for tight optics).
public enum MetalSpace {
    public static let steps: [Double] = [${F.space.map(num).join(', ')}]
${F.space.map((v) => `    public static let s${v}: Double = ${num(v)}`).join('\n')}
}

/// Control heights in points.
public enum MetalHeight {
    public static let steps: [Double] = [${F.height.map(num).join(', ')}]
${F.height.map((v) => `    public static let h${v}: Double = ${num(v)}`).join('\n')}
}

/// Icon size by the height of the control that holds it.
public enum MetalIconSize {
    public static let byControlHeight: [Double: Double] = [${Object.entries(F.icon).map(([h, v]) => `${num(+h)}: ${num(v)}`).join(', ')}]

    /// The icon size for a control height; heights between steps take the step below.
    public static func forControl(height: Double) -> Double {
        let keys = byControlHeight.keys.sorted()
        let step = keys.last(where: { $0 <= height }) ?? keys[0]
        return byControlHeight[step]!
    }
}

/// Focus and selection rings in points.
public enum MetalRing {
${Object.entries(F.ring).map(([k, v]) => `    public static let ${camel(k)}: Double = ${num(v)}`).join('\n')}
}

/// The type roles: the only sizes, weights and trackings components use.
public enum MetalType {
${Object.entries(F.type).map(role).join('\n')}

    public static let all: [MetalTypeRole] = [${Object.keys(F.type).join(', ')}]
}
`;
emit('swift/Sources/MetalUI/Tokens/MetalFoundations.generated.swift', foundationsSwift);
finish('tokens');
