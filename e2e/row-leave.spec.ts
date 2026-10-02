import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`row leaves once, cancels, and follows reduced motion in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => localStorage.setItem('metalui:motion', 'on'));
    await open(page, '/foundations/motion#row-leave', colorway);
    const demo = page.getByTestId('row-leave-demo');
    const row = demo.getByRole('group', { name: 'Lisbon export' });
    const remove = demo.getByRole('button', { name: 'Remove row' });
    await remove.click();
    await expect(demo.getByRole('status')).toContainText('Leaving');
    await demo.getByRole('button', { name: 'Keep row' }).click();
    await expect(row).toBeVisible();
    await expect(demo.getByRole('status')).toHaveText('Row ready · 0 removed');
    await remove.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(row).toHaveCount(0);
    await expect(demo.getByRole('status')).toHaveText('Row removed · 1 removed');

    await demo.getByRole('button', { name: 'Restore row' }).click();
    await remove.click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(row).toHaveCount(0);
    await expect(demo.getByRole('status')).toHaveText('Row removed · 2 removed');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await demo.getByRole('switch', { name: 'Reduce row motion' }).click();
    await demo.getByRole('button', { name: 'Restore row' }).click();
    await remove.click();
    await expect(row).toHaveCount(0);
    await expect(demo.getByRole('status')).toHaveText('Row removed · 3 removed');
  });
}
