import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Dialog commits a canvas name, traps focus, refuses pending dismissal and supports Undo in ${colorway}`, async ({ page }) => {
    await open(page, '/components/dialog', colorway);
    const host = page.getByTestId('rename-canvas');
    const trigger = host.getByRole('button', { name: 'Rename canvas…', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Rename canvas', exact: true });
    const input = dialog.getByRole('textbox', { name: 'Name', exact: true });
    await expect(input).toBeFocused();
    expect(await input.evaluate((el: HTMLInputElement) => el.value.substring(el.selectionStart!, el.selectionEnd!))).toBe('Trip notes');
    await input.fill('Taken'); await expect(dialog).toContainText('That name is taken.');
    await expect(dialog.getByRole('button', { name: 'Rename', exact: true })).toBeDisabled();
    await input.fill('Lisbon');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement)), { intervals: [25] }).toBe(true);
    }
    await input.press('Enter');
    await expect(input).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.locator('[data-glyph="check"]').isVisible(), { intervals: [50] }).toBe(true);
    await page.waitForTimeout(450);
    await dialog.screenshot({ path: capture(`dialog-rename-${colorway}`) });
    await expect(dialog).toBeHidden();
    await expect(host.locator('[data-name]')).toHaveText('Lisbon');
    await expect(host).toHaveAttribute('data-requests', '1');
    await expect(trigger).toBeFocused();
    await page.getByRole('button', { name: /Undo/ }).click();
    await expect(host.locator('[data-name]')).toHaveText('Trip notes');
  });
}

test('Dialog Escape cancels an idle draft and returns to its opener under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/dialog', 'graphite');
  const host = page.getByTestId('rename-canvas');
  const trigger = host.getByRole('button', { name: 'Rename canvas…', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Rename canvas', exact: true });
  await dialog.getByRole('textbox').fill('Uncommitted');
  await dialog.screenshot({ path: capture('dialog-rename-reduced') });
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  await expect(host.locator('[data-name]')).toHaveText('Trip notes');
  await expect(host).toHaveAttribute('data-requests', '0'); await expect(trigger).toBeFocused();
});
