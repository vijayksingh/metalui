import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`a committed edit retains one complete receipt in ${colorway}`, async ({ page }) => {
    await open(page, '/icons#confirmation', colorway);
    const key = page.getByTestId('confirmation-glyph');
    await expect(key).toHaveAccessibleName('Spark: committed edit');
    await key.hover();
    await expect(key.locator('[data-playing]')).toHaveCount(3);
    await expect(key.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
    await key.focus();
    await page.keyboard.press('Enter');
    await expect(key.locator('[data-playing]')).toHaveCount(3);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(key.locator('[data-playing]')).toHaveCount(0);
    await expect(key.locator('svg')).toHaveCount(3);
    for (const size of [14, 16, 24]) {
      const glyph = key.locator(`svg[width="${size}"]`);
      await expect(glyph.locator('path')).toHaveAttribute('d', /4\.5.*Z$/);
    }
    await page.mouse.move(0, 0);
    await key.screenshot({ path: capture(`icon-spark-${colorway}-reduced`) });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(key.locator('[data-playing]')).toHaveCount(0);
    await key.screenshot({ path: capture(`icon-spark-${colorway}`) });
    const compact = await page.request.get('/icons/svg/16/spark.svg');
    expect(compact.ok()).toBeTruthy();
    expect(await compact.text()).toContain('1.85');
  });
}
