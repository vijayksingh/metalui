import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`rename preserves draft, validates, commits once and Undo restores original in ${colorway}`, async ({ page }) => {
    await open(page, '/components/rename-editor', colorway);
    const host = page.getByTestId('rename-region');
    await host.getByRole('button', { name: 'Rename…', exact: true }).click();
    const popup = page.getByRole('dialog', { name: 'Rename region' });
    const field = popup.getByRole('textbox', { name: 'Region name' });
    await expect(field).toBeFocused();
    expect(await field.evaluate((node: HTMLInputElement) => node.value.substring(node.selectionStart!, node.selectionEnd!))).toBe('Trip to Lisbon');
    const confirm = popup.getByRole('button', { name: 'Rename', exact: true });
    await expect(confirm).toBeDisabled();
    await field.fill(''); await expect(confirm).toBeDisabled();
    await field.fill('Taken'); await expect(confirm).toBeDisabled();
    await expect(popup).toContainText('That name is taken.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await field.fill('x'.repeat(41)); await expect(confirm).toBeDisabled();
    await expect(popup).toContainText('Keep the name to 40 characters.');
    await field.fill('Lisbon');
    await field.press('Enter');
    await expect(field).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(popup).toBeVisible();
    await expect.poll(() => popup.getByRole('button', { name: 'Renaming…', exact: true }).getAttribute('aria-busy'), { intervals: [50] }).toBe('true');
    await page.mouse.click(5, 5); await expect(popup).toBeVisible();
    await expect(host).toHaveAttribute('data-requests', '1');
    await expect.poll(() => popup.getByRole('button', { name: 'Renamed', exact: true }).isVisible(), { intervals: [50] }).toBe(true);
    await expect(popup.locator('[data-glyph="check"]')).toBeVisible();
    await page.waitForTimeout(450);
    await popup.screenshot({ path: capture(`rename-result-${colorway}`) });
    await expect(popup).toBeHidden();
    await expect(host.locator('[data-name]')).toHaveText('Lisbon');
    await expect(host.getByRole('button', { name: 'Rename…', exact: true })).toBeFocused();
    await page.getByRole('button', { name: /Undo/ }).click();
    await expect(host.locator('[data-name]')).toHaveText('Trip to Lisbon');
  });
}

test('file selection keeps only a final extension; dotfiles stay whole; Cancel changes nothing', async ({ page }) => {
  await open(page, '/components/rename-editor', 'bone');
  for (const [id, selected] of [['rename-file', 'report.final'], ['rename-dotfile', '.env']]) {
    const host = page.getByTestId(id);
    await host.getByRole('button').click();
    const popup = page.getByRole('dialog', { name: 'Rename file' });
    const field = popup.getByRole('textbox');
    await expect(field).toBeFocused();
    expect(await field.evaluate((node: HTMLInputElement) => node.value.substring(node.selectionStart!, node.selectionEnd!))).toBe(selected);
    await field.fill('Draft'); await popup.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(popup).toBeHidden(); await expect(host).toHaveAttribute('data-requests', '0');
  }
});

test('failed storage keeps the edit open, names failure and retries the same draft', async ({ page }) => {
  await open(page, '/components/rename-editor', 'graphite');
  // DialKit is the real page control; change the fixture's failure branch.
  if (await page.locator('.dialkit-panel-inner[data-collapsed="true"]').count()) await page.locator('.dialkit-panel-inner[data-collapsed="true"]').first().click();
  const fail = page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: /^fail$/i }) });
  await fail.getByRole('button', { name: 'On', exact: true }).click();
  const host = page.getByTestId('rename-region');
  await host.getByRole('button').click();
  const popup = page.getByRole('dialog', { name: 'Rename region' });
  const field = popup.getByRole('textbox');
  await field.fill('Lisbon'); await field.press('Enter');
  await expect(popup).toContainText('Could not rename. Try again.');
  await expect(field).toBeEnabled(); await expect(field).toHaveValue('Lisbon');
  await expect(popup.locator('[data-glyph="sync-error"]')).toBeVisible();
  await popup.screenshot({ path: capture('rename-error-graphite') });
  await popup.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(host).toHaveAttribute('data-requests', '2');
  await expect(popup).toBeHidden(); await expect(host.locator('[data-name]')).toHaveText('Lisbon');
});

test('reduced motion retains selection, visible result and Undo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/rename-editor', 'bone');
  const host = page.getByTestId('rename-region');
  await host.getByRole('button').click();
  const popup = page.getByRole('dialog', { name: 'Rename region' });
  await popup.getByRole('textbox').fill('Lisbon');
  await popup.getByRole('textbox').press('Enter');
  await expect.poll(() => popup.getByRole('button', { name: 'Renamed', exact: true }).isVisible(), { intervals: [50] }).toBe(true);
  await popup.screenshot({ path: capture('rename-reduced') });
  await expect(popup).toBeHidden();
  await page.getByRole('button', { name: /Undo/ }).click();
  await expect(host.locator('[data-name]')).toHaveText('Trip to Lisbon');
});
