import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Toast: the result of your own action, one at a time, with Undo that undoes.
for (const colorway of COLORWAYS) {
  test(`act, see the result, undo it in ${colorway}`, async ({ page }) => {
    await open(page, '/components/toast', colorway);
    await page.getByRole('button', { name: 'Move 3 blocks' }).click();
    const toast = page.locator('.mu-toast');
    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText('Moved 3 blocks');
    await toast.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    await page.screenshot({ path: capture(`toast-${colorway}`), clip: { x: 340, y: 700, width: 600, height: 180 } });
    // One at a time: the next result replaces it.
    await page.getByRole('button', { name: 'Pin a lens' }).click();
    await expect(page.locator('.mu-toast').filter({ hasText: 'Pinned as a live region' })).toBeVisible();
    await page.getByRole('button', { name: 'Correct a cue' }).click();
    await page.locator('.mu-toast').filter({ hasText: 'Correction remembered' }).getByRole('button', { name: /Undo/ }).click();
    await expect(page.getByText('Correction forgotten')).toBeVisible();
  });
}
