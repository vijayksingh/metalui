import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, emulateMedia, open } from './helpers';

// Frost (import plan §2): three recipes over a busy backdrop, their opaque twins under
// Reduce Transparency, and the contrast edge under Increase Contrast.
for (const colorway of COLORWAYS) {
  test(`frost in ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/materials', colorway);
    const plate = page.locator('[data-frost="plate"]');
    const style = () => plate.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, filter: s.backdropFilter, shadow: s.boxShadow };
    });

    const frosted = await style();
    expect(frosted.filter).toBe('blur(22px) saturate(1.6)');
    expect(frosted.bg).toBe(colorway === 'bone' ? 'rgba(251, 250, 248, 0.8)' : 'rgba(34, 34, 37, 0.78)');
    await page.locator('section', { hasText: 'Three frosted recipes' }).first().screenshot({ path: capture(`frost-${colorway}`) });

    await emulateMedia(page, [{ name: 'prefers-reduced-transparency', value: 'reduce' }]);
    const opaque = await style();
    expect(opaque.filter).toBe('none');
    expect(opaque.bg).toBe(colorway === 'bone' ? 'rgb(244, 243, 240)' : 'rgb(37, 37, 40)');
    expect(opaque.shadow).toBe(frosted.shadow);
    await page.locator('section', { hasText: 'Three frosted recipes' }).first().screenshot({ path: capture(`frost-${colorway}-reduce-transparency`) });

    await emulateMedia(page, [{ name: 'prefers-contrast', value: 'more' }]);
    expect((await style()).shadow).toMatch(/inset 0px 0px 0px 1px$|^rgba?\([^)]*\) 0px 0px 0px 1px inset/);
  });
}
