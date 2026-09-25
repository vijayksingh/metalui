import { expect, test } from '@playwright/test';
import { open } from './helpers';

// The slide mechanism on Foundations › Mechanisms: a value moves the caps, staggered, with a tick per
// detent and a knock at a wall; a change mid-flight carries on from where they are; reduced motion
// puts them straight in place.
const values = (bench: import('@playwright/test').Locator) => bench.getAttribute('data-values');

test('all up: the caps rise one after another, tick, and knock the top', async ({ page }) => {
  await open(page, '/foundations/mechanisms', 'bone');
  const bench = page.getByTestId('slide-bench'), log = page.getByTestId('slide-log');
  await bench.scrollIntoViewIfNeeded();
  await bench.getByRole('button', { name: 'All up' }).click();
  await expect(bench).toHaveAttribute('data-values', '1.00,1.00,1.00');
  await expect(log.locator('[data-kind="stop"]')).toHaveCount(3);
  await expect(log.locator('[data-kind="stop"]').first()).toContainText('knocks the top');
  expect(await log.locator('[data-kind="detent"]').count()).toBeGreaterThan(2);
  // Staggered: cap 1 knocks before cap 2, cap 2 before cap 3.
  const knocks = await log.locator('[data-kind="stop"]').allTextContents();
  expect(knocks.map((k) => k.match(/cap (\d)/)![1])).toEqual(['1', '2', '3']);
  await expect(bench).toHaveAttribute('data-speed', '0.00');
});

test('a new mix mid-flight carries on from where the caps are', async ({ page }) => {
  await open(page, '/foundations/mechanisms', 'bone');
  const bench = page.getByTestId('slide-bench');
  await bench.scrollIntoViewIfNeeded();
  await bench.getByRole('button', { name: 'All down' }).click();
  await page.waitForTimeout(90);
  const mid = (await values(bench))!.split(',').map(Number);
  expect(mid[0]).toBeLessThan(0.5);                       // on its way
  expect(mid[0]).toBeGreaterThan(0);
  await bench.getByRole('button', { name: 'Mix B' }).click();
  await expect(bench).toHaveAttribute('data-values', '0.80,0.30,0.60');
});

test('with reduced motion the caps go straight to their places, each with one tick', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/foundations/mechanisms', 'bone');
  const bench = page.getByTestId('slide-bench');
  await bench.scrollIntoViewIfNeeded();
  await bench.getByRole('button', { name: 'Mix A' }).click();
  expect(await values(bench)).toBe('0.25,0.75,0.50');
  // Caps 1 and 2 moved and tick once each; cap 3 was already at 0.5.
  await expect(page.getByTestId('slide-log').locator('li[data-kind="detent"]')).toHaveCount(2);
  await expect(page.getByTestId('slide-log').locator('li[data-kind="stop"]')).toHaveCount(0);
});
