import { expect, test } from '@playwright/test';
import { capture, COLORWAYS, open } from './helpers';

const names = ['info', 'warning', 'sun', 'moon', 'sidebar'] as const;

for (const colorway of COLORWAYS) {
  test(`environment keys name distinct actions and play once in ${colorway}`, async ({ page }) => {
    await open(page, '/icons#status-environment', colorway);
    const family = page.getByTestId('environment-family');
    await expect(family.getByRole('button')).toHaveCount(names.length);
    for (const name of names) {
      const key = family.locator(`[data-environment="${name}"]`);
      await expect(key).toHaveAccessibleName(/.+: .+/);
      const icons = key.locator('svg');
      await expect(icons).toHaveCount(2);
      await expect(icons.nth(0)).toHaveAttribute('width', '16');
      await expect(icons.nth(1)).toHaveAttribute('width', '24');
      await key.hover();
      await expect(icons.nth(1)).toHaveAttribute('data-playing', '');
      await expect(icons.nth(1)).not.toHaveAttribute('data-playing', '', { timeout: 4000 });
      await key.click();
      await expect(key).toHaveAttribute('aria-pressed', 'true');
      const svg = await page.request.get(`/icons/svg/16/${name}.svg`);
      expect(svg.ok()).toBeTruthy();
      expect(await svg.text()).toContain('<svg');
    }
    await page.mouse.move(0, 0);
    await expect(family.locator('[data-playing]')).toHaveCount(0, { timeout: 4000 });
    await family.screenshot({ path: capture(`icon-environment-${colorway}`) });
  });
}

test('environment keys stay complete and static with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons#status-environment', 'graphite');
  const family = page.getByTestId('environment-family');
  for (const name of names) {
    const key = family.locator(`[data-environment="${name}"]`);
    await key.hover();
    await key.click();
    await expect(key).toHaveAttribute('aria-pressed', 'true');
    await expect(key.locator('[data-playing]')).toHaveCount(0);
  }
  await family.screenshot({ path: capture('icon-environment-reduced') });
});
