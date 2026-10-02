import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

// The status badge x-ray's editing layer: every card holds the real StatusBadge (a specimen),
// changed by handling it, never a slider. Its handles, readouts and switches change the same
// model the bench draws.

const STATES = ['live', 'waiting', 'failed', 'linked', 'off'];
const CALLOUTS = ['States', 'Lamp', 'Glow', 'Type', 'Shape', 'Layers'];

async function openXray(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/status');
  const xray = page.locator('#x-ray .xr');
  await xray.scrollIntoViewIfNeeded();
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const readout = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label });
const value = (card: Locator, label: string) => readout(card, label).locator('.ed-roll > span:not(.is-out)');
const style = (el: Locator, prop: string) => el.evaluate((e, p) => (e as HTMLElement).style.getPropertyValue(p), prop);
const computed = (el: Locator, prop: string) => el.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

for (const colorway of COLORWAYS) {
  test(`every part of the status x-ray is handled, not slid, in ${colorway}`, async ({ page }) => {
    const xray = await openXray(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-badge')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('states: a small drag only leans, a longer one snaps to the next real state, on specimen and bench', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  const handle = card.getByRole('slider', { name: 'State' });
  const before = await handle.getAttribute('aria-valuetext');
  expect(STATES).toContain(before);
  // a nudge leans (the tag names the target) but never picks
  await drag(page, handle, 6, 0);
  await expect(handle).toHaveAttribute('aria-valuetext', before!);
  // far enough, it is the next state: never between
  await drag(page, handle, 20, 0);
  const after = await handle.getAttribute('aria-valuetext');
  expect(STATES).toContain(after);
  expect(STATES.indexOf(after!)).toBe(STATES.indexOf(before!) + 1);
  const words = (await card.locator('.ed-specimen .mu-badge').innerText()).trim();
  await expect(xray.locator('.xr-badgeface')).toHaveText(words);
  await expect(card.locator('.ed-specimen .mu-badge .mu-led')).toHaveAttribute('data-kind', 'waiting');
  // the readout steps it back with an arrow key
  await readout(card, 'State').focus();
  await page.keyboard.press('ArrowDown');
  await expect(handle).toHaveAttribute('aria-valuetext', before!);
});

test('lamp: the sun moves the bright spot on the specimen and the bench', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Lamp');
  const across = await value(card, 'Spot across').innerText();
  const lamp = xray.locator('.xr-badgeface i');
  const bench = await style(lamp, 'background');
  const specimen = await computed(card.locator('.ed-specimen .mu-badge [data-lamp]'), 'background-image');
  await drag(page, card.getByRole('slider', { name: 'Bright spot' }), 24, 10);
  await expect(value(card, 'Spot across')).not.toHaveText(across);
  expect(await style(lamp, 'background')).not.toBe(bench);
  expect(await computed(card.locator('.ed-specimen .mu-badge [data-lamp]'), 'background-image')).not.toBe(specimen);
});

test('glow: a switch takes the green lamp\'s glow off both', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Glow');
  const lamp = xray.locator('.xr-badgeface i');
  const bench = await style(lamp, 'box-shadow');
  const specimen = await computed(card.locator('.ed-specimen .mu-badge [data-lamp]'), 'box-shadow');
  const glow = card.getByRole('switch', { name: 'Glow' });
  await expect(glow).toHaveAttribute('aria-checked', 'true');
  await glow.click();
  await expect(glow).toHaveAttribute('aria-checked', 'false');
  expect(await style(lamp, 'box-shadow')).not.toBe(bench);
  expect(await computed(card.locator('.ed-specimen .mu-badge [data-lamp]'), 'box-shadow')).not.toBe(specimen);
});

test('type: the words are the handle; sideways sets spacing, up sets size', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const face = xray.locator('.xr-badgeface');
  const words = card.getByRole('slider', { name: 'Letter size and spacing' });
  const spacing = await value(card, 'Letter spacing').innerText();
  const benchTrack = await style(face, 'letter-spacing');
  const specTrack = await computed(words, 'letter-spacing');
  await drag(page, words, 30, 0);
  await expect(value(card, 'Letter spacing')).not.toHaveText(spacing);
  expect(await style(face, 'letter-spacing')).not.toBe(benchTrack);
  expect(await computed(words, 'letter-spacing')).not.toBe(specTrack);
  const size = await value(card, 'Letter size').innerText();
  const benchSize = await style(face, 'font-size');
  await drag(page, words, 0, -12);
  await expect(value(card, 'Letter size')).not.toHaveText(size);
  expect(await style(face, 'font-size')).not.toBe(benchSize);
});

test('shape: top edge, right end and lamp change the specimen and the bench', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const face = xray.locator('.xr-face:has(.xr-badgeface)');
  const badge = card.locator('.ed-specimen .mu-badge');

  const h = await value(card, 'Height').innerText();
  const benchH = await style(face, 'height');
  const specH = (await badge.boundingBox())!.height;
  await drag(page, card.getByRole('slider', { name: 'Height' }), 0, -8);
  await expect(value(card, 'Height')).not.toHaveText(h);
  expect(await style(face, 'height')).not.toBe(benchH);
  expect((await badge.boundingBox())!.height).toBeGreaterThan(specH);

  const pad = await value(card, 'Space on the ends').innerText();
  const benchW = await style(face, 'width');
  const specW = (await badge.boundingBox())!.width;
  await drag(page, card.getByRole('slider', { name: 'Space on the ends' }), 12, 0);
  await expect(value(card, 'Space on the ends')).not.toHaveText(pad);
  expect(await style(face, 'width')).not.toBe(benchW);
  expect((await badge.boundingBox())!.width).toBeGreaterThan(specW);

  const led = await value(card, 'Lamp size').innerText();
  const lamp = xray.locator('.xr-badgeface i');
  const benchLed = await style(lamp, 'width');
  const specLed = await computed(badge.locator('.mu-led'), 'width');
  await drag(page, card.getByRole('slider', { name: 'Lamp size' }), 10, -10);
  await expect(value(card, 'Lamp size')).not.toHaveText(led);
  expect(await style(lamp, 'width')).not.toBe(benchLed);
  expect(await computed(badge.locator('.mu-led'), 'width')).not.toBe(specLed);
});

test('readouts scrub by drag and by arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const h0 = Number(await value(card, 'Height').innerText());
  await drag(page, readout(card, 'Height'), 0, -24);
  await expect(value(card, 'Height')).toHaveText(String(h0 + 3));
  await readout(card, 'Height').focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Height')).toHaveText(String(h0 + 2));
  await card.getByRole('slider', { name: 'Space on the ends' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Space on the ends');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.ed-tag')).toBeVisible();
});

test('layers: a switch takes a layer off the specimen and the bench', async ({ page }) => {
  const xray = await openXray(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const badge = card.locator('.ed-specimen .mu-badge');
  const shadow = await computed(badge, 'box-shadow');
  await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(0);
  const drop = card.getByRole('switch', { name: 'Drop' });
  await drop.click();
  await expect(drop).toHaveAttribute('aria-checked', 'false');
  await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(1);
  expect(await computed(badge, 'box-shadow')).not.toBe(shadow);
});

test('graphite at 375 px: the x-ray opened from the table fits every card without sideways scroll', async ({ page }) => {
  // opened from the overview's floating table, as a phone reader meets it (the status page itself
  // is wider than 375 before the x-ray opens, because of its SwiftUI capture)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem('metalui:colorway', 'graphite'));
  await page.goto('/overview');
  await page.locator('[data-float="status"] .mu-badge').click({ force: true });
  const xray = page.locator('.xr-overlay');
  const card = xray.locator('.xr-card');
  for (const name of CALLOUTS) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-badge')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  }
});
