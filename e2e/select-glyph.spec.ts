import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`the Select shares its state direction and selected tick in ${colorway}`, async ({ page }) => {
    await open(page, '/components/select', colorway);
    const trigger = page.getByRole('combobox', { name: 'Icon', exact: true });
    const chevron = trigger.locator('.mu-select-chevron');
    await expect(chevron).toHaveAttribute('data-glyph', 'chevron');
    const closed = await chevron.innerHTML();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await page.waitForTimeout(500);
    expect(await chevron.innerHTML()).not.toBe(closed);
    await expect(list.getByRole('option', { name: 'Share', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(list.getByRole('option', { name: 'Share', exact: true }).locator('.mu-select-mark path')).toBeVisible();
    await expect(list.getByRole('option', { name: 'No icon', exact: true }).locator('.mu-select-mark path')).toBeHidden();
    await list.screenshot({ path: capture(`select-tick-${colorway}`) });
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(trigger).toContainText('Check');
    await expect(trigger).toBeFocused();
    await expect(list).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await chevron.innerHTML()).toBe(closed);
    await expect(page.getByRole('combobox', { name: 'Disabled', exact: true })).toBeDisabled();
  });
}

test('Select reduced motion keeps direction and selected mark complete and still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/components/select', 'graphite');
  const trigger = page.getByRole('combobox', { name: 'Icon', exact: true });
  await trigger.click();
  const list = page.getByRole('listbox');
  const chevron = trigger.locator('.mu-select-chevron');
  const selected = list.getByRole('option', { name: 'Share', exact: true }).locator('.mu-select-mark');
  await expect(selected.locator('path')).toBeVisible();
  const frame = { direction: await chevron.innerHTML(), mark: await selected.innerHTML() };
  await page.waitForTimeout(160);
  expect(await chevron.innerHTML()).toBe(frame.direction);
  expect(await selected.innerHTML()).toBe(frame.mark);
  await list.screenshot({ path: capture('select-tick-reduced') });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
