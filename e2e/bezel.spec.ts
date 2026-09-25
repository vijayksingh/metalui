import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Bezel Part on Parts › Bezel: a frame around sunk glass, round or square, its glass in a
// gadget's face colour, and detail by size.
for (const colorway of COLORWAYS) {
  test(`bezels in ${colorway}`, async ({ page }) => {
    await open(page, '/components/bezel', colorway);
    const looks = page.getByTestId('bezel-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(3);
    expect(await looks.evaluateAll((els) => els.map((e) => `${e.getAttribute('data-material')}/${e.getAttribute('data-opening')}`))).toEqual(['stone/round', 'metal/round', 'clay/square']);
    // The frame is a ring: its opening is cut through, and the glass sits below it, shaded by its wall.
    const one = looks.first();
    expect(await one.locator('[data-part="bezel"] [data-part="slab"]').evaluate((e) => ({ rule: e.getAttribute('fill-rule'), outlines: (e.getAttribute('d')!.match(/M/g) ?? []).length }))).toEqual({ rule: 'evenodd', outlines: 2 });
    await expect(one.locator('[data-part="bezel.face"]')).toHaveAttribute('filter', /url\(#/);
    await expect(one.locator('[data-part="glass.rings"] circle')).toHaveCount(2);
    await expect(looks.nth(2).locator('[data-part="glass.rings"]')).toHaveCount(0);
    // Order: the glass, then light, then its surface, all under the frame.
    expect(await one.evaluate((e) => [...e.querySelectorAll('[data-part="glass"], [data-part="bezel.light"], [data-part="glass.glare"], [data-part="bezel"]')].map((x) => x.getAttribute('data-part')))).toEqual(['glass', 'bezel.light', 'glass.glare', 'bezel']);
    await page.getByTestId('bezel-looks').screenshot({ path: capture(`bezel-${colorway}`) });
  });
}

test('the flat tier has no filters, rings or glare', async ({ page }) => {
  await open(page, '/components/bezel', 'bone');
  const tiers = page.getByTestId('bezel-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  const flat = tiers.nth(3);
  expect(await flat.evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  await expect(flat.locator('[data-part="glass.rings"], [data-part="glass.glare"]')).toHaveCount(0);
});
