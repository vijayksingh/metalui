// Icon acts → SwiftUI (MetalIconAct). The same studies the web plays (docs/ICON-MOTION.md), as
// data the Swift player draws and evaluates: each inked element with its part chain, and each
// part's keyframes per property with its easing curve. Geometry is the live bake (the static
// SVG with accents and part names kept), so a glyph at rest is the SVG export.
import { staticSvg, SW } from './static-svg.mjs';
import { parseSvg, I, mul, parseTransform, shapeData, transformData } from './svg-geometry.mjs';
import { parsePose } from '../../packages/metalui/icons/src/motion.mjs';

const INHERIT = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'opacity'];
const num = (v) => {
  const s = String(+(+v).toFixed(4));
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
};
const cmdsToD = (cmds) => cmds.map((c) => c[0] + c.slice(1).map((v) => +v.toFixed(4)).join(' ')).join('');
const isNone = (v) => v == null || v === 'none';
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

function ease(e) {
  if (!e || e === 'linear') return '.linear';
  const m = e.match(/cubic-bezier\(([^)]*)\)/);
  if (!m) throw new Error(`easing ${e}: only linear and cubic-bezier`);
  const [a, b, c, d] = m[1].split(',').map(Number);
  return `.init(${num(a)}, ${num(b)}, ${num(c)}, ${num(d)})`;
}

const hasPart = (n) => n.children.some((c) => c.attrs['data-part'] != null || hasPart(c));

/** Every inked element of the icon, in paint order, with the chain of parts that move it. */
function inks(ic, partIndex) {
  const svg = parseSvg(staticSvg(ic, SW, ic.body, { live: true }));
  if (ic.defs && /<(mask|clipPath)/.test(ic.defs)) throw new Error(`${ic.name}: masks and clips are not in the SwiftUI act player yet`);
  const out = [];
  (function walk(n, style, m, chain, opacity) {
    for (const c of n.children) {
      if (c.tag === 'defs' || c.tag === 'mask' || c.tag === 'clipPath' || c.tag === 'title') continue;
      const st = { ...style };
      for (const k of INHERIT) if (k !== 'opacity' && c.attrs[k] != null) st[k] = c.attrs[k];
      const part = c.attrs['data-part'];
      const own = part ? 1 : c.attrs.opacity != null ? +c.attrs.opacity : 1; // a part's opacity is its track's
      const local = parseTransform(c.attrs.transform);
      if (part && c.attrs.transform) throw new Error(`${ic.name}/${part}: a part carries no static transform (put it on a child)`);
      // Static transforms are baked into the geometry, so they must sit below every moving part.
      if (c.attrs.transform && hasPart(c)) throw new Error(`${ic.name}: a group with a static transform may not contain a moving part`);
      const nextChain = part ? [...chain, partIndex[part]] : chain;
      const cm = mul(m, local);
      if (c.tag === 'g') { walk(c, st, cm, nextChain, opacity * own); continue; }
      const d = shapeData(c);
      if (!d) continue;
      const stroke = isNone(st.stroke) ? 0 : +(st['stroke-width'] ?? SW) / SW;
      const fill = isNone(st.fill) ? '.none' : st['fill-opacity'] != null ? `.duotone(${num(st['fill-opacity'])})` : '.solid';
      out.push({ d: cmdsToD(transformData(d, cm)), chain: nextChain, stroke, fill, opacity: opacity * own });
    }
  })(svg, { fill: svg.attrs.fill, stroke: svg.attrs.stroke, 'stroke-width': svg.attrs['stroke-width'] }, I, [], 1);
  return out;
}

function part(t, duration) {
  const at = (f) => num(f.at / duration);
  const poses = t.frames.filter((f) => f.transform !== undefined).map((f) => {
    const p = parsePose(f.transform);
    return `.init(${at(f)}, x: ${num(p.x)}, y: ${num(p.y)}, r: ${num(p.r)}, sx: ${num(p.sx)}, sy: ${num(p.sy)}, ease: ${ease(f.easing)})`;
  });
  const values = (k, map = (v) => v) => t.frames.filter((f) => f[k] !== undefined).map((f) => `.init(${at(f)}, ${num(map(f[k]))}, ease: ${ease(f.easing)})`);
  const [ox, oy] = t.origin.split(' ').map(parseFloat);
  const list = (xs) => (xs.length ? `[\n                    ${xs.join(',\n                    ')},\n                ]` : '[]');
  return `            MetalIconActPart(
                name: "${t.part}", origin: CGPoint(x: ${num(ox)}, y: ${num(oy)}),
                poses: ${list(poses)},
                opacity: ${list(values('opacity'))},
                draw: ${list(values('draw'))}
            )`;
}

/** The Swift source for every icon with a study. */
export function iconActsSwift(icons) {
  const acts = icons.filter((ic) => ic.study).map((ic) => {
    const partIndex = Object.fromEntries(ic.study.tracks.map((t, i) => [t.part, i]));
    const ink = inks(ic, partIndex).map((k) =>
      `            MetalIconActInk(d: "${k.d}", parts: [${k.chain.join(', ')}], stroke: ${num(k.stroke)}, fill: ${k.fill}, opacity: ${num(k.opacity)})`);
    return `        .${camel(ic.name)}: MetalIconAct(
            duration: ${num(ic.study.duration / 1000)},
            caption: ${JSON.stringify(ic.study.caption)},
            parts: [
${ic.study.tracks.map((t) => part(t, ic.study.duration)).join(',\n')},
            ],
            ink: [
${ink.join(',\n')},
            ]
        )`;
  });
  return `// Generated by scripts/build-icons.mjs from icons/src/icons.mjs. Do not edit.
// Each icon's act (docs/ICON-MOTION.md): the parts that move, their keyframes per property,
// and the inked elements they carry. Played by MetalIconActView.
import CoreGraphics

extension MetalIconAct {
    static let all: [MetalIconName: MetalIconAct] = [
${acts.join(',\n')},
    ]
}
`;
}
