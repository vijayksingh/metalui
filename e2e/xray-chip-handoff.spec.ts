import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the suggestion chip on the table hands its config to its x-ray. The model's face is that
// chip to the pixel at the moment the copy hands over, and what you tune in the x-ray is what the table
// shows when it comes home. The chip's own behaviour on the table (✓ and × answer) is untouched.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="chip"]');
  await page.evaluate(() => document.fonts.ready);
  // the chip's own arrival is done before anyone clicks it
  await page.locator('[data-float="chip"] .mu-suggestion').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const modelChip = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-suggestion');
const tableChip = (page: Page) => page.locator('[data-float="chip"] .mu-suggestion');
const openFromTable = (page: Page) => page.locator('[data-float="chip"] .mu-chip-text').click({ force: true });

/** Holds the flight at the moment of handover: the copy has landed and is still whole, the model is in under it. */
async function holdHandover(page: Page) {
  await page.waitForSelector('.xr-flyer');
  await page.mouse.move(0, 0);
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

/** How far the copy's boxes are from the model's: the chip, its words and its buttons, in screen px. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  const pair = (sel: string) => edges(r(document.querySelector(`.xr-flyer ${sel}`)!), r(document.querySelector(`.xr-overlay .xr-segface.is-top ${sel}`)!));
  return Math.max(pair('.mu-suggestion'), pair('.mu-chip-text'), pair('.mu-chip-actions'));
});

for (const colorway of COLORWAYS) {
  test(`the suggestion chip lands on its own face in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-chip-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    await expect(modelChip(page).locator('.mu-chip-text')).toHaveText('Track as mood?');
    await expect(modelChip(page).locator('.mu-suggestion-conf')).toHaveText('0.80');
    expect(await miss(page)).toBeLessThan(0.5);
  });
}

test('a question and a tweak picked in the x-ray are what comes home, and where the next x-ray starts', async ({ page }) => {
  // two trips through the flight and a handled tweak: about 10 s alone
  test.slow();
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Type"]').click();
  await card.locator('.ed-readout').filter({ hasText: 'Question' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(modelChip(page).locator('.mu-chip-text')).toHaveText('Task?');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shape"]').click();
  const height = card.locator('.ed-readout').filter({ hasText: 'Height' });
  await height.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const value = await height.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('20');
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tableChip(page).locator('.mu-chip-text')).toHaveText('Task?');
  await expect(tableChip(page)).toHaveAttribute('style', new RegExp(`--mu-r-chip-suggestion-height:\\s*${value}px`));
  // it opens again from there, and the copy still lands on its face
  await openFromTable(page);
  await holdHandover(page);
  await expect(modelChip(page).locator('.mu-chip-text')).toHaveText('Task?');
  const { model, flyer } = await stills(page);
  const d = await compare(page, model, flyer);
  console.log(`tuned handover: ${(d.off * 100).toFixed(2)}% differ, mean ${d.mean.toFixed(2)}`);
  expect(d.off).toBeLessThan(0.01);
  expect(await miss(page)).toBeLessThan(0.5);
});

test('on the table, ✓ still answers and the words still open the x-ray', async ({ page }) => {
  await openOverview(page, 'bone');
  await tableChip(page).getByRole('button', { name: 'Accept' }).click({ force: true });
  await expect(page.locator('[data-float="chip"] .mu-suggestion')).toHaveCount(0);
  await expect(page.locator('.xr-overlay')).toHaveCount(0);
});

test('with reduced motion the suggestion chip hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.waitForSelector('[data-float="chip"]');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelChip(page).locator('.mu-chip-text')).toHaveText('Track as mood?');
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Type"]').click();
  await card.locator('.ed-readout').filter({ hasText: 'Question' }).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableChip(page).locator('.mu-chip-text')).toHaveText('Task?');
});
