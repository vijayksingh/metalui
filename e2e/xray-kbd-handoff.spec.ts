import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the keycap on the table hands its config to its x-ray. What lands is what you were
// holding (its glyph, its size, its surface), the model's face is that object to the pixel at the
// moment the copy hands over, and what you set in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="key"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const openFromTable = (page: Page) => page.locator('[data-float="key"] .mu-kbd').click({ force: true });
const tableKey = (page: Page) => page.locator('[data-float="key"] .mu-kbd');
const modelKey = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-kbd');
const part = (page: Page, name: string) => page.locator(`.xr-overlay .xr-callout[aria-label^="${name}"]`).click();
/** Sets the keycap in the x-ray to a strip key, small, with more space beside the glyph; then sends it home. */
async function setUp(page: Page) {
  const card = page.locator('.xr-overlay .xr-card');
  await card.getByRole('slider', { name: 'Surface' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(modelKey(page)).toHaveAttribute('data-surface', 'strip');
  await part(page, 'Shape');
  await card.getByRole('slider', { name: 'Size' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(modelKey(page)).toHaveAttribute('data-size', 'small');
  const beside = card.locator('.ed-readout').filter({ hasText: 'Space beside the glyph' });
  await beside.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowUp');
  const pad = await beside.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(pad).not.toBe('4');
  await page.keyboard.press('Escape');
  await settled(page);
  return pad!;
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


async function check(page: Page, colorway: string, name: string) {
  await holdHandover(page);
  // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
  // anti-aliasing of glyph edges
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture(`xray-handoff-kbd-${name}-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
  const d = await compare(page, model, flyer);
  console.log(`handover stills, ${name}, in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
  expect(d.off).toBeLessThan(0.01);
  expect(d.mean).toBeLessThan(2);
  // the model's face is where the copy came down, edge for edge
  const miss = await page.evaluate(() => {
    const r = (el: Element) => el.getBoundingClientRect();
    const f = r(document.querySelector('.xr-flyer')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top')!);
    const fk = r(document.querySelector('.xr-flyer .mu-kbd')!), tk = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-kbd')!);
    const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
    return Math.max(edges(f, t), edges(fk, tk));
  });
  expect(miss).toBeLessThan(0.25);
}

for (const colorway of COLORWAYS) {
  test(`the keycap lands on its own face, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await check(page, colorway, 'default');
    await expect(modelKey(page)).toHaveText('⌘K');
    await expect(modelKey(page)).toHaveAttribute('data-surface', 'default');
  });

  test(`a sunk keycap lands on its own face, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await settled(page);
    await page.locator('.xr-overlay .xr-card').getByRole('slider', { name: 'Surface' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(modelKey(page)).toHaveAttribute('data-surface', 'sunk');
    await page.keyboard.press('Escape');
    await settled(page);
    await openFromTable(page);
    await check(page, colorway, 'sunk');
  });

  test(`a keycap you set up lands as you left it, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await settled(page);
    await setUp(page);
    // the table's keycap is the one you set up, and the next flight carries it
    await expect(tableKey(page)).toHaveAttribute('data-surface', 'strip');
    await expect(tableKey(page)).toHaveAttribute('data-size', 'small');
    await openFromTable(page);
    await check(page, colorway, 'strip-small');
    await expect(modelKey(page)).toHaveAttribute('data-surface', 'strip');
    await expect(modelKey(page)).toHaveAttribute('data-size', 'small');
  });
}

test('what you set in the x-ray is what the table shows when it comes home, and where it starts again', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const pad = await setUp(page);
  // home: the object on the table is what you left it, through the library's own variable
  await expect(tableKey(page)).toHaveAttribute('style', new RegExp(`--mu-r-kbd-small-pad:\\s*${pad}px`));
  await expect(tableKey(page)).toHaveCSS('padding-left', `${pad}px`);
  // and it opens again from there, the card holding what the object holds
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(card.getByRole('slider', { name: 'Surface' })).toHaveAttribute('aria-valuetext', 'On a dark strip');
  await part(page, 'Shape');
  await expect(card.getByRole('slider', { name: 'Space beside the glyph' })).toHaveAttribute('aria-valuenow', pad);
  await expect(card.locator('.ed-readout').filter({ hasText: 'Size' }).first()).toContainText('16');
});

test('with reduced motion the keycap hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelKey(page)).toHaveText('⌘K');
  const card = page.locator('.xr-overlay .xr-card');
  await card.getByRole('slider', { name: 'Surface' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(modelKey(page)).toHaveAttribute('data-surface', 'sunk');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableKey(page)).toHaveAttribute('data-surface', 'sunk');
});
