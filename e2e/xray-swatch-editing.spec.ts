import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS } from './helpers';

const part = (xray: Locator, name: string) => xray.locator(`.xr-callout[aria-label^="${name}"]`).click();
const value = (card: Locator, name: string) => card.locator('.ed-readout').filter({ hasText: name }).locator('.ed-roll > span:not(.is-out)');
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}
async function openDocs(page: Page, colorway: string) {
  await page.addInitScript((c) => localStorage.setItem('metalui:colorway', c), colorway);
  await page.goto('/components/swatch');
  const xray = page.locator('#x-ray .xr');
  await xray.getByRole('button', { name: 'X-ray' }).click();
  return xray;
}
const style = (target: Locator, name: string) => target.evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), name);

for (const colorway of COLORWAYS) {
  test(`each Swatch callout holds a real chip and no old controls in ${colorway}`, async ({ page }) => {
    const xray = await openDocs(page, colorway);
    const card = xray.locator('.xr-card');
    for (const name of ['Shape', 'Type', 'Light', 'Dimple', 'Shadow', 'Layers']) {
      await part(xray, name);
      await expect(card.locator('.ed-specimen .mu-swatch')).toHaveCount(1);
      await expect(card.locator('.mu-slider, .xr-dial')).toHaveCount(0);
    }
    // Swatch has one recipe size and no size, kind, surface or state variants to step between.
    await part(xray, 'Shape');
    await expect(card.getByRole('slider', { name: 'Size' })).not.toHaveAttribute('aria-valuetext', /compact|regular|small/);
  });
}

test('shape handles tune the real chip and the bench, with recipe tokens at rest', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  await part(xray, 'Shape');
  const card = xray.locator('.xr-card');
  const specimen = card.locator('.mu-swatch');
  const face = xray.locator('.xr-segface .mu-swatch');
  const size0 = await style(specimen, 'width');
  const benchSize0 = await style(face, 'width');
  const sizeHandle = card.getByRole('slider', { name: 'Size' });
  const sizeStart = Number(await sizeHandle.getAttribute('aria-valuenow'));
  await drag(page, sizeHandle, 0, -30);
  await expect(sizeHandle).not.toHaveAttribute('aria-valuenow', `${sizeStart}`);
  expect(await style(specimen, 'width')).not.toBe(size0);
  expect(await style(face, 'width')).not.toBe(benchSize0);
  const cornerHandle = card.getByRole('slider', { name: 'Corners' });
  const radius0 = await style(specimen, 'border-radius');
  const benchRadius0 = await style(face, 'border-radius');
  await drag(page, cornerHandle, -24, -24);
  expect(await style(specimen, 'border-radius')).not.toBe(radius0);
  expect(await style(face, 'border-radius')).not.toBe(benchRadius0);
  // a keyboard user: focus the handle and press an arrow; its hint shows above the chip
  await sizeHandle.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.ed-tag')).toContainText('Size');
});

test('colour, light, dimple and shadow handles change specimen and bench', async ({ page }) => {
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  await part(xray, 'Type');
  const chip = card.locator('.mu-swatch');
  const colour0 = await chip.getAttribute('aria-label');
  await drag(page, card.getByRole('slider', { name: 'Colour' }), 35, 0);
  await expect(chip).not.toHaveAttribute('aria-label', colour0!);
  await expect(xray.locator('.xr-segface .mu-swatch')).toHaveAttribute('aria-label', (await chip.getAttribute('aria-label'))!);
  await part(xray, 'Light');
  const specimenFill0 = await style(card.locator('.mu-swatch'), 'background-image');
  const benchFill0 = await style(xray.locator('.xr-segface .mu-swatch'), 'background-image');
  await drag(page, card.getByRole('slider', { name: 'Light' }), 30, 0);
  expect(await style(card.locator('.mu-swatch'), 'background-image')).not.toBe(specimenFill0);
  expect(await style(xray.locator('.xr-segface .mu-swatch'), 'background-image')).not.toBe(benchFill0);
  await part(xray, 'Dimple');
  const dimple0 = await style(card.locator('.mu-swatch-led'), 'width');
  const modelDimple0 = await style(xray.locator('.xr-segface .mu-swatch-led'), 'width');
  await drag(page, card.getByRole('slider', { name: 'Dimple' }), 25, 0);
  expect(await style(card.locator('.mu-swatch-led'), 'width')).not.toBe(dimple0);
  expect(await style(xray.locator('.xr-segface .mu-swatch-led'), 'width')).not.toBe(modelDimple0);
  await part(xray, 'Shadow');
  const specimenShadow0 = await style(card.locator('.mu-swatch'), 'box-shadow');
  const modelShadow0 = await xray.locator('.xr-shadow').first().evaluate((el) => (el as HTMLElement).style.filter);
  await drag(page, card.getByRole('slider', { name: 'Shadow blur' }), 0, -28);
  expect(await style(card.locator('.mu-swatch'), 'box-shadow')).not.toBe(specimenShadow0);
  expect(await xray.locator('.xr-shadow').first().evaluate((el) => (el as HTMLElement).style.filter)).not.toBe(modelShadow0);
});

test('readouts scrub by drag and arrows; layer switches affect chip and bench', async ({ page }) => {
  const xray = await openDocs(page, 'bone');
  const card = xray.locator('.xr-card');
  await part(xray, 'Shape');
  const size = card.getByRole('slider', { name: 'Size' });
  const start = Number(await size.getAttribute('aria-valuenow'));
  await drag(page, card.locator('.ed-readout').filter({ hasText: 'Size' }), 0, -24);
  expect(Number(await size.getAttribute('aria-valuenow'))).toBeGreaterThan(start);
  const corners = card.locator('.ed-readout').filter({ hasText: 'Corners' });
  const before = await value(card, 'Corners').textContent();
  await corners.focus();
  await page.keyboard.press('ArrowDown');
  await expect(value(card, 'Corners')).not.toHaveText(before!);
  await part(xray, 'Layers');
  const drop = card.getByRole('switch', { name: 'Coloured drop' });
  const chipShadow0 = await style(card.locator('.mu-swatch'), 'box-shadow');
  await drop.click();
  await expect(drop).toHaveAttribute('aria-checked', 'false');
  expect(await style(card.locator('.mu-swatch'), 'box-shadow')).not.toBe(chipShadow0);
  await expect(xray.locator('.xr-face.is-layer.is-off').filter({ hasText: 'Coloured drop' })).toHaveCount(1);
  await card.locator('.ed-layer').filter({ hasText: 'Shine' }).hover();
  await expect(xray.locator('.xr-face.is-layer.is-focus').filter({ hasText: 'Shine' })).toHaveCount(1);
});

test('375 px graphite card fits without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const xray = await openDocs(page, 'graphite');
  const card = xray.locator('.xr-card');
  for (const name of ['Shape', 'Type', 'Light', 'Dimple', 'Shadow', 'Layers']) {
    await part(xray, name);
    await expect(card.locator('.ed-specimen .mu-swatch')).toHaveCount(1);
    await expect(page.evaluate(() => document.documentElement.scrollWidth)).resolves.toBeLessThanOrEqual(375);
  }
});
