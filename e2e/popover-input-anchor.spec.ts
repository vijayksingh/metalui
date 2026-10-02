import { test, expect } from '@playwright/test';
import { COLORWAYS, open } from './helpers';
for (const colorway of COLORWAYS) test(`direct input anchor retains scope, geometry and focus on ${colorway}`, async ({ page }) => {
  await open(page, '/components/popover#input-anchor', colorway);
  const host = page.getByTestId('input-anchored-popover');
  const input = host.getByRole('textbox', { name: 'Anchored input' });
  await input.focus(); await input.press('Alt+ArrowDown');
  const panel = page.getByRole('dialog', { name: 'Input anchor' });
  await expect(panel).toBeVisible();
  await expect(panel.locator('..')).toHaveAttribute('data-mu-colorway', 'graphite');
  const box = await input.boundingBox(), popup = await panel.boundingBox();
  expect(Math.abs(popup!.x - box!.x)).toBeLessThan(2);
  await panel.getByRole('button', { name: 'Change input colorway' }).click();
  await expect(panel.locator('..')).toHaveAttribute('data-mu-colorway', 'bone');
  await page.keyboard.press('Escape'); await expect(panel).toHaveCount(0); await expect(input).toBeFocused();
  await expect(host.getByRole('button')).toHaveCount(0);
});
