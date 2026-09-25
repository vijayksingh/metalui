// The icon motion engine's CSS, shared by the build (scripts/build-icons.mjs) and the film tool
// (scripts/icon-film.mjs), so an icon filmed alone is the icon the build ships.
import { studyBaseCss, studyCss } from '../../packages/metalui/icons/src/motion.mjs';
import { SW } from './static-svg.mjs';

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
export function expand(css, name, target) {
  const cls = `mu-ic-${name}`;
  const root = target === 'svg' ? 'svg.mu-icon' : `.mu-icon.${cls}`;
  const H = target === 'svg'
    ? 'svg.mu-icon:is(:hover,[data-state~="hover"])'
    : `:is(.mu-icon-trigger:is(:hover,[data-hover]) .${cls},.${cls}:is(:hover,[data-hover])):not([data-static])`;
  const P = target === 'svg' ? 'svg.mu-icon:is(:active,[data-state~="press"])' : `.mu-icon.${cls}[data-press]`;
  return css.replace(/@H/g, H).replace(/@P/g, P).replace(/&(?=[\s.{,:])/g, root).replace(/\s+/g, ' ');
}
// An icon with a study plays one act on hover or focus. The CSS below is the player without
// script (standalone SVG); the React player marks the icon data-motion-runtime and runs the same
// keyframes through Web Animations, so the act finishes even if the pointer leaves.
function studyTrigger(name, target) {
  const cls = `mu-ic-${name}`;
  return target === 'svg'
    ? 'svg.mu-icon:is(:hover,:focus-visible,[data-state~="play"])'
    : `:is(.mu-icon-trigger:is(:hover,:focus-visible) .${cls},.${cls}:hover):not([data-static]):not([data-motion-runtime])`;
}
export function iconCss(ic, target) {
  if (ic.study) {
    const root = target === 'svg' ? 'svg.mu-icon' : `.mu-icon.${`mu-ic-${ic.name}`}`;
    const base = studyBaseCss(ic.study, root) + (ic.base ? expand(ic.base, ic.name, target) : '');
    return `${base}\n@media (prefers-reduced-motion:no-preference){${studyCss(ic.name, ic.study, studyTrigger(ic.name, target))}}`;
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

