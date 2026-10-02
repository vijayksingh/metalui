import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  for (const reduced of [false, true]) {
    test(`an amount glyph performs one tilt and retains its face in ${colorway}, reduced ${reduced}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await open(page, '/icons#amount', colorway);
      const key = page.getByTestId('amount-glyph');
      await expect(key).toHaveAccessibleName('Coin: monetary amount');
      await key.hover();
      if (!reduced) await expect(key.locator('svg').last()).toHaveAttribute('data-playing', '');
      await expect(key.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
      await key.focus();
      await page.keyboard.press('Enter');
      await expect(key.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
      for (const size of [16, 24]) {
        const svg = await page.request.get(`/icons/svg/${size === 16 ? '16/' : ''}coin.svg`);
        expect(svg.ok()).toBeTruthy();
        expect(await svg.text()).toContain('<svg');
      }
      await page.mouse.move(0, 0);
      await key.screenshot({ path: capture(`icon-coin-${colorway}${reduced ? '-reduced' : ''}`) });
    });
  }
}
