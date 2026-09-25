import { expect, test, type Locator, type Page } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

// An icon with a motion study plays one act (docs/ICON-MOTION.md): hover the control and every
// part moves on one clock, the act finishes after the pointer leaves, and it ends exactly at rest.
// Select is the first icon on the engine.
const REST = 'none';
const transformOf = (part: Locator) => part.evaluate((el) => getComputedStyle(el).transform);
const running = (part: Locator) => part.evaluate((el) => el.getAnimations().filter((a) => a.playState === 'running').length);
const selectKey = (page: Page) => page.locator('button', { has: page.locator('svg.mu-ic-select') }).first();

for (const colorway of COLORWAYS) {
  test(`select plays its act through once from a hover in ${colorway}`, async ({ page }) => {
    await open(page, '/icons', colorway);
    const key = selectKey(page);
    const cursor = key.locator('[data-part="cursor"]');
    const click = key.locator('[data-part="click"]');
    expect(await transformOf(cursor)).toBe(REST);

    await key.hover();
    await page.waitForTimeout(320);
    expect(await transformOf(cursor)).not.toBe(REST);
    expect(Number(await click.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.3);

    // Leaving does not cut the act short.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    expect(await running(cursor)).toBe(1);

    // It ends at rest, released, with the accent hidden.
    await expect.poll(() => running(cursor), { timeout: 2000 }).toBe(0);
    expect(await transformOf(cursor)).toBe(REST);
    expect(await click.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await expect(key.locator('svg.mu-ic-select')).not.toHaveAttribute('data-playing');
  });
}

test('a trigger during the act does not restart it', async ({ page }) => {
  await open(page, '/icons', 'bone');
  const key = selectKey(page);
  const cursor = key.locator('[data-part="cursor"]');
  await key.hover();
  await page.waitForTimeout(200);
  const before = await cursor.evaluate((el) => el.getAnimations()[0]?.currentTime);
  await key.click();
  const after = await cursor.evaluate((el) => el.getAnimations()[0]?.currentTime);
  expect(Number(after)).toBeGreaterThanOrEqual(Number(before));
});

test('keyboard focus plays the act', async ({ page }) => {
  await open(page, '/icons', 'bone');
  const key = selectKey(page);
  await key.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect.poll(() => running(key.locator('[data-part="cursor"]'))).toBe(1);
});

test('the act stays still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons', 'bone');
  const key = selectKey(page);
  const cursor = key.locator('[data-part="cursor"]');
  await key.hover();
  await page.waitForTimeout(300);
  expect(await running(cursor)).toBe(0);
  expect(await transformOf(cursor)).toBe(REST);
});

test('the standalone SVG plays the same act without script', async ({ page }) => {
  const svg = await (await page.request.get('/icons/svg-animated/select.svg')).text();
  await page.setContent(`<div style="padding:40px">${svg}</div>`);
  const icon = page.locator('svg.mu-icon');
  const cursor = icon.locator('[data-part="cursor"]');
  expect(await transformOf(cursor)).toBe(REST);
  await icon.hover();
  await page.waitForTimeout(320);
  expect(await transformOf(cursor)).not.toBe(REST);
});
