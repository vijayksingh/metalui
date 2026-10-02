import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// Tooltip: after 120 ms a control names itself and its key; within a group the next one shows at once;
// keyboard focus shows it too; it never takes the pointer.
for (const colorway of COLORWAYS) {
  test(`first Escape dismisses a panel around a tooltip in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/tooltip#escape', colorway);
    const trigger = page.getByRole('button', { name: 'Open hint panel' });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Hint panel' });
    await expect(panel).toBeVisible();
    await panel.focus();
    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Pin note' })).toBeFocused();
    await expect(page.locator('.mu-tooltip').filter({ hasText: 'Pin this note' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`hover, glide and focus in ${colorway}`, async ({ page }) => {
    await open(page, '/components/tooltip', colorway);
    // the playground's tooltips, not the x-ray's specimen (a real tooltip held open in its card)
    const tip = page.locator('.mu-tooltip:not([class*="ed-tip"])');
    const play = page.locator('section', { hasText: 'Playground' }).first();
    // It waits its delay before naming the control: timed in the page, from the pointer arriving to
    // the tip appearing, so a slow machine can only make the wait longer, never fail it.
    const select = play.getByRole('button', { name: 'Select', exact: true });
    await select.evaluate((el) => {
      const w = window as unknown as { tipWait: number | null };
      w.tipWait = null;
      let arrived = 0;
      el.addEventListener('pointerenter', () => { arrived = performance.now(); }, { once: true });
      const seen = new MutationObserver(() => {
        if (arrived && document.querySelector('.mu-tooltip:not([class*="ed-tip"])')) { w.tipWait = performance.now() - arrived; seen.disconnect(); }
      });
      seen.observe(document.body, { childList: true, subtree: true });
    });
    await expect(tip).toHaveCount(0);
    await select.hover();
    await expect.poll(() => page.evaluate(() => (window as unknown as { tipWait: number | null }).tipWait)).not.toBeNull();
    const delay = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mu-tooltip-delay-ms')) || 120);
    expect(await page.evaluate(() => (window as unknown as { tipWait: number }).tipWait)).toBeGreaterThanOrEqual(delay - 16);
    await expect(tip).toHaveText('Select · V');
    await expect(tip.locator('.mu-tooltip-key')).toHaveText(' · V');
    expect(await tip.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    await play.getByRole('button', { name: 'Region', exact: true }).hover();
    await page.waitForTimeout(30);
    await expect(tip).toHaveText('Region · R');
    await page.locator('section', { hasText: 'Playground' }).first().screenshot({ path: capture(`tooltip-${colorway}`) });
    await page.mouse.move(0, 0);
    await expect(tip).toHaveCount(0);
    await page.getByRole('button', { name: 'Close', exact: true }).focus();
    await expect(tip).toHaveText('Close · ⎋');
  });
}
