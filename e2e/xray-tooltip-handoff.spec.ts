import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the tooltip on the table hands its config to its x-ray. What lands is the label as it
// is (its words, the key shown, the side it keeps), the model's face is that chip to the pixel at the
// moment the copy hands over, and what you set in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="tooltip"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const tableChip = (page: Page) => page.locator('[data-float="tooltip"] .mu-tooltip');
const openFromTable = (page: Page) => tableChip(page).click({ force: true });
const modelChip = (page: Page) => page.locator('.xr-overlay .xr-segface.is-tip .mu-tooltip');

/** Holds the flight at the moment of handover: the copy has landed and is still whole, the model is in under it. */
async function holdHandover(page: Page) {
  await page.waitForSelector('.xr-flyer');
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => {
      const t = a.effect!.getComputedTiming();
      a.pause();
      if (t.duration === 1100) a.currentTime = 1100 * 0.88;
      else if (Number.isFinite(t.endTime)) a.currentTime = t.endTime as number;
      else a.currentTime = 0;
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

/** How far two stills are apart, measured in the page: the share of pixels that differ clearly, and the mean difference. */
async function compare(page: Page, a: Buffer, b: Buffer) {
  return page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (im: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d')!; g.drawImage(im, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const pa = px(ia), pb = px(ib);
    let off = 0, sum = 0; const n = ia.width * ia.height;
    for (let i = 0; i < n * 4; i += 4) {
      const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]));
      sum += d; if (d > 40) off++;
    }
    return { off: off / n, mean: sum / n };
  }, [a.toString('base64'), b.toString('base64')]);
}

/** The copy and the face, edge for edge: the chip and the key in it. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const f = r(document.querySelector('.xr-flyer .mu-tooltip')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-tip .mu-tooltip')!);
  const fk = document.querySelector('.xr-flyer .mu-tooltip-key'), tk = document.querySelector('.xr-overlay .xr-segface.is-tip .mu-tooltip-key');
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  return Math.max(edges(f, t), fk && tk ? edges(r(fk), r(tk)) : 0);
});

for (const colorway of COLORWAYS) {
  test(`the tooltip lands on its own face, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-tooltip-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the words and the key, and its face is where the copy came down, edge for edge
    await expect(modelChip(page)).toHaveText(/Select\s*·\s*V/);
    expect(await miss(page)).toBeLessThan(0.25);
  });
}

test('the side and the key set in the x-ray come home, and are where the next x-ray starts', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelChip(page).locator('.mu-tooltip-key')).toHaveCount(1);
  // the label to the right of its tool
  await page.locator('.xr-overlay .xr-callout[aria-label^="Place"]').click();
  const side = page.getByRole('slider', { name: 'Side' });
  await expect(side).toHaveAttribute('aria-valuetext', 'above');
  await side.focus();
  await page.keyboard.press('ArrowRight');
  await expect(side).toHaveAttribute('aria-valuetext', 'right');
  // and no key
  await page.locator('.xr-overlay .xr-callout[aria-label^="Type"]').click();
  await card.getByRole('switch', { name: 'Show the key' }).click();
  await expect(modelChip(page).locator('.mu-tooltip-key')).toHaveCount(0);
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tableChip(page)).toHaveText('Select');
  await expect(tableChip(page).locator('.mu-tooltip-key')).toHaveCount(0);
  // it opens again from there, and the copy still lands on its face
  await openFromTable(page);
  await holdHandover(page);
  await expect(modelChip(page)).toHaveText('Select');
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture('xray-handoff-tooltip-right-keyless'), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
  const d = await compare(page, model, flyer);
  const off = await miss(page);
  console.log(`keyless handover: ${(d.off * 100).toFixed(2)}% differ, mean ${d.mean.toFixed(2)}, edges ${off.toFixed(3)}px off`);
  // the glyphs are all that differs (anti-aliasing at another sub-pixel offset): 1.7% measured, against 0.02% above
  expect(off).toBeLessThan(0.25);
  expect(d.off).toBeLessThan(0.02);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
  await settled(page);
  await page.locator('.xr-overlay .xr-callout[aria-label^="Place"]').click();
  await expect(page.getByRole('slider', { name: 'Side' })).toHaveAttribute('aria-valuetext', 'right');
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shape"]').click();
  const sides = card.locator('.ed-readout').filter({ hasText: 'Space on the sides' });
  await sides.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await sides.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('10');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's chip is set to it, through the library's own variable
  await expect(tableChip(page)).toHaveAttribute('style', new RegExp(`--mu-r-tooltip-self-pad-x:\\s*${value}px`));
});

test('with reduced motion the tooltip hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelChip(page)).toHaveText(/Select\s*·\s*V/);
  await page.locator('.xr-overlay .xr-callout[aria-label^="Type"]').click();
  await page.locator('.xr-overlay .xr-card').getByRole('switch', { name: 'Show the key' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableChip(page).locator('.mu-tooltip-key')).toHaveCount(0);
});
