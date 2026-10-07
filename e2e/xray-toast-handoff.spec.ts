import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the toast on the table hands its config to its x-ray. The model's face is that
// object to the pixel at the moment the copy hands over, and what you set in the x-ray (its key,
// its detail, its spacing) is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="toast"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const clickOnTable = (page: Page) => page.locator('[data-float="toast"] > *').first().click({ force: true });
const tableToast = (page: Page) => page.locator('[data-float="toast"] .mu-toast');
const modelToast = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-toast');
const part = (page: Page, name: string) => page.locator(`.xr-overlay .xr-callout[aria-label^="${name}"]`).click();

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

for (const colorway of COLORWAYS) {
  test(`the toast lands on its own face in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await clickOnTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-toast-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model's face is the toast where the copy came down, edge for edge, its Undo cap included
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-toast')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-toast')!);
      const fu = r(document.querySelector('.xr-flyer .mu-toast-undo')!), tu = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-toast-undo')!);
      const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      return Math.max(edges(f, t), edges(fu, tu));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('what you set in the x-ray is what comes home, and where it opens again from', async ({ page }) => {
  await openOverview(page, 'bone');
  await clickOnTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  // the toast ships with its key beside Undo; turn it off in the x-ray, and the specimen and the model lose it
  await expect(modelToast(page).locator('.mu-toast-undo .mu-kbd')).toHaveCount(1);
  await part(page, 'Undo');
  const key = card.getByRole('switch', { name: '⌘Z key' });
  await key.click();
  await expect(key).toHaveAttribute('aria-checked', 'false');
  await expect(card.locator('.ed-specimen .mu-toast-undo .mu-kbd')).toHaveCount(0);
  await expect(modelToast(page).locator('.mu-toast-undo .mu-kbd')).toHaveCount(0);
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tableToast(page).locator('.mu-toast-undo')).toHaveCount(1);
  await expect(tableToast(page).locator('.mu-toast-undo .mu-kbd')).toHaveCount(0);
  // and it opens again from there
  await clickOnTable(page);
  await settled(page);
  await expect(modelToast(page).locator('.mu-toast-undo .mu-kbd')).toHaveCount(0);
  await part(page, 'Undo');
  await expect(page.locator('.xr-overlay .xr-card').getByRole('switch', { name: '⌘Z key' })).toHaveAttribute('aria-checked', 'false');
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await clickOnTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await part(page, 'Shape');
  const left = card.locator('.ed-readout').filter({ hasText: 'space on the left' });
  await left.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await left.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('16');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's toast is set to it, through the library's own variable
  await expect(tableToast(page)).toHaveAttribute('style', new RegExp(`--mu-r-toast-self-pad-left:\\s*${value}px`));
});

test('with reduced motion the toast hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await clickOnTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelToast(page).locator('.mu-toast-sub')).toHaveCount(1);
  await part(page, 'Type');
  await page.locator('.xr-overlay .xr-card').getByRole('switch', { name: 'Detail' }).click();
  await expect(modelToast(page).locator('.mu-toast-sub')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableToast(page).locator('.mu-toast-sub')).toHaveCount(0);
});
