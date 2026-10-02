import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Menu and the correction popover: right-click a cue, the heading says where it came from, a correction
// lets the cue go with Undo in a toast; a trigger menu works by keyboard and closes back to its trigger.
for (const colorway of COLORWAYS) {
  test(`correct a cue, then use a menu by keyboard in ${colorway}`, async ({ page }) => {
    await open(page, '/components/menu', colorway);
    const line = page.getByTestId('corrections');
    await line.locator('.mu-cue[data-kind="date"]').click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toContainText('Date · rule · date parser');
    await expect(menu.getByRole('menuitem', { name: 'Gather Similar' }).locator('svg.mu-ic-layout')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: 'Reset Corrections' })).toHaveAttribute('aria-disabled', 'true');
    await menu.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await menu.screenshot({ path: capture(`menu-correction-${colorway}`) });
    await menu.getByRole('menuitem', { name: 'Ignore “tomorrow 4pm”' }).click();
    await expect(menu).toHaveCount(0);
    await expect(line.locator('.mu-cue[data-kind="date"]')).toHaveCount(0);
    const toast = page.locator('.mu-toast').filter({ hasText: 'Correction remembered' });
    await toast.getByRole('button', { name: /Undo/ }).click();
    await expect(line.locator('.mu-cue[data-kind="date"]')).toHaveCount(1);

    const more = page.getByRole('button', { name: 'More' });
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /Duplicate/ })).toHaveAttribute('data-highlighted', '');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('last chosen · Pin')).toBeVisible();
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /Delete/ })).toHaveCSS('color', 'rgb(216, 69, 59)');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(more).toBeFocused();
  });
}

for (const colorway of COLORWAYS) {
  test(`menu settings share the pen, mixed state and keyboard in ${colorway}`, async ({ page }) => {
    await open(page, '/components/menu#check-items', colorway);
    const trigger = page.getByRole('button', { name: 'View settings' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    const guides = menu.getByRole('menuitemcheckbox', { name: 'Show guides' });
    const all = menu.getByRole('menuitemcheckbox', { name: 'Select all layers' });
    const disabled = menu.getByRole('menuitemcheckbox', { name: 'Keep proportions' });
    await expect(all).toHaveAttribute('aria-checked', 'mixed');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(guides).toHaveAttribute('data-highlighted', '');
    await page.keyboard.press('Enter');
    await expect(guides).toHaveAttribute('aria-checked', 'true');
    await expect(menu).toBeVisible();
    await expect.poll(async () => guides.locator('path').evaluate(el => el.style.strokeDasharray)).toBe('');
    const drawn = await guides.locator('path').getAttribute('d');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(all).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => all.locator('path').getAttribute('d')).toBe(drawn);
    await page.keyboard.press('ArrowDown');
    await expect(disabled).toHaveAttribute('data-highlighted', '');
    await page.keyboard.press('Enter');
    await expect(disabled).toHaveAttribute('aria-checked', 'true');
    await menu.screenshot({ path: capture(`menu-settings-${colorway}`) });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trigger.click();
    await guides.click();
    await expect(guides).toHaveAttribute('aria-checked', 'false');
    await expect(guides.locator('path')).toHaveAttribute('visibility', 'hidden');
    await expect.poll(async () => guides.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await menu.screenshot({ path: capture(`menu-settings-${colorway}-reduced`) });
  });
}
