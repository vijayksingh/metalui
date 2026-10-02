import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Calendar: choose by click or keys; keys past the month turn it; the thumb glides to a new day; the
// date picker opens it, chooses, closes and names the day.
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date(2026, 8, 30, 10)); });
const cal = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Trip day', exact: true });

for (const colorway of COLORWAYS) {
  test(`chooses by click and keys, and turns months, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/calendar', colorway);
    const grid = cal(page).getByRole('grid', { name: 'September 2026' });
    await expect(grid).toBeVisible();
    await expect(grid.getByRole('button', { name: /^Wednesday,? 30 September 2026$/ })).toHaveAttribute('aria-current', 'date');
    // Weeks start on Monday in en-GB.
    await expect(grid.locator('th').first()).toHaveAttribute('abbr', 'Monday');
    await grid.getByRole('button', { name: /^Tuesday,? 15 September 2026$/ }).click();
    await expect(grid.getByRole('gridcell', { selected: true })).toHaveText('15');

    await grid.getByRole('button', { name: /^Tuesday,? 15 September 2026$/ }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(cal(page).getByRole('grid', { name: 'October 2026' })).toBeVisible();
    await expect(page.locator(':focus')).toHaveAttribute('aria-label', /^Tuesday,? 6 October 2026$/);
    await page.keyboard.press('Enter');
    await expect(cal(page).getByRole('gridcell', { selected: true })).toHaveText('6');
    await page.keyboard.press('PageUp');
    await expect(cal(page).getByRole('grid', { name: 'September 2026' })).toBeVisible();
    // The chosen 6 October shows among September's trailing days, raised.
    await expect(cal(page).locator('[data-selected]')).toHaveAttribute('aria-label', /6 October 2026/);
    await page.waitForTimeout(600);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`calendar-${colorway}`) });
  });
}

test('a chosen day lands into the thumb, and a later month comes from the right', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  const grid = cal(page).getByRole('grid', { name: 'September 2026' });
  const scales = await grid.evaluate(async (table) => {
    const day = [...table.querySelectorAll('button')].find((b) => /^Thursday,? 3 September 2026$/.test(b.getAttribute('aria-label') ?? ''))!;
    day.click();
    const out: number[] = [];
    const t0 = performance.now();
    await new Promise<void>((done) => {
      const frame = () => { const s = getComputedStyle(day).scale; out.push(s === 'none' ? 1 : parseFloat(s)); if (performance.now() - t0 < 600) requestAnimationFrame(frame); else done(); };
      requestAnimationFrame(frame);
    });
    return out;
  });
  expect(Math.min(...scales)).toBeLessThan(0.97);
  expect(scales.at(-1)).toBeCloseTo(1, 2);
  await cal(page).getByRole('button', { name: 'Next month' }).click();
  await expect(cal(page).getByRole('grid', { name: 'October 2026' })).toHaveClass(/calendar-arrive-later/);
  await cal(page).getByRole('button', { name: 'Previous month' }).click();
  await expect(cal(page).getByRole('grid', { name: 'September 2026' })).toHaveClass(/calendar-arrive-earlier/);
});

test('the date picker opens on today, chooses and closes', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  const picker = page.getByRole('button', { name: /^Due date: none chosen$/ });
  await picker.click();
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /^Wednesday,? 30 September 2026$/);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: /^Due date: 1 Oct 2026$/ })).toBeFocused();
  await expect(page.getByRole('group', { name: 'Due date', exact: true })).toHaveCount(0);
});

for (const colorway of COLORWAYS) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`adjacent-month pointer selection stays mounted in ${colorway}, ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await open(page, '/components/calendar', colorway);
      for (const [day, before, after] of [
        [/^Thursday,? 1 October 2026$/, 'September 2026', 'October 2026'],
        [/^Monday,? 28 September 2026$/, 'October 2026', 'September 2026'],
      ] as const) {
        const button = cal(page).getByRole('button', { name: day });
        await button.scrollIntoViewIfNeeded();
        const box = (await button.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        // Focusing the neighbouring day must not remove it before pointer release.
        await expect(cal(page).getByRole('grid', { name: before })).toBeVisible();
        await expect(button).toBeFocused();
        await page.mouse.up();
        await expect(cal(page).getByRole('grid', { name: after })).toBeVisible();
        await expect(cal(page).locator('[data-selected]')).toHaveAttribute('aria-label', day);
        await expect(cal(page).getByRole('button', { name: day })).toBeFocused();
      }
      if (reducedMotion === 'reduce') {
        const grid = cal(page).getByRole('grid');
        await expect(grid).toHaveCSS('--mu-travel-settle', '0');
        await expect(grid).toHaveCSS('translate', /^(none|0px(?: 0px)?)$/);
      }
      await cal(page).evaluate(async (el) => {
        await Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
      });
      await cal(page).screenshot({ path: capture(`calendar-adjacent-${colorway}-${reducedMotion}`) });
    });
  }
}

test('external day changes reveal their month without resetting an unchanged day', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  const following = page.getByRole('group', { name: 'Following calendar', exact: true });
  const controlled = page.getByRole('group', { name: 'Controlled calendar', exact: true });
  await page.getByRole('button', { name: 'Choose 15 October', exact: true }).click();
  await expect(following.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(following.locator('[data-selected]')).toHaveAttribute('aria-label', /15 October 2026/);
  await expect(controlled.getByRole('grid', { name: 'September 2026' })).toBeVisible();
  await expect(controlled.locator('.mu-calendar-day[tabindex="0"]:enabled')).toHaveCount(1);
  await expect(page.getByText('Month requests: 0', { exact: true })).toBeVisible();
  await following.getByRole('button', { name: 'Next month', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh chosen day', exact: true }).click();
  await expect(following.getByRole('grid', { name: 'November 2026' })).toBeVisible();
  await page.getByRole('button', { name: 'Show October', exact: true }).click();
  await expect(controlled.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(page.getByText('Month requests: 0', { exact: true })).toBeVisible();
});

test('controlled month requests can be accepted or held without losing keyboard access', async ({ page }) => {
  await open(page, '/components/calendar', 'graphite');
  const controlled = page.getByRole('group', { name: 'Controlled calendar', exact: true });
  await controlled.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(controlled.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(page.getByText('Month requests: 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keep month fixed', exact: true }).click();
  await controlled.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(controlled.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(page.getByText('Month requests: 2', { exact: true })).toBeVisible();
  await controlled.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(controlled.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(page.getByText('Month requests: 3', { exact: true })).toBeVisible();
  const entry = controlled.locator('.mu-calendar-day[tabindex="0"]:enabled');
  await expect(entry).toHaveCount(1);
  await entry.focus();
  await page.keyboard.press('ArrowRight');
  await expect(controlled.getByRole('grid', { name: 'October 2026' }).locator(':focus')).toHaveCount(1);
});


test('month keys step from the displayed month after an adjacent day receives focus', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  await cal(page).getByRole('button', { name: /^Thursday,? 1 October 2026$/ }).focus();
  await cal(page).getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(cal(page).getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await cal(page).getByRole('button', { name: /^Wednesday,? 30 September 2026$/ }).focus();
  await cal(page).getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(cal(page).getByRole('grid', { name: 'September 2026' })).toBeVisible();
});


test('delayed controlled month acceptance keeps keyboard focus on the requested day', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  const controlled = page.getByRole('group', { name: 'Controlled calendar', exact: true });
  await page.getByRole('button', { name: 'Defer month change', exact: true }).click();
  await controlled.getByRole('button', { name: /^Wednesday,? 30 September 2026$/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(controlled.getByRole('grid', { name: 'October 2026' })).toBeVisible();
  await expect(controlled.getByRole('button', { name: /^Thursday,? 1 October 2026$/ })).toBeFocused();
  await expect(page.getByText('Month requests: 1', { exact: true })).toBeVisible();
});
