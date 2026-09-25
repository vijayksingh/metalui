import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Mechanisms (packages/metalui/gadgets/src/mechanisms): the seat act on Foundations › Mechanisms.
// One cue list drives motion, lamp and sound: the click lands when the plug does, a second act is
// ignored, a change of state springs on from where the plug is, and reduced motion keeps the meaning.
type Page = import('@playwright/test').Page;
const plugY = (page: Page) => page.locator('[data-part="plug"]').evaluate((el) => {
  const m = (el.getAttribute('transform') ?? '').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
  return m ? { x: +m[1] - 200, y: +m[2] - 214 } : { x: 0, y: 0 };
});
const cues = (page: Page) => page.locator('[data-testid="cue-log"] [data-cue-kind]').evaluateAll((els) =>
  els.map((e) => `${(e as HTMLElement).dataset.cueKind}@${(e as HTMLElement).dataset.cueAt}${(e as HTMLElement).dataset.skipped ? ':' + (e as HTMLElement).dataset.skipped : ''}`));

test('the plug lifts and seats, and the click lands with it', async ({ page }) => {
  await open(page, '/foundations/mechanisms', 'bone');
  // Sample the plug every frame through the act: it lifts the full 14 units, then comes home.
  const track = page.locator('[data-part="plug"]').evaluate((el) => new Promise<number[]>((done) => {
    const ys: number[] = [], t0 = performance.now();
    const tick = () => {
      const m = (el.getAttribute('transform') ?? '').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
      ys.push(m ? +m[2] - 214 : 0);
      if (performance.now() - t0 < 1100) requestAnimationFrame(tick); else done(ys);
    };
    requestAnimationFrame(tick);
  }));
  await page.getByTestId('seat-act').click();
  const ys = await track;
  expect(Math.min(...ys)).toBeCloseTo(-14, 0);                      // lifted 14 units, nearer the light
  expect(Math.max(...ys)).toBeGreaterThan(0.5);                     // one small overshoot as it seats
  await expect.poll(() => cues(page), { timeout: 2000 }).toEqual(['strike@120', 'strike@517', 'lamp@517', 'beep@537']);
  await page.waitForTimeout(500);
  expect(Math.abs((await plugY(page)).y)).toBeLessThan(0.05);      // home, exactly
  await expect(page.locator('[data-lamp]')).toHaveAttribute('data-gesture', 'flicker');
});

test('a second act while one plays is ignored', async ({ page }) => {
  await open(page, '/foundations/mechanisms', 'graphite');
  await page.getByTestId('seat-act').click();
  await page.waitForTimeout(80);
  await page.getByTestId('seat-act').click();
  await page.waitForTimeout(1100);
  expect(await cues(page)).toEqual(['strike@120', 'strike@517', 'lamp@517', 'beep@537']);
});

test('a change of state mid-act springs on from where the plug is, and cancels the pending lamp and beep', async ({ page }) => {
  await open(page, '/foundations/mechanisms', 'bone');
  await page.getByTestId('seat-act').click();
  await page.waitForTimeout(250);
  await page.getByRole('radio', { name: 'Failed' }).click();
  await page.waitForTimeout(1600);
  const p = await plugY(page);
  expect(p.x).toBeCloseTo(-22, 0);
  expect(p.y).toBeCloseTo(-46, 0);
  const log = await cues(page);
  expect(log).toContain('strike@120');
  expect(log).not.toContain('beep@537');
  expect(log).not.toContain('lamp@517');
  await expect(page.locator('[data-lamp]')).toHaveAttribute('data-lamp', 'failed');
  // Back to connected: it springs home.
  await page.getByRole('radio', { name: 'Connected' }).click();
  await page.waitForTimeout(1600);
  expect(Math.abs((await plugY(page)).y)).toBeLessThan(0.1);
});

test('with reduced motion the act is its click and its lamp, at once, and nothing travels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/foundations/mechanisms', 'bone');
  await page.getByTestId('seat-act').click();
  await page.waitForTimeout(200);
  expect((await plugY(page)).y).toBe(0);
  await expect.poll(() => cues(page)).toEqual(['strike@0', 'strike@0', 'lamp@0', 'beep@0']);
  await page.getByRole('radio', { name: 'Syncing' }).click();
  expect((await plugY(page)).y).toBeCloseTo(-7, 1);                 // held poses are reached at once
});

for (const colorway of COLORWAYS) {
  test(`mechanisms page in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/foundations/mechanisms', colorway);
    await page.getByTestId('seat-bench').screenshot({ path: capture(`mechanisms-seat-${colorway}`) });
  });
}
