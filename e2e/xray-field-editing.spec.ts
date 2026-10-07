import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const CALLOUTS = ['Well', 'Type', 'Key', 'Shape', 'Light', 'Layers'];
const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, label: string) => card.locator('.ed-readout').filter({ hasText: label }).locator('.ed-roll > span:not(.is-out)');
const inline = (target: Locator, property: string) => target.evaluate((el, key) => (el as HTMLElement).style.getPropertyValue(key), property);
// the field wears its config through the library's variables, so what it looks like is read as computed
const css = (target: Locator, property: string) => target.evaluate((el, key) => getComputedStyle(el).getPropertyValue(key), property);
// the bench's planes are the real field: its tray, its words, its key
const tray = (xray: Locator) => xray.locator('.xr-segface.is-fwell .mu-field');
const words = (xray: Locator) => xray.locator('.xr-segface.is-fwords .mu-field');
const now = async (handle: Locator) => Number(await handle.getAttribute('aria-valuenow'));

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  // the card can sit below the fold: bring the handle into view before taking hold of it
  await target.scrollIntoViewIfNeeded();
  const b = (await target.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 }); await page.mouse.up();
}
async function open(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/field');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

for (const colorway of COLORWAYS) {
  test(`each field card holds one real field and no dials in ${colorway}`, async ({ page }) => {
    const xray = await open(page, colorway), card = xray.locator('.xr-card');
    for (const name of CALLOUTS) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-field')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('well depth: the bottom edge deepens the field and the tray on the bench', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Well');
  const handle = card.getByRole('slider', { name: 'Well depth' });
  const before = await now(handle);
  const field = card.locator('.mu-field');
  const shadow = await css(field, 'box-shadow');
  const bench = await css(tray(xray), 'box-shadow');
  const ring = await inline(xray.locator('.xr-ring').last(), 'transform');
  await drag(page, handle, 0, 20);
  expect(await now(handle)).toBeGreaterThan(before);
  expect(await css(field, 'box-shadow')).not.toBe(shadow);
  expect(await css(tray(xray), 'box-shadow')).not.toBe(bench);
  expect(await inline(xray.locator('.xr-ring').last(), 'transform')).not.toBe(ring);
  // dragged back near the recipe's depth it catches there, LED lit
  await drag(page, handle, 0, -20);
  await expect(value(card, 'Well depth')).toHaveText(before.toFixed(1));
});

test('shape: height, corners and the space on the left change the field and the bench', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const field = card.locator('.mu-field');
  const face = tray(xray);

  const height = card.getByRole('slider', { name: 'Height' });
  const h0 = await now(height);
  const benchH = await css(face, 'height');
  await drag(page, height, 0, -12);
  const h1 = await now(height);
  expect(h1).toBeGreaterThan(h0);
  await expect(field).toHaveCSS('height', `${h1}px`);
  await expect(face).toHaveCSS('height', `${h1}px`);
  expect(await css(face, 'height')).not.toBe(benchH);
  await expect(xray.locator('.xr-dims text').first()).toHaveText(`${h1}`);

  const corners = card.getByRole('slider', { name: 'Corners' });
  const r0 = await now(corners);
  const benchR = await css(face, 'border-top-left-radius');
  await drag(page, corners, -24, -24);
  const r1 = await now(corners);
  expect(r1).toBeLessThan(r0);
  await expect(field).toHaveCSS('border-top-left-radius', `${r1}px`);
  await expect(face).toHaveCSS('border-top-left-radius', `${r1}px`);
  expect(await css(face, 'border-top-left-radius')).not.toBe(benchR);

  const left = card.getByRole('slider', { name: 'Space on the left' });
  const p0 = await now(left);
  const row = await css(words(xray), 'padding-left');
  await drag(page, left, 16, 0);
  const p1 = await now(left);
  expect(p1).toBeGreaterThan(p0);
  await expect(field).toHaveCSS('padding-left', `${p1}px`);
  await expect(words(xray)).toHaveCSS('padding-left', `${p1}px`);
  expect(await css(words(xray), 'padding-left')).not.toBe(row);
});

test('type and key: typing and the switches show on the bench', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Type');
  await card.getByRole('textbox', { name: 'Lens or action' }).fill('Inbox');
  // the model's words are the same real field, holding the same text
  await expect(xray.locator('.xr-segface.is-fwords input')).toHaveValue('Inbox');
  await card.getByRole('switch', { name: 'Caret' }).click();
  await expect(card.getByRole('textbox', { name: 'Lens or action' })).toHaveCSS('caret-color', 'rgba(0, 0, 0, 0)');
  await expect(xray.locator('.xr-segface.is-fwords input')).toHaveCSS('caret-color', 'rgba(0, 0, 0, 0)');
  await part(xray, 'Key');
  await expect(card.locator('.ed-specimen .mu-kbd')).toHaveCount(1);
  await expect(xray.locator('.xr-segface.is-fkey .mu-kbd')).toHaveCount(1);
  await card.getByRole('switch', { name: 'Key' }).click();
  await expect(card.locator('.ed-specimen .mu-kbd')).toHaveCount(0);
  await expect(xray.locator('.xr-segface .mu-kbd')).toHaveCount(0);
});

test('light: the sun turns the light on the field and the bench', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Light');
  const field = card.locator('.mu-field');
  const fill = await css(field, 'background-image');
  const bench = await css(tray(xray), 'background-image');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 6);
  expect(await css(field, 'background-image')).not.toBe(fill);
  expect(await css(tray(xray), 'background-image')).not.toBe(bench);
});

test('layers: each switch lights its slice on the bench and removes it from both', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  for (const name of ['Tray fill', 'Inner shadow', 'Key fill', 'Drop']) {
    const row = card.locator('.ed-layer').filter({ hasText: name });
    const look = () => card.locator('.ed-specimen').evaluate((el) => [...el.querySelectorAll<HTMLElement>('.mu-field, .mu-kbd')].map((x) => `${getComputedStyle(x).backgroundImage}|${getComputedStyle(x).boxShadow}`).join(';'));
    const before = await look();
    await row.hover();
    await expect(xray.locator('.xr-face.is-layer.is-focus')).toHaveCount(1);
    await row.getByRole('switch').click();
    await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(await look()).not.toBe(before);
    await expect(xray.locator('.xr-face.is-layer.is-off')).toHaveCount(1);
    await row.getByRole('switch').click();
  }
});

test('readouts scrub by drag and arrow keys; a focused handle shows its hint', async ({ page }) => {
  const xray = await open(page, 'bone'), card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const readout = card.locator('.ed-readout').filter({ hasText: 'Space on the left' });
  const before = await value(card, 'Space on the left').textContent();
  await drag(page, readout, 0, -24);
  const after = await value(card, 'Space on the left').textContent();
  expect(after).not.toBe(before);
  await expect(card.locator('.mu-field')).toHaveCSS('padding-left', `${after}px`);
  await readout.focus(); await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Space on the left')).toHaveText(`${Number(after) - 1}`);
  const height = card.getByRole('slider', { name: 'Height' });
  const h0 = await now(height);
  await height.focus();
  await expect(page.locator('.ed-tag')).toContainText('Height');
  await page.keyboard.press('ArrowUp');
  await expect(value(card, 'Height')).toHaveText(`${h0 + 1}`);
});

test('375 px graphite field cards have no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await open(page, 'graphite');
  for (const name of CALLOUTS) {
    await part(xray, name);
    await expect(xray.locator('.xr-card .ed-specimen .mu-field')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
