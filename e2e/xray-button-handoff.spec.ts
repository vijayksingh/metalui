import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the button on the table hands its config to its x-ray. What lands is the button
// itself (its label, cap and look), the model's face is that object to the pixel at the moment the
// copy hands over, and what you tune in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="button"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const pressOnTable = (page: Page) => page.locator('[data-float="button"] .mu-button').click({ force: true });
const modelFace = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-button');
const readout = (page: Page, label: string) => page.locator('.xr-overlay .xr-card .ed-readout').filter({ hasText: label });
const shown = (page: Page, label: string) => readout(page, label).locator('.ed-roll > span:not(.is-out)');

/** Holds the flight at the moment of handover: the copy has landed and is still whole, the model is in under it. */
async function holdHandover(page: Page) {
  await page.waitForSelector('.xr-flyer');
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => {
      const t = a.effect!.getComputedTiming();
      a.pause();
      if (t.duration === 1100) a.currentTime = 1100 * 0.88;
      else if (Number.isFinite(t.endTime)) a.currentTime = t.endTime as number;
    });
  });
}

/** The two stills, as a person sees them: the face with the copy gone, and the copy with the model's body gone. */
async function stills(page: Page) {
  const box = (await page.locator('.xr-flyer').boundingBox())!;
  const clip = { x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8 };
  await page.evaluate(() => { document.querySelector<HTMLElement>('.drift')!.style.visibility = 'hidden'; document.querySelector<HTMLElement>('.xr-flyer')!.style.visibility = 'hidden'; });
  const model = await page.screenshot({ clip });
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('.xr-flyer')!.style.visibility = '';
    document.querySelectorAll<HTMLElement>('.xr-overlay .xr-iso > :not(.xr-floor)').forEach((el) => { el.style.visibility = 'hidden'; });
  });
  const flyer = await page.screenshot({ clip });
  return { model, flyer, clip };
}

/** How far two stills are apart, measured in the page: the share of pixels that differ clearly, and the mean
 *  difference, as they are and at the best alignment within one device pixel. The copy is one flat layer
 *  that Chrome rasterises at its matrix's projected scale and resamples, so against the face (a plane in
 *  the model's own 3D context, rasterised at its full scale) it sits one device pixel lower and a touch
 *  softer; the same object, offset by the raster, not a different one. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const pa = px(ia), pb = px(ib), w = ia.width, h = ia.height;
    const at = (dx: number, dy: number) => {
      let off = 0, sum = 0, n = 0;
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4, j = ((y + dy) * w + x + dx) * 4;
        const d = Math.max(Math.abs(pa[i] - pb[j]), Math.abs(pa[i + 1] - pb[j + 1]), Math.abs(pa[i + 2] - pb[j + 2]));
        sum += d; n++; if (d > 40) off++;
      }
      return { off: off / n, mean: sum / n, dx, dy };
    };
    const asIs = at(0, 0);
    let best = asIs;
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) { const r = at(dx, dy); if (r.off < best.off) best = r; }
    return { asIs, best };
  }, [a.toString('base64'), b.toString('base64')]);
}

for (const colorway of COLORWAYS) {
  test(`the button lands on its own face, the same button, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await pressOnTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-button-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const { asIs, best } = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(asIs.off * 100).toFixed(2)}% of pixels differ, mean ${asIs.mean.toFixed(2)}/255; aligned by (${best.dx}, ${best.dy}) device px: ${(best.off * 100).toFixed(2)}%, mean ${best.mean.toFixed(2)}`);
    // measured: 2.2% and 2.9 as they are, 0.5% and 3.0 aligned; the hand-typeset face this replaced gave 25% and 10% in bone
    expect(asIs.off).toBeLessThan(0.03);
    expect(asIs.mean).toBeLessThan(4);
    expect(best.off).toBeLessThan(0.01);
    expect(Math.abs(best.dx) + Math.abs(best.dy)).toBeLessThanOrEqual(1);
    // the model's face is the button, the same label and cap, where the copy came down, edge for edge
    await expect(modelFace(page)).toHaveText('Get started');
    await expect(modelFace(page)).toHaveAttribute('data-cap', 'primary');
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-button')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-button')!);
      return Math.max(Math.abs(f.left - t.left), Math.abs(f.top - t.top), Math.abs(f.right - t.right), Math.abs(f.bottom - t.bottom));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('a tweak comes home with the object, and the x-ray starts from it next time', async ({ page }) => {
  await openOverview(page, 'bone');
  await pressOnTable(page);
  await settled(page);
  // the x-ray opens on the button as it ships: its padding sits on the recipe's token
  await expect(shown(page, 'padding')).toHaveText('15');
  await expect(page.locator('[data-float="button"] .mu-button')).not.toHaveAttribute('style', /--mu-r-button-self-pad/);
  // widen the padding on its readout: the model's face follows
  await readout(page, 'padding').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const value = await shown(page, 'padding').textContent();
  expect(value).not.toBe('15');
  await expect(modelFace(page)).toHaveAttribute('style', new RegExp(`--mu-r-button-self-pad:\\s*${value}px`));
  // home: the button on the table is what you left it, through the library's own variable
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(page.locator('[data-float="button"] .mu-button')).toHaveAttribute('style', new RegExp(`--mu-r-button-self-pad:\\s*${value}px`));
  await expect(page.locator('[data-float="button"] .mu-button')).toHaveText('Get started');
  // and it opens again from there
  await pressOnTable(page);
  await settled(page);
  await expect(shown(page, 'padding')).toHaveText(value!);
});

test('with reduced motion the button hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await pressOnTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelFace(page)).toHaveText('Get started');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Press"]').click();
  await readout(page, 'sinks').focus();
  await page.keyboard.press('ArrowUp');
  await expect(shown(page, 'sinks')).toHaveText('1.25');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-float="button"] .mu-button')).toHaveAttribute('style', /--mu-r-button-self-travel:\s*1\.25px/);
});
