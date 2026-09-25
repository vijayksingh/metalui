// tokens/tokens.json → tokens.css (--mu-* + type roles), theme.css (Tailwind v4) and the SwiftUI tokens.
// `--check` fails instead of writing when an output is stale.
import { readFileSync } from 'node:fs';
import { root, emit, finish } from './lib/emit.mjs';
import { buildRecipes } from './lib/recipes.mjs';

const RECIPES = buildRecipes(JSON.parse(readFileSync(root('tokens/tokens.json'), 'utf8')).recipes);

const T = JSON.parse(readFileSync(root('tokens/tokens.json'), 'utf8'));

// ---------- feelings tints (foundations.tint) ----------
// Each family has a stroke color per colorway; they join the colorway blocks as --mu-tint-<family>.
const TINT = T.foundations.tint;
const TINTS = Object.keys(TINT).filter((k) => !k.startsWith('$') && k !== 'field-shift');
const CW = Object.fromEntries(Object.entries(T.colorways).map(([cw, c]) => [cw, { ...c, ...Object.fromEntries(TINTS.map((t) => [`tint-${t}`, TINT[t][cw]])) }]));

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
function typeDecls(role, scale = F.type) {
  const r = scale[role];
  const out = [
    `font: ${r.weight} ${r.size}px/${r.line}px ${FAMILY[r.family]}`,
    `letter-spacing: ${r.tracking}`,
  ];
  if (r.family === 'mono') out.push(`font-stretch: var(--mu-${r.stretch === 'code' ? 'mono-code-stretch' : 'mono-stretch'})`);
  if (r.uppercase) out.push('text-transform: uppercase');
  if (r.tabular) out.push('font-variant-numeric: tabular-nums');
  return out;
}
// Feelings tints: the glyph takes the family's stroke color; its duotone body follows through
// currentColor. Increase Contrast and [data-mu-untinted] return the glyph to the surrounding ink.
const tintSel = TINTS.map((t) => `.mu-tint-${t}`).join(', ');
const tintClasses = `/* Feelings tints (foundations.tint): the stroke carries the feeling. Glyphs only, never words. */
${TINTS.map((t) => `.mu-tint-${t} { color: var(--mu-tint-${t}); } /* ${TINT[t].kind} */`).join('\n')}
/* A tinted glyph is stroke only: its vessel (.v, the feelings circle) is not filled. */
:is(${tintSel}) .v:is(.d, .f) { fill-opacity: 0; }
[data-mu-untinted] :is(${tintSel}),
[data-mu-untinted]:is(${tintSel}) { color: inherit; }
@media (prefers-contrast: more) {
  ${tintSel} { color: inherit; }
}`;

// ---------- frost (tokens.json frost) ----------
// A value that names a colorway key reads that key (so it follows the colorway where it is used);
// anything else is a literal, the same in both colorways, emitted once on :root.
const FR = T.frost;
const FROSTS = Object.keys(FR.recipes);
const isCw = (v) => Object.prototype.hasOwnProperty.call(T.colorways.bone, v);
const frostRef = (r, part) => (isCw(FR.recipes[r][part]) ? `var(--mu-${FR.recipes[r][part]})` : `var(--mu-frost-${r}-${part})`);
const frostVars = [
  `  --mu-backdrop-blur: ${FR.backdrop.blur}px;`,
  `  --mu-backdrop-saturate: ${FR.backdrop.saturate};`,
  `  --mu-backdrop: blur(${FR.backdrop.blur}px) saturate(${FR.backdrop.saturate});`,
  ...FROSTS.flatMap((r) => ['fill', 'opaque', 'shadow'].filter((part) => !isCw(FR.recipes[r][part])).map((part) => `  --mu-frost-${r}-${part}: ${FR.recipes[r][part]};`)),
].join('\n');
const frostDecls = (r) => [
  `background: ${frostRef(r, 'fill')}`,
  `box-shadow: ${frostRef(r, 'shadow')}`,
  `-webkit-backdrop-filter: var(--mu-backdrop)`,
  `backdrop-filter: var(--mu-backdrop)`,
];
const opaqueDecls = (r) => [`background: ${frostRef(r, 'opaque')}`, '-webkit-backdrop-filter: none', 'backdrop-filter: none'];
// A recipe with a fixed finish (graphite chrome) takes that finish's contrast edge in either colorway.
const edgeColor = (r) => (FR.recipes[r].finish ? T.colorways[FR.recipes[r].finish]['contrast-edge'] : 'var(--mu-contrast-edge)');
const edgeDecl = (r) => `box-shadow: inset 0 0 0 1px ${edgeColor(r)}, ${frostRef(r, 'shadow')}`;
const frostClasses = `/* Frost (tokens.json frost): ${FR.$use.split('.')[0]}. */
${FROSTS.map((r) => `.mu-frost-${r} { ${frostDecls(r).join('; ')}; } /* ${FR.recipes[r].use} */`).join('\n')}
@media (prefers-reduced-transparency: reduce) {
${FROSTS.map((r) => `  .mu-frost-${r} { ${opaqueDecls(r).join('; ')}; }`).join('\n')}
}
${FROSTS.map((r) => `[data-mu-transparency="reduce"] .mu-frost-${r}, .mu-frost-${r}[data-mu-transparency="reduce"] { ${opaqueDecls(r).join('; ')}; }`).join('\n')}
@media (prefers-contrast: more) {
${FROSTS.map((r) => `  .mu-frost-${r} { ${edgeDecl(r)}; }`).join('\n')}
}`;

// ---------- presence (tokens.json presence): object sheet selection and hover presence ----------
const PR = T.presence;
const PR_KEYS = Object.keys(PR).filter((k) => !k.startsWith('$') && k !== 'ring-dark');
const UNITLESS = new Set(['enter-scale', 'readout-writing', 'corner-glow']);
const prValue = (k, v) => (typeof v === 'number' ? (k.endsWith('-ms') ? `${v}ms` : UNITLESS.has(k) ? `${v}` : `${v}px`) : v);
const presenceVars = PR_KEYS.map((k) => `  --mu-presence-${k}: ${prValue(k, PR[k])};`).join('\n');
// ---------- cue (tokens.json cue): recognition cues on the text ----------
const CU = T.cue;
const CU_KEYS = Object.keys(CU).filter((k) => !k.startsWith('$'));
const CU_UNITLESS = new Set(['doing-opacity']);
const cueVars = CU_KEYS.map((k) => {
  const v = CU[k];
  return `  --mu-cue-${k}: ${typeof v === 'number' ? (k.endsWith('-ms') ? `${v}ms` : CU_UNITLESS.has(k) ? v : `${v}px`) : v};`;
}).join('\n');

// Type roles as custom properties too, for places a class cannot reach (::before, ::after):
// font: var(--mu-type-label); letter-spacing: var(--mu-type-label-tracking).
// ---------- suggestion (tokens.json suggestion) ----------
const SG = T.suggestion;
const SG_KEYS = Object.keys(SG).filter((k) => !k.startsWith('$'));
const SG_UNITLESS = new Set(['rest-opacity', 'enter-scale']);
const suggestionVars = SG_KEYS.map((k) => `  --mu-suggestion-${k}: ${typeof SG[k] === 'number' ? (SG_UNITLESS.has(k) ? SG[k] : `${SG[k]}px`) : SG[k]};`).join('\n');

// ---------- engraving (tokens.json engraving) ----------
const EG = T.engraving;
const EG_KEYS = Object.keys(EG).filter((k) => !k.startsWith('$'));
const engravingVars = EG_KEYS.map((k) => `  --mu-engraving-${k}: ${k.endsWith('-ms') ? `${EG[k]}ms` : `${EG[k]}px`};`).join('\n');

// ---------- provenance (tokens.json provenance) ----------
const PV = T.provenance;
const PV_KEYS = Object.keys(PV).filter((k) => !k.startsWith('$'));
const provenanceVars = PV_KEYS.map((k) => `  --mu-provenance-${k}: ${typeof PV[k] === 'number' ? (k.endsWith('-ms') ? `${PV[k]}ms` : `${PV[k]}px`) : PV[k]};`).join('\n');

// ---------- region (tokens.json region) ----------
const RG = T.region;
const RG_KEYS = Object.keys(RG).filter((k) => !k.startsWith('$'));
const regionVars = RG_KEYS.map((k) => `  --mu-region-${k}: ${typeof RG[k] === 'number' ? (k === 'dim' ? RG[k] : `${RG[k]}px`) : RG[k]};`).join('\n');

// ---------- switcher (tokens.json switcher) ----------
const SE = T.switcher;
const SE_KEYS = Object.keys(SE).filter((k) => !k.startsWith('$'));
const switcherVars = SE_KEYS.map((k) => `  --mu-switcher-${k}: ${SE[k]}px;`).join('\n');

// ---------- lens bar (tokens.json lensbar) ----------
const LB = T.lensbar;
const LB_KEYS = Object.keys(LB).filter((k) => !k.startsWith('$'));
const lensbarVars = LB_KEYS.map((k) => `  --mu-lensbar-${k}: ${k === 'enter-scale' ? LB[k] : `${LB[k]}px`};`).join('\n');

// ---------- scrubber (tokens.json scrubber) ----------
const SC = T.scrubber;
const SC_KEYS = Object.keys(SC).filter((k) => !k.startsWith('$'));
const SC_UNITLESS = new Set(['fill-opacity', 'snap', 'step-ms', 'large-step-ms']);
const scrubberVars = SC_KEYS.map((k) => `  --mu-scrubber-${k}: ${typeof SC[k] === 'number' ? (SC_UNITLESS.has(k) ? SC[k] : `${SC[k]}px`) : SC[k]};`).join('\n');

// ---------- past banner (tokens.json pastbanner) ----------
const PB = T.pastbanner;
const PB_KEYS = Object.keys(PB).filter((k) => !k.startsWith('$'));
const pastbannerVars = PB_KEYS.map((k) => `  --mu-pastbanner-${k}: ${typeof PB[k] === 'number' ? `${PB[k]}px` : PB[k]};`).join('\n');

// ---------- settings (tokens.json settings) ----------
const SETTINGS = T.settings;
const SETTINGS_KEYS = Object.keys(SETTINGS).filter((k) => !k.startsWith('$'));
const settingsVars = SETTINGS_KEYS.map((k) => `  --mu-settings-${k}: ${typeof SETTINGS[k] === 'number' ? `${SETTINGS[k]}px` : SETTINGS[k]};`).join('\n');

// ---------- tool strip (tokens.json toolstrip) ----------
const TS = T.toolstrip;
const TS_KEYS = Object.keys(TS).filter((k) => !k.startsWith('$'));
const toolstripVars = TS_KEYS.map((k) => `  --mu-toolstrip-${k}: ${typeof TS[k] === 'number' ? `${TS[k]}px` : TS[k]};`).join('\n');

// ---------- kbd (tokens.json kbd) ----------
const KB = T.kbd;
const KB_KEYS = Object.keys(KB).filter((k) => !k.startsWith('$'));
const kbdVars = KB_KEYS.map((k) => `  --mu-kbd-${k}: ${typeof KB[k] === 'number' ? `${KB[k]}px` : KB[k]};`).join('\n');

// ---------- status (tokens.json status): LEDs and the status badge ----------
const ST = T.status;
const ST_KEYS = Object.keys(ST).filter((k) => !k.startsWith('$'));
const statusVars = ST_KEYS.map((k) => `  --mu-status-${k}: ${typeof ST[k] === 'number' ? `${ST[k]}px` : ST[k]};`).join('\n');

// ---------- toast (tokens.json toast) ----------
const TT = T.toast;
const TT_KEYS = Object.keys(TT).filter((k) => !k.startsWith('$'));
const toastVars = TT_KEYS.map((k) => `  --mu-toast-${k}: ${typeof TT[k] === 'number' ? (k.endsWith('-ms') ? `${TT[k]}ms` : k === 'enter-scale' ? TT[k] : `${TT[k]}px`) : TT[k]};`).join('\n');

// ---------- toolbar (tokens.json toolbar) ----------
const TB = T.toolbar;
const TB_KEYS = Object.keys(TB).filter((k) => !k.startsWith('$'));
const toolbarVars = TB_KEYS.map((k) => `  --mu-toolbar-${k}: ${typeof TB[k] === 'number' ? (k.endsWith('-ms') ? `${TB[k]}ms` : `${TB[k]}px`) : TB[k]};`).join('\n');

// ---------- button (tokens.json button) ----------
const BT = T.button;
const BT_KEYS = Object.keys(BT).filter((k) => !k.startsWith("$"));
const buttonVars = BT_KEYS.map((k) => `  --mu-button-${k}: ${k.endsWith("-ms") ? `${BT[k]}ms` : k === "disabled" ? BT[k] : `${BT[k]}px`};`).join("\n");

// ---------- tooltip (tokens.json tooltip) ----------
const TP = T.tooltip;
const TP_KEYS = Object.keys(TP).filter((k) => !k.startsWith("$"));
const tooltipVars = TP_KEYS.map((k) => `  --mu-tooltip-${k}: ${typeof TP[k] === "number" ? (k.endsWith("-ms") ? `${TP[k]}ms` : `${TP[k]}px`) : TP[k]};`).join("\n");

// ---------- menu (tokens.json menu) ----------
const MN = T.menu;
const MN_KEYS = Object.keys(MN).filter((k) => !k.startsWith("$"));
const menuVars = MN_KEYS.map((k) => `  --mu-menu-${k}: ${MN[k]}px;`).join("\n");

// ---------- palette (tokens.json palette): the command palette ----------
const PL = T.palette;
const PL_KEYS = Object.keys(PL).filter((k) => !k.startsWith("$"));
const PL_RAW = new Set(["top", "list-max", "mark-weight", "enter-scale"]);
const paletteVars = PL_KEYS.map((k) => `  --mu-palette-${k}: ${typeof PL[k] === "number" ? (PL_RAW.has(k) ? PL[k] : `${PL[k]}px`) : PL[k]};`).join("\n");

const typeVars = Object.entries(F.type).map(([role, r]) => [
  `  --mu-type-${role}: ${r.weight} ${r.size}px/${r.line}px ${FAMILY[r.family]};`,
  `  --mu-type-${role}-tracking: ${r.tracking};`,
].join('\n')).join('\n');

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
${frostVars}
${presenceVars}
${cueVars}
${suggestionVars}
${engravingVars}
${provenanceVars}
${regionVars}
${switcherVars}
${lensbarVars}
${scrubberVars}
${pastbannerVars}
${toolstripVars}
${settingsVars}
${kbdVars}
${statusVars}
${toastVars}
${toolbarVars}
${buttonVars}
${tooltipVars}
${menuVars}
${paletteVars}
${typeVars}
${travel}
}

${reducedMotion}

/* Type roles: the only sizes, weights and trackings components use. */
${typeClasses}

:root,
[data-mu-colorway="bone"] {
  color-scheme: light;
${decl(CW.bone)}
}

[data-mu-colorway="graphite"] {
  color-scheme: dark;
${decl(CW.graphite)}
  --mu-presence-ring: ${PR['ring-dark']};
}

@media (prefers-color-scheme: dark) {
  :root:not([data-mu-colorway="bone"]) {
    color-scheme: dark;
${decl(CW.graphite).replace(/^/gm, '  ')}
    --mu-presence-ring: ${PR['ring-dark']};
  }
}

${tintClasses}

${frostClasses}

/* Object recipes (tokens.json recipes): every layer of each object's look, from the reference design. */
:root {
${RECIPES.css.root}
}
/* Layers in an object's own colour resolve where --mu-self is set (data-mu-self on the object). */
[data-mu-self] {
${RECIPES.css.self}
}
:root,
[data-mu-colorway="bone"] {
${RECIPES.css.bone}
}
[data-mu-colorway="graphite"] {
${RECIPES.css.graphite}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-mu-colorway="bone"]) {
${RECIPES.css.graphite.replace(/\/\* mu-recipe:[^*]+\*\/ /g, '').replace(/^/gm, '  ')}
  }
}
`;
emit('packages/metalui/src/components/tokens.css', css);

// ---------- Tailwind v4 theme ----------
// Spacing is 1px per unit, so the utility number is the token value: h-32, gap-12, p-6.
// Colors and materials reference the --mu-* variables, so they follow the colorway.
const inks = ['ink', 'ink2', 'ink3', 'engrave', 'icon'];
const surfaces = ['s-hi', 's', 's-lo', 'rule', 'stage-bar'];
const synKeys = Object.keys(T.colorways.bone).filter((k) => k.startsWith('syn-'));
const ED = T.editorial;
// The layout groups (presence, suggestion, engraving, …) as theme values: a px value is spacing
// (h-presence-readout-height), a colour is a colour, a duration or an opacity a utility. A name a recipe
// already gives is left to the recipe.
const GROUPS = ['presence', 'cue', 'suggestion', 'engraving', 'provenance', 'region', 'lensbar', 'scrubber', 'pastbanner', 'toolstrip', 'settings', 'palette', 'toast', 'toolbar', 'menu', 'kbd', 'status', 'switcher', 'button', 'tooltip'];
const recipeNames = new Set([...RECIPES.theme.vars.matchAll(/--([\w-]+):/g)].map((m) => m[1]));
const groupVars = [];
const groupUtils = [];
const seen = new Set();
for (const m of css.matchAll(new RegExp(String.raw`^\s+--mu-((?:${GROUPS.join('|')})-[\w-]+): ([^;]+);`, 'gm'))) {
  const [, n, v] = m;
  if (seen.has(n)) continue;
  seen.add(n);
  if (/^-?[\d.]+px$/.test(v) && !recipeNames.has(`spacing-${n}`)) groupVars.push(`  --spacing-${n}: var(--mu-${n});`);
  if (/^-?[\d.]+px$/.test(v) && n.includes('radius') && !recipeNames.has(`radius-${n}`)) groupVars.push(`  --radius-${n}: var(--mu-${n});`);
  else if (/^(#|rgba?\()/.test(v) && !recipeNames.has(`color-${n}`)) groupVars.push(`  --color-${n}: var(--mu-${n});`);
  else if (/^[\d.]+ms$/.test(v)) groupUtils.push(`@utility duration-${n} {\n  --tw-duration: var(--mu-${n});\n  transition-duration: var(--mu-${n});\n}`);
  else if (/^0?\.\d+$|^1$/.test(v)) groupUtils.push(`@utility opacity-${n} {\n  opacity: var(--mu-${n});\n}`);
}
// A group's $utilities: raw declarations a block needs that no theme value spells (a multi-property
// transition), emitted verbatim.
for (const g of [...GROUPS, 'motion', 'swap']) for (const [k, v] of Object.entries(T[g]?.$utilities ?? {})) groupUtils.push(`@utility ${k} {\n  ${v}\n}`); // group $utilities
const GROUP_THEME = `@theme inline {\n${groupVars.join('\n')}\n}\n${groupUtils.join('\n')}`;
// Motions as data (tokens.json animations): a block's entrance, written against the spring and travel
// variables, as @keyframes and an animate-<name> utility.
const ANIMATIONS = Object.entries(T.animations ?? {}).filter(([k]) => !k.startsWith('$'))
  .map(([k, a]) => `@keyframes mu-${k} {\n  ${a.keyframes}\n}\n@utility animate-${k} {\n  animation: mu-${k} ${a.animation};\n}`).join('\n');
const springDurations = Object.keys(T.springs).map((k) => `@utility duration-${k} {\n  --tw-duration: var(--mu-spring-${k}-d);\n  transition-duration: var(--mu-spring-${k}-d);\n}`).join('\n');
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
  --radius-round: var(--mu-round);
  --spacing-press: var(--mu-motion-press);
${inks.map((k) => `  --color-${k}: var(--mu-${k});`).join('\n')}
${surfaces.map((k) => `  --color-${k}: var(--mu-${k});`).join('\n')}
${synKeys.map((k) => `  --color-${k}: var(--mu-${k});`).join('\n')}
  --color-page: var(--mu-page);
  --color-page-dark: var(--mu-page-dark);
  --color-green: var(--mu-green);
  --color-green-deep: var(--mu-green-deep);
  --color-red: var(--mu-red);
  --color-success: var(--mu-success);
  --color-warning: var(--mu-warning);
  --color-photon: var(--mu-photon);
${TINTS.map((t) => `  --color-tint-${t}: var(--mu-tint-${t});`).join('\n')}
  --shadow-raise: var(--mu-raise);
  --shadow-raise-sm: var(--mu-raise-sm);
  --shadow-cap: var(--mu-btn-sh);
  --shadow-well: var(--mu-well);
  --shadow-stage: var(--mu-stage-sh);
  --container-measure: ${ED.measure}px;
  --container-stage: ${ED.stage}px;
${Object.keys(T.springs).map((k) => `  --ease-${k}: var(--mu-spring-${k});`).join('\n')}
}

/* Type roles */
${Object.keys(F.type).map((role) => `@utility type-${role} {\n  ${typeDecls(role).join(';\n  ')};\n}`).join('\n')}

/* Editorial roles (tokens.json editorial): the documentation site's reading scale. Components never use these. */
${Object.keys(ED.type).map((role) => `@utility type-doc-${role} {\n  ${typeDecls(role, ED.type).join(';\n  ')};\n}`).join('\n')}

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
/* A stage: a light object that holds a specimen, with a hairline edge and a soft contact shadow. */
@utility material-stage {
  background: linear-gradient(var(--mu-s-hi), var(--mu-s));
  box-shadow: var(--mu-stage-sh);
}
/* Frost: the same recipes as .mu-frost-*, with their Reduce Transparency and Increase Contrast twins. */
${FROSTS.map((r) => `@utility material-frost-${r} {
  ${frostDecls(r).join(';\n  ')};
  @media (prefers-reduced-transparency: reduce) {
    ${opaqueDecls(r).join(';\n    ')};
  }
  [data-mu-transparency="reduce"] &, &[data-mu-transparency="reduce"] {
    ${opaqueDecls(r).join(';\n    ')};
  }
  @media (prefers-contrast: more) {
    ${edgeDecl(r)};
  }
}`).join('\n')}
/* The floating level (E2) is the frosted plate. */
@utility material-float {
  @apply material-frost-plate;
}
@utility engraved {
  color: var(--mu-engrave);
  text-shadow: var(--mu-lip-shadow);
}
@utility tap-highlight-none {
  -webkit-tap-highlight-color: transparent;
}
/* Reduce Transparency (the system setting, or data-mu-transparency="reduce" on an ancestor): frosted
   surfaces turn opaque and lose their backdrop. */
@custom-variant reduce-transparency {
  @media (prefers-reduced-transparency: reduce) {
    @slot;
  }
  [data-mu-transparency="reduce"] & {
    @slot;
  }
}
/* Reduce Motion (the system setting, or data-mu-motion="reduce" on an ancestor). */
@custom-variant reduced-motion {
  @media (prefers-reduced-motion: reduce) {
    @slot;
  }
  [data-mu-motion="reduce"] & {
    @slot;
  }
}
@utility opaque-frost {
  background: var(--mu-frost-opaque);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
@utility opaque-frost-graphite {
  background: var(--mu-frost-graphite-opaque);
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
/* An empty label shows its placeholder (data-placeholder), as an input shows its own. */
@utility label-placeholder {
  &:empty::before {
    content: attr(data-placeholder);
    color: var(--mu-r-label-placeholder-color);
    font-weight: var(--mu-r-label-placeholder-weight);
  }
  &::placeholder {
    color: var(--mu-r-label-placeholder-color);
    font-weight: var(--mu-r-label-placeholder-weight);
    opacity: 1;
  }
}
/* The focus ring (foundations): the focus ink at its width, off the edge, or flush on it. */
@utility focus-ring {
  outline: var(--mu-focus-width) solid var(--mu-focus);
  outline-offset: var(--mu-focus-offset);
}
@utility focus-ring-flush {
  outline: var(--mu-focus-width) solid var(--mu-focus);
  outline-offset: var(--mu-zero);
}

/* Recipes (tokens.json recipes) as theme values and utilities. Sizes are spacing (h-button-height,
   px-button-pad), inks are colors (text-button-link-ink), each part's type is type-<object>[-<part>],
   durations duration-<object>-<part>-<key>, and each layered look (fills and shadow stacks, per state)
   is recipe-<object>[-<part>][-<state>]. They read the --mu-r-* variables, so they follow the colorway. */
@theme inline {
${RECIPES.theme.vars}
}
${RECIPES.theme.utilities}
${RECIPES.theme.keyframes}

/* The layout groups as theme values, and each spring's duration (duration-settle, …). */
${GROUP_THEME}
${springDurations}

/* Motions (tokens.json animations): each block's entrance. */
${ANIMATIONS}
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
const cwKeys = Object.keys(CW.bone);
const cwFields = cwKeys.map((k) => `    public let ${camel(k)}: ${swiftValue(CW.bone[k])[0]}`).join('\n');
const cwInstance = (cw) => `MetalColorwayTokens(\n${cwKeys.map((k) => `        ${camel(k)}: ${swiftValue(CW[cw][k])[1]}`).join(',\n')}\n    )`;

const swiftShared = Object.entries(T.shared)
  .filter(([, v]) => !/^cubic-bezier|"|,\s*sans-serif|monospace|%$|px$/.test(v))
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

    /// The stroke color in a colorway; the glyph's duotone body follows it.
    public func color(in colorway: MetalColorway) -> MetalRGBA {
        switch self {
${TINTS.map((t) => `        case .${t}: return colorway.tokens.${camel(`tint-${t}`)}`).join('\n')}
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
// Frost recipes in Swift: the same fill, opaque twin, shadow stack and backdrop as .mu-frost-*.
const swiftFrostPart = (r, part) => {
  const v = FR.recipes[r][part];
  if (isCw(v)) return part === 'shadow' ? `t.${camel(v)}` : `.solid(t.${camel(v)})`;
  const [type, val] = swiftValue(v);
  return type === 'MetalRGBA' ? `.solid(${val})` : val;
};
const swiftFrost = `
/// ${FR.$use}
public enum MetalFrost: String, CaseIterable, Sendable {
${FROSTS.map((r) => `    /// ${FR.recipes[r].use}\n    case ${r}`).join('\n')}

    /// The blur behind every frosted recipe (CSS \`--mu-backdrop\`).
    public static let blur: Double = ${num(FR.backdrop.blur)}
    public static let saturation: Double = ${num(FR.backdrop.saturate)}

    /// The recipe in a colorway: translucent fill, shadow stack, backdrop, opaque twin and contrast edge.
    public func recipe(in colorway: MetalColorway) -> MetalRecipe {
        let t = colorway.tokens
        switch self {
${FROSTS.map((r) => {
  const fin = FR.recipes[r].finish;
  return `        case .${r}:
            return MetalRecipe(
                fill: ${swiftFrostPart(r, 'fill')},
                shadows: ${swiftFrostPart(r, 'shadow').replace(/\n {12}/g, '\n                    ').replace(/\n {8}\]/, '\n                ]')},
                backdrop: MetalBackdrop(blur: Self.blur, saturation: Self.saturation, dark: ${fin ? (fin === 'graphite') : 'colorway == .graphite'}),
                opaqueFill: ${swiftFrostPart(r, 'opaque')},
                contrastEdge: ${fin ? `MetalTokens.${fin}.contrastEdge` : 't.contrastEdge'}
            )`;
}).join('\n')}
        }
    }
}
`;
const swiftPresence = `
/// ${PR.$use}
public enum MetalPresence {
${Object.keys(PR).filter((k) => !k.startsWith('$')).map((k) => {
  const v = PR[k];
  if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`;
  if (/em$/.test(v)) return `    /// In em.\n    public static let ${camel(k)}: Double = ${num(parseFloat(v))}`;
  const [type, val] = swiftValue(v);
  return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`;
}).join('\n')}

    /// The ring colour in a colorway: green-deep on bone, green on graphite.
    public static func ringColor(in colorway: MetalColorway) -> MetalRGBA { colorway == .graphite ? ringDark : ring }
}
`;
const swiftCue = `
/// ${CU.$use}
public enum MetalCue {
${CU_KEYS.map((k) => {
  const v = CU[k];
  if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`;
  if (/%$/.test(v)) return `    /// A fraction.\n    public static let ${camel(k)}: Double = ${num(parseFloat(v) / 100)}`;
  const [type, val] = swiftValue(v);
  return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`;
}).join('\n')}
}
`;
const swiftSuggestion = `
/// ${SG.$use}
public enum MetalSuggestion {
${SG_KEYS.map((k) => { const v = SG[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join('\n')}
}
`;
const swiftEngraving = `
/// ${EG.$use}
public enum MetalEngraving {
${EG_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(EG[k])}`).join('\n')}
}
`;
const swiftProvenance = `
/// ${PV.$use}
public enum MetalProvenance {
${PV_KEYS.map((k) => { const v = PV[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; if (/em$/.test(v)) return `    /// In em.\n    public static let ${camel(k)}: Double = ${num(parseFloat(v))}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join('\n')}
}
`;
const swiftRegion = `
/// ${RG.$use}
public enum MetalRegion {
${RG_KEYS.map((k) => { const v = RG[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join('\n')}
}
`;
emit('swift/Sources/MetalUI/Tokens/MetalTokens.generated.swift', swift + RECIPES.swift + swiftFrost + swiftPresence + swiftCue + swiftSuggestion + swiftEngraving + swiftProvenance + swiftRegion + `
/// ${BT.$use}
public enum MetalButtonMetrics {
${BT_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(BT[k])}`).join("\n")}
}

/// ${MN.$use}
public enum MetalMenuMetrics {
${MN_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(MN[k])}`).join("\n")}
}

/// ${TP.$use}
public enum MetalTooltipMetrics {
${TP_KEYS.map((k) => { const v = TP[k]; if (typeof v === "number") return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join("\n")}
}

/// ${PL.$use}
public enum MetalPaletteMetrics {
${PL_KEYS.map((k) => { const v = PL[k]; if (typeof v === "number") return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join("\n")}
}

/// ${LB.$use}
public enum MetalToolbarMetrics {
${TB_KEYS.map((k) => { const v = TB[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`; }).join('\n')}
}

/// ${TT.$use}
public enum MetalToastMetrics {
${TT_KEYS.map((k) => { const v = TT[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`; }).join('\n')}
}

/// ${ST.$use}
public enum MetalStatusMetrics {
${ST_KEYS.map((k) => { const v = ST[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`; }).join('\n')}
}

/// ${KB.$use}
public enum MetalKbdMetrics {
${KB_KEYS.map((k) => { const v = KB[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val.replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}`; }).join('\n')}
}

/// ${TS.$use}
public enum MetalToolStripMetrics {
${TS_KEYS.map((k) => { const v = TS[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join('\n')}
}

/// ${SETTINGS.$use}
public enum MetalSettingsMetrics {
${SETTINGS_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(SETTINGS[k])}`).join('\n')}
}

/// ${PB.$use}
public enum MetalPastBannerMetrics {
${PB_KEYS.map((k) => { const v = PB[k]; if (typeof v === 'number') return `    public static let ${camel(k)}: Double = ${num(v)}`; const [type, val] = swiftValue(v); return `    public static let ${camel(k)}: ${type} = ${val}`; }).join('\n')}
}

/// ${SC.$use}
public enum MetalScrubberMetrics {
${SC_KEYS.filter((k) => typeof SC[k] === 'number').map((k) => `    public static let ${camel(k)}: Double = ${num(SC[k])}`).join('\n')}
    public static let knobSh: [MetalShadow] = ${swiftValue(SC['knob-sh'])[1].replace(/\n {8}\]/, '\n    ]').replace(/\n {12}/g, '\n        ')}
    public static let fill: MetalGradient = ${swiftValue(SC.fill)[1]}
    /// The knob's anodized sweep, as colours around a conic gradient from 200°.
    public static let knobSweep: [MetalRGBA] = [${SC['knob-bg'].match(/#[0-9A-F]{6}/gi).map((h) => swiftValue(h)[1]).join(', ')}]
}

/// ${LB.$use}
public enum MetalLensBarMetrics {
${LB_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(LB[k])}`).join('\n')}
}

/// ${SE.$use}
public enum MetalSwitcherMetrics {
${SE_KEYS.map((k) => `    public static let ${camel(k)}: Double = ${num(SE[k])}`).join('\n')}
}
`);

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
