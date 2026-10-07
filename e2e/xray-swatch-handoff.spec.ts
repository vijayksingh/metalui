import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the swatch on the table hands its config to its x-ray. What lands is what you were
// holding (its colour, its label, how it is tuned), the model's face is that object to the pixel at
// the moment the copy hands over, and what you tune in the x-ray is what the table shows when it
// comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="swatch"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const table = (page: Page) => page.locator('[data-float="swatch"] .mu-swatch');
const openFromTable = (page: Page) => table(page).click({ force: true });
const modelChip = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-swatch');
const part = (page: Page, name: string) => page.locator(`.xr-overlay .xr-callout[aria-label^="${name}"]`).click();
const readout = (page: Page, name: string) => page.locator('.xr-overlay .xr-card .ed-readout').filter({ hasText: name });
const shown = (r: Locator) => r.locator('.ed-roll > span:not(.is-out)').textContent();

/** Steps a readout with the arrow keys, as a keyboard user does. */
async function step(page: Page, name: string, key: string, times: number) {
  const r = readout(page, name);
  await r.focus();
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
}

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
  // the chip casts a shadow below and beside it: the frame holds it
  const pad = 60;
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

/** The copy and the model's face, edge for edge: the largest gap between their boxes, and between their dimples. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const f = r(document.querySelector('.xr-flyer .mu-swatch')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-swatch')!);
  const fd = r(document.querySelector('.xr-flyer .mu-swatch-led')!), td = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-swatch-led')!);
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  return Math.max(edges(f, t), edges(fd, td));
});

for (const colorway of COLORWAYS) {
  test(`the swatch lands on its own face, as it is on the table, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-swatch-${colorway}`), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the table's label, and its face is where the copy came down, edge for edge
    await expect(modelChip(page).locator('.mu-swatch-label')).toHaveText('Colour');
    expect(await miss(page)).toBeLessThan(0.25);
  });
}

test('a tuned swatch lands as it was left: the same pixels, the same boxes', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  // turn the colour, round the corners, enlarge the dimple and soften the shadow
  await part(page, 'Type');
  await step(page, 'Colour', 'ArrowUp', 8);
  await part(page, 'Shape');
  await step(page, 'Corners', 'ArrowDown', 6);
  await part(page, 'Dimple');
  await step(page, 'Dimple', 'ArrowUp', 4);
  await part(page, 'Shadow');
  await step(page, 'Shadow blur', 'ArrowUp', 8);
  await page.keyboard.press('Escape');
  await settled(page);
  await openFromTable(page);
  await holdHandover(page);
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture('xray-handoff-swatch-tuned'), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
  const d = await compare(page, model, flyer);
  console.log(`tuned handover stills: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
  expect(d.off).toBeLessThan(0.01);
  expect(d.mean).toBeLessThan(2);
  expect(await miss(page)).toBeLessThan(0.25);
});

test('the colour on the table is where the x-ray starts, and the colour in the x-ray is what comes home', async ({ page }) => {
  await openOverview(page, 'bone');
  const home = await table(page).getAttribute('aria-label');
  expect(home).toBe('Colour #FF6B3D');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelChip(page)).toHaveAttribute('aria-label', home!);
  await part(page, 'Type');
  await expect(card.getByRole('slider', { name: 'Colour' })).toHaveAttribute('aria-valuetext', '#FF6B3D');
  // turn the colour on the card: the model follows, and so does the table when it comes home
  await step(page, 'Colour', 'ArrowUp', 10);
  const turned = await card.locator('.mu-swatch').getAttribute('aria-label');
  expect(turned).not.toBe(home);
  await expect(modelChip(page)).toHaveAttribute('aria-label', turned!);
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(table(page)).toHaveAttribute('aria-label', turned!);
  await expect(table(page).locator('.mu-swatch-label')).toHaveText('Colour');
  // and it opens again from there
  await openFromTable(page);
  await settled(page);
  await expect(modelChip(page)).toHaveAttribute('aria-label', turned!);
  await part(page, 'Type');
  await expect(card.getByRole('slider', { name: 'Colour' })).toHaveAttribute('aria-valuetext', turned!.replace('Colour ', ''));
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  await part(page, 'Shape');
  await step(page, 'Corners', 'ArrowDown', 6);
  const radius = await shown(readout(page, 'Corners'));
  expect(radius).not.toBe('22');
  // the label goes too: the chip engraves its colour code instead of its name
  await part(page, 'Type');
  await page.locator('.xr-overlay .xr-card').getByRole('switch', { name: 'Engrave the colour code' }).click();
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's swatch is set to it, through the library's own variable, and has the code engraved
  await expect(table(page)).toHaveAttribute('style', new RegExp(`--mu-r-swatch-self-radius:\\s*${radius}px`));
  await expect(table(page).locator('.mu-swatch-label')).toHaveText('#FF6B3D');
});

test('with reduced motion the swatch hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelChip(page)).toHaveAttribute('aria-label', 'Colour #FF6B3D');
  await part(page, 'Type');
  await step(page, 'Colour', 'ArrowUp', 10);
  const turned = await page.locator('.xr-overlay .xr-card .mu-swatch').getAttribute('aria-label');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(table(page)).toHaveAttribute('aria-label', turned!);
});
