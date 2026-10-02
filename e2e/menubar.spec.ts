import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Menubar: a word opens its menu; moving across with a menu open swaps menus and the highlight glides
// to the new word; arrows move between words; a choice runs; Esc returns focus.
const bar = (page: import('@playwright/test').Page) => page.getByRole('menubar', { name: 'App', exact: true });

for (const colorway of COLORWAYS) {
  test(`opens, moves across, chooses and closes in ${colorway}`, async ({ page }) => {
    await open(page, '/components/menubar', colorway);
    const file = bar(page).getByRole('menuitem', { name: 'File' });
    await file.click();
    await expect(page.getByRole('menu').filter({ hasText: 'New canvas' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^New canvas/ }).locator('svg.mu-ic-board')).toHaveCount(1);
    await expect(page.getByRole('menuitem', { name: /^Export…/ }).locator('svg.mu-ic-download')).toHaveCount(1);
    // Hovering the next word with a menu open swaps to its menu.
    await bar(page).getByRole('menuitem', { name: 'Edit' }).hover();
    await expect(page.getByRole('menu').filter({ hasText: 'Undo' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /^Undo/ }).locator('svg.mu-ic-undo')).toHaveCount(1);
    await expect(page.getByRole('menu').filter({ hasText: 'New canvas' })).toHaveCount(0);
    await page.waitForTimeout(500);
    const glide = await bar(page).evaluate((el) => {
      const hl = el.querySelector('.mu-indicator')!.getBoundingClientRect();
      const edit = [...el.querySelectorAll('button')].find((b) => b.textContent === 'Edit')!.getBoundingClientRect();
      return Math.abs(hl.left - edit.left);
    });
    expect(glide).toBeLessThan(1);
    await page.screenshot({ path: capture(`menubar-${colorway}`), clip: { x: 0, y: (await bar(page).boundingBox())!.y - 20, width: 1280, height: 240 } });
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('menu').filter({ hasText: 'Show the grid' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Actual size' }).click();
    await expect(page.locator('section', { hasText: 'Playground' }).first()).toContainText('Actual size');
    await expect(bar(page).getByRole('menuitem', { name: 'Arrange' })).toBeDisabled();
    await expect(bar(page).getByRole('menuitem', { name: 'Arrange' })).toHaveCSS('opacity', '0.4');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await file.click();
    const exported = page.getByRole('menuitem', { name: /^Export…/ });
    await exported.hover();
    await expect(exported.locator('[data-playing]')).toHaveCount(0);
    await page.screenshot({ path: capture(`menubar-${colorway}-reduced`), clip: { x: 0, y: (await bar(page).boundingBox())!.y - 20, width: 1280, height: 240 } });
    await exported.click();
    await expect(page.locator('section', { hasText: 'Playground' }).first()).toContainText('Export…');
  });
}

test('Esc closes and returns focus to the word', async ({ page }) => {
  await open(page, '/components/menubar', 'bone');
  const edit = bar(page).getByRole('menuitem', { name: 'Edit' });
  await edit.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(edit).toBeFocused();
});
