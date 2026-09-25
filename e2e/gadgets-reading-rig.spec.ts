import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// The reading rig: two catalog gadgets in one panel, wired by a patch cable. Crossing today's line
// sends a pulse down the cord (a bead of light) and the streak rolls a day when it arrives.
const streak = (page: import('@playwright/test').Page) => page.getByTestId('rig').evaluate((rig) => ['d2', 'd1', 'd0'].map((id) => {
  const strip = rig.querySelector(`[data-inst="streak"] [data-id="${id}"] [data-moves]`)!;
  return (Math.round(-Number((strip.getAttribute('transform') ?? '').match(/translate\(0 ([-\d.]+)\)/)![1]) / 36) % 10) + 0;
}));

for (const colorway of COLORWAYS) {
  test(`the reading rig in ${colorway}`, async ({ page }) => {
    await open(page, '/gadgets/reading-rig', colorway);
    const rig = page.getByTestId('rig');
    await expect(rig.locator('svg[data-gadget]')).toHaveCount(2);
    expect(await rig.locator('svg[data-gadget]').evaluateAll((els) => els.map((e) => e.getAttribute('data-gadget')))).toEqual(['needle-gauge', 'counter-drum']);
    // Each gadget in its own tray, a jack beside each wired port, one cord between plugs.
    await expect(rig.locator('[data-layer="panel"] [data-cut="tray"]')).toHaveCount(2);
    await expect(rig.locator('[data-layer="panel"] [data-part="jack"]')).toHaveCount(2);
    await expect(rig.locator('[data-layer="plugs"] [data-part="plug"]')).toHaveCount(2);
    await expect(rig.locator('[data-cable="today.over→streak.count"] title')).toHaveText('today.over drives streak.count');
    expect(await streak(page)).toEqual([0, 1, 2]);
    await rig.screenshot({ path: capture(`gadget-reading-rig-${colorway}`) });
  });
}

test('crossing the line sends a bead down the cord, and the streak rolls a day when it arrives', async ({ page }) => {
  await open(page, '/gadgets/reading-rig', 'bone');
  const point = page.getByTestId('rig-point'), rig = page.getByTestId('rig');
  await point.focus();
  await page.keyboard.press('PageUp');                                   // 24 → 34: past 30
  await expect(rig.locator('[data-bead]')).toHaveCount(1);                // on its way
  expect(await streak(page)).toEqual([0, 1, 2]);                          // not there yet
  await expect(rig.locator('[data-bead]')).toHaveCount(0);                // arrived
  await expect.poll(() => streak(page)).toEqual([0, 1, 3]);
  await expect(page.getByTestId('rig-log')).toHaveText('today.over → streak.count: 13');
  // Staying past the line sends nothing; back under and over again sends another day.
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  expect(await streak(page)).toEqual([0, 1, 3]);
  await page.keyboard.press('PageDown');                                  // 35 → 25
  await page.keyboard.press('PageUp');                                    // 25 → 35
  await expect.poll(() => streak(page)).toEqual([0, 1, 4]);
});

test('with reduced motion the value arrives at once, without a bead', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/gadgets/reading-rig', 'graphite');
  await page.getByTestId('rig-point').focus();
  await page.keyboard.press('PageUp');
  await expect(page.getByTestId('rig').locator('[data-bead]')).toHaveCount(0);
  expect(await streak(page)).toEqual([0, 1, 3]);
});
