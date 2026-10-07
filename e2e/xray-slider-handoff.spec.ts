import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the slider on the table hands its config to its x-ray. What lands is what you were
// holding (the value you set), the model's face is that object to the pixel at the moment the copy
// hands over, and the value you set in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="slider"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
/** Sets the table's slider by clicking its groove a way along, which also opens the x-ray. */
async function setOnTable(page: Page, along: number) {
  const control = page.locator('[data-float="slider"] .mu-slider-control');
  const b = (await control.boundingBox())!;
  const knob = 22; // the regular knob, from the slider recipe: its centre travels half a knob in from each end
  await control.click({ force: true, position: { x: knob / 2 + along * (b.width - knob), y: knob / 2 } });
  await page.mouse.move(0, 0);
}
const tableValue = (page: Page) => page.locator('[data-float="slider"] input[type="range"]');
const modelValue = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top input[type="range"]');

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
  test(`the slider lands on its own face, holding the value you set, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await setOnTable(page, 0.25);
    const value = await tableValue(page).inputValue();
    expect(Number(value)).not.toBe(62);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-slider-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the value, and its face is where the copy came down, edge for edge: the knob too
    await expect(modelValue(page)).toHaveValue(value);
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top')!);
      const fk = r(document.querySelector('.xr-flyer .mu-slider-knob')!), tk = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-slider-knob')!);
      const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      return Math.max(edges(f, t), edges(fk, tk));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('the value set on the table is where the x-ray starts, and the value set in the x-ray is what comes home', async ({ page }) => {
  await openOverview(page, 'bone');
  await setOnTable(page, 0.25);
  const value = await tableValue(page).inputValue();
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelValue(page)).toHaveValue(value);
  await expect(card.locator('.ed-specimen input[type="range"]')).toHaveValue(value);
  await expect(card.locator('.ed-readout').filter({ hasText: 'Value' })).toContainText(value);
  // nudge the model's own knob: the specimen follows
  await modelValue(page).focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  const moved = String(Number(value) + 5);
  await expect(card.locator('.ed-specimen input[type="range"]')).toHaveValue(moved);
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tableValue(page)).toHaveValue(moved);
  // and it opens again from there
  await page.locator('[data-float="slider"] .mu-slider-knob').click({ force: true });
  await settled(page);
  await expect(modelValue(page)).toHaveValue(moved);
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await setOnTable(page, 0.5);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Knob"]').click();
  const shine = card.locator('.ed-readout').filter({ hasText: 'Shine' });
  await shine.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await shine.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('200');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's slider is set to it, through the library's own variable
  await expect(page.locator('[data-float="slider"] .xr-slider-vars')).toHaveAttribute('style', new RegExp(`--mu-r-slider-knob-background:\\s*conic-gradient\\(from ${value}deg`));
});

test('with reduced motion the slider hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await setOnTable(page, 0.25);
  const value = await tableValue(page).inputValue();
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelValue(page)).toHaveValue(value);
  await modelValue(page).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableValue(page)).toHaveValue(String(Number(value) + 1));
});
