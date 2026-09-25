import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Every product glyph is on the Icons page and plays its act (docs/ICON-MOTION.md) from its key,
// and none moves under reduced motion.
const keys = (page: import('@playwright/test').Page) =>
  page.locator('section').first().locator('button.mu-icon-trigger', { has: page.locator('svg.mu-icon') });

for (const colorway of COLORWAYS) {
  test(`every glyph plays its act from its key in ${colorway}`, async ({ page }) => {
    await open(page, '/icons', colorway);
    const all = keys(page);
    const count = await all.count();
    expect(count).toBeGreaterThanOrEqual(47);
    for (let i = 0; i < count; i++) {
      const key = all.nth(i);
      const svg = key.locator('svg.mu-icon');
      await key.hover();
      await expect(svg, `${await svg.getAttribute('class')} did not play`).toHaveAttribute('data-playing', '');
      await page.mouse.move(0, 0);
    }
    await page.waitForTimeout(1600); // every act back at rest
    await page.locator('section').first().screenshot({ path: capture(`icons-${colorway}`) });
  });
}

test('no glyph moves under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons', 'bone');
  const all = keys(page);
  for (let i = 0; i < 6; i++) {
    const key = all.nth(i);
    await key.hover();
    await page.waitForTimeout(150);
    await expect(key.locator('svg.mu-icon')).not.toHaveAttribute('data-playing', '');
    expect(await key.locator('[data-part]').evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)).toBe(0);
  }
});
