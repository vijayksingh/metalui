import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

const share = (bar: Locator) => bar.evaluate(el => {
  const fill = el.querySelector('.mu-progress-fill')!.getBoundingClientRect();
  const track = el.querySelector('.mu-progress-track')!.getBoundingClientRect();
  return fill.width / track.width;
});

for (const colorway of COLORWAYS) for (const reduced of [false, true]) {
  test(`export pauses, resumes, finishes and resets in ${colorway}, reduced ${reduced}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await open(page, '/components/progress', colorway);
    const task = page.getByTestId('export-progress');
    const bar = task.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '40');
    await task.getByRole('button', { name: 'Run export', exact: true }).click();
    await expect(bar).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => bar.getAttribute('aria-valuenow')).not.toBe('0');
    await task.getByRole('button', { name: 'Pause', exact: true }).click();
    const held = await bar.getAttribute('aria-valuenow');
    await expect(bar).toHaveAttribute('aria-valuetext', /paused/);
    await expect(bar.locator('.mu-progress-fill')).toHaveCSS('opacity', '0.35');
    await page.waitForTimeout(500);
    await expect(bar).toHaveAttribute('aria-valuenow', held!);
    await expect(task.getByRole('button', { name: 'Resume', exact: true }).locator('svg')).toHaveAttribute('data-glyph', 'play');
    await task.getByRole('button', { name: 'Resume', exact: true }).click();
    await expect(bar).toHaveAttribute('aria-valuenow', '100', { timeout: 6000 });
    await expect(bar).toHaveAccessibleName('Exported');
    await expect(bar.locator('[data-glyph="check"]')).toBeVisible();
    await expect.poll(() => share(bar)).toBeCloseTo(1, 2);
    await expect(bar).toHaveAttribute('aria-valuetext', /100% · complete/);
    await task.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    await expect(bar).toContainText('0%');
    await expect.poll(() => share(bar)).toBeCloseTo(0, 2);
    await expect(bar.locator('.mu-progress-fill')).toHaveCSS('transition-property', 'transform');
    await task.screenshot({ path: capture(`progress-reset-${colorway}${reduced ? '-reduced' : ''}`) });
    await page.locator('#variations').screenshot({ path: capture(`progress-states-${colorway}${reduced ? '-reduced' : ''}`) });
  });
}

test('failed work keeps its amount; retry and cancellation remain with the task', async ({ page }) => {
  await open(page, '/components/progress', 'bone');
  const task = page.getByTestId('export-progress');
  const bar = task.getByRole('progressbar');
  await task.getByRole('button', { name: 'Run export', exact: true }).click();
  await expect.poll(() => bar.getAttribute('aria-valuenow')).not.toBe('0');
  await task.getByRole('button', { name: 'Simulate failure' }).click();
  const failed = await bar.getAttribute('aria-valuenow');
  await expect(bar).toHaveAttribute('aria-valuetext', /failed/);
  await expect(bar.locator('[data-glyph="sync-error"]')).toBeVisible();
  await page.waitForTimeout(400);
  await expect(bar).toHaveAttribute('aria-valuenow', failed!);
  await task.getByRole('button', { name: 'Try again' }).click();
  await expect(bar).toHaveAttribute('aria-busy', 'true');
  await task.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(bar).toHaveAttribute('aria-valuenow', '0');
  await expect(bar).toHaveAttribute('aria-valuetext', /cancelled/);
  await expect.poll(() => share(bar)).toBeCloseTo(0, 2);
  await expect(task.getByRole('status')).toHaveText('Export cancelled');
});

test('all shapes report the same known amount and unknown waits follow motion and visibility', async ({ page }) => {
  await open(page, '/components/progress', 'graphite');
  const variations = page.locator('#variations');
  for (const shape of ['bar', 'slim', 'ring', 'segmented', 'buffered']) {
    const progress = variations.getByRole('progressbar', { name: `${shape} export`, exact: true });
    await expect(progress).toHaveAttribute('aria-valuenow', '45');
    await expect(progress).toHaveAttribute('aria-valuetext', /45% · running/);
  }
  const ring = variations.getByRole('progressbar', { name: 'ring export', exact: true });
  await expect(ring.locator('.mu-progress-fill')).toHaveCSS('stroke-dasharray', '45px, 100px');
  await expect(ring.locator('.mu-progress-fill')).toHaveCSS('animation-name', 'none');
  const segmented = variations.getByRole('progressbar', { name: 'segmented export', exact: true });
  await expect(segmented.locator('.mu-progress-fill')).toHaveCount(4);
  const buffered = variations.getByRole('progressbar', { name: 'buffered export', exact: true });
  const widths = await buffered.locator('.mu-progress-fill').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
  expect(widths[0]).toBeGreaterThan(widths[1]);
  const unknown = variations.getByRole('progressbar', { name: 'Unknown active sync', exact: true });
  const fill = unknown.locator('.mu-progress-fill');
  await unknown.scrollIntoViewIfNeeded();
  await expect(unknown).not.toHaveAttribute('aria-valuenow', /.*/);
  await expect(fill).toHaveCSS('animation-play-state', 'running');
  const first = (await fill.boundingBox())!.x;
  await page.waitForTimeout(220);
  expect(Math.abs((await fill.boundingBox())!.x - first)).toBeGreaterThan(5);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(fill).toHaveCSS('animation-name', 'mu-progress-breathe');
  const reducedX = (await fill.boundingBox())!.x;
  await page.waitForTimeout(220);
  expect((await fill.boundingBox())!.x).toBeCloseTo(reducedX, 1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('checkbox', { name: 'Motion (off = Reduce Motion)' }).uncheck();
  await unknown.scrollIntoViewIfNeeded();
  await expect(fill).toHaveCSS('animation-name', 'mu-progress-breathe');
  const paused = variations.getByRole('progressbar', { name: 'Unknown paused sync', exact: true }).locator('.mu-progress-fill');
  await expect(paused).toHaveCSS('animation-play-state', 'paused');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(fill).toHaveCSS('animation-play-state', 'paused');
});
