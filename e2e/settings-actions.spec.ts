import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`settings action slots retain their meaning in ${colorway}`, async ({ page }) => {
    await open(page, '/components/settings', colorway);
    const playground = page.locator('section', { hasText: 'Playground' }).first();
    const sync = playground.getByRole('switch', { name: 'Sync this canvas' });
    await sync.click();
    await expect(playground).toContainText('Changes stay on this device.');
    await expect(playground.getByRole('button', { name: 'Download' }).locator('svg.mu-ic-download')).toHaveCount(1);
    await expect(playground.getByRole('button', { name: 'Restore…' }).locator('svg.mu-ic-undo')).toHaveCount(1);
    await playground.screenshot({ path: capture(`settings-actions-${colorway}`) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await playground.getByRole('button', { name: 'Download' }).hover();
    await expect.poll(() => playground.getByRole('button', { name: 'Download' }).evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await playground.screenshot({ path: capture(`settings-actions-${colorway}-reduced`) });
  });
}
