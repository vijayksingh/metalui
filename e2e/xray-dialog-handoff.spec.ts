import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the dialog on the table hands its config to its x-ray. What lands is the dialog's plate
// itself (its title, field and actions, how it is tuned), the model's face is that object to the pixel
// at the moment the copy hands over, and what you tune in the x-ray is what the table shows when it
// comes home. A real dialog opens in a portal over the page, so the plate is the object on the table.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="dialog"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const table = (page: Page) => page.locator('[data-float="dialog"] .mu-dialog');
const pressOnTable = (page: Page) => table(page).click({ force: true });
const modelFace = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-dialog');
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
  // the plate casts a long shadow below it: the frame holds it
  const pad = 90;
  const clip = { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
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
 *  difference, as they are and at the best alignment within one device pixel (the copy is one flat layer
 *  rasterised at its projected scale; the face is a plane in the model's own 3D context). */
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
  test(`the dialog lands on its own plate, the same dialog, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await pressOnTable(page);
    await holdHandover(page);
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-dialog-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const { asIs, best } = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(asIs.off * 100).toFixed(2)}% of pixels differ, mean ${asIs.mean.toFixed(2)}/255; aligned by (${best.dx}, ${best.dy}) device px: ${(best.off * 100).toFixed(2)}%, mean ${best.mean.toFixed(2)}`);
    expect(asIs.off).toBeLessThan(0.03);
    expect(asIs.mean).toBeLessThan(4);
    expect(best.off).toBeLessThan(0.01);
    expect(Math.abs(best.dx) + Math.abs(best.dy)).toBeLessThanOrEqual(1);
    // the model's face is the plate: the same title, field and actions, where the copy came down, edge for edge
    await expect(modelFace(page).locator('.mu-dialog-title')).toHaveText('Rename canvas');
    await expect(modelFace(page).locator('input')).toHaveValue('Trip notes');
    await expect(modelFace(page).locator('.mu-dialog-actions .mu-button')).toHaveText(['Cancel', 'Rename']);
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-dialog')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-dialog')!);
      return Math.max(Math.abs(f.left - t.left), Math.abs(f.top - t.top), Math.abs(f.right - t.right), Math.abs(f.bottom - t.bottom));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('a tweak comes home with the object, and the x-ray starts from it next time', async ({ page }) => {
  await openOverview(page, 'bone');
  await pressOnTable(page);
  await settled(page);
  // the x-ray opens on the dialog as it ships: it sits where the recipe's token puts it
  await page.locator('.xr-overlay .xr-callout[aria-label^="Place"]').click();
  await expect(shown(page, 'From the top')).toHaveText('16');
  await expect(table(page)).not.toHaveAttribute('style', /--mu-r-dialog-self-top/);
  // move it down on its readout: the model's face follows, through the popup's own variable
  await readout(page, 'From the top').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const value = await shown(page, 'From the top').textContent();
  expect(value).not.toBe('16');
  await expect(modelFace(page)).toHaveAttribute('style', new RegExp(`--mu-r-dialog-self-top:\\s*${value}vh`));
  // home: the plate on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(table(page)).toHaveAttribute('style', new RegExp(`--mu-r-dialog-self-top:\\s*${value}vh`));
  await expect(table(page).locator('.mu-dialog-title')).toHaveText('Rename canvas');
  // and it opens again from there
  await pressOnTable(page);
  await settled(page);
  await page.locator('.xr-overlay .xr-callout[aria-label^="Place"]').click();
  await expect(shown(page, 'From the top')).toHaveText(value!);
});

test('with reduced motion the dialog hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await pressOnTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelFace(page).locator('.mu-dialog-title')).toHaveText('Rename canvas');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shadow"]').click();
  await readout(page, 'Height').focus();
  await page.keyboard.press('ArrowUp');
  await expect(shown(page, 'Height')).toHaveText('1.1');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // the plate's shadow stack is the surface recipe's, scaled to the height, on the plate's own variable
  await expect(table(page)).toHaveAttribute('style', /--mu-r-surface-self-plate-shadow:/);
});
