import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Memory scrubber and past banner: drag or step back in time, the banner names the moment, NOW and ⎋ return.
for (const colorway of COLORWAYS) {
  test(`step back in time and return in ${colorway}`, async ({ page }) => {
    await open(page, '/components/memory-scrubber', colorway);
    const knob = page.getByRole('slider', { name: 'Scrub through time' });
    await expect(knob).toHaveAttribute('aria-valuetext', 'Now');
    await knob.focus();
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(knob).not.toHaveAttribute('aria-valuetext', 'Now');
    const now = page.getByRole('button', { name: 'NOW' });
    await expect(now).toBeVisible();
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`memory-scrubber-${colorway}`) });
    await now.click();
    await expect(knob).toHaveAttribute('aria-valuetext', 'Now');
    await expect(now).toHaveCount(0);
  });

  test(`the past banner names the moment and brings you back in ${colorway}`, async ({ page }) => {
    await open(page, '/components/past-banner', colorway);
    const banner = page.getByRole('status').filter({ hasText: 'Back to Now' });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/MEMORY/i);
    await page.locator('section', { hasText: 'With the scrubber' }).first().screenshot({ path: capture(`past-banner-${colorway}`) });
    await banner.getByRole('button', { name: /Back to Now/ }).click();
    await expect(banner).toHaveCount(0);
    const knob = page.getByRole('slider', { name: 'Scrub through time' });
    await knob.focus();
    // An hour back from now is inside the snap to now; a day back is the past.
    await page.keyboard.press('Shift+ArrowLeft');
    await expect(page.getByRole('status').filter({ hasText: 'Back to Now' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('status').filter({ hasText: 'Back to Now' })).toHaveCount(0);
  });
}
