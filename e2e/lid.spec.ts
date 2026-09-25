import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Lid Part on Parts › Lid: opening foreshortens it toward its hinge and throws its shadow further
// out; the red underside shows only when it is armed.
const scaleOf = (t: string | null) => { const m = (t ?? '').match(/scale\(([-\d.]+) ([-\d.]+)\)/); return m ? [Number(m[1]), Number(m[2])] : [1, 1]; };

for (const colorway of COLORWAYS) {
  test(`lids in ${colorway}`, async ({ page }) => {
    await open(page, '/components/lid', colorway);
    const looks = page.getByTestId('lid-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(5);
    const folds = await looks.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lid"]')!.getAttribute('transform')));
    // cos 0°, 18°, 70°, 18° along the length; the left hinge folds across.
    expect(folds.map((t) => scaleOf(t).map((x) => +x.toFixed(2)))).toEqual([[1, 1], [1, 0.95], [1, 0.34], [1, 0.95], [0.77, 1]]);
    // The shadow falls further out as it opens.
    const shadowY = await looks.evaluateAll((els) => els.map((e) => Number(e.querySelector('[data-part="lid.shadow"]')!.getAttribute('transform')!.match(/translate\(([-\d.]+) ([-\d.]+)\)/)![2])));
    expect(shadowY[2]).toBeGreaterThan(shadowY[1]);
    expect(shadowY[1]).toBeGreaterThan(shadowY[0]);
    // Red under it only when armed.
    expect(await looks.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lid.under"]')!.getAttribute('opacity')))).toEqual(['0', '0', '0', '1', '1']);
    await expect(looks.nth(3)).toHaveAttribute('aria-label', 'lid, open 18°, armed');
    await page.getByTestId('lid-looks').screenshot({ path: capture(`lid-${colorway}`) });
  });
}
