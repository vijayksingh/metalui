// icons/src/icons.mjs → React catalog + scoped CSS + storyboards, standalone SVGs, icons.json.
// The motion engine (spring curves, base CSS, selector expansion, static bake) is the Kamui
// icon builder's, unchanged except for the class names; every icon's geometry and motion is
// copied verbatim, so the React icons move exactly like the approved sheet.
import { ICONS } from '../packages/metalui/icons/src/icons.mjs';
import { T16 } from '../packages/metalui/icons/src/tuned16.mjs';
import { emit, finish } from './lib/emit.mjs';
import { staticSvg, SW } from './lib/static-svg.mjs';

// ---------- spring easing as CSS linear() (identical to the Kamui builder) ----------
function spring(z, T, n = 44) {
  const w = 4.6 / (z * T), wd = w * Math.sqrt(1 - z * z);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * T;
    const y = i === n ? 1 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
    pts.push(+y.toFixed(4));
  }
  return `linear(${pts.join(',')})`;
}
const K_SPRING = spring(0.66, 0.46); // ~6% overshoot: object poses
const K_SOFT = spring(0.9, 0.34);    // settle, no visible overshoot
const SW16 = 1.85;

const BASE_CSS = `
.mu-icon{--sw:${SW};--k-spring:${K_SPRING};--k-soft:${K_SOFT};--k-dur:.46s;flex:none;overflow:visible;fill:none;stroke:currentColor;stroke-width:var(--sw);stroke-linecap:round;stroke-linejoin:round}
.mu-icon *{transform-box:view-box}
.mu-icon .f{fill:var(--mu-duo-fill,currentColor);fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1) * var(--mu-duo-tint,1))}
.mu-icon .s{fill:currentColor;stroke:none}
.mu-icon .d{fill:var(--mu-duo-fill,currentColor);fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1) * var(--mu-duo-tint,1));stroke:none}
@media (prefers-reduced-motion:no-preference){
.mu-icon *{transition:transform var(--k-dur) var(--k-spring) var(--dl,0s),opacity .2s ease var(--dl,0s),d var(--k-dur) var(--k-spring) var(--dl,0s),stroke-dashoffset var(--k-dur) var(--k-spring) var(--dl,0s),fill-opacity .2s ease}
}`;

// ---------- selector expansion ----------
// @H  hover pose: the icon's trigger (any .mu-icon-trigger ancestor, e.g. a MetalUI Button) or the icon
//     itself; never on a static (animate={false}) icon
// @P  press one-shot: data-press on the icon, set by the React component on pointer/keyboard press
// &   the icon root
function expand(css, name, target) {
  const cls = `mu-ic-${name}`;
  const root = target === 'svg' ? 'svg.mu-icon' : `.mu-icon.${cls}`;
  const H = target === 'svg'
    ? 'svg.mu-icon:is(:hover,[data-state~="hover"])'
    : `:is(.mu-icon-trigger:is(:hover,[data-hover]) .${cls},.${cls}:is(:hover,[data-hover])):not([data-static])`;
  const P = target === 'svg' ? 'svg.mu-icon:is(:active,[data-state~="press"])' : `.mu-icon.${cls}[data-press]`;
  return css.replace(/@H/g, H).replace(/@P/g, P).replace(/&(?=[\s.{,:])/g, root).replace(/\s+/g, ' ');
}
function iconCss(ic, target) {
  const base = ic.base ? expand(ic.base, ic.name, target) : '';
  const mo = ic.mo ? expand(ic.mo, ic.name, target) : '';
  return `${base}\n@media (prefers-reduced-motion:no-preference){${mo}}`;
}

// ---------- storyboard (interface-craft) derived from the authored press track ----------
function pressTrack(ic) {
  const tracks = [];
  const mo = ic.mo || '';
  // "@P .a,@P .b{animation:name .34s curve both}" and optional "@P .n2{animation-delay:.06s}"
  for (const m of mo.matchAll(/((?:@P [^{]+?,?\s*)+)\{animation:([\w-]+) ([\d.]+)s/g)) {
    const parts = m[1].split(',').map((s) => s.replace('@P', '').trim()).filter(Boolean);
    for (const part of parts) tracks.push({ part, name: m[2], ms: Math.round(+m[3] * 1000), delay: 0 });
  }
  for (const m of mo.matchAll(/@P ([^{]+)\{animation-delay:([\d.]+)s\}/g)) {
    const t = tracks.find((x) => x.part === m[1].trim());
    if (t) t.delay = Math.round(+m[2] * 1000);
    else tracks.push({ part: m[1].trim(), name: '(inherits)', ms: tracks[0]?.ms ?? 0, delay: Math.round(+m[2] * 1000) });
  }
  const base = ic.base || '';
  for (const t of tracks) {
    const cls = t.part.replace(/^\./, '');
    const dl = base.match(new RegExp(`\\.${cls}\\{[^}]*--dl:([\\d.]+)s`));
    if (dl && !t.delay) t.delay = Math.round(+dl[1] * 1000);
  }
  return tracks;
}
function storyboard(ic, tracks) {
  const pad = (n) => String(n).padStart(4);
  const lines = tracks.map((t) => ` *  ${pad(t.delay)}ms   ${t.part} plays ${t.name} (${t.ms}ms)`);
  return `/* ─────────────────────────────────────────────────────────
 * ${ic.label.toUpperCase()} · ${ic.cat}
 *
 * HOVER pose (spring, reversible, interruptible)
 *          ${ic.hover}
 * PRESS one-shot (from the current pose)
 *          ${ic.press}
${lines.length ? lines.join('\n') : ' *          (no press track)'}
 * REDUCED MOTION   static glyph
 * ───────────────────────────────────────────────────────── */`;
}

function animatedSvg(ic) {
  const css = (BASE_CSS + '\n' + iconCss(ic, 'svg')).replace(/\n+/g, '\n');
  const id = `mu-${ic.name}`;
  const defs = ic.defs ? `<defs>${ic.defs.replace(/&-/g, id + '-')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mu-icon mu-ic-${ic.name}" width="24" height="24" viewBox="0 0 24 24">
<!-- MetalUI icon: ${ic.label}. Hover: ${ic.hover}. Press (:active or data-state="press"): ${ic.press}. Reduced motion: static. -->
<style>${css}</style>
${defs}${ic.body.replace(/&-/g, id + '-')}
</svg>\n`;
}

// ---------- outputs ----------
const pascal = (n) => n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const entries = ICONS.map((ic) => {
  const tracks = pressTrack(ic);
  const pressMs = tracks.reduce((m, t) => Math.max(m, t.delay + t.ms), 0);
  return { ic, tracks, pressMs, t16: T16[ic.name] };
});

const catalog = `// Generated by scripts/build-icons.mjs from icons/src/icons.mjs. Do not edit.
// Each entry opens with its motion storyboard; \`pressMs\` is the press track's full length (TIMING).
export interface IconRecord {
  label: string;
  category: 'Tools' | 'Actions' | 'Status';
  hover: string;
  press: string;
  /** Ms from press to the end of the longest press track. */
  pressMs: number;
  defs: string;
  body: string;
  /** Simplified geometry for 16px and below, when the master clogs. */
  body16?: string;
  sw16: number;
}

export const ICON_CATALOG = {
${entries.map(({ ic, tracks, pressMs, t16 }) => `${storyboard(ic, tracks).replace(/^/gm, '  ')}
  ${JSON.stringify(ic.name)}: {
    label: ${JSON.stringify(ic.label)},
    category: ${JSON.stringify(ic.cat)},
    hover: ${JSON.stringify(ic.hover)},
    press: ${JSON.stringify(ic.press)},
    pressMs: ${pressMs},
    defs: ${JSON.stringify(ic.defs || '')},
    body: ${JSON.stringify(ic.body)},${t16?.body ? `\n    body16: ${JSON.stringify(t16.body)},` : ''}
    sw16: ${t16?.sw ?? SW16},
  },`).join('\n')}
} satisfies Record<string, IconRecord>;

export type IconName = keyof typeof ICON_CATALOG;
export const ICON_NAMES = Object.keys(ICON_CATALOG) as IconName[];
`;
emit('packages/metalui/src/icons/catalog.generated.ts', catalog);

const iconsCss = `/* Generated by scripts/build-icons.mjs from icons/src/icons.mjs. Do not edit. */
${BASE_CSS.trim()}
${entries.map(({ ic }) => `/* ${ic.name} */\n${iconCss(ic, 'react')}`).join('\n')}
`;
emit('packages/metalui/src/icons/icons.generated.css', iconsCss);

const components = `// Generated by scripts/build-icons.mjs from icons/src/icons.mjs. Do not edit.
import { createIcon } from './Icon';

${entries.map(({ ic }) => `/** ${ic.label}. Hover: ${ic.hover}. Press: ${ic.press}. */\nexport const ${pascal(ic.name)}Icon = createIcon(${JSON.stringify(ic.name)}, ${JSON.stringify(`${pascal(ic.name)}Icon`)});`).join('\n')}
`;
emit('packages/metalui/src/icons/components.generated.tsx', components);

emit('packages/metalui/public/icons.json', JSON.stringify({
  $description: 'MetalUI icons: Soft Hardware monoline + duotone, 24×24 grid, stroke 1.7. Each icon has an authored hover pose and press one-shot.',
  count: ICONS.length,
  icons: entries.map(({ ic, pressMs, t16 }) => ({
    name: ic.name,
    component: `${pascal(ic.name)}Icon`,
    label: ic.label,
    category: ic.cat,
    hover: ic.hover,
    press: ic.press,
    pressMs,
    tuned16: Boolean(t16?.body),
    construction: ic.shape,
  })),
}, null, 2) + '\n');

for (const { ic, t16 } of entries) {
  emit(`packages/metalui/public/icons/svg/${ic.name}.svg`, staticSvg(ic));
  emit(`packages/metalui/public/icons/svg/16/${ic.name}.svg`, staticSvg(ic, t16?.sw ?? SW16, t16?.body ?? ic.body));
  emit(`packages/metalui/public/icons/svg-animated/${ic.name}.svg`, animatedSvg(ic));
}
finish(`icons (${ICONS.length})`);
