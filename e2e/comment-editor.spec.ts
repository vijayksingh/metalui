import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
for (const colorway of COLORWAYS) {
  test(`Comment cancels a draft, posts multiline text once, settles then closes and supports Undo in ${colorway}`, async ({ page }) => {
    await open(page, '/components/empty-state', colorway);
    const host = page.getByTestId('comment-place');
    await host.getByRole('button', { name: 'Comment', exact: true }).click();
    let input = host.getByRole('textbox', { name: 'Comment text' });
    await expect(input).toBeFocused();
    await input.fill('discard'); await input.press('Escape'); await expect(host).toContainText('No comments');
    await host.getByRole('button', { name: 'Comment', exact: true }).click(); input = host.getByRole('textbox', { name: 'Comment text' });
    await input.fill('Bring the tram map.'); await input.press('Enter'); await input.press('End'); await input.press('M');
    await expect(input).toHaveValue('Bring the tram map.\nM');
    await input.press('Control+Enter'); await expect(input).toBeDisabled();
    await expect(host.getByRole('button', { name: 'Cancel' })).toBeDisabled(); await page.keyboard.press('Escape'); await expect(input).toBeVisible();
    await expect(host).toHaveAttribute('data-requests', '1');
    await expect.poll(() => host.locator('[data-glyph="check"]').isVisible(), { intervals: [50] }).toBe(true);
    await page.waitForTimeout(450); await host.screenshot({ path: capture(`comment-result-${colorway}`) });
    await expect(host.getByRole('list', { name: 'Comments' })).toContainText('Bring the tram map.\nM');
    await page.getByRole('button', { name: /Undo/ }).click(); await expect(host).toContainText('No comments');
  });
}
test('Comment retains failed text and retries with motion reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, '/components/empty-state', 'graphite');
  for (const panel of await page.locator('.dialkit-panel-inner[data-collapsed="true"]').all()) await panel.click();
  const failure = page.locator('.dialkit-labeled-control', { has: page.locator('.dialkit-labeled-control-label', { hasText: /^fail$/i }) });
  await failure.getByRole('button', { name: 'On', exact: true }).click();
  const host = page.getByTestId('comment-place'); await host.getByRole('button', { name: 'Comment', exact: true }).click();
  const input = host.getByRole('textbox', { name: 'Comment text' }); await input.fill('Bring the tram map.'); await input.press('Control+Enter');
  await expect(host).toContainText('Could not post this comment. Try again.'); await expect(input).toHaveValue('Bring the tram map.'); await expect(input).toBeEnabled();
  await host.screenshot({ path: capture('comment-error-reduced') });
  await host.getByRole('button', { name: 'Try again', exact: true }).click(); await expect(host).toHaveAttribute('data-requests', '2');
  await expect(host.getByRole('list', { name: 'Comments' })).toContainText('Bring the tram map.');
});
