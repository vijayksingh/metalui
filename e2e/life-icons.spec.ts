import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Life set (import plan §3.1): the Color page draws one real life glyph per tint family,
// from @unlocalhosted/metalui/icons/life, stroke-tinted, and the tints switch off.
for (const colorway of COLORWAYS) {
  test(`life glyphs carry their tint in ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/color', colorway);
    const happy = page.locator(`div[data-mu-colorway="${colorway}"] svg.mu-il-happy`);
    await expect(happy).toHaveClass(/mu-tint-ember/);
    const stroke = () => happy.evaluate((el) => getComputedStyle(el).color);
    expect(await stroke()).toBe(colorway === 'bone' ? 'rgb(208, 86, 14)' : 'rgb(251, 121, 74)');
    // A tinted vessel is stroke only.
    expect(await happy.locator('.v').evaluate((el) => getComputedStyle(el).fillOpacity)).toBe('0');
    const bench = page.locator('section', { hasText: 'kind of feeling' }).first();
    await bench.screenshot({ path: capture(`life-tints-${colorway}`) });
    await page.getByRole('button', { name: 'Tints on' }).click();
    expect(await stroke()).not.toBe(colorway === 'bone' ? 'rgb(208, 86, 14)' : 'rgb(251, 121, 74)');
  });
}
