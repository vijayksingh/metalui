import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`async key reserves its face, refuses repeats, lands and retries in ${colorway}`, async ({ page }) => {
    await open(page, '/components/button', colorway);
    const demo = page.locator('#waiting');
    await demo.scrollIntoViewIfNeeded();
    const key = demo.locator('button[data-cap=primary]');
    await expect(key.locator('svg.mu-ic-save').filter({ visible: true })).toHaveCount(1);
    const width = (await key.boundingBox())!.width;
    await demo.getByRole('button', { name: 'Slow save', exact: true }).click();
    await key.click();
    await expect(key).toHaveAttribute('aria-busy', 'true');
    await expect(key).toHaveAttribute('aria-disabled', 'true');
    await key.dispatchEvent('click');
    await key.press('Enter');
    await expect(demo.getByTestId('save-requests')).toHaveText('1 request');
    await expect(key).toHaveAccessibleName('Saving…');
    expect((await key.boundingBox())!.width).toBe(width);
    const arc = key.locator('.spinner-arc');
    await expect(arc).toHaveCount(1);
    expect(await arc.evaluate((el) => getComputedStyle(el).getPropertyValue('--mu-spinner-ink'))).toBe('currentColor');
    await page.mouse.move(0, 0);
    await page.screenshot({ path: capture(`button-waiting-${colorway}`), clip: (await demo.boundingBox())! });
    await expect(key).toHaveAccessibleName('Saved');
    await expect(arc).toHaveCount(0);
    expect((await key.boundingBox())!.width).toBe(width);
    await key.dispatchEvent('click');
    await expect(demo.getByTestId('save-requests')).toHaveText('1 request');
    await demo.getByRole('button', { name: 'Failed save', exact: true }).click();
    await key.click();
    await expect(key).toHaveAccessibleName('Try again');
    await expect(key).not.toHaveAttribute('aria-disabled', 'true');
    expect((await key.boundingBox())!.width).toBe(width);
    await key.click();
    await expect(key).toHaveAttribute('aria-busy', 'true');
    await expect(demo.getByTestId('save-requests')).toHaveText('3 requests');
  });
}

test('quick results skip wait, brief waits keep their minimum, newer requests cancel stale results', async ({ page }) => {
  await open(page, '/components/button', 'bone');
  const demo = page.locator('#waiting');
  const key = demo.locator('button[data-cap=primary]');
  await demo.getByRole('button', { name: 'Quick save', exact: true }).click();
  await key.click();
  await expect(key).toHaveAccessibleName('Saved');
  await expect(key.locator('.spinner-arc')).toHaveCount(0);
  await demo.getByRole('button', { name: 'Brief wait', exact: true }).click();
  await key.click();
  await expect.poll(() => key.locator('.spinner-arc').count(), { intervals: [25], timeout: 1500 }).toBe(1);
  await expect.poll(() => key.getAttribute('aria-busy'), { intervals: [25] }).not.toBe('true');
  await expect(key.locator('.spinner-arc')).toHaveCount(1);
  // Cancel during the minimum and immediately start another host request.
  await demo.getByRole('button', { name: 'Slow save', exact: true }).click();
  await expect(key).toHaveAccessibleName('Save');
  await key.click();
  await page.waitForTimeout(800);
  await expect(key).toHaveAccessibleName('Saving…');
  await expect(key).toHaveAttribute('aria-busy', 'true');
  await expect(key).toHaveAccessibleName('Saved');
});

test('scoped and OS reduced motion remove rotation; an offscreen arc pauses', async ({ page }) => {
  // The arc lives only while the save is pending (shown after 400ms, done at 1800ms). Own the clock so
  // the off-screen check always lands mid-save, however slow the machine is; animations are untouched.
  await page.clock.install();
  await open(page, '/components/button', 'graphite');
  const demo = page.locator('#waiting');
  await demo.scrollIntoViewIfNeeded();
  await demo.evaluate((el) => el.setAttribute('data-mu-motion', 'reduce'));
  await demo.getByRole('button', { name: 'Slow save', exact: true }).click();
  const key = demo.locator('button[data-cap=primary]');
  await key.click();
  await page.clock.runFor(500);
  const arc = key.locator('.spinner-arc');
  await expect(arc).toHaveCount(1);
  expect(await arc.evaluate((el) => getComputedStyle(el).animationName)).toBe('mu-progress-breathe');
  await page.screenshot({ path: capture('button-waiting-reduced'), clip: (await demo.boundingBox())! });
  await page.evaluate(() => scrollTo(0, 0));
  await expect(arc).toHaveCSS('animation-play-state', 'paused');
  await page.clock.runFor(2000);
  await expect(key).toHaveAccessibleName('Saved');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demo.evaluate((el) => el.removeAttribute('data-mu-motion'));
  await demo.getByRole('button', { name: 'Slow save', exact: true }).click();
  await key.click();
  await page.clock.runFor(500);
  await expect(arc).toHaveCount(1);
  expect(await arc.evaluate((el) => getComputedStyle(el).animationName)).toBe('mu-progress-breathe');
});

test('start and outcome are atomic siblings outside the busy key without changing its footprint', async ({ page }) => {
  await open(page, '/components/button', 'bone');
  const demo = page.locator('#waiting');
  const key = demo.locator('button[data-cap=primary]');
  const width = (await key.boundingBox())!.width;
  await demo.getByRole('button', { name: 'Slow save', exact: true }).click();
  await key.click();
  const status = demo.getByRole('status').filter({ hasText: 'Saving…' });
  await expect(status).toHaveText('Saving…');
  await expect(status).toHaveAttribute('aria-atomic', 'true');
  expect(await status.evaluate((el) => Boolean(el.closest('[aria-busy=true]')))).toBe(false);
  expect((await key.boundingBox())!.width).toBe(width);
  await expect(demo.getByRole('status').filter({ hasText: 'Saved' })).toHaveText('Saved');
  expect((await key.boundingBox())!.width).toBe(width);
});
