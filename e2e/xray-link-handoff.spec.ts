import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, capture } from './helpers';

// The handover: the link card on the table hands its config to its x-ray. What lands is what you were
// holding (its link, how it is tuned), the model's face is that object to the pixel at the moment the
// copy hands over, and what you tune in the x-ray is what the table shows when it comes home.
// The card draws everything from its props and the recipe: it has no preview on the table, and
// nothing in the handover fetches an image or an icon, so no frame here waits on a network.

async function openOverview(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/overview');
  await page.waitForSelector('[data-float="link"]');
  await page.evaluate(() => document.fonts.ready);
}
const settled = (page: Page) => page.waitForFunction(() => !document.documentElement.dataset.flight && !document.querySelector('.xr-flyer'));
const table = (page: Page) => page.locator('[data-float="link"] .mu-linkcard');
const openFromTable = (page: Page) => table(page).click({ force: true });
const modelCard = (page: Page) => page.locator('.xr-overlay .xr-segface.is-top .mu-linkcard');
const part = (page: Page, name: string) => page.locator(`.xr-overlay .xr-callout[aria-label^="${name}"]`).click();
const readout = (page: Page, name: string) => page.locator('.xr-overlay .xr-card .ed-readout').filter({ has: page.locator('b', { hasText: new RegExp(`^${name}$`) }) });
const shown = (r: Locator) => r.locator('.ed-roll > span:not(.is-out)').textContent();

/** Steps a readout with the arrow keys, as a keyboard user does. */
async function step(page: Page, name: string, key: string, times: number) {
  const r = readout(page, name);
  await r.focus();
  for (let i = 0; i < times; i++) await page.keyboard.press(key);
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
  // the card casts a long shadow below it: the frame holds it
  const pad = 90;
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

/** The copy and the model's face, edge for edge: the largest gap between their boxes, and between their screens and chips. */
const miss = (page: Page) => page.evaluate(() => {
  const r = (el: Element) => el.getBoundingClientRect();
  const edges = (a: DOMRect, b: DOMRect) => Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.right - b.right), Math.abs(a.bottom - b.bottom));
  return Math.max(...['.mu-linkcard', '.mu-linkcard-screen', '.mu-linkcard-tag', '.mu-linkcard-open', '.mu-linkcard-host'].map((sel) =>
    edges(r(document.querySelector(`.xr-flyer ${sel}`)!), r(document.querySelector(`.xr-overlay .xr-segface.is-top ${sel}`)!))));
});

for (const colorway of COLORWAYS) {
  test(`the link card lands on its own face, as it is on the table, in ${colorway}`, async ({ page }) => {
    test.slow();
    await openOverview(page, colorway);
    await openFromTable(page);
    await holdHandover(page);
    // the same pixels: the face with the copy gone, and the copy with the model gone, differ only by the
    // anti-aliasing of glyph edges
    const { model, flyer, clip } = await stills(page);
    await page.screenshot({ path: capture(`xray-handoff-link-${colorway}`), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
    const d = await compare(page, model, flyer);
    console.log(`handover stills in ${colorway}: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
    expect(d.off).toBeLessThan(0.01);
    expect(d.mean).toBeLessThan(2);
    // the model holds the table's link, and its face is where the copy came down, edge for edge
    await expect(modelCard(page).locator('.mu-linkcard-host')).toHaveText('lanterns.photo');
    await expect(modelCard(page).locator('.mu-linkcard-open')).toHaveAttribute('href', 'https://lanterns.photo/night-market');
    expect(await miss(page)).toBeLessThan(0.25);
  });
}

test('a tuned link card lands as it was left: the same pixels, the same boxes', async ({ page }) => {
  test.slow();
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  // try another site, thicken the frame, enlarge the name, move the tags off their corners, round the screen, switch a shadow off
  await part(page, 'Screen');
  await step(page, 'Site', 'ArrowUp', 1);
  await part(page, 'Bezel');
  await step(page, 'Frame width', 'ArrowDown', 4);
  await part(page, 'Type');
  await step(page, 'Name size', 'ArrowUp', 4);
  await part(page, 'Open');
  await step(page, 'Space from the corner', 'ArrowUp', 4);
  await part(page, 'Shape');
  await step(page, 'Screen corners', 'ArrowDown', 4);
  await part(page, 'Layers');
  await page.locator('.xr-overlay .xr-card').getByRole('switch', { name: 'Far shadow' }).click();
  await page.keyboard.press('Escape');
  await settled(page);
  await openFromTable(page);
  await holdHandover(page);
  const { model, flyer, clip } = await stills(page);
  await page.screenshot({ path: capture('xray-handoff-link-tuned'), clip: { x: clip.x - 40, y: clip.y - 40, width: clip.width + 80, height: clip.height + 80 } });
  const d = await compare(page, model, flyer);
  console.log(`tuned handover stills: ${(d.off * 100).toFixed(2)}% of pixels differ, mean ${d.mean.toFixed(2)}/255`);
  expect(d.off).toBeLessThan(0.01);
  expect(d.mean).toBeLessThan(2);
  expect(await miss(page)).toBeLessThan(0.25);
});

test('the site on the table is where the x-ray starts, and the site in the x-ray is what comes home', async ({ page }) => {
  await openOverview(page, 'bone');
  await expect(table(page).locator('.mu-linkcard-host')).toHaveText('lanterns.photo');
  await openFromTable(page);
  await settled(page);
  const card = page.locator('.xr-overlay .xr-card');
  await expect(modelCard(page).locator('.mu-linkcard-host')).toHaveText('lanterns.photo');
  await part(page, 'Screen');
  await expect(card.getByRole('slider', { name: 'Site' })).toHaveAttribute('aria-valuetext', 'lanterns.photo');
  // try another site on the card: the model follows, and so does the table when it comes home
  await step(page, 'Site', 'ArrowUp', 1);
  const next = (await card.locator('.mu-linkcard-host').textContent())!;
  expect(next).not.toBe('lanterns.photo');
  await expect(modelCard(page).locator('.mu-linkcard-host')).toHaveText(next);
  await expect(modelCard(page).locator('.mu-linkcard-open')).toHaveAttribute('href', `https://${next}/night-market`);
  await page.keyboard.press('Escape');
  await settled(page);
  await expect(table(page).locator('.mu-linkcard-host')).toHaveText(next);
  await expect(table(page).locator('.mu-linkcard-open')).toHaveAttribute('href', `https://${next}/night-market`);
  // tinted from its name, the way the reference does
  await expect(table(page)).toHaveAttribute('style', /--mu-self:\s*hsl\(/);
  // and it opens again from there
  await openFromTable(page);
  await settled(page);
  await expect(modelCard(page).locator('.mu-linkcard-host')).toHaveText(next);
  await part(page, 'Screen');
  await expect(card.getByRole('slider', { name: 'Site' })).toHaveAttribute('aria-valuetext', next);
  // a click on the card never follows its link
  expect(page.context().pages().length).toBe(1);
});

test('a tweak comes home with the object: what lifts off the model is what landed on it', async ({ page }) => {
  await openOverview(page, 'bone');
  await openFromTable(page);
  await settled(page);
  await part(page, 'Shape');
  await step(page, 'Screen corners', 'ArrowDown', 4);
  const radius = await shown(readout(page, 'Screen corners'));
  expect(radius).not.toBe('16');
  await part(page, 'Open');
  await step(page, 'Space from the corner', 'ArrowUp', 4);
  const inset = await shown(readout(page, 'Space from the corner'));
  expect(inset).not.toBe('10');
  await page.keyboard.press('Escape');
  await settled(page);
  // the table's card is set to it, through the library's own variables
  await expect(table(page)).toHaveAttribute('style', new RegExp(`--mu-r-glass-face-screen-radius:\\s*${radius}px`));
  await expect(table(page)).toHaveAttribute('style', new RegExp(`--mu-r-link-card-chip-inset:\\s*${inset}px`));
  // and a card nobody touched carries no variables at all
});

test('an untouched card carries no variables, and the model starts exactly there', async ({ page }) => {
  await openOverview(page, 'graphite');
  expect(await table(page).getAttribute('style')).toBeNull();
  await openFromTable(page);
  await settled(page);
  // open, the model's face lets go of the shadows it now casts on the floor: nothing else is set
  expect(await modelCard(page).getAttribute('style') ?? '').not.toMatch(/--mu-r-(?!glass-face-self-shadow)|--mu-self/);
  await page.keyboard.press('Escape');
  await settled(page);
  expect(await table(page).getAttribute('style')).toBeNull();
});

test('with reduced motion the link card hands over in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOverview(page, 'graphite');
  await openFromTable(page);
  await expect(page.locator('.xr-flyer')).toHaveCount(0);
  await expect(modelCard(page).locator('.mu-linkcard-host')).toHaveText('lanterns.photo');
  await part(page, 'Screen');
  await step(page, 'Site', 'ArrowUp', 1);
  const next = (await page.locator('.xr-overlay .xr-card .mu-linkcard-host').textContent())!;
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(table(page).locator('.mu-linkcard-host')).toHaveText(next);
});
