// PROPOSALS, not the set: two of the hardest icons redrawn, and a new wire keeper, under the construction grammar
// (docs/ICON-GRAMMAR.md). Same format as packages/metalui/icons/src/icons.mjs. Nothing here ships
// until the grammar and each proposal are approved; then icons are redrawn one at a time in icons.mjs.
//
//   node scripts/morph-strain.mjs --proposals docs/proposals/icon-grammar/icons.proposal.mjs
//
// Each proposal keeps the icon's meaning and its authored hover and press.
// A wire-grammar keeper: the face is a ring (the body), the eyes are two short wires (capsules at
// the set's weight), and the accretion ring is one open wire of 204° in front, casting one clearance.
const f = (n) => +n.toFixed(2);
function keeperRing() {
  const cx = 12, cy = 12.6, rx = 9.8, ry = 2.5, tilt = (-12 * Math.PI) / 180, N = 40;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = ((-12 + (204 * i) / N) * Math.PI) / 180;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    d += (i ? 'L' : 'M') + f(cx + x * Math.cos(tilt) - y * Math.sin(tilt)) + ' ' + f(cy + x * Math.sin(tilt) + y * Math.cos(tilt));
  }
  return d;
}
const RING = keeperRing();

export const PROPOSALS = [
  // Body: the flap (kept). Marks: two card tops standing in the pocket, staggered like the old fan.
  // The pocket is geometry now (the tops end a clearance above the flap), so there are no masks.
  { name: 'group', cat: 'Actions', label: 'Group · Stack', hover: 'cards rise and fan above the flap', press: 'cards drop into the folder',
    body: `<path class="k1" d="M4.6 9.7V8.7a1.7 1.7 0 0 1 1.7-1.7h2.6a1.7 1.7 0 0 1 1.7 1.7v1"/><path class="k2" d="M13 9.7V7.7a1.7 1.7 0 0 1 1.7-1.7h2.6a1.7 1.7 0 0 1 1.7 1.7v2"/><path class="ff f" style="--duo:.16" d="M3.5 11.6h17v6a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z"/>`,
    base: `& .k1{transform-origin:7.6px 11.6px} & .k2{transform-origin:16px 11.6px;--dl:.05s} & .ff{transform-origin:12px 20px}`,
    mo: `@H .k1{transform:translateY(-1.4px) rotate(-8deg)} @H .k2{transform:translateY(-1.8px) rotate(6deg)} @H .ff{transform:scaleY(.95)}
         @P .k1{animation:grp-p .44s cubic-bezier(.3,0,.2,1)} @P .k2{animation:grp-p2 .44s cubic-bezier(.3,0,.2,1)} @P .ff{animation:grp-f .44s cubic-bezier(.3,0,.2,1)}
         @keyframes grp-p{45%{transform:translateY(2.2px)}}
         @keyframes grp-p2{45%{transform:translateY(2.6px)}}
         @keyframes grp-f{45%{transform:scaleY(1)}70%{transform:scaleY(.97)}}`,
    shape: 'Frosted flap (body, 3.5–20.5 × 11.6–20.1) with two card tops standing in it: open wires that end one clearance above the flap. No masks.' },

  // Body: the tray, frosted like the flap it was. Marks: two small cards lifted clear of it, ±8°.
  { name: 'ungroup', cat: 'Actions', label: 'Ungroup', hover: 'cards spread wider', press: 'cards pop out and separate',
    body: `<rect class="k1 f" style="--duo:.1" x="4.6" y="3.4" width="5.8" height="7" rx="1.6" transform="rotate(-8 7.5 10.4)"/><rect class="k2 f" style="--duo:.1" x="13.6" y="3.4" width="5.8" height="7" rx="1.6" transform="rotate(8 16.5 10.4)"/><path class="ff f" style="--duo:.1" d="M3.5 12v5.1a2.5 2.5 0 0 0 2.5 2.5h12a2.5 2.5 0 0 0 2.5-2.5V12"/>`,
    base: `& .k1{transform-origin:7.5px 10.4px} & .k2{transform-origin:16.5px 10.4px;--dl:.05s}`,
    mo: `@H .k1{transform:translate(-.6px,-.8px) rotate(-5deg)} @H .k2{transform:translate(.6px,-.8px) rotate(5deg)}
         @P .k1{animation:ug-1 .4s cubic-bezier(.3,0,.2,1)} @P .k2{animation:ug-2 .4s cubic-bezier(.3,0,.2,1)}
         @keyframes ug-1{40%{transform:translate(.9px,1.4px) rotate(4deg)}}
         @keyframes ug-2{40%{transform:translate(-.9px,1.4px) rotate(-4deg)}}`,
    shape: 'Frosted tray (body, 3.5–20.5 × 12–19.6, the flap opened) with two small cards lifted clear of it at ±8°. No masks.' },

  // Keeper, in the wire grammar. The solid keeper stays out of the morph family (K0); this is a
  // new glyph so the character can rejoin it: a frosted ring face on the keyline, eye capsules as
  // two short wires, the ring in front with one clearance. Same blink, same tip.
  { name: 'keeper', cat: 'Status', label: 'Keeper', hover: 'blinks', press: 'ring tips, eyes look up',
    defs: `<mask id="&-k" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g class="rg"><path d="${RING}" fill="none" stroke="#000" stroke-width="4"/></g></mask>`,
    body: `<circle class="face f" style="--duo:.14" mask="url(#&-k)" cx="12" cy="11.4" r="7.2"/><g class="eyes"><path d="M10.1 8.6v2.4"/><path d="M13.9 8.6v2.4"/></g><g class="rg"><path d="${RING}"/></g>`,
    base: `& .eyes{transform-origin:12px 9.8px} & .rg{transform-origin:12px 12.6px}`,
    mo: `@H .eyes{animation:kp-b .32s cubic-bezier(.4,0,.2,1)}
         @P .rg{animation:kp-r .44s cubic-bezier(.3,0,.2,1)} @P .eyes{animation:kp-e .44s cubic-bezier(.3,0,.2,1)}
         @keyframes kp-b{45%{transform:scaleY(.12)}}
         @keyframes kp-r{40%{transform:rotate(-8deg)}}
         @keyframes kp-e{40%{transform:translateY(-.9px)}}`,
    shape: 'Frosted ring face r7.2 (body) with two eye capsules as 2.4u wires; one 204° ring wire in front cutting a clearance. Four parts, one clearance, no plate.' },
];

/** The pairs a product switches between, and the far pairs that were worst. */
export const PAIRS = [
  ['group', 'ungroup'], ['ungroup', 'group'], ['group', 'duplicate'], ['group', 'check'], ['ungroup', 'layout'], ['ungroup', 'duplicate'],
  ['keeper', 'synced'], ['synced', 'keeper'], ['keeper', 'offline'], ['keeper', 'check'],
];
