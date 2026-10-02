import { expect, test, type Locator } from '@playwright/test';
import { COLORWAYS, open } from './helpers';

const runningLoops = (host: Locator) => host.evaluate(element => element.getAnimations({ subtree: true })
  .filter(animation => animation.playState === 'running' && animation.effect?.getComputedTiming().iterations === Infinity).length);

for (const colorway of COLORWAYS) {
  test(`historical change, away presence and weekly comparisons stay still in ${colorway}`, async ({ page }) => {
    await open(page, '/changelog', colorway);
    const headings = page.locator('main section .mu-led[data-kind="waiting"]');
    expect(await headings.count()).toBeGreaterThan(0);
    await headings.first().scrollIntoViewIfNeeded();
    await expect(headings.first()).toHaveAttribute('data-gesture', 'steady');
    for (const heading of await headings.all()) expect(await runningLoops(heading)).toBe(0);

    await open(page, '/components/avatar', colorway);
    const away = page.locator('main [role="img"][aria-label="Chen Wei, away"]');
    await expect(away).toHaveCount(3);
    for (const person of await away.all()) {
      await person.scrollIntoViewIfNeeded();
      await expect(person.locator('.mu-led')).toHaveAttribute('data-gesture', 'steady');
      expect(await runningLoops(person)).toBe(0);
    }

    await open(page, '/blocks/studio-week', colorway);
    const week = page.getByRole('region', { name: /^Lisbon Studio,/ });
    const comparisons = week.getByRole('radiogroup', { name: 'What the week shows' });
    expect(await comparisons.locator('.mu-led[data-kind="waiting"]').count()).toBeGreaterThan(0);
    await comparisons.scrollIntoViewIfNeeded();
    expect(await runningLoops(comparisons)).toBe(0);
    await week.getByRole('button', { name: 'Week before' }).click();
    await expect(week.getByRole('heading', { name: 'Last week' })).toBeVisible();
    expect(await runningLoops(comparisons)).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await runningLoops(comparisons)).toBe(0);
  });

  test(`asking engraving sleeps hidden and breathes only while presented in ${colorway}`, async ({ page }) => {
    await open(page, '/components/hover-engraving', colorway);
    const block = page.getByTestId('eng-list').locator('[data-block="2"]');
    const engraving = block.locator('.mu-engraving');
    await block.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(engraving).toHaveCSS('opacity', '0');
    expect(await runningLoops(engraving)).toBe(0);

    await block.hover();
    await expect(engraving).toHaveCSS('opacity', '1');
    await expect.poll(() => runningLoops(engraving)).toBe(1);
    await page.mouse.move(0, 0);
    await expect(engraving).toHaveCSS('opacity', '0');
    expect(await runningLoops(engraving)).toBe(0);

    const still = page.locator('.mu-engraving[data-open="true"]').filter({ hasText: 'ASKING…' });
    await still.scrollIntoViewIfNeeded();
    await expect(still).toHaveCSS('opacity', '1');
    await expect.poll(() => runningLoops(still)).toBe(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => runningLoops(still)).toBe(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => runningLoops(still)).toBe(1);
  });

  test(`active asking and sync lamps stop when their pending state ends in ${colorway}`, async ({ page }) => {
    await open(page, '/components/lens-bar', colorway);
    const lens = page.getByRole('toolbar', { name: 'Filter: open tasks about the poster' });
    for (const panel of await page.locator('.dialkit-panel-inner[data-collapsed="true"]').all()) await panel.click();
    const source = page.locator('.dialkit-select-trigger', { has: page.locator('.dialkit-select-label', { hasText: /^source$/i }) });
    await source.click(); await page.locator('.dialkit-select-option', { hasText: /^asking$/i }).click();
    await lens.scrollIntoViewIfNeeded();
    await expect(lens).toContainText('ASKING…');
    await expect.poll(() => runningLoops(lens)).toBe(1);
    await source.click(); await page.locator('.dialkit-select-option', { hasText: /^model$/i }).click();
    await expect(lens).toContainText('VIA MODEL');
    await expect(lens.locator('.mu-led')).toHaveCount(0);
    expect(await runningLoops(lens)).toBe(0);

    await open(page, '/components/status', colorway);
    const state = page.getByRole('combobox', { name: 'Sync state' });
    const badge = page.getByTestId('status-ground').getByRole('status');
    await state.click(); await page.getByRole('option', { name: 'Sync waiting', exact: true }).click();
    await badge.scrollIntoViewIfNeeded();
    await expect(badge).toHaveText('Sync waiting');
    await expect.poll(() => runningLoops(badge)).toBe(1);
    await state.click(); await page.getByRole('option', { name: 'Sync live', exact: true }).click();
    await expect(badge).toHaveText('Sync live');
    expect(await runningLoops(badge)).toBe(0);
  });
}
