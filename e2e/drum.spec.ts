import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Drum Part on Parts › Drum: digits centred for whole values, between two for a half, and a strip
// that runs on from 9 into 0 without an end.
const stripY = (svg: import('@playwright/test').Locator) => svg.locator('[data-part="drum.strip"]').evaluate((e) => Number((e.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)![1]));

for (const colorway of COLORWAYS) {
  test(`drums in ${colorway}`, async ({ page }) => {
    await open(page, '/components/drum', colorway);
    const drums = page.getByTestId('drum-looks').locator('svg[role="img"]');
    await expect(drums).toHaveCount(5);
    expect(await drums.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual(['drum showing 0', 'drum showing 7', 'drum showing 0', 'drum showing 3', 'drum showing 4']);
    // The strip holds 8 and 9 above 0 and 0 and 1 below 9: fourteen rows, so the wrap never shows an end.
    await expect(drums.first().locator('[data-part="drum.strip"] text')).toHaveCount(14);
    await page.getByTestId('drum-looks').screenshot({ path: capture(`drum-${colorway}`) });
  });
}

test('turning it past 9 runs on into 0', async ({ page }) => {
  await open(page, '/components/drum', 'bone');
  const drum = page.getByTestId('drum-turn');
  const at = async (key: string) => { await page.getByRole('slider', { name: 'Value' }).focus(); await page.keyboard.press(key); return stripY(drum); };
  const end = await at('End');                 // value 10: the same place as 0
  const start = await at('Home');
  expect(end).toBeCloseTo(start, 3);
});
