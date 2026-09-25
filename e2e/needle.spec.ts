import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Needle Part on Parts › Needle: values turn it across its arc, its scale and zone are printed in
// the glass, and it sits over the glass under its surface.
for (const colorway of COLORWAYS) {
  test(`needles in ${colorway}`, async ({ page }) => {
    await open(page, '/components/needle', colorway);
    const looks = page.getByTestId('needle-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(4);
    // 0.2 → −36°, 0.5 → 0°, 0.9 → +48° on a 120° arc; 0.35 → −22.5° on a 150° arc.
    expect(await looks.evaluateAll((els) => els.map((e) => Number(e.querySelector('[data-part="needle"]')!.getAttribute('transform')!.match(/rotate\(([-\d.]+)/)![1])))).toEqual([-36, 0, 48, -22.5]);
    await expect(looks.first().locator('[data-part="needle.scale"] path')).toHaveCount(9);
    await expect(looks.nth(3).locator('[data-part="needle.scale"] path')).toHaveCount(13);
    await expect(looks.first().locator('[data-part="needle.zone"]')).toHaveCount(1);
    await expect(looks.nth(3).locator('[data-part="needle.zone"]')).toHaveCount(0);
    // Inside the glass: under the glass's glare.
    expect(await looks.first().evaluate((e) => [...e.querySelectorAll('[data-part="needle"], [data-part="glass.glare"]')].map((x) => x.getAttribute('data-part')))).toEqual(['needle', 'glass.glare']);
    await page.getByTestId('needle-looks').screenshot({ path: capture(`needle-${colorway}`) });
  });
}
