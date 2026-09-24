import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The product set with the medium's chrome glyphs (import plan §3.7): each is on the Icons page,
// plays its hover pose from its key, and stays still under reduced motion.
const CHROME = ['plus', 'region', 'task', 'tag', 'calendar', 'document', 'clock', 'me', 'seed'];

for (const colorway of COLORWAYS) {
  test(`chrome glyphs in ${colorway}`, async ({ page }) => {
    await open(page, '/icons', colorway);
    for (const name of CHROME) await expect(page.locator(`svg.mu-ic-${name}`).first()).toBeVisible();
    const key = page.locator('button', { has: page.locator('svg.mu-ic-plus') }).first();
    const arm = key.locator('.pa').first();
    const rest = await arm.evaluate((el) => getComputedStyle(el).transform);
    await key.hover();
    await page.waitForTimeout(600);
    expect(await arm.evaluate((el) => getComputedStyle(el).transform)).not.toBe(rest);
    await page.locator('section').first().screenshot({ path: capture(`icons-${colorway}`) });
  });
}

test('chrome glyphs stay still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons', 'bone');
  const key = page.locator('button', { has: page.locator('svg.mu-ic-plus') }).first();
  const arm = key.locator('.pa').first();
  const rest = await arm.evaluate((el) => getComputedStyle(el).transform);
  await key.hover();
  await page.waitForTimeout(300);
  expect(await arm.evaluate((el) => getComputedStyle(el).transform)).toBe(rest);
});
