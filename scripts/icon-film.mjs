// Film one icon's act without building the set: checks its study (the build's contract and the
// SwiftUI generator's), compiles it exactly as the build does, and writes a filmstrip per colorway:
// the act frozen at even steps (large), then at real size (24 and 16 px) through its beats.
//
//   node scripts/icon-film.mjs <name> [--out dir] [--times 0,120,…]
//
// Needs no dev server. docs/ICON-MOTION.md §Process step 4.
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateStudy } from '../packages/metalui/icons/src/motion.mjs';
import { iconActsSwift } from './lib/icon-acts-swift.mjs';
import { animatedSvg } from './lib/icon-css.mjs';

const name = process.argv[2];
process.env.MU_ICON_ACTS = name;
const { ICONS } = await import('../packages/metalui/icons/src/icons.mjs');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const out = resolve(arg('--out') ?? 'docs/captures/review');
const ic = ICONS.find((i) => i.name === name);
if (!ic) throw new Error(`no icon named ${name}`);
if (!ic.study) throw new Error(`${name} has no study yet (packages/metalui/icons/src/acts/${name}.mjs)`);
validateStudy(ic.name, ic.study, ic.body, ic.defs);
iconActsSwift([ic]); // throws when SwiftUI could not play it
const svg = animatedSvg(ic);
// The shipped rest glyph, first in the strip: an act must not change the icon at rest.
const shippedPath = `packages/metalui/public/icons/svg/${name}.svg`;
const shipped = existsSync(shippedPath) ? readFileSync(shippedPath, 'utf8') : '';
const d = ic.study.duration;
const times = arg('--times')?.split(',').map(Number) ?? Array.from({ length: 12 }, (_, i) => Math.round((d * i) / 11));

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 400 }, deviceScaleFactor: 2 });
for (const colorway of ['bone', 'graphite']) {
  const dark = colorway === 'graphite';
  await page.setContent(`<body style="margin:0;background:${dark ? '#161618' : '#f3f3f1'};color:${dark ? '#e6e6e3' : '#1d1d1f'};font:11px ui-monospace,monospace">
    <div id="film" style="display:inline-flex;flex-direction:column;gap:14px;padding:20px">
      <div>${ic.label} · ${d}ms · ${ic.study.stages.join(' → ')} — ${ic.study.caption}</div>
      <div id="big" style="display:flex;gap:12px"></div>
      <div id="small" style="display:flex;gap:12px;align-items:end"></div>
    </div></body>`);
  await page.evaluate(({ svg, times, shipped }) => {
    const add = (row, size, t) => {
      const cell = document.createElement('div');
      cell.style.cssText = 'display:grid;justify-items:center;gap:4px';
      cell.innerHTML = svg;
      const el = cell.querySelector('svg');
      el.setAttribute('width', size); el.setAttribute('height', size);
      if (size > 30) el.style.outline = '1px dashed rgba(127,127,127,.25)';
      el.setAttribute('data-state', 'play');
      if (size > 30) cell.append(Object.assign(document.createElement('span'), { textContent: `${t}ms` }));
      document.getElementById(row).append(cell);
      for (const a of el.getAnimations({ subtree: true })) {
        if (a instanceof CSSTransition) { a.finish(); continue; }
        a.pause(); a.currentTime = t;
      }
    };
    if (shipped) {
      const cell = document.createElement('div');
      cell.style.cssText = 'display:grid;justify-items:center;gap:4px';
      cell.innerHTML = shipped;
      const el = cell.querySelector('svg');
      el.setAttribute('width', 96); el.setAttribute('height', 96);
      el.style.outline = '1px solid rgba(127,127,127,.5)';
      cell.append(Object.assign(document.createElement('span'), { textContent: 'shipped' }));
      document.getElementById('big').append(cell);
    }
    for (const t of times) add('big', 96, t);
    for (const t of times) { add('small', 24, t); }
    for (const t of times) { add('small', 16, t); }
  }, { svg, times, shipped });
  const file = `${out}/${name}-${colorway}.png`;
  await page.locator('#film').screenshot({ path: file });
  console.log(file);
}
await browser.close();
