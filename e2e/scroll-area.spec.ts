import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Scroll area: the bar comes in while scrolling or with the pointer over the region, the thumb widens
// only when the bar itself is reached for, and edges fade only where there is more beyond them.
const area = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Notes', exact: true });
const fades = (vp: import('@playwright/test').Locator) =>
  vp.evaluate((el) => {
    const m = getComputedStyle(el).maskImage.match(/rgb\(0, 0, 0\) (\d+(?:\.\d+)?)px/);
    const end = getComputedStyle(el).maskImage.match(/calc\(100% - (\d+(?:\.\d+)?)px\)/);
    return { top: m ? parseFloat(m[1]) : 0, bottom: end ? parseFloat(end[1]) : 0 };
  });

for (const colorway of COLORWAYS) {
  test(`scrolls by wheel and keys, with the bar and fades, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/scroll-area', colorway);
    const vp = area(page);
    expect(await fades(vp)).toEqual({ top: 0, bottom: 20 });
    const box = (await vp.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => vp.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
    await expect.poll(async () => (await fades(vp)).top).toBe(20);
    const bar = page.locator('.mu-scroll-area-bar').first();
    await expect(bar).toHaveCSS('opacity', '1');
    const thumb = bar.locator('.mu-scroll-area-thumb');
    await expect.poll(async () => (await thumb.boundingBox())!.width).toBe(4);
    const b = (await bar.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await expect.poll(async () => (await thumb.boundingBox())!.width).toBe(8);
    await page.screenshot({ path: capture(`scroll-area-${colorway}`), clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 } });

    await vp.focus();
    await page.keyboard.press('End');
    await expect.poll(async () => (await fades(vp)).bottom).toBe(0);
  });
}

test('the bar leaves after the pointer does', async ({ page }) => {
  await open(page, '/components/scroll-area', 'bone');
  const vp = area(page);
  const box = (await vp.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  const bar = page.locator('.mu-scroll-area-bar').first();
  await expect(bar).toHaveCSS('opacity', '1');
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);
  expect(parseFloat(await bar.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
  await expect(bar).toHaveCSS('opacity', '0', { timeout: 2000 });
});

for (const colorway of COLORWAYS) {
  test(`viewport access and scroll events stay linked in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/scroll-area', colorway);
    const vp = page.getByRole('region', { name: 'Linked notes', exact: true });
    const offset = page.getByRole('status', { name: 'Scroll offset' });
    await expect(offset).toHaveText('0 px');

    await page.getByRole('button', { name: 'Last note', exact: true }).click();
    await expect.poll(async () => (await fades(vp)).bottom).toBe(0);
    await expect.poll(() => vp.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
    await expect.poll(async () => Number.parseInt((await offset.textContent())!) - await vp.evaluate((el) => Math.round(el.scrollTop))).toBe(0);

    await page.getByRole('button', { name: 'First note', exact: true }).click();
    await expect(offset).toHaveText('0 px');
    await expect.poll(async () => (await fades(vp)).top).toBe(0);

    await vp.focus();
    await page.keyboard.press('PageDown');
    await expect.poll(() => vp.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
    await expect.poll(async () => Number.parseInt((await offset.textContent())!) - await vp.evaluate((el) => Math.round(el.scrollTop))).toBe(0);

    const beforeWheel = await vp.evaluate((el) => el.scrollTop);
    const box = (await vp.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => vp.evaluate((el) => el.scrollTop)).toBeGreaterThan(beforeWheel);
    await expect.poll(async () => Number.parseInt((await offset.textContent())!) - await vp.evaluate((el) => Math.round(el.scrollTop))).toBe(0);
    await page.locator('#access').screenshot({ path: capture(`scroll-area-access-${colorway}-reduced`) });
  });
}
