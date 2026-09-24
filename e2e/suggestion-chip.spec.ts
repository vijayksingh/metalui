import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

const settled = (l: import('@playwright/test').Locator) => l.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

// Suggestion chip: faint at rest, full when its block is hovered, accept by keyboard applies it.
for (const colorway of COLORWAYS) {
  test(`ask, hover and accept in ${colorway}`, async ({ page }) => {
    await open(page, '/components/suggestion-chip', colorway);
    const block = page.getByTestId('sugg-block');
    const chip = block.getByRole('group', { name: /Suggestion: Task\? Confidence 0\.72/ });
    await settled(chip);
    expect(Number(await chip.evaluate((el) => getComputedStyle(el).opacity))).toBeCloseTo(0.62, 2);
    await block.hover();
    await settled(chip);
    expect(Number(await chip.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    await page.locator('section', { hasText: 'Hover the block' }).first().screenshot({ path: capture(`suggestion-chip-${colorway}`) });
    await chip.getByRole('button', { name: 'Accept' }).focus();
    await page.keyboard.press('Enter');
    await expect(chip).toHaveCount(0);
    await expect(block.getByRole('checkbox')).toBeVisible();
    await page.locator('section', { hasText: 'rest (.62)' }).first().screenshot({ path: capture(`suggestion-chip-states-${colorway}`) });
  });
}

for (const reduce of [false, true]) {
  test(`the chip arrives ${reduce ? 'in place under reduced motion' : 'from 3 above'}`, async ({ page }) => {
    if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/suggestion-chip', 'bone');
    const chip = page.getByTestId('sugg-block').getByRole('group');
    // The arrival's first frame: settle travels 3 and scales .96; under Reduce Motion it only fades.
    const first = await chip.evaluate((el) => {
      for (const a of el.getAnimations()) { a.pause(); a.currentTime = 0; }
      return new DOMMatrix(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform);
    });
    if (reduce) { expect(first.f).toBeCloseTo(0, 3); expect(first.a).toBeCloseTo(1, 3); }
    else { expect(first.f).toBeCloseTo(-3, 1); expect(first.a).toBeCloseTo(0.96, 2); }
  });
}
