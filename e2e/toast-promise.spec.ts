import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';
const cards = (page: import('@playwright/test').Page) => page.locator('.mu-toast-viewport .mu-toast:not([data-ending-style])');

for (const colorway of COLORWAYS) {
  test(`promise result keeps one focused card and its glyph in ${colorway}`, async ({ page }) => {
    await open(page, '/components/toast', colorway);
    const host = page.getByTestId('toast-promise');
    await host.getByRole('button', { name: 'Export poster', exact: true }).click();
    const card = cards(page).first();
    await expect(card.locator('svg[data-glyph]')).toHaveAttribute('data-glyph', 'info');
    const id = await card.getAttribute('data-toast-id');
    const glyph = await card.locator('svg[data-glyph]').elementHandle();
    const close = card.getByRole('button', { name: 'Dismiss', exact: true });
    await page.keyboard.press('F6'); await close.focus();
    await host.getByRole('textbox', { name: 'Poster draft' }).fill('An editable poster');
    await page.keyboard.press('F6'); await close.focus();
    await expect(card.locator('svg[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    await expect(cards(page)).toHaveCount(1); await expect(card).toHaveAttribute('data-toast-id', id!);
    await expect(close).toBeFocused();
    expect(await glyph!.evaluate(e => e.isConnected)).toBe(true);
    await expect(card).toContainText('Poster exported');
    await expect(host.getByRole('textbox', { name: 'Poster draft' })).toHaveValue('An editable poster');
    await card.screenshot({ path: capture(`toast-promise-${colorway}`) });
    await card.getByRole('button', { name: /Undo/ }).click();
    await expect(host.getByRole('status')).toContainText('Draft · Export undone');
    await expect(cards(page)).toHaveCount(0);
    await host.getByRole('button', { name: 'Export poster', exact: true }).click();
    await expect(cards(page).first()).toHaveAttribute('data-type', 'loading');
    await cards(page).first().focus(); await page.keyboard.press('Escape');
    await expect(cards(page)).toHaveCount(0); await page.waitForTimeout(1100);
    await expect(cards(page)).toHaveCount(0);
  });
}

test('retained background updates preserve order, announce only in front, and errors wait for recovery', async ({ page }) => {
  await open(page, '/components/toast', 'graphite');
  await page.evaluate(() => document.documentElement.classList.add('rm'));
  const host = page.getByTestId('toast-promise');
  await host.getByRole('button', { name: 'Sync result', exact: true }).click();
  const announcement = page.locator('[data-toast-announcement]');
  const sync = cards(page).first(); const id = await sync.getAttribute('data-toast-id');
  await page.getByRole('button', { name: 'Fail an export', exact: true }).click();
  const frontID = await cards(page).first().getAttribute('data-toast-id');
  await host.getByRole('button', { name: 'Offline result', exact: true }).click();
  const retained = page.locator(`[data-toast-id="${id}"]`);
  await expect(retained.locator('[data-glyph]')).toHaveAttribute('data-glyph', 'offline');
  await expect(retained).toHaveAttribute('aria-live', 'off');
  await expect(announcement).toHaveText('Could not export · the clipboard is locked');
  await expect(cards(page)).toHaveCount(2); await expect(cards(page).first()).toHaveAttribute('data-toast-id', frontID!);
  await cards(page).first().hover(); await cards(page).first().getByRole('button', { name: 'Dismiss', exact: true }).click();
  await expect(retained).toHaveAttribute('data-front', ''); await expect(announcement).toHaveText('Offline · changes stay here');
  await host.getByRole('button', { name: 'Failed result', exact: true }).click();
  await expect(retained.locator('[data-glyph]')).toHaveAttribute('data-glyph', 'sync-error');
  await expect(announcement).toHaveText('Sync failed · retry available');
  await expect.poll(() => retained.locator('[data-glyph]').evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
  await page.mouse.move(0, 0); await page.waitForTimeout(2900); await expect(retained).toBeVisible();
  await retained.screenshot({ path: capture('toast-sync-reduced') });
  await retained.hover(); await retained.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await expect(cards(page)).toHaveCount(0);
  await host.getByRole('button', { name: 'Refuse export', exact: true }).click();
  await expect(cards(page).first()).toContainText('Export failed');
  await expect(cards(page).first().locator('[data-glyph]')).toHaveAttribute('data-glyph', 'sync-error');
});
