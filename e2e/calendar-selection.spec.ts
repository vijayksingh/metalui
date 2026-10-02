import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date(2026, 8, 30, 10)); });
for (const colorway of COLORWAYS) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`calendar ranges, limits, and independent dates in ${colorway}, ${reducedMotion}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await open(page, '/components/calendar#selections', colorway);
      const trip = page.getByRole('group', { name: 'Trip range', exact: true });
      await expect(trip.getByRole('grid')).toHaveCount(2);
      const september = trip.getByRole('grid', { name: 'September 2026' });
      const october = trip.getByRole('grid', { name: 'October 2026' });
      await september.getByRole('button', { name: /,? 29 September 2026$/ }).click();
      await october.getByRole('button', { name: /,? 3 October 2026$/ }).hover();
      await expect(trip.locator('[data-preview]')).toHaveCount(5);
      await october.getByRole('button', { name: /,? 3 October 2026$/ }).click();
      await expect(trip.getByRole('gridcell', { selected: true })).toHaveCount(5);
      const band = trip.locator('.calendar-range-cell').first();
      expect(await band.evaluate((el) => getComputedStyle(el, '::before').backgroundImage)).not.toBe('none');
      await september.getByRole('button', { name: /,? 10 September 2026$/ }).click();
      await september.getByRole('button', { name: /,? 25 September 2026$/ }).click();
      await expect(trip.getByRole('gridcell', { selected: true })).toHaveCount(1);
      await september.getByRole('button', { name: /,? 15 September 2026, Concert$/ }).click();
      await expect(trip.getByRole('gridcell', { selected: true })).toHaveCount(6);
      await september.getByRole('button', { name: /,? 18 September 2026$/ }).click();
      await september.getByRole('button', { name: /,? 22 September 2026$/ }).click();
      await expect(trip.getByRole('gridcell', { selected: true })).toHaveCount(1);
      await expect(september.getByRole('button', { name: /20 September 2026, Booked/ })).toHaveAttribute('aria-disabled', 'true');
      await september.getByRole('button', { name: /,? 19 September 2026$/ }).click();
      await expect(trip.getByRole('gridcell', { selected: true })).toHaveCount(2);
      await expect(september.getByRole('columnheader' , { name: 'Wk' })).toBeVisible();
      await expect(trip.getByRole('button', { name: 'Previous month' })).toBeDisabled();
      await expect(trip.getByRole('button', { name: 'Next month' })).toBeDisabled();
      const working = page.getByRole('group', { name: 'Working days', exact: true });
      await expect(working.locator('thead th').first()).toHaveAttribute('abbr', 'Sunday');
      const sunday = working.getByRole('button', { name: /,? 6 September 2026, Weekend$/ });
      await expect(sunday).toHaveAttribute('aria-disabled', 'true');
      await sunday.focus();
      await page.keyboard.press('Enter');
      await expect(working.getByRole('gridcell', { selected: true })).toHaveCount(0);
      await page.keyboard.press('ArrowRight');
      await expect(working.getByRole('button', { name: /,? 7 September 2026$/ })).toBeFocused();
      await page.keyboard.press('Enter');
      await working.getByRole('button', { name: /,? 9 September 2026$/ }).click();
      await expect(working.getByRole('gridcell', { selected: true })).toHaveCount(2);
      await working.getByRole('button', { name: /,? 7 September 2026$/ }).click();
      await expect(working.getByRole('gridcell', { selected: true })).toHaveCount(1);
      await trip.screenshot({ path: capture(`calendar-range-${colorway}-${reducedMotion}`) });
    });
  }
}

test('date picker forwards eligibility and the title jumps to a distant month', async ({ page }) => {
  await open(page, '/components/calendar', 'bone');
  await page.getByRole('button', { name: 'Limited date: none chosen', exact: true }).click();
  const limited = page.getByRole('group', { name: 'Limited date', exact: true });
  await expect(limited.getByRole('button', { name: /,? 9 September 2026$/ })).toBeDisabled();
  await expect(limited.getByRole('button', { name: /,? 10 September 2026$/ })).toBeEnabled();
  await limited.getByRole('button', { name: /,? 20 September 2026$/ }).click();
  await expect(page.getByRole('button', { name: 'Limited date: 20 Sept 2026', exact: true })).toBeVisible();
  const working = page.getByRole('group', { name: 'Working days', exact: true });
  await working.getByRole('button', { name: 'Choose month and year: September 2026', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Calendar year' }).fill('1985');
  await page.getByRole('button', { name: 'February', exact: true }).click();
  await expect(working.getByRole('grid', { name: 'February 1985' })).toBeVisible();
});

test('calendar wraps two months and has no detached plate on a narrow page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/components/calendar#selections', 'bone');
  const trip = page.getByRole('group', { name: 'Trip range', exact: true });
  await trip.scrollIntoViewIfNeeded();
  const boxes = await trip.getByRole('grid').evaluateAll((nodes) => nodes.map((node) => { const box = node.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top }; }));
  expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  expect(boxes.every((box) => box.left >= 0 && box.right <= 390)).toBe(true);
  await expect(trip.locator('.mu-calendar-day[tabindex="0"]')).toHaveCount(1);
  await trip.screenshot({ path: capture('calendar-range-narrow') });
});
