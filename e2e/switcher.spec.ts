import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Switcher: one of a few views; click or arrows move the choice and the thumb glides under it.
for (const colorway of COLORWAYS) {
  test(`choose a view by click and by arrows in ${colorway}`, async ({ page }) => {
    await open(page, '/components/switcher', colorway);
    const group = page.getByRole('radiogroup', { name: 'Lens view' });
    const radios = group.getByRole('radio');
    await radios.nth(2).click();
    await expect(radios.nth(2)).toBeChecked();
    await page.keyboard.press('ArrowRight');
    await expect(radios.nth(3)).toBeChecked();
    await expect(radios.nth(3)).toBeFocused();
    // The thumb sits under the chosen segment once it has glided there.
    await group.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
    await page.waitForTimeout(400);
    const seg = (await radios.nth(3).boundingBox())!;
    const thumb = await group.evaluate((el) => {
      const t = [...el.querySelectorAll('*')].find((n) => getComputedStyle(n).position === 'absolute' && n.getBoundingClientRect().width > 10);
      const r = t!.getBoundingClientRect();
      return { x: r.x, w: r.width };
    });
    expect(Math.abs(thumb.x - seg.x)).toBeLessThan(2);
    expect(Math.abs(thumb.w - seg.width)).toBeLessThan(2);
    await expect(page.getByRole('radiogroup', { name: 'Scale' }).getByRole('radio').first()).toBeDisabled();
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`switcher-${colorway}`) });
  });
}
