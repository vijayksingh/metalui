import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the toolbar on the table hands its config to its x-ray. What lands is what you were
// holding (the tool you pressed), the model's face is that object to the pixel at the moment the copy
// hands over, and what you pick in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="toolbar"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const tableStrip = (page: Page) => page.locator('[data-float="toolbar"] .mu-toolbar');
const tablePressed = (page: Page) => page.locator('[data-float="toolbar"] .mu-tool[aria-pressed="true"]');
const modelPressed = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-tool[aria-pressed="true"]');
/** Presses a tool on the table. A cap opens the icon button's x-ray, as it always has, so send that home first. */
async function pressOnTable(page: Page, label: string) {
  await page.locator(`[data-float="toolbar"] .mu-tool[aria-label="${label}"]`).click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Icon button, x-ray' })).toBeVisible();
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tablePressed(page)).toHaveAttribute('aria-label', label);
}
/** Opens the toolbar's x-ray from the strip itself: its left end, between the edge and the first cap. */
async function openFromTable(page: Page) {
  const b = (await tableStrip(page).boundingBox())!;
  await tableStrip(page).click({ force: true, position: { x: 3, y: b.height / 2 } });
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

for (const colorway of COLORWAYS) {
  test(`the toolbar lands on its own face, holding the tool you pressed, in ${colorway}`, async ({ page }) => {
    test.slow();
    await openOverview(page, colorway);
    await pressOnTable(page, 'Note');
    await openFromTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-toolbar-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the press, and its face is where the copy came down, edge for edge: the pressed cap too
    await expect(modelPressed(page)).toHaveAttribute('aria-label', 'Note');
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-toolbar')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-toolbar')!);
      const fp = r(document.querySelector('.xr-flyer .mu-tool[aria-pressed="true"]')!), tp = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-tool[aria-pressed="true"]')!);
      const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      return Math.max(edges(f, t), edges(fp, tp));
    });
    expect(miss).toBeLessThan(0.25);
  });
}

test('the tool pressed on the table is where the x-ray starts, and the tool picked in the x-ray is what comes home', async ({ page }) => {
  await openOverview(page, 'bone');
  await pressOnTable(page, 'Note');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelPressed(page)).toHaveAttribute('aria-label', 'Note');
  await expect(card.getByRole('slider', { name: 'Tool', exact: true })).toHaveAttribute('aria-valuetext', 'Note');
  await expect(card.locator('.ed-readout').filter({ hasText: 'Tool' }).first()).toContainText('Note');
  // pick Draw on the model's own cap: the specimen follows
  await page.locator('.xr-overlay .xr-segface.is-top .mu-tool[aria-label="Draw"]').click();
  await expect(card.locator('.mu-tool[aria-pressed="true"]')).toHaveAttribute('aria-label', 'Draw');
  // home: the object on the table is what you left it
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(tablePressed(page)).toHaveAttribute('aria-label', 'Draw');
  // and it opens again from there
  await openFromTable(page);
  await settled(page);
  await expect(modelPressed(page)).toHaveAttribute('aria-label', 'Draw');
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Strip"]').click();
  const around = card.locator('.ed-readout').filter({ hasText: 'Space around the tools' });
  await around.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowUp');
  const value = await around.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('7');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's toolbar is set to it, through the library's own variable
  await expect(page.locator('[data-float="toolbar"] .xr-tb-vars')).toHaveAttribute('style', new RegExp(`--mu-r-toolbar-self-pad:\\s*${value}px`));
  await expect(tableStrip(page)).toHaveCSS('padding-left', `${value}px`);
});

test('with reduced motion the toolbar hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelPressed(page)).toHaveAttribute('aria-label', 'Select');
  await page.locator('.xr-overlay .xr-segface.is-top .mu-tool[aria-label="Tidy"]').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tablePressed(page)).toHaveAttribute('aria-label', 'Tidy');
});
