import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Lens bar: names the question, counts, says the source; switches views; close ends it.
for (const colorway of COLORWAYS) {
  test(`switch views and close a lens in ${colorway}`, async ({ page }) => {
    await open(page, '/components/lens-bar', colorway);
    const bar = page.getByRole('toolbar', { name: 'Lens: open tasks about the poster' });
    await expect(bar).toContainText('open tasks about the poster');
    await expect(bar).toContainText('6');
    const views = bar.getByRole('radiogroup', { name: 'View' });
    await views.getByRole('radio').nth(1).click();
    await expect(views.getByRole('radio').nth(1)).toBeChecked();
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`lens-bar-${colorway}`) });
    await bar.getByRole('button', { name: 'Close lens' }).click();
    await expect(bar).toHaveCount(0);
    await expect(page.getByText('Closed. Use Open again')).toBeVisible();
    // A selection lens has no pin; the me lens has no views.
    await expect(page.getByRole('toolbar', { name: 'Lens: me' }).getByRole('radiogroup')).toHaveCount(0);
  });
}
