import { expect, test } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`effective motion follows OS, site and scoped changes in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => localStorage.setItem('metalui:motion', 'on'));
    await open(page, '/foundations/motion', colorway);
    const bench = page.getByTestId('motion-preference');
    const policy = bench.getByRole('status', { name: 'Effective motion' });
    await expect(policy).toContainText('full motion');
    const local = bench.getByRole('button', { name: 'Reduce motion', exact: true });
    await local.click();
    await expect(policy).toContainText('reduced');
    await local.click();
    await expect(policy).toContainText('full motion');
    const site = page.getByRole('checkbox', { name: 'Motion (off = Reduce Motion)', exact: true });
    await site.uncheck();
    await expect(policy).toContainText('reduced');
    await site.check();
    await expect(policy).toContainText('full motion');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(policy).toContainText('system: reduce · reduced');
    await local.click();
    await local.click();
    await expect(policy).toContainText('reduced');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(policy).toContainText('full motion');
  });
}
