import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Tooltip: after 120 ms a control names itself and its key; within a group the next one shows at once;
// keyboard focus shows it too; it never takes the pointer.
for (const colorway of COLORWAYS) {
  test(`hover, glide and focus in ${colorway}`, async ({ page }) => {
    await open(page, '/components/tooltip', colorway);
    const tip = page.locator('.mu-tooltip');
    await page.getByRole('button', { name: 'Select', exact: true }).hover();
    await page.waitForTimeout(40);
    await expect(tip).toHaveCount(0);
    await expect(tip).toHaveText('Select · V');
    await expect(tip.locator('.mu-tooltip-key')).toHaveText(' · V');
    expect(await tip.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    await page.getByRole('button', { name: 'Region', exact: true }).hover();
    await page.waitForTimeout(30);
    await expect(tip).toHaveText('Region · R');
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`tooltip-${colorway}`) });
    await page.mouse.move(0, 0);
    await expect(tip).toHaveCount(0);
    await page.getByRole('button', { name: 'Close', exact: true }).focus();
    await expect(tip).toHaveText('Close · ⎋');
  });
}
