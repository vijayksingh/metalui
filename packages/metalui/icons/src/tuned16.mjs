// 16px-tuned variants: simplified geometry and a heavier stroke (24-grid units).
// Only glyphs whose 24px drawing clogs at 16px get a bespoke body; the rest use the
// master geometry with stroke 1.85 (≈1.23px at 16px, 2.47 device px on Retina).
const C = 12, f = (n) => +n.toFixed(2);
function spiral(turns, r0, r1) {
  const Th = turns * 2 * Math.PI, endA = (-50 * Math.PI) / 180, a0 = endA - Th;
  let d = '';
  for (let i = 0; i <= 56; i++) { const t = i / 56, r = r0 + (r1 - r0) * t, a = a0 + Th * t; d += (i ? 'L' : 'M') + f(C + r * Math.cos(a)) + ' ' + f(C + r * Math.sin(a)); }
  const dA = endA + (44 * Math.PI) / 180;
  return { d, dot: [f(C + 8.2 * Math.cos(dA)), f(C + 8.2 * Math.sin(dA))] };
}
const S = spiral(1.28, 1.9, 8.2);
export const T16 = {
  'send-away': { sw: 1.9, body: `<path d="${S.d}"/><circle class="s" cx="${S.dot[0]}" cy="${S.dot[1]}" r="1.6"/>` },
  group: { sw: 1.9, body: `<path d="M3.5 12.2V6.3a1.9 1.9 0 0 1 1.9-1.9h3.1a1.6 1.6 0 0 1 1.2.53l1.2 1.37H12"/><path d="M8.2 11V8.6a1.8 1.8 0 0 1 1.8-1.8h6.6a1.8 1.8 0 0 1 1.8 1.8V11" transform="rotate(4 13 11)"/><path class="f" style="--duo:.16" d="M3.5 12.4h17v5.2a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z"/>` },
  tidy: { sw: 1.85, body: `<path d="M4.3 4v16"/><path d="M8.2 6.4h11.4" transform="translate(1.2 0) rotate(-4 8.2 6.4)"/><path d="M8.2 12h7.4" transform="translate(2.4 0) rotate(5 8.2 12)"/><path d="M8.2 17.6h9.6" transform="translate(.8 0) rotate(-3 8.2 17.6)"/>` },
  keeper: { sw: 1.9, body: `<defs><mask id="&-k" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><rect x="8.7" y="7.2" width="2.7" height="4.5" rx="1.35" fill="#000" stroke="none"/><rect x="12.6" y="7.2" width="2.7" height="4.5" rx="1.35" fill="#000" stroke="none"/><path d="M2.4 13a9.6 2.4 0 0 0 19.2 0" fill="none" stroke="#000" stroke-width="4.4" transform="rotate(-12 12 13)"/></mask></defs><circle class="s" mask="url(#&-k)" cx="12" cy="11.2" r="7"/><path d="M2.4 13a9.6 2.4 0 0 0 19.2 0" transform="rotate(-12 12 13)"/>` },
};
