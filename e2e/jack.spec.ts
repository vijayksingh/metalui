import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Jack Part on Parts › Jack: five socket states, detail by size, and jacks set into a slab.
for (const colorway of COLORWAYS) {
  test(`jacks in ${colorway}`, async ({ page }) => {
    await open(page, '/components/jack', colorway);
    const states = page.getByTestId('jack-states').locator('svg[role="img"]');
    await expect(states).toHaveCount(5);
    await expect(states.first()).not.toHaveAttribute('data-lit', /.+/);
    for (const [i, lit] of ['live', 'link', 'waiting', 'failed'].entries()) {
      await expect(states.nth(i + 1)).toHaveAttribute('data-lit', lit);
      await expect(states.nth(i + 1).locator(`[data-lit="${lit}"]`)).toHaveCount(1);   // the glow sits in the socket
    }
    // Twelve knurls on every nut, a socket that is a hole through it.
    expect(await states.first().locator('[data-part="jack"] path[stroke]').count()).toBe(12);
    await page.getByTestId('jack-states').screenshot({ path: capture(`jack-${colorway}`) });
  });
}

test('detail follows size, and the flat tier has no filters', async ({ page }) => {
  await open(page, '/components/jack', 'bone');
  const tiers = page.getByTestId('jack-tiers').locator('svg[role="img"]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
});

test('jacks sit in a slab, and the panel answers as metal', async ({ page }) => {
  await open(page, '/components/jack', 'graphite');
  const panel = page.getByTestId('jack-panel');
  await expect(panel.locator('[data-cut="hole"]')).toHaveCount(2);
  await expect(panel.locator('[data-part="jack"]')).toHaveCount(2);
  await expect(panel.locator('[data-lit="link"]')).toHaveCount(1);
  await page.getByRole('switch', { name: 'Lit' }).click();
  await expect(panel.locator('[data-lit]')).toHaveCount(0);
});
