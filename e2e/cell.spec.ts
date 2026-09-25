import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Cell Part on Parts › Cell: a grid of resin cells lit from the bottom row up, the one filling now
// part way, each lit cell spilling a halo; the dials reshape the grid.
for (const colorway of COLORWAYS) {
  test(`cells in ${colorway}`, async ({ page }) => {
    await open(page, '/components/cell', colorway);
    const looks = page.getByTestId('cell-looks').locator('svg[role="img"]');
    await expect(looks).toHaveCount(4);
    const glow = (i: number) => looks.nth(i).locator('[data-part="cell.glow"] [data-cell]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('opacity'))));
    expect(await glow(0)).toEqual(Array(16).fill(0));
    // 6.5 lit, in reading order: the bottom row full, then the next row up from its left, the seventh half.
    expect(await glow(1)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0.5, 0, 1, 1, 1, 1]);
    expect(await glow(2)).toEqual(Array(16).fill(1));
    expect(await glow(3)).toEqual([1, 0, 0, 1, 1, 1]);
    await expect(looks.nth(3)).toHaveAttribute('aria-label', '3 by 2 cells, 4 lit');
    // A lit cell's halo spills around it; a dark one's is out.
    const halo = await looks.nth(1).locator('[data-part="cell.halo"] [data-cell]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('opacity'))));
    expect(halo[12]).toBeGreaterThan(0);
    expect(halo[0]).toBe(0);
    await page.getByTestId('cell-looks').screenshot({ path: capture(`cell-${colorway}`) });
  });
}
