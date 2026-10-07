import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the status badge on the table hands its config to its x-ray. The model's face is that
// badge to the pixel at the moment the copy hands over, and what you tune in the x-ray is what the
// table shows when it comes home.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="status"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const modelBadge = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-badge');
const openFromTable = (page: Page) => page.locator('[data-float="status"] .mu-badge').click({ force: true });

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


for (const colorway of COLORWAYS) {
  test(`the status badge lands on its own face in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-status-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    await expect(modelBadge(page)).toContainText('Sync live');
    const miss = await page.evaluate(() => {
      const r = (el: Element) => el.getBoundingClientRect();
      const f = r(document.querySelector('.xr-flyer .mu-badge')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-badge')!);
      const fl = r(document.querySelector('.xr-flyer [data-lamp]')!), tl = r(document.querySelector('.xr-overlay .xr-segface.is-top [data-lamp]')!);
      const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
      return Math.max(edges(f, t), edges(fl, tl));
    });
    expect(miss).toBeLessThan(0.5);
  });
}

test('a state picked in the x-ray is what comes home, and where the next x-ray starts', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelBadge(page).locator('.mu-led')).toHaveAttribute('data-kind', 'live');
  await card.getByRole('slider', { name: 'State' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(modelBadge(page).locator('.mu-led')).toHaveAttribute('data-kind', 'waiting');
  await expect(modelBadge(page)).toContainText('Sync waiting');
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(page.locator('[data-float="status"] .mu-led')).toHaveAttribute('data-kind', 'waiting');
  await expect(page.locator('[data-float="status"] .mu-badge')).toContainText('Sync waiting');
  // it opens again from there, and the copy still lands on its face
  await openFromTable(page);
  await holdHandover(page);
  await expect(modelBadge(page).locator('.mu-led')).toHaveAttribute('data-kind', 'waiting');
  // a breathing lamp is a different brightness in each copy at any instant: hold it still, the geometry is what is compared
  await page.addStyleTag({ content: '.mu-led [data-lamp] { animation: none !important; }' });
  const { model, flyer } = await stills(page);
  const d = await compare(page, model, flyer);
  console.log(`waiting handover: ${(d.off * 100).toFixed(2)}% differ, mean ${d.mean.toFixed(2)}`);
  // longer words have more glyph edges, and edges are all that differs (anti-aliasing): 1.3% measured, the live badge gives 0.1%
  expect(d.off).toBeLessThan(0.02);
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await page.locator('.xr-overlay .xr-callout[aria-label^="Shape"]').click();
  const ends = card.locator('.ed-readout').filter({ hasText: 'Space on the ends' });
  await ends.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowUp');
  const value = await ends.locator('.ed-roll > span:not(.is-out)').textContent();
  expect(value).not.toBe('11');
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(page.locator('[data-float="status"] .mu-badge')).toHaveAttribute('style', new RegExp(`--mu-r-status-badge-pad:\\s*${value}px`));
});

test('with reduced motion the status badge hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelBadge(page)).toContainText('Sync live');
  await page.locator('.xr-overlay .xr-card').getByRole('slider', { name: 'State' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-float="status"] .mu-led')).toHaveAttribute('data-kind', 'waiting');
});
