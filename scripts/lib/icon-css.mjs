// The icon motion engine's CSS, shared by the build (scripts/build-icons.mjs) and the film tool
// (scripts/icon-film.mjs), so an icon filmed alone is the icon the build ships.
import { studyBaseCss, studyCss } from '../../packages/metalui/icons/src/motion.mjs';
import { createRequire } from 'node:module';
import { SW } from './static-svg.mjs';
import { root as repo } from './emit.mjs';

const postcss = createRequire(repo('package.json'))('postcss');

// ---------- spring easing as CSS linear() (identical to the reference builder) ----------
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

export const BASE_CSS = `
.mu-icon{--sw:${SW};--k-spring:${K_SPRING};--k-soft:${K_SOFT};--k-dur:.46s;flex:none;overflow:visible;fill:none;stroke:currentColor;stroke-width:var(--sw);stroke-linecap:round;stroke-linejoin:round}
.mu-icon *{transform-box:view-box}
.mu-icon .f{fill:currentColor;fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1))}
.mu-icon .s{fill:currentColor;stroke:none}
.mu-icon .d{fill:currentColor;fill-opacity:calc(var(--duo,.14) * var(--mu-duo-k,1));stroke:none}
@media (prefers-reduced-motion:no-preference){
.mu-icon *{transition:transform var(--k-dur) var(--k-spring) var(--dl,0s),opacity .2s ease var(--dl,0s),d var(--k-dur) var(--k-spring) var(--dl,0s),stroke-dashoffset var(--k-dur) var(--k-spring) var(--dl,0s),fill-opacity .2s ease}
}`;

// ---------- selector expansion ----------
// @H  hover pose: the icon's trigger (any .mu-icon-trigger ancestor, e.g. a MetalUI Button) or the icon
//     itself; never on a static (animate={false}) icon
// @P  press one-shot: data-press on the icon, set by the React component on pointer/keyboard press
// &   the icon root
// A trigger is two selectors: what starts the motion on any device (focus, data-hover, data-state) and
// :hover, which only a fine pointer can do (docs/CSS_HABITS.md). A tap leaves :hover stuck on a touch screen.
export const MARK = '.mu-hover-mark';
const FINE = '@media (hover:hover) and (pointer:fine)';
// Each rule that names the trigger is written for the device-neutral trigger, then again for :hover
// inside the fine-pointer condition, right behind it so the cascade order is the authored one.
export function gateHover(css, { any, hover }) {
  if (!css.includes(MARK)) return css;
  return postcss.parse(css).nodes.map((node) => {
    if (node.type !== 'rule' || !node.selector.includes(MARK)) return node.toString();
    const parts = postcss.list.comma(node.selector), decls = node.nodes.map(String).join(';');
    const swap = (sel) => parts.filter((s) => sel === any || s.includes(MARK)).map((s) => s.split(MARK).join(sel)).join(',');
    return `${swap(any)}{${decls}}${FINE}{${swap(hover)}{${decls}}}`;
  }).join('');
}
const hoverTrigger = (name, target) => {
  const cls = `mu-ic-${name}`;
  return target === 'svg'
    ? { any: 'svg.mu-icon[data-state~="hover"]', hover: 'svg.mu-icon:hover' }
    : { any: `:is(.mu-icon-trigger[data-hover] .${cls},.${cls}[data-hover]):not([data-static])`, hover: `:is(.mu-icon-trigger:hover .${cls},.${cls}:hover):not([data-static])` };
};
export function expand(css, name, target) {
  const cls = `mu-ic-${name}`;
  const root = target === 'svg' ? 'svg.mu-icon' : `.mu-icon.${cls}`;
  const P = target === 'svg' ? 'svg.mu-icon:is(:active,[data-state~="press"])' : `.mu-icon.${cls}[data-press]`;
  const marked = css.replace(/@H/g, MARK).replace(/@P/g, P).replace(/&(?=[\s.{,:])/g, root).replace(/\s+/g, ' ');
  return gateHover(marked, hoverTrigger(name, target));
}
// An icon with a study plays one act on hover or focus. The CSS below is the player without
// script (standalone SVG); the React player marks the icon data-motion-runtime and runs the same
// keyframes through Web Animations, so the act finishes even if the pointer leaves.
function studyTrigger(name, target) {
  const cls = `mu-ic-${name}`;
  return target === 'svg'
    ? { any: 'svg.mu-icon:is(:focus-visible,[data-state~="play"])', hover: 'svg.mu-icon:hover' }
    : { any: `.mu-icon-trigger:focus-visible .${cls}:not([data-static]):not([data-motion-runtime])`, hover: `:is(.mu-icon-trigger:hover .${cls},.${cls}:hover):not([data-static]):not([data-motion-runtime])` };
}
export function iconCss(ic, target) {
  if (ic.study) {
    const root = target === 'svg' ? 'svg.mu-icon' : `.mu-icon.${`mu-ic-${ic.name}`}`;
    const base = studyBaseCss(ic.study, root) + (ic.base ? expand(ic.base, ic.name, target) : '');
    return `${base}\n@media (prefers-reduced-motion:no-preference){${gateHover(studyCss(ic.name, ic.study, MARK), studyTrigger(ic.name, target))}}`;
  }
  const base = ic.base ? expand(ic.base, ic.name, target) : '';
  const mo = ic.mo ? expand(ic.mo, ic.name, target) : '';
  return `${base}\n@media (prefers-reduced-motion:no-preference){${mo}}`;
}

export function animatedSvg(ic) {
  const css = (BASE_CSS + '\n' + iconCss(ic, 'svg')).replace(/\n+/g, '\n');
  const id = `mu-${ic.name}`;
  const defs = ic.defs ? `<defs>${ic.defs.replace(/&-/g, id + '-')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="mu-icon mu-ic-${ic.name}" width="24" height="24" viewBox="0 0 24 24">
<!-- MetalUI icon: ${ic.label}. Hover: ${ic.hover}. Press (:active or data-state="press"): ${ic.press}. Reduced motion: static. -->
<style>${css}</style>
${defs}${ic.body.replace(/&-/g, id + '-')}
</svg>\n`;
}

