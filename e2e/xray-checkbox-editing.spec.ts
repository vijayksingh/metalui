import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { COLORWAYS } from './helpers';

const recipe = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8')).recipes.checkbox;
const sizes = [recipe.props.row.size, recipe.props.self.size];

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
/** The model's face on the bench: the real checkbox, which every handle must change along with the specimen. */
const bench = (xray: Locator) => xray.locator('.xr-segface.is-top .mu-dimple');

async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((name) => localStorage.setItem('metalui:colorway', name), colorway);
  await page.goto('/components/checkbox');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}

async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

for (const colorway of COLORWAYS) {
  test(`every checkbox card holds the real component without old controls in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of ['States', 'Tick', 'Shape', 'Well', 'Light', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-dimple')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial, .mu-switcher')).toHaveCount(0);
    }
  });
}

test('state and size handles lean, then snap to real options on specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  const state = card.getByRole('slider', { name: 'State' });
  const options = ['Rest', 'Hover', 'Done', 'Doing', 'Suggested'];
  const before = await state.getAttribute('aria-valuetext');
  expect(options).toContain(before);
  const fill = await bench(xray).evaluate((el) => getComputedStyle(el).backgroundImage);
  const specimenFill = await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).backgroundImage);
  await drag(page, state, 0, 6);
  await expect(state).toHaveAttribute('aria-valuetext', before!);
  await drag(page, state, 0, 19);
  const after = await state.getAttribute('aria-valuetext');
  expect(options).toContain(after);
  expect(after).not.toBe(before);
  expect(await bench(xray).evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe(fill);
  expect(await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe(specimenFill);

  await part(xray, 'Shape');
  const size = card.getByRole('slider', { name: 'Size' });
  const initialSize = Number(await size.getAttribute('aria-valuenow'));
  expect(sizes).toContain(initialSize);
  const benchWidth = await xray.locator('.xr-scene').evaluate((el) => (el as HTMLElement).style.width);
  await drag(page, size, 0, initialSize === sizes[1] ? 19 : -19);
  const nextSize = Number(await size.getAttribute('aria-valuenow'));
  expect(sizes).toContain(nextSize);
  expect(nextSize).not.toBe(initialSize);
  await expect(card.locator('.mu-dimple')).toHaveCSS('width', `${nextSize}px`);
  expect(await xray.locator('.xr-scene').evaluate((el) => (el as HTMLElement).style.width)).not.toBe(benchWidth);
});

test('corners, tick, depth and light handles change specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const specimen = card.locator('.mu-dimple');
  const corner0 = await specimen.evaluate((el) => getComputedStyle(el).borderRadius);
  const benchCorner0 = await bench(xray).evaluate((el) => getComputedStyle(el).borderRadius);
  await drag(page, card.getByRole('slider', { name: 'Corners' }), -12, -12);
  await expect.poll(() => specimen.evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe(corner0);
  expect(await bench(xray).evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe(benchCorner0);

  await part(xray, 'Tick');
  const angle = card.getByRole('slider', { name: 'Tick angle' });
  const oldAngle = Number(await angle.getAttribute('aria-valuenow'));
  const oldTick = await xray.locator('.xr-segface.is-top .mu-dimple-tick').evaluate((el) => getComputedStyle(el).transform);
  const oldSpecimenTick = await card.locator('.mu-dimple-tick').evaluate((el) => getComputedStyle(el).transform);
  await drag(page, angle, 18, 0);
  expect(Number(await angle.getAttribute('aria-valuenow'))).not.toBe(oldAngle);
  expect(await xray.locator('.xr-segface.is-top .mu-dimple-tick').evaluate((el) => getComputedStyle(el).transform)).not.toBe(oldTick);
  expect(await card.locator('.mu-dimple-tick').evaluate((el) => getComputedStyle(el).transform)).not.toBe(oldSpecimenTick);

  await part(xray, 'Well');
  const wellShadow = await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).boxShadow);
  const benchShadow = await bench(xray).evaluate((el) => getComputedStyle(el).boxShadow);
  await drag(page, card.getByRole('slider', { name: 'Well depth' }), 0, 18);
  expect(await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(wellShadow);
  expect(await bench(xray).evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(benchShadow);

  await part(xray, 'Light');
  const lightFill = await bench(xray).evaluate((el) => getComputedStyle(el).backgroundImage);
  const specimenFill = await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).backgroundImage);
  await drag(page, card.getByRole('slider', { name: 'Light' }), 28, 3);
  expect(await bench(xray).evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe(lightFill);
  expect(await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).backgroundImage)).not.toBe(specimenFill);
});

test('readout scrubs by drag and arrows; focused handle shows its hint', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const readout = card.locator('.ed-readout').filter({ hasText: 'Corners' });
  const initial = await value(card, 'Corners').textContent();
  await drag(page, readout, 0, -24);
  expect(await value(card, 'Corners').textContent()).not.toBe(initial);
  const afterDrag = await value(card, 'Corners').textContent();
  await readout.focus();
  await page.keyboard.press('ArrowDown');
  expect(await value(card, 'Corners').textContent()).not.toBe(afterDrag);
  await card.getByRole('slider', { name: 'Corners' }).focus();
  await expect(page.locator('.ed-tag')).toContainText('Corners');
});

test('layer switch removes same layer from specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Layers');
  const specimenShadow = await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).boxShadow);
  const layer = card.getByRole('switch', { name: 'Inner shadow' });
  await layer.hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus')).toHaveCount(1);
  await layer.click();
  await expect(layer).toHaveAttribute('aria-checked', 'false');
  expect(await card.locator('.mu-dimple').evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(specimenShadow);
  await expect(xray.locator('.xr-face.is-layer').nth(1)).toHaveClass(/is-off/);
});

test('narrow graphite card fits without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const xray = await openDocs(page, 'graphite');
  for (const name of ['States', 'Tick', 'Shape', 'Well', 'Light', 'Layers']) {
    await part(xray, name);
    await expect(xray.locator('.xr-card .ed-specimen .mu-dimple')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
