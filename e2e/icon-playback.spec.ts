import { expect, test } from '@playwright/test';
import { capture, COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  for (const reduced of [false, true]) {
    test(`playback controls act once and retain transport identity in ${colorway}, reduced ${reduced}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await open(page, '/icons#playback', colorway);
      const family = page.getByTestId('playback-family');
      for (const name of ['play', 'pause']) {
        const key = family.locator(`[data-playback="${name}"]`);
        await expect(key).toHaveAccessibleName(name === 'play' ? 'Play: advance or resume' : 'Pause: hold for resumption');
        const icons = key.locator('svg');
        await expect(icons.nth(0)).toHaveAttribute('width', '16');
        await expect(icons.nth(1)).toHaveAttribute('width', '24');
        await key.hover();
        if (!reduced) await expect(icons.nth(1)).toHaveAttribute('data-playing', '');
        await expect(key.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
        await key.click();
        await expect(key).toHaveAttribute('aria-pressed', 'true');
        await expect(key.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
        for (const size of [16, 24]) {
          const svg = await page.request.get(`/icons/svg/${size === 16 ? "16/" : ""}${name}.svg`);
          expect(svg.ok()).toBeTruthy();
          expect(await svg.text()).toContain('<svg');
        }
      }
      const morph = page.getByTestId('playback-morph');
      await expect(morph.locator('svg')).toHaveAttribute('data-glyph', 'pause');
      await morph.click();
      await expect(morph.locator('svg')).toHaveAttribute('data-glyph', 'play');
      await morph.click();
      await expect(morph.locator('svg')).toHaveAttribute('data-glyph', 'pause');
      await page.mouse.move(0, 0);
      await expect(family.locator('[data-playing]')).toHaveCount(0, { timeout: 3000 });
      await family.screenshot({ path: capture(`icon-playback-${colorway}${reduced ? '-reduced' : ''}`) });
    });
  }
}
