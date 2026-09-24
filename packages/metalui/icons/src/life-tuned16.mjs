// 16px-tuned variants: heavier stroke and, where the 24px drawing clogs, simplified geometry.
// Default for every glyph at 16px: master geometry, stroke 1.85 (≈1.23pt, 2.47 device px on Retina).
// Entries here override { sw, body }.
import { GLYPHS } from './life.mjs';

export const T16 = {};

// Feelings: the pebble stays put, the trace grows 12% so it holds at 14–16px.
// Level glyphs (grateful, drained, overwhelmed) keep master geometry: their fill is clipped to the pebble.
const LEVEL = new Set(['grateful', 'drained', 'overwhelmed']);
for (const g of GLYPHS.filter((g) => g.cat === 'feelings' && !LEVEL.has(g.name))) {
  const m = g.body.match(/^(<circle class="v d"[^>]*\/>)([\s\S]*)$/);
  if (m) T16[g.name] = { sw: 1.72, body: `${m[1]}<g transform="matrix(1.12 0 0 1.12 -1.44 -1.44)">${m[2]}</g>` };
}

// Dinner: drop the inner plate ring; it fills in at 16px.
const dinner = GLYPHS.find((g) => g.name === 'dinner');
T16.dinner = { body: dinner.body.replace(/<circle cx="12" cy="12" r="2.1"[^>]*\/>/, '') };

const G = Object.fromEntries(GLYPHS.map((g) => [g.name, g]));
const S16 = 'matrix(1.12 0 0 1.12 -1.44 -1.44)';
const PEB = (b) => b.match(/^<circle class="v d"[^>]*\/>/)[0];

// Bug: two legs a side, no centre seam.
T16.bug = { body: G.bug.body.replace('<path d="M12 10.8v8.6" style="opacity:.5"/>', '').replace('M7.4 11.6 4.6 10.4M7.4 14.6H4.2M7.8 17.4l-2.6 1.6', 'M7.4 11.8 4.6 10.4M7.8 16.8l-2.8 1.8').replace('M16.6 11.6l2.8-1.2M16.6 14.6h3.2M16.2 17.4l2.6 1.6', 'M16.6 11.8l2.8-1.4M16.2 16.8l2.8 1.8') };
// Stressed: a two-turn coil instead of three.
T16.stressed = { sw: 1.72, body: `${PEB(G.stressed.body)}<g transform="${S16}"><path class="p1" d="M8.4 7.8h7.2"/><path class="p2" d="M8.4 16.2h7.2"/><path class="co" d="M12 7.8l-2.3 1.05 4.6 2.1-4.6 2.1 4.6 2.1-2.3 1.05"/></g>` };
// Overwhelmed: one choppy surface, no second wave.
T16.overwhelmed = { body: G.overwhelmed.body.replace(/<path d="[^"]*" style="opacity:\.5"\/>/, '') };
