import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Life gallery (import plan §3.2): search by a synonym, hover the result to see its pose, copy it.
for (const colorway of COLORWAYS) {
  test(`find, hover and copy a life glyph in ${colorway}`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, '/icons/life', colorway);
    await page.getByRole('searchbox').fill('brekkie');
    const results = page.getByTestId('life-results');
    await expect(results.getByRole('button').first()).toHaveText('Breakfast');
    await results.getByRole('button', { name: 'Breakfast' }).click();

    const detail = page.getByTestId('life-detail');
    const white = detail.locator('svg.mu-il-breakfast .w').first();
    const rest = await white.evaluate((el) => getComputedStyle(el).transform);
    await detail.hover();
    await page.waitForTimeout(700);
    const posed = await white.evaluate((el) => getComputedStyle(el).transform);
    expect(posed).not.toBe(rest); // the egg white turns −4° on hover
    await page.locator('section', { hasText: 'Hover: yolk wobbles' }).first().screenshot({ path: capture(`life-gallery-detail-${colorway}`) });

    await page.getByRole('button', { name: 'Copy name' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('breakfast');
    await page.getByRole('button', { name: 'Copy SVG' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<svg');

    await page.getByRole('searchbox').fill('');
    await page.locator('section').first().screenshot({ path: capture(`life-gallery-${colorway}`) });
  });
}

test('life glyphs stay still under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons/life', 'bone');
  const detail = page.getByTestId('life-detail');
  const white = detail.locator('svg.mu-il-breakfast .w').first();
  const rest = await white.evaluate((el) => getComputedStyle(el).transform);
  await detail.hover();
  await page.waitForTimeout(300);
  expect(await white.evaluate((el) => getComputedStyle(el).transform)).toBe(rest);
});

// Feelings construction (import plan §3.3): the composer draws every named feeling from its values.
test('the composer draws every feeling the four variables name', async ({ page }) => {
  await open(page, '/icons/life', 'bone');
  const figures = page.getByTestId('feelings-values').locator('figure');
  await expect(figures).toHaveCount(12);
  for (const fig of await figures.all()) {
    await expect(fig.getByRole('img')).toHaveCount(2); // composed and authored
    expect(await fig.locator('svg').first().locator('circle.v').count()).toBe(1);
  }
  await page.locator('section', { hasText: 'The feelings language' }).first().screenshot({ path: 'docs/captures/web/feelings-composer-bone.png' });
});

// Feelings grid (import plan §3.4): every feeling in its cell, tinted; in ink under Increase Contrast.
for (const colorway of ['bone', 'graphite'] as const) {
  test(`feelings grid in ${colorway}, then under Increase Contrast`, async ({ page }) => {
    await open(page, '/icons/life', colorway);
    const grid = page.getByTestId(`feelings-grid-${colorway}`);
    await expect(grid.locator('[data-feeling]')).toHaveCount(23);
    const angry = grid.locator('[data-feeling="angry"] svg');
    const tinted = await angry.evaluate((el) => getComputedStyle(el).color);
    await page.locator('section', { hasText: 'The feelings grid' }).first().screenshot({ path: `docs/captures/web/feelings-grid-${colorway}.png` });
    await page.emulateMedia({ contrast: 'more' });
    const ink = await angry.evaluate((el) => getComputedStyle(el).color);
    const icon = await grid.evaluate((el) => getComputedStyle(el).color);
    expect(ink).not.toBe(tinted);
    expect(ink).toBe(icon);
  });
}
