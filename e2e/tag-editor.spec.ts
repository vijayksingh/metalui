import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`Tag validates, commits one attachment, settles then clears and restores the captured list in ${colorway}`, async ({ page }) => {
    await open(page, '/components/field', colorway);
    const host = page.getByTestId('tag-editor'), input = host.getByRole('textbox', { name: 'Tag', exact: true });
    await input.fill('travel'); await expect(host).toContainText('This tag is already attached.');
    await expect(host.getByRole('button', { name: 'Tag', exact: true })).toBeDisabled();
    await input.fill('cancelled'); await input.press('Escape'); await expect(input).toHaveValue('');
    await input.fill('#Lisbon'); await input.press('Enter');
    await expect(input).toBeDisabled(); await input.press('Escape'); await expect(input).toHaveValue('#Lisbon');
    await expect(host).toHaveAttribute('data-requests', '1');
    await expect.poll(() => host.locator('[data-glyph="check"]').isVisible(), { intervals: [50] }).toBe(true);
    await page.waitForTimeout(450); await host.screenshot({ path: capture(`tag-result-${colorway}`) });
    await expect(input).toBeEnabled(); await expect(input).toHaveValue('');
    await expect(host.getByRole('group', { name: 'Attached tags' })).toContainText('#Lisbon');
    await page.getByRole('button', { name: /Undo/ }).click();
    await expect(host.getByRole('group', { name: 'Attached tags' })).toHaveText('#travel');
  });
}
test('Tag failure retains text for retry with motion reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, '/components/field', 'graphite');
  for (const panel of await page.locator('.dialkit-panel-inner[data-collapsed="true"]').all()) await panel.click();
  const failure = page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: /^fail$/i }) });
  await failure.getByRole('button', { name: 'On', exact: true }).click();
  const host = page.getByTestId('tag-editor'), input = host.getByRole('textbox', { name: 'Tag', exact: true });
  await input.fill('Lisbon'); await input.press('Enter');
  await expect(host).toContainText('Could not attach this tag. Try again.'); await expect(input).toHaveValue('Lisbon');
  await host.screenshot({ path: capture('tag-error-reduced') });
  await host.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(host.getByRole('group', { name: 'Attached tags' })).toContainText('#Lisbon'); await expect(host).toHaveAttribute('data-requests', '2');
});
