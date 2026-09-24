import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

const opacity = (l: import('@playwright/test').Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity));

// Hover engraving: a pass shows nothing, a 420 ms dwell shows it beside the first line, selection hides it.
for (const colorway of COLORWAYS) {
  test(`dwell, not a pass, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/hover-engraving', colorway);
    const list = page.getByTestId('eng-list');
    const block = list.locator('[data-block="0"]');
    const eng = block.locator('.mu-engraving');
    // A pass: hover for 200 ms, leave; it never showed.
    await block.hover();
    await page.waitForTimeout(200);
    expect(await opacity(eng)).toBe(0);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    expect(await opacity(eng)).toBe(0);
    // A dwell: it shows after 420 ms.
    await block.hover();
    await page.waitForTimeout(1000);
    expect(await opacity(eng)).toBeGreaterThan(0.99);
    // Beside the first line: it never covers the block below.
    const [e, next] = await Promise.all([eng.boundingBox(), list.locator('[data-block="1"] .type-content').boundingBox()]);
    expect(e!.x).toBeGreaterThan((await block.locator('.type-content').boundingBox())!.x + 10);
    expect(e!.y + e!.height <= next!.y || e!.x > next!.x + next!.width).toBeTruthy();
    await page.locator('section', { hasText: 'A stacked list' }).first().screenshot({ path: capture(`hover-engraving-${colorway}`) });
    // The block is described by its engraving.
    await expect(block).toHaveAttribute('aria-describedby', 'eng-0');
    await expect(page.locator('#eng-0')).toHaveAttribute('role', 'note');
  });
}
