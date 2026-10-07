import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the field on the table hands its config to its x-ray. What lands is what you were
// holding (the words you typed), the model's face is that object to the pixel at the moment the
// copy hands over, and what you type or tune in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="field"] input');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const input = (page: Page) => page.locator('[data-float="field"] input');
/** Types in the field on the table, then clicks it: a click in a field you are in opens its x-ray. */
async function typeAndOpen(page: Page, text: string) {
  await input(page).fill(text);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await input(page).click({ force: true });
}
const modelText = (page: Page) => page.locator('.xr-overlay .xr-segface.is-fwords input');

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
  test(`the field lands on its own face, holding what you typed, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await typeAndOpen(page, 'Inbox');
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-field-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the text, and its face is where the copy came down, edge for edge
    await expect(modelText(page)).toHaveValue('Inbox');
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-field')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-fwords .mu-field')!);
      const fk = r(document.querySelector('.xr-flyer .mu-kbd')!), tk = r(document.querySelector('.xr-overlay .xr-segface.is-fkey .mu-kbd')!);
      const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      return Math.max(edges(f, t), edges(fk, tk));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('typing does not open the x-ray; a click in the field you are in does', async ({ page }) => {
  await openOverview(page, 'bone');
  // a click on the words of a field you are not in yet is for the caret
  await input(page).click({ force: true });
  await expect(input(page)).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.type('Inbox', { delay: 20 });
  await expect(input(page)).toHaveValue('Inbox');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // the second click opens it, with what is typed
  await input(page).click({ force: true });
  await settled(page);
  await expect(page.getByRole('dialog', { name: 'Field, x-ray' })).toBeVisible();
  await expect(modelText(page)).toHaveValue('Inbox');
});

test('the text on the table is where the x-ray starts, and the text in the x-ray is what comes home', async ({ page }) => {
  await openOverview(page, 'bone');
  await typeAndOpen(page, 'Inbox');
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelText(page)).toHaveValue('Inbox');
  await expect(card.getByRole('textbox', { name: 'Lens or action' })).toHaveValue('Inbox');
  // type in the model's own field: the card follows
  await modelText(page).fill('Today');
  await expect(card.getByRole('textbox', { name: 'Lens or action' })).toHaveValue('Today');
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(input(page)).toHaveValue('Today');
  // and it opens again from there
  await page.locator('[data-float="field"] .mu-field-input').focus();
  await input(page).click({ force: true });
  await settled(page);
  await expect(modelText(page)).toHaveValue('Today');
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await typeAndOpen(page, 'Inbox');
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shape"]').click();
  const left = card.locator('.ed-readout').filter({ hasText: 'Space on the left' });
  await left.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await left.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('16');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's field is set to it, through the library's own variable, and still says what you typed
  await expect(page.locator('[data-float="field"] .xr-field-vars')).toHaveAttribute('style', new RegExp(`--mu-r-field-field-pad-left:\\s*${value}px`));
  await expect(input(page)).toHaveValue('Inbox');
});

test('with reduced motion the field hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await typeAndOpen(page, 'Inbox');
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelText(page)).toHaveValue('Inbox');
  await modelText(page).fill('Today');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(input(page)).toHaveValue('Today');
});
