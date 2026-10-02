import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Pagination: the current page is marked and the thumb glides to a chosen page; ends disable the
// arrows; long runs fold into gaps.
const nav = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Pagination', exact: true });

for (const colorway of COLORWAYS) {
  test(`chooses, steps, folds and stops at the ends in ${colorway}`, async ({ page }) => {
    await open(page, '/components/pagination', colorway);
    await expect(nav(page).getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    // 1 2 3 4 … 12
    await expect(nav(page).getByRole('button', { name: /^Page \d+$/ })).toHaveCount(5);
    await nav(page).getByRole('button', { name: 'Page 12' }).click();
    await expect(nav(page).getByRole('button', { name: 'Page 12' })).toHaveAttribute('aria-current', 'page');
    await expect(nav(page).getByRole('button', { name: 'Next page' })).toBeDisabled();
    await nav(page).getByRole('button', { name: 'Previous page' }).click();
    await expect(nav(page).getByRole('button', { name: 'Page 11' })).toHaveAttribute('aria-current', 'page');
    await nav(page).getByRole('button', { name: 'Page 1', exact: true }).click();
    await expect(nav(page).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await page.waitForTimeout(600);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`pagination-${colorway}`) });
  });
}

test('the thumb glides to the chosen page', async ({ page }) => {
  await open(page, '/components/pagination', 'bone');
  const xs = await nav(page).evaluate(async (el) => {
    const thumb = el.querySelector('.mu-indicator')!;
    (el.querySelector('[aria-label="Page 4"]') as HTMLElement).click();
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { out.push(thumb.getBoundingClientRect().left); if (performance.now() - t0 < 600) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return { xs: out, target: el.querySelector('[aria-label="Page 4"]')!.getBoundingClientRect().left };
  });
  expect(xs.xs.some((x) => Math.abs(x - xs.target) > 2)).toBe(true);
  expect(Math.abs(xs.xs.at(-1)! - xs.target)).toBeLessThan(1);
});


test('reduced motion keeps directional keys still while page navigation remains operable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/pagination', 'graphite');
  const previous = nav(page).getByRole('button', { name: 'Previous page' });
  await previous.hover();
  await previous.click();
  await expect(nav(page).getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  await previous.click();
  await expect(previous).toBeDisabled();
  await previous.hover();
  await expect(nav(page).locator('[data-playing]')).toHaveCount(0);
  await nav(page).getByRole('button', { name: 'Next page' }).focus();
  await page.keyboard.press('Enter');
  await expect(nav(page).getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  await nav(page).screenshot({ path: capture('pagination-reduced') });
});
