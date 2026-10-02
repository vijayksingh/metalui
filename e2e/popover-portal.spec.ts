import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Popover follows active scoped trigger and live theme on ${colorway}`, async ({ page }) => {
    await open(page, '/components/popover#portal', colorway);
    const host = page.getByTestId('scoped-popover');
    const trigger = host.getByRole('button', { name: 'Scoped panel', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Host colorway' });
    const positioner = panel.locator('..');
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'graphite');
    expect(await panel.evaluate(el => !el.closest('[data-testid="scoped-popover"]'))).toBe(true);
    const title = panel.getByRole('heading');
    const ink = await title.evaluate(el => getComputedStyle(el).color);
    await panel.getByRole('button', { name: 'Change host colorway' }).click();
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'bone');
    expect(await title.evaluate(el => getComputedStyle(el).color)).not.toBe(ink);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await host.evaluate(el => el.setAttribute('data-mu-colorway', 'graphite'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const nested = host.getByRole('button', { name: 'Nested bone panel' });
    await nested.click();
    await expect(positioner).toHaveAttribute('data-mu-colorway', 'bone');
    await expect(panel.getByRole('button', { name: 'Change host colorway' })).toBeFocused();
    await panel.screenshot({ path: capture(`popover-scoped-${colorway}`) });
    await page.keyboard.press('Escape');
    await expect(nested).toBeFocused();
  });
}
