import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const SPOTS = ['Bezel', 'Screen', 'Type', 'Open', 'Shape', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}:"]`).click();
const readout = (card: Locator, name: string) => card.locator('.ed-readout').filter({ has: card.page().locator('b', { hasText: new RegExp(`^${name}$`) }) });
const value = (card: Locator, name: string) => readout(card, name).locator('.ed-roll > span:not(.is-out)');
const specimen = (card: Locator) => card.locator('.mu-linkcard');
/** The model on the bench: its top face is the real card, so the bench is read by what the browser computes on it. */
const model = (xray: Locator, sel = '') => xray.locator(`.xr-segface.is-top .mu-linkcard${sel}`);
const inline = (target: Locator, prop: string) => target.evaluate((el, p) => (el as HTMLElement).style.getPropertyValue(p), prop);
const computed = (target: Locator, prop: string) => target.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card sits below the bench: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/link-card');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`each link card callout holds the real card and no sliders in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of SPOTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-linkcard')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .xr-switch, .xr-proof')).toHaveCount(0);
    }
  });
}

test('the frame side sets the frame width on the card and the bench, catching on its token', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Bezel');
  const handle = card.getByRole('slider', { name: 'Frame width' });
  const start = Number(await handle.getAttribute('aria-valuenow'));
  const specimen = card.locator('.mu-linkcard');
  const pad0 = await computed(specimen, 'padding-left');
  const left0 = await computed(model(xray), 'padding-left');
  // dragging in makes the frame thicker
  await drag(page, handle, -12, 0);
  const now = Number(await handle.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(start);
  expect(await computed(specimen, 'padding-left')).not.toBe(pad0);
  expect(await computed(model(xray), 'padding-left')).not.toBe(left0);
  await expect(value(card, 'Frame width')).toHaveText(`${now}`);
  // and back out to just short of it (drags are read in the card's units, so scale by its zoom): it catches on the token
  const zoom = Number(await card.locator('.ed-specimen > div').evaluate((el) => (el as HTMLElement).style.zoom));
  await drag(page, handle, (now - start - 0.3) * zoom, 0);
  await expect(handle).toHaveAttribute('aria-valuenow', `${start}`);
});

test('the glow leans toward the next site and snaps there, never between', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Screen');
  const glow = card.getByRole('slider', { name: 'Site' });
  const host = card.locator('.mu-linkcard-host');
  const first = await glow.getAttribute('aria-valuetext');
  await expect(host).toHaveText(first!);
  const bg0 = await computed(model(xray, '-screen'), 'background-image');
  // a small nudge only leans
  await drag(page, glow, 6, 0);
  await expect(glow).toHaveAttribute('aria-valuetext', first!);
  await expect(host).toHaveText(first!);
  // far enough, it snaps to the next site on both the card and the bench
  await drag(page, glow, 24, 0);
  const next = await glow.getAttribute('aria-valuetext');
  expect(next).not.toBe(first);
  await expect(host).toHaveText(next!);
  await expect(model(xray, '-host')).toHaveText(next!);
  expect(await computed(model(xray, '-screen'), 'background-image')).not.toBe(bg0);
  // the glare switch removes the glare from both
  await card.getByRole('switch', { name: 'Glare' }).click();
  await expect(card.getByRole('switch', { name: 'Glare' })).toHaveAttribute('aria-checked', 'false');
  expect(await inline(model(xray), '--mu-r-glass-face-glare-background')).not.toContain('115deg');
  expect(await inline(specimen(card), '--mu-r-glass-face-glare-background')).not.toContain('115deg');
});

test('the words set their size and spacing on the card and the bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const name = card.getByRole('slider', { name: "Site's name size and spacing" });
  const size0 = await computed(card.locator('.mu-linkcard-host'), 'font-size');
  const bench0 = await computed(model(xray, '-host'), 'font-size');
  await drag(page, name, 0, -15);
  expect(await computed(card.locator('.mu-linkcard-host'), 'font-size')).not.toBe(size0);
  expect(await computed(model(xray, '-host'), 'font-size')).not.toBe(bench0);
  const path = card.getByRole('slider', { name: 'Path size and spacing' });
  const track0 = await computed(card.locator('.mu-linkcard-path'), 'letter-spacing');
  const benchTrack0 = await computed(model(xray, '-path'), 'letter-spacing');
  await drag(page, path, 20, 0);
  expect(await computed(card.locator('.mu-linkcard-path'), 'letter-spacing')).not.toBe(track0);
  expect(await computed(model(xray, '-path'), 'letter-spacing')).not.toBe(benchTrack0);
});

test('the LINK tag sets both chips’ distance from the corner; only OPEN opens', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Open');
  const tag = card.getByRole('slider', { name: 'Space from the corner' });
  const start = Number(await tag.getAttribute('aria-valuenow'));
  const chip0 = await computed(card.locator('.mu-linkcard-open'), 'right');
  const bench0 = await computed(model(xray, '-tag'), 'left');
  await drag(page, tag, 8, 8);
  expect(Number(await tag.getAttribute('aria-valuenow'))).toBeGreaterThan(start);
  expect(await computed(card.locator('.mu-linkcard-open'), 'right')).not.toBe(chip0);
  expect(await computed(model(xray, '-tag'), 'left')).not.toBe(bench0);
  // OPEN is the only way out; on the specimen it says where it would go instead of leaving the page
  const pages = page.context().pages().length;
  await card.locator('.mu-linkcard-open').click();
  await expect(card.locator('.ed-lc-opened')).toContainText('would open');
  expect(page.context().pages().length).toBe(pages);
});

test('the screen corner sets its corners; the frame corners follow unless switched off', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const corner = card.getByRole('slider', { name: 'Screen corners' });
  const screenR0 = await computed(card.locator('.mu-linkcard-screen'), 'border-top-left-radius');
  const frameR0 = await computed(card.locator('.mu-linkcard'), 'border-top-left-radius');
  const bench0 = await computed(model(xray, '-screen'), 'border-top-left-radius');
  await drag(page, corner, 10, 10);
  expect(await computed(card.locator('.mu-linkcard-screen'), 'border-top-left-radius')).not.toBe(screenR0);
  expect(await computed(card.locator('.mu-linkcard'), 'border-top-left-radius')).not.toBe(frameR0);
  expect(await computed(model(xray, '-screen'), 'border-top-left-radius')).not.toBe(bench0);
  const followed = await computed(card.locator('.mu-linkcard'), 'border-top-left-radius');
  await card.getByRole('switch', { name: 'Frame corners follow the screen' }).click();
  expect(await computed(card.locator('.mu-linkcard'), 'border-top-left-radius')).not.toBe(followed);
});

test('readouts scrub by drag and by arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const before = await value(card, 'Screen corners').textContent();
  await drag(page, readout(card, 'Screen corners'), 0, -24);
  await expect(value(card, 'Screen corners')).not.toHaveText(before!);
  const mid = await value(card, 'Screen corners').textContent();
  await readout(card, 'Screen corners').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Screen corners')).not.toHaveText(mid!);
  // a step readout moves between real sites only
  await part(xray, 'Screen');
  const site0 = await value(card, 'Site').textContent();
  await readout(card, 'Site').focus();
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Site')).not.toHaveText(site0!);
  await expect(card.locator('.mu-linkcard-host')).toHaveText((await value(card, 'Site').textContent())!);
  // the keyboard: focus a handle, press an arrow, and its hint shows above the card
  await part(xray, 'Bezel');
  const frame = card.getByRole('slider', { name: 'Frame width' });
  await frame.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.ed-tag')).toContainText('Frame width');
});

test('layer switches change the card and the bench; hovering a row points at its slice', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const shadow0 = await computed(card.locator('.mu-linkcard'), 'box-shadow');
  const sw = card.getByRole('switch', { name: 'Far shadow' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(await computed(card.locator('.mu-linkcard'), 'box-shadow')).not.toBe(shadow0);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Far shadow' })).toHaveCount(1);
  await card.locator('.ed-layer').filter({ hasText: 'Glare' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus').filter({ hasText: 'Glare' })).toHaveCount(1);
});

for (const colorway of COLORWAYS) {
  test(`375 px ${colorway}: every card fits without sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of SPOTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-linkcard')).toHaveCount(1);
      await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
      const well = await card.locator('.ed-specimen').boundingBox();
      const lc = await card.locator('.ed-specimen .mu-linkcard').boundingBox();
      expect(lc!.x + lc!.width).toBeLessThanOrEqual(well!.x + well!.width + 0.5);
    }
  });
}
