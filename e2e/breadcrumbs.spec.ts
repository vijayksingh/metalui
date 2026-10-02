import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Breadcrumbs: the current level is not a link; going deeper adds a crumb that arrives from the right;
// climbing shortens the path; past four levels the middle folds into a menu.
const nav = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Breadcrumb', exact: true });

for (const colorway of COLORWAYS) {
  test(`climbs, deepens and folds in ${colorway}`, async ({ page }) => {
    await open(page, '/components/breadcrumbs', colorway);
    await expect(nav(page).getByText('2026')).toHaveAttribute('aria-current', 'page');
    await expect(nav(page).getByRole('link')).toHaveCount(2);

    await page.getByRole('button', { name: 'Open Lisbon' }).first().click();
    await expect(nav(page).getByText('Lisbon')).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Open Day two' }).first().click();
    // Five levels: Spaces, the fold, then the last two.
    const fold = nav(page).getByRole('button', { name: '2 more levels' });
    await expect(fold).toBeVisible();
    await expect(fold.locator('svg')).toHaveClass(/mu-ic-more/);
    await expect(nav(page).locator('.mu-breadcrumb-sep').first()).toHaveClass(/mu-ic-chevron/);
    await expect(nav(page).locator('.mu-breadcrumb-sep').first()).toHaveAttribute('data-static', '');
    await expect(nav(page).getByRole('link', { name: 'Spaces' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`breadcrumbs-${colorway}`) });
    await fold.click();
    await page.getByRole('menuitem', { name: 'Travel' }).click();
    await expect(nav(page).getByText('Travel')).toHaveAttribute('aria-current', 'page');
    await expect(fold).toBeHidden();

    await nav(page).getByRole('link', { name: 'Spaces' }).click();
    await expect(nav(page).getByText('Spaces')).toHaveAttribute('aria-current', 'page');
  });
}

test('only a new level moves: it arrives from the right', async ({ page }) => {
  await open(page, '/components/breadcrumbs', 'bone');
  const still = await nav(page).locator('li').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(still).toBe('none');
  await page.getByRole('button', { name: 'Open Lisbon' }).first().click();
  const last = nav(page).locator('li').last();
  await expect(last).toHaveAttribute('data-arrive', '');
  expect(await last.evaluate((el) => getComputedStyle(el).animationName)).toBe('mu-breadcrumb-arrive');
  expect(await nav(page).locator('li').first().evaluate((el) => el.hasAttribute('data-arrive'))).toBe(false);
});

test('Breadcrumb folded key keeps keyboard access and static path under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/breadcrumbs', 'graphite');
  await page.getByRole('button', { name: 'Open Lisbon' }).first().click();
  await page.getByRole('button', { name: 'Open Day two' }).first().click();
  const fold = nav(page).getByRole('button', { name: '2 more levels' });
  await fold.focus();
  const frame = await fold.locator('svg').innerHTML();
  await page.waitForTimeout(160);
  expect(await fold.locator('svg').innerHTML()).toBe(frame);
  await nav(page).screenshot({ path: capture('breadcrumbs-reduced') });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Travel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(fold).toBeFocused();
});
