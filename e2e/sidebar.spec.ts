import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Sidebar: one highlight sits under the current place and glides to a new one; collapsing to a rail
// keeps every item named and shows it as a tooltip; expanding brings the words back.
const nav = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Spaces', exact: true });
const glideOff = (page: import('@playwright/test').Page) => nav(page).evaluate((el) => {
  const hl = el.querySelector('.mu-indicator')!.getBoundingClientRect();
  const cur = el.querySelector('[aria-current="page"]')!.getBoundingClientRect();
  return Math.abs(hl.top - cur.top);
});

for (const colorway of COLORWAYS) {
  test(`moves between places and folds to a rail, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/sidebar', colorway);
    await expect(nav(page).getByRole('link', { name: 'Notes' })).toHaveAttribute('aria-current', 'page');
    await nav(page).getByRole('link', { name: 'Trash' }).click();
    await expect(nav(page).getByRole('link', { name: 'Trash' })).toHaveAttribute('aria-current', 'page');
    await expect.poll(() => glideOff(page)).toBeLessThan(1);
    await expect(nav(page).getByRole('group', { name: 'Kept' })).toBeVisible();

    const wide = (await nav(page).boundingBox())!.width;
    await nav(page).getByRole('button', { name: 'Collapse to a rail' }).click();
    await expect.poll(async () => (await nav(page).boundingBox())!.width).toBeLessThan(wide - 100);
    await expect(nav(page).getByRole('link', { name: 'Regions' })).toBeVisible();
    await nav(page).getByRole('link', { name: 'Regions' }).hover();
    await expect(page.locator('.mu-tooltip')).toContainText('Regions');
    await page.waitForTimeout(500);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`sidebar-${colorway}`) });
    await nav(page).getByRole('button', { name: 'Expand the sidebar' }).click();
    await expect.poll(async () => (await nav(page).boundingBox())!.width).toBeGreaterThan(wide - 1);
  });
}

test('collapsing, the words leave before the width moves', async ({ page }) => {
  await open(page, '/components/sidebar', 'bone');
  const r = await nav(page).evaluate(async (el) => {
    const words = el.querySelector('.mu-sidebar-words')!;
    const w0 = el.getBoundingClientRect().width;
    (el.querySelector('[aria-label="Collapse to a rail"]') as HTMLElement).click();
    let wordsHalf = -1, widthHalf = -1;
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => {
        const t = performance.now() - t0;
        if (wordsHalf < 0 && parseFloat(getComputedStyle(words).opacity) < 0.5) wordsHalf = t;
        if (widthHalf < 0 && w0 - el.getBoundingClientRect().width > (w0 - 56) / 2) widthHalf = t;
        if (t < 900) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    });
    return { wordsHalf, widthHalf };
  });
  expect(r.wordsHalf).toBeGreaterThan(0);
  expect(r.widthHalf).toBeGreaterThan(r.wordsHalf);
});

for (const colorway of COLORWAYS) {
  test(`one Tab stop per sidebar action in ${colorway}`, async ({ page }) => {
    await open(page, '/components/sidebar', colorway);
    const rail = nav(page);
    const links = rail.getByRole('link');
    for (const collapsed of [false, true]) {
      if (collapsed) await rail.getByRole('button', { name: 'Collapse to a rail' }).click();
      await links.first().focus();
      for (let index = 1; index < await links.count(); index++) {
        await page.keyboard.press('Tab');
        await expect(links.nth(index)).toBeFocused();
      }
      await page.keyboard.press('Tab');
      await expect(rail.getByRole('button', { name: collapsed ? 'Expand the sidebar' : 'Collapse to a rail' })).toBeFocused();
    }
  });
}
