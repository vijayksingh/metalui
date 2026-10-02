import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Slider: a knob in a groove. The knob travels the groove minus itself, so at either end it sits
// flush inside the groove; the fill runs to the knob's centre, and marks and ticks share the same
// travel, so the knob, the fill's end and the matching tick line up at every value.

// The tuned slider (Tune it): 0 to 100, labelled ticks at every quarter, regular size by default.
const playground = (page: Page) => page.getByTestId('slider-tuner');
const knobInput = (page: Page) => playground(page).getByRole('slider').first();

/** The slider's geometry once it has come to rest. */
async function geometry(root: Locator) {
  const read = () => root.evaluate((el) => {
    const box = (q: string) => el.querySelector(q)!.getBoundingClientRect();
    const groove = box('.mu-slider-track');
    const knob = box('.mu-slider-knob');
    const fill = box('.mu-slider-fill');
    const ticks = [...el.querySelectorAll('.mu-slider-ticks > span')].map((t) => {
      const r = t.getBoundingClientRect();
      return r.left + r.width / 2;
    });
    return { groove: { left: groove.left, right: groove.right }, knob: { left: knob.left, right: knob.right, centre: knob.left + knob.width / 2 }, fillEnd: fill.right, ticks };
  });
  // at rest: a couple of frames for the change to land, then every running transition finished
  await root.evaluate(async (el) => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
  });
  await expect.poll(() => root.evaluate(el => {
    const groove = el.querySelector('.mu-slider-track')!.getBoundingClientRect();
    const knob = el.querySelector('.mu-slider-knob')!.getBoundingClientRect();
    const input = el.querySelector('input[aria-valuenow]')!;
    const fraction = (Number(input.getAttribute('aria-valuenow')) - Number(input.getAttribute('min'))) / (Number(input.getAttribute('max')) - Number(input.getAttribute('min')));
    return Math.abs(knob.left + knob.width / 2 - (groove.left + knob.width / 2 + fraction * (groove.width - knob.width)));
  })).toBeLessThan(.5);
  return read();
}

for (const colorway of COLORWAYS) {
  test(`the knob stays inside the groove and lines up with the fill and its tick in ${colorway}`, async ({ page }) => {
    if (colorway === 'graphite') await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/slider', colorway);
    const slider = playground(page).locator('.mu-slider').first();
    const input = knobInput(page);
    await input.focus();

    // At the ends: the knob's box is inside the groove's box, flush with the end.
    await page.keyboard.press('Home');
    await expect(input).toHaveAttribute('aria-valuenow', '0');
    let g = await geometry(slider);
    expect(g.knob.left).toBeGreaterThanOrEqual(g.groove.left - 0.5);
    expect(g.knob.left - g.groove.left).toBeLessThan(1);
    expect(Math.abs(g.knob.centre - g.fillEnd)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.knob.centre - g.ticks[0])).toBeLessThanOrEqual(1);

    await page.keyboard.press('End');
    await expect(input).toHaveAttribute('aria-valuenow', '100');
    g = await geometry(slider);
    expect(g.knob.right).toBeLessThanOrEqual(g.groove.right + 0.5);
    expect(g.groove.right - g.knob.right).toBeLessThan(1);
    expect(Math.abs(g.knob.centre - g.fillEnd)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.knob.centre - g.ticks.at(-1)!)).toBeLessThanOrEqual(1);

    // In between: each labelled tick sits where the knob's centre and the fill's end land.
    // (the tuned slider's ticks sit at every quarter: 0, 25, 50, 75, 100)
    await page.keyboard.press('Home');
    for (let i = 1; i < g.ticks.length - 1; i++) {
      for (let k = 0; k < 100 / (g.ticks.length - 1); k++) await page.keyboard.press('ArrowRight');
      await expect(input).toHaveAttribute('aria-valuenow', String((i * 100) / (g.ticks.length - 1)));
      const now = await geometry(slider);
      expect(Math.abs(now.knob.centre - now.fillEnd)).toBeLessThanOrEqual(1);
      expect(Math.abs(now.knob.centre - now.ticks[i])).toBeLessThanOrEqual(1);
    }
    await page.keyboard.press('End');
    await geometry(slider);
    await playground(page).screenshot({ path: capture(`slider-bounds-${colorway}`) });
  });
}

test('a jump to an end rides the spring but never carries the knob past the groove', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const slider = playground(page).locator('.mu-slider').first();
  await knobInput(page).focus();
  await page.keyboard.press('Home');
  await geometry(slider);
  const sampling = slider.evaluate(async (el) => {
    const out: { over: number; moving: boolean }[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => {
        const g = el.querySelector('.mu-slider-track')!.getBoundingClientRect();
        const k = el.querySelector('.mu-slider-knob')!.getBoundingClientRect();
        out.push({ over: k.right - g.right, moving: el.getAnimations({ subtree: true }).length > 0 });
        if (performance.now() - t0 < 900) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    });
    return out;
  });
  await page.keyboard.press('End');
  const frames = await sampling;
  expect(frames.some((f) => f.moving)).toBe(true); // it rode the spring
  expect(Math.max(...frames.map((f) => f.over))).toBeLessThanOrEqual(0.5); // and stopped flush
});

test('a drag keeps the knob centred under the pointer and inside the groove', async ({ page }) => {
  await open(page, '/components/slider', 'bone');
  const slider = playground(page).locator('.mu-slider').first();
  await slider.scrollIntoViewIfNeeded();
  const g0 = await geometry(slider);
  const knob = playground(page).locator('.mu-slider-knob').first();
  const box = (await knob.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Past the far end: the knob stops flush with the groove's end.
  await page.mouse.move(g0.groove.right + 60, box.y + box.height / 2, { steps: 8 });
  await expect(knobInput(page)).toHaveAttribute('aria-valuenow', '100');
  let g = await geometry(slider);
  expect(g.knob.right).toBeLessThanOrEqual(g.groove.right + 0.5);
  // Back to a point on the travel: the knob's centre is under the pointer.
  const x = g.groove.left + (g.groove.right - g.groove.left) * 0.4;
  await page.mouse.move(x, box.y + box.height / 2, { steps: 8 });
  g = await geometry(slider);
  // within half a step (a step is 1 of 100 on the travel)
  const halfStep = (g.groove.right - g.groove.left - (g.knob.right - g.knob.left)) / 100 / 2;
  expect(Math.abs(g.knob.centre - x)).toBeLessThanOrEqual(halfStep + 0.5);
  await page.mouse.up();
});

// ── Readable scale and contrast ─────────────────────────────────────────────
// Colours come from the page's computed styles (what a person sees), never from the tokens file.

/** Contrast of the tick labels against what they sit on, and of the fill against the groove: the
 *  worst pair among every colour each is painted with (its colour and its gradient's stops). */
async function contrasts(slider: Locator) {
  return slider.evaluate((el) => {
    const rgbs = (s: string) => [...s.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => m[1].split(/[ ,/]+/).filter(Boolean).map(Number)).filter((c) => (c[3] ?? 1) > 0.5);
    const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const worst = (a: number[][], b: number[][]) => Math.min(...a.flatMap((x) => b.map((y) => ratio(x, y))));
    /** The colours an element is painted with: its own, or the nearest painted ancestor's. */
    const paint = (from: Element | null): number[][] => {
      for (let e = from; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const own = [...rgbs(cs.backgroundColor), ...rgbs(cs.backgroundImage)];
        if (own.length) return own;
      }
      return [[255, 255, 255]];
    };
    const labels = [...el.querySelectorAll('.mu-slider-ticks > span')].map((t) => {
      const cs = getComputedStyle(t);
      return { size: parseFloat(cs.fontSize), family: cs.fontFamily, contrast: worst(rgbs(cs.color), paint(el.parentElement)) };
    });
    return { labels, fillVsGroove: worst(paint(el.querySelector('.mu-slider-fill')), paint(el.querySelector('.mu-slider-track'))) };
  });
}

for (const colorway of COLORWAYS) {
  test(`labels read clearly and the fill stands out from the groove in ${colorway}`, async ({ page }) => {
    await open(page, '/components/slider', colorway);
    const read = await contrasts(playground(page).locator('.mu-slider').first());
    expect(read.labels.length).toBeGreaterThan(0);
    for (const l of read.labels) {
      expect(l.size).toBeGreaterThanOrEqual(11); // the meta type, not the 9 px engraving
      expect(l.family).not.toMatch(/mono/i);
      expect(l.contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA for text
    }
    // The knob (its rim and shadow) carries the value; the fill backs it up, clearly apart from the
    // groove in both finishes (the old see-through green on bone was about 1.3:1).
    expect(read.fillVsGroove).toBeGreaterThanOrEqual(2);
    await playground(page).screenshot({ path: capture(`slider-scale-${colorway}`) });
  });
}
