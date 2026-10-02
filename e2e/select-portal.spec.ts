import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Select keeps scoped colorway and keyboard selection on ${colorway}`, async ({ page }) => {
    await open(page, '/components/select#portal', colorway);
    const host = page.getByTestId('scoped-select');
    const trigger = host.getByRole('combobox', { name: 'Scoped icon' });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const list = page.getByRole('listbox');
    const positioner = list.locator('..');
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'graphite');
    expect(await list.evaluate(el => !el.closest('[data-testid="scoped-select"]'))).toBe(true);
    const ink = await list.getByRole('option').first().evaluate(el => getComputedStyle(el).color);
    await host.evaluate(el => el.setAttribute('data-mu-colorway', 'bone'));
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'bone');
    expect(await list.getByRole('option').first().evaluate(el => getComputedStyle(el).color)).not.toBe(ink);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(list).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText('Check');
    await trigger.click();
    await expect(list).toBeVisible();
    await list.screenshot({ path: capture(`select-scoped-${colorway}`) });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
}
