import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`visible switch label is one hit area in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/switch', colorway);
    const labels = page.locator('#labels');
    const control = labels.getByRole('switch', { name: 'Sync this canvas', exact: true });
    await expect(control).toBeChecked();
    await labels.getByText('Sync this canvas', { exact: true }).click();
    await expect(control).not.toBeChecked();
    await control.focus();
    await page.keyboard.press('Space');
    await expect(control).toBeChecked();
    const disabled = labels.getByRole('switch', { name: 'Share automatically', exact: true });
    await expect(disabled).toBeDisabled();
    await labels.getByText('Share automatically', { exact: true }).click({ force: true });
    await expect(disabled).not.toBeChecked();
    await control.focus();
    await page.keyboard.press('Tab');
    await expect(labels.locator(':focus')).toHaveCount(0);
  });
}
