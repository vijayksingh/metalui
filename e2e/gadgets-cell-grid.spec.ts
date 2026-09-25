import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The cell grid, a slab gadget drawn from its spec: resin cells in a tray lit from behind, the share
// lighting them in order from the bottom row up, the share deciding rest, filling and full, and a
// first run the host sets that raises the whole grid.
const lit = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => Number(e.querySelector('[data-part="cell"]')!.getAttribute('data-lit')));
const glows = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => [...e.querySelectorAll('[data-part="cell.glow"] [data-cell]')].map((c) => Number(c.getAttribute('opacity'))));
const level = (svg: import('@playwright/test').Locator) => svg.evaluate((e) => Number(getComputedStyle(e.querySelector('[data-part="backlight.level"]')!).opacity));

for (const colorway of COLORWAYS) {
  test(`the cell grid in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/cell-grid', colorway);
    const states = page.getByTestId('grid-states').locator('svg[data-gadget="cell-grid"]');
    await expect(states).toHaveCount(5);
    expect(await states.evaluateAll((els) => els.map((e) => e.getAttribute('data-state')))).toEqual(['rest', 'filling', 'filling', 'full', 'first-run']);
    expect(await Promise.all([0, 1, 2, 3, 4].map((i) => lit(states.nth(i))))).toEqual([0, 6.4, 12, 16, 16]);
    expect(await states.evaluateAll((els) => els.map((e) => e.querySelector('[data-part="lamp"]')!.getAttribute('data-lamp')))).toEqual(['off', 'live', 'live', 'live', 'live']);
    // 6.4 lit: the bottom row, then the next row up from its left, the seventh part way.
    expect(await glows(states.nth(1))).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0.4, 0, 1, 1, 1, 1]);
    // The light behind them burns as they fill; it is clipped to the tray it sits in.
    expect(await level(states.nth(0))).toBeCloseTo(0.08, 2);
    expect(await level(states.nth(3))).toBeCloseTo(0.92, 2);
    await expect(states.nth(1).locator('[data-id="light"][clip-path]')).toHaveCount(1);
    await expect(states.nth(1).locator('desc')).toHaveText('Memory: 40% kept');
    await expect(states.nth(3).locator('desc')).toHaveText('Memory: 100% kept, full');
    await page.getByTestId('grid-states').screenshot({ path: capture(`gadget-cell-grid-${colorway}`) });
  });
}

test('pointing fills the grid up to a cell, in order, on a spring; the share decides the state', async ({ page }) => {
  await open(page, '/gadgets/cell-grid', 'bone');
  const grid = page.getByTestId('grid'), point = page.getByTestId('grid-point');
  await point.scrollIntoViewIfNeeded();
  // The top-right cell is the last in order: pointing at it fills the grid.
  const box = (await point.boundingBox())!, k = box.width / 400;
  await page.mouse.click(box.x + 281 * k, box.y + 133 * k);
  // Light eases in: the share rises without passing full, and cells light in order the whole way.
  const trace = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="grid"]')!, out: { lit: number; order: boolean }[] = [], t0 = performance.now();
    const ORDER = [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3];
    await new Promise<void>((done) => {
      const id = setInterval(() => {
        const g = [...svg.querySelectorAll('[data-part="cell.glow"] [data-cell]')].map((c) => Number(c.getAttribute('opacity')));
        const inOrder = ORDER.every((c, i) => i === 0 || g[c] <= g[ORDER[i - 1]]);
        out.push({ lit: Number(svg.querySelector('[data-part="cell"]')!.getAttribute('data-lit')), order: inOrder });
        if (performance.now() - t0 > 1400) { clearInterval(id); done(); }
      }, 16);
    });
    return out;
  });
  expect(trace.every((t) => t.order)).toBe(true);
  expect(Math.max(...trace.map((t) => t.lit))).toBeLessThanOrEqual(16.001);
  expect(trace[trace.length - 1].lit).toBeCloseTo(16, 1);
  await expect(grid).toHaveAttribute('data-state', 'full');
  // A keyboard takes a cell away at a time; Home empties it.
  await point.focus();
  await page.keyboard.press('ArrowDown');
  await expect(point).toHaveAttribute('aria-valuenow', '15');
  await expect(grid).toHaveAttribute('data-state', 'filling');
  await page.keyboard.press('Home');
  await expect(grid).toHaveAttribute('data-state', 'rest');
});

test('a first run raises the whole grid and breathes the lamp, then falls back to what it keeps', async ({ page }) => {
  await open(page, '/gadgets/cell-grid', 'graphite');
  const grid = page.getByTestId('grid');
  await page.getByRole('button', { name: 'First run' }).click();
  await expect(grid).toHaveAttribute('data-state', 'first-run');
  await expect(grid.locator('[data-part="lamp"]')).toHaveAttribute('data-gesture', 'breathe');
  await expect.poll(() => lit(grid), { timeout: 2000 }).toBeGreaterThan(15.9);
  await expect(grid).toHaveAttribute('data-state', 'filling', { timeout: 4000 });
  await expect.poll(() => lit(grid), { timeout: 3000 }).toBeLessThan(6.5);
});

test('with reduced motion the cells light at once; the flat tier has no filters; the server string is drawn lit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/cell-grid', 'bone');
  await page.getByTestId('grid-point').focus();
  await page.keyboard.press('End');
  expect(await lit(page.getByTestId('grid'))).toBe(16);
  const tiers = page.getByTestId('grid-tiers').locator('svg[data-gadget]');
  expect(await tiers.evaluateAll((els) => els.map((e) => e.getAttribute('data-tier')))).toEqual(['full', 'full', 'lite', 'flat']);
  expect(await tiers.nth(3).evaluate((e) => e.querySelectorAll('filter').length)).toBe(0);
  const still = page.getByTestId('grid-static').locator('svg');
  await expect(still).toHaveAttribute('data-state', 'filling');
  expect(await lit(still)).toBe(12);
});
