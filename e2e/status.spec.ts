import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

// LEDs, status badges and keycaps: the state is in words for assistive tech, and a key speaks its name.
for (const colorway of COLORWAYS) {
  test(`status and keys read as words in ${colorway}`, async ({ page }) => {
    await open(page, '/components/status', colorway);
    const badges = page.getByRole('status');
    expect(await badges.count()).toBeGreaterThan(0);
    await expect(badges.first()).not.toHaveText('');
    await page.locator('section', { hasText: 'LEDs and badges' }).first().screenshot({ path: capture(`status-${colorway}`) });
    await open(page, '/components/kbd', colorway);
    await expect(page.locator('kbd[aria-label="Command K"]').first()).toBeVisible();
    await page.locator('section', { hasText: 'Where keys sit' }).first().screenshot({ path: capture(`kbd-${colorway}`) });
  });
}

for (const colorway of COLORWAYS) {
  test(`status materials keep words and lamps readable on real grounds in ${colorway}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/components/status', colorway);
    const states = page.getByTestId('status-states');
    await expect(states.getByRole('status')).toHaveText(['Sync live', 'Sync waiting', 'Sync failed', 'Sync linked', 'Sync off']);
    const word = states.getByRole('status').first();
    await expect(word).toHaveCSS('font-size', '12px');
    await expect(word).toHaveCSS('font-weight', '500');
    expect(await word.evaluate(e => getComputedStyle(e).fontFamily)).not.toMatch(/mono|Courier/i);
    await expect(word).not.toHaveAttribute('tabindex');
    const image = page.getByTestId('status-image');
    const translucent = image.getByRole('status').filter({ hasText: 'Transparent' });
    const frost = image.getByRole('status').filter({ hasText: /^Frosted/ });
    const solid = image.getByRole('status').filter({ hasText: 'Solid override' });
    await expect(translucent).toHaveCSS('backdrop-filter', 'none');
    await expect(frost).toHaveCSS('backdrop-filter', 'blur(22px) saturate(1.6)');
    await expect(solid).toHaveAttribute('data-surface', 'solid');
    await expect(solid).toHaveCSS('backdrop-filter', 'none');
    const quiet = page.getByTestId('status-frost-parent').getByRole('status').filter({ hasText: /^Quiet/ });
    await expect(quiet).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(quiet).toHaveCSS('box-shadow', 'none');
    await expect(quiet).toHaveCSS('padding-left', '0px');
    const strong = page.getByTestId('status-frost-parent').getByRole('status').filter({ hasText: /^Strong/ });
    await expect(strong.locator('.status-strong-tint')).toBeVisible();
    await page.getByTestId('status-surfaces').screenshot({ path: capture(`status-surfaces-${colorway}`) });
    await page.getByRole('switch', { name: 'Reduce transparency' }).click();
    await expect(frost).toHaveCSS('backdrop-filter', 'none');
    await expect(frost).toHaveCSS('background-color', colorway === 'bone' ? 'rgb(244, 243, 240)' : 'rgb(37, 37, 40)');
    await expect(translucent).toHaveCSS('background-color', colorway === 'bone' ? 'rgb(244, 243, 240)' : 'rgb(37, 37, 40)');
    await page.getByTestId('status-surfaces').screenshot({ path: capture(`status-opaque-${colorway}`) });
    await page.getByTestId('status-surfaces').evaluate(e => { e.removeAttribute('data-mu-transparency'); e.setAttribute('data-mu-power', 'low'); });
    await expect(frost).toHaveCSS('backdrop-filter', 'none');
  });
}

test('state changes play one failure gesture, retain words under motion and color-vision alternatives, and expose the fixing hint', async ({ page }) => {
  await open(page, '/components/status', 'bone');
  const state = page.getByRole('combobox', { name: 'Sync state' });
  await state.click(); await page.getByRole('option', { name: 'Sync waiting', exact: true }).click();
  const badge = page.getByTestId('status-ground').getByRole('status');
  await expect(badge).toHaveText('Sync waiting');
  await expect(badge.locator('.mu-led')).toHaveAttribute('data-gesture', 'breathe');
  await state.click(); await page.getByRole('option', { name: 'Sync failed', exact: true }).click();
  await expect(badge).toHaveText('Sync failed');
  await expect(badge.locator('.mu-led')).toHaveAttribute('data-gesture', 'blink2');
  await page.waitForTimeout(500);
  expect(await badge.locator('[data-lamp]').evaluate(e => e.getAnimations()[0]?.playState)).toBe('finished');
  await page.keyboard.press('Tab'); await badge.focus(); await expect(page.locator('.mu-tooltip')).toHaveText('Check the connection, then retry sync.');
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await expect.poll(() => badge.locator('[data-lamp]').evaluate(e => e.getAnimations().length)).toBe(0);
  await expect(badge).toHaveText('Sync failed');
  for (const vision of ['deuteranopia', 'protanopia']) {
    await page.getByRole('combobox', { name: 'Color vision preview' }).click();
    await page.getByRole('option', { name: vision, exact: true }).click();
    await expect(page.getByTestId('status-proof')).toHaveAttribute('data-vision', vision);
    await page.getByTestId('status-proof').screenshot({ path: capture(`status-${vision}`) });
    await expect(badge).toHaveText('Sync failed');
  }
});
