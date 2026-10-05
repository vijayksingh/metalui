import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Morph choreography as a person sees it (docs/reviews/morph-choreography.md): a part the next glyph
// lacks is moved, drawn out, gathered or hidden on the way, never switched off between two frames.

const captures = 'docs/captures/review/morph-polish';
test.beforeAll(() => mkdirSync(captures, { recursive: true }));

/** Wire ink (pixels at least half opaque, so a tint fill does not count) inside a region of the glyph,
 *  rasterised exactly as drawn, at 96px. x/y/w/h in 24-grid units. */
async function inkIn(glyph: Locator, region: { x: number; y: number; w: number; h: number }) {
  return glyph.evaluate(async (svg, r) => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', '96'); clone.setAttribute('height', '96');
    clone.style.color = '#000';
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((ok, fail) => { img.onload = () => ok(); img.onerror = () => fail(new Error('svg did not draw')); img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const k = 4;
    const data = ctx.getImageData(Math.round(r.x * k), Math.round(r.y * k), Math.round(r.w * k), Math.round(r.h * k)).data;
    let ink = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) ink++;
    return ink;
  }, region);
}

/** The ink in a region on every frame of a morph, under a paused clock that only this loop advances
 *  (one sample per 16ms), so rasterising a sample costs the spring no time. The page must have been
 *  opened with the fake clock installed. */
async function filmInk(page: Page, glyph: Locator, press: () => Promise<void>, region: { x: number; y: number; w: number; h: number }, ms = 320) {
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 10);
  await press();
  const frames: number[] = [];
  for (let t = 0; t <= ms; t += 16) {
    await page.clock.runFor(16);
    frames.push(await inkIn(glyph, region));
  }
  return frames;
}

test('removing from a count sinks the plus upright into its bar; it never vanishes between frames', async ({ page }) => {
  await page.clock.install();
  await page.goto('/icons/morph');
  const control = page.locator('[data-morph-control="count"]');
  const glyph = control.locator('svg[data-glyph]');
  await expect(glyph).toHaveAttribute('data-glyph', 'plus');
  // The upright's top half: above the crossbar, inside the tile.
  const top = { x: 10.6, y: 8, w: 2.8, h: 3 };
  const atPlus = await inkIn(glyph, top);
  expect(atPlus).toBeGreaterThan(8);
  const frames = await filmInk(page, glyph, () => control.click(), top);
  await expect(glyph).toHaveAttribute('data-glyph', 'minus');
  const atMinus = frames.at(-1)!;
  expect(atMinus).toBeLessThan(atPlus * 0.05);
  // It leaves gradually: some frames hold part of it, and no frame drops more than half of it at once.
  expect(frames.filter((ink) => ink > atPlus * 0.2 && ink < atPlus * 0.8).length).toBeGreaterThanOrEqual(2);
  let before = atPlus;
  for (const ink of frames) { expect(before - ink, `frames ${frames.map((f) => f.toFixed(0)).join(' ')}`).toBeLessThan(atPlus / 2); before = Math.min(before, ink); }
  await control.screenshot({ path: `${captures}/control-count-minus.png` });
});

test('adding grows the upright back out of the bar, and the sidebar marks bud from the rail', async ({ page }) => {
  await page.clock.install();
  await page.goto('/icons/morph');
  const count = page.locator('[data-morph-control="count"]');
  await count.click();
  await expect(count.locator('svg[data-glyph]')).toHaveAttribute('data-glyph', 'minus');
  await page.clock.runFor(600);
  const top = { x: 10.6, y: 8, w: 2.8, h: 3 };
  const grow = await filmInk(page, count.locator('svg[data-glyph]'), () => count.click(), top);
  const atPlus = grow.at(-1)!;
  expect(atPlus).toBeGreaterThan(8);
  // Nothing appears in one frame: the biggest single-frame gain is under half of the upright.
  let prev = 0;
  for (const ink of grow) { expect(ink - prev, `frames ${grow.map((f) => f.toFixed(0)).join(' ')}`).toBeLessThan(atPlus / 2); prev = Math.max(prev, ink); }

  // The sidebar's rail marks (left of the rail, inside the window) grow out of the rail when it expands.
  const panel = page.locator('[data-morph-control="panel"]');
  await panel.click(); // sidebar → sidebar-collapsed
  await expect(panel.locator('svg[data-glyph]')).toHaveAttribute('data-glyph', 'sidebar-collapsed');
  await page.clock.runFor(600);
  const marks = { x: 5, y: 8, w: 1.3, h: 8 };
  const expand = await filmInk(page, panel.locator('svg[data-glyph]'), () => panel.click(), marks);
  const atSidebar = expand.at(-1)!;
  expect(atSidebar).toBeGreaterThan(4);
  prev = 0;
  for (const ink of expand) { expect(ink - prev, `frames ${expand.map((f) => f.toFixed(0)).join(' ')}`).toBeLessThan(atSidebar / 2); prev = Math.max(prev, ink); }
});

test('the morph page films play → pause as the second stop sliding out from behind the triangle', async ({ page }) => {
  // The filmstrip prints the plan the transport control runs: its strain and its moves.
  await page.goto('/icons/morph');
  const row = page.locator('[data-md="row"]', { hasText: 'play → pause' });
  await row.scrollIntoViewIfNeeded();
  // A bud swelling from the triangle's edge scored 1.89; the stop emerging from behind it scores 1.31.
  await expect(row).toContainText(/strain 1\.[0-4]\d · carry · emerge/);
  await row.screenshot({ path: `${captures}/filmstrip-play-pause.png` });
});
