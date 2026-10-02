import { expect, test, type Page } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Availability picker block: the month runs from today to six weeks out, a day shows its free times
// (a weekend none), the time zone re-labels them, a time latches and Confirm books it, all of it from
// the keyboard too; keys arrive from the side the calendar moved unless motion is reduced; the layout
// follows the block's own width.
test.use({ timezoneId: 'Europe/Lisbon' });

const NOW = new Date('2026-09-30T10:00:00+01:00'); // a Wednesday morning in Lisbon
const block = (page: Page) => page.getByRole('region', { name: 'Book a call with Ana Rocha' });
const times = (page: Page) => block(page).getByRole('radiogroup', { name: /^Free times/ });
const day = (page: Page, name: string) => block(page).getByRole('button', { name: new RegExp(`^${name}(?:, No available times)?$`) });

async function visit(page: Page, colorway: 'bone' | 'graphite' = 'bone') {
  await page.clock.setFixedTime(NOW);
  await open(page, '/blocks/availability-picker', colorway);
  await expect(block(page)).toBeVisible();
}

test('the month runs from today to six weeks out', async ({ page }) => {
  await visit(page);
  await expect(day(page, 'Tuesday, 29 September 2026')).toBeDisabled();
  await expect(day(page, 'Wednesday, 30 September 2026')).toBeEnabled();
  await expect(block(page).getByRole('button', { name: 'Previous month' })).toBeDisabled();
  await block(page).getByRole('button', { name: 'Next month' }).click();
  await block(page).getByRole('button', { name: 'Next month' }).click();
  await expect(day(page, 'Wednesday, 11 November 2026')).toBeEnabled();
  await expect(day(page, 'Thursday, 12 November 2026')).toBeDisabled();
  await expect(block(page).getByRole('button', { name: 'Next month' })).toBeDisabled();
});

test('unavailable weekends announce their reason and keep the chosen free day', async ({ page }) => {
  await visit(page);
  const b = block(page);
  const weekend = day(page, 'Saturday, 3 October 2026');
  await expect(weekend).toBeDisabled();
  await expect(weekend).toHaveAccessibleName('Saturday, 3 October 2026, No available times');
  await expect(times(page).getByRole('radio').first()).toBeVisible();
  await expect(b.getByRole('heading', { level: 3 })).toContainText('Wednesday 30 September');
});

test('the time zone re-labels the times', async ({ page }) => {
  await visit(page);
  const first = times(page).getByRole('radio').first();
  const lisbon = (await first.getAttribute('aria-label'))!;
  await block(page).getByRole('combobox', { name: 'Time zone' }).click();
  await page.getByRole('option', { name: /New York/ }).click();
  const [h, m] = lisbon.split(':').map(Number);
  const newYork = `${String((h + 24 - 5) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`; // Lisbon is 5 hours ahead in October
  await expect(first).toHaveAttribute('aria-label', newYork);
  await expect(first).toContainText(newYork);
});

for (const colorway of COLORWAYS) {
  test(`a time latches and Confirm books it, in ${colorway}`, async ({ page }) => {
    await visit(page, colorway);
    const b = block(page);
    const key = times(page).getByRole('radio').nth(1);
    const time = (await key.getAttribute('aria-label'))!;
    await key.click();
    await expect(key).toHaveAttribute('aria-checked', 'true');
    await expect(key).toHaveAttribute('data-pressed', '');
    await expect(b).toContainText(new RegExp(`${time}–\\d\\d:\\d\\d`));
    await expect(b).toContainText('Lisbon time');
    await page.waitForTimeout(600);
    await b.screenshot({ path: capture(`block-availability-picker-${colorway}`) });

    await b.getByRole('button', { name: 'Confirm' }).click();
    await expect(b.getByRole('button', { name: 'Booking…' })).toHaveAttribute('aria-busy', 'true');
    await expect(b.getByRole('button', { name: 'Booked' })).toBeVisible();
    await expect(b.getByRole('status').filter({ hasText: 'Booked:' })).toContainText(`${time}–`);
    await page.waitForTimeout(600);
    await b.screenshot({ path: capture(`block-availability-picker-booked-${colorway}`) });

    // Change goes back: the columns are live again and the key reads Confirm.
    await b.getByRole('button', { name: 'Change' }).click();
    await expect(b.getByRole('button', { name: 'Confirm' })).toBeFocused();
    await expect(key).toHaveAttribute('aria-checked', 'true');
  });
}

test('the whole booking works from the keyboard', async ({ page }) => {
  await visit(page);
  const b = block(page);
  const chosen = b.locator('.mu-calendar-day[data-selected]');
  await chosen.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab'); // the time zone
  await expect(b.getByRole('combobox', { name: 'Time zone' })).toBeFocused();
  await page.keyboard.press('Tab'); // into the times
  await expect(times(page).getByRole('radio').first()).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  const second = times(page).getByRole('radio').nth(1);
  await expect(second).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Tab');
  await expect(b.getByRole('button', { name: 'Confirm' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(b.getByRole('status').filter({ hasText: 'Booked:' })).toBeAttached();
});

test('keys arrive from the side the calendar moved; reduced motion changes at once', async ({ page }) => {
  await visit(page);
  const b = block(page);
  // The first key's first frame: where it comes in from.
  const from = () => b.evaluate((el) => {
    const frames = (el.querySelector('[data-arrive]')?.getAnimations() ?? []).map((a) => (a.effect as KeyframeEffect).getKeyframes()[0]).filter((f) => f.transform);
    return frames.length ? String(frames[frames.length - 1].transform) : 'none';
  });
  await day(page, 'Tuesday, 6 October 2026').click(); // later: from the right
  expect(await from()).toMatch(/^translate\(8px, 0px\)/);
  await day(page, 'Monday, 5 October 2026').click(); // earlier: from the left
  expect(await from()).toMatch(/^translate\(-8px, 0px\)/);
  await b.getByRole('radio', { name: '60 min' }).click(); // same day, new length: up one step
  expect(await from()).toMatch(/^translate\(0px, 4px\)/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await day(page, 'Wednesday, 7 October 2026').click();
  await expect(times(page)).toHaveAttribute('aria-label', 'Free times, Wednesday 7 October');
  const still = await b.evaluate((el) => [...el.querySelectorAll('[data-arrive]')].reduce((n, k) => n + k.getAnimations().length, 0));
  expect(still).toBe(0);
});

test('the layout follows the block\'s own width', async ({ page }) => {
  await visit(page);
  const b = block(page);
  const tops = async () => b.evaluate((el) => {
    const top = (sel: string) => Math.round(el.querySelector(sel)!.getBoundingClientRect().top);
    return { host: top('.mu-avatar'), month: top('.mu-calendar'), times: top('h3') };
  });
  // Wide: three columns side by side.
  await b.evaluate((el) => { Object.assign((el as HTMLElement).style, { width: '960px', flex: 'none' }); }); // a flex item: it would shrink back to the bench
  await expect.poll(async () => { const t = await tops(); return Math.abs(t.host - t.month) < 24 && Math.abs(t.month - t.times) < 24; }).toBe(true);
  // The docs column: the host across the top, the month and the times side by side.
  await b.evaluate((el) => { Object.assign((el as HTMLElement).style, { width: '', flex: '' }); });
  await expect.poll(async () => { const t = await tops(); return t.host < t.month - 100 && Math.abs(t.month - t.times) < 24; }).toBe(true);
  // A phone: everything stacks.
  await page.setViewportSize({ width: 375, height: 900 });
  await expect.poll(async () => { const t = await tops(); return t.host < t.month && t.month < t.times; }).toBe(true);
  await times(page).getByRole('radio').first().click();
  await page.waitForTimeout(600);
  await b.screenshot({ path: capture('block-availability-picker-narrow') });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
