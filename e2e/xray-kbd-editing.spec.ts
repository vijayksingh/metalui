import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label }).locator('.ed-roll > span:not(.is-out)');
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 }); await page.mouse.up();
}
async function open(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/kbd');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
// the keycap is the real one everywhere (the card and the model's face), so what it looks like is what it computes to
const inline = (target: Locator, property: string) => target.evaluate((el, key) => getComputedStyle(el).getPropertyValue(key), property);
const modelKey = (xray: Locator) => xray.locator('.xr-segface.is-top .mu-kbd');
const modelFace = (xray: Locator) => xray.locator('.xr-segface.is-top');

for (const colorway of COLORWAYS) {
  test(`each Kbd card holds real key and no dials in ${colorway}`, async ({ page }) => {
    const xray = await open(page, colorway), card = xray.locator('.xr-card');
    for (const name of ['Shape', 'Type', 'Surface', 'Light', 'Shadow', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-kbd')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial')).toHaveCount(0);
    }
  });
}

test('shape handles change the key and bench; size leans then snaps to a real option', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const size = card.getByRole('slider', { name: 'Size' });
  const before = Number(await size.getAttribute('aria-valuenow'));
  const options = [Number(await size.getAttribute('aria-valuemin')), Number(await size.getAttribute('aria-valuemax'))];
  expect(options).toContain(before);
  await drag(page, size, 0, before === Math.max(...options) ? 5 : -5);
  expect(Number(await size.getAttribute('aria-valuenow'))).toBe(before);
  await drag(page, size, 0, before === Math.max(...options) ? 30 : -30);
  const after = Number(await size.getAttribute('aria-valuenow'));
  expect(options).toContain(after);
  expect(after).not.toBe(before);
  await expect(card.locator('.mu-kbd')).toHaveCSS('height', `${after}px`);
  await expect(modelKey(xray)).toHaveAttribute('data-size', after === Math.max(...options) ? 'default' : 'small');
  await expect(xray.locator('.xr-dims text').first()).toHaveText(`${after}`);
  const key = card.locator('.mu-kbd');
  const padBefore = await inline(key, 'padding-left');
  const benchBefore = await inline(modelKey(xray), 'padding-left');
  await drag(page, card.getByRole('slider', { name: 'Space beside the glyph' }), 22, 0);
  expect(await inline(key, 'padding-left')).not.toBe(padBefore);
  expect(await inline(modelKey(xray), 'padding-left')).not.toBe(benchBefore);
  const radiusBefore = await inline(key, 'border-top-left-radius');
  const benchRadius = await inline(modelKey(xray), 'border-top-left-radius');
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -20, -20);
  expect(await inline(key, 'border-top-left-radius')).not.toBe(radiusBefore);
  expect(await inline(modelKey(xray), 'border-top-left-radius')).not.toBe(benchRadius);
  await expect(modelKey(xray)).toHaveCSS('border-top-left-radius', '0px');
});

test('type, surface, light, shadow and layer handles change specimen and bench', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const key = card.locator('.mu-kbd');
  const font = await inline(key, 'font-size');
  // the glyph is one handle: up for a bigger glyph
  await drag(page, card.getByRole('slider', { name: 'Glyph size and letter spacing' }), 0, -18);
  expect(await inline(key, 'font-size')).not.toBe(font);
  await expect(key).toHaveCSS('font-size', `${await value(card, 'Glyph size').textContent()}px`);
  await expect(modelKey(xray)).toHaveCSS('font-size', `${await value(card, 'Glyph size').textContent()}px`);
  const spacing = await inline(key, 'letter-spacing');
  const benchSpacing = await inline(modelKey(xray), 'letter-spacing');
  // …and sideways for more space between letters
  await drag(page, card.getByRole('slider', { name: 'Glyph size and letter spacing' }), 20, 0);
  expect(await inline(key, 'letter-spacing')).not.toBe(spacing);
  expect(await inline(modelKey(xray), 'letter-spacing')).not.toBe(benchSpacing);
  await part(xray, 'Surface');
  const surface = card.getByRole('slider', { name: 'Surface' });
  const first = await surface.getAttribute('aria-valuetext');
  await drag(page, surface, 8, 0);
  await expect(surface).toHaveAttribute('aria-valuetext', first!);
  const benchSurface = await inline(modelKey(xray), 'background-image');
  await drag(page, surface, 36, 0);
  await expect(surface).toHaveAttribute('aria-valuetext', 'On a dark strip');
  await expect(card.locator('.mu-kbd')).toHaveAttribute('data-surface', 'strip');
  await expect(modelKey(xray)).toHaveAttribute('data-surface', 'strip');
  expect(await inline(modelKey(xray), 'background-image')).not.toBe(benchSurface);
  await drag(page, surface, -36, 0);
  await expect(card.locator('.mu-kbd')).toHaveAttribute('data-surface', 'default');
  await part(xray, 'Light');
  const fill = await inline(modelKey(xray), 'background-image');
  const keyFill = await inline(card.locator('.mu-kbd'), 'background-image');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 25, 4);
  expect(await inline(modelKey(xray), 'background-image')).not.toBe(fill);
  expect(await inline(card.locator('.mu-kbd'), 'background-image')).not.toBe(keyFill);
  await part(xray, 'Shadow');
  const shadow = await inline(card.locator('.mu-kbd'), 'box-shadow');
  const z = await modelFace(xray).evaluate((el) => (el as HTMLElement).style.transform);
  await drag(page, card.getByRole('slider', { name: 'Height above the page' }), 0, -24);
  expect(await inline(card.locator('.mu-kbd'), 'box-shadow')).not.toBe(shadow);
  expect(await modelFace(xray).evaluate((el) => (el as HTMLElement).style.transform)).not.toBe(z);
  await part(xray, 'Layers');
  for (const name of ['Fill', 'Inner glow', 'Top light', 'Rim', 'Contact', 'Drop']) {
    const row = card.locator('.ed-layer').filter({ hasText: name });
    const layer = row.getByRole('switch');
    const faceBefore = await card.locator('.mu-kbd').evaluate((el) => `${getComputedStyle(el).backgroundImage}|${getComputedStyle(el).boxShadow}`);
    await row.hover();
    await expect(xray.locator('.xr-face.is-layer.is-focus')).toHaveCount(1);
    await layer.click();
    await expect(layer).toHaveAttribute('aria-checked', 'false');
    const faceAfter = await card.locator('.mu-kbd').evaluate((el) => `${getComputedStyle(el).backgroundImage}|${getComputedStyle(el).boxShadow}`);
    expect(faceAfter).not.toBe(faceBefore);
    await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(1);
    await layer.click();
    await expect(layer).toHaveAttribute('aria-checked', 'true');
  }
});

test('readout scrubs by drag and arrow keys; focused handle shows its hint', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const readout = card.locator('.ed-readout').filter({ hasText: 'Space beside the glyph' });
  const before = await value(card, 'Space beside the glyph').textContent();
  await drag(page, readout, 0, -24);
  expect(await value(card, 'Space beside the glyph').textContent()).not.toBe(before);
  const after = await value(card, 'Space beside the glyph').textContent();
  await readout.focus(); await page.keyboard.press('ArrowDown');
  expect(await value(card, 'Space beside the glyph').textContent()).not.toBe(after);
  await card.getByRole('slider', { name: 'Size' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Size');
});

test('375 px graphite Kbd card has no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await open(page, 'graphite');
  for (const name of ['Shape', 'Type', 'Surface', 'Light', 'Shadow', 'Layers']) {
    await part(xray, name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
