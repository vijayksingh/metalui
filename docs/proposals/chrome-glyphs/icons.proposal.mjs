// PROPOSALS: the medium's chrome glyphs (Kamui 05 §8, import plan §3.7), drawn in the kit under the
// construction grammar (docs/ICON-GRAMMAR.md K1–K10). Same format as packages/metalui/icons/src/icons.mjs.
// write → text, ink → draw and lens → search already exist; these nine are new. Each lands in icons.mjs
// one per commit once it passes the lint and its strain budget.
//
//   node scripts/icon-lint.mjs --proposals docs/proposals/chrome-glyphs/icons.proposal.mjs
//   node scripts/morph-strain.mjs --proposals docs/proposals/chrome-glyphs/icons.proposal.mjs --out docs/proposals/chrome-glyphs
//
// Every glyph: one tinted body on the keyline (a frosted object) or one ring, one to three marks on the
// body's line, at the centre or at a detent; hover is one gesture the object would make, press one
// one-shot from the current pose.
const E = 'cubic-bezier(.3,0,.2,1)';

export const PROPOSALS = [
  // A tile with a plus: the new-block cap. Body: the tile. Marks: the two arms.
  { name: 'plus', cat: 'Actions', label: 'New', hover: 'the plus turns a quarter', press: 'the tile presses in',
    body: `<rect class="pt f" style="--duo:.12" x="4.5" y="4.5" width="15" height="15" rx="3.5"/><path class="pa" d="M8.8 12h6.4"/><path class="pa" d="M12 8.8v6.4"/>`,
    base: `& .pa{transform-origin:12px 12px} & .pt{transform-origin:12px 12px}`,
    mo: `@H .pa{transform:rotate(90deg)}
         @P .pt{animation:pl-p .3s ${E}} @keyframes pl-p{40%{transform:scale(.92)}}`,
    shape: 'Tile 15 × 15 r3.5, tinted .12; plus arms 6.4 on the centre.' },

  // A region: a drawn frame whose head carries its name. Body: the frame. Marks: the head rule, the name.
  { name: 'region', cat: 'Tools', label: 'Region', hover: 'the name writes across the head', press: 'the frame settles',
    body: `<rect class="rb f" style="--duo:.08" x="3.5" y="5" width="17" height="14" rx="3.5"/><path d="M3.5 9.6h17"/><path class="rn" d="M6.8 7.3h3.6"/>`,
    base: `& .rn{transform-origin:6.8px 7.3px} & .rb{transform-origin:12px 12px}`,
    mo: `@H .rn{transform:scaleX(2.1)}
         @P .rb{animation:rg-p .34s ${E}} @keyframes rg-p{40%{transform:scale(.95)}}`,
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
         @P .tg{animation:tg-p .34s ${E}} @keyframes tg-p{40%{transform:scale(.93)}}`,
    shape: 'Tag 15.4 × 14 with a rounded point, tinted .12; eyelet bead 2.6 on the centre line.' },

  // A calendar: the page with its binding. Body: the page. Marks: the header rule and the two rings.
  { name: 'calendar', cat: 'Tools', label: 'Calendar', hover: 'the rings lift', press: 'the page turns in',
    body: `<rect class="cb f" style="--duo:.08" x="3.5" y="5.2" width="17" height="15" rx="3.2"/><path d="M3.5 10h17"/><path class="cr" d="M8.2 3.4v3.4M15.8 3.4v3.4"/>`,
    base: `& .cb{transform-origin:12px 20.2px}`,
    mo: `@H .cr{transform:translateY(-.9px)}
         @P .cb{animation:cl-p .34s ${E}} @keyframes cl-p{40%{transform:scaleY(.94)}}`,
    shape: 'Page 17 × 15 r3.2, tinted .08; header rule on the 10 line; binding rings at the 8 and 16 detents.' },

  // A document: the page with a folded corner. Body: the page. Marks: two lines of text.
  { name: 'document', cat: 'Tools', label: 'Document', hover: 'the second line writes on', press: 'the lines redraw',
    body: `<path class="f" style="--duo:.1" d="M7.2 3.5h6.4l5 5v10a2 2 0 0 1-2 2H7.2a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path class="dl" pathLength="1" d="M8.6 12.4h6.8"/><path class="dl d2" pathLength="1" d="M8.6 15.8h4"/>`,
    base: `& .dl{stroke-dasharray:1 2} & .d2{transform-origin:8.6px 15.8px}`,
    mo: `@H .d2{transform:scaleX(1.7)}
         @P .dl{animation:dc-p .36s cubic-bezier(.3,.1,.2,1) both} @P .d2{animation-delay:.06s}
         @keyframes dc-p{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}`,
    shape: 'Page 13.4 × 17 with a 5-unit fold, tinted .1; lines 6.8 and 4 on the 12.4 and 15.8 lines.' },

  // A clock: the face and its hands. Body: the face ring. Mark: the hands, one wire.
  { name: 'clock', cat: 'Status', label: 'Time', hover: 'the minute hand sweeps on', press: 'the face ticks',
    body: `<path class="f" style="--duo:.08" d="M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 1 1 0-17Z"/><path class="hd" d="M12 7.4V12l3.2 2"/>`,
    base: `& .hd{transform-origin:12px 12px}`,
    mo: `@H .hd{transform:rotate(60deg)}
         @P .hd{animation:ck2-p .34s ${E}} @keyframes ck2-p{40%{transform:rotate(18deg)}}`,
    shape: 'Face r8.5, tinted .08; hands 4.6 and 3.8 about the centre.' },

  // Me: the trend over your own days. Body: the screen. Marks: the trace and its last point.
  { name: 'me', cat: 'Tools', label: 'Me', hover: 'the trend redraws to its last point', press: 'the last point pulses',
    body: `<rect class="f" style="--duo:.08" x="4" y="4" width="16" height="16" rx="3.5"/><path class="tr" pathLength="1" d="M7.2 15.2l2.8-3.2 2.6 2 3.4-4.2"/><circle class="lp s" cx="16" cy="9.8" r="1.2"/>`,
    base: `& .tr{stroke-dasharray:1 2} & .lp{transform-origin:16px 9.8px}`,
    mo: `@H .tr{animation:me-h .5s cubic-bezier(.3,.1,.2,1) both} @keyframes me-h{0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}}
         @P .lp{animation:me-p .3s ${E}} @keyframes me-p{40%{transform:scale(1.5)}}`,
    shape: 'Screen 16 × 16 r3.5, tinted .08; trend of three segments ending in a 2.4 bead.' },

  // Seed: a sample day planted on an empty canvas. Body: the seed. Mark: the sprout and its leaf.
  { name: 'seed', cat: 'Actions', label: 'Seed sample', hover: 'the sprout grows', press: 'the seed settles',
    body: `<path class="sd f" style="--duo:.14" d="M12 7a5.6 6.6 0 1 1 0 13.2 5.6 6.6 0 1 1 0-13.2Z"/><path class="sp" d="M12 4.4V7"/><path class="sp f" style="--duo:.2" d="M15.4 3.2c-.3 1.5-1.6 2.2-3.4 2 .5-1.5 1.8-2.2 3.4-2Z"/>`,
    base: `& .sp{transform-origin:12px 7px} & .sd{transform-origin:12px 20.2px}`,
    mo: `@H .sp{transform:scale(1.25) rotate(6deg)}
         @P .sd{animation:sd-p .34s ${E}} @keyframes sd-p{40%{transform:scaleY(.94)}}`,
    shape: 'Seed 11.2 × 13.2, tinted .14; sprout stem 2.6 and a tinted leaf from its top.' },
];

// Pairs a product switches between, or that sit side by side in the medium's strip and palette.
export const PAIRS = [
  ['task', 'check'], ['plus', 'close'], ['region', 'select'], ['clock', 'synced'], ['document', 'note'],
  ['calendar', 'document'], ['me', 'search'], ['tag', 'text'], ['seed', 'plus'],
];
