// icons/src/life.mjs → the life set: React catalog + components + CSS, static and animated SVGs,
// and icons-life.json. The motion engine and static bake are Kamui's life builder
// (design/medium-icons/src/build.mjs) with MetalUI class names; geometry and motion are verbatim,
// so the SVG exports match Kamui's byte for byte apart from the id prefix.
import { readFileSync } from 'node:fs';
import { GLYPHS, CATS } from '../../packages/metalui/icons/src/life.mjs';
import { T16 } from '../../packages/metalui/icons/src/life-tuned16.mjs';
import { emit, root } from './emit.mjs';

const T = JSON.parse(readFileSync(root('tokens/tokens.json'), 'utf8'));
const SW = 1.7, SW16 = 1.85;

// ---------- tints come from tokens.json (DS-42): a family names the feelings and moments it carries ----------
const TINT = T.foundations.tint;
const TINT_OF = {};
for (const [family, t] of Object.entries(TINT)) {
  if (family.startsWith('$') || family === 'field-shift') continue;
  for (const n of [...t.feelings, ...t.moments]) TINT_OF[n] = family;
}
for (const n of Object.keys(TINT_OF)) if (!GLYPHS.some((g) => g.name === n)) throw new Error(`tokens.json tint names ${n}, which is not a life glyph`);

// ---------- spring easing as CSS linear() (identical to the Kamui life builder) ----------
function spring(z, T, n = 44) {
  const w = 4.6 / (z * T), wd = w * Math.sqrt(1 - z * z), pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * T;
    pts.push(i === n ? 1 : +(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))).toFixed(4));
  }
  return `linear(${pts.join(',')})`;
}
const K_SPRING = spring(0.62, 0.5); // the authored pose spring: ζ .62 over 500 ms (DS-23)
const BASE_CSS = `
.mu-life{--sw:${SW};--k-spring:${K_SPRING};--k-dur:.5s;flex:none;overflow:visible;fill:none;stroke:currentColor;stroke-width:var(--sw);stroke-linecap:round;stroke-linejoin:round}
.mu-life *{transform-box:view-box}
.mu-life .f{fill:currentColor;fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1))}
.mu-life .s{fill:currentColor;stroke:none}
.mu-life .d{fill:currentColor;fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1));stroke:none}
@media (prefers-reduced-motion:no-preference){
.mu-life *{transition:transform var(--k-dur) var(--k-spring) var(--dl,0s),opacity .22s ease var(--dl,0s),fill-opacity .25s ease}
}`;

// ---------- selector expansion ----------
// @H  the host is hovered: the nearest .mu-icon-trigger (a block, a row, a button), or the glyph itself;
//     never on a static glyph. A glyph on a line is not a control, so there is no press.
function expand(css, name, target) {
  const cls = `mu-il-${name}`;
  const rootSel = target === 'svg' ? 'svg.mu-life' : `.mu-life.${cls}`;
  const H = target === 'svg'
    ? 'svg.mu-life:is(:hover,[data-state~="hover"])'
    : `:is(.mu-icon-trigger:is(:hover,[data-hover]) .${cls},.${cls}:is(:hover,[data-hover])):not([data-static])`;
  return css.replace(/@H/g, H).replace(/&(?=[\s.{,:])/g, rootSel).replace(/\bKF(\d?)\b/g, `mu-il-${name}$1`).replace(/\s+/g, ' ');
}
const iconCss = (g, target) => `${g.base ? expand(g.base, g.name, target) : ''}\n@media (prefers-reduced-motion:no-preference){${g.mo ? expand(g.mo, g.name, target) : ''}}`;

// ---------- static bake (identical to the Kamui life builder) ----------
const DROP = { snack: ['cr'], cooking: ['pf'], reading: ['pg'], cycle: ['sp'], idea: ['rs'], podcast: ['sw'], grateful: ['dp'] };
const BAKE = { td: 'opacity=".4"' };
export function lifeStaticSvg(g, sw = SW, body = g.body, extraDrop = []) {
  const drop = [...(DROP[g.name] || []), ...extraDrop];
  const id = `mu-life-${g.name}`;
  let s = (g.defs ? `<defs>${g.defs}</defs>` : '') + body;
  s = s.replace(/&-/g, id + '-');
  s = s.replace(/<(\w+)([^>]*?)(\/?)>/g, (m, tag, attrs, sc) => {
    const cm = attrs.match(/\sclass="([^"]*)"/);
    const classes = cm ? cm[1].split(/\s+/) : [];
    if (classes.some((c) => drop.includes(c))) return sc ? '' : m;
    let a = attrs.replace(/\sclass="[^"]*"/, '');
    const st = a.match(/\sstyle="([^"]*)"/);
    let duo = 0.14, swMul = null;
    if (st) {
      const dm = st[1].match(/--duo:([\d.]+)/); if (dm) duo = +dm[1];
      const sm = st[1].match(/calc\(var\(--sw\) \* ([\d.]+)\)/); if (sm) swMul = +sm[1];
      let rest = st[1].replace(/--duo:[\d.]+;?/, '').replace(/stroke-width:calc\(var\(--sw\) \* [\d.]+\);?/, '');
      rest = rest.replace(/opacity:([\d.]+);?/, (_, o) => { a += ` opacity="${o}"`; return ''; }).replace(/stroke-dasharray:([^;]+);?/, (_, v) => { a += ` stroke-dasharray="${v}"`; return ''; }).trim();
      a = a.replace(/\sstyle="[^"]*"/, rest ? ` style="${rest}"` : '');
    }
    if (swMul) a += ` stroke-width="${+(sw * swMul).toFixed(2)}"`;
    if (classes.includes('f')) a += ` fill="currentColor" fill-opacity="${duo}"`;
    if (classes.includes('s')) a += ` fill="currentColor" stroke="none"`;
    if (classes.includes('d')) a += ` fill="currentColor" fill-opacity="${duo}" stroke="none"`;
    for (const c of classes) if (BAKE[c]) a += ' ' + BAKE[c];
    return `<${tag}${a}${sc}>`;
  });
  s = s.replace(/\spathLength="1"/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${s}</svg>\n`;
}
function animatedSvg(g) {
  const css = (BASE_CSS + '\n' + iconCss(g, 'svg')).replace(/\n+/g, '\n');
  const id = `mu-life-${g.name}`;
  const defs = g.defs ? `<defs>${g.defs.replace(/&-/g, id + '-')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mu-life mu-il-${g.name}" width="24" height="24" viewBox="0 0 24 24">
<!-- MetalUI life icon: ${g.label}. Hover (or data-state="hover"): ${g.hover}. Reduced motion: static. -->
<style>${css}</style>
${defs}${g.body.replace(/&-/g, id + '-')}
</svg>\n`;
}

// ---------- hover length: the longest authored track (animation delay + duration × count), else the pose spring ----------
function hoverMs(g) {
  const mo = g.mo || '';
  let ms = /transform|opacity|fill-opacity|stroke-dashoffset/.test(mo.replace(/animation[^;}]*/g, '')) ? 500 : 0;
  const td = mo.match(/transition-duration:([\d.]+)s/);
  if (td) ms = Math.max(ms, +td[1] * 1000);
  for (const m of mo.matchAll(/animation:\s*KF\d?\s+([\d.]+)s([^;}]*)/g)) {
    const rest = m[2];
    const times = rest.match(/\s(\d+)\s*$/) ? +rest.match(/\s(\d+)\s*$/)[1] : 1;
    const delay = rest.match(/\s([\d.]+)s/) ? +rest.match(/\s([\d.]+)s/)[1] : 0;
    ms = Math.max(ms, Math.round((delay + +m[1] * times) * 1000));
  }
  return ms;
}

const pascal = (n) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const VAL = { '+': 'pleasant', '0': 'neutral', '-': 'unpleasant' };
const construction = (g) => (g.cat === 'feelings' ? 'vessel + trace (feelings language)' : g.cat === 'time' && /dayGlyph|horizon/.test(g.body) ? 'horizon + arc + sun' : null);

export { GLYPHS as LIFE_GLYPHS, T16 as LIFE_T16, TINT_OF as LIFE_TINT_OF, SW16 as LIFE_SW16 };

export function buildLife() {
  const CAT_LABEL = Object.fromEntries(CATS);
  const entries = GLYPHS.map((g) => ({ g, tint: TINT_OF[g.name] ?? null, t16: T16[g.name], ms: hoverMs(g) }));

  emit('packages/metalui/src/icons/life/catalog.generated.ts', `// Generated by scripts/build-icons.mjs from icons/src/life.mjs. Do not edit.
// The life set: a recognised event, activity, state, feeling, food, place or body signal.
import type { TintName } from './tints.generated';

export interface LifeIconRecord {
  label: string;
  category: LifeCategory;
  /** pleasant · neutral · unpleasant, for feelings and energy states. */
  valence: 'pleasant' | 'neutral' | 'unpleasant' | null;
  energy: 'hi' | 'mid' | 'lo' | null;
  /** The feelings family that colors the stroke (tokens.json foundations.tint), or null for ink. */
  tint: TintName | null;
  hover: string;
  /** Ms from hover start to the end of the longest authored track. */
  hoverMs: number;
  /** Words and phrasings that mean this glyph ("brekkie" is breakfast). */
  synonyms: readonly string[];
  /** How recognition reaches it: a Layer 1 rule or a Jev choice. */
  hook: string;
  defs: string;
  body: string;
  /** Tuned geometry for 16px and below. */
  body16?: string;
  sw16: number;
}

export const LIFE_CATEGORIES = ${JSON.stringify(Object.fromEntries(CATS), null, 2)} as const;
export type LifeCategory = keyof typeof LIFE_CATEGORIES;

export const LIFE_CATALOG = {
${entries.map(({ g, tint, t16, ms }) => `  /* ${g.label} · ${CAT_LABEL[g.cat]} · hover: ${g.hover} (${ms} ms) */
  ${JSON.stringify(g.name)}: {
    label: ${JSON.stringify(g.label)},
    category: ${JSON.stringify(g.cat)},
    valence: ${g.val ? JSON.stringify(VAL[g.val]) : 'null'},
    energy: ${g.en ? JSON.stringify(g.en) : 'null'},
    tint: ${tint ? JSON.stringify(tint) : 'null'},
    hover: ${JSON.stringify(g.hover)},
    hoverMs: ${ms},
    synonyms: ${JSON.stringify(g.syn ?? [])},
    hook: ${JSON.stringify(g.hook ?? '')},
    defs: ${JSON.stringify(g.defs || '')},
    body: ${JSON.stringify(g.body)},${t16?.body ? `\n    body16: ${JSON.stringify(t16.body)},` : ''}
    sw16: ${t16?.sw ?? SW16},
  },`).join('\n')}
} satisfies Record<string, LifeIconRecord>;

export type LifeIconName = keyof typeof LIFE_CATALOG;
export const LIFE_ICON_NAMES = Object.keys(LIFE_CATALOG) as LifeIconName[];
`);

  const families = Object.keys(TINT).filter((k) => !k.startsWith('$') && k !== 'field-shift');
  emit('packages/metalui/src/icons/life/tints.generated.ts', `// Generated by scripts/build-icons.mjs from tokens/tokens.json. Do not edit.
/** A feelings tint family (tokens.json foundations.tint). The stroke carries it; words never do. */
export type TintName = ${families.map((f) => JSON.stringify(f)).join(' | ')};
export const TINT_NAMES: readonly TintName[] = ${JSON.stringify(families)};
`);

  emit('packages/metalui/src/icons/life/icons-life.generated.css', `/* Generated by scripts/build-icons.mjs from icons/src/life.mjs. Do not edit. */
${BASE_CSS.trim()}
${entries.map(({ g }) => `/* ${g.name} */\n${iconCss(g, 'react')}`).join('\n')}
`);

  emit('packages/metalui/src/icons/life/components.generated.tsx', `// Generated by scripts/build-icons.mjs from icons/src/life.mjs. Do not edit.
import { createLifeIcon } from './LifeIcon';

${entries.map(({ g }) => `/** ${g.label}. Hover: ${g.hover}. */\nexport const Life${pascal(g.name)}Icon = createLifeIcon(${JSON.stringify(g.name)}, ${JSON.stringify(`Life${pascal(g.name)}Icon`)});`).join('\n')}
`);

  emit('packages/metalui/public/icons-life.json', JSON.stringify({
    $description: 'MetalUI life icons: the contextual vocabulary of a day (meals, sleep, body, feelings, work, people, places, making, money, chores, time, weather). Same construction as the product set: 24 grid, stroke 1.7, duotone. Each has a hover micro-interaction and no press: a glyph on a line is not a control. Feelings carry a tint from tokens.json.',
    count: GLYPHS.length,
    categories: Object.fromEntries(CATS),
    icons: entries.map(({ g, tint, t16, ms }) => ({
      name: g.name,
      component: `Life${pascal(g.name)}Icon`,
      label: g.label,
      category: g.cat,
      valence: g.val ? VAL[g.val] : null,
      energy: g.en ?? null,
      tint,
      hover: g.hover,
      hoverMs: ms,
      press: null,
      tuned16: Boolean(t16?.body),
      synonyms: g.syn ?? [],
      hook: g.hook ?? '',
      construction: construction(g),
    })),
  }, null, 2) + '\n');

  for (const { g, t16 } of entries) {
    emit(`packages/metalui/public/icons/life/svg/${g.name}.svg`, lifeStaticSvg(g));
    emit(`packages/metalui/public/icons/life/svg/16/${g.name}.svg`, lifeStaticSvg(g, t16?.sw ?? SW16, t16?.body ?? g.body));
    emit(`packages/metalui/public/icons/life/svg-animated/${g.name}.svg`, animatedSvg(g));
  }
  return GLYPHS.length;
}
