import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';
for (const colorway of COLORWAYS) test(`chrome arrives with a valid spring in ${colorway}`, async ({ page }) => {
  await open(page, '/foundations/motion#reduce-motion', colorway);
  const bench = page.getByTestId('motion-preference');
  const row = bench.locator('[data-md=row]').filter({ has: page.getByText('chrome', { exact: true }) });
  const thumb = row.locator('.material-thumb');
  await bench.getByRole('button', { name: 'Replay', exact: true }).click();
  const samples = await thumb.evaluate(async el => {
    const values: number[] = [];
    for (let i = 0; i < 24; i++) { await new Promise(requestAnimationFrame); const transform = getComputedStyle(el).transform; values.push(transform === 'none' ? 0 : new DOMMatrix(transform).m41); }
    return { values, easing: getComputedStyle(el).transitionTimingFunction };
  });
  expect(samples.easing).toContain('linear(');
  expect(samples.easing).not.toContain('NaN');
  expect(samples.values.some(value => value < -1)).toBe(true);
  expect(samples.values.every(Number.isFinite)).toBe(true);
  expect(samples.values.at(-1)).toBe(0);
  await bench.getByRole('button', { name: 'Reduce motion', exact: true }).click();
  await expect(bench.getByLabel('Effective motion')).toContainText('reduced');
  await bench.getByRole('button', { name: 'Replay', exact: true }).click();
  await expect(thumb).toHaveCSS('transform', 'none');
});
