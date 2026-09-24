import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// LEDs, status badges and keycaps: the state is in words for assistive tech, and a key speaks its name.
for (const colorway of COLORWAYS) {
  test(`status and keys read as words in ${colorway}`, async ({ page }) => {
    await open(page, '/components/status', colorway);
    const badges = page.getByRole('status');
    expect(await badges.count()).toBeGreaterThan(0);
    await expect(badges.first()).not.toHaveText('');
    await page.locator('section', { hasText: 'LEDs and badges' }).first().screenshot({ path: capture(`status-${colorway}`) });
    await open(page, '/components/kbd', colorway);
    await expect(page.locator('kbd[aria-label="Command K"]').first()).toBeVisible();
    await page.locator('section', { hasText: 'Where keys sit' }).first().screenshot({ path: capture(`kbd-${colorway}`) });
  });
}
