import { expect, test, type Locator } from '@playwright/test';
import { open } from './helpers';

// Inner scrollers keep their scroll (docs/CSS_HABITS.md): reaching the end of a list, a pane or a popup
// must not carry on into the page behind it. Each scroller is read where the docs render it, open.
const contain = (el: Locator) => el.evaluate((node) => getComputedStyle(node).overscrollBehaviorY);

test('the select popup contains its scroll', async ({ page }) => {
  await open(page, '/components/select#portal', 'bone');
  await page.getByTestId('scoped-select').getByRole('combobox', { name: 'Scoped icon' }).focus();
  await page.keyboard.press('ArrowDown');
  const pop = page.locator('.select-pop');
  await expect(pop).toBeVisible();
  expect(await contain(pop)).toBe('contain');
});

test('the sidebar list contains its scroll', async ({ page }) => {
  await open(page, '/components/sidebar', 'bone');
  expect(await contain(page.locator('.mu-sidebar-list').first())).toBe('contain');
});

test('both split panes contain their scroll', async ({ page }) => {
  await open(page, '/components/split-pane', 'bone');
  expect(await contain(page.locator('.mu-split-pane-first').first())).toBe('contain');
  expect(await contain(page.locator('.mu-split-pane-second').first())).toBe('contain');
});
