import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Empty state: when the last file leaves, the empty state rises in and says how to start; its action
// brings the files back; a compact one is a single line.
const place = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Region files' });

for (const colorway of COLORWAYS) {
  test(`arrives when the place empties, and starts it again, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/empty-state', colorway);
    for (const name of ['Tram map.pdf', 'Receipt.png', 'Itinerary.docx']) await place(page).getByRole('button', { name: `Remove ${name}` }).click();
    const empty = place(page).getByRole('status');
    await expect(empty).toContainText('No files in this region');
    await expect(empty).toContainText('Drop files onto the region');
    expect(await empty.evaluate((el) => getComputedStyle(el).animationName)).toBe('mu-empty-state-arrive');
    await page.waitForTimeout(600);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`empty-state-${colorway}`) });
    const attach = empty.getByRole('button', { name: 'Attach files' });
    await expect(attach.locator('svg.mu-ic-attach')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await attach.hover();
    await expect(attach.locator('[data-playing]')).toHaveCount(0);
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`empty-state-${colorway}-reduced`) });
    await attach.click();
    await expect(place(page).getByRole('group')).toHaveCount(3);
    await expect(page.getByRole('status').filter({ hasText: 'No comments' })).toContainText('No comments');
  });
}
