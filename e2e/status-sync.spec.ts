import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`one connectivity badge retains its glyph and names recovery in ${colorway}`, async ({ page }) => {
    await open(page, '/components/status', colorway);
    const host = page.getByTestId('sync-meaning'); const badge = host.getByRole('status');
    const glyph = badge.locator('svg[data-glyph]');
    await expect(glyph).toHaveAttribute('data-glyph', 'synced');
    const initial = await glyph.elementHandle();
    await expect(badge.locator('.mu-led')).toHaveCount(0);
    await expect(glyph).toHaveAttribute('aria-hidden', 'true');
    await expect(glyph).toHaveCSS('width', '14px');
    await host.getByRole('button', { name: 'Disconnect', exact: true }).click();
    await expect(glyph).toHaveAttribute('data-glyph', 'offline');
    await expect(badge.locator('.mu-swap-layer').last()).toHaveText('Offline · changes stay here');
    expect(await initial!.evaluate(e => e === document.querySelector('[data-testid="sync-meaning"] [data-glyph]'))).toBe(true);
    await host.getByRole('button', { name: 'Fail sync', exact: true }).click();
    await expect(glyph).toHaveAttribute('data-glyph', 'sync-error');
    await expect(badge).toHaveAttribute('aria-description', 'Check the connection, then retry sync.');
    await expect(badge).toHaveAttribute('tabindex', '0');
    await expect(badge.locator('.mu-swap-layer').last()).toHaveText('Sync failed · retry available');
    await host.screenshot({ path: capture(`status-sync-${colorway}`) });
    await host.evaluate(e => e.setAttribute('data-mu-motion', 'reduce'));
    await host.getByRole('button', { name: 'Retry sync', exact: true }).click();
    await expect(glyph).toHaveAttribute('data-glyph', 'synced');
    await expect(badge).not.toHaveAttribute('tabindex');
    await expect(badge.locator('.mu-swap-layer').last()).toHaveText('All changes synced');
    await expect.poll(() => glyph.evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0);
    await host.screenshot({ path: capture(`status-sync-reduced-${colorway}`) });
  });
}
