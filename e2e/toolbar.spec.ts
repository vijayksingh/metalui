import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Toolbar: pick a tool (it latches with its LED), each tool names itself and its key, arrows move along.
for (const colorway of COLORWAYS) {
  test(`pick a tool and read its tooltip in ${colorway}`, async ({ page }) => {
    await open(page, '/components/toolbar', colorway);
    const strip = page.getByRole('toolbar', { name: 'Tools' }).first();
    const write = strip.getByRole('button', { name: 'Write', exact: true });
    await write.click();
    await expect(write).toHaveAttribute('aria-pressed', 'true');
    await expect(strip.getByRole('button', { name: 'Select', exact: true })).toHaveAttribute('aria-pressed', 'false');
    const led = await write.evaluate((el) => getComputedStyle(el, '::after').content);
    expect(led).not.toBe('none');
    await page.mouse.move(0, 0);
    await strip.getByRole('button', { name: 'Region', exact: true }).hover();
    await expect(page.locator('.mu-tooltip')).toHaveText('Region · R');
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`toolbar-${colorway}`) });
    await write.focus();
    await page.keyboard.press('ArrowRight');
    await expect(strip.getByRole('button', { name: 'Region', exact: true })).toBeFocused();
  });
}
