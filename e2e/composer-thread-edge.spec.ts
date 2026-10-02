import { expect, test } from '@playwright/test';
import { COLORWAYS, open, capture } from './helpers';

for (const colorway of COLORWAYS) {
  test(`Composer fade starts below its fixed title on ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/blocks/ai-composer', colorway);
    const block = page.getByRole('region', { name: 'Assistant', exact: true }).first();
    const viewport = block.locator('.mu-scroll-area-viewport');
    const header = block.locator(':scope > header');
    const space = async () => {
      const h = (await header.boundingBox())!, v = (await viewport.boundingBox())!;
      return v.y - h.y - h.height;
    };
    await expect.poll(space).toBe(12);
    await viewport.evaluate(el => { el.scrollTop = 0; });
    const first = block.getByRole('log').getByRole('article').first();
    await expect.poll(async () => {
      const v = (await viewport.boundingBox())!, f = (await first.boundingBox())!;
      return f.y - v.y;
    }).toBe(12);
    await expect(first).toBeVisible();
    await block.screenshot({ path: capture(`composer-thread-edge-${colorway}`) });
    await viewport.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect.poll(space).toBe(12);
    await expect(block.getByRole('heading', { name: 'Assistant', exact: true })).toBeVisible();
  });
}
