import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`portal keeps and follows its scoped colorway on ${colorway}`, async ({ page }) => {
    await open(page, '/foundations/color#portals', colorway);
    const scope = page.getByTestId('portal-scope');
    await scope.getByRole('button', { name: 'Show portal specimen' }).click();
    const specimen = page.getByTestId('portal-specimen');
    await expect(specimen).toHaveAttribute('data-mu-colorway', 'graphite');
    expect(await specimen.evaluate((el) => el.parentElement === document.body)).toBe(true);
    const ink = () => specimen.evaluate((el) => getComputedStyle(el).color);
    const graphite = await ink();
    await scope.getByRole('button', { name: 'Change specimen colorway' }).click();
    await expect(specimen).toHaveAttribute('data-mu-colorway', 'bone');
    expect(await ink()).not.toBe(graphite);
    expect(await page.evaluate(() => document.documentElement.dataset.muColorway)).toBe(colorway);
    await scope.getByRole('button', { name: 'Hide portal specimen' }).click();
    await expect(specimen).toHaveCount(0);
  });
}
