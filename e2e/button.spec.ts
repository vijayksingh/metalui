import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Button: 32 by default, compact 28 with the smaller type; a press sinks it one point.
for (const colorway of COLORWAYS) {
  test(`default and compact buttons in ${colorway}`, async ({ page }) => {
    await open(page, '/components/button', colorway);
    const compact = page.getByTestId('compact');
    const seed = compact.getByRole('button', { name: 'seed a sample day' });
    expect((await seed.boundingBox())!.height).toBe(28);
    expect(await seed.evaluate((el) => getComputedStyle(el).fontSize)).toBe('12px');
    const cancel = page.getByRole('button', { name: 'Cancel' }).first();
    expect((await cancel.boundingBox())!.height).toBe(32);
    expect(await cancel.evaluate((el) => getComputedStyle(el).fontSize)).toBe('12.5px');
    await seed.scrollIntoViewIfNeeded();
    const box = (await seed.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(120);
    expect(await seed.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f)).toBe(1);
    await page.mouse.up();
    await expect(compact.getByRole('button', { name: 'Share' })).toBeDisabled();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    await page.locator('section', { hasText: 'Compact' }).first().screenshot({ path: capture(`button-compact-${colorway}`) });
  });
}
