import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The Drum Part on Parts › Drum: digits centred for whole values, between two for a half, and a strip
// that runs on from 9 into 0 without an end.
const stripY = (svg: import('@playwright/test').Locator) => svg.locator('[data-part="drum.strip"]').evaluate((e) => Number((e.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)![1]));

for (const colorway of COLORWAYS) {
  test(`drums in ${colorway}`, async ({ page }) => {
    await open(page, '/components/drum', colorway);
    const drums = page.getByTestId('drum-looks').locator('svg[role="img"]');
    await expect(drums).toHaveCount(5);
    expect(await drums.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual(['drum showing 0', 'drum showing 7', 'drum showing 0', 'drum showing 3', 'drum showing 4']);
    // The strip holds 8 and 9 above 0 and 0 and 1 below 9: fourteen rows, so the wrap never shows an end.
    await expect(drums.first().locator('[data-part="drum.strip"] text')).toHaveCount(14);
    await page.getByTestId('drum-looks').screenshot({ path: capture(`drum-${colorway}`) });
  });
}

// The pitch of a digit on the page's 200 px drum (150 units wide on the 400 canvas, 36 units a digit at 52 wide).
const PITCH = 36 * (150 / 52) * (200 / 400);
const valueOf = (page: import('@playwright/test').Page) => page.getByTestId('drum-turn').getAttribute('data-value').then(Number);

test('the arrow keys step it a digit, and past 9 it runs on into 0', async ({ page }) => {
  await open(page, '/components/drum', 'bone');
  const drum = page.getByTestId('drum-turn');
  await drum.focus();
  await page.keyboard.press('ArrowUp');
  await expect(drum).toHaveAttribute('aria-valuenow', '8');
  await expect.poll(() => valueOf(page)).toBe(8);                       // it settles on the digit exactly
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(drum).toHaveAttribute('aria-valuenow', '0');              // 9, then on into 0
  await expect.poll(() => valueOf(page)).toBe(10);                      // forward: ten, not back to zero
});

test('dragged, it follows the hand; let go, it settles on a whole digit', async ({ page }) => {
  await open(page, '/components/drum', 'graphite');
  const drum = page.getByTestId('drum-turn');
  await drum.scrollIntoViewIfNeeded();
  const box = (await drum.boundingBox())!, x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - PITCH * 2.3, { steps: 20 });             // two and a bit digits up, slowly
  const held = await valueOf(page);
  expect(held).toBeGreaterThan(8.9);
  expect(held).toBeLessThan(9.6);
  await page.waitForTimeout(150);                                        // the hand stops, then lets go
  await page.mouse.up();
  await expect.poll(() => valueOf(page)).toBe(9);                       // no flick: the nearest digit
  // A flick carries on past where the hand let go.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - PITCH, { steps: 2 });
  await page.mouse.up();
  await expect.poll(async () => Number.isInteger(await valueOf(page))).toBe(true);
  expect(await valueOf(page)).toBeGreaterThan(10);
});

test('with reduced motion a key puts it on the digit at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/drum', 'bone');
  await page.getByTestId('drum-turn').focus();
  await page.keyboard.press('ArrowDown');
  expect(await valueOf(page)).toBe(6);
});
