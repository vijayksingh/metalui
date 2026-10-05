import { expect, test } from '@playwright/test';
import { open } from './helpers';

test('a host result plays the authored act once without a synthetic click', async ({ page }) => {
  await open(page, '/icons/guide', 'bone');
  const icon = page.getByTestId('demand-icon');
  const trigger = page.getByRole('button', { name: 'Play result', exact: true });
  await expect(icon).not.toHaveAttribute('data-playing', '');
  await trigger.click();
  await expect(icon).toHaveAttribute('data-playing', '');
  await trigger.click();
  await expect(icon).not.toHaveAttribute('data-playing', '', { timeout: 4000 });
  await trigger.click();
  await expect(icon).toHaveAttribute('data-playing', '');
});

test('on-demand results respect both live motion switches', async ({ page }) => {
  await open(page, '/icons/guide', 'graphite');
  const icon = page.getByTestId('demand-icon');
  const trigger = page.getByRole('button', { name: 'Play result', exact: true });
  await trigger.click();
  await expect(icon).toHaveAttribute('data-playing', '');
  await page.evaluate(() => document.documentElement.classList.add('rm'));
  await expect(icon).not.toHaveAttribute('data-playing', '');
  await trigger.click();
  await expect(icon).not.toHaveAttribute('data-playing', '');
  await page.evaluate(() => document.documentElement.classList.remove('rm'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  await expect(icon).not.toHaveAttribute('data-playing', '');
});
