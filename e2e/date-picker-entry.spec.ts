import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date(2026, 8, 30, 10)); });
for (const colorway of COLORWAYS) {
  test(`segmented entry validates and submits the same value as the calendar in ${colorway}`, async ({ page }) => {
    await open(page, '/components/calendar#entry', colorway);
    const input = page.locator('input[type="date"][aria-label="Delivery day"]');
    await expect(input).toHaveAttribute('type', 'date');
    await expect(input).toHaveAttribute('aria-describedby', /.+/);
    await page.getByRole('button', { name: 'Save delivery', exact: true }).click();
    await expect(input).toBeFocused();
    await expect(page.getByRole('status', { name: 'Submitted dates' })).toHaveText('No form submitted');
    await input.fill('2026-09-19');
    await expect(page.getByRole('alert')).toHaveText('Choose a working day');
    expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await input.fill('2026-09-18');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Save delivery', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Submitted dates' })).toHaveText('{"delivery":"2026-09-18"}');
    await page.getByRole('button', { name: 'Clear Delivery day', exact: true }).click();
    await expect(input).toHaveValue('');
    await input.fill('2026-09-18');
    await page.getByRole('button', { name: /^Delivery day:/ }).click();
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(input).toHaveValue('2026-09-30');
    await page.getByRole('button', { name: /^Holiday range:/ }).click();
    await page.getByRole('button', { name: 'Last 7 days', exact: true }).click();
    await expect(page.getByLabel('Holiday range start', { exact: true })).toHaveValue('2026-09-24');
    await expect(page.getByLabel('Holiday range end', { exact: true })).toHaveValue('2026-09-30');
    await expect(page.locator('input[type="hidden"][name="holiday"]')).toHaveValue('2026-09-24/2026-09-30');
    await expect(page.getByLabel('Read-only date', { exact: true })).toHaveAttribute('readonly', '');
    await expect(page.getByRole('button', { name: /^Read-only date:/ })).toBeDisabled();
    await expect(page.getByLabel('Disabled date', { exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Disabled date:/ })).toBeDisabled();
    await page.locator('#entry').screenshot({ path: capture(`date-picker-entry-${colorway}`) });
  });
}

test('time-zone changes preserve the instant; typed DST gaps refuse an impossible wall clock', async ({ page }) => {
  await open(page, '/components/calendar#entry', 'bone');
  const day = page.locator('input[type="date"][aria-label="Appointment"]');
  const time = page.getByLabel('Appointment time', { exact: true });
  await expect(day).toHaveValue('2026-09-30');
  await expect(time).toHaveValue('10:00');
  await page.getByRole('combobox', { name: 'Appointment time zone', exact: true }).click();
  await page.getByRole('option', { name: 'Asia/Kolkata', exact: true }).click();
  await expect(time).toHaveValue('19:30');
  await expect(page.getByRole('status', { name: 'Appointment instant' })).toHaveText('2026-09-30T14:00:00.000Z');
  await page.getByRole('combobox', { name: 'Appointment time zone', exact: true }).click();
  await page.getByRole('option', { name: 'America/New York', exact: true }).click();
  await day.fill('2026-03-08');
  await time.fill('02:30');
  await expect(page.getByRole('alert')).toHaveText('This local time does not exist in the selected time zone');
  await expect(page.getByRole('status', { name: 'Appointment instant' })).toHaveText('2026-03-08T14:00:00.000Z');
  await time.fill('03:30');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('status', { name: 'Appointment instant' })).toHaveText('2026-03-08T07:30:00.000Z');
  await day.fill('2026-11-01');
  await time.fill('01:30');
  await expect(page.getByRole('status', { name: 'Appointment instant' })).toHaveText('2026-11-01T05:30:00.000Z');
});

test('multiple picker keeps choices open until Done and serializes independent days', async ({ page }) => {
  await open(page, '/components/calendar#selections', 'graphite');
  await page.getByRole('button', { name: /^Visit days:/ }).click();
  const picker = page.getByRole('group', { name: 'Visit days', exact: true });
  await picker.getByRole('button', { name: /,? 8 September 2026$/ }).click();
  await picker.getByRole('button', { name: /,? 10 September 2026$/ }).click();
  await expect(picker.getByRole('gridcell', { selected: true })).toHaveCount(2);
  await expect(page.locator('input[type="hidden"][name="visits"]')).toHaveValue('2026-09-08,2026-09-10');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(picker).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear Visit days', exact: true }).click();
  await expect(page.locator('input[type="hidden"][name="visits"]')).toHaveValue('');
});

test('appointment Today and the current-day lamp use the display time zone', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-30T02:00:00Z'));
  await open(page, '/components/calendar#entry', 'bone');
  await page.getByRole('button', { name: /^Appointment:/ }).click();
  const picker = page.getByRole('group', { name: 'Appointment', exact: true });
  await expect(picker.getByRole('button', { name: /29 September 2026/ })).toHaveAttribute('aria-current', 'date');
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.locator('input[type="date"][aria-label="Appointment"]')).toHaveValue('2026-09-29');
  await expect(page.getByRole('status', { name: 'Appointment instant' })).toHaveText('2026-09-29T14:00:00.000Z');
});

test('Base UI Form refuses an incomplete required range and submits the complete canonical range', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/calendar#entry', 'graphite');
  await page.getByLabel('Holiday range start', { exact: true }).fill('2026-09-24');
  await page.getByRole('button', { name: 'Save holiday', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Submitted range' })).toHaveText('No range submitted');
  await expect(page.getByLabel('Holiday range start', { exact: true })).toBeFocused();
  await page.getByLabel('Holiday range end', { exact: true }).fill('2026-09-25');
  await page.getByRole('button', { name: 'Save holiday', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Submitted range' })).toHaveText('{"holiday":"2026-09-24/2026-09-25"}');
});
