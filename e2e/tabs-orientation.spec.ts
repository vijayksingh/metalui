import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`vertical Tabs explain disabled sections and enter their panel on ${colorway}`, async ({ page }) => {
    await open(page, '/components/tabs#vertical', colorway);
    const host = page.getByTestId('vertical-tabs');
    const list = host.getByRole('tablist', { name: 'Account sections' });
    await expect(list).toHaveAttribute('aria-orientation', 'vertical');
    const profile = list.getByRole('tab', { name: 'Profile' });
    await profile.focus();
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('tab', { name: 'Billing' })).toBeFocused();
    await expect(list.getByRole('tab', { name: 'Billing' })).toHaveAttribute('aria-disabled', 'true');
    await expect(host.getByRole('tabpanel')).toHaveAccessibleName('Profile');
    await page.keyboard.press('ArrowDown');
    await expect(list.getByRole('tab', { name: 'Notifications' })).toBeFocused();
    await expect(host.getByRole('tabpanel')).toHaveAccessibleName('Notifications');
    await page.keyboard.press('End');
    await expect(list.getByRole('tab', { name: 'Appearance' })).toBeFocused();
    const tab = list.getByRole('tab', { name: 'Appearance' });
    const thumb = list.locator('.mu-switcher-thumb');
    await expect.poll(async () => {
      const t = (await tab.boundingBox())!, b = (await thumb.boundingBox())!;
      return Math.abs(t.y - b.y) + Math.abs(t.height - b.height);
    }).toBeLessThan(1);
    await page.keyboard.press('Tab');
    await expect(host.getByRole('tabpanel')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(host.getByRole('textbox', { name: 'appearance setting' })).toBeFocused();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await tab.focus();
    await page.keyboard.press('Home');
    await expect(profile).toBeFocused();
    await expect(host.getByRole('tabpanel')).toHaveAccessibleName('Profile');
    await expect.poll(async () => {
      const t = (await profile.boundingBox())!, b = (await thumb.boundingBox())!;
      return Math.abs(t.y - b.y);
    }).toBeLessThan(1);
    await host.screenshot({ path: capture(`tabs-vertical-${colorway}`) });
    const horizontal = page.getByRole('tablist', { name: 'Settings', exact: true });
    await horizontal.getByRole('tab', { name: 'Canvas' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(horizontal.getByRole('tab', { name: 'Sync' })).toBeFocused();
  });
}
