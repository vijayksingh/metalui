import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Card: a linked card is one link covering the card, lifts on hover and comes down on press; its
// actions stay separate buttons; a card without a link never moves; a chosen card is marked.
const play = (page: import('@playwright/test').Page) => page.locator('section', { hasText: 'Playground' }).first();
const lift = (el: import('@playwright/test').Locator) => el.evaluate((e) => { const t = getComputedStyle(e).translate; return t === 'none' ? 0 : parseFloat(t.split(' ')[1] ?? '0'); });

for (const colorway of COLORWAYS) {
  test(`links, lifts, keeps actions separate, and stays still without a link, in ${colorway}`, async ({ page }) => {
    await open(page, '/components/card', colorway);
    const lisbon = play(page).getByRole('article').filter({ hasText: 'Trip to Lisbon' });
    await expect(lisbon.getByRole('link')).toHaveCount(1);
    await expect(lisbon.getByRole('link', { name: 'Trip to Lisbon' })).toHaveAttribute('href', '#lisbon');
    await expect(lisbon).toHaveAttribute('aria-current', 'true');
    const share = lisbon.getByRole('button', { name: 'Share' });
    await expect(share.locator('svg.mu-ic-share')).toHaveCount(1);
    await share.click();
    await expect(page.getByText('Shared Lisbon', { exact: true })).toBeVisible();
    await expect(lisbon.getByRole('link')).toHaveAttribute('href', '#lisbon');

    // The whole card is the link's hit area: the point under the description is the link.
    const hit = await lisbon.getByText('14 notes, 3 photos, a tram map.').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a')?.getAttribute('href') ?? null;
    });
    expect(hit).toBe('#lisbon');

    const porto = play(page).getByRole('article').filter({ hasText: 'Weekend in Porto' });
    // Actions sit above the stretched link.
    const onButton = await porto.getByRole('button', { name: 'Choose' }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('button') === el;
    });
    expect(onButton).toBe(true);
    await porto.getByRole('button', { name: 'Choose' }).click();
    await expect(porto).toHaveAttribute('aria-current', 'true');

    await porto.hover();
    await expect.poll(() => lift(porto)).toBeLessThan(-3);
    const still = play(page).getByRole('article').filter({ hasText: 'Packing list' });
    await still.hover();
    await page.waitForTimeout(500);
    expect(await lift(still)).toBe(0);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await play(page).screenshot({ path: capture(`card-${colorway}`) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await share.click();
    await expect(share.locator('[data-playing]')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await play(page).screenshot({ path: capture(`card-${colorway}-reduced`) });
  });
}

test('focus on the title link rings the whole card', async ({ page }) => {
  await open(page, '/components/card', 'bone');
  const lisbon = play(page).getByRole('article').filter({ hasText: 'Trip to Lisbon' });
  await lisbon.getByRole('link').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(lisbon).toHaveCSS('outline-style', 'solid');
});
