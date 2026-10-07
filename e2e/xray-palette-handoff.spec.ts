import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the command palette on the table hands its config to its x-ray. What lands is the
// palette as it is (its query, its rows, the row that is chosen, the keys in its footer), the model's
// face is that palette to the pixel at the moment the copy hands over, and what you set in the x-ray
// is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="palette"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const tablePalette = (page: Page) => page.locator('[data-float="palette"] .mu-palette');
const openFromTable = (page: Page) => tablePalette(page).locator('.mu-palette-foot').click({ force: true });
/** The model's top plane: the whole palette, with only its chosen row drawn on it. */
const modelTop = (page: Page) => page.locator('.xr-overlay .xr-segface.is-pcap .mu-palette');
/** The model's body plane: the palette you can read and choose a row in. */
const modelBody = (page: Page) => page.locator('.xr-overlay .xr-segface.is-pbody .mu-palette');

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

/** The copy and the face, edge for edge: the plate, its field and its chosen row. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  const pair = (sel: string) => edges(r(document.querySelector(`.xr-flyer ${sel}`)!), r(document.querySelector(`.xr-overlay .xr-segface.is-pcap ${sel}`)!));
  return Math.max(pair('.mu-palette'), pair('.mu-palette-field'), pair('.mu-palette-row[data-highlighted]'));
});

for (const colorway of COLORWAYS) {
  test(`the palette lands on its own face, in ${colorway}`, async ({ page }) => {
    test.slow();
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges and by the frost: the plate is see-through, and inside the model's 3D
    // scene the browser does not blur what is behind it, so the floor's grid shows crisp through the model
    // and softened through the copy (0.7 % of pixels, a mean of 2.7 in bone; the same paint, the same boxes)
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-palette-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(3);
    // the model holds the query, its rows and the chosen row, and its face is where the copy came down, edge for edge
    await expect(modelBody(page).locator('.mu-palette-input')).toHaveValue('tidy');
    await expect(modelTop(page).locator('.mu-palette-row[data-highlighted]')).toHaveText(/See “tidy”/);
    expect(await miss(page)).toBeLessThan(0.25);
  });
}

test('the query, the chosen row and the footer set in the x-ray come home, and are where the next x-ray starts', async ({ page }) => {
  test.slow();
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(tablePalette(page)).toHaveCount(1);
  // a new query: fewer rows
  await page.locator('.xr-overlay .xr-callout[aria-label^="Field"]').click();
  await card.getByRole('textbox', { name: 'Palette query' }).fill('new');
  await expect(modelBody(page).locator('.mu-palette-row')).toHaveCount(2);
  // the second row chosen
  await page.locator('.xr-overlay .xr-callout[aria-label^="Rows"]').click();
  const chosen = card.getByRole('slider', { name: 'Chosen row' });
  await chosen.focus();
  await page.keyboard.press('ArrowDown');
  await expect(chosen).toHaveAttribute('aria-valuenow', '2');
  await expect(modelTop(page).locator('.mu-palette-row[data-highlighted]')).toHaveText(/New canvas/);
  // no pinning, and where answers come from
  await page.locator('.xr-overlay .xr-callout[aria-label^="Keys"]').click();
  await card.getByRole('switch', { name: 'Pin with ⇧↩' }).click();
  await card.getByRole('switch', { name: 'Where answers come from' }).click();
  await expect(modelBody(page).locator('.mu-palette-foot')).not.toContainText('PIN');
  await expect(modelBody(page).locator('.mu-palette-foot')).toContainText('SYNC OFFLINE');
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tablePalette(page).locator('.mu-palette-input')).toHaveValue('new');
  await expect(tablePalette(page).locator('.mu-palette-row')).toHaveCount(2);
  await expect(tablePalette(page).locator('.mu-palette-row[data-highlighted]')).toHaveText(/New canvas/);
  await expect(tablePalette(page).locator('.mu-palette-foot')).not.toContainText('PIN');
  await expect(tablePalette(page).locator('.mu-palette-foot')).toContainText('SYNC OFFLINE');
  // it opens again from there, and the copy still lands on its face
  await openFromTable(page);
  await holdHandover(page);
  await expect(modelTop(page).locator('.mu-palette-row[data-highlighted]')).toHaveText(/New canvas/);
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture('xray-handoff-palette-new-second-status'), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
  const d = await compare(page, model, flyer);
  const off = await miss(page);
  console.log(`second handover: ${(d.off * 100).toFixed(2)}% differ, mean ${d.mean.toFixed(2)}, edges ${off.toFixed(3)}px off`);
  expect(off).toBeLessThan(0.25);
  expect(d.off).toBeLessThan(0.01);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
  await settled(page);
  await page.locator('.xr-overlay .xr-callout[aria-label^="Rows"]').click();
  await expect(page.getByRole('slider', { name: 'Chosen row' })).toHaveAttribute('aria-valuenow', '2');
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Field"]').click();
  const height = card.locator('.ed-readout').filter({ hasText: 'Field height' });
  await height.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await height.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('44');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's palette is set to it, through the library's own variable
  await expect(tablePalette(page)).toHaveAttribute('style', new RegExp(`--mu-palette-field-height:\\s*${value}px`));
});

test('with reduced motion the palette hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelBody(page).locator('.mu-palette-input')).toHaveValue('tidy');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Keys"]').click();
  await page.locator('.xr-overlay .xr-card').getByRole('switch', { name: 'Pin with ⇧↩' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tablePalette(page).locator('.mu-palette-foot')).not.toContainText('PIN');
});
