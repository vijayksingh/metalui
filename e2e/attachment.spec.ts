import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Attachment: a new file lands and uploads to done; a failed one says why and retries; a removed one
// leaves before it goes.
const tray = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Attachments', exact: true });

for (const colorway of COLORWAYS) {
  test(`attaches, uploads, fails and retries, removes, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/attachment', colorway);
    const long = tray(page).getByRole('group', { name: /^Tram map of Lisbon/ });
    await expect(long).toContainText('.pdf');
    await expect(long).toContainText('2.5 MB');
    const failed = tray(page).getByRole('group', { name: 'Hotel booking.pdf' });
    await expect(failed.getByRole('alert')).toHaveAccessibleName('Too large, 25 MB at most');
    await expect(failed.getByRole('button', { name: 'Try again' }).locator('svg.mu-ic-retry')).toHaveCount(1);

    await tray(page).getByRole('button', { name: 'Attach a file' }).click();
    const added = tray(page).getByRole('group').last();
    await expect(added.getByRole('progressbar')).toBeVisible();
    await expect(added.locator('svg[data-glyph=upload]')).toHaveCount(1);
    await expect(added).toHaveClass(/attachment-land/);
    await expect(added.getByRole('progressbar')).toBeHidden({ timeout: 5000 });
    await expect(added.getByRole('status')).toHaveAccessibleName(/Uploaded/);
    await expect(added.locator('svg[data-glyph=check]')).toHaveCount(1);
    await page.waitForTimeout(300);
    await tray(page).screenshot({ path: capture(`attachment-${colorway}`) });

    await failed.getByRole('button', { name: 'Try again' }).click();
    await expect(failed.getByRole('alert')).toHaveCount(0);
    await expect(failed.getByRole('progressbar')).toBeVisible();

    await long.getByRole('button', { name: /^Remove Tram map/ }).click();
    await expect(long).toHaveAttribute('data-leaving', '');
    await expect(long).toHaveCount(0);
  });

  test(`host widths, error layout and scoped removal in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/attachment#width', colorway);
    const wide = page.getByRole('region', { name: 'Wide attachments', exact: true });
    const narrow = page.getByRole('region', { name: 'Narrow attachments', exact: true });
    const wideRow = wide.getByRole('group', { name: /^Tram map/ });
    const host = (await wide.boundingBox())!;
    const plate = (await wideRow.boundingBox())!;
    expect(plate.width).toBeGreaterThan(360);
    expect(plate.width).toBeCloseTo(host.width, 0);
    const failed = narrow.getByRole('group', { name: 'Hotel booking.pdf' });
    const error = (await failed.getByRole('alert').boundingBox())!;
    const retry = (await failed.getByRole('button', { name: 'Try again' }).boundingBox())!;
    expect(retry.y).toBeGreaterThanOrEqual(error.y + error.height);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await narrow.evaluate((el) => el.setAttribute('data-mu-motion', 'reduce'));
    await failed.getByRole('button', { name: 'Remove Hotel booking.pdf' }).click();
    await expect(failed).toHaveCount(0);
    await expect(narrow.getByRole('status')).toHaveText('1 files · 1 leave starts');
    await page.setViewportSize({ width: 375, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await narrow.screenshot({ path: capture(`attachment-narrow-${colorway}`) });
  });
}

for (const colorway of COLORWAYS) {
  test(`delivery is explicit and retry waits for its host in ${colorway}`, async ({ page }) => {
    await open(page, '/components/attachment#receipt', colorway);
    const host = page.getByTestId('attachment-receipt');
    const file = host.getByRole('group', { name: 'Proof.pdf' });
    const choose = async (name: string) => {
      await host.getByRole('combobox', { name: 'Upload receipt' }).click();
      await page.getByRole('option', { name, exact: true }).click();
    };
    await expect(file.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
    await choose('Clear progress');
    await expect(file.getByRole('progressbar')).toHaveCount(0);
    await expect(file.getByRole('status')).toHaveCount(0);
    await expect(file.locator('svg[data-glyph=document]')).toHaveCount(1);
    await choose('Failed');
    await expect(file.getByRole('alert')).toHaveAccessibleName('Connection lost; the file is still here');
    await expect(file.locator('svg[data-glyph=sync-error]')).toHaveCount(1);
    await file.getByRole('button', { name: 'Try again' }).click();
    await expect(file.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await expect(file.locator('svg[data-glyph=upload]')).toHaveCount(1);
    await expect(file.getByRole('status')).toHaveCount(0);
    await choose('Delivered');
    await expect(file.getByRole('status')).toHaveAccessibleName('Uploaded · 240 KB');
    await expect(file.locator('svg[data-glyph=check]')).toHaveCount(1);
    await page.waitForTimeout(1000);
    await host.screenshot({ path: capture(`attachment-result-${colorway}`) });
    await choose('Failed');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await choose('Delivered');
    await expect(file.getByRole('status')).toHaveAccessibleName('Uploaded · 240 KB');
    await expect.poll(() => file.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await host.screenshot({ path: capture(`attachment-result-${colorway}-reduced`) });
    await choose('Clear progress');
    await expect(file.getByRole('status')).toHaveCount(0);
    await expect(file.locator('svg[data-glyph=document]')).toHaveCount(1);
  });
}
