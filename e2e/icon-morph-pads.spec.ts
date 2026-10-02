import { expect, test } from '@playwright/test';
import { COLORWAYS, capture, open } from './helpers';

for (const colorway of COLORWAYS) {
  test(`composer glyphs morph from send to stop in ${colorway}`, async ({ page }) => {
    await open(page, '/icons#morph', colorway);
    const choices = page.getByRole('radiogroup', { name: 'Icon', exact: true });
    await choices.getByRole('radio', { name: 'Send', exact: true }).click();
    const glyph = page.locator('button[aria-label$="morph to the next icon"] svg');
    await expect(glyph).toHaveAttribute('data-glyph', 'send');
    await page.waitForTimeout(550);
    const start = await glyph.innerHTML();
    await choices.getByRole('radio', { name: 'Stop', exact: true }).click();
    await expect(glyph).toHaveAttribute('data-glyph', 'stop');
    const frames = await glyph.evaluate(async (el) => {
      const frames: string[] = [];
      const until = performance.now() + 550;
      while (performance.now() < until) {
        await new Promise(requestAnimationFrame);
        frames.push(el.innerHTML);
      }
      return frames;
    });
    const end = frames.at(-1)!;
    expect(end).not.toBe(start);
    expect(frames.some(frame => frame !== start && frame !== end)).toBe(true);
    await glyph.screenshot({ path: capture(`icon-stop-morph-${colorway}`) });
  });
}

test('the brightness control is a complete static morph choice under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, '/icons#morph', 'graphite');
  await page.getByRole('radiogroup', { name: 'Icon', exact: true }).getByRole('radio', { name: 'Brightness', exact: true }).click();
  const glyph = page.locator('button[aria-label$="morph to the next icon"] svg');
  await expect(glyph).toHaveAttribute('data-glyph', 'brightness');
  const rest = await glyph.innerHTML();
  await page.waitForTimeout(150);
  expect(await glyph.innerHTML()).toBe(rest);
  await glyph.screenshot({ path: capture('icon-brightness-morph-reduced') });
});
