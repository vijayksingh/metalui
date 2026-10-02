import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`selection, open detail and completion coexist in ${colorway} ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await open(page, '/components/row', colorway);
    const handled = page.getByTestId('handled-row');
    const row = handled.getByRole('listitem');
    const select = handled.getByRole('checkbox', { name: 'Select Lisbon notes' });
    await select.focus();
    await page.keyboard.press('Space');
    await expect(row).toHaveAttribute('data-selected', '');
    await row.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    const plate = await row.evaluate(el => ({ image: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }));
    await row.hover();
    await row.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    expect(await row.evaluate(el => ({ image: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }))).toEqual(plate);
    const openDetails = handled.getByRole('button', { name: 'Open details' });
    await openDetails.click();
    await expect(row).toHaveAttribute('data-opened', '');
    const rail = await row.evaluate(el => ({ width: getComputedStyle(el, '::before').width, background: getComputedStyle(el, '::before').backgroundColor }));
    expect(parseFloat(rail.width)).toBeGreaterThan(0);
    expect(rail.background).not.toBe('rgba(0, 0, 0, 0)');
    const complete = handled.getByRole('checkbox', { name: 'Complete Lisbon notes' });
    await complete.focus();
    await page.keyboard.press('Space');
    await expect(row).toHaveAttribute('data-checked', '');
    await expect(row.locator('.mu-row-text')).toHaveCSS('text-decoration-line', 'line-through');
    await expect(row).toHaveAttribute('data-selected', '');
    await expect(row).toHaveAttribute('data-opened', '');
    await handled.screenshot({ path: capture(`row-states-${colorway}-${reducedMotion}`) });
    await handled.getByRole('button', { name: 'Close details' }).click();
    await expect(row).not.toHaveAttribute('data-opened', '');
    await expect(row).toHaveAttribute('data-selected', '');
    await select.click();
    await expect(row).not.toHaveAttribute('data-selected', '');
    await expect(row).toHaveAttribute('data-checked', '');
  });
}
