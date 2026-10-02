import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`a navigation panel retains its enclosure while becoming a rail in ${colorway}`, async ({ page }) => {
    await open(page, '/icons#sidebar-panels', colorway);
    const family = page.getByTestId('sidebar-glyph-family');
    const key = family.getByRole('button');
    await expect(key).toHaveAttribute('aria-expanded', 'true');
    await key.click();
    await expect(key).toHaveAccessibleName('Expand navigation panel');
    await page.waitForTimeout(600);
    await expect(key.locator('[data-glyph]')).toHaveAttribute('data-glyph', 'sidebar-collapsed');
    await family.screenshot({ path: capture(`icon-sidebar-${colorway}`) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await key.press('Enter');
    await expect(key).toHaveAccessibleName('Collapse navigation panel');
    await expect(key.locator('svg path').nth(1)).toHaveAttribute('d', /^M9\.2 5\.5/);
    await expect(key.locator('[data-glyph]')).toHaveAttribute('data-glyph', 'sidebar');
    await family.screenshot({ path: capture(`icon-sidebar-${colorway}-reduced`) });
  });
}
