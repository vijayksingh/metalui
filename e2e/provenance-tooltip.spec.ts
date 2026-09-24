import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Provenance: hover a cue for 380 ms and it says where it came from; the date's tooltip clears its value chip;
// keyboard focus shows it too, and Escape closes it.
for (const colorway of COLORWAYS) {
  test(`provenance on hover and focus in ${colorway}`, async ({ page }) => {
    await open(page, '/components/provenance-tooltip', colorway);
    const block = page.getByTestId('prov-block');
    const date = block.locator('.mu-cue[data-kind="date"]');
    await date.hover();
    await page.waitForTimeout(150);
    await expect(page.locator('.mu-provenance', { hasText: 'Date parser' })).toHaveCount(0);
    const tip = page.locator('.mu-provenance', { hasText: 'Date parser' });
    await expect(tip).toBeVisible();
    await expect(date).toHaveAttribute('aria-description', 'Rule, Date parser');
    const [t, c] = await Promise.all([tip.boundingBox(), date.boundingBox()]);
    expect(c!.y - (t!.y + t!.height)).toBeGreaterThan(30); // above the value chip
    await page.locator('section', { hasText: 'On a block' }).first().screenshot({ path: capture(`provenance-tooltip-${colorway}`) });
    await page.mouse.move(0, 0);
    await expect(tip).toHaveCount(0);
    // Keyboard: focus the Jev measurement.
    await block.locator('.mu-cue[data-kind="measurement"]').focus();
    await expect(page.locator('.mu-provenance', { hasText: '0.82' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mu-provenance', { hasText: '0.82' })).toHaveCount(0);
  });
}
