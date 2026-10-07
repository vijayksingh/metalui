import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the wordmark on the table hands its config to its x-ray. What lands is what you were
// holding, the model's face is that object to the pixel at the moment the copy hands over, and what
// you switch in the x-ray is what the table shows when it comes home. The wordmark is the site's own
// mark, not a library component, so there is no code panel to prove.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="wordmark"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const table = (page: Page) => page.locator('[data-float="wordmark"] [data-wordmark]');
const openFromTable = (page: Page) => page.locator('[data-float="wordmark"] button').click({ force: true });
const modelMark = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top [data-wordmark]');
const layer = (page: Page, name: string) => page.locator('.xr-overlay .xr-card').getByRole('switch', { name, exact: true });

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
  const pad = 40;
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

/** The copy and the model's face, edge for edge: the largest gap between their pills. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const f = r(document.querySelector('.xr-flyer [data-wordmark]')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top [data-wordmark]')!);
  return Math.max(Math.abs(f.left - t.left), Math.abs(f.top - t.top), Math.abs(f.right - t.right), Math.abs(f.bottom - t.bottom));
});

for (const colorway of COLORWAYS) {
  test(`the wordmark lands on its own face, as it is on the table, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-wordmark-${colorway}`), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    expect(await miss(page)).toBeLessThan(0.25);
  });
}

test('a layer switched off in the x-ray is what the table shows when it comes home, and where it starts next time', async ({ page }) => {
  await openOverview(page, 'bone');
  await expect(table(page).locator(':scope > span')).toHaveCount(3);
  await openFromTable(page);
  await settled(page);
  // all four layers start on, as the table holds them
  for (const name of ['Enamel', 'Chrome lettering', 'Top highlight', 'Rim and shadows']) await expect(layer(page, name)).toBeChecked();
  await layer(page, 'Top highlight').click();
  await layer(page, 'Rim and shadows').click();
  // the model's face follows
  await expect(modelMark(page).locator(':scope > span')).toHaveCount(2);
  await expect(modelMark(page)).toHaveCSS('box-shadow', 'none');
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(table(page).locator(':scope > span')).toHaveCount(2);
  await expect(table(page)).toHaveCSS('box-shadow', 'none');
  // and it opens again from there
  await openFromTable(page);
  await settled(page);
  await expect(layer(page, 'Top highlight')).not.toBeChecked();
  await expect(layer(page, 'Enamel')).toBeChecked();
  await expect(modelMark(page).locator(':scope > span')).toHaveCount(2);
});

test('a tuned wordmark lands as it was left: the same pixels, the same boxes', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  await layer(page, 'Chrome lettering').click();
  await layer(page, 'Top highlight').click();
  await page.keyboard.press('Escape');
  await settled(page);
  await openFromTable(page);
  await holdHandover(page);
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture('xray-handoff-wordmark-tuned'), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
  const d = await compare(page, model, flyer);
  console.log(`tuned handover stills: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
  expect(d.off).toBeLessThan(0.01);
  expect(d.mean).toBeLessThan(2);
  expect(await miss(page)).toBeLessThan(0.25);
});

test('with reduced motion the wordmark hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelMark(page)).toHaveCount(1);
  await layer(page, 'Enamel').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(table(page).locator(':scope > span:first-child')).toHaveCSS('background-image', 'none');
});

test('the wordmark x-ray says there is no code for it, and has no code panel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'bone');
  await openFromTable(page);
  const sheet = page.getByRole('dialog', { name: 'MetalUI wordmark, x-ray' });
  await expect(sheet.getByText('not a library component')).toBeVisible();
  await expect(sheet.getByRole('tablist')).toHaveCount(0);
});
