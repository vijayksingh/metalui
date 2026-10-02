import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Save region commits validated fields once, locks only the form, settles a result and captures Undo in ${colorway}`, async ({ page }) => {
    await open(page, '/components/form-field', colorway);
    const form = page.getByTestId('save-region');
    const name = form.getByRole('textbox', { name: 'Region name' });
    await name.fill('Lisbon'); await form.getByRole('textbox', { name: 'Notes' }).fill('Bring the tram map.');
    await form.getByRole('button', { name: 'Save region', exact: true }).click();
    await expect(name).toBeDisabled();
    await expect(form.getByRole('textbox', { name: 'Notes' })).toBeDisabled();
    await expect(form.getByRole('textbox', { name: 'Copies' })).toBeDisabled();
    await expect(form.getByRole('radio', { name: 'PNG' })).toBeDisabled();
    await expect(form.getByRole('checkbox', { name: 'Photos' })).toBeDisabled();
    await expect(form).toHaveAttribute('data-requests', '1');
    await expect.poll(() => form.locator('[data-glyph="check"]').isVisible(), { intervals: [50] }).toBe(true);
    await page.waitForTimeout(450);
    await form.screenshot({ path: capture(`save-region-result-${colorway}`) });
    await expect(name).toBeEnabled();
    await expect(form.locator('[data-saved-name]')).toHaveText('Stored: Lisbon');
    await page.getByRole('button', { name: /Undo/ }).click();
    await expect(form.locator('[data-saved-name]')).toHaveText('No saved region.');
    await expect(name).toHaveValue('Lisbon');
    // A fresh edit resets the landed face and permits the next operation.
    await name.fill('Porto');
    await expect(form.getByRole('button', { name: 'Save region', exact: true })).toBeEnabled();
  });
}

test('failed Save region retains the whole draft and retries after storage recovers under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/form-field', 'graphite');
  const panels = page.locator('.dialkit-panel-inner[data-collapsed="true"]');
  for (const panel of await panels.all()) await panel.click();
  const failure = page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: /^fail$/i }) });
  await failure.getByRole('button', { name: 'On', exact: true }).click();
  const form = page.getByTestId('save-region');
  const name = form.getByRole('textbox', { name: 'Region name' });
  await name.fill('Lisbon'); await form.getByRole('textbox', { name: 'Notes' }).fill('Bring the tram map.');
  await form.getByRole('button', { name: 'Save region', exact: true }).click();
  await expect(form).toContainText('Could not save the region. Try again.');
  await expect(name).toHaveValue('Lisbon'); await expect(name).toBeEnabled();
  await expect(form.getByRole('textbox', { name: 'Notes' })).toHaveValue('Bring the tram map.');
  await form.screenshot({ path: capture('save-region-error-reduced') });
  await form.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(form).toHaveAttribute('data-requests', '2');
  await expect(form.locator('[data-saved-name]')).toHaveText('Stored: Lisbon');
});
