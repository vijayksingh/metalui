// MetalUI Soft Hardware icon set — source of truth (ported verbatim from the Kamui set, 2026-09-23).
// 24×24 grid, stroke 1.7 (var --sw), round caps/joins.
// Classes: .f = stroked + duotone fill, .s = solid fill, .d = duotone fill only (no stroke)
// CSS tokens:  &  -> icon root     @H -> hovered host     @P -> pressed host
// `base` = rest geometry/state, `mo` = motion (wrapped in reduced-motion guards by the builder)

const C = 12;
const f = (n) => +n.toFixed(2);

// ---- send-away spiral (Archimedean, grows clockwise; outer end top-right)
function spiral() {
  const turns = 1.62, r0 = 1.05, r1 = 8.5;
  const Th = turns * 2 * Math.PI;
  const endA = (-50 * Math.PI) / 180;
  const a0 = endA - Th;
  const N = 70;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = r0 + (r1 - r0) * Math.pow(t, 0.92);
    const a = a0 + Th * t;
    d += (i ? 'L' : 'M') + f(C + r * Math.cos(a)) + ' ' + f(C + r * Math.sin(a));
  }
  const dotA = endA + (38 * Math.PI) / 180, dotR = 8.35;
  return { d, dot: [f(C + dotR * Math.cos(dotA)), f(C + dotR * Math.sin(dotA))], dotA, dotR };
}
const SP = spiral();
const ux = Math.cos(SP.dotA), uy = Math.sin(SP.dotA);
const inward = (k) => `translate(${f(-ux * k)}px,${f(-uy * k)}px)`;

// shared lens for search / zoom
const LENS = `<circle class="lens" cx="10.6" cy="10.6" r="6.3"/><path class="hdl" d="M15.2 15.2 19.8 19.8"/>`;

export const ICONS = [
/* ============================== TOOLS ============================== */
{ name: 'select', cat: 'Tools', label: 'Select', hover: 'tilts onto its tip', press: 'clicks: tip dips, a ring leaves the point',
  body: `<g class="cur"><path class="f" d="M6.1 4.9 18.3 10.6a.5.5 0 0 1-.04.93L13 13.2l-2.2 5.1a.5.5 0 0 1-.93-.02L6.1 4.9Z"/></g><circle class="rip" cx="6.1" cy="4.9" r="3.2"/>`,
  base: `& .cur{transform-origin:6.1px 4.9px} & .rip{transform-origin:6.1px 4.9px;opacity:0;stroke-width:1.2}`,
  mo: `@H .cur{transform:rotate(-7deg) translate(.2px,.2px)}
       @P .cur{animation:sel-p .34s cubic-bezier(.3,0,.2,1)} @P .rip{animation:sel-r .44s cubic-bezier(.2,.7,.3,1)}
       @keyframes sel-p{35%{transform:rotate(-7deg) scale(.84)}}
       @keyframes sel-r{0%{opacity:.8;transform:scale(.2)}100%{opacity:0;transform:scale(1.15)}}`,
  shape: 'Arrow polygon, 4 vertices, round join; the two outer vertices get 0.5u radius arcs.' },

{ name: 'text', cat: 'Tools', label: 'Text', hover: 'glyph steps aside, caret appears and blinks', press: 'glyph stamps down',
  body: `<g class="tg"><path d="M6.2 7.3V6.4a1.2 1.2 0 0 1 1.2-1.2h9.2a1.2 1.2 0 0 1 1.2 1.2v.9"/><path d="M12 5.2v13.6M9.6 18.8h4.8"/></g><path class="car" d="M19.4 12.9v6.2"/>`,
  base: `& .tg{transform-origin:12px 18.8px} & .car{transform-origin:19.4px 19.1px;transform:scaleY(0);opacity:0}`,
  mo: `@H .tg{transform:translateX(-1.5px)} @H .car{transform:none;opacity:1;animation:txt-b 1.1s steps(1) .5s infinite}
       @P .tg{animation:txt-p .3s cubic-bezier(.3,0,.2,1)}
       @keyframes txt-b{50%{opacity:0}}
       @keyframes txt-p{40%{transform:translate(-1.5px,.9px) scaleY(.93)}}`,
  shape: 'T with soft 1.2u corner drops; caret is a separate 6.2u line.' },

{ name: 'note', cat: 'Tools', label: 'Note', hover: 'corner curls up', press: 'lines write themselves in',
  body: `<path class="nb" d="M20.5 14.2V7A3.5 3.5 0 0 0 17 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h7.2Z"/><path class="nf f" style="--duo:.2" d="M14.2 20.5v-3.9a2.4 2.4 0 0 1 2.4-2.4h3.9Z"/><path class="nl" pathLength="1" d="M7.6 8.6h8.8"/><path class="nl n2" pathLength="1" d="M7.6 12.2h4.8"/>`,
  base: `& .nl{stroke-dasharray:1 2}`,
  mo: `@H .nb{d:path("M20.5 12.3V7A3.5 3.5 0 0 0 17 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h5.3Z")}
       @H .nf{d:path("M12.3 20.5v-4.9a3.3 3.3 0 0 1 3.3-3.3h4.9Z");fill-opacity:.3}
       @P .nl{animation:note-w .36s cubic-bezier(.3,.1,.2,1) both} @P .n2{animation-delay:.06s}
       @keyframes note-w{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}`,
  shape: 'Rounded square r3.5 with a diagonal corner cut; curl = animatable cut size c (5.3 rest, 7.2 hover). SwiftUI Shape with animatableData = c.' },

{ name: 'image', cat: 'Tools', label: 'Image', hover: 'sun rises behind the ridge', press: 'frame breathes, sun flares',
  defs: `<clipPath id="&-in"><rect x="3.6" y="5.1" width="16.8" height="13.8" rx="2.6"/></clipPath><mask id="&-sky" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path d="M2 18.4 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0L22 17.8V24H2Z" fill="#000" stroke="#000" stroke-width="3.9" stroke-linejoin="round"/></mask>`,
  body: `<rect class="fr" x="2.8" y="4.3" width="18.4" height="15.4" rx="3.4"/><g clip-path="url(#&-in)"><g mask="url(#&-sky)"><circle class="sun s" cx="16.9" cy="11.9" r="1.85"/></g><path class="d" d="M2 18.4 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0L22 17.8V24H2Z"/></g><path class="rg" d="M3.4 17 8.4 12a1.3 1.3 0 0 1 1.84 0L14.3 16l2-1.9a1.3 1.3 0 0 1 1.8 0l2.6 2.5"/>`,
  base: `& .sun{transform-origin:16.9px 11.9px} & .fr{transform-origin:12px 12px}`,
  mo: `@H .sun{transform:translate(-.6px,-3.3px)}
       @P .fr{animation:img-f .36s cubic-bezier(.3,0,.2,1)} @P .sun{animation:img-s .4s cubic-bezier(.3,0,.2,1)}
       @keyframes img-f{40%{transform:scale(.94)}} @keyframes img-s{40%{transform:translate(-.6px,-3.3px) scale(1.3)}}`,
  shape: 'Landscape keyline. Sun is masked by the ridge (fill + 1u gap), so it can rise from behind it.' },

{ name: 'link', cat: 'Tools', label: 'Link', hover: 'links pull apart, bar thins', press: 'snap together',
  body: `<path class="la" d="M11.2 7.6l1.4-1.4a3.7 3.7 0 0 1 5.2 5.2l-1.4 1.4"/><path class="lb" d="M12.8 16.4l-1.4 1.4a3.7 3.7 0 0 1-5.2-5.2l1.4-1.4"/><path class="lbar" d="M9.8 14.2 14.2 9.8"/>`,
  base: `& .lbar{transform-origin:12px 12px}`,
  mo: `@H .la{transform:translate(.85px,-.85px)} @H .lb{transform:translate(-.85px,.85px)} @H .lbar{transform:scale(.62)}
       @P .la{animation:lk-a .34s cubic-bezier(.3,0,.2,1)} @P .lb{animation:lk-b .34s cubic-bezier(.3,0,.2,1)} @P .lbar{animation:lk-c .34s cubic-bezier(.3,0,.2,1)}
       @keyframes lk-a{45%{transform:translate(-.35px,.35px)}} @keyframes lk-b{45%{transform:translate(.35px,-.35px)}} @keyframes lk-c{45%{transform:scale(1.08)}}`,
  shape: 'Two open capsule halves on the 45° axis, radius 3.7, plus a bridging bar. Separation is one animatable scalar.' },

{ name: 'draw', cat: 'Tools', label: 'Draw', hover: 'tip slides and draws a stroke', press: 'taps the paper',
  body: `<path class="ln" pathLength="1" d="M5.6 17.45c1.05.7 2 .7 3 0"/><g class="pen"><g transform="translate(-1.6 .6) rotate(45 12 12)"><path class="f" style="--duo:.16" d="M9.4 14.4V5.8a2.6 2.6 0 0 1 5.2 0v8.6l-1.75 4a.9.9 0 0 1-1.7 0Z"/><path d="M9.4 8.2h5.2"/></g></g>`,
  base: `& .ln{stroke-dasharray:1 2;stroke-dashoffset:1} & .pen{transform-origin:5.6px 17.45px}`,
  mo: `@H .pen{offset-path:path("M0 0c1.05.7 2 .7 3 0");offset-distance:100%;offset-rotate:0deg;offset-anchor:0 0}
       & .pen{offset-path:path("M0 0c1.05.7 2 .7 3 0");offset-distance:0%;offset-rotate:0deg;offset-anchor:0 0;transition:offset-distance .46s var(--k-spring),transform .3s var(--k-soft)}
       @H .ln{stroke-dashoffset:0}
       @P .pen{animation:pen-p .32s cubic-bezier(.3,0,.2,1)}
       @keyframes pen-p{40%{transform:translate(-.5px,.7px) rotate(-4deg)}}`,
  shape: 'Pencil built upright (body w4.6, eraser band at y8) then rotated 45°. Stroke is revealed by trim in sync with the pencil travelling on the same curve.' },

{ name: 'layout', cat: 'Tools', label: 'Layout', hover: 'tiles swap sides', press: 'tiles settle together',
  body: `<rect class="lt f" style="--duo:.16" x="3.6" y="3.6" width="7" height="16.8" rx="2.4"/><rect class="l1" x="13.4" y="3.6" width="7" height="7" rx="2.4"/><rect class="l2" x="13.4" y="13.4" width="7" height="7" rx="2.4"/>`,
  base: `& .lt,& .l1,& .l2{transform-origin:12px 12px} & .l1{--dl:.04s} & .l2{--dl:.08s}`,
  mo: `@H .lt{transform:translateX(9.8px)} @H .l1{transform:translateX(-9.8px)} @H .l2{transform:translateX(-9.8px)}
       @P .lt{animation:lay-p .32s cubic-bezier(.3,0,.2,1)} @P .l1{animation:lay-p1 .32s cubic-bezier(.3,0,.2,1)} @P .l2{animation:lay-p1 .32s cubic-bezier(.3,0,.2,1)}
       @keyframes lay-p{45%{transform:translateX(9.8px) scale(.9)}} @keyframes lay-p1{45%{transform:translateX(-9.8px) scale(.9)}}`,
  shape: 'One tall + two square tiles, radius 2.4, 2.8u gutter.' },

{ name: 'tidy', cat: 'Tools', label: 'Tidy', hover: 'loose tiles snap to the guide', press: 'guide pulses, tiles click home',
  body: `<path class="g" d="M4.3 3.8v16.4"/><rect class="t1 f" x="7.2" y="4.4" width="12.6" height="4" rx="2"/><rect class="t2 f" x="7.2" y="10" width="8.6" height="4" rx="2"/><rect class="t3 f" x="7.2" y="15.6" width="11" height="4" rx="2"/>`,
  base: `& .t1{transform-origin:7.2px 6.4px;transform:translateX(1.6px) rotate(-5deg)} & .t2{transform-origin:7.2px 12px;transform:translateX(2.8px) rotate(5deg);--dl:.04s} & .t3{transform-origin:7.2px 17.6px;transform:translateX(.9px) rotate(-3deg);--dl:.08s} & .g{transform-origin:4.3px 12px}`,
  mo: `@H .t1,@H .t2,@H .t3{transform:none}
       @P .g{animation:tdy-g .34s cubic-bezier(.3,0,.2,1)} @P .t1,@P .t2,@P .t3{animation:tdy-t .3s cubic-bezier(.3,0,.2,1)}
       @keyframes tdy-g{40%{transform:scaleY(1.1)}} @keyframes tdy-t{40%{transform:translateX(-.7px)}}`,
  shape: 'Guide + three pills (h4, r2). Rest pose is deliberately loose (≤5°), hover = aligned. Native: offsets/rotations are animatable per pill.' },

{ name: 'search', cat: 'Tools', label: 'Search', hover: 'lens sweeps, glint crosses glass', press: 'lens focuses',
  body: `<g class="sg">${LENS}<path class="gl" d="M7.6 9.1a3.4 3.4 0 0 1 1.6-1.6"/></g>`,
  base: `& .sg{transform-origin:19.8px 19.8px} & .gl{opacity:0;stroke-width:1.35;transform-origin:10.6px 10.6px;transform:rotate(-40deg)} & .lens{transform-origin:10.6px 10.6px}`,
  mo: `@H .sg{transform:rotate(-11deg)} @H .gl{opacity:.7;transform:rotate(18deg)}
       @P .lens{animation:srch-p .34s cubic-bezier(.3,0,.2,1)}
       @keyframes srch-p{40%{transform:scale(1.1)}}`,
  shape: 'Circle keyline lens r6.3; handle 45°. Glint = 50° arc r3.4 inside.' },

{ name: 'zoom-in', cat: 'Tools', label: 'Zoom In', hover: 'plus turns a quarter', press: 'lens swells',
  body: `<g class="sg">${LENS}<path class="pm" d="M8.2 10.6h4.8M10.6 8.2v4.8"/></g>`,
  base: `& .sg,& .pm{transform-origin:10.6px 10.6px}`,
  mo: `@H .pm{transform:rotate(90deg)} @H .sg{transform:scale(1.04)}
       @P .sg{animation:zi-p .34s cubic-bezier(.3,0,.2,1)} @keyframes zi-p{40%{transform:scale(1.14)}}`,
  shape: 'Search lens + plus (4.8u arms).' },

{ name: 'zoom-out', cat: 'Tools', label: 'Zoom Out', hover: 'minus narrows, lens recedes', press: 'lens shrinks',
  body: `<g class="sg">${LENS}<path class="pm" d="M8.2 10.6h4.8"/></g>`,
  base: `& .sg,& .pm{transform-origin:10.6px 10.6px}`,
  mo: `@H .pm{transform:scaleX(.7)} @H .sg{transform:scale(.96)}
       @P .sg{animation:zo-p .34s cubic-bezier(.3,0,.2,1)} @keyframes zo-p{40%{transform:scale(.86)}}`,
  shape: 'Search lens + minus.' },

{ name: 'fit', cat: 'Tools', label: 'Fit', hover: 'content grows to the frame', press: 'corners clamp',
  body: `<path class="c1" d="M3.8 8.6V6.4a2.6 2.6 0 0 1 2.6-2.6h2.2"/><path class="c2" d="M15.4 3.8h2.2a2.6 2.6 0 0 1 2.6 2.6v2.2"/><path class="c3" d="M20.2 15.4v2.2a2.6 2.6 0 0 1-2.6 2.6h-2.2"/><path class="c4" d="M8.6 20.2H6.4a2.6 2.6 0 0 1-2.6-2.6v-2.2"/><rect class="in f" style="--duo:.18" x="9" y="9" width="6" height="6" rx="1.7"/>`,
  base: `& .in{transform-origin:12px 12px}`,
  mo: `@H .in{transform:scale(1.42)} @H .c1{transform:translate(.5px,.5px)} @H .c2{transform:translate(-.5px,.5px)} @H .c3{transform:translate(-.5px,-.5px)} @H .c4{transform:translate(.5px,-.5px)}
       @P .c1{animation:fit-1 .3s cubic-bezier(.3,0,.2,1)} @P .c2{animation:fit-2 .3s cubic-bezier(.3,0,.2,1)} @P .c3{animation:fit-3 .3s cubic-bezier(.3,0,.2,1)} @P .c4{animation:fit-4 .3s cubic-bezier(.3,0,.2,1)}
       @keyframes fit-1{40%{transform:translate(1.2px,1.2px)}} @keyframes fit-2{40%{transform:translate(-1.2px,1.2px)}} @keyframes fit-3{40%{transform:translate(-1.2px,-1.2px)}} @keyframes fit-4{40%{transform:translate(1.2px,-1.2px)}}`,
  shape: 'Four r2.6 corner brackets on the square keyline + 6u rounded square.' },

/* ============================== ACTIONS ============================== */
{ name: 'duplicate', cat: 'Actions', label: 'Duplicate', hover: 'copy slides off the original', press: 'copy stamps back and out',
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><rect class="fm" x="7" y="7" width="15" height="15" rx="4.4" fill="#000" stroke="none"/></mask>`,
  body: `<rect class="bk" mask="url(#&-m)" x="3.5" y="3.5" width="12" height="12" rx="3"/><g class="fg"><rect class="f" style="--duo:.16" x="8.5" y="8.5" width="12" height="12" rx="3"/><path d="M14.5 12.3v4.4M12.3 14.5h4.4"/></g>`,
  mo: `@H .fg,@H .fm{transform:translate(.8px,.8px)} @H .bk{transform:translate(-.6px,-.6px)}
       @P .fg,@P .fm{animation:dup-p .38s cubic-bezier(.3,0,.2,1)}
       @keyframes dup-p{40%{transform:translate(-1.3px,-1.3px)}}`,
  shape: 'Two 12u squares r3, offset 5u; the back one is masked by the front + 1.5u gap (so no outline crosses the copy).' },

{ name: 'send-away', cat: 'Actions', label: 'Delete · Send away', hover: 'well turns, dot is drawn in', press: 'dot is pulled into the centre and vanishes',
  body: `<path class="sp" d="${SP.d}"/><g class="orb"><g class="rad"><circle class="dot s" cx="${SP.dot[0]}" cy="${SP.dot[1]}" r="1.4"/></g></g>`,
  base: `& .sp,& .orb{transform-origin:12px 12px} & .dot{transform-origin:${SP.dot[0]}px ${SP.dot[1]}px} & .orb{--dl:.03s} & .rad{--dl:.03s}`,
  mo: `@H .sp{transform:rotate(42deg)} @H .orb{transform:rotate(36deg)} @H .rad{transform:${inward(1.5)}}
       @P .sp{animation:sa-sp .46s cubic-bezier(.35,0,.15,1)} @P .orb{animation:sa-orb .46s cubic-bezier(.4,0,.2,1)} @P .rad{animation:sa-rad .46s cubic-bezier(.4,0,.2,1)} @P .dot{animation:sa-dot .46s cubic-bezier(.4,0,.2,1)}
       @keyframes sa-sp{to{transform:rotate(400deg)}}
       @keyframes sa-orb{70%{transform:rotate(300deg)}71%{transform:rotate(36deg)}}
       @keyframes sa-rad{70%{transform:${inward(8.35)}}71%{transform:${inward(1.5)}}}
       @keyframes sa-dot{60%{transform:scale(.55);opacity:1}70%{transform:scale(0);opacity:0}78%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}`,
  shape: 'Archimedean spiral r = 1.05→8.5 over 1.62 turns, clockwise, outer end at −50°. Dot r1.4 at 38° ahead of the end on r8.35. Native: Shape with animatable phase; dot position is polar (θ, r).' },

{ name: 'trash', cat: 'Actions', label: 'Delete · Trash', hover: 'lid lifts on its hinge', press: 'lid closes with a small settle',
  body: `<g class="lid"><path d="M4.4 7h15.2"/><path d="M9.4 7V5.6a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4V7"/></g><path class="f" style="--duo:.12" d="M6.2 7h11.6l-.86 11.1a2.3 2.3 0 0 1-2.3 2.1H9.36a2.3 2.3 0 0 1-2.3-2.1Z"/><path d="M10.2 10.6v5.8M13.8 10.6v5.8"/>`,
  base: `& .lid{transform-origin:4.4px 7px}`,
  mo: `@H .lid{transform:translateY(-.9px) rotate(-9deg)}
       @P .lid{animation:tr-p .38s cubic-bezier(.3,0,.2,1)}
       @keyframes tr-p{35%{transform:translateY(.25px) rotate(1deg)}60%{transform:translateY(-.3px) rotate(-2deg)}}`,
  shape: 'Portrait keyline bin, tapered 0.9u each side, lid hinged at the left end.' },

{ name: 'group', cat: 'Actions', label: 'Group · Stack', hover: 'cards rise and fan above the flap', press: 'cards drop into the folder',
  defs: `<mask id="&-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path d="M1 11.2h22V24H1Z" fill="#000" stroke="none"/></mask><mask id="&-b" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g fill="#000" stroke="#000" stroke-width="3.3"><rect class="c1" x="5.6" y="6.4" width="8.2" height="10" rx="1.7"/><rect class="c2" x="10.2" y="7.4" width="8.2" height="10" rx="1.7"/></g></mask><mask id="&-c" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><rect class="c2" x="10.2" y="7.4" width="8.2" height="10" rx="1.7" fill="#000" stroke="#000" stroke-width="3.3"/></mask>`,
  body: `<path mask="url(#&-b)" d="M3.5 12.4V6.3a1.9 1.9 0 0 1 1.9-1.9h3.1a1.6 1.6 0 0 1 1.2.53l1.2 1.37h7.7a1.9 1.9 0 0 1 1.9 1.9v4.2"/><g mask="url(#&-m)"><g mask="url(#&-c)"><rect class="c1" x="5.6" y="6.4" width="8.2" height="10" rx="1.7"/></g><rect class="c2 f" style="--duo:.14" x="10.2" y="7.4" width="8.2" height="10" rx="1.7"/></g><path class="ff f" style="--duo:.16" d="M3.5 12.2h17v5.4a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5Z"/>`,
  base: `& .c1{transform-origin:9.7px 16.4px;transform:rotate(-8deg)} & .c2{transform-origin:14.3px 17.4px;transform:rotate(5deg);--dl:.05s} & .ff{transform-origin:12px 20px}`,
  mo: `@H .c1{transform:translate(-.3px,-1.5px) rotate(-13deg)} @H .c2{transform:translate(.3px,-1.9px) rotate(9deg)} @H .ff{transform:scaleY(.95)}
       @P .c1{animation:grp-p .44s cubic-bezier(.3,0,.2,1)} @P .c2{animation:grp-p2 .44s cubic-bezier(.3,0,.2,1)} @P .ff{animation:grp-f .44s cubic-bezier(.3,0,.2,1)}
       @keyframes grp-p{45%{transform:translateY(4.8px) rotate(-3deg)}}
       @keyframes grp-p2{45%{transform:translateY(4.8px) rotate(2deg)}}
       @keyframes grp-f{45%{transform:scaleY(1)}70%{transform:scaleY(.97)}}`,
  shape: 'Folder back (tab left) knocked out around two fanned cards (−8° / +5°); the front card knocks out the back card; both clipped 1u above the flap. Frosted flap = duotone 16%. Mirrors the Softness Folder component.' },

{ name: 'ungroup', cat: 'Actions', label: 'Ungroup', hover: 'cards spread wider', press: 'cards pop out and separate',
  body: `<rect class="u1 f" style="--duo:.1" x="3.2" y="3.4" width="8" height="9.4" rx="1.6"/><rect class="u2 f" style="--duo:.1" x="12.8" y="3.4" width="8" height="9.4" rx="1.6"/><path class="ff" d="M3.5 15.2v2.4a2.5 2.5 0 0 0 2.5 2.5h12a2.5 2.5 0 0 0 2.5-2.5v-2.4"/>`,
  base: `& .u1{transform-origin:7.2px 12.8px;transform:rotate(-6deg)} & .u2{transform-origin:16.8px 12.8px;transform:rotate(6deg);--dl:.05s}`,
  mo: `@H .u1{transform:translate(-.5px,-.9px) rotate(-11deg)} @H .u2{transform:translate(.5px,-.9px) rotate(11deg)}
       @P .u1{animation:ug-1 .4s cubic-bezier(.3,0,.2,1)} @P .u2{animation:ug-2 .4s cubic-bezier(.3,0,.2,1)}
       @keyframes ug-1{40%{transform:translate(.9px,1.4px) rotate(-2deg)}}
       @keyframes ug-2{40%{transform:translate(-.9px,1.4px) rotate(2deg)}}`,
  shape: 'Open tray (flap only) with two cards lifted out, ±6° at rest.' },

{ name: 'pin', cat: 'Actions', label: 'Pin', hover: 'pin lifts, its contact shadow fades', press: 'pushes in',
  body: `<g class="pn"><path class="f" style="--duo:.16" d="M8.8 3.8h6.4M9.9 3.8v4.9L7.2 12a.7.7 0 0 0 .54 1.14h8.52a.7.7 0 0 0 .54-1.14L14.1 8.7V3.8"/><path d="M12 13.2v6.4"/></g><path class="sh" d="M10.6 20.8h2.8"/>`,
  base: `& .pn{transform-origin:12px 19.6px} & .sh{opacity:.35;transform-origin:12px 20.8px}`,
  mo: `@H .pn{transform:translateY(-1.3px) rotate(8deg)} @H .sh{opacity:.12;transform:scaleX(.6)}
       @P .pn{animation:pin-p .34s cubic-bezier(.3,0,.2,1)} @P .sh{animation:pin-s .34s cubic-bezier(.3,0,.2,1)}
       @keyframes pin-p{40%{transform:translateY(.7px)}} @keyframes pin-s{40%{opacity:.5;transform:scaleX(1.25)}}`,
  shape: 'Pushpin: 5.2u cap, collar, flared base, needle. Contact line under the needle.' },

{ name: 'board', cat: 'Actions', label: 'Board', hover: 'ribbon lengthens', press: 'drops into place',
  body: `<path class="bm f" style="--duo:.16" d="M6.8 19.8V5.9a2.1 2.1 0 0 1 2.1-2.1h6.2a2.1 2.1 0 0 1 2.1 2.1v13.9l-4.3-3a1.6 1.6 0 0 0-1.8 0Z"/>`,
  base: `& .bm{transform-origin:12px 4px}`,
  mo: `@H .bm{d:path("M6.8 20.8V5.9a2.1 2.1 0 0 1 2.1-2.1h6.2a2.1 2.1 0 0 1 2.1 2.1v14.9l-4.3-3.4a1.6 1.6 0 0 0-1.8 0Z")}
       @P .bm{animation:bd-p .38s cubic-bezier(.3,0,.2,1)}
       @keyframes bd-p{0%{transform:translateY(-1.6px)}55%{transform:translateY(.35px)}}`,
  shape: 'Portrait ribbon, notch depth animatable (3.0 → 3.4) with the tail length.' },

{ name: 'share', cat: 'Actions', label: 'Share · Export', hover: 'arrow lifts out of the tray', press: 'arrow leaves, a new one rises',
  body: `<path class="tray" d="M8.4 9.6H7.4A2.4 2.4 0 0 0 5 12v5.6a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4V12a2.4 2.4 0 0 0-2.4-2.4h-1"/><g class="ar"><path d="M12 14.2V3.9M8.9 7 12 3.9 15.1 7"/></g>`,
  mo: `@H .ar{transform:translateY(-.9px)}
       @P .ar{animation:sh-p .42s cubic-bezier(.3,0,.2,1)}
       @keyframes sh-p{40%{transform:translateY(-5px);opacity:0}41%{transform:translateY(2.5px);opacity:0}100%{opacity:1}}`,
  shape: 'Open tray (r2.4) with a 10u arrow.' },

{ name: 'undo', cat: 'Actions', label: 'Undo', hover: 'head reaches back', press: 'arrow arcs back and returns',
  body: `<g class="ug"><path class="uh" d="M9 5.3 5.3 9 9 12.7"/><path class="us" d="M5.3 9h9.3a4.6 4.6 0 0 1 0 9.2h-4"/></g>`,
  base: `& .ug{transform-origin:14.6px 13.6px}`,
  mo: `@H .uh{transform:translateX(-.9px)} @H .us{d:path("M4.4 9h10.2a4.6 4.6 0 0 1 0 9.2h-4")}
       @P .ug{animation:un-p .42s cubic-bezier(.3,0,.2,1)} @keyframes un-p{40%{transform:rotate(-26deg)}}`,
  shape: 'Hook arrow, arc r4.6. Rotation pivot = arc centre (14.6, 13.6).' },

{ name: 'redo', cat: 'Actions', label: 'Redo', hover: 'head reaches forward', press: 'arrow arcs forward and returns',
  body: `<g transform="matrix(-1 0 0 1 24 0)"><g class="ug"><path class="uh" d="M9 5.3 5.3 9 9 12.7"/><path class="us" d="M5.3 9h9.3a4.6 4.6 0 0 1 0 9.2h-4"/></g></g>`,
  base: `& .ug{transform-origin:14.6px 13.6px}`,
  mo: `@H .uh{transform:translateX(-.9px)} @H .us{d:path("M4.4 9h10.2a4.6 4.6 0 0 1 0 9.2h-4")}
       @P .ug{animation:rd-p .42s cubic-bezier(.3,0,.2,1)} @keyframes rd-p{40%{transform:rotate(-26deg)}}`,
  shape: 'Undo mirrored on x.' },

{ name: 'more', cat: 'Actions', label: 'More', hover: 'dots swell in sequence', press: 'dots gather and part',
  body: `<circle class="m1 s" cx="5.6" cy="12" r="1.55"/><circle class="m2 s" cx="12" cy="12" r="1.55"/><circle class="m3 s" cx="18.4" cy="12" r="1.55"/>`,
  base: `& .m1{transform-origin:5.6px 12px} & .m2{transform-origin:12px 12px;--dl:.04s} & .m3{transform-origin:18.4px 12px;--dl:.08s}`,
  mo: `@H .m1,@H .m2,@H .m3{transform:scale(1.22)}
       @P .m1{animation:mo-1 .34s cubic-bezier(.3,0,.2,1)} @P .m3{animation:mo-3 .34s cubic-bezier(.3,0,.2,1)}
       @keyframes mo-1{40%{transform:translateX(2.4px) scale(1.1)}} @keyframes mo-3{40%{transform:translateX(-2.4px) scale(1.1)}}`,
  shape: 'Three r1.55 dots on 6.4u pitch.' },

{ name: 'close', cat: 'Actions', label: 'Close', hover: 'turns a quarter and softens', press: 'pinches closed',
  body: `<path class="x" d="M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6"/>`,
  base: `& .x{transform-origin:12px 12px}`,
  mo: `@H .x{transform:rotate(90deg) scale(.9)}
       @P .x{animation:cl-p .3s cubic-bezier(.3,0,.2,1)} @keyframes cl-p{40%{transform:rotate(90deg) scale(.68)}}`,
  shape: 'X on the circle keyline, arms 13.6u.' },

{ name: 'check', cat: 'Actions', label: 'Check', hover: 'tick lifts', press: 'tick redraws',
  body: `<path class="tk" pathLength="1" d="M5.4 12.6l4.1 4.1 9.1-9.4"/>`,
  base: `& .tk{stroke-dasharray:1 2;transform-origin:9.5px 16.7px}`,
  mo: `@H .tk{transform:translateY(-.5px) rotate(-4deg)}
       @P .tk{animation:ck-p .3s cubic-bezier(.3,.1,.2,1) both}
       @keyframes ck-p{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}`,
  shape: 'Tick 4.1 / 9.1 legs; draw with trim(0→1), 220ms after a 40ms delay (matches checkbox spec).' },

/* ============================== STATUS ============================== */
{ name: 'synced', cat: 'Status', label: 'Synced', hover: 'satellite advances along its orbit', press: 'orbit completes a full turn',
  body: `<circle class="core s" cx="12" cy="12" r="2.1"/><g class="or"><circle class="ring" cx="12" cy="12" r="7.6" pathLength="100" transform="rotate(-18 12 12)"/><circle class="sat s" cx="17.37" cy="6.63" r="1.75"/></g>`,
  base: `& .or,& .core{transform-origin:12px 12px} & .ring{stroke-dasharray:85 15}`,
  mo: `@H .or{transform:rotate(120deg)} @H .core{transform:scale(1.12)}
       @P .or{animation:syn-p .46s cubic-bezier(.4,0,.2,1)} @keyframes syn-p{to{transform:rotate(480deg)}}`,
  shape: 'Core r2.1, orbit r7.6 with a 63° gap centred on the satellite (r1.75, 12 o’clock). Native: rotate the orbit group; SF Symbol can use .symbolEffect(.rotate) on macOS 15+ or a custom rotation.' },

{ name: 'offline', cat: 'Status', label: 'Offline', hover: 'satellite drifts further out', press: 'tries to return, drifts away',
  body: `<circle class="core s" cx="12" cy="12" r="2.1" style="opacity:.55"/><circle class="ring" cx="12" cy="12" r="7.6" pathLength="100" transform="rotate(-3 12 12)"/><circle class="sat s" cx="19" cy="5" r="1.6"/>`,
  base: `& .ring{stroke-dasharray:76 24} & .sat{transform-origin:19px 5px}`,
  mo: `@H .sat{transform:translate(.9px,-.5px)}
       @P .sat{animation:off-p .46s cubic-bezier(.3,0,.2,1)} @keyframes off-p{35%{transform:translate(-1.5px,1.3px)}}`,
  shape: 'Same orbit, 94° gap; satellite has left the ring (r≈9.6).' },

{ name: 'sync-error', cat: 'Status', label: 'Sync Error', hover: 'mark nudges', press: 'orbit shivers once',
  body: `<g class="or"><circle class="ring" cx="12" cy="12" r="7.6" pathLength="100" transform="rotate(-18 12 12)"/></g><path class="ex" d="M12 8.6v4.2"/><circle class="exd s" cx="12" cy="15.7" r="1.05"/>`,
  base: `& .or{transform-origin:12px 12px} & .ring{stroke-dasharray:85 15}`,
  mo: `@H .ex{transform:translateY(-.4px)}
       @P .or{animation:err-p .42s cubic-bezier(.3,0,.2,1)} @keyframes err-p{20%{transform:rotate(-7deg)}45%{transform:rotate(5deg)}70%{transform:rotate(-2deg)}}`,
  shape: 'Orbit with the same gap as Synced, core replaced by "!".' },

{ name: 'capture', cat: 'Status', label: 'Capture', hover: 'viewfinder focuses in', press: 'shutter blinks',
  body: `<path class="c1" d="M3.8 8.4V7A3.2 3.2 0 0 1 7 3.8h1.4"/><path class="c2" d="M15.6 3.8H17A3.2 3.2 0 0 1 20.2 7v1.4"/><path class="c3" d="M20.2 15.6V17a3.2 3.2 0 0 1-3.2 3.2h-1.4"/><path class="c4" d="M8.4 20.2H7A3.2 3.2 0 0 1 3.8 17v-1.4"/><circle class="ap f" style="--duo:.16" cx="12" cy="12" r="3.6"/>`,
  base: `& .ap{transform-origin:12px 12px}`,
  mo: `@H .c1{transform:translate(.8px,.8px)} @H .c2{transform:translate(-.8px,.8px)} @H .c3{transform:translate(-.8px,-.8px)} @H .c4{transform:translate(.8px,-.8px)} @H .ap{transform:scale(.86)}
       @P .ap{animation:cap-p .34s cubic-bezier(.3,0,.2,1)} @keyframes cap-p{35%{transform:scale(.5);fill-opacity:.55}}`,
  shape: 'Four r3.2 corners (softer than Fit) + aperture circle r3.6.' },

{ name: 'paste', cat: 'Status', label: 'Paste', hover: 'clip lifts', press: 'contents land on the board',
  body: `<path class="f" style="--duo:.1" d="M8.6 5.2H7.4A2.4 2.4 0 0 0 5 7.6v10.6a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4V7.6a2.4 2.4 0 0 0-2.4-2.4h-1.2"/><rect class="clip" x="8.6" y="3.4" width="6.8" height="3.6" rx="1.3"/><path class="pl" pathLength="1" d="M8.6 11.8h6.8"/><path class="pl p2" pathLength="1" d="M8.6 15.4h4.2"/>`,
  base: `& .pl{stroke-dasharray:1 2} & .clip{transform-origin:12px 7px}`,
  mo: `@H .clip{transform:translateY(-.7px)}
       @P .pl{animation:ps-p .34s cubic-bezier(.3,.1,.2,1) both} @P .p2{animation-delay:.06s}
       @keyframes ps-p{0%{stroke-dashoffset:-1;opacity:0}30%{opacity:1}100%{stroke-dashoffset:0}}`,
  shape: 'Portrait clipboard r2.4, clip r1.3, two content lines.' },

{ name: 'keeper', cat: 'Status', label: 'Keeper', hover: 'blinks', press: 'ring tips, eyes look up',
  defs: `<mask id="&-k" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><g class="eyes"><rect x="8.9" y="7.5" width="2.4" height="4.2" rx="1.2" fill="#000" stroke="none"/><rect x="12.7" y="7.5" width="2.4" height="4.2" rx="1.2" fill="#000" stroke="none"/></g><g class="rg"><path d="M2.2 12.8a9.8 2.5 0 0 0 19.6 0" fill="none" stroke="#000" stroke-width="4" transform="rotate(-12 12 12.8)"/></g></mask><mask id="&-kb" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><circle cx="12" cy="11.4" r="8" fill="#000" stroke="none"/></mask>`,
  body: `<g mask="url(#&-kb)"><g class="rg"><path d="M2.2 12.8a9.8 2.5 0 0 1 19.6 0" transform="rotate(-12 12 12.8)" style="stroke-width:calc(var(--sw) * .88)"/></g></g><circle class="s" mask="url(#&-k)" cx="12" cy="11.4" r="6.8"/><g class="rg"><path d="M2.2 12.8a9.8 2.5 0 0 0 19.6 0" transform="rotate(-12 12 12.8)" style="stroke-width:calc(var(--sw) * .88)"/></g>`,
  base: `& .eyes{transform-origin:12px 9.6px} & .rg{transform-origin:12px 12.8px}`,
  mo: `@H .eyes{animation:kp-b .32s cubic-bezier(.4,0,.2,1)}
       @P .rg{animation:kp-r .44s cubic-bezier(.3,0,.2,1)} @P .eyes{animation:kp-e .44s cubic-bezier(.3,0,.2,1)}
       @keyframes kp-b{45%{transform:scaleY(.12)}}
       @keyframes kp-r{40%{transform:rotate(-8deg)}}
       @keyframes kp-e{40%{transform:translateY(-.9px)}}`,
  shape: 'The buddy as a glyph: solid body r6.8 with eye capsules knocked out (2.4×4.2), accretion ring rx9.8 ry2.5 tilted −12°; the front arc knocks a 1.1u gap into the body, the back arc hides behind it.' },

// A tile with a plus: the new-block cap. Body: the tile. Marks: the two arms.
{ name: 'plus', cat: 'Actions', label: 'New', hover: 'the plus turns a quarter', press: 'the tile presses in',
  body: `<rect class="pt f" style="--duo:.12" x="4.5" y="4.5" width="15" height="15" rx="3.5"/><path class="pa" d="M8.8 12h6.4"/><path class="pa" d="M12 8.8v6.4"/>`,
  base: `& .pa{transform-origin:12px 12px} & .pt{transform-origin:12px 12px}`,
  mo: `@H .pa{transform:rotate(90deg)}
       @P .pt{animation:pl-p .3s cubic-bezier(.3,0,.2,1)} @keyframes pl-p{40%{transform:scale(.92)}}`,
  shape: 'Tile 15 × 15 r3.5, tinted .12; plus arms 6.4 on the centre.' },

// A region: a drawn frame whose head carries its name. Body: the frame. Marks: the head rule, the name.
{ name: 'region', cat: 'Tools', label: 'Region', hover: 'the name writes across the head', press: 'the frame settles',
  body: `<rect class="rb f" style="--duo:.08" x="3.5" y="5" width="17" height="14" rx="3.5"/><path d="M3.5 9.6h17"/><path class="rn" d="M6.8 7.3h3.6"/>`,
  base: `& .rn{transform-origin:6.8px 7.3px} & .rb{transform-origin:12px 12px}`,
  mo: `@H .rn{transform:scaleX(2.1)}
       @P .rb{animation:rg-p .34s cubic-bezier(.3,0,.2,1)} @keyframes rg-p{40%{transform:scale(.95)}}`,
  shape: 'Frame 17 × 14 r3.5, tinted .08; head rule on the 9.6 line; the name a 3.6 wire in the head.' },

// A task: the dimple with its tick. Body: the dimple. Mark: the tick (the check glyph's, smaller).
{ name: 'task', cat: 'Tools', label: 'Task', hover: 'the tick lifts', press: 'the tick redraws',
  body: `<rect class="tb f" style="--duo:.12" x="5" y="5" width="14" height="14" rx="3.5"/><path class="tk" pathLength="1" d="M8.7 12.2l2.3 2.3 4.4-4.9"/>`,
  base: `& .tk{stroke-dasharray:1 2;transform-origin:11px 14.5px}`,
  mo: `@H .tk{transform:translateY(-.5px) rotate(-4deg)}
       @P .tk{animation:tk-p .3s cubic-bezier(.3,.1,.2,1) both} @keyframes tk-p{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}`,
  shape: 'Dimple 14 × 14 r3.5, tinted .12; the tick draws with trim(0→1).' },

// A tag: the price tag with its eyelet. Body: the tag. Mark: the eyelet, a bead.
{ name: 'tag', cat: 'Tools', label: 'Tag', hover: 'the tag swings on its eyelet', press: 'the tag stamps',
  body: `<g class="tg"><path class="f" style="--duo:.12" d="M10.2 5h7.6a2.2 2.2 0 0 1 2.2 2.2v9.6a2.2 2.2 0 0 1-2.2 2.2h-7.6a2.2 2.2 0 0 1-1.7-.8L4.6 13.4a2.2 2.2 0 0 1 0-2.8l3.9-4.8a2.2 2.2 0 0 1 1.7-.8Z"/><circle class="s" cx="9.4" cy="12" r="1.3"/></g>`,
  base: `& .tg{transform-origin:9.4px 12px}`,
  mo: `@H .tg{transform:rotate(-9deg)}
       @P .tg{animation:tg-p .34s cubic-bezier(.3,0,.2,1)} @keyframes tg-p{40%{transform:scale(.93)}}`,
  shape: 'Tag 15.4 × 14 with a rounded point, tinted .12; eyelet bead 2.6 on the centre line.' },

// A calendar: the page with its binding. Body: the page. Marks: the header rule and the two rings.
{ name: 'calendar', cat: 'Tools', label: 'Calendar', hover: 'the rings lift', press: 'the page turns in',
  body: `<rect class="cb f" style="--duo:.08" x="3.5" y="5.2" width="17" height="15" rx="3.2"/><path d="M3.5 10h17"/><path class="cr" d="M8.2 3.4v3.4M15.8 3.4v3.4"/>`,
  base: `& .cb{transform-origin:12px 20.2px}`,
  mo: `@H .cr{transform:translateY(-.9px)}
       @P .cb{animation:cl-p .34s cubic-bezier(.3,0,.2,1)} @keyframes cl-p{40%{transform:scaleY(.94)}}`,
  shape: 'Page 17 × 15 r3.2, tinted .08; header rule on the 10 line; binding rings at the 8 and 16 detents.' },
];
