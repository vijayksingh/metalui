import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the menu on the table hands its config to its x-ray. The model's face is that plate to
// the pixel at the moment the copy hands over (the library's own still, laid out at the table's zoom), and
// what you tune in the x-ray is what the table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="menu"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const modelMenu = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-menu');
const tableMenu = (page: Page) => page.locator('[data-float="menu"] .mu-menu');
const litLabel = (menu: ReturnType<typeof modelMenu>) => menu.locator('.mu-menu-row[data-highlighted] .mu-menu-label');
const openFromTable = (page: Page) => page.locator('[data-float="menu"] .mu-menu-heading').click({ force: true });

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

/** How far the copy's boxes are from the model's: the plate, its heading, the lit row and the line, in screen px. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  const pair = (sel: string) => edges(r(document.querySelector(`.xr-flyer ${sel}`)!), r(document.querySelector(`.xr-overlay .xr-segface.is-top ${sel}`)!));
  return Math.max(pair('.mu-menu'), pair('.mu-menu-heading'), pair('.mu-menu-row[data-highlighted]'), pair('.mu-menu-sep'), pair('.mu-menu-row[data-danger] .mu-kbd'));
});

for (const colorway of COLORWAYS) {
  test(`the menu lands on its own face in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    // the table's menu is the library's own still: its part classes, three rows, a heading and a line
    await expect(tableMenu(page).locator('.mu-menu-row')).toHaveCount(3);
    await openFromTable(page);
    await holdHandover(page);
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-menu-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    await expect(modelMenu(page).locator('.mu-menu-heading')).toHaveText('NOTE · 3 LINES');
    await expect(litLabel(modelMenu(page))).toHaveText('Make a task');
    expect(await miss(page)).toBeLessThan(0.5);
  });
}

test('the row lit and the space tuned in the x-ray are what comes home, and where the next x-ray starts', async ({ page }) => {
  // two trips through the flight and a handled tweak: about 10 s alone
  test.slow();
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Rows"]').click();
  await card.locator('.ed-readout').filter({ hasText: 'Lit row' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(litLabel(modelMenu(page))).toHaveText('Pin to the canvas');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shape"]').click();
  const space = card.locator('.ed-readout').filter({ hasText: 'Space around the rows' });
  await space.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
  const value = await space.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('6');
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(litLabel(tableMenu(page))).toHaveText('Pin to the canvas');
  await expect(tableMenu(page)).toHaveAttribute('style', new RegExp(`--mu-r-menu-self-pad:\\s*${value}px`));
  // it opens again from there, and the copy still lands on its face
  await openFromTable(page);
  await holdHandover(page);
  await expect(litLabel(modelMenu(page))).toHaveText('Pin to the canvas');
  const { model, flyer } = await stills(page);
  const d = await compare(page, model, flyer);
  console.log(`tuned handover: ${(d.off * 100).toFixed(2)}% differ, mean ${d.mean.toFixed(2)}`);
  expect(d.off).toBeLessThan(0.01);
  expect(await miss(page)).toBeLessThan(0.5);
});

test('with reduced motion the menu hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.waitForSelector('[data-float="menu"]');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(litLabel(modelMenu(page))).toHaveText('Make a task');
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Heading"]').click();
  await card.getByRole('switch', { name: 'Heading' }).click();
  await expect(modelMenu(page).locator('.mu-menu-heading')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableMenu(page).locator('.mu-menu-heading')).toHaveCount(0);
});
