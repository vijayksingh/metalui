import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`trigger and context menus follow scoped colorway on ${colorway}`, async ({ page }) => {
    await open(page, '/components/menu#portal', colorway);
    const host = page.getByTestId('scoped-menu');
    const trigger = host.getByRole('button', { name: 'Scoped actions' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    const positioner = menu.locator('..');
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'graphite');
    expect(await menu.evaluate(el => !el.closest('[data-testid="scoped-menu"]'))).toBe(true);
    const row = menu.getByRole('menuitem');
    const graphite = await row.evaluate(el => getComputedStyle(el).color);
    await host.evaluate(el => el.setAttribute('data-mu-colorway', 'bone'));
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'bone');
    expect(await row.evaluate(el => getComputedStyle(el).color)).not.toBe(graphite);
    await page.keyboard.press('Enter');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(host.getByRole('status')).toHaveText('Duplicated');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await host.getByRole('button', { name: 'Scoped context target' }).click({ button: 'right' });
    await expect(menu).toBeVisible();
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'bone');
    await host.evaluate(el => el.setAttribute('data-mu-colorway', 'graphite'));
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'graphite');
    await menu.screenshot({ path: capture(`menu-scoped-${colorway}`) });
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
  });
}
