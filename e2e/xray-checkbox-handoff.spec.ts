import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: a checkbox in the table's note lines hands its config to its x-ray. The object that
// flies is that checkbox alone (never the lines around it), what lands is the state the click left it
// in, the model's face is that checkbox to the pixel at the moment the copy hands over, and what you
// set in the x-ray comes home to that checkbox: its line strikes through when it is done.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="lines"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const tableBox = (page: Page, part: string) => page.locator(`[data-float="lines"] [data-float-part="${part}"] .mu-dimple`);
const tableLine = (page: Page, part: string) => page.locator(`[data-float="lines"] [data-float-part="${part}"] + span`);
/** Clicks a checkbox on the table: the click ticks it, and opens its x-ray. The pointer leaves so nothing is hovered. */
async function openFromTable(page: Page, part: string) {
  await tableBox(page, part).click({ force: true });
  await page.mouse.move(0, 0);
}
const modelBox = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-dimple');
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

async function check(page: Page, colorway: string, name: string) {
  await holdHandover(page);
  // the object in the air is the one checkbox, not the lines it sits in
  await expect(page.locator('.xr-flyer .mu-dimple')).toHaveCount(1);
  expect((await page.locator('.xr-flyer').textContent())?.trim()).toBe('');
  // the same pixels: the face with the copy gone, and the copy with the model gone
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture(`xray-handoff-checkbox-${name}-${colorway}`), clip: { x: clip.x - 60, y: clip.y - 60, width: clip.width + 120, height: clip.height + 120 } });
  const d = await compare(page, model, flyer);
  console.log(`handover stills, ${name}, in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
  expect(d.off).toBeLessThan(0.01);
  expect(d.mean).toBeLessThan(2);
  // the model's face is where the copy came down, edge for edge
  const miss = await page.evaluate(() => {
    const r = (el: Element) => el.getBoundingClientRect();
    const f = r(document.querySelector('.xr-flyer')!), t = r(document.querySelector('.xr-overlay .xr-segface.is-top')!);
    const fk = r(document.querySelector('.xr-flyer .mu-dimple')!), tk = r(document.querySelector('.xr-overlay .xr-segface.is-top .mu-dimple')!);
    const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
    return Math.max(edges(f, t), edges(fk, tk));
  });
  expect(miss).toBeLessThan(0.25);
}

for (const colorway of COLORWAYS) {
  test(`the checkbox you tick flies alone and lands on its own face, ticked, in ${colorway}`, async ({ page }) => {
    await openOverview(page, colorway);
    await openFromTable(page, 'open');
    await check(page, colorway, 'ticked');
    await expect(modelBox(page)).toHaveAttribute('data-checked', '');
  });
}

test('the checkbox you untick lands as the empty well it is', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page, 'done');
  await check(page, 'bone', 'unticked');
  await expect(modelBox(page)).not.toHaveAttribute('data-checked', '');
});

test('what you set in the x-ray comes home to that checkbox, and its line follows', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page, 'open');
  await settled(page);
  // the click ticked it: its line is struck through while it is away, the other line keeps its own state
  await expect(tableLine(page, 'open')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(tableBox(page, 'done')).toHaveAttribute('data-checked', '');
  const card = page.locator('.xr-overlay .xr-card');
  await expect(card.getByRole('slider', { name: 'State' })).toHaveAttribute('aria-valuetext', 'Done');
  // back to rest in the x-ray, and rounder corners
  await card.getByRole('slider', { name: 'State' }).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(card.getByRole('slider', { name: 'State' })).toHaveAttribute('aria-valuetext', 'Rest');
  await part(page, 'Shape');
  const corners = card.locator('.ed-readout').filter({ hasText: 'Corners' });
  await corners.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown');
  const radius = (await corners.locator('.ed-roll > span:not(.is-out)').textContent())!;
  expect(radius).not.toBe('6');
  await page.keyboard.press('Escape');
  await settled(page);
  // home: that checkbox is at rest and its line is plain; the corners reach both through the library's own variable
  await expect(tableBox(page, 'open')).not.toHaveAttribute('data-checked', '');
  await expect(tableLine(page, 'open')).toHaveCSS('text-decoration-line', 'none');
  await expect(tableBox(page, 'open')).toHaveAttribute('style', new RegExp(`--mu-r-checkbox-self-radius:\\s*${radius}px`));
  await expect(tableBox(page, 'open')).toHaveCSS('border-top-left-radius', `${radius}px`);
  await expect(tableBox(page, 'done')).toHaveAttribute('data-checked', '');
  await expect(tableBox(page, 'done')).toHaveCSS('border-top-left-radius', `${radius}px`);
  // the other checkbox opens from its own state, the card holding what the object holds
  await openFromTable(page, 'done');
  await settled(page);
  await expect(card.getByRole('slider', { name: 'State' })).toHaveAttribute('aria-valuetext', 'Rest');
  await expect(tableLine(page, 'done')).toHaveCSS('text-decoration-line', 'none');
  await part(page, 'Shape');
  await expect(card.getByRole('slider', { name: 'Corners' })).toHaveAttribute('aria-valuenow', radius);
});

test('with reduced motion the checkbox hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page, 'open');
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelBox(page)).toHaveAttribute('data-checked', '');
  await modelBox(page).click();
  await expect(modelBox(page)).not.toHaveAttribute('data-checked', '');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(tableBox(page, 'open')).not.toHaveAttribute('data-checked', '');
  await expect(tableLine(page, 'open')).toHaveCSS('text-decoration-line', 'none');
});
