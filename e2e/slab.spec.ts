import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Slab Part on Parts › Slab: six materials × four kinds of cut, detail tiers by size, the host's
// world (graphite deepens shadows, increased contrast deepens them more), and a press that answers.
type Page = import('@playwright/test').Page;
const castAlpha = (page: Page, sel: string) => page.locator(sel).first().evaluate((svg) =>
  Number(svg.querySelector('filter[data-material] feFlood')?.getAttribute('flood-opacity')));

for (const colorway of COLORWAYS) {
  test(`slab sheet in ${colorway}`, async ({ page }) => {
    await open(page, '/components/slab', colorway);
    const sheet = page.getByTestId('slab-sheet');
    await expect(sheet.locator('svg[data-material]')).toHaveCount(24);
    await expect(sheet.locator('svg[data-material]').first()).toHaveAttribute('data-host', colorway);
    // Every cut has a floor, drawn under the body.
    await expect(sheet.locator('[data-slab="stone"]').nth(0).locator('[data-cut="slot"]')).toHaveCount(3);
    await expect(sheet.locator('[data-slab="stone"]').nth(1).locator('[data-cut="hole"]')).toHaveCount(3);
    const alpha = await castAlpha(page, '[data-slab="stone"] svg');
    expect(alpha).toBeCloseTo(0.28 * (colorway === 'graphite' ? 1.35 : 1), 3);
    await sheet.screenshot({ path: capture(`slab-${colorway}`) });
  });
}

test('detail follows size: full, lite, then flat with no filters at all', async ({ page }) => {
  await open(page, '/components/slab', 'bone');
  const tiers = page.getByTestId('slab-tiers').locator('svg[data-material]');
  await expect(tiers).toHaveCount(4);
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  expect(await tiers.nth(2).evaluate((e) => e.querySelectorAll('feTurbulence').length)).toBe(0);   // lite: no grain
  expect(await tiers.nth(0).evaluate((e) => e.querySelectorAll('feTurbulence').length)).toBeGreaterThan(0);
});

test('increased contrast deepens the shadows', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' } as never);
  await open(page, '/components/slab', 'bone');
  expect(await castAlpha(page, '[data-slab="stone"] svg')).toBeCloseTo(0.28 * 1.2, 3);
});

test('a pressed slab gives by its material', async ({ page }) => {
  await open(page, '/components/slab', 'graphite');
  const rubber = page.locator('[data-slab="rubber"]').first();
  await rubber.dispatchEvent('pointerdown');
  expect(await rubber.evaluate((el) => el.getAnimations().length)).toBeGreaterThan(0);
});
