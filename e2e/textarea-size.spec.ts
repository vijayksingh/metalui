import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Textarea uses form type and per-instance counting on ${colorway}`, async ({ page }) => {
    await open(page, '/components/textarea#sizes', colorway);
    const host = page.getByTestId('textarea-sizes');
    const field = host.getByRole('textbox', { name: 'Profile name' });
    const bio = host.getByRole('textbox', { name: 'Profile bio' });
    const compact = host.getByRole('textbox', { name: 'Scoped compact note' });
    const prose = host.getByRole('textbox', { name: 'Long prose' });
    expect(await bio.evaluate(el => getComputedStyle(el).font)).toBe(await field.evaluate(el => getComputedStyle(el).font));
    expect(await compact.evaluate(el => getComputedStyle(el).font)).toBe(await field.evaluate(el => getComputedStyle(el).font));
    await expect(host.locator('.mu-textarea-count-row').nth(0)).toHaveAttribute('data-shown', '');
    await expect(bio).toHaveAttribute('aria-describedby', /.+/);
    await compact.fill('123456789');
    await expect(host.locator('.mu-textarea-count-row').nth(1)).not.toHaveAttribute('data-shown');
    await compact.fill('1234567890');
    await expect(host.locator('.mu-textarea-count-row').nth(1)).toHaveAttribute('data-shown', '');
    await prose.fill('x'.repeat(39));
    await expect(host.locator('.mu-textarea-count-row').nth(2)).not.toHaveAttribute('data-shown');
    await prose.fill('x'.repeat(40));
    await expect(host.locator('.mu-textarea-count-row').nth(2)).toHaveAttribute('data-shown', '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await bio.fill('a\nb\nc\nd');
    await expect.poll(() => bio.evaluate(el => el.getBoundingClientRect().height)).toBe(4 * 16 + 22);
    await host.screenshot({ path: capture(`textarea-sizes-${colorway}`) });
  });
}
